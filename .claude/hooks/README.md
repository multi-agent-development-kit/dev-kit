# Hooks deployables

Hooks instalables opcionalmente en proyectos destino para reforzar tres ejes: visibilidad de contexto, defense-in-depth contra inyecciones, y validación mecánica de artefactos del proyecto. Son **complementarios** a las skills y subagents — no los reemplazan.

Los hooks son **opt-in**: por defecto un proyecto destino no instala ninguno. `setup_project` los ofrece como bloque interactivo. Cada hook revisa `.claude/hooks/config.json` antes de activarse y termina silenciosamente si su flag es `false` o ausente.

---

## Inventario (5 hooks)

| Hook | Trigger | Acción | Opt-in flag | Severidad |
|---|---|---|---|---|
| `context-monitor.js` | PostToolUse | Inyecta WARN ≤35% restante / CRITICAL ≤25% / breadcrumb a `ai_docs/STATE.md` ≤10% | `context_monitor: true` | Advisory |
| `prompt-guard.js` | PreToolUse en Read/Write/Edit a `ai_docs/` | Detecta 14 patrones de inyección + Unicode invisible | `prompt_guard.mode: "advisory"\|"block"` | Advisory por defecto |
| `scaffolding-guard.sh` / `.ps1` | PreToolUse en Bash `git commit` | Bloquea commits con archivos en `ai_docs/.claude/.cursor/` o mensaje no conforme a `<type>: <subject>` (tipos canónicos `create\|optimize\|update\|fix\|refactor` de CLAUDE.md §3.4) | `scaffolding_guard: true` | Bloqueante |
| `task-doc-validator.js` | PreToolUse en Write/Edit a `ai_docs/tasks/*.md` | Valida numeración, presencia de "Criterios de Éxito" (h2 o h3) con ≥3 checkboxes, y `Depende de:` bien formado si presente. Cabeceras `Estado`/`Fecha`/`Complejidad`/`Alcance` opcionales — solo validadas cuando presentes. | `task_doc_validator: true` | Bloqueante (estructura) + Advisory (formato menor) |
| `session-state.sh` / `.ps1` (T081) | SessionStart | Si `ai_docs/STATE.md` existe, lee head 20 líneas e inyecta como `additionalContext` para reorientar al agente sin gastar contexto. Cierra el loop con `context-monitor` (que escribe STATE.md ≤10%) | `session_state: true` | Advisory |

### Defense-in-depth con skills

- **`scaffolding-guard` + skill `commit`**: el hook bloquea mecánicamente (paths + format de mensaje), los textos del Paso 1 de `commit/SKILL.md` educan al agent. Coexisten. Si el proyecto NO instala el hook, los textos de la skill son la única defensa.
- **`task-doc-validator` + skill `plan-checker`** (T078): el hook valida ESTRUCTURA mecánica del task doc al guardar; la skill valida SEMÁNTICA del plan tras guardar. Capas distintas, cero solapamiento.
- **`context-monitor` + `session-state`** (T081): loop completo de continuidad — el primero ESCRIBE STATE.md cuando contexto baja al 10%; el segundo lo LEE al iniciar la siguiente sesión e inyecta el head al system prompt. Sin `session-state`, STATE.md queda dormido hasta que el usuario o `task-planner` Paso 0 lo abren.

---

## Instalación manual

1. **Copiar los hooks deseados al proyecto destino:**

   ```bash
   # POSIX (Linux/macOS)
   cp hooks/*.{js,sh} <proyecto>/.claude/hooks/
   cp hooks/config.example.json <proyecto>/.claude/hooks/config.json

   # PowerShell (Windows)
   New-Item -ItemType Directory -Force <proyecto>\.claude\hooks
   Copy-Item hooks\*.js,*.sh,*.ps1 <proyecto>\.claude\hooks\
   Copy-Item hooks\config.example.json <proyecto>\.claude\hooks\config.json
   ```

