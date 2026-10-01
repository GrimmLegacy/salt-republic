const fs = require('fs');
const vm = require('vm');
const path = require('path');

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
global.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
global.document = { getElementById: () => makeEl(), querySelector: () => makeEl(), querySelectorAll: () => [] };

const ROOT = 'C:/Users/focas/source/salt-republic';
vm.runInThisContext(fs.readFileSync(`${ROOT}/app.js`, 'utf8'));

const refs = new Set();
Object.values(locations).forEach((l) => {
  refs.add(l.image);
  l.actions.forEach((a) => refs.add(a.image));
});
allTideCards.forEach((c) => refs.add(c.image));
malusCards.forEach((c) => {
  refs.add(`immagini/carte/malus ${c.asset} low.jpg`);
  refs.add(`immagini/carte/malus ${c.asset} high.jpg`);
});
refs.add('immagini/mappa del mondo.jpg');
const calendarMatch = fs.readFileSync(`${ROOT}/styles.css`, 'utf8').match(/url\("([^"]+calendario[^"]*)"\)/);
if (calendarMatch) refs.add(calendarMatch[1]);

const out = [];
let missing = 0;
let caseMismatch = 0;
const nonAscii = [];

refs.forEach((ref) => {
  const parts = ref.split('/');
  let current = ROOT;
  let bad = null;
  parts.forEach((part, index) => {
    if (bad) return;
    const exact = path.join(current, part);
    if (fs.existsSync(exact)) { current = exact; return; }
    let found = null;
    try {
      found = fs.readdirSync(current).find((entry) => entry.toLowerCase() === part.toLowerCase());
    } catch (error) { found = null; }
    if (found) {
      bad = `CASE MISMATCH at "${parts.slice(0, index + 1).join('/')}": disk has "${found}", code asks "${part}"`;
      caseMismatch += 1;
      return;
    }
    bad = `MISSING: ${parts.slice(0, index + 1).join('/')}`;
    missing += 1;
  });
  if (bad) out.push(`${bad}\n    (referenced as: ${ref})`);
  if ([...ref].some((ch) => ch.charCodeAt(0) > 126)) nonAscii.push(ref);
});

out.unshift(`IMAGE REFERENCES CHECKED: ${refs.size}`);
out.push(`MISSING FILES       : ${missing}`);
out.push(`CASE MISMATCHES     : ${caseMismatch}`);
out.push(`NON-ASCII PATHS     : ${nonAscii.length}`);
if (nonAscii.length) out.push(...nonAscii.map((r) => `  ${r}`));
out.push(out.length === 5 ? '' : '');
out.push(out.filter((l) => l.startsWith('MISSING') || l.startsWith('CASE')).join('\n') || 'All referenced images exist on disk with the exact same case.');

// unused images on disk
const onDisk = [];
const walk = (dir, prefix) => {
  fs.readdirSync(dir).forEach((entry) => {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) walk(full, `${prefix}${entry}/`);
    else onDisk.push(`${prefix}${entry}`);
  });
};
walk(`${ROOT}/immagini`, 'immagini/');
out.push('');
out.push(`FILES ON DISK: ${onDisk.size}`);
const unused = [...onDisk].filter((f) => !refs.has(f));
out.push(`NEVER REFERENCED: ${unused.length}`);
if (unused.length) out.push(...unused.map((u) => `  ${u}`));

fs.writeFileSync('tools/out/assets-check.out.txt', out.join('\n'), 'utf8');
console.log('ASSETS CHECK DONE');