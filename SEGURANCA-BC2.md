# Segurança do sistema BC2

## O que foi reforçado no projeto

- A página agora usa uma política do navegador que bloqueia código JavaScript embutido em botões e formulários. As ações continuam ligadas aos mesmos controles por funções separadas.
- O servidor valida a assinatura e as informações obrigatórias do token do Firebase, exige e-mail confirmado, rejeita tokens antigos com mais de 12 horas e confere a autorização ativa e o nível da pessoa no banco antes de entregar dados.
- O servidor encerra a sessão após 30 minutos sem atividade. Ao suspender ou remover uma conta, a próxima conferência do servidor encerra o acesso.
- As gravações só aceitam solicitações da própria origem do site. O servidor rejeita métodos que não usa, exige JSON válido e limita o corpo de cada envio a 1,5 MB sem carregar um arquivo ilimitado de uma vez.
- Há um limite aproximado de 240 chamadas por minuto para cada conta conectada. Esse limite ajuda contra abuso, mas a própria Cloudflare informa que ele não é um bloqueio exato e pode variar entre regiões.
- As respostas incluem proteções contra leitura de conteúdo de outro site, enquadramento da página e uso indevido de recursos do navegador. A política de câmera continua permitindo o leitor de código.
- A impressão de etiquetas e relatórios não usa mais comandos de evento embutidos.
- A migração `0002_personal_settings.sql` só acrescenta o identificador Firebase por pessoa e tabelas para preferências e confirmações temporárias de e-mail. Não remove nem regrava os registros existentes, nem altera `localStorage` ou `IndexedDB`.
- Alterações de nome, tema e e-mail ficam vinculadas à identidade Firebase de cada conta. Trocar o e-mail não troca o identificador nem o nível de acesso; a conclusão só ocorre depois de confirmar o novo endereço.
- A nova migração precisa ser aplicada ao D1 remoto depois de exportar um backup e antes de publicar a versão nova. Siga os passos da seção **Banco e publicação no Cloudflare** no `README.md`.

## Ações recomendadas na sua conta

Estas etapas são importantes porque o código do site não consegue ativar sozinho as proteções da sua conta Cloudflare, Google ou Firebase.

### 1. Proteja as contas que podem administrar o sistema

- Na conta Cloudflare, ative a verificação em duas etapas e guarde os códigos de recuperação fora do computador.
- Faça o mesmo na conta Google usada para administrar o Firebase e o Search Console.
- Não compartilhe senha, códigos de recuperação, códigos temporários do Wrangler ou capturas de tela que mostrem esses códigos.

### 2. Exija senhas fortes no Firebase

No Firebase, abra **Authentication → Settings → Password policy** e escolha:

- mínimo de 12 caracteres;
- letra minúscula, letra maiúscula, número e símbolo;
- modo **Require / Exigir**.

Na mesma área de configurações, em **User actions / Ações do usuário**, deixe ativa a proteção contra descoberta de e-mails cadastrados. O formulário de criação de senha do BC2 também exige esses critérios; a regra oficial precisa ser salva no Firebase para valer no serviço de autenticação.

### 3. Confira a chave pública do Firebase

A chave `apiKey` do Firebase que aparece no aplicativo web é identificador público do projeto, não uma senha administrativa. No Google Cloud, em **APIs e serviços → Credenciais**, confira se a chave do aplicativo está limitada às APIs do Firebase usadas pelo BC2. Não apague a chave nem restrinja APIs sem conferir a lista exigida pelo Firebase; isso pode impedir o login.

### 4. Revise as pessoas e os níveis

- Cada pessoa deve ter sua própria conta; não use um login compartilhado.
- Conceda somente as abas e ações necessárias para cada função.
- Remova o acesso imediatamente quando alguém não precisar mais usar o sistema.
- Revise periodicamente os pedidos pendentes e o log do site.

## Limites que ainda existem

- Nenhum sistema pode ser garantido como impossível de invadir. As proteções reduzem riscos; senha reutilizada, conta Google/Cloudflare comprometida, computador infectado ou falhas futuras ainda podem causar problemas.
- O BC2 usa login por e-mail e senha. A conta administrativa do site precisa de uma senha forte; o login de vários usuários não tem um segundo fator do próprio aplicativo nesta configuração gratuita.
- A sessão do aplicativo é guardada temporariamente no armazenamento da aba do navegador para manter o login. A política de segurança reduz caminhos de ataque, mas não protege de um computador já comprometido.
- Dados antigos que já estavam no navegador foram preservados. Não compartilhe um computador ou perfil de navegador com outras pessoas e use **Sair** ao terminar. A limpeza ou migração dessas cópias deve ser feita só depois de um backup confirmado.
- A página de entrada tem um endereço público para que os usuários autorizados possam acessá-la. O endereço pode aparecer em buscadores; isso não libera os dados, que continuam atrás do login e da permissão no servidor.
- O plano gratuito da Cloudflare tem uma cota diária de solicitações do Worker e limites diários próprios do D1. Um pico de tráfego pode interromper o acesso até a cota ser renovada; isso não significa que os dados foram apagados. O limite por conta conectada não bloqueia todo tipo de ataque de tráfego.

## Dados e backups

O banco central e os arquivos locais existentes foram mantidos. Antes de qualquer futura limpeza, restauração ou migração, exporte um backup, guarde uma cópia em local controlado pela empresa e confirme que consegue abrir o arquivo. Não envie o backup por e-mail ou grupo aberto: ele pode conter nomes, matrículas e histórico de entrega de EPIs.
