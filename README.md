# chatstack

Tus datos de Substack en una base SQLite local que puedes preguntar en lenguaje natural, desde
Claude Code.

> ¿Quién ha abierto todos mis correos?
> ¿Quién interactúa más con mis Notes?
> ¿De dónde vinieron las altas de agosto?
> ¿Quiénes son mis mejores candidatos a pasar a pago, y por qué?

Substack reparte esas respuestas entre cinco pantallas y varios CSV que hay que descargar a mano.
chatstack los reúne en una base local y se los da a Claude.

**Todo se queda en tu máquina.** No hay servidor, no hay cuenta que crear, no se envía nada a
ningún sitio. La base es un archivo en `~/.chatstack/`.

## Qué reúne

| Datos | Qué incluye |
|---|---|
| **Suscriptores** | Email, plan, fecha de alta, fuente, país y **engagement individual**: puntuación de actividad (0-5), correos recibidos y abiertos (7d/30d/6m), clics, vistas de posts, días activo |
| **Posts** | Título, fecha, audiencia, visitas, tasa de apertura, altas gratuitas y de pago generadas |
| **Crecimiento** | Altas por fuente y día, tráfico diario, series de free/paid, bajas y cancelaciones |
| **Notes** | Tus notas y **quién da like, quién restackea y quién responde**, con su nombre, su publicación y si te sigue |
| **Histórico** | Cada sync guarda un snapshot: de comparar snapshots salen los upgrades, los downgrades y las bajas |

## Instalar

chatstack es un **skill**: no hay que registrar ningún servidor MCP.

```bash
npx skills add sotoplatero/chatstack
```

