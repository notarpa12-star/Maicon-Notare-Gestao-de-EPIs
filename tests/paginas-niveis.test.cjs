const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../site/app.js'),'utf8');
const segment=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
function harness(){
 const routes={home:'#usuarios',requests:'#usuarios/pedidos',roles:'#niveis-acesso',approved:'#niveis-acesso/pessoas',edit:'#niveis-acesso/editar',create:'#niveis-acesso/criar'};
 const elements=new Map(),states=new Set(),events={},location={pathname:'/',search:'',hash:''};let reset=0,loads=0;
 const get=id=>{if(!elements.has(id))elements.set(id,{id,hidden:false,textContent:id,focus(){}});return elements.get(id);};
 const history={pushState(state,_,url){this.state=state;location.hash=url.slice(url.indexOf('#'));}};
 const sandbox={USERS_ROUTES:routes,usersPage:'home',secureSession:{user:{id:'fake'}},can:()=>true,history,location,MAIN_PAGE_TITLE:'BC2',PERSONAL_SETTINGS_HASH:'#configuracoes-pessoais',
 document:{getElementById:get,body:{classList:{add:v=>states.add(v),remove:v=>states.delete(v),contains:v=>states.has(v),toggle(v,on){on?states.add(v):states.delete(v);}}},querySelectorAll:()=>[]},
 window:{scrollTo(){},addEventListener:(name,callback)=>events[name]=callback},stopScanner(){},newRole(){reset++;},loadAdminPanels(){loads++;},restoreMainPage(){states.delete('users-access-page');}};
 vm.createContext(sandbox);vm.runInContext(segment('        function showUsersHome(', '        function closeModal()'),sandbox);
 return{sandbox,get,states,location,history,reset:()=>reset,loads:()=>loads,events};
}
test('menu e três destinos abrem endereços próprios e somente uma área de cada vez',()=>{
 const h=harness();for(const page of ['roles','approved','edit','create']){
  h.sandbox.openUsersPage(page);assert.equal(h.location.hash,h.sandbox.USERS_ROUTES[page]);
  const visible=['usersHome','usersRequestsPage','usersRolesPage','usersApprovedPage','usersEditRolesPage','usersCreateRolePage'].filter(id=>!h.get(id).hidden);
  assert.equal(visible.length,1);assert(h.states.has('users-access-page'));
 }assert.equal(h.reset(),1);
});
test('Voltar de cada opção retorna ao menu; Voltar do menu retorna aos usuários',()=>{
 const h=harness();for(const page of ['approved','edit','create']){
  h.sandbox.openUsersPage(page);h.sandbox.openUsersPage('roles');assert(!h.get('usersRolesPage').hidden);assert.equal(h.location.hash,'#niveis-acesso');
 }h.sandbox.showUsersHome();assert(!h.get('usersHome').hidden);assert(!h.states.has('users-access-page'));
});
test('histórico e endereço direto restauram o destino, sem empilhar novas navegações',()=>{
 const h=harness();h.location.hash='#niveis-acesso/editar';h.sandbox.syncUsersRoute();assert(!h.get('usersEditRolesPage').hidden);assert.equal(h.history.state,undefined);
 h.location.hash='#niveis-acesso/pessoas';h.events.popstate();assert(!h.get('usersApprovedPage').hidden);
});
test('sem sessão ou permissão, o endereço de níveis não abre a área privada',()=>{
 for(const unauthorized of ['no-session','no-permission']){
  const h=harness();if(unauthorized==='no-session')h.sandbox.secureSession=null;else h.sandbox.can=()=>false;
  h.sandbox.openUsersPage('create');assert.equal(h.location.hash,'');assert.equal(h.loads(),0);
 }
});
test('criar usa formulário independente e nunca envia o ID do nível selecionado para edição',async()=>{
 const values={roleName:{value:'Não alterar'},createRoleName:{value:'Novo fictício'}};let sent;
 const sandbox={editingRoleId:'bc2-admin',adminRoles:[{id:'bc2-admin',is_admin:true,permissions:{}}],document:{getElementById:id=>values[id],querySelectorAll:selector=>{assert.equal(selector,'#createRolePermissionRows input[data-tab]');return[{dataset:{tab:'epis',action:'view'},checked:true}];}},apiRequest:async(route,options)=>{sent=JSON.parse(options.body);return{id:'novo'};},loadAdminPanels:async()=>{},newRole(){},alert(){}};
 vm.createContext(sandbox);vm.runInContext(segment('        async function saveRole(', '        async function deleteRole()'),sandbox);
 await sandbox.saveRole('create');assert.equal(sent.id,null);assert.equal(sent.name,'Novo fictício');assert.equal(sent.permissions.epis.view,true);assert.equal(sandbox.editingRoleId,'bc2-admin');assert.equal(values.roleName.value,'Não alterar');
});
