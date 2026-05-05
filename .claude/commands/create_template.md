# Asistente de Creación de Templates

> Crear nuevos templates de codificación asistida por IA siguiendo patrones establecidos y convenciones. Asegura consistencia en todo el ecosistema de templates.

---

## Paso 0: Documento de Tarea (OBLIGATORIO)

**Antes de crear un nuevo template, verificar si ya existe una tarea para este trabajo.**
Si un documento de tarea activo aplica, ACTUALIZARLO en lugar de crear uno nuevo.

**Si no existe tarea aplicable, detectar siguiente número:**
1. Listar todos los archivos en `ai_docs/tasks/`
2. Extraer el prefijo de 3 dígitos de cada nombre de archivo
3. Encontrar el número más alto, sumar 1, formatear como 3 dígitos
4. **Verificar que no existe archivo con ese número**
5. Crear: `ai_docs/tasks/{NNN}_create_{nombre_template}.md`

**REGLA: UN número de tarea = UN archivo. Nunca crear múltiples archivos con el mismo número.**

---

## Paso 1: Definir Propósito del Template

**Responder estas preguntas:**

1. **¿Qué problema resuelve este template?**
   - Ejemplo: "Guiar tareas de desarrollo Python con mejores prácticas"

2. **¿Quién usará este template?**
   - Ejemplo: "Agentes AI trabajando en proyectos Python"

3. **¿Qué hace único a este template?**
   - Ejemplo: "Incluye workflows de UV package manager"

4. **¿A qué templates existentes se parece?**
   - Ejemplo: "Similar a task_template.md pero específico para Python"

---

## Paso 2: Elegir Tipo de Template

**Tipos disponibles:**

| Tipo | Propósito | Ejemplo |
|------|-----------|---------|
| **Template de Tarea** | Guía para tareas de desarrollo específicas | `task_template_python.md` |
| **Template de Workflow** | Guía de proceso o procedimiento | `commit.md` |
| **Template de Análisis** | Framework de análisis de código/proyecto | `cleanup.md` |
| **Template de Herramienta** | Guia de uso de herramienta especifica | `drizzle_migration_rollback.md` |

---

## Paso 3: Seleccionar Carpeta de Destino

**El template se ubicará en una de las 3 carpetas:**

| Carpeta | Ruta | Contenido | Cuándo Elegir |
|---------|------|-----------|---------------|
| **commands** | `commands/` | Templates de planificación por stack | Template para planificar tareas de un stack específico |
| **skills** | `skills/` | Workflows operacionales | Workflows que se usan como /slash commands |
| **agents** | `agents/` | Definiciones de agentes | Agentes especializados por tecnología |

**Presentar al usuario las opciones y confirmar la carpeta antes de proceder.**

---

## Paso 4: Seleccionar Template de Referencia

**Encontrar template similar para usar como base:**

1. Listar templates existentes en la carpeta elegida: `{commands|skills|agents}/`
2. Si no hay templates similares en la carpeta, buscar en otras carpetas
3. Elegir el template más similar como referencia

**Ejemplo:** ¿Creando template para Rust? Usar `task_template_python.md` como referencia.

---

## Paso 5: Definir Estructura

**Secciones estándar de un template:**

```markdown
# [Título del Template]

> Descripción breve del propósito

---

## 1. Introducción / Resumen
- Qué hace este template
- Cuándo usarlo
- Qué necesitas

## 2. Prerrequisitos / Configuración
- Herramientas requeridas
- Configuración del entorno
- Verificaciones iniciales

## 3. Proceso Principal / Workflow
- Instrucciones paso a paso
- Puntos de decisión
- Ejemplos

## 4. Validación / Verificaciones de Calidad
- Pasos de verificación
- Problemas comunes
- Solución de problemas

## 5. Ejemplos / Casos de Uso
- Ejemplos concretos
- Escenarios comunes
- Casos límite

## 6. Referencia Rápida / Comandos
- Referencia de comandos
- Checklists
- Recursos
```

---

## Paso 6: Crear el Template

**Escribir el template en español:**

1. Usar template de referencia como base
2. Adaptar secciones para el nuevo propósito
3. Agregar ejemplos específicos
4. Incluir comandos relevantes
5. Asegurar completitud

