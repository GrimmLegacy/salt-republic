// Runs every harness in this folder and reports one line each.
// Each harness prints a final line with its own verdict, so we read that
// rather than inventing per-harness pass criteria here.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const outDir = path.join(dir, 'out');
fs.mkdirSync(outDir, { recursive: true });

const skip = new Set(['run-tests.js', 'harness.js', 'update-lore-docs.js']);
const harnesses = fs.readdirSync(dir)
  .filter((n) => n.endsWith('.js') && !skip.has(n))
  .sort();

let failed = 0;
const rows = [];

for (const name of harnesses) {
  const res = spawnSync(process.execPath, [path.join(dir, name)], {
    encoding: 'utf8',
    cwd: path.join(dir, '..')
  });
  const stdout = `${res.stdout || ''}${res.stderr || ''}`.trim();
  const crashed = res.status !== 0;
  // A harness signals its own verdict on stdout; treat a non-zero exit or an
  // explicit FAILURES line as a failure.
  const saysFail = /FAILURES?\b|\bFAIL /.test(stdout);
  const ok = !crashed && !saysFail;
  if (!ok) failed += 1;
  rows.push(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(20)} ${stdout.split('\n').slice(-1)[0] || ''}`);
}

console.log(rows.join('\n'));
console.log('');
console.log(failed ? `${failed} of ${harnesses.length} harness(es) failed.` : `All ${harnesses.length} harnesses passed.`);
process.exit(failed ? 1 : 0);