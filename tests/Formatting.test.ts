import { describe, it, expect } from 'vitest';
import {
  parseFormattedText,
  stripFormatting,
  normalizeFormattingCodes,
  MINECRAFT_COLORS,
} from '../src/engine/Formatting';

describe('Formatting parser', () => {
  it('parses standard color codes correctly', () => {
    const text = '§4Red text §9Blue text';
    const spans = parseFormattedText(text);

    expect(spans).toHaveLength(2);
    expect(spans[0].text).toBe('Red text ');
    expect(spans[0].color).toBe(MINECRAFT_COLORS['4']);
    expect(spans[1].text).toBe('Blue text');
    expect(spans[1].color).toBe(MINECRAFT_COLORS['9']);
  });

  it('handles bold and resets properly', () => {
    const text = '§lBold §rNormal';
    const spans = parseFormattedText(text);

    expect(spans).toHaveLength(2);
    expect(spans[0].bold).toBe(true);
    expect(spans[1].bold).toBe(false);
  });

  it('resets formatting flags when a color is applied (vanilla behavior)', () => {
    const text = '§lBold §cRed (not bold)';
    const spans = parseFormattedText(text);

    expect(spans).toHaveLength(2);
    expect(spans[0].bold).toBe(true);
    expect(spans[1].bold).toBe(false);
    expect(spans[1].color).toBe(MINECRAFT_COLORS['c']);
  });

  it('normalizes ampersand color codes &0-&f', () => {
    const text = '&aGreen &bAqua';
    const normalized = normalizeFormattingCodes(text);
    expect(normalized).toBe('§aGreen §bAqua');
  });

  it('supports Bedrock Edition and material palette color codes (§s, §t, §u, §g, §p, §q)', () => {
    const text = '§sDiamond §tLapis §uAmethyst §gMinecoin Gold §pMaterial Gold §qEmerald';
    const spans = parseFormattedText(text);

    expect(spans).toHaveLength(6);
    expect(spans[0].text).toBe('Diamond ');
    expect(spans[0].color).toBe('#2CBAA8'); // Diamond
    expect(spans[1].text).toBe('Lapis ');
    expect(spans[1].color).toBe('#21497B'); // Lapis
    expect(spans[2].text).toBe('Amethyst ');
    expect(spans[2].color).toBe('#9A5CC6'); // Amethyst
    expect(spans[3].text).toBe('Minecoin Gold ');
    expect(spans[3].color).toBe('#DDD605'); // Minecoin Gold
    expect(spans[4].text).toBe('Material Gold ');
    expect(spans[4].color).toBe('#DEB12D'); // Material Gold
    expect(spans[5].text).toBe('Emerald');
    expect(spans[5].color).toBe('#47A036'); // Emerald
  });

  it('strips formatting codes cleanly', () => {
    const text = '§6Gold §lBold §kObf §rPlain';
    expect(stripFormatting(text)).toBe('Gold Bold Obf Plain');
  });
});
