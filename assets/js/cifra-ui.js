/* GigTrack — tela de cifra (ver, editar/colar, mudar o tom, salvar; atalho para o Cifra Club).
 * Depende de cifra-core.js (window.CifraCore) e do cliente Supabase já criado pelo app.
 *
 * Uso no app.js:
 *   CifraUI.open({ song, supabase, onSaved: (songAtualizada) => recarregarMusicas() });
 * `song` é a linha da tabela songs (precisa de id, name, artist, song_key e das colunas chord_*).
 */
(function () {
  'use strict';
  var C = window.CifraCore;

  var CSS = `
  .cf-overlay{position:fixed;inset:0;background:rgba(10,8,6,.62);display:flex;align-items:stretch;justify-content:center;z-index:1000;padding:16px}
  .cf-modal{background:var(--bg-elev,#fff);color:var(--ink,#1b1a20);border:1px solid var(--border,rgba(0,0,0,.12));border-radius:var(--radius,10px);width:min(860px,100%);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35)}
  .cf-head{display:flex;gap:12px;align-items:center;padding:14px 16px;border-bottom:1px solid var(--border,rgba(0,0,0,.12))}
  .cf-title{flex:1;min-width:0}
  .cf-title h2{margin:0;font-family:var(--font-display,'Big Shoulders Display',sans-serif);font-size:1.6rem;line-height:1.05;text-transform:uppercase;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cf-title small{color:var(--ink-soft,#5b5a63);font-size:.85rem}
  .cf-btn{font:inherit;font-size:.9rem;border:1px solid var(--border,rgba(0,0,0,.18));background:transparent;color:inherit;border-radius:var(--radius-sm,6px);padding:7px 12px;cursor:pointer;white-space:nowrap}
  .cf-btn:hover{border-color:var(--accent,#b5720e)}
  .cf-btn:disabled{opacity:.5;cursor:default}
  .cf-btn.primary{background:var(--accent,#b5720e);border-color:var(--accent,#b5720e);color:var(--accent-ink,#fff);font-weight:600}
  .cf-btn.danger{color:var(--danger,#b23a32)}
  .cf-import{display:flex;gap:8px;padding:12px 16px;border-bottom:1px solid var(--border,rgba(0,0,0,.12));flex-wrap:wrap}
  .cf-import input{flex:1;min-width:200px;font:inherit;font-size:.95rem;padding:8px 10px;border-radius:var(--radius-sm,6px);border:1px solid var(--border,rgba(0,0,0,.18));background:var(--surface,transparent);color:inherit}
  .cf-msg{padding:0 16px;font-size:.88rem;min-height:0}
  .cf-msg:not(:empty){padding:8px 16px}
  .cf-msg.err{color:var(--danger,#b23a32)} .cf-msg.ok{color:var(--accent-2,#2e6e6b)}
  .cf-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 16px;border-bottom:1px solid var(--border,rgba(0,0,0,.12))}
  .cf-tabs{display:flex;border:1px solid var(--border,rgba(0,0,0,.18));border-radius:var(--radius-sm,6px);overflow:hidden}
  .cf-tabs button{font:inherit;font-size:.88rem;border:0;background:transparent;color:inherit;padding:6px 12px;cursor:pointer}
  .cf-tabs button[aria-selected=true]{background:var(--accent,#b5720e);color:var(--accent-ink,#fff);font-weight:600}
  .cf-key{display:flex;align-items:center;gap:6px;margin-left:auto}
  .cf-key select{font:inherit;font-family:var(--font-mono,'IBM Plex Mono',monospace);padding:6px 8px;border-radius:var(--radius-sm,6px);border:1px solid var(--border,rgba(0,0,0,.18));background:var(--surface,transparent);color:inherit}
  .cf-key .lbl{font-size:.8rem;color:var(--ink-soft,#5b5a63);text-transform:uppercase;letter-spacing:.06em}
  .cf-orig{font-size:.8rem;color:var(--ink-soft,#5b5a63)}
  .cf-link{align-items:center}.cf-link a{text-decoration:none}
  .cf-body{flex:1;overflow:auto;min-height:240px}
  .cf-view{margin:0;padding:16px;font-family:var(--font-mono,'IBM Plex Mono',monospace);white-space:pre;line-height:1.45;font-size:var(--cf-size,15px);tab-size:4}
  .cf-view .chord{color:var(--accent,#b5720e);font-weight:700}
  .cf-view .chord-decor,.cf-view .section{color:var(--accent-2,#2e6e6b);font-weight:600}
  .cf-view .tab-line{color:var(--ink-soft,#5b5a63)}
  .cf-edit{display:block;width:100%;height:100%;min-height:50vh;box-sizing:border-box;border:0;resize:none;padding:16px;font-family:var(--font-mono,'IBM Plex Mono',monospace);font-size:var(--cf-size,15px);line-height:1.45;white-space:pre;overflow:auto;background:transparent;color:inherit;outline:none}
  .cf-empty{padding:40px 16px;text-align:center;color:var(--ink-soft,#5b5a63)}
  .cf-foot{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:12px 16px;border-top:1px solid var(--border,rgba(0,0,0,.12))}
  .cf-ask{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:12px 16px;border-top:1px solid var(--border,rgba(0,0,0,.12));background:var(--surface-2,rgba(0,0,0,.04))}
  .cf-ask p{margin:0;flex:1;min-width:180px;font-size:.92rem}
  .cf-foot label{font-size:.88rem;display:flex;gap:6px;align-items:center;margin-right:auto}
  .cf-foot a{font-size:.85rem;color:var(--accent-2,#2e6e6b)}
  @media (max-width:600px){.cf-overlay{padding:0}.cf-modal{border-radius:0;width:100%}.cf-key{margin-left:0}
    .cf-head{padding:10px 12px;padding-top:max(10px,env(safe-area-inset-top))}.cf-title h2{font-size:1.3rem}
    .cf-import,.cf-bar{padding:10px 12px}.cf-import input{min-width:0;font-size:16px}.cf-view{padding:12px}
    .cf-foot{padding:10px 12px;padding-bottom:max(10px,env(safe-area-inset-bottom))}.cf-edit{font-size:max(16px,var(--cf-size,15px))}}
  @media (pointer:coarse){.cf-btn{min-height:40px;padding:8px 14px}.cf-tabs button{min-height:40px}.cf-key select{min-height:40px;font-size:16px}}
  .cf-overlay{height:100dvh}
  `;

  function injectCSS() {
    if (document.getElementById('cf-style')) return;
    var s = document.createElement('style');
    s.id = 'cf-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }

  function isCifraClubUrl(s) {
    try { var u = new URL(s.trim()); return /(^|\.)cifraclub\.com(\.br)?$/i.test(u.hostname); } catch (e) { return false; }
  }

  function open(opts) {
    injectCSS();
    var song = opts.song, sb = opts.supabase;
    var state = {
      text: song.chord_sheet || '',
      key: song.chord_key || song.song_key || (song.chord_sheet ? C.guessKey(song.chord_sheet) : '') || '',
      savedKey: song.chord_key || '',
      sourceUrl: song.chord_source_url || '',
      tab: 'view',
      dirty: false,
      size: parseInt(localStorageGet('cf-size') || (window.matchMedia && window.matchMedia('(max-width: 600px)').matches ? '13' : '15'), 10)
    };

    var msg = el('div', { class: 'cf-msg', role: 'status' });
    function say(text, kind) { msg.textContent = text || ''; msg.className = 'cf-msg' + (kind ? ' ' + kind : ''); }

    // --- link do Cifra Club (a cifra em si é colada/digitada na aba Editar)
    var cifraLinkBar = null;
    if (state.sourceUrl && isCifraClubUrl(state.sourceUrl)) {
      cifraLinkBar = el('div', { class: 'cf-import cf-link' }, [
        el('a', { class: 'cf-btn primary', href: state.sourceUrl, target: '_blank', rel: 'noopener', text: 'Abrir no Cifra Club ↗' }),
        el('span', { class: 'cf-orig', text: 'Para salvar a cifra aqui, copie lá e cole na aba Editar.' })
      ]);
    }

    // --- abas, tom, fonte
    var tabView = el('button', { type: 'button', role: 'tab', text: 'Ver', onclick: function () { setTab('view'); } });
    var tabEdit = el('button', { type: 'button', role: 'tab', text: 'Editar', onclick: function () { setTab('edit'); } });
    var keySelect = el('select', { 'aria-label': 'Tom' });
    C.ALL_KEYS.forEach(function (k) {
      keySelect.appendChild(el('option', { value: k, text: k }));
      keySelect.appendChild(el('option', { value: k + 'm', text: k + 'm' }));
    });
    keySelect.addEventListener('change', function () { changeKeyTo(keySelect.value); });
    var down = el('button', { class: 'cf-btn', type: 'button', title: 'Meio tom abaixo', 'aria-label': 'Meio tom abaixo', text: '−½', onclick: function () { shift(-1); } });
    var up = el('button', { class: 'cf-btn', type: 'button', title: 'Meio tom acima', 'aria-label': 'Meio tom acima', text: '+½', onclick: function () { shift(1); } });
    var origInfo = el('span', { class: 'cf-orig' });
    var smaller = el('button', { class: 'cf-btn', type: 'button', title: 'Diminuir letra', text: 'A−', onclick: function () { setSize(state.size - 1); } });
    var bigger = el('button', { class: 'cf-btn', type: 'button', title: 'Aumentar letra', text: 'A+', onclick: function () { setSize(state.size + 1); } });

    var body = el('div', { class: 'cf-body' });
    var pre = el('pre', { class: 'cf-view' });
    var ta = el('textarea', { class: 'cf-edit', spellcheck: 'false', 'aria-label': 'Texto da cifra',
      placeholder: 'Cole ou digite a cifra aqui. Acordes na linha de cima, letra embaixo:\n\nD           A/C#        Bm\nPrimeira linha da letra' });
    ta.addEventListener('input', function () { state.text = ta.value; state.dirty = true; if (!state.key) state.key = C.guessKey(state.text) || ''; syncKeyUI(); });

    // --- rodapé
    var updateSongKey = el('input', { type: 'checkbox', checked: 'checked' });
    var removeBtn = el('button', { class: 'cf-btn danger', type: 'button', text: 'Remover cifra', onclick: removeSheet });
    var cancelBtn = el('button', { class: 'cf-btn', type: 'button', text: 'Fechar', onclick: close });
    var saveBtn = el('button', { class: 'cf-btn primary', type: 'button', text: 'Salvar', onclick: save });

    var askBar = el('div', { class: 'cf-ask', role: 'alertdialog', hidden: 'hidden' });
    var foot;
    /** Confirmação dentro da tela (confirm() nativo não funciona em todo lugar). */
    function ask(message, okLabel) {
      return new Promise(function (resolve) {
        askBar.innerHTML = '';
        var no = el('button', { class: 'cf-btn', type: 'button', text: 'Cancelar' });
        var yes = el('button', { class: 'cf-btn primary', type: 'button', text: okLabel || 'OK' });
        function done(v) { askBar.hidden = true; foot.hidden = false; resolve(v); }
        no.addEventListener('click', function () { done(false); });
        yes.addEventListener('click', function () { done(true); });
        askBar.appendChild(el('p', { text: message }));
        askBar.appendChild(no); askBar.appendChild(yes);
        foot.hidden = true; askBar.hidden = false;
        yes.focus();
      });
    }

    var modal = el('div', { class: 'cf-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Cifra de ' + (song.name || '') }, [
      el('div', { class: 'cf-head' }, [
        el('div', { class: 'cf-title' }, [el('h2', { text: song.name || 'Cifra' }), el('small', { text: song.artist || '' })]),
        el('button', { class: 'cf-btn', type: 'button', 'aria-label': 'Fechar', text: '✕', onclick: close })
      ]),
      cifraLinkBar,
      msg,
      el('div', { class: 'cf-bar' }, [
        el('div', { class: 'cf-tabs', role: 'tablist' }, [tabView, tabEdit]),
        smaller, bigger,
        el('div', { class: 'cf-key' }, [el('span', { class: 'lbl', text: 'Tom' }), down, keySelect, up]),
        origInfo
      ]),
      body,
      askBar,
      foot = el('div', { class: 'cf-foot' }, [
        el('label', {}, [updateSongKey, 'Usar este tom na música do setlist']),
        removeBtn, cancelBtn, saveBtn
      ])
    ]);
    var overlay = el('div', { class: 'cf-overlay' }, [modal]);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    function onKey(e) { if (e.key === 'Escape' && askBar.hidden) close(); }
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);

    function localStorageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function localStorageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem storage */ } }

    function setSize(n) {
      state.size = Math.max(10, Math.min(28, n));
      modal.style.setProperty('--cf-size', state.size + 'px');
      localStorageSet('cf-size', String(state.size));
    }

    function shift(semi) {
      if (!state.text) return;
      var from = state.key || C.guessKey(state.text);
      if (!from) { state.text = C.transpose(state.text, semi); state.dirty = true; render(); return; }
      changeKeyTo(C.transposeKey(from, semi));
    }

    function changeKeyTo(target) {
      var from = state.key || C.guessKey(state.text);
      if (state.text && from) state.text = C.transposeToKey(state.text, from, target);
      state.key = target;
      state.dirty = true;
      render();
    }

    function syncKeyUI() {
      var k = C.parseKey(state.key);
      var has = !!state.text;
      keySelect.disabled = up.disabled = down.disabled = !has;
      if (k) {
        if (![].some.call(keySelect.options, function (o) { return o.value === k.name; })) keySelect.appendChild(el('option', { value: k.name, text: k.name }));
        keySelect.value = k.name;
      }
      origInfo.textContent = state.savedKey && k && state.savedKey !== k.name ? 'salva em ' + state.savedKey : '';
      saveBtn.disabled = !state.dirty;
      removeBtn.hidden = !song.chord_sheet;
    }

    function setTab(t) {
      state.tab = t;
      tabView.setAttribute('aria-selected', t === 'view');
      tabEdit.setAttribute('aria-selected', t === 'edit');
      render();
      if (t === 'edit') ta.focus();
    }

    function render() {
      body.innerHTML = '';
      if (state.tab === 'edit') {
        ta.value = state.text;
        body.appendChild(ta);
      } else if (state.text) {
        pre.innerHTML = C.toHTML(state.text);
        body.appendChild(pre);
      } else {
        body.appendChild(el('div', { class: 'cf-empty' }, [
          el('p', { text: 'Nenhuma cifra salva para esta música.' }),
          el('p', { text: state.sourceUrl ? 'Abra no Cifra Club, copie a cifra e cole na aba Editar.' : 'Toque em Editar para colar ou digitar a cifra.' })
        ]));
      }
      syncKeyUI();
    }

    async function save() {
      saveBtn.disabled = true; saveBtn.textContent = 'Salvando…'; say('');
      var k = C.parseKey(state.key);
      var patch = {
        chord_sheet: state.text.trim() ? state.text : null,
        chord_key: state.text.trim() && k ? k.name : null,
        chord_updated_at: new Date().toISOString()
      };
      if (updateSongKey.checked && k && state.text.trim()) patch.song_key = k.name;
      var res = await sb.from('songs').update(patch).eq('id', song.id).select().single();
      saveBtn.textContent = 'Salvar';
      if (res.error) { say('Não foi possível salvar: ' + res.error.message, 'err'); saveBtn.disabled = false; return; }
      Object.assign(song, res.data || patch);
      state.dirty = false; state.savedKey = patch.chord_key || '';
      say('Cifra salva.', 'ok');
      syncKeyUI();
      if (opts.onSaved) opts.onSaved(song);
    }

    async function removeSheet() {
      if (!(await ask('Remover a cifra desta música?', 'Remover'))) return;
      var res = await sb.from('songs').update({ chord_sheet: null, chord_key: null, chord_updated_at: new Date().toISOString() }).eq('id', song.id).select().single();
      if (res.error) { say('Não foi possível remover: ' + res.error.message, 'err'); return; }
      Object.assign(song, res.data || {});
      state.text = ''; state.key = song.song_key || ''; state.savedKey = ''; state.dirty = false;
      say('Cifra removida.', 'ok');
      render();
      if (opts.onSaved) opts.onSaved(song);
    }

    async function close() {
      if (state.dirty && !(await ask('Sair sem salvar as alterações da cifra?', 'Sair sem salvar'))) return;
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      if (opts.onClose) opts.onClose();
    }

    setSize(state.size);
    setTab('view');
    return { close: close };
  }

  window.CifraUI = { open: open, isCifraClubUrl: isCifraClubUrl };
})();

