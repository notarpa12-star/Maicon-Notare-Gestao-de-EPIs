
        const KEY = 'bc2_epi_manager_v1';
        const FIREBASE_CONFIG = window.BC2_FIREBASE_CONFIG || {};
        const FIREBASE_SESSION_KEY = 'bc2_firebase_session_v1';
        const SESSION_NOTICE_KEY = 'bc2_session_notice_v1';
        const IDLE_SESSION_TIMEOUT_MS = 30 * 60 * 1000;
        const PERSONAL_THEMES = {
            bc2: { label: 'BC2 atual', color: '#111315' },
            light: { label: 'Claro', color: '#edf3ee' },
            black: { label: 'Escuro', color: '#050607' },
            aurora: { label: 'Aurora', color: '#08121c' }
        };
        let usersPage = 'home';
        const USERS_ROUTES = { home: '#usuarios', requests: '#usuarios/pedidos', roles: '#niveis-acesso', approved: '#niveis-acesso/pessoas', edit: '#niveis-acesso/editar', create: '#niveis-acesso/criar' };
        let personalSettingsReturnTab = 'dashboard';
        let personalSettingsReturnHash = '';
        const PERSONAL_SETTINGS_HASH = '#configuracoes-pessoais';
        const MAIN_PAGE_TITLE = document.title;
        const epiReferences = [
            ['Capacete de segurança industrial', 'Cabeça e face', 'Proteção da cabeça contra riscos especificados pelo fabricante. Confira tamanho, suspensão, compatibilidade com acessórios e CA.'],
            ['Capacete para eletricista', 'Cabeça e face', 'Modelo destinado a riscos elétricos conforme a classe declarada pelo fabricante. Verifique a especificação e o CA do modelo exato.'],
            ['Capacete para combate a incêndio', 'Cabeça e face', 'Equipamento especializado; características e compatibilidade devem ser confirmadas na documentação do fabricante e no CA.'],
            ['Capuz de proteção', 'Cabeça e face', 'Proteção complementar de cabeça e/ou pescoço para riscos e condições definidos pelo fabricante.'],
            ['Óculos de segurança incolor', 'Cabeça e face', 'Proteção ocular para riscos indicados pelo fabricante. Selecione lentes e cobertura conforme a avaliação de riscos.'],
            ['Óculos de segurança com lente escura', 'Cabeça e face', 'A tonalidade da lente não define, por si só, proteção contra radiação. Confirme filtro e aplicação indicados pelo fabricante.'],
            ['Óculos ampla-visão', 'Cabeça e face', 'Modelo fechado para riscos específicos; confira ventilação, vedação, lente e compatibilidade com outros EPIs.'],
            ['Óculos para soldagem', 'Cabeça e face', 'Filtro deve ser adequado ao processo e declarado pelo fabricante; não escolha apenas pela cor da lente.'],
            ['Protetor facial', 'Cabeça e face', 'Proteção complementar da face. Pode não substituir óculos de segurança; confira o risco e a indicação do fabricante.'],
            ['Máscara de solda', 'Cabeça e face', 'Confira o filtro, tonalidade, processo de soldagem e compatibilidade com o restante da proteção.'],
            ['Protetor auditivo de inserção', 'Proteções auditivas', 'Selecione e ajuste conforme avaliação de ruído e orientação do fabricante; a atenuação depende do uso correto.'],
            ['Protetor auditivo tipo concha', 'Proteções auditivas', 'Confira tamanho, vedação, atenuação declarada e compatibilidade com capacete e óculos.'],
            ['Protetor auditivo semi-inserção', 'Proteções auditivas', 'Confira o modelo e o uso indicado; não presuma a atenuação apenas pelo formato.'],
            ['Respirador filtrante PFF1', 'Proteções complementares', 'A classe não determina adequação universal; confirme contaminante, avaliação de riscos, ajuste facial e aprovação do modelo.'],
            ['Respirador filtrante PFF2', 'Proteções complementares', 'Confirme contaminante, avaliação de riscos, ajuste facial e aprovação do modelo. Não protege contra todos os gases e vapores.'],
            ['Respirador filtrante PFF3', 'Proteções complementares', 'Confirme a indicação e aprovação do modelo, o contaminante e a necessidade de programa de proteção respiratória.'],
            ['Respirador semifacial reutilizável', 'Proteções complementares', 'Filtro/cartucho depende do contaminante. Confira compatibilidade, vedação, manutenção e orientação técnica.'],
            ['Respirador facial inteira', 'Proteções complementares', 'Seleção de filtros, vedação e compatibilidade exigem avaliação específica do contaminante e do fabricante.'],
            ['Respirador com linha de ar', 'Proteções complementares', 'Sistema especializado: confirme fonte e qualidade do ar, configuração, treinamento e instruções do fabricante.'],
            ['Avental impermeável para risco químico', 'Proteção química e climática', 'Compatibilidade depende da substância, concentração, tempo de contato e material declarado pelo fabricante.'],
            ['Macacão de proteção química', 'Proteção química e climática', 'Níveis e compatibilidade variam por modelo e substância. Consulte documentação técnica e avaliação de riscos.'],
            ['Capa de chuva', 'Proteção química e climática', 'Confira proteção declarada, visibilidade, resistência e adequação ao trabalho. Não pressupõe proteção elétrica.'],
            ['Vestuário de alta visibilidade', 'Vestuário', 'Confira classe, área refletiva, cor, uso e norma declarados para o modelo e ambiente.'],
            ['Vestuário de proteção térmica', 'Vestuário', 'Selecione para o agente térmico e condições descritas pelo fabricante; não presuma resistência a chama ou arco elétrico.'],
            ['Vestuário para arco elétrico', 'Vestuário', 'Exige avaliação e especificação técnica apropriadas ao risco elétrico; confirme valores e conjunto compatível com documentação.'],
            ['Camisa de proteção UV', 'Vestuário', 'Confira fator de proteção e condições de uso declarados pelo fabricante; proteja também áreas descobertas conforme avaliação.'],
            ['Luvas de proteção mecânica', 'Mãos e braços', 'Desempenho contra corte, abrasão, perfuração e impacto varia por modelo; confira marcações e aplicação.'],
            ['Luvas anticorte', 'Mãos e braços', 'Nível de corte depende do ensaio e do modelo; não elimina riscos de lâminas ou máquinas. Confira documentação.'],
            ['Luvas de vaqueta / raspa', 'Mãos e braços', 'Modelo e material devem ser compatíveis com a tarefa. Não presuma proteção química ou elétrica.'],
            ['Luvas de proteção química', 'Mãos e braços', 'Material deve ser compatível com produto químico, concentração e tempo de permeação indicados pelo fabricante.'],
            ['Luvas isolantes elétricas', 'Mãos e braços', 'Classe, tensão de uso, ensaios, inspeção e luva de cobertura devem ser definidos por procedimento técnico. Não estimar classe pelo código.'],
            ['Luvas de proteção térmica', 'Mãos e braços', 'Confira tipo de calor, temperatura, duração de contato e desempenho declarados pelo fabricante.'],
            ['Luvas para soldagem', 'Mãos e braços', 'Confira material, comprimento e resistência indicados para o processo. A luva não protege contra todos os riscos.'],
            ['Luvas para vibração', 'Mãos e braços', 'Confirme o desempenho específico e a adequação à ferramenta; não presuma eliminação da exposição à vibração.'],
            ['Manga / mangote de proteção', 'Mãos e braços', 'Proteção complementar; selecione material e comprimento conforme o risco e a compatibilidade com a luva.'],
            ['Creme protetor para a pele', 'Proteção química e climática', 'Use apenas conforme rótulo, avaliação de riscos e orientação de saúde e segurança; não substitui automaticamente luvas.'],
            ['Calçado de segurança', 'Pernas e pés', 'Confira biqueira, solado, resistência e riscos indicados pelo fabricante. O aspecto visual não confirma proteção.'],
            ['Botina de segurança', 'Pernas e pés', 'Confira modelo, CA e características declaradas para o risco; não presuma isolamento elétrico ou resistência química.'],
            ['Bota impermeável de proteção', 'Pernas e pés', 'Confira material, solado e compatibilidade química/térmica declarados para o produto específico.'],
            ['Calçado de proteção elétrica', 'Pernas e pés', 'A especificação elétrica varia por modelo e condição de uso; confirme a documentação e o procedimento de segurança.'],
            ['Perneira de proteção', 'Pernas e pés', 'Confira material e risco coberto pelo modelo. Proteção anticorte para motosserra exige produto especificamente indicado.'],
            ['Perneira para motosserra', 'Pernas e pés', 'Confirme a aplicação e especificação do fabricante; não substitui treinamento, procedimentos ou demais proteções.'],
            ['Joelheira de proteção', 'Pernas e pés', 'Selecione conforme postura e risco; confira ajuste, material e uso indicado pelo fabricante.'],
            ['Avental de raspa', 'Vestuário', 'Confira cobertura e indicação para o processo; não presuma proteção química, térmica ou elétrica sem especificação.'],
            ['Cinturão tipo paraquedista', 'Proteções complementares', 'Componente de sistema de proteção contra queda. Compatibilidade, ancoragem, conexão, inspeção e treinamento são essenciais.'],
            ['Talabarte de segurança', 'Proteções complementares', 'Componente de sistema contra queda. Comprimento, absorvedor, conexão e ancoragem devem ser compatíveis e calculados.'],
            ['Trava-quedas', 'Proteções complementares', 'Use apenas com linha e sistema compatíveis indicados pelo fabricante; confira inspeção, instalação e instruções.'],
            ['Protetor solar', 'Proteção química e climática', 'Produto de proteção da pele; siga rótulo, reaplicação e orientação de saúde ocupacional. Não substitui medidas coletivas.'],
            ['Repelente', 'Proteção química e climática', 'Use conforme rótulo e avaliação de riscos. Verifique compatibilidade com protetor solar e outros produtos.'],
            ['Protetor de nuca compatível com capacete', 'Cabeça e face', 'Acessório complementar; confirme compatibilidade com capacete e demais EPIs.'],
            ['Acessório de proteção facial para roçadeira', 'Cabeça e face', 'Confirme se o conjunto é indicado para o equipamento e o risco; protetor facial pode não reter partículas finas.']
        ].map(([name, category, description]) => ({ name, category, description }));
        const emptyState = () => ({ epiFolders: [], epis: [], employees: [], movements: [], inspections: [], suggestionsAdded: [], version: 1 });
        let localMigrationCandidate = readLocalSnapshot();
        let db = emptyState();
        let secureSession = null;
        let remoteRevision = 0;
        let saveQueue = Promise.resolve();
        let remoteRefreshBlocked = false;
        let adminRoles = [];
        let adminUsers = [];
        let editingRoleId = null;
        let sessionTimer = null;
        let inactivityTimer = null;
        let modalSubmit = null;
        let selectedEpiFolder = '';
        const folders = window.BC2Folders;
        const barcodePhotoScanner = window.BC2PhotoReader.createScanner({
            canUse: () => Boolean(secureSession?.user && can('scanner', 'view') && !window.BC2Connection?.blocked),
            onReadStart: () => {
                barcodeLookupSequence++;
                lastBarcodeProduct = null;
                lastBarcodeProductCode = '';
                document.getElementById('barcodeInput').value = '';
                document.getElementById('barcodeResult').replaceChildren();
            },
            onCode: (code, source) => {
                document.getElementById('barcodeInput').value = code;
                lookupBarcode(source === 'photo' ? 'photo' : true);
            }
        });
        let barcodeLookupSequence = 0;
        let lastBarcodeProduct = null;
        let lastBarcodeProductCode = '';
        const PRODUCT_DB_NAME = 'bc2_epi_product_catalog';
        const PRODUCT_DB_VERSION = 1;
        let productDatabase = null;
        let productDatabaseReady = null;
        let localProducts = [];

        function readLocalSnapshot() {
            try {
                const saved = JSON.parse(localStorage.getItem(KEY));
                if (saved && Array.isArray(saved.epis) && Array.isArray(saved.employees) &&
                    Array.isArray(saved.movements) && Array.isArray(saved.inspections)) return saved;
            } catch (e) { }
            return null;
        }
        function openProductDatabase() {
            if (!('indexedDB' in window)) return Promise.reject(new Error('Este navegador não oferece IndexedDB.'));
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(PRODUCT_DB_NAME, PRODUCT_DB_VERSION);
                request.onupgradeneeded = () => {
                    const database = request.result;
                    if (!database.objectStoreNames.contains('products')) {
                        database.createObjectStore('products', { keyPath: 'barcode' });
                    }
                };
                request.onsuccess = () => {
                    productDatabase = request.result;
                    productDatabase.onversionchange = () => productDatabase.close();
                    resolve(productDatabase);
                };
                request.onerror = () => reject(request.error || new Error('Não foi possível abrir o banco local de produtos.'));
                request.onblocked = () => reject(new Error('O banco local está bloqueado por outra aba. Feche outras abas do site e tente novamente.'));
            });
        }
        function productTransaction(operation) {
            return new Promise((resolve, reject) => {
                if (!productDatabase) {
                    reject(new Error('O banco local de produtos não está disponível.'));
                    return;
                }
                const transaction = productDatabase.transaction('products', operation === 'getAll' ? 'readonly' : 'readwrite');
                const store = transaction.objectStore('products');
                let result;
                let request;
                if (operation === 'getAll') request = store.getAll();
                else if (operation.action === 'put') request = store.put(operation.product);
                else if (operation.action === 'update') {
                    store.delete(operation.oldBarcode);
                    request = store.put(operation.product);
                }
                else if (operation.action === 'delete') request = store.delete(operation.barcode);
                else if (operation.action === 'import') operation.products.forEach(product => store.put(product));
                else if (operation.action === 'replace') {
                    store.clear();
                    operation.products.forEach(product => store.put(product));
                }
                else if (operation.action === 'clear') request = store.clear();
                if (request) request.onsuccess = () => { result = request.result; };
                transaction.oncomplete = () => resolve(result);
                transaction.onerror = () => reject(transaction.error || new Error('Não foi possível gravar no banco local de produtos.'));
                transaction.onabort = () => reject(transaction.error || new Error('A operação no banco local de produtos foi cancelada.'));
            });
        }
        function productFromEpi(epi) {
            return {
                barcode: String(epi.barcode || '').trim(),
                name: epi.name || '',
                category: epi.category || '',
                manufacturer: epi.brand || epi.manufacturer || '',
                model: epi.model || '',
                ca: epi.ca || '',
                description: epi.notes || '',
                materials: epi.materials || '',
                protection: epi.protection || '',
                intendedUse: epi.intendedUse || '',
                limitations: epi.limitations || '',
                size: epi.size || '',
                color: epi.color || '',
                standards: epi.standards || '',
                quantity: '',
                imageUrl: '',
                productUrl: '',
                source: 'Cadastro local de EPI',
                notes: '',
                updatedAt: epi.updatedAt || epi.createdAt || new Date().toISOString()
            };
        }
        async function initializeProductDatabase() {
            const status = document.getElementById('scannerStatus');
            try {
                await openProductDatabase();
                localProducts = await productTransaction('getAll');
                const productsByCode = new Map(localProducts.map(product => [String(product.barcode).trim(), product]));
                const serverProducts = Array.isArray(db.productCatalog) ? db.productCatalog : [];
                serverProducts.forEach(product => {
                    if (product?.barcode) productsByCode.set(String(product.barcode).trim(), product);
                });
                localProducts = [...productsByCode.values()];
                if (serverProducts.length) {
                    await productTransaction({ action: 'import', products: serverProducts });
                    localProducts = await productTransaction('getAll');
                }
                const indexedCodes = new Set(localProducts.map(product => product.barcode));
                const legacyProducts = db.epis
                    .filter(epi => String(epi.barcode || '').trim() && !indexedCodes.has(String(epi.barcode).trim()))
                    .map(productFromEpi);
                if (legacyProducts.length) {
                    await productTransaction({ action: 'import', products: legacyProducts });
                    localProducts = await productTransaction('getAll');
                }
                status.textContent = `Catálogo de consulta pronto: ${localProducts.length} produto(s) disponíveis neste aparelho.`;
                return true;
            } catch (error) {
                status.textContent = `Não foi possível abrir os dados de produtos para a leitura: ${error.message || 'verifique o suporte do navegador.'}`;
                return false;
            }
        }
        async function refreshLocalProducts() {
            localProducts = await productTransaction('getAll');
        }
        async function saveCentralProductCatalog(saved, previous = null) {
            if (!secureSession || !can('scanner', 'view')) return false;
            const central = [...(Array.isArray(db.productCatalog) ? db.productCatalog : [])];
            const oldBarcode = String(previous?.barcode || '').trim();
            const current = oldBarcode ? central.find(product => String(product.barcode).trim() === oldBarcode) : null;
            if (!current) {
                if (!can('scanner', 'create')) {
                    alert('A ficha foi salva neste aparelho, mas não foi enviada ao catálogo compartilhado. É necessária a permissão Cadastrar na aba Leitor de código.');
                    return false;
                }
                central.push(saved);
            } else if (oldBarcode !== String(saved.barcode).trim()) {
                if (!can('scanner', 'delete') || !can('scanner', 'create')) {
                    alert('A ficha foi salva neste aparelho. Para mudar um código que já está no catálogo compartilhado, o seu nível precisa permitir Excluir e Cadastrar no leitor.');
                    return false;
                }
                const index = central.findIndex(product => String(product.barcode).trim() === oldBarcode);
                central.splice(index, 1, saved);
            } else {
                if (!can('scanner', 'edit')) {
                    alert('A ficha foi salva neste aparelho, mas não foi enviada ao catálogo compartilhado. É necessária a permissão Editar na aba Leitor de código.');
                    return false;
                }
                const index = central.findIndex(product => String(product.barcode).trim() === oldBarcode);
                central[index] = saved;
            }
            db.productCatalog = central;
            return await save();
        }
        async function syncEpiProduct(epi) {
            if (!String(epi.barcode || '').trim() || !await productDatabaseReady) return;
            const barcode = String(epi.barcode).trim();
            const existingProduct = findLocalProduct(barcode);
            const saved = {
                ...(existingProduct || {}),
                ...productFromEpi(epi),
                description: epi.notes || existingProduct?.description || '',
                materials: epi.materials || existingProduct?.materials || '',
                protection: epi.protection || existingProduct?.protection || '',
                intendedUse: epi.intendedUse || existingProduct?.intendedUse || '',
                limitations: epi.limitations || existingProduct?.limitations || '',
                size: epi.size || existingProduct?.size || '',
                color: epi.color || existingProduct?.color || '',
                standards: epi.standards || existingProduct?.standards || '',
                imageUrl: existingProduct?.imageUrl || '',
                productUrl: existingProduct?.productUrl || '',
                source: existingProduct?.source || 'Cadastro próprio',
                notes: existingProduct?.notes || '',
                updatedAt: new Date().toISOString()
            };
            await productTransaction({
                action: 'put',
                product: saved
            });
            await refreshLocalProducts();
        }
        function localProductDetails(product) {
            return [
                ['Código de barras', product.barcode],
                ['Categoria', product.category],
                ['Fabricante / marca', product.manufacturer],
                ['Modelo', product.model],
                ['CA', product.ca],
                ['Descrição', product.description],
                ['Materiais', product.materials],
                ['Proteção declarada', product.protection],
                ['Uso indicado', product.intendedUse],
                ['Limitações / alertas', product.limitations],
                ['Tamanho', product.size],
                ['Cor', product.color],
                ['Normas / especificações declaradas', product.standards],
                ['Conteúdo / quantidade da embalagem', product.quantity],
                ['Fonte dos dados', product.source],
                ['Observações', product.notes]
            ].filter(([, value]) => value);
        }
        function openProductForm(existing = null, suggestedBarcode = '', externalProduct = null, reference = null) {
            if (!can('scanner', existing ? 'edit' : 'create')) { alert('Seu nível não permite cadastrar ou editar produtos no leitor.'); return; }
            const initial = existing || {};
            const external = externalProduct || {};
            const sourceNotes = externalProduct ? publicProductNotes(externalProduct) : '';
            openForm(existing ? 'Editar produto do catálogo local' : 'Cadastrar produto no catálogo local', [
                { name: 'barcode', label: 'Código de barras / GTIN', required: true, value: suggestedBarcode },
                { name: 'name', label: 'Nome do produto', required: true },
                { name: 'category', label: 'Categoria do EPI', value: '' },
                { name: 'manufacturer', label: 'Fabricante / marca' },
                { name: 'model', label: 'Modelo / referência' },
                { name: 'ca', label: 'CA - Certificado de Aprovação (confira no documento oficial)' },
                { name: 'description', label: 'Descrição do produto', type: 'textarea', full: true },
                { name: 'materials', label: 'Material / composição' },
                { name: 'protection', label: 'Tipo de proteção declarada' },
                { name: 'intendedUse', label: 'Uso indicado pelo fabricante', type: 'textarea', full: true },
                { name: 'limitations', label: 'Limitações / alertas do fabricante', type: 'textarea', full: true },
                { name: 'size', label: 'Tamanho / numeração' },
                { name: 'color', label: 'Cor' },
                { name: 'standards', label: 'Normas / especificações informadas pelo fabricante' },
                { name: 'quantity', label: 'Conteúdo / quantidade por embalagem' },
                { name: 'imageUrl', label: 'URL da imagem (HTTPS)' },
                { name: 'productUrl', label: 'URL da ficha do fabricante (HTTPS)' },
                { name: 'source', label: 'Fonte dos dados' },
                { name: 'notes', label: 'Observações', type: 'textarea', full: true }
            ], {
                ...initial,
                barcode: initial.barcode || suggestedBarcode,
                name: initial.name || external.name || reference?.name || '',
                category: initial.category || (external.categories || external.category || '').split(',')[0].trim() || reference?.category || '',
                manufacturer: initial.manufacturer || external.brands || '',
                model: initial.model || external.quantity || '',
                ca: initial.ca || '',
                description: initial.description || reference?.description || '',
                materials: initial.materials || '',
                protection: initial.protection || '',
                intendedUse: initial.intendedUse || '',
                limitations: initial.limitations || (reference ? 'Confirmar os limites e a aplicação na ficha do fabricante e na avaliação de riscos.' : ''),
                size: initial.size || '',
                color: initial.color || '',
                standards: initial.standards || '',
                quantity: initial.quantity || external.quantity || '',
                imageUrl: initial.imageUrl || external.imageUrl || '',
                productUrl: initial.productUrl || external.productUrl || '',
                source: initial.source || (externalProduct ? (externalProduct.source || 'Base pública colaborativa; conferir') : 'Cadastro próprio'),
                notes: initial.notes || sourceNotes
            }, async values => {
                values.barcode = String(values.barcode || '').trim();
                values.name = String(values.name || '').trim();
                if (!values.barcode || !values.name) {
                    alert('Informe o código de barras e o nome do produto.');
                    return false;
                }
                if (localProducts.some(product => product.barcode === values.barcode && product !== existing)) {
                    alert('Já existe um produto com esse código no catálogo local.');
                    return false;
                }
                const saved = {
                    ...initial,
                    ...values,
                    createdAt: initial.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                await productTransaction({ action: 'put', product: saved });
                await refreshLocalProducts();
                await saveCentralProductCatalog(saved, existing);
                document.getElementById('scannerStatus').textContent = `Produto "${saved.name}" salvo para consultas pela leitura de código.`;
            });
        }
        function findLocalProduct(barcode) {
            return localProducts.find(product => String(product.barcode).trim() === barcode) || null;
        }
        function renderLocalProduct(product, scanNotice) {
            const fields = localProductDetails(product);
            const imageUrl = /^https:\/\//i.test(product.imageUrl || '') ? product.imageUrl : '';
            const productUrl = /^https:\/\//i.test(product.productUrl || '') ? product.productUrl : '';
            const image = imageUrl ? `<img id="localProductImage" src="${esc(imageUrl)}" alt="Imagem de ${esc(product.name)}" loading="lazy" referrerpolicy="no-referrer">` : '';
            const rows = fields.map(([label, value]) => `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join('');
            document.getElementById('barcodeResult').innerHTML = `${scanNotice}
                <div class="notice"><strong>Produto encontrado no banco local.</strong> Os dados foram cadastrados neste navegador.</div>
                <article class="panel"><div class="product-result ${image ? '' : 'no-image'}">${image}<div>
                    <h3>${esc(product.name)}</h3>
                    ${rows ? `<dl class="product-details">${rows}</dl>` : ''}
                    ${productUrl ? `<p><a href="${esc(productUrl)}" target="_blank" rel="noopener noreferrer">Abrir ficha do produto</a></p>` : ''}
                </div></div>
                <div class="toolbar">
                    <button class="btn" type="button" data-ui-action="addLocalProductToStock">Usar ficha para cadastrar/atualizar estoque</button>
                    <button class="btn secondary" type="button" data-ui-action="editScannedLocalProduct">Editar dados do produto</button>
                </div></article>`;
            const productImage = document.getElementById('localProductImage');
            if (productImage) productImage.addEventListener('error', () => productImage.remove());
        }
        function addLocalProductToStock() {
            const code = document.getElementById('barcodeInput').value.trim();
            const product = findLocalProduct(code);
            if (!product) {
                alert('O produto não está mais disponível no catálogo local. Leia novamente o código.');
                return;
            }
            const existingEpi = db.epis.find(epi => String(epi.barcode || '').trim() === code);
            openEpi(existingEpi || null, product.name, product.barcode, product);
        }
        function editScannedLocalProduct() {
            const code = document.getElementById('barcodeInput').value.trim();
            const product = findLocalProduct(code);
            if (product) openProductForm(product);
        }
        async function deleteLocalProduct(barcode) {
            const product = findLocalProduct(barcode);
            if (db.epis.some(epi => String(epi.barcode || '').trim() === barcode)) {
                alert('Este produto está vinculado ao estoque de EPIs. Remova ou altere o código no estoque antes de excluir o produto do catálogo.');
                return;
            }
            if (!product || !confirm(`Excluir "${product.name}" do catálogo local?`)) return;
            await productTransaction({ action: 'delete', barcode });
            await refreshLocalProducts();
        }
        function ensureEpiUnitData(data, persist = true) {
            let changed = false;
            const usedCodes = new Set();
            data.epis.forEach(epi => {
                if (!Array.isArray(epi.units)) {
                    const count = Math.max(0, Math.floor(Number(epi.quantity) || 0));
                    epi.units = [];
                    for (let i = 0; i < count; i++) epi.units.push(newEpiUnit(epi, usedCodes));
                    epi.quantity = count;
                    changed = true;
                } else {
                    epi.units.forEach(unit => {
                        if (!unit.code || usedCodes.has(unit.code)) {
                            unit.code = createUnitCode(epi, usedCodes);
                            changed = true;
                        } else usedCodes.add(unit.code);
                        unit.employeeId = unit.employeeId || '';
                        unit.retired = Boolean(unit.retired);
                    });
                    const available = availableUnits(epi).length;
                    if (Number(epi.quantity) !== available) {
                        epi.quantity = available;
                        changed = true;
                    }
                }
            });
            if (changed && persist) {
                try { localStorage.setItem(KEY, JSON.stringify(data)); }
                catch (e) { alert('Os códigos únicos foram criados nesta sessão, mas não foi possível salvá-los no navegador. Exporte um backup e verifique o espaço disponível.'); }
            }
            return changed;
        }
        async function apiRequest(path, options = {}) {
            await window.BC2Connection?.waitUntilReady();
            const idToken = await getFirebaseIdToken();
            let response;
            try { response = await fetch(`/api/${path}`, {
                ...options,
                headers: { ...(options.body ? { 'content-type': 'application/json' } : {}), ...(idToken ? { authorization: `Bearer ${idToken}` } : {}), ...(options.headers || {}) },
                cache: 'no-store'
            }); } catch (error) { window.BC2Connection?.fail(); throw error; }
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw Object.assign(new Error(body.error || `Falha no servidor (${response.status}).`), { status: response.status, body });
            if (body.status && body.status !== 'active' && path === 'session') throw Object.assign(new Error('Seu acesso não está ativo.'), { status: 403, body });
            return body;
        }
        const recordClient = BC2Records.create(apiRequest, can);
        let pendingRecordSaves = 0;
        let recordRefreshNeeded = false;
        let recordWriteEpoch = 0;
        async function loadRemoteState() {
            if (pendingRecordSaves) return;
            const epoch = recordWriteEpoch;
            let state;
            try { state = await recordClient.load(() => epoch === recordWriteEpoch && pendingRecordSaves === 0); }
            catch (error) { if (error.localEdit) return false; throw error; }
            remoteRevision = state.revision;
            db = { ...emptyState(), ...state.data };
            remoteRefreshBlocked = false;
            recordRefreshNeeded = false;
            renderAll();
        }
        function planRecordSave(snapshot) {
            if (remoteRefreshBlocked) throw Error('Há uma alteração sem confirmação. Recarregue e confira o banco antes de continuar.');
            recordWriteEpoch++;
            return recordClient.plan(snapshot);
        }
        async function commitRecordSave(changes) {
            if (remoteRefreshBlocked) throw Error('Uma alteração anterior não foi confirmada. Recarregue e confira o banco.');
            const result = await recordClient.commit(changes);
            remoteRevision = result.revision;
            if (result.refreshRequired) recordRefreshNeeded = true;
            return result;
        }
        function save() {
            if (!secureSession?.user) { alert('Seu acesso ainda não foi confirmado. A alteração não foi gravada.'); return; }
            let changes;
            try { changes = planRecordSave(JSON.parse(JSON.stringify(db))); }
            catch (error) { alert(error.message); return Promise.resolve(false); }
            renderAll();
            pendingRecordSaves++;
            saveQueue = saveQueue.then(() => commitRecordSave(changes)).then(() => true).catch(error => {
                remoteRefreshBlocked = true;
                alert('A alteração não foi confirmada no banco central. ' + error.message + '\nRecarregue os dados e confira antes de repetir.');
                return false;
            }).finally(() => { pendingRecordSaves--; });
            return saveQueue;
        }
        function id() { return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); }
        function createUnitCode(epi, usedCodes = new Set()) {
            const label = String(epi.name || epi.category || 'EPI')
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 12).replace(/-$/g, '') || 'EPI';
            let code;
            do { code = `BC2-${label}-${id().replace(/[^a-z0-9]/gi, '').slice(-10).toUpperCase()}`; }
            while (usedCodes.has(code));
            return code;
        }
        function newEpiUnit(epi, usedCodes = new Set(db.epis.flatMap(e => (e.units || []).map(unit => unit.code)))) {
            const code = createUnitCode(epi, usedCodes);
            usedCodes.add(code);
            return { id: id(), code, employeeId: '', retired: false, createdAt: new Date().toISOString() };
        }
        function availableUnits(epi) {
            return (epi.units || []).filter(unit => !unit.employeeId && !unit.retired);
        }
        function adjustUnitStock(epi, delta) {
            if (!Number.isInteger(delta)) return false;
            if (delta > 0) {
                const usedCodes = new Set(db.epis.flatMap(item => (item.units || []).map(unit => unit.code)));
                for (let i = 0; i < delta; i++) epi.units.push(newEpiUnit(epi, usedCodes));
            } else if (delta < 0) {
                const available = availableUnits(epi);
                if (available.length < Math.abs(delta)) return false;
                available.slice(-Math.abs(delta)).forEach(unit => { unit.retired = true; });
            }
            epi.quantity = availableUnits(epi).length;
            return true;
        }
        function findEpiUnit(code) {
            for (const epi of db.epis) {
                const unit = (epi.units || []).find(item => item.code === code);
                if (unit) return { epi, unit };
            }
            return null;
        }
        function printUnitLabels(epiId) {
            const epi = getEpi(epiId);
            if (!epi) return;
            const units = availableUnits(epi);
            if (!units.length) { alert('Este EPI não tem unidades disponíveis no estoque para imprimir etiquetas.'); return; }
            
            const unitTitle = [epi.folder || epi.name, epi.folder && epi.name.toLocaleLowerCase() !== epi.folder.toLocaleLowerCase() ? epi.name : '', epi.size ? `Tamanho ${epi.size}` : ''].filter(Boolean).join(' · ');
            const labels = units.map(unit => `<article class="label"><strong>${esc(unitTitle)}</strong><svg class="barcode" data-code="${esc(unit.code)}"></svg><span>${esc(unit.code)}</span></article>`).join('');
            openPrintWindow(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Etiquetas - ${esc(epi.name)}</title>
                <style>body{font-family:Arial,sans-serif;margin:12mm}.labels{display:grid;grid-template-columns:repeat(2,1fr);gap:8mm}.label{border:1px dashed #777;padding:5mm;text-align:center;break-inside:avoid}.label strong,.label span{display:block}.label span{font-size:12px;overflow-wrap:anywhere}.barcode{max-width:100%;height:55px}.warning{color:#b4232d}@media print{.warning{display:none}}</style></head>
                <body><div class="labels">${labels}</div><p class="warning" id="writerWarning"></p>
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.12.1/dist/JsBarcode.all.min.js"><\/script>
                </body></html>`, printDocument => {
                    if (typeof printDocument.JsBarcode !== 'function') {
                        const warning = printDocument.document.getElementById('writerWarning');
                        if (warning) warning.textContent = 'Não foi possível carregar o gerador de código de barras. Conecte-se à internet e imprima novamente.';
                        return false;
                    }
                    printDocument.document.querySelectorAll('.barcode').forEach(svg => printDocument.JsBarcode(svg, svg.dataset.code, { format: 'CODE128', displayValue: false, margin: 2, height: 48 }));
                    return true;
                });
        }
        function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
        function fmtDate(v) { if (!v) return 'Não informado'; const [y, m, d] = v.split('-'); return `${d}/${m}/${y}`; }
        function today() { return new Date().toISOString().slice(0, 10); }
        function getEpi(i) { return db.epis.find(x => x.id === i); }
        function getEmp(i) { return db.employees.find(x => x.id === i); }
        function epiName(i) {
            const epi = getEpi(i);
            if (!epi) return 'EPI removido';
            const folder = String(epi.folder || '').trim();
            const name = String(epi.name || '').trim();
            const parts = [folder || name];
            if (folder && name && name.toLocaleLowerCase() !== folder.toLocaleLowerCase()) parts.push(name);
            if (epi.size) parts.push(`Tam. ${epi.size}`);
            return parts.filter(Boolean).join(' · ');
        }
        function empName(i) { return getEmp(i)?.name || 'Não associado'; }
        function currentHeld(empId, epiId) {
            return db.movements.filter(m => m.employeeId === empId && m.epiId === epiId)
                .filter(m => !m.unitCode)
                .reduce((s, m) => s + (m.type === 'Entrega' ? m.qty : m.type === 'Devolução' ? -m.qty : 0), 0);
        }
        function stockClass(e) {
            if (e.expiry && e.expiry < today()) return 'danger';
            if (e.expiry && (new Date(e.expiry) - new Date(today())) / 86400000 <= 30) return 'warn';
            return '';
        }
        function statusBadge(s, cls = '') { return `<span class="badge ${cls}">${esc(s)}</span>`; }

        document.getElementById('nav').addEventListener('click', e => {
            const b = e.target.closest('button[data-tab]'); if (!b) return;
            if (b.dataset.tab !== 'scanner') stopScanner();
            document.body.classList.remove('epi-folder-page');
            selectedEpiFolder = '';
            if (location.hash.startsWith('#estoque/pasta/')) history.replaceState(null, '', location.pathname + location.search);
            document.body.classList.remove('personal-settings-page');
            document.body.classList.remove('users-access-page');
            document.title = MAIN_PAGE_TITLE;
            personalSettingsReturnTab = b.dataset.tab;
            document.querySelectorAll('nav button').forEach(x => x.classList.toggle('active', x === b));
            document.querySelectorAll('.section').forEach(x => x.classList.toggle('active', x.id === b.dataset.tab));
            if (b.dataset.tab === 'users') showUsersHome(false);
            else if (Object.values(USERS_ROUTES).includes(location.hash)) {
                history.replaceState(null, '', location.pathname + location.search);
                document.body.classList.remove('users-access-page');
            }
            renderAll();
            window.BC2Mobile?.onTab(b.dataset.tab);
        });
        function goTab(tab) { document.querySelector(`nav button[data-tab="${tab}"]`)?.click(); }
        function applyPersonalTheme(theme) {
            const chosen = Object.hasOwn(PERSONAL_THEMES, theme) ? theme : 'bc2';
            document.documentElement.dataset.theme = chosen;
            const meta = document.querySelector('meta[name="theme-color"]');
            if (meta) meta.content = PERSONAL_THEMES[chosen].color;
            document.querySelectorAll('.theme-option').forEach(button => {
                button.setAttribute('aria-pressed', String(button.dataset.theme === chosen));
            });
        }
        function showPersonalSettingsPage() {
            if (!secureSession?.user) return;
            stopScanner();
            document.body.classList.remove('epi-folder-page');
            document.body.classList.remove('users-access-page');
            document.body.classList.add('personal-settings-page');
            document.title = 'Configurações pessoais | BC2';
            document.querySelectorAll('nav button').forEach(button => button.classList.remove('active'));
            document.querySelectorAll('.section').forEach(section => section.classList.toggle('active', section.id === 'personalSettings'));
            renderPersonalSettings();
            document.getElementById('personalSettingsTitle')?.focus();
            window.BC2Mobile?.onSubpage('Minha conta');
            window.scrollTo(0, 0);
        }
        function openPersonalSettings() {
            if (!secureSession?.user) return;
            if (location.hash !== PERSONAL_SETTINGS_HASH) {
                const current = document.querySelector('.section.active');
                if (current && current.id !== 'personalSettings') personalSettingsReturnTab = current.id;
                personalSettingsReturnHash = location.hash;
                history.pushState({ bc2Page: 'personalSettings', returnTab: personalSettingsReturnTab, returnHash: personalSettingsReturnHash }, '',
                    location.pathname + location.search + PERSONAL_SETTINGS_HASH);
            } else if (history.state?.bc2Page === 'personalSettings') {
                personalSettingsReturnTab = history.state.returnTab || 'dashboard';
                personalSettingsReturnHash = history.state.returnHash || '';
            }
            showPersonalSettingsPage();
        }
        function restoreMainPage() {
            document.body.classList.remove('personal-settings-page');
            document.body.classList.remove('users-access-page');
            document.title = MAIN_PAGE_TITLE;
            for (const field of ['currentPassword', 'newPersonalPassword', 'confirmPersonalPassword', 'emailChangeCurrentPassword']) {
                const input = document.getElementById(field); if (input) input.value = '';
            }
            if (window.BC2Folders?.fromRoute(location.hash)) { syncEpiFolderRoute(); return; }
            const available = document.querySelector(`#nav button[data-tab="${CSS.escape(personalSettingsReturnTab)}"]:not([hidden])`)
                || document.querySelector('#nav button[data-tab]:not([hidden])');
            if (available) available.click();
        }
        function backFromPersonalSettings() {
            if (location.hash === PERSONAL_SETTINGS_HASH && history.state?.bc2Page === 'personalSettings') {
                history.back();
            } else {
                if (location.hash === PERSONAL_SETTINGS_HASH) history.replaceState(null, '', location.pathname + location.search + personalSettingsReturnHash);
                restoreMainPage();
            }
        }
        function syncPersonalSettingsRoute() {
            if (!secureSession?.user) return;
            if (location.hash === PERSONAL_SETTINGS_HASH) openPersonalSettings();
            else if (document.body.classList.contains('personal-settings-page')) restoreMainPage();
        }
        window.addEventListener('popstate', syncPersonalSettingsRoute);
        window.addEventListener('hashchange', syncPersonalSettingsRoute);
        function renderPersonalSettings() {
            const user = secureSession?.user;
            if (!user) return;
            document.getElementById('personalCurrentName').textContent = user.display_name || 'Nome não informado';
            document.getElementById('personalCurrentEmail').textContent = user.email || '';
            document.getElementById('personalName').value = user.display_name || '';
            applyPersonalTheme(secureSession.theme || 'bc2');
        }
        function showUsersHome(navigate = true) {
            if (navigate) openUsersPage('home');
            else renderUsersPage('home');
        }
        function renderUsersPage(page) {
            document.body.classList.remove('epi-folder-page');
            usersPage = page;
            const pages = { home: 'usersHome', requests: 'usersRequestsPage', roles: 'usersRolesPage', approved: 'usersApprovedPage', edit: 'usersEditRolesPage', create: 'usersCreateRolePage' };
            for (const [key, id] of Object.entries(pages)) document.getElementById(id).hidden = key !== page;
            document.body.classList.toggle('users-access-page', page !== 'home');
            if (page !== 'home') {
                stopScanner();
                document.querySelectorAll('.section').forEach(section => section.classList.toggle('active', section.id === 'users'));
                document.getElementById(pages[page] + 'Title')?.focus();
                document.title = (document.getElementById(pages[page] + 'Title')?.textContent || 'Usuários e níveis') + ' | BC2';
            } else document.title = MAIN_PAGE_TITLE;
            window.BC2Mobile?.onSubpage(page === 'home' ? 'Usuários e níveis' : document.title);
            window.scrollTo(0, 0);
        }
        function openUsersPage(page) {
            if (!Object.hasOwn(USERS_ROUTES, page) || !secureSession?.user || !can('users', 'view')) return;
            if (page === 'create') newRole();
            if (location.hash !== USERS_ROUTES[page]) history.pushState({ bc2Page: 'users', page }, '', location.pathname + location.search + USERS_ROUTES[page]);
            renderUsersPage(page);
            loadAdminPanels();
        }
        function syncUsersRoute() {
            if (!secureSession?.user) return;
            const page = Object.keys(USERS_ROUTES).find(key => USERS_ROUTES[key] === location.hash);
            if (page && can('users', 'view')) {
                document.body.classList.remove('personal-settings-page');
            document.body.classList.remove('users-access-page');
                renderUsersPage(page);
                document.querySelectorAll('.section').forEach(section => section.classList.toggle('active', section.id === 'users'));
                loadAdminPanels();
            } else if (document.body.classList.contains('users-access-page')) {
                document.body.classList.remove('users-access-page');
                if (location.hash !== PERSONAL_SETTINGS_HASH) restoreMainPage();
            }
        }
        window.addEventListener('popstate', syncUsersRoute);
        window.addEventListener('hashchange', syncUsersRoute);
        function closeModal() { document.getElementById('modalBackdrop').classList.remove('open'); modalSubmit = null; }
        function openForm(title, fields, initial, onSave) {
            document.getElementById('modalTitle').textContent = title;
            const box = document.getElementById('modalFields');
            box.innerHTML = fields.map(f => {
                if (f.type === 'html') return f.html || '';
                const val = initial?.[f.name] ?? f.value ?? '';
                const full = f.full ? 'full' : '';
                let input = '';
                if (f.type === 'select') {
                    input = `<select id="${esc(f.name)}" name="${esc(f.name)}" ${f.required ? 'required' : ''}>${(f.options || []).map(o => {
                        const value = typeof o === 'string' ? o : o.value;
                        const label = typeof o === 'string' ? o : o.label;
                        return `<option value="${esc(value)}" ${String(value) === String(val) ? 'selected' : ''}>${esc(label)}</option>`;
                    }).join('')}</select>`;
                } else if (f.type === 'textarea') {
                    input = `<textarea id="${esc(f.name)}" name="${esc(f.name)}" ${f.required ? 'required' : ''}>${esc(val)}</textarea>`;
                } else if (f.type === 'datalist') {
                    const listId = `${f.name}Suggestions`;
                    input = `<input id="${esc(f.name)}" name="${esc(f.name)}" type="text" list="${esc(listId)}" value="${esc(val)}" ${f.required ? 'required' : ''} ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ''}><datalist id="${esc(listId)}">${(f.options || []).map(option => `<option value="${esc(typeof option === 'string' ? option : option.value)}"></option>`).join('')}</datalist>`;
                } else {
                    input = `<input id="${esc(f.name)}" name="${esc(f.name)}" type="${f.type || 'text'}" value="${esc(val)}" ${f.required ? 'required' : ''} ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.max !== undefined ? `max="${f.max}"` : ''} ${f.step ? `step="${f.step}"` : ''} ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ''}>`;
                }
                return `<div class="field ${full}"><label for="${esc(f.name)}">${esc(f.label)}${f.required ? ' *' : ''}</label>${input}${f.hint ? `<small class="field-hint">${esc(f.hint)}</small>` : ''}</div>`;
            }).join('');
            document.getElementById('modalBackdrop').classList.add('open');
            modalSubmit = onSave;
        }
        document.getElementById('modalForm').addEventListener('submit', e => {
            e.preventDefault(); if (!modalSubmit) return;
            const values = Object.fromEntries(new FormData(e.target).entries());
            try {
                const result = modalSubmit(values);
                if (result && typeof result.then === 'function') {
                    result.then(saved => { if (saved !== false) closeModal(); })
                        .catch(error => alert(`Não foi possível salvar: ${error.message || 'verifique os dados e tente novamente.'}`));
                } else if (result !== false) closeModal();
            } catch (error) {
                alert(`Não foi possível salvar: ${error.message || 'verifique os dados e tente novamente.'}`);
            }
        });
        document.getElementById('modalBackdrop').addEventListener('click', e => { if (e.target.id === 'modalBackdrop') closeModal(); });

        function openEpi(existing = null, suggestedName = '', suggestedBarcode = '', productLookup = null, options = {}) {
            if (!can('epis', existing ? 'edit' : 'create')) { alert('Seu nível não permite essa alteração no estoque de EPIs.'); return; }
            const template = options.template || {};
            const x = existing || {};
            if (options.template) { suggestedName = template.name || ''; suggestedBarcode = ''; }
            openForm(existing ? 'Editar EPI' : options.template ? 'Adicionar tamanho do EPI' : 'Cadastrar EPI', [
                { name: 'name', label: 'Nome do equipamento', required: true, value: suggestedName },
                { name: 'folder', label: 'Pasta do EPI', type: 'select', options: [{value:'',label:'Sem pasta'}, ...folders.list(db).map(folder=>({value:folder.name,label:folder.name}))], hint: 'Para uma nova pasta, use Criar pasta na página do estoque.' },
                { name: 'stockUnit', label: 'Unidade do estoque', required: true, type: 'select', options: existing?.stockUnit ? [{value:existing.stockUnit,label:existing.stockUnit==='par'?'Par':'Unidade'}] : [{value:'',label:'Escolha par ou unidade'},{value:'par',label:'Par'},{value:'unidade',label:'Unidade'}] },
                { name: 'size', label: 'Tamanho / numeração', value: productLookup?.size || '' },
                { name: 'brand', label: 'Marca', value: '' },
                { name: 'ca', label: 'CA - Certificado de Aprovação', value: '' },
                { name: 'serial', label: 'Número de série (se aplicável)', value: '' },
                { name: 'lot', label: 'Lote (se aplicável)', value: '' },
                { name: 'quantity', label: 'Quantidade disponível na unidade escolhida', type: 'number', min: 0, step: 1, required: true, value: x.quantity ?? 1 },
                { name: 'minimumStock', label: 'Mínimo para alerta de reposição', type: 'number', min: 0, step: 1, required: true, value: x.minimumStock ?? (existing ? 0 : 5), hint: 'Quando o saldo ficar abaixo deste número, o EPI aparecerá na Visão geral.' },
                { name: 'notes', label: 'Observações', type: 'textarea', full: true }
            ], {
                ...x,
                name: x.name || suggestedName,
                folder: existing ? folders.nameOf(x) : selectedEpiFolder || '',
                stockUnit: x.stockUnit || template.stockUnit || '',
                size: x.size || productLookup?.size || '',
                brand: x.brand || x.manufacturer || template.brand || template.manufacturer || productLookup?.brands || productLookup?.manufacturer || '',
                ca: x.ca || template.ca || productLookup?.approval || '',
                notes: x.notes || (productLookup ? (productLookup.categories !== undefined
                    ? publicProductNotes(productLookup)
                    : localProductDetails(productLookup).map(([label, value]) => `${label}: ${value}`).join('\n')) : ''),
                quantity: x.quantity ?? (options.template ? 0 : 1),
                minimumStock: x.minimumStock ?? (existing ? 0 : 5),
                condition: x.condition || 'Não avaliado'
            }, async v => {
                if (!['par','unidade'].includes(v.stockUnit)) { alert('Escolha par ou unidade.'); return false; }
                if (existing && !existing.stockUnit && !confirm('Confirma que o saldo e o histórico deste cadastro antigo estão em '+(v.stockUnit==='par'?'pares':'unidades')+'? Nenhuma conversão será feita.')) return false;
                v.quantity = Number(v.quantity);
                if (!Number.isSafeInteger(v.quantity) || v.quantity < 0 || v.quantity > 10000) { alert('Informe uma quantidade inteira de 0 a 10.000.'); return false; }
                v.minimumStock = Number(v.minimumStock);
                if (!Number.isSafeInteger(v.minimumStock) || v.minimumStock < 0) { alert('Informe um estoque mínimo inteiro igual ou maior que zero.'); return false; }
                v.folder = String(v.folder || '').trim().slice(0, 100);
                if (selectedEpiFolder && !existing) v.folder = selectedEpiFolder;
                v.size = String(v.size || '').trim().slice(0, 40);
                if (v.folder && !folders.list(db).some(folder=>folders.key(folder.name)===folders.key(v.folder))) { alert('A pasta não existe mais. Reabra o cadastro.'); return false; }
                // Keep barcode and legacy details behind the form so scanning and prior records continue working.
                v.barcode = String(existing?.barcode || suggestedBarcode || productLookup?.barcode || '').trim();
                if (productLookup) v.category = existing?.category || (productLookup.categories || productLookup.category || '').split(',')[0].trim();
                if (v.barcode && db.epis.some(e => e !== existing && String(e.barcode || '').trim() === v.barcode)) {
                    alert('Este código de barras já está vinculado a outro EPI.'); return false;
                }
                if (existing) {
                    const old = availableUnits(existing).length;
                    if (!adjustUnitStock(existing, v.quantity - old)) {
                        alert('Não é possível reduzir o estoque abaixo da quantidade de unidades disponíveis.');
                        return;
                    }
                    Object.assign(existing, v);
                    existing.quantity = availableUnits(existing).length;
                    if (old !== existing.quantity) db.movements.push({
                        id: id(), date: today(), type: existing.quantity > old ? 'Ajuste positivo' : 'Ajuste negativo',
                        epiId: existing.id, qty: Math.abs(existing.quantity - old),
                        notes: `Ajuste manual de saldo: ${old} para ${existing.quantity}.`,
                        employeeId: '', responsible: 'Responsável pelo sistema'
                    });
                } else {
                    const epi = {
                        id: id(), ...v, ...(productLookup ? { productLookup } : {}),
                        quantity: 0, units: [], createdAt: new Date().toISOString()
                    };
                    if (template.model) epi.model = template.model;
                    db.epis.push(epi);
                    adjustUnitStock(epi, v.quantity);
                }
                if (!await save()) return false;
                const savedEpi = existing || db.epis[db.epis.length - 1];
                syncEpiProduct(savedEpi).catch(error => alert(`O EPI foi salvo no estoque, mas não foi possível atualizar o catálogo local de produtos: ${error.message || 'verifique o banco local.'}`));
            });
        }
        function editEpi(i) { const x = getEpi(i); if (x) openEpi(x); }
        function deleteEpi(i) {
            if (!can('epis', 'delete')) { alert('Seu nível não permite excluir cadastros de EPIs.'); return; }
            if (db.movements.some(m => m.epiId === i) || db.inspections.some(m => m.epiId === i)) {
                alert('Este EPI possui histórico. Edite a ficha ou marque-o como baixado para manter os registros anteriores.'); return;
            }
            if (confirm('Excluir este cadastro de EPI?')) { db.epis = db.epis.filter(x => x.id !== i); save(); }
        }
        function createEpiFolder() {
            if (!can('epis','create')) { alert('Seu nível não permite criar pastas.'); return; }
            openForm('Criar pasta', [{name:'name',label:'Nome da pasta',required:true}], {}, async values=>{
                const name=folders.validateName(values.name,folders.list(db));
                (db.epiFolders ||= []).push({id:id(),name});
                return await save();
            });
        }
        function addExistingEpiToFolder() {
            if (!can('epis','edit')) { alert('Seu nível não permite organizar EPIs.'); return; }
            const candidates=db.epis.filter(epi=>folders.key(folders.nameOf(epi))!==folders.key(selectedEpiFolder));
            if(!selectedEpiFolder||!candidates.length){alert('Não há EPIs de outras pastas para adicionar.');return;}
            const destination=selectedEpiFolder;
            openForm('Adicionar EPI à pasta',[
                {name:'epiId',label:'EPI existente',required:true,type:'select',options:[{value:'',label:'Escolha um EPI'},...candidates.map(epi=>({value:epi.id,label:[epi.name,epi.size&&('Tam. '+epi.size),'Pasta: '+folders.nameOf(epi)].filter(Boolean).join(' · ')}))]},
                {type:'html',html:'<p class="muted full">O cadastro será movido para esta pasta. Saldo, códigos individuais e histórico serão preservados.</p>'}
            ],{},async values=>{
                const epi=getEpi(values.epiId);
                if(!epi||!folders.list(db).some(folder=>folders.key(folder.name)===folders.key(destination)))throw Error('A pasta ou o EPI mudou. Recarregue e confira.');
                epi.folder=destination;
                return await save();
            });
        }
        function openEpiSize(recordId) {
            const template=getEpi(recordId);
            if(template)openEpi(null,'','',null,{template});
        }
        function openEpiFolder(name) {
            if(!secureSession?.user||!can('epis','view'))return;
            selectedEpiFolder=name;
            if(location.hash!==folders.route(name))history.pushState({bc2Page:'epiFolder'},'',location.pathname+location.search+folders.route(name));
            stopScanner();
            document.body.classList.remove('personal-settings-page','users-access-page','mobile-home');
            document.querySelectorAll('.section').forEach(section=>section.classList.toggle('active',section.id==='epis'));
            document.querySelectorAll('#nav button[data-tab]').forEach(button=>button.classList.toggle('active',button.dataset.tab==='epis'));
            document.getElementById('epiFolderSearch').value='';
            renderEpis();
            document.getElementById('epiFolderTitle').focus();
            window.BC2Mobile?.onSubpage(name);
            window.scrollTo(0,0);
        }
        function closeEpiFolder() {
            selectedEpiFolder='';
            document.body.classList.remove('epi-folder-page');
            history.pushState({bc2Page:'stock'},'',location.pathname+location.search+'#app/epis');
            document.title=MAIN_PAGE_TITLE;
            renderEpis();
            window.BC2Mobile?.onSubpage('Estoque de EPIs');
            window.scrollTo(0,0);
        }
        function syncEpiFolderRoute() {
            if(!secureSession?.user)return;
            const name=folders.fromRoute(location.hash);
            if(name&&can('epis','view'))openEpiFolder(name);
            else if(document.body.classList.contains('epi-folder-page')){
                selectedEpiFolder='';document.body.classList.remove('epi-folder-page');
                if(location.hash==='#app/epis'){
                    document.querySelectorAll('.section').forEach(section=>section.classList.toggle('active',section.id==='epis'));
                    document.title=MAIN_PAGE_TITLE;renderEpis();window.BC2Mobile?.onSubpage('Estoque de EPIs');
                }
            }
        }
        window.addEventListener('popstate',syncEpiFolderRoute);
        window.addEventListener('hashchange',syncEpiFolderRoute);
        function renderEpis() {
            const all=folders.list(db),routeName=folders.fromRoute(location.hash);
            selectedEpiFolder=routeName;
            const selected=all.find(folder=>folders.key(folder.name)===folders.key(routeName));
            const folderGrid=document.getElementById('epiFolders'),zeroStockSection=document.getElementById('epiZeroStockSection'),folderContents=document.getElementById('epiFolderContents');
            const opened=Boolean(routeName&&can('epis','view'));
            document.body.classList.toggle('epi-folder-page',opened);
            folderContents.hidden=!opened;folderGrid.hidden=opened;
            for(const button of document.querySelectorAll('[data-ui-action="createEpiFolder"],[data-ui-action="openEpi"]'))button.hidden=!can('epis','create');
            document.getElementById('addExistingEpiButton').hidden=!can('epis','edit');
            if(!opened){
                const search=document.getElementById('epiSearch').value;
                const matches=all.filter(folder=>folders.key(folder.name).includes(folders.key(search))||folder.items.some(epi=>folders.matches(epi,search)));
                const visible=matches.filter(folder=>folder.declared||folder.items.some(epi=>Number(epi.quantity)>0));
                const zero=matches.filter(folder=>!folder.declared&&folder.items.every(epi=>!(Number(epi.quantity)>0)));
                folderGrid.innerHTML=visible.length?visible.map(renderEpiFolderCard).join(''):'<div class="panel"><p class="muted">Nenhuma pasta nesta busca. Use Criar pasta ou Cadastrar EPI.</p></div>';
                zeroStockSection.hidden=!zero.length;
                document.getElementById('epiZeroStockCount').textContent=zero.reduce((n,f)=>n+f.items.length,0);
                document.getElementById('epiZeroFolders').innerHTML=zero.map(renderEpiFolderCard).join('');
                return;
            }
            zeroStockSection.hidden=true;
            document.querySelectorAll('.section').forEach(section=>section.classList.toggle('active',section.id==='epis'));
            document.querySelectorAll('#nav button[data-tab]').forEach(button=>button.classList.toggle('active',button.dataset.tab==='epis'));
            document.title=(selected?.name||routeName)+' | BC2';
            document.getElementById('epiFolderTitle').textContent=selected?.name||routeName;
            document.getElementById('epiFolderSummary').textContent=selected?(selected.items.length+' cadastro(s) · '+folders.summary(selected.items)):'Pasta não encontrada. Volte ao estoque e confira.';
            if(document.getElementById('epis').classList.contains('active'))window.BC2Mobile?.onSubpage(selected?.name||routeName);
            const items=(selected?.items||[]).filter(epi=>folders.matches(epi,document.getElementById('epiFolderSearch').value));
            document.getElementById('epiFolderActions').hidden=!selected;
            const renderVariant = x => {
                const quantity = Number(x.quantity) || 0;
                const lowStock = Number(x.minimumStock) > 0 && quantity < Number(x.minimumStock);
                const detailRows = [
                    ['Categoria', x.category], ['Marca', x.brand || x.manufacturer], ['Unidade de estoque', x.stockUnit || 'Não definida no cadastro antigo'],
                    ...(x.model ? [['Modelo / referência (cadastro anterior)', x.model]] : []),
                    ['Código de barras', x.barcode], ['Série / lote', [x.serial, x.lot].filter(Boolean).join(' · ')],
                    ['Mínimo para reposição', Number(x.minimumStock) || 0], ['Validade', fmtDate(x.expiry)],
                    ['Situação', x.condition || 'Não avaliado'],
                    ['Observações', x.notes]
                ].map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value !== null && value !== undefined && value !== '' ? value : 'Não informado')}</dd></div>`).join('');
                const labelCount = availableUnits(x).length;
                return `<article class="epi-variant-card">
                    <div class="epi-variant-heading">
                        <div><span class="epi-variant-size">Numeração: ${esc(x.size || 'não informada')}</span><h3>${esc(x.name || selected.name)}</h3></div>
                        <div class="epi-variant-available ${lowStock ? 'is-low' : ''}"><strong>${quantity}</strong><span>${esc(x.stockUnit === 'par' ? 'pares disponíveis' : x.stockUnit === 'unidade' ? 'unidades disponíveis' : 'disponível (unidade antiga)')}</span></div>
                    </div>
                    <div class="epi-variant-ca"><span>CA · Certificado de Aprovação</span><strong>${esc(x.ca || 'Não informado')}</strong></div>
                    <details class="epi-variant-details"><summary>Ver outras informações</summary><dl>${detailRows}</dl></details>
                    <div class="epi-variant-actions no-print">
                        <button class="btn secondary small" type="button" data-ui-action="editEpi" data-record-id="${esc(x.id)}">Editar</button>
                        ${labelCount ? `<button class="btn secondary small" type="button" data-ui-action="printUnitLabels" data-record-id="${esc(x.id)}">Etiquetas do estoque (${labelCount})</button>` : ''}
                        <button class="btn danger small" type="button" data-ui-action="deleteEpi" data-record-id="${esc(x.id)}">Excluir</button>
                    </div>
                </article>`;
            };

            document.getElementById('epiVariantGrid').innerHTML=items.length?folders.models(items).map(group=>
                '<section class="epi-model"><div class="epi-model-head"><div><h3>'+esc(group.name)+'</h3><p>'+esc([group.sample.brand||group.sample.manufacturer,group.sample.model,group.sample.ca&&('CA: '+group.sample.ca)].filter(Boolean).join(' · '))+'</p><p>'+esc(folders.summary(group.items))+'</p></div>'+
                (can('epis','create')?'<button class="btn secondary small" type="button" data-ui-action="openEpiSize" data-record-id="'+esc(group.sample.id)+'">+ Adicionar tamanho</button>':'')+'</div><div class="epi-variant-grid">'+group.items.map(renderVariant).join('')+'</div></section>'
            ).join(''):'<div class="panel"><p class="muted">'+(selected?.items.length?'Nenhum EPI corresponde à busca nesta pasta.':'Esta pasta está vazia. Cadastre um EPI ou adicione um cadastro existente.')+'</p></div>';
        }
        function renderEpiFolderCard(folder) {
            return '<button class="epi-folder-card" type="button" data-ui-action="openEpiFolder" data-folder-name="'+esc(folder.name)+'"><span class="epi-folder-heading"><span class="folder-icon" aria-hidden="true"></span><strong>'+esc(folder.name)+'</strong></span><span class="epi-folder-total"><strong>'+esc(folders.summary(folder.items))+'</strong><span>no estoque</span></span><span class="muted">'+folder.items.length+' cadastro(s) de EPI</span><span class="epi-folder-open-hint">Abrir pasta →</span></button>';
        }
        function normalizePublicProduct(product, code) {
            const knownFields = new Set(['code','product_name','generic_name','product_type','brands','manufacturer','brand_owner','model','categories','quantity','product_quantity','product_quantity_unit','packaging_text','packaging','materials','description','product_details','dimensions','weight','net_weight','product_properties','ingredients_text','labels','origins','manufacturing_places','countries','allergens','traces','stores','image_front_url','image_url','product_url','link','size','ca','certification','approval']);
            const ignoredField = /(^id$|_tags$|_t$|_data$|_score$|_n$|^rev$|^creator$|^owner|^editors|^informers|^photographers|^sources|^images?$|^selected_images$|^languages?|^complete$|^completeness$|^nutriment|^nova_|^ecoscore|^popularity|^scans?_|^states?$)/i;
            const otherDetails = Object.entries(product).filter(([key, value]) => {
                if (knownFields.has(key) || ignoredField.test(key)) return false;
                return (typeof value === 'string' && value.trim() && value.length <= 500) ||
                    (typeof value === 'number' && Number.isFinite(value)) ||
                    (Array.isArray(value) && value.length && value.length <= 20 && value.every(item => ['string','number'].includes(typeof item)));
            }).map(([key, value]) => [key.replaceAll('_', ' '), Array.isArray(value) ? value.join(', ') : String(value)]);
            return {
                code,
                name: String(product.product_name || product.generic_name || '').trim(),
                genericName: String(product.generic_name || '').trim(),
                productType: String(product.product_type || '').trim(),
                brands: String(product.brands || '').trim(),
                manufacturer: String(product.manufacturer || product.brand_owner || '').trim(),
                model: String(product.model || '').trim(),
                categories: String(product.categories || '').trim(),
                quantity: String([product.quantity, product.product_quantity, product.product_quantity_unit].filter(Boolean).join(' ') || '').trim(),
                packaging: String(product.packaging_text || product.packaging || '').trim(),
                materials: String(product.materials || '').trim(),
                description: String(product.description || product.product_details || '').trim(),
                dimensions: String(product.dimensions || '').trim(),
                weight: String(product.weight || product.net_weight || '').trim(),
                size: String(product.size || '').trim(),
                approval: String(product.ca || product.certification || product.approval || '').trim(),
                productProperties: Array.isArray(product.product_properties) ? product.product_properties.join(', ') : String(product.product_properties || '').trim(),
                otherDetails,
                ingredients: String(product.ingredients_text || '').trim(),
                labels: String(product.labels || '').trim(),
                origins: String(product.origins || '').trim(),
                manufacturingPlaces: String(product.manufacturing_places || '').trim(),
                countries: String(product.countries || '').trim(),
                allergens: String(product.allergens || '').trim(),
                traces: String(product.traces || '').trim(),
                stores: String(product.stores || '').trim(),
                imageUrl: String(product.image_front_url || product.image_url || '').trim(),
                productUrl: String(product.product_url || product.link || '').trim(),
                source: `Base pública colaborativa · ${product.product_type || 'tipo não informado'}`
            };
        }
        async function lookupPublicBarcodeProduct(code) {
            const url = `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(code)}.json?product_type=all&cc=br&lc=pt&tags_lc=pt&fields=all`;
            const response = await fetch(url, { headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error(`A base pública respondeu com HTTP ${response.status}.`);
            const data = await response.json();
            const found = data.status === 1 || ['success', 'success_with_warnings', 'success_with_errors'].includes(data.status);
            return found && data.product ? normalizePublicProduct(data.product, code) : null;
        }
        function publicProductNotes(product) {
            const details = [
                ['Quantidade / conteúdo', product.quantity],
                ['Embalagem', product.packaging],
                ['Material informado', product.materials],
                ['Modelo', product.model],
                ['Fabricante', product.manufacturer],
                ['Tamanho / numeração', product.size],
                ['CA / aprovação informado', product.approval],
                ['Descrição / ficha', product.description],
                ['Dimensões', product.dimensions],
                ['Peso', product.weight],
                ['Propriedades', product.productProperties],
                ['Ingredientes / descrição', product.ingredients],
                ['Rótulos', product.labels],
                ['Origem', product.origins],
                ['Local de fabricação', product.manufacturingPlaces],
                ['Países', product.countries],
                ['Alergênicos', product.allergens],
                ['Traços', product.traces],
                ['Lojas', product.stores],
                ['Página do produto', product.productUrl]
            ].filter(([, value]) => value);
            return [
                `Informações importadas de ${product.source || 'uma base pública colaborativa'}.`,
                product.categories ? `Categorias: ${product.categories}` : '',
                ...details.map(([label, value]) => `${label}: ${value}`),
                ...(product.otherDetails || []).map(([label, value]) => `${label}: ${value}`)
            ].filter(Boolean).join('\n');
        }
        function showUnlinkedBarcode(code, scanNotice, message = '') {
            document.getElementById('barcodeResult').innerHTML = `${scanNotice}
                ${message ? `<div class="notice warn">${esc(message)}</div>` : ''}
                <div class="notice warn">A consulta não confirmou uma ficha pública para o código <strong>${esc(code)}</strong>. Isso não significa que o código seja inválido: o fabricante pode não ter publicado os dados nessas bases.</div>
                <p><a href="https://www.gs1.org/services/verified-by-gs1" target="_blank" rel="noopener noreferrer">Tentar uma consulta gratuita no Verified by GS1</a> (informe o mesmo código no site).</p>
                <div class="toolbar"><button class="btn" type="button" data-ui-action="openProductFormFromBarcode">Preencher ficha completa do produto</button>
                <button class="btn secondary" type="button" data-ui-action="openEpiFromBarcode">Cadastrar manualmente no estoque</button></div>`;
        }
        function renderPublicProduct(product, scanNotice) {
            const details = [
                ['Código de barras', product.code],
                ['Marca / fabricante', product.brands],
                ['Fabricante informado', product.manufacturer],
                ['Modelo', product.model],
                ['Tipo de produto', product.productType],
                ['Categorias', product.categories],
                ['Nome genérico', product.genericName],
                ['Quantidade / conteúdo', product.quantity],
                ['Embalagem', product.packaging],
                ['Material informado', product.materials],
                ['Tamanho / numeração', product.size],
                ['CA / aprovação informado', product.approval],
                ['Descrição / ficha', product.description],
                ['Dimensões', product.dimensions],
                ['Peso', product.weight],
                ['Propriedades', product.productProperties],
                ['Ingredientes / descrição', product.ingredients],
                ['Rótulos', product.labels],
                ['Origem', product.origins],
                ['Local de fabricação', product.manufacturingPlaces],
                ['Países', product.countries],
                ['Alergênicos', product.allergens],
                ['Traços', product.traces],
                ['Lojas', product.stores]
                ,...(product.otherDetails || [])
            ].filter(([, value]) => value);
            const imageUrl = /^https:\/\//i.test(product.imageUrl) ? product.imageUrl : '';
            const productUrl = /^https:\/\//i.test(product.productUrl) ? product.productUrl : '';
            const image = imageUrl ? `<img id="publicProductImage" src="${esc(imageUrl)}" alt="Imagem de ${esc(product.name)}" loading="lazy" referrerpolicy="no-referrer">` : '';
            const rows = details.map(([label, value]) => `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join('');
            document.getElementById('barcodeResult').innerHTML = `${scanNotice}
                <div class="notice"><strong>Produto encontrado na base pública.</strong> Confira os dados antes de adicionar ao catálogo.</div>
                <article class="panel">
                    <div class="product-result ${image ? '' : 'no-image'}">${image}<div>
                        <h3>${esc(product.name || 'Produto sem nome cadastrado')}</h3>
                        ${rows ? `<dl class="product-details">${rows}</dl>` : '<p class="muted">A base retornou apenas o código de barras, sem outros detalhes.</p>'}
                        ${productUrl ? `<p><a href="${esc(productUrl)}" target="_blank" rel="noopener noreferrer">Ver registro na base pública</a></p>` : ''}
                        <p class="muted">Fonte: ${esc(product.source || 'base pública colaborativa')}. Os dados podem estar incompletos; confira a embalagem e a ficha do fabricante. O código de barras sozinho não confirma CA, validade nem adequação do EPI.</p>
                    </div></div>
                    <div class="toolbar">
                        <button class="btn" type="button" data-ui-action="addScannedProductToCatalog">Usar dados para cadastrar/atualizar estoque</button>
                        <button class="btn secondary" type="button" data-ui-action="openEpiFromScannedProduct">Completar ficha do EPI</button>
                    </div>
                </article>`;
            const productImage = document.getElementById('publicProductImage');
            if (productImage) productImage.addEventListener('error', () => productImage.remove());
        }
        function addScannedProductToCatalog() {
            const code = document.getElementById('barcodeInput').value.trim();
            if (!lastBarcodeProduct || lastBarcodeProductCode !== code) {
                alert('Leia o código novamente para carregar os dados do produto antes de adicioná-lo.');
                return;
            }
            const existing = db.epis.find(epi => String(epi.barcode || '').trim() === code);
            const product = lastBarcodeProduct;
            openEpi(existing || null, product.name, code, product);
        }
        async function lookupBarcode(fromCamera = false) {
            if (fromCamera && window.BC2NewEpi?.cameraMode) { BC2NewEpi.acceptScan(document.getElementById('barcodeInput').value.trim()); return; }
            const code = document.getElementById('barcodeInput').value.trim();
            const result = document.getElementById('barcodeResult');
            const requestId = ++barcodeLookupSequence;
            lastBarcodeProduct = null;
            lastBarcodeProductCode = '';
            if (!code) {
                result.innerHTML = '<div class="notice warn">Informe ou leia um código de barras.</div>';
                return;
            }
            const scanNotice = fromCamera ? '<div class="notice">Código identificado na foto. A câmera está desligada. Confira o produto antes de cadastrar ou registrar entrada.</div>' : '';
            await productDatabaseReady;
            if (requestId !== barcodeLookupSequence || document.getElementById('barcodeInput').value.trim() !== code) return;
            const tracked = findEpiUnit(code);
            if (tracked) {
                const { epi, unit } = tracked;
                const employee = getEmp(unit.employeeId);
                const product = findLocalProduct(String(epi.barcode || '').trim()) || productFromEpi(epi);
                const details = localProductDetails(product).map(([label, value]) => `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join('');
                let action = '';
                if (unit.retired) {
                    action = '<div class="notice warn">Esta unidade foi baixada e não pode ser vinculada novamente.</div>';
                } else if (employee) {
                    action = `<div class="notice">Vinculado a: <strong>${esc(employee.name)}</strong>${employee.registration ? ` · Matrícula: ${esc(employee.registration)}` : ''}</div>
                        <div class="toolbar"><button class="btn" type="button" data-ui-action="returnScannedUnit">Registrar devolução ao estoque</button></div>`;
                } else {
                    const employees = db.employees.filter(item => (item.status || 'Ativo') === 'Ativo');
                    const options = employees.map(item => `<option value="${esc(item.id)}">${esc(item.name)}${item.registration ? ` · ${esc(item.registration)}` : ''}</option>`).join('');
                    action = employees.length
                        ? `<div class="field"><label for="unitEmployeeSelect">Vincular esta unidade ao colaborador</label><select id="unitEmployeeSelect"><option value="">Selecione um colaborador</option>${options}</select></div>
                            <div class="toolbar"><button class="btn" type="button" data-ui-action="assignScannedUnit">Entregar e vincular</button></div>`
                        : '<div class="notice warn">Cadastre um colaborador ativo antes de vincular esta unidade.</div>';
                }
                result.innerHTML = `${scanNotice}<article class="panel">
                    <h3>${esc(product.name || epi.name)}</h3>
                    ${details ? `<dl class="product-details">${details}</dl>` : ''}
                    <div class="notice">Código único da unidade: <strong>${esc(unit.code)}</strong><br>
                    Situação: <strong>${unit.retired ? 'Baixada' : employee ? `Com ${esc(employee.name)}` : 'Disponível'}</strong><br>
                    Unidades disponíveis deste produto: <strong>${availableUnits(epi).length}</strong></div>${action}
                </article>`;
                return;
            }
            await productDatabaseReady;
            if (requestId !== barcodeLookupSequence || document.getElementById('barcodeInput').value.trim() !== code) return;
            const epi = db.epis.find(e => String(e.barcode || '').trim() === code);
            if (epi) {
                const product = findLocalProduct(code) || productFromEpi(epi);
                const details = localProductDetails(product).map(([label, value]) => `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join('');
                result.innerHTML = `${scanNotice}<article class="panel"><h3>${esc(product.name || epi.name)}</h3>
                    ${details ? `<dl class="product-details">${details}</dl>` : ''}
                    <div class="notice">Saldo disponível: <strong>${epi.quantity} ${esc(epi.stockUnit || '(unidade antiga não definida)')}</strong></div>
                    <p><button class="btn" type="button" data-ui-action="openEpiPackaging" data-code="${esc(code)}">Registrar entrada por caixa / pacote</button></p>
                    <form id="barcodeMovementForm" class="form-grid" data-ui-submit="recordBarcodeMovement">
                        <div class="field"><label for="barcodeMoveType">Movimento do estoque</label>
                        <select id="barcodeMoveType"><option value="Ajuste positivo">Entrada no estoque</option><option value="Ajuste negativo">Saída do estoque</option></select></div>
                        <div class="field"><label for="barcodeMoveQty">Quantidade (${esc(epi.stockUnit || 'unidade antiga não definida')})</label>
                        <input id="barcodeMoveQty" type="number" min="1" step="1" value="1" required></div>
                        <div class="field full"><label for="barcodeResponsible">Responsável (opcional)</label>
                        <input id="barcodeResponsible" type="text" placeholder="Nome de quem registrou"></div>
                        <div class="field full"><button class="btn" type="submit">Atualizar estoque</button></div>
                    </form>`;
                result.innerHTML += '</article>';
                document.getElementById('barcodeMovementForm').dataset.epiId = epi.id;
                document.getElementById('barcodeMovementForm').dataset.code = code;
                return;
            }
            BC2NewEpi.open(code, true);
        }
        function assignScannedUnit() {
            if (!can('epis', 'edit') || !can('movements', 'create')) { alert('Seu nível não permite entregar/vincular uma unidade.'); return; }
            const code = document.getElementById('barcodeInput').value.trim();
            const tracked = findEpiUnit(code);
            const employee = getEmp(document.getElementById('unitEmployeeSelect')?.value);
            if (!tracked || tracked.unit.retired || tracked.unit.employeeId) {
                alert('Esta unidade não está disponível para entrega. Leia novamente o código para conferir a situação.');
                return;
            }
            if (!employee || (employee.status || 'Ativo') !== 'Ativo') {
                alert('Selecione um colaborador ativo.');
                return;
            }
            if (tracked.epi.quantity < 1) {
                alert('Não há saldo disponível para esta unidade.');
                return;
            }
            tracked.unit.employeeId = employee.id;
            tracked.epi.quantity = availableUnits(tracked.epi).length;
            db.movements.push({
                id: id(), date: today(), type: 'Entrega', employeeId: employee.id,
                epiId: tracked.epi.id, qty: 1, serial: tracked.unit.code, unitCode: tracked.unit.code,
                responsible: '', notes: `EPI individual vinculado ao colaborador pelo código ${tracked.unit.code}.`,
                createdAt: new Date().toISOString()
            });
            save();
            lookupBarcode();
        }
        function returnScannedUnit() {
            if (!can('epis', 'edit') || !can('movements', 'create')) { alert('Seu nível não permite registrar devoluções.'); return; }
            const code = document.getElementById('barcodeInput').value.trim();
            const tracked = findEpiUnit(code);
            if (!tracked || tracked.unit.retired || !tracked.unit.employeeId) {
                alert('Esta unidade não está vinculada a um colaborador.');
                return;
            }
            const employeeId = tracked.unit.employeeId;
            tracked.unit.employeeId = '';
            tracked.epi.quantity = availableUnits(tracked.epi).length;
            db.movements.push({
                id: id(), date: today(), type: 'Devolução', employeeId,
                epiId: tracked.epi.id, qty: 1, serial: tracked.unit.code, unitCode: tracked.unit.code,
                responsible: '', notes: `Devolução da unidade identificada pelo código ${tracked.unit.code}.`,
                createdAt: new Date().toISOString()
            });
            save();
            lookupBarcode();
        }
        function linkBarcodeToEpi() {
            if (!can('epis', 'edit')) { alert('Seu nível não permite vincular códigos aos EPIs.'); return; }
            const code = document.getElementById('barcodeInput').value.trim();
            const epi = getEpi(document.getElementById('barcodeEpiSelect').value);
            if (!code || !epi) { alert('Informe um código válido e selecione um EPI.'); return; }
            if (db.epis.some(e => e !== epi && String(e.barcode || '').trim() === code)) {
                alert('Este código de barras já está vinculado a outro EPI.'); return;
            }
            epi.barcode = code;
            save();
            lookupBarcode();
        }
        function startScanner() { return barcodePhotoScanner.start(); }
        function stopScanner(message) { return barcodePhotoScanner.stop(message); }
        function setScannerZoom(value) { return barcodePhotoScanner.setZoom(value); }
        function stepScannerZoom(direction) { return barcodePhotoScanner.stepZoom(direction); }
        function recordBarcodeMovement(event) {
            if (!can('epis', 'edit') || !can('movements', 'create')) { alert('Seu nível não permite ajustar o estoque pelo leitor.'); return; }
            event.preventDefault();
            const form = event.currentTarget;
            const epiId = form.dataset.epiId;
            const code = form.dataset.code;
            const epi = getEpi(epiId);
            const qty = Number(document.getElementById('barcodeMoveQty').value);
            const type = document.getElementById('barcodeMoveType').value;
            if (!epi || !Number.isInteger(qty) || qty <= 0) {
                alert('Informe uma quantidade inteira maior que zero.');
                return;
            }
            const delta = type === 'Ajuste positivo' ? qty : -qty;
            if (epi.quantity + delta < 0) {
                alert(`Saldo insuficiente. Disponível: ${epi.quantity}.`);
                return;
            }
            if (!adjustUnitStock(epi, delta)) {
                alert(`Saldo insuficiente. Disponível: ${epi.quantity}.`);
                return;
            }
            db.movements.push({
                id: id(), date: today(), type, employeeId: '', epiId, qty,
                serial: epi.serial || epi.lot || code,
                responsible: document.getElementById('barcodeResponsible').value.trim(),
                notes: `Movimentação registrada pela leitura do código de barras ${code}.`,
                createdAt: new Date().toISOString()
            });
            save();
            lookupBarcode();
        }
        document.getElementById('barcodeInput').addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                lookupBarcode();
            }
        });
        function openEmployee(x = null) {
            if (!can('employees', x ? 'edit' : 'create')) { alert('Seu nível não permite essa alteração nos colaboradores.'); return; }
            openForm(x ? 'Editar colaborador' : 'Cadastrar colaborador', [
                { name: 'name', label: 'Nome completo', required: true },
                { name: 'registration', label: 'Matrícula / código interno' },
                { name: 'role', label: 'Função', required: true },
                { name: 'sector', label: 'Setor / equipe' },
                { name: 'status', label: 'Situação', type: 'select', options: ['Ativo', 'Afastado', 'Desligado'] },
                { name: 'notes', label: 'Observações', type: 'textarea', full: true }
            ], { status: 'Ativo', ...x }, v => {
                if (x) Object.assign(x, v); else db.employees.push({ id: id(), ...v });
                save();
            });
        }
        const XLSX_MAIN_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
        const XLSX_REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
        const XLSX_PACKAGE_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
        function xmlElements(documentNode, namespace, name) {
            return Array.from(documentNode.getElementsByTagNameNS(namespace, name));
        }
        function parseExcelXml(text, label) {
            const parsed = new DOMParser().parseFromString(text, 'application/xml');
            if (parsed.getElementsByTagName('parsererror').length) throw new Error(`Não foi possível ler ${label} da planilha.`);
            return parsed;
        }
        async function readXlsxRows(file) {
            if (typeof DecompressionStream !== 'function') throw new Error('Este navegador não consegue ler arquivos .xlsx. No Excel, salve uma cópia como CSV UTF-8 e importe o arquivo .csv.');
            const bytes = new Uint8Array(await file.arrayBuffer());
            if (bytes.length < 22) throw new Error('O arquivo está vazio ou não é uma planilha Excel .xlsx válida.');
            const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
            const endLimit = Math.max(0, bytes.length - 65557);
            let endRecord = -1;
            for (let offset = bytes.length - 22; offset >= endLimit; offset--) {
                if (view.getUint32(offset, true) === 0x06054b50) { endRecord = offset; break; }
            }
            if (endRecord < 0) throw new Error('Não encontrei a estrutura de arquivo .xlsx. Se ele estiver no formato antigo .xls, salve como Pasta de Trabalho do Excel (.xlsx).');
            if (view.getUint16(endRecord + 4, true) !== 0 || view.getUint16(endRecord + 6, true) !== 0) throw new Error('Esta planilha usa várias partes e não pode ser importada. Salve uma cópia simples .xlsx.');
            const entryCount = view.getUint16(endRecord + 10, true);
            let offset = view.getUint32(endRecord + 16, true);
            if (entryCount === 0xffff || offset === 0xffffffff) throw new Error('Este arquivo Excel usa um formato avançado que ainda não é aceito. Salve uma cópia .xlsx comum.');
            const entries = new Map();
            const decoder = new TextDecoder('utf-8');
            for (let entryIndex = 0; entryIndex < entryCount; entryIndex++) {
                if (view.getUint32(offset, true) !== 0x02014b50) throw new Error('A estrutura interna da planilha está incompleta.');
                const flags = view.getUint16(offset + 8, true);
                const method = view.getUint16(offset + 10, true);
                const compressedSize = view.getUint32(offset + 20, true);
                const nameLength = view.getUint16(offset + 28, true);
                const extraLength = view.getUint16(offset + 30, true);
                const commentLength = view.getUint16(offset + 32, true);
                const localOffset = view.getUint32(offset + 42, true);
                const entryName = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
                entries.set(entryName, { flags, method, compressedSize, localOffset });
                offset += 46 + nameLength + extraLength + commentLength;
            }
            async function readEntry(name, optional = false) {
                const entry = entries.get(name);
                if (!entry) {
                    if (optional) return '';
                    throw new Error(`A planilha não contém o arquivo interno ${name}.`);
                }
                if (entry.flags & 1) throw new Error('A planilha está protegida por senha. Remova a proteção ou salve uma cópia sem senha.');
                const local = entry.localOffset;
                if (view.getUint32(local, true) !== 0x04034b50) throw new Error('A planilha está danificada.');
                const localNameLength = view.getUint16(local + 26, true);
                const localExtraLength = view.getUint16(local + 28, true);
                const dataStart = local + 30 + localNameLength + localExtraLength;
                const compressed = bytes.subarray(dataStart, dataStart + entry.compressedSize);
                if (entry.method === 0) return decoder.decode(compressed);
                if (entry.method !== 8) throw new Error('A planilha usa uma compactação não compatível. Salve uma cópia .xlsx comum.');
                try {
                    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
                    return decoder.decode(await new Response(stream).arrayBuffer());
                } catch {
                    throw new Error('Não consegui descompactar esta planilha .xlsx. Salve-a novamente como Pasta de Trabalho do Excel (.xlsx) ou CSV UTF-8.');
                }
            }
            const workbook = parseExcelXml(await readEntry('xl/workbook.xml'), 'a lista de abas');
            const sheetNodes = xmlElements(workbook, XLSX_MAIN_NS, 'sheet');
            if (!sheetNodes.length) throw new Error('A planilha não tem uma aba para importar.');
            const activeTab = Number(xmlElements(workbook, XLSX_MAIN_NS, 'workbookView')[0]?.getAttribute('activeTab') || 0);
            const selectedSheet = sheetNodes[Math.min(Number.isInteger(activeTab) ? activeTab : 0, sheetNodes.length - 1)];
            const relationshipId = selectedSheet.getAttributeNS(XLSX_REL_NS, 'id') || selectedSheet.getAttribute('r:id');
            const relationshipDoc = parseExcelXml(await readEntry('xl/_rels/workbook.xml.rels'), 'as referências das abas');
            const relationship = xmlElements(relationshipDoc, XLSX_PACKAGE_REL_NS, 'Relationship').find(item => item.getAttribute('Id') === relationshipId);
            if (!relationship?.getAttribute('Target')) throw new Error('Não consegui localizar a aba selecionada do Excel.');
            const sheetPath = new URL(relationship.getAttribute('Target'), 'https://bc2.invalid/xl/workbook.xml').pathname.slice(1);
            const stringsText = await readEntry('xl/sharedStrings.xml', true);
            const sharedStrings = stringsText
                ? xmlElements(parseExcelXml(stringsText, 'os textos compartilhados'), XLSX_MAIN_NS, 'si').map(item => xmlElements(item, XLSX_MAIN_NS, 't').map(node => node.textContent || '').join(''))
                : [];
            const sheetDoc = parseExcelXml(await readEntry(sheetPath), 'a aba selecionada');
            const rows = xmlElements(sheetDoc, XLSX_MAIN_NS, 'row');
            return rows.map((rowNode, rowIndex) => {
                const values = [];
                let nextColumn = 0;
                for (const cell of xmlElements(rowNode, XLSX_MAIN_NS, 'c')) {
                    const reference = cell.getAttribute('r') || '';
                    const letters = reference.match(/^[A-Za-z]+/)?.[0] || '';
                    let column = 0;
                    for (const letter of letters.toUpperCase()) column = column * 26 + letter.charCodeAt(0) - 64;
                    column = letters ? column - 1 : nextColumn;
                    const rawValue = xmlElements(cell, XLSX_MAIN_NS, 'v')[0]?.textContent || '';
                    let value = rawValue;
                    if (cell.getAttribute('t') === 's') value = sharedStrings[Number(rawValue)] ?? '';
                    else if (cell.getAttribute('t') === 'inlineStr') value = xmlElements(cell, XLSX_MAIN_NS, 'is')[0]?.textContent || '';
                    for (let blankColumn = nextColumn; blankColumn < column; blankColumn++) values[blankColumn] = '';
                    values[column] = String(value);
                    nextColumn = column + 1;
                }
                return { number: Number(rowNode.getAttribute('r')) || rowIndex + 1, values };
            });
        }
        async function readCsvRows(file) {
            const buffer = await file.arrayBuffer();
            let text;
            try { text = new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
            catch { text = new TextDecoder('windows-1252').decode(buffer); }
            text = text.replace(/^\uFEFF/, '').replace(/^sep=[;,\t]\r?\n/i, '');
            let quoted = false;
            const counts = { ';': 0, ',': 0, '\t': 0 };
            for (let index = 0; index < text.length && text[index] !== '\n' && text[index] !== '\r'; index++) {
                const char = text[index];
                if (char === '"') {
                    if (quoted && text[index + 1] === '"') index++;
                    else quoted = !quoted;
                } else if (!quoted && Object.hasOwn(counts, char)) counts[char]++;
            }
            const delimiter = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][1] ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] : ',';
            const rows = [];
            let row = [], value = '';
            quoted = false;
            for (let index = 0; index < text.length; index++) {
                const char = text[index];
                if (quoted) {
                    if (char === '"' && text[index + 1] === '"') { value += '"'; index++; }
                    else if (char === '"') quoted = false;
                    else value += char;
                } else if (char === '"' && value === '') quoted = true;
                else if (char === delimiter) { row.push(value); value = ''; }
                else if (char === '\n' || char === '\r') {
                    row.push(value); value = '';
                    if (row.some(cell => String(cell).trim())) rows.push({ number: rows.length + 1, values: row });
                    row = [];
                    if (char === '\r' && text[index + 1] === '\n') index++;
                } else value += char;
            }
            row.push(value);
            if (row.some(cell => String(cell).trim())) rows.push({ number: rows.length + 1, values: row });
            return rows;
        }
        function employeeRegistrationKey(value) {
            return String(value || '').normalize('NFKC').replace(/\s+/g, '').toLocaleUpperCase('pt-BR');
        }
        function normalizedEmployeeHeader(value) {
            return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]/g, '');
        }
        function makeEmployeeImportPlan(rows) {
            const headerRowIndex = rows.findIndex(row => row.values.some(value => String(value || '').trim()));
            if (headerRowIndex < 0) throw new Error('A planilha está vazia.');
            const headers = rows[headerRowIndex].values.map(normalizedEmployeeHeader);
            const columns = {
                name: ['nome', 'nomecompleto', 'nomedocolaborador', 'colaborador', 'funcionario'],
                registration: ['matricula', 'matriculacodigointerno', 'numeromatricula', 'registro', 'codigointerno'],
                role: ['funcao', 'funcaocargo', 'cargo', 'atividade'],
                sector: ['equipe', 'setor', 'setorequipe', 'equipesetor', 'departamento']
            };
            const indexes = Object.fromEntries(Object.entries(columns).map(([field, aliases]) => [field, headers.findIndex(header => aliases.includes(header))]));
            const labels = { name: 'Nome', registration: 'Matrícula', role: 'Função', sector: 'Equipe/Setor' };
            const missing = Object.entries(indexes).filter(([, index]) => index < 0).map(([field]) => labels[field]);
            if (missing.length) throw new Error(`Não encontrei estas colunas na primeira linha: ${missing.join(', ')}. Use os títulos Nome, Matrícula, Função e Equipe ou Setor.`);
            const dataRows = rows.slice(headerRowIndex + 1).filter(row => row.values.some(value => String(value || '').trim()));
            if (!dataRows.length) throw new Error('A planilha contém os títulos, mas não há colaboradores para importar.');
            if (dataRows.length > 10000) throw new Error('A planilha tem mais de 10.000 linhas. Divida-a em arquivos menores para revisar com segurança.');
            const existingByRegistration = new Map();
            for (const employee of db.employees) {
                const key = employeeRegistrationKey(employee.registration);
                if (!key) continue;
                if (!existingByRegistration.has(key)) existingByRegistration.set(key, []);
                existingByRegistration.get(key).push(employee);
            }
            const incomingKeys = new Map();
            const errors = [];
            const additions = [];
            const updates = [];
            const previewRows = [];
            let unchanged = 0;
            for (const sourceRow of dataRows) {
                const value = field => String(sourceRow.values[indexes[field]] ?? '').replace(/\u00a0/g, ' ').trim();
                const entry = { row: sourceRow.number, name: value('name').replace(/\s+/g, ' '), registration: value('registration'), role: value('role').replace(/\s+/g, ' '), sector: value('sector').replace(/\s+/g, ' ') };
                if (!entry.name || !entry.registration || !entry.role) { errors.push(`Linha ${entry.row}: Nome, Matrícula e Função precisam estar preenchidos.`); continue; }
                if (entry.name.length > 120 || entry.registration.length > 100 || entry.role.length > 120 || entry.sector.length > 100) { errors.push(`Linha ${entry.row}: um dos campos ultrapassa o tamanho permitido.`); continue; }
                const key = employeeRegistrationKey(entry.registration);
                if (incomingKeys.has(key)) { errors.push(`Linhas ${incomingKeys.get(key)} e ${entry.row}: matrícula repetida na planilha (${entry.registration}).`); continue; }
                incomingKeys.set(key, entry.row);
                const matches = existingByRegistration.get(key) || [];
                if (matches.length > 1) { errors.push(`Linha ${entry.row}: já existem vários colaboradores com a matrícula ${entry.registration}; ajuste esse cadastro antes de importar.`); continue; }
                const existing = matches[0] || null;
                if (existing && !can('employees', 'edit')) { errors.push(`Linha ${entry.row}: seu nível não permite atualizar colaboradores existentes.`); continue; }
                if (!existing && !can('employees', 'create')) { errors.push(`Linha ${entry.row}: seu nível não permite cadastrar novos colaboradores.`); continue; }
                if (existing) {
                    const next = { ...existing, name: entry.name, registration: entry.registration, role: entry.role, sector: entry.sector || existing.sector || '' };
                    const changed = ['name', 'registration', 'role', 'sector'].some(field => String(existing[field] || '') !== String(next[field] || ''));
                    if (changed) updates.push({ existing, next });
                    else unchanged++;
                    previewRows.push({ ...entry, action: changed ? 'Atualizar' : 'Sem mudança' });
                } else {
                    additions.push({ id: id(), name: entry.name, registration: entry.registration, role: entry.role, sector: entry.sector, status: 'Ativo', notes: '' });
                    previewRows.push({ ...entry, action: 'Novo' });
                }
            }
            if (errors.length) throw new Error(`Nenhuma alteração foi feita. Corrija a planilha e tente novamente.\n\n${errors.slice(0, 12).join('\n')}${errors.length > 12 ? `\n… e mais ${errors.length - 12} problema(s).` : ''}`);
            if (!additions.length && !updates.length) throw new Error(`Nenhuma ficha precisa ser alterada. ${unchanged} matrícula(s) já têm os mesmos dados.`);
            const nextEmployees = [...db.employees];
            for (const change of updates) {
                const index = nextEmployees.findIndex(employee => employee.id === change.existing.id);
                if (index >= 0) nextEmployees[index] = change.next;
            }
            nextEmployees.push(...additions);
            return { additions, updates, unchanged, previewRows, nextEmployees };
        }
        async function handleEmployeeImportFile(input) {
            const file = input.files?.[0];
            input.value = '';
            if (!file) return;
            if (!can('employees', 'create') && !can('employees', 'edit')) { alert('Seu nível não permite importar colaboradores.'); return; }
            if (file.size > 10 * 1024 * 1024) { alert('O arquivo passa de 10 MB. Salve uma planilha menor para importar.'); return; }
            try {
                const extension = file.name.split('.').pop().toLocaleLowerCase('pt-BR');
                const rows = extension === 'xlsx' ? await readXlsxRows(file) : extension === 'csv' ? await readCsvRows(file) : null;
                if (!rows) throw new Error('Escolha uma planilha .xlsx ou um arquivo .csv. Arquivos .xls antigos precisam ser salvos como .xlsx no Excel.');
                const plan = makeEmployeeImportPlan(rows);
                showEmployeeImportPreview(file.name, plan);
            } catch (error) { alert(error.message || 'Não foi possível ler a planilha. Confira o arquivo e tente novamente.'); }
        }
        function showEmployeeImportPreview(fileName, plan) {
            const visibleRows = plan.previewRows.slice(0, 25);
            const tableRows = visibleRows.map(row => `<tr><td>${row.row}</td><td>${esc(row.name)}</td><td>${esc(row.registration)}</td><td>${esc(row.role)}</td><td>${esc(row.sector || '—')}</td><td>${esc(row.action)}</td></tr>`).join('');
            const html = `<div class="field full"><p>Arquivo: <strong>${esc(fileName)}</strong></p><p>${plan.additions.length} novo(s), ${plan.updates.length} atualização(ões) e ${plan.unchanged} sem mudança.</p><p class="muted">A importação não apaga ninguém. Fichas existentes são localizadas pela matrícula; situação, observações e histórico são preservados. Se a equipe/setor estiver vazia na planilha, o setor atual será mantido.</p><p class="muted">Se as matrículas tiverem zeros à esquerda, deixe essa coluna formatada como Texto no Excel antes de salvar.</p><div class="table-wrap" style="max-height:42vh;overflow:auto"><table><thead><tr><th>Linha</th><th>Nome</th><th>Matrícula</th><th>Função</th><th>Equipe / setor</th><th>Ação</th></tr></thead><tbody>${tableRows}</tbody></table></div>${plan.previewRows.length > visibleRows.length ? `<p class="muted">Mostrando ${visibleRows.length} de ${plan.previewRows.length} linhas da prévia. A confirmação considera todas.</p>` : ''}</div>`;
            openForm('Conferir importação de colaboradores', [{ type: 'html', html }], {}, async () => {
                const submitButton = document.querySelector('#modalForm button[type="submit"]');
                if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Importando…'; }
                const originalEmployees = db.employees;
                db.employees = plan.nextEmployees;
                const saved = await save();
                if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Confirmar importação'; }
                if (!saved) {
                    db.employees = originalEmployees;
                    renderAll();
                    return false;
                }
                alert(`Importação concluída. ${plan.additions.length} novo(s), ${plan.updates.length} atualização(ões) e ${plan.unchanged} sem mudança. Nenhum colaborador foi excluído.`);
                return true;
            });
            const submitButton = document.querySelector('#modalForm button[type="submit"]');
            if (submitButton) submitButton.textContent = 'Confirmar importação';
        }
        function editEmployee(i) { const x = getEmp(i); if (x) openEmployee(x); }
        function employeeHeldTotal(empId) {
            const tracked = db.epis.reduce((sum, epi) => sum + (epi.units || []).filter(unit => unit.employeeId === empId && !unit.retired).length, 0);
            const legacy = db.epis.reduce((sum, epi) => sum + Math.max(0, currentHeld(empId, epi.id)), 0);
            return tracked + legacy;
        }
        function employeeHeldSummary(empId) {
            const tracked = db.epis.flatMap(epi => (epi.units || [])
                .filter(unit => unit.employeeId === empId && !unit.retired)
                .map(unit => `${epi.name} · ${unit.code}`));
            const legacy = db.epis.filter(epi => currentHeld(empId, epi.id) > 0)
                .map(epi => `${epi.name} · ${currentHeld(empId, epi.id)} sem código individual`);
            return [...tracked, ...legacy].map(item => esc(item)).join('<br>');
        }
        function renderEmployees() {
            const importButton = document.getElementById('employeeImportButton');
            if (importButton) importButton.hidden = !(can('employees', 'create') || can('employees', 'edit'));
            const s = (document.getElementById('empSearch')?.value || '').toLowerCase();
            const rows = db.employees.filter(x => [x.name, x.registration, x.role, x.sector].some(v => String(v || '').toLowerCase().includes(s)));
            document.getElementById('empRows').innerHTML = rows.length ? rows.map(x => `<tr>
    <td><strong>${esc(x.name)}</strong></td><td>${esc(x.registration || '—')}</td><td>${esc(x.role || '—')}</td>
    <td>${esc(x.sector || '—')}</td><td><strong>${employeeHeldTotal(x.id)}</strong>${employeeHeldSummary(x.id) ? `<br><span class="muted">${employeeHeldSummary(x.id)}</span>` : ''}</td><td>${statusBadge(x.status || 'Ativo')}</td>
    <td class="no-print"><div class="actions"><button class="btn secondary small" data-ui-action="showEmployeeHistory" data-record-id="${esc(x.id)}">Ficha / histórico</button><button class="btn secondary small" data-ui-action="editEmployee" data-record-id="${esc(x.id)}">Editar</button><button class="btn danger small" data-ui-action="deleteEmployee" data-record-id="${esc(x.id)}">Excluir</button></div></td>
  </tr>`).join('') : '<tr><td colspan="7" class="empty">Nenhum colaborador cadastrado.</td></tr>';
        }
        function deleteEmployee(i) {
            if (!can('employees', 'delete')) { alert('Seu nível não permite excluir colaboradores.'); return; }
            if (db.movements.some(m => m.employeeId === i)) { alert('Este colaborador possui histórico de entregas. Altere a situação para Desligado para preservar os registros.'); return; }
            if (confirm('Excluir este colaborador?')) { db.employees = db.employees.filter(x => x.id !== i); save(); }
        }
        function showEmployeeHistory(i) {
            const e = getEmp(i); if (!e) return;
            const ms = db.movements.filter(m => m.employeeId === i);
            const html = ms.map(m => `${fmtDate(m.date)} · ${m.type} · ${epiName(m.epiId)} · ${m.qty}${m.unitCode ? ` · Código: ${m.unitCode}` : ''} · ${m.notes || ''}`).join('\n') || 'Nenhuma movimentação registrada.';
            openForm('Ficha do colaborador: ' + e.name, [
                { name: 'name', label: 'Nome', value: e.name },
                { name: 'registration', label: 'Matrícula', value: e.registration },
                { name: 'history', label: 'Histórico de movimentações', type: 'textarea', full: true, value: html }
            ], e, () => { });
            document.querySelectorAll('#modalForm input,#modalForm textarea').forEach(el => el.disabled = true);
        }
        function openMovement(x = null) {
            if (!can('movements', x ? 'edit' : 'create') || !can('epis', 'edit')) { alert('Seu nível precisa permitir a ação em Entregas e movimentações e a atualização do estoque de EPIs.'); return; }
            if (!db.epis.length) { alert('Cadastre um EPI primeiro.'); return; }
            const types = ['Entrega', 'Devolução', 'Baixa', 'Ajuste positivo', 'Ajuste negativo'];
            openForm(x ? 'Editar movimentação' : 'Nova movimentação', [
                { name: 'date', label: 'Data', type: 'date', required: true, value: today() },
                { name: 'type', label: 'Tipo', type: 'select', options: types, required: true },
                { name: 'employeeId', label: 'Colaborador', type: 'select', options: [{ value: '', label: 'Não associado' }, ...db.employees.map(e => ({ value: e.id, label: e.name }))] },
                { name: 'epiId', label: 'EPI', type: 'select', options: db.epis.map(e => ({ value: e.id, label: `${epiName(e.id)} (saldo: ${e.quantity})` })), required: true },
                { name: 'qty', label: 'Quantidade', type: 'number', min: 1, required: true, value: 1 },
                { name: 'serial', label: 'Número de série / lote' },
                { name: 'responsible', label: 'Responsável pelo registro' },
                { name: 'notes', label: 'Observações / comprovante', type: 'textarea', full: true }
            ], { date: today(), type: 'Entrega', qty: 1, ...x }, v => {
                v.qty = Number(v.qty);
                if (!Number.isInteger(v.qty) || v.qty <= 0) { alert('Informe uma quantidade inteira maior que zero.'); return; }
                const e = getEpi(v.epiId); if (!e) return;
                if (x) { alert('Por segurança, a edição de movimentações existentes não está habilitada nesta versão. Registre um ajuste corretivo para manter o histórico.'); return; }
                if (['Entrega', 'Devolução'].includes(v.type)) {
                    alert('Para manter o rastreamento individual, faça a entrega ou devolução lendo o código da unidade na aba Leitor de código.');
                    goTab('scanner');
                    return;
                }
                const delta = ['Entrega', 'Baixa', 'Ajuste negativo'].includes(v.type) ? -v.qty : v.qty;
                if (e.quantity + delta < 0) { alert('Saldo insuficiente. Disponível: ' + e.quantity); return; }
                if (!adjustUnitStock(e, delta)) { alert('Não foi possível ajustar as unidades disponíveis.'); return; }
                db.movements.push({ id: id(), ...v, createdAt: new Date().toISOString() });
                save();
            });
        }
        function renderMovements() {
            const s = (document.getElementById('moveSearch')?.value || '').toLowerCase();
            const type = document.getElementById('moveType')?.value || '';
            const rows = [...db.movements].reverse().filter(m => (!type || m.type === type) &&
                [empName(m.employeeId), epiName(m.epiId), m.notes, m.responsible, m.serial, m.unitCode].some(v => String(v || '').toLowerCase().includes(s)));
            document.getElementById('moveRows').innerHTML = rows.length ? rows.map(m => `<tr>
    <td>${fmtDate(m.date)}</td><td>${statusBadge(m.type)}</td><td>${esc(empName(m.employeeId))}</td>
    <td>${esc(epiName(m.epiId))}</td><td>${m.qty}</td><td>${esc(m.unitCode || m.serial || '—')}</td>
    <td>${esc([m.responsible, m.notes].filter(Boolean).join(' · ') || '—')}</td>
    <td class="no-print"><button class="btn secondary small" data-ui-action="viewMovement" data-record-id="${esc(m.id)}">Detalhes</button></td>
  </tr>`).join('') : '<tr><td colspan="8" class="empty">Nenhuma movimentação registrada.</td></tr>';
        }
        function viewMovement(i) {
            const m = db.movements.find(x => x.id === i); if (!m) return;
            alert(`Data: ${fmtDate(m.date)}\nTipo: ${m.type}\nColaborador: ${empName(m.employeeId)}\nEPI: ${epiName(m.epiId)}\nQuantidade: ${m.qty}\nCódigo da unidade: ${m.unitCode || 'Não informado'}\nSérie/lote: ${m.serial || 'Não informado'}\nResponsável: ${m.responsible || 'Não informado'}\nObservações: ${m.notes || 'Nenhuma'}`);
        }
        function openInspection(x = null) {
            if (!can('inspections', x ? 'edit' : 'create')) { alert('Seu nível não permite essa alteração nas inspeções.'); return; }
            if (!db.epis.length) { alert('Cadastre um EPI primeiro.'); return; }
            openForm(x ? 'Editar inspeção' : 'Registrar inspeção', [
                { name: 'date', label: 'Data da inspeção/teste', type: 'date', required: true, value: today() },
                { name: 'epiId', label: 'EPI', type: 'select', options: db.epis.map(e => ({ value: e.id, label: epiName(e.id) })), required: true },
                { name: 'kind', label: 'Tipo', type: 'select', options: ['Inspeção visual', 'Teste funcional', 'Ensaio técnico', 'Manutenção', 'Outro'] },
                { name: 'result', label: 'Resultado', type: 'select', options: ['Aprovado', 'Reprovado', 'Aprovado com ressalvas', 'Pendente', 'Não aplicável'] },
                { name: 'nextDate', label: 'Próxima data prevista', type: 'date' },
                { name: 'responsible', label: 'Responsável pela inspeção' },
                { name: 'notes', label: 'Observações / referência do procedimento', type: 'textarea', full: true }
            ], { date: today(), kind: 'Inspeção visual', result: 'Pendente', ...x }, v => {
                const e = getEpi(v.epiId);
                if (x) Object.assign(x, v); else db.inspections.push({ id: id(), ...v });
                if (e) { e.lastTest = v.date; e.nextTest = v.nextDate || ''; }
                save();
            });
        }
        function renderInspections() {
            const s = (document.getElementById('inspSearch')?.value || '').toLowerCase();
            const rows = [...db.inspections].reverse().filter(x => [epiName(x.epiId), x.kind, x.result, x.responsible, x.notes].some(v => String(v || '').toLowerCase().includes(s)));
            document.getElementById('inspRows').innerHTML = rows.length ? rows.map(x => `<tr>
    <td>${fmtDate(x.date)}</td><td>${esc(epiName(x.epiId))}</td><td>${esc(x.kind || '—')}</td>
    <td>${statusBadge(x.result || 'Pendente', x.result === 'Reprovado' ? 'danger' : x.result === 'Pendente' ? 'warn' : '')}</td>
    <td>${fmtDate(x.nextDate)}</td><td>${esc(x.responsible || '—')}</td><td>${esc(x.notes || '—')}</td>
    <td class="no-print"><button class="btn secondary small" data-ui-action="editInspection" data-record-id="${esc(x.id)}">Editar</button></td>
  </tr>`).join('') : '<tr><td colspan="8" class="empty">Nenhuma inspeção cadastrada.</td></tr>';
        }
        function editInspection(i) { const x = db.inspections.find(a => a.id === i); if (x) openInspection(x); }
        function renderDashboard() {
            const total = db.epis.reduce((s, e) => s + Number(e.quantity || 0), 0);
            const expired = db.epis.filter(e => e.expiry && e.expiry < today()).length;
            const due = db.epis.filter(e => e.nextTest && e.nextTest <= today()).length;
            document.getElementById('stats').innerHTML = [
                ['Cadastros de EPI', db.epis.length, 'Produtos e tamanhos registrados'],
                ['Unidades disponíveis', total, 'unidades para uso'],
                ['Colaboradores ativos', db.employees.filter(e => e.status === 'Ativo').length, 'Pessoas cadastradas como ativas'],
                ['Pendências de prazo', expired + due, 'Validades e inspeções vencidas']
            ].map(([a, b, c]) => `<div class="card"><div class="label">${a}</div><div class="number">${b}</div><div class="hint">${c}</div></div>`).join('');
            const configuredMinimums = db.epis.filter(epi => Number(epi.minimumStock) > 0).length;
            const shortages = db.epis.filter(epi => Number(epi.minimumStock) > 0 && Number(epi.quantity || 0) < Number(epi.minimumStock))
                .sort((a, b) => (Number(b.minimumStock) - Number(b.quantity || 0)) - (Number(a.minimumStock) - Number(a.quantity || 0)) || Number(a.quantity || 0) - Number(b.quantity || 0))
                .slice(0, 8);
            document.getElementById('stockShortages').innerHTML = shortages.length
                ? shortages.map(epi => `<div class="shortage-item"><div class="shortage-name"><strong>${esc(epi.folder || epi.name)}</strong>${epi.folder && epi.name.toLocaleLowerCase() !== epi.folder.toLocaleLowerCase() ? `<span>${esc(epi.name)}</span>` : ''}${epi.size ? `<span>Tamanho ${esc(epi.size)}</span>` : ''}</div><div class="shortage-amount"><strong class="shortage-quantity">${Number(epi.quantity) || 0} un.</strong><span>mínimo ${Number(epi.minimumStock)}</span></div></div>`).join('')
                : `<p class="muted">${configuredMinimums ? 'Nenhum EPI está abaixo do mínimo definido.' : 'Defina o mínimo de reposição no cadastro de cada EPI para ver os alertas aqui.'}</p>`;
            const exp = db.epis.filter(e => e.expiry && e.expiry <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
            document.getElementById('expiryAlerts').innerHTML = exp.length ? exp.map(e => `<p>${esc(epiName(e.id))} · ${fmtDate(e.expiry)} ${statusBadge(e.expiry < today() ? 'Vencido' : 'Próximo', 'warn')}</p>`).join('') : '<p class="muted">Nenhum vencimento próximo informado.</p>';
            const ins = db.epis.filter(e => e.nextTest && e.nextTest <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
            document.getElementById('inspectionAlerts').innerHTML = ins.length ? ins.map(e => `<p>${esc(epiName(e.id))} · ${fmtDate(e.nextTest)} ${statusBadge(e.nextTest < today() ? 'Atrasada' : 'Próxima', 'warn')}</p>`).join('') : '<p class="muted">Nenhuma inspeção próxima informada.</p>';
            const ms = [...db.movements].reverse().slice(0, 5);
            document.getElementById('recentMoves').innerHTML = ms.length ? ms.map(m => `<p>${fmtDate(m.date)} · ${esc(m.type)} · ${esc(epiName(m.epiId))} · ${m.qty} un.</p>`).join('') : '<p class="muted">As movimentações aparecerão aqui após o primeiro registro.</p>';
        }
        const TAB_LABELS = {
            dashboard: 'Visão geral', epis: 'Estoque de EPIs', scanner: 'Leitor de código',
            employees: 'Colaboradores', movements: 'Entregas e movimentações', inspections: 'Inspeções e testes',
            reports: 'Relatórios e backup', support: 'Contatos e Suporte', audit: 'Log do site', users: 'Usuários e níveis'
        };
        const ACTION_LABELS = { view: 'Consultar', create: 'Cadastrar', edit: 'Editar', delete: 'Excluir', export: 'Exportar', manage: 'Administrar' };
        function can(tab, action = 'view') {
            if (tab === 'support' && action === 'view') return Boolean(secureSession?.user && secureSession.status === 'active');
            return Boolean(secureSession?.user?.is_admin || secureSession?.permissions?.[tab]?.[action]);
        }
        function applyTabPermissions() {
            document.querySelectorAll('#nav button[data-tab]').forEach(button => {
                const tab = button.dataset.tab;
                const visible = ['view', 'create', 'edit', 'delete', 'export', 'manage'].some(action => can(tab, action));
                button.hidden = !visible;
                const section = document.getElementById(tab);
                if (section && !visible) section.classList.remove('active');
            });
            const first = [...document.querySelectorAll('#nav button[data-tab]')].find(button => !button.hidden);
            if (!first) {
                setGate('Seu acesso ainda não tem permissões', 'Peça ao Administrador para configurar um nível de acesso para você.', { signOut: true });
                return false;
            }
            if (first && !document.querySelector('#nav button.active:not([hidden])')) goTab(first.dataset.tab);
            return true;
        }
        function setGate(title, message, options = {}) {
            document.body.classList.remove('epi-folder-page');
            document.body.classList.remove('personal-settings-page');
            document.body.classList.remove('users-access-page');
            document.title = MAIN_PAGE_TITLE;
            document.getElementById('accessGateTitle').textContent = title;
            document.getElementById('accessGateMessage').textContent = message;
            document.getElementById('accessGateTitle').hidden = false;
            document.getElementById('accessGateMessage').hidden = false;
            document.getElementById('authBrand').hidden = false;
            document.getElementById('accessGateCard').classList.remove('auth-subpage');
            document.getElementById('accessGateRetry').hidden = !options.retry;
            document.getElementById('accessGateSignOut').hidden = !options.signOut;
            const authControls = document.getElementById('firebaseAuthControls');
            authControls.hidden = !(options.auth || options.passwordSetup);
            document.getElementById('pendingPasswordControls').hidden = !options.passwordSetup;
            if (options.auth) showAuthChoices();
            if (options.passwordSetup) {
                document.getElementById('authChoiceView').hidden = true;
                document.getElementById('authFormView').hidden = true;
            }
            document.getElementById('accessGate').hidden = false;
            window.BC2Mobile?.onGate();
        }
        let authViewMode = 'login';
        const ACCESS_REQUEST_KEY = 'bc2_access_request_email_v1';
        const PASSWORD_SETUP_KEY = 'bc2_password_setup_required_v1';
        let authSubmitInFlight = false;
        function showAuthChoices() {
            document.getElementById('accessGateCard').classList.remove('auth-subpage');
            document.getElementById('authBrand').hidden = false;
            document.getElementById('accessGateTitle').hidden = false;
            document.getElementById('accessGateMessage').hidden = false;
            document.getElementById('authChoiceView').hidden = false;
            document.getElementById('authFormView').hidden = true;
            document.getElementById('pendingPasswordControls').hidden = true;
            document.getElementById('authFeedback').textContent = '';
            window.BC2Mobile?.syncAuth();
        }
        function getSavedAccessRequest() {
            try {
                const saved = JSON.parse(localStorage.getItem(ACCESS_REQUEST_KEY) || 'null');
                if (saved?.email && saved.requestedAt && Date.now() - saved.requestedAt < 24 * 60 * 60 * 1000) return saved;
            } catch { /* um pedido temporário inválido não deve bloquear a tela de entrada */ }
            localStorage.removeItem(ACCESS_REQUEST_KEY);
            return null;
        }
        function openAuthForm(mode) {
            authViewMode = mode;
            document.getElementById('accessGateCard').classList.add('auth-subpage');
            document.getElementById('authBrand').hidden = true;
            document.getElementById('accessGateTitle').hidden = true;
            document.getElementById('accessGateMessage').hidden = true;
            document.getElementById('authChoiceView').hidden = true;
            document.getElementById('authFormView').hidden = false;
            document.getElementById('pendingPasswordControls').hidden = true;
            const isConfirming = mode === 'confirm-link';
            document.getElementById('authNameField').hidden = mode !== 'request' && !isConfirming;
            document.getElementById('authName').required = mode === 'request' || isConfirming;
            const isRegistration = mode === 'request';
            document.getElementById('authPasswordField').hidden = mode !== 'login' && !isRegistration;
            document.getElementById('authPassword').required = mode === 'login' || isRegistration;
            document.getElementById('authPassword').minLength = isRegistration ? 12 : 6;
            document.getElementById('authPassword').autocomplete = isRegistration ? 'new-password' : 'current-password';
            document.getElementById('authPasswordHelp').hidden = !isRegistration;
            document.getElementById('authConfirmPasswordField').hidden = !isRegistration;
            document.getElementById('authConfirmPassword').required = isRegistration;
            document.getElementById('authConfirmPassword').value = '';
            document.getElementById('authForgotButton').hidden = mode !== 'login';
            document.getElementById('authFormTitle').textContent = mode === 'login' ? 'Entrar' : isConfirming ? 'Confirmar pedido' : 'Pedir autorização';
            document.getElementById('authFormDescription').hidden = false;
            document.getElementById('authFormDescription').textContent = mode === 'login'
                ? 'Informe seu e-mail e senha.'
                : isConfirming ? 'Informe o nome e o e-mail usados no pedido para confirmar este link.'
                    : 'Crie sua senha e confirme seu e-mail. Depois entre para encaminhar o pedido ao Administrador.';
            document.getElementById('authSubmitButton').textContent = mode === 'login' ? 'Entrar' : isConfirming ? 'Confirmar e continuar' : 'Criar conta e confirmar e-mail';
            document.getElementById('authEmail').value = '';
            document.getElementById('authPassword').value = '';
            document.getElementById('authName').value = '';
            document.getElementById('authFeedback').textContent = '';
            window.BC2Mobile?.syncAuth();
        }
        function firebaseReady() {
            return Boolean(FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.includes('PREENCHER') && FIREBASE_CONFIG.projectId && !FIREBASE_CONFIG.projectId.includes('PREENCHER'));
        }
        function firebaseSdkAuth() {
            if (!firebaseReady() || !window.firebase?.auth) throw new Error('O recurso de confirmação por e-mail não carregou. Atualize a página e tente novamente.');
            if (!window.firebase.apps?.length) window.firebase.initializeApp(FIREBASE_CONFIG);
            const auth = window.firebase.auth();
            auth.languageCode = 'pt-BR';
            return auth;
        }
        function authFeedback(message, isError = false) {
            const box = document.getElementById('authFeedback');
            box.textContent = message;
            box.style.color = isError ? '#b4232d' : '';
        }
        function firebaseErrorMessage(code) {
            const map = {
                EMAIL_EXISTS: 'Este e-mail já tem cadastro. Use Entrar ou redefina a senha.',
                INVALID_LOGIN_CREDENTIALS: 'E-mail ou senha não conferem.',
                INVALID_EMAIL: 'Digite um e-mail válido.',
                WEAK_PASSWORD: 'Use pelo menos 12 caracteres, com letra maiúscula, minúscula, número e símbolo.',
                QUOTA_EXCEEDED: 'O serviço de e-mail atingiu sua cota de envio. Aguarde a renovação da cota e tente novamente.',
                OPERATION_NOT_ALLOWED: 'O cadastro por e-mail e senha precisa estar habilitado no Firebase. Fale com o Administrador.',
                TOO_MANY_ATTEMPTS_TRY_LATER: 'Muitas tentativas. Aguarde um pouco e tente novamente.',
                USER_DISABLED: 'Esta conta está desativada no serviço de login.',
                EMAIL_NOT_FOUND: 'Não encontramos esse e-mail. Confira ou peça acesso.',
                EXPIRED_OOB_CODE: 'O link de confirmação expirou. Peça um novo link.',
                'auth/operation-not-allowed': 'No Firebase, ative o método “Email link (passwordless sign-in)” em Authentication → Sign-in method.',
                'auth/unauthorized-continue-uri': 'O endereço do BC2 precisa estar na lista Authorized domains do Firebase.',
                'auth/invalid-email': 'Digite um endereço de e-mail válido.',
                'auth/invalid-action-code': 'Este link não é válido ou já foi usado. Peça outro link.',
                'auth/expired-action-code': 'Este link expirou. Peça outro link.',
                'auth/quota-exceeded': 'O serviço de e-mail atingiu sua cota de envio. Aguarde a renovação da cota e tente novamente.',
                'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
                INVALID_PASSWORD: 'A senha atual não confere.',
                RECENT_LOGIN_REQUIRED: 'Confirme sua senha atual e tente novamente.'
            };
            return map[code] || 'Não foi possível concluir. Confira os dados e tente novamente.';
        }
        async function firebaseAuthRequest(method, payload) {
            if (!firebaseReady()) throw new Error('O login ainda não foi conectado ao Firebase.');
            const response = await fetch(`https://identitytoolkit.googleapis.com/v1/${method}?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`, {
                method: 'POST', headers: { 'content-type': 'application/json', 'X-Firebase-Locale': 'pt-BR' }, body: JSON.stringify(payload), cache: 'no-store'
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw Object.assign(new Error(firebaseErrorMessage(data.error?.message)), { code: data.error?.message || '' });
            return data;
        }
        function storeFirebaseSession(data) {
            sessionStorage.setItem(FIREBASE_SESSION_KEY, JSON.stringify({ idToken: data.idToken, refreshToken: data.refreshToken, expiresAt: Date.now() + Number(data.expiresIn || 3600) * 1000 }));
        }
        async function getFirebaseIdToken(forceRefresh = false) {
            let session;
            try { session = JSON.parse(sessionStorage.getItem(FIREBASE_SESSION_KEY) || 'null'); } catch { session = null; }
            if (!session?.refreshToken) return '';
            if (!forceRefresh && session.idToken && session.expiresAt > Date.now() + 60000) return session.idToken;
            const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`, {
                method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: session.refreshToken }), cache: 'no-store'
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) { sessionStorage.removeItem(FIREBASE_SESSION_KEY); throw Object.assign(new Error('Sua sessão terminou. Entre novamente.'), { status: 401 }); }
            storeFirebaseSession({ idToken: data.id_token, refreshToken: data.refresh_token, expiresIn: data.expires_in });
            return data.id_token;
        }
        async function completeConfirmedEmailChange(idToken) {
            const response = await fetch('/api/profile/email/complete', {
                method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${idToken}` },
                body: '{}', cache: 'no-store'
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw Object.assign(new Error(result.error || 'Não foi possível concluir a troca do e-mail.'), { status: response.status });
            return result;
        }
        function clearEmailChangeContinuation() {
            const url = new URL(location.href);
            url.searchParams.delete('bc2_email_change');
            history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
        }
        function setSettingsFeedback(id, message, isError = false) {
            const element = document.getElementById(id);
            if (!element) return;
            element.textContent = message;
            element.style.color = isError ? 'var(--red)' : '';
        }
        async function reauthenticateCurrentUser(password) {
            if (!secureSession?.user?.email) throw new Error('Entre novamente no BC2 antes de alterar sua conta.');
            let fresh;
            try {
                fresh = await firebaseAuthRequest('accounts:signInWithPassword', {
                    email: secureSession.user.email, password, returnSecureToken: true
                });
            } catch (error) {
                if (['INVALID_PASSWORD', 'INVALID_LOGIN_CREDENTIALS', 'EMAIL_NOT_FOUND'].includes(error.code)) {
                    throw new Error('A senha atual não confere. Confira e tente novamente.');
                }
                throw error;
            }
            const currentToken = await getFirebaseIdToken();
            const [current, recent] = await Promise.all([
                firebaseAuthRequest('accounts:lookup', { idToken: currentToken }),
                firebaseAuthRequest('accounts:lookup', { idToken: fresh.idToken })
            ]);
            if (!current.users?.[0]?.localId || current.users[0].localId !== recent.users?.[0]?.localId) {
                throw new Error('A senha informada não corresponde à conta que está aberta.');
            }
            if (!recent.users?.[0]?.emailVerified) throw new Error('Confirme seu e-mail antes de alterar as configurações da conta.');
            return fresh;
        }
        function passwordIsStrong(password) {
            return password.length >= 12 && /[a-z]/.test(password) && /[A-Z]/.test(password) &&
                /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
        }
        async function savePersonalName(event) {
            event.preventDefault();
            const displayName = document.getElementById('personalName').value.trim();
            if (!displayName || displayName.length > 120) { setSettingsFeedback('personalNameFeedback', 'Informe um nome de até 120 caracteres.', true); return; }
            setSettingsFeedback('personalNameFeedback', 'Salvando seu nome...');
            try {
                const result = await apiRequest('profile', { method: 'POST', body: JSON.stringify({ display_name: displayName }) });
                secureSession.user = result.user;
                document.getElementById('signedInAs').textContent = `${displayName} · ${secureSession.user.role_name || ''}`;
                renderPersonalSettings();
                setSettingsFeedback('personalNameFeedback', 'Seu nome foi atualizado.');
            } catch (error) { setSettingsFeedback('personalNameFeedback', error.message, true); }
        }
        async function selectPersonalTheme(element) {
            const theme = element.dataset.theme;
            if (!Object.hasOwn(PERSONAL_THEMES, theme) || !secureSession?.user) return;
            const previous = secureSession.theme || 'bc2';
            applyPersonalTheme(theme);
            setSettingsFeedback('personalThemeFeedback', 'Salvando sua escolha...');
            try {
                await apiRequest('profile', { method: 'POST', body: JSON.stringify({ theme }) });
                secureSession.theme = theme;
                setSettingsFeedback('personalThemeFeedback', `Tema “${PERSONAL_THEMES[theme].label}” salvo na sua conta.`);
            } catch (error) {
                applyPersonalTheme(previous);
                setSettingsFeedback('personalThemeFeedback', error.message, true);
            }
        }
        async function changePersonalPassword(event) {
            event.preventDefault();
            const currentPassword = document.getElementById('currentPassword').value;
            const password = document.getElementById('newPersonalPassword').value;
            const confirmation = document.getElementById('confirmPersonalPassword').value;
            if (!passwordIsStrong(password)) { setSettingsFeedback('passwordChangeFeedback', 'Use pelo menos 12 caracteres, com maiúscula, minúscula, número e símbolo.', true); return; }
            if (password !== confirmation) { setSettingsFeedback('passwordChangeFeedback', 'As senhas novas não são iguais.', true); return; }
            setSettingsFeedback('passwordChangeFeedback', 'Conferindo sua senha atual e salvando...');
            try {
                const recent = await reauthenticateCurrentUser(currentPassword);
                const changed = await firebaseAuthRequest('accounts:update', { idToken: recent.idToken, password, returnSecureToken: true });
                storeFirebaseSession(changed);
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPersonalPassword').value = '';
                document.getElementById('confirmPersonalPassword').value = '';
                setSettingsFeedback('passwordChangeFeedback', 'Senha alterada. Na próxima entrada, use a nova senha.');
            } catch (error) { setSettingsFeedback('passwordChangeFeedback', error.message, true); }
        }
        async function sendPasswordChangeLink() {
            if (!secureSession?.user?.email) return;
            setSettingsFeedback('passwordChangeFeedback', 'Enviando o link para seu e-mail...');
            try {
                await firebaseAuthRequest('accounts:sendOobCode', { requestType: 'PASSWORD_RESET', email: secureSession.user.email });
                setSettingsFeedback('passwordChangeFeedback', 'Se o endereço estiver ativo, o Firebase enviará um link para trocar a senha. Abra-o e depois entre novamente com a nova senha.');
            } catch (error) { setSettingsFeedback('passwordChangeFeedback', error.message, true); }
        }
        async function requestEmailChange(event) {
            event.preventDefault();
            const currentPassword = document.getElementById('emailChangeCurrentPassword').value;
            const newEmail = document.getElementById('newEmailAddress').value.trim().toLowerCase();
            const confirmEmail = document.getElementById('confirmNewEmailAddress').value.trim().toLowerCase();
            if (newEmail !== confirmEmail) { setSettingsFeedback('emailChangeFeedback', 'Os endereços de e-mail não são iguais.', true); return; }
            if (newEmail === secureSession?.user?.email?.toLowerCase()) { setSettingsFeedback('emailChangeFeedback', 'Esse já é o e-mail da sua conta.', true); return; }
            setSettingsFeedback('emailChangeFeedback', 'Conferindo sua senha e preparando a confirmação...');
            let pendingEmailRequestCreated = false;
            try {
                const recent = await reauthenticateCurrentUser(currentPassword);
                storeFirebaseSession(recent);
                await apiRequest('profile/email/request', { method: 'POST', body: JSON.stringify({ new_email: newEmail }) });
                pendingEmailRequestCreated = true;
                await firebaseAuthRequest('accounts:sendOobCode', {
                    requestType: 'VERIFY_AND_CHANGE_EMAIL', idToken: recent.idToken, newEmail,
                    continueUrl: `${location.origin}/?bc2_email_change=1`, canHandleCodeInApp: true
                });
                document.getElementById('emailChangeCurrentPassword').value = '';
                document.getElementById('newEmailAddress').value = '';
                document.getElementById('confirmNewEmailAddress').value = '';
                pendingEmailRequestCreated = false;
                setSettingsFeedback('emailChangeFeedback', 'Enviamos uma confirmação ao novo endereço. Até você abrir o link, seu e-mail e seu acesso BC2 continuam como estão.');
            } catch (error) {
                if (pendingEmailRequestCreated) {
                    try { await apiRequest('profile/email/cancel', { method: 'POST', body: '{}' }); } catch { /* mantém a mensagem original; a solicitação expira em 24 horas */ }
                }
                setSettingsFeedback('emailChangeFeedback', error.message, true);
            }
        }
        async function submitAuthForm(event) {
            event.preventDefault();
            if (authSubmitInFlight) return;
            authSubmitInFlight = true;
            document.getElementById('authSubmitButton').disabled = true;
            try {
                if (authViewMode === 'login') return await loginWithEmail();
                if (authViewMode === 'confirm-link') return await finishEmailLinkSignIn(
                    document.getElementById('authEmail').value.trim(),
                    document.getElementById('authName').value.trim().slice(0, 120)
                );
                return await registerWithEmail();
            } finally {
                authSubmitInFlight = false;
                document.getElementById('authSubmitButton').disabled = false;
            }
        }
        async function loginWithEmail() {
            authFeedback('Conferindo seus dados...');
            try {
                const email = document.getElementById('authEmail').value.trim();
                const password = document.getElementById('authPassword').value;
                const signedIn = await firebaseAuthRequest('accounts:signInWithPassword', { email, password, returnSecureToken: true });
                const profile = await firebaseAuthRequest('accounts:lookup', { idToken: signedIn.idToken });
                if (!profile.users?.[0]?.emailVerified) {
                    await BC2Registration.sendVerification(signedIn.idToken, email, firebaseAuthRequest, `${location.origin}/`);
                    document.getElementById('authPassword').value = '';
                    authFeedback('Confirme seu e-mail pelo link enviado. Confira também a pasta de spam. Depois volte e entre com sua senha; o acesso dependerá da aprovação do Administrador.', true);
                    return;
                }
                const emailChange = await completeConfirmedEmailChange(signedIn.idToken);
                if (emailChange.completed) clearEmailChangeContinuation();
                storeFirebaseSession(signedIn);
                authFeedback('E-mail confirmado. Verificando sua autorização...');
                await bootSecureApp();
            } catch (error) { authFeedback(firebaseErrorMessage(error.code) || error.message, true); }
        }
        async function registerWithEmail() {
            authFeedback('Criando sua conta e enviando a confirmação de e-mail...');
            const email = document.getElementById('authEmail').value.trim();
            try {
                await BC2Registration.createAccount({
                    name: document.getElementById('authName').value,
                    email, password: document.getElementById('authPassword').value,
                    confirmation: document.getElementById('authConfirmPassword').value
                }, firebaseAuthRequest, `${location.origin}/`);
                document.getElementById('authPassword').value = '';
                document.getElementById('authConfirmPassword').value = '';
                openAuthForm('login');
                document.getElementById('authEmail').value = email;
                authFeedback('Conta criada. Enviamos um e-mail de confirmação; confira também o spam. Abra o link e depois entre com sua senha. Seu pedido será encaminhado ao Administrador, que precisa aprovar o acesso.');
            } catch (error) {
                if (error.accountCreated) {
                    document.getElementById('authPassword').value = '';
                    document.getElementById('authConfirmPassword').value = '';
                    openAuthForm('login');
                    document.getElementById('authEmail').value = email;
                    authFeedback('A conta foi criada, mas o e-mail de confirmação não pôde ser enviado. Use Entrar com sua senha para solicitar outra confirmação. ' + (error.code ? firebaseErrorMessage(error.code) : error.message), true);
                } else authFeedback(error.code ? firebaseErrorMessage(error.code) : error.message, true);
            }
        }
        async function finishEmailLinkSignIn(email, name = '') {
            authFeedback('Confirmando seu e-mail...');
            try {
                const auth = firebaseSdkAuth();
                await auth.setPersistence(window.firebase.auth.Auth.Persistence.SESSION);
                const signedIn = await auth.signInWithEmailLink(email, location.href);
                if (name) await signedIn.user.updateProfile({ displayName: name });
                await signedIn.user.getIdToken(true);
                const tokenResult = await signedIn.user.getIdTokenResult();
                storeFirebaseSession({
                    idToken: tokenResult.token,
                    refreshToken: signedIn.user.refreshToken,
                    expiresIn: Math.max(60, (Date.parse(tokenResult.expirationTime) - Date.now()) / 1000)
                });
                sessionStorage.setItem(PASSWORD_SETUP_KEY, '1');
                localStorage.removeItem(ACCESS_REQUEST_KEY);
                history.replaceState({}, document.title, `${location.pathname}${location.hash}`);
                setGate('E-mail confirmado', 'Agora escolha uma senha para poder entrar por e-mail e senha enquanto o Administrador analisa seu pedido.', { passwordSetup: true });
            } catch (error) {
                const saved = getSavedAccessRequest();
                setGate('Não foi possível confirmar seu e-mail', 'Confira o link e o endereço de e-mail. Se necessário, peça uma nova confirmação.', { auth: true });
                openAuthForm('confirm-link');
                document.getElementById('authEmail').value = email;
                document.getElementById('authName').value = name || saved?.name || '';
                authFeedback(error.code ? firebaseErrorMessage(error.code) : error.message, true);
            }
        }
        async function setPasswordAfterEmailLink() {
            const password = document.getElementById('newAccountPassword').value;
            const confirmation = document.getElementById('confirmAccountPassword').value;
            const feedback = document.getElementById('pendingPasswordFeedback');
            feedback.style.color = '';
            if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
                feedback.textContent = 'Use pelo menos 12 caracteres, com letra maiúscula, minúscula, número e símbolo.';
                feedback.style.color = '#b4232d';
                return;
            }
            if (password !== confirmation) { feedback.textContent = 'As senhas não são iguais. Digite novamente.'; feedback.style.color = '#b4232d'; return; }
            feedback.textContent = 'Salvando sua senha...';
            try {
                const auth = firebaseSdkAuth();
                if (auth.authStateReady) await auth.authStateReady();
                if (!auth.currentUser) throw new Error('A confirmação expirou nesta aba. Peça um novo link de confirmação.');
                await auth.currentUser.updatePassword(password);
                const idToken = await auth.currentUser.getIdToken(true);
                const tokenResult = await auth.currentUser.getIdTokenResult();
                storeFirebaseSession({ idToken, refreshToken: auth.currentUser.refreshToken, expiresIn: Math.max(60, (Date.parse(tokenResult.expirationTime) - Date.now()) / 1000) });
                sessionStorage.removeItem(PASSWORD_SETUP_KEY);
                await bootSecureApp();
            } catch (error) {
                feedback.textContent = error.code ? firebaseErrorMessage(error.code) : (error.message || 'Não foi possível salvar a senha.');
                feedback.style.color = '#b4232d';
            }
        }
        async function resetAuthPassword() {
            authFeedback('Enviando instruções...');
            try {
                const email = document.getElementById('authEmail').value.trim();
                await firebaseAuthRequest('accounts:sendOobCode', { requestType: 'PASSWORD_RESET', email });
                authFeedback('Se o e-mail estiver cadastrado, as instruções para redefinir a senha foram enviadas.');
            } catch (error) { authFeedback(error.message, true); }
        }
        async function bootSecureApp() {
            document.getElementById('accessGate').hidden = false;
            if (!firebaseReady()) {
                setGate('Login ainda não conectado', 'O Administrador precisa configurar o projeto Firebase antes de liberar o sistema.', { auth: false });
                return;
            }
            if (new URLSearchParams(location.search).get('bc2_email_change') === '1') {
                try {
                    const refreshedToken = await getFirebaseIdToken(true);
                    if (refreshedToken) {
                        const result = await completeConfirmedEmailChange(refreshedToken);
                        if (result.completed) clearEmailChangeContinuation();
                    } else {
                        clearEmailChangeContinuation();
                        setGate('Confirmação recebida', 'Entre com o novo e-mail e a senha atual para concluir a atualização da sua conta BC2.', { auth: true });
                        openAuthForm('login');
                        return;
                    }
                } catch (error) {
                    clearEmailChangeContinuation();
                    setGate('Confirmação recebida', error.message || 'Entre novamente com o novo e-mail e a senha atual para concluir a troca.', { auth: true });
                    openAuthForm('login');
                    return;
                }
            }
            if (window.firebase?.auth) {
                let auth = null;
                try { auth = firebaseSdkAuth(); } catch { /* o login por senha continua disponível se a biblioteca de link não carregar */ }
                if (auth?.isSignInWithEmailLink(location.href)) {
                    const savedRequest = getSavedAccessRequest();
                    if (savedRequest?.email) await finishEmailLinkSignIn(savedRequest.email, savedRequest.name || '');
                    else {
                        setGate('Confirme seu pedido', 'Para sua segurança, digite o mesmo e-mail ao qual enviamos o link.', { auth: true });
                        openAuthForm('confirm-link');
                    }
                    return;
                }
            }
            if (sessionStorage.getItem(PASSWORD_SETUP_KEY)) {
                setGate('E-mail confirmado', 'Crie uma senha para entrar por e-mail e senha enquanto o Administrador analisa seu pedido.', { passwordSetup: true });
                return;
            }
            if (!sessionStorage.getItem(FIREBASE_SESSION_KEY)) {
                const notice = sessionStorage.getItem(SESSION_NOTICE_KEY);
                sessionStorage.removeItem(SESSION_NOTICE_KEY);
                setGate(notice ? 'Sessão encerrada por segurança' : 'Escolha como continuar', notice || 'Entre no sistema ou envie seu pedido de autorização.', { auth: true });
                return;
            }
            setGate('Verificando seu acesso', 'Conferindo seu e-mail e sua autorização.');
            try {
                const session = await apiRequest('session');
                if (session.status !== 'active') {
                    secureSession = null;
                    const messages = {
                        pending: 'Seu pedido foi recebido e está aguardando a aprovação do Administrador. Esta tela aparecerá sempre que você entrar até que ele decida.',
                        rejected: 'O pedido de acesso não foi aprovado. Fale com o Administrador do BC2.',
                        suspended: 'Seu acesso está suspenso. Fale com o Administrador do BC2.'
                    };
                    setGate(session.status === 'pending' ? 'Analisando seu pedido de autorização' : 'Acesso ainda não liberado', messages[session.status] || 'A situação da sua conta não permite entrar.', { retry: session.status === 'pending', signOut: true });
                    return;
                }
                secureSession = session;
                secureSession.theme = session.theme || 'bc2';
                applyPersonalTheme(secureSession.theme);
                remoteRevision = session.revision;
                document.getElementById('signedInAs').textContent = `${session.user.display_name || session.user.email} · ${session.user.role_name || ''}`;
                document.getElementById('personalSettingsTrigger').hidden = false;
                await loadRemoteState();
                productDatabaseReady = initializeProductDatabase();
                await productDatabaseReady;
                if (!localMigrationCandidate && localProducts.length) localMigrationCandidate = emptyState();
                if (!applyTabPermissions()) return;
                document.getElementById('accessGate').hidden = true;
                syncPersonalSettingsRoute();
                syncUsersRoute();
                window.BC2Mobile?.ready();
                scheduleInactivityTimeout();
                if (can('users', 'view') || can('users', 'manage')) loadAdminPanels();
                if (session.user.is_admin && localMigrationCandidate && remoteRevision === 0 &&
                    (localProducts.length || Object.values(COLLECTION_KEY_NAMES).some(key => Array.isArray(localMigrationCandidate[key]) && localMigrationCandidate[key].length))) {
                    document.getElementById('localMigrationPanel').hidden = false;
                }
                if (sessionTimer) clearInterval(sessionTimer);
                sessionTimer = setInterval(checkSessionStatus, 45000);
            } catch (error) {
                secureSession = null;
                let message = error.message || 'Não foi possível confirmar o acesso.';
                if (error.status === 401) {
                    sessionStorage.removeItem(FIREBASE_SESSION_KEY);
                    if (window.firebase?.apps?.length) await window.firebase.auth().signOut().catch(() => {});
                    setGate('Entrar no BC2', 'Sua sessão terminou ou precisa ser confirmada. Entre com seu e-mail e senha.', { auth: true });
                    return;
                }
                if (error.status === 503) message = 'O banco central ainda não está ligado. Seus dados locais foram mantidos sem alteração.';
                setGate('O aplicativo ainda não está conectado', message, { retry: true, signOut: true });
            }
        }
        async function checkSessionStatus() {
            if (!secureSession) return;
            try {
                const session = await apiRequest('session');
                if (session.status !== 'active') throw Object.assign(new Error('Seu acesso foi suspenso ou removido.'), { status: 403 });
                const accessChanged = session.user?.role_id !== secureSession.user?.role_id
                    || session.user?.role_name !== secureSession.user?.role_name
                    || Boolean(session.user?.is_admin) !== Boolean(secureSession.user?.is_admin)
                    || JSON.stringify(session.permissions || {}) !== JSON.stringify(secureSession.permissions || {});
                if (accessChanged) {
                    location.reload();
                    return;
                }
                const formIsOpen = pendingRecordSaves > 0 || document.getElementById('modalBackdrop')?.classList.contains('open') || window.BC2NewEpi?.isOpen;
                if (!remoteRefreshBlocked && !formIsOpen && document.visibilityState === 'visible' && (recordRefreshNeeded || Number(session.revision || 0) > remoteRevision)) {
                    await saveQueue;
                    if (!remoteRefreshBlocked && (recordRefreshNeeded || Number(session.revision || 0) > remoteRevision)) await loadRemoteState();
                }
            } catch (error) {
                if (error.status === 401 || error.status === 403) {
                    secureSession = null;
                    db = emptyState();
                    renderAll();
                    sessionStorage.removeItem(FIREBASE_SESSION_KEY);
                    sessionStorage.removeItem(PASSWORD_SETUP_KEY);
                    if (sessionTimer) clearInterval(sessionTimer);
                    if (inactivityTimer) clearTimeout(inactivityTimer);
                    if (window.firebase?.apps?.length) await window.firebase.auth().signOut().catch(() => {});
                    setGate('Acesso encerrado', 'A conta perdeu a autorização ou a sessão expirou. Entre novamente ou fale com o Administrador.', { retry: true, signOut: true });
                }
            }
        }
        const COLLECTION_KEY_NAMES = { epis: 'epis', employees: 'employees', movements: 'movements', inspections: 'inspections' };
        function scheduleInactivityTimeout() {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            if (!secureSession) return;
            inactivityTimer = setTimeout(async () => {
                if (!secureSession) return;
                await saveQueue.catch(() => {});
                if (!secureSession) return;
                sessionStorage.setItem(SESSION_NOTICE_KEY, 'Por segurança, a sessão foi encerrada após 30 minutos sem atividade. Entre novamente para continuar.');
                await signOut();
            }, IDLE_SESSION_TIMEOUT_MS);
        }
        for (const eventName of ['pointerdown', 'keydown', 'touchstart', 'scroll']) {
            document.addEventListener(eventName, () => {
                if (secureSession) scheduleInactivityTimeout();
            }, { passive: true });
        }
        async function signOut() {
            document.body.classList.remove('personal-settings-page');
            document.body.classList.remove('users-access-page');
            document.title = MAIN_PAGE_TITLE;
            sessionStorage.removeItem(FIREBASE_SESSION_KEY);
            sessionStorage.removeItem(PASSWORD_SETUP_KEY);
            secureSession = null;
            if (sessionTimer) clearInterval(sessionTimer);
            if (inactivityTimer) clearTimeout(inactivityTimer);
            if (window.firebase?.apps?.length) await window.firebase.auth().signOut().catch(() => {});
            location.reload();
        }
        async function migrateLocalData() {
            if (!secureSession?.user?.is_admin || !localMigrationCandidate) { alert('Nenhum backup local está pronto para migração.'); return; }
            if (!confirm('Antes de continuar, exporte e guarde uma cópia de backup. O envio faz uma cópia para o banco central; não apaga os dados deste navegador. Deseja continuar?')) return;
            try {
                const copy = JSON.parse(JSON.stringify(localMigrationCandidate));
                copy.productCatalog = Array.isArray(localProducts) ? localProducts : [];
                ensureEpiUnitData(copy, false);
                const result = await recordClient.importData(copy, remoteRevision, 'initial');
                remoteRevision = result.revision;
                db = { ...emptyState(), ...copy };
                if (Array.isArray(copy.productCatalog) && await productDatabaseReady) {
                    await productTransaction({ action: 'replace', products: copy.productCatalog });
                    await refreshLocalProducts();
                }
                localMigrationCandidate = null;
                document.getElementById('localMigrationPanel').hidden = true;
                renderAll();
                alert('Cópia enviada ao banco central. Os dados antigos do navegador continuam guardados.');
            } catch (error) { alert(`A cópia não foi enviada. ${error.message}`); }
        }
        function renderAll() { renderDashboard(); renderEpis(); renderEmployees(); renderMovements(); renderInspections(); }
        async function loadAdminPanels() {
            try {
                const [users, roleSet] = await Promise.all([apiRequest('admin/users'), apiRequest('admin/roles')]);
                adminUsers = users.users || [];
                adminRoles = roleSet.roles || [];
                renderUsersPanel();
                if (!editingRoleId && adminRoles.length) editingRoleId = adminRoles[0].id;
                renderRoleEditor(roleSet.tabs || [], roleSet.actions || []);
            } catch (error) {
                document.getElementById('pendingUsers').textContent = error.message;
                document.getElementById('activeUsers').textContent = error.message;
                document.getElementById('rolePermissionRows').innerHTML = '';
            }
            if (can('audit', 'view')) loadAuditLog();
        }
        function roleOptions(selected = '', placeholder = '') {
            const firstOption = placeholder ? `<option value="" disabled ${selected ? '' : 'selected'}>${esc(placeholder)}</option>` : '';
            const availableRoles = secureSession?.user?.is_admin ? adminRoles : adminRoles.filter(role => !role.is_admin);
            return firstOption + availableRoles.map(role => `<option value="${esc(role.id)}" ${role.id === selected ? 'selected' : ''}>${esc(role.name)}</option>`).join('');
        }
        function renderUsersPanel() {
            const pending = adminUsers.filter(user => user.status === 'pending');
            const active = adminUsers.filter(user => user.status === 'active');
            document.getElementById('pendingRequestCount').textContent = pending.length;
            document.getElementById('accessRoleCount').textContent = adminRoles.length;
            document.getElementById('pendingUsers').innerHTML = pending.length ? pending.map(user => `<article class="panel pending-access-card">
                <div class="pending-access-head"><div><h3>${esc(user.display_name || 'Nome não informado')}</h3><p>${esc(user.email)}</p></div><span class="badge warn">Aguardando análise</span></div>
                <p class="muted">Pedido recebido: ${esc(fmtDate(user.requested_at?.slice(0, 10) || ''))}</p>
                <div class="pending-access-fields">
                    <div class="field"><label for="name-${esc(user.id)}">Nome confirmado por você</label><input id="name-${esc(user.id)}" value="${esc(user.display_name || '')}" maxlength="120" placeholder="Nome completo"></div>
                    <div class="field"><label for="role-${esc(user.id)}">Nível que será concedido</label><select id="role-${esc(user.id)}" aria-label="Nível que será concedido" data-ui-change="updatePendingApprovalState" data-user-id="${esc(user.id)}">${roleOptions('', 'Escolha um nível de acesso')}</select><small class="field-hint">A pessoa só poderá entrar depois que você escolher o nível e aprovar.</small></div>
                </div>
                <div class="pending-access-actions"><button class="btn" id="approve-${esc(user.id)}" type="button" disabled data-ui-action="updateUserAccess" data-user-id="${esc(user.id)}" data-status="active">Aprovar e liberar</button><button class="btn danger" type="button" data-ui-action="updateUserAccess" data-user-id="${esc(user.id)}" data-status="rejected">Recusar pedido</button></div>
            </article>`).join('') : '<p class="muted">Não há pedidos pendentes.</p>';
            document.getElementById('activeUsers').innerHTML = active.length ? `<div class="table-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Nível</th><th>Acesso</th><th>Ação</th></tr></thead><tbody>${active.map(user => {
                const self = user.id === secureSession?.user?.id;
                const otherAdminBlocked = user.is_admin && !secureSession?.user?.is_admin;
                const locked = self || user.is_protected || otherAdminBlocked;
                const options = locked ? `<option value="${esc(user.role_id)}" selected>${esc(user.role_name || 'Nível atual')}</option>` : roleOptions(user.role_id);
                const accessLabel = self ? 'Sua conta · nível protegido' : user.is_protected ? 'Conta principal protegida' : user.is_admin ? 'Administrador' : user.status;
                return `<tr><td><input id="name-${esc(user.id)}" value="${esc(user.display_name)}" maxlength="120" aria-label="Nome de ${esc(user.display_name || user.email)}" ${otherAdminBlocked ? 'readonly' : ''}></td><td>${esc(user.email)}</td>
                    <td><select id="role-${esc(user.id)}" aria-label="Nível de ${esc(user.display_name || user.email)}" ${locked ? 'disabled' : ''}>${options}</select></td><td>${esc(accessLabel)}</td>
                    <td>${otherAdminBlocked ? '' : `<button class="btn secondary small" type="button" data-ui-action="updateUserAccess" data-user-id="${esc(user.id)}" data-status="active">${locked ? 'Salvar nome' : 'Salvar'}</button>`}
                    ${!locked && !user.is_admin ? `<button class="btn danger small" type="button" data-ui-action="updateUserAccess" data-user-id="${esc(user.id)}" data-status="suspended">Remover acesso</button>` : ''}</td></tr>`;
            }).join('')}</tbody></table></div>` : '<p class="muted">Ainda não há usuários aprovados.</p>';

        }
        function updatePendingApprovalState(id) {
            const selectedRole = document.getElementById(`role-${id}`)?.value || '';
            const approveButton = document.getElementById(`approve-${id}`);
            if (approveButton) approveButton.disabled = !selectedRole;
        }
        async function updateUserAccess(id, status) {
            const name = document.getElementById(`name-${id}`)?.value || '';
            const targetUser = adminUsers.find(user => user.id === id);
            const roleId = document.getElementById(`role-${id}`)?.value || (targetUser?.status === 'active' ? targetUser.role_id : '') || '';
            if (status === 'active' && !name.trim()) { alert('Confirme o nome da pessoa antes de aprovar ou salvar.'); return; }
            if (status === 'active' && !roleId) { alert('Crie ou escolha um nível de acesso primeiro.'); return; }
            const changesAccess = targetUser && (status !== targetUser.status || (status === 'active' && roleId !== targetUser.role_id));
            if (changesAccess && (targetUser.id === secureSession?.user?.id || targetUser.is_protected)) { alert('O nível e o acesso da sua própria conta e da conta principal são protegidos.'); return; }
            if (targetUser?.is_admin && !secureSession?.user?.is_admin) { alert('Somente um Administrador pode gerenciar outro Administrador.'); return; }
            const selectedRole = adminRoles.find(role => role.id === roleId);
            const confirmation = status === 'active' && targetUser?.status === 'active'
                ? changesAccess
                    ? `Alterar o nível de ${name} (${targetUser.email}) de “${targetUser.role_name}” para “${selectedRole?.name}”?`
                    : `Salvar o nome de ${targetUser.email}?`
                : status === 'active'
                ? `Liberar acesso para ${name} (${targetUser?.email}) com o nível “${selectedRole?.name || 'não informado'}”?`
                : status === 'suspended'
                    ? `Remover o acesso de ${targetUser?.display_name || targetUser?.email}? A pessoa perderá o acesso ao BC2. A conta e o histórico de alterações serão mantidos para auditoria.`
                    : status === 'rejected'
                        ? `Recusar o pedido de ${targetUser?.display_name || targetUser?.email}?`
                        : `Confirmar alteração do acesso para ${status}?`;
            if (!confirm(confirmation)) return;
            try { await apiRequest(`admin/users/${encodeURIComponent(id)}`, { method: 'POST', body: JSON.stringify({ status, display_name: name, role_id: roleId }) }); await loadAdminPanels(); }
            catch (error) { alert(error.message); }
        }
        function renderPermissionMatrix(prefix, tabs, actions, role, locked = false) {
            document.getElementById(prefix + 'PermissionHead').innerHTML = '<tr><th>Aba</th>' + actions.map(action => '<th>' + esc(ACTION_LABELS[action] || action) + '</th>').join('') + '</tr>';
            document.getElementById(prefix + 'PermissionRows').innerHTML = tabs.map(tab => '<tr><td>' + esc(TAB_LABELS[tab] || tab) + '</td>' + actions.map(action => '<td><input type="checkbox" data-tab="' + esc(tab) + '" data-action="' + esc(action) + '" ' + (role?.permissions?.[tab]?.[action] ? 'checked ' : '') + (locked ? 'disabled ' : '') + 'aria-label="' + esc(TAB_LABELS[tab] || tab) + ': ' + esc(ACTION_LABELS[action] || action) + '"></td>').join('') + '</tr>').join('');
        }
        function renderRoleEditor(tabs, actions) {
            const role = adminRoles.find(item => item.id === editingRoleId);
            document.getElementById('rolePicker').innerHTML = '<option value="">Escolha um nível</option>' + adminRoles.map(item => '<option value="' + esc(item.id) + '" ' + (item.id === editingRoleId ? 'selected' : '') + '>' + esc(item.name) + '</option>').join('');
            const blocked = !role || (role.is_admin && !secureSession?.user?.is_admin);
            document.getElementById('roleName').value = role?.name || '';
            document.getElementById('roleName').disabled = blocked;
            document.getElementById('saveRoleButton').disabled = blocked;
            document.getElementById('deleteRoleButton').disabled = blocked || Boolean(role?.is_admin);
            document.getElementById('roleEditorNotice').textContent = role?.is_admin
                ? 'Este nível tem administração total. Seu nome pode mudar; as permissões e a proteção da conta principal são mantidas.'
                : 'As pessoas vinculadas continuam no mesmo nível quando o nome muda.';
            renderPermissionMatrix('role', tabs, actions, role, blocked || role?.is_admin);
            renderPermissionMatrix('createRole', tabs, actions, null);
        }
        function selectRoleForEdit() { editingRoleId = document.getElementById('rolePicker').value || null; apiRequest('admin/roles').then(set => renderRoleEditor(set.tabs, set.actions)).catch(error => alert(error.message)); }
        function newRole() {
            document.getElementById('createRoleName').value = '';
            document.querySelectorAll('#createRolePermissionRows input').forEach(input => { input.checked = false; });
        }
        async function saveRole(mode = 'edit') {
            const creating = mode === 'create';
            const prefix = creating ? 'createRole' : 'role';
            if (!creating && !editingRoleId) { alert('Escolha um nível existente para editar.'); return; }
            const name = document.getElementById(prefix + 'Name').value.trim();
            if (!name || name.length > 80) { alert('Digite um nome de até 80 caracteres para o nível.'); return; }
            const role = creating ? null : adminRoles.find(item => item.id === editingRoleId);
            const permissions = role?.is_admin ? role.permissions : {};
            if (!role?.is_admin) document.querySelectorAll('#' + prefix + 'PermissionRows input[data-tab]').forEach(input => { permissions[input.dataset.tab] ||= {}; permissions[input.dataset.tab][input.dataset.action] = input.checked; });
            try {
                const result = await apiRequest('admin/roles', { method: 'POST', body: JSON.stringify({ id: creating ? null : editingRoleId, name, permissions }) });
                if (!creating) editingRoleId = result.id;
                await loadAdminPanels();
                if (creating) newRole();
                alert(creating ? 'Nível criado. Você já pode atribuí-lo às pessoas aprovadas.' : 'Nível atualizado. As pessoas vinculadas foram mantidas.');
            } catch (error) { alert(error.message); }
        }
        async function deleteRole() {
            const role = adminRoles.find(item => item.id === editingRoleId);
            if (!role) { alert('Escolha um nível para remover.'); return; }
            if (role.is_admin) { alert('O nível Administrador protegido não pode ser removido.'); return; }
            if (!confirm(`Remover o nível “${role.name}”? Usuários ativos precisam ser transferidos para outro nível antes.`)) return;
            try { await apiRequest(`admin/roles/${encodeURIComponent(role.id)}`, { method: 'DELETE' }); editingRoleId = null; await loadAdminPanels(); }
            catch (error) { alert(error.message); }
        }
        async function loadAuditLog() {
            if (!can('audit', 'view')) return;
            const tbody = document.getElementById('auditRows');
            tbody.innerHTML = '<tr><td colspan="7" class="empty">Carregando histórico...</td></tr>';
            try {
                const result = await apiRequest('admin/audit?limit=300');
                tbody.innerHTML = result.events.length ? result.events.map(event => {
                    const changes = (event.changes || []).map(change => `${change.field}: ${JSON.stringify(change.before)} → ${JSON.stringify(change.after)}`).join('\n');
                    return `<tr><td>${esc(new Date(event.occurred_at).toLocaleString('pt-BR'))}</td><td>${esc(event.actor_name)}</td><td>${esc(event.actor_email)}</td><td>${esc(event.actor_role)}</td><td>${esc(event.action)}</td><td>${esc(`${event.area} · ${event.description}`)}</td><td><details><summary>${event.changes?.length || 0} campo(s)</summary><pre style="white-space:pre-wrap;max-width:420px">${esc(changes || 'Registro de ação')}</pre></details></td></tr>`;
                }).join('') : '<tr><td colspan="7" class="empty">Ainda não há alterações registradas.</td></tr>';
            } catch (error) { tbody.innerHTML = `<tr><td colspan="7" class="empty">${esc(error.message)}</td></tr>`; }
        }
        async function exportBackup() {
            if (!can('reports', 'export')) { alert('Seu nível não permite exportar backup.'); return; }
            await saveQueue;
            if (remoteRefreshBlocked) { alert('Confira a gravação pendente antes de exportar o backup.'); return; }
            try { if (await loadRemoteState() === false) throw Error('Aguarde a edição atual antes de exportar.'); }
            catch (error) { alert('Backup não gerado. ' + error.message); return; }
            const blob = new Blob([JSON.stringify({
                ...db,
                productCatalog: db.productCatalog || [],
                exportedAt: new Date().toISOString()
            }, null, 2)], { type: 'application/json' });
            const filename = `BC2-backup-EPI-${today()}.json`;
            if (window.showSaveFilePicker) {
                try {
                    const file = await window.showSaveFilePicker({
                        suggestedName: filename,
                        types: [{ description: 'Arquivo JSON', accept: { 'application/json': ['.json'] } }]
                    });
                    const writable = await file.createWritable();
                    await writable.write(blob);
                    await writable.close();
                } catch (e) {
                    if (e.name !== 'AbortError') alert('Não foi possível salvar o arquivo JSON. Tente novamente.');
                }
                return;
            }
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        }
        async function importBackup(inputId = 'importFile') {
            if (!secureSession?.user?.is_admin) { alert('Somente o Administrador pode restaurar o banco central.'); return; }
            const input = document.getElementById(inputId);
            const file = input.files[0];
            if (!file) { alert('Selecione um arquivo JSON de backup.'); return; }
            try {
                const d = JSON.parse(await file.text());
                if (!Array.isArray(d.epis) || !Array.isArray(d.employees) || !Array.isArray(d.movements) || !Array.isArray(d.inspections)) throw Error('Formato inválido');
                if (!confirm('A restauração substituirá os registros atuais. Você já exportou um backup dos dados atuais?')) return;
                const localDatabaseAvailable = await productDatabaseReady;
                if (Array.isArray(d.productCatalog) && (!localDatabaseAvailable || d.productCatalog.some(product =>
                    !product || typeof product.barcode !== 'string' || !product.barcode.trim() ||
                    typeof product.name !== 'string' || !product.name.trim()))) {
                    throw new Error('O banco local de produtos não está disponível para restaurar o catálogo.');
                }
                const restored = { epiFolders: Array.isArray(d.epiFolders) ? d.epiFolders : [], epis: d.epis, employees: d.employees, movements: d.movements, inspections: d.inspections, productCatalog: d.productCatalog || [], suggestionsAdded: d.suggestionsAdded || [], version: 1 };
                ensureEpiUnitData(restored, false);
                if (pendingRecordSaves || remoteRefreshBlocked) throw Error('Aguarde as gravações ou recarregue antes de restaurar.');
                const result = await recordClient.importData(restored, remoteRevision, 'restore');
                remoteRevision = result.revision;
                if (localDatabaseAvailable) {
                    const restoredCodes = new Set();
                    if (Array.isArray(d.productCatalog)) {
                        await productTransaction({ action: 'replace', products: d.productCatalog });
                        d.productCatalog.forEach(product => restoredCodes.add(product.barcode));
                    }
                    await productTransaction({
                        action: 'import',
                        products: restored.epis
                            .filter(epi => String(epi.barcode || '').trim() && !restoredCodes.has(String(epi.barcode).trim()))
                            .map(productFromEpi)
                    });
                    await refreshLocalProducts();
                }
                db = restored;
                renderAll();
                alert('Backup restaurado no banco central. A restauração e os registros alterados foram anotados no log.');
            } catch (e) { alert(`Não foi possível importar. ${e.message || 'Verifique se o arquivo é um backup válido do BC2.'}`); }
            finally { input.value = ''; }
        }
        async function clearAll() {
            if (!secureSession?.user?.is_admin) { alert('Somente o Administrador principal pode apagar os dados centrais.'); return; }
            if (!confirm('ATENÇÃO: isso apagará todos os cadastros e históricos locais. Exporte um backup antes de continuar. Deseja apagar tudo?')) return;
            if (!confirm('Confirma definitivamente a exclusão de todos os dados?')) return;
            try {
                if (!await productDatabaseReady) throw new Error('O banco local de produtos não está disponível.');
                if (pendingRecordSaves || remoteRefreshBlocked) throw Error('Aguarde as gravações ou recarregue antes de continuar.');
                const result = await recordClient.importData({ epiFolders: [], epis: [], employees: [], movements: [], inspections: [], productCatalog: [], suggestionsAdded: [], version: 1 }, remoteRevision, 'restore');
                db = result.data;
                remoteRevision = result.revision;
                await productTransaction({ action: 'clear' });
                await refreshLocalProducts();
            } catch (error) {
                alert(`Não foi possível apagar todos os dados: ${error.message || 'verifique o banco local.'}`);
                return;
            }
            renderAll();
        }
        function printReport(type) {
            if (!can('reports', 'export')) { alert('Seu nível não permite exportar relatórios.'); return; }
            const oldTitle = document.title;
            let title = '', html = '';
            if (type === 'stock') {
                title = 'Relatório de estoque';
                const stockItems = db.epis.filter(e => (Number(e.quantity) || 0) > 0);
                html = `<table><tr><th>Pasta / EPI</th><th>Tamanho</th><th>Marca</th><th>CA</th><th>Quantidade disponível</th><th>Mínimo</th><th>Validade</th><th>Situação</th></tr>${stockItems.map(e =>
                    `<tr><td>${esc(epiName(e.id))}</td><td>${esc(e.size || '—')}</td><td>${esc(e.brand || e.manufacturer || '')}</td><td>${esc(e.ca || '')}</td><td>${Number(e.quantity) || 0}</td><td>${Number(e.minimumStock) || 0}</td><td>${fmtDate(e.expiry)}</td><td>${esc(e.condition || '')}</td></tr>`
                ).join('')}${stockItems.length ? '' : '<tr><td colspan="8">Não há EPIs disponíveis no estoque.</td></tr>'}</table>`;
            } else if (type === 'employees') {
                title = 'Relatório de colaboradores';
                html = `<table><tr><th>Nome</th><th>Matrícula</th><th>Função</th><th>Setor</th><th>Situação</th></tr>${db.employees.map(e => `<tr><td>${esc(e.name)}</td><td>${esc(e.registration || '')}</td><td>${esc(e.role || '')}</td><td>${esc(e.sector || '')}</td><td>${esc(e.status || '')}</td></tr>`).join('')}</table>`;
            } else if (type === 'movements') {
                title = 'Histórico de movimentações';
                html = `<table><tr><th>Data</th><th>Tipo</th><th>Colaborador</th><th>EPI</th><th>Código da unidade</th><th>Qtd.</th><th>Responsável</th><th>Observações</th></tr>${db.movements.map(m => `<tr><td>${fmtDate(m.date)}</td><td>${esc(m.type)}</td><td>${esc(empName(m.employeeId))}</td><td>${esc(epiName(m.epiId))}</td><td>${esc(m.unitCode || '')}</td><td>${m.qty}</td><td>${esc(m.responsible || '')}</td><td>${esc(m.notes || '')}</td></tr>`).join('')}</table>`;
            } else {
                title = 'Relatório de inspeções';
                html = `<table><tr><th>Data</th><th>EPI</th><th>Tipo</th><th>Resultado</th><th>Próxima data</th><th>Responsável</th><th>Observações</th></tr>${db.inspections.map(m => `<tr><td>${fmtDate(m.date)}</td><td>${esc(epiName(m.epiId))}</td><td>${esc(m.kind || '')}</td><td>${esc(m.result || '')}</td><td>${fmtDate(m.nextDate)}</td><td>${esc(m.responsible || '')}</td><td>${esc(m.notes || '')}</td></tr>`).join('')}</table>`;
            }
            openPrintWindow(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${esc(title)}</title>
<style>body{font-family:Arial;padding:24px;color:#25352d}h1{font-size:22px}p{color:#66756c;font-size:12px}table{width:100%;border-collapse:collapse;font-size:11px}td,th{border:1px solid #ddd;padding:7px;text-align:left}th{background:#eef4ef}@media print{button{display:none}}</style></head>
<body><h1>BC2 Infra Estrutura · ${esc(title)}</h1><p>Gerado em ${fmtDate(today())}. Relatório baseado nos dados cadastrados.</p>${html || '<p>Nenhum registro cadastrado.</p>'}</body></html>`);
        }

        function openPrintWindow(markup, prepare = null) {
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert('O navegador bloqueou a janela. Permita pop-ups para imprimir.');
                return null;
            }
            printWindow.opener = null;
            printWindow.addEventListener('load', () => {
                try {
                    if (prepare && prepare(printWindow) === false) return;
                    printWindow.focus();
                    printWindow.print();
                } catch (error) {
                    console.error('Não foi possível preparar a impressão.', error);
                }
            }, { once: true });
            printWindow.document.open();
            printWindow.document.write(markup);
            printWindow.document.close();
            return printWindow;
        }

        const UI_ACTIONS = {
            openNewEpi: () => BC2NewEpi.open('', false),
            openEpiPackaging: element => BC2NewEpi.open(element.dataset.code, false),
            signOut: () => signOut(),
            openPersonalSettings: () => openPersonalSettings(),
            backFromPersonalSettings: () => backFromPersonalSettings(),
            selectPersonalTheme: element => selectPersonalTheme(element),
            sendPasswordChangeLink: () => sendPasswordChangeLink(),
            openStockTab: () => goTab('epis'),
            openEpi: () => openEpi(),
            closeEpiFolder: () => closeEpiFolder(),
            openEpiFolder: element => openEpiFolder(element.dataset.folderName),
            createEpiFolder: () => createEpiFolder(),
            addExistingEpiToFolder: () => addExistingEpiToFolder(),
            openEpiSize: element => openEpiSize(element.dataset.recordId),
            startScanner: () => { if (window.BC2NewEpi) window.BC2NewEpi.cameraMode = false; return startScanner(); },
            captureScannerPhoto: () => barcodePhotoScanner.capture(),
            openScannerPhoto: () => { if (window.BC2NewEpi) window.BC2NewEpi.cameraMode = false; stopScanner(); document.getElementById('scannerPhotoInput').click(); },
            clearScannerPhoto: () => barcodePhotoScanner.clearPhoto(),
            stopScanner: () => stopScanner(),
            lookupBarcode: () => lookupBarcode(),
            openEmployeeImport: () => document.getElementById('employeeImportFile').click(),
            openEmployee: () => openEmployee(),
            openMovement: () => openMovement(),
            openInspection: () => openInspection(),
            printStockReport: () => printReport('stock'),
            printEmployeeReport: () => printReport('employees'),
            printMovementReport: () => printReport('movements'),
            printInspectionReport: () => printReport('inspections'),
            exportBackup: () => exportBackup(),
            importBackup: () => importBackup(),
            migrateLocalData: () => migrateLocalData(),
            openUserRequests: () => openUsersPage('requests'),
            openUserRoles: () => openUsersPage('roles'),
            showUsersHome: () => showUsersHome(),
            openApprovedLevels: () => openUsersPage('approved'),
            openEditLevels: () => openUsersPage('edit'),
            openCreateLevels: () => openUsersPage('create'),
            createRole: () => saveRole('create'),
            newRole: () => newRole(),
            saveRole: () => saveRole(),
            deleteRole: () => deleteRole(),
            loadAuditLog: () => loadAuditLog(),
            zoomOut: () => stepScannerZoom(-1),
            zoomIn: () => stepScannerZoom(1),
            setScannerZoom: element => setScannerZoom(element.value),
            closeModal: () => closeModal(),
            openLogin: () => openAuthForm('login'),
            openAccessRequest: () => openAuthForm('request'),
            resetAuthPassword: () => resetAuthPassword(),
            showAuthChoices: () => showAuthChoices(),
            setPasswordAfterEmailLink: () => setPasswordAfterEmailLink(),
            bootSecureApp: () => bootSecureApp(),
            addLocalProductToStock: () => addLocalProductToStock(),
            editScannedLocalProduct: () => editScannedLocalProduct(),
            editEpi: element => editEpi(element.dataset.recordId),
            printUnitLabels: element => printUnitLabels(element.dataset.recordId),
            deleteEpi: element => deleteEpi(element.dataset.recordId),
            openProductFormFromBarcode: () => openProductForm(null, document.getElementById('barcodeInput').value.trim()),
            openEpiFromBarcode: () => openEpi(null, '', document.getElementById('barcodeInput').value.trim()),
            addScannedProductToCatalog: () => addScannedProductToCatalog(),
            openEpiFromScannedProduct: () => openEpi(null, lastBarcodeProduct?.name || '', document.getElementById('barcodeInput').value.trim(), lastBarcodeProduct),
            returnScannedUnit: () => returnScannedUnit(),
            assignScannedUnit: () => assignScannedUnit(),
            showEmployeeHistory: element => showEmployeeHistory(element.dataset.recordId),
            editEmployee: element => editEmployee(element.dataset.recordId),
            deleteEmployee: element => deleteEmployee(element.dataset.recordId),
            viewMovement: element => viewMovement(element.dataset.recordId),
            editInspection: element => editInspection(element.dataset.recordId),
            updateUserAccess: element => updateUserAccess(element.dataset.userId, element.dataset.status),
        };
        const UI_INPUT_ACTIONS = {
            renderEpis: () => renderEpis(),
            renderEmployees: () => renderEmployees(),
            renderMovements: () => renderMovements(),
            renderInspections: () => renderInspections(),
            setScannerZoom: element => setScannerZoom(element.value),
        };
        const UI_CHANGE_ACTIONS = {
            readScannerPhoto: element => barcodePhotoScanner.upload(element),
            renderMovements: () => renderMovements(),
            handleEmployeeImportFile: element => handleEmployeeImportFile(element),
            selectRoleForEdit: () => selectRoleForEdit(),
            updatePendingApprovalState: element => updatePendingApprovalState(element.dataset.userId),
        };
        const UI_SUBMIT_ACTIONS = {
            submitAuthForm: (form, event) => submitAuthForm(event),
            savePersonalName: (form, event) => savePersonalName(event),
            changePersonalPassword: (form, event) => changePersonalPassword(event),
            requestEmailChange: (form, event) => requestEmailChange(event),
            recordBarcodeMovement: (form, event) => recordBarcodeMovement(event),
        };
        function runUIAction(actions, element, event) {
            const action = actions[element?.dataset?.uiAction || element?.dataset?.uiInput || element?.dataset?.uiChange || element?.dataset?.uiSubmit];
            if (!action) return;
            try {
                const result = action(element, event);
                if (result && typeof result.catch === 'function') result.catch(error => console.error('Ação da interface não concluída.', error));
            } catch (error) {
                console.error('Ação da interface não concluída.', error);
            }
        }
        document.addEventListener('click', event => {
            const element = event.target instanceof Element ? event.target.closest('[data-ui-action]') : null;
            if (!element || element.disabled || element.getAttribute('aria-disabled') === 'true') return;
            const action = UI_ACTIONS[element.dataset.uiAction];
            if (!action) return;
            if (element.tagName === 'BUTTON') event.preventDefault();
            runUIAction({ [element.dataset.uiAction]: action }, element, event);
        });
        document.addEventListener('input', event => {
            const element = event.target instanceof Element ? event.target.closest('[data-ui-input]') : null;
            if (element) runUIAction(UI_INPUT_ACTIONS, element, event);
        });
        document.addEventListener('change', event => {
            const element = event.target instanceof Element ? event.target.closest('[data-ui-change]') : null;
            if (element) runUIAction(UI_CHANGE_ACTIONS, element, event);
        });
        document.addEventListener('submit', event => {
            const form = event.target instanceof Element ? event.target.closest('[data-ui-submit]') : null;
            if (!form) return;
            event.preventDefault();
            const action = UI_SUBMIT_ACTIONS[form.dataset.uiSubmit];
            if (action) {
                try {
                    const result = action(form, event);
                    if (result && typeof result.catch === 'function') result.catch(error => console.error('O formulário não foi concluído.', error));
                } catch (error) {
                    console.error('O formulário não foi concluído.', error);
                }
            }
        });

        productDatabaseReady = Promise.resolve(false);
        bootSecureApp();
        if ('serviceWorker' in navigator && location.protocol !== 'file:') {
            navigator.serviceWorker.register('./service-worker.js')
                .catch(error => console.warn('Não foi possível preparar o modo offline:', error));
        }
    
