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
const viewContent = { innerHTML: '' };
const overlayEl = {
  hidden: true,
  innerHTML: '',
  classList: { add() {}, remove() {}, contains() { return false; } },
  querySelector: () => null
};
const calendarEl = {
  hidden: true,
  innerHTML: '',
  classList: { add() {}, remove() {}, contains() { return false; } },
  querySelector: () => null
};
const actionListSpy = { innerHTML: '', querySelectorAll: () => [] };
global.window = { addEventListener() {}, setInterval() {} };
global.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
global.document = {
  getElementById: (id) => (id === 'viewContent' ? viewContent : id === 'resolutionOverlay' ? overlayEl : id === 'calendarPanel' ? calendarEl : id === 'actionList' ? actionListSpy : makeEl()),
  querySelector: () => makeEl(),
  querySelectorAll: () => []
};

function overlayLikePanel() {
  return calendarEl.innerHTML;
}

const out = [];
const log = (...args) => out.push(args.join(' '));
const realRandom = Math.random;

vm.runInThisContext(fs.readFileSync('C:/Users/focas/source/salt-republic/app.js', 'utf8'));

const CHAIN = ['take-ledger-job', 'carry-sealed-cargo', 'bargain-salt-pans', 'sign-brine-farm-papers'];

log('=== 1) A fresh chronicle starts with nothing ===');
log(`properties = ${JSON.stringify(state.player.properties)}`);
log(`completedEvents = ${JSON.stringify(state.player.completedEvents)}`);

log('');
log('=== 2) Every encounter is classified Unique or Repeatable ===');
getAllActions().forEach(({ action, location }) => {
  const unlock = describeActionUnlock(action);
  log(`${unlock.unique ? 'UNIQUE    ' : 'REPEATABLE'} ${action.id.padEnd(24)} ${location.realm.padEnd(16)} open=${unlock.met}`);
});

log('');
log('=== 3) The farm is locked, and the preview says how to claim it ===');
const harvest = findActionById('harvest-orchids');
describeActionUnlock(harvest).unmet.forEach((c) => log(`  ✕ ${c.label}\n      ${c.detail}`));
log(`lockReason: ${getActionLockReason(harvest)}`);

log('');
log('=== 4) The opening chain, step by step ===');
CHAIN.forEach((id) => {
  const unlock = describeActionUnlock(findActionById(id));
  log(`${id.padEnd(24)} unique=${unlock.unique} open=${unlock.met} :: ${summarizeUnlock(id ? findActionById(id) : id)}`);
});

log('');
log('=== 5) Reward preview with drop percentages ===');
CHAIN.forEach((id) => {
  const action = findActionById(id);
  log(`${id}: success="${formatOutcomeEffects(action.success)}" chance="${formatChanceRewards(action) || 'none'}" failure="${formatOutcomeEffects(action.failure)}"`);
});

log('');
log('=== 6) Chance rolls are really random and really pay out ===');
const scholarium = findActionById('sign-brine-farm-papers');
const before = state.player.resources.whisperedSecrets;
Math.random = () => 0;
const alwaysDrops = grantChanceRewards(scholarium);
Math.random = () => 0.999;
const neverDrops = grantChanceRewards(scholarium);
log(`roll 0.000 -> dropped ${alwaysDrops.length} (${alwaysDrops.map((d) => d.name).join(', ')}) whisperedSecrets ${before} -> ${state.player.resources.whisperedSecrets}`);
log(`roll 0.999 -> dropped ${neverDrops.length}, whisperedSecrets stayed ${state.player.resources.whisperedSecrets}`);

log('');
log('=== 7) Walking the chain (every test passed) ===');
state.currentLocationId = 'grand-canal';
Math.random = () => 0;
CHAIN.forEach((id) => {
  state.player.vigor = 20;
  const accessibleBefore = canAccessAction(findActionById(id));
  resolveAction(id);
  const unlock = describeActionUnlock(findActionById(id));
  log(`resolve ${id.padEnd(24)} accessibleBefore=${accessibleBefore} nowResolved=${unlock.resolved} openAfter=${unlock.met} log="${state.player.log[0].message.slice(-58)}"`);
});
Math.random = realRandom;
log(`properties now = ${JSON.stringify(state.player.properties)}`);
log(`farm encounter now open = ${canAccessAction(findActionById('harvest-orchids'))}`);

log('');
log('=== 8) A unique encounter cannot be replayed ===');
state.player.vigor = 20;
resolveAction('take-ledger-job');
log(`log prefix = ${state.player.log[0].prefix}`);
log(`log reason = ${state.player.log[0].reason}`);

