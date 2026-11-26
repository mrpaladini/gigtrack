#!/usr/bin/env bash
# GigTrack — simula 30 dias do agendador da Hostinger chamando cron/keepalive.php a cada 15 min
# (modo --dry-run: não acessa a internet). Confere intervalos e que nenhum horário se repete.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
cp -r "$ROOT/cron" "$ROOT/assets" "$T/"
rm -f "$T"/cron/.keepalive-*
php -l "$T/cron/keepalive.php" > /dev/null
N=1800000000
for i in $(seq 0 2879); do php "$T/cron/keepalive.php" --dry-run --now=$((N + i*900)) > /dev/null; done
grep "teste" "$T/cron/.keepalive.log" | awk '{print $1" "$2}' | python3 -c '
import sys, datetime as d
t = [d.datetime.strptime(l.strip(), "%Y-%m-%d %H:%M:%S") for l in sys.stdin if l.strip()]
g = [(b - a).total_seconds() / 60 for a, b in zip(t, t[1:])]
rep = len(t) - len(set(x.strftime("%H:%M") for x in t))
ok = len(t) >= 200 and min(g) >= 150 and max(g) <= 225 and rep == 0
print(f"{len(t)} acessos em 30 dias · intervalos {min(g):.0f}–{max(g):.0f} min · horários repetidos: {rep}")
print("ok" if ok else "FALHOU"); sys.exit(0 if ok else 1)'
