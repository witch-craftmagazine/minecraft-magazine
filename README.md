# witchcraft...magazine

A pixel-perfect web reader for Minecraft written books, featuring the complete in-game **Witch-Craft Magazine** series authored by **StarSweetpea** on Deathcap Island (Craftadia).

Built using authentic Minecraft Java font metrics, genuine vanilla UI textures, and layout rules reverse-engineered directly from Minecraft's `BookViewScreen` and `BitmapProvider`.

---

## Features

- **Witch-Craft Magazine Series**:
  - Includes all 22 official issues exported directly via **Stendhal** (`intro.stendhal`, `issue1.stendhal` through `issue20.stendhal`, and `issue2023.stendhal`).
  - Sleek top selector bar to instantly switch between issues or share direct links (`#issue=issue1`).
- **Default Two-Page Spread Layout**:
  - Displays books as an authentic open manuscript with side-by-side pages.
  - Mirrored left page texture with genuine spine alignment and seamless 42px center overlap.
  - Plain pitch-black background (`#000000`) for immersive reading.
- **Custom Resource Pack Textures & Emojis**:
  - Bundled with Craftadia's custom server resource pack (`pack.png`, custom bitmap providers, and glyphs).
  - Authentic display of custom emojis, rank tags, and full-width 114px header banners (`\uE109`, `\uE155`, etc.).
- **Authentic Minecraft Typography & Engine**:
  - 114px line wrap limit with strict 14 lines per page.
  - Vanilla font sheets (`ascii.png`, `accented.png`, `nonlatin_european.png`) with exact character advances.
  - Full support for formatting codes: `§0`–`§f`, hex colors (`&#RRGGBB`), `§l` (bold), `§o` (italic), `§n` (underline), `§m` (strikethrough), and dynamic animated `§k` (obfuscated text).
  - Extended Unicode and Symbol Chat support (symbols, CJK, runes, math symbols, and Private Use Area).
- **Audio & Navigation**:
  - Synthesized Web Audio API page rustle and snap matching `SoundEvents.BOOK_PAGE_TURN` (offline, zero external audio downloads).
  - Turn pages with canvas buttons or keyboard: `←` / `→`, `Space`, `PageUp` / `PageDown`, `Home` / `End`.
  - Jump between issues with `Shift + ←` / `Shift + →` or `[` / `]`.

---

## Live Demo & GitHub Pages Deployment

This repository is configured for automated deployment to **GitHub Pages** via GitHub Actions.

### Setting Up GitHub Pages
1. Push your repository to GitHub.
2. In your GitHub repository, navigate to **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, select **GitHub Actions**.
4. Pushing to `main` (or running the **Deploy Witch-Craft Magazine to GitHub Pages** workflow manually) will automatically build and publish your site.

---

## Local Development

### Prerequisites
- [Bun](https://bun.sh/) (recommended) or [Node.js](https://nodejs.org/) (v18+)

### Install & Run Dev Server
```bash
# Using Bun (fastest)
bun install
bun run dev

# Or using npm
npm install
npm run dev
```

### Run Tests
```bash
bun test
# or
npm test
```

### Production Build
```bash
bun run build
bun run preview
```

---

## Project Structure

```
minecraft-magazine/
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions automated Pages deployment
├── docs/
│   └── plan.md              # Architecture and roadmap
├── public/
│   └── assets/
│       ├── books/           # 22 Stendhal Witch-Craft magazine issues (.stendhal)
│       ├── font/            # Glyphs and metrics
│       ├── packs/
│       │   └── craftadia/   # Custom server pack (emojis, logo banners, font definitions)
│       └── textures/        # Vanilla book background and page turn buttons
├── src/
│   ├── engine/
│   │   ├── Formatting.ts    # Minecraft color and format code parser
│   │   ├── GlyphAtlas.ts    # Bitmap font renderer & multi-pack glyph manager
│   │   ├── ResourcePackManager.ts # Pack loader for vanilla & custom packs
│   │   ├── StringSplitter.ts# 114px line breaker and paginator
│   │   └── types.ts         # TypeScript definitions
│   ├── io/
│   │   ├── BookParser.ts    # Stendhal, BookCopy, CMI, and give command parsers
│   │   └── BookExporter.ts  # Exporters for Minecraft books
│   ├── render/
│   │   ├── BookCanvas.ts    # Pixel-perfect canvas renderer (single & 2-page spread)
│   │   └── SoundEffects.ts  # Synthesized page flip sound generator
│   ├── samples/
│   │   └── sampleBooks.ts   # Magazine issue registry
│   ├── ui/
│   │   ├── BookViewer.ts    # Minimalist magazine reader shell & selector bar
│   │   ├── EditorModal.ts   # Book editor modal
│   │   ├── ExportModal.ts   # Export modal
│   │   └── ImportModal.ts   # Import modal
│   ├── main.ts              # Application bootstrap
│   └── styles.css           # Pitch-black viewport & floating selector styling
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Credits & Attribution

- **Witch-Craft Magazine**: Authored and designed in-game by **StarSweetpea** (2022–2025) on the Craftadia Minecraft server.
- **Textures & Fonts**: Authentic assets from Minecraft (Mojang Studios) and Craftadia server resource pack.