log('');
log('=== 9) A repeatable encounter stays farmable ===');
state.currentLocationId = 'leviathan-trench';
state.player.vigor = 20;
resolveAction('harvest-orchids');
const firstOpen = canAccessAction(findActionById('harvest-orchids'));
state.player.vigor = 20;
resolveAction('harvest-orchids');
const secondOpen = canAccessAction(findActionById('harvest-orchids'));
log(`after 1st resolve open=${firstOpen}; after 2nd resolve open=${secondOpen}`);
log(`unique flag stays false, resolved stays false -> resolved=${describeActionUnlock(findActionById('harvest-orchids')).resolved}`);

log('');
log('=== 10) Resolved unique encounters leave the realm ===');
state.currentLocationId = 'grand-canal';
const canalVisible = getVisibleActions(locations['grand-canal']).map((action) => action.id);
log(`grand-canal visible after the chain = ${JSON.stringify(canalVisible)}`);
log(`take-ledger-job hidden          = ${!canalVisible.includes('take-ledger-job')}`);
log(`sign-brine-farm-papers hidden   = ${!canalVisible.includes('sign-brine-farm-papers')}`);
log(`decipher-treaty still visible   = ${canalVisible.includes('decipher-treaty')} (repeatable)`);

state.currentLocationId = 'leviathan-trench';
const trenchVisible = getVisibleActions(locations['leviathan-trench']).map((action) => action.id);
log(`leviathan visible before        = ${JSON.stringify(trenchVisible)}`);
log(`install-desalinators unique     = ${describeActionUnlock(findActionById('install-desalinators')).unique}`);
state.player.stats.audacity = 9;
state.player.vigor = 20;
Math.random = () => 0;
resolveAction('install-desalinators');
Math.random = realRandom;
const trenchAfter = getVisibleActions(locations['leviathan-trench']).map((action) => action.id);
log(`leviathan visible after         = ${JSON.stringify(trenchAfter)}`);
log(`Fattoria 2 owned                = ${state.player.properties.includes('The Brine-Farm (La Fattoria 2)')}`);
log(`record kept for later stories   = ${JSON.stringify(getEventRecord('install-desalinators'))}`);
log(`profile stats                   = ${JSON.stringify(getChronicleStats())}`);

log('');
log('=== 11) Rendered card markup ===');
state.currentLocationId = 'grand-canal';
log(`kind line = ${renderEncounterKind(describeActionUnlock(findActionById('decipher-treaty'))).replace(/<[^>]+>/g, '').trim().slice(0, 80)}`);
log(`reward preview = ${renderActionRewards(findActionById('sign-brine-farm-papers')).replace(/<\/p>/g, ' | ').replace(/<[^>]+>/g, '').trim()}`);

log('');
log('=== 12) Resolution window: die and full result ledger ===');
state.currentLocationId = 'grand-canal';
state.player.vigor = 20;
state.player.resources.ducatsOfSalt = 134;

const scripted = { ...findActionById('sign-brine-farm-papers') };
Math.random = () => 0;
const test = rollTest(scripted);
Math.random = realRandom;
log(`rollTest -> roll=${test.roll} chance=${test.chance} success=${test.success}`);

Math.random = () => 0;
state.player.vigor = 20;
state.player.completedEvents = state.player.completedEvents.filter((e) => e.id !== 'take-ledger-job');
state.player.completedEvents = state.player.completedEvents.filter((e) => e.id !== 'carry-sealed-cargo');
state.player.completedEvents = state.player.completedEvents.filter((e) => e.id !== 'bargain-salt-pans');
state.player.completedEvents = state.player.completedEvents.filter((e) => e.id !== 'sign-brine-farm-papers');
state.player.properties = [];
state.player.stats = { vigilance: 1, cunning: 1, audacity: 1, elegance: 1, persuasion: 1, resolve: 1 };
state.player.statXp = { vigilance: 0, cunning: 0, audacity: 0, elegance: 0, persuasion: 0, resolve: 0 };
state.player.log = [];
['take-ledger-job', 'carry-sealed-cargo', 'bargain-salt-pans'].forEach((id) => { state.player.vigor = 20; resolveAction(id); });
closeResolution();
state.player.vigor = 20;
state.player.resources.ducatsOfSalt = 134;
const snap = snapshotPlayer();
resolveAction('sign-brine-farm-papers');
Math.random = realRandom;
const ledger = diffSnapshots(snap, state.player);
log('rows produced by the real resolution:');
ledger.forEach((row) => log(`  [${row.tone}] ${row.label} = ${row.value}`));

