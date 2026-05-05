// Tests para session-state.{sh,ps1} (versión 1.0.1 sh / 1.0.0 ps1).
//
// El hook se invoca en SessionStart, lee ai_docs/STATE.md y emite JSON con
// `additionalContext` + typed fields (state_present, active_task).
//
// Casos cubiertos (≥3):
//   1. Flag session_state: false → exit 0 sin output.
//   2. Sin ai_docs/STATE.md → exit 0 + state_present:false + "sesión limpia".
//   3. Con ai_docs/STATE.md válido → exit 0 + state_present:true + active_task.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeShellHook, makeTmpProject, hooksDir } from './helper.js';

function rmTmp(p) {
  try {
    rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
  } catch {
    // best-effort
  }
}

const SCRIPT_BASE = join(hooksDir(), 'session-state');

function makeInput({ cwd }) {
  return { cwd, source: 'startup' };
}

test('session-state: flag session_state:false → exit 0 silencioso', (t) => {
  const tmp = makeTmpProject({
    __config__: { session_state: false },
  });
  t.after(() => rmTmp(tmp));
  const r = invokeShellHook(SCRIPT_BASE, makeInput({ cwd: tmp }), { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  assert.equal(r.stdout.trim(), '', `Esperado stdout vacío con flag desactivada, got: ${r.stdout}`);
});

test('session-state: sin ai_docs/STATE.md → state_present:false + "sesión limpia"', (t) => {
  const tmp = makeTmpProject({
    __config__: { session_state: true },
  });
  t.after(() => rmTmp(tmp));
  // ai_docs/ existe pero sin STATE.md
  mkdirSync(join(tmp, 'ai_docs'), { recursive: true });
  const r = invokeShellHook(SCRIPT_BASE, makeInput({ cwd: tmp }), { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  assert.notEqual(r.stdout.trim(), '');
  let parsed;
  try {
    parsed = JSON.parse(r.stdout);
  } catch (e) {
    assert.fail(`stdout no es JSON válido: ${r.stdout}`);
  }
  const inner = parsed.hookSpecificOutput;
  assert.ok(inner, 'Falta hookSpecificOutput');
  assert.equal(inner.hookEventName, 'SessionStart');
  assert.equal(inner.state_present, false, `state_present debe ser false, got: ${inner.state_present}`);
  assert.match(inner.additionalContext || '', /(sesi[oó]n limpia|STATE\.md)/i);
});

test('session-state: con ai_docs/STATE.md → state_present:true + active_task: "087"', (t) => {
  const tmp = makeTmpProject({
    __config__: { session_state: true },
  });
  t.after(() => rmTmp(tmp));
  mkdirSync(join(tmp, 'ai_docs'), { recursive: true });
  const stateContent = `---
active_task: 087
phase: implementación de tests
last_action: Edit on task-doc-validator.js
timestamp: 2026-05-05T12:34:56.000Z
session_id: test-abc
---

# Breadcrumb automático
contenido extra
`;
  writeFileSync(join(tmp, 'ai_docs', 'STATE.md'), stateContent);
  const r = invokeShellHook(SCRIPT_BASE, makeInput({ cwd: tmp }), { cwd: tmp });
  assert.equal(r.exitCode, 0, `Expected exit 0; stderr=${r.stderr}`);
  let parsed;
  try {
    parsed = JSON.parse(r.stdout);
  } catch (e) {
    assert.fail(`stdout no es JSON válido: ${r.stdout}`);
  }
  const inner = parsed.hookSpecificOutput;
  assert.equal(inner.state_present, true, `state_present debe ser true, got: ${inner.state_present}`);
  assert.equal(inner.active_task, '087', `active_task debe ser "087", got: ${inner.active_task}`);
  assert.match(inner.additionalContext || '', /STATE\.md/);
});
