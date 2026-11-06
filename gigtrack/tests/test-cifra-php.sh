#!/usr/bin/env bash
# Testa o api/cifra.php sem acessar a internet: troca o download por um HTML de exemplo.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
sed "s#\[\$status, \$html, \$err\] = fetchHtml(\$canonical);#[\$status, \$html, \$err] = [200, file_get_contents('$ROOT/tests/fixtures/cifraclub-sample.html'), null];#" \
  "$ROOT/api/cifra.php" > "$TMP/cifra.php"
grep -q "cifraclub-sample.html" "$TMP/cifra.php" || { echo "FALHOU: não troquei o download"; exit 1; }
run() { # $1 = url, imprime "status|json"
  php -d display_errors=stderr -r '
    $_SERVER["REQUEST_METHOD"]="GET"; $_SERVER["REMOTE_ADDR"]="10.0.0.".rand(1,250); $_GET["url"]=$argv[1];
    register_shutdown_function(function(){ fwrite(STDERR, "STATUS ".http_response_code()."\n"); });
    include $argv[2];' "$1" "$TMP/cifra.php"
}
pass=0; fail=0
check() { if eval "$2"; then echo "ok   - $1"; pass=$((pass+1)); else echo "FAIL - $1"; fail=$((fail+1)); fi; }

OUT=$(run "https://www.cifraclub.com.br/banda-teste/musica-exemplo/?key=A" 2>"$TMP/err")
ST=$(grep STATUS "$TMP/err" | awk '{print $2}')
check "link válido devolve 200"           '[ "$ST" = "200" ]'
check "título"                            'echo "$OUT" | grep -q "\"title\":\"Música Exemplo\""'
check "artista"                           'echo "$OUT" | grep -q "\"artist\":\"Banda Teste\""'
check "tom original G"                    'echo "$OUT" | grep -q "\"key\":\"G\""'
check "tom pedido ?key=A"                 'echo "$OUT" | grep -q "\"requestedKey\":\"A\""'
check "acordes sem tags <b>"              '! echo "$OUT" | grep -q "<b>"'
check "entidades decodificadas (&)"       'echo "$OUT" | grep -q "letra & mais"'
check "tablatura preservada"              'echo "$OUT" | grep -q "E|-----3-----2---|"'
check "alinhamento preservado"            'echo "$OUT" | grep -q "G               D"'
check "link canônico"                     'echo "$OUT" | grep -q "\"sourceUrl\":\"https://www.cifraclub.com.br/banda-teste/musica-exemplo/\""'

OUT=$(run "https://evil.example.com/a/b/" 2>"$TMP/err"); ST=$(grep STATUS "$TMP/err" | awk '{print $2}')
check "outro site é recusado (400)"       '[ "$ST" = "400" ]'
OUT=$(run "https://cifraclub.com.br.evil.com/a/b/" 2>"$TMP/err"); ST=$(grep STATUS "$TMP/err" | awk '{print $2}')
check "domínio disfarçado é recusado"     '[ "$ST" = "400" ]'
OUT=$(run "" 2>"$TMP/err"); ST=$(grep STATUS "$TMP/err" | awk '{print $2}')
check "sem url devolve 400"               '[ "$ST" = "400" ]'
OUT=$(run "https://www.cifraclub.com.br/" 2>"$TMP/err"); ST=$(grep STATUS "$TMP/err" | awk '{print $2}')
check "página inicial não é música (400)" '[ "$ST" = "400" ]'
OUT=$(run "cifraclub.com.br/banda-teste/musica-exemplo" 2>"$TMP/err"); ST=$(grep STATUS "$TMP/err" | awk '{print $2}')
check "link sem https é aceito"           '[ "$ST" = "200" ]'

echo "$pass passaram, $fail falharam"; [ "$fail" = 0 ]
