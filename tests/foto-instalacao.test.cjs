const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function loadModule(name) { const context={module:{exports:{}},setTimeout,clearTimeout,isSecureContext:true};vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve(name),'utf8'),context);return {api:context.module.exports,context}; }
const photo=loadModule('../site/scanner-photo.js');
const {createScanner, frameCanvas, codesOnly} = photo.api;
const {createInstaller, instructions} = loadModule('../site/install-app.js').api;
test('biblioteca incluída realmente decodifica imagens sintéticas de QR, EAN-13 e Code128',()=>{
 const {zxing,qr,ean,code128}=require('./fixtures/codes.cjs');const decoder=new (zxing().BrowserMultiFormatReader)();
 assert.equal(decoder.decodeFromCanvas(qr()).getText(),'BC2-TESTE-QR-123');assert.equal(decoder.decodeFromCanvas(ean()).getText(),'2000000000015');
 assert.equal(decoder.decodeFromCanvas(code128()).getText(),'FICTICIO-123');
});
function harness(options={}) {
 const events=[], elements=new Map(), codes=[];
 function node(id='') { return {id,hidden:true,disabled:false,value:'',style:{},width:600,height:300,readyState:4,videoWidth:1920,videoHeight:1080,children:[],
  getContext(){return{drawImage(){events.push('photo');}};},pause(){events.push('pause');},async play(){events.push('play');},prepend(){},appendChild(child){this.children.push(child);},replaceChildren(){this.children=[];},addEventListener(type,fn){this[type]=fn;},focus(){}}; }
 const get=id=>{if(!elements.has(id))elements.set(id,node(id));return elements.get(id);};
 const doc={getElementById:get,createElement:()=>node(),body:{classList:{add(){},remove(){}}},addEventListener(type,fn){this[type]=fn;}};
 const track={stop(){events.push('stop');},getCapabilities:()=>({}),applyConstraints:async()=>{}};
 const stream={getTracks:()=>[track],getVideoTracks:()=>[track]};
 let allowed=true;
 const scanner=createScanner({document:doc,navigator:{mediaDevices:{getUserMedia:options.getUserMedia||(async()=>stream)}},canUse:()=>allowed,onReadStart:()=>events.push('new-read'),onCode:(code,source)=>codes.push({code,source}),decode:options.decode||(async()=>{events.push('decode');return['BC2-TESTE-123'];}),loadFile:options.loadFile||(async()=>node())});
 return {scanner,events,codes,get,doc,stream,node,deny:()=>{allowed=false;}};
}
test('a câmera aguarda o botão de foto; todas as trilhas param antes de decodificar',async()=>{
 const h=harness();await h.scanner.start();assert(!h.events.includes('decode'));assert(!h.get('scannerCapture').disabled);
 await h.scanner.capture();assert(h.events.indexOf('stop')>h.events.indexOf('photo'));assert(h.events.indexOf('stop')<h.events.indexOf('decode'));
 assert.equal(h.get('scannerVideo').srcObject,null);assert(h.get('scannerFullscreen').hidden);assert.deepEqual(h.codes,[{code:'BC2-TESTE-123',source:'camera'}]);
});
test('sair enquanto o aparelho ainda pede permissão encerra uma câmera autorizada depois',async()=>{
 let resolve;const h=harness({getUserMedia:()=>new Promise(r=>resolve=r)});const started=h.scanner.start();h.scanner.stop();resolve(h.stream);await started;
 assert(h.events.includes('stop'));assert(!h.events.includes('play'));assert(!h.get('startScanner').disabled);
});
test('foto da galeria usa o mesmo leitor, não abre câmera e permite selecionar novamente o mesmo arquivo',async()=>{
 const h=harness(),input={files:[{name:'teste.png'}],value:'teste.png'};await h.scanner.upload(input);
 assert.equal(input.value,'');assert(!h.events.includes('play'));assert.deepEqual(h.codes,[{code:'BC2-TESTE-123',source:'photo'}]);assert(!h.get('scannerPhotoResult').hidden);
 h.scanner.clearPhoto();assert(h.get('scannerPhotoResult').hidden);assert.equal(h.get('scannerPhotoPreview').width,0);
});
test('cancelar a escolha de arquivo não altera o código anterior',async()=>{
 const h=harness();await h.scanner.upload({files:[],value:''});assert.equal(h.codes.length,0);assert(!h.events.includes('decode'));
});

