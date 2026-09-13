---
name: stackchat
description: >-
  Responde preguntas sobre el Substack del usuario a partir de una base local:
  suscriptores y de dónde vienen, quién abre sus correos y quién no, candidatos a
  pasar a pago, qué posts convierten, quién se dio de baja, y quién da like,
  restackea o responde a sus notas. Úsalo siempre que hable de sus suscriptores,
  su newsletter, sus lectores, sus aperturas, su crecimiento, sus posts o sus
  notas, aunque no nombre Substack; también para conectar su cuenta y para
  actualizar o sincronizar los datos. Es de solo lectura.
---

# stackchat

Tus datos de Substack en una base SQLite local que puedes preguntar en lenguaje natural.
Todo se queda en la máquina del usuario: no hay servidor, no se envía nada a ningún sitio.

## Tres reglas, antes que nada

**1. Ejecuta `$CS status` antes de decir una sola palabra sobre el estado.** Nunca afirmes que el
usuario no está conectado, que no hay datos, o que falta algo, sin haberlo comprobado en esta
sesión. Es el error número uno: suena razonable, y es falso — mucha gente ya tiene su sesión
guardada de antes.

**2. Actúa, no pidas permiso.** Consultar la base y lanzar un sync son acciones locales y de solo
lectura: hazlas y cuenta el resultado. Nada de «¿quieres que lo conecte?» o «¿procedo?». La única
vez que se pregunta algo es cuando necesitas el archivo cURL, que solo el usuario puede darte — y
entonces se pide directamente, no se ofrece.

**3. La descarga de datos es trabajo tuyo, nunca suyo.** El usuario pide algo y tú lo consigues.
Nada de «¿quieres que baje también las notas?», nada de «descárgate esto y súbemelo», nada de dejar
un conjunto a medias porque tarda. Lo único que puedes pedirle es el cURL, una vez, porque su sesión
solo la tiene él. Todo lo demás —lanzar syncs, esperar exports, recoger un archivo de su carpeta de
Descargas, cargarlo— lo haces tú sin preguntar. Si algo va a tardar, **dilo y sigue**, no lo
conviertas en una pregunta.

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
- `missing` — qué conjuntos **nunca se han descargado**. Una tabla vacía cuya fuente sí se
  descargó no sale aquí: el usuario simplemente no tiene esos datos (no ha escrito notas, no tiene
  suscriptores de pago) y volver a pedirlos no cambiaría nada.
- `last_sync` y `last_background_sync` — cuándo se llenaron y si el último intento falló.

```json
{ "connected": true, "subdomain": "sotoplatero",
  "last_sync": { "id": 14, "finished_at": "2026-09-12T14:49:40Z", "status": "ok" },
  "last_background_sync": "2026-09-12T14:49:40Z sync #14 ok",
  "missing": [],
  "coverage": [ { "dataset": "notes", "rows": 237, "ever_fetched": true, "missing": false } ] }
```

Y decides con esta tabla, **sin preguntarle nada al usuario**. Se lee en orden: la primera fila
que encaje manda.

| `status` dice | Qué haces |
|---|---|
| `connected: false` | Pedir el cURL (abajo). Sin sesión guardada `sync` no funciona, aunque ya haya datos de una sesión anterior por el navegador. |
| Falta lo que la pregunta necesita | `$CS sync --background` y **responde igual**, con lo que haya |
| Todo presente pero `last_sync` de hace >6 h | `$CS sync --if-stale 6 --background` y responde sin esperar |
| Todo presente y fresco | Responde y ya |
| `last_background_sync` dice que falló | Dilo y pide el cURL nuevo. **No relances en bucle.** |

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

### No intentes sacar la cookie del navegador: está comprobado que no se puede

Parece la solución obvia y no lo es. Comprobado sobre una sesión real:

- `document.cookie` **no** incluye `substack.sid`: es httpOnly. Solo se ven cookies de analítica y
  `substack.lli`, que no autentica nada.
- `read_network_requests` devuelve url, método y código de estado. **Sin cabeceras**, así que la
  cabecera `Cookie` de las peticiones tampoco está.

