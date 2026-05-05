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
git clone https://github.com/multi-agent-development-kit/madkit.git
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

- Issues: https://github.com/multi-agent-development-kit/madkit/issues
- Discussions: https://github.com/multi-agent-development-kit/madkit/discussions
- Changelog: [CHANGELOG.md](CHANGELOG.md)
- Cómo contribuir: [CONTRIBUTING.md](CONTRIBUTING.md)

---

## Licencia

MIT. Ver [LICENSE](LICENSE).
