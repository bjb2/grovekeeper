import { useState, useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Frequencies — C major pentatonic
// ---------------------------------------------------------------------------
const C3 = 130.81, E3 = 164.81, G3 = 196.00, A3 = 220.00;
const C4 = 261.63, D4 = 293.66, E4 = 329.63, G4 = 392.00, A4 = 440.00;
const C5 = 523.25, E5 = 659.25, G5 = 783.99;

// ---------------------------------------------------------------------------
// Sequences
// ---------------------------------------------------------------------------

// Build — "Grove at Dawn" | 80 BPM, 16 steps, 0.75 s/step = 12 s loop
// 4 bars: rise → fall → climb to peak → resolve
const BUILD_SEQ: ([number, number] | null)[] = [
  [E4, 0.10], null,       [G4, 0.09], [A4, 0.10],
  [G4, 0.09], [E4, 0.08], [D4, 0.09], null,
  [E4, 0.09], [G4, 0.08], [A4, 0.10], [C5, 0.09],
  [A4, 0.09], null,       [G4, 0.08], [E4, 0.09],
];
// One bass note per bar (I – V – I – vi in C)
const BUILD_BASS: ([number, number] | null)[] = [
  [C3, 0.07], null, null, null,
  [G3, 0.06], null, null, null,
  [C3, 0.06], null, null, null,
  [A3, 0.06], null, null, null,
];
const BUILD_STEP = 0.75;

// Combat — "Root Battle" | 120 BPM, 16 steps, 0.5 s/step = 8 s loop
// Continuous drive: ascending arpeggio → fall → low sweep → resolution
const COMBAT_SEQ: ([number, number] | null)[] = [
  [C4, 0.12], [E4, 0.10], [G4, 0.11], [A4, 0.11],
  [G4, 0.10], [E4, 0.09], [D4, 0.10], [C4, 0.11],
  [G3, 0.09], [A3, 0.09], [C4, 0.10], [E4, 0.10],
  [G4, 0.11], [A4, 0.11], null,       [E4, 0.10],
];
// Bass every 2 steps — rhythmic pulse
const COMBAT_BASS: ([number, number] | null)[] = [
  [C3, 0.09], null, [G3, 0.07], null,
  [C3, 0.08], null, [G3, 0.07], null,
  [C3, 0.08], null, [G3, 0.07], null,
  [A3, 0.08], null, [G3, 0.07], null,
];
const COMBAT_STEP = 0.5;

const LOOK_AHEAD = 0.4;
const TICK_MS    = 100;

// ---------------------------------------------------------------------------
// Audio graph construction helpers
// ---------------------------------------------------------------------------

/** Procedural reverb impulse response — small hall, pre-delayed, stereo. */
function buildImpulse(ctx: AudioContext, duration = 1.6, decay = 2.8): AudioBuffer {
  const sr       = ctx.sampleRate;
  const preDelay = Math.floor(sr * 0.008); // 8 ms pre-delay
  const len      = Math.floor(sr * duration);
  const buf      = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = preDelay; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - (i - preDelay) / (len - preDelay), decay);
    }
  }
  return buf;
}

/**
 * Build the full audio graph and return refs to the bus nodes.
 *
 * Signal flow:
 *   notes → musicBus → warmthFilter ─┬─ (dry)  ─────────────────────────────┐
 *                                    └─ reverbSend → convolver → reverbReturn┤
 *   sfx → sfxBus ───────────────────────────────────────────────────────────→ masterGain → compressor → out
 */
function buildGraph(ctx: AudioContext) {
  // Output chain
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.knee.value      = 12;
  comp.ratio.value     = 3.5;
  comp.attack.value    = 0.004;
  comp.release.value   = 0.12;
  comp.connect(ctx.destination);

  const master = ctx.createGain();
  master.gain.value = 0.72;
  master.connect(comp);

  // SFX bus — direct, no reverb (keeps punches tight)
  const sfxBus = ctx.createGain();
  sfxBus.gain.value = 1.0;
  sfxBus.connect(master);

  // Music bus + warmth
  const musicBus = ctx.createGain();
  musicBus.gain.value = 0.58;

  const warmth = ctx.createBiquadFilter();
  warmth.type            = 'lowpass';
  warmth.frequency.value = 3800;
  warmth.Q.value         = 0.5;
  musicBus.connect(warmth);

  // Dry path
  warmth.connect(master);

  // Wet (reverb) path
  const reverb = ctx.createConvolver();
  reverb.buffer = buildImpulse(ctx);

  const reverbSend = ctx.createGain();
  reverbSend.gain.value = 0.5;
  warmth.connect(reverbSend);
  reverbSend.connect(reverb);

  const reverbReturn = ctx.createGain();
  reverbReturn.gain.value = 0.42;
  reverb.connect(reverbReturn);
  reverbReturn.connect(master);

  return { master, musicBus, sfxBus };
}

// ---------------------------------------------------------------------------
// Note-level helpers
// ---------------------------------------------------------------------------

