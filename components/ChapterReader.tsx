"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

interface StripImage {
  file: string;
  width: number;
  height: number;
}

interface Props {
  chapterId: string;
  images: StripImage[];
  prevId: string | null;
  nextId: string | null;
}

export default function ChapterReader({
  chapterId,
  images,
  prevId,
  nextId,
}: Props) {
  const router = useRouter();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageKey = `scrollpos:${chapterId}`;
  const [showTop, setShowTop] = useState(false);

  // Restore reading position (as a fraction of scroll height, since strip
  // pixel heights can shift slightly between runs of the prep script).
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    const fraction = saved ? parseFloat(saved) : NaN;
    if (!Number.isFinite(fraction) || fraction <= 0) return;
    const frame = requestAnimationFrame(() => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: Math.max(fraction * scrollable, 0) });
    });
    return () => cancelAnimationFrame(frame);
  }, [storageKey]);

  useEffect(() => {
    function onScroll() {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const scrollable =
          document.documentElement.scrollHeight - window.innerHeight;
        const fraction = scrollable > 0 ? window.scrollY / scrollable : 0;
        localStorage.setItem(storageKey, String(fraction));
      }, 200);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [storageKey]);

  useEffect(() => {
    function onScroll() {
      setShowTop((prev) => {
        const next = window.scrollY > 400;
        return prev === next ? prev : next;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.key === "ArrowRight" && nextId) {
        router.push(`/chapter/${nextId}`);
      } else if (e.key === "ArrowLeft" && prevId) {
        router.push(`/chapter/${prevId}`);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prevId, nextId, router]);

  return (
    <div>
      <NavBar chapterId={chapterId} prevId={prevId} nextId={nextId} sticky />
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {images.map((img, i) => (
          // strips are pre-sized/compressed by scripts/prepare-images.mjs; Next's Image optimizer would just reprocess them unnecessarily
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={img.file}
            src={`/chapters/${chapterId}/${img.file}`}
            width={img.width}
            height={img.height}
            loading={i < 2 ? "eager" : "lazy"}
            decoding="async"
            alt={`Chapter ${chapterId}, part ${i + 1}`}
            style={{ display: "block", width: "100%", height: "auto" }}
          />
        ))}
      </div>
      <NavBar chapterId={chapterId} prevId={prevId} nextId={nextId} />
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          style={scrollTopStyle}
        >
          ↑
        </button>
      )}
    </div>
  );
}

function NavBar({
  chapterId,
  prevId,
  nextId,
  sticky = false,
}: {
  chapterId: string;
  prevId: string | null;
  nextId: string | null;
  sticky?: boolean;
}) {
  const barStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    padding: "0.75rem 1rem",
    borderBottom: sticky ? "1px solid var(--border)" : undefined,
    borderTop: sticky ? undefined : "1px solid var(--border)",
    background: "var(--background)",
    ...(sticky ? { position: "sticky", top: 0, zIndex: 10 } : {}),
  };

  return (
    <div style={barStyle}>
      <Link href="/" style={navLinkStyle}>
        ← Chapters
      </Link>
      <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
        Chapter {parseInt(chapterId, 10)}
      </span>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        {prevId ? (
          <Link href={`/chapter/${prevId}`} style={navLinkStyle}>
            ← Prev
          </Link>
        ) : (
          <span style={disabledStyle}>← Prev</span>
        )}
        {nextId ? (
          <Link href={`/chapter/${nextId}`} style={navLinkStyle}>
            Next →
          </Link>
        ) : (
          <span style={disabledStyle}>Next →</span>
        )}
        {sticky && <ThemeToggle />}
      </div>
    </div>
  );
}

const navLinkStyle: CSSProperties = {
  fontSize: "0.85rem",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "0.35rem 0.6rem",
};

const disabledStyle: CSSProperties = {
  ...navLinkStyle,
  color: "var(--muted)",
  opacity: 0.5,
};

const scrollTopStyle: CSSProperties = {
  position: "fixed",
  bottom: "1.5rem",
  right: "1.5rem",
  zIndex: 20,
  width: 44,
  height: 44,
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "var(--background)",
  color: "var(--foreground)",
  fontSize: "1.1rem",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
};