Eso es todo. Sirve para Claude Code, Cursor, Codex, Cline y el resto de agentes que soporta
[`skills`](https://github.com/vercel-labs/skills). Añade `-g` para instalarlo globalmente o `-p`
para dejarlo solo en el proyecto actual.

Único requisito: **Node 22.13 o superior** (`node --version`). Usa `node:sqlite`, así que no hay
nada que compilar ni ningún `npm install`.

<details>
<summary>Instalar a mano, sin el CLI de skills</summary>

La carpeta `skills/chatstack` es autocontenida (SKILL.md + el binario + los snippets), así que
basta con dejarla donde tu agente busca los skills:

```bash
# macOS / Linux
git clone https://github.com/sotoplatero/chatstack.git ~/chatstack
ln -s ~/chatstack/skills/chatstack ~/.claude/skills/chatstack
```

```powershell
# Windows (junction: no pide permisos de administrador)
git clone https://github.com/sotoplatero/chatstack.git $HOME\chatstack
New-Item -ItemType Junction -Path "$HOME\.claude\skills\chatstack" -Target "$HOME\chatstack\skills\chatstack"
```

Enlazado en vez de copiado, un `git pull` lo actualiza sin tocar nada más.

</details>

Para comprobar que quedó bien, abre tu agente y pregúntale *«¿cuántos suscriptores tengo?»*:
debería ofrecerse a conectar tu Substack.

## Conectar tu Substack

Abre Claude Code y pídele *«conecta mi Substack»*. El skill se encarga; hay dos caminos y elige
el que tengas disponible.

**Con la extensión Claude in Chrome** — no tocas nada: Claude abre tu panel, lanza las consultas
desde la propia página (tu navegador ya está autenticado) y carga los resultados. Tu cookie no se
copia a ningún archivo.

**Sin ella** — le das tu sesión una vez:

1. En Chrome, abre `https://<tu-subdominio>.substack.com/publish/home`, ya logueado.
2. `F12` → pestaña **Network** → recarga con `Ctrl+R`.
3. Clic derecho en la primera petición → **Copy** → **Copy as cURL (bash)**.
4. Pégalo en un archivo de texto y pásale la ruta a Claude.

Por debajo eso es `chatstack connect --cookies <archivo>`, que verifica la sesión y detecta tu
publicación antes de guardar nada. **Borra ese archivo al terminar: contiene tu sesión.**

Después, `chatstack sync` descarga todo (3-4 minutos la primera vez; Substack limita el ritmo al
recorrer las Notes).

**Los siguientes syncs son incrementales y tardan ~10 segundos.** El feed del perfil ya devuelve
los likes, restacks y respuestas de cada nota, así que basta comparar esos contadores con la base:
solo se piden las interacciones de las notas que cambiaron. `--full` fuerza el sync completo.

### Que se refresque solo

Un hook de `SessionStart` en `~/.claude/settings.json` mantiene los datos frescos sin que lo pidas:

```json
{ "hooks": { "SessionStart": [{ "hooks": [{
  "type": "command",
  "command": "node ~/.claude/skills/chatstack/bin/chatstack.cjs sync --if-stale 6 --background",
  "async": true
}] }] } }
```

`--if-stale 6` sale en milisegundos si los datos tienen menos de 6 horas, así que en casi todas tus
sesiones no hace nada. `--background` se desasocia y devuelve al instante: `SessionStart` bloquea el
arranque de la sesión hasta que el comando termina. Y un candado impide que varias sesiones abiertas
lancen syncs simultáneos contra una API que ya limita por ritmo.

`chatstack status` muestra en `last_background_sync` cómo fue el último.

## Usar sin Claude

El binario funciona solo:

```bash
CS="node ~/.claude/skills/chatstack/bin/chatstack.cjs"

$CS status
$CS q overview
$CS q note-engagers --limit 10 --kind reply
$CS q subscribers --plan free --active true --limit 20
$CS sql "SELECT source, COUNT(*) n FROM subscribers WHERE is_active=1 GROUP BY source ORDER BY n DESC"
```

`$CS q` sin argumentos lista las once consultas con sus flags. Todo sale como JSON por stdout.
`sql` acepta solo `SELECT`/`WITH`, una sentencia, con `LIMIT 200` por defecto.

## Lo que esto no puede hacer

- **No dice quién lee tus Notes.** Substack no lo expone. Sí dice quién interactúa: like, restack
  o respuesta, con nombre y publicación.
- **No conecta el email de un suscriptor con su cuenta de Substack.** Quien da like es un usuario
  de substack.com; el export de suscriptores da emails. No hay clave común: chatstack intenta
  casarlos por nombre exacto y lo presenta como pista, nunca como certeza.
- **No publica ni modifica nada.** Es de solo lectura, de principio a fin.
- **Usa la API interna del panel de Substack**, la misma que mueven sus botones de «Descargar CSV».
  No es una API pública con contrato: Substack puede cambiarla sin avisar y romper una descarga.
  Cuando pasa, el resto se carga igual y el sync queda marcado como `partial`.

## Desarrollo

```bash
npm install
npm test          # 72 tests
npm run build     # tsc + snippets del navegador + bundle del skill
```

```
src/ingest/endpoints.ts  única lista de endpoints de Substack (la usan Node y el navegador)
src/ingest/              descarga por HTTP con la cookie de sesión
src/load/                detección de CSV por cabeceras y carga idempotente en SQLite
src/queries.ts           las consultas sobre la base
src/queryCommand.ts      despacho de `chatstack q <nombre> --flags`
src/mcp/                 servidor MCP opcional, sobre las mismas consultas
skills/chatstack/        el skill: SKILL.md + bundle + snippets de navegador
```

Los snippets de `skills/chatstack/browser/` se **generan** desde `src/ingest/endpoints.ts`
(`npm run build:browser`): así no hay dos listas de URLs que se desincronicen. No los edites a mano.

El bundle (`skills/chatstack/bin/chatstack.cjs`) se genera con esbuild y es lo que se instala.
Hay un test que lo ejecuta aislado, porque es lo único que detecta fallos de empaquetado.

### MCP (opcional)

Las mismas consultas están disponibles como servidor MCP para Claude Desktop:

```json
{
  "mcpServers": {
    "chatstack": {
      "command": "node",
      "args": ["<ruta>/dist/cli.js", "mcp"]
    }
  }
}
```

Se usa el skill por defecto porque un MCP ocupa contexto en todas las sesiones, también en las que
no van de Substack; un skill se carga solo cuando hace falta.

## Licencia

MIT. No está afiliado a Substack.
