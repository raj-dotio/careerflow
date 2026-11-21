import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGoal extends Document {
  userId: string;
  title: string;
  description?: string;
  category: 'dsa' | 'project' | 'interview' | 'reading' | 'custom';
  targetValue: number;
  currentValue: number;
  unit: string;
  color: string;
  frequency: 'daily';
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGoalProgress extends Document {
  userId: string;
  goalId: string;
  date: string; // YYYY-MM-DD format
  value: number;
  targetValue: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const goalSchema = new Schema<IGoal>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      default: 'guest',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['dsa', 'project', 'interview', 'reading', 'custom'],
      default: 'dsa',
    },
    targetValue: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    currentValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      default: 'tasks',
      trim: true,
    },
    color: {
      type: String,
      default: '#e11d48',
    },
    frequency: {
      type: String,
      enum: ['daily'],
      default: 'daily',
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const goalProgressSchema = new Schema<IGoalProgress>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    goalId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    value: {
      type: Number,
      default: 0,
    },
    targetValue: {
      type: Number,
      default: 1,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for lightning-fast heatmap & streak lookups
goalProgressSchema.index({ userId: 1, date: 1 });
goalProgressSchema.index({ goalId: 1, date: 1 }, { unique: true });

export const Goal: Model<IGoal> = mongoose.model<IGoal>('Goal', goalSchema);
export const GoalProgress: Model<IGoalProgress> = mongoose.model<IGoalProgress>('GoalProgress', goalProgressSchema);

export default Goal;
