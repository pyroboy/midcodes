/**
 * Lightweight Web Audio API sound effects for POS UI feedback.
 * No external files needed — tones are synthesized on the fly.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
	if (!ctx) ctx = new AudioContext();
	// Resume if suspended (browsers block autoplay until user gesture)
	if (ctx.state === 'suspended') ctx.resume();
	return ctx;
}

export type SoundPreset = 'click' | 'error' | 'success' | 'warning' | 'sale';

interface ToneStep {
	frequency: number;
	delay: number;
	duration: number;
	type: OscillatorType;
	gain: number;
}

function playTone(audioCtx: AudioContext, freq: number, startTime: number, duration: number, type: OscillatorType, gain: number) {
	const osc = audioCtx.createOscillator();
	const vol = audioCtx.createGain();
	osc.type = type;
	osc.frequency.value = freq;
	vol.gain.setValueAtTime(gain, startTime);
	// Fade out to avoid pop
	vol.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
	osc.connect(vol);
	vol.connect(audioCtx.destination);
	osc.start(startTime);
	osc.stop(startTime + duration);
}

function playSequence(audioCtx: AudioContext, steps: ToneStep[]) {
	const now = audioCtx.currentTime;
	for (const step of steps) {
		playTone(audioCtx, step.frequency, now + step.delay, step.duration, step.type, step.gain);
	}
}

/** Preset tone sequences */
const PRESETS: Record<SoundPreset, ToneStep[]> = {
	/** Soft click for numpad / stepper buttons */
	click: [
		{ frequency: 800, delay: 0, duration: 0.04, type: 'sine', gain: 0.15 }
	],

	/** Short buzz for wrong PIN / validation errors */
	error: [
		{ frequency: 200, delay: 0, duration: 0.15, type: 'square', gain: 0.12 },
		{ frequency: 150, delay: 0.12, duration: 0.15, type: 'square', gain: 0.12 }
	],

	/** Pleasant two-note chime for generic confirms (PIN accepted, pax set) */
	success: [
		{ frequency: 660, delay: 0, duration: 0.12, type: 'sine', gain: 0.18 },
		{ frequency: 880, delay: 0.1, duration: 0.15, type: 'sine', gain: 0.18 }
	],

	/** Alert tone for void / destructive actions */
	warning: [
		{ frequency: 440, delay: 0, duration: 0.1, type: 'triangle', gain: 0.2 },
		{ frequency: 330, delay: 0.1, duration: 0.15, type: 'triangle', gain: 0.2 }
	],

	/**
	 * Ka-ching! — celebratory sale-complete sound.
	 * Three-note ascending arpeggio (C6→E6→G6) with a shimmer overtone on top.
	 * Designed to feel rewarding without being obnoxious on repeat.
	 */
	sale: [
		// Base arpeggio — bright sine tones stepping up a major triad
		{ frequency: 1047, delay: 0, duration: 0.12, type: 'sine', gain: 0.2 },      // C6
		{ frequency: 1319, delay: 0.08, duration: 0.12, type: 'sine', gain: 0.22 },   // E6
		{ frequency: 1568, delay: 0.16, duration: 0.25, type: 'sine', gain: 0.24 },   // G6 (longest — resolves)
		// Shimmer overtone — soft high harmonic that gives the "ring" of a register
		{ frequency: 3136, delay: 0.16, duration: 0.3, type: 'sine', gain: 0.06 },    // G7 (octave above, very soft)
		// Warm sub-layer — triangle an octave below the root for body
		{ frequency: 523, delay: 0, duration: 0.15, type: 'triangle', gain: 0.08 },   // C5
	]
};

export function playSound(preset: SoundPreset) {
	try {
		const audioCtx = getCtx();
		playSequence(audioCtx, PRESETS[preset]);
	} catch {
		// Audio not available — fail silently (POS still works)
	}
}