test('nova foto invalida o resultado anterior antes da leitura; cancelar o seletor preserva o resultado',async()=>{
 const h=harness({decode:async()=>[]});
 await h.scanner.upload({files:[],value:''});assert(!h.events.includes('new-read'));
 await h.scanner.upload({files:[{}],value:'foto'});assert.equal(h.events.filter(e=>e==='new-read').length,1);assert.equal(h.codes.length,0);
 const app=fs.readFileSync(require.resolve('../site/app.js'),'utf8');
 assert.match(app,/onReadStart:[\s\S]*?barcodeLookupSequence\+\+[\s\S]*?getElementById\('barcodeInput'\)\.value = ''[\s\S]*?getElementById\('barcodeResult'\)\.replaceChildren\(\)/);
});
test('imagem sem código ou inválida oferece nova foto/entrada manual e nunca inventa resultado',async()=>{
 for(const options of [{decode:async()=>[]},{loadFile:async()=>{throw Error('Foto inválida');}}]){
  const h=harness(options);await h.scanner.upload({files:[{}],value:'foto'});assert.equal(h.codes.length,0);assert(!h.get('scannerPhotoButton').disabled);assert(h.get('scannerStatus').textContent);
 }
});
test('dois códigos exigem escolha explícita e códigos duplicados são reunidos',async()=>{
 const h=harness({decode:async()=>['123','456','123']});await h.scanner.upload({files:[{}],value:'foto'});
 assert.equal(h.codes.length,0);assert.equal(h.get('scannerCodeChoices').children.length,2);
 h.get('scannerCodeChoices').children[1].click();assert.deepEqual(h.codes,[{code:'456',source:'photo'}]);
});
test('sair da tela ou perder acesso invalida uma decodificação ainda em andamento',async()=>{
 let finish,began;const started=new Promise(r=>began=r);const h=harness({decode:()=>new Promise(r=>{finish=r;began();})});const loading=h.scanner.upload({files:[{}],value:'foto'});await started;h.scanner.stop();h.deny();finish(['NAO-USAR']);await loading;assert.equal(h.codes.length,0);
});
test('captura respeita zoom digital e limita a resolução sem esticar a foto',()=>{
 let args;const canvas={getContext:()=>({drawImage(...a){args=a;}})};
 frameCanvas({},4000,2000,2,{createElement:()=>canvas});assert.equal(canvas.width,2000);assert.equal(canvas.height,1000);assert.deepEqual(args.slice(1,5),[1000,500,2000,1000]);
 assert.deepEqual(Array.from(codesOnly([' 123 ','123','','x'.repeat(513)])),['123']);
});
test('sem câmera, com permissão negada ou sem HTTPS, o usuário continua com alternativa por foto',async()=>{
 for(const name of ['NotAllowedError','NotFoundError']){
  const h=harness({getUserMedia:async()=>{throw Object.assign(Error('Erro'),{name});}});await h.scanner.start();assert(h.get('scannerFullscreen').hidden);assert(!h.get('startScanner').disabled);assert.match(h.get('scannerStatus').textContent,/foto/);
 }
 photo.context.isSecureContext=false;const h=harness();await h.scanner.start();assert.match(h.get('scannerStatus').textContent,/HTTPS/);photo.context.isSecureContext=true;
});
function installerHarness() {
 const doc={createElement:()=>({})};const button={addEventListener(){}};const steps={ownerDocument:doc,children:[],replaceChildren(){this.children=[];},appendChild(child){this.children.push(child);}};
 const help={open:false,showModal(){this.open=true;}},feedback={};let installed=false;
 const installer=createInstaller({button,steps,help,feedback,navigator:{userAgent:'Android'},standalone:()=>installed});
 return {installer,button,steps,help,feedback,setInstalled:()=>{installed=true;}};
}
test('instalar mostra instruções quando não há convite automático; iPhone tem orientação própria',async()=>{
 const h=installerHarness();await h.installer.install();assert(h.help.open);assert.equal(h.steps.children.length,3);
 assert.match(instructions({userAgent:'iPhone'}).join(' '),/Safari.*Compartilhar.*Tela de Início/);
 assert.match(instructions({platform:'MacIntel',maxTouchPoints:5}).join(' '),/Safari/);
});
test('convite de instalação só é usado ao clicar e uma única vez',async()=>{
 const h=installerHarness();let calls=0;h.installer.offered({preventDefault(){},prompt:async()=>calls++,userChoice:Promise.resolve({outcome:'dismissed'})});assert.equal(calls,0);
 await h.installer.install();assert.equal(calls,1);assert.match(h.feedback.textContent,/cancelada/);await h.installer.install();assert.equal(calls,1);assert(h.help.open);
 h.installer.installed();assert(h.button.disabled);assert.equal(h.button.textContent,'Aplicativo instalado');
});
test('download fica nas configurações pessoais; entrada não contém instalação, contatos ou opções LGPD',()=>{
 const html=fs.readFileSync(require.resolve('../site/index.html'),'utf8');const gate=html.slice(html.indexOf('<div id="accessGate"'),html.indexOf('<dialog id="installAppHelp"'));
 assert.doesNotMatch(gate,/mailto:|wa.me|authSupportLinks|LGPD|installAppButton|Fazer download do aplicativo/i);assert.doesNotMatch(html,/LGPD|ANPD|privacy-notice/i);assert.match(html,/id="support"/);
 const settings=html.slice(html.indexOf('<section id="personalSettings"'),html.indexOf('</section>',html.indexOf('<section id="personalSettings"')));
 assert.match(settings,/id="installAppButton"/);assert.match(settings,/Fazer download do aplicativo/);assert.equal((html.match(/id="installAppButton"/g)||[]).length,1);
});
