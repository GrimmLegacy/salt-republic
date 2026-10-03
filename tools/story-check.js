// Verifica i percorsi (threads) e i bivi dichiarati.
//
// Il pericolo di questo sistema non e' che non mostri niente: e' che mostri la
// cosa sbagliata. Uno step puo' dire "fatto" mentre l'incontro e' ancora da fare,
// un bivio puo' restare aperto dopo la scelta, e una scelta puo' essere sostituita
// da un secondo click. Qui si provano esattamente quelle tre cose, piu' la
// sanificazione di un salvataggio scritto a mano.
const { loadGame, readOut } = require('./harness');

// `app.js` si aggancia a `window` per il boot. In Node non esiste, e senza questo
// stub il caricamento muore prima di arrivare a una sola verifica.
global.window = { addEventListener() {}, setInterval() {}, setTimeout: () => 0, clearTimeout() {} };

// `declareStoryDecision` chiama `saveGame()`, quindi servono `document` e
// `localStorage` fin dall'inizio e non solo quando si rende la pagina: senza questi
// stub il salvataggio muore alla prima verifica che registra una scelta.
const elements = {};
const fakeElement = () => ({
  textContent: '',
  innerHTML: '',
  hidden: false,
  style: {},
  value: '',
  files: [],
  classList: { add() {}, remove() {}, toggle() {} },
  addEventListener() {},
  querySelector: () => null,
  querySelectorAll: () => []
});
global.document = {
  getElementById: (id) => {
    if (!elements[id]) elements[id] = fakeElement();
    return elements[id];
  },
  querySelector: () => fakeElement(),
  querySelectorAll: () => []
};
global.localStorage = {
  _v: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this._v, k) ? this._v[k] : null; },
  setItem(k, v) { this._v[k] = String(v); },
  removeItem(k) { delete this._v[k]; }
};

const out = [];
const log = (s) => out.push(s);
let failures = 0;
function check(label, condition, detail = '') {
  if (condition) log(`ok   ${label}`);
  else {
    failures += 1;
    log(`FAIL ${label} -- ${detail}`);
  }
}

loadGame();

// ---------------------------------------------------------------------------
log('=== A) The thread names steps that really exist ===');
const thread = findStoryThread('brine-farm');
check('the farm thread is declared', Boolean(thread), 'no brine-farm thread');
check('it has steps', thread.steps.length > 0, 'no steps');
thread.steps.forEach((step) => {
  const action = findActionById(step.action);
  check(`step "${step.title}" points at a real encounter`, Boolean(action), step.action);
  check(`step "${step.title}" resolves a realm`, Boolean(getStoryStepRealm(step)), 'no realm found');
});

// Uno step che punta a un incontro inesistente deve risultare chiuso, non
// sparire: e' la difesa contro un catalogo scritto male.
check('a step with no encounter reads as locked',
  getStoryStepState({ action: 'no-such-encounter' }) === 'locked',
  getStoryStepState({ action: 'no-such-encounter' }));

// ---------------------------------------------------------------------------
log('');
log('=== B) Step state is read from the encounters, not stored ===');
state = createDefaultState();
check('a fresh chronicle has nothing done',
  thread.steps.every((step) => getStoryStepState(step) !== 'done'), 'a step was already done');

// Il primo passo e' aperto a una partita nuova: e' il lavoro iniziale.
check('the first step is open on a fresh chronicle',
  getStoryStepState(thread.steps[0]) === 'open', getStoryStepState(thread.steps[0]));
check('a later step is still locked on a fresh chronicle',
  getStoryStepState(thread.steps[3]) === 'locked', getStoryStepState(thread.steps[3]));

// Un successo scritto a mano deve accendere lo step: e' la prova che lo stato
// dello step e' derivato da `completedEvents` e non tenuto in parte.
state.player.completedEvents.push({ id: 'take-ledger-job', title: 'x', outcome: 'Success', at: '10:00' });
check('a resolved encounter turns its step green',
  getStoryStepState(thread.steps[0]) === 'done', getStoryStepState(thread.steps[0]));

