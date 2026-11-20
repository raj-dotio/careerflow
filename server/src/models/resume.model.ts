import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IResumeProfile {
  id?: string;
  network: string;
  username: string;
  url: string;
}

export interface IResumeExperience {
  id?: string;
  company: string;
  position: string;
  location?: string;
  date: string;
  summary: string;
  current?: boolean;
  url?: string;
}

export interface IResumeEducation {
  id?: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  score?: string;
  date: string;
  current?: boolean;
}

export interface IResumeSkill {
  id?: string;
  name: string;
  level?: string;
  keywords: string[];
}

export interface IResumeProject {
  id?: string;
  name: string;
  description: string;
  date?: string;
  url?: string;
  keywords: string[];
}

export interface IResumeCertification {
  id?: string;
  name: string;
  issuer: string;
  date?: string;
  url?: string;
}

export interface IResumeAward {
  id?: string;
  title: string;
  awarder: string;
  date?: string;
  summary?: string;
}

export interface IResumeLanguage {
  id?: string;
  name: string;
  level: string;
}

export interface IResumeData {
  title: string;
  slug?: string;
  userId?: string;
  basics: {
    name: string;
    headline: string;
    email: string;
    phone: string;
    location: string;
    url: string;
  };
  summary: string;
  sections: {
    profiles: IResumeProfile[];
    experience: IResumeExperience[];
    education: IResumeEducation[];
    skills: IResumeSkill[];
    projects: IResumeProject[];
    certifications: IResumeCertification[];
    awards: IResumeAward[];
    languages: IResumeLanguage[];
  };
  metadata: {
    template: 'modern' | 'classic' | 'minimal' | 'executive';
    theme: {
      primary: string;
      text: string;
      background: string;
    };
    typography: {
      font: string;
      size: number;
    };
  };
}

export interface IResume extends IResumeData, Document {
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    userId: {
      type: String,
      default: 'guest',
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: 'Untitled Resume',
    },
    slug: {
      type: String,
      default: () => `resume-${Date.now()}`,
    },
    basics: {
      name: { type: String, default: '' },
      headline: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
      url: { type: String, default: '' },
    },
    summary: {
      type: String,
      default: '',
    },
    sections: {
      profiles: [
        {
          id: String,
          network: String,
          username: String,
          url: String,
        },
      ],
      experience: [
        {
          id: String,
          company: String,
          position: String,
          location: String,
          date: String,
          summary: String,
          current: Boolean,
          url: String,
        },
      ],
      education: [
        {
          id: String,
          institution: String,
          degree: String,
          fieldOfStudy: String,
          score: String,
          date: String,
          current: Boolean,
        },
      ],
      skills: [
        {
          id: String,
          name: String,
          level: String,
          keywords: [String],
        },
      ],
      projects: [
        {
          id: String,
          name: String,
          description: String,
          date: String,
          url: String,
          keywords: [String],
        },
      ],
      certifications: [
        {
          id: String,
          name: String,
          issuer: String,
          date: String,
          url: String,
        },
      ],
      awards: [
        {
          id: String,
          title: String,
          awarder: String,
          date: String,
          summary: String,
        },
      ],
      languages: [
        {
          id: String,
          name: String,
          level: String,
        },
      ],
    },
    metadata: {
      template: {
        type: String,
        enum: ['modern', 'classic', 'minimal', 'executive'],
        default: 'modern',
      },
      theme: {
        primary: { type: String, default: '#0066cc' },
        text: { type: String, default: '#1d1d1f' },
        background: { type: String, default: '#ffffff' },
      },
      typography: {
        font: { type: String, default: 'Inter' },
        size: { type: Number, default: 14 },
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Resume: Model<IResume> = mongoose.model<IResume>('Resume', resumeSchema);
export default Resume;
