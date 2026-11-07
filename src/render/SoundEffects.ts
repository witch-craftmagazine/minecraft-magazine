export class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled = true;

  constructor() {
    // Lazily initialized on first user gesture
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  private initContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Synthesizes the authentic Minecraft book page turn sound.
   * Consists of a gentle paper rustle followed by a crisp page snap.
   */
  public playPageTurn(): void {
    if (!this.enabled) return;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // 1. White noise buffer for paper friction
      const bufferSize = ctx.sampleRate * 0.18; // 180ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // Bandpass filter to sculpt parchment sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 0.08);
      filter.frequency.exponentialRampToValueAtTime(1800, now + 0.18);
      filter.Q.setValueAtTime(3.0, now);

      // Volume envelope
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + 0.18);

      // 2. High-frequency crisp snap click
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(800, now + 0.05);
      snapOsc.frequency.exponentialRampToValueAtTime(150, now + 0.09);

      snapGain.gain.setValueAtTime(0.001, now + 0.05);
      snapGain.gain.linearRampToValueAtTime(0.2, now + 0.055);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);

      snapOsc.start(now + 0.05);
      snapOsc.stop(now + 0.09);
    } catch {
      // Audio playback failed or blocked by autoplay policy
    }
  }
}

export const soundManager = new SoundManager();
