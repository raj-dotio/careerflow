import { GoogleGenAI } from '@google/genai';

export interface KeywordAnalysis {
  matchedKeywords: string[];
  missingKeywords: string[];
  matchRate: number;
}

export interface BulletRedline {
  original: string;
  suggested: string;
  reason: string;
}

export interface AtsChecklistItem {
  category: string;
  item: string;
  passed: boolean;
  recommendation?: string;
}

export interface AtsEvaluationResult {
  overallScore: number;
  rating: 'Exceptional' | 'Competitive' | 'Needs Improvement' | 'Critical Issues';
  summaryFeedback: string;
  scores: {
    keywordMatch: number;
    quantifiableImpact: number;
    structureAndFormat: number;
    readabilityAndLength: number;
  };
  metrics: {
    wordCount: number;
    bulletCount: number;
    metricBulletCount: number;
    actionVerbCount: number;
    readingTimeMinutes: number;
  };
  keywords: KeywordAnalysis;
  bulletRedlines: BulletRedline[];
  checklist: AtsChecklistItem[];
  aiPowered?: boolean;
  modelUsed?: string;
}

// Check if an API key looks like a real key (not empty or default placeholder)
export function isValidApiKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.length > 15 && !trimmed.toLowerCase().includes('your_gemini_api_key');
}

/**
 * Perform high-accuracy semantic ATS diagnostics using Google Gemini AI strictly via server env.
 */
