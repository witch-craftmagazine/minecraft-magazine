import { LineLayout, MinecraftBook, ViewMode } from '../engine/types';
import { defaultGlyphAtlas, GlyphAtlas } from '../engine/GlyphAtlas';
import { splitTextToLines, LINES_PER_PAGE, BOOK_TEXT_WIDTH } from '../engine/StringSplitter';
import { soundManager } from './SoundEffects';
import { ResourcePackInfo } from '../engine/ResourcePackManager';

// Dimensions and layout
const TWO_PAGE_OVERLAP = 42; // Eliminates transparent padding so spine meets in center
const TWO_PAGE_WIDTH = 384 - TWO_PAGE_OVERLAP; // 342px base width
const RIGHT_PAGE_X = 192 - TWO_PAGE_OVERLAP;   // 150px base offset

export interface BookCanvasOptions {
  container: HTMLElement;
  atlas?: GlyphAtlas;
  onPageChange?: (page: number, total: number) => void;
  baseAssetPath?: string;
  defaultViewMode?: ViewMode;
  showPageIndicator?: boolean;
}

export class BookCanvas {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private atlas: GlyphAtlas;
  private baseAssetPath: string;

  private book: MinecraftBook = { title: '', author: '', pages: [''] };
  private paginatedPages: LineLayout[][] = [];
  private currentPage = 0; // 0-indexed
  private viewMode: ViewMode = 'double';
  private scale = 3; // Integer scaling factor
  private showPageIndicator = false;

  // Layout Debug & Inspector support
  private showLayoutGrid = false;
  private highlightedLineIndex: number | null = null; // Off by default (toggleable via setShowPageIndicator)

  // Textures
  private bookBg: HTMLImageElement | null = null;
  private pageForwardBtn: HTMLImageElement | null = null;
  private pageForwardHoverBtn: HTMLImageElement | null = null;
  private pageBackwardBtn: HTMLImageElement | null = null;
  private pageBackwardHoverBtn: HTMLImageElement | null = null;

  // Interaction
  private hoveredButton: 'forward' | 'backward' | null = null;
  private onPageChange?: (page: number, total: number) => void;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private lastTouchTurnTime = 0;

