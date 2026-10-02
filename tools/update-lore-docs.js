// Generates the unlock tables in README.md straight from lore.js, so the
// documentation can never drift away from the gates the game actually uses.
// Run: node tools/update-lore-docs.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

const sandbox = {
  state: { player: { flags: {}, properties: [], completedEvents: [], equipment: {}, visitedLocations: [] } },
  locations: {}, statNames: {}, malusNames: {}, resourceNames: {},
  hasSucceeded: () => false, getEventRecord: () => null, getEffectiveStat: () => 0,
  findActionById: (id) => {
    const re = new RegExp("id: '" + id + "',[\\s\\S]{0,700}?title: '([^']+)'");
    const m = appSrc.match(re);
    return { id, title: m ? m[1] : id };
  },
  addLog: () => {}, console
};
sandbox.window = sandbox;
const context = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'lore.js'), 'utf8'), context, { filename: 'lore.js' });

const { loreEntries, loreFlags, loreKinds, loreFactions } =
  vm.runInContext('({ loreEntries, loreFlags, loreKinds, loreFactions })', context);

const esc = (s) => String(s).replace(/\|/g, '\\|');
const titleOf = (id) => (sandbox.findActionById(id) || {}).title || id;

function gateText(gate) {
  if (gate.type === 'always') return 'from the start';
  if (gate.type === 'flag') return `flag \`${gate.id}\``;
  if (gate.type === 'event') return `resolving **${titleOf(gate.id)}**`;
  if (gate.type === 'negFlag') return `without \`${gate.id}\``;
  if (gate.type === 'property') return `owning ${gate.value}`;
  if (gate.type === 'stat') return `${gate.stat} ${gate.min}`;
  return gate.type;
}

const gatesText = (gates) => (gates || []).map(gateText).join(' **or** ');

