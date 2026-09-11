import type { SubstackClient } from "./substack.js";

/**
 * Notes (substack.com, no el subdominio): feed del perfil paginado por cursor, y por cada nota
 * propia quién le dio like, quién la restackeó y quién respondió. `note_stats` es opcional:
 * Substack tarda ~24h en habilitarlo por nota y responde `{"error":""}` mientras tanto.
 */

import { SOCIAL, SOCIAL_ORIGIN } from "./endpoints.js";

const ROOT = SOCIAL_ORIGIN;

export interface NoteActor {
  id: number;
  name: string | null;
  handle: string | null;
  photo_url: string | null;
  publication_subdomain: string | null;
  publication_name: string | null;
  is_subscribed: boolean | null;
  is_following: boolean | null;
  bestseller_tier: number | null;
}

export interface NoteReply {
  id: number;
  actor: NoteActor;
  date: string | null;
  body: string | null;
  reaction_count: number | null;
  parent_id: number | null;
}

export interface NoteRecord {
  id: number;
  user_id: number;
  date: string | null;
  body: string | null;
  reaction_count: number;
  restacks: number;
  children_count: number;
  attachments: unknown[];
  reactors: NoteActor[];
  restackers: NoteActor[];
  replies: NoteReply[];
  stats: unknown | null;
}

export interface NotesBundle {
  kind: "notes";
  fetched_at: string;
  user_id: number;
  notes: NoteRecord[];
  errors: { note_id: number; step: string; error: string }[];
}

type RawUser = Record<string, any>;

function toActor(u: RawUser): NoteActor {
  const pub = u.primary_publication ?? u.user_primary_publication ?? null;
  return {
    id: Number(u.id ?? u.user_id),
    name: u.name ?? null,
    handle: u.handle ?? null,
    photo_url: u.photo_url ?? null,
    publication_subdomain: pub?.subdomain ?? null,
    publication_name: pub?.name ?? null,
    is_subscribed: typeof u.is_subscribed === "boolean" ? u.is_subscribed : null,
    is_following: typeof u.is_following === "boolean" ? u.is_following : null,
    bestseller_tier: u.bestseller_tier ?? u.user_bestseller_tier ?? null,
  };
}

export async function fetchSelfUserId(client: SubstackClient): Promise<number> {
  const me = (await (await client.get(ROOT + SOCIAL.self(), "application/json")).json()) as { id?: number };
  if (!me?.id) throw new Error("no pude obtener el id de usuario (user/profile/self)");
  return me.id;
}

/** Todas las notas propias del feed del perfil (se descartan posts y restacks de terceros). */
export async function fetchOwnNotes(client: SubstackClient, userId: number, maxPages = 200): Promise<RawUser[]> {
  const out: RawUser[] = [];
  let cursor = "";
  for (let page = 0; page < maxPages; page++) {
    const payload = (await (await client.get(ROOT + SOCIAL.profileFeed(userId, cursor), "application/json")).json()) as {
      items?: RawUser[];
      nextCursor?: string;
    };
    const items = payload.items ?? [];
    for (const it of items) {
      const c = it.comment;
      if (it.type === "comment" && c && Number(c.user_id) === userId) out.push(c);
    }
    const next = payload.nextCursor ?? "";
    if (!next || !items.length || next === cursor) break;
    cursor = next;
  }
  return out;
}

async function fetchReplies(client: SubstackClient, noteId: number): Promise<NoteReply[]> {
  const out: NoteReply[] = [];
  let cursor = "";
  for (let i = 0; i < 50; i++) {
    const payload = (await (await client.get(ROOT + SOCIAL.replies(noteId, cursor), "application/json")).json()) as {
      commentBranches?: { comment: RawUser; descendantComments?: RawUser[] }[];
      nextCursor?: string;
    };
    for (const br of payload.commentBranches ?? []) {
      // Los descendientes vienen envueltos: { comment, type }.
      const all = [br.comment, ...(br.descendantComments ?? []).map((d) => d.comment ?? d)].filter(Boolean);
      for (const c of all) {
        out.push({
          id: Number(c.id),
          // En una respuesta `id` es el comentario; la persona es `user_id`.
          actor: toActor({ ...c, id: c.user_id }),
          date: c.date ?? null,
          body: c.body ?? null,
          reaction_count: c.reaction_count ?? null,
          parent_id: c.parent_id ? Number(c.parent_id) : null,
        });
      }
    }
    const next = payload.nextCursor ?? "";
    if (!next || next === cursor) break;
    cursor = next;
  }
  return out;
}

