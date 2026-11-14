const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function load(name){const module={exports:{}};vm.runInThisContext('(function(module){'+fs.readFileSync(path.join(__dirname,'../site',name),'utf8')+'\n})')(module);return module.exports;}
const {createGuard}=load('connection.js'),mobile=load('mobile-ui.js');
test('sem conexão inicial, nenhuma operação é liberada; reconectar exige resposta do servidor',async()=>{
 let online=false,probes=0;const states=[];
 const guard=createGuard({online:()=>online,probe:async()=>{probes++;},onChange:blocked=>states.push(blocked)});
 assert.equal(await guard.check(),false);assert.equal(probes,0);await assert.rejects(guard.waitUntilReady(),/Conecte-se/);
 online=true;assert.equal(await guard.check(),true);await guard.waitUntilReady();assert.deepEqual(states,[true,false]);
});
test('queda de conexão bloqueia novamente e uma falha de servidor não libera o aplicativo',async()=>{
 let fails=false;const guard=createGuard({probe:async()=>{if(fails)throw Error('Servidor indisponível');},onChange(){}});
 await guard.check();assert.equal(guard.blocked,false);guard.fail();await assert.rejects(guard.waitUntilReady());
 fails=true;assert.equal(await guard.check(),false);assert(guard.blocked);fails=false;await guard.check();assert(!guard.blocked);
});
test('verificações simultâneas compartilham a consulta; gravação aguarda a resposta',async()=>{
 let complete,probes=0;const guard=createGuard({probe:()=>{probes++;return new Promise(resolve=>complete=resolve);},onChange(){}});
 const first=guard.check(),second=guard.check(),waiting=guard.waitUntilReady();assert.equal(probes,1);assert.equal(first,second);
 complete();await waiting;assert.equal(await first,true);assert(!guard.blocked);
});
test('os atalhos reproduzem todas as áreas permitidas e não mostram funções sem acesso',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../site/index.html'),'utf8');
 const nav=[...html.slice(html.indexOf('<nav id="nav">'),html.indexOf('</nav>',html.indexOf('<nav id="nav">'))).matchAll(/data-tab="([^"]+)"/g)].map(match=>({tab:match[1],hidden:false}));
 assert.deepEqual(mobile.available(true,nav),nav.map(n=>n.tab));assert.deepEqual(mobile.available(false,nav),[]);
 nav.find(n=>n.tab==='users').hidden=true;nav.find(n=>n.tab==='audit').hidden=true;
 assert(!mobile.available(true,nav).includes('users'));assert(!mobile.available(true,nav).includes('audit'));
 for(const entry of nav)assert(mobile.labels[entry.tab]);
});
test('abrir o aplicativo sem rede entrega somente aviso de conexão, sem interface privada',async()=>{
 const listeners={};let result;
 const sandbox={self:{location:{origin:'https://example.com'},addEventListener:(event,callback)=>listeners[event]=callback},fetch:async()=>{throw Error('offline');},Response,URL,caches:{match:async()=>{throw Error('Não deve abrir a interface do cache');}}};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../site/service-worker.js'),'utf8'),sandbox);
 listeners.fetch({request:{method:'GET',url:'https://example.com/',mode:'navigate'},respondWith:promise=>{result=promise;}});
 const response=await result;assert.equal(response.status,503);const text=await response.text();assert.match(text,/somente com internet/);assert.doesNotMatch(text,/app\.js|mobileTiles|epis|employees/);
});
test('consulta da API nunca usa resposta do cache offline',()=>{
 const listeners={};let intercepted=false;
 const sandbox={self:{location:{origin:'https://example.com'},addEventListener:(event,callback)=>listeners[event]=callback},URL};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../site/service-worker.js'),'utf8'),sandbox);
 listeners.fetch({request:{method:'GET',url:'https://example.com/api/session',mode:'cors'},respondWith:()=>{intercepted=true;}});assert.equal(intercepted,false);
});
function mobileHarness({approved=true,gateHidden=true,blocked=false,hash=''}={}){
 const elements=new Map(),classes=new Set(),listeners={document:{},window:{}},nav=['dashboard','epis','scanner','users','audit'].map(tab=>({dataset:{tab},hidden:!approved,classList:{}}));
 let activeTab='dashboard',pushes=0;
 const get=id=>{if(!elements.has(id))elements.set(id,{hidden:['mobileHome','mobileHeader','mobilePageBar','mobileMenu','authChoiceView','authFormView'].includes(id),textContent:'',innerHTML:'',value:'',setAttribute(){},focus(){},addEventListener(type,fn){this[type]=fn;}});return elements.get(id);};
 get('accessGate').hidden=gateHidden;get('firebaseAuthControls').hidden=true;
 const location={pathname:'/',search:'',hash};const history={pushState(state,_,url){pushes++;location.hash=url.slice(url.indexOf('#'));},replaceState(state,_,url){location.hash=url.slice(url.indexOf('#'));}};
 const window={BC2Connection:{blocked},scrollTo(){},addEventListener(type,fn){(listeners.window[type]||=[]).push(fn);}};
 const document={title:'BC2',body:{classList:{add(...names){names.forEach(n=>classes.add(n));},remove(...names){names.forEach(n=>classes.delete(n));},toggle(n,value){value?classes.add(n):classes.delete(n);}}},getElementById:get,
  querySelectorAll:selector=>selector==='#nav button[data-tab]'?nav:[],querySelector:()=>({}),addEventListener(type,fn){(listeners.document[type]||=[]).push(fn);}};
 const sandbox={window,document,location,history,matchMedia:()=>({matches:true,addEventListener(){}}),MutationObserver:class{observe(){}},queueMicrotask,secureSession:approved?{status:'active',user:{display_name:'Pessoa Fictícia'}}:null,
  stopScanner(){},goTab(tab){activeTab=tab;window.BC2Mobile?.onTab(tab);},openPersonalSettings(){location.hash='#configuracoes-pessoais';window.BC2Mobile.onSubpage('Minha conta');},openAuthForm(){}};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../site/mobile-ui.js'),'utf8'),sandbox);
 return{get,window,classes,location,nav,listeners,active:()=>activeTab,pushes:()=>pushes,clickTile(tab){listeners.document.click[0]({target:{closest:()=>({dataset:{mobileTab:tab}})}});},legacyGoTab:sandbox.goTab};
}
test('sessão aprovada abre quadrados; tela de login ou sessão pendente não abre o menu privado',()=>{
 const approved=mobileHarness();assert(approved.classes.has('mobile-home'));assert(approved.get('mobileTiles').innerHTML.includes('data-mobile-tab="epis"'));
 for(const options of [{approved:false},{gateHidden:false},{blocked:true}]){const h=mobileHarness(options);assert(!h.classes.has('mobile-home'));assert.equal(h.get('mobileTiles').innerHTML,'');}
});
test('quadrado e botão Início alternam a mesma função existente sem criar cópia dos dados',()=>{
 const h=mobileHarness();h.clickTile('epis');assert.equal(h.active(),'epis');assert.equal(h.location.hash,'#app/epis');assert(!h.classes.has('mobile-home'));
 h.get('mobileGoHome').click();assert.equal(h.location.hash,'#inicio');assert(h.classes.has('mobile-home'));
});
test('retorno da página pessoal não deixa a navegação legada substituir a tela inicial',async()=>{
 const h=mobileHarness();h.clickTile('audit');h.get('mobileGoHome').click();h.clickTile('personal');assert.equal(h.location.hash,'#configuracoes-pessoais');
 const before=h.pushes();h.location.hash='#inicio';h.window.BC2Mobile.prepareHistory();h.legacyGoTab('audit');
 for(const handler of h.listeners.window.popstate)handler();await Promise.resolve();
 assert.equal(h.pushes(),before);assert.equal(h.location.hash,'#inicio');assert(h.classes.has('mobile-home'));
});
