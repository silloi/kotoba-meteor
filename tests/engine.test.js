// Run: node tests/engine.test.js
// Loads src/data.js + src/engine.js in a sandbox and checks the input matchers and every vocabulary entry.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = ['data.js', 'engine.js'].map((f) => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8')).join('\n');
const sandbox = { console, Math, JSON, Array, String, Object, Set, Map };
vm.createContext(sandbox);
vm.runInContext(src + '\n;globalThis.__x = { VOCAB, RomajiMatcher, KanaMatcher, KANA_TO_KEY, RomajiPrefs, toHira };', sandbox);
const { VOCAB, RomajiMatcher, KanaMatcher, KANA_TO_KEY, toHira } = sandbox.__x;

let fails = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { fails++; console.log('FAIL:', msg); } }
function typeAll(m, keys) { for (const k of keys) { if (!m.input(k)) return false; } return true; }

// --- romaji: accepted spellings ---
const accept = [
  ['がっこう', ['gakkou']],
  ['しんぶん', ['shinbunn', 'sinbunn', 'shinnbunn', 'sinnbuxn', "shin'bunn"]],
  ['こんにちは', ['konnnichiha', 'konnnitiha', 'koxnnichiha']],
  ['かんじ', ['kanji', 'kanzi', 'kannji', "kan'ji", 'kaxnji']],
  ['ちゃ', ['cha', 'tya', 'cya', 'chixya', 'tilya']],
  ['きっぷ', ['kippu', 'kixtupu', 'kiltsupu']],
  ['まっちゃ', ['maccha', 'mattya', 'matcha', 'maxtucha']],
  ['ふぁいる', ['fairu', 'fuxairu', 'hulairu']],
  ['ぱーてぃー', ['pa-thi-', 'pa-texi-']],
  ['じゅぎょう', ['jugyou', 'zyugyou', 'jyugyou', 'jixyugilyou']],
  ['しゅっぱつ', ['shuppatsu', 'syuppatu', 'shuxtupatsu']],
  ['ぎゅうにゅう', ['gyuunyuu', 'gixyuunilyuu']],
  ['つづける', ['tsudukeru', 'tudukeru']],
  ['ちぢむ', ['chidimu', 'tidimu']],
  ['こーひー', ['ko-hi-']],
  ['うぇぶ', ['webu', 'uxebu']],
  ['てんいん', ['tenninn', "ten'inn", 'texninn']],
  ['ほんや', ['honnya', "hon'ya"]],
  ['かんわ', ['kanwa', 'kannwa']],
];
for (const [kana, list] of accept) {
  for (const keys of list) {
    const m = new RomajiMatcher(kana);
    ok(typeAll(m, keys) && m.done, `${kana} should accept "${keys}" (stopped at pos ${m.pos}, typed "${m.typed}")`);
  }
}

// --- romaji: rejected spellings ---
const reject = [
  ['こんにちは', 'konnichiha'],   // nn + i = ん + い
  ['ほんや', 'honya'],            // ny = にゃ row
  ['てんいん', 'tenin'],
  ['かんじ', 'kaji'],
];
for (const [kana, keys] of reject) {
  const m = new RomajiMatcher(kana);
  ok(!(typeAll(m, keys) && m.done), `${kana} should reject "${keys}"`);
}
// a final ん needs nn
{ const m = new RomajiMatcher('ぱん'); typeAll(m, 'pan'); ok(!m.done, 'ぱん is not done after "pan"'); m.input('n'); ok(m.done, 'ぱん done after "pann"'); }
// wrong key leaves state unchanged
{ const m = new RomajiMatcher('すし'); m.input('s'); const before = m.typed; ok(!m.input('k'), 'すし rejects k after s'); ok(m.typed === before, 'state unchanged after a miss'); }

// --- guide follows standard Hepburn-style defaults (with no learned preferences) ---
for (const k of Object.keys(sandbox.__x.RomajiPrefs.map)) delete sandbox.__x.RomajiPrefs.map[k];
sandbox.__x.RomajiPrefs.ver++;
const guides = [['しんぶん', 'shinbunn'], ['こんにちは', 'konnnichiha'], ['がっこう', 'gakkou'], ['まっちゃ', 'maccha'], ['かんじ', 'kanji'], ['ぎゅうにゅう', 'gyuunyuu'], ['ちぢむ', 'chidimu']];
for (const [kana, g] of guides) ok(new RomajiMatcher(kana).guide() === g, `guide for ${kana} is "${new RomajiMatcher(kana).guide()}", expected "${g}"`);

// --- kana (JIS) matcher ---
{
  const m = new KanaMatcher('がっこう');
  ok(m.seq.join('') === 'か゛っこう', 'がっこう keystrokes ' + m.seq.join(''));
  ok(typeAll(m, ['か', '゛', 'っ', 'こ', 'う']) && m.done, 'がっこう typed in kana');
  const p = new KanaMatcher('パン');
  ok(p.seq.join('') === 'は゜ん', 'パン keystrokes ' + p.seq.join(''));
  const half = new KanaMatcher('がく'); half.input('か');
  ok(half.pos === 0 && half.typedKana() === 'か', 'partial dakuten keeps pos at 0');
}

// --- every vocabulary entry is typeable both ways; random valid spellings are all accepted ---
const all = [].concat(...Object.values(VOCAB));
const ids = new Set();
let words = 0;
for (const e of all) {
  words++;
  ok(!ids.has(e.id), 'duplicate id ' + e.id); ids.add(e.id);
  ok(e.w && e.r && e.m, 'missing field in ' + JSON.stringify(e));
  ok(!/[|]/.test(e.m), 'pipe in meaning ' + e.id);
  const m = new RomajiMatcher(e.r);
  const g = m.guide();
  ok(!g.includes('?'), `untypeable kana in ${e.id} (${e.r}) guide=${g}`);
  ok(typeAll(m, g) && m.done, `guide does not complete ${e.id}: ${g}`);
  for (let t = 0; t < 12; t++) {
    // random walk over candidate spellings
    const gen = new RomajiMatcher(e.r);
    let pos = 0, s = '';
    while (pos < gen.n) { const cs = gen.cands(pos); const c = cs[Math.floor(Math.random() * cs.length)]; s += c[0]; pos += c[1]; }
    const mm = new RomajiMatcher(e.r);
    ok(typeAll(mm, s) && mm.done, `random spelling "${s}" rejected for ${e.id} (${e.r})`);
  }
  const k = new KanaMatcher(e.r);
  ok(k.seq.every((ch) => ch in KANA_TO_KEY), `kana keystroke missing on JIS layout for ${e.id}: ${k.seq.filter((ch) => !(ch in KANA_TO_KEY)).join('')}`);
  ok(typeAll(k, k.seq) && k.done, 'kana sequence does not complete ' + e.id);
  if (e.lv !== 'kana') ok(/^[ぁ-ゖー]+$/.test(e.r), `reading for ${e.id} should be hiragana: ${e.r}`);
}

const counts = Object.fromEntries(Object.entries(VOCAB).map(([k, v]) => [k, v.length]));
console.log('word counts', JSON.stringify(counts), 'total', words);
console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
