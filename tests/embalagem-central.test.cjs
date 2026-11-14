const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const moduleCore = { exports: {} };
vm.runInThisContext('(function(module,exports){' + fs.readFileSync(path.join(__dirname, '../site/epi-core.js'), 'utf8') + '\n})')(moduleCore, moduleCore.exports);
const C = moduleCore.exports;
const recordModule = { exports: {} };
vm.runInThisContext('(function(module,exports){' + fs.readFileSync(path.join(__dirname, '../site/record-client.js'), 'utf8') + '\n})')(recordModule, recordModule.exports);
const R = recordModule.exports;
const draft = extra => ({ barcode:'FICTICIO-BC2-CENTRAL', name:'Luva Fictícia', mode:'entrada', stockUnit:'par', packageType:'caixa', packageCount:'3', contentCount:'12', contentUnit:'par', quantityEvidence:'Etiqueta fictícia: 12 pares', identityConfirmed:true, quantityConfirmed:true, finalConfirmed:true, ...extra });
function setup(extra = {}) {
  let counter = 0, requests = [];
  const initial = { epis:[], employees:[{id:'p1',name:'Pessoa Fictícia'}], movements:[], inspections:[], productCatalog:[], version:1 };
  const sandbox = { window:{}, BC2EpiCore:C, secureSession:{status:'active', user:{id:'ficticio'}}, db:initial,
    remoteRevision:5, remoteRefreshBlocked:false, saveQueue:Promise.resolve(true),
    can:()=>true, id:()=>`teste-${++counter}`, today:()=> '2026-11-05', AbortSignal,
    newEpiUnit:(epi, used)=>{const code=`BC2-FICTICIO-${++counter}`;used.add(code);return{id:code,code,employeeId:'',retired:false};},
    apiRequest:async (endpoint, options)=>{requests.push({endpoint,body:JSON.parse(options.body)});return{saved:true,revision:6};}, ...extra };
  vm.createContext(sandbox);
  sandbox.planRecordSave=next=>R.diff(initial,next);
  sandbox.commitRecordSave=changes=>sandbox.apiRequest('records/change',{body:JSON.stringify({changes})});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../site/epi-central.js'), 'utf8'),sandbox);
  return { sandbox, requests, save: d => sandbox.window.BC2Central.commit(d || draft(), 5) };
}
test('3 caixas de 12 pares são confirmadas juntas no banco e preservam pessoas',async()=>{
  const h=setup();const tx=await h.save();
  assert.equal(h.requests.length,1);assert.equal(h.requests[0].endpoint,'records/change');
  assert.equal(h.requests[0].body.changes.find(c=>c.collection==='epis').data.quantity,36);assert.equal(h.requests[0].body.changes.find(c=>c.collection==='movements').data.qty,36);
  assert(!h.requests[0].body.changes.some(c=>c.collection==='employees'));
  assert.equal(tx.epi.quantity,36);assert.equal(h.sandbox.db.employees[0].name,'Pessoa Fictícia');assert.equal(h.sandbox.remoteRevision,6);
});
test('resposta recusada não altera memória nem confirma o estoque',async()=>{
  const h=setup({apiRequest:async()=>{throw Object.assign(Error('Conflito'),{status:409});}});const before=JSON.stringify(h.sandbox.db);
  await assert.rejects(h.save(),/Conflito/);assert.equal(JSON.stringify(h.sandbox.db),before);assert.equal(h.sandbox.remoteRevision,5);assert(h.sandbox.remoteRefreshBlocked);
});
test('revisão antiga bloqueia envio antes de escrever',async()=>{
  const h=setup({remoteRevision:6});await assert.rejects(h.save(),/estoque foi atualizado/);assert.equal(h.requests.length,0);
});
test('falha sem resposta bloqueia repetição até reler o banco',async()=>{
  const h=setup({apiRequest:async()=>{throw Error('Sem conexão');}});await assert.rejects(h.save(),/confira o saldo/);await assert.rejects(h.save(),/alteração anterior/);assert.equal(h.sandbox.db.epis.length,0);
});
test('permissões do leitor, estoque e movimentações continuam obrigatórias',async()=>{
  for (const denied of ['scanner:view','epis:view','epis:create','movements:view','movements:create']) {
    const h=setup({can:(tab,action)=>`${tab}:${action}`!==denied});await assert.rejects(h.save(),/nível/);assert.equal(h.requests.length,0);
  }
});
test('cadastro sem entrada não exige permissão de movimentação',async()=>{
  const h=setup({can:(tab)=>tab!=='movements'});await h.save(draft({mode:'catalogo',packageCount:'',contentCount:''}));
  assert.equal(h.sandbox.db.epis[0].quantity,0);assert.equal(h.sandbox.db.movements.length,0);
});
test('sessão não aprovada não grava',async()=>{
  const h=setup({secureSession:{status:'pending',user:{id:'ficticio'}}});await assert.rejects(h.save(),/Entre novamente/);assert.equal(h.requests.length,0);
});
test('conversão entre par e unidade exige confirmação expressa',()=>{
  assert.throws(()=>C.calculate(draft({stockUnit:'unidade'})),/Confirme/);
  assert.equal(C.calculate(draft({stockUnit:'unidade',conversionConfirmed:true})).total,72);
});
test('OCR não confunde CA, tamanho e massa com quantidade',()=>{
  assert.deepEqual(C.extractQuantities('CA 12345, tamanho 40, 500 g'),[]);
  assert.equal(C.extractQuantities('CAIXA COM 12 PARES')[0].count,12);
});
test('a transcrição de fabricante não inventa CA',()=>{
  assert.deepEqual(C.labeledFields('Fabricante: Empresa Fictícia\nModelo: TESTE\nCA: 12345'),{manufacturer:'Empresa Fictícia',model:'TESTE'});
});
test('o módulo central não escreve dados do estoque no armazenamento local',()=>{
  assert.doesNotMatch(fs.readFileSync(path.join(__dirname,'../site/epi-central.js'),'utf8'),/localStorage|indexedDB/);
});
test('não admite quantidades desconhecidas, frações ou confirmação ausente',()=>{
  for(const extra of [{contentCount:''},{packageCount:'0'},{contentCount:'1.5'},{quantityConfirmed:false},{finalConfirmed:false}])assert.throws(()=>C.validateDraft(draft(extra),{epis:[]}));
});
test('resposta sem confirmação explícita é tratada como falha',async()=>{
  const h=setup({apiRequest:async()=>({revision:6})});await assert.rejects(h.save(),/não confirmou/);assert.equal(h.sandbox.db.epis.length,0);
});
