# Documentation Index

Welcome to the technical documentation for the **Witch-Craft Magazine / Minecraft Book Viewer** web application.

---

## Documentation Guides

1. **[Minecraft Rendering & Typography Specification](file:///Users/ethanchan/Documents/Applications/minecraftwebsites/minecraft-magazine/docs/minecraft_rendering_and_typography.md)**
   - Minecraft Java Edition font engine architecture (`UnihexProvider.java`, `BitmapProvider.java`).
   - Page constraints ($114\text{px}$ text boundary, $14\text{ lines/page}$, $9\text{px}$ line height).
   - Formatting codes (`§0`–`§f`, `§l`, `§o`, `§n`, `§m`, `§k`, `§r`, Bedrock & hex colors).
   - Horizontal side-bearings and 1px glyph cell spacing for block elements (`█`, `▃`, `▄`, etc.).
   - Exact line wrapping and trailing whitespace consumption (`StringSplitter.java`).

2. **[Book Formats & Storage Specification](file:///Users/ethanchan/Documents/Applications/minecraftwebsites/minecraft-magazine/docs/book_formats_and_storage.md)**
   - **Stendhal format (`.stendhal`)**: YAML frontmatter and `#- ` page markers.
   - **BookCopy mod JSON**: Java record format for client-side mod backups.
   - **CMI BookExport (`.txt`)**: Spigot/Paper server plugin syntax with `<NextPage>`.
   - **Vanilla Minecraft NBT / SNBT**: Modern 1.20.5+ item components and pre-1.20.5 legacy NBT.
   - **Vanilla `/give` command syntax**: Command generation and escaping.
   - **URL Hash & Deep-Linking**: Shareable URLs (`#issue=issue1&page=5`), shorthand aliases, and base64 book payload links.

3. **[Website Architecture & Features Specification](file:///Users/ethanchan/Documents/Applications/minecraftwebsites/minecraft-magazine/docs/website_architecture_and_features.md)**
   - Layered architecture (UI, Router, Engine, Render, Audio, IO).
   - Single-Page (1:1 vanilla screen) vs. Two-Page Spread (open magazine view).
   - Canvas pixel-perfect scaling and integer rasterization.
   - Interactive Easter eggs (StarSweetpea blinking eye, animated GIF ending spread).
   - Accessibility layer (invisible DOM text overlay, ARIA attributes, text selection toggle).
   - Debug inspector grid and developer tooling.
   - Test suite and build commands.

4. **[Implementation Plan Archive](file:///Users/ethanchan/Documents/Applications/minecraftwebsites/minecraft-magazine/docs/plan.md)**
   - Original design roadmap, architectural milestones, and feature requirements.
