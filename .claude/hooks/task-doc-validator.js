#!/usr/bin/env node
// hook-version: 1.1.1
// Task Doc Validator — PreToolUse hook (Write/Edit a ai_docs/tasks/*.md)
//
// Validador estructural mecánico de task docs en el momento de guardar. Atrapa
// malformatos antes de que se propaguen a downstream (subagents, plan-checker,
// doc-syncer).
//
// Defense-in-depth con skill `plan-checker` (T078): el hook valida ESTRUCTURA
// mecánica al guardar; la skill valida SEMÁNTICA tras guardar. Capas distintas.
//
// Verificaciones (v1.1.0):
//   1. Numeración del archivo: ^\d{3}_[\w-]+\.md$ (BLOCKER si no matchea).
//   2. Sección "Criterios de Éxito" presente (h2 o h3, case-insensitive,
//      acepta con o sin tilde) — única sección obligatoria en todos los niveles.
//   3. ≥3 checkboxes en la sección de criterios (advisory si <3, no bloquea).
//   4. `> **Depende de:**` (opcional) bien formado si presente: IDs de 3 dígitos,
//      no auto-referencia, archivos referidos existen.
//   5. Cabeceras blockquote `> **Estado:**`, `> **Fecha de apertura:**`,
//      `> **Complejidad:**`, `> **Alcance:**` — TODAS OPCIONALES. Si están
//      presentes, se validan los valores. Si ausentes, no se penaliza.
//   6. Sección "Lifecycle" recomendada (advisory) en docs largos — no bloquea.
//
// Cambio v1.0.0 → v1.1.0 (T089):
//   El formato real de los task docs producidos por el framework usa estructura
//   numerada (`## 1. Resumen` con `### Criterios de Éxito` h3 dentro,
//   `## 5. Lifecycle`, etc.) sin cabecera blockquote `Estado/Fecha/Complejidad/
//   Alcance`. La v1.0.0 exigía un formato hipotético que nunca se materializó —
//   bloqueaba 100% de los task docs reales. La v1.1.0 alinea el validator con
//   la realidad: única sección obligatoria es "Criterios de Éxito" (h2 o h3),
//   cabeceras blockquote son opcionales pero validadas si presentes.
//
// Cambio v1.1.0 → v1.1.1:
//   Fix de CRITERIA_SECTION_REGEX que solo capturaba la primera línea de la
//   sección. El lookahead anterior `(?=\n#{1,3}\s|\n*$)` con flag `m` hacía que
//   `\n*$` matcheara cualquier fin-de-línea (no solo fin-de-string), y el lazy
//   `[\s\S]*?` cerraba el grupo en el primer `\n`. Resultado: en task docs con
//   ≥3 checkboxes el conteo era 1 y se disparaba un warning falso. Ahora ancla
//   a próximo heading h1/h2/h3 o fin-de-string real (`$(?![\s\S])`).
//
// Severidad:
//   - BLOCKER (exit 2): numeración del filename inválida, "Criterios de Éxito"
//     ausente, dep referida inexistente, auto-referencia en deps.
//   - ADVISORY (exit 0 con additionalContext): formato fecha incorrecto, valor
//     de Estado/Complejidad inválido cuando la cabecera está presente,
//     "Depende de:" mal formado pero parseable, criterios con <3 checkboxes,
//     Lifecycle recomendado ausente.
//
// Excepciones (no validar):
//   - Archivo en proceso de borrado (Write con content vacío).
//   - Path matchea ai_docs/tasks/000_* (calibración).
//
// Manejo de Edit puntual:
//   - Re-leer archivo, simular reemplazo, validar resultado.
//
// Opt-in: requiere `task_doc_validator: true` en .claude/hooks/config.json.

const fs = require('fs');
const path = require('path');

const VALID_STATES = ['ABIERTA', 'EN_PROGRESO', 'COMPLETADA', 'DESCARTADA'];
const VALID_COMPLEXITIES = ['SIMPLE', 'ESTÁNDAR', 'ESTANDAR', 'COMPLEJA', 'CRÍTICA', 'CRITICA'];

