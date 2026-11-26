#!/usr/bin/env node
/* GigTrack — testes do núcleo de cifras (detecção de tom e transposição).
 * Uso: node tests/test-cifra-core.js
 */
'use strict';
const C = require('../assets/js/cifra-core.js');
let pass = 0, fail = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else fail++;
  console.log((ok ? 'ok   - ' : 'FAIL - ') + name + (ok ? '' : `\n       esperado ${JSON.stringify(want)}\n       obtido   ${JSON.stringify(got)}`));
}
const L = (...lines) => lines.join('\n');

// ---------- detecção de tom ----------
eq('tom pela linha "Tom:" do Cifra Club', C.guessKey(L('Música - Artista', 'Tom: Bb', '', 'C  G  Am  F', 'letra')), 'Bb');
eq('tom pela linha "tom: F#m"', C.guessKey(L('tom: F#m', 'A  E  D', 'letra')), 'F#m');
eq('G simples', C.guessKey(L('[Intro] G  D/F#  Em  C', '', 'G   D/F#', 'letra', 'Em   C   G', 'letra')), 'G');
eq('intro começando no IV (G)', C.guessKey(L('[Intro] C  D  G', '', 'G        Em', 'letra', 'C     D    G', 'letra')), 'G');
eq('menor: Am F C G terminando em Am', C.guessKey(L('Am  F  C  G', 'letra', 'Am  F  E7  Am', 'letra')), 'Am');
eq('menor: Em com B7', C.guessKey(L('Em  C  D  B7', 'letra', 'Em  Am  B7  Em', 'letra')), 'Em');
eq('D com A7 e Bm', C.guessKey(L('D  A  Bm  G', 'letra', 'D  A7  D', 'letra')), 'D');
eq('bemóis: F com Bb', C.guessKey(L('F  Bb  C7  F', 'letra', 'Dm  Gm  C  F', 'letra')), 'F');
eq('Bb (grafia da cifra)', C.guessKey(L('Bb  Eb  F  Bb', 'letra', 'Gm  Cm  F7  Bb', 'letra')), 'Bb');
eq('E com tétrades', C.guessKey(L('E7M  C#m7  F#m7  B7(9)', 'letra', 'E7M  A7M  B4  E', 'letra')), 'E');
eq('acordes inline [D]', C.guessKey('[D]Primeira [A]linha [Bm]da [G]letra [D]fim'), 'D');
eq('sem acordes → null', C.guessKey('só letra\nmais letra'), null);

// ---------- linhas de acordes ----------
eq('linha com N.C.', C.isChordLine('G  D  N.C.  Em'), true);
eq('rótulo sem dois-pontos', C.isChordLine('Intro G D Em'), true);
eq('rótulo com dois-pontos', C.isChordLine('Solo: Am G F'), true);
eq('repetição (2x)', C.isChordLine('G  D  Em  C  (2x)'), true);
eq('letra "E a gente vai"', C.isChordLine('E a gente vai'), false);
eq('letra "Em cada canto"', C.isChordLine('Em cada canto'), false);
eq('letra começando com "Intro" não vira acorde', C.isChordLine('Intro da minha vida'), false);
eq('espaço não separável (copiado da web)', C.isChordLine('G  D/F#  Em'), true);

// ---------- transposição ----------
const song = L('[Intro] G  D/F#  Em  C', '', 'G              D/F#', '  Primeira linha da letra', 'Em           C', '  Segunda linha');
eq('G → A', C.transposeToKey(song, 'G', 'A').split('\n')[2], 'A              E/G#');
eq('G → F usa bemóis', C.transposeToKey('G  C  D  Em\nla', 'G', 'F').split('\n')[0], 'F  Bb C  Dm');
eq('letra não muda', C.transposeToKey(song, 'G', 'A').split('\n')[3], '  Primeira linha da letra');
eq('ida e volta volta igual', C.transposeToKey(C.transposeToKey(song, 'G', 'B'), 'B', 'G'), song);
eq('C# → Db só troca a grafia', C.transposeToKey('C#  F#  G#\nla', 'C#', 'Db').split('\n')[0], 'Db  Gb  Ab');
eq('Db → C# volta', C.transposeToKey('Db  Gb  Ab\nla', 'Db', 'C#').split('\n')[0], 'C#  F#  G#');
eq('N.C. preservado', C.transpose('G  N.C.  D\nla', 2).split('\n')[0], 'A  N.C.  E');
eq('rótulo preservado', C.transpose('Intro G D\nla', 2).split('\n')[0], 'Intro A E');
eq('baixo invertido', C.transposeChord('D/F#', -2, true), 'C/E');
eq('meio diminuto', C.transposeChord('F#m7(b5)', 1, false), 'Gm7(b5)');
eq('tablatura intacta', C.transpose('E|---3---|\nB|-0-----|', 2), 'E|---3---|\nB|-0-----|');
eq('inline', C.transpose('[D]Primeira [A/C#]linha', 2), '[E]Primeira [B/D#]linha');

// ---------- nomes de tom ----------
eq('+½ em Am → Bbm', C.transposeKey('Am', 1), 'Bbm');
eq('+½ em E → F', C.transposeKey('E', 1), 'F');
eq('-½ em C → B', C.transposeKey('C', -1), 'B');
eq('seletor só com tons maiores', C.keysLike('G'), ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']);
eq('seletor só com tons menores', C.keysLike('Em'), ['Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm']);
eq('seletor respeita a grafia escolhida (C#)', C.keysLike('C#').slice(0, 3), ['C', 'C#', 'D']);

console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
