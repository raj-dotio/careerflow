// Gemini TTS Audio Engine for Mock Chamber Interviewers
// Replaces robotic browser SpeechSynthesis with human-like Google GenAI voices:
// Female -> Kore ("Priya")
// Male   -> Puck ("Rahul")

export interface InterviewerPersona {
  name: string;
  title: string;
  description: string;
  voiceName: string;
}

export const INTERVIEWER_PERSONAS: Record<'female' | 'male', InterviewerPersona> = {
  female: {
    name: 'Priya',
    title: 'Principal Systems Architect · Tech Lead',
    description: 'Conversational, warm, and insightful evaluator focusing on design and problem solving',
    voiceName: 'Kore (Gemini TTS)',
  },
  male: {
    name: 'Rahul',
    title: 'Director of Engineering · Pragmatic Bar-Raiser',
    description: 'Relaxed, confident STAR evaluator focusing on practical impact and engineering decisions',
    voiceName: 'Puck (Gemini TTS)',
  },
};

// Client-side cache: key = `${gender}:${text.trim()}` -> audio URL
const audioUrlCache = new Map<string, string>();
let previewAudioInstance: HTMLAudioElement | null = null;

/**
 * Fetches synthesized speech from backend `/api/mock-interview/tts`
 * Returns a playable audio data URL or blob URL.
 */
export async function fetchGeminiTtsAudio(text: string, gender: 'female' | 'male'): Promise<string> {
  const cleanText = (text || '').trim();
  if (!cleanText) {
    throw new Error('Text is required for TTS synthesis.');
  }

  const cacheKey = `${gender}:${cleanText}`;
  if (audioUrlCache.has(cacheKey)) {
    return audioUrlCache.get(cacheKey)!;
  }

  const res = await fetch('/api/mock-interview/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: cleanText.substring(0, 500),
      gender,
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    if (res.status === 429 || errorJson.error === 'TTS_RATE_LIMITED') {
      const err: any = new Error('TTS_RATE_LIMITED');
      err.code = 'TTS_RATE_LIMITED';
      throw err;
    }
    throw new Error(errorJson.message || `TTS request failed with status ${res.status}`);
  }

  const data = await res.json();
  if (!data.audioBase64) {
    throw new Error('TTS response did not contain audio data');
  }

  const audioUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
  audioUrlCache.set(cacheKey, audioUrl);
  return audioUrl;
}

/**
 * Previews the interviewer's voice directly in the landing page using Gemini TTS
 */
export async function previewVoice(gender: 'female' | 'male', text?: string): Promise<void> {
  try {
    if (previewAudioInstance) {
      previewAudioInstance.pause();
      previewAudioInstance.currentTime = 0;
    }

    const sample =
      text ||
      (gender === 'female'
        ? "Hi there! I'm Priya. Really glad to connect with you today, and I'm looking forward to our mock interview session!"
        : "Hey! I'm Rahul, great to connect with you today. Really excited to chat and dive into your technical journey!");

    const audioUrl = await fetchGeminiTtsAudio(sample, gender);
    const audio = new Audio(audioUrl);
    previewAudioInstance = audio;
    await audio.play();
  } catch (err: any) {
    console.warn('[previewVoice] Gemini TTS playback warning:', err);
  }
}

/**
 * Transcribes user voice recording using Gemini Multimodal Speech-to-Text
 */
export async function transcribeRecordedAudio(audioBlob: Blob): Promise<string> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });

  const res = await fetch('/api/mock-interview/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64: base64,
      mimeType: audioBlob.type || 'audio/webm',
    }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.message || `Transcription failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.transcript || '';
}

/**
 * Cleanup any cached object URLs if needed
 */
export function clearTtsAudioCache() {
  audioUrlCache.clear();
  if (previewAudioInstance) {
    previewAudioInstance.pause();
    previewAudioInstance = null;
  }
}
