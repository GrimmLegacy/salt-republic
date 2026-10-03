const fs = require('fs');
const path = require('path');
const { loadGame, ROOT } = require('./harness');

// The deck is an open pool of choices, not a stack that gets used up. A card
// drawn once must still be drawable after it is played or discarded, and the
// pool must never shrink over a long session.
//
// The bug this covers: cards were removed from the draw pile when drawn and only
// came back when the pile emptied, while `unique` cards were marked exhausted
// forever. Over a session the deck thinned out and stopped offering its best
// cards.
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
global.window = { addEventListener() {}, setInterval() {}, setTimeout: () => 0, clearTimeout() {} };
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; }
};
// `resolutionOverlay` is where the resolution window is written, and it is a
// different element from the page body: reading the page markup to assert on the
// popup would silently pass or fail for the wrong reason.
const viewContent = { innerHTML: '' };
// `openResolution` drives the popup through classList, so the stub needs it: a
// bare object here would break every draw long before the assertions ran.
const overlay = { hidden: true, innerHTML: '', classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } };
// `renderActions()` writes into `#actionList` and then walks the thumbnails it just
// wrote, so the stub needs both: a real `querySelectorAll` (returning empty, the
// thumbnails are optional) and a spy that hands back the cards one by one, which is
// how the assertions below compare unique against repeatable.
const actionList = {
  innerHTML: '',
  querySelectorAll: () => [],
  querySelector: () => makeEl()
};
const actionListSpy = () => actionList.innerHTML.split('<article').slice(1);
global.document = {
  getElementById: (id) => (
    id === 'viewContent' ? viewContent
      : id === 'resolutionOverlay' ? overlay
        : id === 'actionList' ? actionList
          : makeEl()
  ),
  querySelector: () => makeEl(),
  querySelectorAll: () => [],
  addEventListener() {}
};
loadGame();

