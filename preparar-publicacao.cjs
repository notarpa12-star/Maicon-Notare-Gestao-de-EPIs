const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.webmanifest':'application/manifest+json' };
const names = ['epi-folders.js','epi-folders.css','scanner-photo.js','install-app.js','vendor/zxing-browser-0.2.1.min.js','index.html','app.js','mobile.css','mobile-ui.js','connection.js','record-client.js','auth-registration.js','epi-core.js','epi-central.js','epi-cadastro.js','epi-cadastro.css','firebase-config.js','service-worker.js','manifest.webmanifest','icons/bc2.svg','icons/bc2-192.png','icons/bc2-512.png'];
const assets = {};
for (const name of names) assets['/' + name] = { type: types[path.extname(name)], data: fs.readFileSync(path.join(root, 'site', name)).toString('base64') };
let source = fs.readFileSync(path.join(root, 'record-store.mjs'), 'utf8').replace(/^export /gm, '') + '\n' + fs.readFileSync(path.join(root, 'worker.mjs'), 'utf8').replace("import { createRecordStore } from './record-store.mjs';", '');
if (!source.includes('export default {')) throw Error('Worker original não encontrado');
source = source.replace('export default {', 'const BC2_BASE_WORKER = {');
source += '\n// Arquivos de interface desta versão; os bindings e o banco existente são preservados.\nconst BC2_RELEASE_ASSETS = ' + JSON.stringify(assets) + ';\n';
source += `
export default {
  async fetch(request, env, ctx) {
    const originalAssets = env.ASSETS;
    const releaseEnv = { ...env, ASSETS: {
      async fetch(assetRequest) {
        const url = new URL(assetRequest.url);
        const key = url.pathname === '/' ? '/index.html' : url.pathname;
        const asset = BC2_RELEASE_ASSETS[key];
        if (!asset) return originalAssets ? originalAssets.fetch(assetRequest) : new Response('Não encontrado', { status:404 });
        const bytes = Uint8Array.from(atob(asset.data), character => character.charCodeAt(0));
        return new Response(assetRequest.method === 'HEAD' ? null : bytes, { headers: {
          'content-type': asset.type, 'cache-control':'no-cache',
          'x-bc2-release':'download-conta-20261109'
        } });
      }
    } };
    return BC2_BASE_WORKER.fetch(request, releaseEnv, ctx);
  }
};
`;
fs.writeFileSync(path.join(root, 'PUBLICAR-WORKER.mjs'), source);
console.log('Worker de atualização preparado com ' + Buffer.byteLength(source) + ' bytes; sem dados do banco embutidos.');

