import { GlyphDrawInfo } from './types';
import glyphsData from '../../public/assets/font/glyphs.json';

export interface GlyphMapEntry {
  sheet: 'ascii' | 'accented' | 'nonlatin';
  col: number;
  row: number;
  colsInSheet: number;
  rowsInSheet: number;
  cellWidth: number;
  cellHeight: number;
  yOffset: number;
  rawWidth: number;
  advance: number;
}

export interface CustomBitmapGlyphEntry {
  image: HTMLImageElement;
  sx: number;
  sy: number;
  sWidth: number;
  sHeight: number;
  dWidth: number;
  dHeight: number;
  yOffset: number;
  advance: number;
  ascent: number;
  isColor: boolean;
  file: string;
}

export const MINECRAFT_SYMBOL_ADVANCES: Record<string, number> = {
  '§': 0,
  '\n': 0,
  '\r': 0,
  // Astrological zodiac symbols (Unifont halfwidth glyphs, 7px in MC)
  '♈': 7, '♉': 7, '♊': 7, '♋': 7, '♌': 7, '♍': 7,
  '♎': 7, '♏': 7, '♐': 7, '♑': 7, '♒': 7, '♓': 7,
  // Sparkles, stars, dots & decorative operators
  '✧': 5, '⋄': 4, '⋆': 4, '⋅': 3, '✦': 5, '★': 8, '☆': 8,
  '✯': 7, '✰': 7, '✩': 7, '✵': 7, '✶': 7, '✹': 7, '✷': 7,
  '•': 3, '·': 3, '…': 6, '“': 4, '”': 4, '‘': 2, '’': 2,
  '☠': 8, '☕': 8, '✐': 8, '⚘': 8, '⛏': 9, '⚑': 8, '☾': 9, '☽': 9,
  '━': 9, '─': 9, '❍': 8, '⊲': 6, '⊳': 6, 'Ⅱ': 6, '↻': 8, '↺': 8,
  '╭': 9, '╮': 9, '╯': 8, '╰': 8, '┈': 9, '➤': 7, '┊': 6,
  '░': 8, '▒': 9, '▓': 9, '█': 9,
  '╔': 9, '╗': 9, '╚': 8, '╝': 8, '═': 9, '║': 9, '┌': 9, '┐': 9, '└': 8, '┘': 8,
  '▀': 9, '▄': 9, '▌': 6, '▐': 9, '│': 6,
  '▂': 9, '▃': 9, '▅': 9, '▆': 9, '▇': 9,
  '☹': 8, '☺': 8, '☻': 8, '♥': 9, '♣': 8, '♠': 8,
  // Superscript & small-caps letters (Unifont, typically 3-4px)
  'ᵀ': 4, 'ʰ': 4, 'ᵉ': 4, 'ᴰ': 4, 'ᵛ': 4, 'ⁱ': 2, 'ˡ': 2, 'ᴵ': 2, 'ˢ': 3, 'ⁿ': 4,
  'ᶠ': 4, 'ᵒ': 4, 'ʳ': 3, 'ᵗ': 3, 'ᵘ': 4, 'ᵏ': 4, 'ʷ': 5, 'ᵃ': 4, 'ᵇ': 4, 'ᶜ': 4,
  'ᵈ': 4, 'ᵍ': 4, 'ʲ': 3, 'ᵐ': 5, 'ᵖ': 4, 'ʸ': 4, '⁻': 3,
  // Subscript letters & numbers (frequently used in spooky dialogue & lore)
  'ₐ': 4, 'ₑ': 4, 'ₕ': 4, 'ᵢ': 2, 'ⱼ': 3, 'ₖ': 4, 'ₗ': 2, 'ₘ': 5, 'ₙ': 4, 'ₒ': 4,
  'ₚ': 4, 'ᵣ': 3, 'ₛ': 3, 'ₜ': 3, 'ᵤ': 4, 'ᵥ': 4, 'ₓ': 4,
  '₀': 4, '₁': 3, '₂': 4, '₃': 4, '₄': 4, '₅': 4, '₆': 4, '₇': 4, '₈': 4, '₉': 4,
  '₊': 4, '₋': 3, '₌': 4, '₍': 3, '₎': 3,
  // Small capitals (A-Z)
  'ᴀ': 5, 'ʙ': 5, 'ᴄ': 5, 'ᴅ': 5, 'ᴇ': 5, 'ꜰ': 5, 'ɢ': 5, 'ʜ': 5, 'ɪ': 2, 'ᴊ': 4,
  'ᴋ': 5, 'ʟ': 4, 'ᴍ': 6, 'ɴ': 5, 'ᴏ': 5, 'ᴘ': 5, 'ʀ': 5, 'ꜱ': 4, 'ᴛ': 5, 'ᴜ': 5,
  'ᴠ': 5, 'ᴡ': 6, 'ʏ': 5, 'ᴢ': 5,
  // Mathematical Sans-Bold lowercase letters
  '𝗮': 6, '𝗯': 6, '𝗰': 6, '𝗱': 6, '𝗲': 6, '𝗳': 5, '𝗴': 6, '𝗵': 6, '𝗶': 3, '𝗷': 4,
  '𝗸': 6, '𝗹': 3, '𝗺': 7, '𝗻': 6, '𝗼': 6, '𝗽': 6, '𝗾': 6, '𝗿': 5, '𝘀': 5, '𝘁': 5,
  '𝘂': 6, '𝘃': 6, '𝘄': 7, '𝘅': 6, '𝘆': 6, '𝘇': 5,
  // Decorative flowers & typography symbols
  '✿': 7, '❀': 7, '❁': 7, '▰': 7, 'ȶ': 5, 'ɨ': 3, '◦': 4, '»': 7, '«': 7, '°': 5, '—': 9,
  // In-game ASCII art & player symbols
  '™': 9, '⏼': 8, '⯪': 8,
};

