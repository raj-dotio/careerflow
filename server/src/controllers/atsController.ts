import { Request, Response } from 'express';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import {
  analyzeResumeWithGemini,
  type AtsEvaluationResult,
  type KeywordAnalysis,
  type BulletRedline,
  type AtsChecklistItem,
} from '../services/geminiService.js';

export type { AtsEvaluationResult, KeywordAnalysis, BulletRedline, AtsChecklistItem };

// Core Technical Keywords List for Algorithmic Fallback
const TECH_KEYWORDS = [
  'react', 'next.js', 'vue', 'angular', 'typescript', 'javascript', 'html', 'css', 'tailwind',
  'node.js', 'express', 'nestjs', 'go', 'golang', 'python', 'django', 'fastapi', 'c++', 'java', 'spring',
  'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'sql',
  'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'k8s', 'ci/cd', 'github actions', 'terraform',
  'kafka', 'rabbitmq', 'microservices', 'graphql', 'rest api', 'grpc', 'websockets',
  'data structures', 'algorithms', 'system design', 'distributed systems', 'concurrency',
  'git', 'linux', 'unit testing', 'jest', 'vitest', 'cypress', 'prometheus', 'grafana'
];

// Strong Impact Action Verbs
const ACTION_VERBS = [
  'engineered', 'architected', 'developed', 'spearheaded', 'optimized', 'reduced', 'increased',
  'scaled', 'deployed', 'implemented', 'designed', 'built', 'automated', 'profiled', 'shipped',
  'refactored', 'orchestrated', 'authored', 'mentored', 'constructed', 'accelerated', 'slashed'
];

// Weak / Passive Phrases
const WEAK_PHRASES = [
  'worked on', 'helped with', 'responsible for', 'assisted in', 'handled tasks', 'involved in',
  'participated in', 'did development', 'tried to', 'made changes'
];

// Extract text from buffer based on mimetype
export async function extractTextFromFile(buffer: Buffer, mimetype: string, originalname: string): Promise<string> {
  const ext = path.extname(originalname).toLowerCase();

  // DOCX
  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === '.docx') {
    const docResult = await mammoth.extractRawText({ buffer });
    return docResult.value;
  }

  // PDF
  if (mimetype === 'application/pdf' || ext === '.pdf') {
    try {
      const pdfModule = await import('pdf-parse');
      const PDFParseClass = (pdfModule as any).PDFParse || (pdfModule as any).default?.PDFParse;
      
      if (PDFParseClass) {
        const parser = new PDFParseClass({ data: buffer });
        await parser.load();
        const text = await parser.getText();
        if (text && text.trim().length > 20) {
          return text;
        }
      }
    } catch (err) {
      console.warn('PDFParse primary extraction failed, falling back to heuristic decoding:', err);
    }

    // Fallback text decoding for PDF streams
    const raw = buffer.toString('utf-8');
    const cleaned = raw.replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/\s{2,}/g, ' ');
    return cleaned;
  }

  // Plain Text / Markdown / Code
  return buffer.toString('utf-8');
}

