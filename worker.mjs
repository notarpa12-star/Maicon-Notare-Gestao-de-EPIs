import { createRecordStore } from './record-store.mjs';
const COLLECTIONS = {
  epis: 'epis',
  epiFolders: 'epis',
  employees: 'employees',
  movements: 'movements',
  inspections: 'inspections',
  productCatalog: 'scanner',
};
const TABS = ['dashboard', 'epis', 'scanner', 'employees', 'movements', 'inspections', 'reports', 'audit', 'users'];
const ACTIONS = ['view', 'create', 'edit', 'delete', 'export', 'manage'];
const ADMIN_ROLE_ID = 'bc2-admin';
const EMPTY_STATE = { epiFolders: [], epis: [], employees: [], movements: [], inspections: [], productCatalog: [], suggestionsAdded: [], version: 1 };
let certsCache = { at: 0, keys: [] };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}
function normalizedEmail(value) { return String(value || '').trim().toLowerCase(); }
function safeJson(value, fallback) { try { return JSON.parse(value); } catch { return fallback; } }
function newId() { return crypto.randomUUID(); }
async function readJson(request) {
  const hintedLength = Number(request.headers.get('content-length') || 0);
  const maxBytes = 1500000;
  if (hintedLength > maxBytes) throw Object.assign(new Error('O arquivo enviado é grande demais.'), { status: 413 });
  const contentType = request.headers.get('content-type') || '';
  if (!/^application\/(?:[a-z0-9.+-]+\+)?json(?:\s*;|$)/i.test(contentType)) {
    throw Object.assign(new Error('Envie os dados no formato JSON.'), { status: 415 });
  }
  if (!request.body) throw Object.assign(new Error('A solicitação não contém dados.'), { status: 400 });
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        throw Object.assign(new Error('O arquivo enviado é grande demais.'), { status: 413 });
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw Object.assign(new Error('O conteúdo enviado não está codificado corretamente.'), { status: 400 }); }
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw Object.assign(new Error('O conteúdo enviado não é um JSON válido.'), { status: 400 }); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw Object.assign(new Error('Envie um objeto JSON válido.'), { status: 400 });
  }
  return parsed;
}
function adminPermissions() {
  return Object.fromEntries(TABS.map(tab => [tab, Object.fromEntries(ACTIONS.map(action => [action, true]))]));
}
function hasPermission(user, tab, action) {
  return Boolean(user.is_admin || user.permissions?.[tab]?.[action]);
}
function getUserRow(row) {
  return {
    id: row.id, email: row.email, display_name: row.display_name, status: row.status,
    role_id: row.role_id, role_name: row.role_name || '', is_admin: Boolean(row.is_admin),
    requested_at: row.requested_at, approved_at: row.approved_at,
  };
}
async function actorFor(request, env, ctx) {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || !env.FIREBASE_PROJECT_ID) return null;
  return await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID);
}
function decodeBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}
function decodeJwtPart(value) { return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))); }
async function firebaseKeys() {
  if (Date.now() - certsCache.at < 10 * 60 * 1000 && certsCache.keys.length) return certsCache.keys;
  const response = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com', { cf: { cacheTtl: 600, cacheEverything: true } });
  if (!response.ok) throw new Error('Não foi possível consultar a chave de validação do Firebase.');
  const data = await response.json();
  if (!Array.isArray(data.keys) || !data.keys.length) throw new Error('O Firebase não retornou chaves de validação.');
  certsCache = { at: Date.now(), keys: data.keys };
  return certsCache.keys;
}
async function verifyFirebaseToken(token, projectId) {
  try {
    if (typeof token !== 'string' || token.length < 1 || token.length > 16384) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const header = decodeJwtPart(parts[0]);
    const claims = decodeJwtPart(parts[1]);
    if (header.alg !== 'RS256' || !header.kid) return null;
    if (claims.iss !== `https://securetoken.google.com/${projectId}` || claims.aud !== projectId) return null;
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(claims.exp) || !Number.isFinite(claims.iat) || !Number.isFinite(claims.auth_time) ||
        claims.exp <= now || claims.iat > now + 60 || claims.auth_time > now + 60 ||
        claims.exp <= claims.iat || claims.auth_time > claims.iat + 60 || now - claims.auth_time > 12 * 60 * 60) return null;
    if (typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 128 || claims.email_verified !== true) return null;
    const jwk = (await firebaseKeys()).find(key => key.kid === header.kid);
    if (!jwk) { certsCache.at = 0; return null; }
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const verified = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', key, decodeBase64Url(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    if (!verified) return null;
    const email = normalizedEmail(claims.email);
    if (!email) return null;
    return { email, name: String(claims.name || '').trim(), uid: claims.sub, auth_time: claims.auth_time };
  } catch {
    return null;
  }
}
export async function ensureAdmin(db, actor, env) {
  const configured = normalizedEmail(env.ADMIN_EMAIL);
  if (!configured) return;
  const now = new Date().toISOString();
  await db.prepare(`INSERT OR IGNORE INTO roles (id, name, permissions_json, is_admin, created_at, updated_at)
    VALUES (?, 'Administrador', ?, 1, ?, ?)`)
    .bind(ADMIN_ROLE_ID, JSON.stringify(adminPermissions()), now, now).run();
  const id = `admin-${configured}`;
  let existing = await db.prepare('SELECT id,email,firebase_uid,status,role_id FROM users WHERE id=?').bind(id).first();
  let created = false;
  if (!existing && actor.email === configured) {
    // Do not promote a newly-created account just because it reuses the old admin email.
    const emailOwner = await db.prepare('SELECT id FROM users WHERE email=? COLLATE NOCASE').bind(configured).first();
    if (emailOwner) return;
    // A legacy admin row may have an older ID. If it has already been linked to Firebase,
    // never bootstrap a second administrator when someone later re-registers its old email.
    const establishedAdmin = await db.prepare(`SELECT u.id FROM users u JOIN roles r ON r.id=u.role_id
      WHERE r.is_admin=1 AND u.firebase_uid IS NOT NULL LIMIT 1`).first();
    if (establishedAdmin) return;
    await db.prepare(`INSERT INTO users (id, email, display_name, role_id, status, requested_at, approved_at, approved_by, firebase_uid)
      VALUES (?, ?, ?, ?, 'active', ?, ?, 'bootstrap', ?)`)
      .bind(id, configured, actor.name || configured.split('@')[0], ADMIN_ROLE_ID, now, now, actor.uid).run();
    existing = await db.prepare('SELECT id,email,firebase_uid,status,role_id FROM users WHERE id=?').bind(id).first();
    created = true;
  }
  if (!existing) return;
  if (!existing.firebase_uid && actor.email === configured) {
    await db.prepare('UPDATE users SET firebase_uid=? WHERE id=? AND firebase_uid IS NULL')
      .bind(actor.uid, id).run();
    existing = await db.prepare('SELECT id,email,firebase_uid,status,role_id FROM users WHERE id=?').bind(id).first();
  }
  if (existing.firebase_uid !== actor.uid) return;
  if (existing.status !== 'active' || existing.role_id !== ADMIN_ROLE_ID) {
    await db.prepare("UPDATE users SET role_id=?,status='active',approved_at=COALESCE(approved_at,?) WHERE id=?")
      .bind(ADMIN_ROLE_ID, now, existing.id).run();
    created = true;
  }
  if (created) {
    await db.prepare(`INSERT INTO audit_log (id,occurred_at,actor_user_id,actor_name,actor_email,actor_role,action,area,record_id,description,changes_json)
      VALUES (?,?,?,?,?,?,'criou conta Administradora','users',?,'Conta inicial configurada pelo proprietário',?)`)
      .bind(newId(), now, existing?.id || id, actor.name || configured.split('@')[0], configured, 'Administrador', existing?.id || id, JSON.stringify([{ field: 'nível', before: existing?.role_id || null, after: 'Administrador' }, { field: 'situação', before: existing?.status || null, after: 'active' }])).run();
  }
}
async function findUser(db, email) {
  return await db.prepare(`SELECT u.*, r.name AS role_name, r.permissions_json, r.is_admin
    FROM users u LEFT JOIN roles r ON r.id=u.role_id WHERE u.email=? COLLATE NOCASE`).bind(email).first();
}
async function currentUser(db, actor) {
  const row = await findUser(db, actor.email);
  if (!row || row.status !== 'active') return row ? { ...getUserRow(row), status: row.status } : null;
  return {
    ...getUserRow(row),
    is_admin: Boolean(row.is_admin),
    permissions: safeJson(row.permissions_json, {}),
  };
}
const records = createRecordStore({ json, hasPermission, fieldChanges, COLLECTIONS });
function visibleState(data, user) {
  const result = { ...EMPTY_STATE };
  for (const [key, tab] of Object.entries(COLLECTIONS)) {
    result[key] = hasPermission(user, tab, 'view') && Array.isArray(data[key]) ? data[key] : [];
  }
  result.suggestionsAdded = data.suggestionsAdded || [];
  result.version = data.version || 1;
  return result;
}
function compareCollection(oldList, newList, tab, user, area, idField = 'id') {
  const oldMap = new Map((oldList || []).map(item => [String(item[idField]), item]));
  const newMap = new Map((newList || []).map(item => [String(item[idField]), item]));
  const merged = [...(oldList || [])];
  const audit = [];
  const allow = { create: hasPermission(user, tab, 'create'), edit: hasPermission(user, tab, 'edit'), delete: hasPermission(user, tab, 'delete') };
  for (const [id, next] of newMap) {
    const prev = oldMap.get(id);
    if (!prev) {
      if (!allow.create) throw new Response('Você não tem permissão para cadastrar neste item.', { status: 403 });
      merged.push(next);
      audit.push(makeChange(area, id, 'criou', [], null, next));
      continue;
    }
    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      if (!allow.edit) throw new Response('Você não tem permissão para editar neste item.', { status: 403 });
      const changes = fieldChanges(prev, next);
      const index = merged.findIndex(item => String(item[idField]) === id);
      if (index >= 0) merged[index] = next;
      audit.push(makeChange(area, id, 'editou', changes, prev, next));
    }
  }
  for (const [id, prev] of oldMap) {
    if (!newMap.has(id)) {
      if (!allow.delete) throw new Response('Você não tem permissão para excluir neste item.', { status: 403 });
      const index = merged.findIndex(item => String(item[idField]) === id);
      if (index >= 0) merged.splice(index, 1);
      audit.push(makeChange(area, id, 'excluiu', [], prev, null));
    }
  }
  return { merged, audit };
}
function fieldChanges(oldValue, newValue) {
  const keys = new Set([...Object.keys(oldValue || {}), ...Object.keys(newValue || {})]);
  const changes = [];
  for (const field of keys) {
    if (JSON.stringify(oldValue?.[field]) === JSON.stringify(newValue?.[field])) continue;
    const sensitive = /password|token|secret|notes|observations/i.test(field);
    changes.push({ field, before: sensitive ? '[conteúdo oculto]' : (oldValue?.[field] ?? null), after: sensitive ? '[conteúdo oculto]' : (newValue?.[field] ?? null) });
  }
  return changes;
}
function makeChange(area, recordId, verb, changes, before, after) {
  const label = after?.name || before?.name || after?.code || before?.code || recordId;
  return { area, recordId, verb, label: String(label || recordId), changes };
}
function auditStatement(db, event, actor, roleName, committedChangeId) {
  return db.prepare(`INSERT INTO audit_log (id, occurred_at, actor_user_id, actor_name, actor_email, actor_role,
    action, area, record_id, description, changes_json)
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE EXISTS (SELECT 1 FROM app_state WHERE id=1 AND last_change_id=?)`)
    .bind(newId(), new Date().toISOString(), actor.id, actor.display_name || actor.email, actor.email, roleName,
      event.verb, event.area, event.recordId, event.label, JSON.stringify(event.changes), committedChangeId);
}
async function requireActive(db, actor, env) {
  await ensureAdmin(db, actor, env);
  let row = await findUser(db, actor.email);
  if (!row) {
    const existingIdentity = await db.prepare('SELECT id,email,status FROM users WHERE firebase_uid=?').bind(actor.uid).first();
    if (existingIdentity) return { response: json({ error: 'O e-mail do Firebase mudou, mas a conta BC2 ainda não foi sincronizada. Peça ajuda ao Administrador; não crie outro cadastro.' }, 409) };
    const now = new Date().toISOString();
    const id = newId();
    const inserted = await db.prepare(`INSERT OR IGNORE INTO users (id, email, display_name, status, requested_at)
      VALUES (?, ?, ?, 'pending', ?)`)
      .bind(id, actor.email, actor.name || '', now).run();
    if (inserted.meta?.changes) {
      await db.prepare('UPDATE users SET firebase_uid=? WHERE id=? AND firebase_uid IS NULL').bind(actor.uid, id).run();
    }
    row = await findUser(db, actor.email);
    if (inserted.meta?.changes) {
      await db.prepare(`INSERT INTO audit_log (id,occurred_at,actor_user_id,actor_name,actor_email,actor_role,action,area,record_id,description,changes_json)
        VALUES (?,?,?,?,?,'Solicitante','solicitou acesso','users',?,'Novo pedido de acesso aguardando aprovação',?)`)
        .bind(newId(), now, id, actor.name || actor.email, actor.email, row?.id || id, JSON.stringify([{ field: 'situação', before: null, after: 'pending' }])).run();
    }
    if (!row) return { response: json({ error: 'Não foi possível confirmar o pedido de acesso. Entre novamente.' }, 409) };
  }
  if (row.firebase_uid && row.firebase_uid !== actor.uid) return { response: json({ error: 'A conta autenticada não corresponde à identidade vinculada a este acesso.' }, 403) };
  if (!row.firebase_uid) {
    try { await db.prepare('UPDATE users SET firebase_uid=? WHERE id=? AND firebase_uid IS NULL').bind(actor.uid, row.id).run(); }
    catch { return { response: json({ error: 'A identidade desta conta está vinculada a outro usuário.' }, 403) }; }
    row = await findUser(db, actor.email);
    if (row?.firebase_uid !== actor.uid) return { response: json({ error: 'A identidade desta conta está vinculada a outro usuário.' }, 403) };
  }
  const user = row.status === 'active' ? {
    ...getUserRow(row), is_admin: Boolean(row.is_admin), permissions: safeJson(row.permissions_json, {})
  } : { ...getUserRow(row), status: row.status };
  if (user.status !== 'active') return { response: json({ status: user.status, email: actor.email }, user.status === 'pending' ? 200 : 403) };
  return { user };
}

