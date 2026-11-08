# Minecraft Book Rendering & Typography Specification

This document provides a comprehensive technical breakdown of how Minecraft Java Edition renders written books, manages typography, calculates character metrics, and handles word wrapping.

---

## 1. Page Geometry & Layout Constraints

Minecraft's written book interface is defined in `net.minecraft.client.gui.screens.inventory.BookViewScreen` (and `BookEditScreen`).

| Metric | Minecraft Java Value | Purpose / Notes |
| :--- | :--- | :--- |
| **Canvas Page Texture** | $146 \times 180\text{ px}$ | Native dimensions of `assets/minecraft/textures/gui/book.png` |
| **Page Text Origin** | $(X=36, Y=30)$ | Distance from the top-left of the book page texture |
| **Max Text Width** | **$114\text{ px}$** | Hard right margin boundary (`BOOK_TEXT_WIDTH`) |
| **Line Height** | **$9\text{ px}$** | Vertical distance between baselines |
| **Max Lines Per Page** | **$14\text{ lines}$** | Maximum vertical capacity ($14 \times 9\text{ px} = 126\text{ px}$) |
| **Page Number Position** | $(X=148, Y=16)$ | Centered horizontally relative to book width |
| **Page Navigation Arrows**| Top-left $(X=23, Y=158)$, Top-right $(X=116, Y=158)$ | In vanilla 1-page mode; mirrored symmetrically in 2-page view |

When text exceeds the 114px width limit, Minecraft wraps the text to the next line. If text exceeds 14 lines on a page, vanilla Minecraft book authoring clips the 14th line at the right boundary without spawning an unintended 15th line.

---

## 2. Font Providers & Typography Engine

Minecraft utilizes a multi-layered font system defined in `assets/minecraft/font/default.json`:

```json
{
  "providers": [
    { "type": "reference", "id": "minecraft:include/space" },
    { "type": "reference", "id": "minecraft:include/default", "filter": { "uniform": false } },
    { "type": "reference", "id": "minecraft:include/unifont" }
  ]
}
```

### 2.1. Bitmap Provider (`BitmapProvider.java`)
- Used for standard ASCII (`ascii.png`), accented Latin (`accented.png`), and Non-Latin European alphabets (`nonlatin_european.png`).
- Font sheets are structured as 16x16 glyph grids (e.g., $128 \times 128\text{ px}$ textures where each character cell is $8 \times 8\text{ px}$).
- **Advance Formula**:
  $$\text{advance} = \lfloor 0.5 + (\text{actualGlyphWidth} \times \text{scale}) \rfloor + 1$$
- For an 8px wide glyph in an 8x8 cell (such as `\u2588` full block or `\u2500` box drawing line in `ascii.png`), $\text{advance} = 8 + 1 = \mathbf{9\text{px}}$.

### 2.2. Unihex Provider (`UnihexProvider.java`) & `glyph_sizes.bin`
- Used for GNU Unifont covering thousands of international and Unicode symbols (BMP range `U+0000` to `U+FFFF`).
- Extracted directly from `assets/minecraft/font/glyph_sizes.bin`, which stores 1 byte per character representing `(start_col << 4) | end_col` for a 16x16 binary matrix.
- **Advance Formula**:
  $$\text{advance} = \lfloor (\text{end} - \text{start} + 1) / 2 \rfloor + 1$$
- For full-width glyphs (e.g. `0x0F` where start=0, end=15), the display width is $16 / 2 = 8\text{px}$ and the advance is $\lfloor 16 / 2 \rfloor + 1 = \mathbf{9\text{px}}$.

### 2.3. Space Character Advance
- ASCII Space (`U+0020`) and Non-Breaking Space (`U+00A0`) have a **fixed advance of 4px**.
- Unlike letters, **bold formatting (`§l`) never increases space width** (`SpaceGlyphInfo` bold offset is $0.0\text{f}$).

---

## 3. Horizontal Side-Bearings & Block Glyph Spacing

A crucial typographic detail in Minecraft Java Edition is that **glyph advances are 1 pixel wider than the rendered glyph width**:

$$\text{Advance} - \text{Rendered Width} = 1\text{px Empty Side-Bearing}$$

