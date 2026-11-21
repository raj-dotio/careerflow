import { GoogleGenAI } from '@google/genai';
import {
  ChallengeDifficulty,
  IQuestionItem,
  IFinalEvaluation,
  IQuestionEvaluation,
  QuestionType,
} from '../models/challenge.model.js';

const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
];

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length < 15 || apiKey.includes('your_gemini_api_key')) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Timeout helper to prevent hanging if Google Gemini API is experiencing 503 latency
async function callGeminiWithTimeout(
  ai: GoogleGenAI,
  model: string,
  options: { contents: string; config?: any },
  timeoutMs = 7000
): Promise<any> {
  return Promise.race([
    ai.models.generateContent({
      model,
      contents: options.contents,
      config: options.config,
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms on ${model}`)), timeoutMs)
    ),
  ]);
}

// Clean JSON code fences
function cleanJsonOutput(text: string): string {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

/**
 * 1. Extract resume highlights relevant to the target career goal
 */
export async function extractResumeHighlights(
  resumeText: string,
  goal: string
): Promise<{ skills: string[]; projects: string[]; experience: string; education?: string }> {
  const ai = getGenAIClient();
  if (ai) {
    const prompt = `You are a Principal Technical Recruiter. Analyze this candidate resume for the role: "${goal}".
Extract only factual highlights from the resume text below. Do NOT invent anything.

RESUME TEXT:
${resumeText.substring(0, 7000)}

Return JSON adhering strictly to:
{
  "skills": ["top 6-10 authentic technical skills found"],
  "projects": ["1-3 key technical projects with technologies used"],
  "experience": "Brief 1-2 sentence summary of their work/internship/academic experience",
  "education": "Degree, major, college if present"
}`;

    for (const model of GEMINI_MODELS) {
      try {
        const response = await callGeminiWithTimeout(ai, model, {
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });
        const text = response.text;
        if (text) {
          const parsed = JSON.parse(cleanJsonOutput(text));
          if (Array.isArray(parsed.skills)) {
            return {
              skills: parsed.skills.slice(0, 12),
              projects: Array.isArray(parsed.projects) ? parsed.projects.slice(0, 5) : [],
              experience: parsed.experience || 'Engineering background with hands-on technical projects.',
              education: parsed.education || '',
            };
          }
        }
      } catch (err: any) {
        console.warn(`[challengeAiService] extractResumeHighlights failed with ${model}:`, err?.message || err);
      }
    }
  }

  // Algorithmic Fallback
  const detectedSkills = [
    'React', 'TypeScript', 'Node.js', 'Express', 'Python', 'PostgreSQL', 'MongoDB',
    'Docker', 'AWS', 'REST APIs', 'Git', 'Data Structures', 'SQL'
  ].filter(s => new RegExp(`\\b${s}\\b`, 'i').test(resumeText));

  return {
    skills: detectedSkills.length > 0 ? detectedSkills : ['General Software Engineering', 'Web Development'],
    projects: ['Production Software Engineering Project'],
    experience: 'Engineering experience in full-stack software development.',
    education: 'Engineering / Computer Science',
  };
}

/**
 * 2. Generate Opening Question (Question 1)
 */
export async function generateFirstQuestion(params: {
  goal: string;
  difficulty: ChallengeDifficulty;
  questionCount: number;
  resumeHighlights?: { skills: string[]; projects: string[]; experience: string; education?: string };
}): Promise<IQuestionItem> {
  const { goal, difficulty, questionCount, resumeHighlights } = params;
  const ai = getGenAIClient();

  const startingDifficulty = difficulty === 'Adaptive' ? 'Intermediate' : difficulty;

  if (ai) {
    const resumeContext = resumeHighlights && resumeHighlights.skills.length > 0
      ? `CANDIDATE RESUME PROFILE:
- Known Skills: ${resumeHighlights.skills.join(', ')}
- Projects: ${resumeHighlights.projects.join('; ')}
- Background: ${resumeHighlights.experience}
INSTRUCTION: Craft a personalized opening question that tests foundational knowledge or touches on their stated skills/projects for the goal "${goal}".`
      : `No resume provided. Formulate a strong, high-signal opening technical question for the goal "${goal}".`;

    const prompt = `You are an empathetic, highly skilled Senior Staff Technical Interviewer at a top technology firm conducting a live, one-on-one adaptive technical interview.
The candidate has chosen the career goal: "${goal}".
Target difficulty level: "${startingDifficulty}".
Total questions planned in this session: ${questionCount}.

${resumeContext}

Generate the very FIRST question (Question #1).
Rules:
1. Make the question engaging, clear, and focused on core principles, practical architecture, or hands-on implementation.
2. Do not reveal the ideal answer.
3. Be professional and encouraging.

Return strictly JSON matching this structure:
{
  "question": "The interview question text",
  "questionNumber": 1,
  "topic": "Core topic e.g. React Lifecycle, SQL Indexing, Microservice Resilience",
  "difficulty": "${startingDifficulty}",
  "questionType": "Conceptual" | "Practical" | "Scenario" | "Resume-Project" | "Technical"
}`;

    for (const model of GEMINI_MODELS) {
      try {
        const response = await callGeminiWithTimeout(ai, model, {
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });
        const text = response.text;
        if (text) {
          const parsed = JSON.parse(cleanJsonOutput(text));
          if (parsed.question && typeof parsed.question === 'string') {
            return {
              questionNumber: 1,
              question: parsed.question.trim(),
              topic: parsed.topic || goal,
              difficulty: parsed.difficulty || startingDifficulty,
              questionType: (parsed.questionType as QuestionType) || 'Technical',
            };
          }
        }
      } catch (err: any) {
        console.warn(`[challengeAiService] generateFirstQuestion failed with ${model}:`, err?.message || err);
      }
    }
  }

  // Fallback Opening Question
  return getFallbackFirstQuestion(goal, startingDifficulty);
}

/**
 * 3. Evaluate User's Answer and Adaptively Generate the Next Question
 */
export async function evaluateAnswerAndGenerateNext(params: {
  goal: string;
  targetDifficulty: ChallengeDifficulty;
  currentDifficulty: string;
  questionCount: number;
  currentQuestionIndex: number; // 0-based index of the question just answered
  currentQuestion: IQuestionItem;
  currentAnswer: string;
  previousHistory: Array<{ question: string; answer: string; score?: number }>;
  resumeHighlights?: { skills: string[]; projects: string[]; experience: string };
}): Promise<{
  aiFeedbackAck: string;
  internalScore: number;
  strengths: string[];
  weaknesses: string[];
  nextDifficulty: string;
  nextQuestion?: IQuestionItem;
  isCompleted: boolean;
}> {
  const {
    goal,
    targetDifficulty,
    currentDifficulty,
    questionCount,
    currentQuestionIndex,
    currentQuestion,
    currentAnswer,
    previousHistory,
    resumeHighlights,
  } = params;

  const nextQuestionNumber = currentQuestionIndex + 2; // Next 1-based question number
  const isFinalQuestion = nextQuestionNumber > questionCount;

  const ai = getGenAIClient();

  if (ai) {
    const historyText = previousHistory
      .map(
        (h, i) =>
          `Q${i + 1}: ${h.question}\nAnswer: ${h.answer}\nScore: ${h.score || 70}/100`
      )
      .join('\n\n');

    const prompt = `You are an expert, adaptive Senior Technical Interviewer conducting a live interview for: "${goal}".
Target baseline difficulty: "${targetDifficulty}".
Current difficulty: "${currentDifficulty}".
Total interview length: ${questionCount} questions.
Candidate just answered Question #${currentQuestionIndex + 1} of ${questionCount}.

QUESTION JUST ASKED:
"${currentQuestion.question}" (Topic: ${currentQuestion.topic}, Difficulty: ${currentQuestion.difficulty})

CANDIDATE'S SUBMITTED ANSWER:
"${currentAnswer}"

${historyText ? `PREVIOUS QUESTIONS & ANSWERS IN THIS SESSION:\n${historyText}\n` : ''}
${
  resumeHighlights && resumeHighlights.projects.length > 0
    ? `CANDIDATE RESUME HIGHLIGHTS:\n- Skills: ${resumeHighlights.skills.join(', ')}\n- Projects: ${resumeHighlights.projects.join('; ')}\n`
    : ''
}

TASK:
1. Evaluate the candidate's submitted answer:
   - Score it from 0 to 100 based on technical depth, correctness, practical trade-offs, and clarity.
   - Provide a brief, natural "aiFeedbackAck" (1-2 sentences): Acknowledge their response professionally as a human interviewer would before transitioning. Do NOT reveal the ideal answer or explicitly give away the score.
   - Identify 1-2 strengths and 1-2 weaknesses/gaps in their answer.
2. Adapt difficulty dynamically:
   - If answer score >= 85: Elevate to a more advanced, edge-case, architecture, or deep trade-off question.
   - If answer score between 60-84: Maintain or explore a practical scenario / real-world implementation.
   - If answer score < 60: Ask a foundational or conceptual clarification question to gauge their grounding.
3. ${
      isFinalQuestion
        ? 'This was the FINAL question! Do NOT generate another question. Set isCompleted to true.'
        : `Generate Question #${nextQuestionNumber} of ${questionCount}. Make it a natural follow-up or pivot to another crucial domain for "${goal}". Do NOT repeat previously asked questions.`
    }

Return strictly JSON matching:
{
  "aiFeedbackAck": "Brief natural interviewer transition acknowledgment",
  "internalScore": number (0-100),
  "strengths": ["specific strong concept demonstrated"],
  "weaknesses": ["specific gap or missing trade-off"],
  "nextDifficulty": "Beginner" | "Intermediate" | "Advanced",
  "isCompleted": ${isFinalQuestion},
  ${
    !isFinalQuestion
      ? `"nextQuestion": {
    "question": "The next question text",
    "questionNumber": ${nextQuestionNumber},
    "topic": "Topic name",
    "difficulty": "Beginner" | "Intermediate" | "Advanced",
    "questionType": "Conceptual" | "Practical" | "Scenario" | "Resume-Project" | "Technical"
  }`
      : '"nextQuestion": null'
  }
}`;

    for (const model of GEMINI_MODELS) {
      try {
        const response = await callGeminiWithTimeout(ai, model, {
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.35,
          },
        });
        const text = response.text;
        if (text) {
          const parsed = JSON.parse(cleanJsonOutput(text));
          if (typeof parsed.internalScore === 'number') {
            const score = Math.min(100, Math.max(10, Math.round(parsed.internalScore)));
            const ack =
              parsed.aiFeedbackAck ||
              'Thank you for sharing your thoughts on that. Let us move to the next topic.';
            const strengths = Array.isArray(parsed.strengths) ? parsed.strengths : ['Clear communication'];
            const weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses : ['Could detail practical edge-cases'];
            const nextDiff = parsed.nextDifficulty || currentDifficulty;

            let nextQ: IQuestionItem | undefined = undefined;
            if (!isFinalQuestion && parsed.nextQuestion && parsed.nextQuestion.question) {
              nextQ = {
                questionNumber: nextQuestionNumber,
                question: parsed.nextQuestion.question.trim(),
                topic: parsed.nextQuestion.topic || goal,
                difficulty: parsed.nextQuestion.difficulty || nextDiff,
                questionType: (parsed.nextQuestion.questionType as QuestionType) || 'Technical',
              };
            }

            return {
              aiFeedbackAck: ack,
              internalScore: score,
              strengths,
              weaknesses,
              nextDifficulty: nextDiff,
              nextQuestion: nextQ,
              isCompleted: isFinalQuestion,
            };
          }
        }
      } catch (err: any) {
        console.warn(`[challengeAiService] evaluateAnswerAndGenerateNext failed with ${model}:`, err?.message || err);
      }
    }
  }

  // Fallback Evaluation & Next Question
  const fallbackScore = Math.min(95, Math.max(45, Math.round(currentAnswer.trim().length / 6) + 40));
  const ack =
    fallbackScore > 75
      ? 'Good breakdown of the core mechanics. Let us continue exploring related technical areas.'
      : 'Understood. Let us examine another dimension of this technology stack.';

  let nextQ: IQuestionItem | undefined = undefined;
  if (!isFinalQuestion) {
    nextQ = getFallbackFollowupQuestion(goal, nextQuestionNumber, currentDifficulty);
  }

  return {
    aiFeedbackAck: ack,
    internalScore: fallbackScore,
    strengths: ['Relevant conceptual context provided'],
    weaknesses: ['Can include more measurable architectural trade-offs'],
    nextDifficulty: currentDifficulty,
    nextQuestion: nextQ,
    isCompleted: isFinalQuestion,
  };
}

/**
 * 4. Comprehensive Final Interview Evaluation & Performance Report
 */
export async function generateFinalEvaluation(params: {
  goal: string;
  difficulty: ChallengeDifficulty;
  questionCount: number;
  questionsWithAnswers: IQuestionItem[];
  resumeHighlights?: { skills: string[]; projects: string[]; experience: string };
}): Promise<IFinalEvaluation> {
  const { goal, difficulty, questionCount, questionsWithAnswers, resumeHighlights } = params;
  const ai = getGenAIClient();

  // Calculate base score from internal question scores
  const answeredQuestions = questionsWithAnswers.filter(q => q.userAnswer && q.userAnswer.trim().length > 0);
  const totalScoreSum = answeredQuestions.reduce((acc, q) => acc + (q.internalScore || 70), 0);
  const rawAvg = answeredQuestions.length > 0 ? Math.round(totalScoreSum / answeredQuestions.length) : 65;

  if (ai) {
    const formattedTranscript = questionsWithAnswers
      .map(
        (q, i) => `--- QUESTION ${i + 1} (${q.topic} - ${q.difficulty}) ---
Question: ${q.question}
Candidate Answer: ${q.userAnswer || '[No Answer Provided]'}
Interviewer Internal Score: ${q.internalScore || 70}/100`
      )
      .join('\n\n');

    const prompt = `You are a Principal Bar Raiser and Senior Director of Engineering evaluating a candidate's completed technical interview for: "${goal}".
Baseline Difficulty: "${difficulty}".
Questions Completed: ${questionsWithAnswers.length} of ${questionCount}.

FULL INTERVIEW TRANSCRIPT:
${formattedTranscript}

${
  resumeHighlights
    ? `RESUME CONTEXT:\nSkills: ${resumeHighlights.skills.join(', ')}\nProjects: ${resumeHighlights.projects.join('; ')}\n`
    : ''
}

Perform an exhaustive, objective, professional evaluation.
Requirements:
1. "overallScore": Calculate a realistic composite score (0-100) based strictly on candidate answers.
2. "performanceLevel": Must be one of: "Outstanding" (88-100), "Proficient" (75-87), "Developing" (60-74), or "Needs Practice" (<60).
3. "performanceSummary": 3-4 actionable sentences summarizing their technical readiness, depth, and biggest growth area.
4. "estimatedKnowledgeLevel": e.g. "Upper Intermediate / Ready for SDE-2 Screening".
5. "questionEvaluations": For EVERY question in the interview, provide:
   - "questionNumber": number
   - "question": original question
   - "userAnswer": original answer
   - "score": score 0-100
   - "whatWentWell": 1 sentence highlight
   - "whatWasMissing": 1 sentence gap
   - "howToImprove": 1 sentence actionable advice
   - "idealAnswer": 2-3 sentence recruiter benchmark answer demonstrating optimal depth and trade-offs.
6. "strongestSkills": 3-5 technical areas where they excelled.
7. "weakestAreas": 2-4 topics requiring urgent study.
8. "knowledgeGaps": specific edge-cases, algorithms, or systems concepts they missed.
9. "problemSolvingAssessment": 2 sentences on analytical ability and trade-off evaluation.
10. "communicationAssessment": 2 sentences on technical articulation and clarity.
11. "technicalImprovementSuggestions": 3-5 high-signal bullet recommendations.
12. "recommendedLearningTopics": 3-5 specific topics/technologies to master next.
13. "adaptiveTrajectory":
   - "initialKnowledgeLevel": estimated starting level
   - "finalDemonstratedLevel": demonstrated level by end of challenge
   - "handlingOfHardQuestions": how they reacted to complex questions
   - "performanceProgression": trend (e.g. "Steadily gained confidence and depth").

Return strictly JSON matching this structure. No markdown wrappers.`;

    for (const model of GEMINI_MODELS) {
      try {
        const response = await callGeminiWithTimeout(ai, model, {
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.25,
          },
        }, 12000);
        const text = response.text;
        if (text) {
          const parsed = JSON.parse(cleanJsonOutput(text));
          if (
            typeof parsed.overallScore === 'number' &&
            Array.isArray(parsed.questionEvaluations)
          ) {
            const finalScore = Math.min(100, Math.max(15, Math.round(parsed.overallScore)));
            const level =
              finalScore >= 88
                ? 'Outstanding'
                : finalScore >= 75
                ? 'Proficient'
                : finalScore >= 60
                ? 'Developing'
                : 'Needs Practice';

            return {
              overallScore: finalScore,
              performanceLevel: level,
              performanceSummary: parsed.performanceSummary || 'Completed AI interview evaluation.',
              estimatedKnowledgeLevel: parsed.estimatedKnowledgeLevel || `${level} Level Developer`,
              questionEvaluations: parsed.questionEvaluations.map((qe: any, idx: number) => ({
                questionNumber: qe.questionNumber || idx + 1,
                question: qe.question || questionsWithAnswers[idx]?.question || '',
                userAnswer: qe.userAnswer || questionsWithAnswers[idx]?.userAnswer || '',
                score: Math.min(100, Math.max(10, Math.round(qe.score || 70))),
                whatWentWell: qe.whatWentWell || 'Demonstrated grasp of standard paradigms.',
                whatWasMissing: qe.whatWasMissing || 'Could elaborate on edge cases and scalability.',
                howToImprove: qe.howToImprove || 'Practice articulating architectural trade-offs.',
                idealAnswer: qe.idealAnswer || 'Focus on separation of concerns, time complexity, and failure modes.',
              })),
              strongestSkills: Array.isArray(parsed.strongestSkills) ? parsed.strongestSkills : ['Core Architecture', 'Clean Concepts'],
              weakestAreas: Array.isArray(parsed.weakestAreas) ? parsed.weakestAreas : ['Production Edge Cases', 'Concurrency'],
              knowledgeGaps: Array.isArray(parsed.knowledgeGaps) ? parsed.knowledgeGaps : ['Distributed Caching', 'Database Index Tuning'],
              problemSolvingAssessment: parsed.problemSolvingAssessment || 'Systematic problem breakdown with sensible engineering intuitions.',
              communicationAssessment: parsed.communicationAssessment || 'Direct and structured answers with appropriate terminology.',
              technicalImprovementSuggestions: Array.isArray(parsed.technicalImprovementSuggestions)
                ? parsed.technicalImprovementSuggestions
                : ['Dive deeper into concurrency primitives', 'Review database query execution plans', 'Quantify architectural impacts with metrics'],
              recommendedLearningTopics: Array.isArray(parsed.recommendedLearningTopics)
                ? parsed.recommendedLearningTopics
                : ['System Design Patterns', 'Advanced Async Workflows', 'Database Indexing Strategies'],
              adaptiveTrajectory: {
                initialKnowledgeLevel: parsed.adaptiveTrajectory?.initialKnowledgeLevel || `${difficulty} baseline`,
                finalDemonstratedLevel: parsed.adaptiveTrajectory?.finalDemonstratedLevel || `${level} confirmed`,
                handlingOfHardQuestions: parsed.adaptiveTrajectory?.handlingOfHardQuestions || 'Handled moderate scenarios effectively.',
                performanceProgression: parsed.adaptiveTrajectory?.performanceProgression || 'Consistent performance throughout the challenge.',
              },
            };
          }
        }
      } catch (err: any) {
        console.warn(`[challengeAiService] generateFinalEvaluation failed with ${model}:`, err?.message || err);
      }
    }
  }

  // Fallback Evaluation Engine
  const finalScore = rawAvg;
  const level: IFinalEvaluation['performanceLevel'] =
    finalScore >= 88
      ? 'Outstanding'
      : finalScore >= 75
      ? 'Proficient'
      : finalScore >= 60
      ? 'Developing'
      : 'Needs Practice';

  const questionEvaluations: IQuestionEvaluation[] = questionsWithAnswers.map((q, idx) => ({
    questionNumber: q.questionNumber || idx + 1,
    question: q.question,
    userAnswer: q.userAnswer || 'No answer submitted',
    score: q.internalScore || 70,
    whatWentWell: 'Clear explanation of primary mechanism and standard usage patterns.',
    whatWasMissing: 'Could quantify throughput or discuss high-scale boundary conditions.',
    howToImprove: 'Highlight practical production experiences and trade-offs between speed and memory.',
    idealAnswer:
      'In production engineering, this is resolved by decoupling dependencies, adding defensive boundary checks, and profiling execution hot-paths.',
  }));

  return {
    overallScore: finalScore,
    performanceLevel: level,
    performanceSummary: `Demonstrated solid ${level.toLowerCase()} competence in ${goal}. Solid conceptual grounding with opportunities to expand on distributed scaling and defensive error handling.`,
    estimatedKnowledgeLevel: `${level} Engineer`,
    questionEvaluations,
    strongestSkills: [goal, 'Core Problem Solving', 'Technical Communication'],
    weakestAreas: ['High-scale production resilience', 'Performance profiling under load'],
    knowledgeGaps: ['P99 latency optimization', 'Concurrency race-condition management'],
    problemSolvingAssessment: 'Structured analytical approach with realistic trade-off awareness.',
    communicationAssessment: 'Clear technical vocabulary and organized paragraph structure.',
    technicalImprovementSuggestions: [
      'Focus on the Google XYZ formula when explaining project impacts in technical rounds.',
      'Always state time and space complexity trade-offs before writing or explaining code.',
      'Discuss failure modes and graceful degradation strategies in distributed architectures.',
    ],
    recommendedLearningTopics: [
      `${goal} Deep Dive Architecture`,
      'Database Concurrency and Isolation Levels',
      'Distributed Caching and Invalidation Strategies',
    ],
    adaptiveTrajectory: {
      initialKnowledgeLevel: `${difficulty} Starting Baseline`,
      finalDemonstratedLevel: `${level} Demonstrable Competency`,
      handlingOfHardQuestions: 'Showed adaptability when faced with deeper scenarios.',
      performanceProgression: 'Maintained composure and answered with increasing precision.',
    },
  };
}

/**
 * Fallback questions for offline / rate-limited situations
 */
function getFallbackFirstQuestion(goal: string, difficulty: string): IQuestionItem {
  const goalLower = goal.toLowerCase();

  if (goalLower.includes('frontend') || goalLower.includes('react')) {
    return {
      questionNumber: 1,
      question:
        'In React 18 & 19, how does Concurrent Rendering fundamentally differ from the legacy synchronous reconciler, and what practical advantages does startTransition provide for UI responsiveness?',
      topic: 'React Concurrent Mode & Transitions',
      difficulty,
      questionType: 'Technical',
    };
  }

  if (goalLower.includes('backend') || goalLower.includes('node')) {
    return {
      questionNumber: 1,
      question:
        'When architecting an Express/Node.js API under 10,000 concurrent requests, what causes the Node Event Loop to lag, and how would you identify and mitigate CPU-bound bottlenecks without blocking incoming I/O?',
      topic: 'Node.js Event Loop & Scalability',
      difficulty,
      questionType: 'Practical',
    };
  }

  if (goalLower.includes('python')) {
    return {
      questionNumber: 1,
      question:
        'Can you explain the role of Python’s Global Interpreter Lock (GIL), its impact on CPU-bound multi-threading, and when you would choose multiprocessing or asyncio instead?',
      topic: 'Python Concurrency & GIL',
      difficulty,
      questionType: 'Conceptual',
    };
  }

  if (goalLower.includes('data structure') || goalLower.includes('algorithm') || goalLower.includes('dsa')) {
    return {
      questionNumber: 1,
      question:
        'Suppose you need to find the median of a continuous stream of incoming integers in real time. Which data structures would you use to achieve O(1) median retrieval and O(log N) insertion, and why?',
      topic: 'Streaming Data & Two Heaps Pattern',
      difficulty,
      questionType: 'Technical',
    };
  }

  if (goalLower.includes('database') || goalLower.includes('sql')) {
    return {
      questionNumber: 1,
      question:
        'Explain the architectural difference between a Clustered and Non-Clustered index in relational databases, and what happens when an index undergoes a B-Tree page split during high-frequency inserts?',
      topic: 'B-Tree Indexing & Storage Engines',
      difficulty,
      questionType: 'Technical',
    };
  }

  if (goalLower.includes('system design')) {
    return {
      questionNumber: 1,
      question:
        'How would you design a distributed, idempotent payment processing system that guarantees no double-charging even if client network timeouts occur mid-flight?',
      topic: 'Distributed Idempotency & Two-Phase Commit',
      difficulty,
      questionType: 'System-Design',
    };
  }

  // General Software Engineering
  return {
    questionNumber: 1,
    question: `When building applications in ${goal}, how do you approach decoupling state from presentation, and what caching or optimization patterns have you found most effective in production?`,
    topic: `${goal} Architecture`,
    difficulty,
    questionType: 'Scenario',
  };
}

function getFallbackFollowupQuestion(goal: string, questionNum: number, difficulty: string): IQuestionItem {
  const followups = [
    {
      question:
        'How do you manage cross-cutting concerns such as centralized error handling, distributed tracing, and request rate limiting in your architecture?',
      topic: 'Cross-Cutting Resilience & Observability',
      type: 'Practical' as QuestionType,
    },
    {
      question:
        'Can you walk me through a complex technical bug or production race condition you encountered, and how you systematically isolated the root cause?',
      topic: 'Debugging & Problem Solving',
      type: 'Scenario' as QuestionType,
    },
    {
      question:
        'What criteria do you use to evaluate whether to introduce an external library or message broker versus building a lightweight in-house solution?',
      topic: 'System Trade-offs & Engineering Judgment',
      type: 'Conceptual' as QuestionType,
    },
    {
      question:
        'How would you design automated integration test suites for this stack to guarantee zero regressions during continuous deployment pipelines?',
      topic: 'Testing & CI/CD Integrity',
      type: 'Technical' as QuestionType,
    },
  ];

  const picked = followups[(questionNum - 2) % followups.length];

  return {
    questionNumber: questionNum,
    question: picked.question,
    topic: picked.topic,
    difficulty,
    questionType: picked.type,
  };
}