export function isProtectedOwner(target, env) {
  const configured = normalizedEmail(env.ADMIN_EMAIL);
  // O identificador da conta inicial permanece igual mesmo após mudar de e-mail.
  return Boolean(configured && target?.id === `admin-${configured}`);
}
export async function updateManagedUser(DB, user, actor, roleName, env, id, body) {
  if (!(await requireAdmin(DB, user))) return json({ error: 'Sem permissão para gerenciar usuários.' }, 403);
  const target = await DB.prepare('SELECT u.*,r.is_admin,r.name AS role_name FROM users u LEFT JOIN roles r ON r.id=u.role_id WHERE u.id=?').bind(id).first();
  if (!target) return json({ error: 'Usuário não encontrado.' }, 404);
  const status = ['active', 'rejected', 'suspended', 'pending'].includes(body.status) ? body.status : '';
  if (!status) return json({ error: 'Situação inválida.' }, 400);
  const displayName = String(body.display_name ?? target.display_name ?? '').trim().slice(0, 120);
  const roleId = body.role_id || target.role_id;
  if (status === 'active' && !roleId) return json({ error: 'Escolha um nível antes de aprovar.' }, 400);
  const assignedRole = status === 'active' ? await DB.prepare('SELECT id,name,is_admin FROM roles WHERE id=?').bind(roleId).first() : null;
  if (status === 'active' && !assignedRole) return json({ error: 'O nível selecionado não existe.' }, 400);
  const changesAccess = status !== target.status || (status === 'active' && roleId !== target.role_id);
  if (changesAccess && isProtectedOwner(target, env)) return json({ error: 'O nível e o acesso da conta Administradora principal são protegidos.' }, 403);
  if (changesAccess && target.id === user.id) return json({ error: 'Você não pode alterar seu próprio nível ou remover seu próprio acesso.' }, 403);
  if ((target.is_admin || assignedRole?.is_admin) && !user.is_admin) return json({ error: 'Somente um Administrador pode gerenciar o acesso de outro Administrador.' }, 403);
  const losesAdmin = Boolean(target.is_admin && target.status === 'active' && (status !== 'active' || !assignedRole?.is_admin));
  const now = new Date().toISOString();
  // A verificação da última conta administradora faz parte da mesma instrução de gravação.
  // Também recusa alteração se o nível/situação tiver mudado desde a leitura acima.
  const changed = await DB.prepare(`UPDATE users SET display_name=?,role_id=?,status=?,approved_at=CASE WHEN ?='active' THEN COALESCE(approved_at,?) ELSE approved_at END,approved_by=?
    WHERE id=? AND role_id IS ? AND status=? AND
      (?=0 OR (SELECT COUNT(*) FROM users u JOIN roles r ON r.id=u.role_id WHERE u.status='active' AND r.is_admin=1)>1)`)
    .bind(displayName, status === 'active' ? roleId : target.role_id, status, status, now, actor.email, id, target.role_id, target.status, losesAdmin ? 1 : 0).run();
  if (!changed.meta?.changes) return json({ error: 'A conta mudou durante a alteração ou é a última Administradora ativa. Atualize a lista e tente novamente.' }, 409);
  await logAdminEvent(DB, actor, roleName, status === 'active' ? 'aprovou/alterou acesso' : status === 'suspended' ? 'removeu acesso' : 'recusou acesso', 'users', id,
    `${target.email} · ${status}`, [{ field: 'nome', before: target.display_name, after: displayName }, { field: 'nível', before: target.role_name || '', after: assignedRole?.name || target.role_name || '' }, { field: 'situação', before: target.status, after: status }]);
  return json({ ok: true });
}

