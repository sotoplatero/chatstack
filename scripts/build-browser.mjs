#!/usr/bin/env node
/**
 * Genera los snippets que Claude ejecuta dentro de la pestaña del usuario (vía navegador).
 * Se generan, no se escriben a mano, para que las URLs salgan del mismo `src/ingest/endpoints.ts`
 * que usa la ingesta por Node: una sola lista de endpoints, imposible que se desincronicen.
 *
 * Tres restricciones del entorno, todas comprobadas contra Chrome real, explican el diseño:
 *
 *  1. `javascript_tool` corta a los 45 s y recorrer 200+ notas tarda minutos. Por eso cada snippet
 *     ARRANCA el trabajo y devuelve enseguida: la página sigue sola entre llamadas y Claude sondea
 *     `window.__stackchat` hasta ver `listo`.
 *  2. Chrome bloquea en silencio las descargas automáticas repetidas de un sitio. Por eso no se
 *     descarga nada: el resultado se recoge por `window.__stackchat.datos` y lo escribe Claude.
 *  3. Los suscriptores se traen por `subscriber-stats`, la API JSON de la tabla del panel: sin
 *     descarga y sin CORS. El export en CSV, que ademas trae aperturas y clics, no se puede leer
 *     con fetch (redirige a S3 y CORS lo corta): se entrega su enlace para quien pueda bajarlo.
 *
 * `note_stats` se reduce a sus cifras: en crudo son ~12 KB por nota (lleva series temporales que
 * nadie consulta) y el bundle pasaría de 100 KB a 2 MB.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PUB, SUBSCRIBER_EXPORT_COLUMNS, SUBSCRIBER_SET_QUERY, SUBSCRIBER_STATS_PAGE, DEFAULT_FROM, dateChunks, today,
} from "../dist/ingest/endpoints.js";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "skills", "stackchat", "browser");
mkdirSync(OUT, { recursive: true });

const to = today();
const j = (v) => JSON.stringify(v);

const PRELUDE = `
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
// Substack ha devuelto el id del export como export_id, id y exportId segun la version.
const _exportId = (o) => o && (o.export_id || o.id || o.exportId);
const P = (window.__stackchat = { paso: '', fase: 'arrancando', progreso: '', listo: false, error: null, avisos: [], datos: null });
`.trim();

/** Paso 1 — en https://<sub>.substack.com/publish/home. */
const publication = `${PRELUDE}
P.paso = 'publication';

(async () => {
 try {
  const files = {};
  const _csv = async (name, url, prefix) => {
    const t = await _get(url, true);
    if (typeof t !== 'string' || t.trim().split('\\n').length < 2) {
      P.avisos.push({ file: name, motivo: 'vacio o no es CSV', http: t && t.__err });
      return;
    }
    files[name] = (prefix || '') + t;
  };

  // El export de suscriptores es asincrono: se pide primero para que vaya generandose.
  P.fase = 'pidiendo export de suscriptores';
  let exportId = null;
  {
    const set = await _post(${j(PUB.subscriberSet())}, { query: ${j(SUBSCRIBER_SET_QUERY)} });
    if (set && set.id) {
      const exp = await _post(${j(PUB.subscriberExport())}, { subscriberSetId: set.id, columns: ${j([...SUBSCRIBER_EXPORT_COLUMNS])} });
      exportId = _exportId(exp);
      if (!exportId) P.avisos.push({ file: 'email_list.csv', motivo: 'el export no devolvio id: ' + JSON.stringify(exp).slice(0, 140) });
    } else {
      P.avisos.push({ file: 'email_list.csv', motivo: 'subscriber_set fallo: ' + JSON.stringify(set).slice(0, 140) });
    }
  }

  P.fase = 'estadisticas';
  await _csv('email_stats.csv', ${j(PUB.emailStats())});
  await _csv('growth_sources.csv', ${j(PUB.growthSources(DEFAULT_FROM, to))});
  await _csv('paid_subscriber_growth.csv', ${j(PUB.paidSubscriberGrowth(DEFAULT_FROM, to))});
  // Substack devuelve esta serie sin cabecera; se la ponemos.
  await _csv('subscriber_totals.csv', ${j(PUB.subscriberTotals(DEFAULT_FROM))}, 'date,total_subscribers\\n');

  // traffic: por tramos de 90 dias, o Substack agrega por mes y se pierde el detalle diario.
  P.fase = 'trafico';
  {
    const chunks = ${j(dateChunks(DEFAULT_FROM, to, 90).map(([a, b]) => PUB.traffic(a, b)))};
    let header = '', lines = [];
    for (const u of chunks) {
      const t = await _get(u, true);
      if (typeof t !== 'string') continue;
      const [h, ...rows] = t.trim().split(/\\r?\\n/);
      header = header || h;
      lines.push(...rows.filter(Boolean));
    }
    if (header) files['traffic.csv'] = header + '\\n' + lines.join('\\n') + '\\n';
    else P.avisos.push({ file: 'traffic.csv', motivo: 'ningun tramo respondio' });
  }

  // posts: /archive paginado, con el mismo formato que el export oficial posts.csv.
  P.fase = 'posts';
  {
    const cell = (v) => /[",\\n\\r]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v == null ? '' : v);
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
    files['posts.csv'] = [head, ...rows].map((r) => r.map(cell).join(',')).join('\\n') + '\\n';
  }

  // Suscriptores por la API JSON del panel: sin descarga y sin CORS, asi que funciona en
  // cualquier maquina. Se emite con las cabeceras del export ("Email", "Type", "Start date")
  // para que el cargador lo reconozca sin cambios.
  P.fase = 'suscriptores';
  {
    const filas = [];
    for (let off = 0; off < 20000; off += ${SUBSCRIBER_STATS_PAGE}) {
      const r = await _post(${j(PUB.subscriberStats())}, { limit: ${SUBSCRIBER_STATS_PAGE}, offset: off });
      const lote = (r && r.subscribers) || [];
      filas.push(...lote);
      P.progreso = filas.length + '/' + ((r && r.count) || '?') + ' suscriptores';
      if (lote.length < ${SUBSCRIBER_STATS_PAGE}) break;
    }
    if (filas.length) {
      const head = ['Email', 'Name', 'Type', 'Stripe plan', 'Start date', 'Activity', 'Revenue'];
      const cuerpo = filas.map((s) => [
        s.user_email_address, s.user_name, s.subscription_type || '', s.subscription_interval || '',
        s.subscription_created_at, s.activity_rating, s.total_revenue_generated,
      ]);
      files['email_list.csv'] = [head, ...cuerpo].map((r) => r.map(cell).join(',')).join('
') + '
';
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

  P.datos = { kind: 'stackchat-files', fetched_at: new Date().toISOString(), origin: location.origin, files, email_list_url };
  P.resumen = {
    incluye: Object.keys(files).map((k) => k + ' (' + files[k].trim().split('\\n').length + ' filas)'),
    email_list_url,
    kb: Math.round(JSON.stringify(P.datos).length / 1024),
  };
  P.fase = 'terminado';
  P.listo = true;
 } catch (e) { P.error = String(e).slice(0, 200); P.listo = true; }
})();

({ arrancado: 'publication', siguiente: 'sondea window.__stackchat hasta listo:true, luego lee window.__stackchat.datos' })
`;

