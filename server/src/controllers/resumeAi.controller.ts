import { Request, Response } from 'express';
import fs from 'fs';
import { extractTextFromFile } from './atsController.js';
import { chatWithResumeGuide, parseResumeDocument } from '../services/resumeAi.service.js';

// POST /api/resume-ai/chat
export const handleResumeAiChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      sessionId,
      userMessage,
      selectedOption,
      currentSection,
      resume,
      history,
      targetJd,
      isInitial,
    } = req.body;

    if (!resume) {
      res.status(400).json({
        success: false,
        message: 'Current resume state is required for AI guidance.',
      });
      return;
    }

    const aiResponse = await chatWithResumeGuide({
      sessionId,
      userMessage,
      selectedOption,
      currentSection,
      resume,
      history,
      targetJd,
      isInitial: Boolean(isInitial),
    });

    res.status(200).json({
      success: true,
      data: aiResponse,
    });
  } catch (error: any) {
    console.error('Error in handleResumeAiChat:', error);

    const errorMessage = error?.message || 'Failed to process AI chat message.';
    const isRateLimited =
      errorMessage.includes('429') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('RESOURCE_EXHAUSTED');

    if (isRateLimited) {
      res.status(429).json({
        success: false,
        error: 'RATE_LIMITED',
        message: 'AI Coach rate limit reached. Please wait a few seconds and try again.',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

// POST /api/resume-ai/parse
export const handleResumeAiParse = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No resume file uploaded' });
      return;
    }

    const { mimetype, originalname, path: filePath, buffer: memoryBuffer } = req.file;

    let buffer = memoryBuffer;
    if (!buffer && filePath && fs.existsSync(filePath)) {
      buffer = fs.readFileSync(filePath);
      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore unlink error
      }
    }

    if (!buffer) {
      res.status(400).json({ success: false, message: 'Could not read uploaded resume file' });
      return;
    }

    const extractedText = await extractTextFromFile(buffer, mimetype, originalname);

    if (!extractedText || extractedText.trim().length < 30) {
      res.status(400).json({
        success: false,
        message: 'Could not extract readable text from document. Ensure it contains selectable text.',
      });
      return;
    }

    const parsedResult = await parseResumeDocument(extractedText);

    res.status(200).json({
      success: true,
      fileName: originalname,
      data: parsedResult,
    });
  } catch (error: any) {
    console.error('Error in handleResumeAiParse:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to parse resume document with AI.',
    });
  }
};
