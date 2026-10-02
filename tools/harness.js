// Shared loader for the harnesses in this folder.
//
// index.html loads lore.js before app.js because lore.js supplies the flags and
// discovery helpers that app.js calls at boot. Every harness must reproduce that
// order, otherwise a save boot hits `loreFlags is not defined`. Centralising it
// here means a new file cannot silently break six harnesses at once.
//
// `factions.js` is loaded first of all: app.js reads the faction table while
// sanitising a save, so a harness that skipped it would fail at boot with
// `factions is not defined` rather than reporting something useful.
//
// When a new data file is added to index.html, add it here too. The harness
// list below is the order the browser uses.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

// Stesso ordine di index.html, meno i file che i test non usano (auth.js fa
// rete, motes.js disegna su un canvas che in Node non esiste).
const GAME_SOURCES = ['factions.js', 'lore.js', 'app.js'];

function loadGame() {
  GAME_SOURCES.forEach((file) => {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), { filename: file });
  });
}

function readOut(name) {
  return path.join(__dirname, 'out', name);
}

module.exports = { ROOT, GAME_SOURCES, loadGame, readOut };