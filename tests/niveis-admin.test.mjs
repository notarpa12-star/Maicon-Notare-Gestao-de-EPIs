import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { updateManagedUser, isProtectedOwner } from '../worker.mjs';

const env={ADMIN_EMAIL:'owner@example.com'};
const ownerId='admin-owner@example.com';
const owner={id:ownerId,is_admin:true};
const actor={id:ownerId,email:'owner@example.com',display_name:'Principal Fictício'};
function setup(options={}) {
  const sql=new DatabaseSync(':memory:');
  sql.exec(fs.readFileSync(new URL('../migrations/0001_initial.sql',import.meta.url),'utf8'));
  sql.exec(fs.readFileSync(new URL('../migrations/0002_personal_settings.sql',import.meta.url),'utf8'));
  for(const [id,name,admin] of [['bc2-admin','Administrador',1],['operator','Operador',0],['manager','Gestor',0]])sql.prepare('INSERT INTO roles VALUES (?,?,?,?,?,?)').run(id,name,'{}',admin,'2026-11-06','2026-11-06');
  for(const [id,email,name,role,status] of [[ownerId,'owner@example.com','Principal Fictício','bc2-admin','active'],['a2','admin2@example.com','Administrador Fictício','bc2-admin','active'],['p1','pessoa@example.com','Pessoa Fictícia','operator','active'],['pending','pendente@example.com','Solicitante Fictício',null,'pending']])sql.prepare('INSERT INTO users (id,email,display_name,role_id,status,requested_at,firebase_uid) VALUES (?,?,?,?,?,?,?)').run(id,email,name,role,status,'2026-11-06','uid-'+id);
  const DB={prepare(text){
    const statement=sql.prepare(text);
    function bound(args){return{
      first:async()=>statement.get(...args)||null,
      all:async()=>({results:statement.all(...args)}),
      run:async()=>{if(options.beforeRun)options.beforeRun(text,sql);const result=statement.run(...args);return{meta:{changes:Number(result.changes)}};}
    };}
    return{...bound([]),bind:(...args)=>bound(args)};
  }};
  return {sql,DB,close:()=>sql.close(),request:(id,body,user=owner,acting=actor)=>updateManagedUser(DB,user,acting,'Administrador',env,id,body)};
}
test('Administrador pode trocar o nível de outro Administrador, preservando dados e auditoria',async()=>{
  const h=setup();try{
    const before=h.sql.prepare('SELECT data_json FROM app_state').get().data_json;
    const response=await h.request('a2',{status:'active',role_id:'operator',display_name:'Administrador Fictício'});
    assert.equal(response.status,200);assert.equal(h.sql.prepare('SELECT role_id FROM users WHERE id=?').get('a2').role_id,'operator');
    assert.equal(h.sql.prepare('SELECT role_id FROM users WHERE id=?').get(ownerId).role_id,'bc2-admin');
    assert.equal(h.sql.prepare('SELECT data_json FROM app_state').get().data_json,before);
    const event=h.sql.prepare('SELECT * FROM audit_log').get();assert.equal(event.actor_user_id,ownerId);
    assert.equal(JSON.parse(event.changes_json).find(c=>c.field==='nível').after,'Operador');
    assert.equal(h.sql.prepare('SELECT firebase_uid FROM users WHERE id=?').get('a2').firebase_uid,'uid-a2');
  }finally{h.close();}
});
test('ninguém altera o nível ou suspende a conta principal, inclusive outro Administrador',async()=>{
  const h=setup();try{
    for(const body of [{status:'active',role_id:'operator'},{status:'suspended'},{status:'rejected'}]){
      const response=await h.request(ownerId,body,{id:'a2',is_admin:true},{id:'a2',email:'admin2@example.com'});assert.equal(response.status,403);
    }
    assert.equal(h.sql.prepare('SELECT role_id,status FROM users WHERE id=?').get(ownerId).status,'active');
    assert.equal(h.sql.prepare('SELECT COUNT(*) AS n FROM audit_log').get().n,0);
  }finally{h.close();}
});
test('Administrador também não pode alterar seu próprio nível',async()=>{
  const h=setup();try{
    const response=await h.request('a2',{status:'active',role_id:'operator'},{id:'a2',is_admin:true},{id:'a2',email:'admin2@example.com'});
    assert.equal(response.status,403);assert.match((await response.json()).error,/próprio nível/);
  }finally{h.close();}
});
test('proteção principal usa ID estável e acompanha mudança de e-mail',async()=>{
  const h=setup();try{
    h.sql.prepare('UPDATE users SET email=? WHERE id=?').run('novo-owner@example.com',ownerId);
    const response=await h.request(ownerId,{status:'active',role_id:'operator'},{id:'a2',is_admin:true},{id:'a2',email:'admin2@example.com'});
    assert.equal(response.status,403);assert(isProtectedOwner({id:ownerId,email:'novo-owner@example.com'},env));
    assert.equal(isProtectedOwner({id:'outra-conta',email:'owner@example.com'},env),false);
  }finally{h.close();}
});
test('salvar nome da própria conta continua permitido sem mudar nível',async()=>{
  const h=setup();try{
    assert.equal((await h.request(ownerId,{status:'active',role_id:'bc2-admin',display_name:'Novo Nome Fictício'})).status,200);
    const saved=h.sql.prepare('SELECT display_name,role_id FROM users WHERE id=?').get(ownerId);
    assert.equal(saved.display_name,'Novo Nome Fictício');assert.equal(saved.role_id,'bc2-admin');
  }finally{h.close();}
});
test('gestor com permissão de usuários não rebaixa nem promove Administradores',async()=>{
  const h=setup();try{
    const manager={id:'gestor',is_admin:false,permissions:{users:{view:true,manage:true}}};
    assert.equal((await h.request('a2',{status:'active',role_id:'operator'},manager)).status,403);
    assert.equal((await h.request('p1',{status:'active',role_id:'bc2-admin'},manager)).status,403);
    assert.equal((await h.request('p1',{status:'active',role_id:'manager'},manager)).status,200);
  }finally{h.close();}
});
test('pessoa sem autorização não gerencia acesso',async()=>{
  const h=setup();try{assert.equal((await h.request('p1',{status:'active',role_id:'manager'},{id:'p1',is_admin:false,permissions:{}})).status,403);}finally{h.close();}
});
test('último Administrador não é removido por uma solicitação concorrente com privilégios antigos',async()=>{
  const h=setup();try{
    h.sql.prepare('UPDATE users SET role_id=? WHERE id=?').run('operator',ownerId);
    const response=await h.request('a2',{status:'active',role_id:'operator'});
    assert.equal(response.status,409);assert.equal(h.sql.prepare('SELECT role_id FROM users WHERE id=?').get('a2').role_id,'bc2-admin');
  }finally{h.close();}
});
test('mudança concorrente de nível recusa uma gravação baseada na situação antiga',async()=>{
  let intervened=false;
  const h=setup({beforeRun:(text,sql)=>{if(!intervened && text.startsWith('UPDATE users SET display_name=')){intervened=true;sql.prepare('UPDATE users SET role_id=? WHERE id=?').run('manager','a2');}}});
  try{const response=await h.request('a2',{status:'active',role_id:'operator'});assert.equal(response.status,409);assert.equal(h.sql.prepare('SELECT role_id FROM users WHERE id=?').get('a2').role_id,'manager');assert.equal(h.sql.prepare('SELECT COUNT(*) AS n FROM audit_log').get().n,0);}finally{h.close();}
});
test('aprovação continua exigindo nível existente e situação válida',async()=>{
  const h=setup();try{
    for(const body of [{status:'active'},{status:'active',role_id:'inexistente'},{status:'invalida',role_id:'operator'}])assert.equal((await h.request('pending',body)).status,400);
  }finally{h.close();}
});