/**
 * Two detuned oscillators + lowpass filter = chorus-warmed pluck.
 * Used for all melody notes. Timing and velocity are slightly humanised.
 */
function richPluck(
  ctx:   AudioContext,
  dest:  AudioNode,
  freq:  number,
  when:  number,
  vol:   number,
  decay: number,
  type:  OscillatorType = 'triangle',
) {
  // Humanise: ±12 ms timing jitter, 88–115 % velocity
  const t = when + (Math.random() - 0.5) * 0.024;
  const v = vol  * (0.88 + Math.random() * 0.27);

  for (const detune of [-4, 4]) {
    const osc    = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const env    = ctx.createGain();

    osc.type            = type;
    osc.frequency.value = freq;
    osc.detune.value    = detune;

    filter.type            = 'lowpass';
    filter.frequency.value = 3200;
    filter.Q.value         = 0.35;

    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(v * 0.55, t + 0.013);
    env.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(decay, 0.08));

    osc.connect(filter);
    filter.connect(env);
    env.connect(dest);
    osc.start(t);
    osc.stop(t + decay + 0.15);
  }
}

/** Clean sine pluck for bass lines — single oscillator, no chorus. */
function sinePluck(
  ctx:   AudioContext,
  dest:  AudioNode,
  freq:  number,
  when:  number,
  vol:   number,
  decay: number,
) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type            = 'sine';
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0.0001, when);
  env.gain.linearRampToValueAtTime(vol, when + 0.022);
  env.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(decay, 0.12));
  osc.connect(env);
  env.connect(dest);
  osc.start(when);
  osc.stop(when + decay + 0.18);
}

/** Sustained pad chord swells in at the start of every loop iteration. */
function schedulePad(
  ctx:      AudioContext,
  dest:     AudioNode,
  when:     number,
  duration: number,
  phase:    'build' | 'combat',
) {
  const notes: [number, number][] =
    phase === 'build'
      ? [[C3, 0.038], [E3, 0.026], [G3, 0.026]] // C major — warm & open
      : [[C3, 0.048], [G3, 0.038]];              // power chord — tense & grounded

  const attack  = Math.min(2.2, duration * 0.18);
  const release = Math.min(2.2, duration * 0.18);

  for (const [freq, vol] of notes) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type            = 'sine';
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0.0001, when);
    env.gain.linearRampToValueAtTime(vol, when + attack);
    env.gain.setValueAtTime(vol, when + duration - release);
    env.gain.linearRampToValueAtTime(0.0001, when + duration);
    osc.connect(env);
    env.connect(dest);
    osc.start(when);
    osc.stop(when + duration + 0.2);
  }
}

/** Simple sharp pluck for SFX — no chorus, no humanisation. */
function pluck(
  ctx:   AudioContext,
  dest:  AudioNode,
  freq:  number,
  when:  number,
  vol:   number,
  decay: number,
  type:  OscillatorType = 'triangle',
) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type            = type;
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0.0001, when);
  env.gain.linearRampToValueAtTime(vol, when + 0.011);
  env.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(decay, 0.06));
  osc.connect(env);
  env.connect(dest);
  osc.start(when);
  osc.stop(when + decay + 0.1);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export type SfxType =
  | 'plant_attack'
  | 'enemy_attack'
  | 'heal'
  | 'effect'
  | 'victory'
  | 'defeat'
  | 'buy'
  | 'place';

