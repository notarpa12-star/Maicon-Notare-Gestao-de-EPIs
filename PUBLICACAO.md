# Instalação em Configurações pessoais — publicado em 09/11/2026

- Site: https://estoque.bc2-epi.workers.dev/
- Versão ativa confirmada: **b38136cb**. Identificação conferida no site: **download-conta-20261109**.
- O cartão **Fazer download do aplicativo** foi removido da entrada e movido para **Configurações pessoais → Aplicativo BC2**. No celular, entre no BC2 e abra **Minha conta**.
- A função de instalação e as instruções para Android/iPhone foram preservadas. O aplicativo continua exigindo internet.
- Backup anterior: **BC2-backup-antes-download-configuracoes-2026-11-09.zip** e cópia do Worker publicado antes da alteração.
- **126 testes aprovados**. Conferidos login sem botão, botão dentro da página pessoal, diálogo de instruções e largura móvel sem rolagem horizontal. A posição do botão e a identificação da versão foram também conferidas no HTML em produção.
- Somente interface, identificação de versão e cache atualizados; dados, contas e vínculos do banco preservados.

## Publicações anteriores

# Pastas e fotos — publicado em 08/11/2026

- Site: https://estoque.bc2-epi.workers.dev/
- Versão final ativa: **21aee0c6**, confirmada como **Pronto**, com **100%** do tráfego.
- Identificação no HTML publicado: **pastas-foto-20261108**.
- Criar pasta somente pelo nome, manter pastas vazias, página própria com Voltar, cadastrar e mover EPIs existentes, adicionar tamanhos e mostrar pares/unidades separadamente.
- Foto da galeria e **Tirar foto e ler**, com encerramento da câmera antes da leitura. Foto nova invalida o resultado anterior; cancelar a seleção o preserva.
- Botão **Fazer download do aplicativo** na entrada; contatos da entrada e opções LGPD da interface removidos. Aviso vermelho de rastreabilidade removido de Movimentações, mantendo registros e controles.
- **126 testes aprovados**, exclusivamente com dados fictícios. Conferência visual em computador e 390 pixels, incluindo persistência após recarregar, página exclusiva, outro tamanho, totais separados, Code128 da câmera fictícia, QR da galeria, imagem em branco e orientação de instalação.
- Login móvel e arquivos versionados conferidos em produção, sem erros no navegador. Funções privadas foram testadas na prévia com SQLite temporário; câmera física e instalação devem ser conferidas no aparelho.
- Código copiado de volta do editor e comparado ao arquivo testado antes de implantar. Versão intermediária desta publicação: edfca3b7; a versão final acrescenta identificação de versão aos módulos de dados/navegação e atualiza o cache para v33.
- Bindings **DB → bc2-seguro-db**, **ASSETS** e **USER_API_LIMITER** preservados e conferidos no painel. Nenhuma tabela foi apagada ou recriada. Pastas são registros adicionais na estrutura existente.
- Nenhum dado fictício gravado no banco real, alteração de usuários reais, troca de plano ou contratação de serviço pago.
- Backup do projeto antes das pastas: **BC2-backup-antes-pastas-2026-11-08.zip**. Cópia da versão pública anterior: **BC2-worker-antes-pastas-fotos-2026-11-08.mjs**.
- Instruções de uso e limites: **PASTAS-E-FOTOS.md**.

## Histórico confirmado

# Aplicativo móvel — publicado em 07/11/2026

- Site: https://estoque.bc2-epi.workers.dev/
- Versão ativa confirmada: **1b8e595b**.
- Identificação conferida no site: **mobile-online-20261107**.
- Login móvel abre diretamente o formulário para quem está sem sessão. Depois da autenticação, a página inicial mostra os quadrados das funções permitidas.
- Layout móvel próprio até 760 pixels; versão de computador preservada. Funções, contas e banco compartilhados.
- Uso exige conexão real com o servidor. A queda detectada oculta as telas; a abertura offline mostra apenas o aviso. Recursos públicos podem continuar no cache para instalação, sem liberar o uso offline.
- **102 testes aprovados**. Na prévia fictícia foram conferidos todos os atalhos, páginas de níveis, página pessoal, Voltar, menu, cadastro e retorno ao login, tela inicial de 390/360 pixels sem rolagem horizontal, visual de computador e queda/retorno do servidor.
- O login móvel foi conferido no endereço de produção, sem erros no navegador. As funções privadas foram conferidas na prévia com dados fictícios. Câmera e instalação física devem ser verificadas no aparelho.
- Código do editor copiado de volta e comparado ao arquivo preparado antes de publicar. O script principal usa uma identificação de versão no endereço para evitar mistura com o cache anterior.
- Nenhuma migração de banco, alteração de contas reais ou contratação de plano.
- Instruções e limites: **APLICATIVO-MOBILE.md**.

## Publicações anteriores

Conferência posterior à entrada do responsável: migração **ativada em produção**, geração **legacy-v1**, revisão **16**, em 07/11/2026. A cópia anterior permaneceu com os mesmos 112 bytes e revisão 16; as contagens consultadas de EPIs, colaboradores e movimentações estavam zeradas antes e depois. O responsável confirmou que entrou e o estoque carregou normalmente. Nenhum registro fictício foi gravado em produção.

# Gravação por registro — publicada em 07/11/2026

