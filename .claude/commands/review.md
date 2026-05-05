# Revisión de Templates

> Comando unificado de validación. Cubre salud de markdown, checklist de calidad, integridad de referencias cruzadas e inventario. Ejecutar con un enfoque específico o como escaneo completo.

---

## Paso 1: Determinar Alcance

Según la solicitud del usuario, seleccionar el enfoque apropiado:

| El Usuario Dice | Enfoque | Secciones a Ejecutar |
|-----------------|---------|----------------------|
| "revisar", "verificar todo" | Revisión completa | Todas las secciones (2-6) |
| "salud", "markdown roto" | Salud de markdown | Sección 2 únicamente |
| "calidad", "revisar cambios" | Calidad de cambios | Sección 3 únicamente |
| "auditar", "consistencia", "nombres" | Auditoría de consistencia | Sección 4 únicamente |
| "inventario", "cuántos templates" | Conteo de inventario | Sección 5 únicamente |

Por defecto: **Revisión completa** si no se solicita enfoque específico.

---

## Paso 2: Salud de Markdown

Para cada template en alcance, verificar:

### Balance de Bloques de Código
- Contar marcadores ` ``` `. Conteo impar = **FALLO** (bloque desbalanceado).

### Jerarquía de Headers
- `#` (H1) debe aparecer exactamente una vez.
- Sin saltos de nivel (`#` → `###` sin `##`).
- Sin headers H2 duplicados.

### Secciones Vacías
- Headers seguidos inmediatamente por otro header = sección vacía. **ADVERTENCIA**.

### Marcadores Obsoletos
- Buscar `TODO`, `FIXME`, `TBD`, `PLACEHOLDER`, `CHANGE_ME`. **ADVERTENCIA** si se encuentran.

### Reporte de Salud

```markdown
## Salud de Markdown

| Archivo | Bloques | Headers | Secciones Vacías | Marcadores | Estado |
|---------|---------|---------|-----------------|------------|--------|
| task_template.md | OK | OK | 0 | 0 | APROBADO |
| bugfix.md | FALLO(7) | OK | 1 | 0 | FALLO |
```

---

## Paso 3: Calidad de Cambios

### Checklist Pre-Commit

Para todos los templates modificados (vía `git status`):

**Estructura:**
- [ ] Todos los headers de secciones críticas preservados
- [ ] Bloques de código balanceados y con etiqueta de lenguaje
- [ ] Links y referencias válidos
- [ ] Ejemplos sintácticamente correctos

**Contenido:**
- [ ] Sin información perdida
- [ ] Texto condensado sigue siendo claro
- [ ] Ejemplos suficientes para comprensión

---

## Paso 4: Auditoría de Consistencia

### Nomenclatura de Archivos

| Ubicación | Convención Esperada |
|-----------|---------------------|
| `commands/` | `snake_case.md` — templates de planificación por stack |
| `skills/` | `snake_case.md` — workflows operacionales |
| `agents/` | `kebab-case.md` — definiciones de agentes |
| `.cursor/rules/` | `domain-specific-rule.mdc` |

### Referencias Cruzadas

Escanear `.claude/commands/*.md` y `.claude/agents/*.md` para referencias a rutas de archivos. Verificar que cada ruta referenciada existe. Marcar referencias rotas.

**Rutas que NO deben existir (obsoletas):**
- `claude-en/` o `claude-es/` → eliminados
- `EN/` o `ES/` → ahora es `{commands|skills|agents}/`
- `agents/EN/` o `agents/ES/` → ahora es `agents/`
- `ai_docs/dev_templates/` → eliminado
- `ai_docs/prep_templates/` → eliminado
- `ai_docs/prep/` → renombrado a `ai_docs/core/`
- Archivos con sufijo `_es.md` → obsoleto

### Reporte de Consistencia

```markdown
## Auditoría de Consistencia

| Verificación | Estado | Problemas |
|-------------|--------|-----------|
| Nomenclatura | APROBADO/ADVERTENCIA | N violaciones |
| Referencias cruzadas | APROBADO/FALLO | N rotas |
| Rutas obsoletas | APROBADO/FALLO | N encontradas |
```

---

## Paso 5: Resumen de Inventario

Conteo rápido de todas las ubicaciones de templates:

```markdown
## Inventario de Templates

| Ubicación | Cantidad | Descripción |
|-----------|----------|-------------|
| `commands/` | N | Templates de planificación por stack |
| `skills/` | N | Workflows operacionales |
| `agents/` | N | Definiciones de agentes |
| **Total Templates** | **N** | |
| `.cursor/rules/` | N | Reglas Cursor IDE |
| `.claude/commands/` | N | Meta-comandos |
| **GRAN TOTAL** | **N** | |

### Top 5 Más Grandes
| Template | Líneas | Ubicación |
|----------|--------|-----------|
```

---

## Paso 6: Resumen Final

Después de ejecutar todas las secciones aplicables, presentar:

```markdown
## Resumen de Revisión

| Área | Estado |
|------|--------|
| Salud Markdown | APROBADO / FALLO (N problemas) |
| Calidad de Cambios | APROBADO / NECESITA CORRECCIONES |
| Consistencia | APROBADO / ADVERTENCIA (N problemas) |

### Acciones Requeridas
1. [correcciones específicas necesarias]

### General: [LISTO PARA COMMIT / NECESITA ATENCIÓN / PROBLEMAS CRÍTICOS]
```

---

## Reglas

1. **Solo lectura por defecto** — este comando analiza pero no modifica archivos
2. **Rutas correctas** — siempre usar `{commands|skills|agents}/`
3. **Marcar rutas obsoletas** — `claude-en/`, `claude-es/`, `EN/`, `ES/`, `agents/EN/`, `agents/ES/`, `dev_templates`, `prep_templates`, `ai_docs/prep/`
4. **Revisar las 3 carpetas** — desglosar por commands, skills, agents
