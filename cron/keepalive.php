<?php
/**
 * GigTrack — acesso automático para o Supabase não pausar o projeto por falta de uso.
 *
 * Roda pelo agendador de tarefas (Cron Jobs) da Hostinger, a cada 15 minutos:
 *     php /home/<usuario>/domains/gigtrack.com.br/public_html/cron/keepalive.php
 *
 * A cada chamada o script só confere a hora. Quando chega o horário sorteado, ele
 *   1. abre a página do site (como um visitante),
 *   2. chama o login do Supabase (endpoint de saúde),
 *   3. chama keepalive_ping() no banco (registra o acesso e faz uma leitura nas músicas),
 * e sorteia o próximo horário entre 2h30 e 3h30 depois — nunca no mesmo horário.
 *
 * O horário sorteado tem minuto e segundo exatos: quando ele cai na janela de 15 minutos da chamada,
 * o script espera até o segundo certo. Horários do dia já usados nas últimas semanas não se repetem.
 *
 * Não roda pelo navegador (o .htaccess bloqueia a pasta cron/ e o script exige linha de comando).
 *
 * Opções (para teste):  --force       executa agora, sem esperar o horário sorteado
 *                       --dry-run     não acessa nada; só mostra o que faria
 *                       --now=<unix>  finge que agora é esse instante
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit;
}
date_default_timezone_set('America/Sao_Paulo');

const MIN_GAP_MIN = 150;   // 2h30
const MAX_GAP_MIN = 210;   // 3h30
const SITE_URL    = 'https://gigtrack.com.br/';
const STATE_FILE  = __DIR__ . '/.keepalive-state.json';
const LOG_FILE    = __DIR__ . '/.keepalive.log';
const LOG_KEEP    = 300;   // linhas

$opts   = getopt('', ['force', 'dry-run', 'now:']);
$force  = isset($opts['force']);
$dryRun = isset($opts['dry-run']);
$now    = isset($opts['now']) ? (int) $opts['now'] : time();

function logLine(string $msg, int $now): void
{
    $line = date('Y-m-d H:i:s', $now) . '  ' . $msg . PHP_EOL;
    echo $line;
    $old = is_file(LOG_FILE) ? file(LOG_FILE, FILE_IGNORE_NEW_LINES) : [];
    $old = array_slice($old ?: [], -(LOG_KEEP - 1));
    @file_put_contents(LOG_FILE, implode(PHP_EOL, $old) . ($old ? PHP_EOL : '') . $line, LOCK_EX);
}

function loadState(): array
{
    $s = is_file(STATE_FILE) ? json_decode((string) file_get_contents(STATE_FILE), true) : null;
    return is_array($s) ? $s : [];
}

function saveState(array $s): void
{
    @file_put_contents(STATE_FILE, json_encode($s, JSON_PRETTY_PRINT), LOCK_EX);
}

/** URL e chave pública do Supabase lidas do próprio config.js do site (um lugar só para configurar). */
function supabaseConfig(): array
{
    $js = @file_get_contents(__DIR__ . '/../assets/js/config.js');
    if ($js === false) {
        throw new RuntimeException('não encontrei assets/js/config.js');
    }
    preg_match("/SUPABASE_URL\\s*:\\s*'([^']+)'/", $js, $u);
    preg_match("/SUPABASE_ANON_KEY\\s*:\\s*'([^']+)'/", $js, $k);
    if (empty($u[1]) || empty($k[1])) {
        throw new RuntimeException('SUPABASE_URL/SUPABASE_ANON_KEY não encontrados em config.js');
    }
    return [rtrim($u[1], '/'), $k[1]];
}

function http(string $method, string $url, array $headers = [], ?string $body = null): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS      => 3,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_USERAGENT      => 'GigTrack-keepalive/1.0 (+https://gigtrack.com.br)',
        CURLOPT_HTTPHEADER     => $headers,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    $resp = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err  = curl_errno($ch) ? curl_error($ch) : '';
    curl_close($ch);
    return [$code, is_string($resp) ? $resp : '', $err];
}