  // Animation for §k (obfuscated)
  private animFrameId: number | null = null;
  private lastAnimTick = 0;
  private randomCharPool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]:;<>?,./~';

  constructor(options: BookCanvasOptions) {
    this.container = options.container;
    this.atlas = options.atlas || defaultGlyphAtlas;
    this.baseAssetPath = options.baseAssetPath || './assets';
    this.onPageChange = options.onPageChange;
    this.showPageIndicator = options.showPageIndicator ?? false;
    if (options.defaultViewMode) {
      this.viewMode = options.defaultViewMode;
    }

    this.canvas = document.createElement('canvas');
    this.canvas.style.imageRendering = 'pixelated';
    this.canvas.style.display = 'block';
    this.canvas.style.margin = '0 auto';
    this.canvas.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.9)';
    this.canvas.style.borderRadius = '3px';
    this.canvas.style.maxWidth = '96vw';
    this.canvas.style.maxHeight = 'calc(100vh - 70px)';
    this.canvas.style.objectFit = 'contain';

    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;

    this.container.appendChild(this.canvas);
    this.setupListeners();
  }

  public async init(): Promise<void> {
    await Promise.all([
      this.atlas.load(this.baseAssetPath),
      this.loadTexturesFromPaths({
        book: `${this.baseAssetPath}/packs/lithos/textures/gui/book.png`,
        pageForward: `${this.baseAssetPath}/packs/lithos/textures/gui/page_forward.png`,
        pageForwardHover: `${this.baseAssetPath}/packs/lithos/textures/gui/page_forward_highlighted.png`,
        pageBackward: `${this.baseAssetPath}/packs/lithos/textures/gui/page_backward.png`,
        pageBackwardHover: `${this.baseAssetPath}/packs/lithos/textures/gui/page_backward_highlighted.png`,
      }),
    ]);

    this.updateCanvasDimensions();
    this.render();
    this.startAnimLoop();
  }

  public async applyResourcePack(pack: ResourcePackInfo): Promise<void> {
    await this.loadTexturesFromPaths(pack.textures);
    if (pack.fontBaseUrl) {
      await this.atlas.loadFromFontDirectory(pack.fontBaseUrl);
    } else if (pack.fontProviders && pack.fontTextureResolver) {
      await this.atlas.loadBitmapProviders(pack.fontProviders, pack.fontTextureResolver);
    }
    // Re-paginate pages with updated character advances
    this.recalculatePages();
    this.render();
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load texture: ${src}`));
      img.src = src;
    });
  }

  private async loadTexturesFromPaths(paths: {
    book: string;
    pageForward: string;
    pageForwardHover: string;
    pageBackward: string;
    pageBackwardHover: string;
  }): Promise<void> {
    const [bg, fwd, fwdH, bwd, bwdH] = await Promise.all([
      this.loadImage(paths.book),
      this.loadImage(paths.pageForward),
      this.loadImage(paths.pageForwardHover),
      this.loadImage(paths.pageBackward),
      this.loadImage(paths.pageBackwardHover),
    ]);

    this.bookBg = bg;
    this.pageForwardBtn = fwd;
    this.pageForwardHoverBtn = fwdH;
    this.pageBackwardBtn = bwd;
    this.pageBackwardHoverBtn = bwdH;
  }

  public setBook(book: MinecraftBook): void {
    this.book = book;
    this.recalculatePages();
    this.currentPage = 0;
    this.notifyPageChange();
    this.render();
  }

  public recalculatePages(): void {
    const allPages: LineLayout[][] = [];

    // Each Stendhal page (delimited by #-) corresponds strictly 1-to-1 with a reader page.
    // In Minecraft Java Edition, written book pages have a fixed 14-line capacity and never auto-split.
    for (const rawPage of this.book.pages) {
      const lines = splitTextToLines(rawPage, BOOK_TEXT_WIDTH, this.atlas);
      allPages.push(lines);
    }

    this.paginatedPages = allPages.length > 0 ? allPages : [[{ spans: [], width: 0 }]];
    if (this.currentPage >= this.paginatedPages.length) {
      this.currentPage = Math.max(0, this.paginatedPages.length - 1);
    }
  }

  public getRawPageText(pageIndex: number): string {
    return this.book.pages[pageIndex] || '';
  }

  public getPageLines(pageIndex: number): LineLayout[] {
    return this.paginatedPages[pageIndex] || [];
  }

  public getAllPages(): LineLayout[][] {
    return this.paginatedPages;
  }

  public getAtlas(): GlyphAtlas {
    return this.atlas;
  }

  public setShowLayoutGrid(show: boolean): void {
    if (this.showLayoutGrid !== show) {
      this.showLayoutGrid = show;
      this.render();
    }
  }

  public setHighlightedLine(lineIndex: number | null): void {
    if (this.highlightedLineIndex !== lineIndex) {
      this.highlightedLineIndex = lineIndex;
      this.render();
    }
  }

  public setViewMode(mode: ViewMode): void {
    if (this.viewMode !== mode) {
      this.viewMode = mode;
      if (mode === 'double' && this.currentPage % 2 !== 0) {
        this.currentPage--;
      }
      this.updateCanvasDimensions();
      this.notifyPageChange();
      this.render();
    }
  }

  public getViewMode(): ViewMode {
    return this.viewMode;
  }

  public setShowPageIndicator(show: boolean): void {
    if (this.showPageIndicator !== show) {
      this.showPageIndicator = show;
      this.render();
    }
  }

  public getShowPageIndicator(): boolean {
    return this.showPageIndicator;
  }

  public setScale(scale: number): void {
    this.scale = Math.max(1, Math.min(6, scale));
    this.updateCanvasDimensions();
    this.render();
  }

  public getScale(): number {
    return this.scale;
  }

  public getCurrentPage(): number {
    return this.currentPage;
  }

  public getTotalPages(): number {
    return this.paginatedPages.length;
  }

  public setPage(pageIndex: number): void {
    const clamped = Math.max(0, Math.min(this.paginatedPages.length - 1, pageIndex));
    if (clamped !== this.currentPage) {
      this.currentPage = clamped;
      soundManager.playPageTurn();
      this.notifyPageChange();
      this.render();
    }
  }

  public nextPage(): void {
    const step = this.viewMode === 'double' ? 2 : 1;
    if (this.currentPage + step < this.paginatedPages.length) {
      this.currentPage += step;
      soundManager.playPageTurn();
      this.notifyPageChange();
      this.render();
    } else if (this.viewMode === 'double' && this.currentPage + 1 < this.paginatedPages.length) {
      this.currentPage += 1;
      soundManager.playPageTurn();
      this.notifyPageChange();
      this.render();
    }
  }

  public prevPage(): void {
    const step = this.viewMode === 'double' ? 2 : 1;
    if (this.currentPage - step >= 0) {
      this.currentPage -= step;
      soundManager.playPageTurn();
      this.notifyPageChange();
      this.render();
    } else if (this.currentPage > 0) {
      this.currentPage = 0;
      soundManager.playPageTurn();
      this.notifyPageChange();
      this.render();
    }
  }

  private notifyPageChange(): void {
    if (this.onPageChange) {
      this.onPageChange(this.currentPage, this.paginatedPages.length);
    }
  }

  private updateCanvasDimensions(): void {
    const baseW = this.viewMode === 'double' ? TWO_PAGE_WIDTH : 192;
    const baseH = 192;

    this.canvas.width = baseW * this.scale;
    this.canvas.height = baseH * this.scale;
    this.canvas.style.width = `${baseW * this.scale}px`;
    this.canvas.style.height = `${baseH * this.scale}px`;

    this.ctx.imageSmoothingEnabled = false;
  }

  public render(): void {
    if (!this.bookBg) return;

    this.ctx.save();
    this.ctx.scale(this.scale, this.scale);

    const isDouble = this.viewMode === 'double';

    if (!isDouble) {
      // Single Page View (Vanilla 1:1)
      this.renderSinglePage({
        destX: 0,
        pageIndex: this.currentPage,
        textStartX: 36,
        pageIndicatorRightX: 148,
        backwardButtonX: 43,
        forwardButtonX: 116,
        isMirrored: false,
        allowForward: true,
        allowBackward: true,
      });
    } else {
      // Two-Page Spread View:
      // Left page has background MIRRORED horizontally so its binding is on the right (in the middle!)
      // Right page has background standard so its binding is on the left (in the middle!)
      const leftPageIndex = this.currentPage;
      const rightPageIndex = this.currentPage + 1;

      // 1. Render Left Page (Mirrored background, binding in middle)
      this.renderSinglePage({
        destX: 0,
        pageIndex: leftPageIndex,
        textStartX: 42,           // Centered on left parchment
        pageIndicatorRightX: 150,  // Near middle top margin
        backwardButtonX: 43,      // Outer bottom-left corner
        forwardButtonX: 116,
        isMirrored: true,         // Mirror background texture!
        allowForward: false,
        allowBackward: true,
      });

      // 2. Render Right Page (Standard background, moved closer to meet central spine)
      if (rightPageIndex < this.paginatedPages.length) {
        this.renderSinglePage({
          destX: RIGHT_PAGE_X,
          pageIndex: rightPageIndex,
          textStartX: RIGHT_PAGE_X + 36,
          pageIndicatorRightX: RIGHT_PAGE_X + 148,
          backwardButtonX: RIGHT_PAGE_X + 43,
          forwardButtonX: RIGHT_PAGE_X + 116, // Outer bottom-right corner
          isMirrored: false,
          allowForward: true,
          allowBackward: false,
        });
      } else {
        // Draw blank parchment background for empty right page
        const srcW = Math.round(this.bookBg.naturalWidth * 0.75);
        const srcH = Math.round(this.bookBg.naturalHeight * 0.75);
        this.ctx.drawImage(this.bookBg, 0, 0, srcW, srcH, RIGHT_PAGE_X, 0, 192, 192);
      }
    }

    this.ctx.restore();
  }

  /**
   * Renders a single book page with customizable geometry and mirroring.
   */
  private renderSinglePage(opts: {
    destX: number;
    pageIndex: number;
    textStartX: number;
    pageIndicatorRightX: number;
    backwardButtonX: number;
    forwardButtonX: number;
    isMirrored: boolean;
    allowForward: boolean;
    allowBackward: boolean;
  }): void {
    if (!this.bookBg) return;

    const {
      destX,
      pageIndex,
      textStartX,
      pageIndicatorRightX,
      backwardButtonX,
      forwardButtonX,
      isMirrored,
      allowForward,
      allowBackward,
    } = opts;

    // Support any resolution texture (16x, 32x, etc.):
    // The book GUI occupies 75% of the texture width/height (192/256)
    const srcW = Math.round(this.bookBg.naturalWidth * 0.75);
    const srcH = Math.round(this.bookBg.naturalHeight * 0.75);

    // 1. Draw Background (mirrored or standard)
    if (isMirrored) {
      this.ctx.save();
      this.ctx.translate(destX + 192, 0);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(this.bookBg, 0, 0, srcW, srcH, 0, 0, 192, 192);
      this.ctx.restore();
    } else {
      this.ctx.drawImage(this.bookBg, 0, 0, srcW, srcH, destX, 0, 192, 192);
    }

    // 2. Draw Page Indicator ("Page X of Y") - toggleable, off by default
    if (this.showPageIndicator) {
      const pageMsg = `Page ${pageIndex + 1} of ${Math.max(1, this.paginatedPages.length)}`;
      this.renderTextLineRightAligned(pageMsg, pageIndicatorRightX, 16, '#000000');
    }

    // 3. Draw text lines (up to 14 lines)
    const pageLines = this.paginatedPages[pageIndex] || [];
    for (let i = 0; i < Math.min(LINES_PER_PAGE, pageLines.length); i++) {
      const line = pageLines[i];
      const y = 30 + i * 9;
      let cursorX = textStartX;

      for (const span of line.spans) {
        for (let charToDraw of span.text) {
          if (span.obfuscated && charToDraw !== ' ') {
            const randIdx = Math.floor(Math.random() * this.randomCharPool.length);
            charToDraw = this.randomCharPool[randIdx];
          }

          const glyphInfo = this.atlas.getGlyphDrawInfo(charToDraw, span.color, span.bold);
          if (glyphInfo) {
            const destW = glyphInfo.dWidth ?? glyphInfo.sWidth;
            const destH = glyphInfo.dHeight ?? glyphInfo.sHeight;
            const drawY = y + (glyphInfo.yOffset ?? 0);

            this.ctx.drawImage(
              glyphInfo.image,
              glyphInfo.sx,
              glyphInfo.sy,
              glyphInfo.sWidth,
              glyphInfo.sHeight,
              cursorX,
              drawY,
              destW,
              destH
            );

            if (span.bold) {
              this.ctx.drawImage(
                glyphInfo.image,
                glyphInfo.sx,
                glyphInfo.sy,
                glyphInfo.sWidth,
                glyphInfo.sHeight,
                cursorX + 1,
                drawY,
                destW,
                destH
              );
            }

            if (span.underlined) {
              this.ctx.fillStyle = span.color;
              this.ctx.fillRect(cursorX, y + 8, glyphInfo.advance, 1);
            }

            if (span.strikethrough) {
              this.ctx.fillStyle = span.color;
              this.ctx.fillRect(cursorX, y + 4, glyphInfo.advance, 1);
            }

            cursorX += glyphInfo.advance;
          } else {
            cursorX += this.atlas.getAdvance(charToDraw, span.bold);
          }
        }
      }
    }

    // 3.5. Draw Debug Layout Grid (if inspector grid toggle active)
    if (this.showLayoutGrid) {
      this.ctx.save();
      // Draw 114px right margin guide line
      this.ctx.strokeStyle = 'rgba(230, 40, 40, 0.45)';
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([2, 2]);
      this.ctx.beginPath();
      this.ctx.moveTo(textStartX + BOOK_TEXT_WIDTH, 26);
      this.ctx.lineTo(textStartX + BOOK_TEXT_WIDTH, 30 + LINES_PER_PAGE * 9);
      this.ctx.stroke();

      // Draw horizontal line baselines and highlight selected line
      for (let i = 0; i < LINES_PER_PAGE; i++) {
        const lineY = 30 + i * 9;
        const isHighlighted = this.highlightedLineIndex === i;

        if (isHighlighted) {
          this.ctx.fillStyle = 'rgba(255, 170, 0, 0.28)';
          this.ctx.fillRect(textStartX - 2, lineY - 1, BOOK_TEXT_WIDTH + 4, 10);
        }

        this.ctx.strokeStyle = isHighlighted ? 'rgba(255, 170, 0, 0.8)' : 'rgba(120, 120, 120, 0.2)';
        this.ctx.setLineDash(isHighlighted ? [] : [1, 3]);
        this.ctx.beginPath();
        this.ctx.moveTo(textStartX, lineY + 8);
        this.ctx.lineTo(textStartX + BOOK_TEXT_WIDTH, lineY + 8);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }

    // 4. Draw Navigation Buttons
    // Backward button (bottom-left)
    const canGoBack = pageIndex > 0;
    if (allowBackward && canGoBack) {
      const bwdImg = (this.hoveredButton === 'backward') ? this.pageBackwardHoverBtn : this.pageBackwardBtn;
      if (bwdImg) {
        this.ctx.drawImage(bwdImg, 0, 0, bwdImg.naturalWidth, bwdImg.naturalHeight, backwardButtonX, 157, 23, 13);
      }
    }

    // Forward button (bottom-right)
    const canGoForward = pageIndex < this.paginatedPages.length - 1;
    if (allowForward && canGoForward) {
      const fwdImg = (this.hoveredButton === 'forward') ? this.pageForwardHoverBtn : this.pageForwardBtn;
      if (fwdImg) {
        this.ctx.drawImage(fwdImg, 0, 0, fwdImg.naturalWidth, fwdImg.naturalHeight, forwardButtonX, 157, 23, 13);
      }
    }
  }

  private renderTextLineRightAligned(text: string, rightEdgeX: number, y: number, color: string): void {
    let totalWidth = 0;
    for (const ch of text) {
      totalWidth += this.atlas.getAdvance(ch, false);
    }

    let cursorX = rightEdgeX - totalWidth;
    for (const ch of text) {
      const glyphInfo = this.atlas.getGlyphDrawInfo(ch, color, false);
      if (glyphInfo) {
        const destW = glyphInfo.dWidth ?? glyphInfo.sWidth;
        const destH = glyphInfo.dHeight ?? glyphInfo.sHeight;
        const drawY = y + (glyphInfo.yOffset ?? 0);

        this.ctx.drawImage(
          glyphInfo.image,
          glyphInfo.sx,
          glyphInfo.sy,
          glyphInfo.sWidth,
          glyphInfo.sHeight,
          cursorX,
          drawY,
          destW,
          destH
        );
        cursorX += glyphInfo.advance;
      } else {
        cursorX += this.atlas.getAdvance(ch, false);
      }
    }
  }

  private setupListeners(): void {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const baseW = this.viewMode === 'double' ? TWO_PAGE_WIDTH : 192;
      const baseH = 192;
      const unscaledX = rect.width ? (e.clientX - rect.left) * (baseW / rect.width) : 0;
      const unscaledY = rect.height ? (e.clientY - rect.top) * (baseH / rect.height) : 0;

      const prevHover = this.hoveredButton;
      this.hoveredButton = this.hitTestButtons(unscaledX, unscaledY);

      if (prevHover !== this.hoveredButton) {
        this.canvas.style.cursor = this.hoveredButton ? 'pointer' : 'default';
        this.render();
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (this.hoveredButton !== null) {
        this.hoveredButton = null;
        this.canvas.style.cursor = 'default';
        this.render();
      }
    });

    // Touch events for mobile devices (swiping and tapping)
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (e.changedTouches.length !== 1) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - this.touchStartX;
      const deltaY = touch.clientY - this.touchStartY;
      const deltaTime = Date.now() - this.touchStartTime;

      const rect = this.canvas.getBoundingClientRect();
      const baseW = this.viewMode === 'double' ? TWO_PAGE_WIDTH : 192;
      const baseH = 192;
      const unscaledX = rect.width ? (touch.clientX - rect.left) * (baseW / rect.width) : 0;
      const unscaledY = rect.height ? (touch.clientY - rect.top) * (baseH / rect.height) : 0;

      // 1. Horizontal swipe gesture
      if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && deltaTime < 600) {
        this.lastTouchTurnTime = Date.now();
        if (deltaX < 0) {
          this.nextPage();
        } else {
          this.prevPage();
        }
        return;
      }

      // 2. Tap gesture on touchscreen
      if (Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) {
        this.lastTouchTurnTime = Date.now();

        // Check if tapped directly on arrow buttons
        const hit = this.hitTestButtons(unscaledX, unscaledY);
        if (hit === 'forward') {
          this.nextPage();
          return;
        } else if (hit === 'backward') {
          this.prevPage();
          return;
        }

        // Tap on right half -> next page; left half -> prev page
        const midX = baseW / 2;
        if (unscaledX >= midX) {
          this.nextPage();
        } else {
          this.prevPage();
        }
      }
    }, { passive: true });

    this.canvas.addEventListener('click', (e) => {
      // Ignore simulated click events fired right after touchend
      if (Date.now() - this.lastTouchTurnTime < 450) return;

      const rect = this.canvas.getBoundingClientRect();
      const baseW = this.viewMode === 'double' ? TWO_PAGE_WIDTH : 192;
      const baseH = 192;
      const unscaledX = rect.width ? (e.clientX - rect.left) * (baseW / rect.width) : 0;
      const unscaledY = rect.height ? (e.clientY - rect.top) * (baseH / rect.height) : 0;

      const hit = this.hitTestButtons(unscaledX, unscaledY);
      if (hit === 'forward') {
        this.nextPage();
      } else if (hit === 'backward') {
        this.prevPage();
      } else {
        // Click on right page turns forward, left page turns back
        const midX = baseW / 2;
        if (unscaledX >= midX) {
          this.nextPage();
        } else {
          this.prevPage();
        }
      }
    });

    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        this.nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        this.prevPage();
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.setPage(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        this.setPage(this.paginatedPages.length - 1);
      }
    });
  }

  private hitTestButtons(x: number, y: number): 'forward' | 'backward' | null {
    const isDouble = this.viewMode === 'double';

    if (!isDouble) {
      if (this.currentPage > 0 && x >= 43 && x <= 43 + 23 && y >= 157 && y <= 157 + 13) {
        return 'backward';
      }
      if (this.currentPage < this.paginatedPages.length - 1 && x >= 116 && x <= 116 + 23 && y >= 157 && y <= 157 + 13) {
        return 'forward';
      }
    } else {
      // Left Page backward button at (43, 157, 23, 13)
      if (this.currentPage > 0 && x >= 43 && x <= 43 + 23 && y >= 157 && y <= 157 + 13) {
        return 'backward';
      }
      // Right Page forward button at (RIGHT_PAGE_X + 116, 157, 23, 13)
      const rightPageIndex = this.currentPage + 1;
      const rightBtnX = RIGHT_PAGE_X + 116;
      if (rightPageIndex < this.paginatedPages.length - 1 && x >= rightBtnX && x <= rightBtnX + 23 && y >= 157 && y <= 157 + 13) {
        return 'forward';
      }
    }

    return null;
  }

  private startAnimLoop(): void {
    const tick = (now: number) => {
      if (now - this.lastAnimTick >= 80) {
        if (this.hasObfuscatedTextOnCurrentPage()) {
          this.render();
        }
        this.lastAnimTick = now;
      }
      this.animFrameId = requestAnimationFrame(tick);
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  private hasObfuscatedTextOnCurrentPage(): boolean {
    const pagesToCheck = [this.currentPage];
    if (this.viewMode === 'double') {
      pagesToCheck.push(this.currentPage + 1);
    }

    for (const pIdx of pagesToCheck) {
      const page = this.paginatedPages[pIdx];
      if (!page) continue;
      for (const line of page) {
        for (const span of line.spans) {
          if (span.obfuscated) return true;
        }
      }
    }
    return false;
  }

  public toDataURL(): string {
    return this.canvas.toDataURL('image/png');
  }

  public destroy(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.canvas.remove();
  }
}
