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

// ---------------------------------------------------------------------------
log('');
log('=== P) A night run walks step one to step ten and then starts over ===');
// The promise made to the player: you begin at one, you finish at ten, and if
// you close the game halfway the next night offers exactly the step you had
// reached. That is the whole behaviour, so it is walked rather than described.
// The first step is gated too, on itself: it opens when nothing further down the
// run has been done more recently. Otherwise it would sit open forever beside the
// step you are actually on, and the promise of "one step at a time" would turn
// into two choices at a time.
const belfry = locations.spire.actions.filter((action) => action.id.startsWith('belfry-night-'));
check('the belfry run has ten steps', belfry.length === 10, `${belfry.length} steps`);
check('every step happens at night', belfry.every((action) => action.when === 'night'), 'a step happens by day');
check('every step is repeatable', belfry.every((action) => action.repeatable === true), 'a step can only be done once');
check('the first step waits on the run being finished',
  (belfry[0].requires || []).some((requirement) => requirement.type === 'runEntry' && requirement.action === belfry[0].id),
  'the first step is always open');

// Each step names the one before it, so a step cannot quietly point at itself or
// skip one without a check noticing.
const links = belfry.slice(1).map((step, index) => step.chain?.follows === belfry[index].id);
check('every step continues the one before it', links.every(Boolean), 'a step skips ahead');
const opened = belfry.slice(1).flatMap((step) => (step.requires || [])
  .filter((requirement) => requirement.type === 'chainRun' && requirement.action !== step.chain?.follows));
check('every step waits on the run, not on something else', opened.length === 0, `${opened.length} wrong gates`);

state = createDefaultState();
const openSteps = () => visibleAt('spire', midnightClock).filter((id) => id.startsWith('belfry-night-'));
check('a fresh chronicle opens on step one',
  openSteps().join(',') === belfry[0].id, openSteps().join(',') || 'nothing open');

// Walk the run. Each step is recorded the way the game records it, so this is the
// same data the unlock logic reads at the player's next visit.
let walked = 0;
for (let index = 0; index < belfry.length; index += 1) {
  const open = openSteps();
  if (open.length !== 1 || open[0] !== belfry[index].id) {
    check(`run reaches step ${index + 1}`, false, `expected ${belfry[index].id}, saw ${open.join(',') || 'nothing'}`);
    break;
  }
  recordEventCompletion(findActionById(belfry[index].id), 'Success');
  walked += 1;
}
check('the whole run can be walked one step at a time', walked === belfry.length, `stopped at ${walked}`);
check('finishing the run opens it again from the top', openSteps().join(',') === belfry[0].id, openSteps().join(',') || 'nothing open');

// Closing the game halfway is the same thing as walking four steps and stopping,
// which is exactly what the four records above are.
state = createDefaultState();
for (let index = 0; index < 4; index += 1) {
  recordEventCompletion(findActionById(belfry[index].id), 'Success');
}
check('a half-finished run resumes at the step it stopped on',
  openSteps().join(',') === belfry[4].id, openSteps().join(',') || 'nothing open');

const finale = belfry[belfry.length - 1];
check('the last step pays experience', Object.keys(finale.success.stats || {}).length >= 2, 'no experience');
check('the last step pays materials', (finale.success.items || []).length >= 1, 'no materials');
check('the material it pays is a real catalogue material',
  (finale.success.items || []).every((id) => findEquipmentItem(id)?.material === true), 'it pays something that is not a material');

