import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRecordStore} from '../record-store.mjs';
import {hasPermission,fieldChanges} from '../worker.mjs';
import {fixture,actor} from './fixtures/access-db.mjs';
function load(file){const mod={exports:{}};vm.runInThisContext('(function(module){'+fs.readFileSync(new URL('../site/'+file,import.meta.url),'utf8')+'\n})')(mod);return mod.exports;}
const F=load('epi-folders.js'),R=load('record-client.js');
const app=fs.readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
const seed=()=>({epiFolders:[{id:'p1',name:'Luvas'},{id:'p2',name:'Pasta vazia'}],epis:[
 {id:'a',name:'Luva fictícia',folder:'Luvas',size:'M',ca:'12345',quantity:12,stockUnit:'par',units:[{code:'FICTICIO-UNIT-1'}]},
 {id:'b',name:'Luva fictícia',folder:'luvas',size:'G',ca:'12345',quantity:7,stockUnit:'par',units:[]},
 {id:'c',name:'Máscara fictícia',folder:'Luvas',quantity:4,stockUnit:'unidade',units:[]},
 {id:'d',name:'Antigo',quantity:3,units:[]},
 {id:'z',name:'Modelo sem saldo',folder:'Zerados',quantity:0,units:[]}
 ],employees:[],movements:[{id:'m1',epiId:'a',qty:1}],inspections:[],productCatalog:[],suggestionsAdded:[],version:1});
