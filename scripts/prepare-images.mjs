// One-time (rerun-when-chapters-change) image prep: reads the raw publisher
// strips from MyCatIsAVegtarianCHRAW/KO2EN/files/<chapter>/JPG/*.jpg,
// sorts them into reading order, compresses them, and writes the result plus
// manifests into public/chapters/ for the Next.js app to serve.
//
// Usage: node scripts/prepare-images.mjs

import { readdir, mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC_ROOT = path.join(ROOT, "MyCatIsAVegtarianCHRAW", "KO2EN", "files");
const OUT_ROOT = path.join(ROOT, "public", "chapters");

const TARGET_WIDTH = 1100;
const JPEG_QUALITY = 80;

// e.g. "036_011.jpg" -> 11. Ordering is derived from this, not from
// position in the directory listing, since strip numbering doesn't always
// start at 001 (some chapters were delivered as partial cuts).
function trailingNumber(filename) {
  const match = filename.match(/(\d+)\.(jpe?g)$/i);
  if (!match) return null;
  return parseInt(match[1], 10);
}

async function listChapterIds() {
  const entries = await readdir(SRC_ROOT, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}

async function processChapter(chapterId) {
  const jpgDir = path.join(SRC_ROOT, chapterId, "JPG");
  let files;
  try {
    files = await readdir(jpgDir);
  } catch {
    console.warn(`  skip ${chapterId}: no JPG/ folder`);
    return null;
  }

  const strips = files
    .filter((f) => /\.(jpe?g)$/i.test(f))
    .map((f) => ({ file: f, n: trailingNumber(f) }))
    .filter((s) => s.n !== null)
    .sort((a, b) => a.n - b.n);

  if (strips.length === 0) {
    console.warn(`  skip ${chapterId}: no jpg strips found`);
    return null;
  }

  const outDir = path.join(OUT_ROOT, chapterId);
  await mkdir(outDir, { recursive: true });

  const images = [];
  for (let i = 0; i < strips.length; i++) {
    const seq = String(i + 1).padStart(3, "0");
    const srcPath = path.join(jpgDir, strips[i].file);
    const outName = `${seq}.jpg`;
    const outPath = path.join(outDir, outName);

    const info = await sharp(srcPath)
      .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, progressive: true, mozjpeg: true })
      .toFile(outPath);

    images.push({ file: outName, width: info.width, height: info.height });
    process.stdout.write(".");
  }
  console.log(` ${chapterId}: ${images.length} strips`);

  const manifest = { id: chapterId, images };
  await writeFile(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  return chapterId;
}

async function dirSize(dir) {
  let total = 0;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await dirSize(full);
    } else {
      total += (await stat(full)).size;
    }
  }
  return total;
}

async function main() {
  const chapterIds = await listChapterIds();
  console.log(`Found ${chapterIds.length} chapters in ${SRC_ROOT}`);

  await mkdir(OUT_ROOT, { recursive: true });

  const processed = [];
  for (const chapterId of chapterIds) {
    const result = await processChapter(chapterId);
    if (result) processed.push(result);
  }

  await writeFile(
    path.join(OUT_ROOT, "index.json"),
    JSON.stringify({ chapters: processed }, null, 2)
  );

  const totalBytes = await dirSize(OUT_ROOT);
  console.log(
    `\nDone. ${processed.length} chapters written to ${OUT_ROOT} (${(
      totalBytes /
      1024 /
      1024
    ).toFixed(1)} MB)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