// Match flexible de "Criterios de Éxito" (con/sin tilde, case-insensitive).
// Acepta h2 (## ) o h3 (### ), con o sin numeración previa (ej. "### Criterios de Éxito"
// o "## Criterios de éxito" o "## 3. Criterios de exito").
const CRITERIA_HEADING_REGEX = /^#{2,3}\s+.*criterios\s+de\s+[éeè]xito.*$/im;
// Lookahead `(?=\n#{1,3}\s|$(?![\s\S]))` ancla a "próximo heading h1/h2/h3" o
// "fin-de-string real". `$(?![\s\S])` es fin-de-string verdadero incluso con
// flag `m`, evitando que el lazy `[\s\S]*?` cierre el grupo en el primer
// `\n` (bug v1.1.0: `\n*$` con flag `m` matcheaba cualquier fin-de-línea y
// solo se capturaba la primera línea de la sección).
const CRITERIA_SECTION_REGEX = /^#{2,3}\s+.*criterios\s+de\s+[éeè]xito[^\n]*\n([\s\S]*?)(?=\n#{1,3}\s|$(?![\s\S]))/im;

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 5000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name;
    const cwd = data.cwd || process.cwd();

    if (!['Write', 'Edit'].includes(toolName)) {
      process.exit(0);
    }

    // Opt-in
    const configPath = path.join(cwd, '.claude', 'hooks', 'config.json');
    if (!fs.existsSync(configPath)) {
      process.exit(0);
    }
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      process.exit(0);
    }
    if (config.task_doc_validator !== true) {
      process.exit(0);
    }

    const filePath = (data.tool_input && data.tool_input.file_path) || '';
    if (!filePath) {
      process.exit(0);
    }

    // Solo activar para ai_docs/tasks/*.md (cross-platform)
    const normalized = filePath.replace(/\\/g, '/');
    if (!/\bai_docs\/tasks\/[^/]+\.md$/.test(normalized)) {
      process.exit(0);
    }

    const fileName = path.basename(filePath);

    // Excepción: 000_* (calibración del proyecto)
    if (/^000_/.test(fileName)) {
      process.exit(0);
    }

    // CHECK numeración del nombre del archivo (BLOCKER)
    if (!/^\d{3}_[\w-]+\.md$/.test(fileName)) {
      blockExit(
        'TASK_DOC_FILENAME_INVALID',
        `Filename "${fileName}" must match the pattern NNN_descriptor.md (3-digit number prefix, snake_case or kebab-case descriptor, .md extension). See CLAUDE.md §3.2.`
      );
    }

    // Determinar contenido a validar
    let contentToValidate = '';

    if (toolName === 'Write') {
      contentToValidate = (data.tool_input && data.tool_input.content) || '';

      // Excepción: archivo en proceso de borrado (content vacío en Write)
      if (contentToValidate.trim() === '') {
        process.exit(0);
      }
    } else if (toolName === 'Edit') {
      // Estrategia: leer el archivo actual (pre-edit), simular el reemplazo,
      // validar el resultado.
      const oldString = (data.tool_input && data.tool_input.old_string) || '';
      const newString = (data.tool_input && data.tool_input.new_string) || '';
      if (!fs.existsSync(filePath)) {
        process.exit(0);
      }
      let current;
      try {
        current = fs.readFileSync(filePath, 'utf8');
      } catch {
        process.exit(0);
      }
      const replaceAll = !!(data.tool_input && data.tool_input.replace_all);
      if (replaceAll) {
        contentToValidate = current.split(oldString).join(newString);
      } else {
        const idx = current.indexOf(oldString);
        if (idx === -1) {
          // El edit fallará igualmente; no nuestro problema. Salir silencioso.
          process.exit(0);
        }
        contentToValidate = current.slice(0, idx) + newString + current.slice(idx + oldString.length);
      }
    }

    // === Validaciones sobre contentToValidate ===

    const errors = [];   // BLOCKER
    const warnings = []; // ADVISORY

    // 1. CABECERAS BLOCKQUOTE OPCIONALES — buscar en las primeras 30 líneas.
    //    Si están presentes, validar valores. Si ausentes, no penalizar.
    const head = contentToValidate.split(/\r?\n/).slice(0, 30).join('\n');

    const stateMatch = head.match(/^>\s*\*\*Estado:\*\*\s*([A-ZÁÉÍÓÚÑ_]+)/m);
    if (stateMatch && !VALID_STATES.includes(stateMatch[1])) {
      warnings.push(`Header "Estado" has invalid value "${stateMatch[1]}". Expected one of: ${VALID_STATES.join(', ')}.`);
    }

    const dateMatch = head.match(/^>\s*\*\*Fecha de apertura:\*\*\s*(\S+)/m);
    if (dateMatch && !/^\d{4}-\d{2}-\d{2}$/.test(dateMatch[1])) {
      warnings.push(`Header "Fecha de apertura" "${dateMatch[1]}" should be in YYYY-MM-DD format.`);
    }

    const complexityMatch = head.match(/^>\s*\*\*Complejidad:\*\*\s*([A-ZÁÉÍÓÚÑ]+)/m);
    if (complexityMatch && !VALID_COMPLEXITIES.includes(complexityMatch[1])) {
      warnings.push(`Header "Complejidad" has invalid value "${complexityMatch[1]}". Expected one of: SIMPLE, ESTÁNDAR, COMPLEJA, CRÍTICA.`);
    }

    const scopeMatch = head.match(/^>\s*\*\*Alcance:\*\*\s*(\S.*)/m);
    if (scopeMatch && scopeMatch[1].trim().length === 0) {
      warnings.push('Header "Alcance" is present but empty.');
    }

    // 2. `Depende de:` (opcional, validado estrictamente si presente)
    const depMatch = head.match(/^>\s*\*\*Depende de:\*\*\s*(.+)$/m);
    if (depMatch) {
      const ids = depMatch[1].split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
      const taskFileId = fileName.match(/^(\d{3})/)[1];
      const tasksDir = path.join(cwd, 'ai_docs', 'tasks');

      for (const id of ids) {
        if (!/^\d{3}$/.test(id)) {
          warnings.push(`"Depende de:" entry "${id}" should be a 3-digit task ID.`);
          continue;
        }
        if (id === taskFileId) {
          errors.push(`"Depende de:" cannot self-reference (this task is ${id}).`);
          continue;
        }
        // Verificar existencia del task referido (SKIP si el dir no existe)
        if (fs.existsSync(tasksDir)) {
          try {
            const exists = fs.readdirSync(tasksDir).some(f => f.startsWith(`${id}_`));
            if (!exists) {
              errors.push(`"Depende de:" references task ${id} but no file ai_docs/tasks/${id}_*.md exists.`);
            }
          } catch { /* ignore */ }
        }
      }
    }

    // 3. SECCIÓN "Criterios de Éxito" obligatoria (h2 o h3) — única exigida.
    //    Match flexible: case-insensitive, con/sin tilde, con/sin numeración.
    if (!CRITERIA_HEADING_REGEX.test(contentToValidate)) {
      errors.push('Missing required section "Criterios de Éxito" (h2 or h3, case-insensitive, with or without accent).');
    } else {
      // 4. Conteo de checkboxes en la sección de criterios.
      const sectionMatch = contentToValidate.match(CRITERIA_SECTION_REGEX);
      if (sectionMatch) {
        const checkboxCount = (sectionMatch[1].match(/^\s*-\s*\[\s*[xX ]\s*\]/gm) || []).length;
        if (checkboxCount === 0) {
          errors.push('Section "Criterios de Éxito" found but contains zero checkboxes — at least one criterion is required.');
        } else if (checkboxCount < 3) {
          warnings.push(`Section "Criterios de Éxito" has ${checkboxCount} checkbox(es); recommended at least 3.`);
        }
      }
    }

    // 5. Sección "Lifecycle" recomendada (advisory). Detecta h2 o h3 con
    //    "Lifecycle" en cualquier parte del título (ej. "## 5. Lifecycle").
    const headings = contentToValidate.match(/^#{2,3}\s+.+$/gm) || [];
    const hasLifecycle = headings.some(h => /lifecycle/i.test(h));
    // Solo advisory si el doc es claramente largo (>40 líneas) — heurística simple
    // para evitar advisorios espurios en SIMPLE.
    const lineCount = contentToValidate.split(/\r?\n/).length;
    if (!hasLifecycle && lineCount > 40) {
      warnings.push('Section "Lifecycle" recommended for ESTÁNDAR/COMPLEJA/CRÍTICA tasks (advisory).');
    }

    // === Output ===

    if (errors.length > 0) {
      const reason =
        `Task doc structure invalid (${errors.length} error${errors.length === 1 ? '' : 's'}):\n- ` +
        errors.join('\n- ') +
        (warnings.length > 0 ? `\n\nAdditional warnings:\n- ` + warnings.join('\n- ') : '');
      blockExit('TASK_DOC_STRUCTURE_INVALID', reason);
    }

    if (warnings.length > 0) {
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          additionalContext:
            `TASK DOC ADVISORY (${warnings.length} formatting issue${warnings.length === 1 ? '' : 's'}):\n- ` +
            warnings.join('\n- ')
        }
      };
      process.stdout.write(JSON.stringify(output));
    }

    process.exit(0);
  } catch {
    // Silent fail — nunca bloquear
    process.exit(0);
  }
});

function blockExit(code, reason) {
  process.stdout.write(JSON.stringify({
    decision: 'block',
    code,
    reason
  }));
  process.exit(2);
}
