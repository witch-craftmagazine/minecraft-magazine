/**
 * AsciiAmbientManager: Ambient animated ASCII art backdrop for Minecraft Magazine.
 * 
 * Features:
 * - Strictly stops at the book's boundary (never goes under or behind the book).
 * - High-contrast, vibrant, and atmospheric colors with text-shadow glow.
 * - Mobile responsive: adaptively fills top and bottom margins on portrait screens
 *   and side flanks on widescreen displays.
 * - Slow, hypnotic animation (~8-10 FPS).
 * - Dynamic scene selection:
 *   - Standard issues: Randomizes on load between "Witch's Study" (Candle & Cat) and "Night Meadow" (Fireflies).
 *   - Holiday issues: "Halloween" (Spider, Owl, Jack-o'-Lanterns) for Issues 6, 11, 17;
 *     "Winter" (Snowfall & Frost) for Issues 7, 12, 19.
 *   - Issue X: Corrupted "Static" (CRT TV Static, glitch scanlines, corrupted mantras).
 *   - Intro: "Celestial" (Moon Phases, Constellations & Starlight).
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
  private boundsProvider: (() => DOMRect | null) | null = null;
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
    this.updateSceneStyles();

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

  public setBoundsProvider(provider: (() => DOMRect | null) | null): void {
    this.boundsProvider = provider;
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
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('witchcraft_ascii_ambient', String(this.enabled));
      }
    } catch {}

    if (this.enabled) {
      this.start();
      if (this.preElement?.style) {
        this.preElement.style.display = 'block';
      }
    } else {
      this.stop();
      if (this.preElement?.style) {
        this.preElement.style.display = 'none';
        this.preElement.textContent = '';
      }
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
      testSpan.style.fontSize = '12px';
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
    // High-contrast thematic colors with vibrant glows
    switch (this.currentScene) {
      case 'static':
        this.preElement.style.setProperty('--ascii-color', 'rgba(255, 85, 85, 0.85)');
        this.preElement.style.setProperty('--ascii-glow', 'rgba(255, 50, 50, 0.45)');
        break;
      case 'halloween':
        this.preElement.style.setProperty('--ascii-color', 'rgba(255, 170, 60, 0.85)');
        this.preElement.style.setProperty('--ascii-glow', 'rgba(230, 110, 20, 0.40)');
        break;
      case 'winter':
        this.preElement.style.setProperty('--ascii-color', 'rgba(215, 240, 255, 0.88)');
        this.preElement.style.setProperty('--ascii-glow', 'rgba(180, 220, 255, 0.40)');
        break;
      case 'celestial':
        this.preElement.style.setProperty('--ascii-color', 'rgba(225, 195, 255, 0.85)');
        this.preElement.style.setProperty('--ascii-glow', 'rgba(190, 150, 250, 0.45)');
        break;
      case 'study':
        this.preElement.style.setProperty('--ascii-color', 'rgba(255, 215, 130, 0.82)');
        this.preElement.style.setProperty('--ascii-glow', 'rgba(240, 180, 70, 0.40)');
        break;
      case 'meadow':
      default:
        this.preElement.style.setProperty('--ascii-color', 'rgba(190, 240, 145, 0.80)');
        this.preElement.style.setProperty('--ascii-glow', 'rgba(140, 220, 90, 0.40)');
        break;
    }
  }

  private loop = (timestamp: number): void => {
    if (!this.isRunning) return;

    const delta = timestamp - this.lastFrameTimestamp;
    if (delta >= this.frameDurationMs) {
      this.lastFrameTimestamp = timestamp - (delta % this.frameDurationMs);
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
    const isPortrait = this.cols < 72 || this.cols < this.rows;

    // 1. Generate expansive scene content into grid
    switch (this.currentScene) {
      case 'study':
        this.drawStudyScene(grid, this.simTime, isPortrait);
        break;
      case 'meadow':
        this.drawMeadowScene(grid, this.simTime, isPortrait);
        break;
      case 'halloween':
        this.drawHalloweenScene(grid, this.simTime, isPortrait);
        break;
      case 'winter':
        this.drawWinterScene(grid, this.simTime, isPortrait);
        break;
      case 'static':
        this.drawStaticScene(grid, this.simTime);
        break;
      case 'celestial':
        this.drawCelestialScene(grid, this.simTime, isPortrait);
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
   * Overwrites all cells that fall within the visible book page's screen coordinates with blank spaces (' ').
   * Ensures that characters never render behind or inside the open book while allowing them to come right up
   * to the physical edge of the book page without artificial bloated margins.
   */
  public maskBookBoundary(grid: string[][]): void {
    let bookRect: DOMRect | null = null;

    if (this.boundsProvider) {
      bookRect = this.boundsProvider();
    }

    if (!bookRect) {
      // Fallback: Infer visible book page from canvas dimensions (excluding transparent canvas margins)
      let cRect: DOMRect | null = null;
      if (this.canvasElement && typeof this.canvasElement.getBoundingClientRect === 'function') {
        cRect = this.canvasElement.getBoundingClientRect();
      } else if (typeof document !== 'undefined' && typeof document.querySelector === 'function') {
        const el = document.querySelector('.canvas-wrapper canvas') as HTMLElement;
        if (el && typeof el.getBoundingClientRect === 'function') {
          cRect = el.getBoundingClientRect();
        }
      }

      if (cRect && cRect.width > 0 && cRect.height > 0) {
        const isDouble = (cRect.width / cRect.height) > 1.3;
        const baseW = isDouble ? 344 : 192;
        const scaleX = cRect.width / baseW;
        const scaleY = cRect.height / 192;
        const minLocalX = isDouble ? 26 : 20;
        const maxLocalX = isDouble ? 318 : 166;
        bookRect = {
          left: cRect.left + minLocalX * scaleX,
          right: cRect.left + maxLocalX * scaleX,
          top: cRect.top + 1 * scaleY,
          bottom: cRect.top + 181 * scaleY,
          width: (maxLocalX - minLocalX) * scaleX,
          height: 180 * scaleY,
          x: cRect.left + minLocalX * scaleX,
          y: cRect.top + 1 * scaleY,
          toJSON: () => ({}),
        } as DOMRect;
      }
    }

    if (!bookRect || bookRect.width === 0 || bookRect.height === 0) {
      return;
    }

    // Relative to the pre element's screen coordinates
    const preRect = (this.preElement && typeof this.preElement.getBoundingClientRect === 'function')
      ? this.preElement.getBoundingClientRect()
      : { left: 0, top: 0 };

    const relLeft = bookRect.left - preRect.left;
    const relRight = bookRect.right - preRect.left;
    const relTop = bookRect.top - preRect.top;
    const relBottom = bookRect.bottom - preRect.top;

    // Mask strictly the cells that intersect the book page boundary
    const minCol = Math.max(0, Math.floor(relLeft / this.cellDim.width));
    const maxCol = Math.min(this.cols - 1, Math.ceil(relRight / this.cellDim.width) - 1);
    const minRow = Math.max(0, Math.floor(relTop / this.cellDim.height));
    const maxRow = Math.min(this.rows - 1, Math.ceil(relBottom / this.cellDim.height) - 1);

    for (let r = minRow; r <= maxRow; r++) {
      if (grid[r]) {
        for (let c = minCol; c <= maxCol; c++) {
          grid[r][c] = ' ';
        }
      }
    }
  }

  /* ------------------------------------------------------------- */
  /* SCENE 1: THE WITCH'S STUDY (Expansive Desk & Ceiling Beams)   */
  /* ------------------------------------------------------------- */
  private drawStudyScene(grid: string[][], t: number, isPortrait: boolean): void {
    // 1. Top Ceiling: Wooden beams & hanging dried herbs
    const beamRow = Math.min(3, Math.floor(this.rows * 0.08));
    if (beamRow >= 0 && beamRow < this.rows) {
      for (let c = 0; c < this.cols; c++) {
        grid[beamRow][c] = c % 12 === 0 ? '╦' : '═';
      }
      if (beamRow + 1 < this.rows) {
        for (let c = 0; c < this.cols; c += 12) {
          if (c + 6 < this.cols) {
            grid[beamRow + 1][c + 6] = '|';
            if (beamRow + 2 < this.rows) {
              const herb = c % 24 === 0 ? '✿' : '✦';
              grid[beamRow + 2][c + 6] = herb;
            }
          }
        }
      }
    }

    // 2. Bottom Desk Surface across the entire width
    const deskY = Math.max(this.rows - 8, Math.floor(this.rows * 0.84));
    if (deskY < this.rows) {
      for (let c = 0; c < this.cols; c++) {
        grid[deskY][c] = '═';
      }
    }

    // Placement of Candle & Cat adaptively for mobile or desktop
    if (isPortrait) {
      // Mobile Portrait: Place candle and sleeping cat in the generous bottom margin below the book
      const baseRow = Math.min(this.rows - 7, deskY - 6);
      const candleCol = Math.max(2, Math.floor(this.cols * 0.12));
      const catCol = Math.min(this.cols - 28, Math.floor(this.cols * 0.52));
      this.stampCandle(grid, candleCol, baseRow, t);
      this.stampCat(grid, catCol, baseRow + 1, t);
    } else {
      // Desktop Widescreen: Candle on the left flank, Cat on the right flank
      const candleCol = Math.max(3, Math.floor(this.cols * 0.06));
      const candleRow = Math.max(4, Math.floor(this.rows * 0.45));
      this.stampCandle(grid, candleCol, candleRow, t);

      const catCol = Math.min(this.cols - 32, Math.floor(this.cols * 0.74));
      const catRow = Math.max(4, Math.floor(this.rows * 0.55));
      this.stampCat(grid, catCol, catRow, t);

      // Book shelves on the far sides
      for (let r = 5; r < deskY; r += 4) {
        const shelf = '[|||||] [////]';
        for (let i = 0; i < shelf.length; i++) {
          if (candleCol + i < this.cols) grid[r][candleCol + i] = shelf[i];
          if (catCol + i < this.cols) grid[r][catCol + i] = shelf[i];
        }
      }
    }
  }

  private stampCandle(grid: string[][], col: number, row: number, t: number): void {
    const flameFlicker = Math.sin(t * 2.8) > 0.2 ? ')' : Math.sin(t * 3.3) < -0.2 ? '(' : '|';
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
  /* SCENE 2: THE NIGHT MEADOW (Treeline, Moon & Bioluminescence) */
  /* ------------------------------------------------------------- */
  private drawMeadowScene(grid: string[][], t: number, isPortrait: boolean): void {
    // 1. Crescent moon in the upper sky
    const moonCol = Math.max(4, Math.floor(this.cols * (isPortrait ? 0.82 : 0.88)));
    const moonRow = 2;
    const moon = [
      ' _.._ ',
      '\' .-\'',
      '/ /  ',
      '| |  ',
      '\\ \\  ',
      ' `._`',
    ];
    for (let r = 0; r < moon.length; r++) {
      if (moonRow + r < this.rows) {
        for (let c = 0; c < moon[r].length; c++) {
          if (moonCol + c < this.cols && moon[r][c] !== ' ') {
            grid[moonRow + r][moonCol + c] = moon[r][c];
          }
        }
      }
    }

    // 2. Stars across the sky
    const starCount = Math.min(45, Math.floor(this.cols * 0.6));
    for (let i = 0; i < starCount; i++) {
      const seed = i * 61.3;
      const c = Math.floor(seed % this.cols);
      const r = Math.floor((seed * 0.3) % Math.floor(this.rows * 0.45));
      const pulse = Math.sin(t * 1.2 + seed);
      if (r < this.rows && c < this.cols && pulse > 0.4) {
        grid[r][c] = pulse > 0.85 ? '✦' : pulse > 0.6 ? '+' : '·';
      }
    }

    // 3. Dense treeline across the bottom
    const horizon = Math.min(this.rows - 5, Math.floor(this.rows * (isPortrait ? 0.82 : 0.78)));
    const treePattern = '  /\\   /\\/\\    /\\  /\\/\\/\\   /\\   /\\/\\   /\\  ';
    if (horizon >= 0 && horizon < this.rows) {
      for (let c = 0; c < this.cols; c++) {
        grid[horizon][c] = treePattern[c % treePattern.length];
      }
    }

    // 4. Multiple grass & wildflower layers on the ground
    const ground = horizon + 3;
    if (ground < this.rows) {
      for (let c = 0; c < this.cols; c++) {
        const grass = (c % 5 === 0) ? '✿' : (c % 2 === 0) ? '"' : '_';
        grid[ground][c] = grass;
      }
    }

    // 5. Fireflies dancing across the entire periphery
    const flyCount = Math.min(50, Math.floor(this.cols * 0.65));
    for (let i = 0; i < flyCount; i++) {
      const seed = i * 113.7;
      const speedX = 0.2 + (i % 5) * 0.08;
      const speedY = 0.15 + (i % 4) * 0.06;

      const x = Math.floor(((seed + t * speedX * 8) % this.cols + this.cols) % this.cols);
      const y = Math.floor((Math.sin(t * speedY + seed) * 0.45 + 0.5) * this.rows);

      const pulse = Math.sin(t * 1.6 + seed);
      if (pulse > 0.2 && y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
        grid[y][x] = pulse > 0.8 ? '*' : pulse > 0.5 ? '+' : '·';
      }
    }
  }

  /* ------------------------------------------------------------- */
  /* SCENE 3: HALLOWEEN (Ceiling Webs, Bats & Jack-o'-Lanterns)    */
  /* ------------------------------------------------------------- */
  private drawHalloweenScene(grid: string[][], t: number, isPortrait: boolean): void {
    // 1. Sprawling webs across upper corners
    const webRows = Math.min(5, Math.floor(this.rows * 0.16));
    for (let r = 0; r < webRows; r++) {
      for (let c = 0; c < 14; c++) {
        if (r < this.rows && c < this.cols && (c + r * 2) % 3 === 0) {
          grid[r][c] = '\\';
        }
      }
      for (let c = this.cols - 14; c < this.cols; c++) {
        if (r < this.rows && c >= 0 && (c - r * 2) % 3 === 0) {
          grid[r][c] = '/';
        }
      }
    }

    // 2. Spider descending on silk thread
    const spiderCol = Math.max(3, Math.floor(this.cols * (isPortrait ? 0.15 : 0.09)));
    const dropRange = Math.max(4, Math.floor(this.rows * 0.32));
    const spiderY = Math.floor(2 + Math.abs(Math.sin(t * 0.35)) * dropRange);

    for (let r = 0; r < spiderY; r++) {
      if (r < this.rows && spiderCol < this.cols) grid[r][spiderCol] = '|';
    }

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

    // 3. Horned Owl perched on branch
    const owlCol = Math.min(this.cols - 16, Math.floor(this.cols * (isPortrait ? 0.72 : 0.82)));
    const owlRow = Math.max(2, Math.floor(this.rows * 0.15));
    const blink = Math.sin(t * 0.55) > 0.85;
    const eyes = blink ? '- -' : 'O O';
    const owl = [
      ' ,___, ',
      ` [${eyes}] `,
      ' /)__) ',
      ' -"--"-',
    ];
    for (let r = 0; r < owl.length; r++) {
      if (owlRow + r < this.rows) {
        for (let c = 0; c < owl[r].length; c++) {
          if (owlCol + c < this.cols && owl[r][c] !== ' ') {
            grid[owlRow + r][owlCol + c] = owl[r][c];
          }
        }
      }
    }

    // 4. Jack-o'-Lanterns along the bottom ground
    const groundY = Math.min(this.rows - 4, Math.floor(this.rows * 0.88));
    const pumpkinCols = isPortrait 
      ? [Math.floor(this.cols * 0.25), Math.floor(this.cols * 0.75)]
      : [Math.floor(this.cols * 0.12), Math.floor(this.cols * 0.88)];

    const pumpkin = [
      '  _/_  ',
      ' (O_O) ',
      '  `=\'  ',
    ];

    for (const pCol of pumpkinCols) {
      for (let r = 0; r < pumpkin.length; r++) {
        if (groundY + r < this.rows) {
          for (let c = 0; c < pumpkin[r].length; c++) {
            if (pCol + c < this.cols && pumpkin[r][c] !== ' ') {
              grid[groundY + r][pCol + c] = pumpkin[r][c];
            }
          }
        }
      }
    }

    // Bats in flight across open space
    const batX = Math.floor(((t * 12) % this.cols + this.cols) % this.cols);
    const batY = Math.floor(Math.sin(t * 0.8) * 3 + this.rows * 0.28);
    if (batY >= 0 && batY < this.rows && batX + 4 < this.cols) {
      grid[batY][batX] = '^';
      grid[batY][batX + 1] = 'v';
      grid[batY][batX + 2] = '^';
    }
  }

  /* ------------------------------------------------------------- */
  /* SCENE 4: WINTER / CHRISTMAS (Dense Snowstorm & Fences)        */
  /* ------------------------------------------------------------- */
  private drawWinterScene(grid: string[][], t: number, isPortrait: boolean): void {
    // 1. Snow clouds in the upper sky
    const cloudRow = 1;
    for (let c = 4; c < this.cols - 12; c += 22) {
      const cloud = '.( ___ ).';
      for (let i = 0; i < cloud.length; i++) {
        if (c + i < this.cols && cloudRow < this.rows) grid[cloudRow][c + i] = cloud[i];
      }
    }

    // 2. Heavy snowfall across all open space
    const flakeCount = Math.min(85, Math.floor(this.cols * 0.95));
    const ground = Math.min(this.rows - 2, Math.floor(this.rows * 0.92));

    for (let i = 0; i < flakeCount; i++) {
      const seed = i * 43.1;
      const speedY = 0.5 + (i % 3) * 0.25;
      const sway = Math.sin(t * 0.9 + seed) * 2.2;

      const rawY = (seed + t * speedY * 6) % ground;
      const r = Math.floor(rawY);
      const c = Math.floor(((seed * 2.4 + sway) % this.cols + this.cols) % this.cols);

      if (r >= 0 && r < ground && c >= 0 && c < this.cols) {
        const glyph = (i % 5 === 0) ? '❅' : (i % 3 === 0) ? '*' : (i % 2 === 0) ? '+' : '·';
        grid[r][c] = glyph;
      }
    }

    // 3. Wooden fence with snow caps along the bottom
    const fenceRow = ground - 2;
    if (fenceRow >= 0 && fenceRow < this.rows) {
      for (let c = 0; c < this.cols; c++) {
        if (c % 8 === 0) {
          if (fenceRow - 1 >= 0) grid[fenceRow - 1][c] = '▔'; // snow cap on post
          grid[fenceRow][c] = '|';
          if (fenceRow + 1 < this.rows) grid[fenceRow + 1][c] = '|';
        } else {
          grid[fenceRow][c] = '─';
        }
      }
    }

    // 4. Little snowman in open bottom area
    const snowmanCol = Math.max(2, Math.floor(this.cols * (isPortrait ? 0.75 : 0.85)));
    const snowmanRow = fenceRow - 3;
    if (snowmanRow >= 0 && snowmanRow + 3 < this.rows && snowmanCol + 7 < this.cols) {
      const snowman = [
        ' _[===]_ ',
        '  (\'.\')  ',
        '  ( : )  ',
        ' (  :  ) ',
      ];
      for (let r = 0; r < snowman.length; r++) {
        for (let c = 0; c < snowman[r].length; c++) {
          if (snowman[r][c] !== ' ') {
            grid[snowmanRow + r][snowmanCol + c] = snowman[r][c];
          }
        }
      }
    }
  }

  /* ------------------------------------------------------------- */
  /* SCENE 5: ISSUE X (Corrupted CRT Television Static & Glitch)   */
  /* ------------------------------------------------------------- */
  private drawStaticScene(grid: string[][], t: number): void {
    const chars = ' .:+░▒▓█#X%§Ӝ';
    const scanline = Math.floor((t * 5) % this.rows);

    for (let r = 0; r < this.rows; r++) {
      const isScan = Math.abs(r - scanline) <= 1;
      const density = isScan ? 0.45 : 0.12;

      for (let c = 0; c < this.cols; c += 2) {
        const n = Math.sin(r * 12.9898 + c * 78.233 + t * 50);
        if (Math.abs(n) > 1 - density) {
          const chIdx = Math.floor(Math.abs(n) * chars.length) % chars.length;
          grid[r][c] = chars[chIdx];
        }
      }
    }

    // Intermittent corrupted lore fragments flashing in the static
    const glitches = ['403 FORBIDDEN', 'WAKE UP', 'CORRUPTED', '{THIS BOOK SHOULD NOT EXIST}', 'ɨȶ'];
    const glitchIdx = Math.floor(t * 0.8) % glitches.length;
    const gText = glitches[glitchIdx];
    const gRow = Math.floor(((t * 3) % (this.rows - 4)) + 2);
    const gCol = Math.floor(((t * 7) % Math.max(1, this.cols - gText.length)));

    if (Math.sin(t * 2.5) > 0.4 && gRow < this.rows) {
      for (let i = 0; i < gText.length; i++) {
        if (gCol + i < this.cols) grid[gRow][gCol + i] = gText[i];
      }
    }
  }

  /* ------------------------------------------------------------- */
  /* SCENE 6: INTRO (Celestial Moon Phases & Nebula Starlight)     */
  /* ------------------------------------------------------------- */
  private drawCelestialScene(grid: string[][], t: number, isPortrait: boolean): void {
    // 1. Large detailed Moon
    const moonCol = Math.max(4, Math.floor(this.cols * (isPortrait ? 0.5 : 0.78)) - 4);
    const moonRow = Math.max(1, Math.floor(this.rows * 0.08));

    const moonPhase = Math.floor((t * 0.2) % 4);
    let moonSprite = [
      '   .----.   ',
      '  /  ..  \\  ',
      ' |  (  )  | ',
      '  \\  \'\'  /  ',
      '   `----\'   ',
    ];
    if (moonPhase === 0) {
      moonSprite = [
        '   .----.   ',
        '  / (    \\  ',
        ' | (      | ',
        '  \\ (    /  ',
        '   `----\'   ',
      ];
    } else if (moonPhase === 1) {
      moonSprite = [
        '   .----.   ',
        '  / |    \\  ',
        ' |  |     | ',
        '  \\ |    /  ',
        '   `----\'   ',
      ];
    }

    for (let r = 0; r < moonSprite.length; r++) {
      if (moonRow + r < this.rows) {
        for (let c = 0; c < moonSprite[r].length; c++) {
          if (moonCol + c < this.cols && moonSprite[r][c] !== ' ') {
            grid[moonRow + r][moonCol + c] = moonSprite[r][c];
          }
        }
      }
    }

    // 2. Dense constellation stars and nebulas across the sky
    const starCount = Math.min(60, Math.floor(this.cols * 0.8));
    for (let i = 0; i < starCount; i++) {
      const seed = i * 79.3;
      const c = Math.floor(seed % this.cols);
      const r = Math.floor((seed * 0.45) % this.rows);
      const pulse = Math.sin(t * 1.3 + seed);

      if (r < this.rows && c < this.cols && pulse > 0.35) {
        const glyph = pulse > 0.85 ? '✦' : pulse > 0.6 ? '*' : (i % 2 === 0) ? '+' : '·';
        grid[r][c] = glyph;
      }
    }

    // 3. Ancient Astrolabe / Planetary Alignment at bottom
    const astrolabeRow = Math.min(this.rows - 3, Math.floor(this.rows * 0.9));
    if (astrolabeRow < this.rows) {
      const ring = '---( ( ( ⏼ ) ) )---';
      const startC = Math.max(2, Math.floor((this.cols - ring.length) / 2));
      for (let i = 0; i < ring.length; i++) {
        if (startC + i < this.cols) grid[astrolabeRow][startC + i] = ring[i];
      }
    }
  }
}
