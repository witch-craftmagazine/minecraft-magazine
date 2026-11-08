/**
 * AsciiAmbientManager: Ambient animated ASCII art backdrop for Minecraft Magazine.
 * 
 * Features:
 * - Strictly stops at the book's boundary (never goes under or behind the book).
 * - Low contrast, tranquil, non-distracting visual styling.
 * - Slow, hypnotic animation (~8-10 FPS).
 * - Dynamic scene selection:
 *   - Standard issues: Randomizes on load between "Witch's Study" (Candle & Cat) and "Night Meadow" (Fireflies).
 *   - Holiday issues: "Halloween" (Spider & Owl) for Issues 6, 11, 17; "Winter" (Snowfall) for Issues 7, 12, 19.
 *   - Issue X: Corrupted "Static" (TV Static / Glitch scanlines).
 *   - Intro: "Celestial" (Moon Phases & Starlight).
 */

export type AmbientSceneType = 'study' | 'meadow' | 'halloween' | 'winter' | 'static' | 'celestial';

interface CellDimensions {
  width: number;
  height: number;
}

export class AsciiAmbientManager {
  private container: HTMLElement;
  private preElement: HTMLPreElement;
  private canvasElement: HTMLCanvasElement | null = null;
  private currentScene: AmbientSceneType = 'meadow';
  private defaultStandardScene: AmbientSceneType;
  private isRunning = false;
  private animFrameId: number | null = null;
  private lastFrameTimestamp = 0;
  private frameDurationMs = 1000 / 8; // ~125ms per frame (~8 FPS)
  private simTime = 0;
  private enabled = true;
  private cellDim: CellDimensions = { width: 7.2, height: 13.5 };

  // Reusable grid buffers
  private cols = 80;
  private rows = 30;