log('');
log('=== 13) Markup of the resolution window ===');
const markup = buildResolutionMarkup({
  eyebrow: 'Resolve test · Difficulty 6',
  title: 'Sign the Brine-Farm Papers Before the Council',
  subtitle: 'Lagoon Heart',
  tone: 'success',
  die: { value: 37, threshold: 60, detail: 'You needed 60 or lower to pass' },
  narrative: 'The last clerk presses the seal into wet paper.',
  rows: ledger,
  note: 'Chance yielded Favor of the Scholarium.'
});
const flat = markup.replace(/<[^>]+>/g, ' | ').replace(/\s+/g, ' ').trim();
log(flat);
log('');
log(`has dialog role      = ${markup.includes('role="dialog"')}`);
log(`has aria modal       = ${markup.includes('aria-modal="true"')}`);
log(`die hidden while roll= ${markup.includes('die-value')}`);
log(`close disabled first = ${markup.includes('data-resolution-close disabled')}`);
log(`suspense starter     = ${markup.includes(SUSPENSE_LINES[0])}`);
log(`row count            = ${(markup.match(/resolution-row tone-/g) || []).length}`);

log('');
log('=== 14) A FAILED unique never leaves, and never opens the next ===');
state.currentLocationId = 'grand-canal';
state.player.vigor = 20;
state.player.properties = [];
state.player.stats = { vigilance: 1, cunning: 1, audacity: 1, elegance: 1, persuasion: 1, resolve: 1 };
state.player.statXp = { vigilance: 0, cunning: 0, audacity: 0, elegance: 0, persuasion: 0, resolve: 0 };
state.player.completedEvents = [];
state.player.log = [];
state.currentLocationId = 'grand-canal';

Math.random = () => 0.999;
state.player.vigor = 20;
resolveAction('take-ledger-job');
Math.random = realRandom;
closeResolution();
state.currentLocationId = 'grand-canal';
const afterFailure = getVisibleActions(locations['grand-canal']).map((a) => a.id);
log(`grand-canal after the FAILURE = ${JSON.stringify(afterFailure)}`);
log(`the failed encounter is still listed = ${afterFailure.includes('take-ledger-job')}`);
const failedUnlock = describeActionUnlock(findActionById('take-ledger-job'));
log(`resolved=${failedUnlock.resolved} attempted=${failedUnlock.attempted} accessible=${failedUnlock.met}`);
const nextUnlock = describeActionUnlock(findActionById('carry-sealed-cargo'));
log(`successor open = ${nextUnlock.met}`);
nextUnlock.unmet.forEach((c) => log(`  ✕ ${c.label} | ${c.detail}`));
log(`chain link of the successor = ${nextUnlock.chainLink.detail}`);
log(`profile row for it = ${JSON.stringify(getEventRecord('take-ledger-job'))}`);

log('');
log('=== 15) Passing it for real removes it and opens the successor ===');
Math.random = () => 0;
state.player.vigor = 20;
resolveAction('take-ledger-job');
Math.random = realRandom;
closeResolution();
state.currentLocationId = 'grand-canal';
const afterSuccess = getVisibleActions(locations['grand-canal']).map((a) => a.id);
log(`grand-canal after the SUCCESS = ${JSON.stringify(afterSuccess)}`);
log(`the passed encounter is gone      = ${!afterSuccess.includes('take-ledger-job')}`);
log(`successor open                   = ${canAccessAction(findActionById('carry-sealed-cargo'))}`);

log('');
log('=== 16) Clock and calendar ===');
const clock = getGameClock();
log(`date  = ${clock.day} ${clock.monthName}, Anno Domini ${clock.year} (${clock.weekday})`);
log(`season= ${clock.season}`);
log(`phase = ${getDayPhase(clock).icon} ${getDayPhase(clock).label}`);
log(`clock = ${formatGameClock(clock)} (real now ${new Date().toString().slice(0, 24)})`);
renderCalendarPanel();
const grid = calendarEl.innerHTML;
log(`grid: dayCells=${(grid.match(/data-calendar-day=/g) || []).length} today=${grid.includes('is-today')} todayIsDay=${grid.includes('is-day')} todayIsNight=${grid.includes('is-night')}`);
[[0, 'Night'], [5, 'Night'], [6, 'Day'], [12, 'Day'], [17, 'Day'], [18, 'Night'], [23, 'Night']].forEach(([hour, expected]) => {
  const probe = new Date(2026, 9, 1, hour);
  const got = getDayPhase(getGameClock(probe)).label;
  log(`hour ${String(hour).padStart(2, '0')}:00 -> ${got} ${got === expected ? 'OK' : 'MISMATCH (expected ' + expected + ')'}`);
});

