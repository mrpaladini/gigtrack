# GigTrack

**Repertório, setlists e cifras da banda — [gigtrack.com.br](https://gigtrack.com.br)**

O GigTrack organiza o que a banda toca: catálogo de músicas (tom, duração, links do YouTube,
Spotify e Cifra Club, arquivo de partitura), cifras com troca de tom, shows com setlist ordenado, tempo total de
show e PDF pronto para colar no palco. Cada integrante tem a própria conta; o dono da banda convida
os outros com um código.

Músicas podem ser **copiadas entre bandas** e marcadas como **públicas**, para outros usuários
copiarem pela biblioteca de músicas públicas. Administradores (grupo *admins*) têm uma **área
administrativa** para ver os usuários e redefinir senhas.

Funciona no celular, no tablet e no computador, e pode ser instalado na tela inicial como um app.

## Como é feito

| Parte | Tecnologia |
| --- | --- |
| Site | HTML, CSS e JavaScript puros — sem build, sem Node no servidor |
| Banco, login e arquivos | [Supabase](https://supabase.com) (Postgres + Auth + Storage, com RLS) |
| PDF do setlist | jsPDF 4.2.1 (hospedado em `assets/vendor/`) |
| Hospedagem | Hostinger, publicada a partir deste repositório (Git do hPanel) |

## Estrutura

```
gigtrack/
├── index.html               página do app
├── 404.html                 página de erro
├── manifest.webmanifest     instalar como app (Android, iPhone, tablets)
├── .htaccess                HTTPS, domínio sem www, segurança, cache e bloqueios
├── robots.txt · sitemap.xml
├── assets/
│   ├── css/styles.css       visual (claro/escuro automático, responsivo)
│   ├── js/config.js         URL e chave pública do Supabase
│   ├── js/app.js            o app (telas, bandas, músicas, shows, PDF)
│   ├── js/cifra-core.js     transposição de acordes
│   ├── js/cifra-ui.js       tela de cifra
│   ├── img/                 ícones e imagem de compartilhamento
│   └── vendor/              supabase-js e jsPDF (cópias locais)
├── supabase/migrations/     esquema do banco (já aplicado no Supabase)
├── tests/                   testes automáticos (não vão para o ar)
├── docs/DEPLOY.md           passo a passo de publicação na Hostinger
└── .github/workflows/       roda os testes a cada envio ao GitHub
```

As pastas `supabase/`, `docs/` e `tests/` ficam no servidor (o Git da Hostinger copia o repositório
inteiro), mas o `.htaccess` bloqueia o acesso a elas pelo navegador.

## Publicar

Veja **[docs/DEPLOY.md](docs/DEPLOY.md)**. Em resumo: conectar este repositório no Git do hPanel
(pasta `public_html`), ligar o deploy automático, ativar o SSL e ajustar as URLs de login no Supabase.
Depois disso, cada `git push` na branch `main` atualiza o site.

## Rodar no computador

Qualquer servidor de arquivos estáticos serve. Com Python:

```bash
python -m http.server 8080
```

Abra http://localhost:8080. O login usa o Supabase de verdade; para testar a criação de conta
localmente, adicione `http://localhost:8080` em *Authentication → URL Configuration → Redirect URLs*.

## Testes

```bash
pip install playwright && playwright install chromium
python3 tests/run-tests.py                        # app completo em 5 tamanhos de tela
```

O teste do app usa um Supabase simulado (`tests/mock-supabase.js`) e confere, em celular (360 e
390 px), tablet (768 e 1024 px) e desktop: o fluxo completo, ausência de rolagem lateral, botões com
tamanho de dedo, campos que não dão zoom no iPhone, link do Cifra Club, PDF, tela de cifra e o
Content-Security-Policy.
As capturas ficam em `tests/output/`.

## Atualizar arquivos CSS/JS

Os arquivos são referenciados com `?v=1.1.0` no `index.html` e ficam 30 dias em cache. Ao mudar
CSS ou JS, aumente esse número (ex.: `?v=1.1.1`) para os celulares baixarem a versão nova.

## Administração

- O usuário administrador padrão é **gigadmin** (no login, digite só `gigadmin`). A senha inicial foi
  passada à parte e precisa ser trocada no primeiro acesso.
- Contas novas ficam **aguardando liberação** até um admin clicar em **Liberar conta**.
- Quem está no grupo *admins* vê o ícone de escudo no topo (com o número de contas esperando) → lista
  de usuários, **Liberar conta**, **Bloquear**, **Redefinir senha** e **Tornar/Tirar admin**.
- As permissões ficam no banco (funções `admin_*` com verificação de `app_admins`); o app só mostra
  ou esconde os botões.
- Login por nome de usuário: um texto sem `@` vira `<usuário>@gigtrack.com.br`.

## Cifras e Cifra Club

O Cifra Club bloqueia acessos automáticos vindos de servidores (HTTP 403), por isso o GigTrack não
busca a cifra sozinho. Cada música guarda o **link do Cifra Club**, que aparece como atalho na lista,
no setlist e na tela de cifra. Para ter a cifra dentro do app (com troca de tom), abra o link, copie
a cifra e cole na aba *Editar*.

## Histórico

O GigTrack começou como **Backline** (protótipo dentro do Claude, depois site na Vercel). O nome
mudou em novembro de 2026, junto com a mudança para a Hostinger e o domínio gigtrack.com.br.
O projeto no Supabase continua com o identificador `backline` (`ttaxdkoaecxomsagnoxu`) — o nome
interno não aparece para os usuários.
