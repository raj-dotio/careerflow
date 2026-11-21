import { GoogleGenAI } from '@google/genai';
import { type AtsEvaluationResult } from '../controllers/atsController.js';

export interface ResumePatchOp {
  op: 'set' | 'add' | 'update' | 'remove';
  path: string;
  value: any;
}

export interface ResumeAiChatResponse {
  assistant_message: string;
  question: string | null;
  input_type: 'text' | 'single_choice' | 'multi_choice' | 'yes_no';
  quick_options: string[];
  allow_custom_answer: boolean;
  resume_patch: ResumePatchOp[];
  current_section: 'basics' | 'experience' | 'education' | 'skills' | 'projects' | 'awards' | 'style';
  section_complete: boolean;
  next_section: string | null;
  progress_percent: number;
  suggestions: string[];
}

export interface ChatWithGuideParams {
  sessionId?: string;
  userMessage?: string;
  selectedOption?: string | string[];
  currentSection?: string;
  resume: any;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  targetJd?: string;
  isInitial?: boolean;
}

// Clean JSON helper
function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  // Strip code block fences
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();

  // If there's leading/trailing noise, extract first outer JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

// Allowed patch prefixes to prevent arbitrary prototype or state corruption
const ALLOWED_PATCH_PREFIXES = [
  'basics.name',
  'basics.headline',
  'basics.email',
  'basics.phone',
  'basics.location',
  'basics.url',
  'basics.github',
  'basics.linkedin',
  'basics',
  'summary',
  'sections.experience',
  'sections.education',
  'sections.skills',
  'sections.projects',
  'sections.certifications',
  'sections.awards',
  'metadata.template',
  'metadata.themeColor',
  'metadata',
];

function sanitizePatches(patches: any[]): ResumePatchOp[] {
  if (!Array.isArray(patches)) return [];
  return patches.filter((p) => {
    if (!p || typeof p.path !== 'string') return false;
    const pathClean = p.path.replace(/\[\d+\]/g, '');
    const isAllowed = ALLOWED_PATCH_PREFIXES.some(
      (prefix) => pathClean === prefix || pathClean.startsWith(prefix + '.')
    );
    return isAllowed;
  });
}