log('');
log('=== 17) Day and night gating on encounters ===');
const noon = getGameClock(new Date(2026, 9, 1, 12));
const midnight = getGameClock(new Date(2026, 9, 1, 23));
getAllActions().forEach(({ action }) => {
  const dayWindow = describeEncounterWindow(action, noon);
  const nightWindow = describeEncounterWindow(action, midnight);
  const expectedNoon = action.when !== 'night';
  const expectedMidnight = action.when !== 'day';
  const ok = dayWindow.open === expectedNoon && nightWindow.open === expectedMidnight;
  log(`${ok ? 'OK  ' : 'BAD '} ${action.id.padEnd(28)} when=${String(action.when).padEnd(6)} noon=${dayWindow.open ? 'open' : 'shut'} midnight=${nightWindow.open ? 'open' : 'shut'}`);
});

log('');
log('=== 18) Inventory shows real names and real amounts ===');
state.player.resources.ducatsOfSalt = 151;
state.player.resources.whisperedSecrets = 9;
state.player.resources.phosphorAmber = 3;
state.player.resources.aetherCanister = 1;
currentView = 'persona';
renderPersona();
const personaHtml = viewContent.innerHTML;
log(`raw keys leaked (ducatsOfSalt etc in a label slot) = ${/info-row"><span>ducatsOfSalt/.test(personaHtml)}`);
log(`proper names present = ${['Ducats of Salt', 'Whispered Secrets', 'Phosphor Amber', 'Aether Canister'].every((n) => personaHtml.includes(`<span>${n}</span>`))}`);
[151, 9, 3, 1].forEach((amount, index) => {
  const names = ['Ducats of Salt', 'Whispered Secrets', 'Phosphor Amber', 'Aether Canister'];
  const row = new RegExp(`<span>${names[index]}</span><strong>(\\d+)</strong>`).exec(personaHtml);
  log(`  ${names[index].padEnd(18)} rendered as ${row ? row[1] : 'MISSING'} (actual ${amount})`);
});

log('');
log('=== 19) Calendar month navigation ===');
log(`month now      = ${getViewedMonth().monthName} ${getViewedMonth().year} (current=${getViewedMonth().isCurrentMonth})`);
calendarMonthOffset = 1;
log(`offset +1      = ${getViewedMonth().monthName} ${getViewedMonth().year} (current=${getViewedMonth().isCurrentMonth})`);
calendarMonthOffset = 2;
log(`offset +2      = ${getViewedMonth().monthName} ${getViewedMonth().year}`);
calendarMonthOffset = 11;
log(`offset +11     = ${getViewedMonth().monthName} ${getViewedMonth().year}`);
calendarMonthOffset = 12;
log(`offset +12     = ${getViewedMonth().monthName} ${getViewedMonth().year} (year rolls over)`);
calendarMonthOffset = -1;
log(`offset -1      = ${getViewedMonth().monthName} ${getViewedMonth().year}`);
calendarMonthOffset = 0;

log('');
log('=== 20) Season of each month ===');
MONTH_NAMES.forEach((name, index) => log(`  ${name.padEnd(10)} -> ${getSeasonOfMonth(index).name}`));

log('');
log('=== 21) Day sheet and relations ===');
const clockNow = getGameClock();
[[clockNow.day, 'today'], [clockNow.day + 1, 'tomorrow'], [clockNow.day - 1, 'yesterday']].forEach(([day, label]) => {
  log(`day ${String(day).padStart(2, '0')} (${label}) -> "${describeDayRelation(day, getViewedMonth())}"`);
});
calendarMonthOffset = 1;
log(`other month day 5 -> "${describeDayRelation(5, getViewedMonth())}"`);
calendarMonthOffset = 0;
calendarSelectedDay = 12;
renderCalendarPanel();
const panelHtml = overlayLikePanel();
log('');
log(`panel contains day buttons = ${(panelHtml.match(/data-calendar-day=/g) || []).length}`);
log(`prev/next buttons         = ${panelHtml.includes('data-calendar-prev') && panelHtml.includes('data-calendar-next')}`);
log(`today button             = ${panelHtml.includes('data-calendar-today')}`);
log(`seasons strip            = ${(panelHtml.match(/calendar-season/g) || []).length} (4 + active class holder)`);
log(`selected day highlighted = ${panelHtml.includes('is-selected')}`);
log(`day sheet present        = ${panelHtml.includes('day-sheet')}`);
const dayList = /By day<\/p>\s*<ul class="day-list">([\s\S]*?)<\/ul>/.exec(panelHtml);
log(`by day list   -> ${dayList ? dayList[1].replace(/<[^>]+>/g, ' | ').trim() : 'none (nothing daylight-only here)'}`);
const nightList = /By night<\/p>\s*<ul class="day-list">([\s\S]*?)<\/ul>/.exec(panelHtml);
log(`by night list -> ${nightList ? nightList[1].replace(/<[^>]+>/g, ' | ').trim() : 'none (nothing night-only here)'}`);
const anyLine = /day-any[^>]*>([\s\S]*?)<\/p>/.exec(panelHtml);
log(`any hour      -> ${anyLine ? anyLine[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) : 'none'}`);
log(`relation label-> ${/day-sheet-head[\s\S]*?eyebrow">([^<]+)</.exec(panelHtml)[1]}`);
log(`visible here  = ${JSON.stringify(getVisibleActions(locations[state.currentLocationId]).map((a) => `${a.id}(${a.when})`))}`);
calendarSelectedDay = null;

