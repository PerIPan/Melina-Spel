// Simple sound effects using Web Audio API — no files needed
let muted = localStorage.getItem("melina-muted") === "true";

export function isMuted(): boolean { return muted; }
export function setMuted(val: boolean): void {
  muted = val;
  localStorage.setItem("melina-muted", String(val));
}

const audioCtx = () => new (window.AudioContext || (window as any).webkitAudioContext)();

function playTone(frequency: number, duration: number, type: OscillatorType = "sine") {
  if (muted) return;
  const ctx = audioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.value = 0.15;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playClick() {
  playTone(800, 0.08, "square");
}

export function playCorrect() {
  // happy ascending notes
  setTimeout(() => playTone(523, 0.15), 0);
  setTimeout(() => playTone(659, 0.15), 120);
  setTimeout(() => playTone(784, 0.25), 240);
}

export function playWrong() {
  playTone(300, 0.3, "sawtooth");
}

export function playLearn() {
  // magical learning sound
  setTimeout(() => playTone(400, 0.12), 0);
  setTimeout(() => playTone(600, 0.12), 100);
  setTimeout(() => playTone(800, 0.12), 200);
  setTimeout(() => playTone(1000, 0.2), 300);
}

export function playTimerTick() {
  playTone(1000, 0.05, "sine");
}

export function playTimerExpired() {
  setTimeout(() => playTone(500, 0.2, "sawtooth"), 0);
  setTimeout(() => playTone(400, 0.2, "sawtooth"), 150);
  setTimeout(() => playTone(300, 0.4, "sawtooth"), 300);
}

export function playQuizAnswer() {
  playTone(660, 0.1, "triangle");
}
