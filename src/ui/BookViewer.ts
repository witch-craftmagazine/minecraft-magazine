import { MinecraftBook } from '../engine/types';
import { BookCanvas } from '../render/BookCanvas';
import { soundManager } from '../render/SoundEffects';
import { ResourcePackManager } from '../engine/ResourcePackManager';
import { WITCHCRAFT_MAGAZINE_ISSUES } from '../samples/sampleBooks';
import { parseStendhalBook } from '../io/BookParser';

export class BookViewer {
  private container: HTMLElement;
  private canvasWrapper!: HTMLElement;
  private bookCanvas!: BookCanvas;
  private packManager!: ResourcePackManager;

  private currentBook: MinecraftBook = { title: '', author: '', pages: [''] };
  private currentIssueId = 'intro';

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public async init(): Promise<void> {
    this.packManager = new ResourcePackManager('./assets');
    this.buildLayout();

    // Check URL hash for direct issue deep-link (e.g., #issue=issue1 or #issue1)
    this.resolveInitialIssueFromHash();

    // Automatically use single page on narrow screens (< 680px) and two pages on wider screens
    const isNarrow = typeof window !== 'undefined' && window.innerWidth < 680;
    const initialViewMode = isNarrow ? 'single' : 'double';

    this.bookCanvas = new BookCanvas({
      container: this.canvasWrapper,
      baseAssetPath: './assets',
      defaultViewMode: initialViewMode,
      onPageChange: (page, total) => this.updatePageIndicator(page, total),
    });

    this.setupListeners();

    // 1. Initialize canvas textures & load initial magazine issue concurrently
    await Promise.all([
      this.bookCanvas.init(),
      this.loadIssue(this.currentIssueId),
    ]);

    // 2. Load custom Craftadia server pack (emojis & logos) asynchronously without delaying initial display
    const craftadiaPack = this.packManager.getPack('craftadia');
    if (craftadiaPack) {
      this.bookCanvas.applyResourcePack(craftadiaPack).catch((err) => {
        console.warn('Could not apply server resource pack:', err);
      });
    }
  }

  private resolveInitialIssueFromHash(): void {
    const hash = window.location.hash;
    const match = hash.match(/#issue=([a-zA-Z0-9_-]+)/);
    if (match && WITCHCRAFT_MAGAZINE_ISSUES.some(m => m.id === match[1])) {
      this.currentIssueId = match[1];
    } else if (hash.startsWith('#') && WITCHCRAFT_MAGAZINE_ISSUES.some(m => m.id === hash.slice(1))) {
      this.currentIssueId = hash.slice(1);
    }
  }

  private buildLayout(): void {
    this.container.innerHTML = `
      <!-- Main Reader Viewport (Pitch Black Background) -->
      <main class="reader-viewport">
        <div class="canvas-wrapper" id="canvas-wrapper"></div>
      </main>

      <!-- Sleek Floating Magazine Selector Header -->
      <header class="magazine-nav" id="magazine-nav">
        <div class="magazine-nav-inner">
          <div class="magazine-brand">
            <span class="magazine-brand-icon">✨</span>
            <span class="magazine-brand-title">witchcraft...magazine</span>
          </div>

          <div class="magazine-selector-wrapper">
            <button class="nav-arrow-btn" id="btn-prev-issue" title="Previous Issue (Shift+Left)">◀</button>
            <select id="magazine-select" class="magazine-select" title="Select Witch-Craft Magazine Issue">
              ${WITCHCRAFT_MAGAZINE_ISSUES.map(
                m => `<option value="${m.id}" ${m.id === this.currentIssueId ? 'selected' : ''}>${m.title}</option>`
              ).join('')}
            </select>
            <button class="nav-arrow-btn" id="btn-next-issue" title="Next Issue (Shift+Right)">▶</button>
          </div>

          <div class="magazine-meta">
            <span class="magazine-page-info" id="magazine-page-info">1-2 / 16</span>
            <button class="nav-icon-btn" id="btn-sound-toggle" title="Toggle Page Flip Sound">🔊</button>
          </div>
        </div>
      </header>
    `;

    this.canvasWrapper = this.container.querySelector('#canvas-wrapper') as HTMLElement;
  }

  private async loadIssue(issueId: string): Promise<void> {
    const issue = WITCHCRAFT_MAGAZINE_ISSUES.find(m => m.id === issueId);
    if (!issue) return;

    this.currentIssueId = issueId;
    const select = this.container.querySelector('#magazine-select') as HTMLSelectElement;
    if (select && select.value !== issueId) {
      select.value = issueId;
    }

    try {
      const resp = await fetch(`./assets/books/${issue.filename}`);
      if (!resp.ok) {
        throw new Error(`Failed to load ${issue.filename}: ${resp.statusText}`);
      }
      const text = await resp.text();
      const book = parseStendhalBook(text);
      if (book) {
        this.currentBook = book;
        this.bookCanvas.setBook(this.currentBook);
        this.bookCanvas.setPage(0);
        document.title = `${issue.title} · witchcraft...magazine`;
      }
    } catch (err) {
      console.error('Failed to load magazine issue:', err);
    }
  }

  private setupListeners(): void {
    const select = this.container.querySelector('#magazine-select') as HTMLSelectElement;
    const prevIssueBtn = this.container.querySelector('#btn-prev-issue') as HTMLButtonElement;
    const nextIssueBtn = this.container.querySelector('#btn-next-issue') as HTMLButtonElement;
    const soundBtn = this.container.querySelector('#btn-sound-toggle') as HTMLButtonElement;

    // Issue dropdown change
    select.addEventListener('change', () => {
      this.switchIssue(select.value);
    });

    // Previous / Next issue buttons
    prevIssueBtn.addEventListener('click', () => this.stepIssue(-1));
    nextIssueBtn.addEventListener('click', () => this.stepIssue(1));

    // Sound toggle button
    soundBtn.addEventListener('click', () => {
      const active = soundManager.toggle();
      soundBtn.textContent = active ? '🔊' : '🔇';
      soundBtn.title = active ? 'Mute Sound' : 'Enable Sound';
    });

    // Keyboard shortcuts for issue navigation (Shift + Left / Shift + Right or [ / ])
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if ((e.shiftKey && e.key === 'ArrowLeft') || e.key === '[') {
        e.preventDefault();
        this.stepIssue(-1);
      } else if ((e.shiftKey && e.key === 'ArrowRight') || e.key === ']') {
        e.preventDefault();
        this.stepIssue(1);
      }
    });

