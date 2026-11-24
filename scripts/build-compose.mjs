import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// Compose's generated Bake context may normalize macOS Unicode paths differently.
// Permit only the actual workspace in both forms; do not grant arbitrary fs access.
const args = process.argv.slice(2);
if (
  args.some(
    (a, i) => i % 2 === 0 && !['--env-file', '--project-name'].includes(a),
  ) ||
  args.length % 2
)
  throw new Error(
    'Usage: node scripts/build-compose.mjs [--env-file path] [--project-name name]',
  );
const dir = mkdtempSync(join(tmpdir(), 'minimart-bake-'));
try {
  const config = execFileSync(
    'docker',
    ['compose', ...args, 'build', '--print'],
    { encoding: 'utf8' },
  );
  const file = join(dir, 'bake.json');
  writeFileSync(file, config);
  const targets = Object.keys(JSON.parse(config).target);
  const root = realpathSync(process.cwd());
  for (const target of targets) {
    const r = spawnSync(
      'docker',
      [
        'buildx',
        'bake',
        '-f',
        file,
        '--allow',
        'fs.read=' + root.normalize('NFC'),
        '--allow',
        'fs.read=' + root.normalize('NFD'),
        target,
      ],
      { stdio: 'inherit' },
    );
    if (r.status !== 0)
      throw new Error('Docker build failed: ' + target + ' exit ' + r.status);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
