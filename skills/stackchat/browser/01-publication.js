// Generado por scripts/build-browser.mjs — no editar a mano.
const _get = async (u, asText) => {
  const r = await fetch(u, { credentials: 'include' });
  if (!r.ok) return { __err: r.status, __url: u };
  return asText ? r.text() : r.json();
};
const _post = async (u, body) => {
  const r = await fetch(u, {
    method: 'POST', credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.ok ? r.json() : { __err: r.status, __url: u };
};
const _sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Celda CSV: la comparten posts y suscriptores, por eso vive en el nivel superior.
const cell = (v) => /[",\n\r]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v == null ? '' : v);
// Substack ha devuelto el id del export como export_id, id y exportId segun la version.
const _exportId = (o) => o && (o.export_id || o.id || o.exportId);
const P = (window.__stackchat = { paso: '', fase: 'arrancando', progreso: '', listo: false, error: null, avisos: [], datos: null });
P.paso = 'publication';

(async () => {
 try {
  const files = {};
  const _csv = async (name, url, prefix) => {
    const t = await _get(url, true);
    if (typeof t !== 'string' || t.trim().split('\n').length < 2) {
      P.avisos.push({ file: name, motivo: 'vacio o no es CSV', http: t && t.__err });
      return;
    }
    files[name] = (prefix || '') + t;
  };

  // El export de suscriptores es asincrono: se pide primero para que vaya generandose.
  P.fase = 'pidiendo export de suscriptores';
  let exportId = null;
  {
    const set = await _post("/api/v1/subscriber_set", { query: {"order_by_desc_nulls_last":"subscription_created_at"} });
    if (set && set.id) {
      const exp = await _post("/api/v1/subscriber_set/export", { subscriberSetId: set.id, columns: ["user_email_address","user_name","subscription_type","activity_rating","subscription_created_at","total_revenue_generated","num_comments","num_comments_last_7d","num_comments_last_30d","num_shares","num_shares_last_7d","num_shares_last_30d","country","state","num_emails_received","num_emails_dropped","num_emails_opened","num_email_opens","num_email_opens_last_7d","num_email_opens_last_30d","last_opened_at","links_clicked","last_clicked_at","num_unique_email_posts_seen","num_unique_email_posts_seen_last_7d","num_unique_email_posts_seen_last_30d","num_web_post_views","num_web_post_views_last_7d","num_web_post_views_last_30d","num_unique_web_posts_seen","num_unique_web_posts_seen_last_7d","num_unique_web_posts_seen_last_30d","num_subs_gifted","subscription_expires_at","free_attribution","paid_attribution","days_active_last_30d","first_payment_at","last_subscribed_at","unsubscribed_at","emails_enabled","bestseller_tier","stripe_plan_name","group_membership"] });
      exportId = _exportId(exp);
      if (!exportId) P.avisos.push({ file: 'email_list.csv', motivo: 'el export no devolvio id: ' + JSON.stringify(exp).slice(0, 140) });
    } else {
      P.avisos.push({ file: 'email_list.csv', motivo: 'subscriber_set fallo: ' + JSON.stringify(set).slice(0, 140) });
    }
  }

  P.fase = 'estadisticas';
  await _csv('email_stats.csv', "/api/v1/publication/stats/email_stats?format=csv&columns%5B%5D=title&columns%5B%5D=post_date&columns%5B%5D=audience&columns%5B%5D=views&columns%5B%5D=engagement_rate&columns%5B%5D=signups&columns%5B%5D=subscribes&columns%5B%5D=estimated_value&columns%5B%5D=open_rate");
  await _csv('growth_sources.csv', "/api/v1/publication/stats/growth/sources?from_date=2024-01-01&to_date=2026-09-13&format=csv");
  await _csv('paid_subscriber_growth.csv', "/api/v1/publication/stats/paid_subscriber_growth?start=2024-01-01&end=2026-09-13&period=day&format=csv");
  // Substack devuelve esta serie sin cabecera; se la ponemos.
  await _csv('subscriber_totals.csv', "/api/v1/publication/stats/emails/timeseries?from=2024-01-01T00:00:00.000Z&format=csv&resolution=day", 'date,total_subscribers\n');

  // traffic: por tramos de 90 dias, o Substack agrega por mes y se pierde el detalle diario.
  P.fase = 'trafico';
  {
    const chunks = ["/api/v1/publication/stats/publication_traffic/timeseries?from=2024-01-01&to=2024-03-30&format=csv","/api/v1/publication/stats/publication_traffic/timeseries?from=2024-03-31&to=2024-06-28&format=csv","/api/v1/publication/stats/publication_traffic/timeseries?from=2024-06-29&to=2024-09-26&format=csv","/api/v1/publication/stats/publication_traffic/timeseries?from=2024-09-27&to=2024-12-25&format=csv","/api/v1/publication/stats/publication_traffic/timeseries?from=2024-12-26&to=2025-03-25&format=csv","/api/v1/publication/stats/publication_traffic/timeseries?from=2025-03-26&to=2025-06-23&format=csv","/api/v1/publication/stats/publication_traffic/timeseries?from=2025-06-24&to=2025-09-21&format=csv","/api/v1/publication/stats/publication_traffic/timeseries?from=2025-09-22&to=2025-12-20&format=csv","/api/v1/publication/stats/publication_traffic/timeseries?from=2025-12-21&to=2026-03-20&format=csv","/api/v1/publication/stats/publication_traffic/timeseries?from=2026-03-21&to=2026-06-18&format=csv","/api/v1/publication/stats/publication_traffic/timeseries?from=2026-06-19&to=2026-09-13&format=csv"];
    let header = '', lines = [];
    for (const u of chunks) {
      const t = await _get(u, true);
      if (typeof t !== 'string') continue;
      const [h, ...rows] = t.trim().split(/\r?\n/);
      header = header || h;
      lines.push(...rows.filter(Boolean));
    }
    if (header) files['traffic.csv'] = header + '\n' + lines.join('\n') + '\n';
    else P.avisos.push({ file: 'traffic.csv', motivo: 'ningun tramo respondio' });
  }

  // posts: /archive paginado, con el mismo formato que el export oficial posts.csv.
  P.fase = 'posts';
  {
    const head = ['post_id','post_date','is_published','email_sent_at','inbox_sent_at','type','audience','title','subtitle','podcast_url','canonical_url','wordcount'];
    const rows = [];
    for (let offset = 0; offset < 5000; offset += 50) {
      const page = await _get('/api/v1/archive?sort=new&limit=50&offset=' + offset);
      if (!Array.isArray(page) || !page.length) break;
      for (const p of page) rows.push([
        p.id + '.' + (p.slug || ''), p.post_date || '', 'true', p.email_sent_at || '', p.email_sent_at || '',
        p.type || '', p.audience || '', p.title || '', p.subtitle || '', p.podcast_url || '',
        p.canonical_url || '', p.wordcount == null ? '' : p.wordcount,
      ]);
      P.progreso = rows.length + ' posts';
      if (page.length < 50) break;
    }
    files['posts.csv'] = [head, ...rows].map((r) => r.map(cell).join(',')).join('\n') + '\n';
  }

  // Suscriptores por la API JSON del panel: sin descarga y sin CORS, asi que funciona en
  // cualquier maquina. Se emite con las cabeceras del export ("Email", "Type", "Start date")
  // para que el cargador lo reconozca sin cambios.
  P.fase = 'suscriptores';
  {
    const filas = [];
    for (let off = 0; off < 20000; off += 100) {
      const r = await _post("/api/v1/subscriber-stats", { limit: 100, offset: off });
      const lote = (r && r.subscribers) || [];
      filas.push(...lote);
      P.progreso = filas.length + '/' + ((r && r.count) || '?') + ' suscriptores';
      if (lote.length < 100) break;
    }
    if (filas.length) {
      const head = ['Email', 'Name', 'Type', 'Stripe plan', 'Start date', 'Activity', 'Revenue'];
      const cuerpo = filas.map((s) => [
        s.user_email_address, s.user_name, s.subscription_type || '', s.subscription_interval || '',
        s.subscription_created_at, s.activity_rating, s.total_revenue_generated,
      ]);
      files['email_list.csv'] = [head, ...cuerpo].map((r) => r.map(cell).join(',')).join('\n') + '\n';
    } else {
      P.avisos.push({ file: 'email_list.csv', motivo: 'subscriber-stats no devolvio suscriptores' });
    }
  }

  // El export en CSV trae ademas aperturas, clics y dias activos, que la API no da. No se puede
  // leer con fetch (redirige a S3 y CORS lo corta): se entrega el enlace para quien pueda bajarlo.
  P.fase = 'esperando el export de suscriptores';
  let email_list_url = null;
  if (exportId) {
    for (let i = 0; i < 40 && !email_list_url; i++) {
      await _sleep(1500);
      const st = await _get('/api/v1/subscriber_set/export/' + exportId);
      if (st && st.url) email_list_url = location.origin + st.url;
      P.progreso = 'sondeo ' + (i + 1);
    }
    if (!email_list_url) P.avisos.push({ file: 'email_list.csv', motivo: 'el export seguia sin estar listo tras 60s', export_id: exportId });
  }
  // La lectura falla por CORS, pero la peticion se hace y Chrome registra la redireccion a S3.
  // Esa URL de S3 va firmada (X-Amz-Signature, 24 h): quien lea el registro de red con
  // read_network_requests puede bajarla con curl sin cookie ni carpeta de Descargas.
  if (email_list_url) {
    P.fase = 'dejando la URL firmada en el registro de red';
    try { await fetch(email_list_url, { credentials: 'include' }); } catch (e) { /* esperado */ }
  }

  P.datos = { kind: 'stackchat-files', fetched_at: new Date().toISOString(), origin: location.origin, files, email_list_url };
  // Version en texto para sacarla por trozos: P.json.slice(0, 120000), .slice(120000, 240000)...
  // Concatenados reproducen el JSON exacto, y ningun resultado de tool se pasa de tamano.
  P.json = JSON.stringify(P.datos); P.jsonLength = P.json.length;
  // El resultado del tool se trunca a ~1 KB, asi que el JSON no cabe por ahi. Sale por UNA descarga
  // (una sola no la bloquea Chrome) que el agente recoge de la carpeta de Descargas del usuario.
  P.descargar = (nombre) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([P.json], { type: 'application/json' })); a.download = nombre || 'stackchat-publication.json'; document.body.appendChild(a); a.click(); a.remove(); return 'descarga lanzada: ' + a.download; };
  P.resumen = {
    incluye: Object.keys(files).map((k) => k + ' (' + files[k].trim().split('\n').length + ' filas)'),
    email_list_url,
    kb: Math.round(JSON.stringify(P.datos).length / 1024),
  };
  P.fase = 'terminado';
  P.listo = true;
 } catch (e) { P.error = String(e).slice(0, 200); P.listo = true; }
})();

({ arrancado: 'publication', siguiente: 'sondea window.__stackchat hasta listo:true, luego lee window.__stackchat.datos' })
