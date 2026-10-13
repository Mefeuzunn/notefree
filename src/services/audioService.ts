export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private timerInterval: number | null = null;
  private onTickCallback: ((elapsedMs: number) => void) | null = null;

  async startRecording(onTick?: (elapsedMs: number) => void): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.startTime = Date.now();
      this.onTickCallback = onTick || null;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(250); // Slice chunks every 250ms

      if (this.onTickCallback) {
        this.timerInterval = window.setInterval(() => {
          if (this.onTickCallback) {
            this.onTickCallback(Date.now() - this.startTime);
          }
        }, 100);
      }

      return true;
    } catch (err) {
      console.error('Microphone access failed:', err);
      return false;
    }
  }

  stopRecording(): Promise<{ blob: Blob; durationMs: number; dataUrl: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not active'));
        return;
      }

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }

      const durationMs = Date.now() - this.startTime;

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          resolve({ blob: audioBlob, durationMs, dataUrl });
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);

        // Stop all audio stream tracks
        if (this.mediaRecorder?.stream) {
          this.mediaRecorder.stream.getTracks().forEach((t) => t.stop());
        }
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }

  getElapsedMs(): number {
    if (!this.isRecording()) return 0;
    return Date.now() - this.startTime;
  }
}

export const audioRecorder = new AudioRecorderService();
