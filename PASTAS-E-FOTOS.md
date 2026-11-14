# BC2 — pastas do estoque e leitura de fotos

Versão atualizada em 09/11/2026: **download-conta-20261109**.

**Situação: publicada e confirmada na Cloudflare. Versão ativa b38136cb, confirmada como ativa no painel. Os 126 testes automatizados passaram, e as telas foram conferidas no navegador com dados fictícios.**

## O que mudou

- Estoque tem dois botões: **Cadastrar EPI** e **Criar pasta**.
- Criar pasta pede somente o nome. A pasta pode ficar vazia e permanece salva no banco central.
- Cada cartão de pasta mostra nome, quantidade de cadastros e saldo disponível. Pares e unidades aparecem separados. Em cadastros antigos sem unidade definida, o sistema informa isso sem adivinhar uma conversão.
- Abrir a pasta leva a uma página interna própria, com **Voltar ao estoque**, busca restrita à pasta e somente seus EPIs.
- Dentro dela existem **Cadastrar EPI nesta pasta** e **Adicionar EPI existente**. Adicionar um cadastro existente move sua organização para a pasta escolhida, preservando saldo, códigos individuais, colaboradores e histórico.
- **Adicionar tamanho** cria outra ficha do mesmo modelo dentro da pasta. Começa com saldo zero, tamanho em branco e sem copiar o código de barras de outro tamanho. Nome, marca, modelo e CA existentes servem de base e devem ser conferidos no formulário.
- A ficha manual exige escolher **Par** ou **Unidade**. A unidade de um EPI já definido não é convertida pela edição. Em cadastro antigo, é necessário confirmar o significado do saldo antes de definir a unidade.
- O aviso vermelho de rastreabilidade foi removido de Movimentações. Histórico e controles de entrega/devolução foram preservados.
- Uma nova foto limpa o resultado anterior e invalida consultas pendentes; cancelar a seleção preserva o código existente.
- O leitor aceita foto da galeria e captura pelo botão **Tirar foto e ler**. A câmera é encerrada antes da leitura da foto.
- **Configurações pessoais → Aplicativo BC2** tem **Fazer download do aplicativo**. O botão foi retirado da entrada em 09/11/2026. Contatos da entrada e opções LGPD da interface foram removidos. O suporte comum continua disponível para pessoas autenticadas.

## Como usar as pastas

1. Entre no BC2 com internet e abra **Estoque de EPIs**.
2. Toque em **Criar pasta**, escreva o nome e salve. Nomes iguais, desconsiderando maiúsculas e minúsculas, não são aceitos pelo formulário.
3. Abra o cartão da pasta.
4. Para um EPI novo, use **Cadastrar EPI nesta pasta**, confira unidade, tamanho e saldo e salve.
5. Para organizar algo já cadastrado, use **Adicionar EPI existente**, escolha a ficha e salve. Isso não é uma entrada de estoque.
6. Para outro tamanho do mesmo EPI, use **Adicionar tamanho** ao lado do modelo, informe a numeração e confira os demais dados.
7. Confira os saldos por tamanho. Use **Voltar ao estoque** para ver as pastas.

Os agrupamentos antigos continuam aparecendo por pasta ou nome do EPI. Agrupamentos antigos inteiramente sem saldo continuam acessíveis em **Cadastros sem saldo no estoque**. Pastas criadas explicitamente ficam visíveis mesmo vazias. Itens entregues não contam como saldo disponível.

As pastas têm as mesmas permissões da área de EPIs: consultar para abrir, cadastrar para criar, editar para mover uma ficha. A autorização também é verificada no servidor. A conta principal e os níveis existentes foram preservados.

## Ler código de uma foto

1. Abra **Leitor de código**.
2. Escolha a opção de carregar foto e selecione uma imagem da galeria. Para usar a câmera, abra-a, enquadre o código e toque em **Tirar foto e ler**.
3. O sistema tenta identificar o código na imagem. Se não encontrar, tente uma foto mais nítida ou digite o código. Um leitor USB pode preencher o mesmo campo, como um teclado.
4. Confira o produto encontrado. A identificação de um código não confirma automaticamente nome, CA ou quantidade.
5. Para cadastrar e receber uma embalagem, abra **Escanear e cadastrar EPI novo**, confira as fontes, a apresentação e a quantidade e faça a revisão final antes de salvar.

EAN, UPC, Code128 e QR dependem de suporte do navegador ou da biblioteca incluída. Reflexo, foco, luz, posição, códigos cortados e resolução podem impedir a leitura. Fotos de código têm limite de 20 MB e são reduzidas para processamento; formatos como HEIC dependem do aparelho. Prefira JPG ou PNG se ocorrer erro. A câmera precisa de permissão e de **HTTPS ou localhost**.

A foto do código é processada no aparelho. Somente o código segue para a pesquisa existente. A foto de etiqueta tem uma função separada de leitura de texto: confira e corrija o texto reconhecido. O leitor de texto precisa baixar seus componentes na primeira utilização; se falhar, digite a transcrição e a quantidade manualmente.

## Embalagens e fontes

O cadastro assistido distingue **caixa, pacote, par e unidade**. Quantidade de embalagens e conteúdo por embalagem são informações diferentes. Exemplo fictício: 3 caixas com 12 pares cada resultam em 36 pares. Converter para unidades exige confirmação explícita; o sistema não presume que 12 unidades sejam 12 pares.

