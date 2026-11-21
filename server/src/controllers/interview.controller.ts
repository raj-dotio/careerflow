import fs from 'fs';
import { Response } from 'express';
import { AuthRequest } from '../middlewares/isAuth.js';
import Interview from '../models/interview.model.js';
import User from '../models/user.model.js';
import { InterviewAiService } from '../services/interviewAi.service.js';
import { InterviewTtsService } from '../services/interviewTts.service.js';
import { extractTextFromFile } from './atsController.js';

// POST /api/mock-interview/start
export const startInterview = async (req: AuthRequest, res: Response) => {
  try {
    const {
      role = 'Full-Stack Developer',
      experience = 'Fresher / Entry-Level',
      mode = 'Technical',
      techStack = [],
      interviewerGender = 'female',
      resumeText = '',
    } = req.body;

    const normalizedTechStack = Array.isArray(techStack)
      ? techStack
      : typeof techStack === 'string'
      ? (techStack as string).split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const rawMode = (mode || '').toLowerCase();
    const normalizedMode: 'HR' | 'Technical' | 'Mixed' =
      rawMode === 'hr' ? 'HR' : rawMode === 'mixed' ? 'Mixed' : 'Technical';

    let user = null;
    if (req.userId) {
      user = await User.findById(req.userId);
    }

    // Step 3: Determine Personalisation Mode (Resume-driven vs Role-driven)
    const hasResumeText = typeof resumeText === 'string' && resumeText.trim().length >= 30;
    let resumeStructured = null;
    let modeType: 'RESUME_DRIVEN' | 'ROLE_DRIVEN' = 'ROLE_DRIVEN';

    if (hasResumeText) {
      try {
        resumeStructured = await InterviewAiService.structureResume(resumeText.trim());
        if (resumeStructured && (resumeStructured.projects?.length || resumeStructured.skills?.length)) {
          modeType = 'RESUME_DRIVEN';
        }
      } catch (structErr) {
        console.warn('[InterviewController] Resume structuring warning, falling back to role-driven:', structErr);
        modeType = 'ROLE_DRIVEN';
      }
    }

    // Step 2.3: Generate Interview Plan (5 progressive rounds) BEFORE first question
    const plan = await InterviewAiService.generateInterviewPlan({
      role,
      experience,
      mode: normalizedMode,
      techStack: normalizedTechStack,
      resumeStructured: resumeStructured || undefined,
      modeType,
    });

    // Step 2.1 & Step 4: Generate Question 1 dynamically from Round 1 subtopics
    const firstQ = await InterviewAiService.generateNextQuestion({
      role,
      experience,
      mode: normalizedMode,
      modeType,
      interviewerGender: interviewerGender === 'male' ? 'male' : 'female',
      roundNumber: 1,
      totalRounds: 5,
      roundName: plan[0]?.roundName || 'Intro and Background',
      currentRoundSubtopics: plan[0]?.subtopics || ['Career journey & motivation'],
      techStack: normalizedTechStack,
      resumeStructured: resumeStructured || undefined,
      askedTopics: [],
      askedQuestions: [],
      conversationHistory: [],
    });

    // Create interview record in DB with session memory fields
    const interview = await Interview.create({
      userId: user ? user._id : undefined,
      role,
      experience,
      mode: normalizedMode,
      interviewerGender: interviewerGender === 'male' ? 'male' : 'female',
      techStack: normalizedTechStack,
      resumeText: hasResumeText ? resumeText.trim() : '',
      resumeStructured: resumeStructured || undefined,
      modeType,
      interviewPlan: plan,
      askedTopics: [firstQ.topic],
      askedQuestions: [firstQ.question],
      currentRoundIndex: 0,
      totalRounds: 5,
      questions: [
        {
          question: firstQ.question,
          spokenText: firstQ.spokenText || firstQ.question,
          spokenJudgment: firstQ.spokenJudgment || '',
          topic: firstQ.topic,
          difficulty: firstQ.difficulty,
          timeLimit: firstQ.timeLimit,
          expectedPoints: firstQ.expectedPoints,
          answer: '',
          feedback: '',
          score: 0,
        },
      ],
      status: 'Incompleted',
    });

    // Deduct credits if user exists and has enough credits
    if (user && user.credits >= 50) {
      user.credits -= 50;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      interviewId: interview._id,
      interviewerGender: interview.interviewerGender,
      role: interview.role,
      mode: interview.mode,
      modeType: interview.modeType,
      experience: interview.experience,
      interviewPlan: interview.interviewPlan,
      totalRounds: interview.totalRounds,
      questions: [
        {
          index: 0,
          question: firstQ.question,
          spokenText: firstQ.spokenText || firstQ.question,
          spokenJudgment: firstQ.spokenJudgment || '',
          topic: firstQ.topic,
          difficulty: firstQ.difficulty,
          timeLimit: firstQ.timeLimit,
        },
      ],
      creditsLeft: user ? user.credits : 1000,
    });
  } catch (error: any) {
    console.error('[InterviewController] startInterview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start interview session',
      error: error.message,
    });
  }
};

