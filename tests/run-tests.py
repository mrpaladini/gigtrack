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

def new_page(browser, vp, touch, mock_opts=None):
    ctx = browser.new_context(viewport=vp, has_touch=touch, is_mobile=touch and vp['width'] < 700,
                              device_scale_factor=2 if touch else 1, accept_downloads=True)
    if mock_opts:
        import json
        ctx.add_init_script('window.__MOCK = ' + json.dumps(mock_opts) + ';')
    return ctx, ctx.new_page()

def run_flow(browser, base, label, vp, touch):
    ctx, page = new_page(browser, vp, touch)
    errors = []
    # registra se a tela "Configuração pendente" aparecer em qualquer momento, mesmo por um instante
    page.add_init_script("""
      window.__sawSetup = false;
      new MutationObserver(function(){ if(document.body && /Configuração pendente/.test(document.body.textContent)) window.__sawSetup = true; })
        .observe(document, {childList:true, subtree:true, characterData:true});
    """)
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
    check(f'[{label}] não pisca a tela "Configuração pendente" ao abrir', page.evaluate('window.__sawSetup') is False)
    check(f'[{label}] marca GigTrack no topo', 'GigTrack' in page.inner_text('.topbar'))
    check(f'[{label}] usuário comum não vê o menu Administração', page.locator('[data-action="open-admin"]').count() == 0)
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
            page.check('#f-song-public')
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
    check(f'[{label}] marca "Pública" na música pública', page.locator('.songrow .pill-public').count() == 1)
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


def setup_routes(page, errors):
    def route_html(route):
        resp = route.fetch()
        route.fulfill(response=resp, headers={**resp.headers, 'content-security-policy': CSP})
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route(re.compile(r'.*/(index\.html)?(\?.*)?$'), route_html)
    page.route('**/assets/vendor/supabase-*.js', lambda r: r.fulfill(body=MOCK, content_type='application/javascript'))
    page.route(re.compile(r'https://fonts\.(googleapis|gstatic)\.com/.*'), lambda r: r.abort())

def report_errors(label, errors):
    bad = [e for e in errors if 'fonts.g' not in e and 'ERR_FAILED' not in e and 'net::' not in e]
    check(f'[{label}] sem erros no console', not bad, '; '.join(bad)[:300])

def new_band(page, name):
    page.click('[data-action="new-band"]')
    page.fill('#f-band-name', name)
    page.click('.modal-foot button[type="submit"]')
    page.wait_for_function("n => document.querySelector('.topbar') && document.querySelector('.topbar').innerText.includes(n)", arg=name)
    page.wait_for_selector('.tabs')