As bases públicas consultadas podem não conter EPIs e podem estar erradas. O código não garante acesso à ficha do fabricante. A pesquisa na internet e por domínio do fabricante abre links para conferência humana; o sistema não lê automaticamente qualquer página nem passa a considerar uma busca como fonte verificada. A transcrição assistida só preenche campos com rótulos explícitos. CA e quantidade exigem conferência e indicação de origem. Informação não encontrada fica para preenchimento manual.

O fluxo assistido limita pesquisas a quatro por minuto nesta sessão e usa cache temporário para evitar repetição. Isso não substitui os limites dos fornecedores, que podem considerar o IP compartilhado pela empresa. Bases gratuitas podem limitar solicitações, ficar indisponíveis ou mudar suas regras. Veja a [documentação oficial das APIs Open Food Facts](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/index.md). Não existe garantia de cobertura universal nem de disponibilidade contínua das APIs.

## Instalar o aplicativo

Depois de entrar, abra **Configurações pessoais → Aplicativo BC2** e toque em **Fazer download do aplicativo**. No celular, abra **Minha conta** para chegar a essa página. Se o navegador permitir, será mostrado o convite de instalação. Caso contrário, siga a orientação exibida:

- Android: menu do Chrome → **Instalar aplicativo** ou **Adicionar à tela inicial**.
- iPhone: Safari → **Compartilhar → Adicionar à Tela de Início**.

Abra pelo ícone instalado para usar a janela de aplicativo, sem a barra de endereço normal. Não é um APK nem uma publicação em loja. O layout do celular mantém os quadrados e as mesmas funções permitidas no site. **O BC2 exige internet**, inclusive depois de instalado.

## Dados, limites e backup

Esta versão usa o **banco central D1 existente** para estoque, pastas e histórico. Ela não troca o banco por localStorage. Alterações confirmadas são carregadas pelos outros aparelhos conectados; atualizações dependem de conexão e das rotinas de releitura existentes, sem prometer tempo real instantâneo. Edições concorrentes continuam sujeitas à conferência de versão.

Uma cópia antiga que funcione só com **localStorage** guarda informações naquele navegador e não sincroniza aparelhos. Instalar um atalho não cria sincronização. Preferências, sessão e índices locais existentes têm funções diferentes do banco central.

O plano gratuito também tem limites de hospedagem, armazenamento e consultas. As linhas escritas do log e dos índices podem consumir cota. A documentação atual informa 5 milhões de linhas lidas/dia, 100 mil escritas/dia e 5 GB totais no D1 gratuito; esses valores não são contagem de EPIs. Exceder a cota diária pode interromper consultas até a renovação. Confira o plano e as regras atuais no [painel e documentação do D1](https://developers.cloudflare.com/d1/platform/pricing/). Esta alteração não contrata plano pago nem torna o serviço ilimitado.

Faça exportações periódicas em **Relatórios e backup**. O backup novo inclui as pastas vazias. Backups antigos continuam aceitos; os agrupamentos são reconstruídos a partir das fichas. Restaurar um backup antigo substitui os dados e não recupera pastas vazias que nunca estavam naquele arquivo. A confirmação de substituição permanece obrigatória.

Backup do projeto antes desta alteração: **BC2-backup-antes-pastas-2026-11-08.zip**. Ele contém código, não os registros reais do banco. As cópias antigas e os dados reais não foram apagados.

## Atualizar o aplicativo que já estava instalado

Feche todas as abas antigas do BC2 e o aplicativo instalado, abra novamente com internet e entre normalmente. Não é necessário apagar os dados do navegador. Os arquivos de dados e navegação usam identificação de versão para evitar mistura com o cache anterior.

## Projeto editável e verificação

`site/` contém a interface; `worker.mjs` e `record-store.mjs` contêm o servidor; `tests/` contém testes fictícios. `preparar-publicacao.cjs` gera `PUBLICAR-WORKER.mjs`, sem embutir dados do estoque. As pastas são registros adicionais na tabela genérica existente, sem apagar ou recriar tabelas.

Para quem mantém o projeto, usando Node.js compatível com `node:sqlite`:

```text
node --test tests/*.test.cjs tests/*.test.mjs
node preparar-publicacao.cjs
```

Nesta máquina Windows com perfil restrito foi necessário acrescentar `--preserve-symlinks --preserve-symlinks-main` ao Node para evitar consultas a diretórios fora da área permitida. Isso não amplia permissões.

Resultado nesta versão: **126 testes aprovados**, com SQLite em memória e imagens sintéticas de QR, EAN-13 e Code128. Foram verificados encerramento da câmera antes da leitura, erro sem inventar código, permissões, persistência de pasta vazia entre clientes, backup novo/antigo, tamanhos, totais separados e manutenção dos registros ao mover uma ficha. Nenhum teste gravou dados fictícios no site real.

**Conferência visual realizada:** criação de pasta vazia, cadastro dentro da pasta, outro tamanho com saldo inicial zero, movimentação de uma ficha entre pastas sem mudar o saldo, persistência ao recarregar o endereço da pasta, totais separados (18 pares e 4 unidades fictícias), página exclusiva e retorno. O visual móvel foi conferido em 390 pixels sem rolagem horizontal. A câmera fictícia foi encerrada antes de ler Code128; uma foto QR da galeria abriu a ficha manual sem inventar dados; uma foto em branco mostrou erro e limpou o resultado anterior. O login e a orientação de instalação também foram conferidos. A mudança do botão para Configurações pessoais foi conferida em 09/11/2026. Câmera física e instalação ainda dependem do aparelho. O login móvel e a identificação download-conta-20261109 foram conferidos no endereço de produção, sem erros registrados no navegador e sem criar ou editar registros reais para testar.
