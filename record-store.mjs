// Registros independentes; D1 batch é uma transação. A cópia legada nunca é apagada.
export const RECORD_SCHEMA = [
 `CREATE TABLE IF NOT EXISTS bc2_store_meta (id INTEGER PRIMARY KEY CHECK(id=1),generation TEXT NOT NULL,revision INTEGER NOT NULL,info_json TEXT NOT NULL,last_change_id TEXT,migrated_at TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS bc2_records (generation TEXT NOT NULL,collection TEXT NOT NULL,record_id TEXT NOT NULL CHECK(length(record_id)>0),data_json TEXT NOT NULL CHECK(json_valid(data_json)),version INTEGER NOT NULL,deleted INTEGER NOT NULL DEFAULT 0,sort_order INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(generation,collection,record_id))`,
 `CREATE TABLE IF NOT EXISTS bc2_commits (operation_id TEXT PRIMARY KEY,actor_id TEXT NOT NULL,fingerprint TEXT NOT NULL,response_json TEXT NOT NULL,created_at TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS bc2_imports (id TEXT PRIMARY KEY,actor_id TEXT NOT NULL,base_revision INTEGER NOT NULL,purpose TEXT NOT NULL,status TEXT NOT NULL,manifest_json TEXT NOT NULL,info_json TEXT NOT NULL,created_at TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS bc2_import_chunks (import_id TEXT NOT NULL,chunk INTEGER NOT NULL,fingerprint TEXT NOT NULL,PRIMARY KEY(import_id,chunk))`,
 `CREATE TRIGGER IF NOT EXISTS bc2_legacy_frozen BEFORE UPDATE ON app_state WHEN EXISTS(SELECT 1 FROM bc2_store_meta WHERE id=1) BEGIN SELECT RAISE(ABORT,'BC2 atualizado: recarregue o aplicativo. Cópia anterior preservada.'); END`,
 `CREATE TRIGGER IF NOT EXISTS bc2_legacy_no_delete BEFORE DELETE ON app_state WHEN EXISTS(SELECT 1 FROM bc2_store_meta WHERE id=1) BEGIN SELECT RAISE(ABORT,'Cópia anterior protegida.'); END`
];
export function createRecordStore({json,hasPermission,fieldChanges,COLLECTIONS}) {
 const keys=Object.keys(COLLECTIONS),encoder=new TextEncoder();
 const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
 const conflict=()=>json({error:'Este registro mudou em outro aparelho. Recarregue os dados e confira antes de repetir.',conflict:true},409);
 const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(JSON.stringify(value))))).map(n=>n.toString(16).padStart(2,'0')).join('');
 function validateRecord(collection,data){
  if(!keys.includes(collection)||!data||typeof data!=='object'||Array.isArray(data))fail('Registro inválido.');
  const id=data[collection==='productCatalog'?'barcode':'id'];
  if(typeof id!=='string'||!id.trim()||id.length>512)fail('Identificação do registro inválida.');
  if(collection==='epiFolders'&&(typeof data.name!=='string'||!data.name.trim()||data.name.length>100||/[\x00-\x1f\x7f]/.test(data.name)))fail('Nome de pasta inválido (1 a 100 caracteres).');
  if(encoder.encode(JSON.stringify(data)).length>1400000)fail('Um registro individual excede 1,4 MB. Divida esse cadastro.',413);
  return id;
 }
 async function ensure(DB){
  let meta;
  try{meta=await DB.prepare('SELECT * FROM bc2_store_meta WHERE id=1').first();}
  catch(error){if(!/no such table/i.test(error.message))throw error;await DB.batch(RECORD_SCHEMA.map(sql=>DB.prepare(sql)));}
  if(meta)return meta;
  // Todas as coleções e o marcador são copiados juntos, ou nada é migrado.
  const statements=keys.map(collection=>DB.prepare(`INSERT INTO bc2_records(generation,collection,record_id,data_json,version,sort_order)
    SELECT 'legacy-v1',?,json_extract(j.value,?),j.value,1,CAST(j.key AS INTEGER) FROM app_state s,json_each(s.data_json,?) j
    WHERE s.id=1 AND NOT EXISTS(SELECT 1 FROM bc2_store_meta WHERE id=1)`)
    .bind(collection,collection==='productCatalog'?'$.barcode':'$.id','$.'+collection));
  statements.push(DB.prepare(`INSERT INTO bc2_store_meta(id,generation,revision,info_json,migrated_at)
    SELECT 1,'legacy-v1',revision,json_object('suggestionsAdded',json(COALESCE(json_extract(data_json,'$.suggestionsAdded'),'[]')),'version',COALESCE(json_extract(data_json,'$.version'),1)),datetime('now')
    FROM app_state WHERE id=1 AND NOT EXISTS(SELECT 1 FROM bc2_store_meta WHERE id=1)`));
  await DB.batch(statements);
  meta=await DB.prepare('SELECT * FROM bc2_store_meta WHERE id=1').first();
  if(!meta)fail('A migração não foi concluída. Os dados anteriores foram preservados.',503);
  return meta;
 }
 function audit(DB,actor,roleName,changeId,event){
  let budget=0;const changes=[];
  for(const change of event.changes||[]){
   const summarized={...change};
   for(const side of ['before','after']){const encoded=JSON.stringify(summarized[side]);if(encoded?.length>8000)summarized[side]={resumo:'Conteúdo extenso: consulte o cadastro ou backup.',caracteres:encoded.length};}
   budget+=JSON.stringify(summarized).length;
   if(budget>150000){changes.push({field:'outros campos',after:'Detalhes extensos resumidos; cópia do registro preservada nas rotinas de backup.'});break;}
   changes.push(summarized);
  }
  return DB.prepare(`INSERT INTO audit_log(id,occurred_at,actor_user_id,actor_name,actor_email,actor_role,action,area,record_id,description,changes_json)
   SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM bc2_store_meta WHERE id=1 AND last_change_id=?)`)
   .bind(crypto.randomUUID(),new Date().toISOString(),actor.id,actor.display_name||actor.email,actor.email,roleName,event.action,event.area,event.id,event.description||event.id,JSON.stringify(changes),changeId);
 }
 async function meta(DB){const m=await ensure(DB);return json({storage:'records-v1',generation:m.generation,revision:m.revision,info:JSON.parse(m.info_json)});}
 async function page(DB,user,url){
  const collection=url.searchParams.get('collection');
  if(!keys.includes(collection))fail('Coleção inválida.');
  if(!hasPermission(user,COLLECTIONS[collection],'view'))fail('Sem permissão para consultar esta área.',403);
  const m=await ensure(DB),revision=Number(url.searchParams.get('revision'));
  if(revision!==m.revision||url.searchParams.get('generation')!==m.generation)return conflict();
  const after=url.searchParams.get('after')||'';
  const rows=await DB.prepare('SELECT record_id,data_json,version,sort_order FROM bc2_records WHERE generation=? AND collection=? AND deleted=0 AND record_id>? ORDER BY record_id LIMIT 100').bind(m.generation,collection,after).all();
  // Limita bytes por página, além do número de registros.
  let size=0;const selected=[];
  for(const row of rows.results||[]){if(selected.length&&size+row.data_json.length>350000)break;selected.push(row);size+=row.data_json.length;}
  const end=await DB.prepare('SELECT revision,generation FROM bc2_store_meta WHERE id=1').first();
  if(end.revision!==m.revision||end.generation!==m.generation)return conflict();
  return json({revision:m.revision,records:selected.map(r=>({data:JSON.parse(r.data_json),version:r.version,order:r.sort_order})),next:selected.length===100||selected.length<(rows.results||[]).length?selected.at(-1).record_id:null});
 }
 async function change(DB,user,actor,roleName,body){
  if(typeof body.operationId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(body.operationId)||!Array.isArray(body.changes)||!body.changes.length||body.changes.length>100)fail('Lote de alterações inválido (máximo de 100 registros).');
  const seen=new Set();
  for(const op of body.changes){
   if(!keys.includes(op.collection)||typeof op.id!=='string'||!op.id||!Number.isSafeInteger(op.version)||op.version<0||!['put','delete'].includes(op.action))fail('Alteração inválida.');
   if(op.action==='put'&&validateRecord(op.collection,op.data)!==op.id)fail('A identificação não corresponde ao registro.');
   const key=JSON.stringify([op.collection,op.id]);if(seen.has(key))fail('Registro repetido no lote.');seen.add(key);
   const permission=op.action==='delete'?'delete':op.version===0?'create':'edit';
   if(!hasPermission(user,COLLECTIONS[op.collection],'view')||!hasPermission(user,COLLECTIONS[op.collection],permission))fail('Sem permissão para esta alteração.',403);
  }
  const fingerprint=await digest(body),previous=await DB.prepare('SELECT * FROM bc2_commits WHERE operation_id=?').bind(body.operationId).first();
  if(previous){if(previous.actor_id!==actor.id||previous.fingerprint!==fingerprint)fail('Identificador de envio já utilizado.',409);return json(JSON.parse(previous.response_json));}
  for(let attempt=0;attempt<4;attempt++){
   const m=await ensure(DB);if(body.generation!==m.generation)return conflict();
   const reads=await DB.batch(body.changes.map(op=>DB.prepare('SELECT data_json,version,deleted FROM bc2_records WHERE generation=? AND collection=? AND record_id=?').bind(m.generation,op.collection,op.id)));
   const rows=reads.map(r=>r.results?.[0]);
   if(body.changes.some((op,i)=>op.version===0?rows[i]&&!rows[i].deleted:!rows[i]||rows[i].deleted||rows[i].version!==op.version)){
    const replay=await DB.prepare('SELECT * FROM bc2_commits WHERE operation_id=?').bind(body.operationId).first();
    if(replay&&replay.actor_id===actor.id&&replay.fingerprint===fingerprint)return json(JSON.parse(replay.response_json));
    return conflict();
   }
   const changeId=crypto.randomUUID(),revision=m.revision+1;
   const versions=body.changes.map((op,i)=>({collection:op.collection,id:op.id,version:(rows[i]?.version||0)+1,deleted:op.action==='delete'}));
   const response={saved:true,revision,changed:body.changes.length,versions,refreshRequired:body.baseRevision!==m.revision};
   const guard='EXISTS(SELECT 1 FROM bc2_store_meta WHERE id=1 AND last_change_id=?)';
   const statements=[DB.prepare('UPDATE bc2_store_meta SET revision=revision+1,last_change_id=? WHERE id=1 AND revision=? AND generation=?').bind(changeId,m.revision,m.generation)];
   body.changes.forEach((op,i)=>{
    statements.push(DB.prepare(`INSERT INTO bc2_records(generation,collection,record_id,data_json,version,deleted,sort_order) SELECT ?,?,?,?,?,?,(SELECT COALESCE(MAX(sort_order)+1,0) FROM bc2_records WHERE generation=? AND collection=?) WHERE ${guard}
      ON CONFLICT(generation,collection,record_id) DO UPDATE SET data_json=excluded.data_json,version=excluded.version,deleted=excluded.deleted`)
     .bind(m.generation,op.collection,op.id,JSON.stringify(op.action==='delete'?{}:op.data),versions[i].version,op.action==='delete'?1:0,m.generation,op.collection,changeId));
    const before=rows[i]&&!rows[i].deleted?JSON.parse(rows[i].data_json):null;
    statements.push(audit(DB,actor,roleName,changeId,{action:op.action==='delete'?'excluiu':before?'editou':'criou',area:COLLECTIONS[op.collection],id:op.id,description:op.data?.name||before?.name||op.id,changes:fieldChanges(before,op.action==='delete'?null:op.data)}));
   });
   statements.push(DB.prepare(`INSERT INTO bc2_commits(operation_id,actor_id,fingerprint,response_json,created_at) SELECT ?,?,?,?,? WHERE ${guard}`).bind(body.operationId,actor.id,fingerprint,JSON.stringify(response),new Date().toISOString(),changeId));
   let result;
   try{result=await DB.batch(statements);}catch(error){
    const committed=await DB.prepare('SELECT * FROM bc2_commits WHERE operation_id=?').bind(body.operationId).first();
    if(committed&&committed.actor_id===actor.id&&committed.fingerprint===fingerprint)return json(JSON.parse(committed.response_json));throw error;
   }
   if(result[0]?.meta?.changes)return json(response);
   const committed=await DB.prepare('SELECT * FROM bc2_commits WHERE operation_id=?').bind(body.operationId).first();
   if(committed&&committed.actor_id===actor.id&&committed.fingerprint===fingerprint)return json(JSON.parse(committed.response_json));
  }
  return json({error:'Há muitas alterações simultâneas. Aguarde e tente novamente.',conflict:true},409);
 }
 async function startImport(DB,user,actor,body){
  if(!user.is_admin)fail('Somente um Administrador pode importar.',403);
  if(!['restore','initial'].includes(body.purpose)||!keys.every(k=>Number.isSafeInteger(body.counts?.[k])&&body.counts[k]>=0)||!Number.isInteger(body.chunks)||body.chunks<0)fail('Manifesto de backup inválido.');
  const m=await ensure(DB);if(body.revision!==m.revision)return conflict();
  if(body.purpose==='initial'){
   const count=await DB.prepare('SELECT COUNT(*) AS n FROM bc2_records WHERE generation=? AND deleted=0').bind(m.generation).first();
   if(m.revision!==0||count.n)fail('O banco já tem dados. Importação inicial bloqueada.',409);
  }
  const info={suggestionsAdded:Array.isArray(body.info?.suggestionsAdded)?body.info.suggestionsAdded:[],version:1},id=crypto.randomUUID();
  await DB.prepare('INSERT INTO bc2_imports VALUES(?,?,?,?,?,?,?,?)').bind(id,actor.id,m.revision,body.purpose,'open',JSON.stringify({counts:body.counts,chunks:body.chunks}),JSON.stringify(info),new Date().toISOString()).run();
  return json({id});
 }
 async function getImport(DB,user,actor,id){
  if(!user.is_admin)fail('Somente um Administrador pode importar.',403);
  const item=await DB.prepare('SELECT * FROM bc2_imports WHERE id=? AND actor_id=?').bind(id,actor.id).first();
  if(!item)fail('Importação não encontrada.',404);return item;
 }
 async function importChunk(DB,user,actor,id,body){
  const item=await getImport(DB,user,actor,id),manifest=JSON.parse(item.manifest_json);
  if(!Number.isInteger(body.chunk)||body.chunk<0||body.chunk>=manifest.chunks||!Array.isArray(body.records)||!body.records.length||body.records.length>100)fail('Parte do backup inválida.');
  const fingerprint=await digest(body),old=await DB.prepare('SELECT fingerprint FROM bc2_import_chunks WHERE import_id=? AND chunk=?').bind(id,body.chunk).first();
  if(old){if(old.fingerprint!==fingerprint)fail('Esta parte já foi enviada com outro conteúdo.',409);return json({ok:true});}
  if(item.status!=='open')fail('Importação já encerrada.',409);
  const statements=body.records.map((record,index)=>{
   const recordId=validateRecord(record.collection,record.data);
   return DB.prepare(`INSERT INTO bc2_records(generation,collection,record_id,data_json,version,sort_order) SELECT ?,?,?,?,1,? WHERE EXISTS(SELECT 1 FROM bc2_imports WHERE id=? AND status='open')`).bind(id,record.collection,recordId,JSON.stringify(record.data),body.chunk*100+index,id);
  });
  statements.push(DB.prepare(`INSERT INTO bc2_import_chunks SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM bc2_imports WHERE id=? AND status='open')`).bind(id,body.chunk,fingerprint,id));
  try{const result=await DB.batch(statements);if(!result.at(-1)?.meta?.changes)fail('A importação foi encerrada.',409);}
  catch(error){const current=await DB.prepare('SELECT fingerprint FROM bc2_import_chunks WHERE import_id=? AND chunk=?').bind(id,body.chunk).first();if(!current||current.fingerprint!==fingerprint)throw error;}
  return json({ok:true});
 }
 async function finishImport(DB,user,actor,roleName,id){
  const item=await getImport(DB,user,actor,id),m=await ensure(DB);
  if(item.status==='committed')return json({saved:true,revision:item.base_revision+1});
  if(item.status!=='open'||item.base_revision!==m.revision)return conflict();
  const manifest=JSON.parse(item.manifest_json),changeId=crypto.randomUUID();
  const countChecks=keys.map(k=>`(SELECT COUNT(*) FROM bc2_records WHERE generation=? AND collection='${k}' AND deleted=0)=?`);
  const params=keys.flatMap(k=>[id,manifest.counts[k]]);
  const update=DB.prepare(`UPDATE bc2_store_meta SET generation=?,revision=revision+1,info_json=?,last_change_id=? WHERE id=1 AND revision=?
   AND EXISTS(SELECT 1 FROM bc2_imports WHERE id=? AND status='open') AND (SELECT COUNT(*) FROM bc2_import_chunks WHERE import_id=?)=? AND ${countChecks.join(' AND ')}`)
   .bind(id,item.info_json,changeId,item.base_revision,id,id,manifest.chunks,...params);
  const result=await DB.batch([update,
   DB.prepare("UPDATE bc2_imports SET status='committed' WHERE id=? AND EXISTS(SELECT 1 FROM bc2_store_meta WHERE last_change_id=?)").bind(id,changeId),
   audit(DB,actor,roleName,changeId,{action:item.purpose==='initial'?'migrou dados iniciais':'restaurou banco',area:'reports',id,description:'Backup recebido em partes e ativado integralmente; cópia anterior preservada.',changes:[{field:'registros',after:manifest.counts},{field:'cópia anterior',after:m.generation}]})]);
  if(!result[0]?.meta?.changes)return json({error:'Importação incompleta ou banco alterado. Os registros atuais foram preservados.',conflict:true},409);
  return json({saved:true,revision:m.revision+1});
 }
 return {ensure,meta,page,change,startImport,importChunk,finishImport,validateRecord};
}