// Evaluate raw text against ATS standards & Job Description using local deterministic heuristics
export function evaluateResumeTextLocally(resumeText: string, jobDescription?: string): AtsEvaluationResult {
  const lowerText = resumeText.toLowerCase();
  const words = resumeText.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Split into lines/bullets
  const lines = resumeText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 15);

  // 1. Keyword Analysis
  let targetKeywords = TECH_KEYWORDS;
  if (jobDescription && jobDescription.trim().length > 20) {
    const jdLower = jobDescription.toLowerCase();
    const jdKeywords = TECH_KEYWORDS.filter(k => jdLower.includes(k));
    if (jdKeywords.length >= 5) {
      targetKeywords = jdKeywords;
    }
  }

  const matchedKeywords = targetKeywords.filter(k => lowerText.includes(k));
  const missingKeywords = targetKeywords.filter(k => !lowerText.includes(k)).slice(0, 10);
  const keywordMatchRate = targetKeywords.length > 0 ? Math.round((matchedKeywords.length / targetKeywords.length) * 100) : 75;

  // 2. Metrics & STAR Impact Detection
  const metricRegex = /\b(\d+(?:\.\d+)?%|\$\d+(?:,\d+)*(?:\.\d+)?(?:k|m|b)?|\b\d+k?\+?\s*(?:users|requests|qps|rps|ms|seconds|minutes|hours|stars|queries|downloads|teams|engineers|students))\b/gi;
  let metricBulletCount = 0;
  let actionVerbCount = 0;

  const bulletRedlines: BulletRedline[] = [];

  for (const line of lines) {
    const lineLower = line.toLowerCase();
    const hasMetric = metricRegex.test(line);
    if (hasMetric) metricBulletCount++;

    const hasActionVerb = ACTION_VERBS.some(v => lineLower.startsWith(v) || lineLower.includes(` ${v} `));
    if (hasActionVerb) actionVerbCount++;

    // Check for weak phrases to redline
    const foundWeak = WEAK_PHRASES.find(w => lineLower.includes(w));
    if (foundWeak && bulletRedlines.length < 3) {
      bulletRedlines.push({
        original: line,
        suggested: line
          .replace(new RegExp(foundWeak, 'i'), 'Engineered and scaled')
          .replace(/\b(fast|faster|good|better)\b/i, 'improving throughput by 35%'),
        reason: `Replace passive phrase "${foundWeak}" with high-impact engineering verbs and quantifiable outcome metrics.`,
      });
    }
  }

  // If no weak lines found, provide a representative sample redline
  if (bulletRedlines.length === 0 && lines.length > 0) {
    const sampleLine = lines.find(l => !metricRegex.test(l)) || lines[0];
    bulletRedlines.push({
      original: sampleLine,
      suggested: `${sampleLine.replace(/\.$/, '')}, driving 40% measurable performance improvement across production environments.`,
      reason: 'Enhance achievement by attaching concrete business impact or scalability statistics.',
    });
  }

  const bulletCount = lines.length || 1;
  const impactPercentage = Math.min(100, Math.round((metricBulletCount / bulletCount) * 100) + 20);

  // 3. Structure & Format Checks
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(resumeText);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText);
  const hasGithubOrLinkedIn = /(github\.com|linkedin\.com)/i.test(resumeText);
  const hasEducation = /(education|bachelor|master|university|college|b\.tech|b\.s\.|gpa)/i.test(resumeText);
  const hasExperience = /(experience|employment|work history|intern|internship|developer|engineer)/i.test(resumeText);
  const hasSkills = /(skills|technologies|technical stack|competencies)/i.test(resumeText);
  const hasProjects = /(projects|personal projects|portfolio|hackathon)/i.test(resumeText);

  let structureScore = 40;
  if (hasEmail) structureScore += 10;
  if (hasPhone) structureScore += 10;
  if (hasGithubOrLinkedIn) structureScore += 10;
  if (hasEducation) structureScore += 10;
  if (hasExperience) structureScore += 10;
  if (hasSkills) structureScore += 5;
  if (hasProjects) structureScore += 5;

  // 4. Readability & Length Score
  let readabilityScore = 85;
  if (wordCount < 250) readabilityScore -= 30;
  else if (wordCount < 400) readabilityScore -= 15;
  else if (wordCount > 1200) readabilityScore -= 20;

  // Composite Weighted Score (40% Keywords, 30% Impact, 15% Structure, 15% Readability)
  const overallScore = Math.min(
    100,
    Math.max(
      20,
      Math.round(
        keywordMatchRate * 0.4 +
        impactPercentage * 0.3 +
        structureScore * 0.15 +
        readabilityScore * 0.15
      )
    )
  );

  let rating: AtsEvaluationResult['rating'] = 'Competitive';
  let summaryFeedback = '';

  if (overallScore >= 88) {
    rating = 'Exceptional';
    summaryFeedback = 'Outstanding resume alignment. High technical keyword density, strong quantifiable XYZ impact formulas, and spotless ATS structure.';
  } else if (overallScore >= 75) {
    rating = 'Competitive';
    summaryFeedback = 'Strong candidate profile. Passes standard corporate ATS filters. Minor optimizations in quantifiable impact will elevate this to top 5% tier.';
  } else if (overallScore >= 60) {
    rating = 'Needs Improvement';
    summaryFeedback = 'Moderate ATS clearance probability. Missing several core job keywords and lacks metric-driven achievement bullets.';
  } else {
    rating = 'Critical Issues';
    summaryFeedback = 'Significant risk of automated ATS rejection. Critical sections or contact details are missing, with insufficient keyword density.';
  }

  const checklist: AtsChecklistItem[] = [
    {
      category: 'Contact Info',
      item: 'Direct Professional Email Address',
      passed: hasEmail,
      recommendation: hasEmail ? undefined : 'Add a clear email address at the very top of your resume.',
    },
    {
      category: 'Contact Info',
      item: 'Phone Number & Location',
      passed: hasPhone,
      recommendation: hasPhone ? undefined : 'Include phone number and location (City, Country).',
    },
    {
      category: 'Online Presence',
      item: 'GitHub or LinkedIn Profile Links',
      passed: hasGithubOrLinkedIn,
      recommendation: hasGithubOrLinkedIn ? undefined : 'Link your GitHub repositories and LinkedIn profile.',
    },
    {
      category: 'Core Sections',
      item: 'Work / Internship Experience',
      passed: hasExperience,
      recommendation: hasExperience ? undefined : 'Include a dedicated Experience or Internships section.',
    },
    {
      category: 'Core Sections',
      item: 'Technical Projects Portfolio',
      passed: hasProjects,
      recommendation: hasProjects ? undefined : 'Add 2-3 technical engineering projects with GitHub links.',
    },
    {
      category: 'Core Sections',
      item: 'Categorized Skills Section',
      passed: hasSkills,
      recommendation: hasSkills ? undefined : 'Group technical skills into Languages, Frameworks, and Cloud/Databases.',
    },
    {
      category: 'Bullet Quality',
      item: 'Quantified Results (Numbers & %)',
      passed: metricBulletCount >= 3,
      recommendation: metricBulletCount >= 3 ? undefined : 'Use numbers (e.g. "reduced latency by 40%", "served 10k users").',
    },
    {
      category: 'Formatting',
      item: 'Optimal Single-Page Length (400 - 900 words)',
      passed: wordCount >= 350 && wordCount <= 1000,
      recommendation: wordCount < 350 ? 'Resume is too brief. Elaborate on project architecture.' : wordCount > 1000 ? 'Trim verbose descriptions to stay within a single high-signal page.' : undefined,
    },
  ];

  return {
    overallScore,
    rating,
    summaryFeedback,
    scores: {
      keywordMatch: keywordMatchRate,
      quantifiableImpact: impactPercentage,
      structureAndFormat: structureScore,
      readabilityAndLength: readabilityScore,
    },
    metrics: {
      wordCount,
      bulletCount,
      metricBulletCount,
      actionVerbCount,
      readingTimeMinutes: +(wordCount / 200).toFixed(1),
    },
    keywords: {
      matchedKeywords,
      missingKeywords,
      matchRate: keywordMatchRate,
    },
    bulletRedlines,
    checklist,
    aiPowered: false,
  };
}