test('pastas vazias e agrupamentos antigos são preservados sem gerar EPIs artificiais',()=>{
 const database=seed(),before=JSON.stringify(database),list=F.list(database);
 assert.equal(list.length,4);assert.equal(list.find(f=>f.name==='Luvas').items.length,3);
 assert.equal(list.find(f=>f.name==='Pasta vazia').items.length,0);assert.equal(JSON.stringify(database),before);
 assert.throws(()=>F.validateName(' luvas ',list),/Já existe/);assert.throws(()=>F.validateName('x'.repeat(101),list));
});
test('totais separam pares, unidades e cadastro antigo sem adivinhar conversão',()=>{
 assert.deepEqual(F.totals(seed().epis),{par:19,unidade:4,legado:3});
 assert.equal(F.summary(seed().epis),'19 pares · 4 unidades · 3 de unidade não definida');
 assert.equal(F.summary([]),'0 disponíveis');
 const group=F.models(seed().epis);assert.equal(group.find(g=>g.name==='Luva fictícia').items.length,2);
 assert.deepEqual(group.find(g=>g.name==='Luva fictícia').items.map(e=>e.size),['G','M']);
});
test('endereços de pasta aceitam acentos, barras e símbolos sem misturar rotas',()=>{
 for(const name of ['Luvas','Óculos / faces','M & G # 1','% etiqueta'])assert.equal(F.fromRoute(F.route(name)),name);
 assert.equal(F.fromRoute('#estoque/pasta/%XX'),'');assert.equal(F.fromRoute('#app/epis'),'');
});
function ui(database=seed(),permissions=()=>true){
 const classes=new Set(),elements=new Map(),listeners={},history=[];let form,saves=0;
 function el(id){if(!elements.has(id))elements.set(id,{value:'',textContent:'',innerHTML:'',hidden:false,classList:{contains:name=>id==='epis'&&name==='active'},focus(){this.focused=true;}});return elements.get(id);}
 const sandbox={folders:F,db:database,selectedEpiFolder:'',secureSession:{user:actor},can:permissions,MAIN_PAGE_TITLE:'BC2',
 document:{body:{classList:{add:n=>classes.add(n),remove:(...ns)=>ns.forEach(n=>classes.delete(n)),contains:n=>classes.has(n),toggle:(n,v)=>v?classes.add(n):classes.delete(n)}},getElementById:el,querySelectorAll:()=>[]},
 location:{hash:'',pathname:'/',search:''},history:{pushState(state,_,url){history.push(url);sandbox.location.hash=url.slice(url.indexOf('#'));}},
 window:{addEventListener:(type,fn)=>listeners[type]=fn,scrollTo(){}},stopScanner(){},esc:v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),fmtDate:v=>v||'',availableUnits:e=>e.units||[],
 getEpi:id=>database.epis.find(e=>e.id===id),openEpi:(...args)=>sandbox.openedEpi=args,alert:message=>sandbox.lastAlert=message,id:()=>crypto.randomUUID(),
 openForm:(title,fields,initial,save)=>form={title,fields,initial,save},save:async()=>{saves++;return true;}};
 vm.createContext(sandbox);vm.runInContext(app.slice(app.indexOf('        function createEpiFolder()'),app.indexOf('        function normalizePublicProduct')),sandbox);
 return{sandbox,el,classes,listeners,history,form:()=>form,saves:()=>saves};
}
test('criação solicita somente nome e a pasta vazia pode ser aberta e pesquisada',async()=>{
 const h=ui();h.sandbox.createEpiFolder();assert.deepEqual(Array.from(h.form().fields,f=>f.name),['name']);
 await h.form().save({name:'Capacetes'});assert.equal(h.saves(),1);assert.equal(h.sandbox.db.epis.length,5);
 h.sandbox.openEpiFolder('Capacetes');assert(h.classes.has('epi-folder-page'));assert.equal(h.el('epiFolderTitle').textContent,'Capacetes');assert.match(h.el('epiVariantGrid').innerHTML,/está vazia/);
 h.el('epiFolderSearch').value='inexistente';h.sandbox.renderEpis();assert(h.classes.has('epi-folder-page'));
});
test('página de pasta mostra só seu conteúdo, tamanhos e volta ao estoque pelo histórico',()=>{
 const h=ui();h.sandbox.renderEpis();assert.match(h.el('epiFolders').innerHTML,/19 pares · 4 unidades/);
 h.sandbox.openEpiFolder('Luvas');assert.equal(h.sandbox.location.hash,F.route('Luvas'));
 assert.match(h.el('epiVariantGrid').innerHTML,/Numeração: M/);assert.match(h.el('epiVariantGrid').innerHTML,/Numeração: G/);
 assert.doesNotMatch(h.el('epiVariantGrid').innerHTML,/Antigo|Modelo sem saldo/);
 h.el('epiFolderSearch').value='inexistente';h.sandbox.renderEpis();assert.match(h.el('epiVariantGrid').innerHTML,/Nenhum EPI corresponde/);
 h.sandbox.closeEpiFolder();assert.equal(h.sandbox.location.hash,'#app/epis');assert(!h.classes.has('epi-folder-page'));
 h.sandbox.location.hash=F.route('Luvas');h.listeners.popstate();assert.equal(h.el('epiFolderTitle').textContent,'Luvas');
});
test('mover cadastro mantém saldo, unidades e movimentos; adicionar tamanho não reutiliza código',async()=>{
 const h=ui(),original=structuredClone(h.sandbox.db.epis[0]),moves=JSON.stringify(h.sandbox.db.movements);
 h.sandbox.openEpiFolder('Pasta vazia');h.sandbox.addExistingEpiToFolder();await h.form().save({epiId:'a'});
 assert.deepEqual(h.sandbox.db.epis[0],{...original,folder:'Pasta vazia'});assert.equal(JSON.stringify(h.sandbox.db.movements),moves);
 h.sandbox.openEpiSize('a');assert.equal(h.sandbox.openedEpi[2],'');assert.equal(h.sandbox.openedEpi[4].template.id,'a');
});
test('nível somente de consulta não cria pastas nem move cadastros',()=>{
 const h=ui(seed(),(_,a)=>a==='view');h.sandbox.createEpiFolder();assert.equal(h.form(),undefined);assert.match(h.sandbox.lastAlert,/não permite/);
 h.sandbox.openEpiFolder('Luvas');h.sandbox.addExistingEpiToFolder();assert.equal(h.form(),undefined);assert.equal(h.saves(),0);
});
test('novo tamanho copia a identidade conferida, começa sem código de barras e sem saldo automático',()=>{
 let form;
 const database=seed(),sandbox={folders:F,db:database,selectedEpiFolder:'Luvas',can:()=>true,
  openForm:(title,fields,initial,save)=>form={title,fields,initial,save},alert(){}};
 vm.createContext(sandbox);vm.runInContext(app.slice(app.indexOf('        function openEpi(existing'),app.indexOf('        function editEpi(')),sandbox);
 sandbox.openEpi(null,'','',null,{template:{...database.epis[0],barcode:'GTIN-FICTICIO-M',model:'Modelo Fictício'}});
 assert.equal(form.title,'Adicionar tamanho do EPI');assert.equal(form.initial.folder,'Luvas');assert.equal(form.initial.quantity,0);assert.equal(form.initial.stockUnit,'par');
 assert.equal(form.initial.name,'Luva fictícia');assert.equal(form.initial.ca,'12345');assert.equal(form.initial.size,'');
 assert(!form.fields.some(f=>f.name==='barcode'));assert.equal(database.epis.length,5);
});
test('rotas diretas do estoque e navegação móvel reconhecem as pastas; aviso vermelho foi removido',()=>{
 const html=fs.readFileSync(new URL('../site/index.html',import.meta.url),'utf8'),mobile=fs.readFileSync(new URL('../site/mobile-ui.js',import.meta.url),'utf8');
 assert.match(html,/<div class="toolbar no-print" id="epiStockToolbar">\s*<input id="epiSearch"/);
 assert.equal((html.match(/id="epiStockToolbar"/g)||[]).length,1);
 assert.doesNotMatch(html,/Para manter a rastreabilidade/);assert.match(mobile,/startsWith\('#estoque\/pasta\/'\)/);
 const h=ui();h.sandbox.location.hash=F.route('Luvas');h.sandbox.renderEpis();assert(h.classes.has('epi-folder-page'));assert.equal(h.el('epiFolderTitle').textContent,'Luvas');
});
test('pasta vazia persiste no banco central, aparece em outro cliente e é incluída no backup',async()=>{
 const h=fixture(),json=(b,s=200)=>new Response(JSON.stringify(b),{status:s});
 const store=createRecordStore({json,hasPermission,fieldChanges,COLLECTIONS:R.collections});
 h.sql.prepare('UPDATE app_state SET data_json=?').run(JSON.stringify(seed()));
 const api=async(route,options={})=>{
  const body=options.body&&JSON.parse(options.body),url=new URL('https://teste/'+route);let r;
  if(route==='records/meta')r=await store.meta(h.DB);else if(route.startsWith('records?'))r=await store.page(h.DB,actor,url);
  else if(route==='records/change')r=await store.change(h.DB,actor,actor,'Administrador',body);
  else if(route==='records/imports')r=await store.startImport(h.DB,actor,actor,body);
  else if(route.endsWith('/chunks'))r=await store.importChunk(h.DB,actor,actor,route.split('/')[2],body);
  else r=await store.finishImport(h.DB,actor,actor,'Administrador',route.split('/')[2]);
  const result=await r.json();if(!r.ok)throw Object.assign(Error(result.error),{status:r.status});return result;
 };
 try{
  const client=R.create(api,()=>true),state=await client.load();state.data.epiFolders.push({id:'empty',name:'Só nome'});
  await client.commit(client.plan(state.data));const other=R.create(api,()=>true),next=await other.load();
  assert(next.data.epiFolders.some(f=>f.id==='empty'));assert.equal(next.data.movements[0].id,'m1');
  const backup=JSON.parse(JSON.stringify(next.data));const restored=await other.importData(backup,next.revision,'restore');assert(restored.data.epiFolders.some(f=>f.id==='empty'));
  const legacy={...backup};delete legacy.epiFolders;const old=await other.importData(legacy,restored.revision,'restore');assert.deepEqual(old.data.epiFolders,[]);assert.equal(F.list(old.data).find(f=>f.name==='Luvas').items.length,3);
  const user={permissions:{epis:{view:true}}},meta=await store.ensure(h.DB);
  await assert.rejects(store.change(h.DB,actor,actor,'Administrador',{generation:meta.generation,operationId:crypto.randomUUID(),changes:[{collection:'epiFolders',id:'invalid',action:'put',version:0,data:{id:'invalid',name:' '}}]}),/Nome de pasta inválido/);
  await assert.rejects(store.change(h.DB,user,actor,'Consulta',{generation:meta.generation,operationId:crypto.randomUUID(),changes:[{collection:'epiFolders',id:'denied',action:'put',version:0,data:{id:'denied',name:'Negada'}}]}),e=>e.status===403);
 }finally{h.close();}
});
