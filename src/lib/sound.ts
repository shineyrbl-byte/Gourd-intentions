// Tiny sound effects made with the Web Audio API, so there are no audio files to load.
let ctx: AudioContext | null = null;
let muted = localStorage.getItem("gi.muted") === "1";

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  localStorage.setItem("gi.muted", m ? "1" : "0");
}

function tone(freq: number, end: number, dur: number, type: OscillatorType, vol = 0.15, delay = 0) {
  if (muted) return;
  ctx ??= new AudioContext();
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(end, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur);
}

export const sounds = {
  plant: () => tone(500, 900, 0.12, "triangle"),
  pie: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.18, "triangle", 0.12, i * 0.09)),
  ghost: () => {
    tone(320, 520, 0.6, "sine", 0.12);
    tone(520, 260, 0.9, "sine", 0.1, 0.55);
  },
  splat: () => tone(160, 40, 0.25, "sawtooth", 0.12),
  tick: () => tone(1200, 900, 0.05, "square", 0.05),
};
