---
name: stackchat
description: >-
  Responde preguntas sobre el Substack del usuario a partir de una base local:
  suscriptores y de dónde vienen, quién abre sus correos y quién no, quién está a
  punto de irse, candidatos a pasar a pago, qué posts convierten, cuándo conviene
  enviar, quién se dio de baja, y quién da like, restackea o responde a sus notas.
  Úsalo siempre que hable de sus suscriptores, su newsletter, sus lectores, sus
  aperturas, su crecimiento, sus posts o sus notas, aunque no nombre Substack;
  también para conectar su cuenta y para actualizar o sincronizar los datos.
  Es de solo lectura.
---

# stackchat

Los datos de Substack del usuario en una base SQLite local que puedes preguntar. Todo se queda en
su máquina: no hay servidor y no se envía nada a ningún sitio.

## Estado, ya comprobado

Esto se ha ejecutado solo al cargar el skill, así que **no lo repitas**: ya sabes si hay sesión, si
hay datos y si estaban frescos. Si faltaba algo, la descarga ya va en segundo plano.

!`node --no-warnings=ExperimentalWarning "${CLAUDE_SKILL_DIR}/bin/stackchat.cjs" start || true`

Lee el `estado` de ahí arriba y haz lo que diga `siguiente`. La tabla de estados está más abajo.

## Tres reglas

**1. Se responde contra la base, y solo contra la base.** Toda pregunta sobre suscriptores, posts,
crecimiento o notas se contesta con `$CS q` o `$CS sql`. El navegador y el cURL **no son formas de
contestar**: son las dos únicas formas de *llenar* la base, y no se tocan para responder.

Si te descubres navegando a Substack, abriendo el panel o pidiéndole un CSV para contestar una
pregunta, párate: te has salido del carril. La respuesta está en la base, o no está en ninguna
parte todavía, y entonces lo que toca es un `sync`, no una visita al navegador. Un `q` tarda
milisegundos; la vía del navegador son minutos, varios turnos y el usuario delante.

Y si la base dice cero, **cero es la respuesta**. «No hay ninguna baja» es un resultado, no un
fallo que haya que ir a resolver a otro sitio.

**2. Comprueba antes de afirmar.** El estado está arriba, ya ejecutado: léelo. Nunca afirmes que no
está conectado, que no hay datos o que falta algo sin haberlo mirado ahí. Es el error número uno:
suena razonable y es falso, porque mucha gente ya tiene su sesión guardada de antes.

**3. Actúa, no pidas permiso.** Consultar y sincronizar son acciones locales y de solo lectura:
hazlas y cuenta el resultado. Nada de «¿quieres que lo conecte?». Conseguir los datos es trabajo
tuyo, nunca suyo: tú lanzas los syncs, tú esperas los exports, tú recoges los archivos. Lo único
que puedes pedirle es el cURL, una vez, porque su sesión solo la tiene él. Si algo va a tardar,
dilo y sigue; no lo conviertas en una pregunta.

## El comando

El binario está junto a este archivo. Defínelo una vez por sesión con la ruta absoluta del
directorio del skill (te la dan al cargarlo, como «Base directory for this skill»):

```bash
CS="node --no-warnings=ExperimentalWarning <SKILL_DIR>/bin/stackchat.cjs"
$CS q overview
```

En PowerShell la variable no se expande igual; ahí escribe la ruta completa en cada llamada, o
usa la herramienta Bash. Requiere **Node 22.13 o superior**: si `node --version` es menor, dilo y
para, porque nada más va a funcionar. Todo vive en `~/.stackchat`.

## Qué significa cada estado

Lo de arriba lo ha devuelto `$CS start`, que corre solo al cargar el skill: comprueba si hay sesión
y datos, mira si están frescos, **lanza en segundo plano lo que falte** y resume la publicación. No
hay nada que interpretar ni que volver a ejecutar; solo si la sesión se alarga y quieres releer el
estado, vuelve a llamarlo.

| `estado` | Qué significa y qué haces |
|---|---|
| `listo` | Datos frescos. Responde con `$CS q`. |
| `listo_actualizando` | Hay datos y ya se está bajando lo que faltaba. **Responde igual**, con lo que hay, y dilo en una línea. |
| `descargando_por_primera_vez` | Base vacía y sesión válida. El primer sync tarda 3-4 minutos por las notas: dilo y sigue atendiendo. |
| `sin_sesion` | No hay con qué descargar. `siguiente` trae los pasos del cURL; si además dice `hay_datos: true`, responde mientras tanto con lo que haya. |

**Nunca esperes al sync, nunca sondees, nunca digas «dame un momento».** Se desasocia y sigue por su
cuenta; un candado impide que se solapen dos. Cuando el usuario vuelva a preguntar, ya estará.