log('');
log('=== 22) A wound must NEVER take a card out of the hand ===');
state.currentLocationId = 'leviathan-trench';
state.player.hand = ['intellect', 'might', 'persuasion', 'veilcraft'];
state.player.drawPile = ['uncommon-brass-compass', 'rare-moonlit-pass'];
state.player.malus = { scandal: 0, wounds: 0, suspicion: 0, nightmare: 0, debt: 0 };
state.player.malusSources = {};
state.player.pendingMalus = [];
state.player.vigor = 20;
state.player.stats.audacity = 1;
log(`hand before the test = ${JSON.stringify(state.player.hand)} (${state.player.hand.length}/4)`);

Math.random = () => 0.999;
resolveAction('scour-sunk-cathedral');
Math.random = realRandom;
closeResolution();
log(`hand after  FAILURE  = ${JSON.stringify(state.player.hand)} (${state.player.hand.length}/4)`);
log(`no card was taken away = ${state.player.hand.length === 4}`);
log(`the wound is active    = ${state.player.malus.wounds}`);
log(`nothing forced into the hand = ${!state.player.hand.includes('malus-wounds')}`);
log(`it waits in the deck    = ${JSON.stringify(state.player.pendingMalus)}`);

log('');
log('=== 23) The affliction card comes out only if you draw ===');
let drewMalus = false;
for (let attempt = 0; attempt < 40; attempt += 1) {
  state.player.hand = ['intellect', 'might', 'persuasion'];
  state.player.vigor = 20;
  state.player.drawTokens = 10;
  Math.random = () => 0;
  drawTideCard();
  Math.random = realRandom;
  closeResolution();
  if (state.player.hand.includes('malus-wounds')) {
    drewMalus = true;
    log(`drawn on attempt ${attempt + 1}: ${JSON.stringify(state.player.hand)}`);
    break;
  }
}
log(`affliction card is drawable = ${drewMalus}`);
log(`no duplicates in hand       = ${new Set(state.player.hand).size === state.player.hand.length}`);
log(`drawPile has no hand cards  = ${!state.player.drawPile.some((id) => state.player.hand.includes(id))}`);
log(`pendingMalus drained        = ${JSON.stringify(state.player.pendingMalus)}`);

log('');
log('=== 24) Playing the card clears both the wound and the card ===');
state.player.vigor = 20;
playTideCard('malus-wounds');
closeResolution();
log(`wounds level  = ${state.player.malus.wounds}`);
log(`hand          = ${JSON.stringify(state.player.hand)}`);
log(`malusSources  = ${JSON.stringify(state.player.malusSources)}`);

log('');
log('=== 25) Encounter list hides what is not available now ===');
state.currentLocationId = 'grand-canal';
state.player.completedEvents = [];
state.player.properties = [];
state.player.stats = { vigilance: 1, cunning: 1, audacity: 1, elegance: 1, persuasion: 1, resolve: 1 };
const noonClock = getGameClock(new Date(2026, 9, 1, 12));
const nightClock = getGameClock(new Date(2026, 9, 1, 23));
const idsAt = (probe) => {
  const realClock = getGameClock;
  getGameClock = () => probe;
  const visible = getVisibleActions(locations['grand-canal']).map((a) => a.id);
  const open = getOpenActions(locations['grand-canal']).map((a) => a.id);
  getGameClock = realClock;
  return { visible, open };
};
log(`noon  visible = ${JSON.stringify(idsAt(noonClock).visible)}`);
log(`noon  all     = ${JSON.stringify(idsAt(noonClock).open)}`);
log(`night visible = ${JSON.stringify(idsAt(nightClock).visible)}`);
log(`night all     = ${JSON.stringify(idsAt(nightClock).open)}`);
log(`chain step 2+ hidden at noon = ${!idsAt(noonClock).visible.includes('carry-sealed-cargo')}`);
log(`night-only hidden at noon    = ${!idsAt(noonClock).visible.includes('sign-brine-farm-papers')}`);
log(`night-only shown at night   = ${idsAt(nightClock).visible.includes('sign-brine-farm-papers')}`);
log(`day-only shown at noon      = ${idsAt(noonClock).visible.includes('decipher-treaty')}`);
log(`day-only hidden at night    = ${!idsAt(nightClock).visible.includes('decipher-treaty')}`);
log(`first chain step at noon    = ${idsAt(noonClock).visible.includes('take-ledger-job')}`);
state.player.stats.audacity = 1;
state.player.completedEvents = [{ id: 'sign-brine-farm-papers', title: 'x', outcome: 'Success', at: '10:00' }];
log(`install-desalinators (stat locked) still listed = ${getOpenActions(locations['leviathan-trench']).some((a) => a.id === 'install-desalinators')}`);

