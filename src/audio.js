'use strict';
/* ============================================================
   AUDIO — synthesized sound effects, procedural music, read-aloud
   (no audio files: everything is generated with Web Audio)
   ============================================================ */

const Sound = {
  ctx: null, out: null, sfx: null, music: null, noiseBuf: null,
  enabled: () => (typeof settings === 'undefined' ? true : settings.sfx),

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { return; }
    const c = this.ctx;
    this.out = c.createDynamicsCompressor();
    this.out.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.gain.value = 0.55; this.sfx.connect(this.out);
    this.music = c.createGain(); this.music.gain.value = 0.3; this.music.connect(this.out);
    const len = c.sampleRate;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  },

  tone({ type = 'sine', f0 = 440, f1 = 0, dur = 0.12, vol = 0.2, at = 0, attack = 0.004, dest = null }) {
    const c = this.ctx, t = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfx);
    o.start(t); o.stop(t + dur + 0.03);
  },

  noise({ dur = 0.4, vol = 0.3, f0 = 2000, f1 = 200, q = 0.7, type = 'lowpass', at = 0, dest = null }) {
    const c = this.ctx, t = c.currentTime + at;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfx);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.03);
  },

  play(name) {
    if (!this.ctx || !this.enabled()) return;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    const T = (o) => this.tone(o), N = (o) => this.noise(o);
    switch (name) {
      case 'type': {
        const f = 1500 * rand(0.94, 1.06);
        T({ type: 'square', f0: f, f1: f * 0.42, dur: 0.055, vol: 0.045 });
        break;
      }
      case 'miss':
        T({ type: 'sawtooth', f0: 170, f1: 85, dur: 0.14, vol: 0.09 });
        T({ type: 'square', f0: 110, dur: 0.1, vol: 0.035 });
        break;
      case 'boom':
        N({ dur: 0.55, vol: 0.42, f0: 2600, f1: 110 });
        T({ type: 'sine', f0: 150, f1: 40, dur: 0.36, vol: 0.32 });
        break;
      case 'bigboom':
        N({ dur: 1.5, vol: 0.6, f0: 3200, f1: 50, q: 0.5 });
        T({ type: 'sine', f0: 95, f1: 24, dur: 1.1, vol: 0.5 });
        N({ dur: 0.5, vol: 0.25, f0: 5000, f1: 800, type: 'bandpass', at: 0.25 });
        N({ dur: 0.4, vol: 0.2, f0: 4000, f1: 600, type: 'bandpass', at: 0.55 });
        break;
      case 'hit':
        N({ dur: 0.85, vol: 0.6, f0: 1100, f1: 60 });
        T({ type: 'square', f0: 72, f1: 30, dur: 0.5, vol: 0.22 });
        T({ type: 'sawtooth', f0: 240, f1: 60, dur: 0.4, vol: 0.09 });
        break;
      case 'combo':
        T({ type: 'triangle', f0: 1046, dur: 0.09, vol: 0.08 });
        T({ type: 'triangle', f0: 1568, dur: 0.14, vol: 0.08, at: 0.07 });
        break;
      case 'wave':
        [523, 659, 784, 1046].forEach((f, i) => T({ type: 'triangle', f0: f, dur: 0.16, vol: 0.09, at: i * 0.08 }));
        break;
      case 'alarm':
        for (let i = 0; i < 3; i++) {
          T({ type: 'square', f0: 660, dur: 0.18, vol: 0.06, at: i * 0.44 });
          T({ type: 'square', f0: 440, dur: 0.18, vol: 0.06, at: i * 0.44 + 0.21 });
        }
        break;
      case 'clear':
        [523, 659, 784, 1046, 1318].forEach((f, i) => T({ type: 'triangle', f0: f, dur: 0.22, vol: 0.1, at: i * 0.09 }));
        [523, 659, 784].forEach((f) => T({ type: 'sine', f0: f, dur: 1.2, vol: 0.06, at: 0.5 }));
        break;
      case 'over':
        [392, 349, 311, 233].forEach((f, i) => T({ type: 'sawtooth', f0: f, f1: f * 0.97, dur: 0.32, vol: 0.06, at: i * 0.22 }));
        break;
      case 'lock':
        T({ type: 'sine', f0: 1320, dur: 0.05, vol: 0.04 });
        break;
      case 'release':
        T({ type: 'sine', f0: 620, f1: 300, dur: 0.09, vol: 0.05 });
        break;
      case 'hint':
        T({ type: 'triangle', f0: 700, f1: 940, dur: 0.12, vol: 0.06 });
        break;
      case 'ok':
        T({ type: 'triangle', f0: 880, dur: 0.1, vol: 0.08 });
        T({ type: 'triangle', f0: 1318, dur: 0.18, vol: 0.08, at: 0.07 });
        break;
      case 'stamp':
        N({ dur: 0.18, vol: 0.35, f0: 900, f1: 120 });
        T({ type: 'sine', f0: 120, f1: 60, dur: 0.18, vol: 0.3 });
        break;
      case 'select':
        T({ type: 'sine', f0: 980, dur: 0.035, vol: 0.035 });
        break;
      default: break;
    }
  },
};