**Ubicación:** `{commands|skills|agents}/{nombre_descriptivo}.md`
**Convención de nombre:** `snake_case.md` (commands/skills) o `kebab-case.md` (agents)

---

## Paso 7: Validar Nuevo Template

**Checklist de calidad:**

### Estructura
- [ ] Propósito claramente establecido
- [ ] Estructura sigue convenciones
- [ ] Ejemplos proporcionados
- [ ] Bloques de código con etiqueta de lenguaje
- [ ] Headers balanceados (H1 una sola vez)
- [ ] Sin secciones vacías

### Contenido
- [ ] Instrucciones claras en modo imperativo
- [ ] Ejemplos concretos y funcionales
- [ ] Sin TODOs ni placeholders
- [ ] Sin texto de relleno

### Documentación
- [ ] Documento de tarea completado
- [ ] Listo para commit

---

## Patrones de Templates por Tipo

### Patrón: Template de Tarea

```markdown
# {Lenguaje/Framework} Task Template

> Guía para tareas de desarrollo {tipo específico}

## Protocolo Crítico
- Comportamientos obligatorios
- Reglas de seguridad

## Paso 0: Verificación
- Verificar entorno
- Validar prerrequisitos

## Paso 1: Análisis
- Entender requisitos
- Revisar código existente

## Paso 2: Planificación
- Diseñar enfoque
- Identificar impactos

## Paso 3: Implementación
- Cambios de código
- Testing

## Paso 4: Validación
- Verificaciones de calidad
- Revisión final

## Ejemplos
- Escenarios comunes
- Casos límite
```

### Patrón: Template de Workflow

```markdown
# {Nombre del Proceso} Workflow

> Guía para {proceso específico}

## Contexto y Misión
- Qué hace este workflow
- Cuándo usarlo

## Pasos del Proceso

### Paso 1 — {Acción}
- Instrucciones
- Validación

[Repetir para cada paso]

## Checklist de Calidad
- Puntos de validación
- Problemas comunes

## Referencia Rápida
- Resumen de comandos
- Árbol de decisión
```

### Patrón: Template de Análisis

```markdown
# Template de Análisis de {Tema}

> Framework para analizar {aspecto específico}

## Fase 1: Descubrimiento
- Qué buscar
- Cómo encontrarlo

## Fase 2: Análisis
- Criterios de evaluación
- Métricas a rastrear

## Fase 3: Reporte
- Formato de salida
- Recomendaciones

## Validación
- Verificación de completitud
- Verificación de precisión
```

---

## Guías de Contenido

### Escribir Instrucciones Claras

**HACER:**
- Usar modo imperativo ("Ejecutar el comando")
- Proporcionar ejemplos concretos
- Incluir salida esperada
- Explicar por qué, no solo qué
- Usar checklists para validación

**NO HACER:**
- Usar voz pasiva
- Asumir conocimiento previo
- Omitir ejemplos
- Sobrecargar con teoría
- Olvidar casos límite

### Mejores Prácticas de Bloques de Código

**Siempre especificar lenguaje:**
````markdown
```bash
git status
```

```python
def ejemplo():
    pass
```

```typescript
const ejemplo: string = "valor";
```
````

---

## Guía de Ubicación

| Tipo de Template | Ubicación |
|------------------|-----------|
| Templates de planificación | `commands/` |
| Workflows operacionales | `skills/` |
| Definiciones de agentes | `agents/` |
| Reglas Cursor | `.cursor/rules/` |

**Archivo a crear para cada template nuevo:**
```
{commands|skills|agents}/{nombre}.md
```

---

## Finalización

### Antes de Commitear

- [ ] Template creado en español
- [ ] Estructura validada
- [ ] Ejemplos probados
- [ ] Carpeta correcta seleccionada
- [ ] Documento de tarea completado
- [ ] Listo para revisión

### Mensaje de Commit

```bash
git add {commands|skills|agents}/{nombre}.md

git commit -m "$(cat <<'EOF'
create: agregar template de {descripción}

- Creado template para {propósito}
- Incluye {características clave}
- Basado en {template_referencia}
EOF
)"
```

---

## Reglas

1. **Siempre crear documento de tarea** — antes de escribir el template
2. **Validar antes de commitear** — estructura, contenido
3. **Seleccionar carpeta correcta** — commands, skills o agents
4. **Un template nuevo = 1 archivo** — en la carpeta correspondiente
