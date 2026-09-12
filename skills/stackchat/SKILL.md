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

## Dos reglas, antes que nada

**1. Ejecuta `$CS status` antes de decir una sola palabra sobre el estado.** Nunca afirmes que el
usuario no está conectado, que no hay datos, o que falta algo, sin haberlo comprobado en esta
sesión. Es el error número uno: suena razonable, y es falso — mucha gente ya tiene su sesión
guardada de antes.

**2. Actúa, no pidas permiso.** Consultar la base y lanzar un sync son acciones locales y de solo
lectura: hazlas y cuenta el resultado. Nada de «¿quieres que lo conecte?» o «¿procedo?». La única
vez que se pregunta algo es cuando necesitas el archivo cURL, que solo el usuario puede darte — y
entonces se pide directamente, no se ofrece.

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

## Antes de responder cualquier cosa

Una llamada a `$CS status`. Es local y cuesta milisegundos. Te dice tres cosas:

- `connected` — si hay sesión guardada.
- `missing` — qué conjuntos de datos están vacíos.
- `last_sync` y `last_background_sync` — cuándo se llenaron y si el último intento falló.

Y decides con esta tabla, **sin preguntarle nada al usuario**:

| `status` dice | Qué haces |
|---|---|
| `connected: false` | Pedir el cURL (abajo). Es lo único que requiere al usuario. |
| Falta lo que la pregunta necesita | `$CS sync --background` y **responde igual**, con lo que haya |
| Todo presente pero `last_sync` de hace >6 h | `$CS sync --if-stale 6 --background` y responde sin esperar |
| Todo presente y fresco | Responde y ya |
| `last_background_sync` dice que falló | Dilo y ofrece reconectar. **No relances en bucle.** |

`sync --background` devuelve en ~300 ms: se desasocia y sigue por su cuenta. **Nunca lo esperes,
nunca sondees, nunca digas «dame un momento».** Responde con los datos que existan y añade una
línea diciendo qué se está descargando. Cuando el usuario vuelva a preguntar, ya estará.

Un candado impide que se solapen dos syncs, así que puedes lanzarlo sin contar cuántas veces.

### Qué dato necesita cada pregunta

Solo lanza un sync si falta lo que hace falta para *esa* pregunta.

| Si preguntan por… | Necesitas |
|---|---|
| cuántos suscriptores, quién abre, candidatos a pago, bajas | `subscribers` |
| artículos, aperturas por post, qué convierte | `posts`, `post_stats` |
| de dónde vienen las altas, tráfico, crecimiento | `growth`, `traffic`, `subscriber_totals` |
| notas, quién da like, quién responde, quién restackea | `notes`, `note_interactions` |

Se puede hablar de los artículos mientras las notas se descargan: son conjuntos independientes.

## Conectar

Solo si `status` dice `connected: false`. **Pide el cURL directamente**, no lo ofrezcas como una
opción entre varias: son cuatro pasos una sola vez en la vida, y a partir de ahí todo se sincroniza
solo en segundo plano, en ~13 segundos y sin gastar contexto. Dilo así, y enumera los pasos.

1. Que abra en Chrome `https://<su-subdominio>.substack.com/publish/home`, ya logueado.
2. `F12` → pestaña **Network** → recargar con `Ctrl+R`.
3. Clic derecho en la **primera petición** (el documento) → **Copy** → **Copy as cURL (bash)**.
4. Que lo pegue en un archivo de texto y te pase **la ruta** (no el contenido: lleva su sesión).
5. `$CS connect --cookies <ruta>` y luego `$CS sync --background`.

`connect` verifica la sesión y detecta la publicación antes de guardar nada. Si administra varias,
las lista: repite con `--sub <subdominio>`. **Dile que borre el archivo al terminar**: lleva su sesión.

El primer `sync` tarda 3-4 minutos porque recorre todas las notas. Lánzalo con `--background` y
sigue atendiendo: las estadísticas y los suscriptores estarán en segundos, las notas al final.

### Si se niega a tocar DevTools: la vía del navegador

Solo entonces, y solo si existen herramientas `mcp__claude-in-chrome__*`. Funciona, pero exige que
estés encima en cada sincronización, gasta contexto y abre ventanas de descarga. Adviértele de eso
antes de empezar.

Pregunta el subdominio si no lo sabes (o léelo de `~/.stackchat/config.json`).

**1. Estadísticas de la publicación**

- `navigate` a `https://<subdominio>.substack.com/publish/home`
- `javascript_tool` con el contenido de **`<SKILL_DIR>/browser/01-publication.js`**.
  Devuelve enseguida `{arrancado}`: la página sigue trabajando sola.
- **No te quedes esperando.** Dile al usuario que tarda alrededor de un minuto y sigue atendiéndole.
  Comprueba `window.__stackchat` cuando vuelvas a intervenir; si `listo` es `true`, recógelo.
- Lee `window.__stackchat.datos`, guárdalo con Write en
  `<carpeta temporal>/stackchat-publication.json` y ejecuta `$CS load <carpeta temporal>`.

**2. El CSV de suscriptores** — aquí hay una descarga del navegador, avísale

`window.__stackchat.datos.email_list_url` trae un enlace absoluto. No se puede leer con `fetch`
(redirige a S3 y CORS lo corta), así que hay que descargarlo navegando a esa URL.

**Dile antes de hacerlo**: «voy a abrir el enlace del export; Chrome lo va a descargar, y si te
pide permiso acéptalo». Después `navigate` a la URL, y **comprueba que el archivo llegó** a la
carpeta de descargas antes de seguir. Si no aparece en unos segundos, díselo claramente: Chrome
bloquea las descargas automáticas de un sitio tras la primera, y hace falta que lo permita a mano.
No des por hecho que se descargó.

Cuando esté, muévelo a la carpeta temporal y vuelve a ejecutar `$CS load`.

**3. Notes**

- `navigate` a `https://substack.com`
- `javascript_tool` con **`<SKILL_DIR>/browser/02-notes.js`**.
- Con 200+ notas tarda varios minutos. **Tampoco esperes**: avisa, sigue respondiendo, y recógelo
  cuando vuelvas a intervenir. `progreso` marca `hechas/total` si quieres informar del avance.
- Lee `window.__stackchat.datos`, guárdalo como `stackchat-notes.json` y `$CS load <carpeta>`.

Los datos vuelven por el resultado del tool, no por descargas. **Cuesta contexto**: las
estadísticas rondan los 25 KB, pero el bundle de Notes pasa de 400 KB con 200+ notas.

**Al terminar, ofrécele pasar al cURL** para que los siguientes syncs sean automáticos.

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

Si `sync` dice que la sesión caducó, hay que repetir `connect` con un cURL nuevo. Quien conectara
por el navegador no tiene sesión guardada y no puede usar `sync`: tendrá que repetir los tres pasos
del navegador, o dar el cURL una vez y olvidarse.

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
