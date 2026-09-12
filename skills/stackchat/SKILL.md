---
name: stackchat
description: >-
  Responde preguntas sobre el Substack del usuario consultando una base de datos
  local con sus suscriptores, posts, crecimiento y Notes: cuántos suscriptores
  tiene y de dónde vienen, quién abre sus correos y quién no, quién es candidato
  a pasar a pago, qué posts convierten mejor, quién se dio de baja, y quién da
  like, restackea o responde a sus notas. Úsalo SIEMPRE que pregunte por sus
  suscriptores, su newsletter, sus lectores, sus aperturas, su crecimiento, sus
  altas o bajas, sus posts o sus notas — basta con que diga "mis suscriptores",
  "mi newsletter", "quién me lee" o "mis notas", sin nombrar Substack. También
  para conectar su cuenta la primera vez y para refrescar los datos
  ("actualiza", "sincroniza"). Es de solo lectura: no publica ni modifica nada.
---

# stackchat

Tus datos de Substack en una base SQLite local que puedes preguntar en lenguaje natural.
Todo se queda en la máquina del usuario: no hay servidor, no se envía nada a ningún sitio.

## El comando

El binario está junto a este archivo. Defínelo una vez por sesión con la ruta absoluta del
directorio del skill (te la dan al cargarlo, como «Base directory for this skill»):

```bash
CS="node --no-warnings=ExperimentalWarning <SKILL_DIR>/bin/stackchat.cjs"
$CS status
```

Si alguien pregunta cómo instalar stackchat en otra máquina: `npx skills add sotoplatero/stackchat`.

Requiere **Node 22.13 o superior** (usa `node:sqlite`, así no hay que compilar nada).
Si `node --version` es menor, dilo y para: nada más va a funcionar.

Datos y configuración viven en `~/.stackchat/` (`config.json`, `auth.json`, `stackchat.db`, `raw/`).

## Si ya está conectado

`$CS status` lo dice. Si `connected` es `true`, salta directo a **Consultas**. Antes de responder,
mira `last_sync` en `$CS q overview`: si es de hace días, dilo u ofrece sincronizar.

## Conectar por primera vez

Dos vías. **Elige tú según lo que haya disponible, no preguntes al usuario cuál prefiere.**

### Vía A — con Claude in Chrome

Úsala si en esta sesión existen herramientas `mcp__claude-in-chrome__*`. El usuario no toca nada y
su cookie no se copia a ningún archivo: el navegador ya está autenticado y las peticiones salen
desde la propia página.

Pregunta el subdominio si no lo sabes (o léelo de `~/.stackchat/config.json`). Luego:

**1. Estadísticas de la publicación**

- `navigate` a `https://<subdominio>.substack.com/publish/home`
- `javascript_tool` con el contenido de **`<SKILL_DIR>/browser/01-publication.js`**.
  Devuelve enseguida `{arrancado}`: el trabajo sigue en la página.
- **Sondea** `window.__stackchat` cada ~15 s hasta que `listo` sea `true` (mira `fase` y `progreso`
  para informar). Tarda hasta un minuto, sobre todo esperando el export de suscriptores.
- Cuando esté listo, lee `window.__stackchat.datos`, guárdalo con Write en
  `<carpeta temporal>/stackchat-publication.json` y ejecuta `$CS load <carpeta temporal>`.

**2. El CSV de suscriptores** (el que trae el engagement individual)

`window.__stackchat.datos.email_list_url` trae un enlace absoluto. No se puede leer con `fetch`
—redirige a S3 y CORS lo corta—, así que hay que descargarlo: `navigate` a esa URL. Chrome lo
guarda en Descargas; muévelo a la carpeta temporal y vuelve a ejecutar `$CS load`.

**3. Notes**

- `navigate` a `https://substack.com`
- `javascript_tool` con **`<SKILL_DIR>/browser/02-notes.js`**, y sondea igual.
  Con 200+ notas tarda varios minutos: `progreso` va marcando `hechas/total`.
