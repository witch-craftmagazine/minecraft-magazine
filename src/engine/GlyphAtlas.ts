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
  '✧': 5, '⋄': 4, '⋆': 4, '⋅': 3, '✦': 5, '★': 7, '☆': 7,
  '✯': 7, '✰': 7, '✩': 7, '✵': 7, '✶': 7, '✹': 7, '✷': 7,
  '•': 3, '·': 3, '…': 6, '“': 4, '”': 4, '‘': 2, '’': 2,
  '☠': 7, '☕': 7, '✐': 7, '⚘': 6, '⛏': 7, '⚑': 7, '☾': 7, '☽': 7,
  '━': 5, '─': 5, '❍': 7, '⊲': 5, '⊳': 5, 'Ⅱ': 5, '↻': 7, '↺': 7,
  '╭': 5, '╮': 5, '╯': 5, '╰': 5, '┈': 5, '➤': 6, '┊': 4,
  '░': 5, '▒': 5, '▓': 5, '█': 6,
  '╔': 6, '╗': 6, '╚': 6, '╝': 6, '═': 6, '║': 6, '┌': 6, '┐': 6, '└': 6, '┘': 6,
  '☹': 7, '☺': 7, '☻': 7, '♡': 7, '♥': 7, '♦': 7, '♣': 7, '♠': 7,
  // Superscript & small-caps letters (Unifont, typically 3-4px)
  'ᵀ': 4, 'ʰ': 4, 'ᵉ': 4, 'ᴰ': 4, 'ᵛ': 4, 'ⁱ': 2, 'ˡ': 2, 'ᴵ': 2, 'ˢ': 3, 'ⁿ': 4,
  'ᶠ': 4, 'ᵒ': 4, 'ʳ': 3, 'ᵗ': 3, 'ᵘ': 4, 'ᵏ': 4, 'ʷ': 5, 'ᵃ': 4, 'ᵇ': 4, 'ᶜ': 4,
  'ᵈ': 4, 'ᵍ': 4, 'ʲ': 3, 'ᵐ': 5, 'ᵖ': 4, 'ʸ': 4, '⁻': 3,
  // In-game ASCII art & player symbols
  '™': 6, '⏼': 7, '⯪': 5,
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
   * Measures the pixel width for any arbitrary Unicode character (e.g. from Symbol Chat).
   */
  private measureUnicodeAdvance(char: string): number {
    if (char === ' ') return 4;
    this.initMeasureCanvas();

    if (!this.measureCtx) {
      // Default heuristic: CJK / wide emoji is 9px, standard symbol is 6-7px
      const code = char.codePointAt(0) || 0;
      if (code >= 0x2E80 && code <= 0x9FFF) return 9; // CJK
      if (code >= 0x1F300) return 9; // Emojis
      return 6;
    }

    this.measureCtx.font = '8px "Unifont", "Minecraftia", "Segoe UI Symbol", monospace, sans-serif';
    const metrics = this.measureCtx.measureText(char);
    const measuredWidth = Math.ceil(metrics.width);

    // In Minecraft font, glyph advances are typically clamped to 4-9px for book fit
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

      // Map ASCII 16x16 grid
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
          rawWidth,
          advance,
        });
      }

      // Map providers from default.json if present
      if (defaultJson && defaultJson.providers) {
        for (const provider of defaultJson.providers) {
          if (provider.type === 'bitmap' && provider.chars && provider.file) {
            let sheetName: 'ascii' | 'accented' | 'nonlatin' = 'nonlatin';
            if (provider.file.includes('accented')) sheetName = 'accented';
            else if (provider.file.includes('ascii')) sheetName = 'ascii';

            const rows = provider.chars.length;
            const cols = provider.chars[0].length;
            const img = this.sheets[sheetName];
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
                  cellHeight: 8,
                  rawWidth,
                  advance,
                });
              }
            }
          }
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
          advance: isBold ? entry.advance + 1 : entry.advance,
          ascent: 7,
        };
      }
    }

    // 3. Dynamic Unicode Fallback (covers Symbol Chat, CJK, Math, Runes, Emojis, etc.)
    return this.getOrCreateFallbackGlyph(char, colorHex, isBold);
  }

  /**
   * Generates a pixelated Minecraft-style fallback glyph for extended Unicode characters.
   */
  private getOrCreateFallbackGlyph(char: string, colorHex: string, isBold: boolean): GlyphDrawInfo {
    const cacheKey = `${char}_${colorHex}_${isBold}`;
    if (this.fallbackCache.has(cacheKey)) {
      return this.fallbackCache.get(cacheKey)!;
    }

    const advance = this.getAdvance(char, isBold);
    const w = Math.max(8, advance + 2);
    const h = 9;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = colorHex;
      ctx.font = `${isBold ? 'bold ' : ''}8px "Unifont", "Minecraftia", "Segoe UI Symbol", monospace, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText(char, 0, Math.floor(h / 2));
    }

    const drawInfo: GlyphDrawInfo = {
      image: canvas as unknown as HTMLImageElement,
      sx: 0,
      sy: 0,
      sWidth: w,
      sHeight: h,
      advance,
      ascent: 7,
    };

    this.fallbackCache.set(cacheKey, drawInfo);
    return drawInfo;
  }
}

export const defaultGlyphAtlas = new GlyphAtlas();
