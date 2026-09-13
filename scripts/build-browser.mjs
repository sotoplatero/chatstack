#!/usr/bin/env node
/**
 * Genera los snippets que Claude ejecuta dentro de la pestaña del usuario (vía navegador).
 * Se generan, no se escriben a mano, para que las URLs salgan del mismo `src/ingest/endpoints.ts`
 * que usa la ingesta por Node: una sola lista de endpoints, imposible que se desincronicen.
 *
 * Cuatro hechos del entorno, todos comprobados contra Chrome real, explican el diseño. Esta es la
 * ÚNICA versión verdadera: si un comentario o `navegador.md` dicen otra cosa, mienten.
 *
 *  1. `javascript_tool` corta a los 45 s y el paso 1 tarda alrededor de un minuto. Por eso el
 *     snippet ARRANCA el trabajo y devuelve enseguida: la página sigue sola entre llamadas y
 *     Claude sondea `window.__stackchat` hasta ver `listo:true`.
 *  2. El resultado de `javascript_tool` se trunca a ~1 KB. El JSON del bundle ronda los 100 KB,
 *     así que NO sale por el valor de retorno, y trocearlo con `P.json.slice(...)` TAMPOCO
 *     funciona: cada trozo se trunca igual. Sale por UNA descarga (`P.descargar()`). Chrome solo
 *     bloquea las descargas automáticas REPETIDAS de un sitio; una por snippet pasa.
 *  3. La cookie no se puede leer (`substack.sid` es httpOnly y la extensión devuelve
 *     `[BLOCKED: Cookie/query string data]`), así que esta vía trae datos pero no deja sesión.
 *  4. El export completo de suscriptores no se puede leer con `fetch`: redirige a S3 y CORS corta
 *     la lectura. Pero la petición sí se hace, y Chrome registra la redirección a una URL de S3
 *     firmada y válida 24 h, que se baja con `curl` sin cookie y sin tocar Descargas.
 *
 * Las fechas de las series se calculan DENTRO del snippet: aquí solo se dejan los marcadores
 * `__FROM__` / `__TO__` / `__OFF__`. Un snippet compilado en enero y ejecutado en junio tiene que
 * traer datos hasta junio, y antes traía datos hasta enero.
 *
 * `note_stats` se reduce a sus cifras: en crudo son ~12 KB por nota (lleva series temporales que
 * nadie consulta) y el bundle pasaría de 100 KB a 2 MB.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { Script } from "node:vm";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PUB, SUBSCRIBER_EXPORT_COLUMNS, SUBSCRIBER_SET_QUERY, SUBSCRIBER_STATS_PAGE, LIST_PAGE, DEFAULT_FROM,
} from "../dist/ingest/endpoints.js";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "skills", "stackchat", "browser");
mkdirSync(OUT, { recursive: true });

const j = (v) => JSON.stringify(v);

/**
 * Marcadores, no valores. Se sustituyen al EJECUTAR el snippet, nunca al compilarlo: es la única
 * forma de que las series lleguen hasta el día en que el usuario ejecuta esto.
 */
const F = "__FROM__", T = "__TO__", O = "__OFF__", ID = "__ID__";

/** Plantillas de URL, todas salidas de `PUB`. Ninguna URL se escribe a mano en los snippets. */
const URLS = {
  emailStats: PUB.emailStats(),
  traffic: PUB.traffic(F, T),
  growthSources: PUB.growthSources(F, T),
  paidSubscriberGrowth: PUB.paidSubscriberGrowth(F, T),
  subscriberTotals: PUB.subscriberTotals(F),
  followers: PUB.followers(F),
  unsubscribes: PUB.unsubscribes(F, T, O),
  unsubscribesDaily: PUB.unsubscribesDaily(F, T),
  visitorSources: PUB.visitorSources(F, T),
  networkAttribution: PUB.networkAttribution(),
  audienceLocation: PUB.audienceLocation(),
  audienceOverlap: PUB.audienceOverlap(),
  readerReferrals: PUB.readerReferrals(T, O),
  archive: PUB.archive(O, 50),
  subscriberSet: PUB.subscriberSet(),
  subscriberExport: PUB.subscriberExport(),
  subscriberExportStatus: PUB.subscriberExportStatus(ID),
  subscriberStats: PUB.subscriberStats(),
};