// Un fallimento NON chiude lo step: l'incontro si puo' rifare.
state.player.completedEvents.push({ id: 'bargain-salt-pans', title: 'x', outcome: 'Failure', at: '11:00' });
check('a failed encounter is marked failed, not done',
  getStoryStepState({ action: 'bargain-salt-pans' }) === 'failed',
  getStoryStepState({ action: 'bargain-salt-pans' }));

// ---------------------------------------------------------------------------
log('');
log('=== C) The fork stays shut until the farm is yours ===');
const fork = findStoryFork('brine-farm-mandate');
check('the fork is declared', Boolean(fork), 'no brine-farm-mandate fork');
check('it offers exactly three ways to run the farm', fork.options.length === 3, `${fork.options.length} options`);
check('every option has its own id',
  new Set(fork.options.map((o) => o.id)).size === 3, 'two options share an id');

state = createDefaultState();
check('the fork is shut before the lease is signed', !isStoryForkOpen(fork), 'open too early');
check('declaring while shut is refused', declareStoryDecision(fork.id, 'sole') === false, 'it was accepted');
check('a refused decision records nothing', state.player.decisions[fork.id] === undefined,
  JSON.stringify(state.player.decisions));

// ---------------------------------------------------------------------------
log('');
log('=== D) A declared decision writes real flags ===');
state.player.flags.brineFarmSigned = true;
check('the fork opens once the lease is signed', isStoryForkOpen(fork), 'still shut');

const saltBefore = state.player.resources.ducatsOfSalt;
// L'opzione scrive l'esperienza su Persuasion, non su Resolve: la verifica guarda
// il valore che l'opzione dichiara davvero, altrimenti passerebbe anche se il
// bivio scrivesse la statistica sbagliata.
const persuasionBefore = state.player.statXp.persuasion;
check('declaring returns true', declareStoryDecision(fork.id, 'combine') === true, 'refused');
check('the answer is recorded', getStoryDecision(fork.id) === 'combine', getStoryDecision(fork.id));
check('the option wrote its flag', state.player.flags.farmCombineBacked === true, 'flag not set');
check('the other two flags stayed off',
  !state.player.flags.farmSoleKept && !state.player.flags.farmOpenToCity, 'a wrong flag was set');
check('the reward was applied', state.player.resources.ducatsOfSalt === saltBefore + 12,
  `${saltBefore} -> ${state.player.resources.ducatsOfSalt}`);
check('the experience was applied', state.player.statXp.persuasion === persuasionBefore + 1,
  `${persuasionBefore} -> ${state.player.statXp.persuasion}`);
check('no experience went to another attribute', state.player.statXp.resolve === 0,
  `resolve=${state.player.statXp.resolve}`);
check('the chronicle recorded the decision', state.player.log.some((e) => e.prefix === fork.title), 'no log entry');

// Il punto del sistema: il resto del gioco legge flag normali, quindi un gate
// esistente deve poter vedere l'esito del bivio senza sapere che esiste.
check('a plain flag gate can read the outcome',
  Boolean(state.player.flags.farmCombineBacked), 'flag unreadable');

// ---------------------------------------------------------------------------
log('');
log('=== E) A decision is final ===');
check('a second decision is refused', declareStoryDecision(fork.id, 'sole') === false, 'it was accepted');
check('the first answer survived', getStoryDecision(fork.id) === 'combine', getStoryDecision(fork.id));

// ---------------------------------------------------------------------------
log('');
log('=== F) A hand-edited save cannot invent decisions ===');
check('an unknown fork is dropped',
  Object.keys(sanitizeStoryDecisions({ 'made-up-fork': 'sole' })).length === 0,
  JSON.stringify(sanitizeStoryDecisions({ 'made-up-fork': 'sole' })));
check('an unknown option is dropped',
  Object.keys(sanitizeStoryDecisions({ 'brine-farm-mandate': 'made-up' })).length === 0,
  JSON.stringify(sanitizeStoryDecisions({ 'brine-farm-mandate': 'made-up' })));
