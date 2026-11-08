import { describe, it, expect, beforeEach } from 'vitest';
import { BookCanvas } from '../src/render/BookCanvas';
import { MinecraftBook } from '../src/engine/types';
import { defaultGlyphAtlas } from '../src/engine/GlyphAtlas';
import { parseStendhalBook } from '../src/io/BookParser';

describe('Witchcraft Magazine Blinking Eye Easter Egg', () => {
  let mockContainer: any;
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
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
      fillText: () => {},
      measureText: () => ({ width: 12 }),
      getImageData: () => ({ data: new Uint8ClampedArray(32 * 32 * 4) }),
      setLineDash: () => {},
      clearRect: () => {},
      rect: () => {},
      clip: () => {},
      imageSmoothingEnabled: false,
    };

    const makeEl = (tag: string) => {
      const el: any = {
        tagName: tag.toUpperCase(),
        className: '',
        classList: {
          toggle: () => {},
          contains: () => false,
        },
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

  it('detects StarSweetpea as Witchcraft Magazine and enables easter egg', () => {
    const canvas = new BookCanvas({ container: mockContainer });
    const book: MinecraftBook = {
      title: 'Witchcraft Magazine Issue #1',
      author: 'StarSweetpea',
      pages: ['Cover page with eye: /( ⏼\\'],
    };

    canvas.setBook(book);
    expect(canvas.getIsWitchcraftMagazine()).toBe(true);
    expect(canvas.getHasEyeOnCurrentPage()).toBe(true);
  });

  it('does NOT enable easter egg for non-Witchcraft books even if they contain the eye symbol', () => {
    const canvas = new BookCanvas({ container: mockContainer });
    const normalBook: MinecraftBook = {
      title: 'Random Notes',
      author: 'Steve',
      pages: ['Here is a symbol /( ⏼\\ on a normal book'],
    };

    canvas.setBook(normalBook);
    expect(canvas.getIsWitchcraftMagazine()).toBe(false);
    expect(canvas.getHasEyeOnCurrentPage()).toBe(false);
  });

  it('allows manual override via setIsWitchcraftMagazine', () => {
    const canvas = new BookCanvas({ container: mockContainer });
    const book: MinecraftBook = {
      title: 'Manual Test Book',
      author: 'Alex',
      pages: ['Page with eye: ☘(⏼⏼))'],
    };

    canvas.setBook(book);
    expect(canvas.getIsWitchcraftMagazine()).toBe(false);
    expect(canvas.getHasEyeOnCurrentPage()).toBe(false);

    canvas.setIsWitchcraftMagazine(true);
    expect(canvas.getIsWitchcraftMagazine()).toBe(true);
    expect(canvas.getHasEyeOnCurrentPage()).toBe(true);

    canvas.setIsWitchcraftMagazine(false);
    expect(canvas.getIsWitchcraftMagazine()).toBe(false);
    expect(canvas.getHasEyeOnCurrentPage()).toBe(false);
  });

  it('tracks eye presence accurately across pages and view modes', () => {
    const canvas = new BookCanvas({ container: mockContainer, defaultViewMode: 'single' });
    const book: MinecraftBook = {
      title: 'Witchcraft Magazine Vol. 1',
      author: 'StarSweetpea',
      pages: [
        'Page 1: Witch /( ⏼\\',  // page 0: has eye
        'Page 2: Just plain text',  // page 1: no eye
        'Page 3: Fern mascot ☘(⏼⏼))', // page 2: has eye
      ],
    };

    canvas.setBook(book);
    expect(canvas.getCurrentPage()).toBe(0);
    expect(canvas.getHasEyeOnCurrentPage()).toBe(true);

    // Turn to page 2 (index 1) - no eye
    canvas.nextPage();
    expect(canvas.getCurrentPage()).toBe(1);
    expect(canvas.getHasEyeOnCurrentPage()).toBe(false);

    // Switch to double page mode - spread of page 1 and page 2 (index 2 has eye)
    canvas.setViewMode('double');
    expect(canvas.getHasEyeOnCurrentPage()).toBe(true);

    // Turn back to single page mode
    canvas.setViewMode('single');
    canvas.setPage(1);
    expect(canvas.getHasEyeOnCurrentPage()).toBe(false);
    canvas.setPage(2);
    expect(canvas.getHasEyeOnCurrentPage()).toBe(true);
  });

  it('preserves advance between ⏼ (8px) and ◡ to guarantee zero text reflow', () => {
    const atlas = defaultGlyphAtlas;
    const eyeAdvance = atlas.getAdvance('⏼', false);
    const blinkAdvance = atlas.getAdvance('◡', false);

    expect(eyeAdvance).toBe(8);
    expect(blinkAdvance).toBe(7);

    // Bold advance
    const boldEyeAdvance = atlas.getAdvance('⏼', true);
    expect(boldEyeAdvance).toBe(9);
  });

  it('manages blink trigger and resets on page turn', () => {
    const canvas = new BookCanvas({ container: mockContainer });
    const book: MinecraftBook = {
      title: 'Witchcraft Magazine',
      author: 'StarSweetpea',
      pages: [
        '/( ⏼\\ on page 1',
        'Normal text on page 2',
      ],
    };

    canvas.setBook(book);
    expect(canvas.getIsBlinkingEye()).toBe(false);

    // Trigger blink
    canvas.triggerBlink();
    expect(canvas.getIsBlinkingEye()).toBe(true);

    // Turn page - blink state must cleanly reset
    canvas.nextPage();
    expect(canvas.getIsBlinkingEye()).toBe(false);
  });

  it('populates eye hitboxes during render for interactive winks', () => {
    const canvas = new BookCanvas({ container: mockContainer });
    (canvas as any).bookBg = { naturalWidth: 256, naturalHeight: 256 };
    const book: MinecraftBook = {
      title: 'Witchcraft Magazine',
      author: 'StarSweetpea',
      pages: [
        '/( ⏼\\ on page 1',
      ],
    };

    canvas.setBook(book);
    const hitBoxes = (canvas as any).eyeHitBoxes;
    expect(hitBoxes).toBeDefined();
    expect(hitBoxes.length).toBeGreaterThan(0);
    expect(hitBoxes[0].w).toBe(12);
    expect(hitBoxes[0].h).toBe(12);
  });

  it('verifies eye symbol in Stendhal content authored by StarSweetpea', () => {
    const rawStendhal = `title: Witchcraft Magazine Issue #1
author: StarSweetpea
pages:
#-
             /( ⏼\\
            /  / \\
           /  /   \\
          /  /     \\
         /  /       \\
#-
Normal page 2 text`;

    const book = parseStendhalBook(rawStendhal);
    expect(book).not.toBeNull();
    if (!book) return;

    expect(book.author).toBe('StarSweetpea');
    expect(book.pages[0]).toContain('⏼');

    const canvas = new BookCanvas({ container: mockContainer });
    canvas.setBook(book);
    expect(canvas.getIsWitchcraftMagazine()).toBe(true);
    expect(canvas.getHasEyeOnCurrentPage()).toBe(true);
  });
});
