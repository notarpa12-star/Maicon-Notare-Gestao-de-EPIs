# BC2 Seguro — cadastro por código e embalagem

O cadastro de usuários recebeu uma atualização posterior em 06/11/2026. Leia **CADASTRO-COM-SENHA.md** para esse fluxo. A funcionalidade de EPIs descrita abaixo continua disponível.

Atualização preparada em 05/11/2026, publicada no endereço habitual **https://estoque.bc2-epi.workers.dev/** e conferida em 06/11/2026. O painel da hospedagem confirmou a versão **7127c9b1** como ativa. O site carregou a identificação da atualização e o módulo novo, mantendo a tela de acesso protegido.

Esta é a integração à versão segura do BC2. Ela mantém o login Firebase, as aprovações, os níveis de acesso, o histórico e o banco Cloudflare D1 já utilizados pelo site. Os dados do estoque são confirmados no banco central. A limitação de ausência de sincronização mencionada no pacote PWA local anterior não se aplica a esta integração: ela usa o mecanismo de banco compartilhado da versão segura.

## Como usar

1. Abra o endereço habitual e entre com sua conta já aprovada.
2. Abra **Leitor de código → + Escanear e cadastrar EPI novo**.
3. Use a câmera, digite o código ou use um leitor USB/Bluetooth que termine a leitura com Enter.
4. Pesquise nas bases públicas. Se encontrar um registro, confira código, produto, tamanho e apresentação na fonte indicada antes de aproveitar os campos vazios.
5. Para pesquisar no fabricante, abra a área correspondente. Informe o endereço da ficha consultada e guarde o trecho que conferiu. A transcrição assistida aceita linhas como “Fabricante: …”, “Modelo: …” e “Tamanho: …”.
6. Opcionalmente fotografe a etiqueta e toque em **Ler texto da foto**. Corrija o texto e escolha uma quantidade somente se corresponder ao conteúdo de uma embalagem recebida.
7. Escolha **Caixa**, **Pacote**, **Par avulso** ou **Unidade avulsa**. Informe o número de embalagens recebidas e o conteúdo de cada caixa/pacote.
8. Escolha se o estoque será controlado em **Par** ou **Unidade**. Marque as conferências da ficha e da quantidade.
9. Toque em **Revisar antes de salvar**, confira o total e confirme a gravação.

Exemplo fictício: **3 caixas com 12 pares = 36 pares**. Se o estoque for em unidades, a conversão para 72 unidades só é aceita após a confirmação de que **1 par = 2 unidades**. Uma caixa de 100 luvas avulsas não equivale a 100 pares.

Se o produto já existir, use **Registrar entrada por caixa / pacote** para aumentar o mesmo saldo. A unidade de estoque já definida fica protegida. Cadastros antigos sem essa definição exigem conferência antes da primeira entrada por embalagem. Os saldos antigos não são convertidos automaticamente.

Também é possível **Somente cadastrar, com saldo zero**. Para salvar uma entrada, o nível precisa permitir consultar o leitor e o estoque, cadastrar ou editar o EPI e consultar/cadastrar movimentações. O servidor continua validando essas permissões.

## Conferências e limites

