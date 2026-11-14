import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker, { compareCollection, ensureAdmin, fieldChanges, hasPermission, readJson, verifyFirebaseToken, visibleState } from '../worker.mjs';

const sampleUser = {
  id: 'user-test', email: 'teste@example.com', display_name: 'Pessoa de Teste', is_admin: false,
  permissions: { epis: { view: true, edit: true }, movements: { view: true } },
};

test('cada nível só recebe os dados das abas permitidas', () => {
  const state = { epis: [{ id: 'epi-1' }], employees: [{ id: 'emp-1' }], movements: [], inspections: [], productCatalog: [{ barcode: '12345678' }] };
  const visible = visibleState(state, sampleUser);
  assert.equal(visible.epis.length, 1);
  assert.equal(visible.employees.length, 0);
  assert.equal(visible.productCatalog.length, 0);
});

test('edições autorizadas informam exatamente os campos alterados', () => {
  const oldRows = [{ id: 'epi-1', name: 'Capacete teste', quantity: 3, notes: 'informação reservada' }];
  const nextRows = [{ id: 'epi-1', name: 'Capacete teste', quantity: 4, notes: 'nova informação reservada' }];
  const result = compareCollection(oldRows, nextRows, 'epis', sampleUser, 'epis');
  assert.equal(result.merged[0].quantity, 4);
  assert.equal(result.audit[0].verb, 'editou');
  assert.deepEqual(result.audit[0].changes, [
    { field: 'quantity', before: 3, after: 4 },
    { field: 'notes', before: '[conteúdo oculto]', after: '[conteúdo oculto]' },
  ]);
});

test('o servidor bloqueia exclusão quando o nível não permite', () => {
  assert.throws(
    () => compareCollection([{ id: 'epi-1' }], [], 'epis', sampleUser, 'epis'),
    error => error instanceof Response && error.status === 403,
  );
});

test('dados não podem inventar o e-mail do usuário sem token Firebase', async () => {
  const request = new Request('https://bc2.example.workers.dev/api/session', {
    headers: { 'x-user-email': 'admin@example.com', authorization: 'Bearer token-inventado' },
  });
  const response = await worker.fetch(request, { FIREBASE_PROJECT_ID: 'bc2-test' }, {});
  assert.equal(response.status, 401);
});

test('token Firebase de outro projeto ou e-mail não confirmado é recusado', async () => {
  const enc = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = enc({ alg: 'RS256', kid: 'chave-ficticia' });
  const baseClaims = { iss: 'https://securetoken.google.com/bc2-test', aud: 'bc2-test', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000), sub: 'usuario-falso', email: 'teste@example.com' };
  const unverified = `${header}.${enc({ ...baseClaims, email_verified: false })}.assinatura-ficticia`;
  const wrongProject = `${header}.${enc({ ...baseClaims, email_verified: true, aud: 'outro-projeto' })}.assinatura-ficticia`;
  assert.equal(await verifyFirebaseToken(unverified, 'bc2-test'), null);
  assert.equal(await verifyFirebaseToken(wrongProject, 'bc2-test'), null);
});

test('token sem horários obrigatórios ou com sessão antiga é recusado', async () => {
  const enc = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = enc({ alg: 'RS256', kid: 'chave-ficticia' });
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: 'https://securetoken.google.com/bc2-test', aud: 'bc2-test', exp: now + 3600, iat: now, sub: 'usuario-falso', email: 'teste@example.com', email_verified: true };
  const missingAuthTime = `${header}.${enc(claims)}.assinatura-ficticia`;
  const oldSession = `${header}.${enc({ ...claims, auth_time: now - 13 * 3600 })}.assinatura-ficticia`;
  assert.equal(await verifyFirebaseToken(missingAuthTime, 'bc2-test'), null);
  assert.equal(await verifyFirebaseToken(oldSession, 'bc2-test'), null);
});

test('o servidor recusa pedidos de gravação vindos de outra origem', async () => {
  const request = new Request('https://bc2.example.workers.dev/api/state', {
    method: 'POST',
    headers: { origin: 'https://site-falso.example', 'content-type': 'application/json', authorization: 'Bearer token-falso' },
    body: '{}',
  });
  const response = await worker.fetch(request, { FIREBASE_PROJECT_ID: 'bc2-test' }, {});
  assert.equal(response.status, 403);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});

test('o navegador recebe uma regra que bloqueia JavaScript em atributos de evento', async () => {
  const response = await worker.fetch(new Request('https://bc2.example.workers.dev/'), {
    ASSETS: { fetch: async () => new Response('<!doctype html>', { headers: { 'content-type': 'text/html; charset=utf-8' } }) },
  }, {});
  const policy = response.headers.get('content-security-policy');
  assert.match(policy, /script-src-attr 'none'/);
  assert.doesNotMatch(policy, /script-src[^;]*'unsafe-inline'/);
  assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000');
});

test('o tamanho do JSON é limitado mesmo sem Content-Length', async () => {
  const request = new Request('https://bc2.example.workers.dev/api/state', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: 'x'.repeat(1500001),
  });
  await assert.rejects(readJson(request), error => error.status === 413);
});

