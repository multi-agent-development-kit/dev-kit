# Optimización y Validación de Templates

> **Objetivo:** Optimizar templates de codificación asistida por IA para reducir uso de tokens, eliminar redundancia y mejorar claridad preservando toda la información crítica y funcionalidad.

> **Por qué importa:** Templates verbosos, redundantes o mal estructurados desperdician tokens y dificultan que los agentes AI extraigan información relevante rápidamente. Templates limpios mejoran el rendimiento del agente y reducen costos de API.

> **CRÍTICO:** Cada optimización de template DEBE resultar en un documento de tarea en `ai_docs/tasks/` con el prefijo numérico apropiado. Los cambios deben ser quirúrgicos, precisos y mínimos.

---

## Inicio Rápido — Principios Clave

**Antes de comenzar CUALQUIER optimización, entender estos principios críticos:**

### 1. SIEMPRE Crear Documento de Tarea (NO NEGOCIABLE)
- Cada optimización requiere tarea en `ai_docs/tasks/{NNN}_optimize_{nombre_template}.md`
- Crear ANTES de hacer cualquier cambio
- Documentar antes/después, justificación, ahorro de tokens
- No es opcional — obligatorio para trazabilidad

### 2. Cambios Quirúrgicos Únicamente
- Cambios mínimos viables para lograr objetivos
- No reestructurar a menos que sea necesario
- Mantener funcionalidad del template idéntica
- Enfocarse en claridad y eficiencia, no en creatividad

### 3. Requisitos de Validación
- **Estructura preservada** — todas las secciones críticas mantenidas
- **Ejemplos funcionales** — ejemplos de código siguen siendo válidos
- **Referencias intactas** — links y referencias cruzadas funcionan
- **Instrucciones positivas** — "Qué hacer" sobre "Qué NO hacer"
- **Cero redundancia** — cada concepto establecido una vez, claramente

### 4. Enfoque de Calidad
**Los templates deben priorizar:**
1. **Qué hacer** — definición clara de la tarea
2. **Cómo hacerlo** — enfoque paso a paso
3. **Ejemplos** — ilustraciones concretas

**No:**
- Listas largas de restricciones
- Instrucciones repetidas
- Explicaciones verbosas
- Ejemplos innecesarios

### 5. Objetivos de Optimización
- Explicaciones verbosas → bullets concisos
- Múltiples ejemplos redundantes → 1-2 ejemplos clave
- Secciones repetidas → referencias cruzadas
- Prosa larga → tablas/formatos estructurados

**Seguir el proceso: Analizar → Documento de Tarea → Optimizar → Validar → Documentar**

---

## Paso 0: Descubrimiento del Proyecto

**Antes de CUALQUIER optimización, entender el ecosistema de templates:**

### A. Identificar Estructura de Templates

**Ubicaciones clave:**

| Ubicación | Contenido |
|-----------|-----------|
| `commands/` | 14 templates de planificación por stack |
| `skills/` | 29 workflows operacionales |
| `agents/` | 8 definiciones de agentes |

---

## Paso 0.5: Creación de Documento de Tarea (OBLIGATORIO)

**Cada optimización de template DEBE ser documentada.**

### A. Verificar Tarea Activa / Determinar Número

**Antes de crear nueva tarea, verificar si ya existe una para esta optimización.**
Si existe, ACTUALIZARLA en lugar de crear nueva.

**Si no existe tarea aplicable, detectar siguiente número:**
1. Listar todos los archivos en `ai_docs/tasks/`
2. Extraer prefijo de 3 dígitos de cada nombre
3. Encontrar el más alto, sumar 1, formatear como 3 dígitos
4. **Verificar que no existe archivo con ese número**

**REGLA: UN número de tarea = UN archivo. Nunca crear múltiples archivos con el mismo número.**

### B. Estructura del Documento de Tarea

**Secciones mínimas para tarea de optimización:**

```markdown
# Tarea {NNN}: Optimizar Template — {Nombre del Template}

## Objetivo
Breve descripción del alcance y objetivos de optimización.

## Template Objetivo
- Ubicación: [ruta al template]
- Tamaño actual: [líneas/KB]
- Reducción objetivo: [%]

## Problemas Identificados
| Prioridad | Tipo de Problema | Ubicación | Descripción |
|-----------|-----------------|-----------|-------------|
| Alta | Redundancia | Líneas 45-67 | Instrucciones repetidas |
| Media | Verbosidad | Líneas 123-156 | Se puede condensar a bullets |

## Cambios de Optimización

### Patrón 1: [Nombre del Patrón]
**ANTES:**
```markdown
[original verboso]
```

**DESPUÉS:**
```markdown
[optimizado conciso]
```

**Ahorro de Tokens:** ~N tokens

## Validación
- [ ] Estructura preservada
- [ ] Ejemplos funcionales
- [ ] Referencias intactas
- [ ] Sin pérdida de información
- [ ] Referencias cruzadas intactas

## Resultado
- Líneas reducidas: X → Y (Z% reducción)
- Ahorro de tokens: ~N tokens
- Información preservada: 100%
```

