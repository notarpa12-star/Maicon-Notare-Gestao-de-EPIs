import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../PUBLICAR-WORKER.mjs';
test('a interface completa é servida sem depender de troca dos bindings', async()=>{
  const r=await worker.fetch(new Request('https://bc2.example/'),{},{});
  assert.equal(r.status,200);const html=await r.text();assert(html.includes('bc2-release'));assert(html.includes('Escanear e cadastrar EPI novo'));
  assert.equal(r.headers.get('x-bc2-release'),'download-conta-20261109');
  assert(html.includes('app.js?v=download-conta-20261109'));
});
test('API continua protegida por autenticação após empacotar',async()=>{
  const r=await worker.fetch(new Request('https://bc2.example/api/state'),{FIREBASE_PROJECT_ID:'teste'},{});assert.equal(r.status,401);
});
test('a consulta de conexão não abre dados nem aceita gravações',async()=>{
  const response=await worker.fetch(new Request('https://bc2.example/api/connection'),{},{});
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{online:true});assert.equal(response.headers.get('cache-control'),'no-store');
  const write=await worker.fetch(new Request('https://bc2.example/api/connection',{method:'POST'}),{},{});assert.equal(write.status,405);
  const privateData=await worker.fetch(new Request('https://bc2.example/api/records/meta'),{FIREBASE_PROJECT_ID:'teste'},{});assert.equal(privateData.status,401);
});
test('política mantém bloqueio de scripts em atributos e acesso a câmera restrito',async()=>{
  const r=await worker.fetch(new Request('https://bc2.example/'),{},{});const csp=r.headers.get('content-security-policy');
  assert.match(csp,/script-src-attr 'none'/);assert.doesNotMatch(csp,/script-src[^;]*'unsafe-inline'/);assert.doesNotMatch(csp,/'unsafe-eval'/);
  assert.match(csp,/'wasm-unsafe-eval'/);assert.match(r.headers.get('permissions-policy'),/camera=\(self\)/);
});
test('arquivos antigos não sobrescritos continuam usando o binding existente',async()=>{
  const r=await worker.fetch(new Request('https://bc2.example/arquivo-antigo.txt'),{ASSETS:{fetch:async()=>new Response('preservado')}},{});assert.equal(await r.text(),'preservado');
});
test('foto de etiqueta, cálculo e gravação central estão no pacote',async()=>{
  for(const file of ['auth-registration.js','epi-core.js','epi-central.js','epi-cadastro.js','epi-cadastro.css','service-worker.js','firebase-config.js','icons/bc2-192.png']) {
    const r=await worker.fetch(new Request('https://bc2.example/'+file),{},{});assert.equal(r.status,200);assert((await r.arrayBuffer()).byteLength>0);
  }
});
