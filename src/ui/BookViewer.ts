import { MinecraftBook } from '../engine/types';
import { BookCanvas } from '../render/BookCanvas';
import { soundManager } from '../render/SoundEffects';
import { ResourcePackManager } from '../engine/ResourcePackManager';
import { WITCHCRAFT_MAGAZINE_ISSUES } from '../samples/sampleBooks';
import { parseStendhalBook } from '../io/BookParser';
import { PageInspectorModal } from './PageInspectorModal';
import { parseBookUrl, buildBookHash, buildShareableUrl } from './urlNavigation';

const isDev = !(import.meta as any).env?.PROD || (typeof window !== 'undefined' && (new URLSearchParams(window.location.search).has('dev') || new URLSearchParams(window.location.search).has('inspector')));

export class BookViewer {
  private container: HTMLElement;
  private canvasWrapper!: HTMLElement;
  private bookCanvas!: BookCanvas;
  private packManager!: ResourcePackManager;
  private pageInspector: PageInspectorModal | null = null;

  private currentBook: MinecraftBook = { title: '', author: '', pages: [''] };
  private currentIssueId = 'intro';
  private initialPage: number | null = null;
  private toastTimeout: any = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public async init(): Promise<void> {
    this.packManager = new ResourcePackManager('./assets');
    this.buildLayout();

    // Check URL query or hash for issue and page deep-link (e.g. #issue=issue1&page=13)
    this.resolveInitialStateFromUrl();

    // Automatically use single page on narrow screens (< 680px) and two pages on wider screens
    const isNarrow = typeof window !== 'undefined' && window.innerWidth < 680;
    const initialViewMode = isNarrow ? 'single' : 'double';

    this.bookCanvas = new BookCanvas({
      container: this.canvasWrapper,
      baseAssetPath: './assets',
      defaultViewMode: initialViewMode,
      onPageChange: (page, total) => this.updatePageIndicator(page, total),
    });

    if (isDev) {
      this.pageInspector = new PageInspectorModal(
        this.container,
        this.bookCanvas,
        async (issueId) => this.switchIssue(issueId)
      );
    }

    this.setupListeners();

    // 1. Initialize canvas textures & load initial magazine issue concurrently
    await Promise.all([
      this.bookCanvas.init(),
      this.loadIssue(this.currentIssueId, this.initialPage ?? 1),
    ]);

    // 2. Load custom Craftadia server pack (emojis & logos + Lithos HD font & book)
    const craftadiaPack = this.packManager.getPack('craftadia');
    if (craftadiaPack) {
      await this.bookCanvas.applyResourcePack(craftadiaPack).catch((err) => {
        console.warn('Could not apply server resource pack:', err);
      });
    }
  }

