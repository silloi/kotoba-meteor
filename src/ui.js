'use strict';
/* ============================================================
   UI — screens, options, practice mode, word list, results, boot
   ============================================================ */

const DEFAULTS = { input: 'romaji', qmode: 'read', furigana: 'delay', meaning: true, guide: true, diff: 'normal', kbd: true, sfx: true, bgm: true, voice: true };
let settings = Object.assign({}, DEFAULTS, Store.get('settings', {}));
const saveSettings = () => Store.set('settings', settings);

const Best = {
  data: Store.get('best', {}),
  key: (lv, s) => `${lv}|${s.qmode}|${s.diff}`,
  get(lv) { return this.data[this.key(lv, settings)] || 0; },
  put(lv, cfg, score) {
    const k = this.key(lv, cfg);
    if (score <= (this.data[k] || 0)) return false;
    this.data[k] = score; Store.set('best', this.data);
    return true;
  },
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SPK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.6 6a8.6 8.6 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

const ALL_WORDS = [].concat(...LEVEL_INFO.map((L) => VOCAB[L.id]), VOCAB.yoji);
const ENTRY = new Map(ALL_WORDS.map((e) => [e.id, e]));
const romajiCache = new Map();
const romajiOf = (e) => { if (!romajiCache.has(e.id)) romajiCache.set(e.id, new RomajiMatcher(e.r).guide()); return romajiCache.get(e.id); };
const weakWords = () => ALL_WORDS.filter((e) => Stats.isWeak(e.id)).sort((a, b) => Stats.weakScore(b.id) - Stats.weakScore(a.id));
const levelOf = (id) => LEVEL_INFO.find((L) => L.id === id);

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.tm);
  toast.tm = setTimeout(() => { t.hidden = true; }, 2800);
}
function say(e) {
  if (Speech.say(e.r, 0.95, true)) return;
  toast('この端末には日本語の音声がありません。 No Japanese voice is installed on this device.');
}
function preloadFonts(entries) {
  if (!document.fonts || !document.fonts.load) return;
  const text = entries.map((e) => e.w + e.r + e.m).join('');
  ['600 30px "Klee One"', '700 16px "BIZ UDPGothic"', '400 13px "BIZ UDPGothic"'].forEach((f) => document.fonts.load(f, text).catch(() => {}));
}

/* ---------------- options (segmented controls) ---------------- */
const OPTS = {
  input: { jp: '入力方式', en: 'Input', items: [['romaji', 'ローマ字', 'Romaji'], ['kana', 'かな', 'JIS kana']] },
  qmode: { jp: '出題', en: 'Question', items: [['read', '漢字→よみ', 'Read the word'], ['mean', '英語→ことば', 'Recall from English']] },
  furigana: { jp: 'ふりがな', en: 'Furigana hint', items: [['always', 'いつも', 'Always'], ['delay', 'あとから', 'Delayed'], ['off', 'なし', 'Off']] },
  diff: { jp: 'スピード', en: 'Meteor speed', items: [['easy', 'ゆっくり', 'Easy'], ['normal', 'ふつう', 'Normal'], ['hard', 'はやい', 'Hard']] },
  meaning: { jp: '意味を表示', en: 'English meaning on cards', items: [[true, '表示', 'On'], [false, 'かくす', 'Off']] },
  guide: { jp: 'ローマ字ガイド', en: 'Romaji guide', items: [[true, '表示', 'On'], [false, 'かくす', 'Off']] },
  kbd: { jp: 'キーボード表示', en: 'Keyboard in practice', items: [[true, '表示', 'On'], [false, 'かくす', 'Off']] },
  voice: { jp: '読み上げ', en: 'Read words aloud', items: [[true, 'ON', 'On'], [false, 'OFF', 'Off']] },
  sfx: { jp: '効果音', en: 'Sound effects', items: [[true, 'ON', 'On'], [false, 'OFF', 'Off']] },
  bgm: { jp: '音楽', en: 'Music', items: [[true, 'ON', 'On'], [false, 'OFF', 'Off']] },
};
function optHTML(key, scope) {
  const o = OPTS[key];
  return `<div class="opt"><span class="opt-label">${o.jp}<small>${o.en}</small></span>` +
    `<div class="seg" role="radiogroup" aria-label="${o.jp} ${o.en}" data-key="${key}">` +
    o.items.map(([v, jp, en], i) => `<button type="button" role="radio" id="${scope}-${key}-${i}" data-v='${JSON.stringify(v)}'>${jp}<small>${en}</small></button>`).join('') +
    '</div></div>';
}
function syncSegs() {
  for (const seg of $$('.seg[data-key]')) {
    const v = JSON.stringify(settings[seg.dataset.key]);
    for (const b of seg.children) b.setAttribute('aria-checked', String(b.dataset.v === v));
  }
}

