import { MinecraftBook } from '../engine/types';
import { MINECRAFT_COLORS, COLOR_NAMES } from '../engine/Formatting';
import { splitTextToLines, LINES_PER_PAGE, BOOK_TEXT_WIDTH } from '../engine/StringSplitter';

export class EditorModal {
  private backdrop: HTMLElement;
  private currentBook: MinecraftBook | null = null;
  private activePageIndex = 0;
  private onSave: (book: MinecraftBook) => void;

  constructor(onSave: (book: MinecraftBook) => void) {
    this.onSave = onSave;

    this.backdrop = document.createElement('div');
    this.backdrop.className = 'modal-backdrop';
    this.backdrop.style.display = 'none';

    this.backdrop.innerHTML = `
      <div class="modal-card editor-card">
        <div class="modal-header">
          <h3>Edit Minecraft Book</h3>
          <button class="modal-close-btn" id="editor-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="editor-meta-row">
            <div class="meta-field">
              <label for="edit-title">Title:</label>
              <input type="text" id="edit-title" />
            </div>
            <div class="meta-field">
              <label for="edit-author">Author:</label>
              <input type="text" id="edit-author" />
            </div>
          </div>

          <div class="editor-toolbar">
            <div class="color-palette" id="color-palette"></div>
            <div class="style-buttons">
              <button class="fmt-btn" data-code="§l" title="Bold"><strong>B</strong></button>
              <button class="fmt-btn" data-code="§o" title="Italic"><em>I</em></button>
              <button class="fmt-btn" data-code="§n" title="Underline"><u>U</u></button>
              <button class="fmt-btn" data-code="§m" title="Strikethrough"><s>S</s></button>
              <button class="fmt-btn" data-code="§k" title="Obfuscated">ᛗ</button>
              <button class="fmt-btn" data-code="§r" title="Reset Formatting">↺</button>
            </div>
          </div>

          <div class="editor-page-bar">
            <button class="btn btn-sm" id="page-prev-btn">&laquo; Prev</button>
            <select id="editor-page-select"></select>
            <button class="btn btn-sm" id="page-next-btn">Next &raquo;</button>
            <button class="btn btn-sm btn-success" id="add-page-btn">+ Add Page</button>
            <button class="btn btn-sm btn-danger" id="del-page-btn">- Delete</button>
          </div>

          <div class="editor-textarea-wrapper">
            <textarea id="editor-page-textarea" rows="14"></textarea>
            <div class="page-metrics-bar" id="page-metrics">
              <span id="line-counter">Lines: 0 / 14</span>
              <span id="overflow-warning" class="warning-text" style="display: none;">⚠️ Exceeds 14 lines or 114px width</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="editor-cancel-btn">Cancel</button>
          <button class="btn btn-primary" id="editor-save-btn">Apply Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.backdrop);
    this.buildColorPalette();
    this.setupListeners();
  }

  private buildColorPalette(): void {
    const palette = this.backdrop.querySelector('#color-palette') as HTMLElement;
    for (const [code, hex] of Object.entries(MINECRAFT_COLORS)) {
      const btn = document.createElement('button');
      btn.className = 'color-btn';
      btn.style.backgroundColor = hex;
      btn.title = `${COLOR_NAMES[code]} (§${code})`;
      btn.setAttribute('data-code', `§${code}`);
      if (hex === '#000000') btn.style.border = '1px solid #777';
      palette.appendChild(btn);
    }
  }

  private setupListeners(): void {
    const closeBtn = this.backdrop.querySelector('#editor-close-btn') as HTMLElement;
    const cancelBtn = this.backdrop.querySelector('#editor-cancel-btn') as HTMLElement;
    const saveBtn = this.backdrop.querySelector('#editor-save-btn') as HTMLElement;
    const pageSelect = this.backdrop.querySelector('#editor-page-select') as HTMLSelectElement;
    const prevBtn = this.backdrop.querySelector('#page-prev-btn') as HTMLElement;
    const nextBtn = this.backdrop.querySelector('#page-next-btn') as HTMLElement;
    const addPageBtn = this.backdrop.querySelector('#add-page-btn') as HTMLElement;
    const delPageBtn = this.backdrop.querySelector('#del-page-btn') as HTMLElement;
    const textarea = this.backdrop.querySelector('#editor-page-textarea') as HTMLTextAreaElement;

    const close = () => this.hide();
    closeBtn.onclick = close;
    cancelBtn.onclick = close;
    this.backdrop.onclick = (e) => {
      if (e.target === this.backdrop) close();
    };

    // Format buttons
    this.backdrop.querySelectorAll('.fmt-btn, .color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        if (!code) return;
        this.insertFormattingCode(code, textarea);
      });
    });

    textarea.addEventListener('input', () => {
      if (!this.currentBook) return;
      this.currentBook.pages[this.activePageIndex] = textarea.value;
      this.updateMetrics();
    });

    pageSelect.addEventListener('change', () => {
      this.activePageIndex = parseInt(pageSelect.value, 10);
      this.loadCurrentPageToTextarea();
    });

    prevBtn.onclick = () => {
      if (this.activePageIndex > 0) {
        this.activePageIndex--;
        this.refreshPageSelector();
        this.loadCurrentPageToTextarea();
      }
    };

    nextBtn.onclick = () => {
      if (this.currentBook && this.activePageIndex < this.currentBook.pages.length - 1) {
        this.activePageIndex++;
        this.refreshPageSelector();
        this.loadCurrentPageToTextarea();
      }
    };

    addPageBtn.onclick = () => {
      if (!this.currentBook) return;
      this.currentBook.pages.splice(this.activePageIndex + 1, 0, '');
      this.activePageIndex++;
      this.refreshPageSelector();
      this.loadCurrentPageToTextarea();
    };

    delPageBtn.onclick = () => {
      if (!this.currentBook) return;
      if (this.currentBook.pages.length <= 1) {
        this.currentBook.pages = [''];
      } else {
        this.currentBook.pages.splice(this.activePageIndex, 1);
        if (this.activePageIndex >= this.currentBook.pages.length) {
          this.activePageIndex = this.currentBook.pages.length - 1;
        }
      }
      this.refreshPageSelector();
      this.loadCurrentPageToTextarea();
    };

    saveBtn.onclick = () => {
      if (!this.currentBook) return;
      const titleInput = this.backdrop.querySelector('#edit-title') as HTMLInputElement;
      const authorInput = this.backdrop.querySelector('#edit-author') as HTMLInputElement;

      this.currentBook.title = titleInput.value.trim() || 'Untitled Book';
      this.currentBook.author = authorInput.value.trim() || 'Anonymous';
      this.currentBook.pages[this.activePageIndex] = textarea.value;

      this.onSave(this.currentBook);
      this.hide();
    };
  }

  private insertFormattingCode(code: string, textarea: HTMLTextAreaElement): void {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    if (start === end) {
      textarea.value = text.substring(0, start) + code + text.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + code.length;
    } else {
      const selected = text.substring(start, end);
      textarea.value = text.substring(0, start) + code + selected + '§r' + text.substring(end);
      textarea.selectionStart = start + code.length;
      textarea.selectionEnd = start + code.length + selected.length;
    }

    textarea.focus();
    if (this.currentBook) {
      this.currentBook.pages[this.activePageIndex] = textarea.value;
    }
    this.updateMetrics();
  }

  private refreshPageSelector(): void {
    if (!this.currentBook) return;
    const select = this.backdrop.querySelector('#editor-page-select') as HTMLSelectElement;
    select.innerHTML = '';
    for (let i = 0; i < this.currentBook.pages.length; i++) {
      const opt = document.createElement('option');
      opt.value = i.toString();
      opt.textContent = `Page ${i + 1} of ${this.currentBook.pages.length}`;
      if (i === this.activePageIndex) opt.selected = true;
      select.appendChild(opt);
    }
  }

  private loadCurrentPageToTextarea(): void {
    if (!this.currentBook) return;
    const textarea = this.backdrop.querySelector('#editor-page-textarea') as HTMLTextAreaElement;
    textarea.value = this.currentBook.pages[this.activePageIndex] || '';
    this.updateMetrics();
  }

  private updateMetrics(): void {
    const textarea = this.backdrop.querySelector('#editor-page-textarea') as HTMLTextAreaElement;
    const lineCounter = this.backdrop.querySelector('#line-counter') as HTMLElement;
    const warning = this.backdrop.querySelector('#overflow-warning') as HTMLElement;

    const wrappedLines = splitTextToLines(textarea.value, BOOK_TEXT_WIDTH);
    lineCounter.textContent = `Lines: ${wrappedLines.length} / ${LINES_PER_PAGE}`;

    if (wrappedLines.length > LINES_PER_PAGE) {
      warning.style.display = 'inline';
      lineCounter.style.color = '#ff5555';
    } else {
      warning.style.display = 'none';
      lineCounter.style.color = 'inherit';
    }
  }

  public show(book: MinecraftBook, activePage = 0): void {
    // Deep clone book to prevent mutating until Save
    this.currentBook = {
      title: book.title,
      author: book.author,
      generation: book.generation,
      pages: [...book.pages],
    };
    this.activePageIndex = Math.max(0, Math.min(this.currentBook.pages.length - 1, activePage));

    const titleInput = this.backdrop.querySelector('#edit-title') as HTMLInputElement;
    const authorInput = this.backdrop.querySelector('#edit-author') as HTMLInputElement;
    titleInput.value = this.currentBook.title;
    authorInput.value = this.currentBook.author;

    this.refreshPageSelector();
    this.loadCurrentPageToTextarea();
    this.backdrop.style.display = 'flex';
  }

  public hide(): void {
    this.backdrop.style.display = 'none';
  }
}