// ---------------------------------------------------------------------------
log('');
log('=== Q) The night stories pay the body that ran them, and nobody else ===');
// A story that happens inside someone's realm normally also earns that realm's
// standing, because the work really was done on their ground. These three are
// different: they are run by a body that happens to be inside the zone and is not
// its power, so they pay exactly one account. Helping the Ledger must not put the
// Council a step closer, and helping the Iron Sister must not be a gift to the
// Combine that watches her.
const nightStories = [
  ['ledger-carry-the-refusal', 'grand-canal', 'black-ledger'],
  ['rats-run-the-word-along-the-rope', 'grand-canal', 'salt-rats'],
  ['sister-take-the-cold-door-shift', 'leviathan-trench', 'iron-sister']
];
const realRandom = Math.random;
Math.random = () => 0;
nightStories.forEach(([actionId, locationId, paid]) => {
  const action = findActionById(actionId);
  check(`${actionId} happens only at night`, action.when === 'night', 'it happens by day');
  check(`${actionId} can be done again`, action.repeatable === true, 'it is a one-off');
  check(`${actionId} names the body it pays`, action.success.standing?.faction === paid, 'no standing declared');
  check(`${actionId} asks to pay that body only`, action.success.standing?.exclusive === true, 'the realm is paid too');

  state = createDefaultState();
  state.player.vigor = VIGOR_MAX;
  state.player.reputation = {};
  state.currentLocationId = locationId;
  resolveAction(actionId);
  closeResolution();

  check(`${paid} was paid`, getFactionXp(paid) > 0, `xp ${getFactionXp(paid)}`);
  const realmFaction = factionForRealm(locationRealmOf(locationId));
  check(`the power that holds ${locationId} was left out of it`,
    getFactionXp(realmFaction.id) === 0, `${realmFaction.id} got ${getFactionXp(realmFaction.id)}`);
});
Math.random = realRandom;

// ---------------------------------------------------------------------------
log('');
log('=== R) The night content never writes in a power\'s book ===');
// The rule the new night content follows: the four powers already have ordinary
// work every single day, so none of these encounters may move their standing.
// They pay a guild or a person, or nobody at all.
//
// The preview on the card and the reward on resolution used to be two separate
// calculations, so they could disagree, and they did: the card promised the
// Council of Ten while the game paid the Ledger. They are compared here against
// each other rather than against a hand-written expectation, so the next change
// that splits them again fails the check instead of shipping.
const principalIds = factionList().filter((entry) => entry.principal).map((entry) => entry.id);
const nightContent = [
  ...belfry.map((action, index) => [action.id, 'spire', index, null]),
  ['ledger-carry-the-refusal', 'grand-canal', null, 'black-ledger'],
  ['rats-run-the-word-along-the-rope', 'grand-canal', null, 'salt-rats'],
  ['sister-take-the-cold-door-shift', 'leviathan-trench', null, 'iron-sister']
];
Math.random = () => 0;

nightContent.forEach(([actionId, locationId, runIndex, payer]) => {
  const action = findActionById(actionId);
  check(`${actionId} declares who it pays, or that it pays nobody`,
    action.noStanding === true || action.success?.standing?.exclusive === true,
    'it falls through to the realm by default');

  state = createDefaultState();
  state.currentLocationId = locationId;
  state.player.vigor = VIGOR_MAX;
  state.player.reputation = {};
  // A run step is only reachable once the ones before it are done, so the run is
  // opened to the right place rather than forcing the action past its own gate.
  if (runIndex !== null) {
    for (let step = 0; step < runIndex; step += 1) {
      recordEventCompletion(findActionById(belfry[step].id), 'Success');
    }
  }

  const preview = describeActionStanding(action);
  const planned = planStandingGrants(action, locationId);
  check(`${actionId} preview names every body that gets paid`,
    planned.every((entry) => preview.includes(entry.faction.name)),
    `card said "${preview}", plan pays ${planned.map((entry) => entry.faction.name).join(', ') || 'nobody'}`);
  check(`${actionId} preview promises no power`,
    !principalIds.some((id) => preview.includes(factions[id].name)),
    `card said "${preview}"`);

  resolveAction(actionId);
  closeResolution();
  const paidNow = Object.keys(state.player.reputation).filter((id) => getFactionXp(id) > 0);
  check(`${actionId} pays no power in the game either`,
    !paidNow.some((id) => principalIds.includes(id)),
    `${paidNow.join(', ')}`);
  if (payer) {
    check(`${actionId} pays ${payer}`, getFactionXp(payer) > 0, `${getFactionXp(payer)}`);
  } else {
    check(`${actionId} pays nobody standing at all`, paidNow.length === 0, `${paidNow.join(', ')}`);
  }
});
Math.random = realRandom;

