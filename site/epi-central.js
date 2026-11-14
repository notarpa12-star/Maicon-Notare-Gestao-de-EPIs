/* Usa autenticação, permissões, revisão e transação D1 do BC2 Seguro existente. */
(function () {
  'use strict';
  function requirePermissions(draft) {
    if (!secureSession?.user || secureSession.status !== 'active') throw Error('Entre novamente no BC2 para salvar.');
    if (!can('scanner', 'view') || !can('epis', 'view')) throw Error('Seu nível não permite consultar o leitor e o estoque.');
    const existing = db.epis.find(epi => BC2EpiCore.sameCode(epi.barcode, draft.barcode));
    if (!can('epis', existing ? 'edit' : 'create')) throw Error(`Seu nível não permite ${existing ? 'editar o estoque deste' : 'cadastrar um novo'} EPI.`);
    if (draft.mode === 'entrada' && (!can('movements', 'view') || !can('movements', 'create'))) throw Error('Seu nível precisa permitir consultar e cadastrar movimentações para registrar a entrada.');
  }
  async function commit(draft, baseline) {
    requirePermissions(draft);
    await saveQueue;
    if (remoteRefreshBlocked) throw Error('Existe uma alteração anterior sem confirmação. Recarregue os dados antes de registrar esta entrada.');
    if (remoteRevision !== baseline) throw Error('O estoque foi atualizado desde a abertura da ficha. Reabra o cadastro e confira o saldo.');
    const tx = BC2EpiCore.buildTransaction(db, draft, id, newEpiUnit, today());
    const saveOperation = saveQueue.then(async () => {
      requirePermissions(draft);
      if (remoteRevision !== baseline) throw Error('O saldo mudou. Reabra a ficha e confira o recebimento.');
      const changes = planRecordSave(tx.database);
      const response = await commitRecordSave(changes);
      if (!response.saved || !Number.isInteger(response.revision)) throw Error('O banco central não confirmou a gravação. Recarregue os dados antes de tentar novamente.');
      remoteRevision = response.revision;
      db = tx.database;
      remoteRefreshBlocked = false;
      return tx;
    });
    saveQueue = saveOperation.then(() => true, () => false);
    try { return await saveOperation; }
    catch (error) {
      // Após falha de rede pode ser impossível saber se o servidor recebeu a gravação.
      // Bloqueia repetição até reler o banco; evita duplicar um recebimento confirmado remotamente.
      remoteRefreshBlocked = true;
      throw Error(`${error.message || 'Sem resposta do servidor.'} Reabra o BC2 e confira o saldo antes de repetir a entrada.`);
    }
  }
  window.BC2Central = { commit, revision: () => remoteRevision };
})();
