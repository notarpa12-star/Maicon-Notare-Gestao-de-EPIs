# BC2 Controle de EPIs

Código do sistema de estoque de EPIs, com controle de acesso, movimentações, leitura de códigos e aplicativo instalável.

## Preparar uma instalação

1. Configure seu projeto Firebase Authentication em `site/firebase-config.js`.
2. Preencha o projeto Firebase, administrador e vínculos Cloudflare em `wrangler.jsonc`.
3. Atualize os canais de suporte na seção `support` de `site/index.html`.
4. Gere o pacote do Worker e execute os testes com Node.js 24.

```sh
node preparar-publicacao.cjs
node --test tests/*.test.cjs tests/*.test.mjs
```

O arquivo `PUBLICAR-WORKER.mjs` é gerado a partir da interface e do código do servidor. Os arquivos SQL em `migrations/` criam a estrutura do banco. Os testes usam dados fictícios. A seção seguinte preserva o histórico e o guia de implantação do projeto.

---

# Instalação em Configurações pessoais — publicado em 09/11/2026

- Site: https://estoque.bc2-epi.workers.dev/
- Versão ativa confirmada: **b38136cb**. Identificação conferida no site: **download-conta-20261109**.
- O cartão **Fazer download do aplicativo** foi removido da entrada e movido para **Configurações pessoais → Aplicativo BC2**. No celular, entre no BC2 e abra **Minha conta**.
- A função de instalação e as instruções para Android/iPhone foram preservadas. O aplicativo continua exigindo internet.
- Backup anterior: **BC2-backup-antes-download-configuracoes-2026-11-09.zip** e cópia do Worker publicado antes da alteração.
- **126 testes aprovados**. Conferidos login sem botão, botão dentro da página pessoal, diálogo de instruções e largura móvel sem rolagem horizontal. A posição do botão e a identificação da versão foram também conferidas no HTML em produção.
- Somente interface, identificação de versão e cache atualizados; dados, contas e vínculos do banco preservados.

## Documentação preservada

# BC2 — atualização publicada em 08/11/2026

Site: https://estoque.bc2-epi.workers.dev/ · Versão ativa: **21aee0c6** · Identificação: **pastas-foto-20261108**.

Leia primeiro **PASTAS-E-FOTOS.md** para usar as pastas, tamanhos, fotos e instalação do aplicativo. **126 testes aprovados**; telas conferidas com dados fictícios no computador e no visual móvel. Publicação confirmada como Pronto, com 100% do tráfego. O pacote é editável e não inclui exportação dos registros reais do banco. O BC2 continua usando o D1 central existente.

## Documentação anterior preservada

Layout móvel com quadrados e uso com internet publicado em 07/11/2026. Leia APLICATIVO-MOBILE.md para instalar e PUBLICACAO.md para a conferência.

Gravação por registro publicada em 07/11/2026. Leia REGISTROS-SEPARADOS.md e PUBLICACAO.md antes de manutenção ou recuperação.

Atualização de 06/11/2026: três páginas de níveis e renomeação publicadas. Leia TRES-PAGINAS-DE-NIVEIS.md e PUBLICACAO.md.

Atualização de 06/11/2026 publicada: níveis de outros Administradores e página pessoal com Voltar. Leia NIVEIS-E-PAGINA-PESSOAL.md e PUBLICACAO.md.

Cadastro atualizado em 06/11/2026: leia CADASTRO-COM-SENHA.md para o novo fluxo e os limites de envio.

Atualização de cadastro por embalagem publicada no site habitual. Leia ATUALIZACAO-CADASTRO.md para o fluxo novo e PUBLICACAO.md para a conferência da publicação.

# BC2 Seguro — guia de implantação

## O que esta versão prepara

Esta pasta contém uma cópia editável do BC2, sem substituir o site atual. A versão segura usa:

- login por e-mail e senha e cadastro com senha seguido de verificação comum do e-mail pelo Firebase Authentication;
- aprovação do Administrador antes de mostrar qualquer dado;
- níveis de acesso editáveis para cada aba;
- banco central Cloudflare D1 e histórico de alterações;
- PWA instalável, sem salvar respostas do banco no cache offline.

O primeiro Administrador será `admin@example.com`. A cópia do banco começa vazia. O aplicativo não limpa nem altera o `localStorage` ou o `IndexedDB` do BC2 atual; a migração para o banco novo é uma cópia iniciada pelo Administrador depois de exportar backup.

