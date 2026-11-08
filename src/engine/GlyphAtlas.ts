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
  '✧': 5, '⋄': 4, '⋆': 4, '⋅': 2, '✦': 5, '★': 8, '☆': 8,
  '✯': 7, '✰': 7, '✩': 7, '✵': 7, '✶': 7, '✹': 7, '✷': 7,
  '•': 3, '·': 2, '…': 8, '“': 5, '”': 5, '‘': 3, '’': 3,
  '☠': 8, '☕': 8, '✐': 8, '⚘': 8, '⛏': 9, '⚑': 8, '☾': 9, '☽': 9,
  // Single and double box drawing lines and corners (matching glyphs.json and Unifont)
  '┌': 9, '─': 9, '┐': 6, '└': 9, '┘': 6, '│': 6,
  '┬': 9, '┴': 9, '├': 9, '┤': 6, '┼': 9,
  '╔': 9, '═': 9, '╗': 8, '╚': 9, '╝': 8, '║': 8,
  '╦': 9, '╩': 9, '╠': 9, '╣': 8, '╬': 9,
  '╞': 9, '╡': 6, '╟': 9, '╢': 8, '╤': 9, '╧': 9, '╥': 9, '╨': 9,
  '╓': 9, '╖': 8, '╙': 9, '╜': 8, '╒': 9, '╕': 6, '╘': 9, '╛': 6,
  '╫': 9, '╪': 9,
  // Rounded corners
  '╭': 9, '╮': 6, '╰': 9, '╯': 6,
  // Heavy corners and lines
  '┏': 9, '┓': 6, '┗': 9, '┛': 6,
  '┳': 9, '┻': 9, '┣': 9, '┫': 6, '╋': 9,
  '━': 9, '┃': 6, '┈': 9, '┊': 6, '┆': 6,
  '▀': 9, '▄': 9, '▌': 5, '▐': 9,
  '░': 8, '▒': 9, '▓': 9, '█': 9,
  '▂': 9, '▃': 9, '▅': 9, '▆': 9, '▇': 9,
  '☹': 6, '☺': 6, '☻': 8, '♥': 6, '♣': 6, '♠': 6, '♡': 6, '♦': 6,
  // Geometric & round shapes
  '▢': 7, '■': 6, '□': 6, '▲': 6, '▼': 6, '▷': 7, '◁': 7, '◉': 8, '○': 6, '●': 5, '◎': 8, '⦿': 8,
  // Media player controls & symbols
  '❍': 8, '⊲': 6, '⊳': 6, 'Ⅱ': 6, '↻': 8, '↺': 8, '➤': 7,
  // Superscript lowercase letters (Unifont, typically 3-4px)
  'ᵃ': 4, 'ᵇ': 4, 'ᶜ': 4, 'ᵈ': 4, 'ᵉ': 4, 'ᶠ': 4, 'ᵍ': 4, 'ʰ': 4, 'ⁱ': 2, 'ʲ': 3, 'ᵏ': 4,
  'ˡ': 2, 'ᵐ': 5, 'ⁿ': 5, 'ᵒ': 4, 'ᵖ': 4, 'ʳ': 3, 'ˢ': 3, 'ᵗ': 3, 'ᵘ': 4, 'ᵛ': 4, 'ʷ': 5,
  'ˣ': 3, 'ʸ': 4, 'ᵟ': 4, 'ᶰ': 3, 'ʱ': 3,
  // Superscript uppercase letters
  'ᴬ': 4, 'ᴮ': 4, 'ᴰ': 4, 'ᴱ': 4, 'ᴳ': 4, 'ᴴ': 4, 'ᴵ': 2, 'ᴶ': 3, 'ᴷ': 4, 'ᴸ': 3,
  'ᴹ': 5, 'ᴺ': 4, 'ᴼ': 4, 'ᴾ': 4, 'ᴿ': 4, 'ᵀ': 4, 'ᵁ': 4, 'ᵂ': 5, 'ᵞ': 4,
  // Subscript letters & numbers (frequently used in spooky dialogue & lore)
  'ₐ': 4, 'ₑ': 4, 'ₕ': 4, 'ᵢ': 2, 'ⱼ': 3, 'ₖ': 4, 'ₗ': 2, 'ₘ': 5, 'ₙ': 4, 'ₒ': 4,
  'ₚ': 4, 'ᵣ': 3, 'ₛ': 3, 'ₜ': 3, 'ᵤ': 4, 'ᵥ': 4, 'ₓ': 4,
  '₀': 5, '₁': 4, '₂': 5, '₃': 5, '₄': 5, '₅': 5, '₆': 5, '₇': 5, '₈': 5, '₉': 5,
  '₊': 4, '₋': 4, '₌': 4, '₍': 3, '₎': 3,
  // Small capitals (A-Z, nonlatin_european sheet values)
  'ᴀ': 6, 'ʙ': 6, 'ᴄ': 6, 'ᴅ': 6, 'ᴇ': 6, 'ꜰ': 6, 'ɢ': 6, 'ʜ': 6, 'ɪ': 4, 'ᴊ': 6,
  'ᴋ': 6, 'ʟ': 6, 'ᴍ': 6, 'ɴ': 6, 'ᴏ': 6, 'ᴘ': 6, 'ʀ': 6, 'ꜱ': 6, 'ᴛ': 6, 'ᴜ': 6,
  'ᴠ': 6, 'ᴡ': 6, 'ʏ': 6, 'ᴢ': 6,
  // Mathematical Sans-Bold uppercase letters
  '𝗔': 6, '𝗕': 6, '𝗖': 6, '𝗗': 6, '𝗘': 6, '𝗙': 5, '𝗚': 6, '𝗛': 6, '𝗜': 3, '𝗝': 5,
  '𝗞': 6, '𝗟': 5, '𝗠': 7, '𝗡': 6, '𝗢': 6, '𝗣': 6, '𝗤': 6, '𝗥': 6, '𝗦': 6, '𝗧': 5,
  '𝗨': 6, '𝗩': 6, '𝗪': 7, '𝗫': 6, '𝗬': 6, '𝗭': 6,
  // Mathematical Sans-Bold lowercase letters
  '𝗮': 6, '𝗯': 6, '𝗰': 6, '𝗱': 6, '𝗲': 6, '𝗳': 5, '𝗴': 6, '𝗵': 6, '𝗶': 3, '𝗷': 4,
  '𝗸': 6, '𝗹': 3, '𝗺': 7, '𝗻': 6, '𝗼': 6, '𝗽': 6, '𝗾': 6, '𝗿': 5, '𝘀': 5, '𝘁': 5,
  '𝘂': 6, '𝘃': 6, '𝘄': 7, '𝘅': 6, '𝘆': 6, '𝘇': 5,
  // Mathematical Sans-Bold digits
  '𝟬': 6, '𝟭': 4, '𝟮': 6, '𝟯': 6, '𝟰': 6, '𝟱': 6, '𝟲': 6, '𝟳': 6, '𝟴': 6, '𝟵': 6,
  // Mathematical Serif Bold uppercase & lowercase
  '𝐀': 6, '𝐁': 6, '𝐂': 6, '𝐃': 6, '𝐄': 6, '𝐅': 5, '𝐆': 6, '𝐇': 6, '𝐈': 4, '𝐉': 5,
  '𝐊': 6, '𝐋': 5, '𝐌': 7, '𝐍': 6, '𝐎': 6, '𝐏': 6, '𝐐': 6, '𝐑': 6, '𝐒': 6, '𝐓': 6,
  '𝐔': 6, '𝐕': 6, '𝐖': 7, '𝐗': 6, '𝐘': 6, '𝐙': 6,
  '𝐚': 6, '𝐛': 6, '𝐜': 5, '𝐝': 6, '𝐞': 6, '𝐟': 5, '𝐠': 6, '𝐡': 6, '𝐢': 3, '𝐣': 4,
  '𝐤': 6, '𝐥': 3, '𝐦': 7, '𝐧': 6, '𝐨': 6, '𝐩': 6, '𝐪': 6, '𝐫': 5, '𝐬': 5, '𝐭': 5,
  '𝐮': 6, '𝐯': 6, '𝐰': 7, '𝐱': 6, '𝐲': 6, '𝐳': 5,
  // Mathematical Fraktur
  '𝖆': 6, '𝖇': 6, '𝖈': 5, '𝖉': 6, '𝖊': 6, '𝖋': 5, '𝖌': 6, '𝖍': 6, '𝖎': 3, '𝖏': 4,
  '𝖐': 6, '𝖑': 4, '𝖒': 7, '𝖓': 6, '𝖔': 6, '𝖕': 6, '𝖖': 6, '𝖗': 5, '𝖘': 5, '𝖙': 5,
  '𝖚': 6, '𝖛': 6, '𝖜': 7, '𝖝': 6, '𝖞': 6, '𝖟': 6,
  '𝕬': 6, '𝕭': 6, '𝕮': 6, '𝕯': 6, '𝕰': 6, '𝕱': 5, '𝕲': 6, '𝕳': 6, '𝕴': 4, '𝕵': 5,
  '𝕶': 6, '𝕷': 5, '𝕸': 7, '𝕹': 6, '𝕺': 6, '𝕻': 6, '𝕼': 6, '𝕽': 6, '𝕾': 6, '𝕿': 6,
  '𝖀': 6, '𝖁': 6, '𝖂': 7, '𝖃': 6, '𝖄': 6, '𝖅': 6,
  // Mathematical Script / Cursive
  '𝓪': 6, '𝓫': 5, '𝓬': 5, '𝓭': 6, '𝓮': 6, '𝓯': 5, '𝓰': 6, '𝓱': 6, '𝓲': 4, '𝓳': 4,
  '𝓴': 5, '𝓵': 4, '𝓶': 7, '𝓷': 6, '𝓸': 5, '𝓹': 6, '𝓺': 6, '𝓻': 5, '𝓼': 5, '𝓽': 5,
  '𝓾': 6, '𝓿': 5, '𝔀': 7, '𝔁': 6, '𝔂': 6, '𝔃': 5,
  '𝓐': 6, '𝓑': 6, '𝓒': 6, '𝓓': 6, '𝓔': 6, '𝓕': 5, '𝓖': 6, '𝓗': 6, '𝓘': 4, '𝓙': 5,
  '𝓚': 6, '𝓛': 5, '𝓜': 7, '𝓝': 6, '𝓞': 6, '𝓟': 6, '𝓠': 6, '𝓡': 6, '𝓢': 6, '𝓣': 6,
  '𝓤': 6, '𝓥': 6, '𝓦': 7, '𝓧': 6, '𝓨': 6, '𝓩': 6,
  '𝒶': 6, '𝒷': 5, '𝒸': 5, '𝒹': 6, 'ℯ': 6, '𝒻': 5, 'ℊ': 6, '𝒽': 6, '𝒾': 4, '𝒿': 4,
  '𝓀': 5, '𝓁': 4, '𝓂': 7, '𝓃': 6, 'ℴ': 5, '𝓅': 6, '𝓆': 6, '𝓇': 5, '𝓈': 5, '𝓉': 5,
  '𝓊': 6, '𝓋': 5, '𝓌': 7, '𝓍': 6, '𝓎': 6, '𝓏': 5,
  // Mathematical Monospace
  '𝚊': 6, '𝚋': 6, '𝚌': 6, '𝚍': 6, '𝚎': 6, '𝚏': 6, '𝚐': 6, '𝚑': 6, '𝚒': 6, '𝚓': 6,
  '𝚔': 6, '𝚕': 6, '𝚖': 6, '𝚗': 6, '𝚘': 6, '𝚙': 6, '𝚚': 6, '𝚛': 6, '𝚜': 6, '𝚝': 6,
  '𝚞': 6, '𝚟': 6, '𝚠': 6, '𝚡': 6, '𝚢': 6, '𝚣': 6,
  '𝙰': 6, '𝙱': 6, '𝙲': 6, '𝙳': 6, '𝙴': 6, '𝙵': 6, '𝙶': 6, '𝙷': 6, '𝙸': 6, '𝙹': 6,
  '𝙺': 6, '𝙻': 6, '𝙼': 6, '𝙽': 6, '𝙾': 6, '𝙿': 6, '𝚀': 6, '𝚁': 6, '𝚂': 6, '𝚃': 6,
  '𝚄': 6, '𝚅': 6, '𝚆': 6, '𝚇': 6, '𝚈': 6, '𝚉': 6,
  // Canadian Aboriginal Syllabics (Kaomoji)
  'ᗝ': 5, 'ᗒ': 5, 'ᗕ': 5, 'ᗜ': 5, 'ᗰ': 5, 'ᒪ': 4, 'ᕼ': 5, 'ᑎ': 4, 'ᗪ': 5, 'ᗨ': 5, 'ᗩ': 5,
  // Oriya, Kannada, Tibetan & Tamil borders
  '୨': 5, '୧': 5, 'ಠ': 6, '೦': 4, '༺': 5, '༻': 5, 'ஓ': 6, '๑': 5, '۩': 8,
  // Misc symbols
  '⊠': 8, '⊙': 7, '☉': 7, '⚆': 8, '❉': 8, '⛇': 8, '⚝': 7, '⛶': 8,
  '∇': 8, '∀': 8, '≧': 8, '≦': 8, '▾': 7, '◡': 7, '◤': 8, '◥': 8, '‸': 4, '⯪': 8, '⏼': 8,
  'ℓ': 4, 'ⅅ': 6, '⅋': 6, '℃': 8, 'ℱ': 6, 'ℬ': 6, 'ℐ': 4, 'ℛ': 6, 'ℒ': 6, 'ℂ': 6, 'ℍ': 6, 'ℙ': 6, 'ℕ': 6,
  '✿': 7, '❀': 7, '❁': 7, '▰': 7, 'ȶ': 5, 'ɨ': 4, '◦': 4, '»': 7, '«': 7, '°': 5, '—': 9,
  // Combining diacritics / Zalgo (0px advance)
  '҉': 0, '͍': 0, '̤': 0, '̒': 0, '͌': 0, '̨': 0, '͋': 0, '̀': 0, '̂': 0, '̉': 0, '̊': 0, '̍': 0, '̑': 0, '̕': 0, '̖': 0, '͊': 0, 'ͤ': 0,
  // Halfwidth CJK punctuation
  '｡': 3, '｢': 3, '｣': 3, '､': 3, '･': 3, 'ｰ': 4, 'ﾟ': 3, 'ﾞ': 3,
  // CJK Brackets (Fullwidth 9px)
  '『': 9, '』': 9, '【': 9, '】': 9, '「': 9, '」': 9, '〈': 9, '〉': 9, '《': 9, '》': 9, '〔': 9, '〕': 9,
  // Cherokee letters
  'Ꮖ': 6, 'Ꮎ': 6, 'Ꭿ': 6, 'Ꮆ': 6, 'Ꮍ': 6, 'Ꮗ': 6, 'Ꮙ': 6, 'Ꮶ': 6, 'Ꮱ': 6, 'Ꭵ': 4, 'Ꮚ': 6,
  // Misc typography & symbols
  '❥': 7, '∘': 4, '❘': 2, '‿': 6, '⚜': 7, '☘': 7, '☏': 7, '☑': 10, '✈': 8, '✉': 8, '✎': 8, '✏': 8,
  '✓': 8, '✔': 7, '✕': 8, '✖': 8, '✗': 8, '✘': 7, '❣': 6, '❤': 8, '❆': 8, '❅': 8, '❄': 8,
  '🥔': 9, '💀': 9, '🔥': 7, '🖤': 9,
  // In-game ASCII art & player symbols
  '™': 9,
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
    // 1. Populate custom and Unifont symbol advances first
    for (const [char, adv] of Object.entries(MINECRAFT_SYMBOL_ADVANCES)) {
      this.advances.set(char, adv);
    }
    // 2. Populate Minecraft official texture measurements from glyphs.json
    for (const item of glyphsData) {
      if (item.char === ' ') {
        this.advances.set(item.char, item.pixels); // space is 4
      } else {
        this.advances.set(item.char, item.pixels + 1); // standard character advance is width + 1
      }
    }
    // 3. Ensure formatting symbol and newlines always have 0 advance
    this.advances.set('§', 0);
    this.advances.set('\n', 0);
    this.advances.set('\r', 0);
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
   * Returns true if character is a Unicode non-spacing combining mark (0px advance).
   */
  public isCombining(char: string): boolean {
    const code = char.codePointAt(0) || 0;
    return (
      (code >= 0x0300 && code <= 0x036f) ||
      (code >= 0x0483 && code <= 0x0489) ||
      (code >= 0x0591 && code <= 0x05bd) ||
      (code >= 0x0610 && code <= 0x061a) ||
      (code >= 0x064b && code <= 0x065f) ||
      (code >= 0x1dc0 && code <= 0x1dff) ||
      (code >= 0x20d0 && code <= 0x20ff) ||
      (code >= 0xfe20 && code <= 0xfe2f)
    );
  }

  /**
   * Returns the advance (cursor delta) in pixels for any Unicode character.
   * If the character is not in the custom bitmap sheets, dynamically calculates
   * its pixel advance to match Minecraft Unifont proportions.
   */
  public getAdvance(char: string, isBold = false): number {
    if (char === '§' || char === '\n' || char === '\r' || this.isCombining(char)) return 0;
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
   * Uses 1-bit pixel bounding box mask matching Minecraft's UnihexProvider.
   */
  private measureUnicodeAdvance(char: string): number {
    if (char === ' ') return 4;
    if (this.isCombining(char)) return 0;
    const code = char.codePointAt(0) || 0;

    // Fast lookups for common ranges based on Unifont / Symbol Chat:
    // CJK, Fullwidth forms, Emojis, Enclosed Alphanumerics
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

    this.initMeasureCanvas();
    if (!this.measureCtx) {
      return (code >= 0x2000 && code <= 0x2bff) || code > 0xff00 ? 8 : 5;
    }

    this.measureCtx.clearRect(0, 0, 32, 32);
    this.measureCtx.font = '16px "Unifont", monospace';
    this.measureCtx.textBaseline = 'alphabetic';
    this.measureCtx.fillText(char, 0, 13);

    try {
      const imgData = this.measureCtx.getImageData(0, 0, 32, 16);
      const data = imgData.data;
      let left = -1;
      let right = -1;

      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 16; y++) {
          if (data[(y * 32 + x) * 4 + 3] >= 70) {
            if (left === -1) left = x;
            right = x;
            break;
          }
        }
      }

      if (left === -1) {
        return 0; // Blank / un-rendered glyph
      }

      const glyphWidth = right - left + 1;
      // Minecraft UnihexProvider advance formula: Math.floor(width / 2) + 1
      return Math.floor(glyphWidth / 2) + 1;
    } catch {
      const metrics = this.measureCtx.measureText(char);
      const measuredWidth = Math.ceil(metrics.width / 2);
      return Math.max(2, Math.min(9, measuredWidth + 1));
    }
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