- Não há cobertura universal de EPIs por código de barras. A pesquisa automática usa Open Products Facts, Open Beauty Facts e Open Food Facts, que são bases colaborativas. O código é enviado para essas consultas; o estoque e os cadastros de pessoas não são enviados a elas.
- A consulta a fabricantes é assistida: a pessoa abre a ficha, confere a apresentação e aproveita o trecho confirmado. Sites que bloqueiam leitura externa não são consultados automaticamente.
- Marca não é presumida como fabricante. CA e quantidades não são inventados. CA informado exige fonte e confirmação humana; esta etapa não valida o certificado automaticamente.
- O reconhecedor de texto funciona no navegador, usando Tesseract.js. A primeira leitura precisa baixar os arquivos do reconhecedor e do idioma. A foto não é enviada a uma API de reconhecimento nem incluída no backup; o texto/evidência do lançamento é conservado.
- A extração sugere quantidades explícitas como “12 pares” e “100 unidades”. Peso, tamanho, CA e datas não definem quantidade. Embalagens dentro de embalagens exigem cálculo e conferência manual.
- O limite é de 10.000 itens de estoque por entrada. Quantidades maiores devem ser divididas em lançamentos. Não há saldo separado por lote nesta etapa; lote e validade da entrada ficam na evidência.
- Bases gratuitas podem falhar, impor limites ou bloquear acesso. O aplicativo informa a falha e permite preenchimento manual. As consultas não têm promessa de gratuidade permanente ou disponibilidade. Consulte as [condições e limites da API](https://openfoodfacts.github.io/openfoodfacts-server/api/).
- Câmera exige HTTPS válido ou localhost e compatibilidade do aparelho. O site habitual já usa HTTPS. Câmera e leitor USB físicos ainda precisam ser conferidos no aparelho de uso.

## Banco central e falhas ao salvar

O novo fluxo prepara a ficha e a entrada juntos e aguarda confirmação do banco. O saldo em memória só muda depois da resposta de sucesso. Se outra pessoa tiver alterado os dados, a revisão do banco impede a sobrescrita e exige reabertura da ficha.

Se houver falha de rede durante a gravação, reabra o BC2 e confira o saldo antes de repetir. Pode acontecer de o servidor receber a entrada e a resposta não chegar ao aparelho. O fluxo bloqueia repetição imediata após esse tipo de falha para reduzir o risco de duplicar recebimentos.

Não foram criados usuários, alterados níveis, importados registros nem aplicadas migrações de banco nesta atualização. O banco existente e seus vínculos são reutilizados. Testes de cálculo e persistência usaram somente dados fictícios em ambiente de teste.

## Atualizar a tela instalada

Feche todas as abas do BC2 e também a janela do aplicativo instalado. Abra o mesmo endereço novamente. Se a tela continuar antiga, recarregue a página e repita o fechamento. Não limpe os dados do navegador para atualizar.

## Arquivos e validação

- **site/**: arquivos editáveis da interface, incluindo `epi-core.js`, `epi-central.js`, `epi-cadastro.js` e `epi-cadastro.css`.
- **worker.mjs**: servidor original com os ajustes necessários à leitura de texto e da foto, mantendo autenticação e permissões.
- **PUBLICAR-WORKER.mjs**: pacote único usado pelo editor da hospedagem; inclui apenas os arquivos da aplicação, sem dados do banco. Ele continua usando os mesmos vínculos DB, ASSETS e limitador de taxa. Arquivos antigos não substituídos continuam disponíveis pelo vínculo ASSETS.
- **wrangler.jsonc**, **migrations/** e configuração Firebase: preservados da versão segura existente.
- **tests/**: 32 testes aprovados de cálculo, confirmação, persistência central, conflito, falha de rede, permissões, autenticação, histórico e conteúdo do pacote.

Para executar os testes na pasta do projeto:

`node --test tests/security.test.mjs tests/embalagem-central.test.cjs tests/publicacao.test.mjs`

A cópia **BC2-Seguro-backup-antes-cadastro.zip** guarda o projeto seguro anterior. **BC2-worker-publicado-antes.mjs** guarda também o código copiado da versão ativa antes da publicação. Esses backups são do aplicativo, não uma exportação dos registros do banco. Continue fazendo o backup dos dados em **Relatórios e backup**.

Para futuras alterações pelo Wrangler, edite os arquivos de **site/** e **worker.mjs**, use a autenticação da conta responsável e publique no Worker **estoque** existente. Não crie outro banco e não envie o backup de dados como arquivo público. Se voltar a publicar pelo editor do painel, execute `node preparar-publicacao.cjs` nesta pasta e use o **PUBLICAR-WORKER.mjs** regenerado para não perder mudanças posteriores.

A pasta de trabalho BC2-Seguro anterior também recebeu os mesmos arquivos atualizados, depois da conferência de que os arquivos originais não tinham sido editados em paralelo. A configuração Firebase e os vínculos do banco foram preservados. O pacote completo inclui as cópias anteriores em **backups/**.

Não foi feito um lançamento de teste no banco de produção: a conferência das gravações usou dados fictícios nos testes. Entre com sua conta aprovada para conferir a ficha e testar a câmera no aparelho habitual.
