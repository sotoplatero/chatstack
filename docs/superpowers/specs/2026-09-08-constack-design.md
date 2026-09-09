# constack — MCP server local para datos de Substack

Fecha: 2026-09-08. Réplica funcional de "StackContacts MCP Server" limitada a Substack.

## Objetivo
Que Claude (Code/Desktop) pueda consultar en lenguaje natural los suscriptores y
métricas de una publicación de Substack, sobre una base de datos local y con histórico.

## Alcance v1
- Plataforma: solo Substack. Gumroad y Kit quedan fuera (el diseño deja `platform` en
  las tablas para añadirlos después sin migrar).
- Datos: contactos individuales + agregados (posts, email stats, growth, traffic).
- Ingesta: automática por HTTP contra los endpoints internos del panel (los mismos que usa
  "Descargar CSV"), autenticada con la cookie de sesión del propietario, importada una vez
  desde un "Copy as cURL" de Chrome. Carga manual de CSV como respaldo.
  (Decisión 2026-09-09: la automatización de UI con agent-browser se descartó tras probarla —
  la UI cambió respecto al skill y los botones de exportar disparan estos endpoints, que
  devuelven 503 esporádicos; llamarlos directamente es más simple y robusto.)
- Ejecución: Node 22 + TypeScript, SQLite vía `node:sqlite`, MCP stdio con el SDK oficial.
  Todo local; nada sale de la máquina.

## Arquitectura
```
constack sync  → ingest/ (HTTP + cookie de sesión → ./data/raw/<timestamp>/*.csv)
               → load/   (CSV → SQLite ./data/constack.db, idempotente)
constack load <dir>      (solo load/, para CSV bajados a mano)
constack mcp   → mcp/    (server stdio, solo lectura)
```
Los tres módulos se comunican únicamente por el sistema de archivos y la BD.

## Modelo de datos (SQLite)
- `sync_runs(id, started_at, finished_at, status, raw_dir, notes)`
- `raw_files(id, run_id, kind, path, sha256, row_count)`
- `subscribers(email PK, first_seen_at, subscribed_at, source, is_active, plan, plan_since,
  unsubscribed_at, last_synced_run_id, extra JSON)` — estado actual.
- `subscriber_snapshots(run_id, email, is_active, plan, extra JSON)` — una fila por
  contacto y sync. El histórico (free→paid, bajas) se deriva comparando runs.
- `posts(post_id PK, title, subtitle, published_at, type, audience, url, word_count, extra JSON)`
- `post_email_stats(post_id, run_id, sent, opens, open_rate, clicks, click_rate,
  new_free_subs, new_paid_subs, unsubscribes, extra JSON)`
- `growth_sources(date, source, free_subs, paid_subs, run_id)`
- `traffic(date, source, views, run_id)`

`extra` guarda como JSON toda columna del CSV que el loader no mapea: nada se pierde
aunque Substack cambie los exports. El loader detecta el tipo de CSV por sus cabeceras,
no por el nombre del archivo.

## Engagement por suscriptor
Verificado 2026-09-09: el export "todas las columnas" (`subscriber_set/export`, 44 columnas)
trae `Activity` (0-5), emails abiertos 7d/30d/6mo, post views, clicks y días activos por
contacto. El loader lo normaliza a claves estables en `extra` y `find_upgrade_candidates`
ordena por ellas; con el export legado (sin engagement) degrada a antigüedad y lo declara.

## Notes (añadido 2026-09-09)
Tablas `notes`, `note_actors`, `note_interactions` (nota × persona × like|restack|reply).
Fuente: `substack.com/api/v1/reader/feed/profile/{user_id}` (paginado por cursor; se descartan
posts y restacks ajenos por `comment.user_id`), y por nota `comment/{id}/reactors`,
`comment/{id}/restackers`, `reader/comment/{id}/replies` (descendientes envueltos en
`{comment,type}`) y `note_stats/c-{id}` opcional. Rate limit 429: una petición a la vez con
pausa y backoff exponencial. Tools: `get_notes_performance`, `get_note_engagers`, `get_note`.

## Herramientas MCP
- `get_overview` — totales actuales, free/paid, último sync, tendencia 30/90 días.
- `list_subscribers(filter, limit, offset)` — filtros por plan, activo, fuente, fecha.
- `get_subscriber(email)` — ficha + historial de snapshots.
- `find_upgrade_candidates(limit)` — free activos ordenados por engagement (o proxy).
- `get_post_performance(sort, limit)` — posts con métricas de email y conversiones.
- `get_growth(from, to, group_by)` — altas por fuente y periodo.
- `get_churn(from, to)` — bajas y transiciones paid→free entre syncs.
- `query_sql(sql)` — SELECT de solo lectura sobre la BD; `get_schema` la acompaña.

Todas devuelven JSON compacto; `query_sql` rechaza cualquier sentencia que no sea SELECT
y aplica LIMIT por defecto.

## Errores
- Ingesta: cada descarga es independiente; si una falla, el resto se carga igual y el
  run queda `partial` con la nota. Sesión caducada → mensaje claro para repetir el
  import de cookies.
- Carga: CSV con cabeceras desconocidas → se guarda en `raw_files` con `kind=unknown`
  y no se carga; nunca se aborta el run completo.
- MCP: errores de SQL se devuelven como texto al modelo, no como crash.

## Pruebas
- Unitarias (vitest) para detección de tipo de CSV, parseo, upsert idempotente y
  derivación de transiciones entre snapshots, con fixtures CSV sintéticos.
- Las tools MCP se prueban contra una BD en memoria poblada con fixtures.
- La ingesta por navegador no se prueba automáticamente; se verifica manualmente.