/* ---------------- on-screen keyboard ---------------- */
const KB_ROWS = {
  romaji: [
    ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus'],
    ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP'],
    ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'],
    ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash'],
  ],
  kana: [
    ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'IntlYen'],
    ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight'],
    ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Backslash'],
    ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'IntlRo'],
  ],
};
const KEY_LABEL = { Minus: '-', Equal: '^', IntlYen: '¥', BracketLeft: '@', BracketRight: '[', Semicolon: ';', Quote: ':', Backslash: ']', Comma: ',', Period: '.', Slash: '/', IntlRo: '\\' };
const keyLabel = (c) => (c.startsWith('Key') ? c.slice(3) : c.startsWith('Digit') ? c.slice(5) : KEY_LABEL[c] || c);
const KB = {
  keys: {}, cur: [],
  build(el, layout) {
    const kana = layout === 'kana';
    const indents = kana ? [0, 0.5, 0.75, 0] : [0, 0.5, 0.75, 1.25];
    el.innerHTML = KB_ROWS[kana ? 'kana' : 'romaji'].map((row, ri) => `<div class="kb-row" style="--indent:${indents[ri]}">` + row.map((code) => {
      if (code === 'ShiftLeft') return '<div class="kb-key wide" data-code="ShiftLeft">Shift</div>';
      const home = code === 'KeyF' || code === 'KeyJ' ? ' home' : '';
      if (kana) {
        const k = JIS_KANA[code] || [];
        return `<div class="kb-key${home}" data-code="${code}">${k[1] ? `<s>${k[1]}</s>` : ''}<b>${k[0] || ''}</b><i>${esc(keyLabel(code))}</i></div>`;
      }
      return `<div class="kb-key${home}" data-code="${code}"><b>${esc(keyLabel(code))}</b></div>`;
    }).join('') + '</div>').join('');
    this.keys = {}; this.cur = [];
    for (const k of $$('.kb-key', el)) this.keys[k.dataset.code] = k;
  },
  highlight(code, shift) {
    for (const k of this.cur) k.classList.remove('next');
    this.cur = [];
    for (const c of [code, shift ? 'ShiftLeft' : null]) {
      const k = c && this.keys[c];
      if (k) { k.classList.add('next'); this.cur.push(k); }
    }
  },
};