export async function saveManagedRole(DB, user, actor, roleName, body) {
    if (!(await requireAdmin(DB, user))) return json({ error: 'Sem permissão para gerenciar níveis.' }, 403);
    const name = String(body.name || '').trim();
    if (!name || name.length > 80) return json({ error: 'Informe um nome de até 80 caracteres.' }, 400);
    if (!body.permissions || typeof body.permissions !== 'object') return json({ error: 'Matriz de permissões inválida.' }, 400);
    const permissions = {};
    for (const tab of TABS) {
      permissions[tab] = {};
      for (const action of ACTIONS) permissions[tab][action] = Boolean(body.permissions?.[tab]?.[action]);
      if (permissions[tab].create || permissions[tab].edit || permissions[tab].delete || permissions[tab].export || permissions[tab].manage) permissions[tab].view = true;
    }
    const roleId = body.id || newId();
    const existing = body.id ? await DB.prepare('SELECT id,is_admin,name,permissions_json FROM roles WHERE id=?').bind(body.id).first() : null;
    if (body.id && !existing) return json({ error: 'Nível não encontrado. Atualize a página.' }, 404);
    if (existing?.is_admin) {
      if (!user.is_admin) return json({ error: 'Somente um Administrador pode renomear o nível de administração total.' }, 403);
      const previous = safeJson(existing.permissions_json, {});
      if (TABS.some(tab => ACTIONS.some(action => Boolean(previous?.[tab]?.[action]) !== Boolean(permissions?.[tab]?.[action])))) return json({ error: 'As permissões totais deste nível são protegidas. Altere somente o nome.' }, 400);
      await DB.prepare('UPDATE roles SET name=?,updated_at=? WHERE id=? AND is_admin=1').bind(name, new Date().toISOString(), existing.id).run();
      await logAdminEvent(DB, actor, roleName, 'editou nível', 'users', existing.id, name, fieldChanges({ name: existing.name }, { name }));
      return json({ ok: true, id: existing.id });
    }
    const now = new Date().toISOString();
    await DB.prepare(`INSERT INTO roles (id,name,permissions_json,is_admin,created_at,updated_at) VALUES (?,?,?,0,?,?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name,permissions_json=excluded.permissions_json,updated_at=excluded.updated_at`)
      .bind(roleId, name, JSON.stringify(permissions), now, now).run();
    const roleChanges = existing
      ? fieldChanges({ name: existing.name, permissions: safeJson(existing.permissions_json, {}) }, { name, permissions })
      : [{ field: 'nível', before: null, after: { name, permissions } }];
    await logAdminEvent(DB, actor, roleName, existing ? 'editou nível' : 'criou nível', 'users', roleId, name, roleChanges);
    return json({ ok: true, id: roleId });
}