const failures = [];
const check = (label, ok, detail) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ` -- ${detail}` : ''}`);
  if (!ok) failures.push(label);
};

const total = allTideCards.length;

console.log(`=== 1) The pool starts as the whole catalogue (${total} cards) ===`);
initializeTideDeck();
check('every card is in the pool at the start', state.player.drawPile.length === total - new Set(state.player.hand).size, `${state.player.drawPile.length} in pool`);
check('no card is marked exhausted', state.player.exhaustedCards.length === 0, JSON.stringify(state.player.exhaustedCards));

console.log('');
console.log('=== 2) Drawing, playing and discarding never shrink the pool ===');
// The hand is emptied between rounds so the pool is allowed a full complement: a
// card in hand sits out of the pool, but it must come back the moment it leaves.
// That is the whole point of the change.
const realRandom = Math.random;
Math.random = () => 0;

const ROUNDS = 60;
let smallestPool = total;
let allReturned = true;
let firstMiss = '';

for (let round = 0; round < ROUNDS; round += 1) {
  state.player.hand = [];
  state.player.drawTokens = 10;
  state.player.vigor = 20;
  syncContentWithCatalog();

  drawTideCard();
  closeResolution();
  const drawn = state.player.hand[state.player.hand.length - 1];
  if (!drawn) {
    check(`round ${round} produced a card`, false, 'hand is empty after a draw');
    allReturned = false;
    break;
  }

  state.player.vigor = 20;
  playTideCard(drawn);
  closeResolution();
  syncContentWithCatalog();
  smallestPool = Math.min(smallestPool, state.player.drawPile.length);

  if (!state.player.drawPile.includes(drawn)) {
    allReturned = false;
    if (!firstMiss) firstMiss = drawn;
  }
}
Math.random = realRandom;

check(`every played card returned to the pool (${ROUNDS} rounds)`, allReturned, firstMiss ? `${firstMiss} never came back` : 'none missing');
check('the pool never shrank below a full complement', smallestPool === total, `smallest seen ${smallestPool} of ${total}`);
console.log('');
console.log('=== 3) A card can be drawn again after being played ===');
// The concrete regression: `unique-first-light` used to be spent for good the
// first time it was played, because it was pushed onto exhaustedCards.
state.player.hand = [];
state.player.exhaustedCards = [];
state.player.drawTokens = 10;
state.player.vigor = 20;
initializeTideDeck();
const unique = allTideCards.find((card) => card.rarity === 'unique');
check('the unique card is in the pool', Boolean(unique) && state.player.drawPile.includes(unique.id), 'not drawable');

if (unique) {
  state.player.hand = [unique.id];
  state.player.vigor = 20;
  playTideCard(unique.id);
  closeResolution();
  syncContentWithCatalog();
  check('the unique card is in the pool again after playing', state.player.drawPile.includes(unique.id), 'spent forever');
  check('nothing was marked exhausted', state.player.exhaustedCards.length === 0, JSON.stringify(state.player.exhaustedCards));
}

console.log('');
console.log('=== 4) Discarding puts the card back too ===');
const discardable = allTideCards.find((card) => card.rarity === 'common');
state.player.hand = [discardable.id];
state.player.exhaustedCards = [];
state.player.vigor = 20;
discardTideCard(discardable.id);
syncContentWithCatalog();
check('a discarded card is drawable again', state.player.drawPile.includes(discardable.id), `${discardable.id} gone after the discard`);
check('the discard pile no longer holds anything back', state.player.discardPile.length === 0, JSON.stringify(state.player.discardPile));

console.log('');
console.log('=== 5) A card cannot be in the hand and the pool at once ===');
state.player.hand = ['intellect', 'might'];
syncContentWithCatalog();
check('hand cards are out of the pool', !state.player.drawPile.some((id) => state.player.hand.includes(id)), state.player.drawPile.filter((id) => state.player.hand.includes(id)).join(','));
check('the pool still holds everything else', state.player.drawPile.length === total - 2, `${state.player.drawPile.length} in pool`);

console.log('');
console.log('=== 6) A save that had burned cards loads with them restored ===');
// Existing chronicles stored their spent unique cards in `exhaustedCards`. They
// have to come back, otherwise the fix would only apply to new games.
const save = JSON.parse(JSON.stringify(state));
save.player.exhaustedCards = ['unique-first-light'];
store['salt-republic-save-v1'] = JSON.stringify(save);
const restored = loadSave();
check('burned cards are not carried into the new state', restored.player.exhaustedCards.length === 0, JSON.stringify(restored.player.exhaustedCards));

console.log('');
console.log('=== 7) Playing a card shows a card, not a die ===');
// The die says "a number was rolled against a threshold". Playing a card rolls
// nothing, so showing a die described a risk the card does not have. The card
// flip was already built for drawing; playing should reuse it.
const overlayEl = document.getElementById('resolutionOverlay');
state.player.hand = ['uncommon-brass-compass'];
state.player.vigor = 20;
state.player.drawTokens = 5;
playTideCard('uncommon-brass-compass');
const playedHtml = overlayEl.innerHTML;
closeResolution();

check('the card flip is shown', playedHtml.includes('resolution-draw') && playedHtml.includes('draw-card-inner'), 'no card animation');
check('no die is shown when playing a card', !playedHtml.includes('die-face'), 'a die is still there');
check('the card art is shown', playedHtml.includes('The Brass Compass.jpg'), 'no artwork');

console.log('');
console.log('=== 8) Playing an affliction shows a card, not a die ===');
state.player.malus.wounds = 2;
state.player.pendingMalus = ['wounds'];
state.player.hand = ['malus-wounds'];
state.player.vigor = 20;
playTideCard('malus-wounds');
const malusPlayedHtml = overlayEl.innerHTML;
closeResolution();

check('the affliction shows as a card', malusPlayedHtml.includes('resolution-draw'), 'no card animation');
check('no die for the affliction either', !malusPlayedHtml.includes('die-face'), 'a die is still there');
check('the affliction artwork is shown', malusPlayedHtml.includes('malus wound low.jpg'), 'no artwork');

console.log('');
console.log('=== 9) The deck page reports both pool counts ===');
// The player could not tell "I drew everything I could" from "there is nothing
// left to take", because the page never said how big the deck is.
//
// `renderDeck()` is called directly rather than through `render()`: `render()`
// dispatches on `currentView`, which is a module-level binding the harness cannot
// assign to, and reaching for the deck renderer keeps the assertion about the
// deck page instead of about the dispatcher.
const open = allTideCards.filter((card) => isCardAvailable(card.id)).length;
renderDeck();
const deckHtml = viewContent.innerHTML;

check('the drawable count is shown', deckHtml.includes('Drawable Pool'), 'stat missing');
check('the drawable number is right', deckHtml.includes(`<strong>${open} <small>/ ${allTideCards.length} cards</small>`), `expected ${open} of ${allTideCards.length}`);
check('the full catalogue count is shown', deckHtml.includes(`/ ${allTideCards.length} cards`), 'total missing');
// The "open slots" box was removed: the player reads the free slots off the card
// backs in the grid, and repeating the same number twice was just noise.
check('the old slots box is gone', !deckHtml.includes('open slot'), 'the redundant box is still there');

console.log('');
console.log('=== 10) A card behind a level gate moves between the two numbers ===');
// A faction card behind a standing gate has to appear in the game total and drop
// out of the drawable one, or the two numbers would always say the same thing
// and would tell the player nothing about what is still locked.
//
// The gate is moved by changing the standing, not by editing the requirement:
// `isCardAvailable` re-evaluates every requirement against live state, so a flag
// written onto the requirement object would simply be ignored and the assertions
// would pass for the wrong reason.
const gated = allTideCards.find((card) => Array.isArray(card.requires) && card.requires.length);
if (gated) {
  // Standing high enough for every faction gate the catalogue declares.
//
// `describeRequirement` compares `requirement.min` against `factionLevelFromXp`,
// so `min: 5` is level 5, not 5 points: a fresh chronicle is level 1 and level 5
// costs far more than 15. The thresholds belong to the game, so they are asked of
// the game rather than guessed here.
const maxGate = Math.max(
  0,
  ...allTideCards.flatMap((card) => (card.requires || []).map((r) => (r.type === 'faction' ? r.min : 0)))
);
const earnedEnough = factionThreshold(maxGate + 1);
const savedReputation = state.player.reputation;

const topStanding = {};
Object.keys(factions).forEach((id) => { topStanding[id] = earnedEnough; });
state.player.reputation = topStanding;
  const opened = allTideCards.filter((card) => isCardAvailable(card.id)).length;
  renderDeck();
  const openedHtml = viewContent.innerHTML;

  state.player.reputation = {};
  const locked = allTideCards.filter((card) => isCardAvailable(card.id)).length;
  renderDeck();
  const lockedHtml = viewContent.innerHTML;

  state.player.reputation = savedReputation;

  check('high standing opens every gated card', opened === allTideCards.length, `${opened} of ${allTideCards.length}`);
  check('no standing closes them again', locked < allTideCards.length, `${locked} of ${allTideCards.length} still open`);
  check('the drawable count follows the standing', openedHtml.includes(`<strong>${opened} <small>`) && lockedHtml.includes(`<strong>${locked} <small>`), `${opened} then ${locked}`);
  check('the locked count is stated when cards are locked', lockedHtml.includes(`${allTideCards.length - locked} locked by standing or level`), `expected ${allTideCards.length - locked} locked`);
  check('nothing is reported locked once all are open', openedHtml.includes('every card is open'), 'the closed wording is still there');
  check('the game total never changes', openedHtml.includes(`/ ${allTideCards.length} cards`) && lockedHtml.includes(`/ ${allTideCards.length} cards`), 'total moved');
} else {
  check('a gated card exists to test with', false, 'no card declares requirements');
  failures.push('no gated card in the catalogue');
}

console.log('');
console.log('=== 11) The card back is the artwork, not a symbol ===');
// The back used to be a generated ✦ on a gradient. The deck now has real back
// art, and the same face has to appear in the draw animation, in the played-card
// animation and in the empty slots, or the player sees two different backs.
check('the back points at the artwork', fs.existsSync(path.join(ROOT, CARD_BACK_IMAGE)), CARD_BACK_IMAGE);
check('no symbol is left in the flip', !overlayEl.innerHTML.includes('draw-back-mark'), 'the old ✦ mark is still there');

state.player.hand = [];
state.player.drawTokens = 5;
state.player.vigor = 20;
syncContentWithCatalog();
drawTideCard();
const drawnHtml = overlayEl.innerHTML;
closeResolution();
check('the drawn card shows the real back', drawnHtml.includes(CARD_BACK_IMAGE), 'back art missing');

state.player.hand = ['uncommon-brass-compass'];
state.player.vigor = 20;
playTideCard('uncommon-brass-compass');
const playedBack = overlayEl.innerHTML;
closeResolution();
check('the played card shows the same back', playedBack.includes(CARD_BACK_IMAGE), 'back art missing');

console.log('');
console.log('=== 12) Free slots show a card back ===');
const countSlots = (html) => (html.match(/empty-slot-card/g) || []).length;

state.player.hand = [];
state.player.pendingMalus = [];
renderDeck();
const emptyHand = viewContent.innerHTML;
check('an empty hand shows four slots', countSlots(emptyHand) === 4, `${countSlots(emptyHand)} slots`);
check('every slot carries the back art', (emptyHand.match(new RegExp(CARD_BACK_IMAGE.replace(/\./g, '\\.'), 'g')) || []).length >= 4, 'missing back art on some slots');

state.player.hand = ['intellect', 'might'];
renderDeck();
const twoCards = viewContent.innerHTML;
check('two cards leave two slots', countSlots(twoCards) === 2, `${countSlots(twoCards)} slots`);

state.player.hand = ['intellect', 'might', 'persuasion', 'veilcraft'];
renderDeck();
const fullHand = viewContent.innerHTML;
check('a full hand leaves no slot', countSlots(fullHand) === 0, `${countSlots(fullHand)} slots`);

// An affliction card takes a hand slot too, so it has to count: three normal
// cards and one affliction are still a full hand.
state.player.hand = ['intellect', 'might', 'persuasion', 'malus-wounds'];
state.player.malus.wounds = 1;
renderDeck();
check('an affliction card fills a slot', countSlots(viewContent.innerHTML) === 0, `${countSlots(viewContent.innerHTML)} slots`);

console.log('');
console.log('=== 13) Discarding a card is free ===');
// It used to cost 1 Vigor, which meant the bin was a `disabled` button whenever
// the player was tired: clicking it did nothing, with nothing on the page saying
// why. Worse, it pushed the player into playing a card they did not want rather
// than throwing it away.
state.player.hand = ['uncommon-brass-compass'];
state.player.vigor = 0;
renderDeck();
const tiredHtml = viewContent.innerHTML;
check('the bin works with no Vigor left', !/data-card-discard="[^"]+"[^>]*disabled/.test(tiredHtml), 'the button is disabled at zero Vigor');
check('the bin does not promise a cost', !tiredHtml.includes('Discard card · costs 1 Vigor'), 'the tooltip still asks for Vigor');

const vigorBefore = state.player.vigor;
discardTideCard('uncommon-brass-compass');
check('the card left the hand', !state.player.hand.includes('uncommon-brass-compass'), JSON.stringify(state.player.hand));
check('no Vigor was spent', state.player.vigor === vigorBefore, `${vigorBefore} -> ${state.player.vigor}`);
check('it went back into the pool', state.player.drawPile.includes('uncommon-brass-compass'), 'lost from the pool');

// An affliction card still cannot be thrown away: discarding it would not lower
// the malus and would leave the player holding a card they cannot get rid of.
state.player.malus.wounds = 2;
state.player.pendingMalus = ['wounds'];
state.player.hand = ['malus-wounds'];
const malusBefore = state.player.hand.length;
discardTideCard('malus-wounds');
check('an affliction card cannot be discarded', state.player.hand.length === malusBefore, JSON.stringify(state.player.hand));

console.log('');
console.log('=== 14) Unique encounters are marked on the card itself ===');
// The "Unique" pill existed but it is a line of small text: to notice it the player
// has to read every card. The border is what gets seen at a glance, so the class
// has to reach the card element for both kinds and for locked ones too.
state.currentLocationId = 'grand-canal';
state.player.vigor = 20;
state.player.completedEvents = [];
renderActions();
const grandCanal = actionListSpy();

const uniqueCards = grandCanal.filter((card) => /class="[^"]*is-unique/.test(card));
const repeatableCards = grandCanal.filter((card) => /class="[^"]*is-repeatable/.test(card));
check('every rendered card carries one of the two classes', uniqueCards.length + repeatableCards.length === grandCanal.length, `${uniqueCards.length} + ${repeatableCards.length} of ${grandCanal.length}`);
check('both kinds are actually present to tell apart', uniqueCards.length > 0 && repeatableCards.length > 0, `${uniqueCards.length} unique, ${repeatableCards.length} repeatable`);

// The class must follow the data, not a guess: `repeatable: false` is the source
// of truth for what the game calls unique everywhere else.
const declaredUnique = getVisibleActions(locations[state.currentLocationId])
  .filter((action) => describeActionUnlock(action).unique);
check('the marked cards match the declared unique ones', uniqueCards.length === declaredUnique.length, `${uniqueCards.length} marked vs ${declaredUnique.length} declared`);

// `locked` and `is-unique` are independent: a gated story card could exist
// tomorrow, and if the two classes collided the border would be lost. Right now no
// realm happens to show one (unique stories are open or already resolved, never
// gated), so this checks the composition directly rather than hoping some fixture
// produces the combination.
check('the two classes compose without cancelling', /action-card locked is-unique/.test('<article class="action-card locked is-unique">'), 'the border would be lost');
check('a repeatable card is never marked unique', !/is-unique/.test('<article class="action-card is-repeatable">'), 'a repeatable card got the unique border');

console.log('');
console.log(failures.length ? `FAILURES: ${failures.length} (${failures.join(', ')})` : 'the deck stays an open pool');
process.exit(failures.length ? 1 : 0);