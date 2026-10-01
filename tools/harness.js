// Shared loader for the harnesses in this folder.
//
// index.html loads lore.js before app.js because lore.js supplies the flags and
// discovery helpers that app.js calls at boot. Every harness must reproduce that
// order, otherwise a save boot hits `loreFlags is not defined`. Centralising it
// here means a new file in src/ cannot silently break six harnesses at once.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function loadGame() {
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'lore.js'), 'utf8'), { filename: 'lore.js' });
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8'), { filename: 'app.js' });
}

function readOut(name) {
  return path.join(__dirname, 'out', name);
}

module.exports = { ROOT, loadGame, readOut };