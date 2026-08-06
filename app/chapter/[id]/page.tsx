import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import ChapterReader from "@/components/ChapterReader";

interface Manifest {
  id: string;
  images: { file: string; width: number; height: number }[];
}

async function getChapterIds(): Promise<string[]> {
  try {
    const indexPath = path.join(
      process.cwd(),
      "public",
      "chapters",
      "index.json"
    );
    const raw = await readFile(indexPath, "utf-8");
    return (JSON.parse(raw) as { chapters: string[] }).chapters;
  } catch {
    return [];
  }
}

async function getManifest(id: string): Promise<Manifest | null> {
  try {
    const manifestPath = path.join(
      process.cwd(),
      "public",
      "chapters",
      id,
      "manifest.json"
    );
    const raw = await readFile(manifestPath, "utf-8");
    return JSON.parse(raw) as Manifest;
  } catch {
    return null;
  }
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [manifest, chapterIds] = await Promise.all([
    getManifest(id),
    getChapterIds(),
  ]);

  if (!manifest) notFound();

  const index = chapterIds.indexOf(id);
  const prevId = index > 0 ? chapterIds[index - 1] : null;
  const nextId =
    index >= 0 && index < chapterIds.length - 1
      ? chapterIds[index + 1]
      : null;

  return (
    <ChapterReader
      chapterId={id}
      images={manifest.images}
      prevId={prevId}
      nextId={nextId}
    />
  );
}