## Alternativa ao Cloudflare Zero Trust

Como a tela de Zero Trust chegou à etapa de pagamento, não informe cartão nem escolha um plano pago. O login desta versão foi trocado para Firebase Authentication no plano gratuito **Spark**. O plano Spark inclui os recursos básicos de autenticação sem exigir dados de pagamento; os limites variam por função. [Planos Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)

A conta de login e a senha ficam no serviço de autenticação Firebase. Os dados do BC2 continuam no banco Cloudflare D1. A aprovação e as permissões por aba continuam dentro do BC2. Isso evita depender do cadastro Zero Trust.

O BC2 usa e-mail e senha para entrar. No cadastro novo, a pessoa informa nome, e-mail, senha e confirmação. Recebe uma verificação comum do e-mail e, depois de confirmar, entra para encaminhar o pedido de aprovação. Esse envio tem cota gratuita publicada de 1.000 e-mails por dia, em vez dos 5 envios do método anterior. Não é necessário alterar o plano. Links antigos continuam compatíveis, mas o cadastro novo não envia links de acesso. Não habilite login por telefone/SMS, pois isso pode exigir cobrança. O código de configuração web (`apiKey` e `projectId`) é identificador público do app, não uma senha. Nunca copie para o site uma chave privada ou arquivo de conta de serviço.

## Contatos, suporte e privacidade (LGPD)

A aba **Contatos e Suporte** reúne os canais para dúvidas, críticas, reclamações, erros do site e solicitações sobre dados pessoais. Os contatos informados pelo responsável são WhatsApp **PREENCHER_TELEFONE_DE_SUPORTE** e e-mail **admin@example.com**. Também há links de suporte na tela pública de entrada, inclusive para quem ainda está aguardando aprovação.

Na tela de entrada aparece um aviso discreto de privacidade. A pessoa pode solicitar a qualquer momento acesso, correção ou exclusão de seus dados pelo e-mail de suporte. O pedido deve ser analisado conforme a LGPD: pode haver hipóteses legais para conservar certos registros, então o sistema não promete exclusão automática ou imediata. A tela também oferece um link da ANPD para conhecer os direitos dos titulares. Este aviso e os canais de contato não substituem a revisão dos procedimentos de privacidade da BC2.

Ao clicar em **Entrar**, abre uma tela própria dentro do site com e-mail, senha e o botão **Voltar** abaixo; o nome não é pedido. Ao clicar em **Pedir autorização**, abre outra tela com nome, e-mail, senha e confirmação da senha. Depois de confirmar o endereço pelo e-mail recebido, a pessoa volta para entrar e aguarda a aprovação. Em ambas as telas há um botão **Voltar** ao final. Mesmo depois de definir senha, uma pessoa nova continua bloqueada até a aprovação do Administrador.

## Limite sobre acesso “local”

O endereço `estoque.bc2-epi.workers.dev` fica na internet. Esta alternativa mantém o endereço gratuito e permite que aparelhos compartilhem o banco com internet. Ela não deixa o sistema restrito somente à rede local da BC2. Para uso somente na rede da empresa é preciso outra instalação, em um computador/servidor local.

O PWA pode abrir a tela sem internet, mas não permite entrar nem gravar alterações offline. Não use o armazenamento local de aparelhos diferentes como se fosse sincronizado.

## Primeiro: preserve os dados existentes

1. No BC2 atual, abra **Relatórios e backups** e use **Exportar backup**.
2. Guarde o arquivo e faça uma segunda cópia segura.
3. Não limpe os dados do navegador nem desinstale o PWA.
4. Teste primeiro com cadastros fictícios. Só depois envie uma cópia dos dados reais para o banco central.

## Preparar o Firebase (sem iniciar cobrança)

