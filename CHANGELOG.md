# Mudanças

## 1.4.0 — 26/11/2026 · Troca de tom, novos usuários e acesso automático

- **Troca de tom corrigida.** A tela de cifra usava o tom cadastrado da música (tom da banda) como se
  fosse o tom do texto colado; agora o tom vem da própria cifra (linha "Tom:" do Cifra Club ou análise
  dos acordes, não só do primeiro). Novo botão **Tom da banda**; seletor só com tons do mesmo modo;
  C# ↔ Db troca a grafia; linhas com N.C. e rótulos ("Intro G D") também mudam de tom; na aba Editar
  dá para dizer em que tom a cifra está escrita; salvar não troca mais o tom da banda sem querer.
- **Novo usuário pela área administrativa** (e-mail ou nome de usuário, senha temporária, opção de
  admin). A conta nasce liberada e pede senha nova no primeiro acesso.
- **Acesso automático** pelo agendador da Hostinger (`cron/keepalive.php`) para o Supabase não pausar
  o projeto; monitor na área administrativa.
- Formulários não perdem mais o que foi digitado quando aparece um erro ou o "Salvando…".
- Banco: migrations `20261126010000_admin_criar_usuario.sql` e `20261126020000_keepalive.sql`.
- Testes: `tests/test-cifra-core.js` e `tests/test-keepalive.sh`.

## 1.3.1 — 06/11/2026 · Correção

- Ao abrir o site, a tela "Configuração pendente" aparecia por um instante antes do app carregar:
  o primeiro desenho acontecia antes de ler a configuração. Corrigido, com teste automático.

## 1.3.0 — 06/11/2026 · Liberação de contas pelo admin

- Contas novas ficam **aguardando liberação**: a pessoa vê uma tela de espera e não consegue criar
  banda, entrar com convite nem ver músicas públicas até um admin liberar (regra garantida no banco).
- Na área administrativa: selo "Aguardando liberação", botão **Liberar conta** (também confirma o
  e-mail, então funciona com ou sem o "Confirm email" do Supabase) e **Bloquear** para contas liberadas.
- O ícone de escudo mostra quantas contas estão esperando.
- Ninguém altera o próprio status de aprovação pela API (permissões por coluna em `profiles`).
- Contas que já existiam e estavam confirmadas ficaram liberadas automaticamente.
- Banco: migration `20261106220000_aprovacao_contas.sql`.

## 1.2.0 — 06/11/2026 · Administração, músicas públicas e cópias

- **Área administrativa** (menu com escudo no topo, só para o grupo *admins*): lista de usuários com
  data de criação, último acesso e número de bandas; **redefinir senha** (gera uma senha temporária
  para copiar e enviar; a pessoa é obrigada a criar uma nova no próximo login e as sessões abertas
  dela são encerradas); **tornar/tirar administrador** (ninguém tira a si mesmo).
- Usuário administrador padrão **gigadmin** (entra só com o nome de usuário, sem e-mail), com troca
  de senha obrigatória no primeiro acesso.
- Login aceita **e-mail ou usuário**.
- **Minha conta** (ícone de chave): trocar a própria senha.
- **Músicas públicas**: opção no formulário da música; biblioteca "Músicas públicas" para buscar e
  copiar músicas de outros usuários (sem comentário e sem anexo).
- **Copiar música para outra banda**: botão em cada música; leva tom, duração, links, cifra,
  comentário e anexo. Cada banda fica com a sua cópia.
- Cadastro sem e-mail de confirmação (com a opção desligada no Supabase).
- Banco: migration `20261106200000_admin_publicas_copias.sql`.

## 1.1.0 — 06/11/2026 · Link do Cifra Club

- O Cifra Club recusa acessos vindos do servidor (HTTP 403), então a busca automática da cifra saiu.
- No lugar, cada música guarda o **link do Cifra Club** (aceita colar sem `https://`; links de outros
  sites são recusados). O link aparece como atalho "Cifra Club" na lista de músicas, no setlist e
  como botão "Abrir no Cifra Club" na tela de cifra.
- A cifra dentro do app continua: copiar no Cifra Club e colar na aba *Editar* (com troca de tom).
- Removido `api/cifra.php` e seus testes; o site não precisa mais de PHP.
- Arquivos CSS/JS com `?v=1.1.0` para os navegadores baixarem a versão nova.

## 1.0.0 — 06/11/2026 · GigTrack

- Novo nome: **Backline → GigTrack**, no domínio **gigtrack.com.br**.
- Hospedagem muda da Vercel para a **Hostinger**:
  - importador de cifras reescrito em PHP (`api/cifra.php`), com cache de 6 h e limite de uso;
  - `.htaccess` com HTTPS obrigatório, domínio sem `www`, cabeçalhos de segurança (CSP), cache e
    bloqueio das pastas internas.
- Celular e tablet:
  - botões com tamanho de dedo, campos de 16 px (sem zoom no iPhone), áreas seguras do iPhone;
  - listas de músicas e setlist reorganizadas em telas estreitas, sem rolagem lateral;
  - editor do show lado a lado a partir de 820 px (tablet deitado), empilhado abaixo disso;
  - tela de cifra em tela cheia no celular, com letra menor por padrão;
  - pode ser instalado como app (manifesto + ícones).
- supabase-js 2.119.0 e jsPDF 4.2.1 hospedados no próprio site (sem CDN).
- Link de confirmação de e-mail volta para o endereço do site.
- PDF do setlist baixado direto pelo navegador.
- Correção: ícone de calendário enorme no cabeçalho do show.
- Correção: títulos longos empurravam os botões do setlist para fora da tela.
- Repositório organizado para o GitHub, com testes automáticos (GitHub Actions).