log('');
log('=== 26) The pass chance shown on every encounter ===');
[[1, 5], [1, 4], [1, 6], [5, 5], [8, 6], [10, 3]].forEach(([level, difficulty]) => {
  const probe = { test: 'vigilance', difficulty };
  state.player.stats.vigilance = level;
  const chance = getTestChance(probe);
  const expected = Math.min(95, Math.max(25, 60 + (level - difficulty) * 8));
  log(`Vigilance ${level} vs Diff ${difficulty} -> ${chance}% (${chanceTone(chance)}) ${chance === expected ? 'OK' : 'MISMATCH expected ' + expected}`);
});

state.player.stats.vigilance = 1;
state.currentLocationId = 'spire';
state.player.vigor = 20;
renderActions();
const cardHtml = listSpy();
log('');
log(`pill present on the card = ${/meta-pill odds-(good|mid|bad)/.test(cardHtml)}`);
log(`pill text = ${/>(\d+% to pass)</.exec(cardHtml)?.[1]}`);
log(`tooltip has the stat and the rule = ${/Roll 1-100 and you pass at \d+ or lower/.test(cardHtml)}`);
log(`diff pill still there = ${cardHtml.includes('Diff 5')}`);

log('');
log('=== 27) Tide cards show their draw chance ===');
state.player.hand = ['intellect', 'rare-moonlit-pass'];
currentView = 'deck';
renderDeck();
const deckHtml = viewContent.innerHTML;
log(`card odds shown = ${(deckHtml.match(/card-odds/g) || []).length} for ${state.player.hand.length} cards`);
log(`common -> ${/(\d+)% draw chance/.exec(deckHtml)?.[1]}% (expected ${rarityWeights.common})`);
log(`rare   -> ${/(\d+)% draw chance<\/span>\s*<h4>The Moonlit Pass/.exec(deckHtml)?.[1]}% (expected ${rarityWeights.rare})`);
log(`card title survived = ${deckHtml.includes('<h4>The Moonlit Pass</h4>') && deckHtml.includes('<h4>Trial of Intellect</h4>')}`);

log('');
log('=== 28) How often an affliction card really shows up ===');
state.player.malus = { scandal: 0, wounds: 1, suspicion: 0, nightmare: 0, debt: 0 };
state.player.pendingMalus = ['wounds'];
state.player.drawPile = allTideCards.map((card) => card.id);
let malusHits = 0;
let attempts = 4000;
for (let i = 0; i < attempts; i += 1) {
  state.player.hand = [];
  state.player.vigor = 20;
  state.player.drawTokens = 10;
  state.player.pendingMalus = ['wounds'];
  state.player.drawPile = allTideCards.map((card) => card.id);
  drawTideCard();
  closeResolution();
  if (state.player.hand.some((id) => id.startsWith('malus-'))) malusHits += 1;
}
const rate = (malusHits / attempts) * 100;
const expectedRate = (MALUS_DRAW_WEIGHT / (100 + MALUS_DRAW_WEIGHT)) * 100;
log(`malus drawn ${malusHits}/${attempts} = ${rate.toFixed(1)}% (expected ~${expectedRate.toFixed(1)}%)`);
log(`close to expectation = ${Math.abs(rate - expectedRate) < 3}`);

log('');
log('=== 29) The full-hand trap is explained ===');
state.player.hand = ['intellect', 'might', 'persuasion', 'veilcraft'];
state.player.malus = { scandal: 0, wounds: 1, suspicion: 0, nightmare: 0, debt: 0 };
state.player.pendingMalus = ['wounds'];
renderDeck();
const fullHtml = viewContent.innerHTML;
log(`notice mentions a full hand = ${fullHtml.includes('your hand is full')}`);
log(`notice names the affliction = ${fullHtml.includes('Wounds')}`);
log(`draw button disabled while full = ${!canDrawForTest()}`);

