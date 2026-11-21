import mongoose, { Document, Model, Schema } from 'mongoose';

export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface ISkill extends Document {
  name: string;
  category: string;
  proficiency: ProficiencyLevel;
  progress: number;
  proofUrl?: string;
  description?: string;
  userId: string;
  isVerified: boolean;
  verifiedAt?: Date;
  aiReviewSummary?: string;
  aiKeyStrengths?: string[];
  repoName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const skillSchema = new Schema<ISkill>(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
      maxlength: 60,
    },
    category: {
      type: String,
      required: [true, 'Skill category is required'],
      trim: true,
      default: 'Programming',
    },
    proficiency: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Beginner',
    },
    progress: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 15, // Baseline unverified progress
    },
    proofUrl: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 300,
    },
    userId: {
      type: String,
      default: 'guest',
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    aiReviewSummary: {
      type: String,
      default: '',
    },
    aiKeyStrengths: {
      type: [String],
      default: [],
    },
    repoName: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Skill: Model<ISkill> = mongoose.model<ISkill>('Skill', skillSchema);

export default Skill;