test('o leitor de JSON rejeita listas e valores que não sejam objetos', async () => {
  for (const body of ['null', '[]', '"texto"', '12']) {
    const request = new Request('https://bc2.example.workers.dev/api/profile', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body,
    });
    await assert.rejects(readJson(request), error => error.status === 400);
  }
});

function fakeAdminDatabase(initialUsers = []) {
  const users = [...initialUsers];
  let createdUsers = 0;
  return {
    users,
    get createdUsers() { return createdUsers; },
    prepare(sql) {
      const first = async values => {
          if (sql.includes('FROM users WHERE id=?')) return users.find(row => row.id === values[0]) || null;
          if (sql.includes('FROM users WHERE email=? COLLATE NOCASE')) return users.find(row => row.email.toLowerCase() === values[0].toLowerCase()) || null;
          if (sql.includes('JOIN roles r ON r.id=u.role_id')) return users.find(row => row.role_id === 'bc2-admin' && row.firebase_uid) || null;
          return null;
      };
      const run = async values => {
          if (sql.includes('INSERT INTO users')) {
            createdUsers++;
            users.push({ id: values[0], email: values[1], firebase_uid: values.at(-1), status: 'active', role_id: 'bc2-admin' });
            return { meta: { changes: 1 } };
          }
          if (sql.includes('UPDATE users SET firebase_uid=?')) {
            const user = users.find(row => row.id === values[1]);
            if (user && !user.firebase_uid) user.firebase_uid = values[0];
          }
          return { meta: { changes: 1 } };
      };
      return { first: () => first([]), run: () => run([]), bind: (...values) => ({ first: () => first(values), run: () => run(values) }) };
    },
  };
}

test('o bootstrap inicial cria o Administrador somente na primeira configuração', async () => {
  const db = fakeAdminDatabase();
  await ensureAdmin(db, { email: 'admin@example.com', name: 'Admin', uid: 'uid-novo' }, { ADMIN_EMAIL: 'admin@example.com' });
  assert.equal(db.createdUsers, 1);
  assert.equal(db.users[0].firebase_uid, 'uid-novo');
});

test('reutilizar o e-mail antigo não cria outro Administrador após a conta original ser vinculada', async () => {
  const db = fakeAdminDatabase([{ id: 'legacy-admin', email: 'novo@example.com', firebase_uid: 'uid-original', status: 'active', role_id: 'bc2-admin' }]);
  await ensureAdmin(db, { email: 'admin@example.com', name: 'Outra pessoa', uid: 'uid-diferente' }, { ADMIN_EMAIL: 'admin@example.com' });
  assert.equal(db.createdUsers, 0);
  assert.equal(db.users.length, 1);
});

test('a migração das configurações pessoais preserva usuários e dados existentes', () => {
  const database = new DatabaseSync(':memory:');
  try {
    database.exec(fs.readFileSync(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8'));
    database.prepare(`INSERT INTO users (id,email,display_name,status,requested_at)
      VALUES ('user-test','teste@example.com','Pessoa de Teste','active','2026-11-04T00:00:00.000Z')`).run();
    const before = database.prepare('SELECT data_json FROM app_state WHERE id=1').get().data_json;
    database.exec(fs.readFileSync(new URL('../migrations/0002_personal_settings.sql', import.meta.url), 'utf8'));
    assert.equal(database.prepare('SELECT display_name FROM users WHERE id=?').get('user-test').display_name, 'Pessoa de Teste');
    assert.equal(database.prepare('SELECT firebase_uid FROM users WHERE id=?').get('user-test').firebase_uid, null);
    assert.equal(database.prepare('SELECT data_json FROM app_state WHERE id=1').get().data_json, before);
    database.prepare(`INSERT INTO user_preferences (user_id,theme,updated_at) VALUES (?,?,?)`)
      .run('user-test', 'aurora', '2026-11-05T00:00:00.000Z');
    assert.equal(database.prepare('SELECT theme FROM user_preferences WHERE user_id=?').get('user-test').theme, 'aurora');
    assert.throws(() => database.prepare(`INSERT INTO user_preferences (user_id,theme,updated_at) VALUES (?,?,?)`)
      .run('user-test', 'tema-inválido', '2026-11-05T00:00:00.000Z'));
  } finally { database.close(); }
});

test('o histórico SQL aceita novas entradas e bloqueia edição ou remoção', () => {
  const database = new DatabaseSync(':memory:');
  try {
    database.exec(fs.readFileSync(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8'));
    const initial = database.prepare('SELECT data_json FROM app_state WHERE id=1').get();
    assert.deepEqual(JSON.parse(initial.data_json).productCatalog, []);
    database.prepare(`INSERT INTO audit_log (id,occurred_at,actor_user_id,actor_name,actor_email,actor_role,action,area,record_id,description,changes_json)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run('event-1', '2026-11-04T00:00:00.000Z', 'user-test', 'Pessoa de Teste', 'teste@example.com', 'Operador', 'editou', 'epis', 'epi-1', 'Capacete teste', '[]');
    assert.throws(() => database.prepare("UPDATE audit_log SET description='alterado' WHERE id='event-1'").run());
    assert.throws(() => database.prepare("DELETE FROM audit_log WHERE id='event-1'").run());
  } finally { database.close(); }
});