  private resolveInitialStateFromUrl(): void {
    if (typeof window === 'undefined') return;
    const validIds = WITCHCRAFT_MAGAZINE_ISSUES.flatMap(m => [m.id, ...(m.aliases || [])]);
    const parsed = parseBookUrl(window.location.href, validIds);
    if (parsed.issueId) {
      this.currentIssueId = parsed.issueId;
    }
    if (parsed.page !== null) {
      this.initialPage = parsed.page;
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
            <button class="nav-arrow-btn" id="btn-prev-issue" title="Previous Issue (Shift+Left or ◀)">◀</button>
            <div class="issue-scroll-container" id="issue-scroll-container" role="tablist" aria-label="Witch-Craft Magazine Issues">
              <div class="issue-scroll-track" id="issue-scroll-track">
                ${WITCHCRAFT_MAGAZINE_ISSUES.map(
                  m => `
                    <button class="issue-chip ${m.id === this.currentIssueId ? 'active' : ''}" 
                            data-issue-id="${m.id}" 
                            title="${m.title}"
                            role="tab"
                            aria-selected="${m.id === this.currentIssueId ? 'true' : 'false'}">
                      ${m.title}
                    </button>
                  `
                ).join('')}
              </div>
            </div>
            <button class="nav-arrow-btn" id="btn-next-issue" title="Next Issue (Shift+Right or ▶)">▶</button>
          </div>

          <div class="magazine-meta">
            <span class="magazine-page-info" id="magazine-page-info">1-2 / 16</span>
            <button class="nav-icon-btn" id="btn-share-page" title="Share link to this page (copies URL)" aria-label="Share link to this page">🔗</button>
            <button class="nav-icon-btn" id="btn-sound-toggle" title="Toggle Page Flip Sound">🔊</button>
            ${isDev ? `
              <button class="nav-icon-btn" id="btn-text-select-toggle" title="Enable Text Selection (T)">📝</button>
              <button class="nav-icon-btn" id="btn-inspector-toggle" title="Page & Line Inspector (I)">🔍</button>
            ` : ''}
          </div>
        </div>
      </header>

      <!-- Share toast notification -->
      <div class="share-toast" id="share-toast" role="status" aria-live="polite"></div>
    `;

    this.canvasWrapper = this.container.querySelector('#canvas-wrapper') as HTMLElement;
  }

  private async loadIssue(issueId: string, targetPage?: number): Promise<void> {
    const issue = WITCHCRAFT_MAGAZINE_ISSUES.find(m => m.id === issueId || m.aliases?.includes(issueId));
    if (!issue) return;

    this.currentIssueId = issue.id;
    const chips = this.container.querySelectorAll('.issue-chip') as NodeListOf<HTMLButtonElement>;
    chips.forEach(chip => {
      const match = chip.getAttribute('data-issue-id') === issueId;
      chip.classList.toggle('active', match);
      chip.setAttribute('aria-selected', match ? 'true' : 'false');
      if (match) {
        chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });

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

        const pageToOpen = targetPage ?? (this.initialPage ?? 1);
        this.initialPage = null; // consume initial page
        const total = this.bookCanvas.getTotalPages();
        let targetIndex = Math.max(0, Math.min(Math.max(0, total - 1), pageToOpen - 1));

        // Align spread start in double page mode
        if (this.bookCanvas.getViewMode() === 'double' && targetIndex % 2 === 1) {
          targetIndex -= 1;
        }

        this.bookCanvas.setPage(targetIndex);
        document.title = `${issue.title} · witchcraft...magazine`;
        this.pageInspector?.setIssueId(issueId);
      }
    } catch (err) {
      console.error('Failed to load magazine issue:', err);
    }
  }

  private setupListeners(): void {
    const prevIssueBtn = this.container.querySelector('#btn-prev-issue') as HTMLButtonElement;
    const nextIssueBtn = this.container.querySelector('#btn-next-issue') as HTMLButtonElement;
    const scrollContainer = this.container.querySelector('#issue-scroll-container') as HTMLElement;
    const chips = this.container.querySelectorAll('.issue-chip') as NodeListOf<HTMLButtonElement>;
    const shareBtn = this.container.querySelector('#btn-share-page') as HTMLButtonElement;
    const soundBtn = this.container.querySelector('#btn-sound-toggle') as HTMLButtonElement;
    const textSelectBtn = this.container.querySelector('#btn-text-select-toggle') as HTMLButtonElement;
    const inspectBtn = this.container.querySelector('#btn-inspector-toggle') as HTMLButtonElement;

    // Issue scroll selector dragging and mouse wheel navigation
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasDragged = false;

    if (scrollContainer) {
      // Horizontal mouse wheel scrolling
      scrollContainer.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0 && e.deltaX === 0) {
          e.preventDefault();
          scrollContainer.scrollLeft += e.deltaY;
        }
      }, { passive: false });

      // Drag to scroll
      scrollContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        hasDragged = false;
        startX = e.pageX - scrollContainer.offsetLeft;
        scrollLeft = scrollContainer.scrollLeft;
      });

      window.addEventListener('mouseup', () => {
        isDown = false;
      });

      scrollContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const x = e.pageX - scrollContainer.offsetLeft;
        const walk = x - startX;
        if (Math.abs(walk) > 4) {
          hasDragged = true;
          scrollContainer.scrollLeft = scrollLeft - walk;
        }
      });
    }

    chips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        if (hasDragged) {
          e.preventDefault();
          return;
        }
        const id = chip.getAttribute('data-issue-id');
        if (id) {
          this.switchIssue(id);
        }
      });
    });

    // Previous / Next issue buttons
    prevIssueBtn?.addEventListener('click', () => this.stepIssue(-1));
    nextIssueBtn?.addEventListener('click', () => this.stepIssue(1));

    // Share page button
    shareBtn?.addEventListener('click', () => this.handleShare());

    // Sound toggle button
    soundBtn?.addEventListener('click', () => {
      const active = soundManager.toggle();
      soundBtn.textContent = active ? '🔊' : '🔇';
      soundBtn.title = active ? 'Mute Sound' : 'Enable Sound';
    });

    // Text selection toggle button (off by default, dev-only)
    textSelectBtn?.addEventListener('click', () => {
      const next = !this.bookCanvas.isTextSelectionEnabled();
      this.bookCanvas.setTextSelectionEnabled(next);
      textSelectBtn.classList.toggle('active', next);
      textSelectBtn.title = next ? 'Disable Text Selection (T)' : 'Enable Text Selection (T)';
    });

    // Inspector toggle button (dev-only)
    inspectBtn?.addEventListener('click', () => {
      this.pageInspector?.toggle(this.currentIssueId);
    });

    // Keyboard shortcuts for issue navigation (Shift + Left / Shift + Right or [ / ]) and dev tools (T / I)
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
      } else if (isDev && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        const next = !this.bookCanvas.isTextSelectionEnabled();
        this.bookCanvas.setTextSelectionEnabled(next);
        const btn = this.container.querySelector('#btn-text-select-toggle') as HTMLButtonElement;
        btn?.classList.toggle('active', next);
        if (btn) btn.title = next ? 'Disable Text Selection (T)' : 'Enable Text Selection (T)';
      } else if (isDev && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        this.pageInspector?.toggle(this.currentIssueId);
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

    // Hash change listener for browser navigation (back/forward or manual hash entry)
    window.addEventListener('hashchange', () => {
      const validIds = WITCHCRAFT_MAGAZINE_ISSUES.flatMap(m => [m.id, ...(m.aliases || [])]);
      const parsed = parseBookUrl(window.location.hash, validIds);
      if (parsed.issueId && parsed.issueId !== this.currentIssueId) {
        this.loadIssue(parsed.issueId, parsed.page ?? 1);
      } else if (parsed.page !== null) {
        const total = this.bookCanvas.getTotalPages();
        let targetIndex = Math.max(0, Math.min(Math.max(0, total - 1), parsed.page - 1));
        if (this.bookCanvas.getViewMode() === 'double' && targetIndex % 2 === 1) {
          targetIndex -= 1;
        }
        if (this.bookCanvas.getCurrentPage() !== targetIndex) {
          this.bookCanvas.setPage(targetIndex);
        }
      }
    });
  }

  private switchIssue(issueId: string, page: number = 1): void {
    if (issueId === this.currentIssueId) {
      const total = this.bookCanvas.getTotalPages();
      let targetIndex = Math.max(0, Math.min(Math.max(0, total - 1), page - 1));
      if (this.bookCanvas.getViewMode() === 'double' && targetIndex % 2 === 1) {
        targetIndex -= 1;
      }
      this.bookCanvas.setPage(targetIndex);
      return;
    }
    window.location.hash = buildBookHash(issueId, page);
    this.loadIssue(issueId, page);
  }

  private stepIssue(delta: number): void {
    const currentIndex = WITCHCRAFT_MAGAZINE_ISSUES.findIndex(m => m.id === this.currentIssueId);
    if (currentIndex === -1) return;
    const nextIndex = currentIndex + delta;
    if (nextIndex >= 0 && nextIndex < WITCHCRAFT_MAGAZINE_ISSUES.length) {
      this.switchIssue(WITCHCRAFT_MAGAZINE_ISSUES[nextIndex].id, 1);
    }
  }

  private updatePageIndicator(currentPage: number, totalPages: number): void {
    const pageInfo = this.container.querySelector('#magazine-page-info') as HTMLElement;
    if (pageInfo) {
      const isDouble = this.bookCanvas.getViewMode() === 'double';
      if (isDouble && currentPage + 1 < totalPages && currentPage % 2 === 0) {
        pageInfo.textContent = `${currentPage + 1}-${currentPage + 2} / ${totalPages}`;
      } else {
        pageInfo.textContent = `${currentPage + 1} / ${totalPages}`;
      }
    }

    // Keep URL hash updated with current page without polluting back/forward navigation history
    const humanPage = currentPage + 1;
    const canonicalHash = buildBookHash(this.currentIssueId, humanPage);
    if (typeof window !== 'undefined' && window.location.hash !== canonicalHash) {
      window.history.replaceState(null, '', canonicalHash);
    }

    this.pageInspector?.onPageTurned();
  }

  private async handleShare(): Promise<void> {
    const shareBtn = this.container.querySelector('#btn-share-page') as HTMLButtonElement;
    const toast = this.container.querySelector('#share-toast') as HTMLElement;
    const humanPage = this.bookCanvas.getCurrentPage() + 1;
    const issue = WITCHCRAFT_MAGAZINE_ISSUES.find(m => m.id === this.currentIssueId);
    const issueTitle = issue ? issue.title : 'Magazine';
    const shareUrl = buildShareableUrl(this.currentIssueId, humanPage);

    let copied = false;
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      } catch {
        copied = false;
      }
    }

    if (!copied && typeof document !== 'undefined') {
      try {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        copied = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        copied = false;
      }
    }

    if (shareBtn) {
      const origText = shareBtn.textContent;
      shareBtn.textContent = '✓';
      shareBtn.classList.add('active');
      setTimeout(() => {
        shareBtn.textContent = origText;
        shareBtn.classList.remove('active');
      }, 1800);
    }

    if (toast) {
      if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
      }
      toast.innerHTML = copied
        ? `<span>✨</span> Copied link to <strong>${issueTitle}</strong> (Page ${humanPage})!`
        : `<span>🔗</span> Link: <code>${shareUrl}</code>`;
      toast.classList.add('show');
      this.toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
      }, 2600);
    }
  }
}
