export interface ITopicResource {
  title: string;
  url: string;
  type: 'youtube' | 'docs' | 'exercise' | 'project';
  duration?: string;
}

export interface IRoadmapTopic {
  _id: string;
  week: number;
  module: string;
  phase: string;
  title: string;
  description: string;
  orderIndex: number;
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'pending' | 'in_progress' | 'completed';
  completionPercent: number;
  confidenceScore: number;
  notes: string;
  practiceProject: string;
  aiNotes: string;
  resources: ITopicResource[];
  completedAt?: string;
}

export interface IRoadmap {
  _id: string;
  userId: string;
  title: string;
  careerGoal: string;
  description: string;
  academicYear: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  interests: string[];
  weeklyHours: number;
  status: 'active' | 'completed' | 'archived';
  totalWeeks: number;
  currentWeek: number;
  topics: IRoadmapTopic[];
  createdAt: string;
  updatedAt: string;
}

export interface IRoadmapStats {
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  pendingTopics: number;
  completionPercent: number;
  averageConfidence: number;
  totalHours: number;
  completedHours: number;
  currentWeek: number;
  streakCount: number;
}

export interface IRecommendation {
  _id?: string;
  roadmapId: string;
  summary: string;
  nextTopics: Array<{
    title: string;
    reason: string;
    expectedOutcome: string;
  }>;
  practiceProjects: Array<{
    title: string;
    description: string;
    focusArea: string;
  }>;
  resources: Array<{
    title: string;
    url: string;
    type?: string;
  }>;
  revisionAreas: Array<{
    title: string;
    reason: string;
  }>;
  weakAreas: string[];
  encouragement: string;
  createdAt?: string;
}
