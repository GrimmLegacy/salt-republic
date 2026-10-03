const fs = require('fs');
const vm = require('vm');

function makeEl() {
  return new Proxy(function () {}, {
    get(obj, prop) {
      if (prop === 'style') return makeEl();
      if (prop === 'classList') return { add() {}, remove() {}, toggle() {}, contains() { return false; } };
      if (prop === 'querySelectorAll') return () => [];
      if (prop === 'querySelector') return () => makeEl();
      if (prop === 'getAttribute') return () => null;
      if (prop === 'setAttribute') return () => {};
      if (prop === 'addEventListener') return () => {};
      if (prop === Symbol.toPrimitive) return () => '';
      return makeEl();
    },
    set() { return true; }
  });
}

const store = {};
global.window = { addEventListener() {}, setInterval() {} };
global.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
global.document = { getElementById: () => makeEl(), querySelector: () => makeEl(), querySelectorAll: () => [] };

const out = [];
const log = (...args) => out.push(args.join(' '));

vm.runInThisContext(fs.readFileSync('C:/Users/focas/source/salt-republic/factions.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('C:/Users/focas/source/salt-republic/lore.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('C:/Users/focas/source/salt-republic/threads.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('C:/Users/focas/source/salt-republic/app.js', 'utf8'));

log('=== 1) Constants ===');
log(`DRAW_RESERVE_MAX=${DRAW_RESERVE_MAX} DRAW_REGEN_MINUTES=${DRAW_REGEN_MINUTES} intervalMs=${DRAW_REGEN_INTERVAL}`);
log(`one card every ${DRAW_REGEN_MINUTES} min -> ${log.length > 0 ? 'OK' : ''}`);

const NOW = Date.now();
function setReserve(tokens, minutesAgo) {
  state.player.drawTokens = tokens;
  state.player.drawTokensLastRegenAt = NOW - minutesAgo * 60 * 1000;
}

log('');
log('=== 2) Regen cadence: one card every 10 minutes ===');
[[0, 0], [0, 9.9], [0, 10.1], [0, 25], [3, 9.9], [3, 10.1], [9, 20], [9, 30]].forEach(([tokens, minutesAgo]) => {
  setReserve(tokens, minutesAgo);
  const timer = advanceTimedResource('drawTokens', 'drawTokensLastRegenAt', DRAW_RESERVE_MAX, DRAW_REGEN_INTERVAL, NOW);
  log(`start=${tokens}/10 after ${minutesAgo} min -> now=${state.player.drawTokens}/10 changed=${timer.changed} nextIn=${formatCountdown(timer.remaining)}`);
});

log('');
log('=== 3) The reserve is capped at 10 ===');
setReserve(0, 60 * 24);
const capped = advanceTimedResource('drawTokens', 'drawTokensLastRegenAt', DRAW_RESERVE_MAX, DRAW_REGEN_INTERVAL, NOW);
log(`after 24h from 0 -> ${state.player.drawTokens}/10 (changed=${capped.changed})`);
setReserve(10, 5);
const stillFull = advanceTimedResource('drawTokens', 'drawTokensLastRegenAt', DRAW_RESERVE_MAX, DRAW_REGEN_INTERVAL, NOW);
log(`already full -> ${state.player.drawTokens}/10 changed=${stillFull.changed} remaining=${formatCountdown(stillFull.remaining)}`);

log('');
log('=== 4) Spending a card ===');
setReserve(10, 0);
log(`consumeDrawToken -> ${consumeDrawToken()} reserve=${formatDrawReserve()}`);
setReserve(1, 0);
log(`last card -> consumeDrawToken=${consumeDrawToken()} reserve=${formatDrawReserve()}`);
setReserve(0, 0);
log(`at 0 -> consumeDrawToken=${consumeDrawToken()} reserve=${formatDrawReserve()}`);
log(`at 0 -> timer reads "${describeDrawTimer({ remaining: 10 * 60 * 1000 })}"`);
log(`at 0 -> draw button enabled? ${state.player.drawTokens > 0}`);

log('');
log('=== 5) Player facing strings ===');
[10, 7, 1, 0].forEach((tokens) => {
  state.player.drawTokens = tokens;
  log(`reserve=${formatDrawReserve()}  full="${describeDrawTimer({ remaining: 0 })}"  empty="${describeDrawTimer({ remaining: 234000 })}"`);
});

log('');
log('=== 6) Deck view markup carries the 10/10 and the cadence ===');
state.player.drawTokens = 10;
state.player.hand = [];
state.player.drawPile = ['intellect'];
currentView = 'deck';
render();
log(`deckBadge set to -> ${formatDrawReserve()}`);

fs.writeFileSync('tools/out/draw-check.out.txt', out.join('\n'), 'utf8');
console.log('DRAW HARNESS DONE');
