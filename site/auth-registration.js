/* Cadastro com senha e verificação comum. Nenhuma senha ou token é persistido aqui. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BC2Registration = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const sentAt = new Map();
  const pending = new Map();
  function validate(input) {
    const name = String(input.name || '').trim().slice(0, 120);
    const email = String(input.email || '').trim();
    const password = String(input.password || '');
    if (!name) throw Error('Informe seu nome completo.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error('Digite um e-mail válido.');
    if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) throw Error('Use pelo menos 12 caracteres, com letra maiúscula, minúscula, número e símbolo.');
    if (password !== input.confirmation) throw Error('As senhas não são iguais. Digite novamente.');
    return { name, email, password };
  }
  function sendVerification(idToken, email, request, continueUrl) {
    const key = String(email).trim().toLowerCase();
    if (pending.has(key)) return pending.get(key);
    if (sentAt.has(key) && Date.now() - sentAt.get(key) < 60000) return Promise.resolve({ alreadySent: true });
    const payload = { requestType: 'VERIFY_EMAIL', idToken };
    if (continueUrl) {
      const url = new URL(continueUrl);
      if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') throw Error('A confirmação precisa de um endereço seguro.');
      payload.continueUrl = url.href;
      payload.canHandleCodeInApp = false;
    }
    const operation = Promise.resolve().then(() => request('accounts:sendOobCode', payload)).then(() => {
      sentAt.set(key, Date.now()); return { alreadySent: false };
    }).finally(() => pending.delete(key));
    pending.set(key, operation);
    return operation;
  }
  async function createAccount(input, request, continueUrl) {
    const values = validate(input);
    // displayName faz parte da criação da conta; e-mail permanece não verificado.
    const account = await request('accounts:signUp', {
      email: values.email, password: values.password, displayName: values.name, returnSecureToken: true
    });
    try {
      if (!account.idToken) throw Error('A conta foi criada, mas o serviço não retornou a confirmação esperada.');
      await sendVerification(account.idToken, values.email, request, continueUrl);
    } catch (error) {
      error.accountCreated = true;
      throw error;
    }
    return { email: values.email, name: values.name };
  }
  return { validate, createAccount, sendVerification };
});