/** Paso 2 — en https://substack.com: Notes y quién interactúa. */
const notes = `${PRELUDE}
P.paso = 'notes';

(async () => {
 try {
  const me = await _get('/api/v1/user/profile/self');
  const UID = me && me.id;
  if (!UID) throw new Error('no hay sesion en substack.com');

  // 1. Todas las notas propias del feed del perfil (se descartan posts y restacks ajenos).
  P.fase = 'feed';
  const notas = [];
  let cursor = '';
  for (let page = 0; page < 200; page++) {
    const p = await _get('/api/v1/reader/feed/profile/' + UID + (cursor ? '?cursor=' + encodeURIComponent(cursor) : ''));
    if (!p || p.__err) break;
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
    if (!st || !Array.isArray(st.cards)) return null;
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
      id, user_id: Number(UID), date: c.date || null, body: c.body || null,
      reaction_count: Number(c.reaction_count || 0), restacks: Number(c.restacks || 0),
      children_count: Number(c.children_count || 0),
      attachments: Array.isArray(c.attachments) ? c.attachments.map(slim) : [],
      reactors: [], restackers: [], replies: [], stats: null,
    };
    if (rec.reaction_count > 0) {
      const rs = await _get('/api/v1/comment/' + id + '/reactors');
      if (Array.isArray(rs)) rec.reactors = rs.map(actor);
      else bundle.errors.push({ note_id: id, step: 'reactors', error: String(rs && rs.__err) });
    }
    if (rec.restacks > 0) {
      const rs = await _get('/api/v1/comment/' + id + '/restackers');
      if (Array.isArray(rs)) rec.restackers = rs.map(actor).filter((a) => a.id !== Number(UID));
      else bundle.errors.push({ note_id: id, step: 'restackers', error: String(rs && rs.__err) });
    }
    if (rec.children_count > 0) {
      let rc = '';
      for (let i = 0; i < 50; i++) {
        const p = await _get('/api/v1/reader/comment/' + id + '/replies' + (rc ? '?cursor=' + encodeURIComponent(rc) : ''));
        if (!p || p.__err) { bundle.errors.push({ note_id: id, step: 'replies', error: String(p && p.__err) }); break; }
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

  P.datos = bundle;
  P.resumen = {
    notas: bundle.notes.length,
    likes: bundle.notes.reduce((n, x) => n + x.reactors.length, 0),
    restacks: bundle.notes.reduce((n, x) => n + x.restackers.length, 0),
    respuestas: bundle.notes.reduce((n, x) => n + x.replies.length, 0),
    con_stats: bundle.notes.filter((x) => x.stats).length,
    errores: bundle.errors.length,
    kb: Math.round(JSON.stringify(bundle).length / 1024),
  };
  P.fase = 'terminado';
  P.listo = true;
 } catch (e) { P.error = String(e).slice(0, 200); P.listo = true; }
})();

({ arrancado: 'notes', siguiente: 'sondea window.__stackchat hasta listo:true, luego lee window.__stackchat.datos' })
`;

writeFileSync(join(OUT, "01-publication.js"), publication.trimStart(), "utf8");
writeFileSync(join(OUT, "02-notes.js"), notes.trimStart(), "utf8");
console.log(`snippets escritos en ${OUT}`);
