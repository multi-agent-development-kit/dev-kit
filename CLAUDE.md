# CLAUDE.md — Multi-Agent Development Kit (repo)

> Configuración del repo `multi-agent-development-kit/dev-kit`. **Dogfooding:** este repo desarrolla el framework usando los propios agents/skills/hooks del framework.

---

## Proyecto

- **Nombre:** Multi-Agent Development Kit (paquete PyPI: `madkit`)
- **Stack:** Python ≥3.11 (paquete CLI) + Node ≥20 (tests de hooks)
- **Framework:** typer (CLI) + hatchling (build) + node:test (testing JS)
- **Gestor de paquetes:** uv (Python) / npm (Node, sin deps externas)
- **Naturaleza:** **meta-framework** — produce templates que se distribuyen a proyectos destino. NO un proyecto de software cliente.

---

## Estilo de respuesta

- Frases declarativas. Sin preámbulo.
- No reformular la pregunta.
- Bullets cuando enumerable. Tablas solo si ≥3 filas y ≥2 columnas comparables.
- Comentarios en código solo cuando el *por qué* no es obvio.
- Tono compacto: el framework predica disciplina — el repo del framework debe ejemplificarla.

---

## Principios de Ingeniería

Cuatro reglas mentales que aplican a TODA interacción de código en este proyecto. Cada subagente las hereda.

1. **Don't assume. Don't hide confusion. Surface tradeoffs.**
2. **Minimum code that solves the problem. Nothing speculative.**
3. **Touch only what you must. Clean up only your own mess.**
4. **Define success criteria. Loop until verified.**

> **Cómo usan los subagents este bloque:** `task-planner` aplica P1 y P4; `implementer` aplica P2 y P3; `reviewer` los usa los cuatro como BLOCKING adicional; `plan-checker` los toma como ancla canónica de sus 6 dimensiones (D1→P4, D2→P2+P1, D3→P2+P3, D4→P3, D5→P1+P3, D6→P4).

---

## Estructura del repo (CANÓNICA — meta-framework)

A diferencia de proyectos consumidores (donde `.claude/` y templates viven separados), aquí los templates de producción viven en raíz directa Y se duplican en `.claude/` para dogfooding:

```
Multi-Agent Development Kit/
├── agents/          ← FUENTE CANÓNICA (8 subagents)
├── commands/        ← FUENTE CANÓNICA (14 slash commands de planificación)
├── skills/          ← FUENTE CANÓNICA (29 skills auto-activables)
├── hooks/           ← FUENTE CANÓNICA (5 hooks + tests/)
├── CLAUDE.md.template ← FUENTE CANÓNICA (template para proyectos destino)
│
├── .claude/         ← DOGFOODING (copia adaptada para uso en este repo)
│   ├── agents/      → copia de agents/ raíz
│   ├── skills/      → copia de skills/ raíz
│   ├── hooks/       → copia de hooks/ raíz (sin tests/) + config.json activo
│   ├── commands/    → 4 meta-commands (status, review, create_template, optimize_template)
│   ├── settings.json → registro de hooks activos
│   └── hooks/config.json → flags activadas (dogfooding completo)
│
├── src/madkit/      ← paquete Python (CLI)
├── tests/           ← pytest del paquete
├── ai_docs/         ← gitignored (tracking interno)
│   ├── core/        ← documentación viva del repo
│   ├── tasks/       ← task docs numerados NNN_*.md
│   └── refs/        ← referencias externas
│
├── pyproject.toml, package.json, README.md, CHANGELOG.md, ...
└── docs/, scripts/, .cursor/rules/
```

**Regla crítica del dogfooding:** la fuente canónica son los directorios raíz (`agents/`, `skills/`, etc.). `.claude/` es una **copia adaptada para uso interno**. Cuando modificas un template en raíz, también debes propagarlo a `.claude/` (o usar `madkit iniciar . --ide=claude` que lo hace por ti).

---

## Modelo por perfil de trabajo

| Agent | Modelo | Effort | Rol en este repo |
|---|---|---|---|
| `task-planner` | opus | xhigh | Triaje de cambios al framework, planificación de tasks NNN |
| `reviewer` | opus | xhigh | Review correlacionado de PRs antes de merge |
| `adk` | opus | xhigh | (raramente usado — no hay código ADK en este meta-repo) |
| `implementer` | sonnet | high | Ejecución de cambios mecánicos sobre templates/código |
| `doc-syncer` | sonnet | high | Sincronización de `ai_docs/core/` con cambios reales |
| `researcher` | sonnet | xhigh | Análisis exhaustivo de impacto antes de cambios CRÍTICA |
| `orientador` | sonnet | medium | (no aplica — es para usuarios no técnicos en proyectos destino) |
| `git-guardian` | haiku | low | Commits + PRs hacia el remoto público dev-kit |

---

## Cuándo delegar a subagentes

Misma matriz que en proyectos destino, con énfasis en lo que aplica al meta-framework:

- **Cambio en un template:** `task-planner` → `implementer` → `reviewer` → `doc-syncer` → `git-guardian`.
- **Bug en un hook:** `bugfix` skill (sin fork, contextual) → `reviewer` → `git-guardian`.
- **Nuevo agent o skill:** usa `/create_template` (meta-command preservado) que orquesta el setup.
- **Auditoría de calidad del repo:** `/review` (meta-command que opera sobre todo el repo, distinto del `reviewer` agent que es post-impl de cambios).

---

## Convenciones del proyecto

- **Imports Python:** absolutos desde `madkit` (ej. `from madkit.adapters.base import IntegrationBase`).
- **Naming task docs:** `NNN_descripcion_snake_case.md` (Python convention — el repo es mayormente Python).
- **Commits:** formato `<type>: <subject>` con tipos canónicos `create | optimize | update | fix | refactor` (validado por `scaffolding-guard.sh`).
- **Branches:** `main` directa para cambios pequeños/quirúrgicos; `feat/` para cambios estructurales que merecen PR.

---

## Comandos frecuentes

| Acción | Comando |
|---|---|
| Tests JS (hooks) | `cd hooks/tests && npm test` |
| Tests Python (paquete) | `pytest tests/ -m "not slow"` |
| Lint Python | `ruff check src/ tests/` |
| Build wheel | `python -m build` |
| Smoke test | `madkit iniciar /tmp/test --ide=claude` (instalado vía `pip install -e .`) |
| Sincronizar dogfooding `.claude/` | `madkit iniciar . --ide=claude --force` (cuando modifiques agents/skills/hooks raíz) |

---

## Prohibiciones del proyecto

- **NUNCA modificar `.claude/agents/`, `.claude/skills/`, `.claude/hooks/` directamente** — son copia. Modificar la fuente raíz y propagar.
- **NUNCA añadir `model:` directo en frontmatter de skill** — usar `context: fork` + `agent:` (regla del framework, validada por hooks).
- **NUNCA fragmentar `reviewer` por áreas funcionales** — pierde correlaciones.
- **NUNCA bumpear versión del paquete sin actualizar CHANGELOG.md.**
- **NUNCA pushear `ai_docs/` a git** — gitignored siempre.
- **NUNCA borrar task docs cerrados** — son histórico del proyecto.

---

*Última verificación de doc oficial Claude Code: 2026-05-03 (sub-agents.md, skills.md, model-config.md).*
