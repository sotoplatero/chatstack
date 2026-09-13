# Referencia de stackchat

Lo que no hace falta para responder, pero sí cuando algo se tuerce o el usuario pregunta.
Léelo solo en ese momento.

## Cómo leer el resultado de un sync

`last_background_sync` en `$CS status` tiene dos formas:

```
2026-09-13T10:21:40Z sync #15 ok
2026-09-13T10:21:40Z sync #16 partial (2 fuentes fallaron)
2026-09-13T10:21:40Z falló: la sesión de Substack ha caducado
2026-09-13T10:21:40Z falló: no se descargó nada
```

| Lo que dice | Qué significa y qué haces |
|---|---|
| `ok` | Todo bajó y todo cargó. |
| `partial (N fuentes fallaron)` | Substack devolvió 503 o 429 en N fuentes. Lo demás está al día. Responde con lo que hay y di qué conjunto puede estar viejo: se ve comparando `coverage[].last_run_id` con `last_sync.id`. Se arregla solo en el siguiente sync. |
| `falló: no se descargó nada` | Corte de red o Substack caído. **No es la sesión**: no pidas el cURL, reintenta más tarde. |
| `falló: la sesión ha caducado` | Esta sí. Pide el cURL y repite `connect`. |

Códigos de salida de `sync`: `0` bien, `2` sesión o error de uso, `3` parcial.

Un run `partial` **no** cuenta como fresco, así que `--if-stale` vuelve a intentarlo en la sesión
siguiente en lugar de dar los datos por buenos durante seis horas.

## Si hay un sync en marcha

`~/.stackchat/sync.lock` existe mientras uno corre. `status` no lo muestra, así que si la base
parece vacía y el candado está ahí, los datos están bajando: dilo en vez de decir que no hay nada.
El candado caduca a los quince minutos.

## `--full`: cuándo

Solo si algo se ve inconsistente —contadores que no cuadran con lo que el usuario ve en Substack—
o tras un `partial` que no se arregla repitiendo. No lo lances por rutina: recorre todas las notas
y tarda 3-4 minutos, frente a unos 10 segundos del incremental.

El incremental compara los contadores que el feed ya devuelve gratis con lo que hay en la base y
solo pide las interacciones de las notas que cambiaron. Tiene un punto ciego: un like nuevo en una
nota muy antigua puede tardar en detectarse. `--full` lo resuelve.

## Refresco automático

Un hook de `SessionStart` en `~/.claude/settings.json`:

```json
{ "hooks": { "SessionStart": [{ "hooks": [{
  "type": "command",
  "command": "node --no-warnings=ExperimentalWarning \"<SKILL_DIR>/bin/stackchat.cjs\" sync --if-stale 6 --background",
  "async": true
}] }] } }
```

`--if-stale 6` sale en milisegundos si los datos tienen menos de 6 horas, así que en la mayoría de
sesiones no hace nada. `--background` se desasocia y devuelve al instante, porque `SessionStart`
bloquea el arranque hasta que el comando acaba. El candado evita que varias sesiones abiertas
lancen syncs simultáneos.

## Varias publicaciones

`connect` lista las que administre el usuario si hay más de una; se elige con `--sub <subdominio>`.
`sync` también acepta `--sub`. La elegida queda en `config.json` y no hay que repetirla.

## Instalar en otra máquina

`npx skills add sotoplatero/stackchat`. Requiere Node 22.13 o superior, porque usa `node:sqlite` y
así no hay nada que compilar.

## Variables y rutas

Todo vive en `~/.stackchat`: `config.json`, `auth.json`, `stackchat.db`, `raw/`, `sync.lock`,
`last-sync.log`.

| Variable | Para qué |
|---|---|
| `STACKCHAT_HOME` | Mover la carpeta entera. |
| `STACKCHAT_DB` / `--db` | Apuntar a otra base. |
| `STACKCHAT_SUB` | Forzar el subdominio. |

## En un sandbox o una sesión remota

`status.home` dice dónde vive la base. Si no es la máquina del usuario, su cookie no está ahí y lo
que descargues se pierde al cerrar: no habrá `sync` automático. Se puede trabajar igual por la vía
del navegador (`navegador.md`), y merece la pena decirle en una línea que conectando una vez con el
cURL desde su máquina lo tiene permanente.

## Datos que Substack no da

- **Quién lee las Notes.** Solo quién interactúa: like, restack o respuesta.
- **El email de quien da like.** `matched_subscriber_email` casa por nombre exacto, así que es una
  pista, no una certeza. Dilo cuando la uses. `note_actors.is_subscribed` sí lo dice Substack
  directamente y es más fiable.
- **La hora de un like.** `created_at` solo viene en las respuestas.
- **Altas free por día.** No hay endpoint. Se derivan de la fecha de alta de cada suscriptor, así
  que `subscriber_growth_daily.new_free` es una reconstrucción, no un dato de Substack.
- **Bajas anteriores a la primera conexión.** La lista de bajas del panel cubre el rango que se le
  pida, pero `churn` compara snapshots y necesita al menos dos syncs.

## Si Substack cambia sus endpoints

Los endpoints del panel son internos y cambian sin avisar. Si una fuente falla siempre, dilo
claramente en vez de rellenar el hueco con una estimación. La lista está en un solo sitio,
`src/ingest/endpoints.ts`, tanto para la ingesta como para los snippets del navegador.
