const fs = require('fs');
const vm = require('vm');

const out = [];
const log = (...a) => out.push(a.join(' '));
let failures = 0;
function check(label, condition, detail = '') {
  if (!condition) failures += 1;
  log(`${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? ' :: ' + detail : ''}`);
}

// ---- fake DOM ----------------------------------------------------------
const captured = {};
const listeners = {};
function makeEl(id = '') {
  return {
    id,
    dataset: {},
    style: {},
    innerHTML: '',
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    querySelectorAll: () => [],
    querySelector: () => makeEl(),
    getAttribute: () => null,
    setAttribute() {},
    addEventListener(type, fn) {
      listeners[id] = listeners[id] || {};
      listeners[id][type] = listeners[id][type] || [];
      listeners[id][type].push(fn);
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1376, height: 768 })
  };
}
const elements = {};
['viewContent', 'mapViewport', 'mapCanvas', 'mapReadout'].forEach((id) => { elements[id] = makeEl(id); });
Object.defineProperty(elements.viewContent, 'innerHTML', {
  get() { return captured.html || ''; },
  set(v) { captured.html = v; }
});

const store = {};
global.window = { addEventListener() {}, setInterval() {}, innerHeight: 900 };
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); }
};
global.document = {
  getElementById: (id) => elements[id] || makeEl(id),
  querySelector: () => makeEl(),
  querySelectorAll: () => []
};

vm.runInThisContext(fs.readFileSync('c:/Users/focas/source/salt-republic/app.js', 'utf8'));

// ---- A) site table -----------------------------------------------------
log('=== A) getMapSites() integrity ===');
const sites = getMapSites();
check('four sites returned', sites.length === 4, `got ${sites.length}`);
sites.forEach((s) => {
  check(`site ${s.region.id} resolves a location`, Boolean(s.location && s.location.id), s.location ? s.location.id : 'UNDEFINED');
  check(`site ${s.region.id} has a chart label`, Boolean(s.region.chartLabel), s.region.chartLabel || 'MISSING');
  check(`site ${s.region.id} point in bounds`,
    s.region.mapPoint.x > 0 && s.region.mapPoint.x < 100 && s.region.mapPoint.y > 0 && s.region.mapPoint.y < 100,
    `${s.region.mapPoint.x}%,${s.region.mapPoint.y}%`);
});
check('numerals are unique', new Set(sites.map((s) => s.region.numeral)).size === 4, sites.map((s) => s.region.numeral).join(','));

