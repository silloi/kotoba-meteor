'use strict';
/* ============================================================
   ENGINE — utilities, storage, romaji + JIS-kana input matchers
   ============================================================ */

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
const toHira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const hasKanji = (s) => /[㐀-鿿々]/.test(s);
const fmt = (n) => Math.round(n).toLocaleString('en-US');

/* ---------- storage (every access may throw in private modes) ---------- */
const Store = {
  ns: 'kotoba-meteor/',
  get(k, d) {
    try { const v = localStorage.getItem(this.ns + k); return v == null ? d : JSON.parse(v); }
    catch (e) { return d; }
  },
  set(k, v) { try { localStorage.setItem(this.ns + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  del(k) { try { localStorage.removeItem(this.ns + k); } catch (e) { /* ignore */ } },
};

/* ---------- romaji tables (MS-IME / Google IME compatible spellings) ---------- */
const R1 = {
  'あ': ['a'], 'い': ['i', 'yi'], 'う': ['u', 'wu', 'whu'], 'え': ['e'], 'お': ['o'],
  'か': ['ka', 'ca'], 'き': ['ki'], 'く': ['ku', 'cu', 'qu'], 'け': ['ke'], 'こ': ['ko', 'co'],
  'さ': ['sa'], 'し': ['shi', 'si', 'ci'], 'す': ['su'], 'せ': ['se', 'ce'], 'そ': ['so'],
  'た': ['ta'], 'ち': ['chi', 'ti'], 'つ': ['tsu', 'tu'], 'て': ['te'], 'と': ['to'],
  'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
  'は': ['ha'], 'ひ': ['hi'], 'ふ': ['fu', 'hu'], 'へ': ['he'], 'ほ': ['ho'],
  'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
  'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
  'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
  'わ': ['wa'], 'を': ['wo'], 'ん': ['nn', 'xn', "n'"],
  'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
  'ざ': ['za'], 'じ': ['ji', 'zi'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
  'だ': ['da'], 'ぢ': ['di'], 'づ': ['du'], 'で': ['de'], 'ど': ['do'],
  'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
  'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
  'ぁ': ['xa', 'la'], 'ぃ': ['xi', 'li'], 'ぅ': ['xu', 'lu'], 'ぇ': ['xe', 'le'], 'ぉ': ['xo', 'lo'],
  'ゃ': ['xya', 'lya'], 'ゅ': ['xyu', 'lyu'], 'ょ': ['xyo', 'lyo'], 'ゎ': ['xwa', 'lwa'],
  'っ': ['xtu', 'ltu', 'xtsu', 'ltsu'], 'ゔ': ['vu'],
  'ー': ['-'], '、': [','], '。': ['.'], '・': ['/'],
};
const R2 = {
  'きゃ': ['kya'], 'きぃ': ['kyi'], 'きゅ': ['kyu'], 'きぇ': ['kye'], 'きょ': ['kyo'],
  'ぎゃ': ['gya'], 'ぎぃ': ['gyi'], 'ぎゅ': ['gyu'], 'ぎぇ': ['gye'], 'ぎょ': ['gyo'],
  'しゃ': ['sha', 'sya'], 'しぃ': ['syi'], 'しゅ': ['shu', 'syu'], 'しぇ': ['she', 'sye'], 'しょ': ['sho', 'syo'],
  'じゃ': ['ja', 'zya', 'jya'], 'じぃ': ['zyi', 'jyi'], 'じゅ': ['ju', 'zyu', 'jyu'], 'じぇ': ['je', 'zye', 'jye'], 'じょ': ['jo', 'zyo', 'jyo'],
  'ちゃ': ['cha', 'tya', 'cya'], 'ちぃ': ['tyi', 'cyi'], 'ちゅ': ['chu', 'tyu', 'cyu'], 'ちぇ': ['che', 'tye', 'cye'], 'ちょ': ['cho', 'tyo', 'cyo'],
  'ぢゃ': ['dya'], 'ぢぃ': ['dyi'], 'ぢゅ': ['dyu'], 'ぢぇ': ['dye'], 'ぢょ': ['dyo'],
  'にゃ': ['nya'], 'にぃ': ['nyi'], 'にゅ': ['nyu'], 'にぇ': ['nye'], 'にょ': ['nyo'],
  'ひゃ': ['hya'], 'ひぃ': ['hyi'], 'ひゅ': ['hyu'], 'ひぇ': ['hye'], 'ひょ': ['hyo'],
  'びゃ': ['bya'], 'びぃ': ['byi'], 'びゅ': ['byu'], 'びぇ': ['bye'], 'びょ': ['byo'],
  'ぴゃ': ['pya'], 'ぴぃ': ['pyi'], 'ぴゅ': ['pyu'], 'ぴぇ': ['pye'], 'ぴょ': ['pyo'],
  'みゃ': ['mya'], 'みぃ': ['myi'], 'みゅ': ['myu'], 'みぇ': ['mye'], 'みょ': ['myo'],
  'りゃ': ['rya'], 'りぃ': ['ryi'], 'りゅ': ['ryu'], 'りぇ': ['rye'], 'りょ': ['ryo'],
  'ふぁ': ['fa'], 'ふぃ': ['fi'], 'ふぇ': ['fe'], 'ふぉ': ['fo'], 'ふゅ': ['fyu'],
  'てぃ': ['thi'], 'てゅ': ['thu'], 'でぃ': ['dhi'], 'でゅ': ['dhu'],
  'とぅ': ['twu'], 'どぅ': ['dwu'],
  'うぃ': ['wi', 'whi'], 'うぇ': ['we', 'whe'], 'うぉ': ['who'],
  'ゔぁ': ['va'], 'ゔぃ': ['vi'], 'ゔぇ': ['ve'], 'ゔぉ': ['vo'],
  'つぁ': ['tsa'], 'つぃ': ['tsi'], 'つぇ': ['tse'], 'つぉ': ['tso'],
  'くぁ': ['qa', 'kwa'], 'くぃ': ['qi'], 'くぇ': ['qe'], 'くぉ': ['qo'], 'ぐぁ': ['gwa'],
  'いぇ': ['ye'],
};
const SMALL_KANA = 'ぁぃぅぇぉゃゅょゎ';
const DOUBLE_OK = 'bcdfghjkmpqrstvwyz'; // consonants that may be doubled for っ

/* The guide shows the spellings the player actually uses (si vs shi, etc.). */
const RomajiPrefs = {
  map: Store.get('rpref', {}),
  ver: 0,
  set(k, r) {
    if (this.map[k] === r) return;
    this.map[k] = r; this.ver++;
    Store.set('rpref', this.map);
  },
};
function prefOrder(key, list) {
  const p = RomajiPrefs.map[key];
  if (!p || list[0] === p || !list.includes(p)) return list;
  return [p, ...list.filter((x) => x !== p)];
}

/* RomajiMatcher: incremental matcher that accepts every valid spelling.
   State = kana position + the keys typed for the chunk in progress. */
class RomajiMatcher {
  constructor(reading) {
    this.kind = 'romaji';
    this.s = toHira(reading);
    this.n = this.s.length;
    this.reset();
    this.total = this.guide().length;
  }
  reset() { this.pos = 0; this.buf = ''; this.typed = ''; this._g = null; }
  get done() { return this.pos >= this.n; }

  /* candidate spellings for the chunk starting at kana index i: [romaji, kanaLength] */
  cands(i) {
    const s = this.s, n = this.n;
    if (i >= n) return [];
    const c = s[i];
    const out = [];
    if (c === 'っ') {
      const nx = s[i + 1];
      if (nx && nx !== 'っ' && nx !== 'ん' && nx !== 'ー') {
        for (const [r, len] of this.cands(i + 1)) {
          if (DOUBLE_OK.includes(r[0])) out.push([r[0] + r, len + 1]);
          if (r.startsWith('ch')) out.push(['t' + r, len + 1]);
        }
      }
      for (const r of R1['っ']) out.push([r, 1]);
      return out;
    }
    if (c === 'ん') {
      // a single "n" is only safe when the next chunk cannot start with a vowel, y or n
      let single = false;
      if (i + 1 < n) {
        const nx = this.cands(i + 1);
        single = nx.length > 0 && nx.every(([r]) => !"aiueoyn'".includes(r[0]));
      }
      const preferNN = RomajiPrefs.map['ん'] === 'nn';
      if (single && !preferNN) out.push(['n', 1]);
      for (const r of R1['ん']) out.push([r, 1]);
      if (single && preferNN) out.push(['n', 1]);
      return out;
    }
    if (i + 1 < n && SMALL_KANA.includes(s[i + 1])) {
      const two = c + s[i + 1];
      if (R2[two]) for (const r of prefOrder(two, R2[two])) out.push([r, 2]);
    }
    if (R1[c]) for (const r of prefOrder(c, R1[c])) out.push([r, 1]);
    return out;
  }

  step(pos, buf, key) {
    if (pos >= this.n) return null;
    const cs = this.cands(pos);
    const nb = buf + key;
    let exact = null, longer = false;
    for (const cand of cs) {
      const r = cand[0];
      if (r.length >= nb.length && r.startsWith(nb)) {
        if (r.length === nb.length) { if (!exact) exact = cand; } else longer = true;
      }
    }
    if (exact && !longer) return { pos: pos + exact[1], buf: '', fins: [[pos, exact]] };
    if (exact || longer) return { pos, buf: nb, fins: [] };
    // "n" was complete on its own: close it and try the key on the next chunk
    if (buf) {
      const doneCand = cs.find((cand) => cand[0] === buf);
      if (doneCand) {
        const res = this.step(pos + doneCand[1], '', key);
        if (res) { res.fins.unshift([pos, doneCand]); return res; }
      }
    }
    return null;
  }

  /* returns true if the key was accepted (state advances), false otherwise (no change) */
  input(key) {
    const st = this.step(this.pos, this.buf, key);
    if (!st) return false;
    for (const [p, cand] of st.fins) this.learn(p, cand);
    this.pos = st.pos; this.buf = st.buf; this.typed += key; this._g = null;
    return true;
  }

  learn(p, cand) {
    const [r, len] = cand;
    const kana = this.s.substr(p, len);
    if (kana[0] === 'ん') return;
    if (kana[0] === 'っ') {
      if (len > 1 && r[0] !== 'x' && r[0] !== 'l') {
        const k2 = kana.slice(1), inner = r.slice(1);
        if ((R1[k2] && R1[k2].includes(inner)) || (R2[k2] && R2[k2].includes(inner))) RomajiPrefs.set(k2, inner);
      }
      return;
    }
    const table = len === 2 ? R2 : R1;
    if (table[kana] && table[kana].length > 1) RomajiPrefs.set(kana, r);
  }

  /* the remaining keys, following the player's preferred spellings */
  guide() {
    if (this._g !== null && this._gv === RomajiPrefs.ver) return this._g;
    let out = '', pos = this.pos;
    if (this.buf) {
      const cs = this.cands(pos);
      const pk = cs.find((c) => c[0] === this.buf) || cs.find((c) => c[0].startsWith(this.buf));
      if (pk) { out += pk[0].slice(this.buf.length); pos += pk[1]; }
    }
    while (pos < this.n) {
      const cs = this.cands(pos);
      if (!cs.length) { out += '?'; pos++; continue; }
      out += cs[0][0]; pos += cs[0][1];
    }
    this._g = out; this._gv = RomajiPrefs.ver;
    return out;
  }
  nextChar() { return this.guide()[0] || ''; }
  typedKana() { return this.s.slice(0, this.pos); }
}

/* ---------- JIS kana layout (by physical key: event.code) ---------- */
const JIS_KANA = {
  Digit1: ['ぬ'], Digit2: ['ふ'], Digit3: ['あ', 'ぁ'], Digit4: ['う', 'ぅ'], Digit5: ['え', 'ぇ'], Digit6: ['お', 'ぉ'],
  Digit7: ['や', 'ゃ'], Digit8: ['ゆ', 'ゅ'], Digit9: ['よ', 'ょ'], Digit0: ['わ', 'を'], Minus: ['ほ'], Equal: ['へ'], IntlYen: ['ー'],
  KeyQ: ['た'], KeyW: ['て'], KeyE: ['い', 'ぃ'], KeyR: ['す'], KeyT: ['か'], KeyY: ['ん'], KeyU: ['な'], KeyI: ['に'],
  KeyO: ['ら'], KeyP: ['せ'], BracketLeft: ['゛'], BracketRight: ['゜', '「'],
  KeyA: ['ち'], KeyS: ['と'], KeyD: ['し'], KeyF: ['は'], KeyG: ['き'], KeyH: ['く'], KeyJ: ['ま'], KeyK: ['の'],
  KeyL: ['り'], Semicolon: ['れ'], Quote: ['け'], Backslash: ['む', '」'],
  KeyZ: ['つ', 'っ'], KeyX: ['さ'], KeyC: ['そ'], KeyV: ['ひ'], KeyB: ['こ'], KeyN: ['み'], KeyM: ['も'],
  Comma: ['ね', '、'], Period: ['る', '。'], Slash: ['め', '・'], IntlRo: ['ろ'],
};
const KANA_TO_KEY = {};
for (const code of Object.keys(JIS_KANA)) {
  JIS_KANA[code].forEach((k, i) => { if (!(k in KANA_TO_KEY)) KANA_TO_KEY[k] = { code, shift: i === 1 }; });
}

/* が → か + ゛ ; ぱ → は + ゜ (exactly how JIS kana typists enter them) */
function kanaKeystrokes(hira) {
  const seq = [], owner = [];
  Array.from(hira).forEach((ch, idx) => {
    for (const d of ch.normalize('NFD')) {
      seq.push(d === '゙' ? '゛' : d === '゚' ? '゜' : d);
      owner.push(idx);
    }
  });
  return { seq, owner };
}

class KanaMatcher {
  constructor(reading) {
    this.kind = 'kana';
    this.s = toHira(reading);
    this.n = this.s.length;
    const k = kanaKeystrokes(this.s);
    this.seq = k.seq; this.owner = k.owner;
    this.total = this.seq.length;
    this.reset();
  }
  reset() { this.i = 0; this.typed = ''; }
  get done() { return this.i >= this.seq.length; }
  get pos() { return this.i >= this.seq.length ? this.n : this.owner[this.i]; }
  input(k) {
    if (this.seq[this.i] !== k) return false;
    this.typed += k; this.i++;
    return true;
  }
  guide() { return this.seq.slice(this.i).join(''); }
  nextChar() { return this.seq[this.i] || ''; }
  /* typed kana so far; a base kana waiting for its ゛ is shown on its own */
  typedKana() {
    let out = this.s.slice(0, this.pos);
    if (this.i > 0 && this.i < this.seq.length && this.owner[this.i - 1] === this.owner[this.i]) out += this.seq[this.i - 1];
    return out;
  }
}

function makeMatcher(reading, input) {
  return input === 'kana' ? new KanaMatcher(reading) : new RomajiMatcher(reading);
}

/* ---------- keyboard events → tokens ---------- */
const ROMAJI_CODE = { Minus: '-', Comma: ',', Period: '.', Slash: '/', Quote: "'", IntlYen: '-' };
function romajiToken(e) {
  let k = e.key;
  if (k && k.length === 1) {
    const cc = k.charCodeAt(0);
    if (cc >= 0xFF01 && cc <= 0xFF5E) k = String.fromCharCode(cc - 0xFEE0); // full-width ASCII
    if (k === 'ー') k = '-';
    k = k.toLowerCase();
    if (/^[a-z\-,.'\/]$/.test(k)) return k;
    if (cc < 0x80) return null; // other ASCII (digits, symbols)
    // non-ASCII (e.g. the OS is in kana mode): fall back to the physical key
  }
  const c = e.code || '';
  if (/^Key[A-Z]$/.test(c)) return c.slice(3).toLowerCase();
  return ROMAJI_CODE[c] || null;
}
function kanaToken(e) {
  const m = JIS_KANA[e.code];
  if (!m) return null;
  return e.shiftKey && m[1] ? m[1] : m[0];
}
function codeForRomaji(ch) {
  if (/^[a-z]$/.test(ch)) return 'Key' + ch.toUpperCase();
  return { '-': 'Minus', ',': 'Comma', '.': 'Period', '/': 'Slash', "'": 'Quote' }[ch] || null;
}

/* ---------- learning record ---------- */
/* per word: c = right without hint, g = right with hint, m = wrong keys, h = reached the shield */
const Stats = {
  data: Store.get('stats', {}),
  dirty: false,
  get(id) { return this.data[id] || { c: 0, g: 0, m: 0, h: 0 }; },
  bump(e, kind) {
    const s = this.data[e.id] || (this.data[e.id] = { c: 0, g: 0, m: 0, h: 0 });
    s[kind] = (s[kind] || 0) + 1;
    this.dirty = true;
  },
  save() { if (this.dirty) { Store.set('stats', this.data); this.dirty = false; } },
  weakScore(id) { const s = this.get(id); return 3 * s.h + s.g + 0.5 * s.m - 2 * s.c; },
  isWeak(id) { return this.weakScore(id) > 0; },
  seen(id) { const s = this.get(id); return s.c + s.g + s.h > 0; },
  mastered(id) { const s = this.get(id); return s.c > 0 && this.weakScore(id) <= 0; },
  weight(e) { return 1 + Math.max(0, this.weakScore(e.id)) * 0.7 + (this.seen(e.id) ? 0 : 0.5); },
  reset() { this.data = {}; this.dirty = false; Store.del('stats'); },
};

/* weighted sample without replacement: weak and unseen words come up more often */
function pickWords(pool, n) {
  return pool
    .map((e) => ({ e, k: Math.pow(Math.random(), 1 / Stats.weight(e)) }))
    .sort((a, b) => b.k - a.k)
    .slice(0, n)
    .map((x) => x.e);
}
