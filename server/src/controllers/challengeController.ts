import { Request, Response } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import ChallengeSession, {
  IChallengeSession,
  ChallengeDifficulty,
  IQuestionItem,
} from '../models/challenge.model.js';
import { extractResumeText } from '../services/resumeParserService.js';
import {
  extractResumeHighlights,
  generateFirstQuestion,
  evaluateAnswerAndGenerateNext,
  generateFinalEvaluation,
} from '../services/challengeAiService.js';

// In-memory fallback store when MongoDB is not connected
const inMemorySessions: Map<string, any> = new Map();

function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

function generateSessionId(): string {
  return 'ch_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * POST /api/challenges/start
 * Initialize a new AI challenge session with goal, question count, difficulty, and optional resume.
 */
export const startChallenge = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      goal,
      difficulty = 'Intermediate',
      questionCount = 5,
      resumeText: manualResumeText,
    } = req.body;

    const userId = (req as any).userId || req.body.userId || 'guest';

    if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Please select or provide a career goal.' });
      return;
    }

    // Clamp question count between 3 and 25
    const parsedCount = Math.min(25, Math.max(3, parseInt(String(questionCount), 10) || 5));
    const validDifficulty: ChallengeDifficulty = ['Beginner', 'Intermediate', 'Advanced', 'Adaptive'].includes(
      difficulty
    )
      ? difficulty
      : 'Intermediate';

    let extractedResume = manualResumeText || '';
    let resumeFileName: string | undefined = undefined;

    // Handle uploaded file if present
    if (req.file) {
      resumeFileName = req.file.originalname;
      const { mimetype, originalname, path: filePath, buffer: memoryBuffer } = req.file;

      let buffer = memoryBuffer;
      if (!buffer && filePath && fs.existsSync(filePath)) {
        buffer = fs.readFileSync(filePath);
        try {
          fs.unlinkSync(filePath); // Clean up temporary file
        } catch (e) {
          // ignore unlink error
        }
      }

      if (buffer) {
        extractedResume = await extractResumeText(buffer, mimetype, originalname);
      }
    }

    // Process resume with Gemini if available
    let resumeHighlights: any = undefined;
    if (extractedResume && extractedResume.trim().length > 30) {
      resumeHighlights = await extractResumeHighlights(extractedResume, goal);
    }

    // Generate Question #1 using Gemini
    const firstQuestion = await generateFirstQuestion({
      goal: goal.trim(),
      difficulty: validDifficulty,
      questionCount: parsedCount,
      resumeHighlights,
    });

    const sessionData = {
      userId,
      goal: goal.trim(),
      questionCount: parsedCount,
      difficulty: validDifficulty,
      currentDifficulty: validDifficulty === 'Adaptive' ? 'Intermediate' : validDifficulty,
      resumeFileName,
      resumeText: extractedResume ? extractedResume.substring(0, 15000) : undefined,
      resumeHighlights,
      questions: [firstQuestion],
      currentQuestionIndex: 0,
      status: 'in-progress' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let savedSession: any;

    if (isDbConnected()) {
      const doc = new ChallengeSession(sessionData);
      savedSession = await doc.save();
    } else {
      const id = generateSessionId();
      savedSession = {
        _id: id,
        ...sessionData,
      };
      inMemorySessions.set(id, savedSession);
    }

    res.status(201).json({
      success: true,
      sessionId: String(savedSession._id),
      session: {
        _id: savedSession._id,
        goal: savedSession.goal,
        questionCount: savedSession.questionCount,
        difficulty: savedSession.difficulty,
        currentDifficulty: savedSession.currentDifficulty,
        currentQuestionIndex: 0,
        currentQuestion: firstQuestion,
        resumeHighlights: savedSession.resumeHighlights,
        status: savedSession.status,
      },
    });
  } catch (error: any) {
    console.error('[challengeController] Error in startChallenge:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to start AI interview challenge',
    });
  }
};

/**
 * GET /api/challenges/:id
 * Retrieve live challenge session state (for refresh persistence).
 */
export const getChallengeSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    let session: any = null;

    if (isDbConnected()) {
      session = await ChallengeSession.findById(id);
    } else {
      session = inMemorySessions.get(id);
    }

    if (!session) {
      res.status(404).json({ success: false, message: 'Challenge session not found' });
      return;
    }

    const currentQuestion = session.questions[session.currentQuestionIndex] || null;

    res.status(200).json({
      success: true,
      session: {
        _id: session._id,
        goal: session.goal,
        questionCount: session.questionCount,
        difficulty: session.difficulty,
        currentDifficulty: session.currentDifficulty,
        currentQuestionIndex: session.currentQuestionIndex,
        currentQuestion,
        totalAnswered: session.questions.filter((q: IQuestionItem) => q.userAnswer).length,
        status: session.status,
        finalEvaluation: session.finalEvaluation,
        questions: session.questions,
      },
    });
  } catch (error: any) {
    console.error('[challengeController] Error in getChallengeSession:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve challenge session' });
  }
};

/**
 * POST /api/challenges/:id/answer
 * Submit an answer to the current question, evaluate it with Gemini, and adaptively get the next question or final evaluation.
 */
