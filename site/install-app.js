(function (root) {
  'use strict';
  function instructions(navigator) {
    const ua = navigator.userAgent || '';
    const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (ios) return ['Abra este site no Safari.', 'Toque em Compartilhar (quadrado com seta para cima).', 'Escolha Adicionar à Tela de Início. Se aparecer, mantenha Abrir como App ativado. Depois toque em Adicionar.'];
    if (/Android/i.test(ua)) return ['Abra este site no Chrome do celular.', 'Toque no menu ⋮ do navegador.', 'Escolha Instalar aplicativo ou Adicionar à tela inicial e confirme. Se essa opção não aparecer, atualize o navegador ou tente novamente depois.'];
    return ['Abra este site no Chrome ou no Microsoft Edge.', 'Abra o menu do navegador e procure Instalar BC2 ou Aplicativos → Instalar este site como aplicativo.', 'Se a opção não aparecer, atualize o navegador ou use o Chrome do celular.'];
  }
  function createInstaller({ button, help, steps, feedback, navigator = root.navigator, standalone = () => root.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true } = {}) {
    let prompt = null, busy = false;
    function update() {
      const installed = standalone(); button.disabled = installed || busy;
      button.textContent = installed ? 'Aplicativo instalado' : 'Fazer download do aplicativo';
    }
    function showHelp() {
      steps.replaceChildren();
      for (const text of instructions(navigator)) { const li = steps.ownerDocument.createElement('li'); li.textContent = text; steps.appendChild(li); }
      if (!help.open) help.showModal();
    }
    async function install() {
      if (busy || standalone()) return;
      if (!prompt) { showHelp(); return; }
      const event = prompt; prompt = null; busy = true; update(); feedback.textContent = '';
      try {
        await event.prompt(); const result = await event.userChoice;
        feedback.textContent = result.outcome === 'accepted' ? 'Instalação solicitada. Aguarde a confirmação do aparelho.' : 'Instalação cancelada. Você pode tentar novamente pelo menu do navegador.';
      } catch (_) { showHelp(); }
      finally { busy = false; update(); }
    }
    function offered(event) { event.preventDefault(); prompt = event; update(); }
    function installed() { prompt = null; feedback.textContent = 'BC2 instalado. Abra pelo ícone na tela inicial.'; button.textContent = 'Aplicativo instalado'; button.disabled = true; }
    button.addEventListener('click', install); update();
    return { offered, installed, install, update };
  }
  const api = { instructions, createInstaller };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    const doc = root.document;
    const installer = createInstaller({ button: doc.getElementById('installAppButton'), help: doc.getElementById('installAppHelp'), steps: doc.getElementById('installAppSteps'), feedback: doc.getElementById('installAppFeedback') });
    root.addEventListener('beforeinstallprompt', installer.offered); root.addEventListener('appinstalled', installer.installed);
    doc.getElementById('installAppClose').addEventListener('click', () => doc.getElementById('installAppHelp').close());
    root.matchMedia('(display-mode: standalone)').addEventListener?.('change', installer.update);
    root.BC2Installer = installer;
  }
})(typeof window === 'object' ? window : globalThis);