`$CS status` sigue existiendo para mirar el detalle: cobertura por conjunto, qué falta y cómo acabó
el último sync de fondo. Se usa cuando algo va mal, no en cada sesión.

## Conectar

Solo si el estado de arriba dice `sin_sesion`. **Pide el cURL directamente**, no lo ofrezcas como una
opción entre varias: son cuatro pasos una sola vez en la vida, y a partir de ahí todo se sincroniza
solo en segundo plano.

1. Que abra en Chrome **`https://substack.com`**, con su cuenta ya iniciada.
2. `F12` → pestaña **Network** → recargar con `Ctrl+R`.
3. Clic derecho en la **primera petición** (el documento) → **Copy** → **Copy as cURL (bash)**.
4. Que lo pegue en un archivo de texto y te pase **la ruta** (no el contenido: lleva su sesión).
5. `$CS connect --cookies <ruta>` y luego `$CS sync --background`.

**No le pidas su subdominio y no te lo inventes.** La sesión vale para todo `substack.com`, así que
el cURL sale de la portada y `connect` averigua solo a qué publicación pertenece. **El subdominio no
se deduce del nombre**: «Objeto Brillante» vive en `sotoplatero.substack.com`. Inventarlo lleva a
una URL que no existe y a un callejón sin salida. Si administra varias publicaciones, `connect` las
lista con su nombre y se elige con `--sub`.

`connect` verifica la sesión y detecta la publicación antes de guardar nada. Dile que borre el
archivo al terminar. Una vez conectado, el subdominio sale en el estado; hasta entonces, no lo
sabes.

**No intentes sacar la cookie del navegador: está comprobado que no se puede.** `substack.sid` es
httpOnly, así que `document.cookie` no la incluye; `read_network_requests` no devuelve cabeceras; y
la propia extensión de Chrome bloquea la lectura de cookies. El navegador puede traer **datos**,
nunca una **sesión guardada**.

**Si se niega a tocar DevTools**, existe la vía del navegador: las peticiones salen desde la propia
página, que ya está autenticada. Los pasos están en **`<SKILL_DIR>/navegador.md`**; léelo en ese
momento. No la elijas por parecer más cómoda: no deja sesión guardada, así que el usuario tendrá
que estar delante en *cada* actualización futura.

**El navegador llena la base y se retira.** Termina siempre en `$CS load`, y a partir de ahí se
responde con `$CS q` como cualquier otro día. No se usa para mirar una cifra suelta, ni para
comprobar algo «rápido» en el panel, ni para buscar un dato que no aparecía en una consulta.

## Consultas

`$CS q <consulta> [--flags]` — todo sale como JSON por stdout. Empieza por `overview`.

| Consulta | Qué devuelve |
|---|---|
| `overview` | Totales, reparto por plan, altas de 30 y 90 días, último sync |
| `subscribers` | Contactos con filtros: `--plan` `--active` `--after` `--before` `--email` `--limit` |
| `subscriber` | Ficha de un contacto e historial de plan: `--email` |
| `readers` | Activos segmentados: abre-todo, regular, dormido, nunca-abre: `--segment` |
| `at-risk` | Recibe correos y hace tiempo que no abre; los de pago primero: `--days` |
| `candidates` | Free activos puntuados como candidatos a pago: `--limit` `--min-days` |
| `posts` | Posts con aperturas, clics, likes, comentarios, bajas y ratios: `--sort` `--from` `--to` |
| `post` | Ficha de un post y su evolución entre syncs: `--id` o `--slug` |
| `best-time` | Apertura media por día de la semana y hora: `--tz -4` `--min-posts` |
| `growth` | Altas por fuente y series diarias: `--from` `--to` `--group-by` |
| `series` | Suscriptores, seguidores, visitas, altas y bajas en una tabla: `--group-by` |
| `sources` | Calidad por fuente de captación: cuántos, cuánto abren, cuántos se van |
| `unsubscribes` | Quién se dio de baja, con nombre y fecha. **Es la consulta para «quién se fue».** |
| `churn` | Bajas y cambios de plan entre syncs |
| `referrers` | Quién te trae lectores |
| `overlap` | Publicaciones con tu misma audiencia, candidatas a recomendación |
| `notes` | Tus Notes con likes, restacks, respuestas y personas únicas: `--sort` |
| `note-engagers` | Quién interactúa más con tus Notes: `--kind` |
| `note` | Una Note con su texto y cada interacción con su persona: `--id` |
| `schema` | Tablas, DDL y conteos. Rara vez hace falta. |

Un nombre equivocado imprime la lista de nombres válidos; un flag fuera de su lista dice qué se
esperaba. Los errores de uso salen con código 2. `--limit` es 50 por defecto, y `--from`/`--to`
(igual que `--after`/`--before`) **incluyen el día entero en ambos extremos**.

Tres cosas que evitan el error fácil:

