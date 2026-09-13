# La vía del navegador (plan B)

**Cuándo:** solo si el usuario ha rechazado dar el cURL, existen herramientas
`mcp__claude-in-chrome__*`, y tu shell corre en la misma máquina que Chrome. Si falta cualquiera de
las tres, vuelve a SKILL.md y pide el cURL.

No deja sesión guardada, así que `sync` seguirá sin funcionar y habrá que repetir esto entero cada
vez que quiera datos frescos. Adviérteselo antes de empezar, en una línea, y sigue.

**El subdominio no se pregunta.** Sale de `~/.stackchat/config.json` si ya conectó alguna vez, y si
no, de la propia página: navega a `https://substack.com/publish/home`, que redirige a su
publicación, y léelo de la URL. Pregunta solo si las dos cosas fallan.

**1. Estadísticas de la publicación**

- `navigate` a `https://<subdominio>.substack.com/publish/home`
- `javascript_tool` con el contenido de **`<SKILL_DIR>/browser/01-publication.js`**.
  Devuelve enseguida `{arrancado}`: la página sigue trabajando sola.
- **No te quedes esperando.** Dile que tarda alrededor de un minuto y sigue atendiéndole.
  Comprueba `window.__stackchat` cuando vuelvas a intervenir; si `listo` es `true`, recógelo.
- Lee `window.__stackchat.datos`, guárdalo con Write en
  `<carpeta temporal>/stackchat-publication.json` y ejecuta `$CS load <carpeta temporal>`.

Los datos vuelven por el resultado del tool. **No los descargues ni los hagas pasar por el
usuario**: el snippet no descarga nada a propósito, precisamente para que no haya archivos que
mover a mano.

**2. El CSV de suscriptores** — la única descarga de todo el proceso

`window.__stackchat.datos.email_list_url` trae un enlace absoluto. **No se puede leer con `fetch`**:
redirige a S3 sin cabeceras CORS y el navegador corta la lectura. Está comprobado, no lo reintentes.
La única forma es que Chrome lo descargue navegando a esa URL.

1. Avísale en una línea: vas a abrir el enlace del export, Chrome lo va a descargar, y si pide
   permiso que lo acepte. No es una pregunta: díselo y sigue.
2. `navigate` a la URL.
3. **Recógelo tú de su carpeta de Descargas.** Búscalo por el archivo más reciente que encaje
   (`email_list*.csv`, `*subscriber*.csv`) en `~/Downloads` o el equivalente de su sistema. Muévelo
   a la carpeta temporal y ejecuta `$CS load <carpeta>`.

**Nunca le pidas que te suba el archivo ni que lo mueva él.** Si no aparece en unos segundos,
díselo claramente: Chrome bloquea las descargas automáticas de un sitio tras la primera, y hace
falta que lo permita a mano. No des por hecho que se descargó.

**3. Notes**

- `navigate` a `https://substack.com`
- `javascript_tool` con **`<SKILL_DIR>/browser/02-notes.js`**.
- Con 200+ notas tarda varios minutos. **Tampoco esperes**: avisa, sigue respondiendo, y recógelo
  cuando vuelvas a intervenir. `progreso` marca `hechas/total` si quieres informar del avance.
- Lee `window.__stackchat.datos`, guárdalo como `stackchat-notes.json` y `$CS load <carpeta>`.

**Este paso no es opcional y no se pregunta.** Que tarde no es motivo para saltárselo ni para
convertirlo en «¿quieres que también traiga las notas?». Lánzalo, dilo, y sigue atendiendo con lo
que ya tengas cargado: los artículos se pueden responder mientras las notas bajan.

**Cuesta contexto**: las estadísticas rondan los 25 KB, el bundle de Notes pasa de 400 KB con 200+
notas.

**Al terminar, dile que dé el cURL una vez** para que los siguientes syncs sean automáticos y esto
no haya que repetirlo.