- Endereço: https://estoque.bc2-epi.workers.dev/
- Versão ativa confirmada: **66c1a198**, Pronto.
- Identificação retornada pelo site: **registros-separados-20261107**.
- Gravação por registro e consultas em páginas. A base inteira não precisa caber em 1,5 MB.
- Migração automática na primeira sessão aprovada. A consulta de conferência antes da ativação encontrou a estrutura antiga intacta; não foi feita gravação fictícia em produção. A cópia antiga fica protegida no mesmo D1 após a migração.
- **92 testes aprovados**, mais edição de EPI na prévia local (450 bytes enviados), persistência após recarregar e importação fictícia acima de 2 MB nos testes.
- Banco, autenticação, contas, permissões e bindings preservados. Nenhum plano pago contratado.
- Código do editor copiado de volta e comparado ao arquivo testado antes de publicar.
- Passo a passo, recuperação e limites restantes: **REGISTROS-SEPARADOS.md**.

## Publicações anteriores

# Três páginas de níveis — publicação em 06/11/2026

- Site: https://estoque.bc2-epi.workers.dev/
- Versão ativa confirmada: **6d9139d5**.
- Identificação do site: **niveis-tres-paginas-20261106**.
- Níveis de acesso agora abre três páginas: Nível das pessoas aprovadas, Editar níveis e Criação de níveis, todas com Voltar.
- Todos os níveis podem ser renomeados. O nível de administração total mantém ID e permissões; somente Administradores podem renomeá-lo. Conta principal e próprio nível continuam protegidos.
- **77 testes automatizados aprovados**, mais conferência no navegador em prévia local com banco temporário fictício: criação separada, renomeação comum e de Administrador, vínculos preservados e navegação. Nenhum nível real foi modificado para testar.
- Banco e vínculos originais preservados; nenhuma migração.
- Código no editor da hospedagem comparado ao arquivo testado antes de publicar.
- Instruções: **TRES-PAGINAS-DE-NIVEIS.md**.

## Histórico anterior

# Atualização publicada em 06/11/2026

- Endereço: https://estoque.bc2-epi.workers.dev/
- Versão ativa: **e4831c37**, confirmada como **Pronto**, com 100% do tráfego.
- Identificação conferida no site: **niveis-pagina-pessoal-20261106**.
- Outra conta Administradora pode ter seu nível alterado por um Administrador. A conta principal e a alteração do próprio nível permanecem protegidas.
- Configurações pessoais abrem em página própria, com botão Voltar.
- **66 testes aprovados**, usando dados fictícios. As telas privadas foram verificadas pelos testes locais; a conferência em produção confirmou a versão, a exigência de login no endereço da página pessoal e ausência de erros no navegador, sem entrar em contas reais.
- Banco e vínculos DB, ASSETS e USER_API_LIMITER preservados; nenhuma migração ou alteração em níveis de pessoas reais.
- O conteúdo preparado no editor foi copiado de volta e comparado ao arquivo testado antes da publicação.
- Passo a passo: **NIVEIS-E-PAGINA-PESSOAL.md**.

## Histórico das publicações anteriores

# Publicação confirmada

Atualização mais recente do cadastro, conferida em **06/11/2026**:

- Versão confirmada como ativa no painel: **c97f8945**.
- Identificação retornada pelo site: **cadastro-senha-verificacao-20261106**.
- Formulário conferido no endereço habitual com nome, e-mail, senha e confirmação da senha.
- **46 testes aprovados**, com respostas de envio simuladas e sem criar contas ou enviar e-mails reais em produção.
- Contas existentes, senhas, aprovação, permissões e banco central preservados.
- Leia **CADASTRO-COM-SENHA.md** para o passo a passo atualizado.

Registro da publicação anterior, que acrescentou leitura de embalagem e foi preservada nesta atualização:

- Endereço: https://estoque.bc2-epi.workers.dev/
- Worker existente: **estoque**.
- Versão confirmada pelo painel como ativa: **7127c9b1**.
- Identificação retornada pela interface: **cadastro-embalagem-20261105**.
- Módulo da ficha carregado no endereço de produção: confirmado.
- Conferência final: **06/11/2026**, no horário local do usuário.
- Banco existente: **bc2-seguro-db**, com o mesmo vínculo **DB**. Vínculos **ASSETS** e **USER_API_LIMITER** também preservados.
- Login, aprovações, permissões e histórico mantidos. Sem criação de usuários, importação de registros ou migração de banco.
- Testes: **32 aprovados**, com dados fictícios. O fluxo de leitura de etiqueta e cálculos já havia sido conferido no navegador durante a preparação da funcionalidade. Não houve inserção de teste na produção nem leitura física de câmera/USB na produção.

Antes de publicar, o código preparado no editor foi copiado de volta e comparado ao arquivo testado: conteúdo idêntico após normalizar as quebras de linha. A versão anterior também foi copiada do editor para backup.

Os arquivos editáveis desta pasta correspondem à atualização. `PUBLICAR-WORKER.mjs` agrupa os arquivos públicos para o editor da hospedagem e continua usando o banco e os vínculos originais. Para regenerar esse agrupamento após uma edição, execute `node preparar-publicacao.cjs`.

Backups em **backups/** são cópias do aplicativo. Para os dados do banco, mantenha a rotina **Relatórios e backup** do BC2.