const SYSTEM_INSTRUCTION = `You are a friendly, sharp, world-class career coach and technical resume writer for CareerFlow.
Your mission is to guide the candidate section-by-section to build a top 1% ATS-friendly software engineering resume.

CONVERSATION & GUIDED FLOW RULES:
1. Ask ONE focused, concise question at a time for the current section.
2. The user will often answer in rough notes, shorthand, or Hinglish (e.g. "stripe me intern tha, redis caching kiya", "iit kanpur se cse 2026, 8.9 cgpa", "ek rate limiter banaya tha sliding window wala").
3. Your job is to transform their raw input into polished, impactful, ATS-friendly resume content:
   - Strong action verbs (e.g. Engineered, Architected, Speared, Reduced, Optimized, Profiled).
   - Concise, active bullet points.
   - Clean grammar and consistent past/present tenses.
   - Relevant technical keywords (e.g. Go, Redis, Docker, PostgreSQL, REST, microservices).
4. In your "assistant_message", briefly tell the candidate what you crafted or updated (1-2 sentences maximum, warm and encouraging).
5. Repeatable sections (Experience, Projects, Education, Honors):
   - After polishing an item, ask if they want to add another one (e.g. "Would you like to add another internship or work experience?") with quick_options: ["Yes, add another", "No, move to next section"].
6. If the user asks to refine ("make it shorter", "add Docker", "sound more senior"), modify the existing entry accordingly.
7. Keep chat messages punchy, direct, and conversational.

VERY IMPORTANT HONESTY RULES (CRITICAL):
- NEVER invent facts, company names, metrics, numbers, percentages, dates, degrees, or skills the user did not give.
- Expand and elevate phrasing, but DO NOT fabricate metrics like "reduced latency by 45%" if the user never stated 45%.
- If a metric is missing, write a strong qualitative bullet, OR ask a smart follow-up: "Do you have an approximate number for impact (latency, users, % speedup)? If not, no problem!".
- If something is ambiguous, ask a quick clarifying question instead of guessing.

SECTION ORDER:
basics -> experience -> education -> skills -> projects -> awards (Honors/Certifications) -> style (Theme)

OUTPUT FORMAT:
You MUST respond ONLY with valid JSON conforming to this exact structure:
{
  "assistant_message": "Friendly, short message explaining what was recorded/polished (max 2-3 sentences)",
  "question": "The single next question to ask, or null if complete",
  "input_type": "text" | "single_choice" | "multi_choice" | "yes_no",
  "quick_options": ["Option 1", "Option 2"],
  "allow_custom_answer": true,
  "resume_patch": [
    { "op": "set" | "add" | "update" | "remove", "path": "path.in.resume", "value": "..." }
  ],
  "current_section": "basics" | "experience" | "education" | "skills" | "projects" | "awards" | "style",
  "section_complete": false,
  "next_section": "experience" | null,
  "progress_percent": 15,
  "suggestions": ["ATS tip or observation"]
}

RESUME SCHEMA REFERENCE:
- basics: { name, headline, email, phone, location, url, github, linkedin }
- summary: string
- sections.experience: [{ id, company, position, location, date, summary: "• Bullet 1\\n• Bullet 2" }]
- sections.education: [{ id, institution, degree, fieldOfStudy, score, date }]
- sections.skills: [{ id, name: "Languages"|"Frameworks"|"Databases & Cloud"|"Tools", keywords: ["Go", "Docker"] }]
- sections.projects: [{ id, name, description, url, keywords: ["React", "FastAPI"] }]
- sections.certifications: [{ id, name, issuer, date }]
- sections.awards: [{ id, title, awarder, date, summary }]
- metadata: { template: "modern"|"classic"|"minimal"|"executive", themeColor: "#e11d48" }
`;

