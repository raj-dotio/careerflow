import type { IRoadmap, IRoadmapStats, IRecommendation } from '../types/roadmap';

function getGuestId(): string {
  let id = localStorage.getItem('careerflow_guest_id');
  if (!id) {
    id = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('careerflow_guest_id', id);
  }
  return id;
}

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-guest-user-id': getGuestId(),
});

export const roadmapApi = {
  async getActive(): Promise<{ roadmap: IRoadmap | null; stats: IRoadmapStats | null }> {
    try {
      const res = await fetch('/api/roadmap', {
        headers: getHeaders(),
      });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      if (data.success && data.data) {
        // Cache to localStorage
        localStorage.setItem('careerflow_cached_roadmap', JSON.stringify(data.data.roadmap));
        localStorage.setItem('careerflow_cached_stats', JSON.stringify(data.data.stats));
        return data.data;
      }
      return { roadmap: null, stats: null };
    } catch (err) {
      console.warn('[roadmapApi] Server offline, checking local cache:', err);
      const cached = localStorage.getItem('careerflow_cached_roadmap');
      const cachedStats = localStorage.getItem('careerflow_cached_stats');
      if (cached && cachedStats) {
        return {
          roadmap: JSON.parse(cached),
          stats: JSON.parse(cachedStats),
        };
      }
      return { roadmap: null, stats: null };
    }
  },

  async generate(params: {
    careerGoal: string;
    academicYear: string;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    interests: string[];
    weeklyHours: number;
    targetWeeks?: number;
    geminiApiKey?: string;
    forceRegenerate?: boolean;
  }): Promise<{ roadmap: IRoadmap; stats: IRoadmapStats }> {
    try {
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to generate roadmap');
      }
      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.message || 'Error creating roadmap');
      }

      localStorage.setItem('careerflow_cached_roadmap', JSON.stringify(json.data.roadmap));
      localStorage.setItem('careerflow_cached_stats', JSON.stringify(json.data.stats));
      return json.data;
    } catch (err) {
      console.error('[roadmapApi] generate error:', err);
      throw err;
    }
  },

  async updateTopic(
    topicId: string,
    payload: {
      status?: 'pending' | 'in_progress' | 'completed';
      confidenceScore?: number;
      notes?: string;
      completionPercent?: number;
    }
  ): Promise<{ roadmap: IRoadmap; stats: IRoadmapStats }> {
    try {
      const res = await fetch(`/api/roadmap/topics/${topicId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.message || 'Error updating topic');
      }

      localStorage.setItem('careerflow_cached_roadmap', JSON.stringify(json.data.roadmap));
      localStorage.setItem('careerflow_cached_stats', JSON.stringify(json.data.stats));
      return json.data;
    } catch (err) {
      console.warn('[roadmapApi] Online update failed, updating local cache fallback:', err);
      // Fallback local update
      const cached = localStorage.getItem('careerflow_cached_roadmap');
      if (cached) {
        const roadmap: IRoadmap = JSON.parse(cached);
        const topic = roadmap.topics.find((t) => t._id === topicId);
        if (topic) {
          if (payload.status) {
            topic.status = payload.status;
            topic.completionPercent = payload.status === 'completed' ? 100 : payload.status === 'in_progress' ? 50 : 0;
          }
          if (typeof payload.confidenceScore === 'number') topic.confidenceScore = payload.confidenceScore;
          if (typeof payload.notes === 'string') topic.notes = payload.notes;
        }

        const completed = roadmap.topics.filter((t) => t.status === 'completed').length;
        const inProgress = roadmap.topics.filter((t) => t.status === 'in_progress').length;
        const total = roadmap.topics.length;
        const stats: IRoadmapStats = {
          totalTopics: total,
          completedTopics: completed,
          inProgressTopics: inProgress,
          pendingTopics: Math.max(0, total - completed - inProgress),
          completionPercent: total ? Math.round((completed / total) * 100) : 0,
          averageConfidence: total ? Math.round(roadmap.topics.reduce((a, b) => a + b.confidenceScore, 0) / total) : 50,
          totalHours: roadmap.topics.reduce((a, b) => a + b.estimatedHours, 0),
          completedHours: roadmap.topics.filter((t) => t.status === 'completed').reduce((a, b) => a + b.estimatedHours, 0),
          currentWeek: roadmap.topics.find((t) => t.status !== 'completed')?.week || roadmap.totalWeeks,
          streakCount: 1,
        };

        localStorage.setItem('careerflow_cached_roadmap', JSON.stringify(roadmap));
        localStorage.setItem('careerflow_cached_stats', JSON.stringify(stats));
        return { roadmap, stats };
      }
      throw err;
    }
  },

  async getRecommendations(): Promise<IRecommendation | null> {
    try {
      const res = await fetch('/api/roadmap/recommendations', {
        headers: getHeaders(),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (err) {
      console.warn('[roadmapApi] getRecommendations failed:', err);
      return null;
    }
  },

  async refreshRecommendations(): Promise<IRecommendation | null> {
    try {
      const res = await fetch('/api/roadmap/recommendations/refresh', {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (err) {
      console.warn('[roadmapApi] refreshRecommendations failed:', err);
      return null;
    }
  },

  async reset(): Promise<void> {
    try {
      await fetch('/api/roadmap/reset', {
        method: 'POST',
        headers: getHeaders(),
      });
    } finally {
      localStorage.removeItem('careerflow_cached_roadmap');
      localStorage.removeItem('careerflow_cached_stats');
    }
  },
};
