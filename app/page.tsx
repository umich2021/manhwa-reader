import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

interface ChapterIndex {
  chapters: string[];
}

async function getChapters(): Promise<string[]> {
  try {
    const indexPath = path.join(
      process.cwd(),
      "public",
      "chapters",
      "index.json"
    );
    const raw = await readFile(indexPath, "utf-8");
    const data: ChapterIndex = JSON.parse(raw);
    return data.chapters;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const chapters = await getChapters();

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "1.4rem" }}>Chapters</h1>
        <ThemeToggle />
      </div>
      {chapters.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>
          No chapters found. Run{" "}
          <code>node scripts/prepare-images.mjs</code> first.
        </p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {chapters.map((id) => (
            <li key={id}>
              <Link
                href={`/chapter/${id}`}
                style={{
                  display: "block",
                  padding: "0.9rem 1rem",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              >
                Chapter {parseInt(id, 10)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