/** Las cinco cifras sueltas del panel. Mismos prefijos que `SubstackClient.summaries()`. */
const RESUMENES = [
  ["retention", PUB.retentionSummary()],
  ["referrals", PUB.referralsSummary()],
  ["paid_growth", PUB.paidGrowthSummary()],
  ["open_rate_30d", PUB.openRate30d()],
  ["views_30d", PUB.views30d()],
];

const PRELUDE = `
// Generado por scripts/build-browser.mjs — no editar a mano.
//
// Salida de datos (unica version verdadera): el resultado de javascript_tool se trunca a ~1 KB.
// El JSON NO sale por el valor de retorno ni troceado con slice(): sale por UNA descarga,
// P.descargar(). Chrome solo bloquea las descargas automaticas REPETIDAS; una por snippet pasa.

const DESDE = ${j(DEFAULT_FROM)};
// La fecha final se calcula AQUI, al ejecutar. Si se calculara al compilar el snippet, quien lo
// ejecutara meses despues recibiria las series cortadas el dia del build.
const HOY = new Date().toISOString().slice(0, 10);
const U = (t, off) => String(t)
  .split('__FROM__').join(DESDE)
  .split('__TO__').join(HOY)
  .split('__OFF__').join(String(off == null ? 0 : off));

const P = (window.__stackchat = { paso: '', fase: 'arrancando', progreso: '', listo: false, error: null, avisos: [], datos: null });
// Todo tramo, pagina o archivo que se acabe saltando queda aqui para que el agente lo lea.
const _aviso = (o) => { P.avisos.push(o); return null; };
const _sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PAUSA = 150;   // respiro entre peticiones: encadenarlas sin pausa provoca 429
const INTENTOS = 4;  // mismos reintentos que src/ingest/substack.ts
// Reintenta ante 429 y 5xx respetando Retry-After, y ante errores de red. Devuelve la Response o
// un objeto { __err } que el llamante convierte en aviso; nunca lanza.
const _req = async (u, init) => {
  let ultimo = { __err: 'sin respuesta', __url: u };
  for (let i = 0; i < INTENTOS; i++) {
    if (PAUSA) await _sleep(PAUSA);
    let r;
    try { r = await fetch(u, init); }
    catch (e) {
      ultimo = { __err: 'red', __detalle: String(e).slice(0, 120), __url: u };
      await _sleep(800 * (i + 1));
      continue;
    }
    if (r.ok) return r;
    ultimo = { __err: r.status, __url: u };
    // 401/403 es sesion caducada: reintentar no arregla nada.
    if (r.status === 401 || r.status === 403) { ultimo.__sesion = true; break; }
    if (r.status !== 429 && r.status < 500) break;
    // Defensivo a propósito: esto corre en la pestaña del usuario y cualquier excepción aquí
    // abortaría la descarga entera por un detalle de cabeceras.
    const ra = Number(r.headers && r.headers.get ? r.headers.get('retry-after') : 0) * 1000;
    await _sleep(Math.max(ra || 0, 800 * Math.pow(2, i)));
  }
  return ultimo;
};
const _get = async (u, asText) => {
  const r = await _req(u, { credentials: 'include' });
  if (r.__err !== undefined) return r;
  return asText ? r.text() : r.json();
};
const _post = async (u, body) => {
  const r = await _req(u, {
    method: 'POST', credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.__err !== undefined ? r : r.json();
};
const _fallo = (x) => !x || x.__err !== undefined;

// Mismo CSV que rowsToCsv() de src/ingest/endpoints.ts: el navegador y la ingesta por Node deben
// producir archivos identicos para que los cargue exactamente el mismo codigo.
const cell = (v) => {
  const s = (v === null || v === undefined) ? '' : String(v);
  return /[",\\n\\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const csvDe = (head, rows) => [head, ...rows].map((r) => r.map(cell).join(',')).join('\\n') + '\\n';
const txt = (v) => (v === null || v === undefined) ? '' : String(v);
const num = (v) => Number(v) || 0;

// Substack ha devuelto el id del export como export_id, id y exportId segun la version.
const _exportId = (o) => o && (o.export_id || o.id || o.exportId);
// Salida unica: una descarga por snippet.
const _descargar = (nombre) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([P.json], { type: 'application/json' }));
  a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  return 'descarga lanzada: ' + a.download;
};
`.trim();

