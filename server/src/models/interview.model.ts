import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IQuestion {
  question: string;
  spokenText?: string;
  spokenJudgment?: string;
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  expectedPoints?: string[];
  answer?: string;
  feedback?: string;
  score?: number;
  confidence?: number;
  communication?: number;
  correctness?: number;
}

export interface IInterviewPlanRound {
  roundIndex: number;
  roundName: string;
  subtopics: string[];
}

export interface IResumeStructured {
  name?: string;
  summary?: string;
  skills?: string[];
  projects?: Array<{
    name: string;
    description?: string;
    technologies?: string[];
    metricsOrOutcomes?: string;
  }>;
  experience?: Array<{
    role?: string;
    company?: string;
    duration?: string;
    highlights?: string[];
  }>;
  education?: string[];
}

export interface IInterview extends Document {
  userId?: mongoose.Types.ObjectId;
  role: string;
  experience: string;
  mode: 'HR' | 'Technical' | 'Mixed';
  interviewerGender: 'female' | 'male';
  techStack?: string[];
  resumeText?: string;
  resumeStructured?: IResumeStructured | null;
  modeType: 'RESUME_DRIVEN' | 'ROLE_DRIVEN';
  interviewPlan: IInterviewPlanRound[];
  askedTopics: string[];
  askedQuestions: string[];
  currentRoundIndex: number;
  totalRounds: number;
  questions: IQuestion[];
  finalScore: number;
  avgConfidence: number;
  avgCommunication: number;
  avgCorrectness: number;
  summaryFeedback?: string;
  strengths?: string[];
  improvements?: string[];
  status: 'Incompleted' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    question: { type: String, required: true },
    spokenText: { type: String, default: '' },
    spokenJudgment: { type: String, default: '' },
    topic: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    timeLimit: { type: Number, default: 90 },
    expectedPoints: { type: [String], default: [] },
    answer: { type: String, default: '' },
    feedback: { type: String, default: '' },
    score: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    correctness: { type: Number, default: 0 },
  },
  { _id: true }
);

const interviewPlanRoundSchema = new Schema<IInterviewPlanRound>(
  {
    roundIndex: { type: Number, required: true },
    roundName: { type: String, required: true },
    subtopics: { type: [String], default: [] },
  },
  { _id: false }
);

const interviewSchema = new Schema<IInterview>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    role: { type: String, required: true },
    experience: { type: String, required: true },
    mode: { type: String, enum: ['HR', 'Technical', 'Mixed', 'hr', 'technical', 'mixed'], default: 'Technical' },
    interviewerGender: { type: String, enum: ['female', 'male'], default: 'female' },
    techStack: { type: [String], default: [] },
    resumeText: { type: String, default: '' },
    resumeStructured: { type: Schema.Types.Mixed, default: null },
    modeType: { type: String, enum: ['RESUME_DRIVEN', 'ROLE_DRIVEN'], default: 'ROLE_DRIVEN' },
    interviewPlan: { type: [interviewPlanRoundSchema], default: [] },
    askedTopics: { type: [String], default: [] },
    askedQuestions: { type: [String], default: [] },
    currentRoundIndex: { type: Number, default: 0 },
    totalRounds: { type: Number, default: 5 },
    questions: [questionSchema],
    finalScore: { type: Number, default: 0 },
    avgConfidence: { type: Number, default: 0 },
    avgCommunication: { type: Number, default: 0 },
    avgCorrectness: { type: Number, default: 0 },
    summaryFeedback: { type: String, default: '' },
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
    status: { type: String, enum: ['Incompleted', 'completed'], default: 'Incompleted' },
  },
  { timestamps: true }
);

const Interview: Model<IInterview> = mongoose.model<IInterview>('Interview', interviewSchema);

export default Interview;
