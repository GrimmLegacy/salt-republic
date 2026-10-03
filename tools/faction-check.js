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
vm.runInThisContext(fs.readFileSync(`${ROOT}/threads.js`, 'utf8'));
vm.runInThisContext(fs.readFileSync(`${ROOT}/app.js`, 'utf8'));

log('=== 1) Faction data integrity ===');
const dataCheck = checkFactionData();
log(`   ${dataCheck.reason || 'all rivals symmetrical, thresholds agree'}`);
check('the faction table is coherent', dataCheck.ok);
check('every region has a faction that holds it', regions.every((region) => factionForRealm(region.id)));
// The world is not one faction per realm. A zone has the one that governs it and,
// beside that, as many bodies as the lore needs. What has to hold is that every
// faction reaches the page and that no two claim to govern the same zone.
check('every faction reaches the Chronicles page',
  factionList().length === Object.keys(factions).length, `${factionList().length} of ${Object.keys(factions).length}`);
check('some realms host more than one organisation',
  factionList().length > regions.length, 'still one faction per realm');
check('no two factions claim the same realm',
  new Set(factionList().filter((entry) => entry.principal).map((entry) => entry.realm)).size === regions.length,
  'two principal factions share a realm');
check('some factions stand in no rivalry at all',
  Object.values(factions).some((entry) => !entry.rival), 'every faction was forced into a rival');

log('');
log('=== 2) Rival symmetry ===');
// Only the factions that declare a rival can be checked for symmetry: the ones
// that declare none are not in the running with anybody, which is the point.
Object.values(factions).filter((faction) => faction.rival).forEach((faction) => {
  check(`${faction.id} <-> ${faction.rival}`, factions[faction.rival].rival === faction.id);
});

log('');
log('=== 3) Level follows points, on the generated curve ===');
const guild = factions.clockwrights;
log(`   threshold(1)=${factionThreshold(1)} (2)=${factionThreshold(2)} (5)=${factionThreshold(5)} (10)=${factionThreshold(10)}`);
// Il livello deve seguire esattamente la curva: sotto la soglia si resta al
// livello precedente, alla soglia si sale.
[[0, 1], [15, 1], [16, 2], [99, 4], [100, 5], [399, 9], [400, 10], [1599, 19], [1600, 20], [14400, 60]].forEach(([xp, expected]) => {
  check(`guild at ${xp} xp -> level ${expected}`, factionLevelFromXp(xp) === expected);
});
check('a threshold lands exactly on its level', factionLevelFromXp(factionThreshold(30)) === 30);
check('one point short stays below', factionLevelFromXp(factionThreshold(30) - 1) === 29);

log('');
log('=== 3b) The curve gets steeper, so late levels cost more ===');
const firstStep = factionThreshold(5) - factionThreshold(1);
const tenthStep = factionThreshold(10) - factionThreshold(5);
const twentiethStep = factionThreshold(20) - factionThreshold(10);
const fiftiethStep = factionThreshold(50) - factionThreshold(40);
log(`   1->5 costs ${firstStep}, 5->10 costs ${tenthStep}, 10->20 costs ${twentiethStep}, 40->50 costs ${fiftiethStep}`);
check('each stretch costs more than the last', firstStep < tenthStep && tenthStep < twentiethStep && twentiethStep < fiftiethStep);

log('');
log('=== 3c) No cap: level 60 is not the ceiling ===');
const huge = factionThreshold(60) * 40;
log(`   at ${huge} xp -> level ${factionLevelFromXp(huge)}`);
check('standing keeps rising past 60', factionLevelFromXp(huge) > FACTION_MAX_LEVEL);
check('but the last tier is still level 60', guild.tiers[guild.tiers.length - 1].level === FACTION_MAX_LEVEL);
check('and there is nothing beyond it to promise', factionNextTier(guild, FACTION_MAX_LEVEL) === null);
check('the last tier is still found at level 90', factionTierForLevel(guild, 90).level === FACTION_MAX_LEVEL);

log('');
log('=== 3d) A title covers five levels ===');
check('level 1 has the first title', factionTierForLevel(guild, 1).title === 'Unrecorded');
check('level 3 still has the first title', factionTierForLevel(guild, 3).title === 'Unrecorded');
check('level 5 has the second title', factionTierForLevel(guild, 5).title === 'Oiler');
check('level 9 still has the second title', factionTierForLevel(guild, 9).title === 'Oiler');
check('level 10 has the third', factionTierForLevel(guild, 10).title === 'Winder');
check('13 titles per faction', guild.tiers.length === 13);
check('the next title from level 3 is level 5', factionNextTier(guild, 3).level === 5);

