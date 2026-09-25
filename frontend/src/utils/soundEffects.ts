/**
 * Sound and Vibration Effects for Note on Web Notifications
 * Uses native Web Audio API synthesizer for zero-latency, offline, crystal-clear tones
 */

export type SoundTone = 'chime' | 'ding' | 'digital' | 'bell';

const SOUND_ENABLED_KEY = 'secure_note_sound_enabled';
const SOUND_TONE_KEY = 'secure_note_sound_tone';
const VIBRATION_ENABLED_KEY = 'secure_note_vibration_enabled';

export function getNotificationSoundSetting(): { soundEnabled: boolean; tone: SoundTone; vibrationEnabled: boolean } {
  if (typeof window === 'undefined') {
    return { soundEnabled: true, tone: 'chime', vibrationEnabled: true };
  }
  const soundEnabled = localStorage.getItem(SOUND_ENABLED_KEY) !== 'false';
  const tone = (localStorage.getItem(SOUND_TONE_KEY) as SoundTone) || 'chime';
  const vibrationEnabled = localStorage.getItem(VIBRATION_ENABLED_KEY) !== 'false';
  return { soundEnabled, tone, vibrationEnabled };
}

export function saveNotificationSoundSetting(settings: {
  soundEnabled?: boolean;
  tone?: SoundTone;
  vibrationEnabled?: boolean;
}) {
  if (typeof window === 'undefined') return;
  if (settings.soundEnabled !== undefined) {
    localStorage.setItem(SOUND_ENABLED_KEY, String(settings.soundEnabled));
  }
  if (settings.tone !== undefined) {
    localStorage.setItem(SOUND_TONE_KEY, settings.tone);
  }
  if (settings.vibrationEnabled !== undefined) {
    localStorage.setItem(VIBRATION_ENABLED_KEY, String(settings.vibrationEnabled));
  }
}

/**
 * Trigger mobile haptic vibration if supported
 */
export function triggerVibration(pattern: number | number[] = [120, 80, 120]) {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
  try {
    const { vibrationEnabled } = getNotificationSoundSetting();
    if (vibrationEnabled) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    // Ignore vibration errors
  }
}

/**
 * Play a synthesized sound tone using Web Audio API
 */
export function playNotificationSound(specificTone?: SoundTone) {
  if (typeof window === 'undefined') return;

  const { soundEnabled, tone } = getNotificationSoundSetting();
  if (!soundEnabled && !specificTone) return;

  const activeTone = specificTone || tone;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    switch (activeTone) {
      case 'ding': {
        // High crisp ding
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1318.51, now); // E6
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
        break;
      }

      case 'digital': {
        // Double digital chirp
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.setValueAtTime(0.05, now + 0.07);
        gain.gain.setValueAtTime(0.3, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }

      case 'bell': {
        // Resonant tubular bell
        const freqs = [523.25, 1046.5, 1567.98]; // C5, C6, G6
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = idx === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          const initialVol = 0.3 / (idx + 1);
          gain.gain.setValueAtTime(initialVol, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8 + idx * 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.2);
        });
        break;
      }

      case 'chime':
      default: {
        // Classic uplifting chime (F6 to A6 chord)
        const notes = [1396.91, 1760.0]; // F6, A6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startOffset = idx * 0.1;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + startOffset);
          gain.gain.setValueAtTime(0, now);
          gain.gain.setValueAtTime(0.35, now + startOffset);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + 0.7);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + startOffset);
          osc.stop(now + startOffset + 0.75);
        });
        break;
      }
    }
  } catch (err) {
    console.warn('AudioContext playback error:', err);
  }
}
