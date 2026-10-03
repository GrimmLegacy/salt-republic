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

vm.runInThisContext(fs.readFileSync('C:/Users/focas/source/salt-republic/factions.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('C:/Users/focas/source/salt-republic/lore.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('C:/Users/focas/source/salt-republic/threads.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('C:/Users/focas/source/salt-republic/app.js', 'utf8'));

log('=== 1) Chronicle statistics ===');
log(JSON.stringify(getChronicleStats()));
Math.random = () => 0;
state.currentLocationId = 'grand-canal';
['take-ledger-job', 'carry-sealed-cargo'].forEach((id) => { state.player.vigor = 20; resolveAction(id); });
Math.random = () => 0.5;
log(`after 2 unique deeds: ${JSON.stringify(getChronicleStats())}`);

log('');
log('=== 2) Renaming ===');
log(`"Isolde Marrow" -> ${JSON.stringify(renamePlayer('Isolde Marrow'))} name now "${state.player.name}"`);
log(`"  Lucia   of  The  Trench " -> ${JSON.stringify(renamePlayer('  Lucia   of  The  Trench '))} name now "${state.player.name}"`);
log(`same name -> ${JSON.stringify(renamePlayer('Lucia of The Trench'))}`);
log(`empty -> ${JSON.stringify(renamePlayer('   '))}`);
log(`too long -> ${JSON.stringify(renamePlayer('x'.repeat(NAME_MAX_LENGTH + 1)))}`);
log(`at the limit (${NAME_MAX_LENGTH}) -> ok=${renamePlayer('y'.repeat(NAME_MAX_LENGTH)).ok}`);
log(`chronicle entry written: ${state.player.log[0].prefix} -> ${state.player.log[0].message}`);

log('');
log('=== 3) Profile markup ===');
currentView = 'profile';
renderProfile();
const html = viewContent.innerHTML;
log(`has name input   = ${html.includes('id="profileNameInput"')}`);
log(`has rename btn   = ${html.includes('data-rename-player')}`);
log(`has arm reset    = ${html.includes('data-arm-reset')}`);
log(`hidden confirm   = ${!html.includes('data-reset-game')}`);
log(`unique list empty= ${html.includes('None yet')}`);
log(`facts rendered   = ${(html.match(/profile-facts/g) || []).length} block(s), ${(html.match(/<div><span>/g) || []).length} tiles`);

log('');
log('=== 4) Two step confirmation ===');
resetArmed = true;
renderProfile();
const armed = viewContent.innerHTML;
log(`armed shows confirm = ${armed.includes('data-reset-game')}`);
log(`armed shows cancel  = ${armed.includes('data-cancel-reset')}`);
log(`armed warning       = ${armed.includes('This cannot be undone.')}`);
resetArmed = false;

log('');
log('=== 5) Reset wipes the chronicle ===');
state.player.properties = ['The Brine-Farm (La Fattoria 1)'];
state.player.stats.vigilance = 9;
state.player.resources.ducatsOfSalt = 3;
state.player.hand = ['intellect'];
state.player.completedEvents = [{ id: 'take-ledger-job', title: 't', outcome: 'Success', at: '10:00' }];
state.currentLocationId = 'leviathan-trench';
currentView = 'deck';
saveGame();
log(`save existed before reset = ${Boolean(store[STORAGE_KEY])}`);
resetGame();
log(`view after reset  = ${currentView}`);
log(`name after reset = ${state.player.name}`);
log(`properties       = ${JSON.stringify(state.player.properties)}`);
log(`vigilance        = ${state.player.stats.vigilance}`);
log(`ducats           = ${state.player.resources.ducatsOfSalt}`);
log(`hand             = ${JSON.stringify(state.player.hand)}`);
log(`completedEvents  = ${JSON.stringify(state.player.completedEvents)}`);
log(`drawPile ready   = ${state.player.drawPile.length} cards, deckInitialized=${state.player.deckInitialized}`);
log(`log entries      = ${state.player.log.length} -> "${state.player.log[0].prefix}"`);
log(`resetArmed       = ${resetArmed}`);
log(`fresh save saved = ${Boolean(store[STORAGE_KEY])}`);
log(`farm encounter locked again = ${!canAccessAction(findActionById('harvest-orchids'))}`);
log(`chain step 1 open again     = ${canAccessAction(findActionById('take-ledger-job'))}`);
log(`stats after reset = ${JSON.stringify(getChronicleStats())}`);

fs.writeFileSync('tools/out/profile-check.out.txt', out.join('\n'), 'utf8');
console.log('PROFILE HARNESS DONE');