function listSpy() {
  return actionListSpy.innerHTML;
}

function canDrawForTest() {
  const handCards = state.player.hand.map((id) => allTideCards.find((card) => card.id === id)).filter(Boolean).length;
  const heldMalus = state.player.hand.filter((id) => id.startsWith('malus-')).length;
  return handCards + heldMalus < 4;
}

log('');
log('=== 30) An affliction card leaves the hand when the malus is gone ===');
state.player.malus = { scandal: 0, wounds: 1, suspicion: 2, nightmare: 0, debt: 0 };
state.player.pendingMalus = ['wounds', 'suspicion'];
state.player.hand = ['intellect', 'malus-wounds', 'malus-suspicion', 'might'];
syncHandWithActiveMalus();
log(`both active -> hand = ${JSON.stringify(state.player.hand)}`);

state.player.malus.suspicion = 0;
delete state.player.malusSources.suspicion;
syncHandWithActiveMalus();
log(`suspicion cleared -> hand = ${JSON.stringify(state.player.hand)}`);
log(`its card is gone = ${!state.player.hand.includes('malus-suspicion')}`);
log(`the wound card stays = ${state.player.hand.includes('malus-wounds')}`);
log(`pendingMalus = ${JSON.stringify(state.player.pendingMalus)}`);

state.player.malus.wounds = 0;
delete state.player.malusSources.wounds;
syncHandWithActiveMalus();
log(`wound cleared -> hand = ${JSON.stringify(state.player.hand)}`);
log(`no malus cards left = ${!state.player.hand.some((id) => id.startsWith('malus-'))}`);
log(`pendingMalus = ${JSON.stringify(state.player.pendingMalus)}`);

log('');
log('=== 31) Same when a tide card clears a malus on its own ===');
state.player.malus = { scandal: 0, wounds: 0, suspicion: 1, nightmare: 1, debt: 0 };
state.player.pendingMalus = [];
state.player.hand = ['intellect', 'epic-drowned-oath', 'might'];
syncHandWithActiveMalus();
log(`before playing the card = ${JSON.stringify(state.player.hand)}`);
state.player.vigor = 20;
playTideCard('epic-drowned-oath');
closeResolution();
log(`epic card lowers nightmare by 1 -> nightmare=${state.player.malus.nightmare}`);
log(`nightmare card pruned if it was drawn = ${state.player.malus.nightmare === 0 ? !state.player.hand.includes('malus-nightmare') : 'nightmare still active'}`);

log('');
log('=== 32) A stale malus card in an old save is cleaned up on load ===');
state.player.malus = { scandal: 0, wounds: 0, suspicion: 0, nightmare: 0, debt: 0 };
state.player.pendingMalus = [];
state.player.hand = ['intellect', 'malus-scandal', 'malus-debt', 'might'];
syncHandWithActiveMalus();
log(`orphaned cards removed = ${JSON.stringify(state.player.hand)}`);
log(`hand is clean = ${!state.player.hand.some((id) => id.startsWith('malus-'))}`);

log('');
log('=== 33) Export file naming ===');
state.player.name = 'Isolde Marrow';
log(`name -> ${buildSaveFileName()}`);
state.player.name = '  Lucia   of  The  Trench ';
log(`messy name -> ${buildSaveFileName()}`);
state.player.name = 'ÀÉîõü!!!???';
log(`accented name -> ${buildSaveFileName()}`);
state.player.name = '   ';
log(`empty name -> ${buildSaveFileName()}`);
state.player.name = 'Isolde Marrow';

log('');
log('=== 34) Profile shows the backup panel ===');
currentView = 'profile';
profileNotice = '';
renderProfile();
const backupHtml = viewContent.innerHTML;
log(`export button   = ${backupHtml.includes('data-export-save')}`);
log(`import label    = ${backupHtml.includes('for="saveFileInput"')}`);
log(`file input      = ${backupHtml.includes('id="saveFileInput"') && backupHtml.includes('accept="application/json')}`);
log(`hint explains per-browser storage = ${backupHtml.includes('this browser, on this address')}`);

log('');
log('=== 35) Import validation: rubbish must never destroy the save ===');
state.player.name = 'Keeper Of The Ledger';
state.player.properties = ['The Brine-Farm (La Fattoria 1)'];
state.player.completedEvents = [{ id: 'take-ledger-job', title: 'x', outcome: 'Success', at: '10:00' }];
state.player.log = [{ prefix: 'Test', message: 'real progress', reason: '', time: '10:00' }];
saveGame();
const goodSave = store[STORAGE_KEY];

