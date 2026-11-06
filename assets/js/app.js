(function(){
"use strict";

/* ============================================================
   ICONS
   ============================================================ */
function icon(name){
  var p = {
    plus:'<path d="M12 5v14M5 12h14"/>',
    edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
    back:'<path d="M15 18l-6-6 6-6"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    youtube:'<rect x="2" y="6" width="20" height="12" rx="3"/><path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none"/>',
    spotify:'<circle cx="12" cy="12" r="9"/><path d="M7.5 10.5c3-1 6.7-.6 9 .9M8 13.6c2.4-.8 5.3-.5 7.2.7M8.5 16.4c1.9-.5 4-.3 5.5.5"/>',
    file:'<path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/>',
    upload:'<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    band:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M14.5 14.7c2.6.2 4.5 2.2 4.5 5.3"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    up:'<path d="M6 15l6-6 6 6"/>',
    down:'<path d="M6 9l6 6 6-6"/>',
    close:'<path d="M6 6l12 12M18 6L6 18"/>',
    check:'<path d="M4 12l5 5L20 6"/>',
    warn:'<path d="M12 3l10 18H2Z"/><path d="M12 10v4M12 17.5v.01"/>',
    pdf:'<path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/>',
    comment:'<path d="M21 12a8 8 0 1 1-3.4-6.5"/><path d="M21 3l-6 6"/>',
    music:'<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    external:'<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14 9l2 2"/>',
    users:'<circle cx="9" cy="8" r="3"/><path d="M2 20c0-3 3-5 7-5s7 2 7 5"/><path d="M17 9a3 3 0 1 0 0-6"/><path d="M22 20c0-2.5-1.7-4.3-4-4.9"/>',
    logout:'<path d="M15 17l5-5-5-5"/><path d="M20 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/>',
    shield:'<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6Z"/><path d="M9 12l2 2 4-4"/>',
    copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'
  }[name] || '';
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
}

/* ============================================================
   UTILITIES
   ============================================================ */
function escapeHtml(s){
  return String(s==null?'':s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function fmtDuration(totalSec){
  totalSec = Math.max(0, Math.round(totalSec||0));
  var h = Math.floor(totalSec/3600), m = Math.floor((totalSec%3600)/60), s = totalSec%60;
  if(h>0) return h+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  return m+':'+String(s).padStart(2,'0');
}
var MONTHS = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
function fmtDateBox(iso){
  if(!iso) return {d:'--', m:'----'};
  var parts = iso.split('-');
  if(parts.length<3) return {d:'--', m:'----'};
  var d = parseInt(parts[2],10), mo = parseInt(parts[1],10)-1;
  return { d: String(d), m: MONTHS[mo] || '----' };
}
function fmtDateLong(iso){
  if(!iso) return 'Data a definir';
  var parts = iso.split('-');
  if(parts.length<3) return iso;
  var d = parseInt(parts[2],10), mo = parseInt(parts[1],10)-1, y = parts[0];
  var names = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  return d + ' de ' + (names[mo]||'') + ' de ' + y;
}
function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }
function debounce(fn, ms){
  var t = null;
  return function(){
    var args = arguments, self = this;
    clearTimeout(t);
    t = setTimeout(function(){ fn.apply(self, args); }, ms);
  };
}

/* ============================================================
   SUPABASE CLIENT
   ============================================================ */
var sb = null;
var configOk = false;
function initSupabase(){
  var cfg = window.GIGTRACK_CONFIG || {};
  var url = cfg.SUPABASE_URL, key = cfg.SUPABASE_ANON_KEY;
  if(!url || !key || url.indexOf('COLE_AQUI') > -1 || key.indexOf('COLE_AQUI') > -1){
    configOk = false;
    return;
  }
  if(!window.supabase || typeof window.supabase.createClient !== 'function'){
    configOk = false;
    return;
  }
  sb = window.supabase.createClient(url, key);
  configOk = true;
}

/* ============================================================
   STATE
   ============================================================ */
var session = null, profile = null, isAdmin = false;
var NAV_KEY = 'gigtrack_nav_v1';
function restoreNav(){
  try { var raw = localStorage.getItem(NAV_KEY); if(raw) return JSON.parse(raw); } catch(e){}
  return null;
}
function stashNav(){
  try { localStorage.setItem(NAV_KEY, JSON.stringify({bandId: ui.bandId, tab: ui.tab})); } catch(e){}
}
var savedNav = restoreNav() || {};
var ui = {
  screen: 'loading',
  authTab: 'login',
  authError: '',
  authBusy: false,
  authInfo: "",
  bandId: savedNav.bandId || null,
  tab: savedNav.tab || 'songs',
  showId: null,
  search: '',
  modal: null,
  busy: false
};
var cache = { bands: [], members: [], songs: [], shows: [], showSongs: {}, signedUrls: {}, adminUsers: [] };
var pendingLogoFile = null, pendingSheetFile = null;

/* ============================================================
   RENDER LOOP
   ============================================================ */
function render(){
  document.getElementById('app').innerHTML = renderScreen();
  focusFirstField();
}
function focusFirstField(){
  var f = document.querySelector('.modal input, .modal textarea, .authform input');
  if(f){ try{ f.focus({preventScroll:true}); }catch(e){ f.focus(); } }
}
function toast(msg, isErr){
  var wrap = document.getElementById('toastwrap');
  if(!wrap){
    wrap = document.createElement('div');
    wrap.className = 'toastwrap';
    wrap.id = 'toastwrap';
    document.body.appendChild(wrap);
  }
  var el = document.createElement('div');
  el.className = 'toast' + (isErr?' err':'');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(function(){ el.remove(); }, 3400);
}
function errMsg(err){
  if(!err) return 'Erro desconhecido.';
  if(err.message) return err.message;
  return String(err);
}

function renderScreen(){
  if(!configOk) return renderSetupNeeded();
  if(ui.screen === 'loading') return '<div class="centerscreen"><div class="spinner" role="status" aria-label="Carregando"></div><p>Carregando GigTrack…</p></div>';
  if(ui.screen === 'auth') return renderAuth();
  if(profile && profile.approved === false && !isAdmin) return renderPending();
  if(profile && profile.must_change_password) return renderForcePassword();
  var band = ui.bandId ? cache.bands.find(function(b){ return b.id===ui.bandId; }) : null;
  var body;
  if(ui.screen === 'admin' && isAdmin){
    return renderTopbar(null, 'admin') + '<main class="main" id="main">' + renderAdmin() + '</main>' +
      (ui.modal ? renderModal() : '') + '<div class="toastwrap" id="toastwrap"></div>';
  }
  if(!band){
    body = renderBandList();
  } else if(ui.showId){
    var show = cache.shows.find(function(s){ return s.id===ui.showId; });
    body = show ? renderShowEditor(band, show) : renderBandHome(band);
  } else {
    body = renderBandHome(band);
  }
  return renderTopbar(band) + '<main class="main" id="main">' + body + '</main>' +
    (ui.modal ? renderModal() : '') + '<div class="toastwrap" id="toastwrap"></div>';
}

function renderSetupNeeded(){
  return '<div class="centerscreen" style="text-align:center;max-width:440px;margin:0 auto;padding:2rem 1.2rem;">' +
    icon('warn') + '<h2 style="margin-top:.6rem;">Configuração pendente</h2>' +
    '<p>Abra o arquivo <code>config.js</code> e cole a URL e a chave anônima do seu projeto Supabase antes de usar o GigTrack. Veja o <code>docs/DEPLOY.md</code> para o passo a passo.</p></div>';
}

/* ============================================================
   AUTH SCREEN
   ============================================================ */
function renderAuth(){
  var isLogin = ui.authTab === 'login';
  return '<div class="authwrap"><div class="authcard">' +
    '<div class="brand"><span class="dot"></span>GigTrack</div>' +
    '<p class="tagline">Repertório e setlists da banda, num só lugar.</p>' +
    '<div class="authtabs">' +
    '<button class="'+(isLogin?'active':'')+'" data-action="auth-tab" data-tab="login">Entrar</button>' +
    '<button class="'+(!isLogin?'active':'')+'" data-action="auth-tab" data-tab="signup">Criar conta</button>' +
    '</div>' +
    '<form id="auth-form" class="authform">' +
    (ui.authError ? '<div class="err">'+escapeHtml(ui.authError)+'</div>' : '') +
    (ui.authInfo && !ui.authError ? '<div class="info">'+escapeHtml(ui.authInfo)+'</div>' : '') +
    (isLogin ? '' : '<div class="field"><label class="u-label">Seu nome</label><input type="text" id="f-auth-name" placeholder="Como a banda vai te ver" required></div>') +
    (isLogin
      ? '<div class="field"><label class="u-label">E-mail ou usuário</label><input type="text" id="f-auth-email" required autocomplete="username" autocapitalize="off" spellcheck="false"></div>'
      : '<div class="field"><label class="u-label">E-mail</label><input type="email" id="f-auth-email" required autocomplete="email"></div>') +
    '<div class="field"><label class="u-label">Senha</label><input type="password" id="f-auth-pass" required minlength="6" autocomplete="'+(isLogin?'current-password':'new-password')+'"></div>' +
    '<button type="submit" class="btn btn-primary btn-block" '+(ui.authBusy?'disabled':'')+'>' +
    (ui.authBusy ? 'Só um instante…' : (isLogin ? 'Entrar' : 'Criar conta')) + '</button>' +
    '</form></div></div>';
}

/* ============================================================
   TOPBAR
   ============================================================ */
function renderTopbar(band, mode){
  var crumb;
  if(mode === 'admin'){
    crumb = '<button class="iconbtn" data-action="close-admin" aria-label="Voltar para minhas bandas">'+icon('back')+'</button>' +
      '<div class="crumb"><span class="name">'+icon('shield')+' Administração</span></div>';
  } else if(!band){
    crumb = '<div class="crumb"><span class="brand"><span class="dot"></span>GigTrack</span></div>';
  } else {
    crumb = '<button class="iconbtn" data-action="go-home" aria-label="Voltar para minhas bandas">'+icon('back')+'</button>' +
      '<div class="crumb">' +
      (bandLogoUrl(band) ? '<img src="'+bandLogoUrl(band)+'" alt="">' : '') +
      '<span class="name">'+escapeHtml(band.name)+'</span></div>';
  }
  var who = profile ? '<span class="userchip"><span class="uname">'+escapeHtml(profile.display_name||'')+'</span>'+
    (isAdmin && mode !== 'admin' ? (function(){ var pc=(cache.adminUsers||[]).filter(function(u){return !u.approved;}).length;
      return '<button class="iconbtn has-count" data-action="open-admin" aria-label="Administração'+(pc?' — '+pc+' conta(s) aguardando liberação':'')+'" title="Administração">'+icon('shield')+(pc?'<span class="count">'+pc+'</span>':'')+'</button>'; })() : '') +
    '<button class="iconbtn" data-action="open-account" aria-label="Minha conta" title="Minha conta">'+icon('key')+'</button>' +
    '<button class="iconbtn" data-action="logout" aria-label="Sair da conta" title="Sair">'+icon('logout')+'</button></span>' : '';
  return '<header class="topbar">' + crumb + '<span class="spacer"></span>' + who + '</header>';
}
function bandLogoUrl(band){
  return band.logo_path ? (cache.signedUrls[band.logo_path] || '') : '';
}

/* ---------- Band list ---------- */
function renderBandList(){
  var cards = cache.bands.map(function(b){
    var songCount = cache.songs.filter(function(s){return s.band_id===b.id;}).length;
    return '<div class="bandcard" data-action="open-band" data-id="'+b.id+'" tabindex="0" role="button">' +
      '<div class="logo">' + (bandLogoUrl(b) ? '<img src="'+bandLogoUrl(b)+'" alt="" style="width:100%;height:100%;object-fit:cover;">' : icon('band')) + '</div>' +
      '<div class="bname">'+escapeHtml(b.name)+'</div>' +
      '<div class="meta">'+(b.role==='owner'?'Dono':'Integrante')+'</div>' +
      '</div>';
  }).join('');
  return '<div class="hero"><h1>Suas bandas</h1><p>Escolha uma banda para gerenciar o repertório e montar o setlist do próximo show, crie uma nova ou entre em uma existente com um código de convite.</p></div>' +
    '<div class="toolbar bandlist-tools"><span class="spacer"></span>' +
    '<button class="btn" data-action="open-join-band">'+icon('users')+'Entrar com código</button>' +
    '<button class="btn btn-primary" data-action="new-band">'+icon('plus')+'Nova banda</button></div>' +
    '<div class="bandgrid">' + cards + '</div>';
}

/* ---------- Band home (tabs) ---------- */
function renderBandHome(band){
  var tabs = '<div class="tabs">' +
    '<button class="tab'+(ui.tab==='songs'?' active':'')+'" data-action="tab" data-tab="songs">Músicas</button>' +
    '<button class="tab'+(ui.tab==='shows'?' active':'')+'" data-action="tab" data-tab="shows">Shows</button>' +
    '<button class="tab'+(ui.tab==='band'?' active':'')+'" data-action="tab" data-tab="band">Banda</button>' +
    '</div>';
  var content = ui.tab==='shows' ? renderShowsTab(band) : (ui.tab==='band' ? renderBandTab(band) : renderSongsTab(band));
  return tabs + content;
}

function bandSongs(bandId){ return cache.songs.filter(function(s){ return s.band_id===bandId; }); }
function bandShows(bandId){ return cache.shows.filter(function(s){ return s.band_id===bandId; }); }

function renderSongsTab(band){
  var songs = bandSongs(band.id);
  var q = (ui.search||'').toLowerCase();
  if(q) songs = songs.filter(function(sg){
    return (sg.name||'').toLowerCase().indexOf(q)>-1 || (sg.artist||'').toLowerCase().indexOf(q)>-1;
  });
  var toolbar = '<div class="toolbar">' +
    '<div class="search">'+icon('search')+'<input type="text" placeholder="Buscar música ou artista" value="'+escapeHtml(ui.search||'')+'" data-action="search" aria-label="Buscar música"></div>' +
    '<button class="btn" data-action="open-public-lib">'+icon('globe')+'Músicas públicas</button>' +
    '<button class="btn btn-primary" data-action="new-song">'+icon('plus')+'Nova música</button>' +
    '</div>';
  if(!songs.length){
    return toolbar + '<div class="empty">'+icon('music') +
      '<p>'+(q ? 'Nenhuma música encontrada para "'+escapeHtml(ui.search)+'".' : 'Nenhuma música cadastrada ainda.') + '</p></div>';
  }
  var rows = songs.map(function(sg){
    var links = '';
    if(sg.youtube_url) links += '<a class="pill" href="'+escapeHtml(sg.youtube_url)+'" target="_blank" rel="noopener">'+icon('youtube')+'YouTube</a>';
    if(sg.spotify_url) links += '<a class="pill" href="'+escapeHtml(sg.spotify_url)+'" target="_blank" rel="noopener">'+icon('spotify')+'Spotify</a>';
    if(sg.sheet_path) links += '<a class="pill" href="#" data-action="open-sheet" data-path="'+escapeHtml(sg.sheet_path)+'">'+icon('file')+escapeHtml(sg.sheet_name||'Cifra')+'</a>';
    if(sg.chord_source_url) links += '<a class="pill pill-cifraclub" href="'+escapeHtml(sg.chord_source_url)+'" target="_blank" rel="noopener">'+icon('external')+'Cifra Club</a>';
    if(sg.chord_sheet) links += '<a class="pill" href="#" data-action="open-chords" data-id="'+sg.id+'">'+icon('music')+'Cifra'+(sg.chord_key?' · '+escapeHtml(sg.chord_key):'')+'</a>';
    if(sg.comment) links += '<span class="pill">'+icon('comment')+'Nota</span>';
    if(sg.is_public) links += '<span class="pill pill-public">'+icon('globe')+'Pública</span>';
    return '<div class="songrow">' +
      '<div class="keybadge">'+escapeHtml(sg.song_key||'—')+'</div>' +
      '<div class="info"><div class="title">'+escapeHtml(sg.name)+'</div>' +
      '<div class="sub"><span class="dur mono">'+fmtDuration(sg.duration_sec)+'</span>'+escapeHtml(sg.artist||'Artista não informado')+'</div>' +
      (links ? '<div class="links">'+links+'</div>' : '') + '</div>' +
      '<div class="rowactions"><button class="iconbtn" data-action="open-chords" data-id="'+sg.id+'" aria-label="Cifra" title="Cifra">'+icon('music')+'</button>' +
      '<button class="iconbtn" data-action="copy-song" data-id="'+sg.id+'" aria-label="Copiar para outra banda" title="Copiar para outra banda">'+icon('copy')+'</button>' +
      '<button class="iconbtn" data-action="edit-song" data-id="'+sg.id+'" aria-label="Editar música">'+icon('edit')+'</button>' +
      '<button class="iconbtn btn-danger" data-action="delete-song" data-id="'+sg.id+'" aria-label="Excluir música">'+icon('trash')+'</button></div>' +
      '</div>';
  }).join('');
  return toolbar + '<div class="songlist">' + rows + '</div>';
}

function renderShowsTab(band){
  var shows = bandShows(band.id).slice().sort(function(a,b){ return (a.show_date||'9999').localeCompare(b.show_date||'9999'); });
  var toolbar = '<div class="toolbar"><span class="spacer"></span>' +
    '<button class="btn btn-primary" data-action="new-show">'+icon('plus')+'Novo show</button></div>';
  if(!shows.length){
    return toolbar + '<div class="empty">'+icon('calendar')+'<p>Nenhum show cadastrado ainda.</p></div>';
  }
  var cards = shows.map(function(sh){
    var db = fmtDateBox(sh.show_date);
    var n = (cache.showSongs[sh.id]||[]).length;
    return '<div class="showcard" data-action="open-show" data-id="'+sh.id+'">' +
      '<div class="datebox"><span class="d">'+db.d+'</span><span class="m">'+db.m+'</span></div>' +
      '<div class="sinfo"><div class="sname">'+escapeHtml(sh.name||'Show sem nome')+'</div>' +
      '<div class="svenue">'+escapeHtml(sh.venue||'Local a definir')+'</div></div>' +
      '<div class="scount mono">'+n+' faixas</div>' +
      '</div>';
  }).join('');
  return toolbar + '<div class="showlist">' + cards + '</div>';
}

function renderBandTab(band){
  var members = cache.members.filter(function(m){ return m.band_id===band.id; });
  var isOwner = members.some(function(m){ return m.user_id===session.user.id && m.role==='owner'; });
  var memberRows = members.map(function(m){
    return '<div class="memberrow"><span>'+escapeHtml(m.display_name||'—')+(m.user_id===session.user.id?' (você)':'')+'</span>' +
      (m.role==='owner' ? '<span class="badge-owner">Dono</span>' :
       (isOwner ? '<button class="iconbtn btn-danger" data-action="remove-member" data-id="'+m.user_id+'" aria-label="Remover integrante">'+icon('close')+'</button>' : '')) +
      '</div>';
  }).join('');
  return '<div class="modal-body" style="padding:0;max-width:460px;">' +
    '<div class="field"><label class="u-label">Nome da banda</label>' +
    '<input type="text" value="'+escapeHtml(band.name)+'" id="band-name-input"></div>' +
    '<div class="field"><label class="u-label">Logo</label><div class="logoupload">' +
    '<div class="preview">'+(bandLogoUrl(band) ? '<img src="'+bandLogoUrl(band)+'" alt="" style="width:100%;height:100%;object-fit:cover;">' : icon('band'))+'</div>' +
    '<label class="btn">'+icon('upload')+'Trocar logo<input type="file" accept="image/*" style="display:none" id="band-logo-input"></label>' +
    '</div><div class="hint">PNG ou JPG. A imagem é redimensionada automaticamente.</div></div>' +
    '<button class="btn btn-primary" data-action="save-band-name" style="align-self:flex-start;">'+icon('check')+'Salvar nome</button>' +
    '<div class="field"><label class="u-label">Integrantes com acesso</label><div class="memberlist">'+memberRows+'</div></div>' +
    '<div class="field"><label class="u-label">Convidar alguém</label>' +
    '<button class="btn" data-action="gen-invite" data-id="'+band.id+'">'+icon('users')+'Gerar código de convite</button>' +
    (ui.lastInviteCode ? '<div class="invitebox" style="margin-top:.6rem;"><span class="code mono">'+escapeHtml(ui.lastInviteCode)+'</span>' +
      '<button class="iconbtn" data-action="copy-invite" aria-label="Copiar código">'+icon('copy')+'</button></div>' +
      '<div class="hint">Compartilhe esse código com quem você quer que entre na banda.</div>' : '') + '</div>' +
    '<div class="field" style="border-top:1px solid var(--border);padding-top:1rem;">' +
    (isOwner ?
      '<button class="btn btn-danger" data-action="delete-band" data-id="'+band.id+'">'+icon('trash')+'Excluir banda</button>' :
      '<button class="btn btn-danger" data-action="leave-band" data-id="'+band.id+'">'+icon('logout')+'Sair da banda</button>') +
    '</div>' +
    '</div>';
}

/* ---------- Show editor ---------- */
function renderShowEditor(band, show){
  var catalog = bandSongs(band.id);
  var setRows = cache.showSongs[show.id] || [];
  var setSongs = setRows.map(function(r){ return Object.assign({_rowId:r.id}, r.songs); });
  var totalSec = setSongs.reduce(function(a,sg){ return a + (sg.duration_sec||0); }, 0);
  var q = (ui.search||'').toLowerCase();
  var usedIds = setRows.map(function(r){ return r.song_id; });
  var avail = catalog.filter(function(sg){
    if(usedIds.indexOf(sg.id)>-1) return false;
    if(!q) return true;
    return (sg.name||'').toLowerCase().indexOf(q)>-1 || (sg.artist||'').toLowerCase().indexOf(q)>-1;
  });

  var head = '<div class="toolbar showhead">' +
    '<div class="showtitle"><button class="iconbtn" data-action="close-show" aria-label="Voltar para shows">'+icon('back')+'</button>' +
    '<h2>'+escapeHtml(show.name||'Show sem nome')+'</h2></div>' +
    '<div class="showbtns"><button class="btn" data-action="edit-show">'+icon('edit')+'Editar show</button>' +
    '<button class="btn btn-primary" data-action="export-pdf" data-id="'+show.id+'">'+icon('pdf')+'Gerar PDF</button></div>' +
    '</div>' +
    '<div class="showmeta"><span>'+icon('calendar')+' <strong>'+fmtDateLong(show.show_date)+'</strong></span>' +
    '<span>'+escapeHtml(show.venue||'Local a definir')+'</span></div>';

  var availRows = avail.map(function(sg){
    return '<div class="catrow"><div class="ct">'+escapeHtml(sg.name)+' <span style="color:var(--ink-faint);">— '+escapeHtml(sg.artist||'')+'</span></div>' +
      '<div class="cd mono">'+fmtDuration(sg.duration_sec)+'</div>' +
      '<button class="iconbtn" data-action="add-to-set" data-id="'+sg.id+'" aria-label="Adicionar ao setlist">'+icon('plus')+'</button>' +
      '</div>';
  }).join('') || '<p class="hint">Nenhuma música disponível'+(q?' para essa busca':' — cadastre músicas na aba Músicas')+'.</p>';

  var rowsHtml = setSongs.map(function(sg, idx){
    return '<div class="setrow"><div class="num">'+(idx+1)+'</div>' +
      '<div><div class="st">'+escapeHtml(sg.name)+'</div>' +
      '<div class="ss">'+escapeHtml(sg.artist||'')+(sg.song_key?' · Tom '+escapeHtml(sg.song_key):'')+'</div>' +
      (sg.chord_source_url ? '<a class="pill pill-cifraclub setlink" href="'+escapeHtml(sg.chord_source_url)+'" target="_blank" rel="noopener">'+icon('external')+'Cifra Club</a>' : '') +
      '</div>' +
      '<div class="setright">' +
      '<span class="sd mono">'+fmtDuration(sg.duration_sec)+'</span>' +
      '<div class="setctrls">' +
      '<button class="iconbtn" data-action="open-chords" data-id="'+sg.id+'" aria-label="Cifra" title="'+(sg.chord_sheet?'Ver cifra':'Adicionar cifra')+'"'+(sg.chord_sheet?' style="color:var(--accent)"':'')+'>'+icon('music')+'</button>' +
      '<button class="iconbtn" data-action="set-move-up" data-idx="'+idx+'" aria-label="Mover para cima" '+(idx===0?'disabled':'')+'>'+icon('up')+'</button>' +
      '<button class="iconbtn" data-action="set-move-down" data-idx="'+idx+'" aria-label="Mover para baixo" '+(idx===setSongs.length-1?'disabled':'')+'>'+icon('down')+'</button>' +
      '<button class="iconbtn btn-danger" data-action="set-remove" data-rowid="'+sg._rowId+'" aria-label="Remover do setlist">'+icon('close')+'</button>' +
      '</div></div></div>';
  }).join('') || '<div class="empty" style="padding:1.5rem 1rem;">'+icon('music')+'<p>Adicione músicas do catálogo ao lado.</p></div>';

  return head + '<div class="editorwrap">' +
    '<div class="pane"><div class="panehead"><h3>Catálogo</h3></div>' +
    '<div class="search" style="margin-bottom:.6rem;">'+icon('search')+'<input type="text" placeholder="Buscar" value="'+escapeHtml(ui.search||'')+'" data-action="search" aria-label="Buscar no catálogo"></div>' +
    '<div class="catlist">' + availRows + '</div></div>' +
    '<div class="pane"><div class="panehead"><h3>Ordem do setlist</h3></div>' +
    '<div class="setlist">' + rowsHtml + '</div></div>' +
    '</div>' +
    '<div class="summarybar"><div><div class="sb-label">Faixas</div><div class="sb-value">'+setSongs.length+'</div></div>' +
    '<div><div class="sb-label">Tempo total</div><div class="sb-value">'+fmtDuration(totalSec)+'</div></div>' +
    '<span class="spacer"></span></div>';
}

/* ============================================================
   MODALS
   ============================================================ */
function renderModal(){
  var m = ui.modal;
  if(!m) return '';
  if(m.type==='new-band') return modalWrap('Nova banda', bandFormBody(), 'save-new-band');
  if(m.type==='join-band') return modalWrap('Entrar com código', joinBandBody(), 'save-join-band');
  if(m.type==='song') return modalWrap(m.songId ? 'Editar música' : 'Nova música', songFormBody(m.songId ? getSong(m.songId) : null), m.songId ? 'save-song-edit' : 'save-song-new', m.songId);
  if(m.type==='show') return modalWrap(m.showId ? 'Editar show' : 'Novo show', showFormBody(m.showId ? getShow(m.showId) : null), m.showId ? 'save-show-edit' : 'save-show-new', m.showId);
  if(m.type==='confirm') return confirmWrap(m);
  if(m.type==='account') return modalWrap('Minha conta', accountBody(), 'save-account', null, 'Trocar senha');
  if(m.type==='reset-pw'){
    var ru = (cache.adminUsers||[]).find(function(x){ return x.id===m.userId; });
    return ru ? modalWrap('Redefinir senha', resetPwBody(ru), 'save-reset-pw', m.userId, 'Redefinir') : '';
  }
  if(m.type==='reset-done') return resetDoneWrap(m);
  if(m.type==='copy-song'){
    var cs = getSong(m.songId);
    var hasOthers = cache.bands.some(function(b){ return cs && b.id !== cs.band_id; });
    return cs ? modalWrap('Copiar para outra banda', copySongBody(cs), hasOthers ? 'save-copy-song' : 'close-modal', m.songId, hasOthers ? 'Copiar' : 'OK') : '';
  }
  if(m.type==='public-lib') return publicLibWrap(m);
  return '';
}
function getSong(id){ return cache.songs.find(function(s){ return s.id===id; }); }
function getShow(id){ return cache.shows.find(function(s){ return s.id===id; }); }

function modalWrap(title, bodyHtml, saveAction, entityId, saveLabel){
  return '<div class="modal-backdrop" data-action="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="'+escapeHtml(title)+'">' +
    '<div class="modal-head"><h2>'+escapeHtml(title)+'</h2>' +
    '<button class="iconbtn" data-action="close-modal" aria-label="Fechar">'+icon('close')+'</button></div>' +
    '<form id="modal-form">' +
    '<div class="modal-body">' + bodyHtml + '</div>' +
    '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancelar</button>' +
    '<button type="submit" class="btn btn-primary" data-action="'+saveAction+'" '+(entityId?'data-id="'+entityId+'"':'')+' '+(ui.busy?'disabled':'')+'>'+icon('check')+(ui.busy?'Salvando…':(saveLabel||'Salvar'))+'</button></div>' +
    '</form></div></div>';
}

function bandFormBody(){
  return '<div class="field"><label class="u-label">Nome da banda *</label>' +
    '<input type="text" id="f-band-name" required placeholder="Ex: Fogo Cruzado"></div>' +
    '<div class="field"><label class="u-label">Logo</label><div class="logoupload">' +
    '<div class="preview" id="f-band-logo-preview">'+icon('band')+'</div>' +
    '<label class="btn">'+icon('upload')+'Escolher imagem<input type="file" accept="image/*" style="display:none" id="f-band-logo"></label>' +
    '</div></div>';
}
function joinBandBody(){
  return '<div class="field"><label class="u-label">Código de convite *</label>' +
    '<input type="text" id="f-join-code" required placeholder="Ex: A1B2C3" style="text-transform:uppercase;letter-spacing:.1em;"></div>' +
    '<div class="field hint">Peça o código para quem já está na banda (aba Banda → Convidar alguém).</div>';
}

function songFormBody(song){
  song = song || {};
  var min = Math.floor((song.duration_sec||0)/60), sec = (song.duration_sec||0)%60;
  var sheetLabel = song.sheet_name || null;
  var cifraUrl = song.chord_source_url || '';
  return '<div class="field"><label class="u-label" for="f-song-cifra-url">Link do Cifra Club</label>' +
    '<div class="cifraimport"><input type="text" id="f-song-cifra-url" inputmode="url" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="https://www.cifraclub.com.br/artista/musica/" value="'+escapeHtml(cifraUrl)+'">' +
    '<a class="btn" id="f-song-cifra-open" target="_blank" rel="noopener" href="'+escapeHtml(cifraUrl||'#')+'"'+(cifraUrl?'':' hidden')+'>'+icon('external')+'Abrir</a></div>' +
    '<div class="hint" id="f-song-cifra-status">Cole o link da música no Cifra Club. Ele vira um atalho na lista de músicas e no setlist.</div></div>' +
    '<div class="field"><label class="u-label">Nome da música *</label>' +
    '<input type="text" id="f-song-name" required value="'+escapeHtml(song.name||'')+'"></div>' +
    '<div class="row2"><div class="field"><label class="u-label">Banda / artista original</label>' +
    '<input type="text" id="f-song-artist" placeholder="Ex: Legião Urbana" value="'+escapeHtml(song.artist||'')+'"></div>' +
    '<div class="field"><label class="u-label">Tom</label>' +
    '<input type="text" id="f-song-key" list="tom-options" placeholder="Ex: G, Am, D#" value="'+escapeHtml(song.song_key||'')+'">' +
    '<datalist id="tom-options">'+['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','Cm','C#m','Dm','D#m','Em','Fm','F#m','Gm','G#m','Am','A#m','Bm'].map(function(k){return '<option value="'+k+'">';}).join('')+'</datalist></div></div>' +
    '<div class="field"><label class="u-label">Duração</label><div class="durfields">' +
    '<input type="number" id="f-song-min" min="0" max="59" value="'+min+'" aria-label="Minutos"><span>min</span>' +
    '<input type="number" id="f-song-sec" min="0" max="59" value="'+sec+'" aria-label="Segundos"><span>seg</span></div></div>' +
    '<div class="row2"><div class="field"><label class="u-label">Link do YouTube</label>' +
    '<input type="url" id="f-song-youtube" placeholder="https://youtube.com/..." value="'+escapeHtml(song.youtube_url||'')+'"></div>' +
    '<div class="field"><label class="u-label">Link do Spotify</label>' +
    '<input type="url" id="f-song-spotify" placeholder="https://open.spotify.com/..." value="'+escapeHtml(song.spotify_url||'')+'"></div></div>' +
    '<div class="field"><label class="u-label">Arquivo de cifra ou partitura (opcional)</label>' +
    '<label class="filedrop" id="f-song-sheet-label">' + icon('upload') +
    '<div class="fname" id="f-song-sheet-name">'+(sheetLabel ? escapeHtml(sheetLabel)+' (trocar arquivo)' : 'Toque para enviar .txt, .pdf ou .docx')+'</div>' +
    '<input type="file" accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="display:none" id="f-song-sheet"></label>' +
    '<div class="hint">Máximo de 10 MB por arquivo.</div></div>' +
    '<label class="checkrow switchrow"><input type="checkbox" id="f-song-public"'+(song.is_public?' checked':'')+'>' +
    '<span><strong>Música pública</strong><br><span class="hint" style="margin:0;">Outros usuários do GigTrack podem ver e copiar esta música (sem o comentário e sem o arquivo anexo).</span></span></label>' +
    '<div class="field"><label class="u-label">Comentário</label>' +
    '<textarea id="f-song-comment" placeholder="Observações de arranjo, intro, quem canta...">'+escapeHtml(song.comment||'')+'</textarea></div>';
}

function showFormBody(show){
  show = show || {};
  return '<div class="field"><label class="u-label">Nome do show *</label>' +
    '<input type="text" id="f-show-name" required placeholder="Ex: Aniversário da cidade" value="'+escapeHtml(show.name||'')+'"></div>' +
    '<div class="row2"><div class="field"><label class="u-label">Data</label>' +
    '<input type="date" id="f-show-date" value="'+escapeHtml(show.show_date||'')+'"></div>' +
    '<div class="field"><label class="u-label">Local</label>' +
    '<input type="text" id="f-show-venue" placeholder="Ex: Bar do Zé" value="'+escapeHtml(show.venue||'')+'"></div></div>' +
    '<div class="field"><label class="u-label">Observações</label>' +
    '<textarea id="f-show-notes" placeholder="Horário de chegada, passagem de som...">'+escapeHtml(show.notes||'')+'</textarea></div>';
}

function confirmWrap(m){
  return '<div class="modal-backdrop" data-action="modal-backdrop"><div class="modal confirmbox" role="alertdialog" aria-modal="true">' +
    '<div class="modal-head"><h2>'+escapeHtml(m.title)+'</h2>' +
    '<button class="iconbtn" data-action="close-modal" aria-label="Fechar">'+icon('close')+'</button></div>' +
    '<div class="modal-body"><p>'+escapeHtml(m.message)+'</p></div>' +
    '<div class="modal-foot"><button class="btn" data-action="close-modal">Cancelar</button>' +
    '<button class="btn btn-danger" data-action="confirm-yes">'+icon('trash')+(m.confirmLabel||'Excluir')+'</button></div>' +
    '</div></div>';
}

/* ============================================================
   DATA LOADING
   ============================================================ */
async function loadProfile(){
  var { data, error } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
  if(error){ toast('Não consegui carregar seu perfil: '+errMsg(error), true); return; }
  profile = data || { id: session.user.id, display_name: session.user.email.split('@')[0] };
  var adm = await sb.rpc('is_app_admin');
  isAdmin = !adm.error && adm.data === true;
  if(isAdmin) await loadAdminUsers();
}

async function loadBands(){
  var { data, error } = await sb.from('bands').select('*').order('name');
  if(error){ toast('Não consegui carregar as bandas: '+errMsg(error), true); cache.bands = []; return; }
  cache.bands = data || [];
  var { data: mdata } = await sb.from('band_members').select('band_id,user_id,role,profiles(display_name)');
  cache.members = (mdata||[]).map(function(m){ return { band_id:m.band_id, user_id:m.user_id, role:m.role, display_name: m.profiles && m.profiles.display_name }; });
  cache.bands = cache.bands.map(function(b){
    var mine = cache.members.find(function(m){ return m.band_id===b.id && m.user_id===session.user.id; });
    return Object.assign({}, b, { role: mine ? mine.role : 'editor' });
  });
  await prefetchSignedUrls(cache.bands.filter(function(b){return b.logo_path;}).map(function(b){return b.logo_path;}));
}

async function loadBandData(bandId){
  var [{data: songs, error: e1}, {data: shows, error: e2}] = await Promise.all([
    sb.from('songs').select('*').eq('band_id', bandId).order('name'),
    sb.from('shows').select('*').eq('band_id', bandId).order('show_date', {ascending:true, nullsFirst:false})
  ]);
  if(e1) toast('Erro ao carregar músicas: '+errMsg(e1), true);
  if(e2) toast('Erro ao carregar shows: '+errMsg(e2), true);
  cache.songs = cache.songs.filter(function(s){return s.band_id!==bandId;}).concat(songs||[]);
  cache.shows = cache.shows.filter(function(s){return s.band_id!==bandId;}).concat(shows||[]);
  var sheetPaths = (songs||[]).filter(function(s){return s.sheet_path;}).map(function(s){return s.sheet_path;});
  await prefetchSignedUrls(sheetPaths);
  for(var i=0;i<(shows||[]).length;i++){ await loadShowSongs(shows[i].id); }
}

async function loadShowSongs(showId){
  var { data, error } = await sb.from('show_songs').select('id,position,song_id,songs(*)').eq('show_id', showId).order('position');
  if(error){ toast('Erro ao carregar setlist: '+errMsg(error), true); return; }
  cache.showSongs[showId] = data || [];
}

async function prefetchSignedUrls(paths){
  var todo = (paths||[]).filter(function(p){ return p && !cache.signedUrls[p]; });
  if(!todo.length) return;
  await Promise.all(todo.map(async function(p){
    try {
      var { data, error } = await sb.storage.from('band-files').createSignedUrl(p, 21600);
      if(!error && data) cache.signedUrls[p] = data.signedUrl;
    } catch(e){}
  }));
}

/* ============================================================
   AUTH ACTIONS
   ============================================================ */
async function doLogin(email, pass){
  ui.authInfo = '';
  // usuários sem e-mail (ex.: gigadmin) entram pelo nome de usuário
  if(email && email.indexOf('@') < 0) email = email.trim().toLowerCase() + '@gigtrack.com.br';
  ui.authBusy = true; ui.authError=''; render();
  var { error } = await sb.auth.signInWithPassword({ email: email, password: pass });
  ui.authBusy = false;
  if(error){ ui.authError = translateAuthError(error); render(); return; }
  // onAuthStateChange handles the rest
}
async function doSignup(email, pass, name){
  ui.authBusy = true; ui.authError=''; render();
  var { data, error } = await sb.auth.signUp({ email: email, password: pass, options: { data: { display_name: name }, emailRedirectTo: window.location.origin + '/' } });
  ui.authBusy = false;
  if(error){ ui.authError = translateAuthError(error); render(); return; }
  if(data && data.user && !data.session){
    ui.authError = '';
    ui.authTab = 'login';
    ui.authInfo = 'Conta criada! Um administrador do GigTrack precisa liberar seu acesso. Depois disso, é só entrar com seu e-mail e senha.';
    render();
    return;
  }
}
function translateAuthError(error){
  var msg = errMsg(error);
  if(/invalid login credentials/i.test(msg)) return 'Usuário/e-mail ou senha incorretos.';
  if(/user already registered/i.test(msg)) return 'Já existe uma conta com esse e-mail.';
  if(/password should be at least/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if(/email not confirmed/i.test(msg)) return 'Sua conta foi criada e está aguardando a liberação de um administrador do GigTrack. Tente de novo depois que ela for liberada.';
  return msg;
}
async function doLogout(){
  await sb.auth.signOut();
}

/* ============================================================
   BAND ACTIONS
   ============================================================ */
async function saveNewBand(){
  var name = document.getElementById('f-band-name').value.trim();
  if(!name) return;
  ui.busy = true; render();
  var { data, error } = await sb.rpc('create_band', { p_name: name });
  if(error){ ui.busy=false; toast('Não consegui criar a banda: '+errMsg(error), true); render(); return; }
  if(pendingLogoFile){
    try {
      var path = await uploadFile(data.id, 'logos', pendingLogoFile);
      await sb.from('bands').update({logo_path: path}).eq('id', data.id);
    } catch(e){ toast('Banda criada, mas o logo não pôde ser enviado: '+errMsg(e), true); }
  }
  ui.busy = false; ui.modal = null; pendingLogoFile = null;
  await loadBands();
  ui.bandId = data.id; ui.tab = 'songs'; stashNav();
  render();
  toast('Banda criada!');
}

async function saveJoinBand(){
  var code = document.getElementById('f-join-code').value.trim();
  if(!code) return;
  ui.busy = true; render();
  var { data, error } = await sb.rpc('join_band_with_code', { p_code: code });
  ui.busy = false;
  if(error){ toast('Não consegui entrar: '+errMsg(error), true); render(); return; }
  ui.modal = null;
  await loadBands();
  ui.bandId = data.id; ui.tab = 'songs'; stashNav();
  render();
  toast('Você entrou na banda '+data.name+'!');
}

async function saveBandName(){
  var input = document.getElementById('band-name-input');
  if(!input) return;
  var name = input.value.trim();
  if(!name) return;
  var { error } = await sb.from('bands').update({name:name}).eq('id', ui.bandId);
  if(error){ toast('Não consegui salvar: '+errMsg(error), true); return; }
  await loadBands();
  render();
  toast('Nome da banda atualizado.');
}

async function applyBandLogo(file){
  try {
    var resized = await resizeImageFile(file, 480);
    var path = await uploadFile(ui.bandId, 'logos', resized);
    await sb.from('bands').update({logo_path: path}).eq('id', ui.bandId);
    delete cache.signedUrls[path];
    await prefetchSignedUrls([path]);
    await loadBands();
    render();
    toast('Logo atualizado.');
  } catch(e){ toast('Não consegui enviar o logo: '+errMsg(e), true); }
}

async function genInvite(bandId){
  var { data, error } = await sb.rpc('create_invite_code', { p_band_id: bandId });
  if(error){ toast('Não consegui gerar o código: '+errMsg(error), true); return; }
  ui.lastInviteCode = data;
  render();
}

async function removeMember(bandId, userId){
  var { error } = await sb.from('band_members').delete().eq('band_id', bandId).eq('user_id', userId);
  if(error){ toast('Não consegui remover: '+errMsg(error), true); return; }
  await loadBands();
  render();
  toast('Integrante removido.');
}

async function leaveBand(bandId){
  var { error } = await sb.from('band_members').delete().eq('band_id', bandId).eq('user_id', session.user.id);
  if(error){ toast('Não consegui sair da banda: '+errMsg(error), true); return; }
  ui.bandId = null; stashNav();
  await loadBands();
  render();
  toast('Você saiu da banda.');
}

async function deleteBand(bandId){
  var { error } = await sb.from('bands').delete().eq('id', bandId);
  if(error){ toast('Não consegui excluir: '+errMsg(error), true); return; }
  ui.bandId = null; stashNav();
  await loadBands();
  render();
  toast('Banda excluída.');
}

/* ============================================================
   SONG ACTIONS
   ============================================================ */
function readSongForm(){
  return {
    name: document.getElementById('f-song-name').value.trim(),
    artist: document.getElementById('f-song-artist').value.trim(),
    song_key: document.getElementById('f-song-key').value.trim(),
    duration_sec: (parseInt(document.getElementById('f-song-min').value,10)||0)*60 + (parseInt(document.getElementById('f-song-sec').value,10)||0),
    youtube_url: document.getElementById('f-song-youtube').value.trim(),
    spotify_url: document.getElementById('f-song-spotify').value.trim(),
    comment: document.getElementById('f-song-comment').value.trim(),
    chord_source_url: normalizeCifraUrl(document.getElementById('f-song-cifra-url').value),
    is_public: !!(document.getElementById('f-song-public')||{}).checked
  };
}


/* ============================================================
   CIFRAS (Cifra Club / editor / transposição) — ver cifra-ui.js
   ============================================================ */
/** Normaliza o link do Cifra Club: aceita sem https, remove espaços. Devolve '' se vazio, null se inválido. */
function normalizeCifraUrl(raw){
  var v = (raw||'').trim();
  if(!v) return '';
  if(!/^https?:\/\//i.test(v)) v = 'https://' + v.replace(/^\/+/, '');
  try {
    var u = new URL(v);
    if(!/(^|\.)cifraclub\.com(\.br)?$/i.test(u.hostname)) return null;
    u.protocol = 'https:';
    return u.toString();
  } catch(e){ return null; }
}

function findSongAnywhere(id){
  var s = getSong(id);
  if(s) return s;
  for(var k in cache.showSongs){
    var r = (cache.showSongs[k]||[]).find(function(x){ return x.songs && x.songs.id===id; });
    if(r) return r.songs;
  }
  return null;
}

function openChords(id){
  var song = findSongAnywhere(id);
  if(!song || !window.CifraUI){ toast('Música não encontrada.', true); return; }
  CifraUI.open({
    song: Object.assign({}, song),
    supabase: sb,
    onSaved: function(updated){
      cache.songs = cache.songs.map(function(s){ return s.id===updated.id ? Object.assign({}, s, updated) : s; });
      for(var k in cache.showSongs){
        (cache.showSongs[k]||[]).forEach(function(r){ if(r.songs && r.songs.id===updated.id) r.songs = Object.assign({}, r.songs, updated); });
      }
      render();
    }
  });
}

async function saveNewSong(){
  var data = readSongForm();
  if(!data.name) return;
  if(data.chord_source_url === null){ toast('O link precisa ser do Cifra Club (cifraclub.com.br).', true); var cf=document.getElementById('f-song-cifra-url'); if(cf) cf.focus(); return; }
  data.chord_source_url = data.chord_source_url || null;
  ui.busy = true; render();
  data.band_id = ui.bandId;
  if(pendingSheetFile){
    try {
      var res = await uploadSheet(ui.bandId, pendingSheetFile);
      data.sheet_path = res.path; data.sheet_name = res.name;
    } catch(e){ ui.busy=false; toast('Não consegui enviar o arquivo: '+errMsg(e), true); render(); return; }
  }
  var { error } = await sb.from('songs').insert(data);
  ui.busy = false;
  if(error){ toast('Não consegui salvar a música: '+errMsg(error), true); render(); return; }
  ui.modal = null; pendingSheetFile = null;
  await loadBandData(ui.bandId);
  render();
  toast('Música adicionada.');
}

async function saveSongEdit(id){
  var data = readSongForm();
  if(!data.name) return;
  if(data.chord_source_url === null){ toast('O link precisa ser do Cifra Club (cifraclub.com.br).', true); var cf=document.getElementById('f-song-cifra-url'); if(cf) cf.focus(); return; }
  data.chord_source_url = data.chord_source_url || null;
  ui.busy = true; render();
  if(pendingSheetFile){
    try {
      var res = await uploadSheet(ui.bandId, pendingSheetFile);
      data.sheet_path = res.path; data.sheet_name = res.name;
    } catch(e){ ui.busy=false; toast('Não consegui enviar o arquivo: '+errMsg(e), true); render(); return; }
  }
  var { error } = await sb.from('songs').update(data).eq('id', id);
  ui.busy = false;
  if(error){ toast('Não consegui salvar: '+errMsg(error), true); render(); return; }
  ui.modal = null; pendingSheetFile = null;
  await loadBandData(ui.bandId);
  render();
  toast('Música atualizada.');
}

async function deleteSong(id){
  var { error } = await sb.from('songs').delete().eq('id', id);
  if(error){ toast('Não consegui excluir: '+errMsg(error), true); return; }
  ui.modal = null;
  await loadBandData(ui.bandId);
  render();
  toast('Música excluída.');
}

/* ============================================================
   SHOW ACTIONS
   ============================================================ */
function readShowForm(){
  return {
    name: document.getElementById('f-show-name').value.trim(),
    show_date: document.getElementById('f-show-date').value || null,
    venue: document.getElementById('f-show-venue').value.trim(),
    notes: document.getElementById('f-show-notes').value.trim()
  };
}

async function saveNewShow(){
  var data = readShowForm();
  if(!data.name) return;
  ui.busy = true; render();
  data.band_id = ui.bandId;
  var { data: row, error } = await sb.from('shows').insert(data).select().single();
  ui.busy = false;
  if(error){ toast('Não consegui criar o show: '+errMsg(error), true); render(); return; }
  ui.modal = null;
  await loadBandData(ui.bandId);
  ui.showId = row.id; ui.search='';
  render();
}

async function saveShowEdit(id){
  var data = readShowForm();
  if(!data.name) return;
  var { error } = await sb.from('shows').update(data).eq('id', id);
  if(error){ toast('Não consegui salvar: '+errMsg(error), true); return; }
  ui.modal = null;
  await loadBandData(ui.bandId);
  render();
  toast('Show atualizado.');
}

async function deleteShow(id){
  var { error } = await sb.from('shows').delete().eq('id', id);
  if(error){ toast('Não consegui excluir: '+errMsg(error), true); return; }
  ui.modal = null; ui.showId = null;
  await loadBandData(ui.bandId);
  render();
  toast('Show excluído.');
}

async function addToSetlist(showId, songId){
  var current = cache.showSongs[showId] || [];
  var nextPos = current.length ? Math.max.apply(null, current.map(function(r){return r.position;})) + 1 : 0;
  var { error } = await sb.from('show_songs').insert({ show_id: showId, song_id: songId, position: nextPos });
  if(error){ toast('Não consegui adicionar: '+errMsg(error), true); return; }
  await loadShowSongs(showId);
  render();
}

async function removeFromSetlist(rowId, showId){
  var { error } = await sb.from('show_songs').delete().eq('id', rowId);
  if(error){ toast('Não consegui remover: '+errMsg(error), true); return; }
  await loadShowSongs(showId);
  render();
}

async function moveSetlistItem(showId, idx, dir){
  var rows = (cache.showSongs[showId]||[]).slice();
  var j = idx + dir;
  if(j<0 || j>=rows.length) return;
  var a = rows[idx], b = rows[j];
  var { error } = await sb.from('show_songs').update({position: b.position}).eq('id', a.id);
  if(!error){ ({error} = await sb.from('show_songs').update({position: a.position}).eq('id', b.id)); }
  if(error){ toast('Não consegui reordenar: '+errMsg(error), true); return; }
  await loadShowSongs(showId);
  render();
}

/* ============================================================
   FILE HANDLING
   ============================================================ */
var MAX_SHEET_FILE = 10 * 1024 * 1024;
function resizeImageFile(file, maxDim){
  return new Promise(function(resolve, reject){
    var reader = new FileReader();
    reader.onload = function(e){
      var img = new Image();
      img.onload = function(){
        var w = img.width, h = img.height, scale = Math.min(1, maxDim / Math.max(w,h));
        var cw = Math.max(1, Math.round(w*scale)), ch = Math.max(1, Math.round(h*scale));
        var canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = ch;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, cw, ch);
        canvas.toBlob(function(blob){
          if(!blob){ reject(new Error('Falha ao processar imagem')); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {type:'image/jpeg'}));
        }, 'image/jpeg', 0.85);
      };
      img.onerror = function(){ reject(new Error('Não consegui abrir a imagem')); };
      img.src = e.target.result;
    };
    reader.onerror = function(){ reject(new Error('Não consegui ler o arquivo')); };
    reader.readAsDataURL(file);
  });
}
async function uploadFile(bandId, subfolder, file){
  var ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  var path = bandId + '/' + subfolder + '/' + uid() + '.' + ext;
  var { error } = await sb.storage.from('band-files').upload(path, file, { upsert:false, contentType: file.type || undefined });
  if(error) throw error;
  return path;
}
async function uploadSheet(bandId, file){
  var path = await uploadFile(bandId, 'sheets', file);
  return { path: path, name: file.name };
}
async function openSheet(path){
  await prefetchSignedUrls([path]);
  var url = cache.signedUrls[path];
  if(url) window.open(url, '_blank', 'noopener');
  else toast('Não consegui abrir esse arquivo agora.', true);
}

/* ============================================================
   PDF EXPORT
   ============================================================ */
function exportSetlistPdf(showId){
  var show = getShow(showId);
  if(!show) return;
  var band = cache.bands.find(function(b){ return b.id===show.band_id; });
  var rows = cache.showSongs[showId] || [];
  var songs = rows.map(function(r){ return r.songs; }).filter(Boolean);
  if(typeof window.jspdf === 'undefined'){
    toast('Não consegui carregar o gerador de PDF.', true);
    return;
  }
  var doc = new window.jspdf.jsPDF({ unit:'pt', format:'a4' });
  var pageW = doc.internal.pageSize.getWidth();
  var marginX = 42, y = 54;

  doc.setFont('helvetica','bold'); doc.setFontSize(22);
  doc.text((band?band.name:'Setlist').toUpperCase(), marginX, y);
  y += 24;
  doc.setFont('helvetica','normal'); doc.setFontSize(12);
  doc.text((show.name||'Show') + (show.venue ? '  ·  ' + show.venue : ''), marginX, y);
  y += 16;
  doc.setFontSize(10); doc.setTextColor(90);
  doc.text(fmtDateLong(show.show_date), marginX, y);
  doc.setTextColor(0);
  y += 18;
  doc.setDrawColor(180); doc.line(marginX, y, pageW-marginX, y);
  y += 22;

  var totalSec = songs.reduce(function(a,sg){ return a+(sg.duration_sec||0); }, 0);
  var rowH = 26;
  songs.forEach(function(sg, idx){
    if(y > 760){ doc.addPage(); y = 54; }
    doc.setFont('helvetica','bold'); doc.setFontSize(13);
    doc.text(String(idx+1).padStart(2,'0'), marginX, y);
    doc.text(sg.name || '', marginX+34, y);
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(100);
    var subtitle = [sg.artist, sg.song_key ? 'Tom '+sg.song_key : null].filter(Boolean).join('  ·  ');
    if(subtitle) doc.text(subtitle, marginX+34, y+13);
    doc.setTextColor(0);
    doc.setFont('courier','normal'); doc.setFontSize(11);
    doc.text(fmtDuration(sg.duration_sec), pageW-marginX-34, y, {align:'left'});
    doc.setDrawColor(225); doc.line(marginX, y+18, pageW-marginX, y+18);
    y += rowH;
  });

  y += 10;
  if(y > 740){ doc.addPage(); y = 54; }
  doc.setFont('helvetica','bold'); doc.setFontSize(14);
  doc.text('TEMPO TOTAL DE SHOW: ' + fmtDuration(totalSec), marginX, y);

  var filename = ((band?band.name+'_':'') + (show.name||'setlist')).replace(/[^A-Za-z0-9_-]+/g,'_') + '.pdf';
  try { doc.save(filename); toast('PDF gerado.'); }
  catch(e){ toast('Não consegui gerar o PDF: '+((e&&e.message)||e), true); }
}

/* ============================================================
   CONTA: troca de senha (própria e obrigatória após reset)
   ============================================================ */
function passwordFields(prefix){
  return '<div class="field"><label class="u-label" for="'+prefix+'-new">Nova senha</label>' +
    '<input type="password" id="'+prefix+'-new" required minlength="8" autocomplete="new-password"></div>' +
    '<div class="field"><label class="u-label" for="'+prefix+'-again">Repita a nova senha</label>' +
    '<input type="password" id="'+prefix+'-again" required minlength="8" autocomplete="new-password">' +
    '<div class="hint">Mínimo de 8 caracteres.</div></div>';
}
function renderForcePassword(){
  return '<div class="authwrap"><div class="authcard">' +
    '<div class="brand"><span class="dot"></span>GigTrack</div>' +
    '<p class="tagline">Olá, '+escapeHtml((profile&&profile.display_name)||'')+'! Sua senha foi redefinida. Crie uma senha nova para continuar.</p>' +
    '<form id="pw-form" class="authform">' +
    (ui.authError ? '<div class="err">'+escapeHtml(ui.authError)+'</div>' : '') +
    passwordFields('f-pw') +
    '<button type="submit" class="btn btn-primary btn-block" '+(ui.authBusy?'disabled':'')+'>'+(ui.authBusy?'Salvando…':'Salvar nova senha')+'</button>' +
    '<button type="button" class="btn btn-ghost btn-block" data-action="logout">Sair</button>' +
    '</form></div></div>' + '<div class="toastwrap" id="toastwrap"></div>';
}
function readPasswordPair(prefix){
  var a = (document.getElementById(prefix+'-new')||{}).value || '';
  var b = (document.getElementById(prefix+'-again')||{}).value || '';
  if(a.length < 8) return { error: 'A senha precisa ter pelo menos 8 caracteres.' };
  if(a !== b) return { error: 'As duas senhas não são iguais.' };
  return { password: a };
}
async function changeOwnPassword(prefix, forced){
  var r = readPasswordPair(prefix);
  if(r.error){ if(forced){ ui.authError = r.error; render(); } else toast(r.error, true); return; }
  if(forced){ ui.authBusy = true; ui.authError=''; render(); } else { ui.busy = true; render(); }
  var { error } = await sb.auth.updateUser({ password: r.password });
  if(!error){
    var res = await sb.from('profiles').update({ must_change_password: false }).eq('id', session.user.id);
    error = res.error;
  }
  ui.authBusy = false; ui.busy = false;
  if(error){
    var msg = /different from the old/i.test(errMsg(error)) ? 'A nova senha precisa ser diferente da atual.' : 'Não consegui trocar a senha: '+errMsg(error);
    if(forced){ ui.authError = msg; render(); } else { toast(msg, true); render(); }
    return;
  }
  if(profile) profile.must_change_password = false;
  ui.modal = null; ui.authError = '';
  if(forced){ await loadBands(); if(ui.bandId) await loadBandData(ui.bandId); }
  render();
  toast('Senha alterada.');
}
function accountBody(){
  return '<div class="field"><label class="u-label">Conta</label><div class="hint" style="margin:0;">'+
    escapeHtml((profile&&profile.display_name)||'')+' · '+escapeHtml(loginLabel(session.user.email))+(isAdmin?' · administrador':'')+'</div></div>' +
    passwordFields('f-acc');
}
function loginLabel(email){
  return /@gigtrack\.com\.br$/i.test(email||'') ? (email.split('@')[0] + ' (usuário)') : (email||'');
}

/* ============================================================
   ÁREA ADMINISTRATIVA (só grupo admins)
   ============================================================ */
async function loadAdminUsers(){
  var { data, error } = await sb.rpc('admin_list_users');
  if(error){ toast('Não consegui carregar os usuários: '+errMsg(error), true); cache.adminUsers = []; return; }
  cache.adminUsers = data || [];
}
function fmtDateTime(iso){
  if(!iso) return 'nunca';
  var d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
}
function renderAdmin(){
  var q = (ui.search||'').toLowerCase();
  var users = (cache.adminUsers||[]).filter(function(u){
    return !q || (u.email||'').toLowerCase().indexOf(q)>-1 || (u.display_name||'').toLowerCase().indexOf(q)>-1;
  });
  var total = (cache.adminUsers||[]).length, admins = (cache.adminUsers||[]).filter(function(u){return u.is_admin;}).length;
  var pending = (cache.adminUsers||[]).filter(function(u){return !u.approved;}).length;
  var rows = users.map(function(u){
    var me = u.id === session.user.id;
    return '<div class="userrow">' +
      '<div class="uinfo"><div class="uname2">'+escapeHtml(u.display_name||'—')+(me?' <span class="muted">(você)</span>':'')+'</div>' +
      '<div class="uemail">'+escapeHtml(loginLabel(u.email))+'</div>' +
      '<div class="umeta">Criado em '+fmtDateTime(u.created_at)+' · Último acesso: '+fmtDateTime(u.last_sign_in_at)+' · '+u.band_count+' banda'+(u.band_count===1?'':'s')+'</div>' +
      '<div class="ubadges">'+(u.approved?'':'<span class="badge badge-pending">Aguardando liberação</span>')+
        (u.is_admin?'<span class="badge badge-admin">'+icon('shield')+'Admin</span>':'')+
        (u.must_change_password?'<span class="badge badge-warn">Troca de senha pendente</span>':'')+'</div></div>' +
      '<div class="uactions">' +
      (u.approved ? '' : '<button class="btn btn-primary" data-action="admin-approve" data-id="'+u.id+'">'+icon('check')+'Liberar conta</button>') +
      '<button class="btn" data-action="admin-reset" data-id="'+u.id+'">'+icon('key')+'Redefinir senha</button>' +
      (me ? '' : (u.is_admin
        ? '<button class="btn btn-danger" data-action="admin-unset" data-id="'+u.id+'">'+icon('shield')+'Tirar admin</button>'
        : '<button class="btn" data-action="admin-set" data-id="'+u.id+'">'+icon('shield')+'Tornar admin</button>' +
          (u.approved ? '<button class="btn btn-danger" data-action="admin-block" data-id="'+u.id+'">'+icon('close')+'Bloquear</button>' : ''))) +
      '</div></div>';
  }).join('') || '<div class="empty"><p>Nenhum usuário encontrado.</p></div>';
  return '<div class="hero"><h1>Administração</h1><p>'+total+' usuário'+(total===1?'':'s')+' · '+admins+' administrador'+(admins===1?'':'es')+
    (pending ? ' · <strong class="pending-count">'+pending+' aguardando liberação</strong>' : '')+'. Libere contas novas, redefina senhas e gerencie quem é admin.</p></div>' +
    '<div class="toolbar"><div class="search">'+icon('search')+'<input type="text" placeholder="Buscar por nome ou e-mail" value="'+escapeHtml(ui.search||'')+'" data-action="search" aria-label="Buscar usuário"></div>' +
    '<button class="btn" data-action="admin-refresh">'+icon('users')+'Atualizar</button></div>' +
    '<div class="userlist">'+rows+'</div>';
}
function genPassword(){
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  var out = '', arr = new Uint32Array(10);
  (window.crypto||window.msCrypto).getRandomValues(arr);
  for(var i=0;i<arr.length;i++) out += chars[arr[i] % chars.length];
  return out.slice(0,4) + '-' + out.slice(4,8) + '#' + out.slice(8);
}
function resetPwBody(u){
  return '<p class="muted" style="margin:0;">Nova senha temporária para <strong>'+escapeHtml(u.display_name||u.email)+'</strong> ('+escapeHtml(loginLabel(u.email))+'). '+
    (u.id===session.user.id ? 'É a sua própria conta.' : 'A pessoa vai precisar criar uma senha nova no próximo login, e as sessões abertas dela serão encerradas.')+'</p>' +
    '<div class="field"><label class="u-label" for="f-reset-pw">Senha temporária</label>' +
    '<div class="cifraimport"><input type="text" id="f-reset-pw" required minlength="8" autocomplete="off" spellcheck="false" value="'+escapeHtml(genPassword())+'">' +
    '<button type="button" class="btn" data-action="admin-gen-pw">Gerar outra</button></div>' +
    '<div class="hint">Mínimo de 8 caracteres. Depois de salvar, copie e envie para a pessoa.</div></div>';
}
function resetDoneWrap(m){
  return '<div class="modal-backdrop" data-action="modal-backdrop"><div class="modal confirmbox" role="dialog" aria-modal="true" aria-label="Senha redefinida">' +
    '<div class="modal-head"><h2>Senha redefinida</h2><button class="iconbtn" data-action="close-modal" aria-label="Fechar">'+icon('close')+'</button></div>' +
    '<div class="modal-body"><p class="muted" style="margin:0;">Envie para <strong>'+escapeHtml(m.who)+'</strong>:</p>' +
    '<div class="invitebox"><span class="code mono" style="letter-spacing:.04em;font-size:1.1rem;">'+escapeHtml(m.password)+'</span>' +
    '<button class="iconbtn" data-action="copy-text" data-text="'+escapeHtml(m.password)+'" aria-label="Copiar senha">'+icon('copy')+'</button></div>' +
    '<div class="hint">Login: '+escapeHtml(loginLabel(m.email))+'. Essa senha não aparece de novo.</div></div>' +
    '<div class="modal-foot"><button class="btn btn-primary" data-action="close-modal">'+icon('check')+'Pronto</button></div></div></div>';
}
async function adminResetPassword(userId){
  var u = (cache.adminUsers||[]).find(function(x){ return x.id===userId; });
  var pw = (document.getElementById('f-reset-pw')||{}).value || '';
  if(pw.length < 8){ toast('A senha precisa ter pelo menos 8 caracteres.', true); return; }
  ui.busy = true; render();
  var { error } = await sb.rpc('admin_reset_password', { p_user_id: userId, p_new_password: pw });
  ui.busy = false;
  if(error){ toast('Não consegui redefinir: '+errMsg(error), true); render(); return; }
  ui.modal = { type:'reset-done', password: pw, who: (u && (u.display_name||u.email)) || '', email: u && u.email };
  await loadAdminUsers();
  render();
}
async function adminSetAdmin(userId, makeAdmin){
  var { error } = await sb.rpc('admin_set_admin', { p_user_id: userId, p_admin: makeAdmin });
  if(error){ toast(errMsg(error), true); return; }
  await loadAdminUsers();
  render();
  toast(makeAdmin ? 'Agora é administrador.' : 'Não é mais administrador.');
}
async function adminSetApproved(userId, approved){
  var { error } = await sb.rpc('admin_set_approved', { p_user_id: userId, p_approved: approved });
  if(error){ toast(errMsg(error), true); return; }
  await loadAdminUsers();
  render();
  toast(approved ? 'Conta liberada. A pessoa já pode entrar.' : 'Conta bloqueada.');
}
function renderPending(){
  return '<div class="authwrap"><div class="authcard" style="text-align:center;">' +
    '<div class="brand"><span class="dot"></span>GigTrack</div>' +
    '<h2 style="font-size:1.4rem;margin:.9rem 0 .4rem;">Conta aguardando liberação</h2>' +
    '<p class="tagline">Olá, '+escapeHtml((profile&&profile.display_name)||'')+'! Sua conta foi criada. Um administrador do GigTrack precisa liberar o acesso antes de você começar.</p>' +
    '<div class="authform"><button class="btn btn-primary btn-block" data-action="pending-recheck">'+icon('check')+'Já foi liberada? Verificar</button>' +
    '<button class="btn btn-ghost btn-block" data-action="logout">Sair</button></div>' +
    '</div></div><div class="toastwrap" id="toastwrap"></div>';
}
async function recheckApproval(){
  await loadProfile();
  if(profile && profile.approved === false && !isAdmin){ toast('Ainda não foi liberada. Tente mais tarde.'); render(); return; }
  await loadBands();
  if(ui.bandId && cache.bands.some(function(b){ return b.id===ui.bandId; })) await loadBandData(ui.bandId); else ui.bandId = null;
  ui.screen = 'band';
  render();
  toast('Conta liberada. Bem-vindo ao GigTrack!');
}
async function openAdmin(){
  if(!isAdmin) return;
  ui.screen = 'admin'; ui.showId = null; ui.search = ''; ui.modal = null;
  render();
  await loadAdminUsers();
  if(ui.screen === 'admin') render();
}

/* ============================================================
   COPIAR MÚSICA PARA OUTRAS BANDAS
   ============================================================ */
function copySongBody(song){
  var others = cache.bands.filter(function(b){ return b.id !== song.band_id; });
  if(!others.length){
    return '<p class="muted" style="margin:0;">Você só participa desta banda. Crie outra banda ou entre em uma com código de convite para copiar músicas entre elas.</p>';
  }
  var copiedIn = function(bandId){
    return cache.songs.some(function(s){ return s.band_id===bandId && (s.copied_from===song.id || (song.copied_from && s.id===song.copied_from)); });
  };
  return '<p class="muted" style="margin:0;">Copiar <strong>'+escapeHtml(song.name)+'</strong> com tom, duração, links, cifra e anexo. Cada banda fica com a sua cópia, que pode ser editada sem mexer na outra.</p>' +
    '<div class="field"><label class="u-label">Para as bandas</label><div class="checklist">' +
    others.map(function(b){
      return '<label class="checkrow"><input type="checkbox" name="copy-band" value="'+b.id+'">' +
        '<span>'+escapeHtml(b.name)+(copiedIn(b.id)?' <span class="muted">(já tem uma cópia)</span>':'')+'</span></label>';
    }).join('') + '</div></div>';
}
async function copySongToBands(songId){
  var song = getSong(songId);
  var targets = [].map.call(document.querySelectorAll('input[name="copy-band"]:checked'), function(i){ return i.value; });
  if(!song || !targets.length){ toast('Escolha pelo menos uma banda.', true); return; }
  ui.busy = true; render();
  var ok = 0, fails = [];
  for(var i=0;i<targets.length;i++){
    var { data, error } = await sb.rpc('copy_song_to_band', { p_song_id: songId, p_band_id: targets[i] });
    if(error){ fails.push(errMsg(error)); continue; }
    ok++;
    if(song.sheet_path && data && data.id){
      try {
        var dest = targets[i] + '/sheets/' + uid() + '-' + (song.sheet_name || 'arquivo').replace(/[^A-Za-z0-9._-]+/g,'_');
        var cp = await sb.storage.from('band-files').copy(song.sheet_path, dest);
        if(!cp.error) await sb.from('songs').update({ sheet_path: dest, sheet_name: song.sheet_name }).eq('id', data.id);
      } catch(e){ /* a música foi copiada; só o anexo ficou de fora */ }
    }
  }
  ui.busy = false; ui.modal = null;
  for(var j=0;j<targets.length;j++) await loadBandData(targets[j]);
  if(ui.bandId) await loadBandData(ui.bandId);
  render();
  if(ok) toast('Música copiada para '+ok+' banda'+(ok===1?'':'s')+'.');
  if(fails.length) toast('Não consegui copiar: '+fails[0], true);
}

/* ============================================================
   BIBLIOTECA DE MÚSICAS PÚBLICAS
   ============================================================ */
function publicLibWrap(m){
  return '<div class="modal-backdrop" data-action="modal-backdrop"><div class="modal modal-wide" role="dialog" aria-modal="true" aria-label="Músicas públicas">' +
    '<div class="modal-head"><h2>Músicas públicas</h2><button class="iconbtn" data-action="close-modal" aria-label="Fechar">'+icon('close')+'</button></div>' +
    '<div class="modal-body">' +
    '<p class="muted" style="margin:0;">Músicas que outros usuários do GigTrack deixaram públicas. Copie para a sua banda e ela vira sua — dá para editar à vontade.</p>' +
    '<div class="search">'+icon('search')+'<input type="text" id="f-pub-search" placeholder="Buscar por música ou artista" value="'+escapeHtml(m.query||'')+'" aria-label="Buscar músicas públicas"></div>' +
    '<div id="pub-results" class="publist">'+renderPublicResults(m)+'</div>' +
    '</div></div></div>';
}
function renderPublicResults(m){
  if(m.loading) return '<div class="centerscreen" style="min-height:8rem;"><div class="spinner" role="status" aria-label="Carregando"></div></div>';
  if(m.error) return '<p class="hint" style="color:var(--danger)">'+escapeHtml(m.error)+'</p>';
  var list = m.results || [];
  if(!list.length) return '<div class="empty" style="padding:1.5rem 1rem;">'+icon('globe')+'<p>'+(m.query?'Nada encontrado para "'+escapeHtml(m.query)+'".':'Ainda não há músicas públicas.')+'</p></div>';
  var here = cache.songs.filter(function(s){ return s.band_id===ui.bandId; });
  return list.map(function(p){
    var inBand = p.band_id === ui.bandId;
    var copied = here.some(function(s){ return s.copied_from === p.id; });
    var btn = inBand ? '<span class="pill">Desta banda</span>'
      : copied ? '<span class="pill">'+icon('check')+'Já copiada</span>'
      : '<button class="btn btn-primary" data-action="copy-public" data-id="'+p.id+'">'+icon('copy')+'Copiar</button>';
    var bits = [];
    if(p.song_key) bits.push('Tom '+escapeHtml(p.song_key));
    if(p.duration_sec) bits.push(fmtDuration(p.duration_sec));
    if(p.has_chords) bits.push('com cifra');
    return '<div class="pubrow"><div class="pinfo"><div class="title">'+escapeHtml(p.name)+'</div>' +
      '<div class="sub">'+escapeHtml(p.artist||'Artista não informado')+(bits.length?' · '+bits.join(' · '):'')+'</div>' +
      '<div class="umeta">Compartilhada por '+escapeHtml(p.shared_by||'alguém')+' · '+escapeHtml(p.band_name||'')+
      (p.chord_source_url?' · <a href="'+escapeHtml(p.chord_source_url)+'" target="_blank" rel="noopener">Cifra Club</a>':'')+'</div></div>' +
      '<div class="pact">'+btn+'</div></div>';
  }).join('');
}
function refreshPublicResults(){
  var box = document.getElementById('pub-results');
  if(box && ui.modal && ui.modal.type==='public-lib') box.innerHTML = renderPublicResults(ui.modal);
}
async function loadPublicSongs(query){
  var m = ui.modal;
  if(!m || m.type!=='public-lib') return;
  m.query = query; m.loading = true; m.error = ''; refreshPublicResults();
  var seq = (m.seq = (m.seq||0) + 1);
  var { data, error } = await sb.rpc('list_public_songs', { p_query: query || '' });
  if(ui.modal !== m || seq !== m.seq) return;
  m.loading = false;
  if(error) m.error = 'Não consegui carregar: '+errMsg(error); else m.results = data || [];
  refreshPublicResults();
}
var onPublicSearch = debounce(function(v){ loadPublicSongs(v); }, 250);
async function copyPublicSong(songId, btn){
  if(btn){ btn.disabled = true; btn.textContent = 'Copiando…'; }
  var { error } = await sb.rpc('copy_song_to_band', { p_song_id: songId, p_band_id: ui.bandId });
  if(error){ toast('Não consegui copiar: '+errMsg(error), true); if(btn){ btn.disabled=false; btn.textContent='Copiar'; } return; }
  await loadBandData(ui.bandId);
  refreshPublicResults();
  toast('Música copiada para a banda.');
}

/* ============================================================
   EVENT DELEGATION
   ============================================================ */
document.addEventListener('click', function(e){
  var t = e.target.closest('[data-action]');
  if(!t) return;
  var action = t.getAttribute('data-action');
  switch(action){
    case 'auth-tab': ui.authTab = t.getAttribute('data-tab'); ui.authError=''; ui.authInfo=''; render(); break;
    case 'logout': doLogout(); break;
    case 'open-admin': openAdmin(); break;
    case 'close-admin': ui.screen='band'; ui.search=''; render(); break;
    case 'admin-refresh': loadAdminUsers().then(render); break;
    case 'admin-reset': ui.modal={type:'reset-pw', userId:t.getAttribute('data-id')}; render(); break;
    case 'admin-gen-pw': var pwf=document.getElementById('f-reset-pw'); if(pwf) pwf.value=genPassword(); break;
    case 'admin-set': (function(id){ var u=(cache.adminUsers||[]).find(function(x){return x.id===id;});
      ui.modal={type:'confirm', title:'Tornar administrador', message:(u?(u.display_name||u.email):'Essa pessoa')+' vai poder ver todos os usuários, redefinir senhas e gerenciar administradores.', confirmLabel:'Tornar admin', onConfirm:function(){ adminSetAdmin(id, true); }}; render(); })(t.getAttribute('data-id')); break;
    case 'admin-approve': adminSetApproved(t.getAttribute('data-id'), true); break;
    case 'admin-block': (function(id){ ui.modal={type:'confirm', title:'Bloquear conta', message:'A pessoa sai do GigTrack agora e só volta a entrar quando um administrador liberar a conta de novo. As bandas e músicas dela continuam guardadas.', confirmLabel:'Bloquear', onConfirm:function(){ adminSetApproved(id, false); }}; render(); })(t.getAttribute('data-id')); break;
    case 'pending-recheck': recheckApproval(); break;
    case 'admin-unset': (function(id){ ui.modal={type:'confirm', title:'Tirar administrador', message:'Essa pessoa perde o acesso à área administrativa.', confirmLabel:'Tirar admin', onConfirm:function(){ adminSetAdmin(id, false); }}; render(); })(t.getAttribute('data-id')); break;
    case 'copy-text': var txt=t.getAttribute('data-text'); if(navigator.clipboard) navigator.clipboard.writeText(txt).then(function(){ toast('Copiado.'); }, function(){}); break;
    case 'open-account': ui.modal={type:'account'}; render(); break;
    case 'copy-song': ui.modal={type:'copy-song', songId:t.getAttribute('data-id')}; render(); break;
    case 'open-public-lib': ui.modal={type:'public-lib', query:'', results:[], loading:true}; render(); loadPublicSongs(''); break;
    case 'copy-public': copyPublicSong(t.getAttribute('data-id'), t); break;
    case 'go-home': ui.screen='band'; ui.bandId=null; ui.showId=null; ui.tab='songs'; ui.search=''; stashNav(); render(); break;
    case 'open-band': ui.bandId=t.getAttribute('data-id'); ui.tab='songs'; ui.search=''; stashNav();
      render(); loadBandData(ui.bandId).then(render); break;
    case 'new-band': pendingLogoFile=null; ui.modal={type:'new-band'}; render(); break;
    case 'open-join-band': ui.modal={type:'join-band'}; render(); break;
    case 'tab': ui.tab=t.getAttribute('data-tab'); ui.search=''; stashNav(); render(); break;
    case 'new-song': pendingSheetFile=null; ui.modal={type:'song', songId:null}; render(); break;
    case 'edit-song': pendingSheetFile=null; ui.modal={type:'song', songId:t.getAttribute('data-id')}; render(); break;
    case 'delete-song': ui.modal={type:'confirm', title:'Excluir música', message:'Essa música será removida do catálogo e de qualquer setlist que a use.', onConfirm:function(){ deleteSong(t.getAttribute('data-id')); }}; render(); break;
    case 'new-show': ui.modal={type:'show', showId:null}; render(); break;
    case 'edit-show': ui.modal={type:'show', showId:ui.showId}; render(); break;
    case 'delete-show': ui.modal={type:'confirm', title:'Excluir show', message:'O show e seu setlist serão removidos.', onConfirm:function(){ deleteShow(ui.showId); }}; render(); break;
    case 'open-show': ui.showId=t.getAttribute('data-id'); ui.search=''; render(); break;
    case 'close-show': ui.showId=null; ui.search=''; render(); break;
    case 'open-chords': e.preventDefault(); openChords(t.getAttribute('data-id')); break;
    case 'open-sheet': e.preventDefault(); openSheet(t.getAttribute('data-path')); break;
    case 'export-pdf': exportSetlistPdf(t.getAttribute('data-id')); break;
    case 'add-to-set': addToSetlist(ui.showId, t.getAttribute('data-id')); break;
    case 'set-remove': ui.modal={type:'confirm', title:'Remover do setlist', message:'Remover essa música da ordem do show?', onConfirm:function(){ removeFromSetlist(t.getAttribute('data-rowid'), ui.showId); }}; render(); break;
    case 'set-move-up': moveSetlistItem(ui.showId, parseInt(t.getAttribute('data-idx'),10), -1); break;
    case 'set-move-down': moveSetlistItem(ui.showId, parseInt(t.getAttribute('data-idx'),10), 1); break;
    case 'close-modal': ui.modal=null; pendingLogoFile=null; pendingSheetFile=null; ui.lastInviteCode=null; render(); break;
    case 'modal-backdrop': if(e.target===t){ ui.modal=null; render(); } break;
    case 'confirm-yes': var m = ui.modal; ui.modal=null; render(); if(m && m.onConfirm) m.onConfirm(); break;
    case 'save-band-name': saveBandName(); break;
    case 'gen-invite': genInvite(t.getAttribute('data-id')); break;
    case 'copy-invite': if(ui.lastInviteCode){ navigator.clipboard && navigator.clipboard.writeText(ui.lastInviteCode); toast('Código copiado.'); } break;
    case 'remove-member': ui.modal={type:'confirm', title:'Remover integrante', message:'Essa pessoa perde acesso à banda.', onConfirm:function(){ removeMember(ui.bandId, t.getAttribute('data-id')); }}; render(); break;
    case 'leave-band': ui.modal={type:'confirm', title:'Sair da banda', message:'Você perde acesso a essa banda até ser convidado de novo.', confirmLabel:'Sair', onConfirm:function(){ leaveBand(t.getAttribute('data-id')); }}; render(); break;
    case 'delete-band': ui.modal={type:'confirm', title:'Excluir banda', message:'Isso apaga a banda, o repertório e os shows para todo mundo. Não pode ser desfeito.', onConfirm:function(){ deleteBand(t.getAttribute('data-id')); }}; render(); break;
    default: break;
  }
});

/* Link do Cifra Club no formulário: mostra/atualiza o botão "Abrir" enquanto digita */
document.addEventListener('input', function(e){
  if(e.target.id!=='f-song-cifra-url') return;
  var a = document.getElementById('f-song-cifra-open');
  var st = document.getElementById('f-song-cifra-status');
  var url = normalizeCifraUrl(e.target.value);
  if(a){ a.hidden = !url; if(url) a.href = url; }
  if(st){
    st.style.color = url===null ? 'var(--danger)' : '';
    st.textContent = url===null ? 'Esse link não é do Cifra Club (cifraclub.com.br).' : 'Cole o link da música no Cifra Club. Ele vira um atalho na lista de músicas e no setlist.';
  }
});

document.addEventListener('submit', function(e){
  var form = e.target.closest('#auth-form, #modal-form, #pw-form');
  if(!form) return;
  e.preventDefault();
  if(form.id === 'pw-form'){ changeOwnPassword('f-pw', true); return; }
  if(form.id === 'auth-form'){
    var email = document.getElementById('f-auth-email').value.trim();
    var pass = document.getElementById('f-auth-pass').value;
    if(ui.authTab === 'login') doLogin(email, pass);
    else doSignup(email, pass, document.getElementById('f-auth-name').value.trim());
    return;
  }
  var btn = form.querySelector('button[type="submit"]');
  var action = btn && btn.getAttribute('data-action');
  if(action==='save-new-band') saveNewBand();
  else if(action==='save-join-band') saveJoinBand();
  else if(action==='save-song-new') saveNewSong();
  else if(action==='save-song-edit') saveSongEdit(btn.getAttribute('data-id'));
  else if(action==='save-show-new') saveNewShow();
  else if(action==='save-show-edit') saveShowEdit(btn.getAttribute('data-id'));
  else if(action==='save-account') changeOwnPassword('f-acc', false);
  else if(action==='save-reset-pw') adminResetPassword(btn.getAttribute('data-id'));
  else if(action==='save-copy-song') copySongToBands(btn.getAttribute('data-id'));
  else if(action==='close-modal'){ ui.modal=null; render(); }
});

var onSearchInput = debounce(function(value){
  ui.search = value;
  render();
  var again = document.querySelector('[data-action="search"]');
  if(again) again.focus();
}, 120);
document.addEventListener('input', function(e){
  if(e.target.id === 'f-pub-search'){ onPublicSearch(e.target.value); return; }
  if(e.target.matches('[data-action="search"]')){
    var val = e.target.value;
    ui.search = val; // keep immediate for controlled feel; render debounced
    onSearchInput(val);
  }
});

document.addEventListener('change', function(e){
  if(e.target.id==='f-band-logo'){
    var f = e.target.files && e.target.files[0];
    if(!f) return;
    resizeImageFile(f, 480).then(function(resized){
      pendingLogoFile = resized;
      var reader = new FileReader();
      reader.onload = function(ev){
        var prev = document.getElementById('f-band-logo-preview');
        if(prev) prev.innerHTML = '<img src="'+ev.target.result+'" alt="" style="width:100%;height:100%;object-fit:cover;">';
      };
      reader.readAsDataURL(resized);
    }).catch(function(err){ toast(errMsg(err), true); });
  }
  if(e.target.id==='band-logo-input'){
    var f2 = e.target.files && e.target.files[0];
    if(f2) applyBandLogo(f2);
  }
  if(e.target.id==='f-song-sheet'){
    var sf = e.target.files && e.target.files[0];
    if(!sf) return;
    if(sf.size > MAX_SHEET_FILE){
      toast('Arquivo muito grande (máx. 10 MB).', true);
      e.target.value = '';
      return;
    }
    pendingSheetFile = sf;
    var lbl = document.getElementById('f-song-sheet-name');
    if(lbl) lbl.textContent = sf.name + ' (pronto para salvar)';
  }
});

/* ============================================================
   BOOT
   ============================================================ */
async function boot(){
  initSupabase();
  if(!configOk){ render(); return; }
  sb.auth.onAuthStateChange(function(event, newSession){
    var wasLoggedIn = !!session;
    session = newSession;
    if(!session){
      profile = null; isAdmin = false; ui.modal = null; ui.authError = '';
      cache = { bands:[], members:[], songs:[], shows:[], showSongs:{}, signedUrls:{}, adminUsers:[] };
      ui.screen = 'auth';
      render();
      return;
    }
    if(!wasLoggedIn){
      (async function(){
        await loadProfile();
        await loadBands();
        if(ui.bandId && cache.bands.some(function(b){return b.id===ui.bandId;})){
          ui.screen = 'band';
          await loadBandData(ui.bandId);
        } else {
          ui.bandId = null; ui.screen = 'band';
        }
        render();
      })();
    }
  });
  var { data } = await sb.auth.getSession();
  if(!data || !data.session){ ui.screen = 'auth'; render(); }
}

render();
boot();

})();

