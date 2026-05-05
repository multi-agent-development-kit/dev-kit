# Tests unitarios de los 5 hooks deployables

Red de seguridad mecánica para los hooks de `hooks/`. Sin
dependencias externas — solo `node:test` y `node:assert` nativos (Node ≥20).

## Cómo correr

```bash
cd hooks/tests
npm test
```

Salida esperada: 20 tests pasan en ≤6 s. El test runner es `node --test` con
reporter `spec`.

## Cobertura por hook

| Hook | Test file | Casos |
|---|---|---|
| `task-doc-validator.js` | `task-doc-validator.test.js` | 6 (T087 real pasa, filename inválido bloquea, sin Criterios bloquea, dep inexistente bloquea, h3 detectado, flag false silencioso) |
| `context-monitor.js` | `context-monitor.test.js` | 4 (sin config silencioso, flag false silencioso, 50% sin inyección, 8% escribe STATE.md + BREADCRUMB) |
| `prompt-guard.js` | `prompt-guard.test.js` | 3 (limpio pasa, advisory emite WARNING, block emite exit 2) |
| `scaffolding-guard.{sh,ps1}` | `scaffolding-guard.test.js` | 4 (src/ pasa, ai_docs/ bloquea, tipo no canónico bloquea, subject >72 chars bloquea) |
| `session-state.{sh,ps1}` | `session-state.test.js` | 3 (flag false silencioso, sin STATE.md emite "sesión limpia", con STATE.md inyecta active_task) |

**Total: 20 tests.**

## Cómo invocar desde CI

Una sola línea cubre todo:

```bash
cd hooks/tests && npm test
```

Exit 0 si todo pasa, exit 1 si algún test falla. No requiere `npm install`
porque no hay dependencias externas.

Ejemplo workflow GitHub Actions:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
- run: cd hooks/tests && npm test
```

En Windows runners `pwsh` (PowerShell 7+) viene preinstalado; en otros sistemas
no se necesita PowerShell — los tests detectan la plataforma vía
`process.platform` y eligen `bash` o `pwsh`.

## Estructura

```
tests/
├── helper.js                       # invokeJsHook, invokeShellHook, makeTmpProject
├── fixtures/
│   ├── valid-task-doc.md           # task doc bien formado (h3 + 4 checkboxes)
│   └── missing-criteria.md         # sin sección "Criterios de Éxito"
├── task-doc-validator.test.js
├── context-monitor.test.js
├── prompt-guard.test.js
├── scaffolding-guard.test.js
├── session-state.test.js
├── package.json
└── README.md
```

## Limitaciones conocidas

- **scaffolding-guard requiere `git`.** Los tests inicializan un repo en cada
  fixture (`git init`, commit inicial, identidad local). Si `git` no está en
  PATH, los tests de scaffolding-guard fallarán.
- **PowerShell encoding en Windows.** El helper fuerza `[Console]::OutputEncoding
  = UTF8` antes de ejecutar `.ps1`. Sin esto, el em-dash y tildes en los hooks
  PS1 se serializaban en CP1252 y rompían `JSON.parse` del output. Esta
  precaución es **solo para los tests** — en producción Claude Code lee stdout
  como bytes UTF-8 y no se ve afectado.
- **No se cubre el helper recursivamente.** No hay tests del helper en sí
  (declarado fuera de alcance en task 090).

## Cómo añadir un caso nuevo

1. Localiza el `*.test.js` del hook a cubrir.
2. Añade un nuevo `test('...', () => { ... })` siguiendo el patrón de los casos
   existentes: usa `makeTmpProject({ __config__: { ... } })` para sembrar
   `.claude/hooks/config.json`, invoca el hook con `invokeJsHook` o
   `invokeShellHook`, y assertea sobre `exitCode` + `stdout`.
3. Si el caso requiere un fixture nuevo, añádelo a `fixtures/` y léelo con
   `readFileSync`.