1. Abra o [Firebase Console](https://console.firebase.google.com/) e crie um projeto para o BC2. Se oferecer o plano, mantenha **Spark / gratuito**. Não vincule uma conta de cobrança nem selecione Blaze.
2. No Firebase, abra **Authentication > Sign-in method**, mantenha **Email/Password** ligado. O novo cadastro usa verificação comum de e-mail. Mantenha **Email link (passwordless sign-in)** se ainda houver links antigos a concluir; ele não é usado para enviar novos cadastros. Não ative telefone/SMS.
3. Em **Project settings**, registre um aplicativo Web (`</>`), com um nome como `BC2 Web`. Na configuração do app, copie `apiKey` e `projectId` para `site/firebase-config.js`, substituindo os dois valores `PREENCHER_...`.
4. Em **Authentication > Settings > Authorized domains**, mantenha os domínios existentes e adicione `estoque.bc2-epi.workers.dev` se ainda não estiver na lista. Não compartilhe senhas, links de confirmação, chaves privadas ou códigos de recuperação no chat. O `apiKey` web e o ID do projeto não dão acesso administrativo ao projeto; as permissões dos dados são verificadas também pelo servidor.

## Banco e publicação no Cloudflare

O Worker `estoque` e o banco D1 `bc2-seguro-db` existentes serão reutilizados. Esta versão acrescenta uma migração pequena para salvar temas pessoais e vincular cada conta BC2 à identidade estável do Firebase. A migração não apaga cadastros, estoque, colaboradores, movimentações, permissões nem logs.

Antes de publicar, faça uma cópia extra do banco central. Na pasta `BC2-Seguro`, abra o terminal do VS Code e execute, uma linha por vez:

```powershell
npx wrangler d1 export bc2-seguro-db --remote --output backup-BC2-antes-configuracoes.sql
npx wrangler d1 migrations apply bc2-seguro-db --remote
npx wrangler deploy
```

O primeiro comando exporta o banco para um arquivo SQL local; mantenha esse arquivo em uma pasta segura da empresa e não o envie por e-mail ou grupo, porque pode conter dados pessoais. O segundo comando aplica apenas a nova migração `0002_personal_settings.sql`; se o Wrangler pedir confirmação, confira que o alvo é `bc2-seguro-db` remoto e confirme. O terceiro envia os arquivos do site ao Worker existente. **Não rode `d1 create`** e não apague as migrações. Os arquivos e bancos locais do navegador não são apagados. O nome `estoque` e o vínculo com o mesmo banco estão mantidos.

Se qualquer comando mostrar erro, pare e guarde a mensagem completa (sem tokens ou senhas) antes de tentar de novo. Não cole chaves, códigos de login ou o conteúdo do backup aqui.

## Configurações pessoais

Depois de entrar, a opção **Configurações pessoais** aparece no alto do site. Cada pessoa pode alterar apenas o próprio nome, escolher um dos quatro temas (BC2 atual, Claro, Escuro ou Aurora), trocar a própria senha e solicitar mudança do próprio e-mail. O nome e o tema são gravados no banco BC2 por usuário e acompanhados pelo log. O tema também acompanha a conta ao entrar em outro dispositivo.

Para trocar a senha, a pessoa informa a senha atual e uma senha nova com pelo menos 12 caracteres, uma letra maiúscula, uma minúscula, um número e um símbolo. Há também uma opção para pedir um link de redefinição ao Firebase. Para trocar o e-mail, ela informa a senha atual, digita o novo endereço duas vezes e abre a confirmação enviada ao novo endereço. Até a confirmação, o endereço antigo continua funcionando; após confirmar, o mesmo identificador Firebase mantém o nível de acesso BC2 existente. A alteração fica registrada no log. Se o envio do link falhar, o pedido temporário é cancelado; sem confirmação em 24 horas, pedidos pendentes expiram.

O Firebase exige uma entrada recente para alterações sensíveis, e a troca de e-mail só é concluída depois da confirmação no novo endereço. Consulte a [documentação oficial de autenticação do Firebase](https://firebase.google.com/docs/auth/web/manage-users) e o [processo oficial de alteração de e-mail](https://cloud.google.com/identity-platform/docs/reference/rest/v1/accounts/sendOobCode).

## Google Search Console

A etiqueta `google-site-verification` fornecida pelo Google já está no `<head>` da página inicial. Para que o Google possa encontrar a página pública de login, a versão atual permite indexação da página de entrada. As áreas internas continuam protegidas pelo login; o Google não recebe acesso às telas autenticadas nem aos dados do banco. Publique com `npx wrangler deploy` e, em seguida, volte ao Search Console e clique em **Verificar**. A aparição nos resultados pode levar alguns dias depois da verificação.

O site apresenta duas opções: **Entrar** (e-mail e senha) ou **Pedir autorização** (nome e e-mail). A pessoa escolhe a senha no cadastro e o Firebase envia a confirmação comum do e-mail. Depois de confirmar, ela entra com a senha; o BC2 então registra o pedido e mostra **Analisando seu pedido de autorização** sempre que aquela conta entrar até o Administrador aprovar ou recusar. O servidor só libera os dados após confirmação e aprovação. O primeiro acesso de `admin@example.com` também passa por esse fluxo e o servidor o reconhece como Administrador principal.

## Importar colaboradores de uma planilha

Na aba **Colaboradores**, use **Importar planilha** e escolha um arquivo `.xlsx` ou `.csv`. A primeira linha deve ter as colunas **Nome**, **Matrícula**, **Função** e **Equipe/Setor** (também são aceitos títulos como **Nome completo**, **Cargo** e **Setor / equipe**). O BC2 mostra uma prévia e só grava depois da confirmação.

A matrícula identifica a pessoa: uma matrícula já cadastrada atualiza nome, função e equipe; uma matrícula nova cria um colaborador ativo. Ninguém é excluído pela importação, e situação, observações e histórico existentes são preservados. Linhas sem nome, matrícula ou função, ou com matrícula repetida, bloqueiam a importação para que a planilha seja corrigida. Para preservar zeros no início da matrícula, deixe a coluna formatada como **Texto** no Excel antes de preencher/salvar. A planilha é lida no navegador e só os dados confirmados são enviados ao banco central.

## Pastas, tamanhos e alertas de reposição

A aba **Estoque de EPIs** mostra primeiro apenas os modelos e tamanhos com saldo disponível. Cada pasta mostra o nome do modelo, o total disponível, as numerações com suas quantidades e o CA. Ao abrir, cada numeração aparece em um cartão próprio. Categoria, fabricante, código, lote, validade e observações ficam em **Ver outras informações**. Cadastros sem saldo ficam numa área separada e recolhida, para facilitar a reposição sem misturá-los com o estoque disponível. Os EPIs entregues são consultados nas abas **Colaboradores** e **Movimentações**. Entregar ou devolver uma unidade atualiza o saldo automaticamente. O relatório de estoque também lista somente os itens com saldo positivo e não mistura colaboradores nem unidades entregues. Fichas, entregas e histórico existentes são preservados; nenhuma informação é apagada ou regravada por essa organização.

O campo **Mínimo para alerta de reposição** define quantas unidades devem ficar disponíveis antes de o produto aparecer na Visão geral. Nos novos EPIs o padrão começa em 5 e pode ser alterado; nos registros antigos, que não tinham esse campo, o mínimo começa em 0 e precisa ser definido ao editar cada EPI. A Visão geral lista até oito registros abaixo do mínimo, priorizando os que têm maior diferença, e mostra o saldo disponível em vermelho. O painel recalcula após cada alteração local e verifica periodicamente o banco para exibir atualizações feitas por outros dispositivos, sem substituir dados enquanto um formulário está aberto ou há uma gravação não confirmada.

O cadastro de EPI foi simplificado: nome, pasta, tamanho, marca, CA, série/lote, saldo, mínimo e observações. A marca substitui o campo modelo. Categoria, fabricante, código de barras, datas de validade e de testes não aparecem no formulário; valores antigos são preservados. A leitura de código continua vinculando o código internamente, sem pedir que ele seja digitado no cadastro.Esta versão usa camadas grafite e pretas, com texto claro e acentos verdes, e ajusta os cartões, tabelas, formulários e telas de entrada para manter contraste. O PWA atualiza seu cache visual com uma nova versão. As novas propriedades ficam dentro dos registros JSON existentes no D1; não é necessária migração de banco.

## Revisar pedidos e conceder níveis

Na aba **Usuários e níveis**, escolha uma das duas áreas: **Pedidos de acesso** ou **Níveis de acesso**. A página de pedidos lista somente pessoas pendentes; cada pedido mostra nome, e-mail e data. O nível começa sem seleção e o botão **Aprovar e liberar** fica desativado até o Administrador escolher um nível. A confirmação final também mostra o nível escolhido. O servidor só muda o pedido para ativo se receber um nível válido.

Na página **Níveis de acesso**, crie ou modifique os níveis e ajuste o nível de pessoas já aprovadas. O botão **Remover acesso** bloqueia o acesso da pessoa ao BC2 imediatamente. Para preservar a auditoria, a conta e os registros de alterações não são apagados; o Administrador protegido não pode ser removido pela própria tela. Volte à tela inicial da área pelo botão **Voltar**.

## Primeiro acesso e teste

1. Abra o endereço do Worker e selecione **Pedir autorização** com `admin@example.com`.
2. Escolha a senha no cadastro, abra o e-mail para confirmar o endereço e volte para entrar. O servidor reconhece esse endereço e prepara o primeiro nível Administrador.
3. Crie um registro fictício de EPI e uma conta fictícia de usuário. Aprove a conta e teste permissões limitadas. Confira que a conta pendente não vê dados e que o histórico registra quem alterou o quê.
4. Depois de exportar e conferir novamente o backup, selecione **Enviar cópia ao banco central** para copiar os registros antigos. A importação inicial é bloqueada se já houver dados no banco.
5. Faça backups regulares em **Relatórios e backup** e guarde-os fora do dispositivo.

## Verificações locais

Estes comandos rodam testes com dados fictícios, sem publicar nem enviar registros reais:

```powershell
node --check worker.mjs
node --test tests/security.test.mjs
```

Os testes criam um banco temporário e registros fictícios. Eles não publicam o site nem acessam o banco remoto.

## Leitor: identificar produto pelo código

Ao tocar em **Ativar câmera**, o BC2 abre uma tela preta de ponta a ponta com a imagem ao vivo, controles de zoom e **Sair**. O botão **Sair** encerra a transmissão e retorna ao site. O controle usa o zoom da câmera quando o aparelho oferece esse recurso; nos demais aparelhos, aproxima a imagem na tela. A câmera só é solicitada depois do toque e requer HTTPS ou localhost.

O leitor mostra primeiro a ficha do produto disponível para o código e consulta o catálogo da empresa. Sem resultado local, usa a consulta universal gratuita com `product_type=all` e pede todos os campos públicos do produto, em português do Brasil quando disponíveis. A API pode direcionar códigos para Open Food Facts, Open Beauty Facts, Open Pet Food Facts ou Open Products Facts. Quando houver informação, o BC2 mostra nome, marca, fabricante, modelo, tamanho, CA se tiver sido informado, composição/material, descrição, dimensões/peso, conteúdo/embalagem, origem e outros campos públicos recebidos, imagem e link da fonte. A ação **Usar dados para cadastrar/atualizar estoque** abre a ficha para revisão antes de salvar.

O código de barras identifica um item comercial, mas não contém sua ficha técnica, saldo do estoque ou Certificado de Aprovação (CA). Mesmo consultando a base geral, o BC2 não consegue garantir que encontrará um EPI: as bases são colaborativas e a cobertura desses equipamentos pode ser limitada. Confira fabricante, modelo, CA, validade e proteção na embalagem e na ficha oficial. Se nada for encontrado, é possível preencher os dados manualmente e consultar o [Verified by GS1](https://www.gs1.org/services/verified-by-gs1). Na consulta automática, o BC2 envia somente o código; não envia registros da empresa.

## Próximas etapas

Publique esta atualização com o comando acima. Depois, entre no endereço do site e conclua o acesso do Administrador. Antes de cadastrar informações reais, teste o leitor com um produto fictício e depois com um EPI da empresa, conferindo os dados na embalagem. A versão anterior e a cópia de segurança do HTML permanecem preservadas fora da pasta publicada.

## Referências oficiais

- [Planos e cobrança do Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
- [Firebase Authentication para sites](https://firebase.google.com/docs/auth/web/start)
- [Login por link de e-mail](https://firebase.google.com/docs/auth/web/email-link-auth)
- [Limites do Firebase Authentication no Spark](https://firebase.google.com/docs/auth/limits)
- [Adicionar Firebase a um app web](https://firebase.google.com/docs/web/setup)
- [Comandos do banco D1](https://developers.cloudflare.com/d1/wrangler-commands/)
- [Migrações do D1](https://developers.cloudflare.com/d1/reference/migrations/)
- [Exportar um banco D1](https://developers.cloudflare.com/d1/best-practices/import-export-data/)
- [Gerenciar usuários no Firebase Authentication](https://firebase.google.com/docs/auth/web/manage-users)
- [Busca universal de códigos de barras do Open Food Facts](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/scanning-barcodes/)
- [Consulta de produto por código (API v3)](https://openfoodfacts.github.io/documentation/docs/Product-Opener/v3/products/get-api-v3-product-code/)



