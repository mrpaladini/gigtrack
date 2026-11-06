<?php
/**
 * GigTrack — importador de cifras do Cifra Club (versão PHP para a Hostinger).
 *
 *   GET /api/cifra.php?url=https://www.cifraclub.com.br/artista/musica/
 *
 * Resposta (JSON):
 *   { title, artist, key, requestedKey, text, sourceUrl }
 *
 * Substitui a antiga função da Vercel (api/cifra.js). Só aceita links do Cifra Club, usa cache
 * de 6 horas e limita o número de pedidos por visitante para não sobrecarregar ninguém.
 */
declare(strict_types=1);

const CACHE_TTL      = 6 * 3600;     // segundos
const RATE_LIMIT     = 30;           // pedidos…
const RATE_WINDOW    = 600;          // …a cada 10 minutos, por IP
const MAX_HTML_BYTES = 3_000_000;
const ALLOWED_ORIGINS = ['https://gigtrack.com.br', 'https://www.gigtrack.com.br'];

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, ALLOWED_ORIGINS, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    respond(204, []);
}
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    respond(405, ['error' => 'Use GET.']);
}

/* ---------- pasta de trabalho (cache + limite) fora do alcance do navegador ---------- */
function workDir(): string
{
    $dir = rtrim(sys_get_temp_dir(), '/') . '/gigtrack-cifra';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    return $dir;
}

function rateLimited(): bool
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file = workDir() . '/rl-' . hash('sha256', $ip);
    $now = time();
    $hits = [];
    if (is_file($file)) {
        $hits = array_filter(
            array_map('intval', explode(',', (string) @file_get_contents($file))),
            fn ($t) => $t > $now - RATE_WINDOW
        );
    }
    if (count($hits) >= RATE_LIMIT) {
        return true;
    }
    $hits[] = $now;
    @file_put_contents($file, implode(',', $hits), LOCK_EX);
    return false;
}

/* ---------- validação do link ---------- */
$raw = trim((string) ($_GET['url'] ?? ''));
if ($raw === '') {
    respond(400, ['error' => 'Informe o link da cifra (parâmetro url).']);
}
if (!preg_match('~^https?://~i', $raw)) {
    $raw = 'https://' . ltrim($raw, '/');
}
$parts = parse_url($raw);
$host = strtolower($parts['host'] ?? '');
if (!$parts || !preg_match('/(^|\.)cifraclub\.com(\.br)?$/', $host)) {
    respond(400, ['error' => 'Só links do Cifra Club são aceitos (cifraclub.com.br).']);
}
$path = $parts['path'] ?? '/';
if (!preg_match('~^/[a-z0-9\-_/\.]+$~i', $path) || substr_count(trim($path, '/'), '/') < 1) {
    respond(400, ['error' => 'Esse link não parece ser de uma música do Cifra Club. Use o formato cifraclub.com.br/artista/musica/.']);
}

/** Tom pedido no próprio link (?key=G ou #key=G). Só aceitamos nomes de nota. */
function requestedKeyFrom(array $parts): ?string
{
    foreach (['query', 'fragment'] as $p) {
        if (empty($parts[$p])) continue;
        parse_str(str_replace('&amp;', '&', $parts[$p]), $q);
        $k = isset($q['key']) ? trim((string) $q['key']) : '';
        if ($k !== '' && preg_match('/^[A-G](#|b)?m?$/', $k)) {
            return $k;
        }
    }
    return null;
}
$requestedKey = requestedKeyFrom($parts);
$canonical = 'https://www.cifraclub.com.br' . rtrim($path, '/') . '/';

/* ---------- cache ---------- */
$cacheFile = workDir() . '/c-' . hash('sha256', $canonical) . '.json';
if (is_file($cacheFile) && filemtime($cacheFile) > time() - CACHE_TTL) {
    $cached = json_decode((string) file_get_contents($cacheFile), true);
    if (is_array($cached)) {
        $cached['requestedKey'] = $requestedKey;
        respond(200, $cached);
    }
}

if (rateLimited()) {
    respond(429, ['error' => 'Muitas buscas seguidas. Espere alguns minutos e tente de novo.']);
}