export class GlyphAtlas {
  private advances: Map<string, number> = new Map();
  private glyphMap: Map<string, GlyphMapEntry> = new Map();
  private customGlyphs: Map<string, CustomBitmapGlyphEntry> = new Map();
  private sheets: Record<string, HTMLImageElement> = {};
  private tintedSheets: Map<string, HTMLCanvasElement> = new Map();
  private fallbackCache: Map<string, GlyphDrawInfo> = new Map();
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  // Offscreen canvas for measuring and rendering fallback Unicode symbols
  private measureCanvas: HTMLCanvasElement | null = null;
  private measureCtx: CanvasRenderingContext2D | null = null;

  constructor() {
    for (const item of glyphsData) {
      if (item.char === ' ') {
        this.advances.set(item.char, item.pixels); // space is 4
      } else {
        this.advances.set(item.char, item.pixels + 1); // standard character advance is width + 1
      }
    }
    for (const [char, adv] of Object.entries(MINECRAFT_SYMBOL_ADVANCES)) {
      this.advances.set(char, adv);
    }
  }

  private initMeasureCanvas(): void {
    if (!this.measureCanvas && typeof document !== 'undefined') {
      this.measureCanvas = document.createElement('canvas');
      this.measureCanvas.width = 32;
      this.measureCanvas.height = 32;
      this.measureCtx = this.measureCanvas.getContext('2d', { willReadFrequently: true });
    }
  }

  /**
   * Returns the advance (cursor delta) in pixels for any Unicode character.
   * If the character is not in the custom bitmap sheets, dynamically calculates
   * its pixel advance to match Minecraft Unifont proportions.
   */
  public getAdvance(char: string, isBold = false): number {
    if (char === '§' || char === '\n' || char === '\r') return 0;
    // In Minecraft Java Edition, spaces (' ' and non-breaking space) have a fixed width of 4px
    // and bold formatting never increases space width (SpaceGlyphInfo bold offset is 0.0f).
    if (char === ' ' || char === '\u00a0') return 4;

    const custom = this.customGlyphs.get(char);
    if (custom) {
      return isBold ? custom.advance + 1 : custom.advance;
    }

    let base = this.advances.get(char);
    if (base === undefined) {
      base = this.measureUnicodeAdvance(char);
      this.advances.set(char, base);
    }
    return isBold ? base + 1 : base;
  }

