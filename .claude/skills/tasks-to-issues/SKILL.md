---
name: tasks-to-issues
description: "Convierte un task doc (ai_docs/tasks/NNN_*.md) en un issue de GitHub usando `gh`. Activar cuando el usuario pida 'crear issue desde tarea NNN', 'publicar el task doc como issue', 'abrir issue de la tarea X'. Idempotente: si el task doc ya tiene 'Issue: #N' en lifecycle, abre el existente en lugar de duplicar. Solo GitHub (`gh` CLI requerido)."
effort: low
allowed-tools: Bash, Read
---

# Skill — Task doc → GitHub issue

> **Rol:** Mapeo unidireccional task doc → issue. Operación mecánica: parsear el task doc, formatear el body siguiendo plantilla, invocar `gh issue create`. Idempotente vía detección de "Issue: #N" en lifecycle.

---

## Cuándo activar

Triggers explícitos del usuario:
- "Crea un issue desde la tarea 097"
- "Publica el task doc 097 como issue de GitHub"
- "Abre issue de la tarea X"
- "Sube el task doc al backlog del repo"

**No activar** sin petición explícita. Esta skill modifica estado externo (issue público) — `disable-model-invocation: true` no aplica porque queremos invocación, pero NUNCA proactivamente.

---

## Pre-validaciones

Antes de crear el issue, verificar:

1. **`gh` disponible y autenticado:**
   ```bash
   gh auth status 2>&1 | head -5
   ```
   Si falla → reportar al usuario y abortar.

2. **Repo tiene remoto GitHub:**
   ```bash
   gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>&1
   ```
   Si falla → reportar y abortar.

3. **Task doc existe:**
   - Path del task doc proporcionado por el usuario o inferido (ej. `097` → `ai_docs/tasks/097_*.md`).
   - Si el archivo no existe → reportar y abortar.

4. **Idempotencia — evitar duplicados:**
   - Leer la sección "Lifecycle" del task doc (suele ser `## 5. Lifecycle` o `## N. Lifecycle`).
   - Buscar línea con patrón `^- \*\*Issue:\*\* #(\d+)$` o similar.
   - Si encontrado → reportar al usuario "Issue ya existe: #X" + URL; preguntar si crear nuevo (forzado) o cancelar.
   - Si NO encontrado → continuar a creación.

---

## Algoritmo de extracción

Leer el task doc y mapear campos:

| Campo issue | Origen | Regex / heurística |
|---|---|---|
| Título issue | Título del task doc | `^# Tarea (\d{3}): (.+)$` → `[Tarea $1] $2` |
| Asunciones | Cabecera blockquote | `^>\s*\*\*Asunciones:\*\*\s*(.+)$` (multilínea con continuación) |
| Depende de | Cabecera blockquote | `^>\s*\*\*Depende de:\*\*\s*(.+)$` → split por coma → array de IDs |
| Resumen | Sección `## 1. Resumen` | Capturar entre `## 1. Resumen` y siguiente `## ` |
| Criterios de Éxito | Sub-sección `### Criterios de Éxito` | Capturar entre `### Criterios de Éxito` y siguiente `### ` o `## ` |
| Wiring | Sección `## N. Wiring esperado` (si existe) | Capturar entre el heading y siguiente `## ` |
| Complejidad | Buscar "Tarea SIMPLE" / "ESTÁNDAR" / "COMPLEJA" / "CRÍTICA" en sección de wiring/forecast | Match case-insensitive |

---

## Plantilla del body

```markdown
> **Asunciones:** {asunciones}
> **Source:** [`{path-relativo}`]({URL del task doc en GitHub si aplica})

{si depende_de no vacío:}
**Bloqueado por:** {lista formateada — buscar issues correspondientes con `gh issue list --search "[Tarea NNN]"` y enlazar como #X; si no existe, listar como `tarea NNN (sin issue)`}

## Resumen

{copiado de "## 1. Resumen" — sub-secciones Título + Objetivo + Alcance, manteniendo formato markdown original}

## Criterios de Éxito

{copiado tal cual con checkboxes preservados}

{si Wiring esperado existe:}

## Wiring esperado

{copiado tal cual}

---
*Issue creado automáticamente desde `{path-del-task-doc}` via skill `tasks-to-issues`. Cualquier cambio en el task doc no se sincroniza al issue automáticamente — actualizar manualmente si aplica.*
```

