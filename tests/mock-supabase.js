/* GigTrack — Supabase SIMULADO, só para os testes automáticos (tests/run-tests.py).
 * Imita a parte do cliente supabase-js que o app usa, com os dados em memória.
 * NÃO é carregado pelo site: o teste troca o supabase-js por este arquivo no navegador.
 */
(function () {
  'use strict';

  var TABLES = ['profiles', 'bands', 'band_members', 'band_invites', 'songs', 'shows', 'show_songs', 'files', 'app_admins'];
  var OPT = window.__MOCK || {};  // { admin: bool, mustChange: bool } definido pelo teste
  var mem = {}; TABLES.forEach(function (t) { mem[t] = []; });
  var store = null, assets = null, uid = null, persistent = false;
  var authCb = null, session = null;

  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'id' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function rowKey(t, r) { return t === 'band_members' ? r.band_id + '_' + r.user_id : r.id; }
  function col(t) { return store.collection('data/users/' + uid + '/' + t + '/rows'); }

  function persist(t, r) {
    if (!persistent) return;
    col(t).doc(rowKey(t, r)).set(clone(r)).catch(function (e) { warn('Não consegui salvar: ' + (e && e.message || e)); });
  }
  function unpersist(t, r) {
    if (!persistent) return;
    col(t).doc(rowKey(t, r)).delete().catch(function () {});
  }
  function warn(msg) {
    var b = document.getElementById('test-banner-msg');
    if (b) b.textContent = msg;
  }

  var ready = (async function () {
    try {
      var c = window.claude;
      var waited = 0;
      while ((!c || !c.use) && waited < 0) { await new Promise(function (r) { setTimeout(r, 100); }); waited += 100; c = window.claude; }
      if (c && c.use) {
        var user = await c.use('user');
        store = await c.use('db');
        assets = await c.use('assets');
        uid = user ? await user.id() : null;
        var me = user ? await user.me() : null;
        if (store && uid) {
          var timer = new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, 10000); });
          var loaded = await Promise.race([Promise.all(TABLES.map(function (t) { return col(t).get(); })), timer]);
          TABLES.forEach(function (t, i) { mem[t] = loaded[i].docs.map(function (d) { return d.data(); }); });
          persistent = true;
        }
        session = { user: { id: uid || 'local', email: 'voce@teste.local' }, access_token: 'teste' };
        if (!mem.profiles.some(function (p) { return p.id === session.user.id; })) {
          var prof = { id: session.user.id, display_name: (me && me.name) || 'Você', created_at: new Date().toISOString() };
          mem.profiles.push(prof); persist('profiles', prof);
        }
      }
    } catch (e) {
      persistent = false;
      warn('Não consegui acessar o armazenamento do Claude — os dados desta sessão somem ao recarregar.');
    }
    if (!session) session = { user: { id: 'local', email: 'voce@teste.local' }, access_token: 'teste' };
    if (!persistent) {
      warn('Modo temporário: os dados somem ao recarregar a página.');
      if (!mem.profiles.length) mem.profiles.push({ id: 'local', display_name: 'Você', must_change_password: !!OPT.mustChange });
    }
    session.user.email = OPT.email || 'voce@teste.local';
    if (OPT.admin) mem.app_admins.push({ user_id: session.user.id });
    // outros usuários e uma banda alheia com uma música pública
    mem.profiles.push({ id: 'u-ana', display_name: 'Ana Baterista', must_change_password: false });
    mem.bands.push({ id: 'b-outra', name: 'Banda da Ana', created_by: 'u-ana' });
    mem.band_members.push({ band_id: 'b-outra', user_id: 'u-ana', role: 'owner' });
    mem.songs.push({ id: 's-publica', band_id: 'b-outra', name: 'Garota de Ipanema', artist: 'Tom Jobim', song_key: 'F',
      duration_sec: 300, chord_sheet: 'F7M  G7\nOlha que coisa mais linda', chord_key: 'F', comment: 'segredo da Ana',
      chord_source_url: 'https://www.cifraclub.com.br/tom-jobim/garota-de-ipanema/', is_public: true, created_by: 'u-ana' });
    mem._users = [
      { id: session.user.id, email: session.user.email, created_at: '2026-11-06T10:00:00Z', last_sign_in_at: new Date().toISOString() },
      { id: 'u-ana', email: 'ana@exemplo.com', created_at: '2026-11-05T09:00:00Z', last_sign_in_at: null }
    ];
  })();

  // ---------- Query builder com a mesma cara do supabase-js ----------
  function Q(table) { this.t = table; this.f = []; this.op = 'select'; this.sel = '*'; this.ord = null; this.asc = true; this.one = null; }
  Q.prototype.select = function (s) { if (this.op === 'select') this.sel = s || '*'; return this; };
  Q.prototype.eq = function (k, v) { this.f.push([k, v]); return this; };
  Q.prototype.order = function (k, o) { this.ord = k; this.asc = !(o && o.ascending === false); return this; };
  Q.prototype.maybeSingle = function () { this.one = 'maybe'; return this; };
  Q.prototype.single = function () { this.one = 'single'; return this; };
  Q.prototype.insert = function (d) { this.op = 'insert'; this.d = d; return this; };
  Q.prototype.update = function (d) { this.op = 'update'; this.d = d; return this; };
  Q.prototype.delete = function () { this.op = 'delete'; return this; };
  Q.prototype.then = function (res, rej) { var self = this; return ready.then(function () { return self.run(); }).then(res, rej); };
  Q.prototype.match = function (r) { return this.f.every(function (f) { return r[f[0]] === f[1]; }); };

  function visibleBandIds() {
    return mem.band_members.filter(function (m) { return m.user_id === session.user.id; }).map(function (m) { return m.band_id; });
  }

  function cascadeDelete(t, r) {
    if (t === 'bands') {
      ['band_members', 'band_invites', 'songs', 'shows'].forEach(function (ct) {
        mem[ct].filter(function (x) { return x.band_id === r.id; }).forEach(function (x) { removeRow(ct, x); });
      });
    } else if (t === 'songs') {
      mem.show_songs.filter(function (x) { return x.song_id === r.id; }).forEach(function (x) { removeRow('show_songs', x); });
    } else if (t === 'shows') {
      mem.show_songs.filter(function (x) { return x.show_id === r.id; }).forEach(function (x) { removeRow('show_songs', x); });
    }
  }
  function removeRow(t, r) {
    mem[t] = mem[t].filter(function (x) { return x !== r; });
    unpersist(t, r);
    cascadeDelete(t, r);
  }

  Q.prototype.run = function () {
    var self = this, t = this.t, now = new Date().toISOString(), rows;
    if (!mem[t]) return { data: null, error: { message: 'Tabela desconhecida: ' + t } };
    if (this.op === 'insert') {
      var list = Array.isArray(this.d) ? this.d : [this.d];
      rows = list.map(function (d) {
        var r = Object.assign({ id: newId(), created_at: now }, t === 'songs' ? { is_public: false, created_by: session.user.id, copied_from: null } : {}, clone(d));
        if (t === 'songs' || t === 'shows') r.updated_at = now;
        mem[t].push(r); persist(t, r); return r;
      });
    } else if (this.op === 'update') {
      rows = mem[t].filter(this.match.bind(this));
      rows.forEach(function (r) {
        Object.assign(r, clone(self.d));
        if (t === 'songs' || t === 'shows') r.updated_at = now;
        persist(t, r);
      });
    } else if (this.op === 'delete') {
      mem[t].filter(this.match.bind(this)).forEach(function (r) { removeRow(t, r); });
      rows = [];
    } else {
      var bands = visibleBandIds();
      rows = mem[t].filter(this.match.bind(this)).filter(function (r) {
        if (t === 'bands') return bands.indexOf(r.id) !== -1;
        if ('band_id' in r) return bands.indexOf(r.band_id) !== -1;
        return true;
      });
    }
    rows = rows.map(function (r) {
      var c = clone(r);
      if (/songs\(/.test(self.sel)) c.songs = clone(mem.songs.find(function (s) { return s.id === r.song_id; }) || null);
      if (/profiles\(/.test(self.sel)) c.profiles = clone(mem.profiles.find(function (p) { return p.id === r.user_id; }) || null);
      return c;
    });
    if (this.ord) {
      var k = this.ord, asc = this.asc;
      rows.sort(function (a, b) {
        var x = a[k], y = b[k];
        if (typeof x === 'string' && typeof y === 'string') return (asc ? 1 : -1) * x.localeCompare(y, 'pt-BR');
        return (asc ? 1 : -1) * ((x > y) - (x < y));
      });
    }
    if (this.one) {
      if (this.one === 'single' && !rows.length) return { data: null, error: { message: 'Registro não encontrado.' } };
      return { data: rows[0] || null, error: null };
    }
    return { data: rows, error: null };
  };

  async function rpc(name, args) {
    await ready;
    var me = session.user.id, now = new Date().toISOString();
    if (name === 'create_band') {
      if (!String(args.p_name || '').trim()) return { data: null, error: { message: 'Nome da banda não pode ser vazio.' } };
      var b = { id: newId(), name: args.p_name, logo_path: null, created_by: me, created_at: now };
      mem.bands.push(b); persist('bands', b);
      var m = { band_id: b.id, user_id: me, role: 'owner', joined_at: now };
      mem.band_members.push(m); persist('band_members', m);
      return { data: clone(b), error: null };
    }
    if (name === 'create_invite_code') {
      var code = Math.random().toString(36).slice(2, 8).toUpperCase();
      var inv = { id: newId(), band_id: args.p_band_id, code: code, created_by: me, created_at: now };
      mem.band_invites.push(inv); persist('band_invites', inv);
      return { data: code, error: null };
    }
    if (name === 'join_band_with_code') {
      var found = mem.band_invites.find(function (i) { return i.code === String(args.p_code || '').trim().toUpperCase(); });
      if (!found) return { data: null, error: { message: 'Na versão de teste, convites só funcionam entre bandas desta mesma conta.' } };
      if (!mem.band_members.some(function (x) { return x.band_id === found.band_id && x.user_id === me; })) {
        var mm = { band_id: found.band_id, user_id: me, role: 'editor', joined_at: now };
        mem.band_members.push(mm); persist('band_members', mm);
      }
      return { data: clone(mem.bands.find(function (x) { return x.id === found.band_id; })), error: null };
    }
    var isAdm = mem.app_admins.some(function (a) { return a.user_id === me; });
    var deny = { data: null, error: { message: 'Acesso restrito aos administradores.' } };
    if (name === 'is_app_admin') return { data: isAdm, error: null };
    if (name === 'admin_list_users') {
      if (!isAdm) return deny;
      return { data: mem._users.map(function (u) {
        var p = mem.profiles.find(function (x) { return x.id === u.id; }) || {};
        return { id: u.id, email: u.email, display_name: p.display_name || '', created_at: u.created_at, last_sign_in_at: u.last_sign_in_at,
          is_admin: mem.app_admins.some(function (a) { return a.user_id === u.id; }), must_change_password: !!p.must_change_password,
          band_count: mem.band_members.filter(function (m) { return m.user_id === u.id; }).length };
      }), error: null };
    }
    if (name === 'admin_reset_password') {
      if (!isAdm) return deny;
      if (String(args.p_new_password || '').length < 8) return { data: null, error: { message: 'A senha precisa ter pelo menos 8 caracteres.' } };
      var pr = mem.profiles.find(function (x) { return x.id === args.p_user_id; });
      if (pr && args.p_user_id !== me) pr.must_change_password = true;
      window.__lastReset = { user: args.p_user_id, password: args.p_new_password };
      return { data: null, error: null };
    }
    if (name === 'admin_set_admin') {
      if (!isAdm) return deny;
      if (!args.p_admin && args.p_user_id === me) return { data: null, error: { message: 'Você não pode remover a si mesmo do grupo de administradores.' } };
      mem.app_admins = mem.app_admins.filter(function (a) { return a.user_id !== args.p_user_id; });
      if (args.p_admin) mem.app_admins.push({ user_id: args.p_user_id });
      return { data: null, error: null };
    }
    if (name === 'list_public_songs') {
      var q = String(args.p_query || '').toLowerCase();
      return { data: mem.songs.filter(function (x) { return x.is_public && (!q || (x.name + ' ' + (x.artist || '')).toLowerCase().indexOf(q) > -1); })
        .map(function (x) {
          var pb = mem.bands.find(function (b) { return b.id === x.band_id; }) || {};
          var pp = mem.profiles.find(function (p) { return p.id === x.created_by; }) || {};
          return { id: x.id, name: x.name, artist: x.artist || '', song_key: x.song_key || '', duration_sec: x.duration_sec || 0,
            youtube_url: '', spotify_url: '', chord_source_url: x.chord_source_url || null, has_chords: !!x.chord_sheet,
            chord_key: x.chord_key || null, shared_by: pp.display_name || '', band_id: x.band_id, band_name: pb.name || '' };
        }), error: null };
    }
    if (name === 'copy_song_to_band') {
      var mine = visibleBandIds();
      var src = mem.songs.find(function (x) { return x.id === args.p_song_id; });
      if (mine.indexOf(args.p_band_id) < 0) return { data: null, error: { message: 'Você não participa da banda de destino.' } };
      if (!src) return { data: null, error: { message: 'Música não encontrada.' } };
      var own = mine.indexOf(src.band_id) > -1;
      if (!own && !src.is_public) return { data: null, error: { message: 'Essa música não é pública.' } };
      if (src.band_id === args.p_band_id) return { data: null, error: { message: 'A música já está nessa banda.' } };
      var cp = Object.assign(clone(src), { id: newId(), band_id: args.p_band_id, comment: own ? src.comment : '', sheet_path: null, sheet_name: null,
        is_public: false, created_by: me, copied_from: src.id, created_at: now, updated_at: now });
      mem.songs.push(cp); persist('songs', cp);
      return { data: clone(cp), error: null };
    }
    return { data: null, error: { message: 'Função não disponível no teste: ' + name } };
  }

  var storage = {
    from: function () {
      return {
        upload: async function (path, file) {
          await ready;
          if (!assets) return { error: { message: 'Envio de arquivos indisponível nesta visualização.' } };
          try {
            var res = await assets.upload(file);
            var row = { id: path, asset_id: res.id };
            mem.files.push(row); persist('files', row);
            return { data: { path: path }, error: null };
          } catch (e) {
            return { error: { message: e && e.code === 'unsupported_type' ? 'Esse tipo de arquivo não é aceito no teste (use PDF, imagem ou .txt).' : (e && e.message) || 'Falha no envio.' } };
          }
        },
        copy: async function (from, to) {
          var f = mem.files.find(function (x) { return x.id === from; });
          if (!f) return { error: { message: 'Arquivo não encontrado.' } };
          mem.files.push({ id: to, asset_id: f.asset_id });
          return { data: { path: to }, error: null };
        },
        createSignedUrl: async function (path) {
          await ready;
          var f = mem.files.find(function (x) { return x.id === path; });
          return f ? { data: { signedUrl: '/_blob/' + f.asset_id }, error: null } : { data: null, error: { message: 'Arquivo não encontrado.' } };
        }
      };
    }
  };

  var auth = {
    getSession: async function () { await ready; return { data: { session: session } }; },
    onAuthStateChange: function (cb) {
      authCb = cb;
      ready.then(function () { cb('INITIAL_SESSION', session); });
      return { data: { subscription: { unsubscribe: function () {} } } };
    },
    signOut: async function () { var s = session; session = null; if (authCb) authCb('SIGNED_OUT', null); session = s; },
    updateUser: async function (attrs) {
      await ready;
      if (attrs && attrs.password && attrs.password.length < 6) return { data: null, error: { message: 'Password should be at least 6 characters.' } };
      window.__lastPasswordChange = attrs && attrs.password;
      return { data: { user: session.user }, error: null };
    },
    signInWithPassword: async function (cred) { window.__lastLogin = cred && cred.email; await ready; if (authCb) authCb('SIGNED_IN', session); return { error: null }; },
    _oldSignIn: async function () { await ready; if (authCb) authCb('SIGNED_IN', session); return { error: null }; },
    signUp: async function () { await ready; if (authCb) authCb('SIGNED_IN', session); return { data: { session: session }, error: null }; }
  };

  window.supabase = { createClient: function () { return { from: function (t) { return new Q(t); }, rpc: rpc, storage: storage, auth: auth }; } };

})();