async function requireAdmin(db, user) {
  if (user.is_admin) return true;
  return hasPermission(user, 'users', 'manage');
}
async function logAdminEvent(db, actor, roleName, action, area, recordId, description, changes = []) {
  await db.prepare(`INSERT INTO audit_log (id, occurred_at, actor_user_id, actor_name, actor_email, actor_role,
    action, area, record_id, description, changes_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(newId(), new Date().toISOString(), actor.id, actor.display_name || actor.email, actor.email, roleName,
      action, area, recordId || '', description || '', JSON.stringify(changes)).run();
}
async function handleApi(request, env, ctx) {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') return json({ error: 'Origem da solicitação não permitida.' }, 403);
  if (origin && origin !== url.origin) return json({ error: 'Origem da solicitação não permitida.' }, 403);
  if (request.method !== 'GET' && origin !== url.origin) return json({ error: 'A origem da solicitação não foi confirmada.' }, 403);
  const actorInfo = await actorFor(request, env, ctx);
  if (!actorInfo) return json({ error: 'Entre com um e-mail verificado para acessar o BC2.' }, 401);
  const limit = await env.USER_API_LIMITER.limit({ key: `uid:${actorInfo.uid}` });
  if (!limit.success) {
    const response = json({ error: 'Muitas solicitações em pouco tempo. Aguarde um minuto e tente novamente.' }, 429);
    response.headers.set('retry-after', '60');
    return response;
  }
  const { DB } = env;
  if (!DB) return json({ error: 'O banco central ainda não foi ligado ao aplicativo.' }, 503);
  const path = url.pathname.replace(/^\/api\/?/, '');
  if (request.method === 'POST' && path === 'profile/email/complete') {
    await readJson(request);
    const pending = await DB.prepare('SELECT firebase_uid,user_id,old_email,new_email,requested_at,expires_at FROM pending_email_changes WHERE firebase_uid=? AND new_email=? COLLATE NOCASE')
      .bind(actorInfo.uid, actorInfo.email).first();
    if (!pending) {
      const otherPending = await DB.prepare('SELECT firebase_uid,new_email FROM pending_email_changes WHERE firebase_uid=?').bind(actorInfo.uid).first();
      if (otherPending) return json({ completed: false, awaitingConfirmation: true });
      return json({ completed: false });
    }
    if (Date.parse(pending.expires_at) <= Date.now()) return json({ error: 'A confirmação do novo e-mail expirou. Entre novamente no endereço antigo e solicite outra confirmação.', expired: true }, 409);
    const target = await DB.prepare('SELECT u.id,u.email,u.display_name,u.firebase_uid,u.status,r.name AS role_name FROM users u LEFT JOIN roles r ON r.id=u.role_id WHERE u.id=?')
      .bind(pending.user_id).first();
    if (!target || target.status !== 'active' || target.email.toLowerCase() !== pending.old_email.toLowerCase() || target.firebase_uid !== actorInfo.uid) {
      return json({ error: 'Não foi possível associar o novo e-mail à conta BC2. Procure o Administrador sem criar outro cadastro.' }, 403);
    }
    const collision = await DB.prepare('SELECT id FROM users WHERE email=? COLLATE NOCASE AND id<>?').bind(pending.new_email, target.id).first();
    if (collision) return json({ error: 'Este e-mail já está associado a outra conta BC2. Fale com o Administrador.' }, 409);
    const now = new Date().toISOString();
    const changes = JSON.stringify([{ field: 'e-mail', before: target.email, after: pending.new_email }]);
    const result = await DB.batch([
      DB.prepare('UPDATE users SET email=? WHERE id=? AND email=? COLLATE NOCASE AND firebase_uid=? AND status=\'active\'')
        .bind(pending.new_email, target.id, target.email, actorInfo.uid),
      DB.prepare(`INSERT INTO audit_log (id,occurred_at,actor_user_id,actor_name,actor_email,actor_role,action,area,record_id,description,changes_json)
        SELECT ?,?,?,?,?,?,'alterou o e-mail','profile',?,'E-mail confirmado pelo próprio usuário',?
        WHERE EXISTS (SELECT 1 FROM users WHERE id=? AND email=? COLLATE NOCASE AND firebase_uid=?)
          AND EXISTS (SELECT 1 FROM pending_email_changes WHERE firebase_uid=? AND user_id=? AND new_email=? COLLATE NOCASE)`)
        .bind(newId(), now, target.id, target.display_name || target.email, pending.new_email, target.role_name || '', target.id, changes, target.id, pending.new_email, actorInfo.uid, actorInfo.uid, target.id, pending.new_email),
      DB.prepare('DELETE FROM pending_email_changes WHERE firebase_uid=? AND user_id=? AND new_email=? COLLATE NOCASE')
        .bind(actorInfo.uid, target.id, pending.new_email),
    ]);
    if (!result[0]?.meta?.changes) return json({ error: 'A conta BC2 mudou durante a confirmação. Atualize a página e entre novamente.' }, 409);
    return json({ completed: true, email: pending.new_email });
  }
  const access = await requireActive(DB, actorInfo, env);
  if (access.response) return access.response;
  const user = access.user;
  const actorRow = await findUser(DB, actorInfo.email);
  const actor = { id: actorRow.id, email: actorRow.email, display_name: actorRow.display_name || actorInfo.name || actorInfo.email };
  const roleName = actorRow.role_name || '';
  if (request.method === 'GET' && path === 'session') {
    const preference = await DB.prepare('SELECT theme FROM user_preferences WHERE user_id=?').bind(actorRow.id).first();
    return json({ status: 'active', user: getUserRow(actorRow), permissions: user.permissions, theme: preference?.theme || 'bc2', revision: (await records.ensure(DB)).revision });
  }
  if (request.method === 'POST' && path === 'profile') {
    const body = await readJson(request);
    const hasName = Object.hasOwn(body, 'display_name');
    const hasTheme = Object.hasOwn(body, 'theme');
    if (!hasName && !hasTheme) return json({ error: 'Não há uma configuração para salvar.' }, 400);
    const displayName = hasName ? String(body.display_name ?? '').trim() : String(actorRow.display_name || '');
    const theme = hasTheme ? String(body.theme ?? '') : '';
    if (hasName && (!displayName || displayName.length > 120)) return json({ error: 'O nome precisa ter de 1 a 120 caracteres.' }, 400);
    if (hasTheme && !['bc2', 'light', 'black', 'aurora'].includes(theme)) return json({ error: 'Escolha um dos quatro temas disponíveis.' }, 400);
    const preference = await DB.prepare('SELECT theme FROM user_preferences WHERE user_id=?').bind(actorRow.id).first();
    const oldTheme = preference?.theme || 'bc2';
    const nextTheme = hasTheme ? theme : oldTheme;
    const changes = [];
    if (hasName && displayName !== actorRow.display_name) changes.push({ field: 'nome', before: actorRow.display_name, after: displayName });
    if (hasTheme && theme !== oldTheme) changes.push({ field: 'tema pessoal', before: oldTheme, after: theme });
    const statements = [];
    if (hasName) statements.push(DB.prepare('UPDATE users SET display_name=? WHERE id=? AND status=\'active\' AND firebase_uid=?').bind(displayName, actorRow.id, actorInfo.uid));
    if (hasTheme) statements.push(DB.prepare(`INSERT INTO user_preferences (user_id,theme,updated_at) VALUES (?,?,?)
      ON CONFLICT(user_id) DO UPDATE SET theme=excluded.theme,updated_at=excluded.updated_at`).bind(actorRow.id, theme, new Date().toISOString()));
    if (changes.length) statements.push(DB.prepare(`INSERT INTO audit_log (id,occurred_at,actor_user_id,actor_name,actor_email,actor_role,action,area,record_id,description,changes_json)
        VALUES (?,?,?,?,?,?,'alterou configurações pessoais','profile',?,'Alterou apenas seu próprio perfil',?)`)
        .bind(newId(), new Date().toISOString(), actor.id, actor.display_name || actor.email, actor.email, roleName, actor.id, JSON.stringify(changes)));
    if (statements.length) await DB.batch(statements);
    return json({ ok: true, user: { ...getUserRow({ ...actorRow, display_name: displayName }), theme: nextTheme } });
  }
  if (request.method === 'POST' && path === 'profile/email/request') {
    const body = await readJson(request);
    const newEmail = normalizedEmail(body.new_email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(newEmail) || newEmail.length > 254) return json({ error: 'Digite um novo e-mail válido.' }, 400);
    if (newEmail === actorInfo.email) return json({ error: 'O novo e-mail é igual ao endereço atual.' }, 400);
    if (Math.floor(Date.now() / 1000) - actorInfo.auth_time > 5 * 60) return json({ error: 'Confirme sua senha atual novamente antes de trocar o e-mail.' }, 401);
    const existing = await DB.prepare('SELECT id FROM users WHERE email=? COLLATE NOCASE').bind(newEmail).first();
    if (existing) return json({ error: 'Este e-mail já está associado a uma conta BC2.' }, 409);
    await DB.prepare('DELETE FROM pending_email_changes WHERE expires_at<=?').bind(new Date().toISOString()).run();
    const reserved = await DB.prepare('SELECT firebase_uid FROM pending_email_changes WHERE new_email=? COLLATE NOCASE AND firebase_uid<>?').bind(newEmail, actorInfo.uid).first();
    if (reserved) return json({ error: 'Este e-mail já está aguardando confirmação para outra conta.' }, 409);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const requestedAt = new Date().toISOString();
    const pendingChange = DB.prepare(`INSERT INTO pending_email_changes (firebase_uid,user_id,old_email,new_email,requested_at,expires_at)
      VALUES (?,?,?,?,?,?) ON CONFLICT(firebase_uid) DO UPDATE SET user_id=excluded.user_id,old_email=excluded.old_email,
      new_email=excluded.new_email,requested_at=excluded.requested_at,expires_at=excluded.expires_at`)
      .bind(actorInfo.uid, actorRow.id, actorRow.email, newEmail, requestedAt, expiresAt);
    const audit = DB.prepare(`INSERT INTO audit_log (id,occurred_at,actor_user_id,actor_name,actor_email,actor_role,action,area,record_id,description,changes_json)
      SELECT ?,?,?,?,?,?,'solicitou troca de e-mail','profile',?,'Aguardando confirmação no novo endereço',?
      WHERE EXISTS (SELECT 1 FROM pending_email_changes WHERE firebase_uid=? AND user_id=? AND new_email=? COLLATE NOCASE)`)
      .bind(newId(), requestedAt, actor.id, actor.display_name || actor.email, actor.email, roleName, actorRow.id,
        JSON.stringify([{ field: 'novo e-mail solicitado', before: null, after: newEmail }]), actorInfo.uid, actorRow.id, newEmail);
    await DB.batch([pendingChange, audit]);
    return json({ ok: true, expiresAt });
  }
  if (request.method === 'POST' && path === 'profile/email/cancel') {
    const now = new Date().toISOString();
    const audit = DB.prepare(`INSERT INTO audit_log (id,occurred_at,actor_user_id,actor_name,actor_email,actor_role,action,area,record_id,description,changes_json)
      SELECT ?,?,?,?,?,?,'cancelou troca de e-mail','profile',?,'Cancelou a confirmação pendente do novo endereço',?
      WHERE EXISTS (SELECT 1 FROM pending_email_changes WHERE firebase_uid=? AND user_id=? AND old_email=? COLLATE NOCASE)`)
      .bind(newId(), now, actor.id, actor.display_name || actor.email, actor.email, roleName, actorRow.id, '[]', actorInfo.uid, actorRow.id, actorInfo.email);
    const cancel = DB.prepare('DELETE FROM pending_email_changes WHERE firebase_uid=? AND user_id=? AND old_email=? COLLATE NOCASE')
      .bind(actorInfo.uid, actorRow.id, actorInfo.email);
    await DB.batch([audit, cancel]);
    return json({ ok: true });
  }
  if (path === 'records/meta' && request.method === 'GET') return records.meta(DB);
  if (path === 'records' && request.method === 'GET') return records.page(DB,user,url);
  if (path === 'records/change' && request.method === 'POST') { await records.ensure(DB); return records.change(DB,user,actor,roleName,await readJson(request)); }
  if (path === 'records/imports' && request.method === 'POST') return records.startImport(DB,user,actor,await readJson(request));
  const importPath=path.match(/^records\/imports\/([a-f0-9-]{36})\/(chunks|finish)$/);
  if (importPath && request.method === 'POST') {
    const body=await readJson(request);
    return importPath[2]==='chunks' ? records.importChunk(DB,user,actor,importPath[1],body) : records.finishImport(DB,user,actor,roleName,importPath[1]);
  }
  if (['state','admin/import','admin/migrate-local'].includes(path)) return json({error:'O BC2 foi atualizado para salvar por registro. Feche e reabra o site para continuar.',reload:true},426);
  if (path === 'admin/users' && request.method === 'GET') {
    if (!(await requireAdmin(DB, user)) || !hasPermission(user, 'users', 'view')) return json({ error: 'Sem permissão para consultar usuários.' }, 403);
    const rows = await DB.prepare(`SELECT u.id,u.email,u.display_name,u.status,u.role_id,u.requested_at,u.approved_at,r.name AS role_name,r.is_admin
      FROM users u LEFT JOIN roles r ON r.id=u.role_id ORDER BY CASE u.status WHEN 'pending' THEN 0 ELSE 1 END,u.requested_at DESC`).all();
    return json({ users: (rows.results || []).map(row => ({ ...getUserRow(row), is_protected: isProtectedOwner(row, env) })) });
  }
  if (path === 'admin/roles' && request.method === 'GET') {
    if (!(await requireAdmin(DB, user)) || !hasPermission(user, 'users', 'view')) return json({ error: 'Sem permissão para consultar níveis de acesso.' }, 403);
    const rows = await DB.prepare('SELECT id,name,permissions_json,is_admin,created_at,updated_at FROM roles ORDER BY is_admin DESC,name').all();
    return json({ tabs: TABS, actions: ACTIONS, roles: (rows.results || []).map(row => ({ id: row.id, name: row.name, permissions: safeJson(row.permissions_json, {}), is_admin: Boolean(row.is_admin), updated_at: row.updated_at })) });
  }
  if (path === 'admin/roles' && request.method === 'POST') {
    return saveManagedRole(DB, user, actor, roleName, await readJson(request));
  }
  if (path.startsWith('admin/roles/') && request.method === 'DELETE') {
    if (!(await requireAdmin(DB, user))) return json({ error: 'Sem permissão para remover níveis.' }, 403);
    const id = decodeURIComponent(path.slice('admin/roles/'.length));
    const row = await DB.prepare('SELECT id,name,is_admin,permissions_json FROM roles WHERE id=?').bind(id).first();
    if (!row) return json({ error: 'Nível não encontrado.' }, 404);
    if (row.is_admin) return json({ error: 'O nível Administrador protegido não pode ser removido.' }, 400);
    const assigned = await DB.prepare('SELECT COUNT(*) AS count FROM users WHERE role_id=?').bind(id).first();
    if (assigned?.count) return json({ error: 'Transfira todas as pessoas, inclusive as suspensas, para outro nível antes de remover este.' }, 409);
    await DB.prepare('DELETE FROM roles WHERE id=?').bind(id).run();
    await logAdminEvent(DB, actor, roleName, 'removeu nível', 'users', id, row.name,
      [{ field: 'nível', before: { name: row.name, permissions: safeJson(row.permissions_json, {}) }, after: null }]);
    return json({ ok: true });
  }
  if (path.startsWith('admin/users/') && request.method === 'POST') {
    const id = decodeURIComponent(path.slice('admin/users/'.length));
    return updateManagedUser(DB, user, actor, roleName, env, id, await readJson(request));
  }
  if (path === 'admin/audit' && request.method === 'GET') {
    if (!hasPermission(user, 'audit', 'view')) return json({ error: 'Sem permissão para consultar o log.' }, 403);
    const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit') || 100)));
    const rows = await DB.prepare(`SELECT id,occurred_at,actor_user_id,actor_name,actor_email,actor_role,action,area,record_id,description,changes_json
      FROM audit_log ORDER BY occurred_at DESC LIMIT ?`).bind(limit).all();
    return json({ events: (rows.results || []).map(row => ({ ...row, changes: safeJson(row.changes_json, []) })) });
  }
  return json({ error: 'Endereço da função não encontrado.' }, 404);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/connection') {
      return withSecurityHeaders(request.method === 'GET' ? json({ online: true }) : json({ error: 'Método não permitido.' }, 405), url);
    }
    if (url.pathname === '/logout') {
      if (!['GET', 'HEAD'].includes(request.method)) return withSecurityHeaders(json({ error: 'Método não permitido.' }, 405), url);
      return withSecurityHeaders(Response.redirect(`${url.origin}/?signedout=1`, 302), url);
    }
    if (url.pathname.startsWith('/api/')) {
      const roleDelete = request.method === 'DELETE' && /^\/api\/admin\/roles\/[^/]+$/.test(url.pathname);
      if (!['GET', 'POST'].includes(request.method) && !roleDelete) return withSecurityHeaders(json({ error: 'Método não permitido.' }, 405), url);
      try { return withSecurityHeaders(await handleApi(request, env, ctx), url); }
      catch (error) {
        console.error('BC2 API error', error?.message || String(error));
        if (Number.isInteger(error?.status)) return withSecurityHeaders(json({ error: error.message }, error.status), url);
        return withSecurityHeaders(json({ error: 'Não foi possível concluir a operação. Nenhuma alteração foi confirmada; tente novamente ou avise o Administrador.' }, 500), url);
      }
    }
    if (!['GET', 'HEAD'].includes(request.method)) return withSecurityHeaders(json({ error: 'Método não permitido.' }, 405), url);
    try { return withSecurityHeaders(await env.ASSETS.fetch(request), url); }
    catch (error) {
      console.error('BC2 asset error', error?.message || String(error));
      return withSecurityHeaders(new Response('Não foi possível abrir esta página.', { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' } }), url);
    }
  },
};

function withSecurityHeaders(response, url) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  if (url.protocol === 'https:') headers.set('Strict-Transport-Security', 'max-age=31536000');
  if ((headers.get('content-type') || '').toLowerCase().includes('text/html')) {
    headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://www.gstatic.com; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; style-src-attr 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://cdn.jsdelivr.net https://tessdata.projectnaptha.com https://world.openfoodfacts.org https://world.openproductsfacts.org https://world.openbeautyfacts.org https://world.openpetfoodfacts.org https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; media-src 'self' blob:; worker-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests");
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export { compareCollection, fieldChanges, hasPermission, readJson, verifyFirebaseToken, visibleState };