// POST /api/mock-interview/answer
export const submitAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const { interviewId, questionIndex, answer = '', timeTaken = 0 } = req.body;

    if (!interviewId || questionIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: 'interviewId and questionIndex are required',
      });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found',
      });
    }

    const currentQuestion = interview.questions[questionIndex];
    if (!currentQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Question index out of bounds',
      });
    }

    // AI Evaluation of submitted answer
    const evaluation = await InterviewAiService.evaluateAnswer({
      question: currentQuestion.question,
      answer: String(answer).trim(),
      difficulty: currentQuestion.difficulty,
      role: interview.role,
    });

    currentQuestion.answer = String(answer).trim();
    currentQuestion.score = evaluation.finalScore;
    currentQuestion.confidence = evaluation.confidence;
    currentQuestion.communication = evaluation.communication;
    currentQuestion.correctness = evaluation.correctness;
    currentQuestion.feedback = evaluation.feedback;
    currentQuestion.spokenJudgment = evaluation.spokenJudgment;

    const nextRoundNumber = questionIndex + 2; // 0-based questionIndex -> next is 2 to 5
    let nextQuestionItem: any = null;

    // Turn-by-Turn Dynamic Generation of the Next Question
    if (nextRoundNumber <= (interview.totalRounds || 5)) {
      // Check if next question is already generated (e.g. from a prior call)
      if (interview.questions.length > questionIndex + 1) {
        const existingNext = interview.questions[questionIndex + 1];
        nextQuestionItem = {
          index: questionIndex + 1,
          question: existingNext.question,
          spokenText: existingNext.spokenText || existingNext.question,
          spokenJudgment: existingNext.spokenJudgment || '',
          topic: existingNext.topic,
          difficulty: existingNext.difficulty,
          timeLimit: existingNext.timeLimit,
        };
      } else {
        const planRound = interview.interviewPlan?.[questionIndex + 1] || {
          roundName: `Round ${nextRoundNumber}`,
          subtopics: ['Technical architecture'],
        };

        const conversationHistory = interview.questions.map((q, idx) => ({
          turn: idx + 1,
          question: q.question,
          answer: q.answer || '',
          feedback: q.feedback || '',
          spokenJudgment: q.spokenJudgment || '',
        }));

        try {
          const generatedNext = await InterviewAiService.generateNextQuestion({
            interviewId: interview._id.toString(),
            role: interview.role,
            experience: interview.experience,
            mode: interview.mode,
            modeType: interview.modeType || 'ROLE_DRIVEN',
            interviewerGender: interview.interviewerGender,
            roundNumber: nextRoundNumber,
            totalRounds: interview.totalRounds || 5,
            roundName: planRound.roundName,
            currentRoundSubtopics: planRound.subtopics,
            techStack: interview.techStack || [],
            resumeStructured: interview.resumeStructured,
            askedTopics: interview.askedTopics || [],
            askedQuestions: interview.askedQuestions || [],
            conversationHistory,
            previousJudgment: evaluation.spokenJudgment,
          });

          interview.questions.push({
            question: generatedNext.question,
            spokenText: generatedNext.spokenText,
            spokenJudgment: generatedNext.spokenJudgment,
            topic: generatedNext.topic,
            difficulty: generatedNext.difficulty,
            timeLimit: generatedNext.timeLimit,
            expectedPoints: generatedNext.expectedPoints,
            answer: '',
            feedback: '',
            score: 0,
          });

          if (!interview.askedTopics) interview.askedTopics = [];
          if (!interview.askedQuestions) interview.askedQuestions = [];
          interview.askedTopics.push(generatedNext.topic);
          interview.askedQuestions.push(generatedNext.question);
          interview.currentRoundIndex = questionIndex + 1;

          nextQuestionItem = {
            index: questionIndex + 1,
            question: generatedNext.question,
            spokenText: generatedNext.spokenText,
            spokenJudgment: generatedNext.spokenJudgment,
            topic: generatedNext.topic,
            difficulty: generatedNext.difficulty,
            timeLimit: generatedNext.timeLimit,
          };
        } catch (genErr) {
          console.error('[InterviewController] Failed to generate next question:', genErr);
          // Return non-blocking error indication so frontend can prompt retry
          return res.status(500).json({
            success: false,
            message: 'Failed to generate next interview question. Please try again.',
            evaluation: {
              score: evaluation.finalScore,
              feedback: evaluation.feedback,
            },
          });
        }
      }
    }

    await interview.save();

    return res.status(200).json({
      success: true,
      questionIndex,
      evaluation: {
        score: evaluation.finalScore,
        confidence: evaluation.confidence,
        communication: evaluation.communication,
        correctness: evaluation.correctness,
        feedback: evaluation.feedback,
        spokenJudgment: evaluation.spokenJudgment,
      },
      nextQuestion: nextQuestionItem,
      hasMore: nextRoundNumber <= (interview.totalRounds || 5),
    });
  } catch (error: any) {
    console.error('[InterviewController] submitAnswer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit answer for evaluation',
      error: error.message,
    });
  }
};

