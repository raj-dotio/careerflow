import crypto from 'crypto';

export interface TtsResult {
  audioBase64: string;
  mimeType: string;
  cached: boolean;
}

export const VOICE_CONFIG = {
  female: {
    voiceName: 'Kore',
    personaName: 'Priya',
  },
  male: {
    voiceName: 'Puck',
    personaName: 'Rahul',
  },
};

// In-memory cache keyed by MD5(gender:text)
const audioCache = new Map<string, TtsResult>();

/**
 * Clears the TTS audio cache (useful if audio formats or prompts update)
 */
export function clearAudioCache(): void {
  audioCache.clear();
}

/**
 * Ensures a PCM audio buffer has a valid 44-byte WAV header (24kHz, 16-bit, mono)
 */
export function ensureWavHeader(buffer: Buffer, sampleRate = 24000, numChannels = 1, bitDepth = 16): Buffer {
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === 'RIFF') {
    return buffer; // Already a valid WAV container
  }

  const dataLength = buffer.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size for PCM
  header.writeUInt16LE(1, 20); // AudioFormat 1 = PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitDepth / 8), 28); // ByteRate
  header.writeUInt16LE(numChannels * (bitDepth / 8), 32); // BlockAlign
  header.writeUInt16LE(bitDepth, 34); // BitsPerSample
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);

  return Buffer.concat([header, buffer]);
}

export class InterviewTtsService {
  private static getCacheKey(text: string, gender: string): string {
    return crypto.createHash('md5').update(`${gender.toLowerCase()}:${text.trim()}`).digest('hex');
  }

  /**
   * Synthesizes natural speech using Gemini TTS (gemini-3.8-flash-tts with gemini-3.1-flash-tts-preview fallback)
   */
  static async synthesizeSpeech(text: string, gender: 'male' | 'female'): Promise<TtsResult> {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text parameter is required for TTS synthesis.');
    }

    const safeText = text.trim().substring(0, 500);
    const safeGender: 'male' | 'female' = gender === 'male' ? 'male' : 'female';
    const cacheKey = this.getCacheKey(safeText, safeGender);

    // 1. Check in-memory cache
    if (audioCache.has(cacheKey)) {
      const cached = audioCache.get(cacheKey)!;
      return { ...cached, cached: true };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in server environment.');
    }

    const primaryModel = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-tts';
    const fallbackModel = process.env.GEMINI_TTS_FALLBACK_MODEL || 'gemini-3.1-flash-tts-preview';

    const voiceInfo = VOICE_CONFIG[safeGender] || VOICE_CONFIG.female;
    // Pass strictly clean spoken text to Gemini TTS without any meta-instruction prompts
    const cleanSpokenText = safeText.replace(/^["'\s]+|["'\s]+$/g, '');

    const requestPayload = {
      contents: [{ parts: [{ text: cleanSpokenText }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceInfo.voiceName,
            },
          },
        },
      },
    };

    // Helper for executing single API call with optional retry on 429
    const callApi = async (model: string, retryCount = 0): Promise<Response> => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (response.status === 429 && retryCount < 1) {
        console.warn(`[InterviewTtsService] Rate limit (429) hit for model ${model}. Retrying after 1500ms...`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return callApi(model, retryCount + 1);
      }

      return response;
    };

    let response: Response;
    let usedModel = primaryModel;

    try {
      response = await callApi(primaryModel);

      // If primary model returns 404, 429, or error, fallback to fallback model
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(
          `[InterviewTtsService] Primary TTS model '${primaryModel}' returned ${response.status}. Attempting fallback '${fallbackModel}'...`
        );
        usedModel = fallbackModel;
        response = await callApi(fallbackModel);
      }
    } catch (err: any) {
      console.warn(`[InterviewTtsService] Error with ${primaryModel}, attempting fallback ${fallbackModel}:`, err);
      usedModel = fallbackModel;
      try {
        response = await callApi(fallbackModel);
      } catch (fallbackErr: any) {
        if (fallbackErr.message === 'TTS_RATE_LIMITED' || fallbackErr.statusCode === 429) {
          throw fallbackErr;
        }
        throw new Error(`TTS synthesis failed on fallback model: ${fallbackErr.message}`);
      }
    }

    if (!response.ok) {
      if (response.status === 429) {
        const err: any = new Error('TTS_RATE_LIMITED');
        err.statusCode = 429;
        throw err;
      }
      const errBody = await response.text();
      throw new Error(`TTS API failed on ${usedModel} with status ${response.status}: ${errBody}`);
    }

    const data: any = await response.json();
    const candidate = data.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const inlineData = part?.inlineData;

    if (!inlineData || !inlineData.data) {
      throw new Error('Gemini TTS response did not contain audio data.');
    }

    const rawBuffer = Buffer.from(inlineData.data, 'base64');
    const wavBuffer = ensureWavHeader(rawBuffer);
    const audioBase64 = wavBuffer.toString('base64');
    const result: TtsResult = {
      audioBase64,
      mimeType: 'audio/wav',
      cached: false,
    };

    // Cache the result
    audioCache.set(cacheKey, result);

    return result;
  }
}