check('a real decision survives',
  sanitizeStoryDecisions({ 'brine-farm-mandate': 'open' })['brine-farm-mandate'] === 'open',
  JSON.stringify(sanitizeStoryDecisions({ 'brine-farm-mandate': 'open' })));
check('rubbish sanitises to nothing', Object.keys(sanitizeStoryDecisions('nope')).length === 0, 'not empty');
check('null sanitises to nothing', Object.keys(sanitizeStoryDecisions(null)).length === 0, 'not empty');

// Ogni flag che un'opzione scrive deve essere dichiarato in `loreFlags`, altrimenti
// `applyReward` lo scarterebbe in silenzio e il bivio sembrerebbe funzionare
// senza cambiare niente. E' il fallimento piu' insidioso in assoluto.
storyForks.forEach((f) => f.options.forEach((option) => {
  Object.keys(option.sets || {}).forEach((flag) => {
    check(`flag ${flag} is declared in loreFlags`, flag in loreFlags, 'undeclared flag');
  });
}));

// Ogni bivio dichiarato deve stare su un percorso, e ogni bivio citato da un
// percorso deve esistere: altrimenti la pagina mostra un bivio che non si apre
// mai, o un bivio che nessuno mostra.
storyThreads.forEach((t) => (t.forks || []).forEach((id) => {
  check(`thread ${t.id} points at a real fork`, Boolean(findStoryFork(id)), id);
}));
storyForks.forEach((f) => {
  check(`fork ${f.id} hangs on a real thread`, Boolean(findStoryThread(f.threadId)), f.threadId);
});

// ---------------------------------------------------------------------------
log('');
log('=== G) The Chronicles page shows paths before factions ===');
const fakeEl = elements.viewContent;
state.player.flags.brineFarmSigned = true;
state.player.decisions = {};
renderChronicles();
const html = fakeEl.innerHTML;
const pathsAt = html.indexOf('Your paths through the city');
const factionsAt = html.indexOf('The four powers of the lagoon');
check('the page renders', html.length > 0, 'empty');
check('the paths come before the factions', pathsAt !== -1 && factionsAt !== -1 && pathsAt < factionsAt,
  `paths=${pathsAt} factions=${factionsAt}`);
check('the thread is on the page', html.includes('The Brine-Farm'), 'thread missing');
check('all six steps are listed', thread.steps.every((s) => html.includes(s.title)), 'a step is missing');
check('an open fork shows three buttons',
  (html.match(/data-story-option=/g) || []).length === 3, 'wrong button count');

// Dopo la scelta i tre bottoni non devono piu' esserci: un bivio chiuso che
// sembra aperto e' la lettura peggiore che questa pagina puo' fare.
state.player.decisions['brine-farm-mandate'] = 'open';
renderChronicles();
const closedHtml = fakeEl.innerHTML;
check('a decided fork shows no buttons', !closedHtml.includes('data-story-option='), 'buttons still there');
check('a decided fork names the chosen road', closedHtml.includes('Open the rows to the city'), 'choice missing');

// ---------------------------------------------------------------------------
log('');
log('=== H) The three roads are genuinely different ===');
const sole = findStoryOption(fork, 'sole');
const combined = findStoryOption(fork, 'combine');
const openRows = findStoryOption(fork, 'open');
check('no two options write the same flag',
  new Set([sole, combined, openRows].map((o) => Object.keys(o.sets)[0])).size === 3, 'flags collide');
check('no two options share the same log', new Set([sole, combined, openRows].map((o) => o.log)).size === 3, 'logs repeat');
check('no two options read the same', new Set([sole, combined, openRows].map((o) => o.body)).size === 3, 'bodies repeat');