/**
 * Main evaluation entry point: Uses Gemini AI from server env when available,
 * with automatic resilient fallback to the algorithmic engine.
 */
export async function evaluateResumeText(
  resumeText: string,
  jobDescription?: string
): Promise<AtsEvaluationResult> {
  try {
    const aiResult = await analyzeResumeWithGemini(resumeText, jobDescription);
    if (aiResult) {
      return aiResult;
    }
  } catch (err) {
    console.warn('[atsController] Gemini evaluation failed, using fallback:', err);
  }

  return evaluateResumeTextLocally(resumeText, jobDescription);
}

// POST /api/ats/analyze
export const analyzeResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resumeText, jobDescription, resumeData } = req.body;

    let fullText = resumeText || '';

    // If structured resumeData was provided from the builder, format into text
    if (!fullText && resumeData) {
      const b = resumeData.basics || {};
      const exp = (resumeData.sections?.experience || []).map((e: any) => `${e.position} at ${e.company}. ${e.summary}`).join('\n');
      const edu = (resumeData.sections?.education || []).map((e: any) => `${e.degree} at ${e.institution}. ${e.score || ''}`).join('\n');
      const sk = (resumeData.sections?.skills || []).map((s: any) => `${s.name}: ${(s.keywords || []).join(', ')}`).join('\n');
      const pr = (resumeData.sections?.projects || []).map((p: any) => `${p.name}: ${p.description}. Tech: ${(p.keywords || []).join(', ')}`).join('\n');

      fullText = `${b.name || ''} ${b.headline || ''}\n${b.email || ''} ${b.phone || ''} ${b.location || ''} ${b.url || ''}\nSummary: ${resumeData.summary || ''}\nExperience:\n${exp}\nEducation:\n${edu}\nSkills:\n${sk}\nProjects:\n${pr}`;
    }

    if (!fullText || fullText.trim().length < 30) {
      res.status(400).json({
        success: false,
        message: 'Insufficient resume content provided for ATS analysis. Please paste or upload your resume text.',
      });
      return;
    }

    const analysis = await evaluateResumeText(fullText, jobDescription);

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error in analyzeResume:', error);
    res.status(500).json({ success: false, message: 'Failed to analyze resume' });
  }
};

// POST /api/ats/upload
export const uploadAndAnalyze = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No resume file uploaded' });
      return;
    }

    const { mimetype, originalname, path: filePath, buffer: memoryBuffer } = req.file;
    const jobDescription = req.body.jobDescription || '';

    let buffer = memoryBuffer;
    if (!buffer && filePath && fs.existsSync(filePath)) {
      buffer = fs.readFileSync(filePath);
      // Clean up uploaded temp file
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
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
        message: 'Could not extract readable text from this document. Ensure it is not an image-only scan.',
      });
      return;
    }

    const analysis = await evaluateResumeText(extractedText, jobDescription);

    res.status(200).json({
      success: true,
      fileName: originalname,
      extractedTextLength: extractedText.length,
      data: analysis,
    });
  } catch (error) {
    console.error('Error in uploadAndAnalyze:', error);
    res.status(500).json({ success: false, message: 'Failed to upload and analyze document' });
  }
};
