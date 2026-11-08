import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AsciiAmbientManager } from '../src/ambient/AsciiAmbientManager';

describe('AsciiAmbientManager Backdrop System', () => {
  let mockContainer: any;
  let manager: AsciiAmbientManager;

  beforeEach(() => {
    mockContainer = {
      appendChild: (el: any) => el,
      removeChild: (el: any) => el,
    };
    manager = new AsciiAmbientManager(mockContainer as unknown as HTMLElement);
  });

  afterEach(() => {
    manager.destroy();
  });

  it('initializes with a randomized standard scene (study or meadow)', () => {
    const scene = manager.resolveSceneForIssue('issue1');
    expect(['study', 'meadow']).toContain(scene);
  });

  it('resolves celestial scene for intro', () => {
    expect(manager.resolveSceneForIssue('intro')).toBe('celestial');
  });

  it('resolves corrupted static scene for Issue X and its aliases', () => {
    expect(manager.resolveSceneForIssue('issue2023')).toBe('static');
    expect(manager.resolveSceneForIssue('issueX')).toBe('static');
    expect(manager.resolveSceneForIssue('issue11.5')).toBe('static');
  });

  it('resolves halloween scene for Halloween editions', () => {
    expect(manager.resolveSceneForIssue('issue6')).toBe('halloween');
    expect(manager.resolveSceneForIssue('issue11')).toBe('halloween');
    expect(manager.resolveSceneForIssue('issue17')).toBe('halloween');
  });

  it('resolves winter scene for Christmas editions', () => {
    expect(manager.resolveSceneForIssue('issue7')).toBe('winter');
    expect(manager.resolveSceneForIssue('issue12')).toBe('winter');
    expect(manager.resolveSceneForIssue('issue19')).toBe('winter');
  });

  it('enforces that characters strictly stop at the book boundary (no characters under book)', () => {
    // Create a mock book canvas in the center of the screen
    const mockCanvas = {
      getBoundingClientRect: () => ({
        left: 100,
        top: 50,
        right: 300,
        bottom: 200,
        width: 200,
        height: 150,
        x: 100,
        y: 50,
        toJSON: () => {},
      }),
    };

    manager.setCanvasElement(mockCanvas as unknown as HTMLCanvasElement);

    // Populate a test grid with characters everywhere
    const rows = 30;
    const cols = 80;
    const grid: string[][] = Array.from({ length: rows }, () => new Array<string>(cols).fill('#'));

    // Apply the boundary mask
    manager.maskBookBoundary(grid);

    // Calculate expected masked cell boundaries with 16px buffer
    // cellDim width ~ 7.2px, height ~ 13.5px
    const minCol = Math.floor((100 - 16) / 7.2);
    const maxCol = Math.ceil((300 + 16) / 7.2);
    const minRow = Math.floor((50 - 16) / 13.5);
    const maxRow = Math.ceil((200 + 16) / 13.5);

    // Verify inside book rect is 100% blank
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        expect(grid[r][c]).toBe(' ');
      }
    }

    // Verify outside cells still retain content
    expect(grid[0][0]).toBe('#');
    expect(grid[rows - 1][cols - 1]).toBe('#');
  });

  it('toggles ambient backdrop on and off', () => {
    expect(manager.isEnabled()).toBe(true);
    const toggledOff = manager.toggle();
    expect(toggledOff).toBe(false);
    expect(manager.isEnabled()).toBe(false);

    const toggledOn = manager.toggle();
    expect(toggledOn).toBe(true);
    expect(manager.isEnabled()).toBe(true);
  });

  it('renders frame output without undefined or NaN tokens', () => {
    const scenes: ('study' | 'meadow' | 'halloween' | 'winter' | 'static' | 'celestial')[] = [
      'study', 'meadow', 'halloween', 'winter', 'static', 'celestial'
    ];

    for (const sc of scenes) {
      if (sc === 'celestial') manager.setIssue('intro');
      else if (sc === 'static') manager.setIssue('issue2023');
      else if (sc === 'halloween') manager.setIssue('issue11');
      else if (sc === 'winter') manager.setIssue('issue12');
      else manager.setIssue('issue1');

      const frame = manager.renderFrame();
      expect(typeof frame).toBe('string');
      expect(frame).not.toContain('undefined');
      expect(frame).not.toContain('NaN');
      expect(frame.length).toBeGreaterThan(50);
    }
  });
});
