"""Acceso a templates del Multi-Agent Development Kit.

Estructura:
- Templates de **Claude** son la fuente canónica del repo y viven en la **raíz**
  (`agents/`, `commands/`, `skills/`, `hooks/`, `CLAUDE.md.template`). En modo
  desarrollo (`pip install -e .`) se leen directo desde raíz; al construir el
  wheel se copian a `madkit/templates/claude/` vía `[tool.hatch.build.targets.wheel.force-include]`
  y desde ahí los lee `importlib.resources`.
- Templates de **otros IDEs** (cursor, codex, cline, continue, windsurf) son
  scaffolds del CLI y viven en `src/madkit/templates/<ide>/`. Se acceden vía
  `importlib.resources` siempre.

Política de resolución para `claude`:
1. Intentar `importlib.resources` (modo wheel instalado). Si la carpeta existe
   y tiene contenido, usarla.
2. Fallback a la raíz del repo, calculada desde la ubicación de este archivo
   (`<repo>/src/madkit/embeds.py` → `<repo>/`). Solo aplica en modo desarrollo.
"""
from __future__ import annotations

from importlib.resources import files
from pathlib import Path

VALID_IDES = frozenset({"claude", "cursor", "codex", "cline", "continue", "windsurf"})

# Sub-directorios que componen el bundle de Claude.
_CLAUDE_LAYOUT = ("agents", "commands", "skills", "hooks", "CLAUDE.md.template")


def _repo_root_for_dev() -> Path:
    """Calcula la raíz del repo asumiendo layout `<repo>/src/madkit/embeds.py`."""
    return Path(__file__).resolve().parent.parent.parent


def _claude_root_dev() -> Path:
    """Devuelve la raíz del repo si parece ser layout dev con templates en raíz."""
    root = _repo_root_for_dev()
    # Sanity: layout dev debe tener al menos `agents/` y `CLAUDE.md.template`.
    if (root / "agents").is_dir() and (root / "CLAUDE.md.template").is_file():
        return root
    return root  # Devolver de todos modos; los callers manejan ausencia.


def templates_root_for(ide: str) -> Path:
    """Devuelve el path al directorio de templates del IDE.

    Para `claude`: intenta primero el bundle del wheel, cae a raíz del repo en dev.
    Para otros IDEs: lee de `src/madkit/templates/<ide>/` vía `importlib.resources`.

    Levanta ValueError si el IDE no está reconocido. El path puede no contener
    archivos reales — los callers deben tolerar ausencia y reportar mensajes
    accionables.
    """
    if ide not in VALID_IDES:
        raise ValueError(f"IDE '{ide}' no reconocido. Válidos: {sorted(VALID_IDES)}")

    if ide == "claude":
        # 1) Modo wheel: el bundle está en madkit/templates/claude/ tras force-include.
        bundled = Path(str(files("madkit") / "templates" / "claude"))
        if bundled.is_dir() and (bundled / "CLAUDE.md.template").is_file():
            return bundled
        # 2) Modo dev: leer desde raíz del repo.
        return _claude_root_dev()

    resource = files("madkit") / "templates" / ide
    return Path(str(resource))