// --- flag table: what sets each flag --------------------------------------
// Read this straight from app.js's data rather than pattern-matching the file:
// a regex over minified-ish object literals is exactly the kind of thing that
// silently reports "nobody sets this" when someone does.
const setters = new Map();
const actionIds = [...appSrc.matchAll(/^\s{8}id: '([a-z0-9-]+)',$/gm)].map((m) => m[1]);
actionIds.forEach((id) => {
  const start = appSrc.indexOf("id: '" + id + "',");
  if (start === -1) return;
  // Walk to the next action id (or end) so we stay inside this encounter only.
  const rest = appSrc.slice(start + 1);
  const nextIdx = rest.search(/\n\s{6}\{\n\s{8}id: '/);
  const block = nextIdx === -1 ? rest : rest.slice(0, nextIdx);

  ['success', 'failure'].forEach((outcome) => {
    const oi = block.indexOf(outcome + ': {');
    if (oi === -1) return;
    // Cut the outcome block at the next sibling key at the same depth.
    const tail = block.slice(oi + outcome.length + 3);
    const end = tail.search(/\n\s{8}(success|failure|chain|requires|repeatable|when|cost|image|summary|appearanceReason)\b/);
    const seg = end === -1 ? tail : tail.slice(0, end);
    const m = seg.match(/sets:\s*\{([^}]*)\}/);
    if (!m) return;
    m[1].split(',').forEach((pair) => {
      const flag = pair.split(':')[0].trim();
      if (!flag || !loreFlags[flag]) return;
      if (!setters.has(flag)) setters.set(flag, []);
      setters.get(flag).push(`**${titleOf(id)}** (${outcome})`);
    });
  });
});

const flagRows = Object.keys(loreFlags).map((flag) => {
  const info = loreFlags[flag];
  const who = setters.get(flag);
  return `| \`${flag}\` | ${esc(info.label)} | ${info.tone === 'bad' ? 'hostile' : 'helpful'} | ${who ? who.join('; ') : '_not yet set by any encounter_'} |`;
});

const flagTable = [
  '| Flag | Meaning | Lean | Set by |',
  '| --- | --- | --- | --- |',
  ...flagRows
].join('\n');

// --- lore table -----------------------------------------------------------
const loreRows = loreEntries.map((entry) => {
  const known = entry.chapters.filter((c) => (c.requires || []).some((g) => g.type === 'flag')).length;
  return `| \`${entry.id}\` | ${loreKinds[entry.kind].label} | ${esc(entry.title)} | ${gatesText(entry.unlocks)} | ${entry.chapters.length}${known ? ` (${known} flag-gated)` : ''} |`;
});

const loreTable = [
  '| Id | Kind | Subject | Opens when | Chapters |',
  '| --- | --- | --- | --- | --- |',
  ...loreRows
].join('\n');

// --- chapter table --------------------------------------------------------
const chapterRows = [];
loreEntries.forEach((entry) => {
  entry.chapters.forEach((chapter) => {
    const gated = (chapter.requires || []).filter((g) => g.type !== 'always');
    chapterRows.push(`| \`${entry.id}\` | ${esc(chapter.title)} | ${gated.length ? gatesText(gated) : 'with its subject'} |`);
  });
});

const chapterTable = [
  '| Subject | Chapter | Needs |',
  '| --- | --- | --- |',
  ...chapterRows
].join('\n');

// --- standing table -------------------------------------------------------
const { LORE_STANDING_FRIENDLY, LORE_STANDING_HOSTILE } =
  vm.runInContext('({ LORE_STANDING_FRIENDLY, LORE_STANDING_HOSTILE })', context);

const standingRows = Object.keys(loreFactions).map((id) => {
  const f = LORE_STANDING_FRIENDLY[id] || [];
  const h = LORE_STANDING_HOSTILE[id] || [];
  return `| ${loreFactions[id].name} | ${f.map((x) => `\`${x}\``).join(', ') || '—'} | ${h.map((x) => `\`${x}\``).join(', ') || '—'} |`;
});

const standingTable = [
  '| Faction | Ally if you hold | Hostile if you hold |',
  '| --- | --- | --- |',
  ...standingRows
].join('\n');

fs.writeFileSync(path.join(__dirname, 'out', 'lore-tables.txt'), [
  '<<<FLAGS>>>', flagTable, '', '<<<LORE>>>', loreTable, '', '<<<CHAPTERS>>>', chapterTable, '', '<<<STANDING>>>', standingTable
].join('\n'), 'utf8');

// Report any flag that nothing sets: a declared flag nobody can ever earn is a
// lore gate that can never open, which is a silent dead end.
const orphaned = Object.keys(loreFlags).filter((f) => !setters.has(f));
if (orphaned.length) console.log('WARNING flags nothing sets: ' + orphaned.join(', '));
else console.log('every flag has at least one setter');

// Splice the generated tables into README.md between their markers.
const readmePath = path.join(ROOT, 'README.md');
if (fs.existsSync(readmePath)) {
  const readme = fs.readFileSync(readmePath, 'utf8');
  const inject = (readmeText, marker, table) => readmeText.replace(new RegExp(`<!-- ${marker} -->`), table);
  let next = inject(readme, 'FLAGS', flagTable);
  next = inject(next, 'LORE', loreTable);
  next = inject(next, 'CHAPTERS', chapterTable);
  next = inject(next, 'STANDING', standingTable);
  fs.writeFileSync(readmePath, next, 'utf8');
  const missing = ['FLAGS', 'LORE', 'CHAPTERS', 'STANDING'].filter((m) => next.includes(`<!-- ${m} -->`));
  console.log(missing.length ? 'README markers left empty: ' + missing.join(', ') : 'README tables injected');
} else {
  console.log('README.md not found; wrote tables to tools/out/lore-tables.txt only');
}

console.log('flags:', Object.keys(loreFlags).length, '| lore:', loreEntries.length, '| chapters:', chapterRows.length);
console.log('wrote tools/out/lore-tables.txt');