---
name: chatstack
description: >-
  Responde cualquier pregunta sobre el Substack del usuario consultando su base
  de datos local: cuántos suscriptores tiene y de dónde vienen, quién abre sus
  correos y quién no, quién es candidato a pasar a pago, qué posts convierten
  mejor, quién se dio de baja, y quién da like, restackea o responde a sus
  Notes. Úsalo SIEMPRE que el usuario pregunte por sus suscriptores, su
  newsletter, sus lectores, sus aperturas, su crecimiento, sus altas o bajas,
  sus posts o sus notas de Substack — incluso si no dice "Substack", basta con
  que hable de "mis suscriptores", "mi newsletter", "quién me lee" o "mis
  notas". También para refrescar los datos ("actualiza", "sincroniza") y para
  saber cuándo fue el último sync. No sirve para publicar ni modificar nada en
  Substack: es de solo lectura.
---

# chatstack — preguntar a tus datos de Substack

Base SQLite local en `C:/Users/soto/projects/constack/data/constack.db`, con suscriptores
(incluido su engagement individual), posts, crecimiento por fuente, tráfico y Notes con
quién interactúa en cada una. Todo local; nada sale de la máquina.

## Cómo ejecutar

Desde cualquier carpeta, con rutas absolutas:

```bash
CS="node --no-warnings=ExperimentalWarning C:/Users/soto/projects/constack/dist/cli.js"
CSDB="--db C:/Users/soto/projects/constack/data/constack.db"
$CS q overview $CSDB
```

Todo sale como JSON por stdout. `--no-warnings=ExperimentalWarning` evita el aviso de
`node:sqlite` en stderr. Sin `--db`, el CLI busca `./data/constack.db` relativo al cwd, así que
**pasa siempre `--db` salvo que estés dentro del repo**.

## Consultas con nombre

`$CS q <consulta> [--flags] $CSDB`

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

Un nombre equivocado imprime la lista de nombres válidos. Un flag fuera de la lista cerrada
falla con el valor esperado, en vez de colarse al SQL.

## SQL libre

Para lo que las consultas con nombre no cubren:

```bash
$CS sql "SELECT source, COUNT(*) n FROM subscribers WHERE is_active=1 GROUP BY source ORDER BY n DESC" $CSDB
```

Solo `SELECT`/`WITH`, una sentencia, `LIMIT 200` por defecto (`--max-rows N` lo sube).
`replace()`, `char()` y buscar palabras como `'%update%'` dentro de literales funcionan.

### Esquema

```
subscribers        email(PK), subscribed_at, source, is_active, plan, plan_since,
                   unsubscribed_at, extra(JSON)
subscriber_snapshots  run_id, email, is_active, plan   -- un snapshot por sync: de aquí sale el histórico
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

Para "¿quién ha abierto todos mis correos?" compara `Unique emails seen (6mo)` con
`emails_received_6mo`, no las aperturas totales.

## Refrescar los datos

```bash
cd C:/Users/soto/projects/constack && node --no-warnings=ExperimentalWarning dist/cli.js sync --sub sotoplatero
```

Tarda 3-4 minutos (Substack limita el ritmo en Notes). Si dice que la sesión caducó, el usuario
tiene que dar un cURL nuevo: en Chrome, en `https://sotoplatero.substack.com/publish/home`,
F12 → Network → recargar → clic derecho en la primera petición → Copy as cURL (bash), guardarlo
en un archivo y pasar `--cookies <archivo>`. Ese archivo contiene su sesión: bórralo al terminar.

Antes de responder, mira `last_sync` de `overview`: si es de hace días, dilo u ofrece sincronizar.

## Tres cosas que no debes afirmar de más

1. **Substack no dice quién LEE tus Notes.** Solo quién interactúa (like, restack, respuesta).
   "Quién lee mis notas" no tiene respuesta; "quién interactúa" sí, con `note-engagers`.
2. **`matched_subscriber_email` casa por nombre exacto**, porque Substack no revela el email de
   quien da like. Es una pista, no una certeza — dilo cuando la uses.
3. **Los suscriptores nuevos no tienen histórico.** Las transiciones de plan y las bajas salen de
   comparar snapshots entre syncs, así que `churn` necesita al menos dos syncs para decir algo.

Las fechas de la BD son UTC. El usuario está en America/New_York (UTC−4 en verano): al hablar de
"ayer" o de la hora de una nota, convierte.