// ---------------------------------------------------------------------------
log('');
log('=== S) The day bodies keep the same rule, and the rivalry bites ===');
// The same two rules as the night, applied to the four bodies that are awake:
// a daytime story pays exactly the body it names, and it pays no power of the zone
// it happens in.
//
// The one genuinely new thing is the clergy and the Court being in rivalry. This
// is the first pair in the catalogue where the player has to pick a side, so it
// is checked from both ends: climbing one must cost the other, and a body that is
// in no rivalry must cost nobody.
const dayStories = [
  ['clergy-carry-the-bell-book', 'spire', 'clergy'],
  ['monarchs-stand-in-the-long-room', 'grand-canal', 'bohemian-court'],
  ['duellist-be-put-on-the-card', 'grand-canal', 'widow-duellist'],
  ['guard-take-a-reading-in-the-current', 'leviathan-trench', 'imperial-guard']
];
Math.random = () => 0;

dayStories.forEach(([actionId, locationId, payer]) => {
  const action = findActionById(actionId);
  check(`${actionId} happens only by day`, action.when === 'day', 'it happens at night');
  check(`${actionId} can be done again`, action.repeatable === true, 'it is a one-off');
  check(`${actionId} pays only the body it names`, action.success.standing?.exclusive === true, 'the realm is paid too');

  state = createDefaultState();
  state.currentLocationId = locationId;
  state.player.vigor = VIGOR_MAX;
  state.player.reputation = {};
  resolveAction(actionId);
  closeResolution();
  check(`${payer} was paid`, getFactionXp(payer) > 0, `xp ${getFactionXp(payer)}`);
  const realmFaction = factionForRealm(locationRealmOf(locationId));
  check(`the power that holds ${locationId} was left out of it`,
    getFactionXp(realmFaction.id) === 0, `${realmFaction.id} got ${getFactionXp(realmFaction.id)}`);
});
Math.random = realRandom;

// Climb one side of the pair and the other must come down. The ratio is the
// game's own damping, so it is read from the rule rather than hardcoded here.
const clergySide = planStandingGrants(findActionById('clergy-carry-the-bell-book'), 'spire');
check('the clergy story plans a payment', clergySide.length === 1, `${clergySide.length}`);
const clergyPlan = clergySide[0];
check('the clergy plan penalises the Court', clergyPlan.rival?.id === 'bohemian-court', `rival is ${clergyPlan.rival?.id}`);
check('the Court is the clergy rival and the reverse is true too', factions['bohemian-court'].rival === 'clergy');

state = createDefaultState();
state.currentLocationId = 'spire';
state.player.vigor = VIGOR_MAX;
state.player.reputation = {};
Math.random = () => 0;
resolveAction('clergy-carry-the-bell-book');
closeResolution();
check('climbing the clergy moves the Court down', getFactionXp('bohemian-court') < 0, `court ${getFactionXp('bohemian-court')}`);

// And the opposite direction, so the pair cannot be one-way.
state = createDefaultState();
state.currentLocationId = 'grand-canal';
state.player.vigor = VIGOR_MAX;
state.player.reputation = {};
resolveAction('monarchs-stand-in-the-long-room');
closeResolution();
check('climbing the Court moves the clergy down', getFactionXp('clergy') < 0, `clergy ${getFactionXp('clergy')}`);
Math.random = realRandom;

// The Guard answers to a bit of everyone, which in this game means it is in no
// rivalry: standing with the Court must not cost it anything.
state = createDefaultState();
state.currentLocationId = 'grand-canal';
state.player.vigor = VIGOR_MAX;
state.player.reputation = {};
Math.random = () => 0;
resolveAction('monarchs-stand-in-the-long-room');
closeResolution();
Math.random = realRandom;
state = createDefaultState();
state.currentLocationId = 'leviathan-trench';
state.player.vigor = VIGOR_MAX;
state.player.reputation = {};
Math.random = () => 0;
resolveAction('guard-take-a-reading-in-the-current');
closeResolution();
Math.random = realRandom;
check('the Guard lost nothing to the Court', getFactionXp('bohemian-court') >= 0, `court ${getFactionXp('bohemian-court')}`);

log('');
log(`story-check: ${failures} FAILURES`);

require('fs').writeFileSync(readOut('story-check.out.txt'), out.join('\n'), 'utf8');
console.log(failures ? `FAILURES: ${failures}` : 'STORY HARNESS OK');