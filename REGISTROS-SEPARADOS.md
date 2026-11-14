# Gravação por registro — 07/11/2026

## O que muda para você

Continue usando o BC2 normalmente. Ao alterar um EPI, colaborador, movimentação, inspeção ou produto do catálogo central, o site envia somente os registros alterados. O histórico inteiro não precisa mais caber no limite de 1,5 MB de um envio.

As consultas são divididas em páginas internas, sem mudar as abas existentes. Alterações em registros diferentes podem ser salvas por pessoas diferentes. Se duas pessoas alterarem o mesmo registro, a segunda recebe um aviso para recarregar e conferir; seus dados não são sobrescritos silenciosamente. Entrada de EPI e sua movimentação continuam sendo uma transação única.

## Como carregar a atualização

1. Termine e confira qualquer gravação pendente nas abas antigas.
2. Feche todas as abas e o aplicativo instalado do BC2.
3. Abra https://estoque.bc2-epi.workers.dev/ e entre normalmente.
4. A primeira sessão aprovada copia os registros antigos para a estrutura nova, em uma única transação. Contas, senhas, níveis e auditoria são mantidos. A cópia antiga fica preservada no mesmo banco.
5. Confira o estoque e use **Relatórios e backup** para exportar uma cópia atualizada dos dados.

Se uma aba antiga tentar gravar, o servidor pede para reabrir a versão atual. Não é necessário limpar dados do navegador, comprar plano ou criar outra conta.

## Backups e restauração

O backup JSON continua compatível. A restauração envia o arquivo em partes e só muda os dados ativos quando todas as partes forem verificadas. Se a rede cair, faltar uma parte ou outra pessoa alterar o banco durante o envio, os dados ativos são preservados. O conjunto anterior à restauração permanece no banco para recuperação assistida.

A exportação consulta os dados centrais permitidos para sua conta, incluindo o catálogo central, sem depender do espaço local do navegador. Para um backup completo, use uma conta Administradora. Exporte regularmente para um local seguro fora da hospedagem.

O ZIP **BC2-backup-antes-registros-separados-2026-11-07.zip** contém os arquivos anteriores do programa. Ele não contém os dados pessoais ou o estoque do banco de produção.

## Limites que continuam existindo

- A melhoria remove o limite de 1,5 MB sobre a base inteira. A proteção de 1,5 MB por solicitação continua. Cada registro individual admite até aproximadamente 1,4 MB; cadastros extraordinariamente grandes precisam ser divididos.
- Uma gravação comum pode alterar até 100 registros atomicamente. Operações maiores devem usar a restauração em partes. Uma entrada normal de estoque altera poucos registros.
- Os dados visíveis ainda são montados na memória do navegador. Históricos muito grandes podem exigir uma segunda etapa de otimização das telas e relatórios.
- As cotas de hospedagem, armazenamento, autenticação e consultas continuam. A melhoria não torna a capacidade ilimitada.
- Internet continua necessária. O aplicativo não adiciona gravação offline.
- Cópias anteriores, registros removidos e comprovantes de envio ocupam espaço no banco. A retenção e limpeza deverão ser planejadas conforme o crescimento; esta atualização não apaga cópias automaticamente.
- Auditoria de campos muito extensos usa um resumo para respeitar o limite de cada linha do banco. Campos comuns continuam mostrando antes/depois.

## Informações para manutenção

`record-store.mjs` implementa a persistência; `site/record-client.js` compara os registros e controla versões. `migrations/0003_registros_separados.sql` documenta o esquema. O Worker prepara o esquema automaticamente na primeira sessão aprovada e migra os dados usando `D1.batch`, transacional.

As tabelas `bc2_records` e `bc2_store_meta` passam a ser a fonte ativa. `app_state` permanece como cópia anterior protegida contra edição e exclusão. **Não volte a publicar um Worker antigo depois da migração**: ele não entende as gravações novas e seus envios serão bloqueados pela proteção da cópia antiga. Uma recuperação deve partir da versão atual e de um backup conferido; preserve um export completo do D1 antes de intervenção manual.

Cada envio possui um identificador para não duplicar entradas quando a resposta se perde. Edição e exclusão verificam a versão do registro. O lote inteiro e sua auditoria são confirmados juntos. Uma troca de conjunto por restauração invalida gravações de abas com dados anteriores.

Verificações: **92 testes aprovados**, com SQLite temporário e dados fictícios. Incluem uma importação superior a 2 MB, alteração pequena com envio inferior a 10 KB, concorrência, reversão em falha, permissões, repetição de envio, restauração parcial e preservação da origem. Na prévia de navegador, editar um EPI enviou **450 bytes** e o valor permaneceu depois de reabrir a página. Nenhum registro fictício foi inserido no banco de produção.

Execute `node --test tests/*.test.*` para os testes e `node preparar-publicacao.cjs` para gerar o arquivo do editor da hospedagem.

Situação e versão de produção: confira **PUBLICACAO.md**.

## Ativação conferida em produção

O responsável entrou normalmente após a atualização. Uma consulta somente de leitura confirmou a nova estrutura ativa, geração legacy-v1 e revisão 16, e a cópia anterior preservada com os mesmos 112 bytes. As contagens consultadas de EPIs, colaboradores e movimentações estavam zeradas na origem e continuaram zeradas. A validação com dados volumosos e gravações foi feita exclusivamente no ambiente fictício.