  /**
   * Measures the pixel width for any arbitrary Unicode character (matching Symbol Chat and Unifont).
   */
  private measureUnicodeAdvance(char: string): number {
    if (char === ' ') return 4;
    const code = char.codePointAt(0) || 0;

    // Fast lookups for common ranges based on Unifont / Symbol Chat:
    // CJK, Fullwidth forms, Emojis, Enclosed Alphanumerics, Mathematical Alphanumerics
    if (
      (code >= 0x2E80 && code <= 0x9FFF) ||   // CJK radicals & ideographs
      (code >= 0xAC00 && code <= 0xD7AF) ||   // Hangul syllables
      (code >= 0xF900 && code <= 0xFAFF) ||   // CJK compatibility
      (code >= 0xFE30 && code <= 0xFE4F) ||   // CJK compatibility forms
      (code >= 0xFF01 && code <= 0xFF60) ||   // Fullwidth ASCII variants (！..～)
      (code >= 0xFFE0 && code <= 0xFFEE) ||   // Fullwidth currency & symbols
      (code >= 0x1F300 && code <= 0x1FAFF)    // Emojis & Pictographs
    ) {
      return 9; // Fullwidth glyph (8px wide + 1px spacing)
    }

    // Mathematical Alphanumeric Symbols (𝖂, 𝖆, 𝒜, etc.)
    if (code >= 0x1D400 && code <= 0x1D7FF) {
      this.initMeasureCanvas();
      if (this.measureCtx) {
        this.measureCtx.font = '16px "Unifont", monospace';
        const m = this.measureCtx.measureText(char);
        const w = Math.ceil(m.width / 2);
        return Math.max(5, Math.min(9, w + 1));
      }
      return 8;
    }

    this.initMeasureCanvas();
    if (!this.measureCtx) {
      return 7;
    }

    this.measureCtx.font = '16px "Unifont", monospace';
    const metrics = this.measureCtx.measureText(char);
    const measuredWidth = Math.ceil(metrics.width / 2);

    // In Minecraft font, glyph advances are clamped to 3-9px
    const advance = Math.max(3, Math.min(9, measuredWidth + 1));
    return advance;
  }

  /**
   * Initializes and loads all font textures and character maps.
   */
  public async load(basePath = './assets'): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      const [asciiImg, accentedImg, nonlatinImg, defaultJson] = await Promise.all([
        this.loadImage(`${basePath}/textures/font/ascii.png`),
        this.loadImage(`${basePath}/textures/font/accented.png`).catch(() => null),
        this.loadImage(`${basePath}/textures/font/nonlatin_european.png`).catch(() => null),
        fetch(`${basePath}/font/default.json`).then(r => r.json()).catch(() => null),
      ]);

      this.sheets['ascii'] = asciiImg;
      if (accentedImg) this.sheets['accented'] = accentedImg;
      if (nonlatinImg) this.sheets['nonlatin'] = nonlatinImg;

