/**
 * Rest-timer sounds, synthesized with the Web Audio API. Nothing is downloaded,
 * so they work offline and never hit the network.
 */

export type RestSound = 'beep' | 'chime' | 'off';

type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (ctx) return ctx;
  const AudioCtor = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
  if (!AudioCtor) return null;
  ctx = new AudioCtor();
  return ctx;
}

/**
 * Browsers (and Android WebViews) start audio suspended until a user gesture.
 * Call this from any tap so later timer sounds can play on their own.
 */
export function unlockAudio() {
  const audio = getContext();
  if (audio && audio.state === 'suspended') {
    audio.resume().catch(() => {});
  }
}

function tone(
  audio: AudioContext,
  frequency: number,
  startOffset: number,
  duration: number,
  volume: number,
  type: OscillatorType
) {
  const start = audio.currentTime + startOffset;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  // Short attack/release so tones don't click.
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Short tick for the last seconds of a countdown. */
export function playTick(sound: RestSound) {
  if (sound === 'off') return;
  const audio = getContext();
  if (!audio) return;
  if (sound === 'beep') tone(audio, 880, 0, 0.12, 0.25, 'square');
  else tone(audio, 1318.5, 0, 0.25, 0.3, 'sine');
}

/** Signal that a countdown has finished. */
export function playEnd(sound: RestSound) {
  if (sound === 'off') return;
  const audio = getContext();
  if (!audio) return;
  if (sound === 'beep') {
    tone(audio, 880, 0, 0.14, 0.25, 'square');
    tone(audio, 1320, 0.18, 0.3, 0.25, 'square');
  } else {
    // C6 – E6 – G6 arpeggio.
    tone(audio, 1046.5, 0, 0.35, 0.3, 'sine');
    tone(audio, 1318.5, 0.12, 0.35, 0.3, 'sine');
    tone(audio, 1568, 0.24, 0.6, 0.3, 'sine');
  }
}

/** Preview a sound from Settings. */
export function previewSound(sound: RestSound) {
  unlockAudio();
  playEnd(sound);
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern);
  }
}
