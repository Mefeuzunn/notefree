// Web Speech API Native Live Speech Recognition & Transcription Service

export type SpeechLanguage = 'tr-TR' | 'en-US' | 'de-DE';

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

class SpeechTranscriptionService {
  private recognition: any = null;
  private isListening: boolean = false;
  private language: SpeechLanguage = 'tr-TR';
  private fullTranscript: string = '';
  private onTranscriptUpdate: ((transcript: string, interimText: string) => void) | null = null;
  private shouldRestart: boolean = false;

  constructor() {
    this.initRecognition();
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.language;

      this.recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            this.fullTranscript += (this.fullTranscript ? ' ' : '') + res[0].transcript.trim();
          } else {
            interimTranscript += res[0].transcript;
          }
        }

        if (this.onTranscriptUpdate) {
          this.onTranscriptUpdate(this.fullTranscript, interimTranscript);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          this.shouldRestart = false;
          this.isListening = false;
        }
      };

      this.recognition.onend = () => {
        if (this.shouldRestart && this.isListening) {
          try {
            this.recognition.start();
          } catch {
            // Already started or busy
          }
        } else {
          this.isListening = false;
        }
      };
    } catch (err) {
      console.warn('Failed to initialize speech recognition:', err);
    }
  }

  public startListening(
    onUpdate: (transcript: string, interimText: string) => void,
    lang: SpeechLanguage = 'tr-TR'
  ): boolean {
    if (!this.recognition) {
      this.initRecognition();
    }
    if (!this.recognition) return false;

    this.language = lang;
    this.recognition.lang = lang;
    this.onTranscriptUpdate = onUpdate;
    this.shouldRestart = true;
    this.isListening = true;

    try {
      this.recognition.start();
      return true;
    } catch (err) {
      console.warn('Speech recognition start error:', err);
      return false;
    }
  }

  public stopListening(): string {
    this.shouldRestart = false;
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // already stopped
      }
    }
    return this.fullTranscript;
  }

  public getTranscript(): string {
    return this.fullTranscript;
  }

  public clearTranscript() {
    this.fullTranscript = '';
    if (this.onTranscriptUpdate) {
      this.onTranscriptUpdate('', '');
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public setLanguage(lang: SpeechLanguage) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public getLanguage(): SpeechLanguage {
    return this.language;
  }
}

export const speechTranscriptionService = new SpeechTranscriptionService();