2. **Editar `<proyecto>/.claude/hooks/config.json`** — activar las flags de los hooks deseados (ver §"Configuración" abajo).

3. **Editar `<proyecto>/.claude/settings.json`** — registrar los triggers:

   ```json
   {
     "hooks": {
       "PreToolUse": [
         {
           "matcher": "Write|Edit",
           "hooks": [{ "type": "command", "command": "node .claude/hooks/prompt-guard.js" }]
         },
         {
           "matcher": "Write|Edit",
           "hooks": [{ "type": "command", "command": "node .claude/hooks/task-doc-validator.js" }]
         },
         {
           "matcher": "Bash",
           "hooks": [{ "type": "command", "command": "bash .claude/hooks/scaffolding-guard.sh" }]
         }
       ],
       "PostToolUse": [
         {
           "matcher": "*",
           "hooks": [{ "type": "command", "command": "node .claude/hooks/context-monitor.js" }]
         }
       ],
       "SessionStart": [
         {
           "hooks": [{ "type": "command", "command": "bash .claude/hooks/session-state.sh" }]
         }
       ]
     }
   }
   ```

   En Windows reemplazar `bash .claude/hooks/scaffolding-guard.sh` por `pwsh -File .claude/hooks/scaffolding-guard.ps1` y `bash .claude/hooks/session-state.sh` por `pwsh -File .claude/hooks/session-state.ps1`.

---

## Configuración (`.claude/hooks/config.json`)

Esquema de flags por hook. Ver `config.example.json` para una plantilla completa.

```json
{
  "context_monitor": true,
  "prompt_guard": {
    "mode": "advisory"
  },
  "scaffolding_guard": true,
  "task_doc_validator": true,
  "session_state": true
}
```

| Flag | Tipo | Default si ausente | Efecto |
|---|---|---|---|
| `context_monitor` | bool | `false` | Activa el monitor de contexto y la escritura de `ai_docs/STATE.md` |
| `prompt_guard.mode` | `"advisory"` \| `"block"` | hook desactivado | `advisory` solo logea + nota al agent. `block` impide la operación |
| `scaffolding_guard` | bool | `false` | Activa el bloqueo de commits no conformes (paths y format de subject) |
| `task_doc_validator` | bool | `false` | Activa la validación estructural de task docs |
| `session_state` | bool | `false` | Activa la lectura de `ai_docs/STATE.md` al iniciar sesión y la inyección del head como `additionalContext` |

---

## Cómo desactivar uno sin borrarlo

Editar `.claude/hooks/config.json` y poner la flag correspondiente a `false` (o eliminarla). El hook seguirá registrado en `settings.json` pero terminará silenciosamente con `exit 0` al detectar la flag desactivada.

---

## Lifecycle de `ai_docs/STATE.md`

Introducido por `context-monitor` cuando el contexto restante baja al 10%:

| Acción | Quién | Cuándo |
|---|---|---|
| Crear/actualizar | `context-monitor.js` | `remaining_percentage <= 10` |
| **Leer al inicio** (T081) | `session-state.sh` / `.ps1` | SessionStart si flag `session_state: true` |
| Leer en sesión | `task-planner` (Paso 0) y `/status` | Inicio de sesión nueva, lectura tradicional |
| Limpiar | `git-guardian` | Al cerrar el último commit del task referido en `active_task:` |
| Huérfano (>7 días + task cerrado) | `/status` lo flagea, NO se borra automáticamente | Conscious decision para evitar pérdida silenciosa |

Estructura del STATE.md generado:

```markdown
---
active_task: NNN
phase: <fase actual del task doc>
last_action: <último Bash/Edit/Write capturado>
timestamp: <ISO 8601 UTC>
session_id: <session_id>
---

# Breadcrumb automático — context-monitor hook

Contexto agotado al 90%. Sesión cerrada en plena fase. Para retomar:
1. Lee `ai_docs/tasks/{NNN}_*.md`
2. Localiza la fase indicada arriba
3. Continúa desde el último step no completado
```

