# constack

MCP server local para tus datos de Substack. Réplica de "StackContacts MCP Server" limitada a Substack:
descarga los exports de tu panel, los guarda en una base SQLite con histórico, y expone herramientas
para que Claude (Code o Desktop) responda preguntas sobre tus suscriptores y tu contenido.

Todo corre en tu máquina. Nada sale de ella.

## Requisitos

- Node 22.13+ (usa `node:sqlite`, sin compilar nada nativo)
- Para `sync` automático: [`agent-browser`](https://www.npmjs.com/package/agent-browser) instalado globalmente

## Instalación

```bash
npm install
npm run build
```

## Uso

### 1. Meter datos

**Automático** — usa tu sesión de Substack ya iniciada en Chrome. La primera vez hay que importar cookies:

1. En Chrome, en `https://<tu-sub>.substack.com/publish/home`, abre DevTools → Network → recarga.
2. Clic derecho en la primera petición → Copy → **Copy as cURL (bash)**. Pégalo en un archivo, p. ej. `substack.curl`.
3. `node dist/cli.js sync --sub <tu-sub> --cookies substack.curl`

La sesión queda guardada en `data/substack-auth.json`; los siguientes syncs no necesitan `--cookies`:

```bash
node dist/cli.js sync --sub <tu-sub>
```

Borra `substack.curl` cuando termines: contiene tu sesión.

**Manual** — exporta los CSV desde el panel (Audiencia → export; Stats → Posts ⋯ → Download;
Audiencia → Growth → export; Stats → Traffic → export; Settings → Import/Export → New export para el ZIP)
y cárgalos desde una carpeta:

```bash
node dist/cli.js load ./carpeta-con-csvs
```

El tipo de cada CSV se detecta por sus cabeceras, no por el nombre. Los ZIP se expanden solos.
Recargar la misma carpeta no duplica nada.

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
| `get_schema` | Tablas, DDL y conteos |
| `query_sql` | SELECT libre, solo lectura, LIMIT 200 por defecto |

**Nota sobre engagement por contacto**: el export de suscriptores de Substack trae
`email, active_subscription, expiry, plan, email_disabled, created_at, first_payment_at` — sin aperturas ni
clicks individuales. `find_upgrade_candidates` lo declara en su respuesta (`method`) y ordena por antigüedad
entre free activos. Si algún día el export trae engagement, el loader lo guarda en `extra` y la tool lo usa
automáticamente.

## Histórico

Cada sync guarda un snapshot por suscriptor. De comparar snapshots salen las transiciones free→pago,
pago→free y las bajas (un contacto activo que desaparece del export). Con un sync semanal tienes la
evolución real de tu lista, algo que ningún CSV suelto te da.

## Estructura

```
src/db       esquema SQLite y helpers
src/load     detección de CSV por cabeceras + loaders idempotentes
src/ingest   descarga vía agent-browser con la sesión del propietario
src/mcp      queries puras + registro de tools MCP
tests        vitest con fixtures sintéticos
data/        BD y exports crudos (ignorado por git)
```

```bash
npm test
```
