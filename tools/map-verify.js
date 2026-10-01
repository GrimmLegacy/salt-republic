const fs = require('fs');
const vm = require('vm');
const app = 'c:/Users/focas/source/salt-republic/app.js';
const css = 'c:/Users/focas/source/salt-republic/styles.css';
const out = [];

const src = fs.readFileSync(app, 'utf8');
const lines = src.split(/\r?\n/);

// 1. Syntax check
try {
  new vm.Script(src, { filename: app });
  out.push('SYNTAX app.js: OK');
} catch (e) {
  out.push('SYNTAX app.js: FAIL ' + e.message);
}

// 2. Structure checks
const fn = (name) => {
  const re = new RegExp('^function ' + name + '\\(', 'm');
  const i = lines.findIndex((l) => re.test(l));
  return i === -1 ? -1 : i + 1;
};
['getMapSites', 'renderMap', 'renderMapPin', 'renderMapSiteCard', 'mountMapInteraction', 'renderTales', 'renderDeck'].forEach((n) => {
  out.push('fn ' + n + ' -> line ' + fn(n));
});

// 3. New map hooks present
['map-viewport', 'map-canvas', 'map-pins', 'data-map-pin', 'data-map-zoom', 'mapView', 'MAP_ZOOM_MAX', 'applyMapTransform', 'showMapReadout'].forEach((token) => {
  const n = (src.match(new RegExp(token.replace(/[.$]/g, '\\$&'), 'g')) || []).length;
  out.push('token ' + token + ' -> ' + n);
});

// 4. Legacy markup removed from renderMap
out.push('legacy realm-map <img> still used as direct child: ' + /<img class="realm-map"[\s\S]{0,120}?\/div>\s*<div class="realm-grid"/.test(src));

// 5. region data integrity
const regionBlock = src.slice(src.indexOf('const regions = ['), src.indexOf('const locations = {'));
const ids = [...regionBlock.matchAll(/id: '([a-z-]+)'/g)].map((m) => m[1]);
const pts = [...regionBlock.matchAll(/mapPoint: \{ x: ([\d.]+), y: ([\d.]+) \}/g)].map((m) => [Number(m[1]), Number(m[2])]);
const numerals = [...regionBlock.matchAll(/numeral: '([^']+)'/g)].map((m) => m[1]);
out.push('regions: ' + ids.length + ' | points: ' + pts.length + ' | numerals: ' + numerals.join(','));
pts.forEach((p, i) => {
  const ok = p[0] > 0 && p[0] < 100 && p[1] > 0 && p[1] < 100;
  out.push('  point ' + i + ' ' + ids[i] + ' = ' + p[0] + '%,' + p[1] + '% ' + (ok ? 'IN BOUNDS' : 'OUT OF BOUNDS'));
});

// 6. Every region maps to a real location key
const locBlock = src.slice(src.indexOf('const locations = {'), src.indexOf('function createDefaultState'));
regionBlock.split('\n').filter((l) => l.includes('locations: [')).forEach((l) => {
  const key = l.match(/\['([^']+)'\]/)[1];
  const declared = new RegExp("^\\s*'?" + key + "'?:\\s*\\{", 'm').test(locBlock);
  out.push('  locations[' + key + '] declared in locations: ' + declared);
});

// 7. CSS balance + map class presence
const cssSrc = fs.readFileSync(css, 'utf8');
const open = (cssSrc.match(/{/g) || []).length;
const close = (cssSrc.match(/}/g) || []).length;
out.push('CSS braces: ' + open + ' open / ' + close + ' close ' + (open === close ? 'BALANCED' : 'UNBALANCED'));
['.map-viewport', '.map-canvas', '.map-pin', '.map-pin-label', '.map-zoom-button', '.map-readout', '.map-header', '.map-hint'].forEach((sel) => {
  out.push('css ' + sel + ' -> ' + (cssSrc.includes(sel) ? 'present' : 'MISSING'));
});

fs.writeFileSync('tools/out/map-verify.txt', out.join('\n'));
console.log('wrote map-verify.txt');