def run_admin_flow(browser, base, label, vp, touch):
    """Admin: cópia entre bandas, biblioteca pública, área administrativa, conta e login por usuário."""
    ctx, page = new_page(browser, vp, touch, {'admin': True, 'email': 'gigadmin@gigtrack.com.br'})
    errors = []
    setup_routes(page, errors)
    page.goto(base + '/')
    page.wait_for_selector('.hero h1', timeout=8000)
    check(f'[{label}] admin vê o menu Administração', page.locator('[data-action="open-admin"]').count() == 1)
    check(f'[{label}] ícone de admin mostra contas aguardando', page.inner_text('[data-action="open-admin"] .count') == '1')

    new_band(page, 'Banda Um')
    page.click('[data-action="go-home"]'); page.wait_for_selector('.bandgrid')
    new_band(page, 'Banda Dois')
    page.click('[data-action="new-song"]')
    page.fill('#f-song-name', 'Asa Branca'); page.fill('#f-song-artist', 'Luiz Gonzaga'); page.fill('#f-song-key', 'G')
    page.fill('#f-song-comment', 'intro na sanfona')
    page.check('#f-song-public')
    page.click('.modal-foot button[type="submit"]'); page.wait_for_selector('.modal-backdrop', state='detached')

    # copiar para outra banda
    page.click('.songrow [data-action="copy-song"]')
    page.wait_for_selector('input[name="copy-band"]')
    check(f'[{label}] cópia lista só as outras bandas', page.locator('input[name="copy-band"]').count() == 1)
    page.screenshot(path=str(OUT / f'{label}-admin-1-copiar.png'))
    page.check('input[name="copy-band"]')
    page.click('.modal-foot button[type="submit"]'); page.wait_for_selector('.modal-backdrop', state='detached')
    page.click('[data-action="go-home"]'); page.wait_for_selector('.bandgrid')
    page.locator('.bandcard', has_text='Banda Um').click(); page.wait_for_selector('.songrow')
    rows = page.locator('.songrow').all_inner_texts()
    check(f'[{label}] música copiada aparece na outra banda', any('Asa Branca' in t for t in rows), str(rows)[:200])
    check(f'[{label}] cópia entre bandas próprias mantém o comentário', page.locator('.songrow', has_text='Asa Branca').locator('.pill', has_text='Nota').count() == 1)
    check(f'[{label}] cópia não sai pública', page.locator('.songrow', has_text='Asa Branca').locator('.pill-public').count() == 0)

    # biblioteca pública
    page.click('[data-action="open-public-lib"]')
    page.wait_for_selector('.pubrow')
    names = page.locator('.pubrow .title').all_inner_texts()
    check(f'[{label}] biblioteca mostra músicas públicas de outras bandas', 'Garota de Ipanema' in names, str(names))
    check(f'[{label}] biblioteca reconhece cópia já feita', 'Já copiada' in page.locator('.pubrow', has_text='Asa Branca').inner_text())
    page.fill('#f-pub-search', 'ipanema'); page.wait_for_timeout(600)
    check(f'[{label}] busca na biblioteca filtra', page.locator('.pubrow').count() == 1)
    check(f'[{label}] biblioteca sem rolagem lateral', overflow(page) <= 0, f'{overflow(page)}px')
    page.screenshot(path=str(OUT / f'{label}-admin-2-publicas.png'))
    page.click('[data-action="copy-public"]')
    page.wait_for_function("document.querySelector('.pubrow') && document.querySelector('.pubrow').innerText.includes('Já copiada')")
    page.click('.modal-head [data-action="close-modal"]')
    garota = page.locator('.songrow', has_text='Garota de Ipanema')
    check(f'[{label}] música pública copiada para a banda', garota.count() == 1)
    check(f'[{label}] cópia de música pública vem sem o comentário', garota.locator('.pill', has_text='Nota').count() == 0)

    # área administrativa
    page.click('[data-action="open-admin"]')
    page.wait_for_selector('.userrow')
    check(f'[{label}] admin lista os usuários', page.locator('.userrow').count() == 3)
    bruno = page.locator('.userrow', has_text='Bruno')
    check(f'[{label}] conta nova aparece aguardando liberação', 'aguardando liberação' in bruno.inner_text().lower())
    check(f'[{label}] contador de contas aguardando', '1 aguardando' in page.inner_text('.hero'))
    bruno.locator('[data-action="admin-approve"]').click()
    page.wait_for_function("![...document.querySelectorAll('.userrow')].some(r => r.innerText.includes('Bruno') && r.querySelector('.badge-pending'))")
    check(f'[{label}] admin libera a conta', page.locator('.userrow', has_text='Bruno').locator('[data-action="admin-block"]').count() == 1)
    page.locator('.userrow', has_text='Bruno').locator('[data-action="admin-block"]').click()
    page.click('[data-action="confirm-yes"]')
    page.wait_for_function("[...document.querySelectorAll('.userrow')].some(r => r.innerText.includes('Bruno') && r.querySelector('.badge-pending'))")
    check(f'[{label}] admin bloqueia a conta de novo', True)
    check(f'[{label}] gigadmin aparece como usuário', 'gigadmin (usuário)' in page.inner_text('.userlist'))
    page.screenshot(path=str(OUT / f'{label}-admin-3-usuarios.png'), full_page=True)
    check(f'[{label}] área admin sem rolagem lateral', overflow(page) <= 0, f'{overflow(page)}px')
    ana = page.locator('.userrow', has_text='Ana Baterista')
    ana.locator('[data-action="admin-reset"]').click()
    page.wait_for_selector('#f-reset-pw')
    pw = page.input_value('#f-reset-pw')
    check(f'[{label}] senha temporária gerada', len(pw) >= 8, pw)
    page.click('.modal-foot button[type="submit"]')
    page.wait_for_selector('.invitebox .code')
    shown = page.inner_text('.invitebox .code')
    sent = page.evaluate('window.__lastReset && window.__lastReset.password')
    check(f'[{label}] senha redefinida e exibida para copiar', shown == pw == sent, f'{shown} / {sent}')
    page.screenshot(path=str(OUT / f'{label}-admin-4-senha.png'))
    page.click('.modal-foot [data-action="close-modal"]')
    check(f'[{label}] usuário fica com troca de senha pendente', 'troca de senha pendente' in page.locator('.userrow', has_text='Ana Baterista').inner_text().lower())
    page.locator('.userrow', has_text='Ana Baterista').locator('[data-action="admin-set"]').click()
    page.click('[data-action="confirm-yes"]')
    page.wait_for_function("[...document.querySelectorAll('.userrow')].some(r => r.innerText.includes('Ana') && r.querySelector('.badge-admin'))")
    check(f'[{label}] admin promove outro usuário', True)
    check(f'[{label}] admin não pode tirar a si mesmo', page.locator('.userrow', has_text='(você)').locator('[data-action="admin-unset"]').count() == 0)
    page.click('[data-action="close-admin"]'); page.wait_for_selector('.main')

    # minha conta
    page.click('[data-action="open-account"]')
    page.fill('#f-acc-new', 'SenhaNova123'); page.fill('#f-acc-again', 'Diferente123')
    page.click('.modal-foot button[type="submit"]'); page.wait_for_timeout(200)
    check(f'[{label}] conta: senhas diferentes são recusadas', page.evaluate('window.__lastPasswordChange') is None)
    page.fill('#f-acc-again', 'SenhaNova123')
    page.click('.modal-foot button[type="submit"]'); page.wait_for_selector('.modal-backdrop', state='detached')
    check(f'[{label}] conta: senha trocada', page.evaluate('window.__lastPasswordChange') == 'SenhaNova123')

    # login por nome de usuário
    page.click('[data-action="logout"]'); page.wait_for_selector('#auth-form')
    check(f'[{label}] login aceita "E-mail ou usuário"', 'usuário' in page.inner_text('#auth-form').lower())
    page.fill('#f-auth-email', 'GigAdmin'); page.fill('#f-auth-pass', 'Password@123!')
    page.click('#auth-form button[type="submit"]'); page.wait_for_timeout(400)
    check(f'[{label}] usuário gigadmin vira gigadmin@gigtrack.com.br', page.evaluate('window.__lastLogin') == 'gigadmin@gigtrack.com.br', str(page.evaluate('window.__lastLogin')))
    report_errors(label + ' admin', errors)
    ctx.close()

