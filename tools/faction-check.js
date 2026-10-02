// Verifica il sistema di reputazione: che gli avversari siano coerenti, che il
// livello segua i punti, che vincere un incontro dia reputazione alla fazione
// della zona e la togli all'avversaria, e che un fallimento non tocchi nulla.
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
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; }
};
const viewContent = { innerHTML: '' };
global.document = {
  getElementById: (id) => (id === 'viewContent' ? viewContent : makeEl()),
  querySelector: () => makeEl(),
  querySelectorAll: () => []
};

const out = [];
const log = (...args) => out.push(args.join(' '));
let failures = 0;
function check(label, ok) {
  if (!ok) failures += 1;
  log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
}

const ROOT = 'C:/Users/focas/source/salt-republic';
vm.runInThisContext(fs.readFileSync(`${ROOT}/factions.js`, 'utf8'));
vm.runInThisContext(fs.readFileSync(`${ROOT}/lore.js`, 'utf8'));
vm.runInThisContext(fs.readFileSync(`${ROOT}/app.js`, 'utf8'));

log('=== 1) Faction data integrity ===');
const dataCheck = checkFactionData();
log(`   ${dataCheck.reason || 'all rivals symmetrical, thresholds agree'}`);
check('the faction table is coherent', dataCheck.ok);
check('one faction per realm', factionList().length === 4);
check('every region has a faction', regions.every((region) => factionForRealm(region.id)));

log('');
log('=== 2) Rival symmetry ===');
Object.values(factions).forEach((faction) => {
  check(`${faction.id} <-> ${faction.rival}`, factions[faction.rival].rival === faction.id);
});

log('');
log('=== 3) Level follows points ===');
const guild = factions.clockwrights;
[[0, 1], [5, 1], [6, 2], [15, 2], [16, 3], [29, 3], [30, 4], [50, 5], [76, 6], [500, 6]].forEach(([xp, expected]) => {
  check(`guild at ${xp} xp -> level ${expected}`, factionLevelFromXp(guild, xp) === expected);
});

log('');
log('=== 4) Difficulty pays more ===');
const easy = factionXpForAction({ difficulty: 2 });
const mid = factionXpForAction({ difficulty: 4 });
const hard = factionXpForAction({ difficulty: 6 });
log(`   easy=${easy} mid=${mid} hard=${hard}`);
check('a hard encounter beats a mid one', hard > mid);
check('a mid encounter beats an easy one', mid > easy);
check('an absurd difficulty still pays', factionXpForAction({ difficulty: 99 }) > 0);

log('');
log('=== 5) Winning raises the local faction and lowers the rival ===');
state.currentLocationId = 'grand-canal';
state.player.reputation = {};
const council = factions.council;
const councilRival = factions[council.rival];
log(`   playing in ${locations['grand-canal'].realm} -> ${council.name} (rival ${councilRival.name})`);
const beforeRival = getFactionXp(councilRival.id);
const standing = awardFactionStanding({ difficulty: 5 }, 'grand-canal');
log(`   gained=${standing.gained} lost=${standing.lost} promoted=${standing.promoted}`);
check('the award names the faction of the realm', standing.faction.id === council.id);
check('standing actually rose', getFactionXp(council.id) === standing.gained);
check('the rival actually fell', getFactionXp(councilRival.id) === beforeRival - standing.lost);
check('the loss is smaller than the gain', standing.lost < standing.gained);

log('');
log('=== 6) Failing changes nothing ===');
state.player.reputation = {};
const snapBefore = JSON.stringify(state.player.reputation);
Math.random = () => 0.99;
state.currentLocationId = 'spire';
resolveAction('adjust-chronometer');
log(`   reputation after a failure -> ${JSON.stringify(state.player.reputation)}`);
check('a failed attempt grants no standing', JSON.stringify(state.player.reputation) === snapBefore);

log('');
log('=== 7) Winning in the Spire feeds the guild ===');
Math.random = () => 0;
state.currentLocationId = 'spire';
state.player.reputation = {};
state.player.vigor = VIGOR_MAX;
resolveAction('adjust-chronometer');
log(`   reputation -> ${JSON.stringify(state.player.reputation)}`);
check('the guild gained standing', getFactionXp('clockwrights') > 0);
check('the guild rival lost it', getFactionXp('brine-combine') < 0);
log(`   guild is now level ${factionLevelFromXp(guild, getFactionXp('clockwrights'))}`);
log('');
log('=== 8) Standing is capped at the floor ===');
state.player.reputation = { council: -9999 };
check('reputation never falls below the floor', getFactionXp('council') === FACTION_XP_FLOOR);

log('');
log('=== 9) A faction requirement can gate an encounter ===');
state.player.reputation = { clockwrights: 0 };
const gated = { id: 'test-gated', title: 'Test Gated', requires: [{ type: 'faction', faction: 'clockwrights', min: 3 }] };
check('locked at level 1', describeActionUnlock(gated).met === false);
log(`   unmet detail -> ${describeActionUnlock(gated).unmet[0].detail}`);
state.player.reputation = { clockwrights: 16 };
const opened = describeActionUnlock(gated);
check('opens at level 3', opened.met === true);
log(`   met detail    -> ${opened.conditions[0].detail}`);
check(
  'a broken faction requirement stays blocked instead of crashing',
  describeActionUnlock({ id: 'x', title: 'x', requires: [{ type: 'faction', faction: 'nope', min: 1 }] }).met === false
);

log('');
log('=== 10) Save round trip keeps standing ===');
state.player.reputation = { council: 22, clockwrights: -9 };
saveGame();
const restored = loadSave();
log(`   restored -> ${JSON.stringify(restored.player.reputation)}`);
check('standing survives a save', restored.player.reputation.council === 22 && restored.player.reputation.clockwrights === -9);
log(`   unknown faction dropped -> ${JSON.stringify(sanitizeReputation({ council: 5, madeUp: 99 }))}`);
check('a made-up faction is dropped on load', sanitizeReputation({ council: 5, madeUp: 99 }).madeUp === undefined);

log('');
log('=== 11) The page renders four faction cards ===');
state.player.reputation = { clockwrights: 20 };
currentView = 'chronicles';
renderChronicles();
const html = viewContent.innerHTML;
Object.values(factions).forEach((faction) => {
  check(`${faction.name} is on the page`, html.includes(faction.name));
});
check('the page shows the next tier to aim at', html.includes('faction-next'));
check('the page shows the rival relationship', html.includes('faction-rival'));
log(`   card count -> ${(html.match(/faction-card /g) || []).length}`);

log('');
log(failures === 0 ? 'FACTION HARNESS DONE' : `${failures} FACTION CHECKS FAILED`);
process.stdout.write(out.join('\n'));
process.exitCode = failures === 0 ? 0 : 1;

