# La vía del navegador (plan B)

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

**Al terminar, dile que dé el cURL una vez** para que los siguientes syncs sean automáticos.