    // Automatically adjust between single page (narrow screens) and two pages on resize / rotation
    window.addEventListener('resize', () => {
      const isNarrowScreen = window.innerWidth < 680;
      const targetMode = isNarrowScreen ? 'single' : 'double';
      if (this.bookCanvas.getViewMode() !== targetMode) {
        this.bookCanvas.setViewMode(targetMode);
      }
    });

    // Hash change listener for browser navigation
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash;
      const match = hash.match(/#issue=([a-zA-Z0-9_-]+)/);
      const targetId = match ? match[1] : (hash.startsWith('#') ? hash.slice(1) : '');
      if (targetId && targetId !== this.currentIssueId && WITCHCRAFT_MAGAZINE_ISSUES.some(m => m.id === targetId)) {
        this.loadIssue(targetId);
      }
    });
  }

  private switchIssue(issueId: string): void {
    if (issueId === this.currentIssueId) return;
    window.location.hash = `#issue=${issueId}`;
    this.loadIssue(issueId);
  }

  private stepIssue(delta: number): void {
    const currentIndex = WITCHCRAFT_MAGAZINE_ISSUES.findIndex(m => m.id === this.currentIssueId);
    if (currentIndex === -1) return;
    const nextIndex = currentIndex + delta;
    if (nextIndex >= 0 && nextIndex < WITCHCRAFT_MAGAZINE_ISSUES.length) {
      this.switchIssue(WITCHCRAFT_MAGAZINE_ISSUES[nextIndex].id);
    }
  }

  private updatePageIndicator(currentPage: number, totalPages: number): void {
    const pageInfo = this.container.querySelector('#magazine-page-info') as HTMLElement;
    if (!pageInfo) return;

    const isDouble = this.bookCanvas.getViewMode() === 'double';
    if (isDouble && currentPage + 1 < totalPages && currentPage % 2 === 0) {
      pageInfo.textContent = `${currentPage + 1}-${currentPage + 2} / ${totalPages}`;
    } else {
      pageInfo.textContent = `${currentPage + 1} / ${totalPages}`;
    }
  }
}