log('');
log('=== 3e) The bar points at a title, not at the next level ===');
const midway = factionThreshold(1) + Math.floor((factionThreshold(5) - factionThreshold(1)) / 2);
const barProgress = factionProgress(guild, midway);
log(`   at ${midway} xp -> level ${barProgress.level}, next "${barProgress.next.title}" at ${barProgress.percent}%`);
check('the bar counts toward the next title', barProgress.next.level === 5);
check('the bar is roughly half full midway', barProgress.percent > 40 && barProgress.percent < 60);
const atTitle = factionProgress(guild, factionThreshold(5));
check('the bar resets at a title', atTitle.percent === 0);
check('and the next title moves on', atTitle.next.level === 10);
const atMax = factionProgress(guild, factionThreshold(FACTION_MAX_LEVEL));
check('the bar is full at level 60', atMax.percent === 100 && atMax.next === null);

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
// The award comes back as a list: one encounter can pay more than one
// organisation, so the honest shape of the answer is "who got paid", not "who
// got paid".
state.currentLocationId = 'grand-canal';
state.player.reputation = {};
const council = factions.council;
const councilRival = factions[council.rival];
log(`   playing in ${locations['grand-canal'].realm} -> ${council.name} (rival ${councilRival.name})`);
const beforeRival = getFactionXp(councilRival.id);
const grants = awardFactionStanding({ difficulty: 5 }, 'grand-canal');
const standing = grants[0];
log(`   gained=${standing.gained} lost=${standing.lost} promoted=${standing.promoted}`);
check('a plain encounter pays exactly one organisation', grants.length === 1, `${grants.length} grants`);
check('the award names the faction that holds the realm', standing.faction.id === council.id);
check('standing actually rose', getFactionXp(council.id) === standing.gained);
check('the rival actually fell', getFactionXp(councilRival.id) === beforeRival - standing.lost);
check('the loss is smaller than the gain', standing.lost < standing.gained);

log('');
log('=== 5b) A realm is not one faction, and not every faction has a rival ===');
// The world does not tie an organisation to a realm. A zone has the one that
// governs it and, standing next to it, as many bodies as the lore needs. Only
// the four that hold a realm are in the running with each other.
check('every realm still has exactly one holder', regions.every((region) => Boolean(factionForRealm(region.id))), 'a realm lost its holder');
check('every declared rival points back', Object.values(factions).filter((f) => f.rival).every((f) => factions[f.rival].rival === f.id), 'rival is not symmetric');
check('at most one faction claims to hold each realm',
  new Set(Object.values(factions).filter((f) => f.principal).map((f) => f.realm)).size
    === Object.values(factions).filter((f) => f.principal).length, 'two factions claim the same realm');

// A faction with no rival takes nothing from anyone: helping a body that is not
// competing with you costs nothing to the ones nearby. The fixture is made up on
// purpose, so this keeps proving the rule whatever the catalogue says later.
// It needs a `tiers` array because every grant resolves the title the faction
// calls you by, exactly as it would for a real one.
factions.__check_neutral__ = { id: '__check_neutral__', name: 'Check Neutral', rival: null, tiers: [{ level: 1, title: 'Nobody' }] };
try {
  const others = Object.values(factions).filter((f) => f.id !== '__check_neutral__');
  const beforeOthers = Object.fromEntries(others.map((f) => [f.id, getFactionXp(f.id)]));
  const report = applyStandingGrant('__check_neutral__', 10);
  check('a faction with no rival can be paid', Boolean(report) && report.gained === 10, 'no grant came back');
  check('paying it costs nobody else',
    others.every((f) => getFactionXp(f.id) === beforeOthers[f.id]), 'someone else paid for it');
  check('and there is no rival row to show', Boolean(report) && report.rival === null, 'a rival was invented');
} finally {
  delete factions.__check_neutral__;
}

// An encounter may name someone the realm does not answer to.
state.currentLocationId = 'grand-canal';
state.player.reputation = {};
const sameHolder = awardFactionStanding({ difficulty: 3, success: { standing: { faction: 'council', points: 6 } } }, 'grand-canal');
check('naming the holder pays once, not twice', sameHolder.length === 1, `${sameHolder.length} grants`);
const bothPayees = awardFactionStanding({ difficulty: 3, success: { standing: { faction: 'clockwrights', points: 6 } } }, 'grand-canal');
check('naming somebody else pays both', bothPayees.length === 2, `${bothPayees.length} grants`);
check('the realm holder is still paid', getFactionXp('council') > 0, 'the realm holder was skipped');

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
log(`   guild is now level ${factionLevelFromXp(getFactionXp('clockwrights'))}`);
log('');
log('=== 8) Standing is capped at the floor ===');
state.player.reputation = { council: -9999 };
check('reputation never falls below the floor', getFactionXp('council') === FACTION_XP_FLOOR);

