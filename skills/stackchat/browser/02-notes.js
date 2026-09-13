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
  P.json = JSON.stringify(bundle); P.jsonLength = P.json.length;
  P.descargar = (nombre) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([P.json], { type: 'application/json' })); a.download = nombre || 'stackchat-notes.json'; document.body.appendChild(a); a.click(); a.remove(); return 'descarga lanzada: ' + a.download; };
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