- **«De pago» significa quien paga.** `--plan paid` cubre los planes que cobran; `author`, `comp` y
  `gift` son `--plan other`. El propio usuario aparece como `author`: contarlo como suscriptor de
  pago infla la cifra que más le importa.
- **Ninguna consulta devuelve `0` donde el dato no existe**, siempre `null` o una lista vacía. Si
  ves un `null`, di que no hay dato; no lo leas como un cero.
- **`best-time` mide la hora de publicación**, porque el archivo de Substack no devuelve la hora de
  envío del correo. Para una newsletter son la misma, pero dilo así. Su campo `coverage` dice
  cuántos posts sostienen cada media: no saques conclusiones de una sola muestra.

## SQL libre

```bash
$CS sql "SELECT source, COUNT(*) n FROM subscribers WHERE is_active=1 GROUP BY source ORDER BY n DESC"
```

Solo `SELECT`/`WITH`, una sentencia, `LIMIT 200` por defecto (`--max-rows N` lo sube).

```
subscribers        email(PK), subscribed_at, source, is_active, plan, plan_since, unsubscribed_at, extra(JSON)
subscriber_snapshots  run_id, email, is_active, plan   -- un snapshot por sync: de aquí el histórico
posts              post_id(PK), title, subtitle, post_date, email_sent_at, type, audience, slug, wordcount
post_email_stats   post_id, run_id, views, open_rate, sent, delivered, opens, opened, clicks, clicked,
                   click_rate, likes, comments, shares, restacks, unsubscribes, finished_post, signups, subscribes
growth_sources     date, source, category, unique_visitors, new_subscribers, new_revenue
traffic            date(PK), views
subscriber_totals  date(PK), total_subscribers
followers_daily    date(PK), followers
unsubscribes       email, unsubscribed_at, subscribed_at, plan, source   -- bajas con su fecha real
visitor_sources    source(PK), category, views, users, free_signups      -- foto del rango completo
network_attribution  label, time_window, subscribers, pct_of_total
audience_location  location, metric, value
audience_overlap   subdomain(PK), name, author, percent_overlap
referrers          user_id(PK), name, handle, visitors, free_subscribers, paid_subscribers
pub_summary        metric(PK), value   -- retención, referidos, apertura y visitas de 30 días
subscriber_growth_daily  date(PK), new_free, unsubscribes, new_paid, upgrades, trials_started, cancellations_*
notes              note_id(PK), date, body, reaction_count, restacks, replies_count, attachments(JSON), stats(JSON)
note_actors        user_id(PK), name, handle, publication_subdomain, is_subscribed, is_following
note_interactions  note_id, actor_user_id, kind('like'|'restack'|'reply'), reply_id, created_at, body
sync_runs          id(PK), started_at, finished_at, status
```

**`subscribers.extra` es JSON con el engagement de cada contacto.** Léelo con `json_extract`:
`activity` (0-5), `emails_received_6mo`, `emails_opened_30d`, `last_email_open`, `links_clicked`,
`last_clicked_at`, `days_active_30d`, `post_views`, `comments`, `shares`, `country`, `revenue`,
`name`. Para «¿quién ha abierto todos mis correos?» compara `Unique emails seen (6mo)` con
`emails_received_6mo`, nunca las aperturas totales; y **castea las claves con espacios a entero**
(`CAST(json_extract(...) AS INTEGER)`), porque llegan como texto y en SQLite el texto nunca compara
igual que un número. O ahórratelo y usa `q readers`, que ya lo hace bien.

## Cuatro cosas que no debes afirmar de más

1. **Substack no dice quién LEE las Notes.** Solo quién interactúa. «Quién lee mis notas» no tiene
   respuesta; «quién interactúa» sí, con `note-engagers`.
2. **`matched_subscriber_email` casa por nombre exacto**, porque Substack no revela el email de
   quien da like. Es una pista, no una certeza; dilo cuando la uses. `note_actors.is_subscribed`
   sí lo dice Substack directamente y es más fiable.
3. **Hay dos clases de baja y no coinciden.** Substack solo anota la voluntaria, la de quien pulsa
   el enlace. Quien desaparece de la lista por un rebote, por marcar spam o por un borrado a mano
   no figura ahí, y stackchat sí lo detecta al comparar syncs, aunque entonces la fecha es la del
   sync que lo notó. `unsubscribes` devuelve las dos separadas; di de cuál hablas. `churn` añade
   los cambios de plan y necesita al menos dos syncs.
4. **Las fechas de la base son UTC.** Al hablar de «ayer» o de la hora de una nota, conviértelas a
   la zona del usuario; el sistema la da con `date +%z`.

Lo demás —formato del registro de sync, hook de refresco automático, `--full`, varias
publicaciones, variables de entorno y qué datos no existen— está en **`<SKILL_DIR>/referencia.md`**.
