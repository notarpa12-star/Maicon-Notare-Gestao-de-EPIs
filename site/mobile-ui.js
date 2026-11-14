(function(root){
 'use strict';
 const paths={dashboard:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',epis:'M4 7h16v14H4z M3 3h18v4H3z M9 11h6',scanner:'M3 8V3h5 M16 3h5v5 M21 16v5h-5 M8 21H3v-5 M7 8v8 M10 8v8 M14 8v8 M17 8v8',employees:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8a4 4 0 0 0 0-8 M18 8a3 3 0 0 1 0 6 M22 21v-2a4 4 0 0 0-3-3',movements:'M3 7h15 M14 3l4 4-4 4 M21 17H6 M10 13l-4 4 4 4',inspections:'M9 4h6v4H9z M9 6H5v15h14V6h-4 M8 14l3 3 5-6',reports:'M5 3h10l4 4v14H5z M14 3v5h5 M9 17v-4 M13 17v-7 M17 17v-5',support:'M4 13v-2a8 8 0 0 1 16 0v2 M4 12H2v7h4v-7z M20 12h2v7h-4v-7z M18 19c0 3-3 3-6 3',users:'M12 3l8 4v6c0 5-8 9-8 9S4 18 4 13V7z M9 12l2 2 4-4',audit:'M5 3h14v18H5z M9 7h6 M9 12h6 M9 17h4',personal:'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2 M12 2a4 4 0 1 0 0 8a4 4 0 0 0 0-8'};
 const labels={dashboard:'Visão geral',epis:'Estoque de EPIs',scanner:'Leitor de código',employees:'Colaboradores',movements:'Entregas e movimentações',inspections:'Inspeções e testes',reports:'Relatórios e backup',support:'Contatos e suporte',users:'Usuários e níveis',audit:'Log do site',personal:'Minha conta'};
 function available(user,nav){return user?nav.filter(item=>!item.hidden).map(item=>item.tab).filter(tab=>Object.hasOwn(labels,tab)):[];}
 if(typeof module==='object'&&module.exports){module.exports={available,labels};return;}
 const viewport=matchMedia('(max-width: 760px)');
 const el=id=>document.getElementById(id);
 let routing=false,readyOnce=false;
 const active=()=>Boolean(typeof secureSession!=='undefined'&&secureSession?.status==='active'&&secureSession?.user&&el('accessGate').hidden);
 const isMobile=()=>viewport.matches;
 const icon=key=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+paths[key]+'"/></svg>';
 function allowed(){return available(active(),Array.from(document.querySelectorAll('#nav button[data-tab]')).map(button=>({tab:button.dataset.tab,hidden:button.hidden})));}
 function closeMenu(){el('mobileMenu').hidden=true;el('mobileMenuTrigger').setAttribute('aria-expanded','false');}
 function title(text){el('mobilePageTitle').textContent=text.replace(/ \| BC2$/,'');}
 function subpage(text){if(!isMobile()||!active())return;document.body.classList.remove('mobile-home');el('mobileHome').hidden=true;el('mobilePageBar').hidden=false;title(text||document.title);closeMenu();}
 function renderTiles(){
  const tiles=allowed();tiles.push('personal');
  el('mobileTiles').innerHTML=tiles.map(tab=>'<button type="button" class="mobile-tile" data-mobile-tab="'+tab+'">'+icon(tab)+'<span>'+labels[tab]+'</span></button>').join('');
  el('mobileMenuLinks').innerHTML=tiles.map(tab=>'<button type="button" data-mobile-tab="'+tab+'">'+icon(tab)+'<span>'+labels[tab]+'</span></button>').join('');
  const name=secureSession.user.display_name||'';el('mobileGreeting').textContent=name?'Olá, '+name.split(' ')[0]:'Bem-vindo ao BC2';
 }
 function showHome(){
  if(!active()||!isMobile())return;
  if(typeof stopScanner==='function')stopScanner();
  for(const id of ['currentPassword','newPersonalPassword','confirmPersonalPassword','emailChangeCurrentPassword'])if(el(id))el(id).value='';
  document.body.classList.remove('personal-settings-page','users-access-page','epi-folder-page');
  document.body.classList.add('mobile-home');el('mobileHome').hidden=false;el('mobilePageBar').hidden=true;
  el('mobileHeader').hidden=false;document.title='Início | BC2';closeMenu();window.scrollTo(0,0);
 }
 function writeRoute(hash,push){if(location.hash===hash)return;history[push?'pushState':'replaceState']({bc2Mobile:true},'',location.pathname+location.search+hash);}
 function home(push=true){if(!active()||!isMobile())return;writeRoute('#inicio',push);showHome();}
 function openTab(tab){
  if(!active()||!isMobile())return;
  if(tab==='personal'){subpage('Minha conta');openPersonalSettings();return;}
  if(!allowed().includes(tab))return;
  writeRoute('#app/'+tab,true);routing=true;goTab(tab);routing=false;subpage(labels[tab]);
 }
 function onTab(tab){if(!isMobile()||!active()||routing)return;if(location.hash==='#inicio'){showHome();return;}writeRoute('#app/'+tab,true);subpage(labels[tab]||'BC2');}
 function syncRoute(){
  if(!active()||!isMobile())return;
  if(location.hash==='#inicio'){showHome();return;}
  const match=location.hash.match(/^#app\/([a-z]+)$/);
  if(match){if(!allowed().includes(match[1])){home(false);return;}routing=true;goTab(match[1]);subpage(labels[match[1]]);routing=false;return;}
  if(location.hash.startsWith('#estoque/pasta/')){if(typeof syncEpiFolderRoute==='function')syncEpiFolderRoute();subpage(document.title);return;}
  if(location.hash==='#configuracoes-pessoais'||location.hash.startsWith('#niveis-acesso')||location.hash.startsWith('#usuarios')){subpage(document.title);return;}
  home(false);
 }
 function syncAuth(){
  if(!isMobile())return;
  if(!el('authChoiceView').hidden&&!el('firebaseAuthControls').hidden)openAuthForm('login');
  el('mobileRequestAccess').hidden=el('authFormView').hidden||el('authFormTitle').textContent!=='Entrar';
 }
 function onGate(){readyOnce=false;document.body.classList.remove('mobile-home');el('mobileHome').hidden=true;el('mobileHeader').hidden=true;closeMenu();syncAuth();}
 function ready(){
  if(!isMobile()||!active()||root.BC2Connection?.blocked)return;
  document.body.classList.add('mobile-mode');el('mobileHeader').hidden=false;renderTiles();
  if(!readyOnce){readyOnce=true;syncRoute();}
 }
 function resize(){document.body.classList.toggle('mobile-mode',isMobile());if(isMobile()){ready();syncAuth();}else{document.body.classList.remove('mobile-home');closeMenu();readyOnce=false;}}
 function historyRoute(){if(!isMobile())return;routing=true;syncRoute();queueMicrotask(()=>{syncRoute();routing=false;});}
 function prepareHistory(){if(!isMobile())return;routing=true;queueMicrotask(()=>{syncRoute();routing=false;});}
 function labelTables(){
  document.querySelectorAll('main table:not(.permission-matrix)').forEach(table=>{
   const heads=Array.from(table.querySelectorAll('thead th')).map(th=>th.textContent.trim());
   table.querySelectorAll('tbody tr').forEach(row=>Array.from(row.children).forEach((cell,index)=>{if(cell.tagName==='TD'&&!cell.hasAttribute('colspan')){const text=heads[index]||'';if(cell.dataset.label!==text)cell.dataset.label=text;}}));
  });
 }
 el('mobileMenuTrigger').addEventListener('click',()=>{el('mobileMenu').hidden=false;el('mobileMenuTrigger').setAttribute('aria-expanded','true');el('mobileMenuClose').focus();});
 el('mobileMenuClose').addEventListener('click',()=>{closeMenu();el('mobileMenuTrigger').focus();});
 el('mobileBrand').addEventListener('click',()=>home());el('mobileGoHome').addEventListener('click',()=>home());
 el('mobileProfile').addEventListener('click',()=>openTab('personal'));
 el('mobileMenuHome').addEventListener('click',()=>home());
 document.addEventListener('click',event=>{const button=event.target.closest('[data-mobile-tab]');if(button)openTab(button.dataset.mobileTab);});
 document.addEventListener('keydown',event=>{if(el('mobileMenu').hidden)return;if(event.key==='Escape'){closeMenu();el('mobileMenuTrigger').focus();}if(event.key==='Tab'){const items=[...el('mobileMenu').querySelectorAll('button:not([hidden])')];if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1).focus();}else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0].focus();}}});
 window.addEventListener('popstate',historyRoute,true);window.addEventListener('hashchange',historyRoute,true);
 viewport.addEventListener('change',resize);
 window.addEventListener('bc2:online',()=>{ready();if(active()&&isMobile())syncRoute();});
 new MutationObserver(syncAuth).observe(el('authFormView'),{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(labelTables).observe(document.querySelector('main'),{childList:true,subtree:true});
 root.BC2Mobile={ready,onGate,onTab,onSubpage:subpage,syncAuth,prepareHistory};
 resize();labelTables();
})(typeof window==='object'?window:globalThis);
