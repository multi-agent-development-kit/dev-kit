// Tests para scaffolding-guard.{sh,ps1} (versión 1.0.0).
//
// El hook bloquea git commits que (a) incluyen archivos en ai_docs/, .claude/ o
// .cursor/, o (b) tienen mensaje sin formato canónico <type>: <subject>.
//
// Necesita git inicializado en el cwd del fixture (para `git diff --cached`).
//
// Casos cubiertos (≥4):
//   1. `git commit -m "create: nueva skill"` con src/foo.js staged → exit 0.
//   2. `git commit ...` con archivo en ai_docs/tasks/ staged → exit 2 (SCAFFOLDING_STAGED).
//   3. `git commit -m "added new feature"` (sin tipo canónico) → exit 2 (COMMIT_FORMAT_INVALID).
//   4. `git commit -m "fix: <subject muy largo>"` (>72 chars) → exit 2 (COMMIT_SUBJECT_TOO_LONG).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeShellHook, makeTmpProject, hooksDir } from './helper.js';

// Cleanup robusto cross-platform — Windows EBUSY puede ocurrir si .git tiene
// procesos pendientes. force + maxRetries + retryDelay mitigan.
function rmTmp(p) {
  try {
    rmSync(p, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch {
    // best-effort
  }
}

const SCRIPT_BASE = join(hooksDir(), 'scaffolding-guard');

/**
 * Inicializa un repo git en `cwd` con un commit inicial vacío y una identidad
 * local. Necesario para que `git diff --cached --name-only` funcione sin pedir
 * configuración global.
 */
function initRepo(cwd) {
  const opts = { cwd, stdio: 'ignore' };
  execSync('git init -b main', opts);
  execSync('git config user.email "test@example.com"', opts);
  execSync('git config user.name "Test"', opts);
  execSync('git config commit.gpgsign false', opts);
  // Crear commit inicial mínimo para que existan refs.
  writeFileSync(join(cwd, '.gitignore'), 'node_modules/\n');
  execSync('git add .gitignore', opts);
  execSync('git commit -m "initial: stub" --no-verify', opts);
}

function makeInput({ cwd, command }) {
  return {
    tool_name: 'Bash',
    cwd,
    tool_input: { command },
  };
}

test('scaffolding-guard: commit válido sobre src/ → exit 0', (t) => {
  const tmp = makeTmpProject({
    __config__: { scaffolding_guard: true },
  });
  t.after(() => rmTmp(tmp));
  initRepo(tmp);
  // Stage de un archivo legítimo.
  mkdirSync(join(tmp, 'src'), { recursive: true });
  writeFileSync(join(tmp, 'src', 'foo.js'), 'export const foo = 1;\n');
  execSync('git add src/foo.js', { cwd: tmp, stdio: 'ignore' });

  const r = invokeShellHook(SCRIPT_BASE, makeInput({
    cwd: tmp,
    command: 'git commit -m "create: nueva skill"',
  }), { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stdout=${r.stdout}; stderr=${r.stderr}`);
});

test('scaffolding-guard: archivo en ai_docs/tasks/ staged → exit 2 (SCAFFOLDING_STAGED)', (t) => {
  const tmp = makeTmpProject({
    __config__: { scaffolding_guard: true },
  });
  t.after(() => rmTmp(tmp));
  initRepo(tmp);
  mkdirSync(join(tmp, 'ai_docs', 'tasks'), { recursive: true });
  writeFileSync(join(tmp, 'ai_docs', 'tasks', '999_test.md'), '# test\n');
  // Force-add aunque .gitignore lo excluya en proyectos reales (en este tmp no
  // tenemos exclusión configurada, así que `git add` basta).
  execSync('git add -f ai_docs/tasks/999_test.md', { cwd: tmp, stdio: 'ignore' });

  const r = invokeShellHook(SCRIPT_BASE, makeInput({
    cwd: tmp,
    command: 'git commit -m "create: leak"',
  }), { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2; stdout=${r.stdout}; stderr=${r.stderr}`);
  assert.match(r.stdout, /SCAFFOLDING_STAGED/);
});

test('scaffolding-guard: tipo no canónico ("added") → exit 2 (COMMIT_FORMAT_INVALID)', (t) => {
  const tmp = makeTmpProject({
    __config__: { scaffolding_guard: true },
  });
  t.after(() => rmTmp(tmp));
  initRepo(tmp);
  mkdirSync(join(tmp, 'src'), { recursive: true });
  writeFileSync(join(tmp, 'src', 'a.js'), '\n');
  execSync('git add src/a.js', { cwd: tmp, stdio: 'ignore' });

  const r = invokeShellHook(SCRIPT_BASE, makeInput({
    cwd: tmp,
    command: 'git commit -m "added new feature"',
  }), { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2; stdout=${r.stdout}; stderr=${r.stderr}`);
  assert.match(r.stdout, /COMMIT_FORMAT_INVALID/);
});

test('scaffolding-guard: subject >72 chars → exit 2 (COMMIT_SUBJECT_TOO_LONG)', (t) => {
  const tmp = makeTmpProject({
    __config__: { scaffolding_guard: true },
  });
  t.after(() => rmTmp(tmp));
  initRepo(tmp);
  mkdirSync(join(tmp, 'src'), { recursive: true });
  writeFileSync(join(tmp, 'src', 'b.js'), '\n');
  execSync('git add src/b.js', { cwd: tmp, stdio: 'ignore' });

  // 70 chars de subject tras "fix: " = total 75 chars de subject (>72).
  const longSubject = 'fix: ' + 'a'.repeat(80);
  const r = invokeShellHook(SCRIPT_BASE, makeInput({
    cwd: tmp,
    command: `git commit -m "${longSubject}"`,
  }), { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2; stdout=${r.stdout}; stderr=${r.stderr}`);
  assert.match(r.stdout, /COMMIT_SUBJECT_TOO_LONG/);
});