// ---------------------------------------------------------------------------
log('');
log('=== I) A shut fork must not promise what has not happened yet ===');
// Il prompt di un bivio parla di una fattoria gia' tua. Mostrarlo come anteprima
// mentre il bivio e' chiuso direbbe al giocatore che il contratto e' gia' firmato.
// Ogni bivio chiuso deve avere la sua riga, e non deve contenere il prompt.
storyForks.forEach((f) => {
  check(`fork ${f.id} has copy for when it is shut`, typeof f.shutHint === 'string' && f.shutHint.length > 0, 'no shutHint');
});

state = createDefaultState();
delete state.player.flags.brineFarmSigned;
renderChronicles();
const shutHtml = elements.viewContent.innerHTML;
check('a shut fork shows no buttons', !shutHtml.includes('data-story-option='), 'buttons showing');
check('a shut fork shows its shut line', shutHtml.includes('Nothing to run yet'), 'shut line missing');
check('a shut fork does not leak the prompt', !shutHtml.includes('The first nursery lights itself'), 'prompt leaked');
check('a shut fork does not promise the lease', !shutHtml.includes('There is no correct answer'), 'prompt leaked');

// ---------------------------------------------------------------------------
log('');
log('=== J) A declared choice is what opens the work of that branch ===');
// The fork on its own changes nothing the player can do: it writes a flag. The
// proof that the system closes is that each branch opens exactly one repeatable
// encounter and one card, and that the other two stay shut.

const branchActions = {
  sole: 'farm-work-the-rows-alone',
  combine: 'farm-deliver-the-combine-quota',
  open: 'farm-collect-the-row-rents'
};
const branchCards = {
  sole: 'uncommon-farm-single-signature',
  combine: 'uncommon-farm-combine-quota-book',
  open: 'uncommon-farm-names-on-the-wall'
};

const noonClock = getGameClock(new Date(2026, 9, 1, 12));
const midnightClock = getGameClock(new Date(2026, 9, 1, 23));
// `getVisibleActions` reads the hour off the wall clock, so the only way to ask
// "is this open by day and by night" is to hand it a clock and take it back.
const visibleAt = (locationId, clock) => {
  const realClock = getGameClock;
  getGameClock = () => clock;
  const ids = getVisibleActions(locations[locationId]).map((entry) => entry.id);
  getGameClock = realClock;
  return ids;
};

Object.keys(branchActions).forEach((optionId) => {
  state = createDefaultState();
  state.player.flags.brineFarmSigned = true;
  const declared = declareStoryDecision('brine-farm-mandate', optionId);
  check(`branch "${optionId}" is declared`, declared === true, 'the fork refused it');

  const midday = visibleAt('leviathan-trench', noonClock);
  const night = visibleAt('leviathan-trench', midnightClock);
  const mine = branchActions[optionId];
  check(`branch "${optionId}" opens its own repeatable work`,
    midday.includes(mine) || night.includes(mine), `${mine} never surfaced`);

  // A branch that also opened the others would not be a branch, it would be three
  // copies of the same encounter.
  Object.keys(branchActions).filter((other) => other !== optionId).forEach((other) => {
    const stray = branchActions[other];
    check(`branch "${optionId}" leaves the "${other}" work shut`,
      !midday.includes(stray) && !night.includes(stray), `${stray} surfaced anyway`);
  });

  check(`branch "${optionId}" unlocks its own uncommon card`,
    isCardAvailable(branchCards[optionId]), 'the card stayed shut');
  Object.keys(branchCards).filter((other) => other !== optionId).forEach((other) => {
    check(`branch "${optionId}" leaves the "${other}" card shut`,
      !isCardAvailable(branchCards[other]), 'the card opened anyway');
  });
});

// ---------------------------------------------------------------------------
log('');
log('=== K) The three roads do not feel like the same road ===');
// If the hour, the test and the handout were the same on all three, the choice
// would be a label over one encounter, and the player would feel the difference
// in the fiction instead of in the game.
const branchRows = Object.values(branchActions).map((id) => findActionById(id));
check('every branch has a repeatable encounter',
  branchRows.every((entry) => entry && entry.repeatable === true), 'one is missing or unique');