---

## Paso 1: Definición de Alcance

**¿Qué templates necesitan optimización?**
- [ ] **Template único**: [nombre y ruta]
- [ ] **Grupo de templates**: [templates relacionados]
- [ ] **Grupo de templates**: [templates relacionados]
- [ ] **Sistema completo**: todos los templates en [directorio específico]

**¿Por qué necesita optimización?**
- [ ] Uso excesivo de tokens (>5000 tokens)
- [ ] Instrucciones o ejemplos redundantes
- [ ] Explicaciones verbosas que se pueden condensar
- [ ] Información obsoleta que se puede eliminar
- [ ] Múltiples ejemplos cuando 1-2 serían suficientes

**Prioridad:**
- [ ] **Alta** — template muy grande (>10K tokens), uso frecuente
- [ ] **Media** — tamaño moderado (5-10K tokens), uso regular
- [ ] **Baja** — template pequeño (<5K tokens), uso ocasional

---

## Paso 2: Análisis del Template

### A. Leer y Entender el Template

**Para cada archivo de template:**

1. **Leer template completo:**
   - [ ] Entender propósito del template
   - [ ] Identificar todas las secciones
   - [ ] Anotar contenido crítico vs. opcional

2. **Medir estado actual:**
   - Contar líneas
   - Estimar tokens (~4 caracteres por token)

3. **Documentar estructura:**
   ```markdown
   Estructura del Template:
   - Introducción: [líneas X-Y]
   - Instrucciones: [líneas A-B]
   - Ejemplos: [líneas C-D]
   - Validación: [líneas E-F]
   ```

### B. Identificar Oportunidades de Optimización

**Verificar estos patrones:**
- [ ] Explicaciones verbosas que se pueden convertir a bullets
- [ ] Múltiples ejemplos similares
- [ ] Instrucciones repetidas en diferentes secciones
- [ ] Prosa larga que se puede convertir a tablas
- [ ] Advertencias o restricciones innecesarias
- [ ] Contenido obsoleto o irrelevante

---

## Paso 3: Patrones de Optimización

### Patrón 1: Explicaciones Verbosas → Bullets Concisos

**ANTES:**
```markdown
Esta sección explica cómo abordar la tarea. Deberías empezar leyendo
los requisitos cuidadosamente, asegurándote de entender lo que se pide.
Luego, deberías analizar el codebase para ver qué existe ya. Después,
puedes comenzar a planificar tu enfoque de implementación.
```

**DESPUÉS:**
```markdown
## Enfoque
1. Leer requisitos cuidadosamente
2. Analizar codebase existente
3. Planificar implementación
```

**Ahorro:** ~35 tokens

### Patrón 2: Múltiples Ejemplos → Ejemplos Clave

**ANTES:** 4+ ejemplos detallados para el mismo concepto
**DESPUÉS:** 1-2 ejemplos que cubran el caso común y el avanzado

**Ahorro:** ~200 tokens

### Patrón 3: Instrucciones Repetidas → Referencias Cruzadas

**ANTES:** Mismas instrucciones copiadas en múltiples secciones
**DESPUÉS:** Una sección de referencia + "Ver **Checklist de Validación**" en cada sección

**Ahorro:** ~45 tokens

### Patrón 4: Prosa Larga → Tablas

**ANTES:** Párrafos describiendo múltiples templates/herramientas
**DESPUÉS:** Tabla con columnas Nombre | Propósito | Cuándo Usar

**Ahorro:** ~25 tokens

### Patrón 5: Listas de Restricciones → Instrucciones Positivas

**ANTES:** Lista larga de "NO hacer esto"
**DESPUÉS:** Workflow positivo + "Puertas de calidad" con checkmarks

**Ahorro:** ~60 tokens

### Patrón 6: Consolidar Secciones Similares

**ANTES:** Dos secciones con instrucciones casi idénticas
**DESPUÉS:** Una sección unificada con sub-pasos para cada variante

