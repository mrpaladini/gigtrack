/* GigTrack — núcleo de cifras: detecção de acordes, transposição e renderização.
 * Funciona no navegador (window.CifraCore) e no Node (module.exports).
 *
 * Formato da cifra: texto puro, no estilo do Cifra Club — linhas de acordes acima das
 * linhas de letra. Também aceita acordes entre colchetes no meio da letra ("[D]palavra").
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CifraCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var FLATS  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  var NOTE_INDEX = {
    'C': 0, 'B#': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'Fb': 4,
    'F': 5, 'E#': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10,
    'Bb': 10, 'B': 11, 'Cb': 11
  };
  // Tons que costumam ser escritos com bemóis
  var FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm'];

  // Raiz + acidente + qualidade/extensões + baixo opcional (ex.: D, F#m7, A7(9), Bb7M, D/F#, Gº, Esus4)
  var CHORD_RE = /^([A-G])([#b]?)((?:maj|min|dim|aug|sus|add|[mM]|º|°|\+|-|\d|\(|\)|#|b|\/(?=\d))*)(?:\/([A-G])([#b]?))?$/;
  // Tokens que podem aparecer numa linha de acordes sem serem acordes
  var DECOR_RE = /^(\[[^\]]*\]|[A-Za-zÀ-ú]+:|\(?\d+x\)?|\(?x\d+\)?|\||\|\||-+|\.+|\(|\)|%|\/|N\.?C\.?|→|->|>)$/i;
  // Rótulos de seção que às vezes vêm sem dois-pontos, só no início da linha ("Intro G D Em")
  var LABEL_RE = /^(intro|introdução|solo|final|fim|refrão|refrao|ponte|riff|base|interlúdio|interludio|pré-refrão|pre-refrao|coda|outro|verso|parte|dedilhado)$/i;
  var TAB_LINE_RE = /^\s*[A-Ga-g][#b]?\s*\|[-\d|hpbrx~\/\\. ]*$/;

  function isChord(token) { return CHORD_RE.test(token); }

  function stripParens(tok) {
    // aceita "(D)" ou "D)" em linhas tipo "( D  A )"
    return tok.replace(/^\(+/, '').replace(/\)+$/, '');
  }

  /** Uma linha é "de acordes" quando todos os seus tokens são acordes ou decoração, e há pelo menos um acorde. */
  function isChordLine(line) {
    if (!line || !line.trim() || TAB_LINE_RE.test(line)) return false;
    var tokens = line.trim().split(/\s+/);
    var chords = 0;
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (isChord(t) || isChord(stripParens(t))) chords++;
      else if (!DECOR_RE.test(t) && !(i === 0 && tokens.length > 1 && LABEL_RE.test(t))) return false;
    }
    return chords > 0;
  }

  function shiftNote(note, semitones, useFlats) {
    var idx = NOTE_INDEX[note];
    if (idx === undefined) return note;
    var n = ((idx + semitones) % 12 + 12) % 12;
    return (useFlats ? FLATS : SHARPS)[n];
  }

  function transposeChord(chord, semitones, useFlats) {
    var m = CHORD_RE.exec(chord);
    if (!m) return chord;
    var out = shiftNote(m[1] + m[2], semitones, useFlats) + m[3];
    if (m[4]) out += '/' + shiftNote(m[4] + m[5], semitones, useFlats);
    return out;
  }

  function transposeToken(tok, semitones, useFlats) {
    if (isChord(tok)) return transposeChord(tok, semitones, useFlats);
    var inner = stripParens(tok);
    if (inner !== tok && isChord(inner)) return tok.replace(inner, transposeChord(inner, semitones, useFlats));
    return tok;
  }

  /** Transpõe uma linha de acordes mantendo o alinhamento das colunas com a letra de baixo. */
  function transposeChordLine(line, semitones, useFlats) {
    var out = '';
    var debt = 0; // caracteres a mais que já escrevemos e precisamos "devolver" nos espaços seguintes
    var re = /(\s+)|(\S+)/g, m;
    while ((m = re.exec(line))) {
      if (m[1]) {
        var spaces = m[1].length;
        var cut = Math.min(debt, spaces - 1); // sempre deixa pelo menos 1 espaço
        if (re.lastIndex >= line.length) cut = Math.min(debt, spaces); // espaço final: pode consumir tudo
        out += m[1].slice(0, spaces - Math.max(cut, 0));
        debt -= Math.max(cut, 0);
      } else {
        var t = transposeToken(m[2], semitones, useFlats);
        out += t;
        var diff = t.length - m[2].length;
        if (diff < 0) { // acorde encurtou: completa com espaços para manter a próxima coluna
          var pay = Math.min(-diff, debt);
          debt -= pay;
          out += ' '.repeat(-diff - pay);
        } else debt += diff;
      }
    }
    // não deixa sobrar espaço no fim da linha (acumularia a cada troca de tom)
    return out.replace(/\s+$/, '') + (/\s*$/.exec(line) || [''])[0];
  }

  function transposeInline(line, semitones, useFlats) {
    return line.replace(/\[([^\]\s]+)\]/g, function (all, c) {
      return isChord(c) ? '[' + transposeChord(c, semitones, useFlats) + ']' : all;
    });
  }

  /** Transpõe a cifra inteira. */
  function transpose(text, semitones, opts) {
    semitones = ((semitones % 12) + 12) % 12;
    var respell = !!(opts && opts.respell);  // mesma altura, só troca a grafia (C# ↔ Db)
    if (!text || (semitones === 0 && !respell)) return text || '';
    var useFlats = opts && typeof opts.useFlats === 'boolean' ? opts.useFlats : false;
    return text.split('\n').map(function (line) {
      if (isChordLine(line)) return transposeChordLine(line, semitones, useFlats);
      if (line.indexOf('[') !== -1) return transposeInline(line, semitones, useFlats);
      return line;
    }).join('\n');
  }

  /** Normaliza um nome de tom ("D", "f#m", "Bb") → {root, minor, name} ou null. */
  function parseKey(key) {
    if (!key) return null;
    var m = /^\s*([A-Ga-g])([#b]?)\s*(m|min|menor)?\s*$/.exec(String(key));
    if (!m) return null;
    var root = m[1].toUpperCase() + m[2];
    if (NOTE_INDEX[root] === undefined) return null;
    return { root: root, minor: !!m[3], name: root + (m[3] ? 'm' : '') };
  }

  /** Semitons para ir de um tom a outro (0–11). */
  function semitonesBetween(fromKey, toKey) {
    var a = parseKey(fromKey), b = parseKey(toKey);
    if (!a || !b) return 0;
    return ((NOTE_INDEX[b.root] - NOTE_INDEX[a.root]) % 12 + 12) % 12;
  }

  function prefersFlats(key) {
    var k = parseKey(key);
    return !!k && FLAT_KEYS.indexOf(k.name) !== -1;
  }

  /** Transpõe o nome de um tom ("D" + 2 → "E"). */
  function transposeKey(key, semitones) {
    var k = parseKey(key);
    if (!k) return key;
    var sharp = shiftNote(k.root, semitones, false);
    if (sharp.length === 1) return sharp + (k.minor ? 'm' : '');
    // Teclas pretas: grafia mais usada na prática
    var pick = k.minor
      ? { 'C#': 'C#', 'D#': 'Eb', 'F#': 'F#', 'G#': 'G#', 'A#': 'Bb' }
      : { 'C#': 'Db', 'D#': 'Eb', 'F#': 'F#', 'G#': 'Ab', 'A#': 'Bb' };
    return pick[sharp] + (k.minor ? 'm' : '');
  }

  /** Transpõe a cifra de um tom para outro, escolhendo sustenidos/bemóis conforme o tom de destino. */
  function transposeToKey(text, fromKey, toKey) {
    var semis = semitonesBetween(fromKey, toKey);
    var a = parseKey(fromKey), b = parseKey(toKey);
    var respell = semis === 0 && !!a && !!b && a.root !== b.root;
    return transpose(text, semis, { useFlats: prefersFlats(toKey), respell: respell });
  }

  /** Mesmo tom no outro modo não faz sentido no seletor: lista os 12 tons do modo de `key` (grafia usual). */
  function keysLike(key) {
    var k = parseKey(key);
    var minor = !!(k && k.minor);
    var out = [];
    for (var i = 0; i < 12; i++) out.push(transposeKey(minor ? 'Am' : 'C', i));
    out.sort(function (x, y) { return NOTE_INDEX[parseKey(x).root] - NOTE_INDEX[parseKey(y).root]; });
    if (k && out.indexOf(k.name) === -1) {  // grafia alternativa escolhida pelo usuário (ex.: C# em vez de Db)
      var idx = NOTE_INDEX[k.root];
      out = out.map(function (o) { return NOTE_INDEX[parseKey(o).root] === idx ? k.name : o; });
    }
    return out;
  }

  /** Lê as notas dos acordes da cifra: [{root: 0-11, q: 'M'|'m'|'d'}] na ordem em que aparecem. */
  function chordsOf(text) {
    var out = [];
    (text || '').split('\n').forEach(function (line) {
      var toks = [];
      if (isChordLine(line)) toks = line.trim().split(/\s+/).map(stripParens);
      else line.replace(/\[([^\]\s]+)\]/g, function (all, c) { toks.push(c); return all; });
      toks.forEach(function (t) {
        var m = CHORD_RE.exec(t);
        if (!m) return;
        var q = m[3] || '';
        var kind = /^(dim|º|°)/.test(q) || /m7?\(?b5|5-|º|°/.test(q) ? 'd' : (/^m(?!aj)|^min/.test(q) ? 'm' : 'M');
        out.push({ root: NOTE_INDEX[m[1] + m[2]], q: kind, name: m[1] + m[2] });
      });
    });
    return out;
  }

  // Graus diatônicos (semitons acima da tônica → qualidade esperada)
  var MAJOR_DEG = { 0: 'M', 2: 'm', 4: 'm', 5: 'M', 7: 'M', 9: 'm', 11: 'd' };
  var MINOR_DEG = { 0: 'm', 2: 'd', 3: 'M', 5: 'm', 7: 'Mm', 8: 'M', 10: 'M' };

  /**
   * Descobre o tom da cifra. Ordem: linha "Tom: X" (vem junto quando se copia do Cifra Club);
   * depois, análise harmônica — o tom em que mais acordes são diatônicos, com peso extra para
   * o primeiro e, principalmente, o último acorde.
   */
  function guessKey(text) {
    var tomLine = /(^|\n)\s*tom\s*:\s*([A-G][#b]?m?)\b/i.exec(text || '');
    if (tomLine && parseKey(tomLine[2])) return parseKey(tomLine[2]).name;
    var chords = chordsOf(text);
    if (!chords.length) return null;
    var first = chords[0], last = chords[chords.length - 1];
    var best = null;
    for (var tonic = 0; tonic < 12; tonic++) {
      [false, true].forEach(function (minor) {
        var deg = minor ? MINOR_DEG : MAJOR_DEG;
        var score = 0;
        chords.forEach(function (c) {
          var d = ((c.root - tonic) % 12 + 12) % 12;
          var want = deg[d];
          if (want && want.indexOf(c.q) !== -1) score += 1;
          else if (want) score += 0.25;     // grau certo, qualidade emprestada
          else score -= 0.5;                // fora do tom
        });
        var tq = minor ? 'm' : 'M';
        if (first.root === tonic && first.q === tq) score += 2;
        if (last.root === tonic && last.q === tq) score += 3;
        if (!best || score > best.score) best = { score: score, tonic: tonic, minor: minor };
      });
    }
    // grafia: a do acorde da tônica, se aparecer na cifra; senão a usual
    var spelled = null;
    chords.some(function (c) { if (c.root === best.tonic) { spelled = c.name; return true; } return false; });
    var name = spelled || transposeKey(best.minor ? 'Am' : 'C', ((best.tonic - (best.minor ? 9 : 0)) % 12 + 12) % 12).replace(/m$/, '');
    return parseKey(name).root + (best.minor ? 'm' : '');
  }

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** HTML para exibição (dentro de um <pre>), com acordes destacados em <b class="chord">. */
  function toHTML(text) {
    return (text || '').split('\n').map(function (line) {
      if (isChordLine(line)) {
        return '<span class="chord-line">' + line.replace(/\S+/g, function (t) {
          var inner = stripParens(t);
          return isChord(inner) ? esc(t).replace(esc(inner), '<b class="chord">' + esc(inner) + '</b>') : '<span class="chord-decor">' + esc(t) + '</span>';
        }) + '</span>';
      }
      if (TAB_LINE_RE.test(line)) return '<span class="tab-line">' + esc(line) + '</span>';
      return esc(line).replace(/\[([^\]\s]+)\]/g, function (all, c) {
        return isChord(c) ? '<b class="chord chord-inline">' + c + '</b>' : '<span class="section">' + all + '</span>';
      });
    }).join('\n');
  }

  var ALL_KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

  return {
    isChord: isChord,
    isChordLine: isChordLine,
    transpose: transpose,
    transposeChord: transposeChord,
    transposeToKey: transposeToKey,
    transposeKey: transposeKey,
    semitonesBetween: semitonesBetween,
    parseKey: parseKey,
    prefersFlats: prefersFlats,
    guessKey: guessKey,
    keysLike: keysLike,
    toHTML: toHTML,
    ALL_KEYS: ALL_KEYS
  };
});

