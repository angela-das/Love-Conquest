
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private bgmInterval: any = null;
  private currentBgmType: 'valentine' | 'celebration' | 'sad' | null = null;

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterVolume = this.ctx.createGain();
    this.masterVolume.gain.value = 0.35;
    this.masterVolume.connect(this.ctx.destination);
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.1, fade = true) {
    if (!this.ctx || !this.masterVolume) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    if (fade) {
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    }
    
    osc.connect(gain);
    gain.connect(this.masterVolume);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playJump() { this.playTone(450, 0.25, 'triangle', 0.08); }
  playCollect() { 
    this.playTone(987.77, 0.1, 'sine', 0.1); 
    setTimeout(() => this.playTone(1318.51, 0.15, 'sine', 0.1), 50);
  }
  playBoxHit() { this.playTone(180, 0.15, 'triangle', 0.12); }
  playBalloon() { this.playTone(523, 0.4, 'sine', 0.08); }
  playVictory() { 
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.5, 'sine', 0.1), i * 120);
    });
  }
  playFirework() { 
    this.playTone(60 + Math.random() * 40, 0.5, 'sawtooth', 0.03, true);
    this.playTone(2000 + Math.random() * 1000, 0.1, 'sine', 0.02, true);
  }
  
  playDialogue(isFemale: boolean) { 
    const baseFreq = isFemale ? 750 : 500;
    const f = baseFreq + Math.random() * 120;
    // Softer, "cuter" blips
    this.playTone(f, 0.08, 'sine', 0.04, true);
    if (Math.random() > 0.5) {
      setTimeout(() => this.playTone(f * 1.2, 0.06, 'sine', 0.03, true), 40);
    }
  }
  
  playCrying() { 
    const now = this.ctx?.currentTime || 0;
    const osc = this.ctx!.createOscillator();
    const g = this.ctx!.createGain();
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.6);
    g.gain.setValueAtTime(0.08, now);
    g.gain.linearRampToValueAtTime(0, now + 0.6);
    osc.connect(g);
    g.connect(this.masterVolume!);
    osc.start();
    osc.stop(now + 0.6);
  }

  playDramatic() {
    this.playTone(110, 1.2, 'triangle', 0.15, true);
    this.playTone(115, 1.2, 'triangle', 0.15, true);
  }

  startBGM(type: 'valentine' | 'celebration' | 'sad' = 'valentine') {
    if (!this.ctx || !this.masterVolume) return;
    if (this.currentBgmType === type) return;
    this.stopBGM();
    this.currentBgmType = type;

    const playSequence = () => {
      if (type === 'valentine') {
        const melody = [
          587.33, 659.25, 523.25, 440.00, 493.88, 523.25, 392.00,
          587.33, 659.25, 783.99, 659.25, 523.25, 587.33, 392.00
        ];
        const durations = [0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.8, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.8];
        let noteIdx = 0;
        const playNextNote = () => {
          if (this.currentBgmType !== 'valentine') return;
          const freq = melody[noteIdx % melody.length];
          const dur = durations[noteIdx % durations.length];
          this.playTone(freq, dur * 0.9, 'triangle', 0.1);
          if (noteIdx % 4 === 0) this.playTone(freq / 2, 0.1, 'sine', 0.05);
          noteIdx++;
          this.bgmInterval = setTimeout(playNextNote, dur * 1000);
        };
        playNextNote();
      } else if (type === 'celebration') {
        const melody = [523.25, 659.25, 783.99, 1046.50];
        let noteIdx = 0;
        const playBeat = () => {
           if (this.currentBgmType !== 'celebration') return;
           this.playTone(melody[noteIdx % melody.length], 0.2, 'sine', 0.1);
           noteIdx++;
           this.bgmInterval = setTimeout(playBeat, 250);
        };
        playBeat();
      } else if (type === 'sad') {
        const melody = [329.63, 293.66, 261.63, 220.00];
        let noteIdx = 0;
        const playSlow = () => {
           if (this.currentBgmType !== 'sad') return;
           this.playTone(melody[noteIdx % melody.length], 1.5, 'sine', 0.08);
           noteIdx++;
           this.bgmInterval = setTimeout(playSlow, 2000);
        };
        playSlow();
      }
    };
    playSequence();
  }

  stopBGM() {
    if (this.bgmInterval) { clearTimeout(this.bgmInterval); this.bgmInterval = null; }
    this.currentBgmType = null;
  }

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  suspend() { if (this.ctx) this.ctx.suspend(); }
}

export const audio = new AudioManager();
