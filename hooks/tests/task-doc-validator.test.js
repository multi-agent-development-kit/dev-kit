// Tests para task-doc-validator.js (versión 1.1.1 tras T089).
//
// El validator se invoca como subprocess `node task-doc-validator.js` con stdin
// JSON simulando un PreToolUse para Write/Edit a ai_docs/tasks/*.md.
//
// Casos cubiertos (≥6):
//   1. Regression T089: task doc con h3 + 4 checkboxes — exit 0 sin warning de checkbox-count.
//   2. Filename inválido (no NNN_descriptor.md) → exit 2 + TASK_DOC_FILENAME_INVALID.
//   3. Sin sección "Criterios de Éxito" → exit 2 + TASK_DOC_STRUCTURE_INVALID.
//   4. `Depende de:` referenciando task inexistente → exit 2.
//   5. Criterios de Éxito como h3 (no h2) es aceptado tras T089 → exit 0.
//   6. Flag task_doc_validator: false → exit silencioso.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { invokeJsHook, makeTmpProject, hooksDir } from './helper.js';

// Cleanup robusto cross-platform — Windows EBUSY puede ocurrir si un proceso
// hijo aún tiene un handle. force + maxRetries + retryDelay mitigan.
function rmTmp(p) {
  try {
    rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
  } catch {
    // Cleanup best-effort: si el FS sigue ocupado, no rompemos el test.
  }
}

const HOOK = join(hooksDir(), 'task-doc-validator.js');
// fileURLToPath maneja correctamente espacios (%20 → ' ') y prefijo Windows.
const TESTS_DIR = fileURLToPath(new URL('.', import.meta.url));
const FIXTURES_DIR = join(TESTS_DIR, 'fixtures');

function makeWriteInput({ cwd, filePath, content }) {
  return {
    tool_name: 'Write',
    cwd,
    tool_input: {
      file_path: filePath,
      content,
    },
  };
}

test('task-doc-validator: regression T089 — h3 con 4 checkboxes detectados, sin warning de subconteo', (t) => {
  // Regression específica del bug del lookahead `\n*$` en CRITERIA_SECTION_REGEX
  // (v1.1.0 → v1.1.1): la regex capturaba solo la primera línea de la sección,
  // por lo que el conteo posterior encontraba 1 checkbox y emitía warning falso
  // "has 1 checkbox(es); recommended at least 3" sobre task docs con muchos
  // criterios reales. El fixture `valid-task-doc.md` tiene 4 checkboxes en h3 —
  // el validator v1.1.1 los detecta los 4 y no emite ningún warning de count.
  const content = readFileSync(join(FIXTURES_DIR, 'valid-task-doc.md'), 'utf8');
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '999_regression_t089.md');
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0 sobre fixture h3+4 checkboxes; stdout=${r.stdout}`);
  // Si el bug v1.1.0 reaparece, la regex capturaría solo 1 línea y el count
  // sería 1 → warning. Verificamos que ese warning NO aparece.
  assert.doesNotMatch(r.stdout, /has 1 checkbox/i, `Regression T089: warning de subconteo detectado, stdout=${r.stdout}`);
});

test('task-doc-validator: bloquea filename inválido (sin NNN_)', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', 'abc.md');
  const input = makeWriteInput({
    cwd: tmp,
    filePath,
    content: '# fake\n\n## Criterios de Éxito\n- [ ] ok\n- [ ] ok\n- [ ] ok\n',
  });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2; stdout=${r.stdout}`);
  assert.match(r.stdout, /TASK_DOC_FILENAME_INVALID/, `Esperado código TASK_DOC_FILENAME_INVALID en stdout: ${r.stdout}`);
});

test('task-doc-validator: bloquea cuando falta "Criterios de Éxito"', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const content = readFileSync(join(FIXTURES_DIR, 'missing-criteria.md'), 'utf8');
  const filePath = join(tmp, 'ai_docs', 'tasks', '998_missing_criteria.md');
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2; stdout=${r.stdout}`);
  assert.match(r.stdout, /TASK_DOC_STRUCTURE_INVALID/);
  assert.match(r.stdout, /Criterios de [ÉE]xito/i);
});

test('task-doc-validator: bloquea Depende de: con task inexistente', (t) => {
  // El validator solo comprueba existencia si ai_docs/tasks/ existe en cwd.
  // Sembramos el directorio (con solo el archivo bajo análisis para que el
  // listado del dir esté vivo) sin incluir el 999 referenciado.
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
    // Un archivo "ancla" para que el dir exista — pero NO 999.
    'ai_docs/tasks/100_anchor.md': '# Tarea 100\n',
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', '500_test_dep.md');
  const content = `# Tarea 500: dep test

> **Depende de:** 999

## Criterios de Éxito
- [ ] uno
- [ ] dos
- [ ] tres
`;
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 2, `Expected exit 2; stdout=${r.stdout}`);
  assert.match(r.stdout, /Depende de/);
  assert.match(r.stdout, /999/);
});

test('task-doc-validator: detecta "Criterios de Éxito" en h3 (no h2)', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: true },
  });
  t.after(() => rmTmp(tmp));
  const content = readFileSync(join(FIXTURES_DIR, 'valid-task-doc.md'), 'utf8');
  const filePath = join(tmp, 'ai_docs', 'tasks', '999_valid_h3.md');
  const input = makeWriteInput({ cwd: tmp, filePath, content });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0 con h3; stdout=${r.stdout}`);
});

test('task-doc-validator: exit silencioso cuando flag task_doc_validator es false', (t) => {
  const tmp = makeTmpProject({
    __config__: { task_doc_validator: false },
  });
  t.after(() => rmTmp(tmp));
  const filePath = join(tmp, 'ai_docs', 'tasks', 'abc.md'); // filename inválido a propósito
  const input = makeWriteInput({
    cwd: tmp,
    filePath,
    content: '# nada\n',
  });
  const r = invokeJsHook(HOOK, input, { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0 (flag false); stdout=${r.stdout}`);
  assert.equal(r.stdout, '', `Esperado stdout vacío con flag desactivada, got: ${r.stdout}`);
});