check('no two branches share the same hour',
  new Set(branchRows.map((entry) => entry.when)).size === 3, branchRows.map((entry) => entry.when).join('/'));
check('no two branches share the same test',
  new Set(branchRows.map((entry) => entry.test)).size === 3, branchRows.map((entry) => entry.test).join('/'));
check('no two branches pay out the same way',
  new Set(branchRows.map((entry) => `${entry.success.resources.phosphorAmber || 0}|${entry.success.resources.ducatsOfSalt || 0}`)).size === 3,
  'two branches hand over the same reward');
check('no two branches fail the same way',
  new Set(branchRows.map((entry) => Object.keys(entry.failure.resources || {}).join(','))).size === 3,
  'two branches fail identically');
check('every branch has its own chronicle line',
  new Set(branchRows.map((entry) => entry.success.log)).size === 3, 'logs repeat');
check('every branch pays out something',
  branchRows.every((entry) => Object.keys(entry.success.resources || {}).length > 0), 'a branch pays nothing');

// ---------------------------------------------------------------------------
log('');
log('=== L) A flag requirement reads a decision like any other gate ===');
// This is the join between the fork and the rest of the game. The dangerous case
// is not a loud failure: it is a requirement that resolves to nothing, which would
// leave the encounter shut forever while looking perfectly correct.
state = createDefaultState();
const shutFlag = describeRequirement({ type: 'flag', id: 'farmSoleKept' });
check('an absent flag reads as unmet', shutFlag.met === false, 'met while the flag was off');
state.player.flags.farmSoleKept = true;
check('a written flag reads as met',
  describeRequirement({ type: 'flag', id: 'farmSoleKept' }).met === true, 'still unmet');
check('a flag is named after the lore entry, not the id',
  !shutFlag.label.includes('farmSoleKept'), 'the raw id reached the player');
// While it is shut, the text must not say which option is missing: a branch is a
// fork, and a sentence naming the missing choice would make it for the player.
check('a shut flag does not name the missing choice',
  !shutFlag.infinitive.includes('farmSoleKept') && !shutFlag.detail.includes('farmSoleKept'),
  'the missing choice leaked');

// ---------------------------------------------------------------------------
log('');
log('=== M) A thread carries its own art, and a thread without it still draws ===');
check('the farm thread declares its art', typeof thread.art === 'string' && thread.art.length > 0, 'no art declared');
state.player.flags.brineFarmSigned = true;
state.player.decisions = {};
renderChronicles();
const artHtml = elements.viewContent.innerHTML;
check('the art reaches the page',
  artHtml.includes(`--story-thread-art: url('${thread.art}')`), 'the art variable is not on the article');
check('the art sits on one thread only',
  (artHtml.match(/--story-thread-art/g) || []).length === 1, 'a second thread carries art');
// A thread with no art of its own falls back to the declared default, rather than
// emitting no `url()` at all or an empty panel.
const noArt = renderStoryThread({ ...thread, art: undefined });
check('a thread without art falls back to the default figure',
  noArt.includes(`--story-thread-art: url('${DEFAULT_ART}')`), 'no fallback was declared');
// A path holding an apostrophe would close the attribute on the spot, and there are
// already files like that under `immagini/`, so this is not a hypothetical.
const quoted = renderStoryThread({ ...thread, art: "immagini/Smugglers' Anchorage.jpg" });
check('an apostrophe in an art path cannot close the attribute early',
  quoted.includes('Smugglers%27') && quoted.includes("Anchorage.jpg')\""), 'the attribute was cut short');