/* ---------------- practice mode ---------------- */
const Practice = {
  m: null,
  start(o) {
    this.o = o; this.words = o.words; this.i = 0;
    this.cfg = { input: settings.input, qmode: settings.qmode, furigana: settings.furigana, meaning: settings.meaning, guide: settings.guide };
    this.keysOk = 0; this.keysMiss = 0; this.t0 = 0; this.tEnd = 0; this.noHint = 0; this.done = 0; this.lastSecs = -1;
    this.log = new Map();
    $('#p-level').textContent = `${o.label} · ${this.cfg.qmode === 'read' ? '漢字→よみ' : '英語→ことば'} · ${this.cfg.input === 'kana' ? 'かな入力' : 'ローマ字'}`;
    KB.build($('#p-kbd'), this.cfg.input);
    $('#p-kbd').hidden = !settings.kbd;
    $('#p-time').textContent = '0:00';
    UI.show('practice');
    this.load();
  },
  load() {
    const e = this.words[this.i];
    this.e = e; this.m = makeMatcher(e.r, this.cfg.input);
    this.showHint = this.cfg.furigana === 'always'; this.hintUsed = false; this.misses = 0; this.locked = false;
    this.wStart = performance.now();
    $('#p-mark').innerHTML = '';
    $('#p-card').classList.remove('good');
    this.render();
  },
  key(tok) {
    if (this.locked || !this.m) return;
    if (!this.t0) this.t0 = performance.now();
    if (this.m.input(tok)) {
      this.keysOk++;
      Sound.play('type');
      if (this.m.done) this.complete(); else this.render();
    } else {
      this.keysMiss++; this.misses++;
      if (this.misses <= 3) this.rec('m');
      Sound.play('miss');
      const c = $('#p-card');
      c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
      if (this.misses >= 2) this.reveal(); else this.render();
    }
  },
  reveal() {
    if (this.showHint) return;
    this.showHint = true;
    if (this.cfg.furigana !== 'always') this.hintUsed = true;
    this.render();
  },
  hint() { if (!this.showHint && !this.locked) { Sound.play('hint'); this.reveal(); } },
  complete() {
    this.locked = true; this.done++;
    const used = this.hintUsed;
    if (!used) this.noHint++;
    this.rec(used ? 'g' : 'c');
    Sound.play('ok');
    Speech.say(this.e.r);
    this.showHint = true;
    this.render();
    $('#p-card').classList.add('good');
    $('#p-mark').innerHTML = used ? '<path d="M40 8 L74 68 L6 68 Z"/>' : '<ellipse cx="40" cy="40" rx="33" ry="29" transform="rotate(-12 40 40)"/>';
    clearTimeout(this.tm);
    this.tm = setTimeout(() => {
      if (UI.cur !== 'practice') return;
      this.i++;
      if (this.i >= this.words.length) this.finish(); else this.load();
    }, 750);
  },
  rec(kind) {
    let L = this.log.get(this.e.id);
    if (!L) this.log.set(this.e.id, (L = { e: this.e, c: 0, g: 0, m: 0, h: 0 }));
    L[kind]++;
    Stats.bump(this.e, kind);
  },
  tick() {
    if (!this.m) return;
    if (!this.showHint && !this.locked && this.cfg.furigana === 'delay' && !this.m.typed && performance.now() - this.wStart > 4000) this.reveal();
    const secs = this.t0 ? Math.floor(((this.tEnd || performance.now()) - this.t0) / 1000) : 0;
    if (secs !== this.lastSecs) { this.lastSecs = secs; $('#p-time').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`; }
  },
  render() {
    const e = this.e, m = this.m, cfg = this.cfg;
    const kanaOnly = !hasKanji(e.w), p = m.pos, hint = this.showHint;
    const prog = (text) => `<span class="done">${esc(text.slice(0, p))}</span>${esc(text.slice(p))}`;
    const readingShown = hint || (cfg.qmode === 'read' && kanaOnly);
    $('#p-count').textContent = `${this.i + 1}/${this.words.length}`;
    $('#p-bar').style.width = `${(this.i / this.words.length) * 100}%`;
    const tot = this.keysOk + this.keysMiss;
    $('#p-acc').textContent = `${tot ? Math.round((this.keysOk / tot) * 100) : 100}%`;
    $('#p-furi').innerHTML = hint && !kanaOnly ? prog(e.r) : '';
    if (cfg.qmode === 'mean') {
      $('#p-prompt').textContent = e.m;
      $('#p-word').innerHTML = hint ? (kanaOnly ? prog(e.w) : esc(e.w)) : '';
      $('#p-mean').textContent = '';
    } else {
      $('#p-prompt').textContent = '';
      $('#p-word').innerHTML = kanaOnly ? prog(e.w) : esc(e.w);
      $('#p-mean').textContent = cfg.meaning ? e.m : '';
    }
    let line = '';
    if (cfg.input === 'romaji') {
      if (readingShown && cfg.guide) {
        const g = m.guide();
        line = `<span class="done">${esc(m.typed)}</span><span class="next">${esc(g.slice(0, 1))}</span>${esc(g.slice(1))}`;
      } else line = `<span class="done">${esc(m.typed)}</span><span class="caret">_</span>`;
    } else if (!readingShown) line = `<span class="done">${esc(m.typedKana())}</span><span class="caret">_</span>`;
    $('#p-roma').innerHTML = line;
    const nc = m.nextChar();
    if (readingShown && nc && !this.locked) {
      if (cfg.input === 'kana') { const k = KANA_TO_KEY[nc]; KB.highlight(k && k.code, k && k.shift); }
      else KB.highlight(codeForRomaji(nc), false);
    } else KB.highlight(null);
    $('#p-help').innerHTML = hint ? '<kbd>Esc</kbd> やめる Quit' : '<kbd>Space</kbd> ヒント Hint · <kbd>Esc</kbd> やめる Quit';
  },
  finish() {
    this.tEnd = performance.now();
    const time = this.t0 ? (this.tEnd - this.t0) / 1000 : 0;
    const tot = this.keysOk + this.keysMiss;
    const r = {
      mode: 'practice', kind: 'clear', score: 0, destroyed: this.done, hits: 0,
      acc: tot ? this.keysOk / tot : 1, kpm: time > 1 ? (this.keysOk / time) * 60 : 0,
      maxCombo: 0, noHint: this.noHint, log: [...this.log.values()],
      cfg: Object.assign({ label: this.o.label, lv: this.o.lv, review: this.o.review }, this.cfg), time,
    };
    this.m = null;
    UI.showResult(r);
  },
  quit() {
    clearTimeout(this.tm);
    Stats.save();
    this.m = null;
    Speech.stop();
    if (this.done > 0) { this.tEnd = performance.now(); this.words = this.words.slice(0, this.done); this.m = null; this.finishPartial(); }
    else UI.toMenu();
  },
  finishPartial() {
    const time = this.t0 ? (this.tEnd - this.t0) / 1000 : 0;
    const tot = this.keysOk + this.keysMiss;
    UI.showResult({
      mode: 'practice', kind: 'clear', score: 0, destroyed: this.done, hits: 0,
      acc: tot ? this.keysOk / tot : 1, kpm: time > 1 ? (this.keysOk / time) * 60 : 0,
      maxCombo: 0, noHint: this.noHint, log: [...this.log.values()],
      cfg: Object.assign({ label: this.o.label, lv: this.o.lv, review: this.o.review }, this.cfg), time,
    });
  },
};

/* ---------------- starting runs ---------------- */
function labelFor(lv) { const L = levelOf(lv); return L ? `${L.tag} ${L.name}` : 'にがて単語'; }
function pickBossWords(lv, pool, review) {
  const byLen = shuffle(pool.slice()).sort((a, b) => b.r.length - a.r.length);
  const out = shuffle(byLen.slice(0, Math.min(8, byLen.length))).slice(0, 3);
  while (out.length < 3) out.push(pick(pool));
  if (!review && ['N3', 'N2', 'N1'].includes(lv)) out[2] = pick(VOCAB.yoji.filter((y) => lv !== 'N3' || y.common));
  return out;
}
function startMeteor(lv, pool) {
  const review = !!pool;
  const src = pool || VOCAB[lv];
  const n = review ? Math.min(30, src.length) : 30;
  const words = pickWords(src, n);
  const rest = src.filter((e) => !words.includes(e));
  const bossWords = pickBossWords(lv, rest.length >= 3 ? rest : src, review);
  const L = levelOf(lv);
  const label = labelFor(lv);
  const cfg = {
    words, bossWords, count: n, lv, label, review, demo: false, mult: L ? L.mult : 1.3,
    input: settings.input, qmode: settings.qmode, furigana: settings.furigana, meaning: settings.meaning, guide: settings.guide, diff: settings.diff,
    subtitle: `${label} · ${settings.qmode === 'read' ? '漢字→よみ' : '英語→ことば'} · ${settings.input === 'kana' ? 'かな入力' : 'ローマ字'}`,
  };
  UI.last = { kind: 'meteor', lv, pool };
  preloadFonts(words.concat(bossWords));
  Speech.stop();
  Game.start(cfg);
  UI.show('game');
  Music.stop();
  Music.start('calm');
}
function startPractice(lv, pool) {
  const review = !!pool;
  const src = pool || VOCAB[lv];
  const words = review ? shuffle(src.slice()).slice(0, 20) : pickWords(src, Math.min(20, src.length));
  UI.last = { kind: 'practice', lv, pool };
  preloadFonts(words);
  Speech.stop(); Music.stop();
  Practice.start({ words, label: labelFor(lv), lv, review });
}

const Game = new MeteorGame();
const Demo = new MeteorGame();
function startDemo() {
  // the title menu sits on the left, so the attract demo keeps its meteors on the right half
  Demo.start({ words: shuffle(VOCAB.N5.slice()), bossWords: [], lanes: [720, 850, 980, 1110], input: 'romaji', qmode: 'read', furigana: 'always', meaning: true, guide: true, diff: 'normal', demo: true, mult: 1, subtitle: '' });
}

/* ---------------- screens ---------------- */
const UI = {
  cur: null, mode: 'meteor', level: Store.get('level', 'N5'), wordTab: 'N5', last: null, reviewWords: [],

  show(id) {
    for (const s of $$('.screen')) s.hidden = s.id !== 'scr-' + id;
    this.cur = id;
    $('#pause-btn').hidden = id !== 'game';
    const ae = document.activeElement;
    if (ae && ae !== document.body && ae.blur) ae.blur();
    if (id === 'title') { this.updateBadges(); this.updateStatus(); }
    const focusEl = {
      title: '#scr-title .mi', select: '#levels .lv[aria-checked="true"]', pause: '#scr-pause .btn.primary',
      result: '#scr-result .btn.primary', weak: '#scr-weak .back', words: '#scr-words .back', settings: '#scr-settings .back', howto: '#scr-howto .back',
    }[id];
    if (focusEl) { const el = $(focusEl); if (el) el.focus({ preventScroll: true }); }
  },
  back() { this.show('title'); },
  act(name) {
    switch (name) {
      case 'meteor': case 'practice': this.openSelect(name); break;
      case 'weak': this.renderWeak(); this.show('weak'); break;
      case 'words': this.renderWords(); this.show('words'); break;
      case 'settings': this.show('settings'); break;
      case 'howto': this.show('howto'); break;
      case 'weak-meteor': { const w = weakWords(); if (w.length) startMeteor('weak', w.slice(0, 40)); break; }
      case 'weak-practice': { const w = weakWords(); if (w.length) startPractice('weak', w.slice(0, 40)); break; }
      case 'practice-quit': Practice.quit(); break;
      case 'resume': this.resume(); break;
      case 'retry': this.retry(); break;
      case 'menu': this.toMenu(); break;
      case 'review-missed': if (this.reviewWords.length) startPractice('weak', this.reviewWords); break;
      default: break;
    }
  },
  openSelect(mode) {
    this.mode = mode;
    $('#sel-title').innerHTML = mode === 'meteor' ? 'メテオ迎撃 <small>Meteor Defense</small>' : 'れんしゅう <small>Practice · 20 words</small>';
    const keys = mode === 'meteor' ? ['qmode', 'input', 'furigana', 'diff'] : ['qmode', 'input', 'furigana', 'kbd'];
    $('#sel-opts').innerHTML = keys.map((k) => optHTML(k, 'sel')).join('');
    syncSegs();
    $('#launch').innerHTML = mode === 'meteor' ? '<span>発進</span><small>LAUNCH ⏎</small>' : '<span>はじめる</span><small>START ⏎</small>';
    this.renderLevels();
    this.show('select');
  },
  renderLevels() {
    $('#levels').innerHTML = LEVEL_INFO.map((L) => {
      const words = VOCAB[L.id];
      const mastered = words.filter((e) => Stats.mastered(e.id)).length;
      const best = Best.get(L.id);
      const meta = `${words.length}語 · 覚えた ${mastered}${this.mode === 'meteor' ? ` · BEST ${best ? fmt(best) : '—'}` : ''}`;
      return `<button type="button" class="lv" role="radio" aria-checked="${L.id === this.level}" data-lv="${L.id}">` +
        `<span class="lv-tag">${L.tag}</span><span class="lv-name">${L.name}<small>${L.en}</small></span>` +
        `<span class="lv-meta">${meta}</span><span class="lv-bar" aria-hidden="true"><i style="width:${((mastered / words.length) * 100).toFixed(1)}%"></i></span></button>`;
    }).join('');
  },
  selectLevel(lv, focus) {
    this.level = lv; Store.set('level', lv);
    for (const b of $$('#levels .lv')) b.setAttribute('aria-checked', String(b.dataset.lv === lv));
    if (focus) { const el = $(`#levels .lv[data-lv="${lv}"]`); if (el) el.focus({ preventScroll: false }); }
  },
  launch() { if (this.mode === 'meteor') startMeteor(this.level); else startPractice(this.level); },
  pause() {
    if (this.cur !== 'game' || !Game.active || Game.state === 'end') return;
    Game.paused = true;
    Music.stop(); Speech.stop();
    this.show('pause');
  },
  resume() {
    if (!Game.active) { this.toMenu(); return; }
    Game.paused = false;
    this.show('game');
    Music.start(Game.boss || Game.pendingBoss ? 'boss' : 'calm');
  },
  retry() {
    const L = this.last;
    Game.active = false; Game.paused = false;
    Music.stop(); Speech.stop();
    if (!L) { this.toMenu(); return; }
    if (L.kind === 'meteor') startMeteor(L.lv, L.pool); else startPractice(L.lv, L.pool);
  },
  toMenu() {
    Game.active = false; Game.paused = false;
    Music.stop(); Speech.stop(); Stats.save();
    clearTimeout(Practice.tm); Practice.m = null;
    this.show('title');
  },
  updateBadges() {
    const n = weakWords().length, b = $('#weak-badge');
    b.textContent = n;
    b.toggleAttribute('data-zero', n === 0);
  },
  updateStatus() {
    const t = { romaji: 'ローマ字', kana: 'かな(JIS)' }[settings.input];
    const f = { always: 'いつも', delay: 'あとから', off: 'なし' }[settings.furigana];
    const d = { easy: 'ゆっくり', normal: 'ふつう', hard: 'はやい' }[settings.diff];
    $('#title-status').textContent = `入力 ${t} · ふりがな ${f} · スピード ${d} · ${ALL_WORDS.length}語`;
  },
  renderWeak() {
    const list = weakWords();
    $('#weak-list').innerHTML = list.length
      ? list.slice(0, 80).map((e) => { const s = Stats.get(e.id); return wordRow(e, `<span class="wr-tag hit">×${s.h} △${s.g} ○${s.c}</span>`); }).join('')
      : '<li class="empty">まだありません。ミッションで当たった単語がここに集まります。<span class="en">Nothing yet. Words you miss in a mission will collect here.</span></li>';
    for (const b of $$('#weak-actions button')) b.disabled = !list.length;
  },
  renderWords() {
    const tabs = LEVEL_INFO.map((L) => [L.id, L.tag]).concat([['yoji', '四字熟語'], ['weak', 'にがて']]);
    $('#word-tabs').innerHTML = tabs.map(([id, t]) => `<button type="button" role="tab" data-tab="${id}" aria-selected="${id === this.wordTab}">${t}</button>`).join('');
    const q = $('#word-search').value.trim().toLowerCase();
    let list = this.wordTab === 'weak' ? weakWords() : VOCAB[this.wordTab];
    if (q) {
      const qh = toHira(q);
      list = list.filter((e) => e.w.includes(q) || toHira(e.r).includes(qh) || e.m.toLowerCase().includes(q) || romajiOf(e).includes(q));
    }
    $('#word-count').textContent = `${list.length}語${q ? ` · 「${q}」` : ''}`;
    $('#word-tbody').innerHTML = list.map((e) => {
      const s = Stats.get(e.id), seen = Stats.seen(e.id) || s.m > 0;
      const rec = seen ? `<span class="good">○${s.c}</span> △${s.g} <span class="${s.h ? 'weak' : ''}">×${s.h}</span>` : '—';
      return `<tr><td><button class="say" type="button" data-say="${esc(e.id)}" aria-label="読み上げ ${esc(e.w)}">${SPK}</button></td>` +
        `<td class="w">${esc(e.w)}</td><td class="r">${hasKanji(e.w) ? esc(e.r) : ''}</td><td class="ro">${esc(romajiOf(e))}</td>` +
        `<td class="m">${esc(e.m)}</td><td class="rec">${rec}</td></tr>`;
    }).join('') || '<tr><td colspan="6" class="empty">見つかりません。 No matching words.</td></tr>';
  },
  showResult(r) {
    Stats.save();
    const cfg = r.cfg, meteor = r.mode === 'meteor';
    const total = r.destroyed + r.hits;
    const clearRate = total ? r.destroyed / total : 1;
    const noHintRate = cfg.furigana === 'always' ? 0.6 : r.destroyed ? r.noHint / r.destroyed : 0;
    let p = clearRate * 55 + r.acc * 30 + noHintRate * 15;
    if (r.kind === 'over') p = Math.min(p, 64);
    const G = [
      [92, '秀', 'Excellent', 'すばらしい！ほとんどヒントなしで打てました。', 'Outstanding: almost no hints needed.'],
      [80, '優', 'Very good', 'よくできました。この調子で次のレベルへ。', 'Great work. You are ready for more.'],
      [68, '良', 'Good', 'いい調子です。下の単語をふくしゅうしよう。', 'Good. Review the words below.'],
      [55, '可', 'Pass', 'もう少し。ふりがな「いつも」やスピード「ゆっくり」でも練習できます。', 'Almost. Try Always furigana or Easy speed.'],
      [-1, '不可', 'Try again', 'まずは「れんしゅう」で単語を覚えよう。', 'Start with Practice to learn these words first.'],
    ];
    const g = G.find((x) => p >= x[0]);
    const st = $('#r-stamp');
    st.textContent = g[1];
    st.classList.toggle('two', g[1].length > 1);
    st.style.animation = 'none'; void st.offsetWidth; st.style.animation = '';
    $('#r-grade-en').textContent = g[2];
    const heads = meteor ? (r.kind === 'over' ? ['SHIELD DOWN', 'シールド崩壊'] : ['MISSION COMPLETE', 'ミッション達成']) : ['PRACTICE COMPLETE', 'れんしゅう完了'];
    $('#r-eyebrow').textContent = `${heads[0]} · ${cfg.label || labelFor(cfg.lv)}`;
    $('#r-title').textContent = heads[1];
    $('#r-msg').innerHTML = `${esc(g[3])}<span class="en">${esc(g[4])}</span>`;
    const stat = (v, label, cls = '', extra = '') => `<div class="stat"><b class="${cls}">${v}</b><span>${label}</span>${extra}</div>`;
    const pct = (x) => `${Math.round(x * 100)}%`;
    let html = '';
    if (meteor) {
      const newBest = !cfg.review && Best.put(cfg.lv, cfg, r.score);
      html += stat(fmt(r.score), 'スコア Score', 'gold', newBest ? '<em>NEW BEST</em>' : '');
      html += stat(`${r.destroyed}/${total}`, '撃墜 Destroyed');
      html += stat(pct(r.acc), '正確さ Accuracy');
      html += stat(Math.round(r.kpm), '速さ Keys/min');
      html += stat(r.maxCombo, '最大コンボ Max combo');
      if (cfg.furigana !== 'always') html += stat(`${r.noHint}/${r.destroyed}`, 'ヒントなし No hint');
    } else {
      html += stat(r.destroyed, '単語 Words');
      html += stat(pct(r.acc), '正確さ Accuracy');
      html += stat(Math.round(r.kpm), '速さ Keys/min');
      if (cfg.furigana !== 'always') html += stat(`${r.noHint}/${r.destroyed}`, 'ヒントなし No hint');
      html += stat(`${Math.floor(r.time / 60)}:${String(Math.round(r.time % 60)).padStart(2, '0')}`, '時間 Time');
    }
    $('#r-stats').innerHTML = html;
    const review = r.log.filter((L) => L.h || L.g || L.m).sort((a, b) => b.h - a.h || b.g - a.g || b.m - a.m);
    const learned = r.log.filter((L) => L.c && !L.h && !L.g).length;
    this.reviewWords = review.map((L) => L.e);
    $('#r-review-h').innerHTML = `ふくしゅう <small>Review these words · ${review.length}語 / ヒントなしで正解 ${learned}語</small>`;
    $('#r-list').innerHTML = review.length
      ? review.map((L) => {
        const tag = L.h ? '<span class="wr-tag hit">× 当たった Hit</span>' : L.g ? '<span class="wr-tag hint">△ ヒント Hint</span>' : `<span class="wr-tag miss">ミス ${L.m} Typos</span>`;
        return wordRow(L.e, tag);
      }).join('')
      : '<li class="empty">ふくしゅうする単語はありません。全部ヒントなしで正解！<span class="en">Nothing to review: every word right without a hint.</span></li>';
    $('#r-review-btn').disabled = !review.length;
    this.show('result');
    setTimeout(() => Sound.play('stamp'), 120);
  },
};

function wordRow(e, tag) {
  return `<li class="wr"><button class="say" type="button" data-say="${esc(e.id)}" aria-label="読み上げ ${esc(e.w)}">${SPK}</button>` +
    `<span class="wr-w">${esc(e.w)}</span><span class="wr-r">${hasKanji(e.w) ? esc(e.r) : ''}<i>${esc(romajiOf(e))}</i></span>` +
    `<span class="wr-m">${esc(e.m)}</span>${tag || ''}</li>`;
}

/* ---------------- keyboard ---------------- */
function onGameKey(e) {
  if (e.key === 'Escape') { e.preventDefault(); UI.pause(); return; }
  e.preventDefault();
  if (e.repeat || Game.paused || !Game.active) return;
  if (e.code === 'Space' || e.key === ' ') { Game.hint(); return; }
  if (e.key === 'Backspace') { Game.release(); return; }
  const tok = Game.cfg.input === 'kana' ? kanaToken(e) : romajiToken(e);
  if (tok) Game.key(tok);
}
function onPracticeKey(e) {
  if (e.key === 'Escape') { e.preventDefault(); Practice.quit(); return; }
  if (e.key === 'Tab' || (e.key === 'Enter' && e.target.closest && e.target.closest('button'))) return;
  e.preventDefault();
  if (e.repeat) return;
  if (e.code === 'Space' || e.key === ' ') { Practice.hint(); return; }
  const tok = Practice.cfg.input === 'kana' ? kanaToken(e) : romajiToken(e);
  if (tok) Practice.key(tok);
}
function onMenuKey(e) {
  const inField = e.target && e.target.matches && e.target.matches('input, textarea, select');
  const onButton = e.target && e.target.closest && e.target.closest('button');
  if (e.key === 'Escape') {
    if (inField) { e.target.blur(); return; }
    if (UI.cur === 'pause') UI.resume();
    else if (UI.cur === 'result') UI.toMenu();
    else if (UI.cur !== 'title') UI.back();
    return;
  }
  if (inField) return;
  if (UI.cur === 'title') {
    const items = $$('#scr-title .mi');
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= items.length) { e.preventDefault(); items[n - 1].click(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const i = items.indexOf(document.activeElement);
      const j = i < 0 ? 0 : (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[j].focus();
    }
  } else if (UI.cur === 'select') {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (onButton && !onButton.classList.contains('lv')) return;
      e.preventDefault();
      const ids = LEVEL_INFO.map((L) => L.id);
      const i = ids.indexOf(UI.level);
      UI.selectLevel(ids[clamp(i + (e.key === 'ArrowDown' ? 1 : -1), 0, ids.length - 1)], true);
      Sound.play('select');
    } else if (e.key === 'Enter' && !onButton) { e.preventDefault(); UI.launch(); }
  } else if (UI.cur === 'result') {
    if (e.key === 'Enter' && !onButton) { e.preventDefault(); UI.retry(); }
  }
}

/* ---------------- canvas & loop ---------------- */
const cv = $('#cv');
const ctx = cv.getContext('2d');
let DPR = 1, VS = 1, VX = 0, VY = 0, lastT = 0;
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  const w = window.innerWidth, h = window.innerHeight;
  cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
  VS = Math.min(w / W, h / H); VX = (w - W * VS) / 2; VY = (h - H * VS) / 2;
  Sky.resize(w, h);
}
function frame(now) {
  const dt = lastT ? Math.min(0.05, Math.max(0, (now - lastT) / 1000)) : 0;
  lastT = now;
  Sky.update(dt);
  const inGame = (UI.cur === 'game' || UI.cur === 'pause') && Game.active;
  if (inGame && !Game.paused) Game.update(dt);
  else if (!inGame && UI.cur !== 'practice') Demo.update(dt);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  Sky.draw(ctx);
  if (UI.cur !== 'practice') {
    const g = inGame ? Game : Demo;
    if (g.active) { ctx.save(); ctx.translate(VX, VY); ctx.scale(VS, VS); g.draw(ctx); ctx.restore(); }
  } else Practice.tick();
  requestAnimationFrame(frame);
}