/** Paso 1 — en https://<sub>.substack.com/publish/home. Una navegación, un snippet, una descarga. */
const publication = `${PRELUDE}
P.paso = 'publication';

(async () => {
 try {
  const files = {};

  // Un CSV tal cual lo devuelve Substack. Una cabecera sin filas es legitimo (cero bajas, cero
  // ingresos); solo se avisa si no llega nada o si llega el HTML del login.
  const _csv = async (name, url, prefix) => {
    const t = await _get(url, true);
    if (typeof t !== 'string') return _aviso({ file: name, motivo: 'peticion fallida', http: t && t.__err });
    if (!t.trim()) return _aviso({ file: name, motivo: 'respuesta vacia' });
    if (/^\\s*<!doctype html/i.test(t)) return _aviso({ file: name, motivo: 'llego el HTML del login: la sesion no vale' });
    files[name] = (prefix || '') + t;
  };

  // Listados JSON paginados de ${LIST_PAGE} en ${LIST_PAGE}. Cada pagina saltada queda en P.avisos.
  const _paginas = async (name, plantilla, max) => {
    const filas = [];
    let completo = false;
    for (let off = 0; off < max; off += ${LIST_PAGE}) {
      const p = await _get(U(plantilla, off));
      if (_fallo(p)) { _aviso({ file: name, motivo: 'pagina saltada', offset: off, http: p && p.__err }); break; }
      const got = p.rows || [];
      filas.push(...got);
      P.progreso = name + ': ' + filas.length;
      if (got.length < ${LIST_PAGE}) { completo = true; break; }
    }
    if (!completo && filas.length) _aviso({ file: name, motivo: 'lista incompleta: se corto la paginacion', filas: filas.length });
    return filas;
  };

  // Plan B de suscriptores: subscriber-stats, la API JSON de la tabla del panel. Sin descarga y
  // sin CORS, asi que funciona siempre; pero solo trae email, nombre, plan, fecha de alta,
  // actividad e ingresos. Ni aperturas, ni clics, ni dias activos, ni pais, ni atribucion.
  const _suscriptoresBasicos = async () => {
    const filas = [];
    for (let off = 0; off < 200000; off += ${SUBSCRIBER_STATS_PAGE}) {
      const r = await _post(${j(URLS.subscriberStats)}, { limit: ${SUBSCRIBER_STATS_PAGE}, offset: off });
      if (_fallo(r)) { _aviso({ file: 'email_list.csv', motivo: 'pagina de suscriptores saltada', offset: off, http: r && r.__err }); break; }
      const lote = r.subscribers || [];
      filas.push(...lote);
      P.progreso = filas.length + '/' + (r.count || '?') + ' suscriptores';
      if (lote.length < ${SUBSCRIBER_STATS_PAGE}) break;
    }
    if (!filas.length) return _aviso({ file: 'email_list.csv', motivo: 'subscriber-stats no devolvio suscriptores' });
    files['email_list.csv'] = csvDe(
      ['Email', 'Name', 'Type', 'Stripe plan', 'Start date', 'Activity', 'Revenue'],
      filas.map((s) => [
        s.user_email_address, s.user_name, s.subscription_type || '', s.subscription_interval || '',
        s.subscription_created_at, s.activity_rating, s.total_revenue_generated,
      ]),
    );
  };

  // El export de suscriptores es asincrono: se pide el primero para que vaya generandose mientras
  // se bajan las estadisticas, y se recoge al final.
  P.fase = 'pidiendo el export de suscriptores';
  let exportId = null;
  {
    const set = await _post(${j(URLS.subscriberSet)}, { query: ${j(SUBSCRIBER_SET_QUERY)} });
    if (!_fallo(set) && set.id) {
      const exp = await _post(${j(URLS.subscriberExport)}, { subscriberSetId: set.id, columns: ${j([...SUBSCRIBER_EXPORT_COLUMNS])} });
      exportId = _exportId(exp);
      if (!exportId) _aviso({ file: 'email_list.csv', motivo: 'el export no devolvio id: ' + JSON.stringify(exp).slice(0, 140) });
    } else {
      _aviso({ file: 'email_list.csv', motivo: 'subscriber_set fallo: ' + JSON.stringify(set).slice(0, 140) });
    }
  }

  // Series y tablas que Substack ya sirve en CSV. traffic va en UNA peticion: resolution=day
  // conserva el detalle diario en cualquier rango, asi que el rango NO se trocea.
  P.fase = 'estadisticas';
  await _csv('email_stats.csv', U(${j(URLS.emailStats)}));
  await _csv('growth_sources.csv', U(${j(URLS.growthSources)}));
  await _csv('paid_subscriber_growth.csv', U(${j(URLS.paidSubscriberGrowth)}));
  await _csv('traffic.csv', U(${j(URLS.traffic)}));
  await _csv('visitor_sources.csv', U(${j(URLS.visitorSources)}));
  // Estas dos series llegan sin cabecera; se la ponemos, igual que la ingesta por Node.
  await _csv('subscriber_totals.csv', U(${j(URLS.subscriberTotals)}), 'date,total_subscribers\\n');
  await _csv('followers.csv', U(${j(URLS.followers)}), 'date,followers\\n');

  // posts: /archive paginado, con el mismo formato que el export oficial posts.csv.
  P.fase = 'posts';
  {
    const head = ['post_id','post_date','is_published','email_sent_at','inbox_sent_at','type','audience','title','subtitle','podcast_url','canonical_url','wordcount'];
    const rows = [];
    for (let offset = 0; offset < 5000; offset += 50) {
      const page = await _get(U(${j(URLS.archive)}, offset));
      if (_fallo(page) || !Array.isArray(page)) { _aviso({ file: 'posts.csv', motivo: 'pagina saltada', offset: offset, http: page && page.__err }); break; }
      if (!page.length) break;
      for (const p of page) rows.push([
        p.id + '.' + (p.slug || ''), p.post_date || '', 'true', p.email_sent_at || '', p.email_sent_at || '',
        p.type || '', p.audience || '', p.title || '', p.subtitle || '', p.podcast_url || '',
        p.canonical_url || '', p.wordcount == null ? '' : p.wordcount,
      ]);
      P.progreso = rows.length + ' posts';
      if (page.length < 50) break;
    }
    if (rows.length) files['posts.csv'] = csvDe(head, rows);
    else _aviso({ file: 'posts.csv', motivo: 'el archivo no devolvio posts' });
  }

  // Bajas con su fecha real. Mismas cabeceras y mismo mapeo que SubstackClient.unsubscribes().
  P.fase = 'bajas';
  {
    const filas = await _paginas('unsubscribes.csv', ${j(URLS.unsubscribes)}, 5000);
    files['unsubscribes.csv'] = csvDe(
      ['email', 'unsubscribed_at', 'subscribed_at', 'plan', 'source', 'name'],
      filas.map((r) => [
        txt(r.email != null ? r.email : (r.user_email_address != null ? r.user_email_address : (r.user && r.user.email))),
        txt(r.unsubscribed_at != null ? r.unsubscribed_at : (r.unsubscribedAt != null ? r.unsubscribedAt : r.date)),
        txt(r.subscription_created_at != null ? r.subscription_created_at : (r.subscribed_at != null ? r.subscribed_at : r.created_at)),
        txt(r.type != null ? r.type : (r.subscription_type != null ? r.subscription_type : r.plan)),
        txt(r.free_attribution != null ? r.free_attribution : r.source),
        txt(r.name != null ? r.name : (r.user && r.user.name)),
      ]),
    );
  }

  // Serie diaria de bajas: la unica fuente de bajas por dia que expone el panel.
  {
    const d = await _get(U(${j(URLS.unsubscribesDaily)}));
    if (_fallo(d)) _aviso({ file: 'unsubscribes_daily.csv', motivo: 'peticion fallida', http: d && d.__err });
    else files['unsubscribes_daily.csv'] = csvDe(['date', 'unsubscribes'], (d.rows || []).map((r) =>
      Array.isArray(r)
        ? [txt(r[0]), num(r[1])]
        : [txt(r.date != null ? r.date : r.dt), num(r.count != null ? r.count : (r.value != null ? r.value : r.unsubscribes))]));
  }

  // De donde viene la audiencia: red de Substack, cuentas existentes, importados, fuera.
  P.fase = 'audiencia';
  {
    const d = await _get(U(${j(URLS.networkAttribution)}));
    if (_fallo(d)) _aviso({ file: 'network_attribution.csv', motivo: 'peticion fallida', http: d && d.__err });
    else files['network_attribution.csv'] = csvDe(
      ['label', 'time_window', 'subscribers', 'pct_of_total'],
      (d.rows || []).map((r) => [txt(r.label), txt(r.time_window), num(r.subs_count), num(r.pct_time_window_total)]),
    );
  }
  {
    const d = await _get(U(${j(URLS.audienceLocation)}));
    if (_fallo(d)) _aviso({ file: 'audience_location.csv', motivo: 'peticion fallida', http: d && d.__err });
    else files['audience_location.csv'] = csvDe(
      ['location', 'metric', 'value'],
      (Array.isArray(d) ? d : []).map((r) => [txt(r.location), txt(r.metric), num(r.value)]),
    );
  }
  {
    // La respuesta trae el objeto entero de cada publicacion (130 KB para doce filas); aqui se
    // queda en lo que se consulta.
    const d = await _get(U(${j(URLS.audienceOverlap)}));
    if (_fallo(d)) _aviso({ file: 'audience_overlap.csv', motivo: 'peticion fallida', http: d && d.__err });
    else files['audience_overlap.csv'] = csvDe(
      ['subdomain', 'name', 'percent_overlap', 'author'],
      (Array.isArray(d) ? d : []).map((r) => [
        txt(r.pub && r.pub.subdomain), txt(r.pub && r.pub.name), num(r.percentOverlap), txt(r.pub && r.pub.author_name),
      ]),
    );
  }

  // Quien te trae lectores.
  P.fase = 'referidos';
  {
    const filas = await _paginas('referrers.csv', ${j(URLS.readerReferrals)}, 1000);
    files['referrers.csv'] = csvDe(
      ['user_id', 'name', 'handle', 'visitors', 'free_subscribers', 'paid_subscribers'],
      filas.map((r) => {
        const u = r.user || {};
        return [
          txt(r.referrer_user_id != null ? r.referrer_user_id : u.id), txt(u.name), txt(u.handle),
          num(r.visitors), num(r.free_subscribers), num(r.paid_subscribers),
        ];
      }),
    );
  }

  // Las cifras sueltas del panel en una tabla clave/valor: cinco peticiones diminutas, un archivo.
  P.fase = 'resumenes';
  {
    const out = [];
    const add = (prefix, obj) => {
      if (!obj || typeof obj !== 'object') return;
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (v === null || typeof v === 'object') continue;
        out.push([prefix + '.' + k, String(v)]);
      }
    };
    for (const par of ${j(RESUMENES)}) {
      const d = await _get(par[1]);
      if (_fallo(d)) { _aviso({ file: 'pub_summary.csv', motivo: 'resumen ' + par[0] + ' fallo', http: d && d.__err }); continue; }
      add(par[0], par[0] === 'retention' ? (d.heroStat || d) : d);
    }
    files['pub_summary.csv'] = csvDe(['metric', 'value'], out);
  }

  // ---- Suscriptores -------------------------------------------------------------------------
  // Via PRINCIPAL: el export completo (44 columnas: aperturas, clics, dias activos, pais,
  // atribucion). No se puede leer con fetch —redirige a S3 y CORS corta la lectura— pero la
  // peticion si se hace y Chrome registra la redireccion a una URL de S3 firmada, valida 24 h,
  // que el agente baja con curl sin cookie y sin tocar la carpeta de Descargas.
  //
  // TRAMPA DE ORDEN DE CARGA (por eso el if/else de abajo): src/load/index.ts carga PRIMERO los
  // CSV sueltos del directorio y DESPUES los bundles JSON. Si el bundle llevara siempre un
  // email_list.csv basico y el agente dejara el CSV completo en la misma carpeta, el basico del
  // bundle se cargaria EL ULTIMO y pisaria el campo extra del completo: se perderian justo las
  // aperturas y los clics. Por eso el bundle solo lleva la lista basica cuando el export NO esta
  // disponible. Y la guia exige ademas carpetas separadas, por si se mezclan dos ejecuciones.
  P.fase = 'esperando el export de suscriptores';
  let email_list_url = null;
  if (exportId) {
    for (let i = 0; i < 40 && !email_list_url; i++) {
      await _sleep(1500);
      const st = await _get(${j(URLS.subscriberExportStatus)}.split('__ID__').join(exportId));
      if (!_fallo(st) && st.url) email_list_url = location.origin + st.url;
      P.progreso = 'export: sondeo ' + (i + 1);
    }
    if (!email_list_url) _aviso({ file: 'email_list.csv', motivo: 'el export seguia sin estar listo tras 60s', export_id: exportId });
  }
  if (email_list_url) {
    P.fase = 'dejando la URL firmada en el registro de red';
    // Que la lectura falle por CORS es lo esperado: lo unico que se busca es que la redireccion a
    // S3 quede registrada para que read_network_requests la encuentre.
    try { await fetch(email_list_url, { credentials: 'include' }); } catch (e) { /* esperado */ }
  } else {
    P.fase = 'suscriptores (plan B: API JSON)';
    await _suscriptoresBasicos();
  }

  // ---- Empaquetado --------------------------------------------------------------------------
  const _publicar = () => {
    P.datos = {
      kind: 'stackchat-files', fetched_at: new Date().toISOString(), origin: location.origin,
      desde: DESDE, hasta: HOY, files: files, email_list_url: email_list_url, avisos: P.avisos,
    };
    P.json = JSON.stringify(P.datos);
    P.resumen = {
      incluye: Object.keys(files).map((k) => k + ' (' + (files[k].trim().split('\\n').length - 1) + ' filas)'),
      email_list: email_list_url
        ? 'export completo: bajalo de la URL firmada del registro de red, EN OTRA CARPETA'
        : 'lista basica dentro del bundle (sin aperturas, clics ni dias activos)',
      email_list_url: email_list_url,
      avisos: P.avisos.length,
      kb: Math.round(P.json.length / 1024),
    };
    return P.resumen;
  };
  _publicar();
  P.descargar = (nombre) => _descargar(nombre || 'stackchat-publication.json');
  // Rescate: solo si el agente NO logro sacar la URL firmada del registro de red. Rellena la
  // lista basica y rehace el bundle; despues hay que volver a llamar a P.descargar().
  P.rescatarSuscriptores = async () => { await _suscriptoresBasicos(); return _publicar(); };
  P.fase = 'terminado';
  P.listo = true;
 } catch (e) { P.error = String(e).slice(0, 200); P.listo = true; }
})();

({ arrancado: 'publication', siguiente: 'sondea window.__stackchat hasta listo:true, luego P.descargar()' })
`;

