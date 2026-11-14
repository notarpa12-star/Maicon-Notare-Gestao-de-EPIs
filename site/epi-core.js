/* BC2: regras do cadastro por embalagem, sem dependências ou dados reais. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BC2EpiCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_RECEIPT = 10000;
  const clean = value => String(value ?? '').trim();
  function normalizeCode(value) {
    const code = clean(value);
    if (!code || code.length > 80 || /[\x00-\x1f\x7f]/.test(code)) throw Error('Informe um código válido, com até 80 caracteres.');
    return code;
  }
  function isGTIN(code) {
    if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)) return false;
    let sum = 0;
    for (let i = code.length - 2, weight = 3; i >= 0; i--, weight = weight === 3 ? 1 : 3) sum += Number(code[i]) * weight;
    return (10 - sum % 10) % 10 === Number(code.at(-1));
  }
  function sameCode(a, b) {
    a = clean(a); b = clean(b);
    return a === b || (isGTIN(a) && isGTIN(b) && a.padStart(14, '0') === b.padStart(14, '0'));
  }
  function safeUrl(value) {
    try { const url = new URL(clean(value)); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; }
    catch { return ''; }
  }
  function integer(value, label) {
    if (!/^\d+$/.test(clean(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) throw Error(`${label}: informe um número inteiro maior que zero.`);
    return Number(value);
  }
  function calculate(input) {
    if (!['caixa', 'pacote', 'par', 'unidade'].includes(input.packageType)) throw Error('Escolha caixa, pacote, par ou unidade.');
    const count = integer(input.packageCount, 'Quantidade recebida');
    const content = ['par', 'unidade'].includes(input.packageType) ? 1 : integer(input.contentCount, 'Conteúdo por embalagem');
    const contentUnit = input.packageType === 'par' ? 'par' : input.packageType === 'unidade' ? 'unidade' : input.contentUnit;
    if (!['par', 'unidade'].includes(contentUnit) || !['par', 'unidade'].includes(input.stockUnit)) throw Error('Escolha a unidade do conteúdo e a unidade de estoque.');
    if (contentUnit !== input.stockUnit && !input.conversionConfirmed) throw Error('Confirme a conversão entre pares e unidades.');
    const factor = contentUnit === input.stockUnit ? 1 : contentUnit === 'par' ? 2 : 0.5;
    const total = count * content * factor;
    if (!Number.isSafeInteger(total) || total < 1) throw Error('A conversão precisa resultar em um número inteiro. Confira pares e unidades.');
    if (total > MAX_RECEIPT) throw Error(`Divida a entrada em lançamentos de até ${MAX_RECEIPT} itens de estoque.`);
    return { count, content, contentUnit, stockUnit: input.stockUnit, factor, total, packageType: input.packageType };
  }
  function extractQuantities(text) {
    const candidates = [], seen = new Set();
    // Nunca deduzir quantidade de CA, GTIN, peso, tamanho, data ou de "cx 12" sem unidade.
    const normalized = String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const re = /\b(\d{1,6})\s*(pares?|unidades?|pecas?|und\.?|un\.?|pcs?\.?)\b/gi;
    let match;
    while ((match = re.exec(normalized))) {
      const n = Number(match[1]);
      const unit = /^par/i.test(match[2]) ? 'par' : 'unidade';
      const key = `${n}-${unit}`;
      if (n > 0 && n <= MAX_RECEIPT && !seen.has(key)) {
        candidates.push({ count: n, unit, excerpt: normalized.slice(Math.max(0, match.index - 35), Math.min(normalized.length, re.lastIndex + 35)).trim() });
        seen.add(key);
      }
    }
    return candidates;
  }
  function publicCandidate(data, provider, code) {
    const p = data?.product;
    if (!p || !sameCode(p.code || data.code, code) || data.status === 0) return null;
    const name = clean(p.product_name_pt || p.product_name || p.generic_name);
    if (!name) return null;
    // Marca não equivale a fabricante. CA e quantidade de estoque nunca vêm desta base.
    const fields = { name, brand: clean(p.brands), category: clean(p.categories), description: clean(p.generic_name_pt || p.generic_name), imageUrl: safeUrl(p.image_front_url || p.image_url) };
    return { code, fields, quantityText: clean(p.quantity), packagingText: clean(p.packaging),
      source: { name: provider.name, url: `https://${provider.host}/product/${encodeURIComponent(code)}`, kind: 'base-colaborativa', checkedAt: new Date().toISOString() } };
  }
  function labeledFields(text) {
    // Transcrição assistida: somente linhas com rótulos explícitos, sem deduzir modelo ou CA.
    const labels = { nome: 'name', produto: 'name', marca: 'brand', fabricante: 'manufacturer', modelo: 'model', categoria: 'category', tamanho: 'size', descricao: 'description' };
    const result = {};
    for (const line of String(text || '').split(/\r?\n/)) {
      const match = line.match(/^\s*([^:]{2,30}):\s*(.{1,2000})$/);
      if (!match) continue;
      const key = match[1].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      if (labels[key] && !result[labels[key]]) result[labels[key]] = match[2].trim();
    }
    return result;
  }
  function validateDraft(draft, database) {
    const barcode = normalizeCode(draft.barcode);
    if (!clean(draft.name)) throw Error('Informe o nome do EPI.');
    if (!draft.identityConfirmed) throw Error('Confirme o produto, modelo e apresentação da embalagem.');
    if (clean(draft.ca) && (!/^\d+$/.test(clean(draft.ca)) || !draft.caConfirmed || !clean(draft.caEvidence))) throw Error('CA: informe apenas números, a fonte consultada e confirme a conferência.');
    if (!['par', 'unidade'].includes(draft.stockUnit)) throw Error('Escolha a unidade de estoque.');
    if (!['catalogo', 'entrada'].includes(draft.mode)) throw Error('Escolha cadastrar ou registrar entrada.');
    const existing = database.epis.find(epi => sameCode(epi.barcode, barcode));
    if (database.epis.some(epi => (epi.units || []).some(unit => unit.code === barcode))) throw Error('Este é um código individual BC2. Use o leitor para entregar ou devolver a unidade.');
    if (existing && draft.mode === 'catalogo') throw Error('O produto já está cadastrado. Use entrada por embalagem para aumentar o saldo.');
    if (existing?.stockUnit && existing.stockUnit !== draft.stockUnit) throw Error('A unidade deve ser a mesma do estoque existente.');
    if (existing && !existing.stockUnit && !draft.legacyUnitConfirmed) throw Error('Confirme a unidade usada pelo saldo antigo antes de continuar.');
    const calculation = draft.mode === 'entrada' ? calculate(draft) : null;
    if (calculation && (!draft.quantityConfirmed || !clean(draft.quantityEvidence))) throw Error('Confira o conteúdo da embalagem e informe onde verificou a quantidade.');
    if (!draft.finalConfirmed) throw Error('Confirme a revisão final para salvar.');
    return { barcode, existing, calculation };
  }
  function buildTransaction(database, draft, makeId, makeUnit, date) {
    const valid = validateDraft(draft, database);
    const next = JSON.parse(JSON.stringify(database));
    const now = new Date().toISOString();
    let epi = valid.existing ? next.epis.find(e => e.id === valid.existing.id) : null;
    const evidence = { barcode: valid.barcode, confirmedAt: now, fields: draft.fieldSources || {},
      caEvidence: clean(draft.caEvidence), quantityEvidence: clean(draft.quantityEvidence), labelText: clean(draft.labelText).slice(0, 12000),
      sourceUrl: safeUrl(draft.sourceUrl), sourceExcerpt: clean(draft.sourceExcerpt).slice(0, 12000),
      lot: clean(draft.lot), expiry: clean(draft.expiry), responsible: clean(draft.responsible) };
    if (!epi) {
      epi = { id: makeId(), barcode: valid.barcode, quantity: 0, units: [], createdAt: now,
        name: clean(draft.name), category: clean(draft.category), manufacturer: clean(draft.manufacturer), brand: clean(draft.brand),
        model: clean(draft.model), ca: clean(draft.ca), size: clean(draft.size), lot: clean(draft.lot), expiry: clean(draft.expiry),
        condition: 'Não avaliado', side: 'Não definido', notes: clean(draft.description), imageUrl: safeUrl(draft.imageUrl),
        registrationEvidence: evidence };
      next.epis.push(epi);
    }
    epi.stockUnit = draft.stockUnit;
    epi.updatedAt = now;
    if (valid.calculation) {
      const c = valid.calculation;
      const used = new Set(next.epis.flatMap(e => (e.units || []).map(u => u.code)));
      for (let i = 0; i < c.total; i++) epi.units.push(makeUnit(epi, used));
      epi.quantity = epi.units.filter(u => !u.employeeId && !u.retired).length;
      epi.lastPackaging = c;
      next.movements.push({ id: makeId(), date, type: 'Ajuste positivo', epiId: epi.id, qty: c.total,
        employeeId: '', responsible: clean(draft.responsible), packaging: c, evidence,
        notes: `Entrada confirmada: ${c.count} ${c.packageType}(s) × ${c.content} ${c.contentUnit}(s)${c.factor !== 1 ? ` × ${c.factor}` : ''} = ${c.total} ${c.stockUnit}(s). Fonte: ${evidence.quantityEvidence}` });
    }
    return { database: next, epi, calculation: valid.calculation };
  }
  return { MAX_RECEIPT, normalizeCode, isGTIN, sameCode, safeUrl, calculate, extractQuantities, publicCandidate, labeledFields, validateDraft, buildTransaction };
});
