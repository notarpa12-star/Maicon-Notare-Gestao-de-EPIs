# Cadastro com senha e confirmação de e-mail

Atualização de 06/11/2026 para **https://estoque.bc2-epi.workers.dev/**.

## O que mudou

O botão **Pedir autorização** agora solicita nome completo, e-mail, senha e confirmação da senha. A senha deve ter pelo menos 12 caracteres, incluindo letra maiúscula, minúscula, número e símbolo.

O BC2 cria a conta de autenticação no Firebase e solicita uma **verificação comum do e-mail**. A pessoa abre o e-mail, confirma o endereço e depois volta ao BC2 para entrar com sua senha. Só nesse acesso confirmado o pedido é encaminhado ao Administrador. O acesso aos dados continua dependendo da aprovação e do nível escolhido pelo Administrador.

Antes, o cadastro enviava um link de acesso e a pessoa criava a senha depois de usá-lo. Essa modalidade tinha uma cota gratuita de 5 envios de e-mail por dia. A verificação comum utilizada agora tem cota gratuita publicada de 1.000 e-mails por dia. As cotas e as proteções contra abuso do Firebase continuam valendo e podem mudar. Não houve alteração de plano ou início de cobrança. [Limites oficiais](https://firebase.google.com/docs/auth/limits#email_sending_limits)

## Passo a passo para quem está chegando

1. Abra o BC2 e toque em **Pedir autorização**.
2. Preencha nome, e-mail e a senha duas vezes.
3. Toque em **Criar conta e confirmar e-mail**.
4. Abra o e-mail recebido e confirme o endereço. Confira também a pasta de spam.
5. Volte ao mesmo endereço do BC2 e use **Entrar**, com e-mail e senha.
6. Aguarde a aprovação do Administrador. A confirmação do e-mail comprova o endereço; a aprovação define o acesso ao sistema.

As contas já existentes continuam com as mesmas senhas, permissões e dados. Para elas, use **Entrar**. Não é necessário cadastrar de novo. Links de acesso enviados antes da atualização continuam sendo reconhecidos pelo fluxo anterior, enquanto forem válidos.

## Se o e-mail não chegar

- Confira o endereço e a pasta de spam.
- Se a conta foi criada e o envio falhou, use **Entrar** com a senha escolhida. Enquanto o e-mail não estiver confirmado, o BC2 solicita a verificação novamente e mantém o acesso bloqueado.
- O aplicativo reaproveita o envio recente por um minuto na mesma página, para evitar reenvios e cliques repetidos. Isso é uma proteção de conveniência; as cotas do serviço continuam sendo aplicadas pelo Firebase.
- Se aparecer “este e-mail já tem cadastro”, use **Entrar** ou **Esqueci minha senha**. O novo cadastro não substitui a senha de uma conta existente.
- Uma cota diária esgotada ainda exige aguardar sua renovação; a mensagem agora se refere à cota do serviço de e-mail, sem atribuir todo erro ao limite antigo de 5 links.

## O que foi preservado

Login e recuperação de senha existentes, exigência de e-mail verificado no servidor, aprovação pelo Administrador, níveis de acesso, dados dos colaboradores, EPIs, estoque, movimentações, histórico e banco central. Nenhuma conta foi aprovada automaticamente pela atualização. Não foram alteradas senhas ou configurações da conta Firebase.

A senha e a confirmação são usadas apenas no formulário e no pedido ao serviço de autenticação. O novo cadastro não grava senha ou token de uma conta não confirmada no armazenamento do navegador nem os envia ao banco de estoque. Depois de concluir o cadastro, os campos de senha são limpos. O login existente continua usando a sessão protegida já implementada no BC2.

## Verificação

**46 testes automatizados aprovados**, incluindo 14 casos do novo cadastro e os 32 testes anteriores de segurança, permissões, estoque e publicação. Foram testados criação com verificação comum, senha inválida, confirmação diferente, conta existente, envio com erro, reenvio, cliques simultâneos, login não verificado e compatibilidade com contas existentes.

As respostas de cadastro e envio foram simuladas com dados fictícios. Não criamos contas de teste nem enviamos e-mails reais no projeto de produção, preservando a cota disponível. O recebimento efetivo do e-mail precisa ser conferido pela pessoa durante seu cadastro.

Para executar os testes na pasta do projeto:

`node --test tests/*.test.*`

## Arquivos

- **site/auth-registration.js**: valida o cadastro e usa `accounts:signUp` e `VERIFY_EMAIL`.
- **site/app.js / site/index.html**: formulário e recuperação após falha no envio.
- **site/service-worker.js**: versão de cache atualizada.
- **preparar-publicacao.cjs**: regenera o pacote **PUBLICAR-WORKER.mjs** para o editor da hospedagem.
- **tests/cadastro-senha.test.cjs**: testes específicos, sem conexão com o Firebase real.

A cópia anterior está em **BC2-backup-antes-cadastro-com-senha-2026-11-06.zip**. Ela contém os arquivos do aplicativo, não uma exportação dos dados reais do banco. Continue fazendo os backups de dados em **Relatórios e backup**.

Para ver a atualização, feche e abra novamente as abas e a janela instalada do BC2, mantendo o mesmo endereço. Não limpe o armazenamento do navegador para atualizar.

Referências técnicas: [criação de conta com nome e senha](https://docs.cloud.google.com/identity-platform/docs/reference/rest/v1/accounts/signUp) e [verificação de e-mail](https://firebase.google.com/docs/reference/rest/auth#section-send-email-verification).
