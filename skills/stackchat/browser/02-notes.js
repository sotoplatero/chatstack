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
