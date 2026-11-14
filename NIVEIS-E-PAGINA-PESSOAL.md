# Administradores e página de configurações pessoais

Atualização de 06/11/2026 para o BC2 existente.

## Alterar outro Administrador

Entre em **Usuários e níveis → Níveis de acesso**. Na lista de pessoas aprovadas, escolha o novo nível do outro Administrador, toque em **Salvar** e confira a confirmação com o nível anterior e o novo.

O nível da conta principal permanece protegido para todas as pessoas. Cada pessoa também fica impedida de alterar o próprio nível ou remover o próprio acesso. As proteções existem na interface e no servidor. O nome pode continuar sendo alterado sem mudar o nível.

Somente uma conta Administradora pode gerenciar o acesso de outra Administradora. Uma pessoa com permissão delegada para gerenciar usuários continua podendo administrar pessoas comuns, mas não promover nem rebaixar Administradores. O nível Administrador padrão conserva suas permissões totais; a mudança é na associação da outra pessoa a um nível existente.

A proteção da conta principal usa seu identificador estável e continua valendo se o e-mail for alterado. A gravação também impede a remoção da última conta Administradora ativa e recusa alterações concorrentes baseadas em um nível/situação que já mudou. As alterações continuam registradas no histórico.

Quando uma pessoa conectada tiver o nível ou as permissões alterados, a tela recarrega na próxima verificação periódica para buscar as permissões atualizadas. O servidor valida o acesso em cada solicitação.

## Configurações pessoais em página própria

O botão **Configurações pessoais** abre **#configuracoes-pessoais** no mesmo site. Essa página mostra somente:

- nome e dados da própria conta;
- escolha do tema de cores;
- alteração de senha e envio do link de recuperação;
- troca de e-mail com confirmação;
- botão **Voltar**.

O cabeçalho, o menu principal, as outras áreas e o rodapé ficam ocultos nessa página. O botão **Voltar** retorna à tela de origem. Os botões Voltar/Avançar do navegador também acompanham a navegação. Ao sair da página, os campos de senha são limpos. O endereço direto continua exigindo autenticação.

## Preservação e testes

Não foram alterados níveis ou dados de pessoas reais para testar. Foram aprovados **66 testes automatizados**, usando contas e banco temporário fictícios. Eles incluem mudança do nível de outro Administrador, bloqueio da conta principal e do próprio nível, mudança de e-mail da conta protegida, concorrência, auditoria e navegação de ida/volta da página pessoal. Os testes anteriores de cadastro, autenticação, permissões e estoque também continuam passando.

Execute `node --test tests/*.test.*` na pasta do projeto para reproduzir.

Não é necessária migração de banco. O banco, as contas, as senhas, os registros de estoque e os vínculos da hospedagem continuam sendo reutilizados. O backup anterior dos arquivos está em **BC2-backup-antes-niveis-e-pagina-pessoal-2026-11-06.zip**; ele não substitui o backup dos dados feito em **Relatórios e backup**.

Para carregar a versão nova, feche e reabra as abas e o aplicativo instalado do BC2. Não limpe os dados do navegador.

## Publicação confirmada

Versão **e4831c37** ativa em https://estoque.bc2-epi.workers.dev/, com identificação **niveis-pagina-pessoal-20261106**. O painel confirmou Pronto e 100% do tráfego. O endereço direto da página pessoal continua pedindo login e o navegador não registrou erros. A conferência das funções privadas usou testes locais com dados fictícios; nenhum nível de pessoa real foi alterado para testar.
