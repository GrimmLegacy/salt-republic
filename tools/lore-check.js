// Structural check for lore.js. Loads the file on its own, with stubbed app.js
// globals, and verifies the lore data is internally consistent. No DOM needed,
// so it can run before the game boots.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const out = [];
let failures = 0;
const check = (label, condition, detail = '') => {
  if (!condition) failures += 1;
  out.push(`${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? ' :: ' + detail : ''}`);
};

const src = fs.readFileSync(path.join(__dirname, '..', 'lore.js'), 'utf8');

const player = {
  flags: {},
  properties: [],
  completedEvents: [],
  equipment: {},
  visitedLocations: [],
  lore: null
};

const sandbox = {
  state: { player },
  locations: {
    spire: { realm: 'Aether Heights' },
    'grand-canal': { realm: 'Lagoon Heart' },
    'leviathan-trench': { realm: 'Abyssal Depth' },
    'astronavigators-salon': { realm: 'Astral Terminus' }
  },
  statNames: {
    vigilance: 'Vigilance', cunning: 'Cunning', audacity: 'Audacity',
    elegance: 'Elegance', persuasion: 'Persuasion', resolve: 'Resolve'
  },
  malusNames: {},
  resourceNames: {},
  hasSucceeded: () => false,
  getEventRecord: () => null,
  getEffectiveStat: () => 0,
  findActionById: (id) => ({ id, title: id }),
  // `evaluateLoreGate` chiama `findEquipmentItem` solo sui gate di tipo `item`, ma
  // la sandbox deve conoscerlo comunque: senza, un id di un pezzo non si risolve e
  // la voce che lo usa resterebbe chiusa per sempre senza dire perchè.
  findEquipmentItem: (id) => ({ id, name: id, slot: 'trinket' }),
  addLog: () => {},
  console
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

const finish = (extra = '') => {
  if (extra) out.push('', extra);
  out.push('');
  out.push(failures ? `${failures} CHECK(S) FAILED` : 'ALL CHECKS PASSED');
  fs.writeFileSync(path.join(__dirname, 'out', 'lore-check.out.txt'), out.join('\n'), 'utf8');
  console.log(failures ? `LORE CHECK FAILURES: ${failures}` : 'LORE CHECK OK');
  process.exit(failures ? 1 : 0);
};

const context = vm.createContext(sandbox);

try {
  vm.runInContext(src, context, { filename: 'lore.js' });
} catch (error) {
  out.push(`FAIL  lore.js throws when loaded :: ${error.message}`);
  failures += 1;
  finish();
}

// In a vm context, top-level const/let live in the script's lexical scope and do
// NOT become properties of the sandbox object, so they have to be read back with
// runInContext. (In a browser they share one global lexical scope across classic
// scripts, which is why index.html can simply load lore.js before app.js.)
const api = vm.runInContext(
  '({ loreEntries, loreFlags, loreFactions, loreKinds, evaluateLoreGates, evaluateLoreRequires, getLoreTally, getLoreState, getLoreProgress, discoverLore, getFactionStanding, sanitizeLore, sanitizeFlags, sanitizeVisited })',
  context
);
const { loreEntries, loreFlags, loreFactions, loreKinds } = api;
// Shorthands so the assertions below read cleanly.
const evaluateLoreGates = api.evaluateLoreGates;
const evaluateLoreRequires = api.evaluateLoreRequires;
const getLoreTally = api.getLoreTally;
const getLoreState = api.getLoreState;
const getLoreProgress = api.getLoreProgress;
const discoverLore = api.discoverLore;
const getFactionStanding = api.getFactionStanding;

check('lore.js loads standalone', Array.isArray(loreEntries));
check('loreEntries is not empty', loreEntries.length > 0, `${loreEntries.length} entries`);
check('loreFlags declared', Boolean(loreFlags), `${Object.keys(loreFlags || {}).length} flags`);
check('loreFactions declared', Boolean(loreFactions), `${Object.keys(loreFactions || {}).length} factions`);
check('loreKinds declared', Boolean(loreKinds));

// Real encounter ids, read out of app.js, so a gate can never name an event
// that was renamed or removed.
const appSrc = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const actionIds = new Set([...appSrc.matchAll(/^\s{8}id: '([a-z0-9-]+)',$/gm)].map((m) => m[1]));

const kinds = new Set(Object.keys(loreKinds || {}));
const flagKeys = new Set(Object.keys(loreFlags || {}));
const ids = loreEntries.map((e) => e.id);

check('entry ids are unique', new Set(ids).size === ids.length, `${ids.length} entries`);
check('all four kinds are used', ['place', 'person', 'faction', 'event'].every((k) => loreEntries.some((e) => e.kind === k)),
  [...new Set(loreEntries.map((e) => e.kind))].join(', '));

const badKind = [];
const badGate = [];
const badChapter = [];
const thinText = [];
const noUnlocks = [];

loreEntries.forEach((entry) => {
  if (!kinds.has(entry.kind)) badKind.push(`${entry.id} has kind "${entry.kind}"`);
  if (!entry.title || !entry.teaser) badKind.push(`${entry.id} missing title or teaser`);
  if (!Array.isArray(entry.unlocks) || !entry.unlocks.length) noUnlocks.push(entry.id);
  if (!Array.isArray(entry.chapters) || !entry.chapters.length) badChapter.push(`${entry.id} has no chapters`);

  const gates = [...(entry.unlocks || []), ...(entry.chapters || []).flatMap((c) => c.requires || [])];
  gates.forEach((gate) => {
    if (!gate || !gate.type) { badGate.push(`${entry.id} gate has no type`); return; }
    if (gate.type === 'flag' && !flagKeys.has(gate.id)) badGate.push(`${entry.id} -> unknown flag "${gate.id}"`);
    if (gate.type === 'event' && !actionIds.has(gate.id)) badGate.push(`${entry.id} -> unknown event "${gate.id}"`);
  });

  (entry.chapters || []).forEach((chapter) => {
    if (!chapter.id || !chapter.title || !chapter.text) badChapter.push(`${entry.id} has an incomplete chapter`);
    else if (chapter.text.length < 60) thinText.push(`${entry.id}/${chapter.id}`);
  });
});

check('every entry uses a known kind', badKind.length === 0, badKind.join('; '));
check('every entry declares unlocks', noUnlocks.length === 0, noUnlocks.join(', '));
check('every gate resolves', badGate.length === 0, badGate.join('; '));
check('every chapter is complete', badChapter.length === 0, badChapter.join('; '));
check('every chapter carries real prose', thinText.length === 0, thinText.join(', '));

// --- progressive discovery really is progressive -------------------------
// On a fresh save only the "always" entries may open, and nothing hidden may
// leak. That is the guarantee the whole feature rests on.
const openedAtStart = loreEntries.filter((e) => sandbox.evaluateLoreGates(e.unlocks)).map((e) => e.id);
check('a fresh chronicle reveals only the always-open entries',
  openedAtStart.length > 0 && openedAtStart.length < loreEntries.length,
  `${openedAtStart.length}/${loreEntries.length} open`);
check('the Doge stays hidden at the start', !openedAtStart.includes('person-doge'));
check('the Chief Scribe stays hidden at the start', !openedAtStart.includes('person-scribe'));

// Walking the opening chain should unlock the Doge.
Object.assign(player.flags, {
  ledgerTrusted: true,
  cargoCarried: true,
  pansLeased: true,
  brineFarmSigned: true
});
const openedAfterChain = loreEntries.filter((e) => sandbox.evaluateLoreGates(e.unlocks)).map((e) => e.id);
check('finishing the opening chain reveals the Doge', openedAfterChain.includes('person-doge'),
  `${openedAfterChain.length}/${loreEntries.length} open`);
check('the Astral conductors stay hidden until the timetable', !openedAfterChain.includes('person-conductors'));

player.flags.railTimetable = true;
check('reading the timetable reveals the conductors',
  loreEntries.filter((e) => sandbox.evaluateLoreGates(e.unlocks)).some((e) => e.id === 'person-conductors'));

// Chapters must stay shut until their own gate opens, not just their entry.
const spire = loreEntries.find((e) => e.id === 'place-spire');
const drifting = spire.chapters.find((c) => c.id === 'drifting');
const beforeFlag = sandbox.evaluateLoreRequires(drifting.requires);
player.flags.railTimetable = false;
check('a deep chapter stays shut while its flag is unset', !sandbox.evaluateLoreRequires(drifting.requires),
  `before=${beforeFlag} after=${sandbox.evaluateLoreRequires(drifting.requires)}`);

// --- discovery bookkeeping ----------------------------------------------
const revealedBefore = sandbox.getLoreTally().revealed;
sandbox.discoverLore('place-spire', 'test');
check('discovering an entry raises the tally', sandbox.getLoreTally().revealed === revealedBefore + 1);
check('discovering the same entry twice is a no-op', sandbox.discoverLore('place-spire', 'test') === false);
check('a discovered entry records why', Boolean(sandbox.getLoreState().entries['place-spire'].reason));
check('progress reports per-entry counts', sandbox.getLoreProgress(spire).total === spire.chapters.length);

// --- faction standing derives from flags ---------------------------------
check('standing starts unknown', sandbox.getFactionStanding('council') === 'unknown');
player.flags.councilRecords = true;
check('holding Council records makes you an ally', sandbox.getFactionStanding('council') === 'ally');
player.flags.checkpointBetrayal = true;
check('betraying the checkpoint turns it contested', sandbox.getFactionStanding('council') === 'contested');
check('the Scholarium reads as an ally from carried cargo', sandbox.getFactionStanding('scholarium') === 'ally');
player.flags.scholariumDebt = true;
check('a Scholarium debt flips them to contested', sandbox.getFactionStanding('scholarium') === 'contested');

// --- hostile saves are rejected ------------------------------------------
const clean = sandbox.sanitizeLore({
  entries: { 'place-spire': { at: '10:00' }, 'ghost-entry': { at: '11:00' } },
  chapters: { 'place-spire:moved': {}, 'place-spire:nope': {} }
});
check('unknown lore entries are dropped', !('ghost-entry' in clean.entries));
check('unknown lore chapters are dropped', !('place-spire:nope' in clean.chapters));
check('real lore survives sanitising', 'place-spire' in clean.entries && 'place-spire:moved' in clean.chapters);
check('garbage lore sanitises to empty', Object.keys(sandbox.sanitizeLore(null).entries).length === 0);
check('unknown flags are dropped', !('notATrueFlag' in sandbox.sanitizeFlags({ notATrueFlag: 1, treatyRead: 1 })));
check('known flags survive sanitising', 'treatyRead' in sandbox.sanitizeFlags({ treatyRead: true }));
check('unknown visited locations are dropped', api.sanitizeVisited(['spire', 'atlantis']).join(',') === 'spire');

const totalChapters = loreEntries.reduce((n, e) => n + (e.chapters?.length || 0), 0);
finish(`entries: ${loreEntries.length}  chapters: ${totalChapters}  flags: ${flagKeys.size}  actionIds read from app.js: ${actionIds.size}`);