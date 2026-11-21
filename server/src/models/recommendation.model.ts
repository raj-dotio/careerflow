import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IRecommendation extends Document {
  userId: string;
  roadmapId: mongoose.Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const recommendationSchema = new Schema<IRecommendation>(
  {
    userId: { type: String, required: true, index: true },
    roadmapId: { type: Schema.Types.ObjectId, ref: 'Roadmap', required: true, index: true },
    summary: { type: String, required: true },
    nextTopics: [
      {
        title: { type: String, required: true },
        reason: { type: String, default: '' },
        expectedOutcome: { type: String, default: '' },
      },
    ],
    practiceProjects: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        focusArea: { type: String, default: '' },
      },
    ],
    resources: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, default: 'docs' },
      },
    ],
    revisionAreas: [
      {
        title: { type: String, required: true },
        reason: { type: String, default: '' },
      },
    ],
    weakAreas: [{ type: String }],
    encouragement: { type: String, default: '' },
  },
  { timestamps: true }
);

recommendationSchema.index({ userId: 1, roadmapId: 1, createdAt: -1 });

const Recommendation: Model<IRecommendation> = mongoose.model<IRecommendation>(
  'Recommendation',
  recommendationSchema
);

export default Recommendation;
