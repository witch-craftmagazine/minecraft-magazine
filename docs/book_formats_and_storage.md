# Minecraft Book Formats & Storage Specification

This document details the serialization formats, storage mechanisms, and interchange standards supported by the web viewer for importing, exporting, and persisting Minecraft books.

---

## 1. Supported Book Formats Overview

| Format | Extension / Source | Description | Primary Use Case |
| :--- | :--- | :--- | :--- |
| **Stendhal** | `.stendhal` | Clean human-readable YAML/Markdown format with `#- ` delimiters | Witch-Craft Magazine authoring, server archives |
| **BookCopy JSON** | `.json` | JSON format matching the Fabric/Forge BookCopy mod codec | Client-side mod exports, backup tooling |
| **CMI BookExport** | `.txt` | Plain text separated by `<NextPage>` or `<AutoPage>` tags | Spigot/Paper server administrators |
| **Vanilla `/give`** | Command string | In-game command syntax with escaped NBT or Item Components | In-game command blocks, direct player inventory |
| **Raw Text / MD** | `.txt`, `.md` | Arbitrary unformatted or markdown text | Auto-wrapped storybooks, articles |
| **URL Hash** | Web URL | Query and hash fragment encoded deep-links | Instant zero-backend web sharing |

---

## 2. Stendhal Format (`.stendhal`)

The Stendhal format is an intuitive, plain-text format popularized by the Stendhal client mod for archiving and restoring written books.

### 2.1. File Structure
A `.stendhal` file begins with header metadata followed by pages separated by `#- ` markers:

```yaml
title: Witch-Craft Issue 1
author: StarSweetpea
generation: 0
pages:
#- §2      Bards Song Request!
§c»»-———-★-———-««
     Flower Maiden: 
          Dzivia

§8 0:00 ━❍───── 9:05
     ↻     ⊲  Ⅱ  ⊳     ↺

§2"Raise with the wind in 
 the field from the     
 ground damp flowers 
 petals up" 

§8Volume: §c▃▄▅▆▇ 100%
#- §6Next Page Header
Page 2 content here...
```

### 2.2. Parsing Rules
1. **Metadata**:
   - `title:` Book title (string, default: `"Untitled"`).
   - `author:` Book author (string, default: `"Anonymous"`).
   - `generation:` Generation level (`0` = Original, `1` = Copy of original, `2` = Copy of copy, `3` = Tattered).
2. **Page Delimiters**:
   - Lines starting with `#- ` or `#---` mark the beginning of a new page.
   - Any text immediately following `#- ` on that line forms the beginning of that page.
3. **Escaping**: Supports standard Minecraft section formatting codes (`§0`–`§f`, `§l`, `§o`, etc.).

---

## 3. BookCopy Mod JSON Format

The BookCopy mod serializes books into clean JSON corresponding to its Java record `SavedBook`:

```json
{
  "title": "Witch-Craft Issue 2",
  "author": "StarSweetpea",
  "generation": 0,
  "pages": [
    "§d☠☠☠☠☠☠ ™ ☠☠☠☠☠☠\n§5§l    WITCH-CRAFT\n    ★MAGAZINE★...",
    "§8    This magazine is    proudly presented by...",
    " \n     ████████\n     ████████\n     §5█§d█§5█§0██§5█§d█§5█..."
  ]
}
```

### 3.1. Parsing & Export
- `pages`: An array of raw formatted strings with explicit `\n` linebreaks.
- `generation`: Integer matching Minecraft generation level.

---

## 4. CMI BookExport Plugin Format (`.txt`)

Used extensively on Spigot/Paper networks using the CMI plugin suite:

```text
Title: Server Guidelines
Author: Administrator
Type: Written

<AutoPage>
§6Welcome to the Server!
Please read these rules before exploring.
<NextPage>
§cRule 1: Be respectful.
§cRule 2: No griefing.
```

- Pages are separated by `<NextPage>`.
- The parser automatically handles `<AutoPage>` and ignores server header comments.

---

## 5. Vanilla Minecraft NBT & `/give` Commands

Minecraft stores written books under item ID `minecraft:written_book`. The web emulator supports both legacy NBT (pre-1.20.5) and modern Data Components (1.20.5+).

### 5.1. Modern 1.20.5+ Data Components Syntax
In 1.20.5 and later, NBT tags were replaced by item components:

```minecraft
/give @p written_book[written_book_content={
  title: 'Witch-Craft Issue 1',
  author: 'StarSweetpea',
  generation: 0,
  pages: [
    {raw: '§2Bards Song Request!\n§c»»-———-★-———-««\n...'},
    {raw: 'Page 2 text...'}
  ]
}] 1
```

### 5.2. Pre-1.20.5 Legacy NBT Syntax
```minecraft
/give @p written_book{
  title: "Witch-Craft Issue 1",
  author: "StarSweetpea",
  generation: 0,
  pages: [
    "\"§2Bards Song Request!\\n§c»»-———-★-———-««\\n...\"",
    "\"Page 2 text...\""
  ]
} 1
```

### 5.3. Text Component vs. Raw String Handling
- When importing from `/give` commands, pages may be formatted either as JSON Text Components (`{"text":"Hello ","color":"gold"}`) or escaped raw strings (`"§6Hello "`).
- The parser recursively decodes `extra` arrays, resolving colors and text into unified formatted spans.

---

## 6. URL Hash & Deep-Linking Format

The web viewer supports state persistence directly in the browser's URL without requiring server databases.

### 6.1. Canonical URL Hash Format
```text
https://example.com/#issue=issue1&page=5
```
- `issue`: ID of the bundled book (e.g. `issue1`, `issue2`, `issue2023`).
- `page`: 1-based page number (e.g. `5`).

### 6.2. Permissive & Shorthand Hash Support
To accommodate shared user links from chat apps and mobile browsers, the router supports:
- `#issue1/5` (Slash shorthand)
- `#issue1:5` (Colon shorthand)
- `#issue1&page=5` (Mixed shorthand)
- `?issue=issue1&page=5` (Standard search query parameter)

### 6.3. Embedded Book Hash Encoding
For custom authored or uploaded books not in the bundled issues list, the application can encode the entire book model into the URL hash using URI-safe Base64:
```text
#book=eyJ0aXRsZSI6ICJNeSBCb29rIiwgImF1dGhvciI6ICJNZSIsICJwYWdlcyI6IFsiSGVsbG8gV29ybGQhIl19
```
This enables users to share newly authored books with others simply by copying the link.