      // Map providers from default.json (ascii, accented, nonlatin_european)
      if (defaultJson && defaultJson.providers) {
        for (const provider of defaultJson.providers) {
          if (provider.type === 'bitmap' && provider.chars && provider.file) {
            let sheetName: 'ascii' | 'accented' | 'nonlatin' = 'nonlatin';
            if (provider.file.includes('accented')) sheetName = 'accented';
            else if (provider.file.includes('ascii')) sheetName = 'ascii';

            const rows = provider.chars.length;
            const cols = provider.chars[0].length;
            const img = this.sheets[sheetName];
            const cellHeight = provider.height ?? 8;
            const ascent = provider.ascent ?? 7;
            const yOffset = 7 - ascent;
            let imgData: ImageData | null = null;

            if (img && typeof document !== 'undefined') {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth || img.width;
              canvas.height = img.naturalHeight || img.height;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                try {
                  imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                } catch {
                  // ignore
                }
              }
            }

            for (let r = 0; r < rows; r++) {
              const rowStr = provider.chars[r];
              for (let c = 0; c < rowStr.length; c++) {
                const char = rowStr[c];
                if (char === '\u0000') continue;

                let advance = this.advances.get(char);
                if (advance === undefined) {
                  let actualWidth = 7;
                  if (imgData && img) {
                    const d = imgData.data;
                    const imgW = img.naturalWidth || img.width;
                    const cellW = Math.floor(imgW / cols);
                    const cellH = Math.floor((img.naturalHeight || img.height) / rows);
                    const scaleRatio = 8 / cellW;
                    for (let w = cellW - 1; w >= 0; w--) {
                      let hasPixel = false;
                      const xPixel = c * cellW + w;
                      for (let y = 0; y < cellH; y++) {
                        const yPixel = r * cellH + y;
                        const alpha = d[(yPixel * imgW + xPixel) * 4 + 3];
                        if (alpha > 0) {
                          hasPixel = true;
                          break;
                        }
                      }
                      if (hasPixel) {
                        actualWidth = Math.round((w + 1) * scaleRatio);
                        break;
                      }
                    }
                  }
                  advance = char === ' ' ? 4 : Math.max(1, actualWidth + 1);
                  this.advances.set(char, advance);
                }

                const rawWidth = char === ' ' ? 4 : Math.max(1, advance - 1);

                this.glyphMap.set(char, {
                  sheet: sheetName,
                  col: c,
                  row: r,
                  colsInSheet: cols,
                  rowsInSheet: rows,
                  cellWidth: 8,
                  cellHeight,
                  yOffset,
                  rawWidth,
                  advance,
                });
              }
            }
          }
        }
      } else {
        // Fallback ASCII 0..255 if default.json is unavailable
        for (let code = 0; code < 256; code++) {
          const char = String.fromCharCode(code);
          const col = code % 16;
          const row = Math.floor(code / 16);
          const advance = this.getAdvance(char, false);
          const rawWidth = char === ' ' ? 4 : Math.max(1, advance - 1);

          this.glyphMap.set(char, {
            sheet: 'ascii',
            col,
            row,
            colsInSheet: 16,
            rowsInSheet: 16,
            cellWidth: 8,
            cellHeight: 8,
            yOffset: 0,
            rawWidth,
            advance,
          });
        }
      }

      this.isLoaded = true;
    })();

    return this.loadPromise;
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error(`Failed to load font image: ${src} (${e})`));
      img.src = src;
    });
  }

  /**
   * Replaces the base font sheets (e.g. ascii, accented, nonlatin) with custom pack textures (such as Lithos HD 32x).
   */
  public async loadFontTextures(textures: {
    ascii?: string | HTMLImageElement;
    accented?: string | HTMLImageElement;
    nonlatin?: string | HTMLImageElement;
  }): Promise<void> {
    const promises: Promise<void>[] = [];

    if (textures.ascii) {
      promises.push(
        (async () => {
          const img = typeof textures.ascii === 'string' ? await this.loadImage(textures.ascii) : textures.ascii;
          if (img) this.sheets['ascii'] = img;
        })()
      );
    }
    if (textures.accented) {
      promises.push(
        (async () => {
          const img = typeof textures.accented === 'string' ? await this.loadImage(textures.accented) : textures.accented;
          if (img) this.sheets['accented'] = img;
        })()
      );
    }
    if (textures.nonlatin) {
      promises.push(
        (async () => {
          const img = typeof textures.nonlatin === 'string' ? await this.loadImage(textures.nonlatin) : textures.nonlatin;
          if (img) this.sheets['nonlatin'] = img;
        })()
      );
    }

    await Promise.all(promises);
    this.tintedSheets.clear();
    this.fallbackCache.clear();
  }

  public async loadFromFontDirectory(fontDir: string): Promise<void> {
    try {
      const resp = await fetch(`${fontDir}/font/default.json`);
      if (!resp.ok) return;
      const json = await resp.json();
      if (!json.providers) return;

      await this.loadBitmapProviders(json.providers, async (file: string) => {
        const textureUrl = `${fontDir}/textures/${file}`;
        return this.loadImage(textureUrl).catch(() => null);
      });
    } catch (err) {
      console.warn(`Could not load fonts from ${fontDir}:`, err);
    }
  }

  public async loadBitmapProviders(
    providers: any[],
    textureResolver: (file: string) => Promise<HTMLImageElement | null>
  ): Promise<void> {
    await Promise.all(
      providers.map(async (provider) => {
        if (provider.type !== 'bitmap' || !provider.file || !provider.chars || provider.chars.length === 0) {
          return;
        }

        try {
          const img = await textureResolver(provider.file);
          if (!img) return;

          const rows = provider.chars.length;
          const cols = provider.chars[0].length;
          if (rows === 0 || cols === 0) return;

          const cellW = Math.floor(img.naturalWidth / cols);
          const cellH = Math.floor(img.naturalHeight / rows);
          if (cellW <= 0 || cellH <= 0) return;

          const targetHeight = provider.height ?? 8;
          const ascent = provider.ascent ?? 7;
          const pixelScale = targetHeight / cellH;
          const yOffset = 7 - ascent;

          let isColor = false;
          let imgData: ImageData | null = null;

          if (typeof document !== 'undefined') {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              try {
                imgData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
                const d = imgData.data;
                for (let p = 0; p < d.length; p += 4) {
                  if (d[p + 3] > 0 && (Math.abs(d[p] - d[p + 1]) > 8 || Math.abs(d[p + 1] - d[p + 2]) > 8)) {
                    isColor = true;
                    break;
                  }
                }
              } catch {
                // ignore
              }
            }
          }

          for (let r = 0; r < rows; r++) {
            const rowStr = provider.chars[r];
            for (let c = 0; c < rowStr.length; c++) {
              const char = rowStr[c];
              if (!char || char === '\u0000') continue;

              let actualWidth = cellW;
              if (imgData) {
                const d = imgData.data;
                const imgW = img.naturalWidth;
                for (let w = cellW - 1; w >= 0; w--) {
                  let hasPixel = false;
                  const xPixel = c * cellW + w;
                  for (let y = 0; y < cellH; y++) {
                    const yPixel = r * cellH + y;
                    const alpha = d[(yPixel * imgW + xPixel) * 4 + 3];
                    if (alpha > 0) {
                      hasPixel = true;
                      break;
                    }
                  }
                  if (hasPixel) {
                    actualWidth = w + 1;
                    break;
                  }
                }
              }

              const advance = Math.max(1, Math.floor(0.5 + actualWidth * pixelScale) + 1);
              const dWidth = Math.round(cellW * pixelScale);
              const dHeight = targetHeight;

              this.customGlyphs.set(char, {
                image: img,
                sx: c * cellW,
                sy: r * cellH,
                sWidth: cellW,
                sHeight: cellH,
                dWidth,
                dHeight,
                yOffset,
                advance,
                ascent,
                isColor,
                file: provider.file,
              });

              this.advances.set(char, advance);
            }
          }
        } catch (e) {
          console.warn(`Failed loading provider for ${provider.file}:`, e);
        }
      })
    );
  }

  private getTintedCustomImage(file: string, img: HTMLImageElement, colorHex: string): HTMLCanvasElement | null {
    const cacheKey = `custom_${file}_${colorHex.toLowerCase()}`;
    if (this.tintedSheets.has(cacheKey)) {
      return this.tintedSheets.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.tintedSheets.set(cacheKey, canvas);
    return canvas;
  }

  public getTintedSheet(sheetName: string, colorHex: string): HTMLCanvasElement | null {
    const original = this.sheets[sheetName];
    if (!original) return null;

    const cacheKey = `${sheetName}_${colorHex.toLowerCase()}`;
    if (this.tintedSheets.has(cacheKey)) {
      return this.tintedSheets.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = original.width;
    canvas.height = original.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(original, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.tintedSheets.set(cacheKey, canvas);
    return canvas;
  }

  /**
   * Retrieves glyph rendering information.
   * If the character exists in Minecraft's bitmap font sheets, blits from the sheet.
   * If the character is any extended Unicode symbol (e.g. from Symbol Chat),
   * dynamically generates a pixelated fallback glyph matching Minecraft's Unifont style!
   */
  public getGlyphDrawInfo(char: string, colorHex: string, isBold: boolean): GlyphDrawInfo | null {
    // 1. Check custom bitmap provider glyphs (e.g. from server resource pack default.json)
    const custom = this.customGlyphs.get(char);
    if (custom) {
      let imgToDraw: HTMLImageElement | HTMLCanvasElement = custom.image;
      if (!custom.isColor && colorHex.toLowerCase() !== '#ffffff') {
        const tinted = this.getTintedCustomImage(custom.file, custom.image, colorHex);
        if (tinted) imgToDraw = tinted;
      }
      return {
        image: imgToDraw,
        sx: custom.sx,
        sy: custom.sy,
        sWidth: custom.sWidth,
        sHeight: custom.sHeight,
        dWidth: custom.dWidth,
        dHeight: custom.dHeight,
        yOffset: custom.yOffset,
        advance: isBold ? custom.advance + 1 : custom.advance,
        ascent: custom.ascent,
      };
    }

    // 2. Check standard Minecraft bitmap sheets
    const entry = this.glyphMap.get(char);
    if (entry) {
      const sheetCanvas = this.getTintedSheet(entry.sheet, colorHex);
      if (sheetCanvas) {
        const cellW = sheetCanvas.width / entry.colsInSheet;
        const cellH = sheetCanvas.height / entry.rowsInSheet;
        const sx = entry.col * cellW;
        const sy = entry.row * cellH;

        return {
          image: sheetCanvas as unknown as HTMLImageElement,
          sx,
          sy,
          sWidth: cellW,
          sHeight: cellH,
          dWidth: entry.cellWidth ?? 8,
          dHeight: entry.cellHeight ?? 8,
          yOffset: entry.yOffset ?? 0,
          advance: isBold ? entry.advance + 1 : entry.advance,
          ascent: 7,
        };
      }
    }

    // 3. Dynamic Unicode Fallback (covers Symbol Chat, CJK, Math, Runes, Emojis, etc.)
    return this.getOrCreateFallbackGlyph(char, colorHex, isBold);
  }

  /**
   * Generates a crisp, pixelated Minecraft-style fallback glyph for extended Unicode characters.
   * Renders at 16px (Unifont native grid) and binarizes pixel alpha to eliminate anti-aliasing blur.
   */
  private getOrCreateFallbackGlyph(char: string, colorHex: string, isBold: boolean): GlyphDrawInfo {
    const cacheKey = `${char}_${colorHex}_${isBold}`;
    if (this.fallbackCache.has(cacheKey)) {
      return this.fallbackCache.get(cacheKey)!;
    }

    const advance = this.getAdvance(char, isBold);
    const cellW = 16;
    const cellH = 16;

    const canvas = document.createElement('canvas');
    canvas.width = cellW;
    canvas.height = cellH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = colorHex;
      ctx.font = `${isBold ? 'bold ' : ''}16px "Unifont", "Minecraftia", monospace, sans-serif`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(char, 0, 13);

      // Eliminate subpixel anti-aliasing blur and crooked lines by thresholding alpha
      try {
        const imgData = ctx.getImageData(0, 0, cellW, cellH);
        const data = imgData.data;

        // Parse colorHex into RGB
        let r = 0;
        let g = 0;
        let b = 0;
        if (colorHex.startsWith('#') && colorHex.length >= 7) {
          r = parseInt(colorHex.slice(1, 3), 16) || 0;
          g = parseInt(colorHex.slice(3, 5), 16) || 0;
          b = parseInt(colorHex.slice(5, 7), 16) || 0;
        }

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha >= 70) {
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = 255;
          } else {
            data[i + 3] = 0;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } catch {
        // Fallback for mock environments without getImageData
      }
    }

    const drawInfo: GlyphDrawInfo = {
      image: canvas as unknown as HTMLImageElement,
      sx: 0,
      sy: 0,
      sWidth: cellW,
      sHeight: cellH,
      dWidth: 8,
      dHeight: 8,
      advance,
      ascent: 7,
    };

    this.fallbackCache.set(cacheKey, drawInfo);
    return drawInfo;
  }
}

export const defaultGlyphAtlas = new GlyphAtlas();