def run_force_password(browser, base, label, vp, touch):
    ctx, page = new_page(browser, vp, touch, {'mustChange': True})
    errors = []
    setup_routes(page, errors)
    page.goto(base + '/')
    page.wait_for_selector('#pw-form', timeout=8000)
    check(f'[{label}] senha redefinida obriga a criar senha nova', page.locator('.topbar').count() == 0)
    page.screenshot(path=str(OUT / f'{label}-troca-senha.png'))
    page.fill('#f-pw-new', 'curta'); page.fill('#f-pw-again', 'curta')
    page.click('#pw-form button[type="submit"]'); page.wait_for_timeout(200)
    check(f'[{label}] senha curta recusada', '8 caracteres' in page.inner_text('#pw-form'))
    page.fill('#f-pw-new', 'MinhaSenha2026'); page.fill('#f-pw-again', 'MinhaSenha2026')
    page.click('#pw-form button[type="submit"]')
    page.wait_for_selector('.hero h1', timeout=8000)
    check(f'[{label}] depois da troca entra no app', page.evaluate('window.__lastPasswordChange') == 'MinhaSenha2026')
    report_errors(label + ' troca', errors)
    ctx.close()

def run_pending(browser, base, label, vp, touch):
    ctx, page = new_page(browser, vp, touch, {'pending': True})
    errors = []
    setup_routes(page, errors)
    page.goto(base + '/')
    page.wait_for_selector('[data-action="pending-recheck"]', timeout=8000)
    check(f'[{label}] conta pendente vê a tela de aguardando liberação', 'aguardando liberação' in page.inner_text('.authcard').lower())
    check(f'[{label}] conta pendente não vê bandas', page.locator('.bandgrid').count() == 0)
    page.screenshot(path=str(OUT / f'{label}-pendente.png'))
    page.click('[data-action="pending-recheck"]'); page.wait_for_timeout(300)
    check(f'[{label}] verificar antes de liberar continua bloqueado', page.locator('[data-action="pending-recheck"]').count() == 1)
    page.evaluate('window.__mockApprove()')
    page.click('[data-action="pending-recheck"]')
    page.wait_for_selector('.hero h1', timeout=8000)
    check(f'[{label}] depois de liberada entra no app', 'Suas bandas' in page.inner_text('.hero h1'))
    report_errors(label + ' pendente', errors)
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
                for fn, nm in ((run_flow, 'fluxo completo'), (run_admin_flow, 'fluxo admin'), (run_force_password, 'troca de senha'), (run_pending, 'conta pendente')):
                    try:
                        fn(browser, f'http://127.0.0.1:{port}', label, vp, touch)
                    except Exception as e:
                        check(f'[{label}] {nm}', False, repr(e)[:400])
            browser.close()
    finally:
        srv.terminate()
    failed = [r for r in results if not r[1]]
    print(f'\n{len(results) - len(failed)} passaram, {len(failed)} falharam')
    sys.exit(1 if failed else 0)

if __name__ == '__main__':
    main()
