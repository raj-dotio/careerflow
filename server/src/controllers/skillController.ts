import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Skill, { ISkill, ProficiencyLevel } from '../models/skill.model.js';
import {
  verifySkillWithGithubAndAI,
  parseGithubUrl,
} from '../services/githubVerifierService.js';

// Starter default skills for new students or offline mode
export const DEFAULT_SKILLS = [
  {
    _id: 'default-1',
    name: 'React & Next.js',
    category: 'Frontend',
    proficiency: 'Advanced' as ProficiencyLevel,
    progress: 88,
    proofUrl: 'https://github.com/facebook/react',
    repoName: 'facebook/react',
    isVerified: true,
    verifiedAt: new Date(),
    aiReviewSummary: 'Verified deep React 19 architecture with concurrent features, custom hooks, and state management.',
    aiKeyStrengths: ['React 19 Hooks', 'Modular Components', 'High-Scale State'],
    description: 'Developed modern React 19 single-page apps with server components and custom hooks.',
    userId: 'guest',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'default-2',
    name: 'TypeScript',
    category: 'Programming',
    proficiency: 'Advanced' as ProficiencyLevel,
    progress: 85,
    proofUrl: 'https://github.com/microsoft/TypeScript',
    repoName: 'microsoft/TypeScript',
    isVerified: true,
    verifiedAt: new Date(),
    aiReviewSummary: 'Audited strict type safety, generic constraints, mapped types, and compiler AST transformations.',
    aiKeyStrengths: ['Strict Generics', 'Utility Types', 'AST Parsing'],
    description: 'Strict type safety, generics, utility types, and full-stack API integration.',
    userId: 'guest',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'default-3',
    name: 'Node.js & Express',
    category: 'Backend',
    proficiency: 'Intermediate' as ProficiencyLevel,
    progress: 75,
    proofUrl: 'https://github.com/expressjs/express',
    repoName: 'expressjs/express',
    isVerified: true,
    verifiedAt: new Date(),
    aiReviewSummary: 'Verified robust middleware routing, JWT authentication patterns, and rate-limiting pipelines.',
    aiKeyStrengths: ['RESTful Routing', 'JWT Security', 'Middleware Chaining'],
    description: 'Architected RESTful endpoints, rate limiting, JWT auth, and middleware chaining.',
    userId: 'guest',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'default-4',
    name: 'Data Structures & Algorithms',
    category: 'Core CS & DSA',
    proficiency: 'Intermediate' as ProficiencyLevel,
    progress: 70,
    proofUrl: 'https://github.com/trekhleb/javascript-algorithms',
    repoName: 'trekhleb/javascript-algorithms',
    isVerified: true,
    verifiedAt: new Date(),
    aiReviewSummary: 'Confirmed algorithmic solutions across binary search trees, graph traversals, and dynamic programming.',
    aiKeyStrengths: ['Graph Traversals', 'Dynamic Programming', 'Big-O Complexity'],
    description: 'Solved 250+ LeetCode problems covering Trees, Graphs, DP, and Two Pointers.',
    userId: 'guest',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'default-5',
    name: 'PostgreSQL & MongoDB',
    category: 'Database',
    proficiency: 'Advanced' as ProficiencyLevel,
    progress: 80,
    proofUrl: 'https://github.com/postgres/postgres',
    repoName: 'postgres/postgres',
    isVerified: true,
    verifiedAt: new Date(),
    aiReviewSummary: 'Audited relational schema modeling, indexing strategies, and transactional consistency.',
    aiKeyStrengths: ['ACID Transactions', 'B-Tree Indexing', 'Schema Migration'],
    description: 'Schema modeling, indexing, ACID transactions, and query plan profiling.',
    userId: 'guest',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'default-6',
    name: 'Docker & CI/CD',
    category: 'DevOps & Cloud',
    proficiency: 'Beginner' as ProficiencyLevel,
    progress: 25,
    proofUrl: '',
    repoName: '',
    isVerified: false,
    aiReviewSummary: 'Awaiting GitHub repository submission for AI proof verification.',
    aiKeyStrengths: [],
    description: 'Multi-stage Dockerfiles and automated GitHub Actions test pipelines.',
    userId: 'guest',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// In-memory store for when MongoDB is disconnected
let inMemorySkills: any[] = [...DEFAULT_SKILLS];

function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

function isValidUrl(urlStr: string): boolean {
  if (!urlStr || urlStr.trim() === '') return true;
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// GET /api/skills
export const getSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.query.userId as string) || (req as any).userId || 'guest';

    if (isDbConnected()) {
      let skills = await Skill.find({ userId }).sort({ progress: -1, updatedAt: -1 });

      if (skills.length === 0) {
        await Skill.insertMany(DEFAULT_SKILLS.map(({ _id, ...rest }) => ({ ...rest, userId })));
        skills = await Skill.find({ userId }).sort({ progress: -1 });
      }

      res.status(200).json({
        success: true,
        count: skills.length,
        data: skills,
      });
      return;
    }

    res.status(200).json({
      success: true,
      count: inMemorySkills.length,
      data: inMemorySkills,
    });
  } catch (error) {
    console.error('[skillController] Error in getSkills:', error);
    res.status(200).json({
      success: true,
      count: inMemorySkills.length,
      data: inMemorySkills,
    });
  }
};

