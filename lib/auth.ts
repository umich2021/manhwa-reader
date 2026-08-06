export const AUTH_COOKIE_NAME = "reader_auth";

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Derives a stable, non-reversible cookie value from the shared password so
// the plaintext password itself is never stored in the browser.
export async function authToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(digest);
}