- Lee `window.__stackchat.datos`, guárdalo como `stackchat-notes.json` en la carpeta temporal y
  `$CS load <carpeta temporal>`.

Los datos vuelven por el resultado del tool, no por descargas: Chrome bloquea en silencio las
descargas automáticas repetidas de un sitio, y era la parte más frágil. **Cuesta contexto**: las
estadísticas rondan los 25 KB, pero el bundle de Notes puede pasar de 400 KB con 200+ notas. Avisa
al usuario antes del paso 3 y, si va a sincronizar a menudo, recomiéndale conectar con la vía B.

### Vía B — sin Chrome: el usuario copia el cURL

1. Pídele que abra en Chrome `https://<su-subdominio>.substack.com/publish/home`, ya logueado.
2. `F12` → pestaña **Network** → recargar con `Ctrl+R`.
3. Clic derecho en la **primera petición** (el documento) → **Copy** → **Copy as cURL (bash)**.
4. Que lo pegue en un archivo de texto y te pase **la ruta** (no el contenido: lleva su sesión).
5. `$CS connect --cookies <ruta>`

`connect` verifica la sesión y detecta la publicación antes de guardar nada. Si administra varias,
las lista: repite con `--sub <subdominio>`. Luego `$CS sync` lo descarga todo (3-4 minutos).

**Dile que borre el archivo del cURL al terminar**: contiene su sesión.

## Refrescar

`$CS sync` es **incremental** por defecto: compara los contadores que el feed ya devuelve gratis con
lo que hay en la BD y solo pide las interacciones de las notas que cambiaron, además de acortar el
rango de las series. Unos 10 s sin novedades, frente a 3-4 min de `--full`.

Para que los datos estén frescos sin pedirlo, un hook de `SessionStart`:

```json
{ "hooks": { "SessionStart": [{ "hooks": [{
  "type": "command",
  "command": "node --no-warnings=ExperimentalWarning \"<SKILL_DIR>/bin/stackchat.cjs\" sync --if-stale 6 --background",
  "async": true
}] }] } }
```

`--if-stale 6` sale en milisegundos si los datos tienen menos de 6 horas, así que en la mayoría de
sesiones no hace nada. `--background` se desasocia y devuelve al instante, porque `SessionStart`
bloquea el arranque hasta que el comando acaba. Un candado en `~/.stackchat/sync.lock` evita que
varias sesiones abiertas lancen syncs simultáneos.

El resultado queda en `last_background_sync` de `$CS status`: **míralo antes de responder**. Si dice
que falló porque la sesión caducó, avísale en vez de dar datos viejos en silencio.

Si `sync` dice que la sesión caducó, hay que repetir `connect` con un cURL nuevo. Con la vía A,
repetir sus tres pasos. La vía B es más barata para sincronizar a menudo —no gasta contexto—, así
que si el usuario va a hacerlo con frecuencia merece la pena que conecte una vez con el cURL aunque
tenga la extensión.

## Consultas

`$CS q <consulta> [--flags]` — todo sale como JSON por stdout.

| Consulta | Qué devuelve | Flags |
|---|---|---|
| `overview` | Totales, reparto por plan, altas 30/90d, último sync. **Empieza aquí.** | — |
| `subscribers` | Contactos con filtros | `--plan free\|paid\|monthly\|yearly` `--active true\|false` `--after YYYY-MM-DD` `--before` `--email texto` `--limit` `--offset` |
| `subscriber` | Ficha de un contacto + historial de plan | `--email alguien@ejemplo.com` |
| `candidates` | Free activos ordenados como candidatos a pago | `--limit` `--min-days` |
| `posts` | Posts con views, open_rate, signups, subscribes | `--sort open_rate\|views\|subscribes\|signups\|post_date` `--limit` |
| `growth` | Altas por fuente y series diarias free/paid | `--from` `--to` `--group-by day\|week\|month\|source` |
| `churn` | Bajas y transiciones de plan entre syncs | `--from` `--to` |
| `notes` | Tus Notes con likes, restacks, respuestas, personas únicas | `--sort interactions\|date\|reactions\|restacks\|replies` `--limit` |
| `note-engagers` | **Quién interactúa más con tus Notes** | `--limit` `--kind like\|restack\|reply` |
| `note` | Una Note con su texto y cada interacción con su persona | `--id 332284631` |
| `schema` | Tablas, DDL y conteos | — |

