// Run: node tests/e2e.js [outdir]
// Drives the built page in Chromium: plays a full romaji mission with a bot, a kana mission,
// practice mode, every screen, and checks phone width for horizontal overflow.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = process.argv[2] || path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const FILE = 'file://' + path.join(__dirname, '..', 'docs', 'index.html');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BOT = `
window.__bot = { on: false, keys: 0, wrongEvery: 0 };
window.__botTick = setInterval(() => {
  const b = window.__bot; if (!b.on) return;
  const KMx = window.KM; const G = KMx.Game;
  let ch = null, target = null;
  if (KMx.UI.cur === 'game') {
    if (!G.active || (G.state !== 'play' && G.state !== 'boss')) return;
    target = G.primary && !G.primary.dead ? G.primary : G.meteors.filter(m => !m.dead && m.t > 0.08).sort((a, c) => c.t - a.t)[0];
    if (!target) return;
    ch = target.matcher.nextChar();
  } else if (KMx.UI.cur === 'practice') {
    const P = KMx.Practice; if (!P.m || P.locked) return;
    ch = P.m.nextChar();
  } else return;
  if (!ch) return;
  b.keys++;
  if (b.wrongEvery && b.keys % b.wrongEvery === 0) ch = KMx.settings.input === 'kana' ? 'ぬ' : 'q';
  let init;
  if (KMx.settings.input === 'kana') {
    const KK = { 'ぬ': { code: 'Digit1', shift: false } };
    const k = (typeof KANA_TO_KEY !== 'undefined' && KANA_TO_KEY[ch]) || KK[ch];
    init = { key: ch, code: k.code, shiftKey: k.shift, bubbles: true };
  } else {
    init = { key: ch, code: codeForRomaji(ch) || '', bubbles: true };
  }
  window.dispatchEvent(new KeyboardEvent('keydown', init));
}, 70);
`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(FILE, { waitUntil: 'load' });
  await sleep(2500);
  await page.screenshot({ path: path.join(OUT, '01-title.png') });
  const st = async () => page.evaluate(() => ({ cur: KM.UI.cur, state: KM.Game.state, score: KM.Game.score, destroyed: KM.Game.destroyed, hits: KM.Game.hits, hp: KM.Game.hp, ok: KM.Game.keysOk, miss: KM.Game.keysMiss, active: KM.Game.active, boss: !!KM.Game.boss, live: KM.Game.meteors.length }));

  // title → select (key 1) → launch (Enter)
  await page.keyboard.press('1');
  await sleep(400);
  await page.screenshot({ path: path.join(OUT, '02-select.png') });
  console.log('after 1:', (await st()).cur);
  await page.keyboard.press('Enter');
  await sleep(600);
  console.log('after Enter:', await st());
  await sleep(2600);
  await page.screenshot({ path: path.join(OUT, '03-wave1.png') });

  // real key presses: type the first few characters of the closest meteor
  for (let i = 0; i < 4; i++) {
    const ch = await page.evaluate(() => { const G = KM.Game; const t = G.primary || G.meteors.filter((m) => !m.dead).sort((a, b) => b.t - a.t)[0]; return t ? t.matcher.nextChar() : null; });
    if (ch) await page.keyboard.press(ch === '-' ? 'Minus' : ch);
    await sleep(60);
  }
  await page.screenshot({ path: path.join(OUT, '04-typing.png') });
  const s1 = await st();
  console.log('after real keys:', s1);
  if (s1.ok < 1) errors.push('real key presses were not accepted');
  // a wrong key
  const before = (await st()).miss;
  await page.keyboard.press('Backspace');
  await page.keyboard.press('x'); await page.keyboard.press('x'); await page.keyboard.press('x');
  await sleep(100);
  console.log('miss count', before, '->', (await st()).miss);
  // let several meteors gather to check the composition
  await sleep(6500);
  await page.screenshot({ path: path.join(OUT, '04b-crowd.png') });

  // pause / resume
  await page.keyboard.press('Escape');
  await sleep(300);
  await page.screenshot({ path: path.join(OUT, '05-pause.png') });
  console.log('pause:', (await st()).cur);
  await page.keyboard.press('Escape');
  await sleep(200);
  console.log('resume:', (await st()).cur);

  // bot plays the rest (with a typo every 25 keys)
  await page.evaluate(BOT);
  await page.evaluate(() => { window.__bot.on = true; window.__bot.wrongEvery = 25; });
  let shotBoss = false, shotMid = false;
  for (let t = 0; t < 140; t++) {
    await sleep(500);
    const s = await st();
    if (!shotMid && s.destroyed >= 12) { shotMid = true; await page.screenshot({ path: path.join(OUT, '06-mid.png') }); }
    if (!shotBoss && s.boss) { await sleep(1200); shotBoss = true; await page.screenshot({ path: path.join(OUT, '07-boss.png') }); }
    if (s.cur === 'result') break;
  }
  await page.evaluate(() => { window.__bot.on = false; });
  await sleep(900);
  const sr = await st();
  console.log('romaji mission end:', sr);
  if (sr.cur !== 'result') errors.push('romaji mission did not reach the result screen');
  await page.screenshot({ path: path.join(OUT, '08-result.png') });
  const resultText = await page.evaluate(() => document.querySelector('#scr-result').innerText.slice(0, 400));
  console.log('result text:', resultText.replace(/\n+/g, ' | '));

  // practice mode
  await page.keyboard.press('Escape');
  await sleep(300);
  await page.keyboard.press('2');
  await sleep(300);
  await page.keyboard.press('Enter');
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, '09-practice.png') });
  await page.evaluate(() => { window.__bot.on = true; window.__bot.wrongEvery = 0; });
  await sleep(1300);
  await page.evaluate(() => { window.__bot.on = false; });
  await sleep(300);
  await page.screenshot({ path: path.join(OUT, '10-practice-typed.png') });
  const pr = await page.evaluate(() => ({ cur: KM.UI.cur, i: KM.Practice.i, ok: KM.Practice.keysOk }));
  console.log('practice:', pr);
  if (pr.ok < 3) errors.push('practice mode did not accept keys');
  await page.keyboard.press('Escape');
  await sleep(500);
  console.log('after practice esc:', await page.evaluate(() => KM.UI.cur));
  await page.screenshot({ path: path.join(OUT, '11-practice-result.png') });

  // kana mode + meaning question type, N3
  await page.keyboard.press('Escape');
  await sleep(200);
  await page.evaluate(() => { KM.UI.openSelect('meteor'); });
  await sleep(200);
  await page.click('#sel-input-1');   // かな
  await page.click('#sel-qmode-1');   // 英語→ことば
  await page.click('#levels .lv[data-lv="N3"]');
  await sleep(200);
  await page.screenshot({ path: path.join(OUT, '12-select-kana.png') });
  await page.click('#launch');
  await sleep(3000);
  await page.screenshot({ path: path.join(OUT, '13-kana-meaning.png') });
  await page.evaluate(() => { window.__bot.on = true; window.__bot.wrongEvery = 0; });
  for (let t = 0; t < 40; t++) { await sleep(500); const s = await st(); if (s.destroyed >= 6) break; }
  await page.screenshot({ path: path.join(OUT, '14-kana-mid.png') });
  await page.evaluate(() => { window.__bot.on = false; });
  const sk = await st();
  console.log('kana mission:', sk);
  if (sk.destroyed < 3) errors.push('kana bot destroyed too few meteors: ' + sk.destroyed);

  // let a meteor hit the shield
  for (let t = 0; t < 40; t++) { await sleep(500); const s = await st(); if (s.hits >= 1) break; }
  await sleep(300);
  await page.screenshot({ path: path.join(OUT, '15-hit.png') });
  console.log('after waiting for a hit:', await st());
  await page.keyboard.press('Escape');
  await sleep(200);
  await page.click('#scr-pause [data-act="menu"]');
  await sleep(300);

  // other screens
  await page.keyboard.press('3'); await sleep(300);
  await page.screenshot({ path: path.join(OUT, '16-weak.png') });
  await page.keyboard.press('Escape'); await sleep(150);
  await page.keyboard.press('4'); await sleep(300);
  await page.screenshot({ path: path.join(OUT, '17-words.png') });
  await page.keyboard.press('Escape'); await sleep(150);
  await page.keyboard.press('5'); await sleep(300);
  await page.screenshot({ path: path.join(OUT, '18-settings.png') });
  await page.keyboard.press('Escape'); await sleep(150);
  await page.keyboard.press('6'); await sleep(300);
  await page.screenshot({ path: path.join(OUT, '19-howto.png'), fullPage: false });
  await page.keyboard.press('Escape'); await sleep(150);

  // phone width: no horizontal overflow on menu screens
  await page.setViewportSize({ width: 390, height: 844 });
  for (const s of ['title', 'select', 'words', 'settings', 'howto', 'weak']) {
    await page.evaluate((s) => { if (s === 'select') KM.UI.openSelect('meteor'); else if (s === 'words') { KM.UI.renderWords(); KM.UI.show('words'); } else if (s === 'weak') { KM.UI.renderWeak(); KM.UI.show('weak'); } else KM.UI.show(s); }, s);
    await sleep(250);
    const ov = await page.evaluate(() => {
      const scr = document.querySelector('.screen:not([hidden])');
      const bad = [];
      for (const el of scr.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.width && (r.right > window.innerWidth + 1 || r.left < -1) && !el.closest('.table-wrap')) bad.push(el.className || el.tagName);
      }
      return { scrollW: document.documentElement.scrollWidth, w: window.innerWidth, bad: bad.slice(0, 5) };
    });
    if (ov.bad.length || ov.scrollW > ov.w) errors.push(`overflow on ${s} at 390px: ${JSON.stringify(ov)}`);
    await page.screenshot({ path: path.join(OUT, `20-phone-${s}.png`) });
  }

  console.log('ERRORS:', errors.length ? errors : 'none');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
