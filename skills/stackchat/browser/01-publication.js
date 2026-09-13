// Generado por scripts/build-browser.mjs — no editar a mano.
//
// Salida de datos (unica version verdadera): el resultado de javascript_tool se trunca a ~1 KB.
// El JSON NO sale por el valor de retorno ni troceado con slice(): sale por UNA descarga,
// P.descargar(). Chrome solo bloquea las descargas automaticas REPETIDAS; una por snippet pasa.

const DESDE = "2024-01-01";
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
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const csvDe = (head, rows) => [head, ...rows].map((r) => r.map(cell).join(',')).join('\n') + '\n';
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
    if (/^\s*<!doctype html/i.test(t)) return _aviso({ file: name, motivo: 'llego el HTML del login: la sesion no vale' });
    files[name] = (prefix || '') + t;
  };

  // Listados JSON paginados de 20 en 20. Cada pagina saltada queda en P.avisos.
  const _paginas = async (name, plantilla, max) => {
    const filas = [];
    let completo = false;
    for (let off = 0; off < max; off += 20) {
      const p = await _get(U(plantilla, off));
      if (_fallo(p)) { _aviso({ file: name, motivo: 'pagina saltada', offset: off, http: p && p.__err }); break; }
      const got = p.rows || [];
      filas.push(...got);
      P.progreso = name + ': ' + filas.length;
      if (got.length < 20) { completo = true; break; }
    }
    if (!completo && filas.length) _aviso({ file: name, motivo: 'lista incompleta: se corto la paginacion', filas: filas.length });
    return filas;
  };

  // Plan B de suscriptores: subscriber-stats, la API JSON de la tabla del panel. Sin descarga y
  // sin CORS, asi que funciona siempre; pero solo trae email, nombre, plan, fecha de alta,
  // actividad e ingresos. Ni aperturas, ni clics, ni dias activos, ni pais, ni atribucion.
  const _suscriptoresBasicos = async () => {
    const filas = [];
    for (let off = 0; off < 200000; off += 100) {
      const r = await _post("/api/v1/subscriber-stats", { limit: 100, offset: off });
      if (_fallo(r)) { _aviso({ file: 'email_list.csv', motivo: 'pagina de suscriptores saltada', offset: off, http: r && r.__err }); break; }
      const lote = r.subscribers || [];
      filas.push(...lote);
      P.progreso = filas.length + '/' + (r.count || '?') + ' suscriptores';
      if (lote.length < 100) break;
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
    const set = await _post("/api/v1/subscriber_set", { query: {"order_by_desc_nulls_last":"subscription_created_at"} });
    if (!_fallo(set) && set.id) {
      const exp = await _post("/api/v1/subscriber_set/export", { subscriberSetId: set.id, columns: ["user_email_address","user_name","subscription_type","activity_rating","subscription_created_at","total_revenue_generated","num_comments","num_comments_last_7d","num_comments_last_30d","num_shares","num_shares_last_7d","num_shares_last_30d","country","state","num_emails_received","num_emails_dropped","num_emails_opened","num_email_opens","num_email_opens_last_7d","num_email_opens_last_30d","last_opened_at","links_clicked","last_clicked_at","num_unique_email_posts_seen","num_unique_email_posts_seen_last_7d","num_unique_email_posts_seen_last_30d","num_web_post_views","num_web_post_views_last_7d","num_web_post_views_last_30d","num_unique_web_posts_seen","num_unique_web_posts_seen_last_7d","num_unique_web_posts_seen_last_30d","num_subs_gifted","subscription_expires_at","free_attribution","paid_attribution","days_active_last_30d","first_payment_at","last_subscribed_at","unsubscribed_at","emails_enabled","bestseller_tier","stripe_plan_name","group_membership"] });
      exportId = _exportId(exp);
      if (!exportId) _aviso({ file: 'email_list.csv', motivo: 'el export no devolvio id: ' + JSON.stringify(exp).slice(0, 140) });
    } else {
      _aviso({ file: 'email_list.csv', motivo: 'subscriber_set fallo: ' + JSON.stringify(set).slice(0, 140) });
    }
  }

  // Series y tablas que Substack ya sirve en CSV. traffic va en UNA peticion: resolution=day
  // conserva el detalle diario en cualquier rango, asi que el rango NO se trocea.
  P.fase = 'estadisticas';
  await _csv('email_stats.csv', U("/api/v1/publication/stats/email_stats?format=csv&columns%5B%5D=post_id&columns%5B%5D=title&columns%5B%5D=post_date&columns%5B%5D=audience&columns%5B%5D=type&columns%5B%5D=sent&columns%5B%5D=delivered&columns%5B%5D=opens&columns%5B%5D=opened&columns%5B%5D=open_rate&columns%5B%5D=clicks&columns%5B%5D=clicked&columns%5B%5D=click_through_rate&columns%5B%5D=likes&columns%5B%5D=comments&columns%5B%5D=shares&columns%5B%5D=restacks&columns%5B%5D=unsubscribes&columns%5B%5D=subscribers_finished_post&columns%5B%5D=views&columns%5B%5D=engagement_rate&columns%5B%5D=signups&columns%5B%5D=subscribes&columns%5B%5D=estimated_value"));
  await _csv('growth_sources.csv', U("/api/v1/publication/stats/growth/sources?from_date=__FROM__&to_date=__TO__&format=csv"));
  await _csv('paid_subscriber_growth.csv', U("/api/v1/publication/stats/paid_subscriber_growth?start=__FROM__&end=__TO__&period=day&format=csv"));
  await _csv('traffic.csv', U("/api/v1/publication/stats/publication_traffic/timeseries?from=__FROM__&to=__TO__&format=csv&resolution=day"));
  await _csv('visitor_sources.csv', U("/api/v1/publication/stats/visitor_sources?from_date=__FROM__&to_date=__TO__&offset=0&limit=50&order_by=views&order_direction=desc&format=csv"));
  // Estas dos series llegan sin cabecera; se la ponemos, igual que la ingesta por Node.
  await _csv('subscriber_totals.csv', U("/api/v1/publication/stats/emails/timeseries?from=__FROM__T00:00:00.000Z&format=csv&resolution=day"), 'date,total_subscribers\n');
  await _csv('followers.csv', U("/api/v1/publication/stats/followers/timeseries?from=__FROM__T00:00:00.000Z&format=csv"), 'date,followers\n');

  // posts: /archive paginado, con el mismo formato que el export oficial posts.csv.
  P.fase = 'posts';
  {
    const head = ['post_id','post_date','is_published','email_sent_at','inbox_sent_at','type','audience','title','subtitle','podcast_url','canonical_url','wordcount'];
    const rows = [];
    for (let offset = 0; offset < 5000; offset += 50) {
      const page = await _get(U("/api/v1/archive?sort=new&limit=50&offset=__OFF__", offset));
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
    const filas = await _paginas('unsubscribes.csv', "/api/v1/publication/stats/unsubscribes?offset=__OFF__&limit=20&from=__FROM__&to=__TO__&order_by=unsubscribed_at&order_direction=desc", 5000);
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
    const d = await _get(U("/api/v1/publication/stats/unsubscribes/timeseries?from=__FROM__&to=__TO__&granularity=day"));
    if (_fallo(d)) _aviso({ file: 'unsubscribes_daily.csv', motivo: 'peticion fallida', http: d && d.__err });
    else files['unsubscribes_daily.csv'] = csvDe(['date', 'unsubscribes'], (d.rows || []).map((r) =>
      Array.isArray(r)
        ? [txt(r[0]), num(r[1])]
        : [txt(r.date != null ? r.date : r.dt), num(r.count != null ? r.count : (r.value != null ? r.value : r.unsubscribes))]));
  }

  // De donde viene la audiencia: red de Substack, cuentas existentes, importados, fuera.
  P.fase = 'audiencia';
  {
    const d = await _get(U("/api/v1/publication/stats/network_attribution?time_window=90%20days&is_subscribed=false"));
    if (_fallo(d)) _aviso({ file: 'network_attribution.csv', motivo: 'peticion fallida', http: d && d.__err });
    else files['network_attribution.csv'] = csvDe(
      ['label', 'time_window', 'subscribers', 'pct_of_total'],
      (d.rows || []).map((r) => [txt(r.label), txt(r.time_window), num(r.subs_count), num(r.pct_time_window_total)]),
    );
  }
  {
    const d = await _get(U("/api/v1/publication/stats/audience_insights/location?metric=free+signups&granularity=global"));
    if (_fallo(d)) _aviso({ file: 'audience_location.csv', motivo: 'peticion fallida', http: d && d.__err });
    else files['audience_location.csv'] = csvDe(
      ['location', 'metric', 'value'],
      (Array.isArray(d) ? d : []).map((r) => [txt(r.location), txt(r.metric), num(r.value)]),
    );
  }
  {
    // La respuesta trae el objeto entero de cada publicacion (130 KB para doce filas); aqui se
    // queda en lo que se consulta.
    const d = await _get(U("/api/v1/publication/stats/audience_insights/overlap?limit=12"));
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
    const filas = await _paginas('referrers.csv', "/api/v1/publication/stats/reader-referrals?to=__TO__T23%3A59%3A59Z&offset=__OFF__&limit=20&order_by=visitors&order_direction=desc", 1000);
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
    for (const par of [["retention","/api/v1/publication/stats/subscriber_retention/summary?is_subscribed=true&subscription_interval_cohort=all"],["referrals","/api/v1/publication/stats/referrals/summary"],["paid_growth","/api/v1/publication/stats/paid_subscriber_growth/summary?is_subscribed=true"],["open_rate_30d","/api/v1/publication/stats/email_stats/30d_open_rate"],["views_30d","/api/v1/publication/stats/publication_traffic/30d_views"]]) {
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
      const st = await _get("/api/v1/subscriber_set/export/__ID__".split('__ID__').join(exportId));
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
      incluye: Object.keys(files).map((k) => k + ' (' + (files[k].trim().split('\n').length - 1) + ' filas)'),
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
