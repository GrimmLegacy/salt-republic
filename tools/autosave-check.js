// Proves the one thing the autosave bug actually was about: what gets written
// to localStorage has to come back after a reload, in the same shape.
//
// The report was "every refresh starts me from zero", so this harness writes a
// real save, throws the whole game away, loads it again from nothing, and
// compares. A save that is written but not restored is the failure that matters,
// and nothing else in this folder would have caught it.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ROOT, GAME_SOURCES } = require('./harness');

// Each run gets its own vm context rather than sharing this one: re-running the
// same sources twice in a single context throws on the top-level `const`s, and a
// reload has to start from a clean global the way a real page does. Reads and
// writes go through the game's own context, because `state` and the game
// functions are script-scoped declarations that never land on globalThis (the
// other harnesses read the context the same way, see unlock-check.js).

// The stub has to survive a full render(), which one-liners do not: renderActions
// walks the list with querySelectorAll. The Proxy returns a fresh element for any
// unknown key, so whatever element the game reaches for exists.
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

// `seed` is the raw string already in localStorage before the game loads, so a
// reload is simulated by handing a fresh context the bytes the previous run wrote.
function runGame(seed) {
  const store = {};
  if (seed !== null) store['salt-republic-save-v1'] = seed;

  const sandbox = { console, Math, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, Symbol, Promise, Error };
  sandbox.globalThis = sandbox;
  sandbox.window = { addEventListener() {}, setInterval() {}, setTimeout: () => 0, clearTimeout() {} };
  sandbox.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };
  const viewContent = { innerHTML: '' };
  // boot() binds DOMContentLoaded and beforeunload on the document itself, so the
  // stub has to accept those too. The handlers are recorded rather than fired:
  // a reload does not deliver a DOMContentLoaded to a game that already booted.
  const documentHandlers = {};
  sandbox.document = {
    getElementById: (id) => (id === 'viewContent' ? viewContent : makeEl()),
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    addEventListener: (name, handler) => { documentHandlers[name] = handler; }
  };

  const context = vm.createContext(sandbox);
  GAME_SOURCES.forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  });

  const run = (expression) => vm.runInContext(expression, context);

  return { store, viewContent, run };
}

