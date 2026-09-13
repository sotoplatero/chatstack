# La vía del navegador

**Cuándo:** cuando el usuario no quiere (o no puede) pegar el cURL, existen herramientas
`mcp__claude-in-chrome__*` y tu shell ve la carpeta de Descargas del usuario. No hace falta que el
usuario toque DevTools en ningún momento.

**Lo que esta vía no puede hacer.** No deja sesión guardada: `substack.sid` es `httpOnly` y la
extensión bloquea explícitamente la lectura de cookies (`[BLOCKED: Cookie/query string data]`). Así
que trae datos, pero `sync` seguirá sin funcionar y habrá que repetir el paso 1 cada vez que quiera
datos frescos. Dilo en una línea antes de empezar y sigue.

**El subdominio no se pregunta.** Sale de `~/.stackchat/config.json` si ya conectó alguna vez, y si
no, de la propia página: navega a `https://substack.com/publish/home`, que redirige a su
publicación, y léelo de la URL. Pregunta solo si las dos cosas fallan.

---

## Cómo salen los datos de la página (vale para los dos snippets)

Una sola versión verdadera; si un comentario viejo dice otra cosa, mienten los comentarios:

- **El resultado de `javascript_tool` se trunca a ~1 KB.** Está medido. No sirve para sacar el JSON
  (publicación ronda 100 KB; Notes pasa de 400 KB). **Trocearlo con `P.json.slice(...)` tampoco
  funciona:** cada trozo se trunca igual. No lo intentes.
- La salida es **una descarga por snippet**: `window.__stackchat.descargar()`. Chrome solo bloquea
  las descargas automáticas **repetidas** de un sitio; una por snippet pasa.
- El CSV completo de suscriptores **no** se descarga: se baja con `curl` desde una URL firmada de
  S3 que el snippet deja en el registro de red. Ese camino no toca la carpeta de Descargas.

Antes de empezar, comprueba que tu shell **ve la carpeta de Descargas** del usuario (`~/Downloads` o
equivalente). Si no la ve —Cowork sin esa carpeta adjunta, sesión remota— esta vía no puede
terminar: dilo en una línea y pide el cURL. **Nunca** le pidas al usuario que guarde, mueva o suba
un archivo.

---

## Paso 1 — Publicación (obligatorio): una navegación, un snippet, una descarga

Este paso trae **todas** las estadísticas de la publicación en un solo bundle: posts, estadísticas
por correo, tráfico diario, fuentes de crecimiento y de visita, series de suscriptores totales,
seguidores y bajas, lista de bajas con fecha, atribución de red, países, solapamiento de audiencia,
quién te refiere lectores y las cifras sueltas del panel. Quince archivos.

1. `navigate` a `https://<subdominio>.substack.com/publish/home`.
2. `read_network_requests` sobre esa pestaña con `clear: true`. **Tiene que ser ahora**, antes del
   snippet: la captura solo empieza cuando se llama por primera vez, y si lo haces después la
   redirección a S3 del export no estará registrada.
3. `javascript_tool` con el contenido de **`<SKILL_DIR>/browser/01-publication.js`**. Devuelve
   enseguida `{arrancado}`: la página sigue trabajando sola.
4. **No te quedes esperando.** Dile que tarda alrededor de un minuto y sigue atendiéndole. Cuando
   vuelvas a intervenir, `javascript_tool` con
   `({listo: window.__stackchat.listo, fase: window.__stackchat.fase, progreso: window.__stackchat.progreso, resumen: window.__stackchat.resumen})`.
   Cabe en 1 KB. `avisos` cuenta los tramos o páginas que se saltaron; si no es 0, lee
   `window.__stackchat.avisos` y dilo al informar.
5. Con `listo: true`, `javascript_tool` con `window.__stackchat.descargar()`.
6. `read_network_requests` con `urlPattern: "amazonaws"`. La única entrada es la URL firmada del
   CSV completo de suscriptores (válida 24 h).
7. En **una sola** llamada de shell: mueve el JSON de Descargas a una carpeta, baja el CSV a **otra
   carpeta distinta**, y carga las dos por separado (ver abajo por qué).

```sh
mkdir -p /tmp/sc-bundle /tmp/sc-subs
mv ~/Downloads/stackchat-publication.json /tmp/sc-bundle/
curl -s -o /tmp/sc-subs/email_list.csv "<URL firmada de S3>"   # sin cookie: la firma ya autoriza
$CS load /tmp/sc-bundle
$CS load /tmp/sc-subs
```

### Carpetas separadas, y por qué

`src/load/index.ts` carga **primero** los CSV sueltos del directorio y **después** los bundles JSON.
Si dejases el CSV completo de suscriptores junto al bundle, cualquier `email_list.csv` de dentro del
bundle se cargaría el último y pisaría el `extra` del completo, justo el que lleva aperturas y
clics. El snippet ya evita meter una lista básica cuando el export está disponible, pero mantén las
dos carpetas de todos modos: es la defensa que no depende de que el snippet acierte.

