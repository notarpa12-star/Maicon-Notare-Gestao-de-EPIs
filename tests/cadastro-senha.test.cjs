const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = path.join(__dirname, '../site');
const registrationSource = fs.readFileSync(path.join(site, 'auth-registration.js'), 'utf8');
const app = fs.readFileSync(path.join(site, 'app.js'), 'utf8');
const input = extra => ({ name:'Pessoa Fictícia', email:'ficticio@example.com', password:'Ficticia-Teste!123', confirmation:'Ficticia-Teste!123', ...extra });
function registration() {
  const m={exports:{}};
  vm.runInThisContext('(function(module,exports){'+registrationSource+'\n})')(m,m.exports);
  return m.exports;
}
function segment(name, next) {
  const start=app.indexOf(`        ${name}`), end=app.indexOf(`        ${next}`,start+1);
  assert(start>=0 && end>start);return app.slice(start,end);
}
function harness() {
  const nodes=new Map(), messages=[], stored=[];let boots=0;
  const element=id=>{if(!nodes.has(id))nodes.set(id,{value:'',hidden:false,required:false,disabled:false,style:{},classList:{add(){},remove(){}}});return nodes.get(id);};
  const sandbox={window:{},document:{getElementById:element},location:{origin:'https://bc2.example'},authViewMode:'request',authSubmitInFlight:false,
    BC2Registration:registration(),authFeedback:(text,error)=>messages.push({text,error}),
    firebaseAuthRequest:async()=>{throw Error('Nenhuma consulta real permitida no teste.');},
    completeConfirmedEmailChange:async()=>({completed:false}),clearEmailChangeContinuation(){},
    storeFirebaseSession:data=>stored.push(data),bootSecureApp:async()=>{boots++;},finishEmailLinkSignIn:async()=>{},
  };
  vm.createContext(sandbox);
  const source=segment('function openAuthForm(mode) {','function firebaseReady()')+
    segment('function firebaseErrorMessage(code) {','async function firebaseAuthRequest(')+
    segment('async function submitAuthForm(event) {','async function loginWithEmail()')+
    segment('async function loginWithEmail() {','async function registerWithEmail()')+
    segment('async function registerWithEmail() {','async function finishEmailLinkSignIn(');
  vm.runInContext(source,sandbox);
  const values=input();
  for(const [field,value] of Object.entries({authName:values.name,authEmail:values.email,authPassword:values.password,authConfirmPassword:values.confirmation}))element(field).value=value;
  return {sandbox,element,messages,stored,boots:()=>boots};
}
test('novo cadastro usa senha e VERIFY_EMAIL, sem link de acesso',async()=>{
  const C=registration(),calls=[];
  const result=await C.createAccount(input(),async(method,payload)=>{calls.push({method,payload});return method==='accounts:signUp'?{idToken:'token-ficticio',refreshToken:'refresh-ficticio'}:{};},'https://bc2.example/');
  assert.equal(calls.length,2);assert.equal(calls[0].method,'accounts:signUp');assert.equal(calls[0].payload.displayName,'Pessoa Fictícia');
  assert.equal(calls[0].payload.password,input().password);assert.equal(calls[1].payload.requestType,'VERIFY_EMAIL');
  assert.equal(calls[1].payload.password,undefined);assert.equal(calls[1].payload.canHandleCodeInApp,false);
  assert.equal(calls[0].payload.emailVerified,undefined);assert.equal(result.idToken,undefined);assert.equal(result.refreshToken,undefined);
});
test('nome, e-mail, senha forte e confirmação são obrigatórios antes de criar',async()=>{
  const C=registration();let calls=0;
  for(const values of [{name:''},{email:''},{email:'invalido'},{password:'curta',confirmation:'curta'},{confirmation:'Outra-Senha!123'}])await assert.rejects(C.createAccount(input(values),async()=>{calls++;}));
  assert.equal(calls,0);
});
test('conta existente não tem senha sobrescrita e não recebe novo cadastro',async()=>{
  const C=registration(),calls=[];
  await assert.rejects(C.createAccount(input(),async(method)=>{calls.push(method);throw Object.assign(Error('Já existe'),{code:'EMAIL_EXISTS'});}),e=>e.code==='EMAIL_EXISTS' && !e.accountCreated);
  assert.deepEqual(calls,['accounts:signUp']);
});
test('falha de envio informa que a conta já foi criada',async()=>{
  const C=registration();
  await assert.rejects(C.createAccount(input(),async method=>{if(method==='accounts:signUp')return{idToken:'ficticio'};throw Object.assign(Error('Cota'),{code:'QUOTA_EXCEEDED'});}),e=>e.accountCreated===true && e.code==='QUOTA_EXCEEDED');
});
test('reenvio imediato reutiliza a confirmação, sem consumir outro envio',async()=>{
  const C=registration();let calls=0;
  await C.sendVerification('ficticio','Pessoa@example.com',async()=>{calls++;});
  assert.equal((await C.sendVerification('ficticio','pessoa@example.com',async()=>{calls++;})).alreadySent,true);
  assert.equal(calls,1);
});
test('envios simultâneos para o mesmo endereço geram uma só chamada',async()=>{
  const C=registration();let calls=0,release;
  const hold=new Promise(resolve=>{release=resolve;});
  const request=async()=>{calls++;await hold;};
  const first=C.sendVerification('ficticio','pessoa@example.com',request);
  const second=C.sendVerification('ficticio','pessoa@example.com',request);
  release();await Promise.all([first,second]);assert.equal(calls,1);
});
test('falha no envio não marca um e-mail como enviado',async()=>{
  const C=registration();let calls=0;
  await assert.rejects(C.sendVerification('ficticio','pessoa@example.com',async()=>{calls++;throw Error('Sem rede');}));
  await C.sendVerification('ficticio','pessoa@example.com',async()=>{calls++;});assert.equal(calls,2);
});
test('novo cadastro não salva sessão nem abre o estoque antes da confirmação',async()=>{
  const h=harness();h.sandbox.firebaseAuthRequest=async method=>method==='accounts:signUp'?{idToken:'ficticio'}:{};
  await h.sandbox.registerWithEmail();assert.equal(h.stored.length,0);assert.equal(h.boots(),0);
  assert.equal(h.sandbox.authViewMode,'login');assert.equal(h.element('authEmail').value,'ficticio@example.com');
  assert.equal(h.element('authPassword').value,'');assert.equal(h.element('authConfirmPassword').value,'');
  assert.match(h.messages.at(-1).text,/Administrador.*aprovar/);
});
test('conta criada com falha no envio pode recuperar confirmação pelo login',async()=>{
  const h=harness();h.sandbox.firebaseAuthRequest=async method=>{if(method==='accounts:signUp')return{idToken:'ficticio'};throw Object.assign(Error('Cota'),{code:'QUOTA_EXCEEDED'});};
  await h.sandbox.registerWithEmail();assert.equal(h.sandbox.authViewMode,'login');assert.match(h.messages.at(-1).text,/conta foi criada/);
  assert.match(h.messages.at(-1).text,/Use Entrar/);assert.equal(h.stored.length,0);
});
test('login não verificado envia verificação e não inicia sessão BC2',async()=>{
  const h=harness(),calls=[];
  h.sandbox.firebaseAuthRequest=async(method,payload)=>{calls.push({method,payload});if(method==='accounts:signInWithPassword')return{idToken:'ficticio'};if(method==='accounts:lookup')return{users:[{emailVerified:false}]};return{};};
  await h.sandbox.loginWithEmail();assert.equal(calls.at(-1).payload.requestType,'VERIFY_EMAIL');assert.equal(h.stored.length,0);assert.equal(h.boots(),0);
});
test('conta verificada continua entrando pelo fluxo de aprovação existente',async()=>{
  const h=harness();
  h.sandbox.firebaseAuthRequest=async method=>method==='accounts:signInWithPassword'?{idToken:'ficticio',refreshToken:'refresh-ficticio'}:{users:[{emailVerified:true}]};
  await h.sandbox.loginWithEmail();assert.equal(h.stored.length,1);assert.equal(h.boots(),1);
});
test('formulário preserva login antigo e exige confirmação somente no cadastro',()=>{
  const h=harness();h.sandbox.openAuthForm('request');
  assert.equal(h.element('authPassword').required,true);assert.equal(h.element('authPassword').minLength,12);assert.equal(h.element('authConfirmPassword').required,true);
  h.sandbox.openAuthForm('login');assert.equal(h.element('authPassword').minLength,6);assert.equal(h.element('authConfirmPassword').required,false);assert.equal(h.element('authConfirmPasswordField').hidden,true);
  h.sandbox.openAuthForm('confirm-link');assert.equal(h.element('authPassword').required,false);assert.equal(h.element('authName').required,true);
});
test('duplo envio do formulário não cria duas contas',async()=>{
  const h=harness();let calls=0,release;
  const hold=new Promise(resolve=>{release=resolve;});
  h.sandbox.registerWithEmail=async()=>{calls++;await hold;};
  const first=h.sandbox.submitAuthForm({preventDefault(){}}),second=h.sandbox.submitAuthForm({preventDefault(){}});
  release();await Promise.all([first,second]);assert.equal(calls,1);assert.equal(h.element('authSubmitButton').disabled,false);
});
test('cadastro novo não persiste senha ou token no navegador e não usa EMAIL_SIGNIN',()=>{
  assert.doesNotMatch(registrationSource,/localStorage|sessionStorage|EMAIL_SIGNIN|sendSignInLinkToEmail/);
  assert.doesNotMatch(segment('async function registerWithEmail() {','async function finishEmailLinkSignIn('),/setItem|storeFirebaseSession|bootSecureApp/);
});
