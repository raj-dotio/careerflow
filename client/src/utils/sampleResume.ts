export interface ResumeData {
  title: string;
  basics: {
    name: string;
    headline: string;
    email: string;
    phone: string;
    location: string;
    url: string;
    github?: string;
    linkedin?: string;
  };
  summary: string;
  sections: {
    experience: Array<{
      id: string;
      company: string;
      position: string;
      location: string;
      date: string;
      summary: string;
    }>;
    education: Array<{
      id: string;
      institution: string;
      degree: string;
      fieldOfStudy: string;
      score: string;
      date: string;
    }>;
    skills: Array<{
      id: string;
      name: string;
      keywords: string[];
    }>;
    projects: Array<{
      id: string;
      name: string;
      description: string;
      url: string;
      keywords: string[];
    }>;
    certifications: Array<{
      id: string;
      name: string;
      issuer: string;
      date: string;
    }>;
    awards: Array<{
      id: string;
      title: string;
      awarder: string;
      date: string;
      summary: string;
    }>;
  };
  metadata: {
    template: 'modern' | 'classic' | 'minimal' | 'executive';
    themeColor: string;
  };
}

export const initialSampleResume: ResumeData = {
  title: 'Software Engineering Resume',
  basics: {
    name: 'Sarah Lin',
    headline: 'Full-Stack Software Engineer & Distributed Systems Enthusiast',
    email: 'sarah.lin@college.edu',
    phone: '+1 (555) 382-9481',
    location: 'San Francisco, CA',
    url: 'https://sarahlin.dev',
    github: 'https://github.com/sarahlin',
    linkedin: 'https://linkedin.com/in/sarahlin',
  },
  summary:
    'Aspiring Software Engineer with deep foundations in distributed systems, high-concurrency backends, and cloud computing. Passionate about low-latency architecture, clean APIs, and algorithmic efficiency.',
  sections: {
    experience: [
      {
        id: 'exp-1',
        company: 'Stripe',
        position: 'Software Engineering Intern',
        location: 'Seattle, WA',
        date: 'June 2025 – August 2025',
        summary:
          '• Re-architected PostgreSQL idempotency key caching with Redis clusters, reducing p99 payment verification latency by 43% across 1.2M daily transactions.\n• Designed and shipped an asynchronous webhook dispatch worker in Go handling 12,000 requests/sec with zero packet drop.\n• Implemented telemetry dashboards with Prometheus and Grafana, improving incident MTTR by 28%.',
      },
      {
        id: 'exp-2',
        company: 'Campus Open Source Labs',
        position: 'Backend Developer Lead',
        location: 'University Campus',
        date: 'Sept 2024 – May 2025',
        summary:
          '• Led a 6-engineer team building the campus course registration portal serving 18,000 active university students.\n• Authored modular RESTful APIs in Node.js and TypeScript, handling automated waitlist allocations with transactional isolation.',
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
      },
    ],
    skills: [
      {
        id: 'sk-1',
        name: 'Languages',
        keywords: ['TypeScript', 'JavaScript', 'Go', 'Python', 'C++', 'SQL'],
      },
      {
        id: 'sk-2',
        name: 'Frameworks & Tools',
        keywords: ['React', 'Next.js', 'Node.js', 'Express', 'Tailwind CSS', 'Docker', 'Kubernetes'],
      },
      {
        id: 'sk-3',
        name: 'Databases & Cloud',
        keywords: ['PostgreSQL', 'Redis', 'Kafka', 'MongoDB', 'AWS (S3, ECS, Lambda)', 'gRPC'],
      },
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'Distributed Rate Limiter Service',
        description:
          'Engineered a multi-region Sliding Window Log rate limiter in Go backed by Redis sorted sets, handling 50k RPS with <2ms evaluation overhead. Published open-source benchmark suite with 1,200+ GitHub stars.',
        url: 'https://github.com/sarahlin/rate-limiter',
        keywords: ['Go', 'Redis', 'Docker', 'Distributed Systems'],
      },
      {
        id: 'proj-2',
        name: 'CodeFlow — Real-time Collaborative Editor',
        description:
          'Constructed an operational transformation (OT) WebSocket engine supporting simultaneous multi-cursor editing, syntax highlighting, and sandboxed remote code execution in WebAssembly containers.',
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
  },
  metadata: {
    template: 'modern',
    themeColor: '#0066cc',
  },
};
