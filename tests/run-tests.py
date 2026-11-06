#!/usr/bin/env python3
"""GigTrack — testes ponta a ponta no navegador (celular, tablet e desktop).

Sobe o site com um servidor local simples (Python), troca o supabase-js por um Supabase simulado em memória
(tests/mock-supabase.js), aplica o mesmo Content-Security-Policy do .htaccess e percorre o fluxo
principal: criar banda → cadastrar músicas → criar show → montar setlist → gerar PDF → abrir cifra.

Em cada tamanho de tela confere que nada fica mais largo que a tela (sem rolagem lateral), que os
botões de toque têm tamanho mínimo e que não há erros no console. Salva capturas em tests/output/.

Uso:  pip install playwright && playwright install chromium
      python3 tests/run-tests.py
"""
import pathlib, re, socket, subprocess, sys, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'output'
OUT.mkdir(parents=True, exist_ok=True)
MOCK = (ROOT / 'tests' / 'mock-supabase.js').read_text()
CSP = re.search(r'Content-Security-Policy "([^"]+)"', (ROOT / '.htaccess').read_text()).group(1)
CSP = CSP.replace('; upgrade-insecure-requests', '')  # servidor local é http

VIEWPORTS = [
    ('celular-360', dict(width=360, height=740), True),
    ('iphone-390', dict(width=390, height=844), True),
    ('tablet-768', dict(width=768, height=1024), True),
    ('tablet-1024', dict(width=1024, height=768), True),
    ('desktop-1366', dict(width=1366, height=860), False),
]

results = []
def check(name, ok, detail=''):
    results.append((name, ok, detail))
    print(('ok   - ' if ok else 'FAIL - ') + name + (f'  ({detail})' if detail and not ok else ''))

def free_port():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p

def overflow(page):
    return page.evaluate('() => document.documentElement.scrollWidth - window.innerWidth')