  constructor(container: HTMLElement) {
    this.container = container;
    
    // Randomize standard reading scene on load between 'study' and 'meadow'
    this.defaultStandardScene = Math.random() < 0.5 ? 'study' : 'meadow';
    this.currentScene = this.defaultStandardScene;

    // Load persisted preference if available
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('witchcraft_ascii_ambient');
        if (stored !== null) {
          this.enabled = stored === 'true';
        }
      }
    } catch {}

    if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
      this.preElement = document.createElement('pre');
      this.preElement.className = 'ascii-ambient-pre';
      this.preElement.setAttribute('aria-hidden', 'true');
      this.container?.appendChild?.(this.preElement);
    } else {
      this.preElement = {
        style: { setProperty: () => {}, display: 'block' },
        setAttribute: () => {},
        remove: () => {},
        textContent: '',
      } as unknown as HTMLPreElement;
    }

    this.measureCellDimensions();
    this.updateGridSize();

    // Listeners for window resize and visibility
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('resize', this.handleResize);
    }
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  public setCanvasElement(canvas: HTMLCanvasElement | null): void {
    this.canvasElement = canvas;
  }

  public setIssue(issueId: string): void {
    const scene = this.resolveSceneForIssue(issueId);
    if (scene !== this.currentScene) {
      this.currentScene = scene;
      this.simTime = 0; // Reset scene time for fresh entrance
      this.updateSceneStyles();
    }
  }

  public resolveSceneForIssue(issueId: string): AmbientSceneType {
    if (issueId === 'intro') {
      return 'celestial';
    }
    if (issueId === 'issue2023' || issueId === 'issueX' || issueId === 'issue11.5') {
      return 'static';
    }
    if (['issue6', 'issue11', 'issue17'].includes(issueId)) {
      return 'halloween';
    }
    if (['issue7', 'issue12', 'issue19'].includes(issueId)) {
      return 'winter';
    }
    return this.defaultStandardScene;
  }

  public getCurrentScene(): AmbientSceneType {
    return this.currentScene;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('witchcraft_ascii_ambient', String(this.enabled));
    } catch {}

    if (this.enabled) {
      this.start();
      this.preElement.style.display = 'block';
    } else {
      this.stop();
      this.preElement.style.display = 'none';
      this.preElement.textContent = '';
    }
    return this.enabled;
  }

  public start(): void {
    if (this.isRunning || !this.enabled) return;
    this.isRunning = true;
    this.lastFrameTimestamp = performance.now();
    this.loop(this.lastFrameTimestamp);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this.animFrameId);
      } else {
        clearTimeout(this.animFrameId as any);
      }
      this.animFrameId = null;
    }
  }

  public destroy(): void {
    this.stop();
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('resize', this.handleResize);
    }
    if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    if (typeof this.preElement?.remove === 'function') {
      this.preElement.remove();
    }
  }

  private handleResize = (): void => {
    this.measureCellDimensions();
    this.updateGridSize();
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.stop();
    } else if (this.enabled) {
      this.start();
    }
  };

  private measureCellDimensions(): void {
    if (typeof document === 'undefined' || !document.body) return;
    try {
      const testSpan = document.createElement('span');
      testSpan.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      testSpan.style.fontSize = '11px';
      testSpan.style.lineHeight = '1.15';
      testSpan.style.position = 'absolute';
      testSpan.style.visibility = 'hidden';
      testSpan.textContent = 'MMMMMMMMMM'; // 10 chars
      document.body.appendChild(testSpan);
      const rect = testSpan.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        this.cellDim = {
          width: rect.width / 10,
          height: rect.height,
        };
      }
      testSpan.remove();
    } catch {}
  }

  private updateGridSize(): void {
    const w = (typeof window !== 'undefined' && typeof window.innerWidth === 'number' && window.innerWidth > 0) 
      ? window.innerWidth 
      : 1200;
    const h = (typeof window !== 'undefined' && typeof window.innerHeight === 'number' && window.innerHeight > 0) 
      ? window.innerHeight 
      : 800;
    this.cols = Math.max(20, Math.floor(w / this.cellDim.width));
    this.rows = Math.max(10, Math.floor(h / this.cellDim.height));
  }

  private updateSceneStyles(): void {
    if (!this.preElement?.style?.setProperty) return;
    // Subtle thematic color shifting
    switch (this.currentScene) {
      case 'static':
        this.preElement.style.setProperty('--ascii-color', 'rgba(230, 80, 80, 0.26)');
        break;
      case 'halloween':
        this.preElement.style.setProperty('--ascii-color', 'rgba(215, 140, 50, 0.24)');
        break;
      case 'winter':
        this.preElement.style.setProperty('--ascii-color', 'rgba(160, 205, 245, 0.25)');
        break;
      case 'celestial':
        this.preElement.style.setProperty('--ascii-color', 'rgba(195, 165, 235, 0.24)');
        break;
      case 'study':
        this.preElement.style.setProperty('--ascii-color', 'rgba(215, 175, 110, 0.22)');
        break;
      case 'meadow':
      default:
        this.preElement.style.setProperty('--ascii-color', 'rgba(155, 140, 195, 0.22)');
        break;
    }
  }

  private loop = (timestamp: number): void => {
    if (!this.isRunning) return;

    const delta = timestamp - this.lastFrameTimestamp;
    if (delta >= this.frameDurationMs) {
      this.lastFrameTimestamp = timestamp - (delta % this.frameDurationMs);
      // Advance simulation time slowly (0.4x real time for calm, tranquil motion)
      this.simTime += 0.05;
      this.renderFrame();
    }

    if (typeof requestAnimationFrame === 'function') {
      this.animFrameId = requestAnimationFrame(this.loop);
    } else {
      this.animFrameId = setTimeout(() => this.loop(performance.now()), 16) as any;
    }
  };

  /**
   * Renders the active ASCII scene and blanks out any cell intersecting the book boundary.
   */
  public renderFrame(): string {
    const grid: string[][] = Array.from({ length: this.rows }, () => new Array<string>(this.cols).fill(' '));

    // 1. Generate scene content into grid
    switch (this.currentScene) {
      case 'study':
        this.drawStudyScene(grid, this.simTime);
        break;
      case 'meadow':
        this.drawMeadowScene(grid, this.simTime);
        break;
      case 'halloween':
        this.drawHalloweenScene(grid, this.simTime);
        break;
      case 'winter':
        this.drawWinterScene(grid, this.simTime);
        break;
      case 'static':
        this.drawStaticScene(grid, this.simTime);
        break;
      case 'celestial':
        this.drawCelestialScene(grid, this.simTime);
        break;
    }

    // 2. CRITICAL CONSTRAINT: Blank out all characters intersecting the book boundary
    this.maskBookBoundary(grid);

    // 3. Serialize grid to pre element
    const text = grid.map(row => row.join('')).join('\n');
    this.preElement.textContent = text;
    return text;
  }

  /**
   * Overwrites all cells that fall within the book canvas's screen coordinates with blank spaces (' ').
   */
  public maskBookBoundary(grid: string[][]): void {
    let bookRect: DOMRect | null = null;
    if (this.canvasElement && typeof this.canvasElement.getBoundingClientRect === 'function') {
      bookRect = this.canvasElement.getBoundingClientRect();
    } else if (typeof document !== 'undefined' && typeof document.querySelector === 'function') {
      const el = document.querySelector('.canvas-wrapper canvas') as HTMLElement;
      if (el && typeof el.getBoundingClientRect === 'function') {
        bookRect = el.getBoundingClientRect();
      }
    }

    if (!bookRect || bookRect.width === 0 || bookRect.height === 0) {
      return;
    }

    // Add 16px buffer margin around the book boundary
    const padX = 16;
    const padY = 16;
    const minX = bookRect.left - padX;
    const maxX = bookRect.right + padX;
    const minY = bookRect.top - padY;
    const maxY = bookRect.bottom + padY;

    const minCol = Math.max(0, Math.floor(minX / this.cellDim.width));
    const maxCol = Math.min(this.cols - 1, Math.ceil(maxX / this.cellDim.width));
    const minRow = Math.max(0, Math.floor(minY / this.cellDim.height));
    const maxRow = Math.min(this.rows - 1, Math.ceil(maxY / this.cellDim.height));

    for (let r = minRow; r <= maxRow; r++) {
      if (grid[r]) {
        for (let c = minCol; c <= maxCol; c++) {
          grid[r][c] = ' ';
        }
      }
    }
  }

  /* ------------------------------------------------------------- */
  /* SCENE 1: THE WITCH'S STUDY (Candle on left, Sleeping Cat on right) */
  /* ------------------------------------------------------------- */
  private drawStudyScene(grid: string[][], t: number): void {
    // Left Desk: Candle flame flickering
    const candleCol = Math.max(2, Math.floor(this.cols * 0.08));
    const candleRow = Math.max(5, Math.floor(this.rows * 0.55));
    this.stampCandle(grid, candleCol, candleRow, t);

    // Right Desk: Sleeping Familiar (Cat breathing softly)
    const catCol = Math.min(this.cols - 35, Math.floor(this.cols * 0.72));
    const catRow = Math.max(5, Math.floor(this.rows * 0.65));
    this.stampCat(grid, catCol, catRow, t);

    // Subtle desk surface at bottom
    const deskY = Math.min(this.rows - 2, Math.floor(this.rows * 0.88));
    if (deskY >= 0 && deskY < this.rows) {
      for (let c = 0; c < this.cols; c += 3) {
        if (c < this.cols) grid[deskY][c] = '─';
      }
    }
  }

  private stampCandle(grid: string[][], col: number, row: number, t: number): void {
    const flameFlicker = Math.sin(t * 2.5) > 0.2 ? ')' : Math.sin(t * 3.1) < -0.2 ? '(' : '|';
    const halo = Math.sin(t * 1.8) > 0 ? '*' : '·';

    const sprite = [
      `     ${halo}     `,
      `    ${halo}(${flameFlicker})${halo}    `,
      '     |i|     ',
      '    [===]    ',
      '    |   |    ',
      '    |   |    ',
      '   /|   |\\   ',
      '  (_______)  ',
      '  [=======]  ',
    ];

    for (let r = 0; r < sprite.length; r++) {
      const targetRow = row + r;
      if (targetRow >= 0 && targetRow < this.rows) {
        const line = sprite[r];
        for (let c = 0; c < line.length; c++) {
          const targetCol = col + c;
          if (targetCol >= 0 && targetCol < this.cols && line[c] !== ' ') {
            grid[targetRow][targetCol] = line[c];
          }
        }
      }
    }
  }

  private stampCat(grid: string[][], col: number, row: number, t: number): void {
    // Slow breathing cycle (in and out)
    const breath = Math.sin(t * 0.9) > 0;
    const earFlicker = Math.sin(t * 0.4) > 0.8;
    const zFloat = Math.floor((t * 0.5) % 3);

    const backLine = breath 
      ? '      _..--------.._     ' 
      : '      _..-------.._      ';

    const earLine = earFlicker 
      ? '            /\\    .-/\\   ' 
      : '            /\\      /\\   ';

    const sprite = [
      earLine,
      '           /  `----\'  \\  ',
      '          |  `-\'  `-\'  | ',
      backLine,
      '   /      )   )   )   )  ',
      '  |______(_____.---.____)',
    ];

    // Drifting Z's
    if (row - 1 >= 0 && col + 24 < this.cols) {
      grid[row - 1][col + 24] = zFloat === 1 ? 'z' : zFloat === 2 ? 'Z' : ' ';
    }

    for (let r = 0; r < sprite.length; r++) {
      const targetRow = row + r;
      if (targetRow >= 0 && targetRow < this.rows) {
        const line = sprite[r];
        for (let c = 0; c < line.length; c++) {
          const targetCol = col + c;
          if (targetCol >= 0 && targetCol < this.cols && line[c] !== ' ') {
            grid[targetRow][targetCol] = line[c];
          }
        }
      }
    }
  }

  /* ------------------------------------------------------------- */
  /* SCENE 2: THE NIGHT MEADOW (Treeline & Fireflies)             */
  /* ------------------------------------------------------------- */
  private drawMeadowScene(grid: string[][], t: number): void {
    // 1. Distant treeline along lower horizon
    const horizon = Math.min(this.rows - 4, Math.floor(this.rows * 0.78));
    const treePattern = '  /\\   /\\/\\    /\\  /\\/\\/\\   /\\   /\\/\\   /\\  ';
    if (horizon >= 0 && horizon < this.rows) {
      for (let c = 0; c < this.cols; c++) {
        grid[horizon][c] = treePattern[c % treePattern.length];
      }
    }

    // Ground line
    const ground = horizon + 2;
    if (ground < this.rows) {
      for (let c = 0; c < this.cols; c++) {
        grid[ground][c] = c % 4 === 0 ? '"' : '_';
      }
    }

    // 2. Slow drifting fireflies in peripheral space
    const count = Math.min(30, Math.floor(this.cols * 0.4));
    for (let i = 0; i < count; i++) {
      const seed = i * 137.5;
      const speedX = 0.3 + (i % 5) * 0.1;
      const speedY = 0.2 + (i % 4) * 0.08;

      const x = Math.floor(((seed + t * speedX * 8) % this.cols + this.cols) % this.cols);
      const y = Math.floor((Math.sin(t * speedY + seed) * 0.35 + 0.5) * horizon);

      const pulse = Math.sin(t * 1.5 + seed);
      if (pulse > 0.3 && y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
        grid[y][x] = pulse > 0.85 ? '*' : pulse > 0.6 ? '+' : '·';
      }
    }
  }

  /* ------------------------------------------------------------- */
  /* SCENE 3: HALLOWEEN (Spider descending & Horned Owl)           */
  /* ------------------------------------------------------------- */
  private drawHalloweenScene(grid: string[][], t: number): void {
    // Left: Spider dropping on silk and climbing
    const spiderCol = Math.max(3, Math.floor(this.cols * 0.07));
    const dropRange = Math.max(4, Math.floor(this.rows * 0.35));
    const spiderY = Math.floor(2 + Math.abs(Math.sin(t * 0.35)) * dropRange);

    // Silk thread
    for (let r = 0; r < spiderY; r++) {
      if (r < this.rows && spiderCol < this.cols) {
        grid[r][spiderCol] = '|';
      }
    }

    // Spider body
    if (spiderY < this.rows - 2 && spiderCol - 2 >= 0 && spiderCol + 2 < this.cols) {
      const legPose = Math.sin(t * 1.2) > 0 ? '/' : '\\';
      grid[spiderY][spiderCol - 2] = legPose;
      grid[spiderY][spiderCol - 1] = '(';
      grid[spiderY][spiderCol] = 'o';
      grid[spiderY][spiderCol + 1] = ')';
      grid[spiderY][spiderCol + 2] = legPose === '/' ? '\\' : '/';
      if (spiderY + 1 < this.rows) {
        grid[spiderY + 1][spiderCol - 1] = '/';
        grid[spiderY + 1][spiderCol + 1] = '\\';
      }
    }

    // Right: Horned Owl on tree branch
    const owlCol = Math.min(this.cols - 16, Math.floor(this.cols * 0.82));
    const owlRow = Math.max(3, Math.floor(this.rows * 0.2));
    const blink = Math.sin(t * 0.6) > 0.85;
    const eyes = blink ? '- -' : 'O O';

    const owlSprite = [
      ' ,___, ',
      ` [${eyes}] `,
      ' /)__) ',
      ' -"--"-',
    ];

    for (let r = 0; r < owlSprite.length; r++) {
      const tr = owlRow + r;
      if (tr >= 0 && tr < this.rows) {
        const line = owlSprite[r];
        for (let c = 0; c < line.length; c++) {
          const tc = owlCol + c;
          if (tc >= 0 && tc < this.cols && line[c] !== ' ') {
            grid[tr][tc] = line[c];
          }
        }
      }
    }
  }

  /* ------------------------------------------------------------- */
  /* SCENE 4: WINTER / CHRISTMAS (Snowfall Drifting)              */
  /* ------------------------------------------------------------- */
  private drawWinterScene(grid: string[][], t: number): void {
    const flakeCount = Math.min(60, Math.floor(this.cols * 0.7));
    const ground = Math.min(this.rows - 1, Math.floor(this.rows * 0.92));

    for (let i = 0; i < flakeCount; i++) {
      const seed = i * 47.1;
      const speedY = 0.4 + (i % 3) * 0.2;
      const sway = Math.sin(t * 0.8 + seed) * 1.8;

      const rawY = (seed + t * speedY * 6) % ground;
      const r = Math.floor(rawY);
      const c = Math.floor(((seed * 2.3 + sway) % this.cols + this.cols) % this.cols);

      if (r >= 0 && r < ground && c >= 0 && c < this.cols) {
        const glyph = (i % 5 === 0) ? '*' : (i % 2 === 0) ? '+' : '·';
        grid[r][c] = glyph;
      }
    }

    // Snow drift on the ground
    if (ground < this.rows) {
      for (let c = 0; c < this.cols; c++) {
        grid[ground][c] = (c % 2 === 0) ? '─' : ' ';
      }
    }
  }

  /* ------------------------------------------------------------- */
  /* SCENE 5: ISSUE X (Corrupted TV-Static & Scanline Glitch)       */
  /* ------------------------------------------------------------- */
  private drawStaticScene(grid: string[][], t: number): void {
    const chars = ' .:+░▒▓#X%';
    const scanline = Math.floor((t * 4) % this.rows);

    for (let r = 0; r < this.rows; r++) {
      const isScan = Math.abs(r - scanline) <= 1;
      const density = isScan ? 0.35 : 0.08;

      for (let c = 0; c < this.cols; c += 2) {
        // Fast pseudorandom noise
        const n = Math.sin(r * 12.9898 + c * 78.233 + t * 50);
        if (Math.abs(n) > 1 - density) {
          const chIdx = Math.floor(Math.abs(n) * chars.length) % chars.length;
          grid[r][c] = chars[chIdx];
        }
      }
    }
  }

  /* ------------------------------------------------------------- */
  /* SCENE 6: INTRO (Celestial Moon Phases & Starlight)            */
  /* ------------------------------------------------------------- */
  private drawCelestialScene(grid: string[][], t: number): void {
    // Upper Center/Right: Waxing/Waning Moon
    const moonCol = Math.max(5, Math.floor(this.cols * 0.78));
    const moonRow = Math.max(2, Math.floor(this.rows * 0.12));

    const moonPhase = Math.floor((t * 0.2) % 4);
    let moonSprite = [
      '  .--.  ',
      ' (    ) ',
      '  `--\'  ',
    ];
    if (moonPhase === 0) {
      moonSprite = [
        '  .--.  ',
        ' ( (   )',
        '  `--\'  ',
      ];
    } else if (moonPhase === 1) {
      moonSprite = [
        '  .--.  ',
        ' ( |   )',
        '  `--\'  ',
      ];
    } else if (moonPhase === 2) {
      moonSprite = [
        '  .--.  ',
        ' (   ) )',
        '  `--\'  ',
      ];
    }

    for (let r = 0; r < moonSprite.length; r++) {
      const tr = moonRow + r;
      if (tr >= 0 && tr < this.rows) {
        const line = moonSprite[r];
        for (let c = 0; c < line.length; c++) {
          const tc = moonCol + c;
          if (tc >= 0 && tc < this.cols && line[c] !== ' ') {
            grid[tr][tc] = line[c];
          }
        }
      }
    }

    // Twinkling stars across the upper sky
    const starCount = Math.min(25, Math.floor(this.cols * 0.35));
    for (let i = 0; i < starCount; i++) {
      const seed = i * 93.7;
      const c = Math.floor(seed % this.cols);
      const r = Math.floor((seed * 0.4) % Math.floor(this.rows * 0.45));
      const pulse = Math.sin(t * 1.1 + seed);

      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols && pulse > 0.4) {
        grid[r][c] = pulse > 0.85 ? '✦' : pulse > 0.6 ? '·' : '.';
      }
    }
  }
}
