#!/usr/bin/env node
/**
 * Empaqueta el CLI en un solo archivo dentro del skill, para que instalar sea copiar la carpeta:
 * sin `npm install`, sin node_modules. El SDK de MCP queda fuera (el skill no lo usa) porque
 * `src/cli.ts` lo carga con un import dinámico.
 */
import { build } from "esbuild";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { statSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// .cjs explícito: algunas dependencias (adm-zip) son CommonJS y usan require dinámico, que no
// existe en ESM. La extensión evita además depender de si hay un package.json "type" al lado.
const outfile = join(root, "skills", "stackchat", "bin", "stackchat.cjs");

await build({
  entryPoints: [join(root, "src", "cli.ts")],
  outfile,
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  external: ["@modelcontextprotocol/sdk/*", "zod"],
  banner: { js: "#!/usr/bin/env node" },
  logLevel: "warning",
});

console.log(`bundle: ${outfile} (${(statSync(outfile).size / 1024).toFixed(0)} KB)`);
