import mongoose, { Document, Model, Schema } from 'mongoose';

export type ChallengeDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Adaptive';
export type QuestionType = 'Conceptual' | 'Practical' | 'Scenario' | 'Resume-Project' | 'Technical' | 'System-Design';

export interface IQuestionItem {
  questionNumber: number;
  question: string;
  topic: string;
  difficulty: string;
  questionType: QuestionType;
  userAnswer?: string;
  answeredAt?: Date;
  aiFeedbackAck?: string;
  internalScore?: number;
  strengthsIdentified?: string[];
  weaknessesIdentified?: string[];
}

export interface IQuestionEvaluation {
  questionNumber: number;
  question: string;
  userAnswer: string;
  score: number;
  whatWentWell: string;
  whatWasMissing: string;
  howToImprove: string;
  idealAnswer: string;
}

export interface IFinalEvaluation {
  overallScore: number;
  performanceLevel: 'Outstanding' | 'Proficient' | 'Developing' | 'Needs Practice';
  performanceSummary: string;
  estimatedKnowledgeLevel: string;
  questionEvaluations: IQuestionEvaluation[];
  strongestSkills: string[];
  weakestAreas: string[];
  knowledgeGaps: string[];
  problemSolvingAssessment: string;
  communicationAssessment: string;
  technicalImprovementSuggestions: string[];
  recommendedLearningTopics: string[];
  adaptiveTrajectory?: {
    initialKnowledgeLevel: string;
    finalDemonstratedLevel: string;
    handlingOfHardQuestions: string;
    performanceProgression: string;
  };
}

export interface IChallengeSession extends Document {
  userId: string;
  goal: string;
  questionCount: number;
  difficulty: ChallengeDifficulty;
  currentDifficulty: string;
  resumeFileName?: string;
  resumeText?: string;
  resumeHighlights?: {
    skills: string[];
    projects: string[];
    experience: string;
    education?: string;
  };
  questions: IQuestionItem[];
  currentQuestionIndex: number;
  status: 'in-progress' | 'completed';
  finalEvaluation?: IFinalEvaluation;
  overallScore?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const questionItemSchema = new Schema<IQuestionItem>(
  {
    questionNumber: { type: Number, required: true },
    question: { type: String, required: true },
    topic: { type: String, default: 'General' },
    difficulty: { type: String, default: 'Intermediate' },
    questionType: { type: String, default: 'Technical' },
    userAnswer: { type: String },
    answeredAt: { type: Date },
    aiFeedbackAck: { type: String },
    internalScore: { type: Number },
    strengthsIdentified: [{ type: String }],
    weaknessesIdentified: [{ type: String }],
  },
  { _id: false }
);

const challengeSessionSchema = new Schema<IChallengeSession>(
  {
    userId: { type: String, required: true, default: 'guest' },
    goal: { type: String, required: true },
    questionCount: { type: Number, required: true, default: 5 },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Adaptive'],
      default: 'Intermediate',
    },
    currentDifficulty: { type: String, default: 'Intermediate' },
    resumeFileName: { type: String },
    resumeText: { type: String },
    resumeHighlights: {
      skills: [{ type: String }],
      projects: [{ type: String }],
      experience: { type: String },
      education: { type: String },
    },
    questions: [questionItemSchema],
    currentQuestionIndex: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'in-progress',
    },
    finalEvaluation: { type: Schema.Types.Mixed },
    overallScore: { type: Number },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes for quick lookups
challengeSessionSchema.index({ userId: 1, createdAt: -1 });
challengeSessionSchema.index({ status: 1 });

const ChallengeSession: Model<IChallengeSession> =
  mongoose.models.ChallengeSession ||
  mongoose.model<IChallengeSession>('ChallengeSession', challengeSessionSchema);

export default ChallengeSession;
