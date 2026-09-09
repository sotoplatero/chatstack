import { spawnSync } from "node:child_process";

/**
 * Envoltorio mínimo sobre la CLI `agent-browser`. Cada llamada es un proceso; el daemon
 * de agent-browser mantiene el navegador vivo entre llamadas dentro de la misma sesión.
 */
export class AgentBrowser {
  constructor(
    private readonly session: string,
    private readonly stateFile?: string,
    private readonly log: (msg: string) => void = () => {},
  ) {}

  run(args: string[], opts: { timeoutMs?: number; allowFail?: boolean } = {}): string {
    const full = ["--session", this.session, ...args];
    this.log(`$ agent-browser ${full.join(" ")}`);
    const r = spawnSync("agent-browser", full, {
      encoding: "utf8",
      timeout: opts.timeoutMs ?? 60_000,
      shell: process.platform === "win32",
      windowsHide: true,
    });
    const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
    if (r.status !== 0 && !opts.allowFail) {
      throw new Error(`agent-browser ${args[0]} falló (exit ${r.status}): ${out.slice(0, 500)}`);
    }
    return out;
  }

  open(url: string) {
    const args = ["open", url];
    if (this.stateFile) args.unshift("--state", this.stateFile);
    return this.run(args, { timeoutMs: 90_000 });
  }

  url(): string {
    return this.run(["get", "url"]).split(/\r?\n/).pop()?.trim() ?? "";
  }

  /** Snapshot interactivo: refs @eN con rol y texto. */
  snapshot(): string {
    return this.run(["snapshot", "-i"], { timeoutMs: 60_000 });
  }

  click(ref: string) {
    return this.run(["click", ref]);
  }

  download(ref: string, dest: string) {
    return this.run(["download", ref, dest], { timeoutMs: 120_000 });
  }

  saveState(path: string) {
    return this.run(["state", "save", path]);
  }

  setCookiesFromCurl(curlFile: string) {
    return this.run(["cookies", "set", "--curl", curlFile]);
  }

  close() {
    return this.run(["close"], { allowFail: true });
  }
}

/** Busca en un snapshot el primer ref @eN cuya línea case con alguno de los patrones (en orden de preferencia). */
export function findRef(snapshot: string, patterns: RegExp[]): string | null {
  const lines = snapshot.split(/\r?\n/);
  for (const re of patterns) {
    for (const line of lines) {
      if (!re.test(line)) continue;
      const m = /@e\d+/.exec(line);
      if (m) return m[0];
    }
  }
  return null;
}
