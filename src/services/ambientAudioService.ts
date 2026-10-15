/**
 * Pure Web Audio API Ambient Sound Synthesizer
 * 100% offline, zero external audio files, lightweight and continuous
 */

export type AmbientSoundType = 'rain' | 'coffee' | 'alpha-waves' | 'ocean' | 'campfire';

export interface AmbientSoundMeta {
  id: AmbientSoundType;
  name: string;
  icon: string;
  description: string;
}

export const AMBIENT_SOUNDS: AmbientSoundMeta[] = [
  { id: 'rain', name: 'Yağmur', icon: '🌧️', description: 'Yumuşak dinlendirici yağmur ve damlalar' },
  { id: 'coffee', name: 'Kafe', icon: '☕', description: 'Sıcak kafe uğultusu ve çalışma ambiyansı' },
  { id: 'alpha-waves', name: '10Hz Alfa Dalgası', icon: '🧠', description: 'Odaklanma ve hafıza için çift kulak dalgaları' },
  { id: 'ocean', name: 'Okyanus Dalgaları', icon: '🌊', description: 'Ritmik ritim tutan deniz ve kıyı dalgaları' },
  { id: 'campfire', name: 'Şömine Ateşi', icon: '🔥', description: 'Çıtırtılı rahatlatıcı kamp ateşi' },
];

class AmbientAudioService {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeSound: AmbientSoundType | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private volume: number = 0.5;

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public getActiveSound(): AmbientSoundType | null {
    return this.activeSound;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
  }

  public stop() {
    this.activeNodes.forEach((node) => {
      if (typeof node === 'number') {
        window.clearInterval(node);
      } else {
        try {
          if ('stop' in node && typeof (node as any).stop === 'function') {
            (node as any).stop();
          }
          node.disconnect();
        } catch (_) {}
      }
    });
    this.activeNodes = [];
    this.activeSound = null;
  }

  public play(type: AmbientSoundType) {
    this.initContext();
    if (!this.audioCtx) return;

    // If already playing this type, toggle off
    if (this.activeSound === type) {
      this.stop();
      return;
    }

    this.stop();
    this.activeSound = type;

    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    this.masterGain.connect(this.audioCtx.destination);
    this.activeNodes.push(this.masterGain);

    switch (type) {
      case 'rain':
        this.synthesizeRain();
        break;
      case 'coffee':
        this.synthesizeCoffee();
        break;
      case 'alpha-waves':
        this.synthesizeAlphaWaves();
        break;
      case 'ocean':
        this.synthesizeOcean();
        break;
      case 'campfire':
        this.synthesizeCampfire();
        break;
    }
  }

  // 1. Rain Synthesizer: Filtered Pink Noise + Random Droplet clicks
  private synthesizeRain() {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;

    // Generate 5s pink noise loop buffer
    const bufferSize = ctx.sampleRate * 5;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Lowpass filter for smooth rainfall
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.masterGain);
    whiteNoise.start(0);

    this.activeNodes.push(whiteNoise, filter);
  }

  // 2. Coffee Shop: Low rumble warmth + resonance
  private synthesizeCoffee() {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;

    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 0.5;
    }

    const brownNoise = ctx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(320, ctx.currentTime);
    bandpass.Q.setValueAtTime(1.2, ctx.currentTime);

    brownNoise.connect(bandpass);
    bandpass.connect(this.masterGain);
    brownNoise.start(0);

    this.activeNodes.push(brownNoise, bandpass);
  }

  // 3. Binaural 10Hz Alpha Waves: 200Hz Left, 210Hz Right
  private synthesizeAlphaWaves() {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;

    const oscLeft = ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(200, ctx.currentTime);

    const oscRight = ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(210, ctx.currentTime); // 10Hz beat = Alpha focus

    const merger = ctx.createChannelMerger(2);
    oscLeft.connect(merger, 0, 0);
    oscRight.connect(merger, 0, 1);

    const waveGain = ctx.createGain();
    waveGain.gain.setValueAtTime(0.18, ctx.currentTime);

    merger.connect(waveGain);
    waveGain.connect(this.masterGain);

    oscLeft.start(0);
    oscRight.start(0);

    this.activeNodes.push(oscLeft, oscRight, merger, waveGain);
  }

  // 4. Ocean Waves: LFO modulated pink noise swell
  private synthesizeOcean() {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;

    const bufferSize = ctx.sampleRate * 6;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.12;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    // LFO for rhythmic swells every 7 seconds
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.14, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(320, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    source.connect(filter);
    filter.connect(this.masterGain);

    source.start(0);
    lfo.start(0);

    this.activeNodes.push(source, filter, lfo, lfoGain);
  }

  // 5. Campfire: Warm low noise + crackle impulses
  private synthesizeCampfire() {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;

    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.08;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.masterGain);
    noise.start(0);

    // Random pops timer
    const interval = window.setInterval(() => {
      if (!this.audioCtx || !this.masterGain || this.activeSound !== 'campfire') return;
      if (Math.random() > 0.45) {
        const osc = this.audioCtx.createOscillator();
        const popGain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100 + Math.random() * 600, this.audioCtx.currentTime);
        popGain.gain.setValueAtTime(0.08 + Math.random() * 0.1, this.audioCtx.currentTime);
        popGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04);
        osc.connect(popGain);
        popGain.connect(this.masterGain);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.05);
      }
    }, 180);

    this.activeNodes.push(noise, filter, interval);
  }
}

export const ambientAudioService = new AmbientAudioService();