// ---- B) rendered markup ------------------------------------------------
log('');
log('=== B) renderMap() output ===');
state.currentLocationId = 'grand-canal';
renderMap();
const html = captured.html;
check('renders without throwing', typeof html === 'string' && html.length > 0, `${html.length} chars`);
check('has viewport', html.includes('id="mapViewport"'));
check('has canvas', html.includes('id="mapCanvas"'));
check('has pins layer', html.includes('id="mapPins"'));
check('image path intact', html.includes('immagini/mappa del mondo.jpg'));
check('has three zoom controls', (html.match(/data-map-zoom="/g) || []).length === 3);
check('has readout', html.includes('id="mapReadout"'));
check('has hint', html.includes('map-hint'));

const pinMatches = [...html.matchAll(/class="map-pin ([^"]*)"[\s\S]*?style="--pin-x:([\d.]+)%;--pin-y:([\d.]+)%"[\s\S]*?data-map-pin="([^"]+)"[\s\S]*?data-anchor="([^"]+)"[\s\S]*?data-location="([^"]+)"/g)];
check('four pins rendered', pinMatches.length === 4, `got ${pinMatches.length}`);
pinMatches.forEach((m) => {
  check(`pin ${m[4]} anchor valid`, m[5] === 'above' || m[5] === 'below', m[5]);
  check(`pin ${m[4]} pin/location ids agree`, m[4] === m[6], `${m[4]} vs ${m[6]}`);
});
const currentPins = pinMatches.filter((m) => m[1].includes('is-current'));
check('exactly one current pin', currentPins.length === 1, `got ${currentPins.length}`);
check('current pin is grand-canal', currentPins[0] && currentPins[0][4] === 'grand-canal', currentPins[0] ? currentPins[0][4] : 'none');
check('a11y label on every pin', (html.match(/aria-label="[^"]*Enter this realm\."/g) || []).length === 4);
check('site cards removed from below map', !html.includes('realm-entry') && !html.includes('realm-enter') && !html.includes('Stay here'));
check('no Enter realm buttons left', !html.includes('Enter realm'));
check('all four realms still reachable as pins', (html.match(/data-map-pin="/g) || []).length === 4);

// ---- C) coordinates land on the artwork -------------------------------
log('');
log('=== C) beacon coordinates against the 1376x768 artwork ===');
const expected = {
  spire: { x: 692, y: 178, on: 'clockwork belfry' },
  'grand-canal': { x: 665, y: 500, on: 'sunken lagoon' },
  'leviathan-trench': { x: 703, y: 607, on: 'abyssal domes' },
  'astronavigators-salon': { x: 1165, y: 360, on: 'astral station' }
};
const pts = [];
pinMatches.forEach((m) => {
  const px = Number(m[2]) / 100 * 1376;
  const py = Number(m[3]) / 100 * 768;
  const exp = expected[m[4]];
  pts.push({ id: m[4], x: px, y: py });
  check(`pin ${m[4]} lands on ${exp.on}`,
    Math.abs(px - exp.x) < 6 && Math.abs(py - exp.y) < 6,
    `px=(${px.toFixed(0)},${py.toFixed(0)}) expected=(${exp.x},${exp.y})`);
});

// ---- D) zoom / pan maths ---------------------------------------------
log('');
log('=== D) zoom and pan behaviour ===');
elements.mapViewport.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1200, height: 600 });

resetMapView();
check('reset returns to identity', mapView.zoom === 1 && mapView.x === 0 && mapView.y === 0);
check('canvas transform written', /translate3d\(0px, 0px, 0\) scale\(1\)/.test(elements.mapCanvas.style.transform), elements.mapCanvas.style.transform);

zoomMapAt(2, 600, 300);
check('zoom in doubles scale', Math.abs(mapView.zoom - 2) < 1e-4, String(mapView.zoom));
check('centered zoom stays centered', Math.abs(mapView.x) < 1e-3 && Math.abs(mapView.y) < 1e-3, `${mapView.x},${mapView.y}`);

// The canvas maps a content point p to screen position:
//   center + translate + (p - center) * zoom
// So to prove the cursor point is truly pinned we must compare the SCREEN position
// of that content point before and after, not just the translate vector.
function screenPosOf(contentX, contentY) {
  const bounds = elements.mapViewport.getBoundingClientRect();
  const cx = bounds.width / 2;
  const cy = bounds.height / 2;
  return {
    x: bounds.left + cx + mapView.x + (contentX - cx) * mapView.zoom,
    y: bounds.top + cy + mapView.y + (contentY - cy) * mapView.zoom
  };
}
// At zoom 1 the canvas fills the viewport exactly, so content coords == screen coords.
const pinnedX = 300;
const pinnedY = 200;
resetMapView();
const screenBefore = screenPosOf(pinnedX, pinnedY);
zoomMapAt(2, pinnedX, pinnedY);
const screenAfter = screenPosOf(pinnedX, pinnedY);
check('zooming on a point leaves that point on screen',
  Math.abs(screenBefore.x - screenAfter.x) < 1e-6 && Math.abs(screenBefore.y - screenAfter.y) < 1e-6,
  `moved ${(screenAfter.x - screenBefore.x).toFixed(4)},${(screenAfter.y - screenBefore.y).toFixed(4)}`);

// A second, chained zoom step must also keep the same content point pinned.
const chainedBefore = screenPosOf(pinnedX, pinnedY);
zoomMapAt(1.5, pinnedX, pinnedY);
const chainedAfter = screenPosOf(pinnedX, pinnedY);
check('chained zoom keeps the same point pinned',
  Math.abs(chainedBefore.x - chainedAfter.x) < 1e-6 && Math.abs(chainedBefore.y - chainedAfter.y) < 1e-6,
  `moved ${(chainedAfter.x - chainedBefore.x).toFixed(4)},${(chainedAfter.y - chainedBefore.y).toFixed(4)}`);

// Zooming on an off-centre point must NOT leave the canvas at the origin.
zoomMapAt(1.25, 100, 100);
check('off-centre zoom produces a real offset', Math.abs(mapView.x) > 1e-6 || Math.abs(mapView.y) > 1e-6,
  `x=${mapView.x.toFixed(3)} y=${mapView.y.toFixed(3)}`);

zoomMapAt(50, 600, 300);
check('zoom clamps to max', mapView.zoom <= 3.4 + 1e-4, String(mapView.zoom));
zoomMapAt(1e-6, 600, 300);
check('zoom clamps to min', mapView.zoom >= 1 - 1e-4, String(mapView.zoom));

resetMapView();
mapView.zoom = 2;
mapView.x = 99999;
mapView.y = 99999;
applyMapTransform();
check('pan clamps to positive overflow', Math.abs(mapView.x - 600) < 0.5 && Math.abs(mapView.y - 300) < 0.5, `${mapView.x},${mapView.y}`);
mapView.x = -99999;
mapView.y = -99999;
applyMapTransform();
check('pan clamps to negative overflow', Math.abs(mapView.x + 600) < 0.5 && Math.abs(mapView.y + 300) < 0.5, `${mapView.x},${mapView.y}`);

mapView.zoom = 1;
mapView.x = 40;
mapView.y = 25;
applyMapTransform();
check('no pan allowed at zoom 1', mapView.x === 0 && mapView.y === 0, `${mapView.x},${mapView.y}`);

// ---- E) readout --------------------------------------------------------
log('');
log('=== E) hover readout ===');
showMapReadout('leviathan-trench');
check('readout fills on hover', elements.mapReadout.innerHTML.includes('Abyssal Depth'), '');
check('readout names the site', elements.mapReadout.innerHTML.includes('The Submerged Hydroponics Nursery'));
check('away site says click to travel', elements.mapReadout.innerHTML.includes('Click to travel'));
showMapReadout('grand-canal');
check('current realm says you are here', elements.mapReadout.innerHTML.includes('You are here'));

// ---- F) wiring ---------------------------------------------------------
log('');
log('=== F) interaction wiring ===');
const vpListeners = listeners.mapViewport || {};
['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'wheel', 'click'].forEach((t) => {
  check(`viewport listens to ${t}`, (vpListeners[t] || []).length > 0);
});

// ---- E) locked encounters must stay hidden ------------------------------
log('');
log('=== E) locked encounters are hidden from the player ===');
const abyss = locations['leviathan-trench'];
const ids = (list) => list.map((a) => a.id);

state.currentLocationId = 'leviathan-trench';
state.player.properties = [];
state.player.stats.audacity = 0;
state.player.completedEvents = [];
let fresh = ids(getVisibleActions(abyss));
check('fresh chronicle hides harvest-orchids (no Brine-Farm)', !fresh.includes('harvest-orchids'), fresh.join(','));
check('fresh chronicle hides install-desalinators', !fresh.includes('install-desalinators'), fresh.join(','));
check('fresh chronicle still shows open encounters', fresh.length > 0, `${fresh.length} visible`);
check('no visible action reports itself locked', getVisibleActions(abyss).every((a) => describeActionUnlock(a).met));
check('harvest-orchids is genuinely locked now', !describeActionUnlock(abyss.actions.find((a) => a.id === 'harvest-orchids')).met);

const lockedSheet = renderDaySheet({ month: getGameClock().month, isCurrentMonth: true });
check('calendar day sheet hides locked harvest-orchids', !lockedSheet.includes('Harvest Your Phosphor-Orchids'));
check('calendar day sheet hides locked desalinators', !lockedSheet.includes('Install Sub-Zero Desalinators'));

state.player.properties = ['The Brine-Farm (La Fattoria 1)'];
state.player.stats.audacity = 6;
let owned = ids(getVisibleActions(abyss));
check('owning the farm reveals harvest-orchids', owned.includes('harvest-orchids'), owned.join(','));
check('farm + audacity 6 reveals install-desalinators', owned.includes('install-desalinators'), owned.join(','));

state.player.stats.audacity = 2;
let lowAudacity = ids(getVisibleActions(abyss));
check('low audacity re-hides install-desalinators', !lowAudacity.includes('install-desalinators'), lowAudacity.join(','));
check('low audacity keeps harvest-orchids visible', lowAudacity.includes('harvest-orchids'), lowAudacity.join(','));

// harvest-orchids is a repeatable farm action, so it correctly survives its own success.
// install-desalinators is the unique one: resolving it must retire it for good.
state.player.stats.audacity = 6;
state.player.completedEvents = [{ id: 'install-desalinators', title: 'Install Sub-Zero Desalinators', outcome: 'Success', at: '10:00' }];
let afterSuccess = ids(getVisibleActions(abyss));
check('resolved unique desalinators is retired', !afterSuccess.includes('install-desalinators'), afterSuccess.join(','));
check('repeatable harvest stays after the sequel resolves', afterSuccess.includes('harvest-orchids'), afterSuccess.join(','));

// harvest-orchids is repeatable, and install-desalinators declares no gating
// chain requirement, so it stays open on its own: a failed harvest must not close it.
state.player.completedEvents = [{ id: 'harvest-orchids', title: 'Harvest Your Phosphor-Orchids', outcome: 'Failure', at: '10:00' }];
let afterFailure = ids(getVisibleActions(abyss));
check('failed harvest leaves the harvest retryable', afterFailure.includes('harvest-orchids'), afterFailure.join(','));
check('non-gating sequel stays open after a failed harvest', afterFailure.includes('install-desalinators'), afterFailure.join(','));

state.player.properties = [];
state.player.completedEvents = [];
const sheetAgain = renderDaySheet({ month: getGameClock().month, isCurrentMonth: true });
check('calendar re-hides both once the farm is gone', !sheetAgain.includes('Harvest Your Phosphor-Orchids') && !sheetAgain.includes('Install Sub-Zero Desalinators'));

// ---- G) equipment: slots, bonuses, save integrity -----------------------
log('');
log('=== G) equipment slots and bonuses ===');
state.player.equipment = sanitizeEquipment(null);
state.player.inventory = [];
grantMissingStarterItems();
check('seven slots declared', equipmentSlots.length === 7, equipmentSlots.map((s) => s.key).join(','));
check('companion slot exists', equipmentSlots.some((s) => s.key === 'companion'));
check('companion slot flagged as living', equipmentSlots.filter((s) => s.living).length === 1);
const lampwright = findEquipmentItem('starter-lampwright');
check('Old Lampwright is a ghost, not a person', lampwright.companionKind === 'Ghost', lampwright.companionKind);
check('the tide cat is still a beast', findEquipmentItem('starter-drowned-cat').companionKind === 'Beast');
check('companion kinds are beasts or spirits only', equipmentItems.filter((i) => i.companion).every((i) => ['Beast', 'Ghost'].includes(i.companionKind)));
check('every catalogue item targets a real slot', equipmentItems.every((i) => equipmentSlots.some((s) => s.key === i.slot)));
check('item ids are unique', new Set(equipmentItems.map((i) => i.id)).size === equipmentItems.length);
check('starter kit is fully populated', equipmentSlots.every((s) => state.player.equipment[s.key] !== undefined));
check('every item is owned exactly once', (() => {
  const owned = [...Object.values(state.player.equipment).filter(Boolean), ...state.player.inventory];
  return new Set(owned).size === owned.length && owned.length === equipmentItems.length;
})(), `${[...Object.values(state.player.equipment).filter(Boolean), ...state.player.inventory].length} owned`);

check('base stats untouched by gear', state.player.stats.vigilance === 1);
check('hood grants Vigilance', getEquipmentStatBonus('vigilance') === 1, `${getEquipmentStatBonus('vigilance')}`);
check('effective stat = base + gear', getEffectiveStat('vigilance') === 2, `${getEffectiveStat('vigilance')}`);
check('boots grant Max Vigor', getVigorMax() === VIGOR_MAX + 2, `${getVigorMax()}`);

// Test odds must follow the gear the player is actually wearing.
const probe = { test: 'vigilance', difficulty: 4 };
const bareChance = (() => { state.player.equipment.head = null; return getTestChance(probe); })();
const hoodedChance = (() => { state.player.equipment.head = 'starter-diving-hood'; return getTestChance(probe); })();
check('wearing the hood raises the roll chance', hoodedChance > bareChance, `${bareChance}% -> ${hoodedChance}%`);

// A stat requirement must also see gear, otherwise gear would never open a path.
const gated = { requires: [{ type: 'stat', stat: 'elegance', min: 2 }] };
state.player.equipment.trinket = null;
check('elegance gate locked without the seal', !describeActionUnlock(gated).met);
state.player.equipment.trinket = 'starter-council-seal';
check('elegance gate opens with the seal worn', describeActionUnlock(gated).met, `elegance ${getEffectiveStat('elegance')}`);

state.player.equipment.trinket = null;
check('removing gear gives the bonus back', getEquipmentStatBonus('elegance') === 0);

// ---- H) equipping, swapping, and hostile saves --------------------------
log('');
log('=== H) equip / unequip behaviour ===');
state.player.equipment = sanitizeEquipment(null);
state.player.inventory = [];
grantMissingStarterItems();
const before = state.player.inventory.length;
equipItem('starter-reef-cloak');
check('wearing moves the item out of the satchel', state.player.equipment.mantle === 'starter-reef-cloak');
check('wearing removes it from inventory', !state.player.inventory.includes('starter-reef-cloak'), `${state.player.inventory.length} left from ${before}`);
check('mantle now grants two stats', getEquipmentStatBonus('persuasion') === 1 && getEquipmentStatBonus('vigilance') === 2);

equipItem('starter-council-seal');
check('second piece equips without disturbing the first', state.player.equipment.mantle === 'starter-reef-cloak' && state.player.equipment.trinket === 'starter-council-seal');

// Clicking the worn piece again takes it off.
equipItem('starter-reef-cloak');
check('clicking worn gear takes it off', state.player.equipment.mantle === null);
check('removed gear returns to the satchel', state.player.inventory.includes('starter-reef-cloak'));
check('its bonus is gone', getEquipmentStatBonus('persuasion') === 0);

// A swap must hand the displaced piece back, never swallow it.
state.player.inventory.push('starter-reef-cloak');
equipItem('starter-reef-cloak');
equipItem('starter-drowned-cat');
check('companion equips into its own slot', state.player.equipment.companion === 'starter-drowned-cat');
check('companion grants its bonus', getEquipmentStatBonus('cunning') === 2, `${getEquipmentStatBonus('cunning')}`);
check('companion replaced nothing else', state.player.equipment.body === 'starter-patched-coat');

equipItem('starter-lampwright');
check('a second companion swaps the first out', state.player.equipment.companion === 'starter-lampwright');
check('displaced companion is kept', state.player.inventory.includes('starter-drowned-cat'));
check('no item is ever lost', (() => {
  const owned = [...Object.values(state.player.equipment).filter(Boolean), ...state.player.inventory];
  return new Set(owned).size === owned.length && owned.length === equipmentItems.length;
})(), `${[...Object.values(state.player.equipment).filter(Boolean), ...state.player.inventory].length} owned`);

const inventoryBefore = state.player.inventory.slice();
unequipSlot('feet');
check('removing by slot clears it', state.player.equipment.feet === null);
check('removed piece is in the satchel', state.player.inventory.includes('starter-copper-greaves'));
check('vigor ceiling drops back', getVigorMax() === VIGOR_MAX + 1, `${getVigorMax()}`);
check('nothing was destroyed by unequip', inventoryBefore.filter((id) => id !== 'starter-copper-greaves').every((id) => state.player.inventory.includes(id)));

// Hostile or stale saves must never inject bonuses.
check('unknown item id is rejected', sanitizeEquipment({ head: 'no-such-item' }).head === null);
check('item in the wrong slot is rejected', sanitizeEquipment({ head: 'starter-copper-greaves' }).head === null);
check('array instead of object falls back to the kit', sanitizeEquipment(['nope']).head === 'starter-diving-hood');
check('every slot key always exists', equipmentSlots.every((s) => s.key in sanitizeEquipment({})));
check('unknown inventory ids are dropped', !sanitizeInventory(['ghost-item', 'starter-reef-cloak', 'starter-reef-cloak'], { head: null }).includes('ghost-item'));
check('equipped ids are not duplicated into inventory', !sanitizeInventory(['starter-diving-hood'], sanitizeEquipment(null)).includes('starter-diving-hood'));

log('');
log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`);
fs.writeFileSync('tools/out/map-check.out.txt', out.join('\n'), 'utf8');
console.log(failures === 0 ? 'HARNESS OK' : 'HARNESS FAILURES: ' + failures);

for (let i = 0; i < pts.length; i += 1) {
  for (let j = i + 1; j < pts.length; j += 1) {
    const gap = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
    check(`beacons ${pts[i].id}/${pts[j].id} do not collide`, gap > 60, `gap ${gap.toFixed(0)}px`);
  }
}

