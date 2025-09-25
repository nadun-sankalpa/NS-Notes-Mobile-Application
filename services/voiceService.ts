import { Platform } from 'react-native';

// Dynamically require to avoid bundling issues in web/Expo Go
let NativeVoice: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-voice/voice');
    NativeVoice = mod?.default ?? mod;
  } catch (e) {
    NativeVoice = null;
  }
}

export type VoiceCallbacks = {
  onResult?: (text: string) => void;
  onStartState?: (listening: boolean) => void;
  onError?: (err: unknown) => void;
};

// Web speech types (narrow)
type WebSpeechEvent = {
  results: ArrayLike<{ 0: { transcript: string } }>;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => any;
    webkitSpeechRecognition?: new () => any;
    _currentRecognition?: any | null;
  }
}

export const VoiceService = {
  init(callbacks: VoiceCallbacks) {
    if (Platform.OS === 'web') {
      // Nothing to init; handled in start/stop
      return () => {};
    }

    if (!NativeVoice) {
      // No native module (likely Expo Go)
      return () => {};
    }

    NativeVoice.onSpeechResults = (event: any) => {
      try {
        const value = event?.value?.[0];
        if (value && callbacks.onResult) callbacks.onResult(value);
      } catch (e) {
        callbacks.onError?.(e);
      }
    };

    NativeVoice.onSpeechStart = () => callbacks.onStartState?.(true);
    NativeVoice.onSpeechEnd = () => callbacks.onStartState?.(false);
    NativeVoice.onSpeechError = (e: any) => callbacks.onError?.(e);

    return () => {
      try {
        if (NativeVoice?.destroy) {
          const p = NativeVoice.destroy();
          if (p?.then) p.catch(() => {});
        }
      } catch (_) {}
    };
  },

  async isAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
    try {
      if (!NativeVoice?.isAvailable) return false;
      return await NativeVoice.isAvailable();
    } catch {
      return false;
    }
  },

  async start(locale = 'en-US') {
    if (Platform.OS === 'web') {
      const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
      if (!Ctor) throw new Error('Web SpeechRecognition not supported in this browser');
      const recog = new Ctor();
      recog.lang = locale;
      recog.continuous = false;
      recog.interimResults = false;
      recog.onresult = (e: WebSpeechEvent) => {
        /* no-op here; UI should read via callbacks in init if desired */
      };
      recog.start();
      window._currentRecognition = recog;
      return;
    }

    if (!NativeVoice) {
      throw new Error('Native voice module not available in this build. Use a Development Build, not Expo Go.');
    }

    try { await NativeVoice.stop?.(); } catch {}
    try { await NativeVoice.cancel?.(); } catch {}

    // Try plain start first
    try {
      await NativeVoice.start(locale);
      return;
    } catch (e1) {
      // Fallback options
      const alt = { RECOGNIZER_ENGINE: 'default', EXTRA_PARTIAL_RESULTS: true } as any;
      await NativeVoice.start(locale, alt);
    }
  },

  async stop() {
    if (Platform.OS === 'web') {
      try {
        if (window._currentRecognition) {
          window._currentRecognition.stop();
          window._currentRecognition = null;
        }
      } catch {}
      return;
    }
    try { await NativeVoice?.stop?.(); } catch {}
  },
};
