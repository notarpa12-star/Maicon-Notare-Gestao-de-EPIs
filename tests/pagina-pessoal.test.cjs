const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../site/app.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../site/index.html'),'utf8');
function segment(start,end){const first=source.indexOf(start),last=source.indexOf(end,first+1);assert(first>=0&&last>first);return source.slice(first,last);}
function classes(...values){const set=new Set(values);return{add:v=>set.add(v),remove:v=>set.delete(v),contains:v=>set.has(v),toggle(v,active){if(active)set.add(v);else set.delete(v);}};}
function harness(){
  const nodes=new Map(),listeners={},sections=['dashboard','epis','support','personalSettings'].map(id=>({id,classList:classes(id==='epis'?'active':'')}));
  let navClick, renders=0,stops=0,focused='';
  const get=id=>{if(!nodes.has(id))nodes.set(id,{id,value:'segredo-ficticio',hidden:false,textContent:'',classList:classes(),addEventListener:(event,callback)=>{if(id==='nav'&&event==='click')navClick=callback;},focus(){focused=id;}});return nodes.get(id);};
  const buttons=['dashboard','epis','support'].map(tab=>({dataset:{tab},hidden:false,classList:classes(tab==='epis'?'active':''),click(){navClick({target:{closest:()=>this}});}}));
  const location={pathname:'/',search:'',hash:''};
  const document={title:'BC2 | Gestão de EPIs',body:{classList:classes()},getElementById:get,
    querySelectorAll:selector=>selector==='nav button'?buttons:selector==='.section'?sections:[],
    querySelector:selector=>{if(selector==='.section.active')return sections.find(s=>s.classList.contains('active'));const match=selector.match(/data-tab="([^"]+)"/);if(match)return buttons.find(b=>b.dataset.tab===match[1]&&!b.hidden)||null;return buttons.find(b=>!b.hidden)||null;}};
  const entries=[{hash:'',state:null}];let index=0;
  const history={get state(){return entries[index].state;},get length(){return entries.length;},
    pushState(state,_,url){entries.splice(index+1);entries.push({hash:url.includes('#')?url.slice(url.indexOf('#')):'',state});index++;location.hash=entries[index].hash;},
    replaceState(state,_,url){entries[index]={hash:url.includes('#')?url.slice(url.indexOf('#')):'',state};location.hash=entries[index].hash;},
    back(){if(index){index--;location.hash=entries[index].hash;listeners.popstate();listeners.hashchange();}},
    forward(){if(index<entries.length-1){index++;location.hash=entries[index].hash;listeners.popstate();listeners.hashchange();}}
  };
  const sandbox={document,location,history,CSS:{escape:v=>v},window:{scrollTo(){},addEventListener:(type,callback)=>{listeners[type]=callback;}},secureSession:{status:'active',user:{id:'ficticio'}},
    USERS_ROUTES:{},personalSettingsReturnTab:'dashboard',personalSettingsReturnHash:'',PERSONAL_SETTINGS_HASH:'#configuracoes-pessoais',MAIN_PAGE_TITLE:document.title,
    renderPersonalSettings(){renders++;},renderAll(){},stopScanner(){stops++;},showUsersHome(){}};
  vm.createContext(sandbox);
  vm.runInContext(segment("        document.getElementById('nav').addEventListener('click'",'        function applyPersonalTheme(')+segment('        function showPersonalSettingsPage() {','        function renderPersonalSettings() {'),sandbox);
  return{sandbox,document,sections,buttons,history,location,get,listeners,renders:()=>renders,stops:()=>stops,focused:()=>focused};
}
test('Configurações pessoais abre endereço interno e isola a seção com suas funções',()=>{
  const h=harness();h.sandbox.openPersonalSettings();
  assert.equal(h.location.hash,'#configuracoes-pessoais');assert.equal(h.history.length,2);assert(h.document.body.classList.contains('personal-settings-page'));
  assert.deepEqual(h.sections.filter(s=>s.classList.contains('active')).map(s=>s.id),['personalSettings']);assert.equal(h.stops(),1);assert.equal(h.focused(),'personalSettingsTitle');assert.equal(h.document.title,'Configurações pessoais | BC2');
});
test('Voltar restaura a tela de origem e limpa campos de senha',()=>{
  const h=harness();h.sandbox.openPersonalSettings();h.sandbox.backFromPersonalSettings();
  assert.equal(h.location.hash,'');assert(!h.document.body.classList.contains('personal-settings-page'));assert(h.sections.find(s=>s.id==='epis').classList.contains('active'));
  assert.equal(h.get('currentPassword').value,'');assert.equal(h.get('emailChangeCurrentPassword').value,'');assert.equal(h.document.title,'BC2 | Gestão de EPIs');
});
test('botões Voltar e Avançar do navegador acompanham a página interna',()=>{
  const h=harness();h.sandbox.openPersonalSettings();h.history.back();assert(!h.document.body.classList.contains('personal-settings-page'));
  h.history.forward();assert(h.document.body.classList.contains('personal-settings-page'));assert(h.sections.find(s=>s.id==='personalSettings').classList.contains('active'));
});
test('endereço direto da página funciona após autenticação, sem criar entradas repetidas',()=>{
  const h=harness();h.history.replaceState(null,'','/#configuracoes-pessoais');h.sandbox.syncPersonalSettingsRoute();assert.equal(h.history.length,1);
  h.sandbox.backFromPersonalSettings();assert.equal(h.location.hash,'');assert(h.sections.find(s=>s.id==='dashboard').classList.contains('active'));
});
test('retorno usa primeira aba permitida se a aba anterior estiver indisponível',()=>{
  const h=harness();h.buttons.find(b=>b.dataset.tab==='dashboard').hidden=true;h.buttons.find(b=>b.dataset.tab==='epis').hidden=true;
  h.history.replaceState(null,'','/#configuracoes-pessoais');h.sandbox.syncPersonalSettingsRoute();h.sandbox.backFromPersonalSettings();assert(h.sections.find(s=>s.id==='support').classList.contains('active'));
});
test('página não abre para uma sessão sem usuário autenticado',()=>{
  const h=harness();h.sandbox.secureSession=null;h.sandbox.openPersonalSettings();assert.equal(h.location.hash,'');assert.equal(h.renders(),0);
});
test('página oculta menu, cabeçalho e rodapé e conserva as quatro funções existentes',()=>{
  assert.match(html,/body\.personal-settings-page > header/);assert.match(html,/body\.personal-settings-page #nav/);assert.match(html,/body\.personal-settings-page main > footer/);
  for(const id of ['personalNameForm','passwordChangeForm','emailChangeForm','personalThemeFeedback'])assert(html.includes(`id="${id}"`));
  assert(html.includes('data-ui-action="backFromPersonalSettings">← Voltar'));
});
test('lista permite editar outro Administrador e bloqueia o nível da própria conta',()=>{
  const elements=new Map();const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:''});return elements.get(id);};
  const sandbox={document:{getElementById:element},secureSession:{user:{id:'owner',is_admin:true}},adminUsers:[{id:'owner',email:'owner@example.com',display_name:'Principal',status:'active',role_id:'bc2-admin',role_name:'Administrador',is_admin:true,is_protected:true},{id:'other',email:'other@example.com',display_name:'Outro Admin',status:'active',role_id:'bc2-admin',role_name:'Administrador',is_admin:true}],adminRoles:[{id:'bc2-admin',name:'Administrador',is_admin:true},{id:'operator',name:'Operador',is_admin:false}],esc:v=>String(v??''),fmtDate:v=>v};
  vm.createContext(sandbox);vm.runInContext(segment('        function roleOptions(','        function updatePendingApprovalState('),sandbox);sandbox.renderUsersPanel();const rendered=element('activeUsers').innerHTML;
  assert.match(rendered,/<select id="role-owner"[^>]*disabled/);assert.doesNotMatch(rendered,/<select id="role-other"[^>]*disabled/);assert.match(rendered,/<select id="role-other"[^>]*>[\s\S]*?value="operator"/);
});
test('mudança de nível de uma pessoa conectada recarrega a tela com as permissões novas',async()=>{
  let reloads=0;
  const sandbox={secureSession:{user:{role_id:'bc2-admin',is_admin:true},permissions:{}},apiRequest:async()=>({status:'active',user:{role_id:'operator',is_admin:false},permissions:{}}),location:{reload(){reloads++;}}};
  vm.createContext(sandbox);vm.runInContext(segment('        async function checkSessionStatus() {','        const COLLECTION_KEY_NAMES'),sandbox);
  await sandbox.checkSessionStatus();assert.equal(reloads,1);
});
test('verificação de sessão sem mudança de acesso mantém a página aberta',async()=>{
  let reloads=0;
  const sandbox={secureSession:{user:{role_id:'operator',is_admin:false},permissions:{}},apiRequest:async()=>({status:'active',user:{role_id:'operator',is_admin:false},permissions:{},revision:0}),location:{reload(){reloads++;}},document:{getElementById:()=>({classList:{contains:()=>false}}),visibilityState:'visible'},window:{},remoteRefreshBlocked:false,remoteRevision:0};
  vm.createContext(sandbox);vm.runInContext(segment('        async function checkSessionStatus() {','        const COLLECTION_KEY_NAMES'),sandbox);
  await sandbox.checkSessionStatus();assert.equal(reloads,0);
});
