/**
 * Native Web Speech API Text-to-Speech (TTS) Service
 * Synthesizes natural spoken voice for notes, flashcards, OCR text, and annotations
 */

export interface VoiceLanguageOption {
  code: string;
  name: string;
  flag: string;
}

export const TTS_LANGUAGES: VoiceLanguageOption[] = [
  { code: 'tr-TR', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
  { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
];

class TextToSpeechService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isCurrentlySpeaking: boolean = false;
  private activeText: string = '';

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public getIsSpeaking(): boolean {
    return this.isCurrentlySpeaking;
  }

  public getActiveText(): string {
    return this.activeText;
  }

  public speak(
    text: string,
    options?: {
      lang?: string;
      rate?: number;
      pitch?: number;
      onEnd?: () => void;
      onError?: () => void;
    }
  ) {
    if (!this.isSupported() || !text.trim()) return;

    this.stop();

    const lang = options?.lang || 'tr-TR';
    const rate = options?.rate ?? 1.0;
    const pitch = options?.pitch ?? 1.0;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Pick best matching system voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.startsWith(lang.substring(0, 2)));
    if (voice) {
      utterance.voice = voice;
    }

    this.isCurrentlySpeaking = true;
    this.activeText = text;
    this.currentUtterance = utterance;

    utterance.onend = () => {
      this.isCurrentlySpeaking = false;
      this.activeText = '';
      this.currentUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = () => {
      this.isCurrentlySpeaking = false;
      this.activeText = '';
      this.currentUtterance = null;
      options?.onError?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stop() {
    if (!this.isSupported()) return;
    window.speechSynthesis.cancel();
    this.isCurrentlySpeaking = false;
    this.activeText = '';
    this.currentUtterance = null;
  }

  public toggle(text: string, lang = 'tr-TR', onEnd?: () => void) {
    if (this.isCurrentlySpeaking && this.activeText === text) {
      this.stop();
    } else {
      this.speak(text, { lang, onEnd });
    }
  }
}

export const textToSpeechService = new TextToSpeechService();
