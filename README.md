# constack

MCP server local para tus datos de Substack. Réplica de "StackContacts MCP Server" limitada a Substack:
descarga los exports de tu panel, los guarda en una base SQLite con histórico, y expone herramientas
para que Claude (Code o Desktop) responda preguntas sobre tus suscriptores y tu contenido.

Todo corre en tu máquina. Nada sale de ella.

## Requisitos

- Node 22.13+ (usa `node:sqlite`, sin compilar nada nativo). Nada más: la ingesta es HTTP puro.

## Instalación

```bash
npm install
npm run build
```

## Uso

### 1. Meter datos

**Automático (`sync`)** — llama a los mismos endpoints que usa el botón "Descargar CSV" del panel,
autenticado con tu cookie de sesión. La primera vez hay que dársela:

1. En Chrome, logueado, abre `https://<tu-sub>.substack.com/publish/home`.
2. `F12` → **Network** → recarga con `Ctrl+R`.
3. Clic derecho en la primera petición (`home`) → **Copy → Copy as cURL (bash)**. Pégalo en un archivo, p. ej. `substack.curl`.
4. `node dist/cli.js sync --sub <tu-sub> --cookies substack.curl`

La cookie queda en `data/substack-auth.json` (ignorado por git, permisos 600). Los siguientes syncs no necesitan nada:

```bash
node dist/cli.js sync --sub <tu-sub>
```

Borra `substack.curl` al terminar: contiene tu sesión. Cuando Substack la caduque, `sync` lo dirá y repites el paso.

Qué descarga cada sync (a `data/raw/<timestamp>/`):

| Archivo | Endpoint del panel | Contenido |
|---|---|---|
| `email_list.csv` | `POST subscriber_set` → `POST subscriber_set/export` → sondeo → fichero | **125 contactos × 44 columnas**: plan, fechas, fuente, país y **engagement individual** (Activity 0-5, emails abiertos 7d/30d/6mo, post views, clicks, días activos) |
| `posts.csv` | `GET /api/v1/archive` paginado | Posts publicados (id, título, fecha, audiencia, tipo, url, palabras) |
| `email_stats.csv` | `stats/email_stats?format=csv` | Views, open_rate, engagement, signups y subscribes por post |
| `growth_sources.csv` | `stats/growth/sources` | Visitantes, altas e ingresos por fuente y día |
| `traffic.csv` | `stats/publication_traffic/timeseries` en tramos de 90 días | Vistas diarias |
| `paid_subscriber_growth.csv` | `stats/paid_subscriber_growth?period=day` | Altas de pago, upgrades, trials, cancelaciones por día |
| `subscriber_totals.csv` | `stats/emails/timeseries?resolution=day` | Total de suscriptores por día |
| `notes.json` | `reader/feed/profile/{user_id}` paginado + por nota `comment/{id}/reactors`, `comment/{id}/restackers`, `reader/comment/{id}/replies`, `note_stats/c-{id}` | **Tus Notes y quién interactúa**: cada like, restack y respuesta con la persona (nombre, handle, publicación, si te sigue). `note_stats` (impresiones) solo cuando Substack ya lo publicó (~24h) |

Los endpoints devuelven 503 esporádicos y `substack.com` limita por ritmo (429); el cliente
va de una en una con pausa y reintenta con espera creciente. Un sync completo con ~230 notas
tarda unos 3-4 minutos. Si Substack
cambia alguno, el resto se descarga igual y el run queda `partial`.

**Manual (`load`)** — cualquier CSV/ZIP exportado a mano desde el panel, en una carpeta:

```bash
node dist/cli.js load ./carpeta-con-csvs
```

El tipo de cada CSV se detecta por sus cabeceras, no por el nombre; acepta tanto el export actual
de suscriptores como el legado (`email,active_subscription,…`). Recargar no duplica nada.

### 2. Conectar a Claude Code

```bash
claude mcp add constack -- node --no-warnings=ExperimentalWarning C:/Users/soto/projects/constack/dist/cli.js mcp --db C:/Users/soto/projects/constack/data/constack.db
```

Para Claude Desktop, en `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "constack": {
      "command": "node",
      "args": ["--no-warnings=ExperimentalWarning", "C:/Users/soto/projects/constack/dist/cli.js", "mcp",
               "--db", "C:/Users/soto/projects/constack/data/constack.db"]
    }
  }
}
```

### 3. Preguntar

- "¿Cuántos suscriptores activos tengo y cuántos de pago?"
- "¿Qué posts tienen mejor tasa de apertura?"
- "¿Quiénes son los mejores candidatos a pasar a pago?"
- "¿De dónde vinieron las altas de agosto?"
- "¿Quién se dio de baja desde el último sync?"
- "¿Quién interactúa más con mis Notes? ¿Y quién las restackea?"
- "¿Qué Note tuvo más respuestas y quién respondió?"

## Herramientas MCP

| Tool | Qué hace |
|---|---|
| `get_overview` | Totales, reparto por plan, altas 30/90d, último sync |
| `list_subscribers` | Contactos con filtros (plan, activo, fechas, email) y paginación |
| `get_subscriber` | Ficha de un email + historial de plan por sync |
| `find_upgrade_candidates` | Free activos ordenados como candidatos a pago (ver nota) |
| `get_post_performance` | Posts con views, open_rate, signups, subscribes |
| `get_growth` | Altas por fuente y series diarias free/paid, agrupadas |
| `get_churn` | Bajas y transiciones de plan entre syncs |
| `get_notes_performance` | Tus Notes con likes, restacks, respuestas, personas únicas y adjuntos |
| `get_note_engagers` | Quién interactúa más con tus Notes, con desglose y `matched_subscriber_email` (por nombre) |
| `get_note` | Una Note con su texto, stats y cada like/restack/respuesta con la persona |
| `get_schema` | Tablas, DDL y conteos |
| `query_sql` | SELECT libre, solo lectura, LIMIT 200 por defecto |

**Engagement por contacto**: el export "todas las columnas" de Audiencia → Exportar trae `Activity` (0-5),
emails abiertos (7d/30d/6mo), post views, clicks y días activos. El loader lo guarda normalizado en `extra`
(`activity`, `emails_opened_30d`, `days_active_30d`, …) y `find_upgrade_candidates` ordena por eso. Si la BD
solo tiene el export legado (sin engagement), la tool degrada a antigüedad y lo declara en `method`.

**Notes y suscriptores son mundos distintos en Substack**: quien da like es un usuario de
substack.com (id, nombre, handle), y el export de suscriptores da emails. No hay clave común;
`matched_subscriber_email` casa por nombre exacto y es una pista, no una certeza.

## Histórico

Cada sync guarda un snapshot por suscriptor. De comparar snapshots salen las transiciones free→pago,
pago→free y las bajas (un contacto activo que desaparece del export). Con un sync semanal tienes la
evolución real de tu lista, algo que ningún CSV suelto te da.

## Estructura

```
src/db       esquema SQLite y helpers
src/load     detección de CSV por cabeceras + loaders idempotentes
src/ingest   cliente HTTP de los endpoints del panel + manejo de la cookie de sesión
src/mcp      queries puras + registro de tools MCP
tests        vitest con fixtures sintéticos
data/        BD y exports crudos (ignorado por git)
```

```bash
npm test
```
