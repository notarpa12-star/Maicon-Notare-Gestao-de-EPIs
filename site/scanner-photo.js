(function (root) {
  'use strict';
  const MAX_FILE = 20 * 1024 * 1024;
  let readerPromise;
  function loadReader() {
    if (root.ZXingBrowser?.BrowserMultiFormatReader) return Promise.resolve(root.ZXingBrowser);
    if (!readerPromise) readerPromise = new Promise((resolve, reject) => {
      const script = root.document.createElement('script');
      const timer = setTimeout(() => failed(), 15000);
      function failed() { clearTimeout(timer); script.remove(); readerPromise = null; reject(Error('Não foi possível carregar o leitor. Tente novamente.')); }
      script.src = './vendor/zxing-browser-0.2.1.min.js';
      script.onload = () => { clearTimeout(timer); root.ZXingBrowser?.BrowserMultiFormatReader ? resolve(root.ZXingBrowser) : failed(); };
      script.onerror = failed;
      root.document.head.appendChild(script);
    });
    return readerPromise;
  }
  function codesOnly(values) {
    return [...new Set(values.map(value => String(value || '').trim()).filter(value => value && value.length <= 512))];
  }
  function frameCanvas(source, width, height, zoom = 1, document = root.document) {
    if (!(width > 0 && height > 0)) throw Error('A imagem ainda não está pronta. Tente tirar a foto novamente.');
    const canvas = document.createElement('canvas');
    const cropWidth = width / zoom, cropHeight = height / zoom;
    const scale = Math.min(1, 2400 / Math.max(cropWidth, cropHeight));
    canvas.width = Math.max(1, Math.round(cropWidth * scale));
    canvas.height = Math.max(1, Math.round(cropHeight * scale));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw Error('Não foi possível preparar a foto neste navegador.');
    ctx.drawImage(source, (width - cropWidth) / 2, (height - cropHeight) / 2, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
    return canvas;
  }
  async function fileToCanvas(file) {
    if (file.size > MAX_FILE) throw Error('A foto deve ter até 20 MB. Escolha uma imagem menor.');
    if (file.type && !/^image\/(jpeg|png|webp|gif|bmp|avif|heic|heif)$/i.test(file.type)) throw Error('Escolha uma foto em JPG, PNG ou outro formato de imagem compatível.');
    const url = root.URL.createObjectURL(file);
    const image = new root.Image();
    try {
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(Error('Não foi possível abrir esta foto. Tente uma imagem JPG ou PNG.')); image.src = url; });
      return frameCanvas(image, image.naturalWidth, image.naturalHeight);
    } finally { root.URL.revokeObjectURL(url); image.src = ''; }
  }
  async function decodeCanvas(canvas) {
    // A foto permanece no aparelho. Só o código identificado segue para a consulta existente.
    if (root.BarcodeDetector) {
      try {
        const formats = await root.BarcodeDetector.getSupportedFormats();
        if (formats.length) {
          const codes = codesOnly((await new root.BarcodeDetector({ formats }).detect(canvas)).map(code => code.rawValue));
          if (codes.length) return codes;
        }
      } catch (_) { /* A biblioteca local atende navegadores sem detector compatível. */ }
    }
    const zxing = await loadReader();
    const reader = new zxing.BrowserMultiFormatReader();
    // TRY_HARDER (enum 3) amplia as tentativas na foto, sem iniciar vídeo contínuo.
    reader.hints.set(3, true);
    for (const rotation of [0, 90, 180, 270]) {
      let rotated = canvas;
      if (rotation) {
        rotated = root.document.createElement('canvas');
        rotated.width = rotation % 180 ? canvas.height : canvas.width;
        rotated.height = rotation % 180 ? canvas.width : canvas.height;
        const ctx = rotated.getContext('2d', { willReadFrequently: true });
        ctx.translate(rotated.width / 2, rotated.height / 2); ctx.rotate(rotation * Math.PI / 180);
        ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
      }
      try { const code = reader.decodeFromCanvas(rotated).getText(); if (code) return codesOnly([code]); }
      catch (error) { if (!['NotFoundException','ChecksumException','FormatException'].includes(error.getKind?.() || error.name)) throw error; }
      finally { if (rotated !== canvas) { rotated.width = 0; rotated.height = 0; } }
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    return [];
  }
  function createScanner({ onCode, onReadStart = () => {}, canUse = () => true, document = root.document, navigator = root.navigator, decode = decodeCanvas, loadFile = fileToCanvas } = {}) {
    let stream = null, generation = 0, starting = false, reading = false, zoom = 1, hardwareZoom = false;
    const $ = id => document.getElementById(id);
    const status = text => { $('scannerStatus').textContent = text; };
    const valid = token => token === generation && canUse();
    function buttons() {
      $('startScanner').disabled = starting || reading || Boolean(stream);
      $('stopScanner').disabled = !starting && !stream;
      $('scannerCapture').disabled = !stream || starting || reading;
      $('scannerPhotoButton').disabled = reading || starting;
    }
    function releaseCamera() {
      if (stream) stream.getTracks().forEach(track => track.stop());
      stream = null; starting = false;
      const video = $('scannerVideo'); video.pause(); video.srcObject = null; video.style.transform = 'scale(1)';
      $('scannerVideoPlaceholder').prepend(video); $('scannerFullscreen').hidden = true;
      document.body.classList.remove('scanner-active'); zoom = 1; hardwareZoom = false;
      $('scannerZoomRange').value = '1'; $('scannerZoomLabel').textContent = '1,0×';
      buttons();
    }
    function clearPhoto() {
      const preview = $('scannerPhotoPreview'); preview.width = 0; preview.height = 0;
      $('scannerPhotoResult').hidden = true; $('scannerCodeChoices').replaceChildren();
    }
    function stop(message = 'Câmera desligada.') { generation++; reading = false; releaseCamera(); status(message); }
    async function start() {
      if (!canUse() || starting || stream || reading) return;
      if (!root.isSecureContext) { status('A câmera precisa de HTTPS ou localhost. Você também pode carregar uma foto.'); return; }
      if (!navigator.mediaDevices?.getUserMedia) { status('Este navegador não permite abrir a câmera. Carregue uma foto ou digite o código.'); return; }
      const token = ++generation; starting = true; clearPhoto(); buttons();
      $('scannerFullscreen').hidden = false; document.body.classList.add('scanner-active');
      const video = $('scannerVideo'); $('scannerFullscreen').prepend(video);
      $('scannerCaptureHint').textContent = 'Abrindo câmera…'; status('Solicitando acesso à câmera…');
      try {
        const acquired = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
        if (!valid(token)) { acquired.getTracks().forEach(track => track.stop()); return; }
        stream = acquired; video.srcObject = stream;
        const track = stream.getVideoTracks()[0], capabilities = track?.getCapabilities?.() || {};
        const range = $('scannerZoomRange'); hardwareZoom = Boolean(capabilities.zoom?.max > capabilities.zoom?.min);
        range.min = String(hardwareZoom ? capabilities.zoom.min : 1); range.max = String(hardwareZoom ? capabilities.zoom.max : 3);
        range.step = String(hardwareZoom ? capabilities.zoom.step || .1 : .1); zoom = Number(range.min); range.value = String(zoom);
        if (capabilities.focusMode?.includes('continuous')) { try { await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }); } catch (_) {} }
        if (!valid(token)) return;
        await video.play();
        const deadline = Date.now() + 8000;
        while (valid(token) && !(video.readyState >= 2 && video.videoWidth > 0)) {
          if (Date.now() > deadline) throw Error('A câmera não enviou imagem. Confira as permissões e tente novamente.');
          await new Promise(resolve => setTimeout(resolve, 80));
        }
        if (!valid(token)) return;
        starting = false; buttons();
        $('scannerCaptureHint').textContent = 'Enquadre um único código, ajuste o foco e toque em Tirar foto e ler.';
        status('Câmera pronta. Toque em Tirar foto e ler.');
      } catch (error) {
        if (token !== generation) return;
        stop(error.name === 'NotAllowedError' ? 'Acesso à câmera negado. Autorize a câmera no navegador ou carregue uma foto.' : error.name === 'NotFoundError' ? 'Nenhuma câmera encontrada. Carregue uma foto ou digite o código.' : error.message || 'Não foi possível abrir a câmera.');
      }
    }
    async function read(canvas, source, token) {
      if (!valid(token)) { canvas.width = 0; canvas.height = 0; return; }
      reading = true; buttons(); status('Lendo o código na foto…');
      const preview = $('scannerPhotoPreview'); preview.width = canvas.width; preview.height = canvas.height;
      preview.getContext('2d').drawImage(canvas, 0, 0); $('scannerPhotoResult').hidden = false;
      try {
        const codes = codesOnly(await decode(canvas));
        if (!valid(token)) return;
        const accept = code => { if (!valid(token)) return; $('scannerCodeChoices').replaceChildren(); status('Código identificado na foto. A câmera está desligada. Confira o resultado abaixo.'); onCode(code, source); };
        if (codes.length === 1) accept(codes[0]);
        else if (codes.length > 1) {
          status('Há mais de um código na foto. Escolha o código que deseja consultar.');
          for (const code of codes) { const button = document.createElement('button'); button.type = 'button'; button.className = 'btn secondary'; button.textContent = `Usar código: ${code}`; button.addEventListener('click', () => accept(code)); $('scannerCodeChoices').appendChild(button); }
        } else status('Nenhum código legível encontrado. Tente outra foto com apenas um código inteiro, nítido e sem reflexos, ou digite o código.');
      } catch (error) { if (valid(token)) status(`Não foi possível ler esta foto. ${error.message || 'Tente outra foto ou digite o código.'}`); }
      finally { canvas.width = 0; canvas.height = 0; if (token === generation) { reading = false; buttons(); } }
    }
    async function capture() {
      if (!canUse() || !stream || starting || reading) return;
      onReadStart();
      const video = $('scannerVideo'); let canvas;
      // Copia um único quadro ANTES de desligar as trilhas. A decodificação só começa DEPOIS.
      try { canvas = frameCanvas(video, video.videoWidth, video.videoHeight, hardwareZoom ? 1 : zoom, document); }
      catch (error) { stop(error.message); return; }
      releaseCamera(); const token = ++generation;
      await read(canvas, 'camera', token);
    }
    async function upload(input) {
      const file = input.files?.[0]; input.value = '';
      if (!file || !canUse()) return;
      onReadStart();
      stop('Abrindo foto…'); clearPhoto(); const token = generation; reading = true; buttons();
      try { const canvas = await loadFile(file); await read(canvas, 'photo', token); }
      catch (error) { if (valid(token)) status(error.message || 'Não foi possível abrir a foto. Tente JPG ou PNG.'); }
      finally { if (token === generation) { reading = false; buttons(); } }
    }
    async function setZoom(value) {
      if (!stream || starting) return;
      const range = $('scannerZoomRange'), video = $('scannerVideo');
      let next = Math.min(Number(range.max), Math.max(Number(range.min), Number(value)));
      if (!Number.isFinite(next)) return;
      if (hardwareZoom) {
        try { await stream.getVideoTracks()[0].applyConstraints({ advanced: [{ zoom: next }] }); }
        catch (_) { hardwareZoom = false; range.min = '1'; range.max = '3'; range.step = '.1'; next = Math.min(3, Math.max(1, next)); video.style.transform = `scale(${next})`; }
      } else video.style.transform = `scale(${next})`;
      zoom = next; range.value = String(next); $('scannerZoomLabel').textContent = `${next.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}×`;
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop('Câmera desligada ao sair da tela.'); });
    root.addEventListener?.('pagehide', () => { stop(); clearPhoto(); });
    return { start, stop, capture, upload, clearPhoto, setZoom, stepZoom: direction => setZoom(zoom + Number($('scannerZoomRange').step || .1) * direction) };
  }
  const api = { createScanner, decodeCanvas, frameCanvas, fileToCanvas, codesOnly, MAX_FILE };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BC2PhotoReader = api;
})(typeof window === 'object' ? window : globalThis);