/** Paso 3 (OPCIONAL) — en https://substack.com: Notes y quién interactúa. Cientos de peticiones. */
const notes = `${PRELUDE}
P.paso = 'notes';

(async () => {
 try {
  const me = await _get('/api/v1/user/profile/self');
  const UID = !_fallo(me) && me.id;
  if (!UID) throw new Error('no hay sesion en substack.com');

  // 1. Todas las notas propias del feed del perfil (se descartan posts y restacks ajenos).
  P.fase = 'feed';
  const notas = [];
  let cursor = '';
  for (let page = 0; page < 200; page++) {
    const p = await _get('/api/v1/reader/feed/profile/' + UID + (cursor ? '?cursor=' + encodeURIComponent(cursor) : ''));
    if (_fallo(p)) { _aviso({ paso: 'feed', motivo: 'pagina saltada', page: page, http: p && p.__err }); break; }
    for (const it of (p.items || [])) {
      if (it.type === 'comment' && it.comment && Number(it.comment.user_id) === Number(UID)) notas.push(it.comment);
    }
    P.progreso = notas.length + ' notas';
    if (!p.nextCursor || !(p.items || []).length || p.nextCursor === cursor) break;
    cursor = p.nextCursor;
  }

  const actor = (u) => {
    const pub = (u && (u.primary_publication || u.user_primary_publication)) || null;
    return {
      id: Number(u.id != null ? u.id : u.user_id), name: u.name || null, handle: u.handle || null,
      photo_url: u.photo_url || null,
      publication_subdomain: (pub && pub.subdomain) || null, publication_name: (pub && pub.name) || null,
      is_subscribed: typeof u.is_subscribed === 'boolean' ? u.is_subscribed : null,
      is_following: typeof u.is_following === 'boolean' ? u.is_following : null,
      bestseller_tier: u.bestseller_tier != null ? u.bestseller_tier : (u.user_bestseller_tier != null ? u.user_bestseller_tier : null),
    };
  };
  const slim = (a) => ({
    type: a.type || null,
    post_id: (a.post && a.post.id) || null,
    post_title: (a.post && a.post.title) || null,
    url: (a.post && a.post.canonical_url) || a.url || null,
    publication: (a.publication && a.publication.subdomain) || null,
  });
  // note_stats en crudo son ~12 KB por nota (series temporales). Solo se guardan las cifras.
  const cifras = (st) => {
    if (_fallo(st) || !Array.isArray(st.cards)) return null;
    const out = {};
    for (const c of st.cards) {
      const k = c.cardId || 'card';
      const v = {};
      for (const h of (c.headers || [])) if (h && h.title) v[h.title] = h.value;
      for (const i of (c.items || [])) if (i && i.title) v[i.title] = i.value;
      if (Object.keys(v).length) out[k] = v;
    }
    return Object.keys(out).length ? out : null;
  };

  // 2. Por cada nota con interaccion, quien la hizo. Sin interaccion no se pide nada.
  P.fase = 'interacciones';
  const bundle = { kind: 'notes', fetched_at: new Date().toISOString(), user_id: Number(UID), notes: [], errors: [] };
  let hechas = 0;
  for (const c of notas) {
    const id = Number(c.id);
    const rec = {
      id: id, user_id: Number(UID), date: c.date || null, body: c.body || null,
      reaction_count: Number(c.reaction_count || 0), restacks: Number(c.restacks || 0),
      children_count: Number(c.children_count || 0),
      attachments: Array.isArray(c.attachments) ? c.attachments.map(slim) : [],
      reactors: [], restackers: [], replies: [], stats: null,
    };
    if (rec.reaction_count > 0) {
      const rs = await _get('/api/v1/comment/' + id + '/reactors');
      if (Array.isArray(rs)) rec.reactors = rs.map(actor);
      else { bundle.errors.push({ note_id: id, step: 'reactors', error: String(rs && rs.__err) }); _aviso({ paso: 'reactors', note_id: id, http: rs && rs.__err }); }
    }
    if (rec.restacks > 0) {
      const rs = await _get('/api/v1/comment/' + id + '/restackers');
      if (Array.isArray(rs)) rec.restackers = rs.map(actor).filter((a) => a.id !== Number(UID));
      else { bundle.errors.push({ note_id: id, step: 'restackers', error: String(rs && rs.__err) }); _aviso({ paso: 'restackers', note_id: id, http: rs && rs.__err }); }
    }
    if (rec.children_count > 0) {
      let rc = '';
      for (let i = 0; i < 50; i++) {
        const p = await _get('/api/v1/reader/comment/' + id + '/replies' + (rc ? '?cursor=' + encodeURIComponent(rc) : ''));
        if (_fallo(p)) { bundle.errors.push({ note_id: id, step: 'replies', error: String(p && p.__err) }); _aviso({ paso: 'replies', note_id: id, http: p && p.__err }); break; }
        for (const br of (p.commentBranches || [])) {
          // Los descendientes vienen envueltos en { comment, type }.
          const all = [br.comment].concat((br.descendantComments || []).map((d) => d.comment || d)).filter(Boolean);
          for (const r of all) {
            if (Number(r.user_id) === Number(UID)) continue;
            rec.replies.push({
              id: Number(r.id), actor: actor(Object.assign({}, r, { id: r.user_id })),
              date: r.date || null, body: r.body || null,
              reaction_count: r.reaction_count != null ? r.reaction_count : null,
              parent_id: r.parent_id ? Number(r.parent_id) : null,
            });
          }
        }
        if (!p.nextCursor || p.nextCursor === rc) break;
        rc = p.nextCursor;
      }
    }
    // note_stats solo donde puede aportar: Substack tarda ~24h en habilitarlo por nota.
    const reciente = rec.date && (Date.now() - Date.parse(rec.date)) < 60 * 86400000;
    if (rec.reaction_count + rec.restacks + rec.children_count > 0 || reciente) {
      rec.stats = cifras(await _get('/api/v1/note_stats/c-' + id));
    }
    bundle.notes.push(rec);
    P.progreso = (++hechas) + '/' + notas.length;
  }
  bundle.notes.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  bundle.avisos = P.avisos;

  P.datos = bundle;
  P.json = JSON.stringify(bundle);
  P.descargar = (nombre) => _descargar(nombre || 'stackchat-notes.json');
  P.resumen = {
    notas: bundle.notes.length,
    likes: bundle.notes.reduce((n, x) => n + x.reactors.length, 0),
    restacks: bundle.notes.reduce((n, x) => n + x.restackers.length, 0),
    respuestas: bundle.notes.reduce((n, x) => n + x.replies.length, 0),
    con_stats: bundle.notes.filter((x) => x.stats).length,
    avisos: P.avisos.length,
    kb: Math.round(P.json.length / 1024),
  };
  P.fase = 'terminado';
  P.listo = true;
 } catch (e) { P.error = String(e).slice(0, 200); P.listo = true; }
})();

({ arrancado: 'notes', siguiente: 'sondea window.__stackchat hasta listo:true, luego P.descargar()' })
`;

