# GigTrack

**Repertório, setlists e cifras da banda — [gigtrack.com.br](https://gigtrack.com.br)**

O GigTrack organiza o que a banda toca: catálogo de músicas (tom, duração, links do YouTube e
Spotify, arquivo de partitura), cifras com troca de tom, shows com setlist ordenado, tempo total de
show e PDF pronto para colar no palco. Cada integrante tem a própria conta; o dono da banda convida
os outros com um código.

Funciona no celular, no tablet e no computador, e pode ser instalado na tela inicial como um app.

## Como é feito

| Parte | Tecnologia |
| --- | --- |
| Site | HTML, CSS e JavaScript puros — sem build, sem Node no servidor |
| Banco, login e arquivos | [Supabase](https://supabase.com) (Postgres + Auth + Storage, com RLS) |
| Importar cifra do Cifra Club | `api/cifra.php` (PHP 8.1+, roda na própria Hostinger) |
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
├── api/
│   └── cifra.php            busca a cifra no Cifra Club (com cache e limite de uso)
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

Com PHP instalado (a importação de cifra precisa dele):

```bash
php -S localhost:8080
```

Abra http://localhost:8080. O login usa o Supabase de verdade; para testar a criação de conta
localmente, adicione `http://localhost:8080` em *Authentication → URL Configuration → Redirect URLs*.

## Testes

```bash
bash tests/test-cifra-php.sh                      # importador de cifras (sem internet)
pip install playwright && playwright install chromium
python3 tests/run-tests.py                        # app completo em 5 tamanhos de tela
```

O teste do app usa um Supabase simulado (`tests/mock-supabase.js`) e confere, em celular (360 e
390 px), tablet (768 e 1024 px) e desktop: o fluxo completo, ausência de rolagem lateral, botões com
tamanho de dedo, campos que não dão zoom no iPhone, PDF, tela de cifra e o Content-Security-Policy.
As capturas ficam em `tests/output/`.

## Atualizar arquivos CSS/JS

Os arquivos são referenciados com `?v=1.0.0` no `index.html` e ficam 30 dias em cache. Ao mudar
CSS ou JS, aumente esse número (ex.: `?v=1.0.1`) para os celulares baixarem a versão nova.

## Histórico

O GigTrack começou como **Backline** (protótipo dentro do Claude, depois site na Vercel). O nome
mudou em novembro de 2026, junto com a mudança para a Hostinger e o domínio gigtrack.com.br.
O projeto no Supabase continua com o identificador `backline` (`ttaxdkoaecxomsagnoxu`) — o nome
interno não aparece para os usuários.
