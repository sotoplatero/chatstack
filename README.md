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

`constack` se usa como **skill** (`chatstack`), no como MCP: así no ocupa contexto en las sesiones
que no van de Substack. La fuente vive en `skills/chatstack/` y se enlaza a la carpeta de skills
del usuario con un *junction* de Windows (no necesita permisos de administrador):

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\chatstack" -Target "C:\Users\soto\projects\constack\skills\chatstack"
```

Al ser un enlace y no una copia, editar `skills/chatstack/SKILL.md` en el repo actualiza el skill
al instante. El skill invoca los comandos `q` y `sql` de abajo.

El servidor MCP sigue existiendo (`node dist/cli.js mcp`) por si lo prefieres en Claude Desktop:

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

### 2b. Consultar desde la terminal

```bash
node dist/cli.js q overview
node dist/cli.js q note-engagers --limit 10 --kind reply
node dist/cli.js q subscribers --plan free --active true --limit 20
node dist/cli.js sql "SELECT source, COUNT(*) n FROM subscribers GROUP BY source ORDER BY n DESC"
```

`q` sin argumentos (o con un nombre inexistente) lista las consultas disponibles con sus flags.
Todo sale como JSON por stdout; los errores de uso salen con código 2.

### 3. Preguntar

- "¿Cuántos suscriptores activos tengo y cuántos de pago?"
- "¿Qué posts tienen mejor tasa de apertura?"
- "¿Quiénes son los mejores candidatos a pasar a pago?"
- "¿De dónde vinieron las altas de agosto?"
- "¿Quién se dio de baja desde el último sync?"
- "¿Quién interactúa más con mis Notes? ¿Y quién las restackea?"
- "¿Qué Note tuvo más respuestas y quién respondió?"

## Herramientas MCP

Las mismas consultas están disponibles como `constack q <nombre>` y como tools MCP:

| `q <nombre>` / tool MCP | Qué hace |
|---|---|
| `overview` | Totales, reparto por plan, altas 30/90d, último sync |
| `subscribers` | Contactos con filtros (plan, activo, fechas, email) y paginación |
| `subscriber` | Ficha de un email + historial de plan por sync |
| `candidates` | Free activos ordenados como candidatos a pago (ver nota) |
| `posts` | Posts con views, open_rate, signups, subscribes |
| `growth` | Altas por fuente y series diarias free/paid, agrupadas |
| `churn` | Bajas y transiciones de plan entre syncs |
| `notes` | Tus Notes con likes, restacks, respuestas, personas únicas y adjuntos |
| `note-engagers` | Quién interactúa más con tus Notes, con desglose y `matched_subscriber_email` (por nombre) |
| `note` | Una Note con su texto, stats y cada like/restack/respuesta con la persona |
| `schema` | Tablas, DDL y conteos |
| `sql` | SELECT libre, solo lectura, LIMIT 200 por defecto |

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
src/queries.ts      consultas puras sobre la BD (las usan el CLI y el MCP)
src/queryCommand.ts despacho de `constack q <nombre> --flags`
src/mcp      registro de tools MCP sobre src/queries.ts
skills/chatstack    el skill (enlazado a ~/.claude/skills/chatstack)
tests        vitest con fixtures sintéticos
data/        BD y exports crudos (ignorado por git)
```

```bash
npm test
```
