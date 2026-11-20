import { Request, Response } from 'express';
import Resume, { IResumeData } from '../models/resume.model.js';
import { AuthRequest } from '../middlewares/isAuth.js';

export const getSampleResumeData = (): IResumeData => ({
  title: 'Software Engineering Resume',
  basics: {
    name: 'Sarah Lin',
    headline: 'Full-Stack Software Engineer & Distributed Systems Enthusiast',
    email: 'sarah.lin@college.edu',
    phone: '+1 (555) 382-9481',
    location: 'San Francisco, CA',
    url: 'https://github.com/sarahlin',
  },
  summary:
    'Aspiring Software Engineer with deep foundations in distributed systems, high-concurrency backends, and cloud computing. Passionate about low-latency architecture, clean APIs, and algorithmic efficiency.',
  sections: {
    profiles: [
      {
        id: 'prof-1',
        network: 'GitHub',
        username: 'sarahlin',
        url: 'https://github.com/sarahlin',
      },
      {
        id: 'prof-2',
        network: 'LinkedIn',
        username: 'sarah-lin-swe',
        url: 'https://linkedin.com/in/sarah-lin-swe',
      },
    ],
    experience: [
      {
        id: 'exp-1',
        company: 'Stripe',
        position: 'Software Engineering Intern',
        location: 'Seattle, WA',
        date: 'June 2025 – August 2025',
        summary:
          '• Re-architected PostgreSQL idempotency key caching with Redis clusters, reducing p99 payment verification latency by 43% across 1.2M daily transactions.\n• Designed and shipped an asynchronous webhook dispatch worker in Go handling 12,000 requests/sec with zero packet drop.\n• Implemented telemetry dashboards with Prometheus and Grafana, improving incident MTTR by 28%.',
        current: false,
        url: 'https://stripe.com',
      },
      {
        id: 'exp-2',
        company: 'Campus Open Source Labs',
        position: 'Backend Developer Lead',
        location: 'University Campus',
        date: 'Sept 2024 – May 2025',
        summary:
          '• Led a 6-engineer team building the campus course registration portal serving 18,000 active university students.\n• Authored modular RESTful APIs in Node.js and TypeScript, handling automated waitlist allocations with transactional isolation.',
        current: false,
        url: 'https://campuslabs.edu',
      },
    ],
    education: [
      {
        id: 'edu-1',
        institution: 'Indian Institute of Technology (IIT) / UC Berkeley',
        degree: 'Bachelor of Technology in Computer Science',
        fieldOfStudy: 'Computer Science and Engineering',
        score: 'GPA: 3.92 / 4.0 (Dean’s Honor List)',
        date: 'August 2022 – May 2026',
        current: true,
      },
    ],
    skills: [
      {
        id: 'sk-1',
        name: 'Languages',
        level: 'Advanced',
        keywords: ['TypeScript', 'JavaScript', 'Go', 'Python', 'C++', 'SQL'],
      },
      {
        id: 'sk-2',
        name: 'Frameworks & Tools',
        level: 'Proficient',
        keywords: ['React', 'Next.js', 'Node.js', 'Express', 'Tailwind CSS', 'Docker', 'Kubernetes'],
      },
      {
        id: 'sk-3',
        name: 'Distributed Systems & DB',
        level: 'Advanced',
        keywords: ['PostgreSQL', 'Redis', 'Kafka', 'MongoDB', 'AWS (S3, ECS, Lambda)', 'gRPC'],
      },
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'Distributed Rate Limiter Service',
        description:
          'Engineered a multi-region Sliding Window Log rate limiter in Go backed by Redis sorted sets, handling 50k RPS with <2ms evaluation overhead. Published open-source benchmark suite with 1,200+ GitHub stars.',
        date: '2025',
        url: 'https://github.com/sarahlin/distributed-rate-limiter',
        keywords: ['Go', 'Redis', 'Docker', 'Distributed Systems'],
      },
      {
        id: 'proj-2',
        name: 'CodeFlow — Real-time Collaborative Code Editor',
        description:
          'Constructed an operational transformation (OT) WebSocket engine supporting simultaneous multi-cursor editing, syntax highlighting, and sandboxed remote code execution in WebAssembly containers.',
        date: '2024',
        url: 'https://github.com/sarahlin/codeflow',
        keywords: ['TypeScript', 'WebSockets', 'WebAssembly', 'React'],
      },
    ],
    certifications: [
      {
        id: 'cert-1',
        name: 'AWS Certified Solutions Architect – Associate',
        issuer: 'Amazon Web Services',
        date: '2025',
        url: '',
      },
    ],
    awards: [
      {
        id: 'aw-1',
        title: '1st Place Winner — Global Hackathon 2025',
        awarder: 'Major League Hacking',
        date: '2025',
        summary: 'Built an AI-assisted diagnostic pipeline judged top out of 450 student teams.',
      },
    ],
    languages: [
      { id: 'lang-1', name: 'English', level: 'Native / Bilingual' },
      { id: 'lang-2', name: 'Spanish', level: 'Conversational' },
    ],
  },
  metadata: {
    template: 'modern',
    theme: {
      primary: '#0066cc',
      text: '#1d1d1f',
      background: '#ffffff',
    },
    typography: {
      font: 'Inter',
      size: 14,
    },
  },
});

export const getResumes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || (req.query.userId as string) || 'guest';
    const resumes = await Resume.find({ userId }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: resumes.length,
      data: resumes,
    });
  } catch (error) {
    console.error('Error in getResumes:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve resumes' });
  }
};

export const getResumeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (id === 'sample') {
      res.status(200).json({ success: true, data: getSampleResumeData() });
      return;
    }

    const resume = await Resume.findById(id);
    if (!resume) {
      res.status(404).json({ success: false, message: 'Resume not found' });
      return;
    }

    res.status(200).json({ success: true, data: resume });
  } catch (error) {
    console.error('Error in getResumeById:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve resume' });
  }
};

export const createResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || req.body.userId || 'guest';
    const resumeData = req.body.resumeData || req.body;

    const newResume = new Resume({
      ...resumeData,
      userId,
      title: resumeData.title || 'My Technical Resume',
    });

    await newResume.save();

    res.status(201).json({
      success: true,
      message: 'Resume created successfully',
      data: newResume,
    });
  } catch (error) {
    console.error('Error in createResume:', error);
    res.status(500).json({ success: false, message: 'Failed to create resume' });
  }
};

export const updateResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await Resume.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      res.status(404).json({ success: false, message: 'Resume not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Resume updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error in updateResume:', error);
    res.status(500).json({ success: false, message: 'Failed to update resume' });
  }
};

export const deleteResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Resume.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Resume not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Error in deleteResume:', error);
    res.status(500).json({ success: false, message: 'Failed to delete resume' });
  }
};

export const duplicateResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const source = await Resume.findById(id);

    if (!source) {
      res.status(404).json({ success: false, message: 'Source resume not found' });
      return;
    }

    const clonedObject = source.toObject();
    delete (clonedObject as any)._id;
    delete (clonedObject as any).createdAt;
    delete (clonedObject as any).updatedAt;

    const cloned = new Resume({
      ...clonedObject,
      title: `${source.title} (Copy)`,
      slug: `resume-${Date.now()}`,
    });

    await cloned.save();

    res.status(201).json({
      success: true,
      message: 'Resume duplicated successfully',
      data: cloned,
    });
  } catch (error) {
    console.error('Error in duplicateResume:', error);
    res.status(500).json({ success: false, message: 'Failed to duplicate resume' });
  }
};

export const getSampleResume = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: getSampleResumeData(),
  });
};