export function useSound() {
  const ctxRef       = useRef<AudioContext | null>(null);
  const masterRef    = useRef<GainNode | null>(null);
  const musicBusRef  = useRef<GainNode | null>(null);
  const sfxBusRef    = useRef<GainNode | null>(null);
  const schedulerRef    = useRef<number | null>(null);
  const stepRef         = useRef(0);
  const nextNoteRef     = useRef(0.0);
  const phaseRef        = useRef<'build' | 'combat' | 'off'>('off');
  const musicMutedRef   = useRef(true);  // music off by default
  const sfxMutedRef     = useRef(false);
  const [musicMuted, setMusicMuted] = useState(true);
  const [sfxMuted,   setSfxMuted]   = useState(false);

  function getCtx(): AudioContext {
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const { master, musicBus, sfxBus } = buildGraph(ctx);
      masterRef.current   = master;
      musicBusRef.current = musicBus;
      sfxBusRef.current   = sfxBus;
    }
    return ctxRef.current;
  }

  function scheduleNotes() {
    const ctx  = ctxRef.current;
    const dest = musicBusRef.current;
    if (!ctx || !dest || ctx.state !== 'running' || phaseRef.current === 'off' || musicMutedRef.current) return;

    const isBuild  = phaseRef.current === 'build';
    const seq      = isBuild ? BUILD_SEQ   : COMBAT_SEQ;
    const bass     = isBuild ? BUILD_BASS  : COMBAT_BASS;
    const stepDur  = isBuild ? BUILD_STEP  : COMBAT_STEP;
    const loopLen  = seq.length;

    while (nextNoteRef.current < ctx.currentTime + LOOK_AHEAD) {
      const idx = stepRef.current % loopLen;

      // Melody
      const note = seq[idx];
      if (note) richPluck(ctx, dest, note[0], nextNoteRef.current, note[1], stepDur * 0.88);

      // Bass
      const bn = bass[idx];
      if (bn)   sinePluck(ctx, dest, bn[0], nextNoteRef.current, bn[1], stepDur * 2.0);

      // Pad chord at the start of each loop
      if (idx === 0) {
        schedulePad(ctx, dest, nextNoteRef.current, loopLen * stepDur, phaseRef.current);
      }

      stepRef.current++;
      nextNoteRef.current += stepDur;
    }
  }

  function startScheduler() {
    if (schedulerRef.current !== null) return;
    schedulerRef.current = window.setInterval(scheduleNotes, TICK_MS);
    scheduleNotes();
  }

  function stopScheduler() {
    if (schedulerRef.current !== null) {
      clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }
  }

  // Resume suspended AudioContext on first user gesture, then kick off music.
  useEffect(() => {
    const onGesture = () => {
      const ctx = ctxRef.current;
      if (!ctx || ctx.state !== 'suspended') return;
      ctx.resume().then(() => {
        if (phaseRef.current !== 'off' && !musicMutedRef.current) {
          stepRef.current     = 0;
          nextNoteRef.current = ctx.currentTime + 0.05;
          startScheduler();
        }
      });
    };
    document.addEventListener('pointerdown', onGesture);
    return () => document.removeEventListener('pointerdown', onGesture);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      stopScheduler();
      ctxRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPhase = useCallback((newPhase: 'build' | 'combat' | 'off') => {
    if (phaseRef.current === newPhase) return;
    const ctx = getCtx();
    phaseRef.current    = newPhase;
    stepRef.current     = 0;
    nextNoteRef.current = ctx.currentTime + 0.05;
    if (newPhase === 'off') {
      stopScheduler();
    } else {
      startScheduler();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMusicMute = useCallback(() => {
    const next = !musicMutedRef.current;
    musicMutedRef.current = next;
    setMusicMuted(next);
    if (!next && phaseRef.current !== 'off' && ctxRef.current) {
      // Unmuting — reset note cursor so music starts from now
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      stepRef.current     = 0;
      nextNoteRef.current = ctx.currentTime + 0.05;
      startScheduler();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSfxMute = useCallback(() => {
    const next = !sfxMutedRef.current;
    sfxMutedRef.current = next;
    setSfxMuted(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playSfx = useCallback((type: SfxType, delay = 0) => {
    if (sfxMutedRef.current) return;
    const ctx = getCtx();
    if (ctx.state === 'suspended') return;
    const dest = sfxBusRef.current!;
    const t    = ctx.currentTime + delay;

    switch (type) {
      case 'plant_attack':
        // High chime pair — bright, snappy
        pluck(ctx, dest, G5, t,        0.15, 0.28, 'triangle');
        pluck(ctx, dest, E5, t + 0.07, 0.10, 0.22, 'triangle');
        break;

      case 'enemy_attack':
        // Low impact — sawtooth body + sine sub
        pluck(ctx, dest, A3,       t,        0.19, 0.17, 'sawtooth');
        pluck(ctx, dest, G3 * 0.7, t + 0.02, 0.11, 0.13, 'sine');
        break;

      case 'heal':
        // Ascending triad — warm sines
        pluck(ctx, dest, C4, t,        0.10, 0.30, 'sine');
        pluck(ctx, dest, E4, t + 0.09, 0.10, 0.35, 'sine');
        pluck(ctx, dest, G4, t + 0.18, 0.10, 0.40, 'sine');
        break;

      case 'effect':
        // Ethereal sparkle
        pluck(ctx, dest, A4, t,        0.08, 0.18, 'triangle');
        pluck(ctx, dest, E5, t + 0.05, 0.07, 0.18, 'triangle');
        break;

      case 'victory':
        // Ascending C major arpeggio to a held high C
        [C4, E4, G4, C5].forEach((f, i) =>
          pluck(ctx, dest, f, t + i * 0.14, 0.17, i === 3 ? 1.0 : 0.65, 'triangle'),
        );
        break;

      case 'defeat':
        // Descending minor tones — slow, solemn
        [G4, E4, C4, A3].forEach((f, i) =>
          pluck(ctx, dest, f, t + i * 0.22, 0.14, 0.9, 'sine'),
        );
        break;

      case 'buy':
        // Bright coin double-tap
        pluck(ctx, dest, E5, t,        0.12, 0.13, 'triangle');
        pluck(ctx, dest, G5, t + 0.08, 0.09, 0.12, 'triangle');
        break;

      case 'place':
        // Earthy thud
        pluck(ctx, dest, G3, t, 0.10, 0.11, 'triangle');
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { setPhase, playSfx, toggleMusicMute, toggleSfxMute, musicMuted, sfxMuted };
}
