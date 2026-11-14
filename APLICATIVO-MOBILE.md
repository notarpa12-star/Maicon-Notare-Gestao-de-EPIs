> Atualização de 09/11/2026: o botão de instalação agora fica em **Configurações pessoais → Aplicativo BC2**. No celular, abra **Minha conta** depois de entrar. Ele foi retirado da tela de entrada.

> Atualização publicada em 08/11/2026: versão **21aee0c6**, **pastas-foto-20261108**. Inclui botão **Fazer download do aplicativo**, leitura de código por foto e pastas do estoque. Leia **PASTAS-E-FOTOS.md** para o passo a passo atual. O relato abaixo preserva o histórico do visual móvel publicado anteriormente.

# BC2 no celular — layout com quadrados e uso com internet

Atualização de 07/11/2026, baseada na organização da imagem de referência. A marca e os nomes continuam sendo do BC2.

## Como funciona

1. Abra https://estoque.bc2-epi.workers.dev/ no celular, com internet.
2. Quem não tiver uma sessão válida verá primeiro a tela de **Entrar**, com e-mail e senha. **Esqueci minha senha** e **Pedir autorização** continuam disponíveis. Contas novas continuam exigindo confirmação de e-mail e aprovação.
3. Após a entrada, aparece a tela inicial com três colunas de quadrados. Cada quadrado abre uma função existente do BC2: visão geral, estoque, leitor de código, colaboradores, entregas e movimentações, inspeções, relatórios e backup, contatos e suporte, usuários e níveis, log do site e minha conta.
4. A pessoa só vê as funções permitidas para seu nível. Configurações da própria conta continuam disponíveis; funções administrativas continuam protegidas no servidor.
5. O menu no canto superior reúne os atalhos e **Sair da conta**. O botão **Início** e a marca **BC2** retornam aos quadrados. As páginas que já tinham **Voltar** conservam essa navegação.

A sessão pode continuar válida ao reabrir o aplicativo; nesse caso não é necessário digitar a senha novamente até o sistema pedir. Os limites de sessão e de inatividade existentes continuam valendo.

## Mesmo sistema, dois visuais

Em telas de até 760 pixels, o BC2 usa o layout móvel. No computador, mantém a interface anterior. O banco, as contas, o estoque, os registros e os níveis são os mesmos. Não foi criado outro banco nem feita nova migração dos registros.

As tabelas comuns passam a ser cartões com os nomes dos campos no celular. A matriz de permissões conserva todas as colunas e permite rolar lateralmente. Os formulários usam uma coluna e campos maiores para toque. Câmera, leitura de etiqueta e as demais funções continuam usando a implementação existente.

## Somente com internet

Ao abrir, o aplicativo verifica a conexão real com o servidor, usando uma consulta sem dados pessoais e sem cache. Sem internet ou sem resposta válida do servidor, mostra somente **Conecte-se para usar o BC2**, sem permitir navegar nas telas ou iniciar gravações.

Uma queda detectada durante o uso oculta as telas e interrompe a câmera. O aplicativo verifica a conexão ao voltar para ele, ao sinal de retorno da rede e periodicamente enquanto estiver visível. O botão **Tentar novamente** permite repetir a verificação. Nenhuma fila nova de gravação offline foi adicionada.

Se uma gravação estava em andamento quando a rede caiu, confira o saldo e o histórico depois de reconectar antes de repetir: uma resposta perdida não prova que o servidor deixou de receber a operação. As proteções de confirmação e repetição da versão por registro continuam ativas.

Ao abrir o aplicativo instalado sem rede, a navegação mostra apenas um aviso com **Tentar novamente**, sem abrir a interface pelo cache. Arquivos públicos podem continuar armazenados no aparelho para instalação e carregamento; isso não libera o uso offline. Dados da API continuam fora do cache. O requisito de conexão também vale para o computador.

## Instalar no celular

- **Android:** abra no Chrome e procure no menu **Instalar aplicativo** ou **Adicionar à tela inicial**, conforme a versão.
- **iPhone:** abra no Safari, use **Compartilhar → Adicionar à Tela de Início** e, se aparecer a opção, mantenha **Abrir como App** ativada.

Esta é uma instalação pelo navegador, com ícone na tela inicial. Não exige arquivo APK nem publicação em loja. Continua precisando de internet. Não foi contratado plano pago.

## Atualização e verificações

Feche todas as abas e o aplicativo instalado do BC2 e abra novamente para carregar o visual novo. Não limpe os dados do navegador. Use normalmente as mesmas contas e senhas.

Foram aprovados **102 testes automatizados**. A prévia do navegador foi conferida com dados fictícios em 390 e 360 pixels, sem rolagem horizontal na tela inicial. Foram conferidos os atalhos de todas as áreas, a página pessoal e seu retorno, as páginas de níveis, o histórico de navegação, cadastro/retorno ao login e o visual de computador.

Também foi interrompido o servidor da prévia: o aplicativo exibiu somente o aviso de conexão. Ao restabelecer o servidor, a interface voltou a ficar disponível. Não foram alterados dados reais para testar. A câmera física, a instalação e o teclado devem ser conferidos no seu aparelho, pois a prévia usa um navegador de teste.

Backup dos arquivos anteriores: **BC2-backup-antes-layout-mobile-2026-11-07.zip**. Ele não substitui a exportação dos dados em **Relatórios e backup**. Os arquivos novos de interface são `site/mobile-ui.js`, `site/mobile.css` e `site/connection.js`. A versão de produção será registrada em **PUBLICACAO.md**.

Publicação confirmada: versão **1b8e595b**, identificação **mobile-online-20261107**, no endereço habitual.
