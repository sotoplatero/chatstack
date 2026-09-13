import type { Db } from "../db/index.js";
import { nowIso } from "../db/index.js";
import type { LoadResult } from "./loaders.js";
import type { NoteActor, NotesBundle } from "../ingest/notes.js";

/** Carga un `notes.json` (NotesBundle). Idempotente: notas, actores e interacciones se reemplazan por clave. */
export function loadNotes(db: Db, runId: number, bundle: NotesBundle): LoadResult {
  const res: LoadResult = { inserted: 0, updated: 0, skipped: 0 };
  const now = nowIso();
  const upNote = db.prepare(`INSERT INTO notes
      (note_id, user_id, date, body, reaction_count, restacks, replies_count, attachments, stats, stats_updated_at, last_synced_run_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(note_id) DO UPDATE SET date=excluded.date, body=excluded.body, reaction_count=excluded.reaction_count,
      restacks=excluded.restacks, replies_count=excluded.replies_count, attachments=excluded.attachments,
      stats=COALESCE(excluded.stats, notes.stats), stats_updated_at=COALESCE(excluded.stats_updated_at, notes.stats_updated_at),
      last_synced_run_id=excluded.last_synced_run_id`);
  const upActor = db.prepare(`INSERT INTO note_actors
      (user_id, name, handle, photo_url, publication_subdomain, publication_name, is_subscribed, is_following, bestseller_tier, first_seen_at, last_seen_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET name=COALESCE(excluded.name, note_actors.name), handle=COALESCE(excluded.handle, note_actors.handle),
      photo_url=COALESCE(excluded.photo_url, note_actors.photo_url),
      publication_subdomain=COALESCE(excluded.publication_subdomain, note_actors.publication_subdomain),
      publication_name=COALESCE(excluded.publication_name, note_actors.publication_name),
      is_subscribed=COALESCE(excluded.is_subscribed, note_actors.is_subscribed),
      is_following=COALESCE(excluded.is_following, note_actors.is_following),
      bestseller_tier=COALESCE(excluded.bestseller_tier, note_actors.bestseller_tier), last_seen_at=excluded.last_seen_at`);
  /**
   * Solo se borra lo que se ha vuelto a descargar. Si la petición de likes falló, sus filas
   * anteriores se quedan: mejor un dato de hace unas horas que ninguno.
   */
  const delKind = db.prepare("DELETE FROM note_interactions WHERE note_id = ? AND kind = ?");
  /**
   * Cuando algún paso falló, los contadores del feed no se guardan. Así la nota sigue viéndose
   * "cambiada" en el siguiente sync y se vuelve a intentar, en lugar de quedar coja para siempre.
   */
  const upNotePartial = db.prepare(`INSERT INTO notes
      (note_id, user_id, date, body, reaction_count, restacks, replies_count, attachments, stats, stats_updated_at, last_synced_run_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(note_id) DO UPDATE SET date=excluded.date, body=excluded.body, attachments=excluded.attachments,
      stats=COALESCE(excluded.stats, notes.stats), stats_updated_at=COALESCE(excluded.stats_updated_at, notes.stats_updated_at),
      last_synced_run_id=excluded.last_synced_run_id`);
  const insInter = db.prepare(`INSERT OR REPLACE INTO note_interactions
      (note_id, actor_user_id, kind, reply_id, created_at, body, reaction_count, run_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const exists = db.prepare("SELECT 1 FROM notes WHERE note_id = ?");

  // Usuarios borrados llegan sin id; sin persona no hay interacción que atribuir.
  const valid = (a: NoteActor | undefined): a is NoteActor => !!a && Number.isFinite(a.id) && a.id > 0;
  const actor = (a: NoteActor) => {
    upActor.run(a.id, a.name, a.handle, a.photo_url, a.publication_subdomain, a.publication_name, bool(a.is_subscribed), bool(a.is_following), a.bestseller_tier, now, now);
  };

  db.exec("BEGIN");
  try {
    for (const n of bundle.notes) {
      if (!n.id) {
        res.skipped++;
        continue;
      }
      const had = !!exists.get(n.id);
      const failed = new Set(n.failed ?? []);
      const stmt = failed.size ? upNotePartial : upNote;
      stmt.run(n.id, n.user_id, n.date, n.body, n.reaction_count, n.restacks, n.children_count, JSON.stringify(n.attachments ?? []),
        n.stats ? JSON.stringify(n.stats) : null, n.stats ? bundle.fetched_at : null, runId);
      // Cada tipo se reconstruye entero, para que quien quitó el like desaparezca; pero solo si
      // se pudo descargar. Lo que falló se deja intacto.
      if (!failed.has("reactors")) {
        delKind.run(n.id, "like");
        for (const a of n.reactors.filter(valid)) {
          actor(a);
          insInter.run(n.id, a.id, "like", 0, null, null, null, runId);
        }
      }
      if (!failed.has("restackers")) {
        delKind.run(n.id, "restack");
        for (const a of n.restackers.filter(valid)) {
          actor(a);
          insInter.run(n.id, a.id, "restack", 0, null, null, null, runId);
        }
      }
      if (!failed.has("replies")) {
        delKind.run(n.id, "reply");
        for (const r of n.replies.filter((r) => valid(r.actor))) {
          actor(r.actor);
          insInter.run(n.id, r.actor.id, "reply", r.id, r.date, r.body, r.reaction_count, runId);
        }
      }
      had ? res.updated++ : res.inserted++;
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return res;
}

function bool(v: boolean | null): number | null {
  return v === null ? null : v ? 1 : 0;
}