Un nombre equivocado imprime la lista de nombres válidos; un flag fuera de su lista cerrada dice
qué se esperaba. Los errores de uso salen con código 2.

## SQL libre

```bash
$CS sql "SELECT source, COUNT(*) n FROM subscribers WHERE is_active=1 GROUP BY source ORDER BY n DESC"
```

Solo `SELECT`/`WITH`, una sentencia, `LIMIT 200` por defecto (`--max-rows N` lo sube).

### Esquema

```
subscribers        email(PK), subscribed_at, source, is_active, plan, plan_since,
                   unsubscribed_at, extra(JSON)
subscriber_snapshots  run_id, email, is_active, plan   -- un snapshot por sync: de aquí el histórico
posts              post_id(PK), title, subtitle, post_date, is_published, type, audience, slug
post_email_stats   post_id, run_id, title, post_date, views, open_rate, engagement_rate,
                   signups, subscribes, estimated_value
growth_sources     date, source, category, unique_visitors, new_subscribers, new_revenue
traffic            date(PK), views
subscriber_totals  date(PK), total_subscribers
subscriber_growth_daily  date(PK), new_free, unsubscribes, new_paid, upgrades, cancellations_*
notes              note_id(PK), date, body, reaction_count, restacks, replies_count,
                   attachments(JSON), stats(JSON)
note_actors        user_id(PK), name, handle, publication_subdomain, publication_name, is_following
note_interactions  note_id, actor_user_id, kind('like'|'restack'|'reply'), reply_id, created_at, body
sync_runs          id(PK), started_at, finished_at, status
```

**`subscribers.extra` es JSON con el engagement por contacto.** Léelo con `json_extract`:

```sql
json_extract(extra,'$.activity')            -- 0-5, la puntuación de Substack
json_extract(extra,'$.emails_received_6mo') -- correos enviados a esa persona
json_extract(extra,'$.emails_opened_30d')   -- aperturas (pueden superar a los recibidos: relecturas)
json_extract(extra,'$.days_active_30d')
json_extract(extra,'$.links_clicked')
json_extract(extra,'$.name')
json_extract(extra,'$."Unique emails seen (6mo)"')  -- correos DISTINTOS abiertos
```

Para «¿quién ha abierto todos mis correos?» compara `Unique emails seen (6mo)` con
`emails_received_6mo`, nunca las aperturas totales.

## Cuatro cosas que no debes afirmar de más

1. **Substack no dice quién LEE las Notes.** Solo quién interactúa (like, restack, respuesta).
   «Quién lee mis notas» no tiene respuesta; «quién interactúa» sí, con `note-engagers`.
2. **`matched_subscriber_email` casa por nombre exacto**, porque Substack no revela el email de
   quien da like. Es una pista, no una certeza — dilo cuando la uses.
3. **`churn` necesita al menos dos syncs**: las bajas y los cambios de plan salen de comparar
   snapshots, no de un campo que Substack entregue.
4. **Las fechas de la base son UTC.** Al hablar de «ayer» o de la hora de una nota, conviértelas a
   la zona del usuario.

## Si algo falla

- `connected: false` o «la sesión ha caducado» → volver a conectar (vía A o B).
- Un `sync` puede acabar `partial`: Substack devuelve 503 y 429 esporádicos. Lo descargado se carga
  igual; repetir más tarde completa el resto.
- En la vía A, si `window.__stackchat.error` trae algo, cuéntalo tal cual y ofrece la vía B.
- Substack cambia sus endpoints internos sin avisar. Si una descarga concreta falla siempre, dilo
  claramente en vez de inventar el dato que falta.