// ---------------------------------------------------------------------------
log('');
log('=== N) The date card shows the sky it is actually in ===');
// The image follows the hour of the game, so this asks for two clocks and reads
// what actually landed on the card rather than what the markup would suggest.
const originalQuerySelector = document.querySelector;
const skyAt = (clock) => {
  const card = {
    style: {},
    classes: new Set(),
    classList: {
      add(c) { card.classes.add(c); },
      remove(c) { card.classes.delete(c); },
      toggle(c, on) { if (on) card.classes.add(c); else card.classes.delete(c); }
    }
  };
  document.querySelector = (selector) => (selector === '.date-card' ? card : fakeElement());
  const realClock = getGameClock;
  getGameClock = () => clock;
  renderGameClock();
  getGameClock = realClock;
  document.querySelector = originalQuerySelector;
  return card;
};
const dayCard = skyAt(noonClock);
const nightCard = skyAt(midnightClock);
check('by day the card shows the day sky',
  (dayCard.style.backgroundImage || '').includes(CLOCK_SKY.day), dayCard.style.backgroundImage);
check('by night the card shows the night sky',
  (nightCard.style.backgroundImage || '').includes(CLOCK_SKY.night), nightCard.style.backgroundImage);
check('by day the card does not show the night sky',
  !(dayCard.style.backgroundImage || '').includes(CLOCK_SKY.night), 'the night sky leaked into the day');
check('the card says which one it is in daylight',
  dayCard.classes.has('is-day') && !dayCard.classes.has('is-night'), [...dayCard.classes].join('/'));
check('the card says which one it is at night',
  nightCard.classes.has('is-night') && !nightCard.classes.has('is-day'), [...nightCard.classes].join('/'));

// ---------------------------------------------------------------------------
log('');
log('=== O) A piece of the world with no art yet shows the default figure ===');
// Artwork arrives at its own pace, so the fallback has to hold whatever the
// catalogue looks like today. It is proved on a deliberately stripped copy rather
// than by hunting for an entry that happens to be missing: as soon as the last
// real picture lands, a test written the other way would quietly stop testing
// anything at all.
state = createDefaultState();
state.player.flags.brineFarmSigned = true;
declareStoryDecision('brine-farm-mandate', 'open');
state.currentLocationId = 'leviathan-trench';

const branchEncounter = findActionById('farm-collect-the-row-rents');
const realEncounterImage = branchEncounter.image;
branchEncounter.image = undefined;
const visibleIds = visibleAt('leviathan-trench', noonClock);
const artlessIndex = visibleIds.indexOf('farm-collect-the-row-rents');
check('the branch encounter stays on screen while its art is missing', artlessIndex !== -1, visibleIds.join('/'));

const thumbs = visibleIds.map(() => ({ style: {} }));
if (!elements.actionList) elements.actionList = fakeElement();
elements.actionList.querySelectorAll = () => thumbs;
const realClockForThumbs = getGameClock;
getGameClock = () => noonClock;
renderActions();
getGameClock = realClockForThumbs;
branchEncounter.image = realEncounterImage;

check('an encounter without art shows the default figure',
  String(thumbs[artlessIndex]?.style.backgroundImage || '').includes(DEFAULT_ART),
  JSON.stringify(thumbs[artlessIndex]?.style.backgroundImage));
check('every thumbnail got a picture',
  thumbs.every((thumb) => thumb.style.backgroundImage), 'a thumbnail was left empty');
check('no thumbnail anywhere points at a missing url',
  thumbs.every((thumb) => !String(thumb.style.backgroundImage || '').includes('undefined')),
  'a url("undefined") was written');

// The card face and the card that turns over have to be the same picture, or the
// deck and the draw animation would show two different things for one card.
const sampleCard = allTideCards[0];
check('a card without art shows the default figure',
  renderTideCard({ ...sampleCard, image: undefined }).includes(`src="${DEFAULT_ART}"`), 'no fallback on the card face');
check('a card with its own art keeps it',
  renderTideCard(sampleCard).includes(`src="${sampleCard.image}"`), 'the real picture was replaced');
check('no card falls through to a missing url',
  allTideCards.every((entry) => renderTideCard(entry).includes('src="') && !renderTideCard(entry).includes('src=""')),
  'a card rendered an empty src');

log('');
log(`story-check: ${failures} FAILURES`);

require('fs').writeFileSync(readOut('story-check.out.txt'), out.join('\n'), 'utf8');
console.log(failures ? `FAILURES: ${failures}` : 'STORY HARNESS OK');