### Why Block Elements (`█`, `▃`, `▄`, `▅`, `▆`, `▇`) Do Not Touch
- In `UnihexProvider.java` and `BitmapProvider.java`, the glyph quad drawn to the screen is $8\text{px}$ wide.
- The cursor advances by $9\text{px}$.
- This creates an intentional **1px vertical gap** between adjacent block characters.
- In pixel art (e.g., Issue 2 Page 42 Enderman) or volume bars (Issue 1 Page 5), block symbols form a distinct grid of squares rather than a solid connected bar.

---

## 4. Text Formatting & Color Codes

Minecraft uses the section symbol (`§`) followed by a format character to control text styling.

### 4.1. Standard Colors
| Code | Name | Hex Value | Code | Name | Hex Value |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `§0` | Black | `#000000` | `§8` | Dark Gray | `#555555` |
| `§1` | Dark Blue | `#0000AA` | `§9` | Blue | `#5555FF` |
| `§2` | Dark Green | `#00AA00` | `§a` | Green | `#55FF55` |
| `§3` | Dark Aqua | `#00AAAA` | `§b` | Aqua | `#55FFFF` |
| `§4` | Dark Red | `#AA0000` | `§c` | Red | `#FF5555` |
| `§5` | Dark Purple | `#AA00AA` | `§d` | Light Purple | `#FF55FF` |
| `§6` | Gold | `#FFAA00` | `§e` | Yellow | `#FFFF55` |
| `§7` | Gray | `#AAAAAA` | `§f` | White | `#FFFFFF` |

### 4.2. Bedrock & Material Codes
Supported for extended server compatibility:
`§g` (Minecoin Gold `#DDD605`), `§s` (Bedrock `#DDD605`), `§t` (Dark Reddish Purple `#3A1822`), `§u` (Aqua Teal `#008080`), `§p` (Material Palette `#FF9955`), `§q` (Material Palette `#D580FF`).

### 4.3. Formatting Styles
- `§l` **Bold**: Renders a second glyph pass shifted by $+1\text{px}$ horizontally, and increases character advance by $+1\text{px}$ (except for spaces).
- `§o` **Italic**: Applies an affine shear transformation $(X' = X - 0.15 \times Y)$.
- `§n` **Underline**: Draws a horizontal line 1px thick at $Y + 8\text{px}$ across the glyph advance.
- `§m` **Strikethrough**: Draws a horizontal line 1px thick at $Y + 4\text{px}$.
- `§k` **Obfuscated (Magic Text)**: Dynamically replaces characters each frame with random glyphs of identical width.
- `§r` **Reset**: Clears all active color and style formatting back to black (`#000000`) plain text.

### 4.4. Style Inheritance Across Newlines
In Minecraft written books, a page is a continuous formatted text component. When an author places an explicit newline (`\n`), **active colors and formatting carry over to subsequent lines** unless cleared with `§r` or overridden by a new color code.

---

## 5. Line Wrapping Algorithm (`StringSplitter.java`)

Minecraft's line wrapping is driven by `net.minecraft.client.StringSplitter` and its internal `LineBreakFinder`.

### 5.1. Word Wrapping Mechanics
1. Characters are iterated with their styles, tracking cumulative line width.
2. When a character causes the cumulative width to exceed $114\text{px}$:
   - If a space (` `) occurred on the line, the line breaks at that `lastSpace`.
   - The breaking space itself is consumed.
   - Any spaces after the break point are preserved as leading whitespace on the new line.
3. If no space occurred on the line, the line breaks immediately before the overflowing character (hard character-level break).

### 5.2. Example: The Issue 2 Page 42 Enderman Art
In Issue 2 Page 42, the author typed 8 blocks of `█` followed by 11 spaces and another 8 blocks on a single line:
```text
     ████████           §0█§5██§0██§5██§0█
```
- 5 leading spaces ($20\text{px}$) + 8 blocks ($8 \times 9\text{px} = 72\text{px}$) = $92\text{px}$.
- 5 spaces follow ($5 \times 4\text{px} = 20\text{px}$) $\rightarrow 112\text{px} \le 114\text{px}$.
- The 6th space overflows ($116\text{px} > 114\text{px}$), triggering the line break at that space.
- Remaining spaces out of 11: $11 - 5 - 1 = \mathbf{5\text{ spaces}}$.
- The wrapped line starts with **5 leading spaces**, exactly matching every other row in the 8x9 Enderman block.
