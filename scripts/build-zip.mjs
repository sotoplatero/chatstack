#!/usr/bin/env node
/**
 * Empaqueta `skills/stackchat/` en un .zip para instalarlo a mano donde no llegue el CLI de skills.
 * Dentro va la carpeta `stackchat/` con SKILL.md en su raíz, que es la forma que esperan los
 * cargadores de skills.
 */
import { createWriteStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync, crc32 } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = join(root, "skills");
const skillDir = join(srcRoot, "stackchat");
const outfile = join(root, "stackchat-skill.zip");

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    if ((await stat(p)).isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

/** ZIP mínimo (deflate raw + cabeceras), para no depender de una librería solo por esto. */
async function zip(files, base, dest) {
  const { readFile } = await import("node:fs/promises");
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const file of files) {
    const name = relative(base, file).split(sep).join("/");
    const data = await readFile(file);
    const comp = deflateRawSync(data);
    const crc = crc32(data);
    const nameBuf = Buffer.from(name, "utf8");

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt32LE(0, 10); // hora/fecha: fijas, para que el zip sea reproducible
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    chunks.push(local, nameBuf, comp);

    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(8, 10);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(comp.length, 20);
    cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(nameBuf.length, 28);
    cen.writeUInt32LE(offset, 42);
    central.push(cen, nameBuf);
    offset += local.length + nameBuf.length + comp.length;
  }

  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);

  const all = Buffer.concat([...chunks, centralBuf, end]);
  await new Promise((res, rej) => {
    const s = createWriteStream(dest);
    s.on("error", rej).on("finish", res).end(all);
  });
  return all.length;
}

const files = await walk(skillDir);
const size = await zip(files, srcRoot, outfile);
console.log(`zip: ${outfile} (${Math.round(size / 1024)} KB, ${files.length} archivos)`);