/* ---------- download ---------- */
function fetchHtml(string $url): array
{
    if (!function_exists('curl_init')) {
        return [0, null, 'A extensão cURL do PHP não está ativa na hospedagem.'];
    }
    $ch = curl_init($url);
    $buffer = '';
    curl_setopt_array($ch, [
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS      => 3,
        CURLOPT_PROTOCOLS      => CURLPROTO_HTTPS,
        CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT        => 12,
        CURLOPT_ENCODING       => '',
        CURLOPT_HTTPHEADER     => [
            'Accept: text/html,application/xhtml+xml',
            'Accept-Language: pt-BR,pt;q=0.9',
        ],
        CURLOPT_USERAGENT      => 'Mozilla/5.0 (compatible; GigTrack/1.0; +https://gigtrack.com.br)',
        CURLOPT_WRITEFUNCTION  => function ($ch, $chunk) use (&$buffer) {
            $buffer .= $chunk;
            return strlen($buffer) > MAX_HTML_BYTES ? 0 : strlen($chunk);
        },
    ]);
    curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $finalHost = strtolower((string) parse_url((string) curl_getinfo($ch, CURLINFO_EFFECTIVE_URL), PHP_URL_HOST));
    $err = curl_errno($ch) ? curl_error($ch) : null;
    curl_close($ch);
    if (!preg_match('/(^|\.)cifraclub\.com(\.br)?$/', $finalHost)) {
        return [0, null, 'O link redirecionou para fora do Cifra Club.'];
    }
    return [$status, $buffer, $err];
}

[$status, $html, $err] = fetchHtml($canonical);
if ($status === 404) {
    respond(404, ['error' => 'Música não encontrada no Cifra Club. Confira o link.']);
}
if ($status !== 200 || !$html) {
    respond(502, ['error' => 'Não consegui acessar o Cifra Club agora (' . ($err ?: 'HTTP ' . $status) . '). Tente de novo em instantes ou cole a cifra na aba Editar.']);
}

/* ---------- extração ---------- */
function cleanText(string $s): string
{
    return trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags($s), ENT_QUOTES | ENT_HTML5, 'UTF-8')));
}

libxml_use_internal_errors(true);
$dom = new DOMDocument();
$dom->loadHTML('<?xml encoding="utf-8" ?>' . $html, LIBXML_NONET | LIBXML_NOWARNING | LIBXML_NOERROR);
$xp = new DOMXPath($dom);

function firstText(DOMXPath $xp, array $queries): string
{
    foreach ($queries as $q) {
        $n = $xp->query($q);
        if ($n && $n->length) {
            $t = cleanText($n->item(0)->textContent);
            if ($t !== '') return $t;
        }
    }
    return '';
}
function hasClass(string $c): string
{
    return "contains(concat(' ', normalize-space(@class), ' '), ' $c ')";
}

$preNode = null;
foreach (["//div[" . hasClass('cifra_cnt') . "]//pre", "//div[" . hasClass('cifra-mono') . "]//pre", '//pre'] as $q) {
    $n = $xp->query($q);
    if ($n && $n->length) { $preNode = $n->item(0); break; }
}
if (!$preNode) {
    respond(422, ['error' => 'Não encontrei a cifra nessa página. Ela pode ser só tablatura, letra ou vídeo-aula. Copie a cifra e cole na aba Editar.']);
}

// textContent já remove <b>, <span class="tablatura"> etc. e mantém os espaços de alinhamento.
$text = $preNode->textContent;
$text = str_replace(["\r\n", "\r", "\u{00A0}"], ["\n", "\n", ' '], $text);
$text = preg_replace('/[ \t]+$/m', '', $text);
$text = trim($text, "\n");

$title  = firstText($xp, ["//h1[" . hasClass('t1') . "]", '//h1']);
$artist = firstText($xp, ["//h2[" . hasClass('t3') . "]//a", "//h2[" . hasClass('t3') . "]"]);
$key    = firstText($xp, ["//*[@id='cifra_tom']//a", "//*[@id='cifra_tom']"]);
$key    = preg_replace('/^tom:\s*/i', '', $key);
if (!preg_match('/^[A-G](#|b)?m?$/', $key) && preg_match('/"key"\s*:\s*"([A-G](?:#|b)?m?)"/', $html, $m)) {
    $key = $m[1];
}
if (!preg_match('/^[A-G](#|b)?m?$/', $key)) {
    $key = '';
}

if ($title === '' || $artist === '') {
    // Último recurso: <title>Nome - Artista - Cifra Club</title>
    $docTitle = firstText($xp, ['//title']);
    $bits = array_map('trim', explode(' - ', $docTitle));
    if ($title === '' && !empty($bits[0])) $title = preg_replace('/\s*\(.*$/', '', $bits[0]);
    if ($artist === '' && !empty($bits[1]) && stripos($bits[1], 'cifra club') === false) $artist = $bits[1];
}

$result = [
    'title'     => $title,
    'artist'    => $artist,
    'key'       => $key,
    'text'      => $text,
    'sourceUrl' => $canonical,
];
@file_put_contents($cacheFile, json_encode($result, JSON_UNESCAPED_UNICODE), LOCK_EX);

$result['requestedKey'] = $requestedKey;
respond(200, $result);
