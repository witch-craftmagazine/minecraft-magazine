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

  // In Minecraft written books, each page is a continuous formatted text component.
  // Styles carry over across explicit newlines (\n) within a page until cleared by §r or a new color code.
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

        const isWhitespace = /^\s+$/.test(token);

        if (currentLineWidth + tokenWidth <= maxWidth) {
          // Fits on current line
          currentLineSpans.push({
            ...span,
            text: token,
          });
          currentLineWidth += tokenWidth;
        } else {
          // Doesn't fit on current line.
          // If current line has content, wrap it.
          if (currentLineSpans.length > 0) {
            // In Minecraft LineBreakFinder, lines break at lastSpace and do not include the trailing space.
            const lastSpan = currentLineSpans[currentLineSpans.length - 1];
            if (lastSpan.text === ' ') {
              currentLineWidth -= atlas.getAdvance(' ', lastSpan.bold);
              currentLineSpans.pop();
            }

            // If the overflowing token is a single inter-word space at the end of the line,
            // wrap and discard only that single space.
            if (isWhitespace && token === ' ') {
              resultLines.push({ spans: currentLineSpans, width: currentLineWidth });
              currentLineSpans = [];
              currentLineWidth = 0;
              continue;
            }

            // Otherwise (word or multi-space indentation), wrap current line and carry token to the next line.
            resultLines.push({ spans: currentLineSpans, width: currentLineWidth });
            currentLineSpans = [];
            currentLineWidth = 0;
          }

          // Now place the token on the new line
          if (tokenWidth <= maxWidth) {
            currentLineSpans.push({
              ...span,
              text: token,
            });
            currentLineWidth = tokenWidth;
          } else {
            // Word/token itself is longer than maxWidth (114px), break character by character
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
              } else {
                subWord += ch;
                subWidth += chAdv;
              }
            }

            if (subWord.length > 0) {
              currentLineSpans.push({ ...span, text: subWord });
              currentLineWidth = subWidth;
            }
          }
        }
      }
    }

    if (currentLineSpans.length > 0) {
      resultLines.push({ spans: currentLineSpans, width: currentLineWidth });
    }
  }

  // Trim trailing empty lines at the very end of the page (e.g. from trailing \n before #- delimiters)
  while (resultLines.length > 0 && resultLines[resultLines.length - 1].spans.length === 0) {
    resultLines.pop();
  }
  if (resultLines.length === 0) {
    resultLines.push({ spans: [], width: 0 });
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
