# Níveis de acesso em páginas separadas

Atualização de 06/11/2026.

## Como usar

1. Entre no BC2 e abra **Usuários e níveis**.
2. Escolha **Níveis de acesso**. Abre uma página com três opções.
3. Em **Nível das pessoas aprovadas**, escolha o novo nível ao lado da pessoa, clique em **Salvar** e confirme. Sua própria conta e a conta principal continuam protegidas contra mudança de nível.
4. Em **Editar níveis**, escolha um nível existente, altere **Nome do nível** e/ou suas permissões e clique em **Salvar alterações**. Mudar o nome mantém o identificador e todas as pessoas vinculadas. O nome do nível de administração total também pode ser alterado por um Administrador; suas permissões totais e as proteções da conta principal continuam intactas.
5. Em **Criação de níveis**, informe um nome e escolha as permissões. Clique em **Criar nível**. Depois atribua esse nível às pessoas na primeira opção. Criar um nível não altera ninguém automaticamente.
6. Cada opção tem **Voltar** para o menu de níveis. O menu também tem **Voltar** para a área de usuários. Os botões Voltar/Avançar do navegador acompanham os endereços internos.

O menu usa `#niveis-acesso`; as opções usam `/pessoas`, `/editar` e `/criar` após esse endereço interno. Todos exigem login e a permissão de usuários. A página pessoal anterior continua funcionando.

## Preservação e verificações

- Backup dos arquivos antes da edição: **BC2-backup-antes-tres-paginas-niveis-2026-11-06.zip**. Para dados do banco, use também **Relatórios e backup** do BC2.
- Banco, contas, senhas, estoque e vínculos de hospedagem reutilizados. Nenhuma migração necessária.
- **77 testes automatizados aprovados**: criação independente, renomeação comum e do Administrador, bloqueio de alteração de suas permissões totais, auditoria, preservação dos vínculos, navegação, histórico e proteções anteriores.
- Prévia local com banco temporário e dados fictícios: menu com três opções, páginas separadas e Voltar, criação, renomeação de dois níveis e nomes atualizados na lista das pessoas.
- O ambiente fictício de prévia está em `work/`, fora do projeto publicado. Não existe desvio do login na versão de produção.

Após a publicação, feche e reabra as abas e o aplicativo instalado. Não é necessário limpar dados do navegador.

Para reproduzir os testes na pasta do projeto: `node --test tests/*.test.*`. Para montar o arquivo usado na hospedagem: `node preparar-publicacao.cjs`.

## Situação da publicação

Publicação confirmada no site habitual. Versão ativa **6d9139d5**, identificação **niveis-tres-paginas-20261106**. Veja **PUBLICACAO.md**.