const failures = [];
const check = (label, ok, detail) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ` -- ${detail}` : ''}`);
  if (!ok) failures.push(label);
};

// ---- Part 1: play, save, and keep the bytes that were written --------------
const first = runGame(null);
const run = first.run;

// Values are chosen to sit inside the ranges loadSave() sanitises to: vigor is
// clamped to VIGOR_MAX (20), drawTokens to 10, so asserting against 137 would only
// prove the clamp, not the round-trip. `peril` and `coins` are not state fields --
// the money lives in `resources.ducatsOfSalt` -- so asserting them would have
// reported a false failure.
run('state.player.vigor = 14');
run('state.player.resources.ducatsOfSalt = 268');
run('state.player.resources.whisperedSecrets = 71');
run("state.currentLocationId = 'spire'");
run("state.player.reputation = { clockwrights: 3, 'brine-combine': -2 }");
run("state.player.inventory = ['guild-bench-apron', 'guild-brass-loupe']");
run("state.player.log = [{ prefix: 'Arrival', message: 'test chronicle', reason: '', time: '10:00' }]");

run('saveGame()');

const written = first.store['salt-republic-save-v1'];
check('saveGame writes the save key', typeof written === 'string' && written.length > 0, `${written ? written.length : 0} bytes`);
check('a working browser reports no storage problem', run('storageProblem') === '', run('storageProblem') || 'none');

const parsed = JSON.parse(written);
check('vigor survives in the written bytes', parsed.player.vigor === 14, `got ${parsed.player.vigor}`);
check('ducats survive in the written bytes', parsed.player.resources.ducatsOfSalt === 268, `got ${parsed.player.resources.ducatsOfSalt}`);
check('secrets survive in the written bytes', parsed.player.resources.whisperedSecrets === 71, `got ${parsed.player.resources.whisperedSecrets}`);
check('location survives in the written bytes', parsed.currentLocationId === 'spire', `got ${parsed.currentLocationId}`);
check('inventory survives in the written bytes', parsed.player.inventory.length === 2, JSON.stringify(parsed.player.inventory));
check('savedAt is stamped', typeof parsed.savedAt === 'number' && parsed.savedAt > 0, `got ${parsed.savedAt}`);

// ---- Part 2: reload from those bytes and compare --------------------------
// This is the half that was broken in the report: the save was written, and the
// reload still started from scratch. `boot()` is what a page load runs, and it is
// where the state is now read from disk, so reading the state without it would
// test the wrong thing -- it used to report a default state even when the save
// was perfect.
const second = runGame(written);
second.run('boot()');
const reload = second.run;

check('reload restores vigor', reload('state.player.vigor') === 14, `got ${reload('state.player.vigor')}`);
check('reload restores ducats', reload('state.player.resources.ducatsOfSalt') === 268, `got ${reload('state.player.resources.ducatsOfSalt')}`);
check('reload restores whispered secrets', reload('state.player.resources.whisperedSecrets') === 71, `got ${reload('state.player.resources.whisperedSecrets')}`);
check('reload restores the location', reload('state.currentLocationId') === 'spire', `got ${reload('state.currentLocationId')}`);
check(
  'reload restores the inventory',
  reload("state.player.inventory.includes('guild-bench-apron') && state.player.inventory.includes('guild-brass-loupe')"),
  JSON.stringify(reload('state.player.inventory'))
);
check(
  'reload restores reputation for every faction',
  reload('Object.values(state.player.reputation || {}).length') === 2,
  JSON.stringify(reload('state.player.reputation'))
);
check('reload restores the log', reload('state.player.log.length') > 0, `${reload('state.player.log.length')} entries`);

// ---- Part 3: two reloads in a row must not drift ---------------------------
// A single reload can pass while a second one loses progress, because boot()
// writes back whatever it loaded: if the first boot dropped a field, the save it
// re-writes is already short of it. Reloading twice pins that down.
const third = runGame(second.store['salt-republic-save-v1']);
let booted = false;
try {
  third.run('boot()');
  booted = true;
} catch (error) {
  console.log(`FAIL boot threw -- ${error.message}`);
  failures.push('boot threw');
}
const bootRun = third.run;

check('boot completes on a restored save', booted);
check('a second reload keeps the vigor', bootRun('state.player.vigor') === 14, `got ${bootRun('state.player.vigor')}`);
check('a second reload keeps the ducats', bootRun('state.player.resources.ducatsOfSalt') === 268, `got ${bootRun('state.player.resources.ducatsOfSalt')}`);
check('a second reload keeps the inventory', bootRun("state.player.inventory.includes('guild-bench-apron')"), JSON.stringify(bootRun('state.player.inventory')));
check('a second reload keeps the log', bootRun('state.player.log.length') > 0, `${bootRun('state.player.log.length')} entries`);
check('boot does not hand out the whole catalogue again', bootRun('state.player.inventory.length') <= 8, `${bootRun('state.player.inventory.length')} items`);

// ---- Part 4: a reset must actually clear the save --------------------------
// The other half of the same key. resetGame() removes STORAGE_KEY and then
// immediately writes the fresh chronicle, so the key is *supposed* to exist
// afterwards -- what must not survive is the old progress. Asserting the key is
// gone would test the wrong contract and report a false failure.
const fourth = runGame(third.store['salt-republic-save-v1']);
fourth.run('resetGame()');
const afterReset = fourth.run('state.player');

check('reset clears the inventory', afterReset.inventory.length === 0, JSON.stringify(afterReset.inventory));
check('reset clears the reputation', Object.keys(afterReset.reputation || {}).length === 0, JSON.stringify(afterReset.reputation));
check('reset returns to the starting realm', fourth.run('state.currentLocationId') === 'grand-canal', `got ${fourth.run('state.currentLocationId')}`);
check('reset writes the fresh chronicle back', Boolean(fourth.store['salt-republic-save-v1']), 'nothing written');

console.log('');
console.log(failures.length ? `FAILURES: ${failures.length} (${failures.join(', ')})` : 'autosave round-trip holds');
process.exit(failures.length ? 1 : 0);