def run_flow(browser, base, label, vp, touch):
    ctx = browser.new_context(viewport=vp, has_touch=touch, is_mobile=touch and vp['width'] < 700,
                              device_scale_factor=2 if touch else 1, accept_downloads=True)
    page = ctx.new_page()
    errors = []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))

    def route_html(route):
        resp = route.fetch()
        route.fulfill(response=resp, headers={**resp.headers, 'content-security-policy': CSP})
    page.route(re.compile(r'.*/(index\.html)?(\?.*)?$'), route_html)
    page.route('**/assets/vendor/supabase-*.js', lambda r: r.fulfill(body=MOCK, content_type='application/javascript'))
    page.route(re.compile(r'https://fonts\.(googleapis|gstatic)\.com/.*'), lambda r: r.abort())

    page.goto(base + '/')
    page.wait_for_selector('.hero h1', timeout=8000)
    check(f'[{label}] abre na lista de bandas', 'Suas bandas' in page.inner_text('.hero h1'))
    check(f'[{label}] marca GigTrack no topo', 'GigTrack' in page.inner_text('.topbar'))
    page.screenshot(path=str(OUT / f'{label}-1-bandas.png'), full_page=True)

    # criar banda
    page.click('[data-action="new-band"]')
    page.fill('#f-band-name', 'Os Afinados do Bairro com Nome Bem Comprido')
    page.screenshot(path=str(OUT / f'{label}-2-modal-banda.png'))
    check(f'[{label}] modal cabe na tela', overflow(page) <= 0, f'{overflow(page)}px')
    page.click('.modal-foot button[type="submit"]')
    page.wait_for_selector('.tabs')  # o app abre a banda recém-criada
    check(f'[{label}] banda criada e aberta', 'Afinados' in page.inner_text('.topbar'))

    # músicas
    songs = [('Tempo Perdido', 'Legião Urbana', 'C', 5, 2), ('Uma Música com Título Extremamente Longo Para Testar', 'Artista Também Bem Comprido da Silva', 'F#m', 4, 31), ('Pais e Filhos', 'Legião Urbana', 'D', 5, 9)]
    for name, artist, key, mi, se in songs:
        page.click('[data-action="new-song"]')
        page.fill('#f-song-name', name); page.fill('#f-song-artist', artist); page.fill('#f-song-key', key)
        page.fill('#f-song-min', str(mi)); page.fill('#f-song-sec', str(se))
        if name == 'Tempo Perdido':
            page.fill('#f-song-youtube', 'https://youtube.com/watch?v=x')
            # link inválido é recusado
            page.fill('#f-song-cifra-url', 'https://example.com/musica')
            check(f'[{label}] link de outro site mostra aviso', 'não é do Cifra Club' in page.inner_text('#f-song-cifra-status'))
            page.click('.modal-foot button[type="submit"]')
            page.wait_for_timeout(300)
            check(f'[{label}] link de outro site não é salvo', page.locator('.modal-backdrop').count() == 1)
            page.fill('#f-song-cifra-url', 'cifraclub.com.br/legiao-urbana/tempo-perdido/')
            check(f'[{label}] botão Abrir aparece com link válido', page.locator('#f-song-cifra-open').is_visible())
            page.screenshot(path=str(OUT / f'{label}-3-form-musica.png'))
            if vp['width'] <= 600:
                fs = page.evaluate("() => parseFloat(getComputedStyle(document.querySelector('#f-song-name')).fontSize)")
                check(f'[{label}] campos com 16px (sem zoom no iPhone)', fs >= 16, f'{fs}px')
        page.click('.modal-foot button[type="submit"]')
        page.wait_for_selector('.modal-backdrop', state='detached')
    page.wait_for_selector('.songrow')
    check(f'[{label}] 3 músicas na lista', page.locator('.songrow').count() == 3)
    href = page.locator('.songrow .pill-cifraclub').first.get_attribute('href') if page.locator('.songrow .pill-cifraclub').count() else ''
    check(f'[{label}] atalho do Cifra Club na lista', href == 'https://cifraclub.com.br/legiao-urbana/tempo-perdido/', href)
    check(f'[{label}] lista de músicas sem rolagem lateral', overflow(page) <= 0, f'{overflow(page)}px')
    if touch:
        small = page.evaluate("""() => [...document.querySelectorAll('.iconbtn')].filter(b => b.offsetParent)
            .map(b => b.getBoundingClientRect()).filter(r => r.width < 40 || r.height < 40).length""")
        check(f'[{label}] botões de ícone com ≥40px para o dedo', small == 0, f'{small} pequenos')
    page.screenshot(path=str(OUT / f'{label}-4-musicas.png'), full_page=True)

    # show
    page.click('[data-tab="shows"]')
    page.click('[data-action="new-show"]')
    page.fill('#f-show-name', 'Festa Junina do Clube')
    page.fill('#f-show-venue', 'Clube Recreativo')
    page.fill('#f-show-date', '2026-12-12')
    page.click('.modal-foot button[type="submit"]')
    page.wait_for_selector('.editorwrap')  # o app abre o show recém-criado
    for _ in range(3):
        page.locator('[data-action="add-to-set"]').first.click()
        page.wait_for_timeout(150)
    page.wait_for_function("document.querySelectorAll('.setrow').length === 3")
    check(f'[{label}] setlist com 3 faixas', page.locator('.setrow').count() == 3)
    check(f'[{label}] atalho do Cifra Club no setlist', page.locator('.setrow .pill-cifraclub').count() == 1)
    total = page.locator('.summarybar .sb-value').nth(1).inner_text()
    check(f'[{label}] tempo total 14:42', total.strip() == '14:42', total)
    page.locator('[data-action="set-move-down"]').first.click()
    page.wait_for_timeout(200)
    if touch:
        small = page.evaluate("""() => [...document.querySelectorAll('.setrow .iconbtn')]
            .map(b => b.getBoundingClientRect()).filter(r => r.width < 38 || r.height < 38).length""")
        check(f'[{label}] botões do setlist com ≥38px para o dedo', small == 0, f'{small} pequenos: ' + str(page.evaluate("() => [...document.querySelectorAll('.setrow .iconbtn')].slice(0,2).map(b => [b.getBoundingClientRect().width, getComputedStyle(b).width, b.closest('.setrow').getBoundingClientRect().width])")))
    icon_h = page.evaluate("() => document.querySelector('.showmeta svg').getBoundingClientRect().height")
    check(f'[{label}] ícone do cabeçalho do show em tamanho normal', icon_h <= 20, f'{icon_h}px')
    check(f'[{label}] editor do show sem rolagem lateral', overflow(page) <= 0, f'{overflow(page)}px')
    side_by_side = page.evaluate("""() => { const p=[...document.querySelectorAll('.editorwrap .pane')].map(e=>e.getBoundingClientRect());
        return p.length===2 && Math.abs(p[0].top-p[1].top) < 2; }""")
    check(f'[{label}] catálogo e setlist ' + ('lado a lado' if vp['width'] >= 820 else 'empilhados'),
          side_by_side == (vp['width'] >= 820))
    page.screenshot(path=str(OUT / f'{label}-6-setlist.png'), full_page=True)

    with page.expect_download(timeout=8000) as dl:
        page.click('[data-action="export-pdf"]')
    check(f'[{label}] PDF do setlist baixado', dl.value.suggested_filename.endswith('.pdf'), dl.value.suggested_filename)

    # lista de shows
    page.click('[data-action="close-show"]')
    page.wait_for_selector('.showcard')
    check(f'[{label}] lista de shows sem rolagem lateral', overflow(page) <= 0, f'{overflow(page)}px')
    page.screenshot(path=str(OUT / f'{label}-5-shows.png'), full_page=True)
    page.click('.showcard')
    page.wait_for_selector('.editorwrap')

    # cifra
    page.locator('.setrow:has(.pill-cifraclub) [data-action="open-chords"]').first.click()
    page.wait_for_selector('.cf-modal')
    check(f'[{label}] tela de cifra tem "Abrir no Cifra Club"', page.locator('.cf-link a[href*="cifraclub.com.br"]').count() == 1)
    check(f'[{label}] tela de cifra abre', page.locator('.cf-modal').is_visible())
    check(f'[{label}] tela de cifra sem rolagem lateral da página', overflow(page) <= 0, f'{overflow(page)}px')
    page.screenshot(path=str(OUT / f'{label}-7-cifra.png'))

    bad = [e for e in errors if 'fonts.g' not in e and 'ERR_FAILED' not in e and 'net::' not in e]
    csp = [e for e in errors if 'Content Security Policy' in e]
    check(f'[{label}] sem violação de CSP', not csp, '; '.join(csp)[:300])
    check(f'[{label}] sem erros no console', not bad, '; '.join(bad)[:300])
    ctx.close()

def main():
    port = free_port()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1', '--directory', str(ROOT)],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(0.8)
        with sync_playwright() as p:
            browser = p.chromium.launch()
            for label, vp, touch in VIEWPORTS:
                try:
                    run_flow(browser, f'http://127.0.0.1:{port}', label, vp, touch)
                except Exception as e:
                    check(f'[{label}] fluxo completo', False, repr(e)[:400])
            browser.close()
    finally:
        srv.terminate()
    failed = [r for r in results if not r[1]]
    print(f'\n{len(results) - len(failed)} passaram, {len(failed)} falharam')
    sys.exit(1 if failed else 0)

if __name__ == '__main__':
    main()
