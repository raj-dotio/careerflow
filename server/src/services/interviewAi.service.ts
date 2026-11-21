import { GoogleGenAI } from '@google/genai';
import { ensureWavHeader } from './interviewTts.service.js';
import { IInterviewPlanRound, IResumeStructured } from '../models/interview.model.js';

export interface NextQuestionResult {
  question: string;
  spokenText: string;
  spokenJudgment?: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedPoints: string[];
  timeLimit: number;
}

export interface GenerateNextQuestionParams {
  interviewId?: string;
  role: string;
  experience: string;
  mode: 'HR' | 'Technical' | 'Mixed';
  modeType: 'RESUME_DRIVEN' | 'ROLE_DRIVEN';
  interviewerGender: 'female' | 'male';
  roundNumber: number; // 1 to 5
  totalRounds: number; // 5
  roundName: string;
  currentRoundSubtopics: string[];
  techStack: string[];
  resumeStructured?: IResumeStructured | null;
  askedTopics: string[];
  askedQuestions: string[];
  conversationHistory: Array<{
    turn: number;
    question: string;
    answer: string;
    feedback?: string;
    spokenJudgment?: string;
  }>;
  previousJudgment?: string;
}

interface EvaluateAnswerParams {
  question: string;
  answer: string;
  difficulty?: string;
  role?: string;
}

interface AnswerEvaluation {
  confidence: number;
  communication: number;
  correctness: number;
  finalScore: number;
  feedback: string;
  spokenJudgment: string;
}

interface ComprehensiveReport {
  summaryFeedback: string;
  strengths: string[];
  improvements: string[];
}

// Compute word-level Jaccard similarity between two strings
export function computeJaccardSimilarity(textA: string, textB: string): number {
  const getTokens = (str: string) => {
    return new Set(
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );
  };

  const setA = getTokens(textA);
  const setB = getTokens(textB);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionSize = 0;
  setA.forEach((token) => {
    if (setB.has(token)) intersectionSize++;
  });

  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

// Helper to clean JSON string from LLM responses
function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json|```/g, '').trim();

  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');

  let start = -1;
  let end = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = cleaned.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = cleaned.lastIndexOf(']');
  }

  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }
  return cleaned;
}

// Timeout wrapper so external LLM calls never hang requests indefinitely
function withTimeout<T>(promise: Promise<T>, timeoutMs = 14000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini API call timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

export class InterviewAiService {
  private static getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key') {
      return null;
    }
    return new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });
  }

  // 1. Structure raw resume text into JSON
  static async structureResume(rawText: string): Promise<IResumeStructured | null> {
    if (!rawText || rawText.trim().length < 30) return null;

    const ai = this.getClient();
    if (!ai) return null;

    const textModel = process.env.GEMINI_TEXT_MODEL || 'gemini-3.5-flash-lite';
    const fallbackTextModel = process.env.GEMINI_TEXT_FALLBACK_MODEL || 'gemini-3.1-flash-lite';

    const systemInstruction = `
You are an expert technical recruiter parsing a candidate's resume into a structured profile for an adaptive technical mock interview.
Extract the key facts, project names, tools, architectures, and metrics accurately.
Return strictly valid JSON:
{
  "name": "Candidate Name if found",
  "summary": "1-2 sentence high-level summary of background and primary focus",
  "skills": ["Skill1", "Skill2"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "technologies": ["Tech1", "Tech2"],
      "metricsOrOutcomes": "Any numbers, latency reductions, user scale mentioned, or 'Not specified'"
    }
  ],
  "experience": [
    {
      "role": "Job / Internship Title",
      "company": "Company Name",
      "duration": "Duration",
      "highlights": ["Key achievement 1", "Key achievement 2"]
    }
  ],
  "education": ["Degree, College, Year"]
}
`.trim();

    const userPrompt = `Resume text:\n${rawText.substring(0, 5000)}`;

    const tryParse = async (model: string) => {
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
        8000
      );

      if (response && response.text) {
        const cleaned = cleanJsonOutput(response.text);
        const parsed = JSON.parse(cleaned);
        return parsed as IResumeStructured;
      }
      return null;
    };

    try {
      return await tryParse(textModel);
    } catch (err) {
      console.warn(`[InterviewAiService] structureResume failed on ${textModel}, trying fallback:`, err);
      try {
        return await tryParse(fallbackTextModel);
      } catch (fallbackErr) {
        console.warn('[InterviewAiService] Fallback structureResume failed:', fallbackErr);
        return null;
      }
    }
  }

  // 2. Generate Interview Plan (5 progressive rounds)
  static async generateInterviewPlan(params: {
    role: string;
    experience: string;
    mode: 'HR' | 'Technical' | 'Mixed';
    techStack: string[];
    resumeStructured?: IResumeStructured | null;
    modeType: 'RESUME_DRIVEN' | 'ROLE_DRIVEN';
  }): Promise<IInterviewPlanRound[]> {
    const ai = this.getClient();
    const { role, experience, mode, techStack, resumeStructured, modeType } = params;

    const stackString = techStack.length > 0 ? techStack.join(', ') : 'Standard modern engineering';

    let resumeSummary = 'None provided';
    if (resumeStructured) {
      const projects = (resumeStructured.projects || []).map((p) => `${p.name} (${(p.technologies || []).join(', ')})`).join('; ');
      const skills = (resumeStructured.skills || []).slice(0, 10).join(', ');
      resumeSummary = `Skills: ${skills} | Projects: ${projects || 'General engineering'}`;
    }

    const systemInstruction = `