export async function analyzeResumeWithGemini(
  resumeText: string,
  jobDescription?: string
): Promise<AtsEvaluationResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!isValidApiKey(apiKey)) {
    console.log('[GeminiService] No valid GEMINI_API_KEY set in server environment. Using algorithmic engine.');
    return null;
  }

  // Pre-calculate exact physical metrics from text
  const words = resumeText.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const lines = resumeText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 15);
  const bulletCount = lines.length || 1;

  const metricRegex = /\b(\d+(?:\.\d+)?%|\$\d+(?:,\d+)*(?:\.\d+)?(?:k|m|b)?|\b\d+k?\+?\s*(?:users|requests|qps|rps|ms|seconds|minutes|hours|stars|queries|downloads|teams|engineers|students))\b/gi;
  const metricBulletCount = lines.filter(l => metricRegex.test(l)).length;

  const ACTION_VERBS = [
    'engineered', 'architected', 'developed', 'spearheaded', 'optimized', 'reduced', 'increased',
    'scaled', 'deployed', 'implemented', 'designed', 'built', 'automated', 'profiled', 'shipped',
    'refactored', 'orchestrated', 'authored', 'mentored', 'constructed', 'accelerated', 'slashed'
  ];
  const actionVerbCount = lines.filter(l => {
    const lower = l.toLowerCase();
    return ACTION_VERBS.some(v => lower.includes(v));
  }).length;

  const readingTimeMinutes = +(wordCount / 200).toFixed(1);

  const systemInstruction = `You are a Principal ATS Algorithm Architect and Senior Silicon Valley Technical Recruiter.
Your role is to perform rigorous, highly accurate ATS (Applicant Tracking System) compliance evaluation on candidates' resumes against target job descriptions.
You evaluate like enterprise ATS systems (Greenhouse, Lever, Workday) paired with a tough technical recruiter screening.

Strict Guidelines:
1. Extract authentic technical, architectural, and framework skills from the Job Description and compare them to the resume.
2. Calculate realistic scores (0-100). Do not artificially inflate or deflate.
3. For bullet redlines: Pick 2 to 4 genuine weak, passive, or unquantified bullet points from the candidate's actual resume. Rewrite them using Google's XYZ formula ("Accomplished [X] as measured by [Y], by doing [Z]"). Provide crisp reasons.
4. Output MUST be valid JSON adhering strictly to the requested schema. No code fences, no extra text.`;

  const prompt = `
Perform a full ATS diagnostics evaluation of the following resume against the target role requirements.

TARGET JOB DESCRIPTION / ROLE:
${jobDescription && jobDescription.trim().length > 10 ? jobDescription.trim() : 'Full-Stack Software Engineer (Modern Cloud, Microservices, TypeScript, Go/Python, Distributed Systems)'}

CANDIDATE RESUME TEXT:
${resumeText}

Analyze and return JSON matching this exact structure:
{
  "overallScore": number (0-100),
  "rating": "Exceptional" | "Competitive" | "Needs Improvement" | "Critical Issues",
  "summaryFeedback": "2-3 concise sentences explaining recruiter ranking, key strengths, and highest-priority ATS gap.",
  "scores": {
    "keywordMatch": number (0-100),
    "quantifiableImpact": number (0-100),
    "structureAndFormat": number (0-100),
    "readabilityAndLength": number (0-100)
  },
  "keywords": {
    "matchedKeywords": ["array", "of", "exact", "skills", "found", "in", "resume"],
    "missingKeywords": ["array", "of", "important", "skills", "from", "job", "missing", "in", "resume"],
    "matchRate": number (0-100)
  },
  "bulletRedlines": [
    {
      "original": "Exact line from the resume that is weak or lacks metrics",
      "suggested": "Google XYZ rewrite with strong action verb and realistic metrics",
      "reason": "Why this change improves recruiter pass rate"
    }
  ],
  "checklist": [
    {
      "category": "Contact Info" | "Online Presence" | "Core Sections" | "Bullet Quality" | "Formatting",
      "item": "Specific item description",
      "passed": boolean,
      "recommendation": "Actionable suggestion if passed is false"
    }
  ]
}
`;

  const modelsToTry = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-3.8-flash',
  ];
  const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });

  for (const model of modelsToTry) {
    try {
      console.log(`[GeminiService] Attempting ATS evaluation with model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        console.warn(`[GeminiService] Empty response text from model ${model}`);
        continue;
      }

      // Clean potential JSON markdown wrapper if present
      const cleanedJson = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleanedJson);

      // Validate core required fields
      if (
        typeof parsed.overallScore === 'number' &&
        parsed.scores &&
        parsed.keywords &&
        Array.isArray(parsed.keywords.matchedKeywords) &&
        Array.isArray(parsed.checklist)
      ) {
        // Enforce valid rating
        const validRatings = ['Exceptional', 'Competitive', 'Needs Improvement', 'Critical Issues'];
        const rating = validRatings.includes(parsed.rating)
          ? parsed.rating
          : parsed.overallScore >= 85
          ? 'Exceptional'
          : parsed.overallScore >= 75
          ? 'Competitive'
          : parsed.overallScore >= 60
          ? 'Needs Improvement'
          : 'Critical Issues';

        const result: AtsEvaluationResult = {
          overallScore: Math.min(100, Math.max(10, Math.round(parsed.overallScore))),
          rating: rating as AtsEvaluationResult['rating'],
          summaryFeedback: parsed.summaryFeedback || 'Resume analyzed with Gemini AI.',
          scores: {
            keywordMatch: Math.min(100, Math.max(0, Math.round(parsed.scores.keywordMatch || 70))),
            quantifiableImpact: Math.min(100, Math.max(0, Math.round(parsed.scores.quantifiableImpact || 70))),
            structureAndFormat: Math.min(100, Math.max(0, Math.round(parsed.scores.structureAndFormat || 80))),
            readabilityAndLength: Math.min(100, Math.max(0, Math.round(parsed.scores.readabilityAndLength || 80))),
          },
          metrics: {
            wordCount,
            bulletCount,
            metricBulletCount: parsed.metrics?.metricBulletCount || metricBulletCount,
            actionVerbCount: parsed.metrics?.actionVerbCount || actionVerbCount,
            readingTimeMinutes,
          },
          keywords: {
            matchedKeywords: parsed.keywords.matchedKeywords || [],
            missingKeywords: parsed.keywords.missingKeywords || [],
            matchRate: Math.min(100, Math.max(0, Math.round(parsed.keywords.matchRate || 75))),
          },
          bulletRedlines: Array.isArray(parsed.bulletRedlines) ? parsed.bulletRedlines : [],
          checklist: parsed.checklist || [],
          aiPowered: true,
          modelUsed: model,
        };

        console.log(`[GeminiService] Successfully generated AI ATS analysis with ${model}!`);
        return result;
      }
    } catch (err: any) {
      console.warn(`[GeminiService] Failed with model ${model}:`, err?.message || err);
      // Try next model in loop
    }
  }

  console.warn('[GeminiService] All Gemini models failed. Falling back to algorithmic analysis.');
  return null;
}
