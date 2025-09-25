// Minimal Web Speech API typings for browsers
// This safely types window.SpeechRecognition and window.webkitSpeechRecognition usage in web platform code.

export type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export interface SpeechRecognitionResultItemLike {
  0: { transcript: string };
}

export interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultItemLike>;
}

export interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEventLike) => void;
  onerror: (event: unknown) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    _currentRecognition?: SpeechRecognitionInstance | null;
  }
}

export {};