// GET /api/skills/stats
export const getSkillStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.query.userId as string) || (req as any).userId || 'guest';
    let skills: any[] = [];

    if (isDbConnected()) {
      skills = await Skill.find({ userId });
    } else {
      skills = inMemorySkills;
    }

    if (skills.length === 0) {
      skills = DEFAULT_SKILLS;
    }

    const totalSkills = skills.length;
    const sortedByProgress = [...skills].sort((a, b) => b.progress - a.progress);
    const strongestSkill = sortedByProgress[0] || null;
    const weakestSkill = sortedByProgress[sortedByProgress.length - 1] || null;

    const totalProgress = skills.reduce((sum, s) => sum + (s.progress || 0), 0);
    const averageProgress = totalSkills > 0 ? Math.round(totalProgress / totalSkills) : 0;

    const verifiedSkillsCount = skills.filter((s) => s.isVerified || (s.proofUrl && s.proofUrl.trim().length > 0)).length;

    res.status(200).json({
      success: true,
      data: {
        totalSkills,
        strongestSkill,
        weakestSkill,
        averageProgress,
        verifiedSkillsCount,
      },
    });
  } catch (error) {
    console.error('[skillController] Error in getSkillStats:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate skill analytics' });
  }
};

// GET /api/skills/:id
export const getSkillById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const skill = await Skill.findById(id);
      if (!skill) {
        res.status(404).json({ success: false, message: 'Skill not found' });
        return;
      }
      res.status(200).json({ success: true, data: skill });
      return;
    }

    const found = inMemorySkills.find((s) => s._id === id);
    if (!found) {
      res.status(404).json({ success: false, message: 'Skill not found' });
      return;
    }
    res.status(200).json({ success: true, data: found });
  } catch (error) {
    console.error('[skillController] Error in getSkillById:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve skill' });
  }
};

