# Publicar o GigTrack na Hostinger

Tempo estimado: 20–30 minutos (mais o tempo de propagação do DNS, se o domínio estiver fora da
Hostinger).

Repositório: https://github.com/mrpaladini/gigtrack · Domínio: **gigtrack.com.br**

---

## 0. Enviar o código para o GitHub (uma vez)

1. Extraia o `gigtrack.zip` dentro de `C:\dev\gigtrack`.
2. Dê dois cliques em **`publicar-no-github.bat`** (precisa do [Git para Windows](https://git-scm.com/download/win)).
   Ele cria o repositório local, faz o commit e envia para `github.com/mrpaladini/gigtrack`.
   Na primeira vez o Git pede para entrar na conta do GitHub (janela do navegador).

Pelo terminal, o equivalente é:

```bat
cd C:\dev\gigtrack
git init -b main
git add -A
git commit -m "GigTrack 1.0.0"
git remote add origin https://github.com/mrpaladini/gigtrack.git
git push -u origin main
```

Se o repositório no GitHub já tiver algum arquivo (um README criado pelo site, por exemplo), rode
`git pull --rebase origin main --allow-unrelated-histories` antes do `git push`.

## 1. Domínio apontando para a Hostinger

**Se o domínio foi registrado na própria Hostinger:** nada a fazer, ele já usa o DNS da Hostinger.

**Se foi registrado no Registro.br:**

1. No hPanel, adicione o site com o domínio `gigtrack.com.br` (*Websites → Adicionar site*).
2. Veja os nameservers que a Hostinger indica para o domínio (normalmente
   `ns1.dns-parking.com` e `ns2.dns-parking.com` — confira no hPanel).
3. No [registro.br](https://registro.br) → *Painel* → domínio `gigtrack.com.br` → *DNS* →
   *Alterar servidores DNS* → cole os dois nameservers e salve.
4. A troca pode levar algumas horas. Enquanto isso, siga os próximos passos.

## 2. Configurações do site no hPanel

*Websites → gigtrack.com.br → Painel*

- **SSL**: *Segurança → SSL* → instale o certificado gratuito para `gigtrack.com.br` e
  `www.gigtrack.com.br`. (O `.htaccess` já força HTTPS e redireciona `www` para o domínio sem `www`.)

## 3. Ligar o GitHub à Hostinger (deploy automático)

*Websites → gigtrack.com.br → Avançado → **GIT***

1. **Repositório privado?** Na mesma tela, a Hostinger mostra uma **chave SSH**. Copie e cadastre no
   GitHub em *github.com/mrpaladini/gigtrack → Settings → Deploy keys → Add deploy key*
   (só leitura basta). Se o repositório for público, pule este item.
2. **Esvazie a `public_html`**: o Git da Hostinger só instala numa pasta vazia. Em
   *Arquivos → Gerenciador de arquivos*, apague o `default.php`/`index.php` de boas-vindas.
3. Em *Criar um novo repositório*:
   - Repositório: `git@github.com:mrpaladini/gigtrack.git` (privado) ou
     `https://github.com/mrpaladini/gigtrack.git` (público)
   - Branch: `main`
   - Diretório: **deixe em branco** (instala direto na `public_html`)
4. Clique em **Criar** e depois em **Deploy**. Os arquivos aparecem na `public_html`.
5. **Deploy automático**: ainda na tela GIT, clique em *Auto Deployment* e copie a **URL do
   webhook**. No GitHub: *Settings → Webhooks → Add webhook* → cole a URL em *Payload URL*,
   *Content type* `application/json`, evento *Just the push event* → *Add webhook*.

A partir daí, todo `git push` na `main` publica o site sozinho em poucos segundos.

## 4. Supabase: liberar o novo endereço para login

No [painel do Supabase](https://supabase.com/dashboard/project/ttaxdkoaecxomsagnoxu/auth/url-configuration)
→ *Authentication → URL Configuration*:

- **Site URL**: `https://gigtrack.com.br`
- **Redirect URLs** (adicione):
  - `https://gigtrack.com.br/**`
  - `https://www.gigtrack.com.br/**`
  - `http://localhost:8080/**` (opcional, para testar no computador)

**Cadastro sem e-mail de confirmação:** em *Authentication → Sign In / Providers → Email*, desligue
**Confirm email** e salve. Assim ninguém recebe e-mail do Supabase ao criar conta, e a pessoa já entra
para a tela "Conta aguardando liberação"; um administrador libera pelo escudo → **Liberar conta**.
(Se alguém esquecer a senha, um administrador redefine pela área administrativa.)

**Recomendado:** em *Authentication → Attack Protection* (ou *Password security*), ligue a proteção
contra senhas vazadas.

## 5. Conferir

1. Abra **https://gigtrack.com.br** — deve aparecer a tela de login do GigTrack com cadeado.
2. `http://gigtrack.com.br` e `https://www.gigtrack.com.br` devem redirecionar para
   `https://gigtrack.com.br`.
3. Crie uma conta, confirme pelo e-mail, crie uma banda, uma música e um show; gere o PDF.
4. Numa música, cole o link do Cifra Club, salve e confira o atalho "Cifra Club" na lista.
5. Bloqueios: `https://gigtrack.com.br/supabase/` e `https://gigtrack.com.br/README.md` devem dar
   *403 Forbidden*.
6. No celular: abra o site no Chrome (Android) → menu → *Instalar app*; no iPhone, Safari →
   *Compartilhar → Adicionar à Tela de Início*.

## 6. Acesso automático (para o Supabase não pausar)

O plano gratuito do Supabase **pausa o projeto depois de cerca de 7 dias sem uso** — e aí o site fica
fora do ar até alguém reativar no painel. O script `cron/keepalive.php` evita isso: de tempos em tempos
ele abre o site, chama o login do Supabase e faz uma consulta no banco, como um visitante. Os horários
são sorteados (a cada 2h30–3h30, minuto e segundo aleatórios, sem repetir horário).

Configure uma vez no hPanel → *Websites → gigtrack.com.br → Avançado → **Cron Jobs***:

1. Tipo: **PHP**.
2. Comando / caminho do arquivo: `public_html/cron/keepalive.php`
   (se o hPanel pedir o caminho completo: `/home/<seu-usuário>/domains/gigtrack.com.br/public_html/cron/keepalive.php`;
   o começo aparece no Gerenciador de arquivos).
3. Frequência: **a cada 15 minutos** (`*/15 * * * *`). O script decide sozinho quando agir; nas outras
   chamadas ele não faz nada.
4. Salve. Para conferir: na área administrativa (escudo) aparece "Acesso automático: último em …".
   O primeiro acesso acontece entre 15 minutos e 1 hora depois da primeira chamada. O registro
   detalhado fica em `cron/.keepalive.log` no Gerenciador de arquivos.

Se aparecer o aviso "parado há mais de 8 horas", confira se o Cron Job continua ativo no hPanel.
Se o projeto já estiver pausado, o script não consegue reativar: entre no painel do Supabase e clique
em *Restore project*.

## Problemas comuns

| Sintoma | Causa provável |
| --- | --- |
| "Configuração pendente" na tela | `assets/js/config.js` sem URL/chave do Supabase |
| Página em branco, erro de CSP no console | Algum script novo vindo de outro domínio: libere no `Content-Security-Policy` do `.htaccess` |
| Confirmação de e-mail abre `localhost` ou endereço antigo | Passo 4 (URLs no Supabase) |
| Deploy do Git falha na primeira vez | `public_html` não estava vazia (passo 3.2) |
| Mudança no CSS/JS não aparece no celular | Aumente o `?v=` dos arquivos no `index.html` |

## Alternativa sem Git

Baixe o repositório como ZIP (*Code → Download ZIP* no GitHub), envie pelo *Gerenciador de
arquivos* para a `public_html` e extraia. As atualizações, nesse caso, são manuais.
