import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
export const tabs=['dashboard','epis','scanner','employees','movements','inspections','reports','audit','users'];
export const actions=['view','create','edit','delete','export','manage'];
export const full=Object.fromEntries(tabs.map(tab=>[tab,Object.fromEntries(actions.map(action=>[action,true]))]));
export const actor={id:'admin-owner@example.com',email:'owner@example.com',display_name:'Principal Fictício',is_admin:true};
export function fixture(){
 const sql=new DatabaseSync(':memory:');
 sql.exec(fs.readFileSync(new URL('../../migrations/0001_initial.sql',import.meta.url),'utf8'));
 sql.exec(fs.readFileSync(new URL('../../migrations/0002_personal_settings.sql',import.meta.url),'utf8'));
 for(const [id,name,permissions,isAdmin] of [['bc2-admin','Administrador',full,1],['operador','Operador',{epis:{view:true}},0]])sql.prepare('INSERT INTO roles VALUES (?,?,?,?,?,?)').run(id,name,JSON.stringify(permissions),isAdmin,'2026-11-06','2026-11-06');
 for(const [id,email,name,role] of [[actor.id,actor.email,actor.display_name,'bc2-admin'],['pessoa','pessoa@example.com','Pessoa Fictícia','operador']])sql.prepare('INSERT INTO users (id,email,display_name,role_id,status,requested_at) VALUES (?,?,?,?,?,?)').run(id,email,name,role,'active','2026-11-06');
 const DB={prepare(text){const bound=args=>({_text:text,_args:args,first:async()=>sql.prepare(text).get(...args)||null,all:async()=>({results:sql.prepare(text).all(...args)}),run:async()=>({meta:{changes:Number(sql.prepare(text).run(...args).changes)}})});return{...bound([]),bind:(...args)=>bound(args)};},
  async batch(statements){sql.exec('BEGIN IMMEDIATE');try{const results=[];for(const statement of statements){const query=sql.prepare(statement._text);results.push(query.columns().length?{results:query.all(...statement._args)}:{meta:{changes:Number(query.run(...statement._args).changes)}});}sql.exec('COMMIT');return results;}catch(error){sql.exec('ROLLBACK');throw error;}}
 };
 return{sql,DB,close:()=>sql.close()};
}