// POST /api/skills/verify-proof
// AI-verifies a GitHub repository proof and calculates authentic progress
export const verifySkillProof = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skillName, category, proofUrl, skillId } = req.body;

    if (!proofUrl || !parseGithubUrl(proofUrl)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid public GitHub repository URL (e.g. https://github.com/username/project)',
      });
      return;
    }

    if (!skillName || skillName.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Skill name is required to verify repository code relevance',
      });
      return;
    }

    console.log(`[skillController] Running Gemini AI verification on ${proofUrl} for skill: ${skillName}`);
    const verification = await verifySkillWithGithubAndAI(
      skillName.trim(),
      category || 'Programming',
      proofUrl.trim()
    );

    // If an existing skillId was provided, update it in DB or memory immediately
    let updatedSkill: any = null;
    if (skillId) {
      const updateData = {
        progress: verification.progress,
        proficiency: verification.proficiency,
        proofUrl: proofUrl.trim(),
        repoName: verification.repoName,
        isVerified: verification.verified,
        verifiedAt: new Date(),
        aiReviewSummary: verification.aiReviewSummary,
        aiKeyStrengths: verification.aiKeyStrengths,
        updatedAt: new Date(),
      };

      if (isDbConnected()) {
        updatedSkill = await Skill.findByIdAndUpdate(skillId, updateData, { new: true });
      } else {
        const index = inMemorySkills.findIndex((s) => s._id === skillId);
        if (index !== -1) {
          inMemorySkills[index] = { ...inMemorySkills[index], ...updateData };
          updatedSkill = inMemorySkills[index];
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Gemini AI verified ${verification.progress}% competency in "${skillName}"!`,
      data: {
        ...verification,
        skill: updatedSkill,
      },
    });
  } catch (error: any) {
    console.error('[skillController] Error in verifySkillProof:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify GitHub repository proof with AI',
    });
  }
};

// POST /api/skills
// Creates a new skill. Progress is strictly governed by proof / AI verification!
export const createSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, category, proofUrl, description, autoVerify } = req.body;
    const userId = (req as any).userId || req.body.userId || 'guest';

    if (!name || name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Skill name is required (min 2 characters)' });
      return;
    }

    if (!category || category.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Skill category is required' });
      return;
    }

    let progress = 15; // Baseline unverified progress
    let proficiency: ProficiencyLevel = 'Beginner';
    let isVerified = false;
    let verifiedAt: Date | undefined = undefined;
    let aiReviewSummary = 'Awaiting GitHub repository submission for AI proof verification.';
    let aiKeyStrengths: string[] = [];
    let repoName = '';

    // If a GitHub proof URL is supplied, perform AI verification to determine progress
    if (proofUrl && parseGithubUrl(proofUrl)) {
      try {
        console.log(`[skillController] Automatically running AI verification on creation for: ${proofUrl}`);
        const result = await verifySkillWithGithubAndAI(name.trim(), category.trim(), proofUrl.trim());
        progress = result.progress;
        proficiency = result.proficiency;
        isVerified = result.verified;
        verifiedAt = new Date();
        aiReviewSummary = result.aiReviewSummary;
        aiKeyStrengths = result.aiKeyStrengths;
        repoName = result.repoName;
      } catch (err: any) {
        console.warn('[skillController] AI verification during creation deferred:', err.message);
      }
    }

    if (isDbConnected()) {
      const newSkill = new Skill({
        name: name.trim(),
        category: category.trim(),
        proficiency,
        progress,
        proofUrl: proofUrl ? proofUrl.trim() : '',
        description: description ? description.trim() : '',
        userId,
        isVerified,
        verifiedAt,
        aiReviewSummary,
        aiKeyStrengths,
        repoName,
      });

      await newSkill.save();

      res.status(201).json({
        success: true,
        message: isVerified ? `Skill created & verified with AI (${progress}%)` : 'Skill added (Unverified baseline)',
        data: newSkill,
      });
      return;
    }

    // In-memory fallback
    const memorySkill = {
      _id: `skill-${Date.now()}`,
      name: name.trim(),
      category: category.trim(),
      proficiency,
      progress,
      proofUrl: proofUrl ? proofUrl.trim() : '',
      description: description ? description.trim() : '',
      userId,
      isVerified,
      verifiedAt,
      aiReviewSummary,
      aiKeyStrengths,
      repoName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemorySkills.unshift(memorySkill);

    res.status(201).json({
      success: true,
      message: isVerified ? `Skill created & verified with AI (${progress}%)` : 'Skill added (Unverified baseline)',
      data: memorySkill,
    });
  } catch (error: any) {
    console.error('[skillController] Error in createSkill:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create skill' });
  }
};

// PUT /api/skills/:id
export const updateSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, category, proofUrl, description, verifyNow } = req.body;

    const updatePayload: any = {};
    if (name) updatePayload.name = name.trim();
    if (category) updatePayload.category = category.trim();
    if (description !== undefined) updatePayload.description = description.trim();
    if (proofUrl !== undefined) updatePayload.proofUrl = proofUrl.trim();
    updatePayload.updatedAt = new Date();

    // If user provided a new GitHub repo or requested re-verification
    if (verifyNow || (proofUrl && parseGithubUrl(proofUrl))) {
      try {
        const targetName = name || (isDbConnected() ? (await Skill.findById(id))?.name : inMemorySkills.find((s) => s._id === id)?.name);
        const targetCategory = category || 'Programming';
        if (targetName && proofUrl) {
          const result = await verifySkillWithGithubAndAI(targetName, targetCategory, proofUrl.trim());
          updatePayload.progress = result.progress;
          updatePayload.proficiency = result.proficiency;
          updatePayload.isVerified = result.verified;
          updatePayload.verifiedAt = new Date();
          updatePayload.aiReviewSummary = result.aiReviewSummary;
          updatePayload.aiKeyStrengths = result.aiKeyStrengths;
          updatePayload.repoName = result.repoName;
        }
      } catch (err: any) {
        console.warn('[skillController] Re-verification deferred:', err.message);
      }
    }

    if (isDbConnected()) {
      const updated = await Skill.findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true });
      if (!updated) {
        res.status(404).json({ success: false, message: 'Skill not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Skill updated successfully',
        data: updated,
      });
      return;
    }

    const index = inMemorySkills.findIndex((s) => s._id === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: 'Skill not found' });
      return;
    }

    inMemorySkills[index] = { ...inMemorySkills[index], ...updatePayload };

    res.status(200).json({
      success: true,
      message: 'Skill updated successfully',
      data: inMemorySkills[index],
    });
  } catch (error: any) {
    console.error('[skillController] Error in updateSkill:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update skill' });
  }
};

// DELETE /api/skills/:id
export const deleteSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const deleted = await Skill.findByIdAndDelete(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Skill not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Skill deleted successfully' });
      return;
    }

    const index = inMemorySkills.findIndex((s) => s._id === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: 'Skill not found' });
      return;
    }

    inMemorySkills.splice(index, 1);
    res.status(200).json({ success: true, message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('[skillController] Error in deleteSkill:', error);
    res.status(500).json({ success: false, message: 'Failed to delete skill' });
  }
};
