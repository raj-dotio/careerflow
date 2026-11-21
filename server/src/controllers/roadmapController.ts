import { Request, Response } from 'express';
import Roadmap, { IRoadmap, IRoadmapTopic } from '../models/roadmap.model.js';
import Recommendation from '../models/recommendation.model.js';
import User from '../models/user.model.js';
import { AuthRequest } from '../middlewares/isAuth.js';
import { generateRoadmap, generateRecommendations } from '../services/roadmapAiService.js';

// Resolve user identity from Auth, query, header or guest fallback
function resolveUserId(req: AuthRequest): string {
  if (req.userId) return String(req.userId);
  const headerId = req.headers['x-guest-user-id'] as string;
  if (headerId && headerId.trim()) return headerId.trim();
  const queryId = req.query.userId as string;
  if (queryId && queryId.trim()) return queryId.trim();
  return 'guest-student';
}

function computeStats(roadmap: IRoadmap, userStreak: number = 0) {
  const topics = roadmap.topics || [];
  const totalTopics = topics.length;
  const completedTopics = topics.filter((t) => t.status === 'completed').length;
  const inProgressTopics = topics.filter((t) => t.status === 'in_progress').length;
  const pendingTopics = totalTopics - completedTopics - inProgressTopics;

  const completionPercent = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

  const averageConfidence =
    totalTopics === 0
      ? 50
      : Math.round(topics.reduce((acc, t) => acc + (t.confidenceScore || 50), 0) / totalTopics);

  const totalHours = topics.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
  const completedHours = topics
    .filter((t) => t.status === 'completed')
    .reduce((acc, t) => acc + (t.estimatedHours || 0), 0);

  // Determine current active week (first incomplete week)
  const firstIncomplete = topics.find((t) => t.status !== 'completed');
  const currentWeek = firstIncomplete ? firstIncomplete.week : roadmap.totalWeeks;

  return {
    totalTopics,
    completedTopics,
    inProgressTopics,
    pendingTopics: Math.max(0, pendingTopics),
    completionPercent,
    averageConfidence,
    totalHours,
    completedHours,
    currentWeek,
    streakCount: userStreak,
  };
}

export const getActiveRoadmap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = resolveUserId(req);

    const roadmap = await Roadmap.findOne({
      userId,
      status: 'active',
    }).sort({ updatedAt: -1 });

    if (!roadmap) {
      res.status(200).json({
        success: true,
        data: null,
        message: 'No active roadmap found for user',
      });
      return;
    }

    let userStreak = 0;
    if (userId !== 'guest-student' && userId.length === 24) {
      const user = await User.findById(userId);
      if (user) userStreak = user.streakCount || 0;
    }

    const stats = computeStats(roadmap, userStreak);

    res.status(200).json({
      success: true,
      data: {
        roadmap,
        stats,
      },
    });
  } catch (error) {
    console.error('[RoadmapController] getActiveRoadmap error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch roadmap: ${error}`,
    });
  }
};

export const createOrGenerateRoadmap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = resolveUserId(req);
    const {
      careerGoal,
      academicYear = '3rd Year',
      experienceLevel = 'beginner',
      interests = [],
      weeklyHours = 8,
      targetWeeks = 8,
      forceRegenerate = false,
      geminiApiKey,
    } = req.body;

    if (!careerGoal || !careerGoal.trim()) {
      res.status(400).json({ success: false, message: 'Career goal is required' });
      return;
    }

    // Check existing active roadmap
    const existing = await Roadmap.findOne({ userId, status: 'active' }).sort({ updatedAt: -1 });

    if (existing && !forceRegenerate) {
      const stats = computeStats(existing);
      res.status(200).json({
        success: true,
        data: {
          roadmap: existing,
          stats,
        },
        message: 'Existing active roadmap returned',
      });
      return;
    }

    // Archive previous roadmaps if regenerating
    if (existing && forceRegenerate) {
      existing.status = 'archived';
      await existing.save();
    }

    // Generate new curriculum
    const generated = await generateRoadmap({
      careerGoal,
      academicYear,
      experienceLevel,
      interests,
      weeklyHours: Number(weeklyHours) || 8,
      targetWeeks: Number(targetWeeks) || 8,
      geminiApiKey,
    });

    const newRoadmap = await Roadmap.create({
      userId,
      title: generated.title,
      careerGoal,
      description: generated.description,
      academicYear,
      experienceLevel,
      interests,
      weeklyHours: Number(weeklyHours) || 8,
      status: 'active',
      totalWeeks: generated.totalWeeks,
      currentWeek: 1,
      topics: generated.topics,
    });

    // Update user profile if user is registered
    let userStreak = 0;
    if (userId !== 'guest-student' && userId.length === 24) {
      const user = await User.findById(userId);
      if (user) {
        user.academicYear = academicYear;
        user.experienceLevel = experienceLevel;
        user.interests = interests;
        user.weeklyTargetHours = Number(weeklyHours) || 8;
        user.roleTitle = careerGoal;
        await user.save();
        userStreak = user.streakCount || 0;
      }
    }

    // Pre-generate initial recommendations
    const recommendations = await generateRecommendations(
      { title: newRoadmap.title, careerGoal },
      newRoadmap.topics
    );

    await Recommendation.create({
      userId,
      roadmapId: newRoadmap._id,
      ...recommendations,
    });

    const stats = computeStats(newRoadmap, userStreak);

    res.status(201).json({
      success: true,
      data: {
        roadmap: newRoadmap,
        stats,
      },
      message: 'Personalized roadmap created successfully',
    });
  } catch (error) {
    console.error('[RoadmapController] createOrGenerateRoadmap error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to create roadmap: ${error}`,
    });
  }
};

