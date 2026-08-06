export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next =
    params.next && params.next.startsWith("/") ? params.next : "/";
  const hasError = params.error === "1";

  return (
    <main
      style={{
        maxWidth: 340,
        margin: "20vh auto 0",
        padding: "0 1.5rem",
      }}
    >
      <h1 style={{ fontSize: "1.15rem", marginBottom: "1rem" }}>
        Enter password
      </h1>
      <form method="POST" action="/api/login">
        <input type="hidden" name="next" value={next} />
        <input
          type="password"
          name="password"
          autoFocus
          placeholder="Password"
          style={{
            width: "100%",
            padding: "0.6rem 0.75rem",
            fontSize: "1rem",
            border: "1px solid var(--border)",
            borderRadius: 6,
            background: "var(--background)",
            color: "var(--foreground)",
          }}
        />
        <button
          type="submit"
          style={{
            marginTop: "0.75rem",
            width: "100%",
            padding: "0.6rem 0.75rem",
            fontSize: "1rem",
            borderRadius: 6,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Continue
        </button>
      </form>
      {hasError && (
        <p style={{ color: "#e5484d", marginTop: "0.75rem" }}>
          Wrong password. Try again.
        </p>
      )}
    </main>
  );
}