function tryImport(text) {
  global.FileReader = class {
    readAsText() { this.result = text; if (this.onload) this.onload(); }
  };
  importSave({ name: 'test.json' });
}

const cleanCases = [
  ['not JSON', 'this is not json at all {{{'],
  ['no player', JSON.stringify({ hello: 'world' })],
  ['null stats', JSON.stringify({ player: { stats: null } })],
  ['string stat in a real save', JSON.stringify({ progressionVersion: 4, player: { name: 'Broken', stats: { vigilance: 'lots', cunning: 1, audacity: 1, elegance: 1, persuasion: 1, resolve: 1 }, log: [] } })],
  ['string resource', JSON.stringify({ progressionVersion: 4, player: { name: 'Broken', stats: { vigilance: 1, cunning: 1, audacity: 1, elegance: 1, persuasion: 1, resolve: 1 }, resources: { ducatsOfSalt: 'many' }, log: [] } })],
  ['log is not a list', JSON.stringify({ progressionVersion: 4, player: { name: 'Broken', stats: { vigilance: 1, cunning: 1, audacity: 1, elegance: 1, persuasion: 1, resolve: 1 }, log: 'nope' } })]
];

cleanCases.forEach(([label, text]) => {
  const before = store[STORAGE_KEY];
  profileNotice = '';
  tryImport(text);
  log(`${label.padEnd(26)} -> "${profileNotice}"`);
  log(`${''.padEnd(26)}    save intact: ${store[STORAGE_KEY] === before}`);
});

log('');
log('=== 36) Import a real chronicle ===');
const portable = {
  app: 'the-drowned-serenissima',
  format: 1,
  exportedAt: new Date().toISOString(),
  state: {
    ...createDefaultState(),
    player: {
      ...createDefaultState().player,
      name: 'Isolde Marrow',
      properties: ['The Brine-Farm (La Fattoria 1)', 'The Brine-Farm (La Fattoria 2)'],
      completedEvents: [
        { id: 'take-ledger-job', title: 'Take the Ledger Job at the Customs House', outcome: 'Success', at: '21:00' },
        { id: 'install-desalinators', title: 'Install Sub-Zero Desalinators', outcome: 'Success', at: '22:00' }
      ],
      log: [{ prefix: 'Success', message: 'imported chronicle', reason: 'x', time: '22:00' }],
      statXp: { ...createDefaultState().player.statXp, resolve: 40 }
    },
    currentLocationId: 'leviathan-trench'
  }
};
tryImport(JSON.stringify(portable));
log(`notice -> "${profileNotice}"`);
log(`name restored      = ${state.player.name}`);
log(`properties restored= ${JSON.stringify(state.player.properties)}`);
log(`deeds restored     = ${state.player.completedEvents.length}`);
log(`location restored  = ${state.currentLocationId}`);
log(`stat xp restored   = ${state.player.statXp.resolve}`);
log(`unique resolved   = ${getChronicleStats().uniqueResolved}/${getChronicleStats().uniqueTotal}`);
log(`a Backup entry logged = ${state.player.log.some((entry) => entry.prefix === 'Backup')}`);

log('');
log('=== 37) A legacy save without the new fields still imports ===');
const legacy = { player: { name: 'Old Soul', stats: { vigilance: 3 }, resources: { ducatsOfSalt: 12 }, properties: [], log: [] } };
tryImport(JSON.stringify(legacy));
log(`notice -> "${profileNotice}"`);
log(`name = ${state.player.name}, vigor = ${state.player.vigor}, pendingMalus = ${JSON.stringify(state.player.pendingMalus)}`);
log(`stats filled to 6 = ${Object.keys(state.player.stats).length === 6}`);

log('');
log('=== 38) Copyright in the sidebar ===');
const html = fs.readFileSync('C:/Users/focas/source/salt-republic/index.html', 'utf8');
log(`copyright present = ${html.includes('Grimm Legacy')}`);
log(`non-commercial   = ${html.includes('Non-commercial use only')}`);
log(`email is a mailto= ${html.includes('mailto:grimmlegacies@gmail.com')}`);
log(`year is dynamic  = ${html.includes('id="copyrightYear"')}`);
log(`placed under the title = ${html.indexOf('sidebar-legal') > html.indexOf('The Drowned Serenissima</span>')}`);

fs.writeFileSync('tools/out/reward-check.out.txt', out.join('\n'), 'utf8');
console.log('REWARD HARNESS DONE');