---

## Troubleshooting

- **Hook tarda más de lo esperado.** Cada hook tiene un timeout duro (3-10 s para Node con `setTimeout` que mata el proceso, 200 ms efectivos para Bash/PS). Si tarda más, exit silencioso → no rompe el flujo del agent.
- **Logs de debug.** Los hooks escriben mensajes a stderr (Claude Code los muestra en modo verbose). En operación normal no escriben nada.
- **Conflicto con git hooks pre-existentes.** `scaffolding-guard` se invoca como hook de Claude Code (PreToolUse Bash), no como `.git/hooks/pre-commit`. No interfiere con los hooks git del repo. Si quieres ambos, mantenerlos separados.
- **Falsos positivos de `prompt-guard` en task docs largos.** Modo `advisory` por defecto. Cambiar a `block` solo si tu proyecto recibe inputs externos (PRs de terceros, fetch de docs).
- **`task-doc-validator` bloquea un Edit pequeño.** Si el Edit toca la cabecera o un heading de sección obligatoria, el hook re-valida el archivo completo tras el cambio. Asegúrate de no romper la estructura. La única sección obligatoria desde v1.1.0 es "Criterios de Éxito" (h2 o h3).
- **`context-monitor` no escribe STATE.md.** Verifica que el bridge file `<tmpdir>/claude-ctx-{session_id}.json` existe — lo escribe el statusline de Claude Code, no este hook.
- **v1.1.0 (T089)**: relajadas validaciones que no coincidían con el formato real de task docs producidos por el framework. Cabeceras blockquote ya no obligatorias; secciones flexibles (h2 o h3); única sección obligatoria es Criterios de Éxito. Si dependes del comportamiento estricto v1.0.0, mantén la versión anterior.
- **v1.1.1**: fix de `CRITERIA_SECTION_REGEX` que solo capturaba la primera línea de la sección de criterios. El lookahead `\n*$` con flag `m` matcheaba cualquier fin-de-línea (no solo fin-de-string), y el lazy `[\s\S]*?` cerraba el grupo en el primer `\n` interno. Síntoma: warning falso "has 1 checkbox(es); recommended at least 3" en task docs con 5+ checkboxes. Ahora ancla a próximo heading h1/h2/h3 o fin-de-string real con `$(?![\s\S])`.

---

## Performance esperada

| Hook | p50 | p99 | Comentario |
|---|---|---|---|
| `context-monitor.js` | ~5 ms | ~50 ms | Lee bridge file pequeño; escribe STATE.md solo en CRITICAL |
| `prompt-guard.js` | ~10 ms | ~100 ms | Regex sobre el contenido + scan Unicode |
| `scaffolding-guard` (sh/ps1) | ~20 ms | ~150 ms | Spawn `git diff --cached --name-only` |
| `task-doc-validator.js` | ~15 ms | ~150 ms | Lee archivo, parsea regex de cabecera + secciones |
| `session-state` (sh/ps1) | ~10 ms | ~80 ms | Lee head 20 líneas de STATE.md y construye JSON |

---

## Tests

Los 5 hooks tienen tests unitarios cross-platform en `hooks/tests/`
(20 casos cubriendo happy paths y fallos intencionales). Correr `npm test` desde
ese directorio antes de modificar cualquier hook. CI puede invocar con un solo
comando: `cd hooks/tests && npm test`. Cero dependencias npm
externas — solo `node:test` y `node:assert` nativos (Node ≥20). Ver
`tests/README.md` para detalles de cobertura, limitaciones conocidas (git
requerido para scaffolding-guard, encoding UTF-8 forzado en pwsh) y cómo añadir
casos nuevos.

---

*Versión: 1.2.0 — Generado por task 077 (2026-05-04, 4 hooks iniciales), ampliado por task 081 (2026-05-05, 5º hook session-state) y task 089 (2026-05-05, alineación de `task-doc-validator` con el formato real de task docs, hook-version 1.0.0 → 1.1.0).*