export async function chatWithResumeGuide(params: ChatWithGuideParams): Promise<ResumeAiChatResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const primaryModel = process.env.GEMINI_TEXT_MODEL || 'gemini-3.5-flash-lite';
  const fallbackModel = process.env.GEMINI_TEXT_FALLBACK_MODEL || 'gemini-3.1-flash-lite';
  const modelsToTry = [primaryModel, fallbackModel, 'gemini-2.5-flash'];

  const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });

  const conversationHistory = params.history || [];
  const currentResumeJson = JSON.stringify(params.resume || {}, null, 2);

  const userContextPrompt = `
CURRENT RESUME STATE (what is currently filled):
${currentResumeJson}

CURRENT WORKFLOW SECTION:
${params.currentSection || 'basics'}

TARGET JOB DESCRIPTION (if provided):
${params.targetJd ? params.targetJd : 'None provided'}

RECENT CHAT HISTORY:
${conversationHistory
  .slice(-6)
  .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
  .join('\n')}

LATEST USER INPUT:
${params.isInitial ? '[USER STARTED CONVERSATION / INITIALIZE]' : params.userMessage || ''}
${params.selectedOption ? `[SELECTED CHIP OPTION: ${JSON.stringify(params.selectedOption)}]` : ''}

INSTRUCTIONS FOR THIS TURN:
- If this is initial start and resume is empty or needs basics, warmly welcome the user, ask for their full name and target engineering role (provide quick role chips like "Full-Stack Engineer", "Backend Engineer", "Frontend Engineer", "AI/ML Engineer", "DevOps/Cloud").
- If user gave an answer, craft professional ATS resume_patch entries to update the resume.
- Never invent metrics, companies, or facts.
- Move purposefully through the sections: basics -> experience -> education -> skills -> projects -> awards -> style.
- Output ONLY valid JSON adhering to the specified schema.
`;

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: userContextPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response from Gemini');
      }

      const cleaned = cleanJsonOutput(responseText);
      const parsed = JSON.parse(cleaned);

      // Validate required response fields with fallbacks
      const validated: ResumeAiChatResponse = {
        assistant_message: parsed.assistant_message || 'Understood! I have updated your resume.',
        question: parsed.question !== undefined ? parsed.question : null,
        input_type: parsed.input_type || 'text',
        quick_options: Array.isArray(parsed.quick_options) ? parsed.quick_options : [],
        allow_custom_answer: parsed.allow_custom_answer !== false,
        resume_patch: sanitizePatches(parsed.resume_patch || []),
        current_section: parsed.current_section || (params.currentSection as any) || 'basics',
        section_complete: Boolean(parsed.section_complete),
        next_section: parsed.next_section || null,
        progress_percent: typeof parsed.progress_percent === 'number' ? parsed.progress_percent : 10,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      };

      return validated;
    } catch (err: any) {
      console.warn(`[ResumeAiService] Attempt with model ${model} failed:`, err?.message || err);
      lastError = err;
    }
  }

  throw new Error(`Failed to communicate with AI Resume Guide: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Parses an uploaded resume's extracted text into structured ResumeData and identifies missing sections.
 */
export async function parseResumeDocument(extractedText: string): Promise<{
  resume: any;
  missingSections: string[];
  initialGreeting: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const primaryModel = process.env.GEMINI_TEXT_MODEL || 'gemini-3.5-flash-lite';
  const fallbackModel = process.env.GEMINI_TEXT_FALLBACK_MODEL || 'gemini-3.1-flash-lite';
  const modelsToTry = [primaryModel, fallbackModel, 'gemini-2.5-flash'];
  const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });

  const prompt = `
Extract all relevant resume details from the raw document text below into our exact ResumeData JSON schema.
Only extract information that is explicitly stated in the document. DO NOT fabricate or hallucinate details.

DOCUMENT TEXT:
${extractedText.substring(0, 10000)}

REQUIRED JSON OUTPUT FORMAT:
{
  "resume": {
    "title": "Software Engineering Resume",
    "basics": {
      "name": "...",
      "headline": "...",
      "email": "...",
      "phone": "...",
      "location": "...",
      "url": "...",
      "github": "...",
      "linkedin": "..."
    },
    "summary": "...",
    "sections": {
      "experience": [
        {
          "id": "exp-1",
          "company": "...",
          "position": "...",
          "location": "...",
          "date": "...",
          "summary": "• Bullet 1\\n• Bullet 2"
        }
      ],
      "education": [
        {
          "id": "edu-1",
          "institution": "...",
          "degree": "...",
          "fieldOfStudy": "...",
          "score": "...",
          "date": "..."
        }
      ],
      "skills": [
        {
          "id": "sk-1",
          "name": "Languages",
          "keywords": ["TypeScript", "Python"]
        }
      ],
      "projects": [
        {
          "id": "proj-1",
          "name": "...",
          "description": "...",
          "url": "...",
          "keywords": ["React", "Node.js"]
        }
      ],
      "certifications": [
        { "id": "cert-1", "name": "...", "issuer": "...", "date": "..." }
      ],
      "awards": [
        { "id": "aw-1", "title": "...", "awarder": "...", "date": "...", "summary": "..." }
      ]
    },
    "metadata": {
      "template": "modern",
      "themeColor": "#e11d48"
    }
  },
  "missingSections": ["experience" | "projects" | "education" | "summary" | "skills" | "contact"],
  "initialGreeting": "Brief 1-2 sentence welcoming review of what was extracted and what we will work on improving."
}
`;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text;
      if (!responseText) continue;

      const cleaned = cleanJsonOutput(responseText);
      const parsed = JSON.parse(cleaned);

      if (parsed.resume && parsed.resume.basics && parsed.resume.sections) {
        return {
          resume: parsed.resume,
          missingSections: Array.isArray(parsed.missingSections) ? parsed.missingSections : [],
          initialGreeting: parsed.initialGreeting || 'I have extracted your resume data! Let us refine and strengthen it.',
        };
      }
    } catch (err: any) {
      console.warn(`[ResumeAiService] Parser failed with model ${model}:`, err?.message);
    }
  }

  throw new Error('Could not parse resume into structured format.');
}