async function fetchNoteStats(client: SubstackClient, noteId: number): Promise<unknown | null> {
  try {
    const res = await client.get(ROOT + SOCIAL.noteStats(noteId), "application/json", 1);
    const j = (await res.json()) as Record<string, unknown>;
    return j && !("error" in j) ? j : null;
  } catch {
    return null;
  }
}

export async function collectNotes(
  client: SubstackClient,
  opts: { userId?: number; concurrency?: number; log?: (m: string) => void } = {},
): Promise<NotesBundle> {
  const log = opts.log ?? (() => {});
  const userId = opts.userId ?? (await fetchSelfUserId(client));
  const raw = await fetchOwnNotes(client, userId);
  log(`  ${raw.length} notas propias en el feed`);
  const bundle: NotesBundle = { kind: "notes", fetched_at: new Date().toISOString(), user_id: userId, notes: [], errors: [] };

  const queue = [...raw];
  const worker = async () => {
    for (let c = queue.shift(); c; c = queue.shift()) {
      const id = Number(c.id);
      const rec: NoteRecord = {
        id,
        user_id: userId,
        date: c.date ?? null,
        body: c.body ?? null,
        reaction_count: Number(c.reaction_count ?? 0),
        restacks: Number(c.restacks ?? 0),
        children_count: Number(c.children_count ?? 0),
        attachments: Array.isArray(c.attachments) ? c.attachments.map(slimAttachment) : [],
        reactors: [],
        restackers: [],
        replies: [],
        stats: null,
      };
      const step = async (name: string, fn: () => Promise<void>) => {
        try {
          await fn();
        } catch (e) {
          bundle.errors.push({ note_id: id, step: name, error: e instanceof Error ? e.message : String(e) });
        }
      };
      // Sin likes/restacks/respuestas no hay nada que pedir: ahorra 3 peticiones por nota vacía.
      if (rec.reaction_count > 0)
        await step("reactors", async () => {
          rec.reactors = ((await (await client.get(ROOT + SOCIAL.reactors(id), "application/json")).json()) as RawUser[]).map(toActor);
        });
      if (rec.restacks > 0)
        await step("restackers", async () => {
          rec.restackers = ((await (await client.get(ROOT + SOCIAL.restackers(id), "application/json")).json()) as RawUser[])
            .map(toActor)
            .filter((a) => a.id !== userId); // tu propio restack no es interacción ajena
        });
      if (rec.children_count > 0)
        await step("replies", async () => {
          rec.replies = (await fetchReplies(client, id)).filter((r) => r.actor.id !== userId);
        });
      // note_stats solo donde puede aportar algo: notas con interacción o de los últimos 60 días.
      const recent = rec.date ? Date.now() - Date.parse(rec.date) < 60 * 86_400_000 : false;
      if (rec.reaction_count + rec.restacks + rec.children_count > 0 || recent) rec.stats = await fetchNoteStats(client, id);
      bundle.notes.push(rec);
    }
  };
  // Una a la vez por defecto: substack.com limita por ritmo (429) y en paralelo se pierde más de lo que se gana.
  await Promise.all(Array.from({ length: Math.max(1, opts.concurrency ?? 1) }, worker));
  bundle.notes.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return bundle;
}

/** De los adjuntos solo interesa qué son y a qué apuntan, no el objeto completo de la publicación. */
function slimAttachment(a: RawUser) {
  return {
    type: a.type ?? null,
    post_id: a.post?.id ?? a.postSelection?.post?.id ?? null,
    post_title: a.post?.title ?? null,
    url: a.post?.canonical_url ?? a.url ?? a.linkMetadata?.url ?? null,
    publication: a.publication?.subdomain ?? a.post?.publication?.subdomain ?? null,
  };
}