You are the Lead Technical Interview Architect designing a 5-round structured interview plan for a candidate.
Mode: ${modeType}
Target Role: ${role}
Experience Level: ${experience}
Interview Focus Mode: ${mode}
Tech Stack: ${stackString}
Resume Context: ${resumeSummary}

Plan 5 progressive rounds following this structure:
Round 1: Intro and background (warm greeting, icebreaker, candidate journey & overview)
Round 2: Core fundamentals (specific topics from the candidate's actual tech stack or resume)
Round 3: Practical / coding or project deep-dive (architecture, state, querying, or candidate's real resume project)
Round 4: System design or scenario-based (scalability, failure modes, trade-offs, edge cases)
Round 5: Behavioural / HR and wrap-up (STAR format, conflict resolution, technical growth, culture)

${
  modeType === 'RESUME_DRIVEN'
    ? 'For RESUME_DRIVEN mode: 70% of topics must specifically anchor to the named projects and technologies in the candidate resume context.'
    : 'For ROLE_DRIVEN mode: Pick specific sub-technologies and real-world engineering scenarios from the candidate tech stack.'
}

Each round must have 2-3 distinct, specific subtopics.
Return strictly a JSON array of 5 objects:
[
  { "roundIndex": 1, "roundName": "Intro and Background", "subtopics": ["Career journey & motivation", "Project overview"] },
  { "roundIndex": 2, "roundName": "Core Fundamentals", "subtopics": ["Subtopic A", "Subtopic B"] },
  { "roundIndex": 3, "roundName": "Practical Project Deep-Dive", "subtopics": ["Subtopic C", "Subtopic D"] },
  { "roundIndex": 4, "roundName": "System Design & Edge Cases", "subtopics": ["Subtopic E", "Subtopic F"] },
  { "roundIndex": 5, "roundName": "Behavioral & Wrap-Up", "subtopics": ["Subtopic G", "Subtopic H"] }
]
`.trim();

    const userPrompt = `Generate the 5-round plan now. Variation hint: ${Math.random().toString(36).substring(2, 7)}`;

    if (ai) {
      const textModel = process.env.GEMINI_TEXT_MODEL || 'gemini-3.5-flash-lite';
      const fallbackTextModel = process.env.GEMINI_TEXT_FALLBACK_MODEL || 'gemini-3.1-flash-lite';

      const tryPlan = async (model: string) => {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction,
              temperature: 0.85,
              responseMimeType: 'application/json',
            },
          }),
          9000
        );

        if (response && response.text) {
          const cleaned = cleanJsonOutput(response.text);
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed) && parsed.length >= 5) {
            return parsed.slice(0, 5).map((r, i) => ({
              roundIndex: i + 1,
              roundName: r.roundName || `Round ${i + 1}`,
              subtopics: Array.isArray(r.subtopics) ? r.subtopics : ['General engineering'],
            }));
          }
        }
        return null;
      };

      try {
        const res = await tryPlan(textModel);
        if (res) return res;
      } catch (err) {
        console.warn(`[InterviewAiService] generateInterviewPlan failed on ${textModel}, trying fallback:`, err);
        try {
          const fallbackRes = await tryPlan(fallbackTextModel);
          if (fallbackRes) return fallbackRes;
        } catch (fallbackErr) {
          console.warn('[InterviewAiService] Fallback generateInterviewPlan also failed:', fallbackErr);
        }
      }
    }

    // Dynamic procedural fallback if Gemini plan fails
    return [
      {
        roundIndex: 1,
        roundName: 'Intro and Background',
        subtopics: ['Career journey & motivation', 'High-level project overview'],
      },
      {
        roundIndex: 2,
        roundName: 'Core Fundamentals',
        subtopics: techStack.length > 0 ? [techStack[0], `${techStack[0]} lifecycle & state`] : ['Language fundamentals', 'Async patterns'],
      },
      {
        roundIndex: 3,
        roundName: 'Practical Deep-Dive',
        subtopics: techStack.length > 1 ? [techStack[1], 'Data caching & query indexing'] : ['Debugging scenario', 'Performance profiling'],
      },
      {
        roundIndex: 4,
        roundName: 'System Architecture & Scenarios',
        subtopics: ['Distributed reliability', 'High-concurrency latency bottlenecks'],
      },
      {
        roundIndex: 5,
        roundName: 'Behavioral & Leadership Wrap-up',
        subtopics: ['Technical conflict resolution', 'Production incident management'],
      },
    ];
  }

  // 3. Generate Turn-by-Turn Dynamic Question with Full Session Memory & Duplicate Check
  static async generateNextQuestion(params: GenerateNextQuestionParams): Promise<NextQuestionResult> {
    const ai = this.getClient();
    if (!ai) {
      throw new Error('Gemini API key is not configured.');
    }

    const {
      role,
      experience,
      mode,
      modeType,
      interviewerGender,
      roundNumber,
      totalRounds,
      roundName,
      currentRoundSubtopics,
      techStack,
      resumeStructured,
      askedTopics,
      askedQuestions,
      conversationHistory,
    } = params;

    const personaName = interviewerGender === 'male' ? 'Rahul' : 'Priya';
    const textModel = process.env.GEMINI_TEXT_MODEL || 'gemini-3.5-flash-lite';
    const fallbackTextModel = process.env.GEMINI_TEXT_FALLBACK_MODEL || 'gemini-3.1-flash-lite';

    // Build resume summary or tech stack summary
    let summary = '';
    if (modeType === 'RESUME_DRIVEN' && resumeStructured) {
      const projNames = (resumeStructured.projects || [])
        .map((p) => `${p.name} (tech: ${(p.technologies || []).join(', ')}; metrics: ${p.metricsOrOutcomes || 'N/A'})`)
        .join(' | ');
      const skills = (resumeStructured.skills || []).slice(0, 12).join(', ');
      summary = `Resume Projects: [${projNames}]. Skills: [${skills}]. Summary: ${resumeStructured.summary || 'Engineering candidate'}`;
    } else {
      const stackString = techStack.length > 0 ? techStack.join(', ') : 'Modern engineering stack (React, Node.js, PostgreSQL, Distributed Systems)';
      summary = `Primary Tech Stack: ${stackString}. Focus: ${mode}`;
    }

    const modeInstruction =
      modeType === 'RESUME_DRIVEN'
        ? `70% of questions MUST be grounded in the candidate's actual projects, technologies, and achievements from their resume. Name their actual project (e.g. "In your project {projectName}, you used {tech}..."), ask about why they chose that architecture, probe any metrics they claimed, or ask about specific bugs/trade-offs in THAT project. 30% role fundamentals matching ${experience} level.`
        : `Ask practical, scenario-based questions on the candidate's tech stack (${techStack.join(', ')}). Pick specific sub-technologies for each round. Strictly avoid generic textbook questions like "What is OOP" or "What is polymorphism". Ask concrete engineering scenarios (e.g., "Suppose your query on a high-traffic table is taking 3 seconds...").`;

    const askedQuestionsWithAnswers =
      conversationHistory.length > 0
        ? conversationHistory
            .map(
              (h, i) =>
                `Turn ${i + 1}:\n- Question asked: "${h.question}"\n- Candidate Answer: "${h.answer || '(Candidate skipped without answering)'}"\n- Interviewer Feedback: "${h.feedback || 'None'}"`
            )
            .join('\n\n')
        : 'None yet (This is the opening question).';

    const systemInstruction = `
You are ${personaName}, a senior engineering interviewer conducting a realistic live spoken interview.
Your persona: warm, natural, sharp, conversational Indian-English.

INTERVIEW CONTEXT:
- Mode: ${modeType}
- Candidate Target Role: ${role}
- Experience Level: ${experience}
- Focus: ${mode}
- Candidate Stack / Resume Summary: ${summary}

CURRENT ROUND: ${roundNumber} of ${totalRounds} - ${roundName}
ROUND OBJECTIVE: Focus on one of these subtopics: ${currentRoundSubtopics.join(', ')}.

SESSION MEMORY (do NOT repeat, do NOT rephrase):
Topics already covered: ${askedTopics.length > 0 ? askedTopics.join(', ') : 'None yet'}
Questions already asked:
${askedQuestionsWithAnswers}

RULES FOR THIS QUESTION:
1. Grounding: ${modeInstruction}
2. Strictly NEVER ask anything similar or overlapping with questions already asked.
3. Max 2-3 spoken sentences. End with ONE clear question. No bullet points, no markdown, no intro filler like "Moving on to question ${roundNumber}" or "Next up".
4. Spoken delivery: natural Indian-English conversational tone, occasional light filler ("Alright", "Got it", "Interesting", "Okay").
${
  roundNumber === 1
    ? `5. This is Round 1: Open with a warm greeting from ${personaName} and one light icebreaker before asking about their background or primary project.`
    : ''
}
6. Return strictly valid JSON:
{
  "question": "Spoken question text ending with a question mark?",
  "topic": "Specific topic name",
  "difficulty": "${roundNumber <= 2 ? 'easy' : roundNumber <= 4 ? 'medium' : 'hard'}",
  "expectedPoints": ["Key point 1", "Key point 2"]
}
`.trim();

    const generateCall = async (model: string, similarityConstraint = ''): Promise<NextQuestionResult | null> => {
      const variationSeed = `Variation ID: ${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
      const userPrompt = `
Generate the question for Round ${roundNumber}: ${roundName}.
Target subtopics: ${currentRoundSubtopics.join(', ')}.
${similarityConstraint ? `CRITICAL CONSTRAINT: ${similarityConstraint}` : ''}
${variationSeed}
`.trim();

      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: 0.95,
            topP: 0.95,
            responseMimeType: 'application/json',
          },
        }),
        10000
      );

      if (response && response.text) {
        const cleaned = cleanJsonOutput(response.text);
        const parsed = JSON.parse(cleaned);

        if (parsed && parsed.question) {
          const timeLimits = [60, 60, 90, 90, 120];
          return {
            question: parsed.question.trim(),
            spokenText: '',
            spokenJudgment: '',
            topic: parsed.topic || currentRoundSubtopics[0] || roundName,
            difficulty: (parsed.difficulty as 'easy' | 'medium' | 'hard') || (roundNumber <= 2 ? 'easy' : roundNumber <= 4 ? 'medium' : 'hard'),
            expectedPoints: Array.isArray(parsed.expectedPoints) ? parsed.expectedPoints : [],
            timeLimit: timeLimits[roundNumber - 1] || 90,
          };
        }
      }
      return null;
    };

    // Helper to verify question is not a duplicate using Jaccard similarity threshold 0.6
    const isDuplicate = (newQuestion: string): { duplicate: boolean; matchedQuestion?: string; similarity?: number } => {
      for (const asked of askedQuestions) {
        const sim = computeJaccardSimilarity(newQuestion, asked);
        if (sim >= 0.6) {
          return { duplicate: true, matchedQuestion: asked, similarity: sim };
        }
      }
      return { duplicate: false };
    };

    // Attempt 1: Call with primary text model
    let candidateResult: NextQuestionResult | null = null;
    try {
      candidateResult = await generateCall(textModel);
    } catch (primaryErr) {
      console.warn(`[InterviewAiService] generateNextQuestion error on ${textModel}, trying fallback ${fallbackTextModel}:`, primaryErr);
      try {
        candidateResult = await generateCall(fallbackTextModel);
      } catch (fallbackErr) {
        console.error('[InterviewAiService] Fallback model also failed in generateNextQuestion:', fallbackErr);
        throw new Error('AI interviewer service is temporarily unavailable. Please retry in a few moments.');
      }
    }

    if (!candidateResult) {
      throw new Error('AI generation did not return a valid question structure.');
    }

    // Step 5 Duplicate Check: If similarity >= 0.6 with any previously asked question, regenerate once
    const dupCheck = isDuplicate(candidateResult.question);
    if (dupCheck.duplicate && dupCheck.matchedQuestion) {
      console.warn(
        `[InterviewAiService] Duplicate detected (similarity: ${dupCheck.similarity?.toFixed(2)} with "${dupCheck.matchedQuestion}"). Regenerating once with negative constraint...`
      );
      const retryConstraint = `That proposed question was too similar (Jaccard: ${dupCheck.similarity?.toFixed(2)}) to an earlier question: "${dupCheck.matchedQuestion}". You MUST ask something completely different on a totally separate angle.`;

      try {
        const regenerated = await generateCall(textModel, retryConstraint);
        if (regenerated) {
          candidateResult = regenerated;
        }
      } catch (retryErr) {
        console.warn('[InterviewAiService] Regeneration attempt encountered error, keeping previous non-fatal result:', retryErr);
      }
    }

    // Build natural spoken dialogue for TTS and live UI
    if (roundNumber === 1) {
      candidateResult.spokenText = candidateResult.question;
      candidateResult.spokenJudgment = '';
    } else {
      const judgment = params.previousJudgment ? params.previousJudgment.trim() : '';
      candidateResult.spokenJudgment = judgment;
      if (judgment) {
        candidateResult.spokenText = `${judgment} Here is your next question: ${candidateResult.question}`;
      } else {
        candidateResult.spokenText = `Here is your next question: ${candidateResult.question}`;
      }
    }

    // Log prompt context in development
    console.log(
      `[InterviewAI] Mode: ${modeType} | Round ${roundNumber}/${totalRounds} (${roundName}) | Topics covered: [${askedTopics.join(', ')}] | Spoken: "${candidateResult.spokenText}"`
    );

    return candidateResult;
  }

  // Backwards compatible generateQuestions (used if any legacy callers remain)
  static async generateQuestions(params: {
    role: string;
    experience: string;
    mode: 'HR' | 'Technical' | 'Mixed';
    techStack?: string[];
    resumeText?: string;
    interviewerGender?: 'female' | 'male';
  }): Promise<Array<{ question: string; difficulty: 'easy' | 'medium' | 'hard'; timeLimit: number }>> {
    const stackArr = Array.isArray(params.techStack) ? params.techStack : [];
    const hasResume = !!params.resumeText && params.resumeText.trim().length > 30;
    const modeType = hasResume ? 'RESUME_DRIVEN' : 'ROLE_DRIVEN';

    let resumeStructured: IResumeStructured | null = null;
    if (hasResume) {
      resumeStructured = await this.structureResume(params.resumeText!);
    }

    const plan = await this.generateInterviewPlan({
      role: params.role,
      experience: params.experience,
      mode: params.mode,
      techStack: stackArr,
      resumeStructured,
      modeType,
    });

    const firstQ = await this.generateNextQuestion({
      role: params.role,
      experience: params.experience,
      mode: params.mode,
      modeType,
      interviewerGender: params.interviewerGender || 'female',
      roundNumber: 1,
      totalRounds: 5,
      roundName: plan[0].roundName,
      currentRoundSubtopics: plan[0].subtopics,
      techStack: stackArr,
      resumeStructured,
      askedTopics: [],
      askedQuestions: [],
      conversationHistory: [],
    });

    return [
      {
        question: firstQ.question,
        difficulty: firstQ.difficulty,
        timeLimit: firstQ.timeLimit,
      },
    ];
  }

  // 4. Evaluate Individual Answer
  static async evaluateAnswer(params: EvaluateAnswerParams): Promise<AnswerEvaluation> {
    const { question, answer } = params;

    if (!answer || answer.trim().length === 0 || answer === '(Skipped)') {
      return {
        confidence: 0,
        communication: 0,
        correctness: 0,
        finalScore: 0,
        feedback: 'No answer was provided. Try to verbalize your thoughts even if partially unsure.',
        spokenJudgment: 'No problem at all, let us keep moving.',
      };
    }

    const ai = this.getClient();
    const textModel = process.env.GEMINI_TEXT_MODEL || 'gemini-3.5-flash-lite';
    const fallbackTextModel = process.env.GEMINI_TEXT_FALLBACK_MODEL || 'gemini-3.1-flash-lite';

    const systemInstruction = `
You are an expert human interviewer evaluating a candidate's answer in a live interview session.
Score the candidate honestly between 0 and 10 on three pillars:
1. confidence (0-10): Tone clarity, assertiveness, conviction, absence of excessive filler words.
2. communication (0-10): Structure (e.g. STAR / context -> action -> outcome), conciseness, articulation.
3. correctness (0-10): Technical accuracy, depth, relevance to the specific question asked.

Calculate finalScore = Math.round((confidence + communication + correctness) / 3).
Provide feedback: 1 to 2 crisp, actionable sentences (15-25 words) directly guiding the candidate on how to improve.
Provide spokenJudgment: Exactly 1 short, warm, natural spoken reaction (6-12 words) acknowledging how the candidate did:
- If finalScore >= 7: praise genuinely (e.g. "Great explanation, that was really well articulated!", "Nice job, that covers the core concepts clearly.")
- If finalScore 4-6: gentle constructive tip (e.g. "Good effort! Digging a bit deeper into edge cases helps.", "Solid attempt, you can elaborate a bit more on trade-offs.")
- If finalScore <= 3: kind encouragement (e.g. "Got it, no problem at all. Let's move to the next one.")

Return strictly valid JSON:
{
  "confidence": 8,
  "communication": 7,
  "correctness": 8,
  "finalScore": 8,
  "feedback": "Great structured explanation of caching mechanisms. Adding concrete metrics like latency reductions would make it top-tier.",
  "spokenJudgment": "Nice explanation, that was really well articulated!"
}
`.trim();

    const userPrompt = `
Question: ${question}
Candidate's Answer: ${answer}
`.trim();

    if (ai) {
      const tryEvaluate = async (model: string) => {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction,
              temperature: 0.5,
              responseMimeType: 'application/json',
            },
          }),
          8000
        );

        if (response && response.text) {
          const cleaned = cleanJsonOutput(response.text);
          const parsed = JSON.parse(cleaned);
          const finalScore = Number(parsed.finalScore ?? 7);
          const spokenJudgment = String(
            parsed.spokenJudgment ||
              (finalScore >= 7
                ? 'Great explanation, that was really well articulated!'
                : finalScore >= 4
                ? 'Good effort! Adding a bit more detail helps.'
                : 'Got it, no problem at all.')
          );
          return {
            confidence: Number(parsed.confidence ?? 7),
            communication: Number(parsed.communication ?? 7),
            correctness: Number(parsed.correctness ?? 7),
            finalScore,
            feedback: String(parsed.feedback || 'Good attempt with solid foundational principles.'),
            spokenJudgment,
          };
        }
        return null;
      };

      try {
        const res = await tryEvaluate(textModel);
        if (res) return res;
      } catch (err) {
        console.warn(`[InterviewAiService] evaluateAnswer error with ${textModel}, trying fallback ${fallbackTextModel}:`, err);
        try {
          const fallbackRes = await tryEvaluate(fallbackTextModel);
          if (fallbackRes) return fallbackRes;
        } catch (fallbackErr) {
          console.warn('[InterviewAiService] Fallback evaluateAnswer failed:', fallbackErr);
        }
      }
    }

    // Heuristic fallback evaluation based on content richness & keywords
    const wordCount = answer.trim().split(/\s+/).length;
    let correctness = Math.min(10, Math.max(4, Math.round(wordCount / 12) + 3));
    let communication = Math.min(10, Math.max(5, Math.round(wordCount / 15) + 4));
    let confidence = Math.min(10, Math.max(5, Math.round(wordCount / 18) + 4));

    if (wordCount < 10) {
      correctness = 3;
      communication = 4;
      confidence = 3;
    }

    const finalScore = Math.round((confidence + communication + correctness) / 3);
    const spokenJudgment =
      finalScore >= 7
        ? 'Well explained, that covers the main concepts clearly!'
        : finalScore >= 4
        ? 'Good effort! Adding a bit more depth will make it even stronger.'
        : 'Got it, no problem at all.';

    return {
      confidence,
      communication,
      correctness,
      finalScore,
      feedback:
        wordCount > 35
          ? 'Comprehensive and well-structured answer with good technical depth. Keep emphasizing quantifiable outcomes.'
          : 'Concise response. Elaborating further with specific examples or trade-offs will boost your evaluation.',
      spokenJudgment,
    };
  }

  // 5. Generate Final Report Summary
  static async generateReport(role: string, questions: any[]): Promise<ComprehensiveReport> {
    const ai = this.getClient();
    const textModel = process.env.GEMINI_TEXT_MODEL || 'gemini-3.5-flash-lite';
    const fallbackTextModel = process.env.GEMINI_TEXT_FALLBACK_MODEL || 'gemini-3.1-flash-lite';

    const qSummary = questions
      .map(
        (q, i) =>
          `Q${i + 1}: ${q.question}\nAnswer: ${q.answer || 'Skipped'}\nScore: ${q.score}/10, Feedback: ${q.feedback}`
      )
      .join('\n\n');

    const systemInstruction = `
You are the placement evaluation director. Given a candidate's 5-question interview transcript and scores for the role of ${role}, produce a placement readiness summary.
Return strictly JSON:
{
  "summaryFeedback": "2-3 sentences overview of candidate placement readiness.",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Improvement tip 1", "Improvement tip 2", "Improvement tip 3"]
}
`.trim();

    if (ai) {
      const tryReport = async (model: string) => {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: qSummary,
            config: {
              systemInstruction,
              temperature: 0.6,
              responseMimeType: 'application/json',
            },
          }),
          8000
        );

        if (response && response.text) {
          const cleaned = cleanJsonOutput(response.text);
          const parsed = JSON.parse(cleaned);
          return {
            summaryFeedback: parsed.summaryFeedback || 'Solid performance displaying foundational mastery with clear growth potential.',
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 4) : ['Consistent communication', 'Clear structured thought process'],
            improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 4) : ['Practice XYZ metrics', 'Deep dive into concurrency'],
          };
        }
        return null;
      };

      try {
        const report = await tryReport(textModel);
        if (report) return report;
      } catch (err) {
        console.warn(`[InterviewAiService] generateReport error with ${textModel}, trying fallback ${fallbackTextModel}:`, err);
        try {
          const fallbackReport = await tryReport(fallbackTextModel);
          if (fallbackReport) return fallbackReport;
        } catch (fallbackErr) {
          console.warn('[InterviewAiService] Fallback generateReport failed:', fallbackErr);
        }
      }
    }

    return {
      summaryFeedback: `Candidate demonstrates solid readiness for ${role} placement drives, displaying strong composure and practical problem-solving ability.`,
      strengths: [
        'Structured answers using logical framework progression',
        'Quick articulation under simulated interview pressure',
        'Clear understanding of core engineering trade-offs',
      ],
      improvements: [
        'Cite quantifiable business and latency metrics (e.g., % improvement, p99 numbers)',
        'Dive deeper into distributed edge cases and failover recovery',
        'Maintain steady speaking pace when answering complex architectural questions',
      ],
    };
  }

  // 6. Transcribe Spoken Audio using Gemini Multimodal
  static async transcribeAudio(audioBase64: string, mimeType = 'audio/webm'): Promise<string> {
    const ai = this.getClient();
    if (!ai) {
      throw new Error('Gemini API key is not configured.');
    }

    let cleanedBase64 = audioBase64;
    if (cleanedBase64.includes(',')) {
      cleanedBase64 = cleanedBase64.split(',')[1];
    }

    let cleanMime = mimeType;
    if (cleanMime.includes(';')) {
      cleanMime = cleanMime.split(';')[0];
    }
    if (!cleanMime || cleanMime === 'audio') {
      cleanMime = 'audio/webm';
    }

    if (cleanMime.includes('wav') || cleanMime.includes('l16') || cleanMime.includes('pcm')) {
      const buffer = ensureWavHeader(Buffer.from(cleanedBase64, 'base64'));
      cleanedBase64 = buffer.toString('base64');
      cleanMime = 'audio/wav';
    }

    const textModel = process.env.GEMINI_TEXT_MODEL || 'gemini-3.5-flash-lite';
    const fallbackTextModel = process.env.GEMINI_TEXT_FALLBACK_MODEL || 'gemini-3.1-flash-lite';

    const tryTranscribe = async (model: string) => {
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: 'Transcribe this spoken interview response word-for-word. Return strictly plain text with the spoken words only. Do not add quotes, markdown, prefixes, or explanations.',
                },
                {
                  inlineData: {
                    mimeType: cleanMime,
                    data: cleanedBase64,
                  },
                },
              ],
            },
          ],
        }),
        12000
      );

      return response.text ? response.text.trim() : '';
    };

    try {
      const res = await tryTranscribe(textModel);
      if (res) return res;
    } catch (err) {
      console.warn(`[InterviewAiService] transcribeAudio failed on ${textModel}, trying fallback ${fallbackTextModel}:`, err);
      try {
        const fallbackRes = await tryTranscribe(fallbackTextModel);
        if (fallbackRes) return fallbackRes;
      } catch (fallbackErr) {
        console.warn('[InterviewAiService] Fallback transcribeAudio also failed:', fallbackErr);
        throw fallbackErr;
      }
    }

    return '';
  }
}
