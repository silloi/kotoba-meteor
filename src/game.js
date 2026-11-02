'use strict';
/* ============================================================
   GAME — starfield, planet, and the meteor-defense mission
   Logical stage is 1280×720; the canvas scales it to fit.
   ============================================================ */

const W = 1280, H = 720;
const FONT = {
  body: '"BIZ UDPGothic", "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif',
  card: '"Klee One", "BIZ UDPGothic", "Hiragino Mincho ProN", "Yu Mincho", serif',
  hud: '"Chakra Petch", "BIZ UDPGothic", ui-monospace, Menlo, monospace',
  display: '"Dela Gothic One", "BIZ UDPGothic", sans-serif',
};
/* canvas colors mirror the CSS tokens; readColors() refreshes them from :root */
const COL = { space: '#070a1c', star: '#e8ecff', beam: '#6ff3ff', gold: '#ffc94a', shu: '#ee4b2b', paper: '#f5efdf', ink: '#1c2242', pencil: '#5d6584', haze: '#a3acd3' };
function readColors() {
  try {
    const cs = getComputedStyle(document.documentElement);
    for (const k of Object.keys(COL)) { const v = cs.getPropertyValue('--' + k).trim(); if (/^#[0-9a-f]{6}$/i.test(v)) COL[k] = v; }
  } catch (e) { /* keep defaults */ }
}
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const REDUCED = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const DIFF = {
  easy: { base: 6.0, perKey: 1.0, maxActive: 3, gap: 4.2 },
  normal: { base: 4.5, perKey: 0.7, maxActive: 4, gap: 3.0 },
  hard: { base: 3.2, perKey: 0.48, maxActive: 5, gap: 2.0 },
};

const CANNON = { x: 640, y: 632 };
const BAR = { cx: 640, cy: 520 + 3800, r: 3800 };              // shield arc, top at y=520
const barrierY = (x) => BAR.cy - Math.sqrt(BAR.r * BAR.r - (x - BAR.cx) * (x - BAR.cx));
const barrierAng = (x) => Math.atan2(barrierY(x) - BAR.cy, x - BAR.cx);
const PLANET = { cx: 640, cy: 640 + 1250, r: 1250 };           // planet surface, top at y=640

function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- background sky (screen space) ---------------- */
const Sky = {
  w: 0, h: 0, stars: [], neb: null, t: 0, streaks: [], streakT: 4,
  resize(w, h) {
    this.w = w; this.h = h;
    const n = Math.min(900, Math.round((w * h) / 2300));
    const tints = ['#e8ecff', '#e8ecff', '#e8ecff', '#ffe3ad', '#b2ecff'];
    this.stars = [];
    for (let i = 0; i < n; i++) {
      const z = Math.random() < 0.62 ? 0 : Math.random() < 0.72 ? 1 : 2;
      this.stars.push({ x: Math.random() * w, y: Math.random() * h, z, s: [0.8, 1.2, 1.8][z] * rand(0.75, 1.25), ph: rand(0, 6.283), f: rand(0.6, 2.4), c: pick(tints) });
    }
    this.neb = this.makeNebula(w, h);
  },
  makeNebula(w, h) {
    const c = document.createElement('canvas');
    const sw = Math.max(1, Math.round(w / 2)), sh = Math.max(1, Math.round(h / 2));
    c.width = sw; c.height = sh;
    const g = c.getContext('2d');
    const m = Math.max(sw, sh);
    const blob = (x, y, r, col) => {
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, sw, sh);
    };
    blob(sw * 0.84, sh * 0.16, m * 0.55, 'rgba(58, 48, 140, 0.32)');
    blob(sw * 0.1, sh * 0.7, m * 0.5, 'rgba(16, 104, 140, 0.22)');
    blob(sw * 0.48, sh * 0.0, m * 0.32, 'rgba(150, 56, 112, 0.13)');
    blob(sw * 0.97, sh * 0.66, m * 0.22, 'rgba(255, 190, 90, 0.07)');
    return c;
  },
  update(dt) {
    this.t += dt;
    for (const s of this.stars) {
      s.y += (s.z + 1) * 2.4 * dt;
      if (s.y > this.h + 2) { s.y = -2; s.x = Math.random() * this.w; }
    }
    this.streakT -= dt;
    if (this.streakT <= 0 && !REDUCED) {
      this.streakT = rand(5, 11);
      this.streaks.push({ x: rand(this.w * 0.3, this.w * 1.1), y: rand(-20, this.h * 0.35), vx: -rand(520, 820), vy: rand(150, 280), life: 0.9, max: 0.9 });
    }
    for (const s of this.streaks) { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; }
    this.streaks = this.streaks.filter((s) => s.life > 0);
  },
  draw(ctx) {
    ctx.fillStyle = COL.space;
    ctx.fillRect(0, 0, this.w, this.h);
    if (this.neb) ctx.drawImage(this.neb, 0, 0, this.w, this.h);
    const t = this.t;
    for (const s of this.stars) {
      const tw = s.z === 0 ? 0.6 : 0.5 + 0.5 * Math.sin(t * s.f + s.ph);
      ctx.globalAlpha = [0.4, 0.65, 0.95][s.z] * (0.5 + 0.5 * tw);
      ctx.fillStyle = s.c;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;
    for (const s of this.streaks) {
      const a = s.life / s.max, tx = s.x - s.vx * 0.12, ty = s.y - s.vy * 0.12;
      const g = ctx.createLinearGradient(s.x, s.y, tx, ty);
      g.addColorStop(0, `rgba(232,236,255,${0.8 * a})`); g.addColorStop(1, 'rgba(232,236,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tx, ty); ctx.stroke();
    }
  },
};

/* ---------------- planet (pre-rendered once) ---------------- */
let planetSprite = null;
function buildPlanet() {
  const S = 2, top = 596;
  const c = document.createElement('canvas');
  c.width = W * S; c.height = (H - top) * S;
  const g = c.getContext('2d');
  g.scale(S, S); g.translate(0, -top);
  const { cx, cy, r } = PLANET;
  const surf = (x) => cy - Math.sqrt(Math.max(0, r * r - (x - cx) * (x - cx)));
  let gr = g.createRadialGradient(cx, cy, r - 2, cx, cy, r + 30);
  gr.addColorStop(0, 'rgba(111,243,255,0.4)'); gr.addColorStop(1, 'rgba(111,243,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r + 30, 0, Math.PI * 2); g.fill();
  gr = g.createLinearGradient(0, cy - r, 0, cy - r + 110);
  gr.addColorStop(0, '#2f7fae'); gr.addColorStop(0.16, '#195281'); gr.addColorStop(0.6, '#0b2a52'); gr.addColorStop(1, '#061630');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip();
  const rnd = mulberry32(11);
  for (let i = 0; i < 16; i++) {
    const x = rnd() * W, y = surf(x) + 10 + rnd() * 70;
    g.fillStyle = `rgba(86, 168, 132, ${0.1 + rnd() * 0.12})`;
    g.beginPath(); g.ellipse(x, y, 40 + rnd() * 130, 5 + rnd() * 11, (rnd() - 0.5) * 0.15, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 10; i++) {
    const x = rnd() * W, y = surf(x) + 4 + rnd() * 50;
    g.fillStyle = `rgba(230, 240, 255, ${0.04 + rnd() * 0.06})`;
    g.beginPath(); g.ellipse(x, y, 80 + rnd() * 200, 3 + rnd() * 5, 0, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 120; i++) {
    const x = rnd() * W, y = surf(x) + 6 + rnd() * 60;
    g.fillStyle = `rgba(255, 214, 140, ${0.25 + rnd() * 0.45})`;
    g.fillRect(x, y, 1.2, 1.2);
  }
  g.restore();
  g.strokeStyle = 'rgba(190,245,255,0.75)'; g.lineWidth = 1.5;
  g.beginPath(); g.arc(cx, cy, r, Math.PI * 1.2, Math.PI * 1.8); g.stroke();
  planetSprite = { c, top };
}
function drawPlanet(ctx) {
  if (!planetSprite) buildPlanet();
  ctx.drawImage(planetSprite.c, 0, planetSprite.top, W, H - planetSprite.top);
}

function rockShape(n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand(-0.12, 0.12);
    pts.push([Math.cos(a), Math.sin(a), rand(0.78, 1.0)]);
  }
  const craters = [];
  for (let i = 0; i < 3; i++) {
    const a = rand(0, 6.28), d = rand(0.15, 0.52);
    craters.push([Math.cos(a) * d, Math.sin(a) * d, rand(0.11, 0.21)]);
  }
  return { pts, craters };
}
function makeCrack() {
  const a = rand(0, Math.PI * 2);
  const pts = [[Math.cos(a) * 0.1, Math.sin(a) * 0.1]];
  let ang = a, d = 0.1;
  for (let i = 0; i < 4; i++) { ang += rand(-0.5, 0.5); d += rand(0.18, 0.26); pts.push([Math.cos(ang) * d, Math.sin(ang) * d]); }
  return pts;
}

/* ---------------- the mission ---------------- */
class MeteorGame {
  constructor() {
    this.active = false; this.paused = false; this.onEnd = null;
    this.state = 'idle'; this.meteors = []; this.cands = []; this.primary = null; this.boss = null;
  }

  start(cfg) {
    this.cfg = cfg;
    this.D = DIFF[cfg.diff] || DIFF.normal;
    this.active = true; this.paused = false; this.finished = false;
    this.time = 0; this.stateT = 0; this.playTime = 0;
    this.meteors = []; this.parts = []; this.lasers = []; this.rings = []; this.pops = []; this.flashes = []; this.ripples = [];
    this.cands = []; this.primary = null;
    this.score = 0; this.shownScore = 0; this.combo = 0; this.maxCombo = 0; this.comboPop = 0;
    this.hp = 5; this.maxHp = 5; this.lostAt = -9;
    this.keysOk = 0; this.keysMiss = 0; this.destroyed = 0; this.hits = 0; this.noHint = 0;
    this.log = new Map();
    this.queue = cfg.words.slice(); this.qi = 0;
    this.shake = 0; this.redFlash = 0; this.barrierFlash = 0; this.missFlash = 0; this.recoil = 0;
    this.cannonA = -Math.PI / 2;
    this.boss = null; this.pendingBoss = false; this.banner = null; this.endKind = null;
    this.waveSpeed = 1; this.waves = null;
    if (cfg.demo) {
      this.state = 'play'; this.waveLeft = Infinity; this.spawnT = 0.6; this.aiT = 1.2;
    } else {
      const total = clamp(cfg.count || cfg.words.length, 6, 30);
      const a = Math.round(total * 0.27), b = Math.round(total * 0.33);
      this.waves = [{ n: a, speed: 1 }, { n: b, speed: 1.12 }, { n: total - a - b, speed: 1.25 }];
      this.beginWave(0);
    }
  }
  sfx(name) { if (!this.cfg.demo) Sound.play(name); }

  /* ----- flow ----- */
  beginWave(i) {
    const w = this.waves[i];
    this.waveIdx = i; this.waveLeft = w.n; this.waveTotal = w.n; this.waveSpeed = w.speed;
    this.state = 'banner'; this.stateT = 0;
    const subs = [this.cfg.subtitle, '隕石が速くなる  ·  Meteors speed up', '最終ウェーブ  ·  Final wave'];
    this.banner = { title: `WAVE ${i + 1}`, sub: subs[i], dur: 2.2 };
    this.sfx('wave');
  }
  beginBoss() {
    this.state = 'banner'; this.stateT = 0; this.pendingBoss = true;
    this.banner = { title: 'WARNING', sub: '巨大隕石 接近中  ·  Giant meteor approaching', dur: 3.0, warn: true };
    this.sfx('alarm');
    Music.setMode('boss');
  }
  spawnBoss() {
    const words = this.cfg.bossWords;
    const m = this.makeMeteor(words[0], { x0: 640, x1: 640, y0: 64, baseR: 86, s0: 0.7, s1: 1.1, boss: true });
    m.bossWords = words; m.bossIdx = 0; m.cracks = [];
    let total = 0;
    for (const w of words) total += this.wordTime(makeMatcher(w.r, this.cfg.input).total);
    m.T = Math.max(32, total * 1.45);
    this.boss = m; this.fragT = 5;
  }
  end(kind) {
    if (this.state === 'end') return;
    this.state = 'end'; this.stateT = 0; this.endKind = kind;
    this.cands = []; this.primary = null;
    for (const m of this.meteors) if (!m.dead) { m.dead = true; this.explode(m.x, m.y, m.r, 0.7); }
    if (kind === 'over') {
      for (let i = 0; i < 6; i++) { const x = rand(140, W - 140); this.explode(x, barrierY(x), 26, 1.2, true); }
      this.redFlash = 1; this.shake = 1;
    }
    this.banner = kind === 'clear'
      ? { title: 'MISSION COMPLETE', sub: 'ミッション達成  ·  ことば星は守られた', dur: 99 }
      : { title: 'SHIELD DOWN', sub: 'シールド崩壊  ·  ふくしゅうして再挑戦しよう', dur: 99, warn: true };
    this.sfx(kind === 'clear' ? 'clear' : 'over');
    Music.stop();
  }
  finish() {
    this.finished = true;
    const total = this.keysOk + this.keysMiss;
    const r = {
      mode: 'meteor', kind: this.endKind, score: this.score, destroyed: this.destroyed, hits: this.hits,
      acc: total ? this.keysOk / total : 1, kpm: this.playTime > 1 ? (this.keysOk / this.playTime) * 60 : 0,
      maxCombo: this.maxCombo, noHint: this.noHint, log: [...this.log.values()], cfg: this.cfg, time: this.playTime,
    };
    this.active = false;
    if (this.onEnd) this.onEnd(r);
  }

  /* ----- meteors ----- */
  wordTime(keys) {
    const D = this.D, cfg = this.cfg;
    let T = D.base + D.perKey * keys * (cfg.input === 'kana' ? 1.7 : 1);
    if (cfg.qmode === 'mean') T *= 1.3;
    return T;
  }
  makeMeteor(entry, o = {}) {
    const matcher = makeMatcher(entry.r, this.cfg.input);
    const keys = matcher.total;
    let x0 = o.x0;
    if (x0 == null) {
      const lanes = this.cfg.lanes || [150, 285, 420, 555, 725, 860, 995, 1130];
      let free = lanes.filter((x) => !this.meteors.some((m) => !m.dead && !m.boss && m.t < 0.45 && Math.abs(m.x0 - x) < 150));
      if (!free.length) free = lanes;
      x0 = pick(free) + rand(-24, 24);
    }
    const x1 = o.x1 != null ? o.x1 : clamp(lerp(x0, 640, 0.22) + rand(-60, 60), 120, 1160);
    const baseR = o.baseR || 24 + Math.min(14, keys * 0.8);
    const s0 = o.s0 || 0.52, s1 = o.s1 || 1.18;
    const wordT = this.wordTime(keys);
    const m = {
      entry, matcher, keys, x0, x1, y0: o.y0 != null ? o.y0 : 104, y1: barrierY(x1) - baseR * s1 * 0.85,
      t: 0, T: wordT / this.waveSpeed, wordT, age: 0, wordAge: 0, baseR, s0, s1,
      rot: rand(0, 6.28), vr: rand(-0.9, 0.9), shape: rockShape(o.boss ? 16 : 11), tilt: REDUCED ? 0 : rand(-0.06, 0.06),
      hinted: false, showHint: false, hintShown: false, misses: 0, dead: false, boss: !!o.boss, hitFx: 0, pop: 0,
    };
    const dx = m.x1 - m.x0, dy = m.y1 - m.y0, dl = Math.hypot(dx, dy) || 1;
    m.dir = [dx / dl, dy / dl];
    this.place(m);
    this.meteors.push(m);
    return m;
  }
  place(m) {
    const ee = Math.pow(clamp(m.t, 0, 1), 1.35);
    m.ee = ee;
    m.x = lerp(m.x0, m.x1, ee); m.y = lerp(m.y0, m.y1, ee);
    const p = clamp(m.age / 0.35, 0, 1);
    m.pop = 1 - Math.pow(1 - p, 3);
    m.r = m.baseR * lerp(m.s0, m.s1, ee) * Math.max(0.05, m.pop);
  }
  conflicts(e) {
    const r = toHira(e.r);
    return this.meteors.some((m) => !m.dead && (m.entry === e || m.matcher.s.startsWith(r) || r.startsWith(m.matcher.s)));
  }
  nextEntry() {
    const n = this.queue.length;
    for (let k = 0; k < n; k++) {
      const idx = (this.qi + k) % n, cur = this.qi % n;
      const e = this.queue[idx];
      if (!this.conflicts(e)) {
        this.queue[idx] = this.queue[cur]; this.queue[cur] = e;
        this.qi++;
        return e;
      }
    }
    return null;
  }

  /* ----- input ----- */
  key(tok) {
    if (this.state !== 'play' && this.state !== 'boss') return;
    const pool = this.cands.length ? this.cands : this.meteors.filter((m) => !m.dead);
    if (!pool.length) return;
    const acc = [];
    for (const m of pool) if (m.matcher.input(tok)) acc.push(m);
    if (!acc.length) { this.miss(); return; }
    if (this.cands.length) for (const m of this.cands) if (!acc.includes(m)) m.matcher.reset();
    this.cands = acc;
    this.keysOk++;
    this.primary = acc.reduce((a, b) => (b.t > a.t ? b : a));
    this.fire(this.primary);
    const done = acc.find((m) => m.matcher.done);
    if (done) {
      for (const m of acc) if (m !== done) m.matcher.reset();
      this.cands = []; this.primary = null;
      this.complete(done);
    }
  }
  hint() {
    if (this.state !== 'play' && this.state !== 'boss') return;
    const live = this.meteors.filter((m) => !m.dead && !m.showHint);
    const m = (this.primary && !this.primary.showHint) ? this.primary : live.reduce((a, b) => (!a || b.t > a.t ? b : a), null);
    if (!m) return;
    m.hinted = true;
    this.sfx('hint');
  }
  release() {
    if (!this.cands.length) return;
    for (const m of this.cands) m.matcher.reset();
    this.cands = []; this.primary = null;
    this.sfx('release');
  }

  /* ----- events ----- */
  fire(m) {
    const a = Math.atan2(m.y - CANNON.y, m.x - CANNON.x);
    this.cannonA = a;
    const mx = CANNON.x + Math.cos(a) * 58, my = CANNON.y + Math.sin(a) * 58;
    this.lasers.push({ x0: mx, y0: my, x1: m.x + rand(-0.3, 0.3) * m.r, y1: m.y + rand(-0.3, 0.3) * m.r, life: 0.11, max: 0.11 });
    this.recoil = 1; m.hitFx = 0.09;
    this.burst(m.x, m.y, REDUCED ? 2 : 5, { colors: [COL.beam, '#ffffff'], speed: [60, 220], life: [0.15, 0.35], size: [1.2, 2.4] });
    this.sfx('type');
  }
  miss() {
    this.keysMiss++; this.combo = 0; this.missFlash = 1;
    for (const m of this.cands) {
      m.misses++; m.hitFx = 0.15;
      if (m.misses <= 3) this.record(m.entry, 'm');
    }
    this.sfx('miss');
  }
  complete(m) {
    const cfg = this.cfg;
    const usedHint = cfg.furigana !== 'always' && m.hintShown;
    const base = 10 * m.keys;
    const prog = m.boss ? clamp(m.wordAge / m.wordT, 0, 1) : clamp(m.t, 0, 1);
    let pts = base + Math.round(base * (1 - prog) * 0.8);
    if (cfg.furigana !== 'always' && !usedHint) pts = Math.round(pts * 1.5);
    this.combo++; this.comboPop = 1;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    pts = Math.round(pts * (cfg.mult || 1) * (1 + Math.min(this.combo, 40) * 0.05));
    if (!cfg.demo) this.score += pts;
    this.destroyed++;
    if (!usedHint) this.noHint++;
    this.record(m.entry, usedHint ? 'g' : 'c');
    if (!cfg.demo) Speech.say(m.entry.r, 1.05);
    if (this.combo % 10 === 0) this.sfx('combo');
    this.learnPop(m, cfg.demo ? null : `+${fmt(pts)}`, cfg.demo ? null : usedHint ? '△' : '○', false);
    if (m.boss) { this.bossWordDone(m); return; }
    m.dead = true;
    this.explode(m.x, m.y, m.r, 1);
  }
  bossWordDone(m) {
    this.explode(m.x + rand(-0.4, 0.4) * m.r, m.y + rand(-0.3, 0.3) * m.r, m.r * 0.45, 0.8);
    m.cracks.push(makeCrack());
    m.bossIdx++;
    if (m.bossIdx >= m.bossWords.length) {
      m.dead = true; this.boss = null;
      const bonus = Math.round(1000 * (this.cfg.mult || 1));
      this.score += bonus;
      this.explode(m.x, m.y, m.r, 3.2);
      this.pops.push({ x: m.x, y: m.y - 40, rise: 60, life: 2.4, max: 2.4, lines: [{ t: `BOSS BONUS +${fmt(bonus)}`, f: `700 26px ${FONT.hud}`, c: COL.gold }] });
      this.end('clear');
      return;
    }
    m.entry = m.bossWords[m.bossIdx];
    m.matcher = makeMatcher(m.entry.r, this.cfg.input);
    m.keys = m.matcher.total; m.wordT = this.wordTime(m.keys);
    m.hinted = false; m.showHint = false; m.hintShown = false; m.misses = 0; m.wordAge = 0;
    m.t = Math.max(0, m.t - 0.06); m.hitFx = 0.4;
    this.shake = Math.max(this.shake, 0.35);
  }
  impact(m) {
    m.dead = true;
    if (this.cfg.demo) { this.explode(m.x, m.y, m.r, 0.8); return; }
    this.hp = Math.max(0, this.hp - (m.boss ? 3 : 1));
    this.lostAt = this.time;
    this.hits++; this.combo = 0;
    this.record(m.entry, 'h');
    this.cands = this.cands.filter((x) => x !== m);
    if (this.primary === m) this.primary = this.cands[0] || null;
    const bx = m.x, by = barrierY(m.x);
    this.explode(bx, by - 6, m.r, m.boss ? 2.4 : 1.1, true);
    this.ripples.push({ x: bx, life: 0.9, max: 0.9 });
    this.redFlash = 1; this.barrierFlash = 1; this.shake = Math.max(this.shake, m.boss ? 1 : 0.55);
    this.sfx('hit');
    this.learnPop(m, null, '×', true);
    if (m.boss) this.boss = null;
    if (this.hp <= 0) this.end('over');
    else if (m.boss) this.end('clear');
  }
  record(e, kind) {
    if (this.cfg.demo) return;
    let L = this.log.get(e.id);
    if (!L) this.log.set(e.id, (L = { e, c: 0, g: 0, m: 0, h: 0 }));
    L[kind]++;
    Stats.bump(e, kind);
  }

  /* ----- effects ----- */
  learnPop(m, scoreText, mark, bad) {
    const e = m.entry, lines = [];
    if (scoreText) lines.push({ t: scoreText, f: `700 22px ${FONT.hud}`, c: COL.gold });
    lines.push({ t: hasKanji(e.w) ? `${e.w}（${e.r}）` : e.w, f: `600 19px ${FONT.card}`, c: bad ? '#ffc2b6' : COL.star });
    lines.push({ t: e.m, f: `400 13px ${FONT.body}`, c: COL.haze });
    const y = bad ? barrierY(m.x) - 70 : Math.max(136, m.y - 8);
    this.pops.push({ x: clamp(m.x, 150, W - 150), y, rise: bad ? 30 : 46, life: bad ? 2.8 : 1.9, max: bad ? 2.8 : 1.9, lines, mark });
    if (this.pops.length > 8) this.pops.shift();
  }
  explode(x, y, r, scale = 1, red = false) {
    const k = REDUCED ? 0.45 : 1;
    const cols = red ? ['#ffffff', '#ffc2b6', COL.shu, '#ff7a45'] : ['#fff6d8', '#ffd36b', '#ff9d3b', '#ff5a2a'];
    this.flashes.push({ x, y, r: r * 3.2 * Math.sqrt(scale), life: 0.2, max: 0.2 });
    this.burst(x, y, Math.round(30 * scale * k), { colors: cols, speed: [90, 380 * Math.sqrt(scale)], life: [0.35, 0.95], size: [1.4, 3.6] });
    for (let i = 0, n = Math.round(8 * scale * k); i < n; i++) {
      const a = rand(0, 6.283), sp = rand(40, 190) * Math.sqrt(scale), life = rand(0.8, 1.4);
      this.parts.push({ k: 'debris', x: x + Math.cos(a) * r * 0.4, y: y + Math.sin(a) * r * 0.4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life, max: life, size: rand(2.5, 6) * Math.max(0.6, r / 30), rot: rand(0, 6), vr: rand(-6, 6), drag: 1.2, g: 50, col: pick(['#6b605a', '#4f4642', '#8a7d74']) });
    }
    for (let i = 0, n = Math.round(5 * Math.sqrt(scale)); i < n; i++) {
      const life = rand(0.7, 1.2);
      this.parts.push({ k: 'smoke', x: x + rand(-0.4, 0.4) * r, y: y + rand(-0.4, 0.4) * r, vx: rand(-30, 30), vy: rand(-40, 10), life, max: life, size: r * rand(0.6, 1.0), grow: r * 1.4, drag: 1.5 });
    }
    this.rings.push({ x, y, r0: r * 0.8, r1: r * 3.4 * Math.sqrt(scale), life: 0.45, max: 0.45, col: red ? COL.shu : '#ffd68a' });
    this.shake = Math.max(this.shake, 0.16 * scale);
    this.sfx(scale >= 2 ? 'bigboom' : 'boom');
  }
  burst(x, y, n, o) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), sp = rand(o.speed[0], o.speed[1]), life = rand(o.life[0], o.life[1]);
      this.parts.push({ k: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life, max: life, size: rand(o.size[0], o.size[1]), col: pick(o.colors), drag: 2.4 });
    }
  }

  /* ----- update ----- */
  update(dt) {
    this.time += dt; this.stateT += dt;
    this.updateFx(dt);
    const tgt = this.primary && !this.primary.dead ? this.primary : null;
    const ta = tgt ? Math.atan2(tgt.y - CANNON.y, tgt.x - CANNON.x) : -Math.PI / 2;
    this.cannonA += (ta - this.cannonA) * Math.min(1, dt * 12);

    if (this.state === 'banner' && this.stateT >= this.banner.dur) {
      this.banner = null; this.stateT = 0;
      if (this.pendingBoss) { this.pendingBoss = false; this.spawnBoss(); this.state = 'boss'; }
      else { this.state = 'play'; this.spawnT = 0.3; }
    }
    if (this.state === 'play' || this.state === 'boss') {
      this.playTime += dt;
      this.updateSpawns(dt);
    }
    this.updateMeteors(dt);
    if (this.state === 'play' && !this.cfg.demo && this.waveLeft <= 0 && this.meteors.length === 0) {
      if (this.waveIdx + 1 < this.waves.length) this.beginWave(this.waveIdx + 1);
      else this.beginBoss();
    }
    if (this.cfg.demo) this.demoAI(dt);
    if (this.state === 'end' && this.stateT > 2.8 && !this.finished) this.finish();
  }
  updateSpawns(dt) {
    const D = this.D;
    const small = this.meteors.filter((m) => !m.dead && !m.boss).length;
    if (this.state === 'play') {
      this.spawnT -= dt;
      if (small === 0 && this.spawnT > 0.5) this.spawnT = 0.5;
      if (this.waveLeft > 0 && small < D.maxActive && this.spawnT <= 0) {
        const e = this.nextEntry();
        if (e) { this.makeMeteor(e); this.waveLeft--; this.spawnT = (D.gap * rand(0.85, 1.15)) / this.waveSpeed; }
        else this.spawnT = 0.3;
      }
    } else if (this.state === 'boss' && this.boss && !this.boss.dead) {
      this.fragT -= dt;
      if (this.fragT <= 0 && small < 2) {
        const e = this.nextEntry();
        if (e) {
          const f = this.makeMeteor(e, { x0: clamp(this.boss.x + rand(-90, 90), 120, 1160), y0: this.boss.y + 20, s0: 0.42 });
          f.T *= 1.1;
        }
        this.fragT = D.gap * 1.6;
      }
    }
  }
  updateMeteors(dt) {
    const f = this.cfg.furigana;
    for (const m of this.meteors) {
      if (m.dead) continue;
      m.age += dt; m.wordAge += dt;
      if (this.state !== 'end') m.t += dt / m.T;
      m.rot += m.vr * dt;
      m.hitFx = Math.max(0, m.hitFx - dt);
      this.place(m);
      if (!m.showHint) {
        const typing = this.cands.includes(m) && m.matcher.typed.length > 0;
        const timeUp = f === 'delay' && !typing && m.wordAge >= Math.max(2.5, m.wordT * 0.3);
        if (this.cfg.demo || f === 'always' || m.hinted || m.misses >= 2 || timeUp) {
          m.showHint = true;
          if (f !== 'always' && !this.cfg.demo) m.hintShown = true;
        }
      }
      if (!REDUCED && Math.random() < dt * 24) {
        const back = m.r * 0.8, life = rand(0.25, 0.6);
        this.parts.push({ k: 'spark', x: m.x - m.dir[0] * back + rand(-0.4, 0.4) * m.r, y: m.y - m.dir[1] * back + rand(-0.4, 0.4) * m.r, vx: -m.dir[0] * rand(20, 60) + rand(-15, 15), vy: -m.dir[1] * rand(20, 60) + rand(-15, 15), life, max: life, size: rand(1, 2.2), col: pick(['#ffb15c', '#ff7a3d', '#ffd98a']), drag: 1.5 });
      }
      if (m.t >= 1 && this.state !== 'end') this.impact(m);
    }
    if (this.meteors.some((m) => m.dead)) this.meteors = this.meteors.filter((m) => !m.dead);
    if (this.cands.some((m) => m.dead)) this.cands = this.cands.filter((m) => !m.dead);
    if (this.primary && this.primary.dead) this.primary = this.cands[0] || null;
  }
  updateFx(dt) {
    for (const p of this.parts) {
      const d = Math.exp(-(p.drag || 0) * dt);
      p.vx *= d; p.vy *= d;
      if (p.g) p.vy += p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.vr) p.rot += p.vr * dt;
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    if (this.parts.length > 900) this.parts.splice(0, this.parts.length - 900);
    const tick = (arr) => { for (const x of arr) x.life -= dt; return arr.filter((x) => x.life > 0); };
    this.lasers = tick(this.lasers); this.rings = tick(this.rings); this.flashes = tick(this.flashes);
    this.pops = tick(this.pops); this.ripples = tick(this.ripples);
    this.shake = Math.max(0, this.shake - dt * 1.6);
    this.redFlash = Math.max(0, this.redFlash - dt * 1.8);
    this.barrierFlash = Math.max(0, this.barrierFlash - dt * 2);
    this.missFlash = Math.max(0, this.missFlash - dt * 4);
    this.recoil = Math.max(0, this.recoil - dt * 8);
    this.comboPop = Math.max(0, this.comboPop - dt * 4);
    this.shownScore += (this.score - this.shownScore) * Math.min(1, dt * 9);
  }
  demoAI(dt) {
    this.aiT -= dt;
    if (this.aiT > 0) return;
    this.aiT = rand(0.07, 0.15);
    let target = this.primary && !this.primary.dead ? this.primary : null;
    if (!target) {
      const live = this.meteors.filter((m) => !m.dead && m.t > 0.2);
      if (!live.length) return;
      target = live.reduce((a, b) => (b.t > a.t ? b : a));
      if (!this.cands.length) { this.aiT = rand(0.3, 0.6); this.primary = target; return; }
    }
    const ch = target.matcher.nextChar();
    if (ch) this.key(ch);
  }

  /* ----- drawing ----- */
  draw(ctx) {
    const sh = this.shake * (REDUCED ? 2 : 14);
    ctx.save();
    if (sh > 0.3) ctx.translate(rand(-sh, sh), rand(-sh, sh));
    drawPlanet(ctx);
    this.drawBarrier(ctx);
    const live = this.meteors.filter((m) => !m.dead).sort((a, b) => a.t - b.t);
    for (const m of live) this.drawTrail(ctx, m);
    this.drawParts(ctx, false);
    for (const m of live) this.drawRock(ctx, m);
    this.drawLasers(ctx);
    this.drawCannon(ctx);
    this.drawParts(ctx, true);
    this.drawRings(ctx);
    for (const m of live) if (this.cands.includes(m)) this.drawReticle(ctx, m, m === this.primary);
    const rank = (m) => (m === this.primary ? 2 : this.cands.includes(m) ? 1 : 0);
    live.slice().sort((a, b) => rank(a) - rank(b) || a.t - b.t).forEach((m) => this.drawCard(ctx, m));
    this.drawPops(ctx);
    ctx.restore();
    if (this.redFlash > 0) {
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75);
      g.addColorStop(0, rgba(COL.shu, 0.08 * this.redFlash)); g.addColorStop(1, rgba(COL.shu, 0.4 * this.redFlash));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (!this.cfg.demo) this.drawHUD(ctx);
    this.drawBanner(ctx);
  }
  drawBarrier(ctx) {
    const hpK = this.hp / this.maxHp;
    let flick = 1;
    if (this.cfg.demo) flick = 0.8;
    else if (this.hp <= 0) flick = 0.08;
    else if (this.hp <= 2) flick = 0.55 + 0.45 * Math.pow(Math.sin(this.time * 18), 2);
    const a0 = barrierAng(-80), a1 = barrierAng(W + 80);
    const arc = (lw, col, from = a0, to = a1) => { ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(BAR.cx, BAR.cy, BAR.r, from, to); ctx.stroke(); };
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    arc(20, rgba(COL.beam, 0.045 * flick));
    arc(6, rgba(COL.beam, (0.06 + 0.1 * hpK) * flick));
    arc(1.6, rgba(COL.beam, (0.3 + 0.4 * hpK) * flick));
    const sx = ((this.time * 150) % (W + 600)) - 300;
    arc(3, rgba(COL.beam, 0.35 * flick), barrierAng(sx - 70), barrierAng(sx + 70));
    if (this.barrierFlash > 0) arc(5, rgba(COL.shu, this.barrierFlash));
    for (const rp of this.ripples) {
      const k = 1 - rp.life / rp.max, span = 30 + k * 300;
      arc(4 * (1 - k) + 1, rgba(COL.shu, 0.9 * (1 - k)), barrierAng(rp.x - span), barrierAng(rp.x + span));
    }
    ctx.restore();
  }
  drawTrail(ctx, m) {
    const r = m.r, d = m.dir;
    const L = r * (2.4 + 2.2 * m.ee) * (m.boss ? 1.3 : 1);
    const tx = m.x - d[0] * L, ty = m.y - d[1] * L, nx = -d[1], ny = d[0];
    const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
    g.addColorStop(0, `rgba(255,190,110,${0.4 + 0.2 * m.ee})`);
    g.addColorStop(0.4, 'rgba(255,110,60,0.17)');
    g.addColorStop(1, 'rgba(255,80,60,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(m.x + nx * r * 0.9, m.y + ny * r * 0.9);
    ctx.quadraticCurveTo(tx + nx * r * 0.2, ty + ny * r * 0.2, tx, ty);
    ctx.quadraticCurveTo(tx - nx * r * 0.2, ty - ny * r * 0.2, m.x - nx * r * 0.9, m.y - ny * r * 0.9);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  drawRock(ctx, m) {
    const r = m.r;
    if (r < 0.5) return;
    const j = m.hitFx > 0 ? m.hitFx * 30 : 0;
    const d = m.dir;
    const danger = m.t > 0.78 ? 0.5 + 0.5 * Math.sin(this.time * 14) : 0;
    ctx.save();
    ctx.translate(m.x + rand(-j, j), m.y + rand(-j, j));
    const gx = d[0] * r * 0.35, gy = d[1] * r * 0.35;
    const hg = ctx.createRadialGradient(gx, gy, r * 0.3, gx, gy, r * 1.9);
    hg.addColorStop(0, `rgba(255,${Math.round(150 - danger * 90)},70,${0.3 + 0.25 * m.ee})`);
    hg.addColorStop(1, 'rgba(255,120,60,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(gx, gy, r * 1.9, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.rotate(m.rot);
    ctx.beginPath();
    m.shape.pts.forEach(([c, s, k], i) => { const px = c * r * k, py = s * r * k; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
    ctx.closePath();
    const bg = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.05);
    bg.addColorStop(0, m.boss ? '#a09084' : '#8d8278'); bg.addColorStop(0.55, '#564c46'); bg.addColorStop(1, '#241f1d');
    ctx.fillStyle = bg; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.stroke();
    ctx.save();
    ctx.clip();
    for (const [cx, cy, cr] of m.shape.craters) {
      ctx.fillStyle = 'rgba(20,16,14,0.42)';
      ctx.beginPath(); ctx.arc(cx * r, cy * r, cr * r, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(255,230,200,0.13)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx * r + 0.6, cy * r + 0.6, cr * r, 2.2, 5.2); ctx.stroke();
    }
    ctx.rotate(-m.rot);
    const eg = ctx.createLinearGradient(-d[0] * r, -d[1] * r, d[0] * r, d[1] * r);
    eg.addColorStop(0.45, 'rgba(255,140,60,0)');
    eg.addColorStop(1, `rgba(255,170,80,${0.5 + 0.35 * danger})`);
    ctx.fillStyle = eg; ctx.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
    ctx.restore();
    if (m.cracks) {
      ctx.strokeStyle = 'rgba(255,205,130,0.95)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (const ck of m.cracks) {
        ctx.beginPath();
        ck.forEach(([x, y], i) => (i ? ctx.lineTo(x * r, y * r) : ctx.moveTo(x * r, y * r)));
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  drawReticle(ctx, m, prim) {
    const r = m.r + 12, a = this.time * 2.2;
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.strokeStyle = COL.beam; ctx.lineWidth = prim ? 2 : 1.2; ctx.globalAlpha = prim ? 0.95 : 0.5;
    for (let i = 0; i < 4; i++) { const b = a + (i * Math.PI) / 2; ctx.beginPath(); ctx.arc(0, 0, r, b - 0.32, b + 0.32); ctx.stroke(); }
    if (prim) {
      for (let i = 0; i < 4; i++) {
        const b = -a * 0.7 + (i * Math.PI) / 2 + Math.PI / 4, c = Math.cos(b), s = Math.sin(b);
        ctx.beginPath(); ctx.moveTo(c * (r + 4), s * (r + 4)); ctx.lineTo(c * (r + 11), s * (r + 11)); ctx.stroke();
      }
    }
    ctx.restore();
  }
  drawLasers(ctx) {
    if (!this.lasers.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const L of this.lasers) {
      const a = L.life / L.max;
      ctx.strokeStyle = rgba(COL.beam, 0.3 * a); ctx.lineWidth = 10 * a + 2;
      ctx.beginPath(); ctx.moveTo(L.x0, L.y0); ctx.lineTo(L.x1, L.y1); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${0.9 * a})`; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(L.x0, L.y0); ctx.lineTo(L.x1, L.y1); ctx.stroke();
    }
    ctx.restore();
  }
  drawCannon(ctx) {
    const { x, y } = CANNON;
    ctx.save();
    ctx.translate(x, y);
    ctx.save();
    ctx.rotate(this.cannonA);
    const rec = this.recoil * 7;
    ctx.fillStyle = '#2b355f'; rr(ctx, 6 - rec, -7, 50, 14, 4); ctx.fill();
    ctx.fillStyle = '#4a5a92'; rr(ctx, 6 - rec, -7, 50, 5, 3); ctx.fill();
    ctx.fillStyle = rgba(COL.beam, 0.45 + this.recoil * 0.55); ctx.fillRect(52 - rec, -5, 6, 10);
    ctx.restore();
    const gr = ctx.createRadialGradient(-8, -10, 2, 0, 0, 30);
    gr.addColorStop(0, '#5b6aa3'); gr.addColorStop(1, '#1a2245');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 6, 28, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(COL.beam, 0.6); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 6, 28, Math.PI, 0); ctx.stroke();
    const core = this.missFlash > 0 ? rgba(COL.shu, 0.6 + 0.4 * this.missFlash) : rgba(COL.beam, 0.55 + 0.4 * Math.pow(Math.sin(this.time * 3), 2));
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(0, -4, 4.5, 0, Math.PI * 2); ctx.fill();
    if (this.missFlash > 0) {
      ctx.font = `700 14px ${FONT.hud}`; ctx.textAlign = 'center'; ctx.fillStyle = rgba(COL.shu, this.missFlash);
      ctx.fillText('MISS', 0, -48 - (1 - this.missFlash) * 10);
    }
    ctx.restore();
  }
  drawParts(ctx, front) {
    ctx.save();
    if (front) ctx.globalCompositeOperation = 'lighter';
    for (const p of this.parts) {
      const a = clamp(p.life / p.max, 0, 1);
      if (front) {
        if (p.k !== 'spark') continue;
        ctx.globalAlpha = a; ctx.fillStyle = p.col;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.k === 'smoke') {
        const s = p.size + (1 - a) * p.grow;
        ctx.globalAlpha = 0.28 * a; ctx.fillStyle = '#3c3a4c';
        ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, 6.283); ctx.fill();
      } else if (p.k === 'debris') {
        ctx.globalAlpha = a; ctx.fillStyle = p.col;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      }
    }
    ctx.restore();
  }
  drawRings(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const f of this.flashes) {
      const a = f.life / f.max;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      g.addColorStop(0, `rgba(255,248,225,${0.85 * a})`); g.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
    }
    for (const R of this.rings) {
      const k = 1 - R.life / R.max;
      ctx.strokeStyle = rgba(R.col, 0.8 * (1 - k)); ctx.lineWidth = 3 * (1 - k) + 0.5;
      ctx.beginPath(); ctx.arc(R.x, R.y, lerp(R.r0, R.r1, 1 - Math.pow(1 - k, 2)), 0, 6.283); ctx.stroke();
    }
    ctx.restore();
  }

  /* the word card each meteor carries: a ring-bound study card */
  drawCard(ctx, m) {
    const cfg = this.cfg, e = m.entry, mt = m.matcher;
    const ls = (m.boss ? 1.16 : 1) * lerp(0.84, 1.04, m.ee) * m.pop;
    if (ls < 0.08) return;
    const R = (px) => px * ls;
    const isCand = this.cands.includes(m), isPrim = this.primary === m;
    const kanaOnly = !hasKanji(e.w);
    const hint = m.showHint, p = mt.pos;
    const fBody = (wt, px) => `${wt} ${R(px)}px ${FONT.body}`;
    const fCard = (px) => `600 ${R(px)}px ${FONT.card}`;
    const fHud = (px) => `600 ${R(px)}px ${FONT.hud}`;
    const prog = (text, font, base) => [{ t: text.slice(0, p), f: font, c: COL.shu }, { t: text.slice(p), f: font, c: base }];
    const lines = [];
    if (m.boss) lines.push({ h: 16, segs: [{ t: `巨大隕石  ${m.bossIdx + 1} / ${m.bossWords.length}`, f: fBody(700, 11), c: COL.shu }] });
    if (cfg.qmode === 'mean') {
      lines.push({ h: 27, segs: [{ t: e.m, f: fBody(700, 18), c: COL.ink }] });
      if (hint) {
        if (!kanaOnly) lines.push({ h: 18, segs: prog(e.r, fBody(700, 14), COL.pencil) });
        lines.push({ h: 30, segs: kanaOnly ? prog(e.w, fCard(22), COL.ink) : [{ t: e.w, f: fCard(23), c: COL.ink }] });
      }
    } else {
      if (!kanaOnly && hint) lines.push({ h: 19, segs: prog(e.r, fBody(700, 15), COL.pencil) });
      lines.push({ h: 40, segs: kanaOnly ? prog(e.w, fCard(30), COL.ink) : [{ t: e.w, f: fCard(31), c: COL.ink }] });
      if (cfg.meaning) lines.push({ h: 18, segs: [{ t: e.m, f: fBody(400, 13), c: COL.pencil }] });
    }
    const readingShown = hint || (cfg.qmode === 'read' && kanaOnly);
    if (cfg.input === 'romaji') {
      if (readingShown && cfg.guide) {
        const rest = mt.guide();
        lines.push({ h: 21, segs: [{ t: mt.typed, f: fHud(15), c: COL.shu }, { t: rest.slice(0, 1), f: fHud(15), c: COL.ink, u: true }, { t: rest.slice(1), f: fHud(15), c: '#8b91a8' }] });
      } else if (mt.typed) {
        const caret = (this.time * 2) % 1 < 0.6 ? '_' : ' ';
        lines.push({ h: 21, segs: [{ t: mt.typed, f: fHud(15), c: COL.shu }, { t: caret, f: fHud(15), c: COL.pencil }] });
      }
    } else if (!readingShown && mt.typed) {
      lines.push({ h: 20, segs: [{ t: mt.typedKana(), f: fBody(700, 15), c: COL.shu }] });
    }
    let wMax = 0;
    for (const L of lines) {
      let w = 0;
      for (const s of L.segs) { ctx.font = s.f; s.w = s.t ? ctx.measureText(s.t).width : 0; w += s.w; }
      L.w = w; wMax = Math.max(wMax, w);
    }
    const padX = R(14), padY = R(7), hole = R(17);
    const cw = Math.max(R(86), wMax + padX * 2 + hole);
    const ch = lines.reduce((a, L) => a + R(L.h), 0) + padY * 2;
    const cx = clamp(m.x, cw / 2 + 6, W - cw / 2 - 6);
    const top = m.y + m.r * 0.92 + R(6);
    ctx.save();
    ctx.globalAlpha = Math.min(1, m.pop * 1.2);
    ctx.translate(cx, top);
    ctx.rotate(isCand ? 0 : m.tilt);
    const x0 = -cw / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rr(ctx, x0 + 3, 5, cw, ch, R(7)); ctx.fill();
    if (isCand) { ctx.shadowColor = COL.beam; ctx.shadowBlur = 16; }
    ctx.fillStyle = COL.paper; rr(ctx, x0, 0, cw, ch, R(7)); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
    const danger = m.t > 0.8 && !m.boss ? 0.5 + 0.5 * Math.sin(this.time * 12) : 0;
    if (isCand) { ctx.lineWidth = isPrim ? 2.6 : 1.5; ctx.strokeStyle = COL.beam; ctx.stroke(); }
    else if (danger) { ctx.lineWidth = 2; ctx.strokeStyle = rgba(COL.shu, 0.4 + 0.6 * danger); ctx.stroke(); }
    ctx.strokeStyle = rgba(COL.shu, 0.3); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0 + hole + R(2), R(4)); ctx.lineTo(x0 + hole + R(2), ch - R(4)); ctx.stroke();
    const hx = x0 + hole * 0.55, hy = ch / 2;
    ctx.fillStyle = COL.space; ctx.beginPath(); ctx.arc(hx, hy, R(3.4), 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#c3c9dc'; ctx.lineWidth = R(2);
    ctx.beginPath(); ctx.arc(hx - R(5), hy, R(7.5), -1.1, 1.1, true); ctx.stroke();
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    let y = padY;
    for (const L of lines) {
      const lh = R(L.h);
      let x = hole / 2 - L.w / 2;
      for (const s of L.segs) {
        if (!s.t) continue;
        ctx.font = s.f; ctx.fillStyle = s.c;
        ctx.fillText(s.t, x, y + lh / 2);
        if (s.u) ctx.fillRect(x, y + lh / 2 + R(8), s.w, R(1.6));
        x += s.w;
      }
      y += lh;
    }
    ctx.restore();
  }
  drawPops(ctx) {
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const P of this.pops) {
      const k = 1 - P.life / P.max;
      const a = Math.min(1, P.life / 0.4) * Math.min(1, k * 14 + 0.15);
      const y0 = P.y - k * P.rise;
      ctx.globalAlpha = a;
      if (P.mark) this.drawMark(ctx, P.mark, P.x, y0, clamp(k * 3.2, 0, 1));
      let y = y0;
      for (const L of P.lines) {
        ctx.font = L.f; ctx.fillStyle = L.c;
        ctx.fillText(L.t, P.x, y);
        y += parseFloat(L.f.split(' ')[1]) * 1.25;
      }
    }
    ctx.restore();
  }
  /* teacher's red-pen marks: ○ right, △ right with a hint, × missed */
  drawMark(ctx, kind, x, y, prog) {
    ctx.save();
    ctx.strokeStyle = COL.shu; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalAlpha *= 0.9;
    if (kind === '○') {
      const s = -Math.PI / 2 - 0.4;
      ctx.beginPath(); ctx.ellipse(x, y, 30, 26, -0.18, s, s + (Math.PI * 2 + 0.5) * prog); ctx.stroke();
    } else if (kind === '△') {
      const pts = [[x, y - 30], [x + 30, y + 22], [x - 30, y + 22], [x, y - 30]];
      const segs = 3 * prog;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 0; i < 3; i++) {
        const f = clamp(segs - i, 0, 1);
        if (f <= 0) break;
        ctx.lineTo(lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f));
      }
      ctx.stroke();
    } else {
      const f1 = clamp(prog * 2, 0, 1), f2 = clamp(prog * 2 - 1, 0, 1);
      ctx.beginPath(); ctx.moveTo(x - 24, y - 24); ctx.lineTo(x - 24 + 48 * f1, y - 24 + 48 * f1); ctx.stroke();
      if (f2 > 0) { ctx.beginPath(); ctx.moveTo(x + 24, y - 24); ctx.lineTo(x + 24 - 48 * f2, y - 24 + 48 * f2); ctx.stroke(); }
    }
    ctx.restore();
  }
  drawHUD(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 92);
    g.addColorStop(0, rgba(COL.space, 0.9)); g.addColorStop(1, rgba(COL.space, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 92);
    const label = (t, x, y, col) => {
      ctx.font = `600 11px ${FONT.hud}`; ctx.fillStyle = col || COL.haze;
      if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
      ctx.fillText(t, x, y);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    };
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    label('SCORE', 28, 26);
    ctx.font = `700 30px ${FONT.hud}`; ctx.fillStyle = COL.gold;
    ctx.fillText(String(Math.round(this.shownScore)).padStart(7, '0'), 26, 57);
    const total = this.keysOk + this.keysMiss;
    const acc = total ? Math.round((this.keysOk / total) * 100) : 100;
    const kpm = this.playTime > 2 ? Math.round((this.keysOk / this.playTime) * 60) : 0;
    ctx.font = `500 12px ${FONT.hud}`; ctx.fillStyle = COL.haze;
    ctx.fillText(`ACC ${acc}%    KPM ${kpm}`, 28, 78);
    if (this.combo >= 2) {
      const s = 1 + this.comboPop * 0.25;
      ctx.save(); ctx.translate(200, 56); ctx.scale(s, s);
      ctx.font = `700 24px ${FONT.hud}`; ctx.fillStyle = COL.star;
      const t = String(this.combo); ctx.fillText(t, 0, 0);
      const w = ctx.measureText(t).width;
      ctx.restore();
      label('COMBO', 200 + w * s + 6, 56, COL.gold);
    }
    ctx.textAlign = 'center';
    const bx = 520, bw = 240;
    if (this.boss || this.state === 'boss' || this.pendingBoss) {
      label('GIANT METEOR', W / 2, 26, COL.shu);
      const n = this.cfg.bossWords.length, done = this.boss ? this.boss.bossIdx : this.pendingBoss ? 0 : n;
      for (let i = 0; i < n; i++) {
        const sx = bx + (bw / n) * i;
        ctx.fillStyle = i < done ? rgba(COL.shu, 0.25) : COL.shu;
        ctx.fillRect(sx + 2, 35, bw / n - 4, 6);
      }
    } else if (this.waves) {
      label(`WAVE ${this.waveIdx + 1} / ${this.waves.length}`, W / 2, 26);
      const live = this.meteors.filter((m) => !m.dead).length;
      const k = this.waveTotal ? clamp((this.waveTotal - this.waveLeft - live) / this.waveTotal, 0, 1) : 0;
      ctx.fillStyle = 'rgba(232,236,255,0.12)'; ctx.fillRect(bx, 35, bw, 5);
      ctx.fillStyle = COL.beam; ctx.fillRect(bx, 35, bw * k, 5);
    }
    ctx.textAlign = 'right';
    label('SHIELD', W - 28, 26);
    const lostFlash = Math.max(0, 1 - (this.time - this.lostAt) * 1.5);
    for (let i = 0; i < this.maxHp; i++) {
      const x = W - 28 - (this.maxHp - i) * 30 + 6, y = 35;
      ctx.beginPath(); ctx.moveTo(x + 5, y); ctx.lineTo(x + 26, y); ctx.lineTo(x + 21, y + 12); ctx.lineTo(x, y + 12); ctx.closePath();
      if (i < this.hp) { ctx.fillStyle = this.hp <= 2 ? COL.gold : COL.beam; ctx.fill(); }
      else if (i < this.hp + 3 && lostFlash > 0) { ctx.fillStyle = rgba(COL.shu, lostFlash); ctx.fill(); }
      ctx.strokeStyle = rgba(COL.beam, 0.45); ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.textAlign = 'left';
    ctx.font = `400 12px ${FONT.body}`; ctx.fillStyle = 'rgba(232,236,255,0.5)';
    ctx.fillText(this.cfg.subtitle || '', 24, H - 40);
    ctx.fillText('Space ヒント  ·  Backspace 解除  ·  Esc ポーズ', 24, H - 20);
  }
  drawBanner(ctx) {
    const b = this.banner;
    if (!b) return;
    const t = this.stateT;
    const a = Math.min(clamp(t / 0.35, 0, 1), b.dur < 50 ? clamp((b.dur - t) / 0.4, 0, 1) : 1);
    ctx.save();
    ctx.globalAlpha = a;
    if (b.warn) {
      const flash = 0.55 + 0.45 * Math.pow(Math.sin(t * 6), 2);
      ctx.fillStyle = rgba(COL.shu, 0.16 * flash); ctx.fillRect(0, H / 2 - 74, W, 132);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, H / 2 - 74, W, 10); ctx.rect(0, H / 2 + 48, W, 10); ctx.clip();
      ctx.fillStyle = rgba(COL.shu, 0.75 * flash);
      for (let x = -40 + ((t * 80) % 40); x < W + 40; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, H / 2 - 80); ctx.lineTo(x + 20, H / 2 - 80); ctx.lineTo(x + 60, H / 2 + 70); ctx.lineTo(x + 40, H / 2 + 70); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const s = 1 + (1 - clamp(t / 0.35, 0, 1)) * 0.15;
    ctx.translate(W / 2, H / 2);
    ctx.scale(s, s);
    ctx.font = `${b.title.length > 10 ? 62 : 80}px ${FONT.display}`;
    ctx.shadowColor = b.warn ? rgba(COL.shu, 0.8) : rgba(COL.beam, 0.6); ctx.shadowBlur = 24;
    ctx.fillStyle = b.warn ? '#ffd9d0' : COL.star;
    ctx.fillText(b.title, 0, 6);
    ctx.shadowBlur = 0;
    ctx.font = `700 19px ${FONT.body}`; ctx.fillStyle = b.warn ? '#ffc2b6' : COL.gold;
    ctx.fillText(b.sub || '', 0, 42);
    ctx.restore();
  }
}
