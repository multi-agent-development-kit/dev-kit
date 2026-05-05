# Multi-Agent Development Kit

> CLI + librería de templates para desarrollo asistido por agentes en múltiples IDEs. **Loco de nombre. Metódico por diseño.**

Este repo unifica:
- **Templates de Claude Code** en raíz directa (`agents/`, `commands/`, `skills/`, `hooks/`, `CLAUDE.md.template`) — clonar y desplegar.
- **Paquete Python `madkit`** (`src/madkit/`) — CLI distribuible vía `uvx` o `uv tool install`.

Una sola fuente de verdad. Cero sincronización entre repos.

---

## Instalación rápida (usuario final)

**Modo ágil — sin instalar nada:**

```bash
uvx madkit iniciar .
```

**Modo recurrente — instala una vez:**

```bash
uv tool install madkit
madkit iniciar .
```

Requiere [`uv`](https://docs.astral.sh/uv/) y Python ≥3.11.

---

## Instalación desde fuente (desarrollador)

```bash
git clone https://github.com/multi-agent-development-kit/dev-kit.git
cd madkit
pip install -e ".[dev]"
madkit iniciar /tmp/test-proyecto
```

En modo desarrollo `madkit` lee los templates de Claude directamente desde la raíz del repo (sin necesidad de re-build del wheel cada vez que tocas `agents/`, `skills/`, etc.). Al construir el wheel los templates se copian a `madkit/templates/claude/` para que `importlib.resources` los encuentre en producción.

---

## Comandos del CLI

| Comando | Alias EN | Para qué |
|---|---|---|
| `madkit iniciar [path]` | `init` | Bootstrap mecánico: `ai_docs/`, `CLAUDE.md`, scaffolding del IDE elegido |
| `madkit sincronizar [path]` | `sync` | Pull de templates upstream + V1-V8 + report |
| `madkit doctor [path]` | — | Validación + tabla de features degradados |
| `madkit estado [path]` | `status` | Snapshot del proyecto |
| `madkit listar-ides` | `list-ides` | Tabla de compatibilidad por IDE |

Idioma por defecto: español. `--lang EN` o `MADKIT_LANG=en` cambia a inglés.

---

## Estructura del repo

```
Multi-Agent Development Kit/
├── agents/                    # 8 subagents Claude Code (fuente canónica)
├── commands/                  # 14 slash commands de planificación por stack
├── skills/                    # 27 skills auto-activables
├── hooks/                     # 5 hooks deployables opt-in (+ tests/)
├── CLAUDE.md.template         # Base CLAUDE.md para proyectos destino (5 secciones transversales)
│
├── src/madkit/                # Paquete Python (CLI)
│   ├── cli.py                 # Entry point (typer)
│   ├── commands/              # iniciar, sincronizar, doctor, estado, listar-ides
│   ├── adapters/              # 6 adapters multi-IDE (Claude/Cursor/Codex/Cline/Continue/Windsurf)
│   ├── embeds.py              # Resolución de templates (dev vs wheel)
│   ├── i18n.py                # ES/EN
│   ├── validators/            # V1-V8 de sincronización
│   └── templates/             # Scaffolds non-Claude IDE (Cursor, Codex, Cline, Continue, Windsurf)
│
├── tests/                     # Tests pytest del paquete (8 archivos)
├── scripts/                   # generate_adapters.py
├── docs/                      # CI_SETUP.md y otros
├── .cursor/rules/             # Reglas Cursor IDE (44 + sub)
│
├── pyproject.toml             # Paquete madkit + force-include de templates Claude raíz al wheel
├── package.json               # Scripts npm pass-through (test, lint, build)
└── README.md
```

---

## Compatibilidad por IDE

| Feature | Claude Code | Cursor | Codex / AGENTS.md | Cline | Continue | Windsurf |
|---|---|---|---|---|---|---|
| Skills, subagents, `context: fork`, hooks | Native | Documentadas como contexto | Listadas en AGENTS.md | Documentadas en `.clinerules` | Listadas en `systemMessage` | Documentadas en `.windsurfrules` |
| Reglas técnicas linting | No usadas | Native (31 reglas) | No aplica | No aplica | No aplica | No aplica |
| Task docs `ai_docs/tasks/` | Native | Universal markdown | Universal | Universal | Universal | Universal |

**Claude Code es la experiencia óptima por diseño.** Los demás IDEs reciben adapters con degradación documentada — no se intenta paridad imposible.

**Requisitos por IDE:**
- Claude Code: 2026+ para hooks (`PreToolUse`, `PostToolUse`, `SessionStart`).
- Cursor / Cline / Continue / Windsurf: cualquier versión moderna que consuma su archivo de scaffolding nativo.
- Codex / GitHub Copilot: cualquier versión que consuma `AGENTS.md`.

---

## Cómo funciona

1. `madkit iniciar` crea la estructura mecánica del proyecto sin necesidad de LLM.
2. Tu IDE preferido (Claude Code recomendado) toma el control para análisis profundo.
3. `madkit sincronizar` mantiene los templates al día con releases publicadas.

---

## Memoria persistente — continuidad inter-sesión

**El diferenciador real del framework.** Mientras que la mayoría de frameworks de agentes (spec-kit, agent-os, etc.) arrancan cada sesión limpia y exigen al usuario re-explicar el contexto, este framework retoma exactamente donde se quedó la sesión anterior — sin gastar contexto del modelo en resumir.

### El loop completo

```
Sesión activa                        Sesión nueva
─────────────                        ────────────
tool use ──► context-monitor                      ┌──► session-state (SessionStart)
              hook (PostToolUse)                  │     hook lee head 20 líneas
              │                                   │     e inyecta como
              │ contexto restante                 │     additionalContext
              ▼                                   │
         ≤10% restante?                           │
              │                                   │
              │ sí                                │
              ▼                                   │
       ai_docs/STATE.md ◄────────────────────────┘
       (breadcrumb con
        active_task, phase,
        last_action,
        timestamp, session_id)
```

El usuario no toca nada. El agente de la nueva sesión despierta orientado: sabe qué tarea estaba activa, en qué fase iba, qué fue lo último que hizo. **Cero re-onboarding.**

### Cuatro lugares de memoria, cada uno con su rol

| Pieza | Vida | Quién escribe | Quién lee |
|---|---|---|---|
| `ai_docs/STATE.md` | sesiones consecutivas (breadcrumb) | `context-monitor.js` cuando contexto ≤10% | `session-state.sh` (SessionStart) + `task-planner` Paso 0 |
| `MEMORY.md` (harness) | persistente cross-conversación | Claude Code automáticamente | Claude Code en cada turno |
| `ai_docs/core/*.md` | persistente cross-conversación, evoluciona con el proyecto | Tú + `doc-syncer` agent | `task-planner` Paso 0 + agentes que lo necesiten |
| Task docs `ai_docs/tasks/NNN_*.md` | un archivo por cambio del proyecto | `task-planner` agent | El que retome la tarea |

### Comparación con spec-kit

| Aspecto | spec-kit | Multi-Agent Development Kit |
|---|---|---|
| Continuidad inter-sesión | Cada sesión limpia | Loop completo: STATE.md + session-state hook |
| Memoria semántica del agente | No | `MEMORY.md` harness-managed (preferencias, feedback, contexto del usuario) |
| Núcleo persistente del proyecto | `specs/<branch>/` por feature | `ai_docs/core/` evoluciona como vista viva del proyecto |
| Re-orientación tras context exhaustion | Manual por el usuario | Automática vía breadcrumb |

### Requisito

Claude Code **2026+** (necesario para los hooks `PostToolUse` y `SessionStart`). Los demás IDEs reciben los templates pero el loop de memoria es exclusivo de Claude Code por dependencia de hooks. Ver `hooks/README.md` para detalles de instalación opt-in.

---

## Comandos de desarrollo

```bash
npm test           # tests unitarios de los 5 hooks (Node ≥20, cero deps)
npm run test:py    # tests del paquete Python (pytest)
npm run lint:py    # ruff check
npm run build      # build del wheel
```

---

## Filosofía: 4 Principios de Ingeniería

Todo agente desplegado por este framework hereda estos principios (declarados en `CLAUDE.md.template`):

1. **Don't assume. Don't hide confusion. Surface tradeoffs.**
2. **Minimum code that solves the problem. Nothing speculative.**
3. **Touch only what you must. Clean up only your own mess.**
4. **Define success criteria. Loop until verified.**

---

## Enlaces

- Issues: https://github.com/multi-agent-development-kit/dev-kit/issues
- Discussions: https://github.com/multi-agent-development-kit/dev-kit/discussions
- Changelog: [CHANGELOG.md](CHANGELOG.md)
- Cómo contribuir: [CONTRIBUTING.md](CONTRIBUTING.md)

---

## Licencia

MIT. Ver [LICENSE](LICENSE).
