# Mudanças

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