**Ahorro:** ~30 tokens

---

## Paso 4: Proceso Sistemático de Optimización

### Fase 1: Analizar Template Actual

1. Medir baseline (líneas, palabras, tokens estimados)
2. Identificar secciones
3. Documentar redundancia

### Fase 2: Aplicar Optimizaciones

1. Aplicar patrones con la herramienta Edit para cambios precisos
2. Preservar estructura exacta donde sea necesario
3. Mantener formato de bloques de código
4. Verificar que no hay pérdida de información

### Fase 3: Validar Cambios

1. Verificar headers intactos
2. Verificar bloques de código balanceados (conteo par de ` ``` `)
3. Medir mejora (nueva cantidad de líneas/tokens)
4. Calcular reducción

---

## Paso 5: Checklist de Validación

### Validación Pre-Commit

**Antes de completar la optimización, TODOS deben pasar:**

**Integridad Estructural:**
- [ ] Todos los headers presentes
- [ ] Bloques de código balanceados
- [ ] Links funcionales
- [ ] Ejemplos válidos sintácticamente

**Calidad de Contenido:**
- [ ] Sin pérdida de información
- [ ] Ejemplos suficientes
- [ ] Instrucciones claras
- [ ] Sin ambigüedad

**Objetivos de Optimización:**
- [ ] Reducción de tokens lograda (típicamente 20-40%)
- [ ] Redundancia eliminada
- [ ] Verbosidad reducida
- [ ] Estructura mejorada si aplica

**Documentación:**
- [ ] Documento de tarea creado en `ai_docs/tasks/`
- [ ] Cambios documentados con antes/después
- [ ] Métricas de ahorro calculadas

---

## Paso 6: Documentación

### Crear Reporte de Optimización

**En el documento de tarea, incluir:**

```markdown
# Tarea {NNN}: Optimizar {Nombre del Template}

## Resumen
Optimizado {nombre_template} reduciendo uso de tokens en {X}% preservando toda la funcionalidad crítica.

## Métricas
- Líneas antes: X → Líneas después: Y (Z% reducción)
- Tokens estimados antes: ~A → después: ~B
- Ahorro: ~C tokens (D%)

## Cambios Aplicados
1. [Patrón]: [Descripción] — ~N tokens ahorrados
2. [Patrón]: [Descripción] — ~N tokens ahorrados

## Validación
- Estructura preservada
- Ejemplos funcionales
- Referencias intactas

## Archivos Modificados
- `{commands|skills|agents}/{nombre}.md`
```

---

## Objetivos Comunes de Optimización

### Optimizaciones de Alto Valor

1. **Templates grandes (>5000 tokens)** — máximo potencial de impacto
2. **Templates de uso frecuente** — los ahorros se multiplican con el uso
3. **Templates con redundancia** — múltiples ejemplos similares, secciones repetidas

### Optimizaciones de Bajo Valor

1. **Templates pequeños (<1000 tokens)** — potencial de ahorro limitado
2. **Templates de uso raro** — bajo impacto total
3. **Templates ya optimizados** — rendimientos decrecientes

---

## Estándares de Calidad

### Buena Optimización
- 20-40% de reducción de tokens lograda
- Toda la información crítica preservada
- Claridad mantenida o mejorada
- Estructura lógica y escaneable
### Mala Optimización
- Pérdida de información o ambigüedad
- Claridad sacrificada por brevedad
- Ejemplos eliminados completamente
- Instrucciones incomprensibles

---

## Principios de Referencia Rápida

1. **Preservar > Reducir** — nunca sacrificar información crítica
2. **Claridad > Brevedad** — no hacer templates incomprensibles
3. **Estructura > Flujo** — estructura escaneable supera prosa narrativa
4. **Ejemplos > Explicación** — mostrar, no decir (pero no demasiados)
5. **Positivo > Negativo** — "Hacer X" supera "No hacer Y, Z, A, B, C..."
6. **Una vez > Dos veces** — cada concepto establecido una vez, referenciado después

---

## Reglas

1. **Siempre crear documento de tarea** — antes de cualquier optimización
2. **Cambios quirúrgicos** — mínimo viable, no reestructurar innecesariamente
3. **Validar antes de commitear** — estructura, ejemplos, referencias
4. **Documentar métricas** — antes/después siempre en el documento de tarea
6. **Autoría** — el commit se firma con el usuario de git configurado (por defecto, Guillermo Montero). NO agregar Co-Authored-By