No hay tercera vía con las herramientas disponibles. Si se te ocurre «conecto por Chrome y ya»,
para: el navegador puede traer **datos**, nunca una **sesión guardada**.

### Si se niega a tocar DevTools

Entonces, y solo entonces, existe la vía del navegador: las peticiones salen desde la propia
página, que ya está autenticada. Requiere herramientas `mcp__claude-in-chrome__*`. Los pasos están
en **`<SKILL_DIR>/navegador.md`**; léelo en ese momento.

**No la elijas por parecer más cómoda.** Ahorra cuatro pasos hoy y cuesta que el usuario esté
delante en *cada* sincronización futura, para siempre, porque no deja sesión guardada y `sync` no
puede funcionar sin ella. El cURL es una molestia que se paga una vez; el navegador es una molestia
que se paga siempre.

**Antes de empezarla, comprueba que Chrome y tu shell son la misma máquina.** La vía del navegador
termina leyendo un CSV de la carpeta de Descargas del usuario. Si tu shell corre en otro sitio
—sesión remota, o un espacio de trabajo que no ve `~/Downloads`— no puedes completarla, y acabarás
pidiéndole al usuario que te suba archivos a mano. Eso está prohibido (ver la regla 3). En ese caso
dilo y pide el cURL, que ahí es la única vía que funciona sin trabajo manual.

## Refrescar

`$CS sync` es **incremental** por defecto: compara los contadores que el feed ya devuelve gratis con
lo que hay en la BD y solo pide las interacciones de las notas que cambiaron, además de acortar el
rango de las series. Unos 10 s sin novedades, frente a 3-4 min de `--full`.

`--full` solo hace falta si algo se ve inconsistente —contadores que no cuadran con lo que el
usuario ve en Substack— o tras un `partial` que no se arregla repitiendo. No lo lances por rutina.

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
| `overview` | Totales, reparto por plan, altas 30/90d, último sync | — |
| `subscribers` | Contactos con filtros | `--plan free\|paid\|monthly\|yearly` `--active true\|false` `--after YYYY-MM-DD` `--before` `--email texto` `--limit` `--offset` |
| `subscriber` | Ficha de un contacto + historial de plan | `--email alguien@ejemplo.com` |
| `candidates` | Free activos ordenados como candidatos a pago | `--limit` `--min-days` |
| `posts` | Posts con views, open_rate, signups, subscribes | `--sort open_rate\|views\|subscribes\|signups\|post_date` `--limit` |
| `growth` | Altas por fuente y series diarias free/paid | `--from` `--to` `--group-by day\|week\|month\|source` |
| `churn` | Bajas y transiciones de plan entre syncs | `--from` `--to` |
| `notes` | Tus Notes con likes, restacks, respuestas, personas únicas | `--sort interactions\|date\|reactions\|restacks\|replies` `--limit` |
| `note-engagers` | **Quién interactúa más con tus Notes** | `--limit` `--kind like\|restack\|reply` |
| `note` | Una Note con su texto y cada interacción con su persona | `--id 332284631` |
| `schema` | Tablas, DDL y conteos. Rara vez hace falta: el esquema está más abajo | — |

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
subscriber_growth_daily  date(PK), new_paid, upgrades, trials_started, cancellations_*
                   OJO: new_free y unsubscribes existen como columnas, pero `sync` NUNCA las
                   rellena — no se encontró el endpoint de la serie gratuita. Solo tienen valor
                   si alguien cargó a mano un free_subscriber_growth.csv exportado del panel, así
                   que suelen estar a null y, si no, cubren un tramo suelto. Comprueba antes de
                   usarlas. Para altas free lo fiable es growth_sources.new_subscribers; para
                   bajas, subscribers.unsubscribed_at.
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

- `connected: false` o «la sesión ha caducado» → pedirle el cURL otra vez.
- Un `sync` puede acabar `partial`: Substack devuelve 503 y 429 esporádicos. Lo descargado se carga
  igual; repetir más tarde completa el resto.
- En la vía del navegador, si `window.__stackchat.error` trae algo, cuéntalo tal cual y pásate
  al cURL.
- Substack cambia sus endpoints internos sin avisar. Si una descarga concreta falla siempre, dilo
  claramente en vez de inventar el dato que falta.