/* Procedural music: a slow minor-ninth loop for missions, a tenser one for the giant meteor. */
const Music = {
  on: false, timer: null, next: 0, step: 0, mode: 'calm', send: null,
  CALM: [[62, 65, 69, 72, 76], [58, 62, 65, 69, 72], [53, 57, 60, 64, 67], [60, 64, 67, 71, 74]],
  BOSS: [[62, 65, 69, 74], [63, 67, 70, 75], [58, 62, 65, 70], [61, 64, 67, 70]],
  hz: (m) => 440 * Math.pow(2, (m - 69) / 12),

  ensureFx() {
    if (this.send) return;
    const c = Sound.ctx;
    const d = c.createDelay(1); d.delayTime.value = 0.36;
    const fb = c.createGain(); fb.gain.value = 0.3;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(Sound.music);
    this.send = d;
  },
  start(mode = 'calm') {
    this.mode = mode;
    if (!Sound.ctx || !settings.bgm || this.on) return;
    this.ensureFx();
    this.on = true;
    this.next = Sound.ctx.currentTime + 0.1;
    this.step = 0;
    this.timer = setInterval(() => this.pump(), 60);
  },
  stop() { this.on = false; clearInterval(this.timer); this.timer = null; },
  setMode(m) { this.mode = m; },
  pump() {
    const c = Sound.ctx;
    if (!c || !this.on) return;
    if (c.state !== 'running') { this.next = c.currentTime + 0.1; return; }
    const spb = this.mode === 'boss' ? 60 / 136 / 2 : 60 / 96 / 2;
    while (this.next < c.currentTime + 0.25) {
      this.note(this.step, this.next, spb);
      this.next += spb; this.step++;
    }
  },
  voice(type, freq, t, dur, vol, cutoff) {
    const c = Sound.ctx;
    const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = type; o.frequency.value = freq;
    f.type = 'lowpass'; f.frequency.value = cutoff;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(Sound.music);
    o.start(t); o.stop(t + dur + 0.05);
    return g;
  },
  note(step, t, spb) {
    const boss = this.mode === 'boss';
    const prog = boss ? this.BOSS : this.CALM;
    const s = step % 8, ch = prog[Math.floor(step / 8) % prog.length];
    const pat = boss ? [0, 1, 2, 3, 2, 1, 3, 2] : [0, 2, 4, 2, 3, 1, 4, 3];
    const lead = this.voice('triangle', this.hz(ch[pat[s] % ch.length] + 12), t, spb * 1.7, boss ? 0.05 : 0.04, 3200);
    lead.connect(this.send);
    if (s === 0 || s === 4) this.voice('sine', this.hz(ch[0] - 24), t, spb * 3.6, 0.11, 600);
    if (s === 0) ch.slice(0, 4).forEach((m, i) => this.voice('sawtooth', this.hz(m) * (1 + (i - 1.5) * 0.002), t, spb * 8.4, 0.012, 900));
    if (boss) {
      const c = Sound.ctx, n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      n.buffer = Sound.noiseBuf; f.type = 'highpass'; f.frequency.value = 7000;
      g.gain.setValueAtTime(s % 2 ? 0.012 : 0.025, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      n.connect(f); f.connect(g); g.connect(Sound.music); n.start(t, Math.random() * 0.5); n.stop(t + 0.06);
    }
  },
};

/* Read-aloud through the browser's Japanese voice, when the device has one. */
const Speech = {
  voice: null,
  init() {
    if (!('speechSynthesis' in window)) return;
    const pickVoice = () => {
      const vs = window.speechSynthesis.getVoices() || [];
      this.voice = vs.find((v) => /ja[-_]JP/i.test(v.lang) && /google|kyoko|o-ren|haruka|nanami/i.test(v.name))
        || vs.find((v) => /ja[-_]JP/i.test(v.lang)) || vs.find((v) => /^ja/i.test(v.lang)) || null;
    };
    pickVoice();
    try { window.speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) { window.speechSynthesis.onvoiceschanged = pickVoice; }
  },
  available() { return !!this.voice; },
  /* force: an explicit tap on a speaker button speaks even when auto read-aloud is off */
  say(text, rate = 1, force = false) {
    if ((!settings.voice && !force) || !this.voice) return false;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ja-JP'; u.voice = this.voice; u.rate = rate; u.volume = 0.9;
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  },
  stop() { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } },
};
