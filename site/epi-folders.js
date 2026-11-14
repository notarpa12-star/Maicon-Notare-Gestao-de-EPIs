(function(root){
 'use strict';
 const clean=value=>String(value??'').trim();
 const key=value=>clean(value).normalize('NFC').toLocaleLowerCase('pt-BR');
 const nameOf=epi=>clean(epi.folder)||clean(epi.name)||'EPI sem nome';
 function list(database){
  const groups=new Map();
  for(const folder of database.epiFolders||[])if(clean(folder.name)&&!groups.has(key(folder.name)))groups.set(key(folder.name),{name:clean(folder.name),declared:true,items:[]});
  for(const epi of database.epis||[]){const name=nameOf(epi),k=key(name);if(!groups.has(k))groups.set(k,{name,declared:false,items:[]});groups.get(k).items.push(epi);}
  return [...groups.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR',{numeric:true}));
 }
 function totals(items){
  const result={par:0,unidade:0,legado:0};
  for(const epi of items){const qty=Number(epi.quantity);if(Number.isSafeInteger(qty)&&qty>0)result[epi.stockUnit==='par'?'par':epi.stockUnit==='unidade'?'unidade':'legado']+=qty;}
  return result;
 }
 function summary(items){
  const t=totals(items),parts=[];
  if(t.par)parts.push(`${t.par} ${t.par===1?'par':'pares'}`);
  if(t.unidade)parts.push(`${t.unidade} ${t.unidade===1?'unidade':'unidades'}`);
  if(t.legado)parts.push(`${t.legado} de unidade não definida`);
  return parts.join(' · ')||'0 disponíveis';
 }
 function matches(epi,search,folder=''){
  const term=key(search);return !term||[folder,epi.name,epi.size,epi.brand,epi.manufacturer,epi.model,epi.ca,epi.serial,epi.lot,epi.barcode,...(epi.units||[]).map(u=>u.code)].some(value=>key(value).includes(term));
 }
 function models(items){
  const groups=new Map();
  for(const epi of items){const identity=JSON.stringify([epi.name,epi.brand||epi.manufacturer,epi.model,epi.ca].map(key));if(!groups.has(identity))groups.set(identity,{name:clean(epi.name)||'EPI sem nome',sample:epi,items:[]});groups.get(identity).items.push(epi);}
  return [...groups.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(group=>({...group,items:group.items.toSorted((a,b)=>clean(a.size).localeCompare(clean(b.size),'pt-BR',{numeric:true,sensitivity:'base'}))}));
 }
 function validateName(value,folders){
  const name=clean(value).normalize('NFC');
  if(!name||name.length>100||/[\x00-\x1f\x7f]/.test(name))throw Error('Informe um nome de pasta com 1 a 100 caracteres.');
  if(folders.some(folder=>key(folder.name)===key(name)))throw Error('Já existe uma pasta com esse nome. Abra a pasta existente.');
  return name;
 }
 const route=name=>'#estoque/pasta/'+encodeURIComponent(clean(name));
 function fromRoute(hash){if(!hash.startsWith('#estoque/pasta/'))return '';try{return decodeURIComponent(hash.slice('#estoque/pasta/'.length));}catch{return '';}}
 const api={key,nameOf,list,totals,summary,matches,models,validateName,route,fromRoute};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.BC2Folders=api;
})(typeof window==='object'?window:globalThis);
