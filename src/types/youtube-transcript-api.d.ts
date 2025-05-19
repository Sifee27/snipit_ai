declare module 'youtube-transcript-api' {
  export interface TranscriptItem {
    text: string;
    duration: number;
    offset: number;
  }

  export default {
    fetchTranscript(videoId: string, options?: {
      lang?: string;
      country?: string;
    }): Promise<TranscriptItem[]>
  };
}
