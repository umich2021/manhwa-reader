// Scans the raw publisher source (before prepare-images.mjs renumbers
// strips sequentially, which would otherwise hide gaps) and reports:
//   1. Chapter numbers with no directory in the source drop at all.
//   2. Chapters whose strip filenames have gaps/duplicates in their
//      trailing page number.
// Writes a report to scripts/missing-report.txt; doesn't touch public/.
//
// Usage: node scripts/check-missing-chapters.mjs

import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC_ROOT = path.join(ROOT, "MyCatIsAVegtarianCHRAW", "KO2EN", "files");
const REPORT_PATH = path.join(__dirname, "missing-report.txt");

// Most complete chapters in this series top out around 10 strips, so a
// chapter with fewer present files than this is presumed to be missing
// pages rather than just genuinely being that short. Checking always
// starts at page 1 too, since a chapter whose lowest present file is,
// say, 004 is missing pages 1-3, not just "starting from 4".
const EXPECTED_MIN_PAGES = 10;

// e.g. "036_011.jpg" -> 11
function trailingNumber(filename) {
  const match = filename.match(/(\d+)\.(jpe?g)$/i);
  if (!match) return null;
  return parseInt(match[1], 10);
}

function formatRanges(numbers) {
  if (numbers.length === 0) return "none";
  const sorted = [...numbers].sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const n = sorted[i];
    if (n === prev + 1) {
      prev = n;
      continue;
    }
    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = n;
    prev = n;
  }
  return ranges.join(", ");
}

async function listChapterDirs() {
  const entries = await readdir(SRC_ROOT, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}

function findMissingChapterNumbers(chapterIds) {
  const nums = chapterIds.map((id) => parseInt(id, 10));
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const present = new Set(nums);
  const missing = [];
  for (let n = min; n <= max; n++) {
    if (!present.has(n)) missing.push(n);
  }
  return missing;
}

async function checkChapterPages(chapterId) {
  const jpgDir = path.join(SRC_ROOT, chapterId, "JPG");
  let files;
  try {
    files = await readdir(jpgDir);
  } catch {
    return { chapterId, error: "no JPG/ folder found" };
  }

  const numbers = files
    .filter((f) => /\.(jpe?g)$/i.test(f))
    .map((f) => trailingNumber(f))
    .filter((n) => n !== null);

  if (numbers.length === 0) {
    return { chapterId, error: "no numbered jpg strips found" };
  }

  const max = Math.max(EXPECTED_MIN_PAGES, ...numbers);
  const seen = new Map();
  for (const n of numbers) seen.set(n, (seen.get(n) ?? 0) + 1);

  const missing = [];
  for (let n = 1; n <= max; n++) {
    if (!seen.has(n)) missing.push(n);
  }
  const duplicates = [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([n]) => n);

  return { chapterId, missing, duplicates, count: numbers.length };
}

async function main() {
  const chapterIds = await listChapterDirs();
  console.log(`Found ${chapterIds.length} chapter directories in ${SRC_ROOT}`);

  const missingChapters = findMissingChapterNumbers(chapterIds);

  const pageResults = [];
  for (const chapterId of chapterIds) {
    pageResults.push(await checkChapterPages(chapterId));
  }

  const withIssues = pageResults.filter(
    (r) => r.error || r.missing.length > 0 || r.duplicates.length > 0
  );
  const clean = pageResults.filter(
    (r) => !r.error && r.missing.length === 0 && r.duplicates.length === 0
  );

  const lines = [];
  lines.push("Missing Chapters/Pages Report");
  lines.push("==============================");
  lines.push("");
  lines.push(
    `Missing chapter numbers (range ${chapterIds[0]}-${
      chapterIds[chapterIds.length - 1]
    }):`
  );
  lines.push(
    `  ${missingChapters.length > 0 ? formatRanges(missingChapters) : "none"}`
  );
  lines.push("");
  lines.push("Chapters with page-number issues:");
  if (withIssues.length === 0) {
    lines.push("  none");
  } else {
    for (const r of withIssues) {
      if (r.error) {
        lines.push(`  Chapter ${r.chapterId}: ${r.error}`);
        continue;
      }
      const parts = [];
      if (r.missing.length > 0) {
        parts.push(`missing pages: ${formatRanges(r.missing)}`);
      }
      if (r.duplicates.length > 0) {
        parts.push(`duplicate page numbers: ${r.duplicates.join(", ")}`);
      }
      lines.push(`  Chapter ${r.chapterId}: ${parts.join("; ")}`);
    }
  }
  lines.push("");
  lines.push(
    `Chapters OK (${clean.length}): ${clean
      .map((r) => r.chapterId)
      .join(", ")}`
  );
  lines.push("");

  await writeFile(REPORT_PATH, lines.join("\n"));

  console.log(
    `${missingChapters.length} missing chapter number(s), ${withIssues.length} chapter(s) with page issues.`
  );
  console.log(`Report written to ${REPORT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
