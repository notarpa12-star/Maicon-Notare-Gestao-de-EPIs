(function(root){
 'use strict';
 function createGuard({probe,onChange,online=()=>true}){
  let blocked=true,inFlight=null;
  const fail=()=>{blocked=true;onChange(true);};
  function check(){
   if(inFlight)return inFlight;
   inFlight=(async()=>{try{if(!online())throw Error('Sem internet');await probe();blocked=false;onChange(false);return true;}catch{fail();return false;}})().finally(()=>{inFlight=null;});
   return inFlight;
  }
  async function waitUntilReady(){if(inFlight)await inFlight;if(blocked)throw Object.assign(Error('Conecte-se à internet e confirme a conexão com o BC2 para continuar.'),{offline:true});}
  return{check,fail,waitUntilReady,get blocked(){return blocked;}};
 }
 if(typeof module==='object'&&module.exports){module.exports={createGuard};return;}
 const gate=document.getElementById('connectionGate');
 const guard=createGuard({online:()=>navigator.onLine!==false,
  probe:async()=>{
   // Consulta pública de conectividade, sem dados de conta e sem cache offline.
   const response=await fetch('/api/connection',{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(8000)});
   if(response.status!==200||!response.headers.get('content-type')?.includes('application/json')||(await response.json()).online!==true)throw Error('Servidor indisponível');
  },
  onChange:blocked=>{
   const reconnected=!blocked&&document.body.classList.contains('connection-blocked');
   document.body.classList.toggle('connection-blocked',blocked);gate.hidden=!blocked;
   for(const target of [document.querySelector('main'),document.querySelector('body > header'),document.getElementById('accessGate'),document.getElementById('mobileHeader'),document.getElementById('mobileMenu'),document.getElementById('modalBackdrop'),document.getElementById('scannerFullscreen')])if(target)target.inert=blocked;
   if(blocked&&typeof stopScanner==='function')stopScanner();
   if(blocked&&document.getElementById('installAppHelp')?.open)document.getElementById('installAppHelp').close();
   if(reconnected)window.dispatchEvent(new Event('bc2:online'));
  }});
 root.BC2Connection=guard;
 // Marca a navegação antes dos ouvintes legados do aplicativo, sem mudar o endereço.
 for(const type of ['popstate','hashchange'])window.addEventListener(type,()=>root.BC2Mobile?.prepareHistory());
 for(const type of ['click','submit'])document.addEventListener(type,event=>{if(guard.blocked&&!event.target.closest('#connectionGate')){event.preventDefault();event.stopImmediatePropagation();}},true);
 document.getElementById('connectionRetry').addEventListener('click',async()=>{
  const button=document.getElementById('connectionRetry');button.disabled=true;button.textContent='Verificando…';
  await guard.check();button.disabled=false;button.textContent='Tentar novamente';
 });
 window.addEventListener('offline',guard.fail);
 window.addEventListener('online',guard.check);
 window.addEventListener('focus',guard.check);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')guard.check();});
 setInterval(()=>{if(document.visibilityState==='visible')guard.check();},30000);
 guard.check();
})(typeof window==='object'?window:globalThis);
