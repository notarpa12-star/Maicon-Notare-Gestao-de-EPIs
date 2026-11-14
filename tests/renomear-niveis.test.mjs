import test from 'node:test';
import assert from 'node:assert/strict';
import { saveManagedRole } from '../worker.mjs';
import { fixture,actor,full } from './fixtures/access-db.mjs';
const save=(h,body,user=actor)=>saveManagedRole(h.DB,user,actor,'Administrador',body);
test('renomeia nível comum sem trocar vínculos, usuários ou estoque; audita nome anterior e novo',async()=>{
 const h=fixture();try{
  const before=h.sql.prepare('SELECT data_json FROM app_state').get().data_json;
  assert.equal((await save(h,{id:'operador',name:'Almoxarifado',permissions:{epis:{view:true}}})).status,200);
  assert.equal(h.sql.prepare('SELECT name FROM roles WHERE id=?').get('operador').name,'Almoxarifado');
  assert.equal(h.sql.prepare('SELECT role_id FROM users WHERE id=?').get('pessoa').role_id,'operador');
  assert.equal(h.sql.prepare('SELECT data_json FROM app_state').get().data_json,before);
  const changes=JSON.parse(h.sql.prepare('SELECT changes_json FROM audit_log').get().changes_json);
  assert.deepEqual(changes.find(c=>c.field==='name'),{field:'name',before:'Operador',after:'Almoxarifado'});
 }finally{h.close();}
});
test('renomeia Administrador mantendo ID, permissões totais e principal',async()=>{
 const h=fixture();try{
  const before=h.sql.prepare('SELECT * FROM roles WHERE id=?').get('bc2-admin');
  assert.equal((await save(h,{id:'bc2-admin',name:'Direção',permissions:full})).status,200);
  const after=h.sql.prepare('SELECT * FROM roles WHERE id=?').get('bc2-admin');
  assert.equal(after.name,'Direção');assert.equal(after.is_admin,1);assert.equal(after.permissions_json,before.permissions_json);
  assert.equal(h.sql.prepare('SELECT role_id FROM users WHERE id=?').get(actor.id).role_id,'bc2-admin');
 }finally{h.close();}
});
test('servidor recusa mudar permissões do Administrador durante renomeação',async()=>{
 const h=fixture();try{
  assert.equal((await save(h,{id:'bc2-admin',name:'Sem proteção',permissions:{}})).status,400);
  assert.equal(h.sql.prepare('SELECT name FROM roles WHERE id=?').get('bc2-admin').name,'Administrador');
 }finally{h.close();}
});
test('gestor delegado não renomeia Administrador; pessoa sem gerência não edita níveis',async()=>{
 const h=fixture();try{
  assert.equal((await save(h,{id:'bc2-admin',name:'Direção',permissions:full},{id:'gestor',permissions:{users:{manage:true}}})).status,403);
  assert.equal((await save(h,{id:'operador',name:'Outro',permissions:{}},{id:'comum',permissions:{users:{view:true}}})).status,403);
 }finally{h.close();}
});
test('criação gera novo ID sem substituir nível existente ou atribuir pessoas automaticamente',async()=>{
 const h=fixture();try{
  const response=await save(h,{name:'Conferente',permissions:{epis:{edit:true}}});assert.equal(response.status,200);
  const {id}=await response.json();assert.notEqual(id,'operador');
  const created=h.sql.prepare('SELECT * FROM roles WHERE id=?').get(id);
  assert.equal(created.name,'Conferente');assert.equal(created.is_admin,0);assert.equal(JSON.parse(created.permissions_json).epis.view,true);
  assert.equal(h.sql.prepare('SELECT COUNT(*) AS n FROM users WHERE role_id=?').get(id).n,0);
 }finally{h.close();}
});
test('editar ID inexistente não cria nível por engano; nome vazio ou longo é rejeitado',async()=>{
 const h=fixture();try{
  for(const [body,status] of [[{id:'removido',name:'Outro',permissions:{}},404],[{name:' ',permissions:{}},400],[{name:'a'.repeat(81),permissions:{}},400]])assert.equal((await save(h,body)).status,status);
  assert.equal(h.sql.prepare('SELECT COUNT(*) AS n FROM roles').get().n,2);
 }finally{h.close();}
});
