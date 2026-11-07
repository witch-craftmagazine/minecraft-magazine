import { BookCanvas } from '../render/BookCanvas';
import { LineLayout, FormattedSpan } from '../engine/types';
import { BOOK_TEXT_WIDTH, LINES_PER_PAGE } from '../engine/StringSplitter';
import { WITCHCRAFT_MAGAZINE_ISSUES } from '../samples/sampleBooks';

export class PageInspectorModal {
  private container: HTMLElement;
  private overlay: HTMLElement;
  private bookCanvas: BookCanvas;
  private onIssueChange: (issueId: string) => Promise<void>;
  private isOpen = false;

  private currentIssueId: string = 'issue1';
  private selectedLineIndex: number | null = null;
  private activeTab: 'lines' | 'raw' = 'lines';

  constructor(
    container: HTMLElement,
    bookCanvas: BookCanvas,
    onIssueChange: (issueId: string) => Promise<void>
  ) {
    this.container = container;
    this.bookCanvas = bookCanvas;
    this.onIssueChange = onIssueChange;

    this.overlay = document.createElement('div');
    this.overlay.className = 'inspector-modal-overlay';
    this.overlay.style.display = 'none';
    this.container.appendChild(this.overlay);

    this.setupGlobalKeyListener();
  }

  public open(issueId?: string): void {
    if (issueId) {
      this.currentIssueId = issueId;
    }
    this.isOpen = true;
    this.overlay.style.display = 'flex';
    this.render();
  }

  public close(): void {
    this.isOpen = false;
    this.overlay.style.display = 'none';
    this.selectedLineIndex = null;
    this.bookCanvas.setHighlightedLine(null);
  }