log('');
log('=== 9) A faction requirement can gate an encounter ===');
// Parte dal livello 1 per vedere il blocco, poi sale a livello 3 per vederlo
// aprirsi: e' il caso che il giocatore incontra davvero.
state.player.reputation = {};
const gated = { id: 'test-gated', title: 'Test Gated', requires: [{ type: 'faction', faction: 'clockwrights', min: 3 }] };
const locked = describeActionUnlock(gated);
check('locked at level 1', locked.met === false);
check('and it says what is missing', locked.unmet.length === 1);
log(`   unmet detail -> ${locked.unmet[0].detail}`);
// Il livello 3 sta a metà fra 2 e 4 sulla curva: si usa la soglia esatta.
state.player.reputation = { clockwrights: factionThreshold(3) };
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
state.player.reputation = { clockwrights: factionThreshold(12) };
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
log('=== 12) The three bodies behind the powers get their own cards ===');
// The four powers each got a level-5 card before the new bodies existed. The
// bodies that are not powers get two each: a common at 5 and an uncommon at 15.
// What has to hold is that the gate opens on exactly the level it declares and
// not a point earlier, because a card that arrives one point early is a card the
// player did not earn.
const newBodies = ['black-ledger', 'salt-rats', 'iron-sister'];
const bodyCardOf = (factionId, rarity) => allTideCards.find((card) => (
  card.effects?.standing?.faction === factionId
  && card.rarity === rarity
  && (card.requires || []).some((requirement) => requirement.type === 'faction' && requirement.faction === factionId)
));

newBodies.forEach((factionId) => {
  check(`${factionId} is a real faction`, Boolean(factions[factionId]), 'no such faction');
  const commonCard = bodyCardOf(factionId, 'common');
  const uncommonCard = bodyCardOf(factionId, 'uncommon');
  check(`${factionId} has a common card`, Boolean(commonCard), 'missing');
  check(`${factionId} has an uncommon card`, Boolean(uncommonCard), 'missing');
  check(`${factionId} cards carry no artwork of their own yet`,
    [commonCard, uncommonCard].every((card) => !card?.image), 'a card claims art nobody drew');

  [[commonCard, 5], [uncommonCard, 15]].forEach(([card, level]) => {
    if (!card) return;
    const gate = (card.requires || []).find((requirement) => requirement.type === 'faction');
    check(`${card.id} is gated at level ${level}`, gate?.min === level, `gate says ${gate?.min}`);

    // One level short, then exactly on it. The threshold comes from the curve, so
    // this is a real level and not a guessed amount of points.
    state.player.reputation = { [factionId]: factionThreshold(level - 1) };
    check(`${card.id} is still shut one level below ${level}`, isCardAvailable(card.id) === false, 'it opened early');
    state.player.reputation = { [factionId]: factionThreshold(level) };
    check(`${card.id} opens exactly at level ${level}`, isCardAvailable(card.id) === true, 'it stayed shut');

    // Playing it pays the body and nobody else. A card goes through
    // `applyCardStanding`, which never touches a rival, so the powers cannot be
    // moved from here even by accident.
    state.player.reputation = {};
    state.player.hand = [card.id];
    state.player.malus = {};
    state.player.pendingMalus = [];
    playTideCard(card.id);
    check(`${card.id} pays ${factionId}`, getFactionXp(factionId) > 0, `xp ${getFactionXp(factionId)}`);
    const moved = Object.keys(state.player.reputation);
    check(`${card.id} moves no other book`, moved.length === 1 && moved[0] === factionId, `${moved.join(', ')}`);
  });
});

log('');
log('=== 13) Every faction in the catalogue has somewhere to go ===');
// A faction with a standing curve and no card behind it is a dead end: the player
// can climb it and never see the game acknowledge it.
const withCards = [...new Set(allTideCards
  .flatMap((card) => (card.requires || []).filter((requirement) => requirement.type === 'faction').map((requirement) => requirement.faction)))];
check('every faction has at least one gated card',
  Object.keys(factions).every((id) => withCards.includes(id)),
  `with cards: ${withCards.length} of ${Object.keys(factions).length}`);
Object.keys(factions).forEach((factionId) => {
  const gates = allTideCards
    .flatMap((card) => (card.requires || []).filter((requirement) => requirement.type === 'faction' && requirement.faction === factionId))
    .map((requirement) => requirement.min);
  check(`${factionId} opens a card at level 5`, gates.includes(5), `gates: ${gates.join(', ') || 'none'}`);
});
log(`   gated factions -> ${withCards.join(', ')}`);

log('');
log(failures === 0 ? 'FACTION HARNESS DONE' : `${failures} FACTION CHECKS FAILED`);
process.stdout.write(out.join('\n'));
process.exitCode = failures === 0 ? 0 : 1;