export const updateTopicProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = resolveUserId(req);
    const { topicId } = req.params;
    const {
      status,
      confidenceScore,
      notes,
      completionPercent,
    } = req.body;

    const roadmap = await Roadmap.findOne({
      userId,
      status: 'active',
      'topics._id': topicId,
    });

    if (!roadmap) {
      res.status(404).json({ success: false, message: 'Roadmap or topic not found' });
      return;
    }

    const topic = (roadmap.topics as any).id
      ? (roadmap.topics as any).id(topicId)
      : roadmap.topics.find((t: IRoadmapTopic) => String(t._id) === String(topicId));
    if (!topic) {
      res.status(404).json({ success: false, message: 'Topic not found in roadmap' });
      return;
    }

    if (status) {
      topic.status = status;
      if (status === 'completed') {
        topic.completionPercent = 100;
        topic.completedAt = new Date();
      } else if (status === 'in_progress') {
        topic.completionPercent = typeof completionPercent === 'number' ? completionPercent : 50;
      } else if (status === 'pending') {
        topic.completionPercent = 0;
        topic.completedAt = undefined;
      }
    }

    if (typeof confidenceScore === 'number') {
      topic.confidenceScore = Math.max(0, Math.min(100, confidenceScore));
    }

    if (typeof notes === 'string') {
      topic.notes = notes;
    }

    // Recompute current active week
    const firstIncomplete = roadmap.topics.find((t) => t.status !== 'completed');
    roadmap.currentWeek = firstIncomplete ? firstIncomplete.week : roadmap.totalWeeks;

    await roadmap.save();

    // Handle user streak update on topic completion
    let userStreak = 0;
    if (status === 'completed' && userId !== 'guest-student' && userId.length === 24) {
      const user = await User.findById(userId);
      if (user) {
        const now = new Date();
        const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const prev = user.lastActiveOn ? new Date(user.lastActiveOn) : null;

        if (!prev) {
          user.streakCount = 1;
        } else {
          const prevUtc = Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth(), prev.getUTCDate());
          const diffDays = Math.round((todayUtc - prevUtc) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            user.streakCount = (user.streakCount || 0) + 1;
          } else if (diffDays > 1) {
            user.streakCount = 1;
          }
        }
        user.lastActiveOn = now;
        await user.save();
        userStreak = user.streakCount || 0;
      }
    }

    const stats = computeStats(roadmap, userStreak);

    res.status(200).json({
      success: true,
      data: {
        roadmap,
        stats,
      },
      message: 'Topic progress updated successfully',
    });
  } catch (error) {
    console.error('[RoadmapController] updateTopicProgress error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to update topic progress: ${error}`,
    });
  }
};

export const getRoadmapRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = resolveUserId(req);

    const roadmap = await Roadmap.findOne({ userId, status: 'active' }).sort({ updatedAt: -1 });
    if (!roadmap) {
      res.status(404).json({ success: false, message: 'No active roadmap found' });
      return;
    }

    let recommendation = await Recommendation.findOne({
      userId,
      roadmapId: roadmap._id,
    }).sort({ createdAt: -1 });

    if (!recommendation) {
      const generated = await generateRecommendations(
        { title: roadmap.title, careerGoal: roadmap.careerGoal },
        roadmap.topics
      );

      recommendation = await Recommendation.create({
        userId,
        roadmapId: roadmap._id,
        ...generated,
      });
    }

    res.status(200).json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    console.error('[RoadmapController] getRoadmapRecommendations error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch recommendations: ${error}`,
    });
  }
};

export const refreshRoadmapRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = resolveUserId(req);

    const roadmap = await Roadmap.findOne({ userId, status: 'active' }).sort({ updatedAt: -1 });
    if (!roadmap) {
      res.status(404).json({ success: false, message: 'No active roadmap found' });
      return;
    }

    const fresh = await generateRecommendations(
      { title: roadmap.title, careerGoal: roadmap.careerGoal },
      roadmap.topics
    );

    const recommendation = await Recommendation.create({
      userId,
      roadmapId: roadmap._id,
      ...fresh,
    });

    res.status(200).json({
      success: true,
      data: recommendation,
      message: 'Recommendations refreshed based on latest progress',
    });
  } catch (error) {
    console.error('[RoadmapController] refreshRoadmapRecommendations error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to refresh recommendations: ${error}`,
    });
  }
};

export const resetRoadmap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = resolveUserId(req);
    await Roadmap.updateMany({ userId, status: 'active' }, { status: 'archived' });

    res.status(200).json({
      success: true,
      message: 'Active roadmap archived. You can now configure a new roadmap.',
    });
  } catch (error) {
    console.error('[RoadmapController] resetRoadmap error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to reset roadmap: ${error}`,
    });
  }
};
