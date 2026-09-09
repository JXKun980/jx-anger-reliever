/**
 * Procedural cartoon SFX via Web Audio. No asset files.
 * Must be unlocked on the first user gesture (mobile autoplay policy).
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = true;
  private volume = 0.8;

  unlock(): void {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (Ctor) {
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.volume;
        this.master.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.volume;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
  }

  private out(): AudioNode {
    return this.master ?? (this.ctx as AudioContext).destination;
  }

  private rnd(base: number, pct: number): number {
    return base * (1 + (Math.random() * 2 - 1) * pct);
  }

  /** Short percussive impact: noise burst + pitch-down thump. */
  pow(): void {
    const ctx = this.ctx;
    if (!ctx || !this.enabled) return;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    const len = Math.floor(ctx.sampleRate * 0.12);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    noise.buffer = buffer;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = this.rnd(900, 0.1);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, now);
    ng.gain.exponentialRampToValueAtTime(0.7, now + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    noise.connect(lp).connect(ng).connect(this.out());
    noise.start(now);
    noise.stop(now + 0.13);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(this.rnd(180, 0.1), now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.5, now);
    og.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    osc.connect(og).connect(this.out());
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /** Springy "boi-oing" with downward glide + vibrato. */
  boing(): void {
    const ctx = this.ctx;
    if (!ctx || !this.enabled) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    const f0 = this.rnd(180, 0.1);
    osc.frequency.setValueAtTime(f0, now);
    osc.frequency.exponentialRampToValueAtTime(f0 * 0.5, now + 0.25);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 22;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 30;
    lfo.connect(lfoGain).connect(osc.frequency);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.35, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc.connect(g).connect(this.out());
    osc.start(now);
    lfo.start(now);
    osc.stop(now + 0.3);
    lfo.stop(now + 0.3);
  }

  /** Short cartoon yelp. */
  ow(): void {
    const ctx = this.ctx;
    if (!ctx || !this.enabled) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(this.rnd(420, 0.12), now);
    osc.frequency.linearRampToValueAtTime(300, now + 0.14);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 900;
    bp.Q.value = 4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.connect(bp).connect(g).connect(this.out());
    osc.start(now);
    osc.stop(now + 0.17);
  }

  hit(withVoice: boolean): void {
    this.pow();
    this.boing();
    if (withVoice) this.ow();
  }
}
