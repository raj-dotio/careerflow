import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  credits: number;
  streakCount?: number;
  lastActiveOn?: Date;
  academicYear?: string;
  experienceLevel?: string;
  interests?: string[];
  weeklyTargetHours?: number;
  roleTitle?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    credits: {
      type: Number,
      default: 1000,
    },
    streakCount: {
      type: Number,
      default: 0,
    },
    lastActiveOn: {
      type: Date,
    },
    academicYear: {
      type: String,
    },
    experienceLevel: {
      type: String,
      default: 'beginner',
    },
    interests: {
      type: [String],
      default: [],
    },
    weeklyTargetHours: {
      type: Number,
      default: 8,
    },
    roleTitle: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