---

## Creación del issue

Construir el comando paso a paso:

```bash
# 1. Escribir body a archivo temp (más robusto que --body inline para multilínea):
BODY_FILE=$(mktemp -t issue-body-XXXXXX.md)
cat > "$BODY_FILE" <<'EOF'
{body completo según plantilla}
EOF

# 2. Determinar labels:
LABELS="--label task-doc"
if [[ -n "$COMPLEJIDAD" ]]; then
  LABELS="$LABELS --label complejidad-${COMPLEJIDAD,,}"  # lowercased
fi

# 3. Crear issue:
gh issue create \
  --title "[Tarea $TASK_ID] $TITULO" \
  --body-file "$BODY_FILE" \
  $LABELS

# 4. Limpiar:
rm -f "$BODY_FILE"
```

`gh issue create` retorna la URL del issue creado a stdout. Capturar y mostrar al usuario.

---

## Post-creación

1. Reportar al usuario:
   ```
   Issue creado: <URL>
   Recomendación: añade `- **Issue:** #<N>` a la sección Lifecycle del task doc para garantizar idempotencia futura.
   ```
2. NO modificar el task doc automáticamente. La línea "Issue: #N" la añade el usuario o `git-guardian` en su próximo commit (decisión consciente).

---

## Anti-patrones

| Anti-patrón | Por qué evitarlo |
|---|---|
| Crear issue sin pre-validar `gh auth` | Falla silenciosa o spam de errores. Validar antes. |
| Crear issue sin chequear idempotencia | Issues duplicados ensucian el backlog. Siempre buscar "Issue: #" en lifecycle primero. |
| Activar proactivamente al cerrar un task doc | Solo bajo petición explícita. La skill no decide cuándo publicar. |
| Mapear sin sanitizar el body | Si el task doc contiene secrets accidentalmente (variables de entorno, API keys mal pegadas), termina en issue público. Pre-validar con grep básico de patrones (`AWS_`, `SECRET_`, `TOKEN`, `API_KEY=`) y abortar si detectado. |
| Crear sin labels | Issues sin label son difíciles de filtrar en backlogs grandes. Mínimo: `task-doc`. |
| Sincronización bidireccional automática | No es esta skill. Si quieres mantener issue ↔ task doc en sync, eso es otra herramienta. Esta solo crea. |

---

## Sanitización mínima del body (P3 — touch only what you must)

Antes de invocar `gh issue create`, hacer un grep básico sobre el body construido:

```bash
if echo "$BODY" | grep -qiE 'AWS_(ACCESS|SECRET)|api[_-]?key\s*[:=]|token\s*[:=]|password\s*[:=]'; then
  echo "ABORT: posibles secrets detectados en el body. Revisa el task doc antes de publicar."
  exit 1
fi
```

False positives son aceptables — mejor abortar y pedir confirmación al usuario que publicar un secret.

---

## Encadenamiento

Esta skill **no encadena** a otras. Es un sink: produce un issue público y termina. El usuario decide qué hacer con el issue.

---

## Limitaciones conocidas

- **Solo GitHub.** GitLab/Bitbucket/Azure DevOps requerirían skills paralelas (no incluidas).
- **No actualiza el issue cuando el task doc cambia.** El usuario debe editarlo manualmente o cerrar+recrear si los cambios son grandes.
- **No crea milestones, projects ni assignees.** Solo el issue mínimo + labels básicos. Si se quieren más metadatos, el usuario los añade tras la creación.

---

*Versión: 1.0.0 | Creación: 2026-05-05 (task 098)*