/** Un salto de linea mal escapado dentro de un template literal deja un snippet que no compila. */
const compila = (nombre, src) => {
  try { new Script("(async () => {" + src + "\n})"); }
  catch (e) { throw new Error(nombre + " no compila: " + e.message); }
};

/**
 * Ninguna fecha puede quedar congelada en el snippet: ese era el bug que devolvía series cortadas
 * el día del build. Lo único permitido es `DEFAULT_FROM`, que es una constante de verdad.
 */
const sinFechasIncrustadas = (nombre, src) => {
  const fuera = (src.match(/\b20\d{2}-\d{2}-\d{2}\b/g) || []).filter((d) => d !== DEFAULT_FROM);
  if (fuera.length) throw new Error(`${nombre}: fechas incrustadas en tiempo de build (${fuera.join(", ")})`);
  if (!src.includes("__FROM__") || !src.includes("__TO__")) throw new Error(`${nombre}: faltan los marcadores de fecha`);
};

compila("01-publication.js", publication);
compila("02-notes.js", notes);
sinFechasIncrustadas("01-publication.js", publication);
writeFileSync(join(OUT, "01-publication.js"), publication.trimStart(), "utf8");
writeFileSync(join(OUT, "02-notes.js"), notes.trimStart(), "utf8");
console.log(`snippets escritos en ${OUT}`);