export const submitAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { answer } = req.body;

    if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Please provide a non-empty response.' });
      return;
    }

    let session: any = null;
    if (isDbConnected()) {
      session = await ChallengeSession.findById(id);
    } else {
      session = inMemorySessions.get(id);
    }

    if (!session) {
      res.status(404).json({ success: false, message: 'Challenge session not found' });
      return;
    }

    if (session.status === 'completed') {
      res.status(400).json({
        success: false,
        message: 'This interview challenge has already been completed.',
        isCompleted: true,
        finalEvaluation: session.finalEvaluation,
      });
      return;
    }

    const currentIndex = session.currentQuestionIndex;
    const currentQuestion: IQuestionItem = session.questions[currentIndex];

    if (!currentQuestion) {
      res.status(400).json({ success: false, message: 'No active question found to answer.' });
      return;
    }

    // Record answer
    currentQuestion.userAnswer = answer.trim();
    currentQuestion.answeredAt = new Date();

    // Prepare previous history for Gemini context
    const previousHistory = session.questions
      .slice(0, currentIndex)
      .map((q: IQuestionItem) => ({
        question: q.question,
        answer: q.userAnswer || '',
        score: q.internalScore,
      }));

    // Evaluate answer with Gemini AI and adaptively generate next question
    const aiEvaluation = await evaluateAnswerAndGenerateNext({
      goal: session.goal,
      targetDifficulty: session.difficulty,
      currentDifficulty: session.currentDifficulty,
      questionCount: session.questionCount,
      currentQuestionIndex: currentIndex,
      currentQuestion,
      currentAnswer: answer.trim(),
      previousHistory,
      resumeHighlights: session.resumeHighlights,
    });

    // Update current question with AI analysis
    currentQuestion.aiFeedbackAck = aiEvaluation.aiFeedbackAck;
    currentQuestion.internalScore = aiEvaluation.internalScore;
    currentQuestion.strengthsIdentified = aiEvaluation.strengths;
    currentQuestion.weaknessesIdentified = aiEvaluation.weaknesses;

    session.currentDifficulty = aiEvaluation.nextDifficulty || session.currentDifficulty;

    // Check if challenge is now completed
    const isCompleted = aiEvaluation.isCompleted || (currentIndex + 1 >= session.questionCount);

    if (isCompleted) {
      // Generate Final Comprehensive Report
      const finalEval = await generateFinalEvaluation({
        goal: session.goal,
        difficulty: session.difficulty,
        questionCount: session.questionCount,
        questionsWithAnswers: session.questions,
        resumeHighlights: session.resumeHighlights,
      });

      session.status = 'completed';
      session.finalEvaluation = finalEval;
      session.overallScore = finalEval.overallScore;
      session.completedAt = new Date();
      session.updatedAt = new Date();

      if (isDbConnected()) {
        await session.save();
      } else {
        inMemorySessions.set(id, session);
      }

      res.status(200).json({
        success: true,
        isCompleted: true,
        aiAcknowledgment: aiEvaluation.aiFeedbackAck,
        finalEvaluation: finalEval,
        session: {
          _id: session._id,
          goal: session.goal,
          status: 'completed',
          overallScore: finalEval.overallScore,
        },
      });
      return;
    }

    // Append next question and advance index
    if (aiEvaluation.nextQuestion) {
      session.questions.push(aiEvaluation.nextQuestion);
      session.currentQuestionIndex = currentIndex + 1;
    } else {
      // Safety: in case nextQuestion was omitted, advance anyway
      session.currentQuestionIndex = currentIndex + 1;
    }

    session.updatedAt = new Date();

    if (isDbConnected()) {
      await session.save();
    } else {
      inMemorySessions.set(id, session);
    }

    const nextQ = session.questions[session.currentQuestionIndex];

    res.status(200).json({
      success: true,
      isCompleted: false,
      aiAcknowledgment: aiEvaluation.aiFeedbackAck,
      nextQuestion: nextQ,
      currentQuestionIndex: session.currentQuestionIndex,
      totalQuestions: session.questionCount,
      currentDifficulty: session.currentDifficulty,
    });
  } catch (error: any) {
    console.error('[challengeController] Error in submitAnswer:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to submit response and generate next question',
    });
  }
};

/**
 * GET /api/challenges/:id/results
 * Retrieve final performance report and question evaluations for a completed challenge.
 */
export const getChallengeResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    let session: any = null;
    if (isDbConnected()) {
      session = await ChallengeSession.findById(id);
    } else {
      session = inMemorySessions.get(id);
    }

    if (!session) {
      res.status(404).json({ success: false, message: 'Challenge session not found' });
      return;
    }

    if (session.status !== 'completed' || !session.finalEvaluation) {
      res.status(400).json({
        success: false,
        message: 'This challenge is still in progress. Please complete all questions first.',
        isCompleted: false,
      });
      return;
    }

    res.status(200).json({
      success: true,
      session: {
        _id: session._id,
        goal: session.goal,
        difficulty: session.difficulty,
        questionCount: session.questionCount,
        completedAt: session.completedAt,
        finalEvaluation: session.finalEvaluation,
        questions: session.questions,
      },
    });
  } catch (error: any) {
    console.error('[challengeController] Error in getChallengeResults:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve challenge results' });
  }
};
