import { describe, it, expect, beforeEach } from 'vitest';
import { BookCanvas } from '../src/render/BookCanvas';
import { MinecraftBook } from '../src/engine/types';

describe('Accessibility Text Layer & Arrow Symmetry', () => {
  let mockContainer: any;

  beforeEach(() => {
    const mockCtx = {
      save: () => {},
      restore: () => {},
      scale: () => {},
      translate: () => {},
      drawImage: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fillRect: () => {},
      setLineDash: () => {},
      imageSmoothingEnabled: false,
    };

    const makeEl = (tag: string) => {
      const el: any = {
        tagName: tag.toUpperCase(),
        className: '',
        style: {},
        children: [] as any[],
        attributes: {} as Record<string, string>,
        _innerHTML: '',
        get innerHTML() {
          return this._innerHTML;
        },
        set innerHTML(val: string) {
          this._innerHTML = val;
          if (val === '') {
            this.children = [];
          }
        },
        textContent: '',
        setAttribute(k: string, v: string) {
          this.attributes[k] = v;
        },
        getAttribute(k: string) {
          return this.attributes[k];
        },
        appendChild(child: any) {
          this.children.push(child);
          return child;
        },
        addEventListener() {},
        removeEventListener() {},
        closest: () => null,
      };
      if (tag === 'canvas') {
        el.getContext = () => mockCtx;
      }
      return el;
    };

    (globalThis as any).document = {
      createElement: makeEl,
    };
    (globalThis as any).window = {
      addEventListener() {},
      removeEventListener() {},
      getSelection: () => ({ toString: () => '' }),
    };

    mockContainer = makeEl('div');
  });

  const sampleBook: MinecraftBook = {
    title: 'Accessibility Issue',
    author: 'Steve',
    pages: [
      '§6§lChapter 1§r\nWelcome to our magazine!\nEnjoy your stay.',
      '§bPage 2 contents here§r\nMore lore and stories.',
      '§aPage 3 contents here§r\nEven more text.',
      '§cFinal Page 4§r\nThe end.',
    ],
  };

  it('guarantees arrow symmetry in two-page mode', () => {
    const TWO_PAGE_WIDTH = 342;
    const SPINE_X = TWO_PAGE_WIDTH / 2; // 171
    const ARROW_WIDTH = 23;

    // Double page mode left backward button:
    const leftArrowX = 53;
    const leftArrowRight = leftArrowX + ARROW_WIDTH; // 76
    const leftDistanceToOuterEdge = leftArrowX; // 53px
    const leftDistanceToSpine = SPINE_X - leftArrowRight; // 171 - 76 = 95px

    // Double page mode right forward button:
    // RIGHT_PAGE_X = 150. forwardButtonX = 150 + 116 = 266.
    const rightArrowX = 150 + 116; // 266
    const rightArrowRight = rightArrowX + ARROW_WIDTH; // 289
    const rightDistanceToOuterEdge = TWO_PAGE_WIDTH - rightArrowRight; // 342 - 289 = 53px
    const rightDistanceToSpine = rightArrowX - SPINE_X; // 266 - 171 = 95px

    // Verify perfect symmetry
    expect(leftDistanceToOuterEdge).toBe(rightDistanceToOuterEdge);
    expect(leftDistanceToOuterEdge).toBe(53);

    expect(leftDistanceToSpine).toBe(rightDistanceToSpine);
    expect(leftDistanceToSpine).toBe(95);
  });

  it('correctly performs hitTestButtons with the symmetrical double-page positions', () => {
    const bookCanvas = new BookCanvas({
      container: mockContainer,
      defaultViewMode: 'double',
    });
    bookCanvas.setScale(1);
    bookCanvas.setBook(sampleBook);

    // In double mode, current page is 0, right page is 1.
    // Backward button is disabled on page 0. Forward button is enabled.
    expect(bookCanvas.hitTestButtons(53, 160)).toBeNull(); // page 0 can't go backward
    expect(bookCanvas.hitTestButtons(266, 160)).toBe('forward');
    expect(bookCanvas.hitTestButtons(289, 160)).toBe('forward');
    expect(bookCanvas.hitTestButtons(265, 160)).toBeNull(); // just outside left
    expect(bookCanvas.hitTestButtons(290, 160)).toBeNull(); // just outside right

    // Move to page 2 (left: 2, right: 3)
    bookCanvas.setPage(2);
    // Backward button is now enabled at (53..76, 157..170)
    expect(bookCanvas.hitTestButtons(53, 160)).toBe('backward');
    expect(bookCanvas.hitTestButtons(76, 160)).toBe('backward');
    expect(bookCanvas.hitTestButtons(52, 160)).toBeNull(); // just outside left
    expect(bookCanvas.hitTestButtons(77, 160)).toBeNull(); // just outside right

    // On page 2 (with page 3 as right page in a 4-page book), page 3 is the last page, so forward is disabled
    expect(bookCanvas.hitTestButtons(266, 160)).toBeNull();
  });

  it('correctly performs hitTestButtons in single-page mode', () => {
    const bookCanvas = new BookCanvas({
      container: mockContainer,
      defaultViewMode: 'single',
    });
    bookCanvas.setScale(1);
    bookCanvas.setBook(sampleBook);

    // Page 0: backward disabled, forward enabled at (116..139)
    expect(bookCanvas.hitTestButtons(43, 160)).toBeNull();
    expect(bookCanvas.hitTestButtons(116, 160)).toBe('forward');
    expect(bookCanvas.hitTestButtons(139, 160)).toBe('forward');

    // Page 1: both backward and forward enabled
    bookCanvas.setPage(1);
    expect(bookCanvas.hitTestButtons(43, 160)).toBe('backward');
    expect(bookCanvas.hitTestButtons(66, 160)).toBe('backward');
    expect(bookCanvas.hitTestButtons(116, 160)).toBe('forward');
  });

  it('generates accessible DOM text layer with stripped formatting and ARIA roles', () => {
    const bookCanvas = new BookCanvas({
      container: mockContainer,
      defaultViewMode: 'double',
    });
    bookCanvas.setScale(2);
    bookCanvas.setBook(sampleBook);

    // Inspect the text layer element inside the book-stage
    const stageEl = mockContainer.children[0];
    expect(stageEl.className).toBe('book-stage');
    expect(stageEl.getAttribute('role')).toBe('region');
    expect(stageEl.getAttribute('aria-label')).toBe('Minecraft Magazine Reader');

    const textLayerEl = stageEl.children.find((c: any) => c.className === 'book-text-layer');
    expect(textLayerEl).toBeDefined();
    expect(textLayerEl.getAttribute('aria-live')).toBe('polite');

    // There should be 2 page sections for double mode (Page 1 and Page 2)
    expect(textLayerEl.children.length).toBe(2);

    const leftSection = textLayerEl.children[0];
    expect(leftSection.getAttribute('aria-label')).toBe('Page 1 of 4');

    const heading = leftSection.children.find((c: any) => c.className === 'sr-only');
    expect(heading.textContent).toBe('Page 1 of 4');

    // Check accessible lines inside left section
    const lines = leftSection.children.filter((c: any) => c.className === 'accessible-line');
    expect(lines.length).toBeGreaterThan(0);

    // Text formatting symbols (§) must be completely stripped from screen reader text
    const firstLineText = lines[0].textContent;
    expect(firstLineText).not.toContain('§');
    expect(firstLineText).toBe('Chapter 1');

    // Check scale application: scale was 2, line height should be 18px (9 * 2)
    expect(lines[0].style.fontSize).toBe('18px');
    expect(lines[0].style.lineHeight).toBe('18px');

    // Check accessible navigation button on right page
    const rightSection = textLayerEl.children[1];
    expect(rightSection.getAttribute('aria-label')).toBe('Page 2 of 4');
    const nextBtn = rightSection.children.find((c: any) => c.className?.includes('accessible-next-btn'));
    expect(nextBtn).toBeDefined();
    expect(nextBtn.getAttribute('aria-label')).toBe('Turn forward to page 3');
  });
});
