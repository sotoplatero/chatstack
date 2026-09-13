# La vía del navegador (plan B)

**Cuándo:** solo si el usuario ha rechazado dar el cURL y existen herramientas
`mcp__claude-in-chrome__*`. Funciona aunque tu shell no vea el disco del usuario: nada pasa por su
carpeta de Descargas.

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

**2. Suscriptores** — los básicos vienen dentro del paso 1; el detalle, por el registro de red

El snippet los trae por la API JSON del panel (`subscriber-stats`, paginada de 100 en 100) y los
emite como `email_list.csv` dentro de `files`. Con el `$CS load` del paso 1 ya están cargados:
email, nombre, plan, fecha de alta, puntuación de actividad e ingresos. Eso basta para contar,
listar, ver quién es de pago, candidatos por actividad y churn entre cargas.

**Lo único que la API no da** son las aperturas, los clics y los días activos por persona. Eso
viene en el export en CSV, y se consigue **sin descarga de Chrome y sin tocar Descargas**:

La URL del export redirige a S3 con una firma válida 24 h. El navegador no puede leer el CSV
(CORS), pero el snippet hace ese `fetch` fallido a propósito para que la redirección quede en el
registro de red. De ahí la sacas tú y la bajas con tu shell.

1. **Antes de ejecutar el snippet del paso 1**, llama una vez a `read_network_requests` sobre la
   pestaña (con `clear: true`). La captura solo empieza cuando se llama por primera vez; si lo haces
   después, la redirección no estará.
2. Cuando `window.__stackchat.listo` sea `true`, `read_network_requests` con
   `urlPattern: "amazonaws"`. La única entrada es la URL firmada del CSV.
3. Bájala con `curl -s -o <carpeta temporal>/email_list.csv "<url>"` (o `fetch` desde Node). No
   lleva cookie: la firma va en la propia URL.
4. `$CS load <carpeta temporal>`. Sobreescribe la versión básica con la completa.

Si la entrada no aparece, casi seguro es que la captura arrancó tarde: repite el snippet con la
captura ya activa. Si sigue sin aparecer, responde con lo que la API sí da y di en una línea que
el detalle de aperturas quedó fuera. **Nunca le pidas al usuario que descargue ni suba nada.**

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
