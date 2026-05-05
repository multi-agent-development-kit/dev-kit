---
name: clarify
description: "Skill de clarificación previa a la planificación. Activar cuando una petición del usuario tenga ambigüedad estructural: alcance vago ('mejora X', 'que sea robusto'), tradeoffs implícitos (múltiples interpretaciones legítimas), criterios de éxito sin definir, o dependencias asumidas ('como el otro proyecto'). Produce 3-5 preguntas concretas con opciones A/B/C; tras respuestas, encadena a task-planner. NO usar para peticiones ya accionables (la mayoría de bugs y cambios mecánicos no necesitan clarificación)."
effort: medium
---

# Skill — Clarificación pre-planificación

> **Rol:** Reducir asunciones implícitas en una petición ANTES de delegar a `task-planner`. Operacionalización directa del **Principio de Ingeniería 1 (P1):** *Don't assume. Don't hide confusion. Surface tradeoffs.*

---

## Cuándo activar

Una petición tiene **ambigüedad estructural** cuando se cumple ≥1 de estas 4 señales:

| Señal | Patrón en la petición | Ejemplo |
|---|---|---|
| **Alcance vago** | Adjetivos sin métrica | "mejora el rendimiento", "que sea robusto", "más limpio" |
| **Tradeoff implícito** | Múltiples interpretaciones legítimas | "auth segura" → ¿password? OAuth? SSO? MFA? |
| **Criterio implícito** | Sin definición de éxito | "arregla X" sin decir qué se considera "arreglado" |
| **Dependencia asumida** | Invoca pieza no explícita | "como en el otro proyecto", "el approach habitual" |

**Cero señales detectadas** → la petición es accionable. Saltar `clarify` y delegar directamente a `task-planner`.

**1+ señales** → activar `clarify` antes del planner. Una iteración corta aquí ahorra reaperturas del `plan-checker` después.

---

## Cuándo NO activar

- Bugs concretos con error reproducible (`bugfix` skill ya correlaciona el contexto).
- Operaciones mecánicas (commits, PRs, scaffolding del IDE).
- Peticiones acotadas con archivo + acción explícitos ("añade campo X al modelo Y, regenera migración").
- El usuario ya proporcionó un task doc detallado (`task-planner` lo lee directo).

Si activas `clarify` sobre una petición ya clara, generas fricción innecesaria. Apóyate en las 4 señales — si ninguna dispara, salta.

---

## Protocolo de ejecución

### Paso 1 — Detectar y clasificar dimensiones ambiguas

Lee la petición. Para cada ambigüedad detectada, anótala con su tipo:

```
Petición: "necesito refactorizar la auth para que sea robusta"

Ambigüedades detectadas:
- [Alcance vago] "auth" — ¿solo modelo + middleware? ¿también UI? ¿también APIs externas?
- [Criterio implícito] "robusta" — ¿en qué dimensión? Seguridad? Performance? Mantenibilidad? Tolerancia a fallos?
- [Tradeoff implícito] elegir approach — ¿password+JWT? OAuth2? SSO? MFA?
```

Tope: 5 dimensiones máximo. Si detectas más, la petición es demasiado ambigua para `clarify` — pide al usuario que la divida en sub-tareas.

### Paso 2 — Formular 3-5 preguntas concretas con opciones

Una pregunta por dimensión. Formato preferido: opciones A/B/C concretas + escape "Otra cosa". Reduce el cognitive load del usuario respecto a preguntas abiertas.

```markdown
He detectado ambigüedades estructurales que afectarían la planificación.
Tres preguntas para resolver antes de delegar al `task-planner`:

**1. Alcance del refactor de auth:**
- [A] Solo `auth/` y middleware (3-5 archivos)
- [B] Auth + sesiones + APIs cliente (12-15 archivos)
- [C] Lo anterior + UI de login/registro (20+ archivos)
- [D] Otra cosa — descríbelo

**2. Definición de "robusto":**
- [A] Seguridad: password hashing fuerte, rate limiting, CSRF
- [B] Performance: sub-100ms p99, sin sesiones caducadas en BD
- [C] Mantenibilidad: tests + types + separación clara de capas
- [D] Lo anterior combinado — prioriza una por orden

**3. Approach de auth:**
- [A] Mantener password + sesiones server-side (mínimo cambio)
- [B] Migrar a JWT + refresh tokens
- [C] OAuth2 con proveedor externo (Google/GitHub/...)
- [D] Otra cosa — descríbelo

Responde con el código de cada opción (ej. "1B, 2A, 3B"). Si una pregunta no tiene la opción adecuada, descríbelo en texto libre.
```

**Reglas para las preguntas:**
- Cada opción debe ser concreta y verificable. NO opciones tipo "más eficiente" o "más limpio".
- Cuando hay tradeoff real, mencionarlo explícitamente: "[A] gana en X, pierde en Y".
- Siempre incluir escape "Otra cosa" — el usuario puede tener una visión que no anticipaste.
- Numera las preguntas; el usuario responde con códigos cortos.

### Paso 3 — Encadenar a `task-planner` con clarificaciones

Tras la respuesta del usuario, formatea las clarificaciones y delega:

```
Agent(subagent_type: task-planner, prompt: "
Petición original del usuario: <texto literal>

Clarificaciones obtenidas via skill `clarify`:
- Alcance: <interpretación de respuesta 1>
- Criterio de éxito: <interpretación de respuesta 2>
- Approach: <interpretación de respuesta 3>

Procede con triaje y selección de comando de planificación.
")
```

El planner ya no asume — recibe intent explícito. La probabilidad de gaps en `plan-checker` baja.

---

## Anti-patrones

| Anti-patrón | Por qué evitarlo |
|---|---|
| Preguntas retóricas ("¿Quieres que sea bueno?") | No aportan información. Sólo formula preguntas con opciones discriminantes. |
| >5 preguntas | El usuario abandona. Si la petición lo requiere, sugiere dividirla en sub-tareas (las cubre `task-planner`). |
| Preguntas sobre detalles obvios | Si el contexto del proyecto (CLAUDE.md, ai_docs/core/) responde la pregunta, NO la formules. Lee primero. |
| Pseudo-preguntas que son recomendaciones disfrazadas | Si tienes una recomendación clara, dila como recomendación + "¿procedo así?" — no la disfraces de pregunta. |
| Activar sobre peticiones ya claras | Bugs reproducibles, operaciones mecánicas, scaffolding — saltan a su skill correspondiente sin pasar por `clarify`. |
| Encadenar a `bugfix` o `cleanup` | Esos no necesitan plan; van directo. Sólo encadenar a `task-planner` (que cubre el flujo de cambios planificados). |

---

## Encadenamiento

```
Usuario hace petición
  ↓
[¿Hay 1+ señales de ambigüedad?]
  ├─ NO → task-planner directo (flujo normal)
  └─ SÍ → clarify
           ↓
        3-5 preguntas con opciones
           ↓
        Respuesta del usuario
           ↓
        task-planner con intent enriquecido
           ↓
        Plan + plan-checker + implementer + ...
```

`clarify` es opcional pero proactivo. Cuando la activación es correcta, ahorra al menos 1 ciclo de reapertura del `plan-checker` (T078) — coste 1 pregunta vs coste 1 reapertura del plan completo.

---

*Versión: 1.0.0 | Creación: 2026-05-05 (task 097)*