// POST /api/mock-interview/next (Skip or fetch next question)
export const getNextQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { interviewId, currentQuestionIndex } = req.body;

    if (!interviewId || currentQuestionIndex === undefined) {
      return res.status(400).json({ success: false, message: 'interviewId and currentQuestionIndex are required' });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    // Mark current question as skipped if empty
    const currentQ = interview.questions[currentQuestionIndex];
    if (currentQ && !currentQ.answer) {
      currentQ.answer = '(Skipped)';
      currentQ.feedback = 'Question was skipped by candidate.';
      currentQ.score = 0;
      currentQ.spokenJudgment = 'No problem at all, let us keep moving.';
    }

    const skipJudgment = 'No problem at all, let us keep moving.';
    const nextRoundNumber = currentQuestionIndex + 2;

    if (nextRoundNumber > (interview.totalRounds || 5)) {
      await interview.save();
      return res.status(200).json({ success: true, nextQuestion: null, hasMore: false });
    }

    if (interview.questions.length > currentQuestionIndex + 1) {
      const existing = interview.questions[currentQuestionIndex + 1];
      await interview.save();
      return res.status(200).json({
        success: true,
        nextQuestion: {
          index: currentQuestionIndex + 1,
          question: existing.question,
          spokenText: existing.spokenText || existing.question,
          spokenJudgment: existing.spokenJudgment || '',
          topic: existing.topic,
          difficulty: existing.difficulty,
          timeLimit: existing.timeLimit,
        },
        hasMore: true,
      });
    }

    const planRound = interview.interviewPlan?.[currentQuestionIndex + 1] || {
      roundName: `Round ${nextRoundNumber}`,
      subtopics: ['Technical problem solving'],
    };

    const conversationHistory = interview.questions.map((q, idx) => ({
      turn: idx + 1,
      question: q.question,
      answer: q.answer || '',
      feedback: q.feedback || '',
      spokenJudgment: q.spokenJudgment || '',
    }));

    const generatedNext = await InterviewAiService.generateNextQuestion({
      interviewId: interview._id.toString(),
      role: interview.role,
      experience: interview.experience,
      mode: interview.mode,
      modeType: interview.modeType || 'ROLE_DRIVEN',
      interviewerGender: interview.interviewerGender,
      roundNumber: nextRoundNumber,
      totalRounds: interview.totalRounds || 5,
      roundName: planRound.roundName,
      currentRoundSubtopics: planRound.subtopics,
      techStack: interview.techStack || [],
      resumeStructured: interview.resumeStructured,
      askedTopics: interview.askedTopics || [],
      askedQuestions: interview.askedQuestions || [],
      conversationHistory,
      previousJudgment: skipJudgment,
    });

    interview.questions.push({
      question: generatedNext.question,
      spokenText: generatedNext.spokenText,
      spokenJudgment: generatedNext.spokenJudgment,
      topic: generatedNext.topic,
      difficulty: generatedNext.difficulty,
      timeLimit: generatedNext.timeLimit,
      expectedPoints: generatedNext.expectedPoints,
      answer: '',
      feedback: '',
      score: 0,
    });

    if (!interview.askedTopics) interview.askedTopics = [];
    if (!interview.askedQuestions) interview.askedQuestions = [];
    interview.askedTopics.push(generatedNext.topic);
    interview.askedQuestions.push(generatedNext.question);
    interview.currentRoundIndex = currentQuestionIndex + 1;

    await interview.save();

    return res.status(200).json({
      success: true,
      nextQuestion: {
        index: currentQuestionIndex + 1,
        question: generatedNext.question,
        spokenText: generatedNext.spokenText,
        spokenJudgment: generatedNext.spokenJudgment,
        topic: generatedNext.topic,
        difficulty: generatedNext.difficulty,
        timeLimit: generatedNext.timeLimit,
      },
      hasMore: true,
    });
  } catch (error: any) {
    console.error('[InterviewController] getNextQuestion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve next question',
      error: error.message,
    });
  }
};