### Coste medido

- **Peticiones que hace el snippet:** 19 fijas (2 del export, 7 CSV, 4 JSON de audiencia y bajas,
  5 resúmenes, 1 *fetch* fallido a propósito contra S3) **más** paginación: `⌈posts/50⌉+1` para el
  archivo, `⌈bajas/20⌉`, `⌈referidos/20⌉` y unos pocos sondeos del export. Una publicación pequeña
  ronda las **25**; una de 500 bajas y 150 posts, unas **55**. El tráfico va en **una** petición
  (`resolution=day`), no en once.
- **Llamadas de herramienta tuyas:** **7** en el camino feliz (navigate, read_network_requests,
  javascript_tool ×3, read_network_requests, una de shell). Cada vuelta extra a comprobar `listo`
  suma una.

### Si algo del paso 1 falla

- `avisos` no vacío: informa de qué archivo quedó corto. El snippet ya reintenta 429 y 5xx cuatro
  veces respetando `Retry-After`; un aviso significa que aun así no hubo manera.
- `error` con "sesion caducada" o avisos con `__sesion`: el usuario no tiene sesión iniciada en esa
  pestaña. Pídele que entre y repite desde el punto 1.
- La entrada de `amazonaws` no aparece: casi seguro la captura arrancó tarde. Ejecuta
  `await window.__stackchat.rescatarSuscriptores()` (rellena la lista básica desde la API JSON y
  rehace el bundle), vuelve a llamar a `descargar()` y carga solo esa carpeta. Di en una línea que
  las aperturas y los clics por persona quedaron fuera.

---

## Paso 2 — Suscriptores: qué camino se usa y qué se pierde con el otro

Hay dos caminos y el snippet elige solo. **El principal es el export completo** (el CSV firmado de
S3 del punto 6): son las mismas 44 columnas que trae `sync` por Node, así que la base local queda
idéntica por las dos vías. Se prefiere porque es **una** petición para toda la lista y porque trae
lo que de verdad se pregunta: aperturas, clics, días activos, país, atribución free/paid, fecha de
baja, correos recibidos y rebotados, nivel bestseller.

**El plan B es `subscriber-stats`**, la API JSON de la tabla del panel (paginada de 100 en 100, sin
descarga y sin CORS). El snippet solo cae a ella si el export no llega a estar listo, y entonces sí
mete `email_list.csv` dentro del bundle. Con ella tienes email, nombre, plan, fecha de alta,
puntuación de actividad e ingresos: basta para contar, listar, ver quién es de pago, ordenar
candidatos por actividad y medir churn entre cargas.

**Lo que se pierde con el plan B:** aperturas, clics, días activos, país/estado, atribución, fecha
de baja por persona. Es decir, "quién abre mis correos y quién no" y "candidatos a pasar a pago por
engagement" dejan de poder responderse bien. Si caes al plan B, dilo en una línea.

---

## Paso 3 — Notes (OPCIONAL: pregunta antes)

**Es el único paso que se pregunta, y la respuesta por defecto es "ahora no".** Razón: Notes no
tiene endpoint agregado. Hay que recorrer el feed del perfil y, por cada nota con interacción, pedir
reactores, restackers, respuestas y estadísticas: **de dos a cuatro peticiones por nota**. Con 200
notas son **cientos de peticiones y varios minutos** con el usuario esperando, y el bundle pasa de
400 KB de contexto. Y como esta vía no deja sesión, ese precio se paga **entero otra vez** en cada
actualización.

Ofrécelo así, en una línea: *"Las notas (quién te da like, restackea o responde) tardan varios
minutos aparte. ¿Las traigo ahora o prefieres que las deje para cuando conectes con el cURL?"*
Si conecta el cURL, `sync` las trae incrementalmente y casi gratis; esa es la recomendación.

Si dice que sí:

1. `navigate` a `https://substack.com` (Notes vive ahí; CORS impide llamarlo desde el subdominio).
2. `javascript_tool` con **`<SKILL_DIR>/browser/02-notes.js`**.
3. **Tampoco esperes**: avisa, sigue respondiendo con lo que ya cargó el paso 1, y recógelo cuando
   vuelvas a intervenir. `progreso` marca `hechas/total`.
4. `window.__stackchat.descargar()` y `$CS load <carpeta>` (una carpeta cualquiera, aquí no hay
   colisión posible).

Coste: 3 llamadas de herramienta tuyas más los sondeos; entre 1 y 4 peticiones por nota.

---

**Al terminar, dile que dé el cURL una vez** para que los siguientes syncs sean automáticos,
incrementales y no haya que repetir nada de esto.
