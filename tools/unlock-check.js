const fs = require('fs');
const vm = require('vm');

function makeEl() {
  const target = function () {};
  return new Proxy(target, {
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
  getItem: (key) => (key in store ? store[key] : null),
  setItem: (key, value) => { store[key] = String(value); }
};
global.document = {
  getElementById: () => makeEl(),
  querySelector: () => makeEl(),
  querySelectorAll: () => []
};

const out = [];
const log = (...args) => out.push(args.join(' '));
const run = (source) => vm.runInThisContext(source);

vm.runInThisContext(fs.readFileSync('C:/Users/focas/source/salt-republic/app.js', 'utf8'));

log('=== A) Fresh save: how each encounter presents itself ===');
Object.values(locations).forEach((location) => {
  location.actions.forEach((action) => {
    const unlock = describeActionUnlock(action);
    log(`[${location.realm}] ${action.id} -> kind=${unlock.kind} met=${unlock.met} accessible=${canAccessAction(action)}`);
    log(`    ${summarizeUnlock(action)}`);
  });
});

log('');
log('=== B) install-desalinators while Audacity is 1 ===');
state.player.stats.audacity = 1;
let unlock = describeActionUnlock(findActionById('install-desalinators'));
log(`kind=${unlock.kind} met=${unlock.met} accessible=${canAccessAction(findActionById('install-desalinators'))}`);
unlock.unmet.forEach((condition) => log(`  ✕ ${condition.label} | ${condition.detail}`));
log(`lockReason: ${getActionLockReason(findActionById('install-desalinators'))}`);
log(`costText: ${describeCost(findActionById('install-desalinators').cost)}`);

log('');
log('=== C) same encounter once Audacity reaches 6 ===');
state.player.stats.audacity = 6;
unlock = describeActionUnlock(findActionById('install-desalinators'));
log(`met=${unlock.met} accessible=${canAccessAction(findActionById('install-desalinators'))}`);
unlock.conditions.forEach((condition) => log(`  ✓ ${condition.label} | ${condition.detail}`));
log(`lockReason: "${getActionLockReason(findActionById('install-desalinators'))}"`);
log(`chainLink: ${unlock.chainLink.label} | ${unlock.chainLink.detail}`);

log('');
log('=== D) chain requirement type (declared on a synthetic action) ===');
const chained = { id: 'test-chained', title: 'Test Chain Step', requires: [{ type: 'chain', action: 'harvest-orchids' }] };
log(`before resolution -> met=${describeActionUnlock(chained).met} : ${describeActionUnlock(chained).unmet[0].detail}`);
recordEventCompletion(chained, 'Success');
log(`after  unrelated record -> met=${describeActionUnlock(chained).met}`);
recordEventCompletion(findActionById('harvest-orchids'), 'Success');
const chainedAfter = describeActionUnlock(chained);
log(`after  harvest-orchids -> met=${chainedAfter.met} : ${chainedAfter.conditions[0].detail}`);

log('');
log('=== E) rendered preview HTML ===');
const initialHtml = renderActionUnlock(findActionById('decipher-treaty'));
const conditionedHtml = renderActionUnlock(findActionById('install-desalinators'));
log(`initial   -> hasHeading=${initialHtml.includes('How this unlocked')} hasInitialLine=${initialHtml.includes('Available from the start.')} class=${/class="unlock-block ([a-z-]+)/.exec(initialHtml)[1]}`);
log(`conditioned-> hasMet=${conditionedHtml.includes('unlock-item met')} hasChainLink=${conditionedHtml.includes('unlock-item link')} hasStory=${conditionedHtml.includes('Why it surfaces here')}`);
log(`li count  -> initial=${(initialHtml.match(/<li/g) || []).length} conditioned=${(conditionedHtml.match(/<li/g) || []).length}`);

log('');
log('=== F) resolving an encounter records it and explains itself in the chronicle ===');
state.currentLocationId = 'leviathan-trench';
state.player.vigor = 20;
state.player.stats.audacity = 6;
resolveAction('harvest-orchids');
log(`completedEvents -> ${JSON.stringify(state.player.completedEvents)}`);
log(`chronicle prefix -> ${state.player.log[0].prefix}`);
log(`chronicle reason -> ${state.player.log[0].reason}`);
log(`chain link now  -> ${describeActionUnlock(findActionById('install-desalinators')).chainLink.detail}`);

log('');
log('=== G) clicking a locked encounter ===');
state.player.stats.audacity = 1;
resolveAction('install-desalinators');
log(`prefix -> ${state.player.log[0].prefix}`);
log(`reason -> ${state.player.log[0].reason}`);

log('');
log('=== H) save/load round trip keeps completedEvents ===');
saveGame();
log(`reloaded completedEvents -> ${JSON.stringify(loadSave().player.completedEvents)}`);
store[STORAGE_KEY] = JSON.stringify({ player: { name: 'Old Chronicle' } });
log(`legacy save without completedEvents -> ${JSON.stringify(loadSave().player.completedEvents)}`);

log('');
log('=== I) resourceNames refactor still feeds Persona ===');
log(`inventory rows -> ${Object.keys(resourceNames).length}`);

fs.writeFileSync('tools/out/unlock-check.out.txt', out.join('\n'), 'utf8');
console.log('HARNESS DONE');