/**
 * Sorteia o próximo horário exato (com minutos e segundos): entre 2h30 e 3h30 depois de $from.
 * Sorteia de novo se o horário do dia (hh:mm) já foi usado recentemente — nunca repete.
 */
function nextRun(int $from, array &$state): int
{
    $used = $state['used'] ?? [];
    for ($i = 0; $i < 50; $i++) {
        $t = $from + random_int(MIN_GAP_MIN * 60, MAX_GAP_MIN * 60);
        if (!in_array(date('H:i', $t), $used, true)) {
            break;
        }
    }
    return $t;
}

/** Registra o horário do dia usado (guarda os últimos 300 ≈ 5 semanas). */
function remember(int $t, array &$state): void
{
    $state['used'] = array_slice(array_merge($state['used'] ?? [], [date('H:i', $t)]), -300);
}

// ------------------------------------------------------------------
$state = loadState();
if (empty($state['next_at'])) {
    // primeira vez: começa num ponto aleatório dos próximos 15 minutos a 1 hora
    $state['next_at'] = $now + random_int(15 * 60, 60 * 60 + 59);
    saveState($state);
    logLine('primeira execução: próximo acesso em ' . date('Y-m-d H:i', $state['next_at']), $now);
    if (!$force) {
        exit(0);
    }
}

if (!$force && $now + 15 * 60 <= (int) $state['next_at']) {
    exit(0);  // a hora sorteada ainda não cai nesta janela de 15 min; silencioso para não encher o log
}

// O agendador chama a cada 15 minutos; o horário sorteado tem minuto e segundo exatos.
// Se ele cai dentro desta janela, espera até o segundo certo.
if (!$force && (int) $state['next_at'] > $now) {
    if ($dryRun || isset($opts['now'])) {
        $now = (int) $state['next_at'];   // em teste, só simula a espera
    } else {
        set_time_limit(0);
        sleep((int) $state['next_at'] - $now);
        $now = time();
    }
}

if ($dryRun) {
    remember($now, $state);
    $next = nextRun($now, $state);
    logLine('[teste] acessaria o site e o Supabase agora; próximo seria ' . date('Y-m-d H:i', $next), $now);
    $state['next_at'] = $next;
    $state['last_at'] = $now;
    $state['last_result'] = 'dry-run';
    saveState($state);
    exit(0);
}

$ok = true;
$parts = [];
try {
    [$sbUrl, $sbKey] = supabaseConfig();

    [$c] = http('GET', SITE_URL);
    $parts[] = "site $c";

    [$c] = http('GET', $sbUrl . '/auth/v1/health', ['apikey: ' . $sbKey]);
    $parts[] = "auth $c";
    $ok = $ok && $c === 200;

    [$c, $body, $err] = http('POST', $sbUrl . '/rest/v1/rpc/keepalive_ping',
        ['apikey: ' . $sbKey, 'Content-Type: application/json'], json_encode(['p_source' => 'hostinger-cron']));
    $parts[] = "banco $c" . ($err ? " ($err)" : '');
    $ok = $ok && $c === 200;
    if ($c !== 200 && $body !== '') {
        $parts[] = substr(preg_replace('/\s+/', ' ', $body), 0, 160);
    }
} catch (Throwable $e) {
    $ok = false;
    $parts[] = 'erro: ' . $e->getMessage();
}

// Falhou? tenta de novo em 15–30 min, em vez de esperar 3 horas
remember($now, $state);
$state['next_at'] = $ok ? nextRun($now, $state) : $now + random_int(15 * 60, 30 * 60 + 59);
$state['last_at'] = $now;
$state['last_result'] = $ok ? 'ok' : 'falha';
saveState($state);

logLine(($ok ? 'OK  ' : 'FALHA ') . implode(' · ', $parts) . ' · próximo ' . date('Y-m-d H:i', $state['next_at']), $now);
exit($ok ? 0 : 1);