/* ---------------- boot ---------------- */
let booted = false;
function boot(data) {
  if (booted) return;
  booted = true;
  data = data || {};
  if (data.settings) settings = Object.assign({}, DEFAULTS, data.settings);
  if (data.stats && !Object.keys(Stats.data).length) Stats.data = data.stats;
  if (data.best && !Object.keys(Best.data).length) Best.data = data.best;
  document.documentElement.lang = 'ja';
  readColors();
  resize();
  window.addEventListener('resize', resize);
  Speech.init();
  $('#settings-opts').innerHTML = ['input', 'qmode', 'furigana', 'diff', 'meaning', 'guide', 'kbd', 'voice', 'sfx', 'bgm'].map((k) => optHTML(k, 'set')).join('');
  syncSegs();

  document.addEventListener('click', (e) => {
    Sound.init();
    const seg = e.target.closest('.seg[data-key] button');
    if (seg) {
      const k = seg.parentElement.dataset.key;
      settings[k] = JSON.parse(seg.dataset.v);
      saveSettings(); syncSegs();
      if (k === 'bgm' && !settings.bgm) Music.stop();
      if (k === 'qmode' || k === 'diff') UI.renderLevels();
      Sound.play('select');
      return;
    }
    const sayBtn = e.target.closest('[data-say]');
    if (sayBtn) { const en = ENTRY.get(sayBtn.dataset.say); if (en) say(en); return; }
    const a = e.target.closest('[data-act]');
    if (a) { UI.act(a.dataset.act); return; }
    if (e.target.closest('[data-back]')) { UI.back(); return; }
    const lv = e.target.closest('#levels .lv');
    if (lv) {
      if (UI.level === lv.dataset.lv) UI.launch();
      else { UI.selectLevel(lv.dataset.lv, true); Sound.play('select'); }
      return;
    }
    const tab = e.target.closest('#word-tabs [data-tab]');
    if (tab) { UI.wordTab = tab.dataset.tab; UI.renderWords(); $(`#word-tabs [data-tab="${UI.wordTab}"]`).focus(); }
  });
  $('#launch').addEventListener('click', () => UI.launch());
  $('#word-search').addEventListener('input', () => UI.renderWords());
  $('#pause-btn').addEventListener('click', () => UI.pause());
  $('#reset-btn').addEventListener('click', (e) => {
    const b = e.currentTarget;
    if (!b.classList.contains('armed')) {
      b.classList.add('armed');
      b.innerHTML = 'もう一度押すとリセット <small>Click again to confirm</small>';
      clearTimeout(b.tm);
      b.tm = setTimeout(() => { b.classList.remove('armed'); b.innerHTML = 'リセット <small>Reset</small>'; }, 4000);
      return;
    }
    clearTimeout(b.tm);
    Stats.reset();
    Best.data = {}; Store.del('best');
    RomajiPrefs.map = {}; RomajiPrefs.ver++; Store.del('rpref');
    romajiCache.clear();
    b.classList.remove('armed'); b.innerHTML = 'リセット <small>Reset</small>';
    toast('記録をリセットしました。 Records cleared.');
  });
  window.addEventListener('keydown', (e) => {
    Sound.init();
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (UI.cur === 'game') onGameKey(e);
    else if (UI.cur === 'practice') onPracticeKey(e);
    else onMenuKey(e);
  });
  window.addEventListener('blur', () => UI.pause());
  document.addEventListener('visibilitychange', () => { if (document.hidden) UI.pause(); });
  setInterval(() => Stats.save(), 8000);

  Game.onEnd = (r) => { Music.stop(); UI.showResult(r); };
  if (document.fonts && document.fonts.load) {
    document.fonts.load('80px "Dela Gothic One"', 'WAVE 0123456789 WARNING MISSION COMPLETE SHIELD DOWN ことばメテオ発進').catch(() => {});
    document.fonts.load('700 30px "Chakra Petch"', '0123456789 SCORE COMBO SHIELD ACC KPM GIANT METEOR abcdefghijklmnopqrstuvwxyz-').catch(() => {});
    preloadFonts(VOCAB.N5);
  }
  startDemo();
  UI.show('title');
  requestAnimationFrame(frame);
}

try {
  if (window.claude && window.claude.hot && typeof window.claude.hot.snapshot === 'function') {
    window.claude.hot.snapshot(() => ({ settings, stats: Stats.data, best: Best.data }));
  }
} catch (e) { /* not in a viewer */ }
{
  const hot = window.claude && window.claude.hot;
  if (hot && typeof hot.ready === 'function') hot.ready(boot);
  else boot((hot && hot.data) || {});
}

/* test hook */
window.KM = { Game, Demo, Practice, UI, VOCAB, Stats, makeMatcher, get settings() { return settings; } };