// POST /api/mock-interview/finish
export const finishInterview = async (req: AuthRequest, res: Response) => {
  try {
    const { interviewId } = req.body;

    if (!interviewId) {
      return res.status(400).json({ success: false, message: 'interviewId is required' });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    const totalQuestions = interview.questions.length || 1;
    let sumScore = 0;
    let sumConfidence = 0;
    let sumCommunication = 0;
    let sumCorrectness = 0;

    interview.questions.forEach((q) => {
      sumScore += q.score || 0;
      sumConfidence += q.confidence || 0;
      sumCommunication += q.communication || 0;
      sumCorrectness += q.correctness || 0;
    });

    const finalScore = Number(((sumScore / (totalQuestions * 10)) * 100).toFixed(1));
    const avgConfidence = Number(((sumConfidence / totalQuestions) * 10).toFixed(1));
    const avgCommunication = Number(((sumCommunication / totalQuestions) * 10).toFixed(1));
    const avgCorrectness = Number(((sumCorrectness / totalQuestions) * 10).toFixed(1));

    // Generate comprehensive summary
    const reportData = await InterviewAiService.generateReport(interview.role, interview.questions);

    interview.finalScore = finalScore;
    interview.avgConfidence = avgConfidence;
    interview.avgCommunication = avgCommunication;
    interview.avgCorrectness = avgCorrectness;
    interview.summaryFeedback = reportData.summaryFeedback;
    interview.strengths = reportData.strengths;
    interview.improvements = reportData.improvements;
    interview.status = 'completed';

    await interview.save();

    return res.status(200).json({
      success: true,
      interviewId: interview._id,
      finalScore,
      avgConfidence,
      avgCommunication,
      avgCorrectness,
      summaryFeedback: interview.summaryFeedback,
      strengths: interview.strengths,
      improvements: interview.improvements,
      questions: interview.questions,
    });
  } catch (error: any) {
    console.error('[InterviewController] finishInterview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete interview session',
      error: error.message,
    });
  }
};

