/* Extensão do BC2 Seguro. Estoque e entradas são confirmados no banco central. */
(function () {
  'use strict';
  const C = window.BC2EpiCore;
  const $ = name => document.getElementById(`bc2-${name}`);
  const providers = [
    { name: 'Open Products Facts', host: 'world.openproductsfacts.org' },
    { name: 'Open Beauty Facts', host: 'world.openbeautyfacts.org' },
    { name: 'Open Food Facts', host: 'world.openfoodfacts.org' }
  ];
  const fields = { name: 'Nome do EPI', brand: 'Marca', manufacturer: 'Fabricante', model: 'Modelo',
    category: 'Categoria', size: 'Tamanho', lot: 'Lote desta entrada', expiry: 'Validade desta entrada',
    ca: 'CA (opcional, somente após conferir)', imageUrl: 'Endereço HTTPS da imagem (opcional)', description: 'Descrição / observações' };
  const panel = document.createElement('div');
  panel.id = 'bc2NewEpi'; panel.hidden = true;
  document.getElementById('scanner').appendChild(panel);
  let session = 0, sources = {}, candidates = [], photoUrl = '', photoFile = null, ocrBusy = false;
  let controller = null, baseline = '', currentExisting = null, confirmedReview = null, saving = false;
  const cache = new Map(), requests = [];
  function status(message, error = false) { $('status').textContent = message; $('status').className = error ? 'bc2-error' : 'muted'; }
  function field(name, label, type = 'text', full = false) {
    const input = type === 'textarea' ? `<textarea id="bc2-${name}" rows="3"></textarea>` : `<input id="bc2-${name}" type="${type}" ${name === 'name' ? 'required maxlength="180"' : 'maxlength="2000"'}>`;
    return `<div class="${full ? 'bc2-full' : ''}"><label for="bc2-${name}">${label}</label>${input}<small id="bc2-source-${name}">Preenchimento manual; confira antes de salvar.</small></div>`;
  }
  function resetPhoto() { if (photoUrl) URL.revokeObjectURL(photoUrl); photoUrl = ''; photoFile = null; }
  function close() {
    session++; controller?.abort(); resetPhoto(); panel.hidden = true; confirmedReview = null; window.BC2NewEpi.cameraMode = false;
    document.getElementById('barcodeInput').focus();
  }
  function open(code = '', autoSearch = true) {
    if (!secureSession?.user || !can('scanner', 'view') || !can('epis', 'view')) { alert('Entre no BC2 com permissão para consultar o leitor e o estoque.'); return; }
    stopScanner(); session++; controller?.abort(); resetPhoto(); sources = {}; candidates = []; confirmedReview = null;
    baseline = BC2Central.revision(); currentExisting = null;
    panel.hidden = false;
    panel.innerHTML = `<h3 tabindex="-1" id="bc2-heading">Escanear e cadastrar EPI novo</h3>
      <p>1. Identifique o produto · 2. Confira a embalagem · 3. Revise e confirme</p>
      <p class="muted">Nada será lançado no estoque até sua confirmação final. Bases públicas podem não encontrar o EPI ou conter erros.</p>
      <form id="bc2-form">
      <fieldset><legend>1 · Código e pesquisa</legend>
        <label for="bc2-barcode">Código do produto / embalagem</label>
        <div class="toolbar"><input id="bc2-barcode" maxlength="80" autocomplete="off" spellcheck="false" required placeholder="Digite ou use o leitor USB e pressione Enter">
          <button class="btn" type="button" id="bc2-search">Pesquisar bases públicas</button>
          <button class="btn secondary" type="button" id="bc2-camera">Fotografar código</button>
          <button class="btn secondary" type="button" id="bc2-code-photo">Carregar foto do código</button></div>
        <p id="bc2-search-status" role="status" class="muted">Aceita EAN/UPC e Code128. A consulta por GTIN exige dígito verificador válido.</p>
        <div id="bc2-candidates"></div>
        <details><summary>Pesquisar na internet e nos fabricantes</summary>
          <p>A pesquisa abre em outra aba. Procure o código exato e confira modelo, tamanho e embalagem. Links de pesquisa não são fontes verificadas.</p>
          <label for="bc2-manufacturer-domain">Site do fabricante, se souber (ex.: fabricante.com.br)</label>
          <input id="bc2-manufacturer-domain" placeholder="Domínio do fabricante">
          <button class="btn secondary" type="button" id="bc2-update-links">Atualizar pesquisas</button>
          <div id="bc2-links" class="bc2-search-links"></div>
          <label for="bc2-sourceUrl">Endereço da ficha consultada no fabricante / fonte pública</label><input id="bc2-sourceUrl" type="url" placeholder="https://...">
          <label for="bc2-excerpt">Trecho da ficha ou etiqueta (cole o texto confirmado)</label><textarea id="bc2-excerpt" rows="3"></textarea>
          <p class="muted">Para transcrição assistida, use linhas como “Nome: …”, “Fabricante: …”, “Modelo: …” e “Tamanho: …”, apenas com o que consta na ficha.</p>
          <label class="bc2-check"><input id="bc2-manufacturerConfirmed" type="checkbox">Abri a fonte e conferi o código, produto e apresentação. O trecho corresponde à ficha consultada.</label>
          <button class="btn secondary" type="button" id="bc2-excerpt-fields">Pré-preencher campos vazios com o trecho conferido</button>
          <button class="btn secondary" type="button" id="bc2-excerpt-quantity">Procurar quantidade neste texto</button>
          <p class="muted">Transcreva somente os dados que constam na fonte. CA precisa de conferência específica. Esta versão não lê automaticamente páginas de fabricantes que bloqueiam acesso de outros sites.</p>
        </details>
      </fieldset>
      <fieldset><legend>2 · Ficha para conferência</legend><div class="bc2-grid">
        ${Object.entries(fields).map(([name, label]) => field(name, label, name === 'description' ? 'textarea' : name === 'expiry' ? 'date' : name === 'imageUrl' ? 'url' : 'text', name === 'description')).join('')}
        <div class="bc2-full"><label for="bc2-caEvidence">Fonte do CA (se informado)</label><input id="bc2-caEvidence" placeholder="Endereço da consulta oficial ou documento do fabricante conferido">
        <label class="bc2-check"><input id="bc2-caConfirmed" type="checkbox">Conferi o CA e sua correspondência com fabricante, modelo e uso. O sistema não valida o CA automaticamente.</label></div>
      </div><label class="bc2-check"><input id="bc2-identityConfirmed" type="checkbox">Conferi a identidade do produto, o código, o tamanho e a apresentação da embalagem. Os dados sem fonte foram preenchidos por mim.</label>
      <p id="bc2-existing" class="notice" hidden></p></fieldset>
      <fieldset><legend>3 · Etiqueta e quantidade</legend>
        <p>Fotografe uma etiqueta nítida ou selecione uma imagem. O reconhecimento ocorre no navegador e pode errar. A foto não é incluída no backup; o texto confirmado fica no registro.</p>
        <div class="bc2-grid"><div><label for="bc2-photo">Fotografar etiqueta</label><input id="bc2-photo" type="file" accept="image/*" capture="environment"></div>
        <div><label for="bc2-photo-file">Selecionar imagem</label><input id="bc2-photo-file" type="file" accept="image/*"></div></div>
        <img id="bc2-photo-preview" class="bc2-preview" alt="Etiqueta selecionada para conferência" hidden>
        <button class="btn secondary" id="bc2-ocr" type="button" disabled>Ler texto da foto</button>
        <p id="bc2-ocr-status" class="muted" role="status">A primeira leitura baixa o leitor de texto pela internet. Nenhuma foto é enviada a uma API de reconhecimento.</p>
        <label for="bc2-labelText">Texto da etiqueta (pode corrigir ou digitar)</label><textarea id="bc2-labelText" rows="4"></textarea>
        <button class="btn secondary" id="bc2-extract" type="button">Procurar quantidade no texto</button><div id="bc2-quantities"></div>
        <div class="bc2-grid">
          <div><label for="bc2-mode">O que deseja salvar?</label><select id="bc2-mode"><option value="entrada">Cadastrar e registrar entrada</option><option value="catalogo">Somente cadastrar, com saldo zero</option></select></div>
          <div><label for="bc2-stockUnit">Unidade de controle do estoque *</label><select id="bc2-stockUnit"><option value="">Escolha</option><option value="par">Par</option><option value="unidade">Unidade</option></select></div>
        </div>
        <label id="bc2-legacy-wrap" class="bc2-check" hidden><input id="bc2-legacyUnitConfirmed" type="checkbox">Conferi que a unidade escolhida é a mesma usada no saldo antigo. Nenhum saldo antigo será convertido.</label>
        <div id="bc2-receipt"><div class="bc2-grid">
          <div><label for="bc2-packageType">Apresentação recebida *</label><select id="bc2-packageType"><option value="">Escolha</option><option value="caixa">Caixa</option><option value="pacote">Pacote</option><option value="par">Par avulso</option><option value="unidade">Unidade avulsa</option></select></div>
          <div><label for="bc2-packageCount">Quantidade de embalagens / itens recebidos *</label><input id="bc2-packageCount" type="number" min="1" step="1" inputmode="numeric"></div>
          <div><label for="bc2-contentCount">Conteúdo de cada caixa / pacote *</label><input id="bc2-contentCount" type="number" min="1" step="1" inputmode="numeric"></div>
          <div><label for="bc2-contentUnit">Unidade desse conteúdo *</label><select id="bc2-contentUnit"><option value="">Escolha</option><option value="par">Pares</option><option value="unidade">Unidades</option></select></div>
        </div>
        <label class="bc2-check" id="bc2-conversion-wrap" hidden><input id="bc2-conversionConfirmed" type="checkbox">Autorizo a conversão: 1 par = 2 unidades. Conferi que se trata de pares completos do mesmo produto.</label>
        <p id="bc2-total" class="bc2-total" aria-live="polite">Informe a embalagem e as quantidades.</p>
        <label for="bc2-quantityEvidence">Onde conferiu a quantidade por embalagem? *</label><input id="bc2-quantityEvidence" placeholder="Ex.: etiqueta: caixa com 12 pares; ou endereço da ficha do fabricante">
        <label class="bc2-check"><input id="bc2-quantityConfirmed" type="checkbox">Conferi a quantidade por embalagem e se o conteúdo está expresso em pares ou unidades. Conferi também o número de caixas / pacotes recebidos.</label>
        </div>
        <label for="bc2-responsible">Responsável pelo lançamento (opcional)</label><input id="bc2-responsible" maxlength="180">
      </fieldset>
      <button id="bc2-review" class="btn" type="button">Revisar antes de salvar</button>
      <div id="bc2-review-wrap" hidden><h4>Confira este lançamento</h4><div id="bc2-review-text" class="bc2-review"></div>
        <label class="bc2-check"><input id="bc2-finalConfirmed" type="checkbox">Conferi a ficha, as fontes e o total. Confirmo este cadastro / entrada.</label>
        <button id="bc2-save" class="btn" type="submit">Confirmar e salvar</button></div>
      <button id="bc2-cancel" class="btn secondary" type="button">Cancelar</button>
      <p id="bc2-status" role="status" aria-live="polite"></p></form>`;
    $('barcode').value = code;
    $('cancel').onclick = close;
    $('camera').onclick = () => { window.BC2NewEpi.cameraMode = true; document.getElementById('scannerVideo').scrollIntoView({ block: 'center' }); startScanner(); };
    $('code-photo').onclick = () => { window.BC2NewEpi.cameraMode = true; stopScanner(); document.getElementById('scannerPhotoInput').click(); };
    $('search').onclick = search;
    $('barcode').onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); search(); } };
    $('update-links').onclick = updateLinks;
    $('excerpt-quantity').onclick = () => showQuantities($('excerpt').value, `Ficha consultada: ${$('sourceUrl').value || 'fonte a informar'}`);
    $('excerpt-fields').onclick = () => {
      const url = C.safeUrl($('sourceUrl').value);
      if (!url || !$('manufacturerConfirmed').checked) { status('Informe o endereço HTTPS da fonte e confirme a correspondência antes de aproveitar o trecho.', true); return; }
      const values = C.labeledFields($('excerpt').value); let filled = 0;
      for (const [name, value] of Object.entries(values)) if (!$(name).value && !$(name).readOnly) {
        $(name).value = value; sources[name] = { kind: 'ficha-consultada', code: $('barcode').value.trim(), name: 'Ficha externa conferida pelo responsável', url, checkedAt: new Date().toISOString(), value, confirmedByUser: true };
        $(`source-${name}`).textContent = `Fonte conferida: ${new URL(url).hostname}`; filled++;
      }
      invalidateReview(); $('identityConfirmed').checked = false; updateLinks(); status(filled ? `${filled} campo(s) preenchido(s) a partir do trecho conferido. CA continua separado.` : 'Não há campos vazios com rótulos reconhecidos no trecho. Preencha manualmente.');
    };
    $('extract').onclick = () => showQuantities($('labelText').value, 'Texto da etiqueta conferido pelo responsável');
    $('photo').onchange = event => choosePhoto(event.target.files[0]);
    $('photo-file').onchange = event => choosePhoto(event.target.files[0]);
    $('ocr').onclick = readPhoto;
    $('review').onclick = review;
    $('form').onsubmit = commit;
    $('form').addEventListener('input', event => {
      const name = event.target.id.replace('bc2-', '');
      if (name === 'finalConfirmed') return;
      invalidateReview();
      if (fields[name]) { sources[name] = { kind: 'manual', note: 'Preenchido ou corrigido pelo responsável' }; $(`source-${name}`).textContent = 'Preenchido ou corrigido por você.'; $('identityConfirmed').checked = false; }
      if (name === 'ca') $('caConfirmed').checked = false;
      if (['sourceUrl', 'excerpt'].includes(name)) $('manufacturerConfirmed').checked = false;
      if (name === 'packageType') { $('contentCount').value = ''; $('contentUnit').value = ''; $('quantityEvidence').value = ''; }
      if (['packageType', 'packageCount', 'contentCount', 'contentUnit', 'stockUnit', 'labelText', 'quantityEvidence', 'mode'].includes(name)) {
        $('quantityConfirmed').checked = false; if (name !== 'quantityEvidence') $('conversionConfirmed').checked = false;
      }
      if (name === 'barcode') { controller?.abort(); $('search').disabled = false; $('identityConfirmed').checked = false; candidates = []; $('candidates').replaceChildren(); clearSourcedFields(); updateExisting(); updateLinks(); }
      updateCalculation();
    });
    updateExisting(); updateLinks(); updateCalculation();
    $('heading').focus(); panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
    if (autoSearch && code) search();
  }
  function invalidateReview() { confirmedReview = null; $('review-wrap').hidden = true; $('finalConfirmed').checked = false; }
  function clearSourcedFields() {
    for (const [name, source] of Object.entries(sources)) if (source.code && !C.sameCode(source.code, $('barcode').value.trim())) {
      $(name).value = ''; delete sources[name]; $(`source-${name}`).textContent = 'Código alterado. Preencha ou consulte novamente.';
    }
  }
  function updateExisting() {
    const code = $('barcode').value.trim();
    const previous = currentExisting;
    currentExisting = db.epis.find(e => C.sameCode(e.barcode, code)) || null;
    $('existing').hidden = !currentExisting;
    $('legacy-wrap').hidden = !currentExisting || !!currentExisting.stockUnit;
    $('stockUnit').disabled = !!currentExisting?.stockUnit;
    for (const name of Object.keys(fields)) $(name).readOnly = !!currentExisting;
    if (currentExisting) {
      $('existing').textContent = `Já cadastrado: ${currentExisting.name}. Saldo atual: ${currentExisting.quantity} ${currentExisting.stockUnit || '(unidade antiga a confirmar)'}. Esta entrada preserva a ficha existente; lote e validade ficam no histórico da entrada.`;
      for (const name of Object.keys(fields)) { $(name).value = currentExisting[name === 'description' ? 'notes' : name] || ''; }
      // Lote/validade pertencem à nova entrada, não substituem o lote antigo.
      $('lot').value = ''; $('expiry').value = ''; $('lot').readOnly = false; $('expiry').readOnly = false;
      if (currentExisting.stockUnit) $('stockUnit').value = currentExisting.stockUnit;
      $('mode').value = 'entrada'; $('mode').disabled = true;
    } else {
      $('mode').disabled = false;
      if (previous) { for (const name of Object.keys(fields)) $(name).value = ''; sources = {}; $('stockUnit').value = ''; $('legacyUnitConfirmed').checked = false; }
    }
  }
  function updateLinks() {
    const code = $('barcode').value.trim();
    const text = [code ? `"${code}"` : '', $('manufacturer').value, $('model').value, 'EPI'].filter(Boolean).join(' ');
    const links = [['Pesquisar o código na internet', `https://www.google.com/search?q=${encodeURIComponent(text)}`],
      ['Pesquisar fichas de fabricantes', `https://www.google.com/search?q=${encodeURIComponent(text + ' fabricante ficha técnica')}`]];
    let domain = $('manufacturer-domain').value.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
    if (domain && /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(domain)) links.push(['Pesquisar neste fabricante', `https://www.google.com/search?q=${encodeURIComponent(`site:${domain} "${code}"`)}`]);
    $('links').innerHTML = links.map(([label, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`).join('');
  }
  async function requestProvider(provider, code, signal) {
    const key = `${provider.host}/${code}`;
    if (cache.has(key)) return cache.get(key);
    const local = new AbortController();
    const abort = () => local.abort(); signal.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, 9000);
    try {
      const fieldsParam = 'code,product_name,product_name_pt,generic_name,generic_name_pt,brands,categories,quantity,packaging,image_front_url,image_url';
      const response = await fetch(`https://${provider.host}/api/v3/product/${encodeURIComponent(code)}.json?fields=${fieldsParam}`, { signal: local.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (response.status === 404) { cache.set(key, null); return null; }
      if (response.status === 429) throw Error(`${provider.name}: limite de consultas atingido; tente mais tarde.`);
      if (!response.ok) throw Error(`${provider.name}: serviço indisponível (HTTP ${response.status}).`);
      const candidate = C.publicCandidate(await response.json(), provider, code);
      cache.set(key, candidate); return candidate;
    } catch (error) {
      if (signal.aborted) throw error;
      throw Error(`${provider.name}: ${local.signal.aborted ? 'tempo de consulta esgotado' : error.message || 'falha de conexão ou bloqueio de acesso'}`);
    } finally { clearTimeout(timer); signal.removeEventListener('abort', abort); }
  }
  async function search() {
    const thisSession = session;
    let code;
    try { code = C.normalizeCode($('barcode').value); } catch (error) { status(error.message, true); return; }
    $('barcode').value = code; updateExisting(); updateLinks(); invalidateReview();
    if (currentExisting) { $('search-status').textContent = 'Código já cadastrado. Use a conferência de embalagem para registrar uma nova entrada.'; return; }
    if (findEpiUnit(code)) { $('search-status').textContent = 'Este é um código individual BC2. Cancele este cadastro e use Localizar no leitor para entrega ou devolução.'; return; }
    const local = findLocalProduct(code);
    if (local) {
      candidates = [{ code, fields: { name: local.name, manufacturer: local.manufacturer, model: local.model, category: local.category, description: local.description, imageUrl: local.imageUrl }, quantityText: local.quantity || '', source: { name: 'Catálogo local existente', kind: 'cadastro-local', url: C.safeUrl(local.productUrl), checkedAt: local.updatedAt } }];
      renderCandidates();
    } else { candidates = []; $('candidates').replaceChildren(); }
    if (!C.isGTIN(code)) {
      $('search-status').textContent = 'Código interno/Code128 ou GTIN com dígito inválido. A entrada manual e a pesquisa em fabricantes continuam disponíveis; não alteramos nem completamos o código.'; return;
    }
    while (requests.length && requests[0] < Date.now() - 60000) requests.shift();
    if (requests.length >= 4) { $('search-status').textContent = 'Aguarde um minuto antes de pesquisar novamente para respeitar as bases gratuitas.'; return; }
    requests.push(Date.now()); controller?.abort(); controller = new AbortController();
    const signal = controller.signal;
    $('search').disabled = true; $('search-status').textContent = 'Consultando três bases públicas. Você pode continuar preenchendo manualmente.';
    const results = await Promise.allSettled(providers.map(provider => requestProvider(provider, code, signal)));
    if (thisSession !== session || signal.aborted || $('barcode').value.trim() !== code) return;
    $('search').disabled = false;
    const errors = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) candidates.push(result.value);
      else if (result.status === 'rejected') errors.push(result.reason.message);
    }
    renderCandidates();
    $('search-status').textContent = (candidates.length ? `${candidates.length} resultado(s). Confira o registro e a embalagem antes de aproveitar os dados.` : 'Nenhum produto identificado nas bases consultadas. Pesquise no fabricante ou preencha manualmente.') + (errors.length ? ` Consultas incompletas: ${errors.join(' · ')}` : '');
  }
  function renderCandidates() {
    $('candidates').innerHTML = candidates.map((p, i) => `<article class="bc2-source-card"><strong>${esc(p.source.name)}</strong> · dados a conferir
      <dl>${Object.entries(p.fields).filter(([, v]) => v).map(([key, value]) => `<dt>${esc(fields[key] || key)}</dt><dd>${esc(value)}</dd>`).join('')}
      ${p.quantityText ? `<dt>Conteúdo informado</dt><dd>${esc(p.quantityText)} (não define o estoque)</dd>` : ''}</dl>
      ${p.source.url ? `<a target="_blank" rel="noopener noreferrer" href="${esc(p.source.url)}">Abrir a fonte</a>` : ''}
      <label class="bc2-check"><input type="checkbox" id="bc2-match-${i}">Conferi que o registro corresponde ao código, modelo, tamanho e apresentação em mãos.</label>
      <button class="btn secondary" type="button" data-bc2-apply="${i}">Pré-preencher campos vazios com esta fonte</button></article>`).join('');
    panel.querySelectorAll('[data-bc2-apply]').forEach(button => button.onclick = () => {
      const i = Number(button.dataset.bc2Apply), p = candidates[i];
      if (!$(`match-${i}`).checked) { status('Confira a fonte e marque a correspondência do produto antes de pré-preencher.', true); return; }
      for (const [key, value] of Object.entries(p.fields)) {
        if (value && fields[key] && !$(key).value && !$(key).readOnly) {
          $(key).value = value;
          sources[key] = { ...p.source, code: p.code, value, confirmedByUser: true };
          $(`source-${key}`).textContent = `Fonte: ${p.source.name}. Correspondência conferida por você.`;
        }
      }
      if (p.quantityText) showQuantities(p.quantityText, `${p.source.name}: ${p.source.url}`);
      invalidateReview(); $('identityConfirmed').checked = false; updateLinks();
      status('Campos vazios preenchidos. Confira a ficha e informe separadamente a quantidade recebida.');
    });
  }
  function showQuantities(text, evidence) {
    const values = C.extractQuantities(text);
    $('quantities').innerHTML = values.length ? '<p>Possíveis quantidades no texto. Escolha somente se corresponder ao conteúdo de <strong>uma</strong> embalagem recebida. Embalagens dentro de caixas exigem conferir o total por caixa.</p>' + values.map((q, i) => `<div class="bc2-source-card"><p>${esc(q.excerpt)}</p><button class="btn secondary" type="button" data-bc2-quantity="${i}">Usar ${q.count} ${q.unit}(s) por caixa / pacote</button></div>`).join('') : '<p class="notice warn">Não há quantidade explícita com pares ou unidades. Preencha manualmente; peso, tamanho e CA não definem o conteúdo.</p>';
    panel.querySelectorAll('[data-bc2-quantity]').forEach(button => button.onclick = () => {
      const q = values[Number(button.dataset.bc2Quantity)];
      if (!['caixa', 'pacote'].includes($('packageType').value)) { status('Escolha primeiro Caixa ou Pacote em Apresentação recebida.', true); return; }
      $('contentCount').value = q.count; $('contentUnit').value = q.unit;
      $('quantityEvidence').value = `${evidence}; trecho: ${q.excerpt}`;
      $('quantityConfirmed').checked = false; $('conversionConfirmed').checked = false; invalidateReview(); updateCalculation();
      status('Sugestão aplicada. Confira o conteúdo, as embalagens recebidas e o total.');
    });
  }
  function choosePhoto(file) {
    resetPhoto(); $('photo-preview').hidden = true; $('ocr').disabled = true;
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 16 * 1024 * 1024) { status('Use uma imagem de até 16 MB. Se necessário, salve a foto em JPEG ou PNG.', true); return; }
    photoFile = file; photoUrl = URL.createObjectURL(file); $('photo-preview').src = photoUrl; $('photo-preview').hidden = false;
    $('ocr').disabled = ocrBusy; $('ocr-status').textContent = 'Foto selecionada. Toque em Ler texto da foto e depois confira o texto reconhecido.';
    $('quantityConfirmed').checked = false; invalidateReview();
  }
  let ocrLibrary;
  function loadOCR() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (ocrLibrary) return ocrLibrary;
    ocrLibrary = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';
      const timeout = setTimeout(() => { script.remove(); ocrLibrary = null; reject(Error('Tempo de carregamento esgotado. Digite o texto da etiqueta.')); }, 20000);
      script.onload = () => { clearTimeout(timeout); if (window.Tesseract) resolve(window.Tesseract); else { ocrLibrary = null; reject(Error('Leitor de texto indisponível.')); } };
      script.onerror = () => { clearTimeout(timeout); ocrLibrary = null; reject(Error('Não foi possível baixar o leitor. Digite o texto da etiqueta.')); };
      document.head.appendChild(script);
    });
    return ocrLibrary;
  }
  async function readPhoto() {
    if (!photoFile || ocrBusy) return;
    const token = session, file = photoFile; let worker, deadline, stopped = false;
    const current = () => token === session && file === photoFile && !panel.hidden;
    ocrBusy = true; $('ocr').disabled = true; $('ocr-status').textContent = 'Carregando o leitor em português. Isso pode demorar na primeira vez.';
    try {
      const library = await loadOCR();
      if (!current()) return;
      const operation = async () => {
        worker = await library.createWorker('por', 1, { logger: m => {
          if (current() && m.status === 'recognizing text') $('ocr-status').textContent = `Lendo a etiqueta: ${Math.round(m.progress * 100)}%.`;
        } });
        if (stopped) { await worker.terminate(); return null; }
        if (!current()) return null;
        return worker.recognize(file);
      };
      const result = await Promise.race([operation(), new Promise((_, reject) => { deadline = setTimeout(() => reject(Error('A leitura demorou demais. Tente uma foto menor ou digite a etiqueta.')), 90000); })]);
      if (!current() || !result) return;
      $('labelText').value = result.data.text || '';
      $('quantityConfirmed').checked = false; invalidateReview();
      $('ocr-status').textContent = 'Texto extraído. Corrija os erros e confira a quantidade na própria etiqueta antes de usar.';
      showQuantities($('labelText').value, 'Foto da etiqueta, texto extraído e conferido pelo responsável');
    } catch (error) { if (current()) $('ocr-status').textContent = `${error.message} Você pode preencher manualmente.`; }
    finally { stopped = true; clearTimeout(deadline); if (worker) await worker.terminate().catch(() => {}); ocrBusy = false; if (!panel.hidden && $('ocr')) $('ocr').disabled = !photoFile; }
  }
  function draft() {
    const result = {};
    for (const name of [...Object.keys(fields), 'barcode', 'sourceUrl', 'caEvidence', 'labelText', 'mode', 'stockUnit', 'packageType', 'packageCount', 'contentCount', 'contentUnit', 'quantityEvidence', 'responsible']) result[name] = $(name).value.trim();
    for (const name of ['caConfirmed', 'identityConfirmed', 'legacyUnitConfirmed', 'conversionConfirmed', 'quantityConfirmed', 'finalConfirmed']) result[name] = $(name).checked;
    result.fieldSources = {};
    result.sourceExcerpt = $('excerpt').value.trim();
    for (const name of Object.keys(fields)) if (result[name]) result.fieldSources[name] = { ...(sources[name] || { kind: 'manual', url: C.safeUrl(result.sourceUrl), note: 'Informado e conferido pelo responsável' }), value: result[name] };
    return result;
  }
  function updateCalculation() {
    const receipt = $('mode').value === 'entrada'; $('receipt').hidden = !receipt;
    const type = $('packageType').value, standalone = ['unidade', 'par'].includes(type);
    $('contentCount').disabled = standalone; $('contentUnit').disabled = standalone;
    if (standalone) { $('contentCount').value = 1; $('contentUnit').value = type; }
    const different = $('contentUnit').value && $('stockUnit').value && $('contentUnit').value !== $('stockUnit').value;
    $('conversion-wrap').hidden = !different;
    try {
      const c = C.calculate(draft());
      $('total').textContent = `${c.count} ${c.packageType}(s) × ${c.content} ${c.contentUnit}(s)${c.factor !== 1 ? ` × ${c.factor}` : ''} = ${c.total} ${c.stockUnit}(s) no estoque`;
    } catch (error) { $('total').textContent = error.message; }
  }
  function review() {
    try {
      const d = draft();
      if (d.sourceUrl && !C.safeUrl(d.sourceUrl)) throw Error('A fonte deve ser um endereço HTTPS válido.');
      if (d.imageUrl && !C.safeUrl(d.imageUrl)) throw Error('A imagem deve usar um endereço HTTPS válido.');
      const v = C.validateDraft({ ...d, finalConfirmed: true }, db);
      const c = v.calculation;
      confirmedReview = JSON.stringify({ ...d, finalConfirmed: false });
      $('review-text').textContent = `${v.existing ? 'Entrada em EPI existente' : 'Novo cadastro'}: ${d.name}\nCódigo: ${d.barcode}\nFabricante: ${d.manufacturer || 'Não informado'} · Modelo: ${d.model || 'Não informado'}\nCA: ${d.ca || 'Não informado'}\nUnidade de estoque: ${d.stockUnit}\nLote desta entrada: ${d.lot || 'Não informado'} · Validade: ${d.expiry || 'Não informada'}\n${c ? `Recebimento: ${c.count} ${c.packageType}(s), com ${c.content} ${c.contentUnit}(s) cada.\nTotal da entrada: ${c.total} ${c.stockUnit}(s).\nSaldo após salvar: ${(v.existing?.quantity || 0) + c.total} ${c.stockUnit}(s).\nFonte da quantidade: ${d.quantityEvidence}` : 'Somente cadastro. Saldo inicial: zero.'}\nFontes da ficha: ${[...new Set(Object.values(d.fieldSources).map(s => s.name || s.url || 'Informação manual conferida'))].join(' · ')}\nResponsável: ${d.responsible || 'Não informado'}`;
      $('finalConfirmed').checked = false; $('review-wrap').hidden = false; $('review-wrap').scrollIntoView({ block: 'center', behavior: 'smooth' });
      status('Revise o lançamento acima e marque a confirmação final.');
    } catch (error) { status(error.message, true); }
  }
  async function commit(event) {
    event.preventDefault(); if (saving) return;
    const commitSession = session;
    try {
      const d = draft();
      if (!confirmedReview || confirmedReview !== JSON.stringify({ ...d, finalConfirmed: false })) throw Error('A ficha mudou. Toque em Revisar antes de salvar novamente.');
      if (BC2Central.revision() !== baseline) throw Error('O saldo mudou. Reabra esta ficha para usar os dados atualizados.');
      saving = true; $('save').disabled = true;
      document.body.inert = true;
      const tx = await BC2Central.commit(d, baseline);
      baseline = BC2Central.revision(); confirmedReview = null;
      $('save').disabled = true; $('review-wrap').hidden = true;
      renderAll();
      const saved = tx.epi;
      try { await syncEpiProduct(saved); }
      catch { /* O estoque é a fonte primária; a próxima abertura reconstrói o índice. */ }
      if (commitSession !== session) return;
      panel.innerHTML = `<h3>Registro salvo</h3><p>${esc(saved.name)} · ${tx.calculation ? `Entrada de <strong>${tx.calculation.total} ${esc(saved.stockUnit)}(s)</strong>. Saldo: ${saved.quantity} ${esc(saved.stockUnit)}(s).` : 'Cadastro com saldo zero.'}</p><p>A ficha e as fontes foram confirmadas no banco central do BC2.</p><div class="toolbar"><button class="btn" id="bc2-another" type="button">Cadastrar outro EPI</button><button class="btn secondary" id="bc2-done" type="button">Concluir</button></div>`;
      $('another').onclick = () => open('', false); $('done').onclick = close; resetPhoto();
    } catch (error) { status(`Não foi salvo: ${error.message}`, true); if ($('save')) $('save').disabled = false; }
    finally { saving = false; document.body.inert = false; }
  }
  window.BC2NewEpi = {
    open, close, cameraMode: false, get isOpen() { return !panel.hidden; },
    acceptScan(code) {
      this.cameraMode = false;
      if (panel.hidden || !$('barcode')) open(code, true);
      else { $('barcode').value = code; clearSourcedFields(); $('identityConfirmed').checked = false; invalidateReview(); search(); panel.scrollIntoView({ block: 'start' }); }
    }
  };
})();