  public toggle(issueId?: string): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open(issueId);
    }
  }

  public setIssueId(issueId: string): void {
    this.currentIssueId = issueId;
    if (this.isOpen) {
      this.render();
    }
  }

  public onPageTurned(): void {
    if (this.isOpen) {
      this.render();
    }
  }

  private setupGlobalKeyListener(): void {
    window.addEventListener('keydown', (e) => {
      // Toggle on 'i' or 'I' (when not in an input/textarea)
      if ((e.key === 'i' || e.key === 'I') && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  public render(): void {
    const totalPages = this.bookCanvas.getTotalPages();
    const currentPageIndex = this.bookCanvas.getCurrentPage();
    const pageLines = this.bookCanvas.getPageLines(currentPageIndex);
    const rawPageText = this.bookCanvas.getRawPageText(currentPageIndex);
    const atlas = this.bookCanvas.getAtlas();

    const isOverflowing = pageLines.length > LINES_PER_PAGE;

    this.overlay.innerHTML = `
      <div class="inspector-modal-card">
        <div class="inspector-header">
          <div class="inspector-title-area">
            <h3 class="inspector-title">🔍 Page & Line Inspector</h3>
            <span class="inspector-subtitle">Diagnostic layout tool for Minecraft magazine pages</span>
          </div>
          <button class="inspector-close-btn" title="Close Inspector (Esc)">✕</button>
        </div>

        <div class="inspector-controls-bar">
          <div class="inspector-control-group">
            <label class="inspector-label">Issue:</label>
            <select class="inspector-issue-select">
              ${WITCHCRAFT_MAGAZINE_ISSUES.map(issue => `
                <option value="${issue.id}" ${issue.id === this.currentIssueId ? 'selected' : ''}>
                  ${issue.title} (${issue.id})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="inspector-control-group">
            <button class="inspector-nav-btn prev-page-btn" ${currentPageIndex <= 0 ? 'disabled' : ''}>◀ Prev</button>
            <div class="inspector-page-pill">
              Page 
              <input type="number" class="inspector-page-input" min="1" max="${Math.max(1, totalPages)}" value="${currentPageIndex + 1}">
              of ${Math.max(1, totalPages)}
            </div>
            <button class="inspector-nav-btn next-page-btn" ${currentPageIndex >= totalPages - 1 ? 'disabled' : ''}>Next ▶</button>
          </div>

          <div class="inspector-control-group">
            <label class="inspector-checkbox-label">
              <input type="checkbox" class="inspector-grid-toggle">
              Show Canvas Layout Grid
            </label>
          </div>
        </div>

        <div class="inspector-stats-row">
          <div class="inspector-stat-pill ${isOverflowing ? 'stat-warning' : 'stat-success'}">
            <strong>Lines:</strong> ${pageLines.length} / ${LINES_PER_PAGE}
            ${isOverflowing ? `⚠ (+${pageLines.length - LINES_PER_PAGE} overflow past line 14)` : '✓ All fit on page'}
          </div>
          <div class="inspector-stat-pill">
            <strong>Characters:</strong> ${rawPageText.length} chars
          </div>
          <div class="inspector-stat-pill">
            <strong>Page Width Limit:</strong> ${BOOK_TEXT_WIDTH} px
          </div>
        </div>

        <div class="inspector-tabs">
          <button class="inspector-tab-btn ${this.activeTab === 'lines' ? 'active' : ''}" data-tab="lines">
            Line Breakdown (${pageLines.length})
          </button>
          <button class="inspector-tab-btn ${this.activeTab === 'raw' ? 'active' : ''}" data-tab="raw">
            Raw Stendhal Text
          </button>
        </div>

        <div class="inspector-content-body">
          ${this.activeTab === 'lines' ? this.renderLinesTab(pageLines, atlas) : this.renderRawTab(rawPageText)}
        </div>
      </div>
    `;

    this.bindEvents(currentPageIndex, totalPages);
  }

  private renderLinesTab(pageLines: LineLayout[], atlas: any): string {
    if (pageLines.length === 0) {
      return '<div class="inspector-empty-state">No lines found on this page.</div>';
    }

    return `
      <div class="inspector-lines-list">
        ${pageLines.map((line, idx) => {
          const lineNum = idx + 1;
          const isOver14 = lineNum > LINES_PER_PAGE;
          const isSelected = this.selectedLineIndex === idx;
          const text = line.spans.map(s => s.text).join('');
          const width = line.width;
          const widthPct = Math.min(100, Math.round((width / BOOK_TEXT_WIDTH) * 100));

          let widthClass = 'width-ok';
          if (width > BOOK_TEXT_WIDTH) widthClass = 'width-exceed';
          else if (width >= BOOK_TEXT_WIDTH - 4) widthClass = 'width-near';

          return `
            <div class="inspector-line-row ${isSelected ? 'row-selected' : ''} ${isOver14 ? 'row-overflow-line' : ''}" data-line-index="${idx}">
              <div class="line-row-summary">
                <span class="line-num-badge ${isOver14 ? 'badge-warn' : ''}">#${lineNum}</span>
                <span class="line-text-preview" title="${this.escapeHtml(text)}">${text.length === 0 ? '<em class="empty-line-hint">&lt;blank line&gt;</em>' : this.escapeHtml(text)}</span>
                
                <div class="line-metrics">
                  <div class="line-bar-wrap">
                    <div class="line-bar-fill ${widthClass}" style="width: ${widthPct}%"></div>
                  </div>
                  <span class="line-width-label ${widthClass}">${width} / ${BOOK_TEXT_WIDTH} px</span>
                  ${isOver14 ? '<span class="line-status-pill pill-overflow">Exceeds 14</span>' : ''}
                </div>
              </div>

              ${isSelected ? this.renderLineDetail(line, atlas) : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  private renderLineDetail(line: LineLayout, atlas: any): string {
    return `
      <div class="line-detail-box">
        <h5 class="detail-subtitle">Character & Glyph Breakdown:</h5>
        <div class="glyph-token-chips">
          ${line.spans.flatMap((span: FormattedSpan) => {
            return span.text.split('').map((char: string) => {
              const codePoint = 'U+' + (char.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0') || '0000');
              const adv = atlas.getAdvance(char, span.bold);
              return `
                <div class="glyph-chip" title="${char} | ${codePoint} | Advance: ${adv}px | Color: ${span.color}">
                  <span class="glyph-char" style="color: ${span.color}; font-weight: ${span.bold ? 'bold' : 'normal'}">${char === ' ' ? '␣' : char}</span>
                  <span class="glyph-adv">${adv}px</span>
                  <span class="glyph-code">${codePoint}</span>
                </div>
              `;
            });
          }).join('')}
        </div>

        <div class="span-properties-list">
          <h5 class="detail-subtitle">Formatted Spans (${line.spans.length}):</h5>
          ${line.spans.map((span: FormattedSpan, sIdx: number) => `
            <div class="span-prop-row">
              <span class="span-num">Span #${sIdx + 1}:</span>
              <span class="span-color-badge" style="background-color: ${span.color}"></span>
              <code>${span.color}</code>
              ${span.bold ? '<span class="style-tag">Bold</span>' : ''}
              ${span.italic ? '<span class="style-tag">Italic</span>' : ''}
              ${span.underlined ? '<span class="style-tag">Underlined</span>' : ''}
              ${span.strikethrough ? '<span class="style-tag">Strikethrough</span>' : ''}
              <span class="span-text">"${this.escapeHtml(span.text)}"</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private renderRawTab(rawText: string): string {
    const rawLines = rawText.split('\n');
    return `
      <div class="inspector-raw-container">
        <div class="raw-meta-banner">
          Stendhal Source Text (${rawLines.length} source lines, ${rawText.length} characters):
        </div>
        <pre class="inspector-raw-pre">${rawLines.map((l, i) => `<span class="raw-line-num">${(i + 1).toString().padStart(2, ' ')}:</span> ${this.escapeHtml(l)}`).join('\n')}</pre>
      </div>
    `;
  }

  private bindEvents(currentPageIndex: number, totalPages: number): void {
    // Close button
    const closeBtn = this.overlay.querySelector('.inspector-close-btn');
    closeBtn?.addEventListener('click', () => this.close());

    // Click outside modal card to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Issue select
    const issueSelect = this.overlay.querySelector('.inspector-issue-select') as HTMLSelectElement;
    issueSelect?.addEventListener('change', async (e) => {
      const newIssue = (e.target as HTMLSelectElement).value;
      this.currentIssueId = newIssue;
      await this.onIssueChange(newIssue);
      this.render();
    });

    // Prev / Next page buttons
    const prevBtn = this.overlay.querySelector('.prev-page-btn');
    prevBtn?.addEventListener('click', () => {
      if (currentPageIndex > 0) {
        this.bookCanvas.setPage(currentPageIndex - 1);
        this.render();
      }
    });

    const nextBtn = this.overlay.querySelector('.next-page-btn');
    nextBtn?.addEventListener('click', () => {
      if (currentPageIndex < totalPages - 1) {
        this.bookCanvas.setPage(currentPageIndex + 1);
        this.render();
      }
    });

    // Numeric page input
    const pageInput = this.overlay.querySelector('.inspector-page-input') as HTMLInputElement;
    pageInput?.addEventListener('change', () => {
      const val = parseInt(pageInput.value, 10);
      if (!isNaN(val) && val >= 1 && val <= totalPages) {
        this.bookCanvas.setPage(val - 1);
        this.render();
      }
    });

    // Layout grid toggle
    const gridToggle = this.overlay.querySelector('.inspector-grid-toggle') as HTMLInputElement;
    if (gridToggle) {
      gridToggle.checked = (this.bookCanvas as any).showLayoutGrid;
      gridToggle.addEventListener('change', () => {
        this.bookCanvas.setShowLayoutGrid(gridToggle.checked);
      });
    }

    // Tabs
    const tabBtns = this.overlay.querySelectorAll('.inspector-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = (btn.getAttribute('data-tab') as any) || 'lines';
        this.render();
      });
    });

    // Line row selection
    const lineRows = this.overlay.querySelectorAll('.inspector-line-row');
    lineRows.forEach(row => {
      row.addEventListener('click', () => {
        const lineIdx = parseInt(row.getAttribute('data-line-index') || '-1', 10);
        if (this.selectedLineIndex === lineIdx) {
          this.selectedLineIndex = null;
          this.bookCanvas.setHighlightedLine(null);
        } else {
          this.selectedLineIndex = lineIdx;
          this.bookCanvas.setHighlightedLine(lineIdx);
        }
        this.render();
      });
    });
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
