import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRecordStore} from '../record-store.mjs';
import {fieldChanges,hasPermission} from '../worker.mjs';
import {fixture,actor} from './fixtures/access-db.mjs';
const mod={exports:{}};vm.runInThisContext('(function(module){'+fs.readFileSync(new URL('../site/record-client.js',import.meta.url),'utf8')+'\n})')(mod);
const R=mod.exports;
const collections=R.collections;
const empty=()=>({epiFolders:[],epis:[],employees:[],movements:[],inspections:[],productCatalog:[],suggestionsAdded:[],version:1});
const store=createRecordStore({json:(body,status=200)=>new Response(JSON.stringify(body),{status}),hasPermission,fieldChanges,COLLECTIONS:collections});
async function setup(seed=empty()){
 const h=fixture();h.sql.prepare('UPDATE app_state SET data_json=?').run(JSON.stringify(seed));
 h.api=(user=actor)=>async(route,options={})=>{
  const url=new URL('http://localhost/'+route),body=options.body?JSON.parse(options.body):null;let response;
  if(route==='records/meta')response=await store.meta(h.DB);
  else if(url.pathname==='/records')response=await store.page(h.DB,user,url);
  else if(route==='records/change')response=await store.change(h.DB,user,actor,'Administrador',body);
  else if(route==='records/imports')response=await store.startImport(h.DB,user,actor,body);
  else if(route.endsWith('/chunks'))response=await store.importChunk(h.DB,user,actor,route.split('/')[2],body);
  else if(route.endsWith('/finish'))response=await store.finishImport(h.DB,user,actor,'Administrador',route.split('/')[2]);
  else throw Error('Rota desconhecida: '+route);
  const result=await response.json();if(!response.ok)throw Object.assign(Error(result.error),{status:response.status});return result;
 };
 await store.ensure(h.DB);return h;
}
test('migração transacional preserva conteúdo, ordem original, contas, metadados e cópia legada',async()=>{
 const seed=empty();seed.epis=[{id:'z',name:'Primeiro'},{id:'a',name:'Segundo'}];seed.suggestionsAdded=['fictício'];
 const h=await setup(seed);try{
  const client=R.create(h.api(),()=>true),loaded=await client.load();assert.deepEqual(loaded.data,seed);
  assert.equal(h.sql.prepare('SELECT data_json FROM app_state').get().data_json,JSON.stringify(seed));
  await store.ensure(h.DB);assert.equal(h.sql.prepare('SELECT COUNT(*) n FROM bc2_records').get().n,2);
  assert.equal(h.sql.prepare('SELECT COUNT(*) n FROM users').get().n,2);
  assert.throws(()=>h.sql.prepare('UPDATE app_state SET data_json=?').run('{}'),/recarregue/);
 }finally{h.close();}
});
test('migração inválida reverte todos os registros sem apagar a origem',async()=>{
 const h=fixture();try{
  const data={...empty(),epis:[{id:'repetido'},{id:'repetido'}]};h.sql.prepare('UPDATE app_state SET data_json=?').run(JSON.stringify(data));
  await assert.rejects(store.ensure(h.DB));assert.equal(h.sql.prepare('SELECT COUNT(*) n FROM bc2_records').get().n,0);
  assert.equal(h.sql.prepare('SELECT COUNT(*) n FROM bc2_store_meta').get().n,0);
  assert.equal(h.sql.prepare('SELECT data_json FROM app_state').get().data_json,JSON.stringify(data));
 }finally{h.close();}
});
test('duas pessoas editam registros diferentes sem sobrescrever o trabalho da outra',async()=>{
 const h=await setup({...empty(),epis:[{id:'a',name:'A'},{id:'b',name:'B'}]});try{
  const a=R.create(h.api(),()=>true),b=R.create(h.api(),()=>true);const sa=await a.load(),sb=await b.load();
  sa.data.epis[0].name='Novo A';await a.commit(a.plan(sa.data));sb.data.epis[1].name='Novo B';
  const result=await b.commit(b.plan(sb.data));assert(result.refreshRequired);
  const read=await a.load();assert.deepEqual(read.data.epis.map(r=>r.name),['Novo A','Novo B']);
 }finally{h.close();}
});
test('conflito no mesmo EPI recusa também a movimentação do lote e mantém estoque anterior',async()=>{
 const h=await setup({...empty(),epis:[{id:'a',quantity:10}]});try{
  const a=R.create(h.api(),()=>true),b=R.create(h.api(),()=>true);const sa=await a.load(),sb=await b.load();
  sa.data.epis[0].quantity=11;await a.commit(a.plan(sa.data));sb.data.epis[0].quantity=12;sb.data.movements.push({id:'m1',qty:2});
  await assert.rejects(b.commit(b.plan(sb.data)),e=>e.status===409);
  const final=await a.load();assert.equal(final.data.epis[0].quantity,11);assert.equal(final.data.movements.length,0);
 }finally{h.close();}
});
test('falha na auditoria reverte a transação inteira, incluindo revisão e estoque',async()=>{
 const h=await setup();try{
  h.sql.exec("CREATE TRIGGER fail_audit BEFORE INSERT ON audit_log BEGIN SELECT RAISE(ABORT,'falha fictícia'); END");
  const c=R.create(h.api(),()=>true),s=await c.load();s.data.epis.push({id:'e',quantity:2});s.data.movements.push({id:'m',qty:2});
  await assert.rejects(c.commit(c.plan(s.data)),/falha fictícia/);assert.equal(h.sql.prepare('SELECT COUNT(*) n FROM bc2_records').get().n,0);
  assert.equal(h.sql.prepare('SELECT revision FROM bc2_store_meta').get().revision,0);
 }finally{h.close();}
});
test('resposta perdida é repetida com mesmo identificador, sem duplicar entrada ou auditoria',async()=>{
 const h=await setup();try{
  const api=h.api();let lost=true;const c=R.create(async(route,options)=>{const result=await api(route,options);if(route==='records/change'&&lost){lost=false;throw Error('Resposta perdida');}return result;},()=>true);
  const s=await c.load();s.data.epis.push({id:'e',quantity:3});s.data.movements.push({id:'m',qty:3});
  await c.commit(c.plan(s.data));assert.equal(h.sql.prepare('SELECT revision FROM bc2_store_meta').get().revision,1);
  assert.equal(h.sql.prepare('SELECT COUNT(*) n FROM audit_log').get().n,2);assert.equal(h.sql.prepare('SELECT COUNT(*) n FROM bc2_commits').get().n,1);
 }finally{h.close();}
});
test('permissões verificadas no servidor para consulta, criação, edição, exclusão e restauração',async()=>{
 const h=await setup({...empty(),epis:[{id:'a',quantity:1}]});try{
  const m=await h.api()('records/meta'),user={permissions:{epis:{view:true}}};
  await assert.rejects(store.page(h.DB,user,new URL('http://localhost/records?collection=employees&revision=0&generation='+m.generation)),e=>e.status===403);
  for(const op of [{id:'b',action:'put',version:0,data:{id:'b'}},{id:'a',action:'put',version:1,data:{id:'a',quantity:9}},{id:'a',action:'delete',version:1}]){
   await assert.rejects(store.change(h.DB,user,actor,'Operador',{operationId:crypto.randomUUID(),generation:m.generation,changes:[{...op,collection:'epis'}]}),e=>e.status===403);
  }
  await assert.rejects(store.startImport(h.DB,user,actor,{}),e=>e.status===403);
 }finally{h.close();}
});
test('backup acima de 1,5 MB é importado em partes; alteração pequena não envia o histórico',async()=>{
 const h=await setup();try{
  const calls=[],api=h.api(),c=R.create(async(route,options)=>{if(options?.body)calls.push({route,bytes:Buffer.byteLength(options.body)});return api(route,options);},()=>true);
  const large=empty();large.epis=Array.from({length:350},(_,i)=>({id:'epi-'+i,name:'Fictício '+i,notes:'x'.repeat(6000),quantity:1}));
  assert(Buffer.byteLength(JSON.stringify(large))>2000000);
  const state=await c.importData(large,0,'initial');assert.equal(state.data.epis.length,350);assert(calls.every(c=>c.bytes<1500000));
  state.data.epis[200].quantity=2;await c.commit(c.plan(state.data));
  assert(calls.at(-1).route==='records/change');assert(calls.at(-1).bytes<10000);
  const final=await c.load();assert.equal(final.data.epis[200].quantity,2);assert.equal(final.data.epis.length,350);
 }finally{h.close();}
});
test('importação incompleta não ativa dados parciais e a geração antiga permanece recuperável',async()=>{
 const h=await setup({...empty(),epis:[{id:'antigo',quantity:7}]});try{
  const api=h.api(),m=await api('records/meta'),counts={epiFolders:0,epis:2,employees:0,movements:0,inspections:0,productCatalog:0};
  const {id}=await api('records/imports',{body:JSON.stringify({revision:0,purpose:'restore',counts,chunks:2}),method:'POST'});
  await api('records/imports/'+id+'/chunks',{body:JSON.stringify({chunk:0,records:[{collection:'epis',data:{id:'novo1'}}]}),method:'POST'});
  await assert.rejects(api('records/imports/'+id+'/finish',{body:'{}',method:'POST'}),e=>e.status===409);
  assert.equal((await api('records/meta')).generation,m.generation);
  await api('records/imports/'+id+'/chunks',{body:JSON.stringify({chunk:1,records:[{collection:'epis',data:{id:'novo2'}}]}),method:'POST'});
  await api('records/imports/'+id+'/finish',{body:'{}',method:'POST'});
  assert.equal((await api('records/meta')).generation,id);assert.equal(h.sql.prepare('SELECT COUNT(*) n FROM bc2_records WHERE generation=?').get(m.generation).n,1);
 }finally{h.close();}
});
test('restauração não substitui um banco modificado enquanto o backup era enviado',async()=>{
 const h=await setup();try{
  const api=h.api(),c=R.create(api,()=>true),state=await c.load(),counts=Object.fromEntries(Object.keys(collections).map(k=>[k,0]));
  const {id}=await api('records/imports',{body:JSON.stringify({revision:0,purpose:'restore',counts,chunks:0}),method:'POST'});
  state.data.epis.push({id:'preservar'});await c.commit(c.plan(state.data));
  await assert.rejects(api('records/imports/'+id+'/finish',{body:'{}',method:'POST'}),e=>e.status===409);
  assert.equal((await c.load()).data.epis[0].id,'preservar');
 }finally{h.close();}
});
test('corrida entre leitura e gravação de registros diferentes é repetida sem perder nenhum',async()=>{
 const h=await setup();try{
  const c=R.create(h.api(),()=>true),s=await c.load();s.data.epis.push({id:'meu'});
  const original=h.DB.batch;let injected=false;
  h.DB.batch=async statements=>{
   if(!injected&&statements[0]._text.startsWith('UPDATE bc2_store_meta')){
    injected=true;h.sql.prepare("INSERT INTO bc2_records(generation,collection,record_id,data_json,version,sort_order) VALUES('legacy-v1','employees','outro','{\"id\":\"outro\",\"name\":\"Outra pessoa\"}',1,0)").run();h.sql.prepare('UPDATE bc2_store_meta SET revision=revision+1').run();
   }return original(statements);
  };
  await c.commit(c.plan(s.data));const final=await c.load();assert.equal(final.data.epis[0].id,'meu');assert.equal(final.data.employees[0].id,'outro');assert.equal(final.revision,2);
 }finally{h.close();}
});
test('dois cadastros com mesmo ID conflitam; exclusão seguida de recriação não aceita versão antiga',async()=>{
 const h=await setup();try{
  const a=R.create(h.api(),()=>true),b=R.create(h.api(),()=>true);const sa=await a.load(),sb=await b.load();sa.data.epis.push({id:'mesmo'});sb.data.epis.push({id:'mesmo',name:'Outro'});
  await a.commit(a.plan(sa.data));await assert.rejects(b.commit(b.plan(sb.data)),e=>e.status===409);
  const stale=R.create(h.api(),()=>true),old=await stale.load();sa.data.epis=[];await a.commit(a.plan(sa.data));sa.data.epis=[{id:'mesmo',name:'Recriado'}];await a.commit(a.plan(sa.data));
  old.data.epis[0].name='Antigo';await assert.rejects(stale.commit(stale.plan(old.data)),e=>e.status===409);
 }finally{h.close();}
});
test('página lida durante uma edição remota é descartada e o conjunto é relido consistente',async()=>{
 const h=await setup({...empty(),epis:Array.from({length:110},(_,i)=>({id:'e'+i,name:'Antes'}))});try{
  const api=h.api();let changed=false;
  const c=R.create(async(route,options)=>{const result=await api(route,options);if(route.startsWith('records?')&&!changed){changed=true;h.sql.prepare("UPDATE bc2_records SET data_json=json_set(data_json,'$.name','Depois'),version=version+1").run();h.sql.prepare('UPDATE bc2_store_meta SET revision=revision+1').run();}return result;},()=>true);
  const state=await c.load();assert.equal(state.data.epis.length,110);assert(state.data.epis.every(e=>e.name==='Depois'));assert.equal(state.revision,1);
 }finally{h.close();}
});
test('atualização automática não troca a base de uma edição local iniciada durante a leitura',async()=>{
 const h=await setup({...empty(),epis:[{id:'a',name:'Antes'}]});try{
  const c=R.create(h.api(),()=>true),state=await c.load();await assert.rejects(c.load(()=>false),e=>e.localEdit);
  state.data.epis[0].name='Depois';await c.commit(c.plan(state.data));assert.equal((await c.load()).data.epis[0].name,'Depois');
 }finally{h.close();}
});
test('partes duplicadas são idempotentes e finalização repetida não ativa backup duas vezes',async()=>{
 const h=await setup();try{
  const api=h.api(),c=R.create(api,()=>true),counts={epiFolders:0,epis:1,employees:0,movements:0,inspections:0,productCatalog:0};
  const {id}=await api('records/imports',{method:'POST',body:JSON.stringify({revision:0,purpose:'restore',counts,chunks:1})});
  const part={method:'POST',body:JSON.stringify({chunk:0,records:[{collection:'epis',data:{id:'a'}}]})};
  await api('records/imports/'+id+'/chunks',part);await api('records/imports/'+id+'/chunks',part);
  await api('records/imports/'+id+'/finish',{method:'POST',body:'{}'});await api('records/imports/'+id+'/finish',{method:'POST',body:'{}'});
  assert.equal((await c.load()).revision,1);assert.equal(h.sql.prepare('SELECT COUNT(*) n FROM audit_log').get().n,1);
 }finally{h.close();}
});
