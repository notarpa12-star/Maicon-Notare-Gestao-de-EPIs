(function(root){
 'use strict';
 const collections={epiFolders:'epis',epis:'epis',employees:'employees',movements:'movements',inspections:'inspections',productCatalog:'scanner'};
 const clone=value=>JSON.parse(JSON.stringify(value));
 const key=(collection,id)=>JSON.stringify([collection,id]);
 const idOf=(collection,row)=>String(row[collection==='productCatalog'?'barcode':'id']);
 function diff(before,after){
  const changes=[];
  for(const collection of Object.keys(collections)){
   const old=new Map((before[collection]||[]).map(row=>[idOf(collection,row),row]));
   const next=new Map((after[collection]||[]).map(row=>[idOf(collection,row),row]));
   if(next.size!==(after[collection]||[]).length)throw Error('Há registros repetidos em '+collection+'.');
   for(const [id,data] of next)if(JSON.stringify(old.get(id))!==JSON.stringify(data))changes.push({collection,id,action:'put',data:clone(data)});
   for(const id of old.keys())if(!next.has(id))changes.push({collection,id,action:'delete'});
  }
  return changes;
 }
 function create(api,can){
  let baseline=null,generation='',knownRevision=0,versions=new Map();
  async function load(canApply=()=>true){
   for(let attempt=0;attempt<3;attempt++)try{
    const meta=await api('records/meta'),data={...meta.info},nextVersions=new Map();
    for(const [collection,tab] of Object.entries(collections)){
     data[collection]=[];if(!can(tab,'view'))continue;
     const rows=[];let after='';
     do{
      const query=new URLSearchParams({collection,generation:meta.generation,revision:String(meta.revision),after});
      const page=await api('records?'+query);rows.push(...page.records);after=page.next;
     }while(after);
     rows.sort((a,b)=>a.order-b.order);
     data[collection]=rows.map(row=>{nextVersions.set(key(collection,idOf(collection,row.data)),row.version);return row.data;});
    }
    const end=await api('records/meta');if(end.revision!==meta.revision||end.generation!==meta.generation)throw Object.assign(Error('O banco mudou durante a leitura.'),{status:409});
    if(!canApply())throw Object.assign(Error('Uma edição local começou durante a atualização.'),{localEdit:true});
    baseline=clone(data);generation=meta.generation;knownRevision=meta.revision;versions=nextVersions;
    return{revision:meta.revision,data};
   }catch(error){if(error.status!==409||attempt===2)throw error;}
  }
  function plan(snapshot){
   if(!baseline)throw Error('Carregue os dados antes de salvar.');
   const changes=diff(baseline,snapshot);baseline=clone(snapshot);return changes;
  }
  async function commit(changes){
   if(!changes.length)return{saved:true,revision:knownRevision,changed:0};
   if(changes.length>100)throw Error('Esta operação altera mais de 100 registros. Use a importação de backup em partes para operações grandes.');
   const body={operationId:crypto.randomUUID(),generation,baseRevision:knownRevision,changes:changes.map(change=>({...change,version:versions.get(key(change.collection,change.id))||0}))};
   // Uma repetição com o mesmo identificador não duplica a entrada se a resposta se perder.
   let response;
   for(let attempt=0;attempt<2;attempt++)try{
    response=await api('records/change',{method:'POST',body:JSON.stringify(body)});break;
   }catch(error){if((error.status&&error.status<500)||attempt===1)throw error;}
   if(!response?.saved||!Number.isInteger(response.revision))throw Error('O banco central não confirmou a gravação.');
   knownRevision=response.revision;
   for(const row of response.versions||[])if(row.deleted)versions.delete(key(row.collection,row.id));else versions.set(key(row.collection,row.id),row.version);
   return response;
  }
  async function importData(data,revision,purpose){
   const counts={},chunks=[];let current=[],size=0;
   for(const collection of Object.keys(collections)){
    if(collection==='epiFolders'&&data[collection]===undefined)data={...data,epiFolders:[]};
    if(!Array.isArray(data[collection]))throw Error('Lista ausente no backup: '+collection);
    counts[collection]=data[collection].length;const ids=new Set();
    for(const row of data[collection]){
     const id=idOf(collection,row);if(!id||id==='undefined'||ids.has(id))throw Error('Identificação ausente ou repetida no backup.');ids.add(id);
     const record={collection,data:row},bytes=new TextEncoder().encode(JSON.stringify(record)).length;
     if(bytes>1400000)throw Error('Um registro individual excede 1,4 MB. Divida esse cadastro antes de importar.');
     if(current.length&&(current.length===100||size+bytes>1400000)){chunks.push(current);current=[];size=0;}
     current.push(record);size+=bytes;
    }
   }
   if(current.length)chunks.push(current);
   const started=await api('records/imports',{method:'POST',body:JSON.stringify({revision,purpose,counts,chunks:chunks.length,info:{suggestionsAdded:data.suggestionsAdded||[],version:1}})});
   for(let chunk=0;chunk<chunks.length;chunk++){
    const options={method:'POST',body:JSON.stringify({chunk,records:chunks[chunk]})};
    for(let attempt=0;attempt<2;attempt++)try{await api('records/imports/'+started.id+'/chunks',options);break;}catch(error){if(error.status&&error.status<500||attempt===1)throw error;}
   }
   for(let attempt=0;attempt<2;attempt++)try{await api('records/imports/'+started.id+'/finish',{method:'POST',body:'{}'});break;}catch(error){if(error.status&&error.status<500||attempt===1)throw error;}
   return load();
  }
  return{load,plan,commit,importData};
 }
 const api={create,diff,collections};if(typeof module==='object'&&module.exports)module.exports=api;else root.BC2Records=api;
})(typeof window==='object'?window:globalThis);
