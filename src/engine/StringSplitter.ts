import { FormattedSpan, LineLayout } from './types';
import { GlyphAtlas, defaultGlyphAtlas } from './GlyphAtlas';
import { parseFormattedText } from './Formatting';

export const BOOK_TEXT_WIDTH = 114;
export const LINES_PER_PAGE = 14;
export const LINE_HEIGHT = 9;

/**
 * Calculates the visual pixel width of a formatted span.
 */
export function measureSpanWidth(span: FormattedSpan, atlas: GlyphAtlas = defaultGlyphAtlas): number {
  let width = 0;
  for (const char of span.text) {
    width += atlas.getAdvance(char, span.bold);
  }
  return width;
}

/**
 * Calculates total pixel width of an array of spans.
 */
export function measureLineWidth(spans: FormattedSpan[], atlas: GlyphAtlas = defaultGlyphAtlas): number {
  return spans.reduce((sum, s) => sum + measureSpanWidth(s, atlas), 0);
}

/**
 * Splits a formatted text string (with § codes and \n) into wrapped lines
 * fitting within maxWidth (default 114px).
 * Styles are seamlessly carried over across wrapped lines.
 */
export function splitTextToLines(
  rawText: string,
  maxWidth = BOOK_TEXT_WIDTH,
  atlas: GlyphAtlas = defaultGlyphAtlas
): LineLayout[] {
  // Normalize newlines
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const paragraphs = text.split('\n');
  const resultLines: LineLayout[] = [];

  let carriedStyle = {
    color: '#000000',
    bold: false,
    italic: false,
    underlined: false,
    strikethrough: false,
    obfuscated: false,
  };

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const paragraph = paragraphs[pIdx];
    if (paragraph.length === 0) {
      // Empty line / paragraph gap
      resultLines.push({ spans: [], width: 0 });
      continue;
    }

    const spans = parseFormattedText(paragraph, carriedStyle);
    if (spans.length === 0) {
      resultLines.push({ spans: [], width: 0 });
      continue;
    }

    // Wrap the tokens in this paragraph
    let currentLineSpans: FormattedSpan[] = [];
    let currentLineWidth = 0;
    let isWrappedLine = false;

    for (const span of spans) {
      // Remember the last style seen
      carriedStyle = {
        color: span.color,
        bold: span.bold,
        italic: span.italic,
        underlined: span.underlined,
        strikethrough: span.strikethrough,
        obfuscated: span.obfuscated,
      };

      // Split span into words and spaces to allow breaking at whitespace
      const tokens = span.text.match(/\S+|\s+/g) || [span.text];

      for (const token of tokens) {
        let tokenWidth = 0;
        for (const ch of token) {
          tokenWidth += atlas.getAdvance(ch, span.bold);
        }

        // Only skip pure whitespace if this line was created by automatic word wrap
        if (/^\s+$/.test(token) && currentLineSpans.length === 0 && isWrappedLine) {
          continue;
        }

        if (currentLineWidth + tokenWidth <= maxWidth) {
          // Fits on current line
          currentLineSpans.push({
            ...span,
            text: token,
          });
          currentLineWidth += tokenWidth;
          if (!/^\s+$/.test(token)) {
            isWrappedLine = false;
          }
        } else {
          // Doesn't fit. If whitespace, wrap without adding space
          if (/^\s+$/.test(token)) {
            resultLines.push({ spans: currentLineSpans, width: currentLineWidth });
            currentLineSpans = [];
            currentLineWidth = 0;
            isWrappedLine = true;
            continue;
          }

          // If current line already has content, wrap and start a new line
          if (currentLineSpans.length > 0) {
            resultLines.push({ spans: currentLineSpans, width: currentLineWidth });
            currentLineSpans = [];
            currentLineWidth = 0;
            isWrappedLine = true;
          }

          // If the word fits on an empty line, put it there
          if (tokenWidth <= maxWidth) {
            currentLineSpans.push({
              ...span,
              text: token,
            });
            currentLineWidth = tokenWidth;
            if (!/^\s+$/.test(token)) {
              isWrappedLine = false;
            }
          } else {
            // Word itself is longer than maxWidth (114px), break character by character
            let subWord = '';
            let subWidth = 0;

            for (const ch of token) {
              const chAdv = atlas.getAdvance(ch, span.bold);
              if (subWidth + chAdv > maxWidth && subWord.length > 0) {
                resultLines.push({
                  spans: [{ ...span, text: subWord }],
                  width: subWidth,
                });
                subWord = ch;
                subWidth = chAdv;
                isWrappedLine = true;
              } else {
                subWord += ch;
                subWidth += chAdv;
              }
            }

            if (subWord.length > 0) {
              currentLineSpans.push({ ...span, text: subWord });
              currentLineWidth = subWidth;
              isWrappedLine = false;
            }
          }
        }
      }
    }

    if (currentLineSpans.length > 0) {
      resultLines.push({ spans: currentLineSpans, width: currentLineWidth });
    }
  }

  return resultLines;
}

/**
 * Splits an array of wrapped lines into pages of up to 14 lines each.
 */
export function paginateLines(lines: LineLayout[], linesPerPage = LINES_PER_PAGE): LineLayout[][] {
  if (lines.length === 0) {
    return [[{ spans: [], width: 0 }]];
  }

  const pages: LineLayout[][] = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }
  return pages;
}

/**
 * Takes raw continuous text and formats it into pages of up to 14 lines.
 */
export function paginateRawText(
  text: string,
  maxWidth = BOOK_TEXT_WIDTH,
  linesPerPage = LINES_PER_PAGE,
  atlas: GlyphAtlas = defaultGlyphAtlas
): LineLayout[][] {
  const lines = splitTextToLines(text, maxWidth, atlas);
  return paginateLines(lines, linesPerPage);
}