// GET /api/mock-interview/report/:id
export const getInterviewReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findById(id);

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview report not found' });
    }

    return res.status(200).json({
      success: true,
      data: interview,
    });
  } catch (error: any) {
    console.error('[InterviewController] getInterviewReport error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve interview report',
      error: error.message,
    });
  }
};

// GET /api/mock-interview/my-interviews
export const getMyInterviews = async (req: AuthRequest, res: Response) => {
  try {
    const query = req.userId ? { userId: req.userId } : {};
    const interviews = await Interview.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .select('role experience mode interviewerGender finalScore status createdAt questions modeType');

    return res.status(200).json({
      success: true,
      data: interviews,
    });
  } catch (error: any) {
    console.error('[InterviewController] getMyInterviews error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve interview history',
      error: error.message,
    });
  }
};

// POST /api/mock-interview/upload-resume
export const uploadResumeForInterview = async (req: AuthRequest, res: Response) => {
  let tempFilePath: string | undefined;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file uploaded',
      });
    }

    const { mimetype, originalname, path: filePath, buffer: memoryBuffer } = req.file;
    tempFilePath = filePath;

    let buffer = memoryBuffer;
    if (!buffer && filePath && fs.existsSync(filePath)) {
      buffer = fs.readFileSync(filePath);
    }

    if (!buffer) {
      return res.status(400).json({
        success: false,
        message: 'File buffer could not be loaded',
      });
    }

    const extractedText = await extractTextFromFile(buffer, mimetype, originalname);

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract text from the uploaded resume file.',
      });
    }

    const words = extractedText.trim().split(/\s+/).filter(Boolean);

    return res.status(200).json({
      success: true,
      filename: originalname,
      wordCount: words.length,
      text: extractedText.trim(),
      preview: extractedText.trim().substring(0, 320) + (extractedText.length > 320 ? '...' : ''),
    });
  } catch (error: any) {
    console.error('[InterviewController] uploadResumeForInterview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process resume file',
      error: error.message,
    });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {
        // ignore cleanup error
      }
    }
  }
};

// POST /api/mock-interview/tts
export const generateTts = async (req: AuthRequest, res: Response) => {
  try {
    const { text, gender, sessionId } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Text is required for TTS synthesis.',
      });
    }

    if (text.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'TEXT_TOO_LONG',
        message: 'Text must not exceed 500 characters.',
      });
    }

    if (!gender || (gender !== 'male' && gender !== 'female')) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_GENDER',
        message: "Gender is required and must be either 'male' or 'female'.",
      });
    }

    const ttsResult = await InterviewTtsService.synthesizeSpeech(text, gender);

    return res.status(200).json({
      success: true,
      audioBase64: ttsResult.audioBase64,
      mimeType: ttsResult.mimeType,
      cached: ttsResult.cached,
    });
  } catch (error: any) {
    if (error.message === 'TTS_RATE_LIMITED' || error.statusCode === 429) {
      return res.status(429).json({
        success: false,
        error: 'TTS_RATE_LIMITED',
        message: 'Gemini TTS rate limited. Please try again or use text mode.',
      });
    }

    console.error('[InterviewController] generateTts error:', error);
    return res.status(500).json({
      success: false,
      error: 'TTS_GENERATION_FAILED',
      message: error.message || 'Failed to generate voice audio',
    });
  }
};

// POST /api/mock-interview/transcribe
export const transcribeAnswerAudio = async (req: AuthRequest, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({
        success: false,
        error: 'NO_AUDIO',
        message: 'Audio data is required for transcription.',
      });
    }

    const transcript = await InterviewAiService.transcribeAudio(audioBase64, mimeType);
    return res.status(200).json({
      success: true,
      transcript,
    });
  } catch (error: any) {
    console.error('[InterviewController] transcribeAnswerAudio error:', error);
    return res.status(500).json({
      success: false,
      error: 'TRANSCRIPTION_FAILED',
      message: error.message || 'Failed to transcribe audio',
    });
  }
};
