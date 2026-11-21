import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITopicResource {
  title: string;
  url: string;
  type: 'youtube' | 'docs' | 'exercise' | 'project';
  duration?: string;
}

export interface IRoadmapTopic {
  _id: mongoose.Types.ObjectId;
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
  completedAt?: Date;
}

export interface IRoadmap extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const resourceSchema = new Schema<ITopicResource>(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ['youtube', 'docs', 'exercise', 'project'],
      default: 'docs',
    },
    duration: { type: String },
  },
  { _id: false }
);

const topicSchema = new Schema<IRoadmapTopic>(
  {
    week: { type: Number, required: true, default: 1 },
    module: { type: String, required: true, default: 'General Module' },
    phase: { type: String, required: true, default: 'Foundations' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    orderIndex: { type: Number, required: true },
    estimatedHours: { type: Number, default: 6 },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    completionPercent: { type: Number, default: 0, min: 0, max: 100 },
    confidenceScore: { type: Number, default: 50, min: 0, max: 100 },
    notes: { type: String, default: '' },
    practiceProject: { type: String, default: '' },
    aiNotes: { type: String, default: '' },
    resources: { type: [resourceSchema], default: [] },
    completedAt: { type: Date },
  },
  { _id: true, timestamps: true }
);

const roadmapSchema = new Schema<IRoadmap>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    careerGoal: { type: String, required: true },
    description: { type: String, default: '' },
    academicYear: { type: String, default: '3rd Year' },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    interests: { type: [String], default: [] },
    weeklyHours: { type: Number, default: 8 },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
    },
    totalWeeks: { type: Number, default: 10 },
    currentWeek: { type: Number, default: 1 },
    topics: { type: [topicSchema], default: [] },
  },
  { timestamps: true }
);

roadmapSchema.index({ userId: 1, status: 1 });

const Roadmap: Model<IRoadmap> = mongoose.model<IRoadmap>('Roadmap', roadmapSchema);

export default Roadmap;
