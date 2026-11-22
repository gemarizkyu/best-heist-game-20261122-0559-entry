// Gilded Vault — small synthesized sounds, no audio files.
// One job: turn game events into short WebAudio tones.
export function createAudio() {
  const audio = {
    context: null,
    muted: false,
    ensure() {
      if (!audio.context) {
        const Ctor = window.AudioContext ?? window.webkitAudioContext;
        if (!Ctor) return null;
        audio.context = new Ctor();
      }
      if (audio.context.state === 'suspended') audio.context.resume();
      return audio.context;
    },
    tone(frequency, seconds, type, gainValue, delay) {
      if (audio.muted) return;
      const ctx = audio.ensure();
      if (!ctx) return;
      const start = ctx.currentTime + (delay ?? 0);
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(gainValue, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + seconds + 0.02);
    },
    play(event) {
      if (audio.muted) return;
      if (event.type === 'grabbed') {
        audio.tone(880, 0.12, 'sine', 0.16);
        audio.tone(1318, 0.18, 'sine', 0.14, 0.09);
      } else if (event.type === 'spotted') {
        audio.tone(220, 0.16, 'square', 0.07);
        audio.tone(185, 0.2, 'square', 0.07, 0.12);
      } else if (event.type === 'chase') {
        audio.tone(330, 0.1, 'sawtooth', 0.08);
        audio.tone(262, 0.14, 'sawtooth', 0.08, 0.1);
      } else if (event.type === 'coin') {
        audio.tone(1567, 0.08, 'sine', 0.12);
        audio.tone(1175, 0.1, 'sine', 0.1, 0.18);
      } else if (event.type === 'emp') {
        audio.tone(1200, 0.25, 'sawtooth', 0.07);
        audio.tone(300, 0.3, 'sawtooth', 0.07, 0.05);
      } else if (event.type === 'laser') {
        audio.tone(140, 0.2, 'square', 0.12);
      } else if (event.type === 'clear') {
        audio.tone(523, 0.14, 'sine', 0.15);
        audio.tone(659, 0.14, 'sine', 0.15, 0.12);
        audio.tone(784, 0.26, 'sine', 0.15, 0.24);
      } else if (event.type === 'win') {
        audio.tone(523, 0.16, 'sine', 0.15);
        audio.tone(659, 0.16, 'sine', 0.15, 0.14);
        audio.tone(784, 0.16, 'sine', 0.15, 0.28);
        audio.tone(1046, 0.4, 'sine', 0.15, 0.42);
      } else if (event.type === 'busted' || event.type === 'caught') {
        audio.tone(110, 0.5, 'sawtooth', 0.14);
        audio.tone(82, 0.7, 'sawtooth', 0.14, 0.15);
      }
    },
  };
  return audio;
}
