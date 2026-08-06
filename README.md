# Manhwa Reader

A password-gated reader for chapters delivered as tall scroll-format JPG strips.

## Adding / updating chapters

No code changes needed — this is a data operation.

1. Drop the new chapter folder(s) into
   `KO2EN-20260304T111341Z-3-001/KO2EN/files/<chapter>/JPG/*.jpg`, following the same layout
   as the existing chapters, e.g. `files/001/JPG/001_001.jpg`, `files/002/JPG/002_001.jpg`.
   (This folder is not committed to git — see `.gitignore`.)
2. Regenerate the compressed copies the app actually serves:

   ```
   node scripts/prepare-images.mjs
   ```

   It rescans the whole `files/` folder every time, so it picks up new chapters automatically
   alongside existing ones and rebuilds `public/chapters/index.json` in numeric order. Strip
   ordering within a chapter is derived from the trailing number in each filename, not its
   position on disk, so partial/oddly-numbered deliveries (e.g. a chapter whose only file is
   `036_011.jpg`) still sort correctly.
3. Refresh `npm run dev` locally to see the new chapters — no restart needed.
4. If this is already deployed, commit the updated `public/chapters/` output and push (see
   Deploying below) — that's what actually ships. The raw `KO2EN-...` source folder is
   gitignored and never deployed.

## Local development

```
npm install
npm run dev
```

Open http://localhost:3000. Without a `READER_PASSWORD` env var set, the reader is open
(no login prompt) — convenient for local dev. Set `READER_PASSWORD` to test the login gate:

```
READER_PASSWORD=testpass123 npm run dev
```

## Deploying (Vercel)

1. Commit and push to GitHub:

   ```
   git add -A
   git commit -m "Initial manhwa reader"
   git push -u origin main
   ```

2. Go to [vercel.com/new](https://vercel.com/new), sign in, and import this GitHub repo
   (Next.js is auto-detected, no config needed).
3. Before the first deploy, open **Project Settings → Environment Variables** and add
   `READER_PASSWORD` with a password only people who should read the chapters know. Apply it
   to all environments. Do not commit this value anywhere.
4. Deploy. From then on, every `git push` to `main` auto-deploys.

Every page and every chapter image is gated behind `/login` until the correct password is
submitted (sets a 30-day cookie).

Alternative: deploy without GitHub using the Vercel CLI (`npx vercel`, then `npx vercel --prod`)
— still requires setting `READER_PASSWORD` in the Vercel dashboard before it's usable.
