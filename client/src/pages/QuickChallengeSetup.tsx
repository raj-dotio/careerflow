import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Zap,
  GraduationCap,
  FileText,
  Sparkles,
  Award,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  X,
  Code2,
  Server,
  Layers,
  Cpu,
  Database,
  Users,
  Compass,
  ArrowRight,
  Sliders,
  Loader2,
} from 'lucide-react';

interface PredefinedGoal {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: any;
}

const PREDEFINED_GOALS: PredefinedGoal[] = [
  {
    id: 'frontend-dev',
    title: 'Frontend Developer Interview Preparation',
    category: 'Web & UI',
    description: 'React, TypeScript, CSS architecture, browser performance, DOM, and responsive UI.',
    icon: Code2,
  },
  {
    id: 'backend-dev',
    title: 'Backend Developer Interview Preparation',
    category: 'Systems & APIs',
    description: 'Node.js, Express/FastAPI, REST & GraphQL, concurrency, caching, and server architecture.',
    icon: Server,
  },
  {
    id: 'fullstack-dev',
    title: 'Full Stack Developer Assessment',
    category: 'End-to-End',
    description: 'Modern full-stack engineering, client-server sync, security, and cloud deployment.',
    icon: Layers,
  },
  {
    id: 'javascript-deep',
    title: 'JavaScript Knowledge Assessment',
    category: 'Core Language',
    description: 'Prototypes, closures, Event Loop, async/await, microtasks, memory leaks, and V8 internals.',
    icon: Cpu,
  },
  {
    id: 'react-prep',
    title: 'React.js Interview Preparation',
    category: 'Frontend Framework',
    description: 'React 19, Server Components, Hooks lifecycle, state management, reconciliation, and suspense.',
    icon: Code2,
  },
  {
    id: 'node-prep',
    title: 'Node.js Interview Preparation',
    category: 'Backend Runtime',
    description: 'Libuv event loop, streams, clustering, worker threads, async I/O, and microservice resilience.',
    icon: Server,
  },
  {
    id: 'python-dev',
    title: 'Python Programming',
    category: 'Language & Ecosystem',
    description: 'OOP, GIL, generators, decorators, asyncio, data manipulation, and clean architecture.',
    icon: Cpu,
  },
  {
    id: 'dsa-prep',
    title: 'Data Structures and Algorithms',
    category: 'Computer Science',
    description: 'Dynamic programming, trees, graphs, sorting, two pointers, heaps, and Big-O trade-offs.',
    icon: Compass,
  },
  {
    id: 'db-sql',
    title: 'Database and SQL',
    category: 'Data & Storage',
    description: 'PostgreSQL, indexing (B-Tree/Hash), ACID transactions, normal forms, and query optimization.',
    icon: Database,
  },
  {
    id: 'system-design',
    title: 'System Design',
    category: 'Architecture',
    description: 'Distributed caching, load balancing, sharding, CAP theorem, message queues, and high availability.',
    icon: Layers,
  },
  {
    id: 'hr-prep',
    title: 'HR Interview Preparation',
    category: 'Behavioral & Leadership',
    description: 'STAR method, conflict resolution, cultural contribution, ambition, and career alignment.',
    icon: Users,
  },
  {
    id: 'aptitude-logic',
    title: 'Aptitude and Logical Reasoning',
    category: 'Problem Solving',
    description: 'Quantitative problem solving, pattern deduction, analytical thinking, and campus test patterns.',
    icon: Sparkles,
  },
];

const QUESTION_COUNT_OPTIONS = [
  { count: 5, label: '5 Questions', sub: 'Quick Check (~8 min)' },
  { count: 10, label: '10 Questions', sub: 'Standard Screening (~15 min)' },
  { count: 15, label: '15 Questions', sub: 'In-Depth Technical (~25 min)' },
  { count: 20, label: '20 Questions', sub: 'Comprehensive Mock (~35 min)' },
];

const DIFFICULTY_OPTIONS = [
  {
    level: 'Beginner',
    tag: 'Core Fundamentals',
    desc: 'Tests foundational syntax, standard library patterns, and core principles.',
  },
  {
    level: 'Intermediate',
    tag: 'Standard Screening',
    desc: 'Probes real-world implementation, API integration, and performance trade-offs.',
  },
  {
    level: 'Advanced',
    tag: 'Senior / Staff Level',
    desc: 'Deep architecture, distributed failure modes, edge cases, and high-scale design.',
  },
  {
    level: 'Adaptive',
    tag: 'AI Dynamic Calibration',
    desc: 'AI begins at Intermediate and automatically scales difficulty based on your live answer quality.',
    badge: 'RECOMMENDED',
  },
];

const LOADING_STEPS = [
  'Understanding your career goals...',
  'Analyzing your resume & projects...',
  'Identifying relevant technical topics...',
  'Calibrating adaptive difficulty engine...',
  'Preparing your personalized interview...',
  'Generating your opening question with Gemini AI...',
];

export default function QuickChallengeSetup() {
  const navigate = useNavigate();

  // State
  const [selectedGoal, setSelectedGoal] = useState<string>('Frontend Developer Interview Preparation');
  const [isCustomGoal, setIsCustomGoal] = useState<boolean>(false);
  const [customGoalText, setCustomGoalText] = useState<string>('');

  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isCustomCount, setIsCustomCount] = useState<boolean>(false);
  const [customCountInput, setCustomCountInput] = useState<string>('7');

  const [difficulty, setDifficulty] = useState<string>('Adaptive');

  // Resume Upload State
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Submission / Loading State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Handle File Selection
  const handleFileChange = (file: File | undefined) => {
    if (!file) return;

    setFileError(null);
    const validExtensions = ['.pdf', '.docx'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(ext)) {
      setFileError('Please upload a PDF (.pdf) or Word (.docx) document.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds the 5MB limit. Please upload a smaller file.');
      return;
    }

    setResumeFile(file);
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Start Challenge Flow
  const handleStartChallenge = async () => {
    setErrorMessage(null);

    // Validate Goal
    const finalGoal = isCustomGoal ? customGoalText.trim() : selectedGoal;
    if (!finalGoal) {
      setErrorMessage('Please select or specify your career interview goal.');
      return;
    }

    // Validate Question Count
    let finalCount = questionCount;
    if (isCustomCount) {
      const parsed = parseInt(customCountInput, 10);
      if (isNaN(parsed) || parsed < 3 || parsed > 25) {
        setErrorMessage('Custom question count must be between 3 and 25.');
        return;
      }
      finalCount = parsed;
    }

    // Begin Loading Animation
    setIsSubmitting(true);
    setLoadingStepIndex(0);

    const stepInterval = setInterval(() => {
      setLoadingStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 900);

    try {
      const formData = new FormData();
      formData.append('goal', finalGoal);
      formData.append('difficulty', difficulty);
      formData.append('questionCount', String(finalCount));

      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      const response = await fetch('/api/challenges/start', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      clearInterval(stepInterval);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to start challenge session.');
      }

      // Navigate to live challenge room
      navigate(`/challenge/${data.sessionId}`);
    } catch (err: any) {
      clearInterval(stepInterval);
      setIsSubmitting(false);
      setErrorMessage(err.message || 'An unexpected error occurred while preparing your challenge.');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#141416] font-sans antialiased selection:bg-[#e11d48] selection:text-white">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e4e4e7] px-4 py-3 shadow-xs">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-[6px] bg-[#e11d48] border border-[#18181b] flex items-center justify-center p-1 text-white">
                <GraduationCap className="w-full h-full" />
              </div>
              <span className="font-extrabold text-[16px] text-[#141416]">CareerFlow</span>
            </Link>
            <span className="text-[#a1a1aa]">/</span>
            <span className="font-semibold text-[13px] text-[#71717a] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#e11d48]" />
              Quick Challenge Setup
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/skills"
              className="px-3 py-1.5 bg-white border border-[#d4d4d8] text-[#18181b] rounded-md text-[12px] font-bold hover:bg-[#f4f4f5] transition-all flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-[#e11d48]" />
              <span className="hidden sm:inline">Skill Tracker</span>
            </Link>

            <Link
              to="/ats"
              className="px-3 py-1.5 bg-white border border-[#d4d4d8] text-[#18181b] rounded-md text-[12px] font-bold hover:bg-[#f4f4f5] transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
              <span className="hidden sm:inline">ATS Diagnostics</span>
            </Link>

            <Link
              to="/builder"
              className="px-3 py-1.5 bg-white border border-[#d4d4d8] text-[#18181b] rounded-md text-[12px] font-bold hover:bg-[#f4f4f5] transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#e11d48]" />
              <span className="hidden sm:inline">Resume Builder</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="max-w-[1080px] mx-auto px-4 py-10 space-y-10">
        {/* Hero Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white sketch-border-sm text-[12px] font-bold text-[#141416] transform -rotate-1">
            <Sparkles className="w-3.5 h-3.5 text-[#e11d48]" />
            <span>Google Gemini Adaptive AI Interviewer</span>
          </div>

          <h1 className="text-[32px] sm:text-[44px] font-black text-[#141416] tracking-tight leading-tight">
            AI-Powered Quick Challenge
          </h1>

          <p className="text-[15px] sm:text-[17px] text-[#4b5563] font-medium leading-relaxed">
            Configure your technical domain, calibrate question count and difficulty, and practice with an AI interviewer that understands your career goals and adjusts to every response in real time.
          </p>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border-2 border-red-500 text-red-900 flex items-start gap-3 text-[14px]">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Configuration Incomplete</span>
              <p className="text-red-700 text-[13px]">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION A: SELECT YOUR GOAL
        ========================================================================= */}
        <section className="sketch-card p-6 sm:p-8 bg-white space-y-6">
          <div className="flex items-center justify-between border-b-2 border-dashed border-[#e5e7eb] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" />
              <h2 className="font-extrabold text-[18px] text-[#141416]">1. Select Your Career Goal</h2>
            </div>
            <span className="text-[12px] font-mono text-[#6b7280]">Target Specialization</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {PREDEFINED_GOALS.map((goal) => {
              const Icon = goal.icon;
              const isSelected = !isCustomGoal && selectedGoal === goal.title;

              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => {
                    setSelectedGoal(goal.title);
                    setIsCustomGoal(false);
                  }}
                  className={`text-left p-4 rounded-xl transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-rose-50/70 border-2 border-[#e11d48] shadow-[3px_3px_0px_#e11d48]'
                      : 'bg-[#faf8f5] hover:bg-white border-2 border-[#e5e7eb] hover:border-[#18181b]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white border border-[#e5e7eb] text-[#71717a]">
                        {goal.category}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#e11d48]" />}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#e11d48]' : 'text-[#71717a]'}`} />
                      <h3 className={`text-[14px] font-bold ${isSelected ? 'text-[#e11d48]' : 'text-[#141416]'}`}>
                        {goal.title}
                      </h3>
                    </div>
                    <p className="text-[12px] text-[#6b7280] leading-snug pt-1">{goal.description}</p>
                  </div>
                </button>
              );
            })}

            {/* Custom Goal Card */}
            <button
              type="button"
              onClick={() => setIsCustomGoal(true)}
              className={`text-left p-4 rounded-xl transition-all cursor-pointer flex flex-col justify-between ${
                isCustomGoal
                  ? 'bg-rose-50/70 border-2 border-[#e11d48] shadow-[3px_3px_0px_#e11d48]'
                  : 'bg-[#faf8f5] hover:bg-white border-2 border-[#e5e7eb] hover:border-[#18181b]'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white border border-[#e5e7eb] text-[#71717a]">
                    Bespoke
                  </span>
                  {isCustomGoal && <CheckCircle2 className="w-4 h-4 text-[#e11d48]" />}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Sliders className={`w-4 h-4 shrink-0 ${isCustomGoal ? 'text-[#e11d48]' : 'text-[#71717a]'}`} />
                  <h3 className={`text-[14px] font-bold ${isCustomGoal ? 'text-[#e11d48]' : 'text-[#141416]'}`}>
                    Custom Goal
                  </h3>
                </div>
                <p className="text-[12px] text-[#6b7280] leading-snug pt-1">
                  Define your own specialized topic, framework, company track, or certification.
                </p>
              </div>
            </button>
          </div>

          {/* Custom Goal Input if Active */}
          {isCustomGoal && (
            <div className="p-4 rounded-xl bg-[#faf8f5] border-2 border-[#18181b] space-y-2 animate-fadeIn">
              <label className="text-[13px] font-bold text-[#141416] flex items-center gap-1.5">
                <span>Enter Your Custom Career / Interview Goal:</span>
              </label>
              <input
                type="text"
                value={customGoalText}
                onChange={(e) => setCustomGoalText(e.target.value)}
                placeholder="e.g., Golang Microservices Architecture, Kubernetes Security, Golang Concurrency..."
                className="w-full px-4 py-2.5 bg-white border-2 border-[#18181b] rounded-lg text-[14px] font-medium outline-none focus:border-[#e11d48]"
                autoFocus
              />
              <p className="text-[11px] text-[#71717a]">
                Gemini will dynamically formulate questions aligned strictly with your custom goal.
              </p>
            </div>
          )}
        </section>

        {/* =========================================================================
            SECTION B: NUMBER OF QUESTIONS
        ========================================================================= */}
        <section className="sketch-card p-6 sm:p-8 bg-white space-y-6">
          <div className="flex items-center justify-between border-b-2 border-dashed border-[#e5e7eb] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" />
              <h2 className="font-extrabold text-[18px] text-[#141416]">2. Number of Questions</h2>
            </div>
            <span className="text-[12px] font-mono text-[#6b7280]">Exact Target Count</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {QUESTION_COUNT_OPTIONS.map((opt) => {
              const isSelected = !isCustomCount && questionCount === opt.count;
              return (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => {
                    setQuestionCount(opt.count);
                    setIsCustomCount(false);
                  }}
                  className={`p-3.5 rounded-xl text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#18181b] text-white border-2 border-[#18181b] shadow-[3px_3px_0px_#e11d48]'
                      : 'bg-[#faf8f5] hover:bg-white text-[#141416] border-2 border-[#e5e7eb] hover:border-[#18181b]'
                  }`}
                >
                  <div className="text-[18px] font-black">{opt.count}</div>
                  <div className={`text-[12px] font-bold ${isSelected ? 'text-[#faf8f5]' : 'text-[#141416]'}`}>
                    Questions
                  </div>
                  <div className={`text-[10px] mt-1 ${isSelected ? 'text-[#d4d4d8]' : 'text-[#71717a]'}`}>
                    {opt.sub}
                  </div>
                </button>
              );
            })}

            {/* Custom Count Pill */}
            <button
              type="button"
              onClick={() => setIsCustomCount(true)}
              className={`p-3.5 rounded-xl text-center transition-all cursor-pointer ${
                isCustomCount
                  ? 'bg-[#18181b] text-white border-2 border-[#18181b] shadow-[3px_3px_0px_#e11d48]'
                  : 'bg-[#faf8f5] hover:bg-white text-[#141416] border-2 border-[#e5e7eb] hover:border-[#18181b]'
              }`}
            >
              <div className="text-[18px] font-black">Custom</div>
              <div className={`text-[12px] font-bold ${isCustomCount ? 'text-[#faf8f5]' : 'text-[#141416]'}`}>
                Number
              </div>
              <div className={`text-[10px] mt-1 ${isCustomCount ? 'text-[#d4d4d8]' : 'text-[#71717a]'}`}>
                (3 - 25 Questions)
              </div>
            </button>
          </div>

          {isCustomCount && (
            <div className="p-4 rounded-xl bg-[#faf8f5] border-2 border-[#18181b] flex flex-col sm:flex-row items-center gap-3 animate-fadeIn">
              <span className="text-[13px] font-bold text-[#141416]">Specify Question Count (3 - 25):</span>
              <input
                type="number"
                min={3}
                max={25}
                value={customCountInput}
                onChange={(e) => setCustomCountInput(e.target.value)}
                className="w-24 px-3 py-1.5 bg-white border-2 border-[#18181b] rounded-lg text-center font-bold text-[15px] outline-none"
              />
              <span className="text-[12px] text-[#71717a]">
                Gemini will respect the exact question count selected before generating final evaluation.
              </span>
            </div>
          )}
        </section>

        {/* =========================================================================
            SECTION C: DIFFICULTY LEVEL
        ========================================================================= */}
        <section className="sketch-card p-6 sm:p-8 bg-white space-y-6">
          <div className="flex items-center justify-between border-b-2 border-dashed border-[#e5e7eb] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" />
              <h2 className="font-extrabold text-[18px] text-[#141416]">3. Difficulty Level</h2>
            </div>
            <span className="text-[12px] font-mono text-[#6b7280]">Depth Calibration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {DIFFICULTY_OPTIONS.map((diff) => {
              const isSelected = difficulty === diff.level;
              return (
                <button
                  key={diff.level}
                  type="button"
                  onClick={() => setDifficulty(diff.level)}
                  className={`text-left p-4 rounded-xl transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-rose-50/70 border-2 border-[#e11d48] shadow-[3px_3px_0px_#e11d48]'
                      : 'bg-[#faf8f5] hover:bg-white border-2 border-[#e5e7eb] hover:border-[#18181b]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-white border border-[#e5e7eb] rounded text-[#71717a]">
                        {diff.tag}
                      </span>
                      {diff.badge && (
                        <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 bg-[#e11d48] text-white rounded">
                          {diff.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <h3 className={`text-[15px] font-extrabold ${isSelected ? 'text-[#e11d48]' : 'text-[#141416]'}`}>
                        {diff.level}
                      </h3>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#e11d48]" />}
                    </div>
                    <p className="text-[12px] text-[#6b7280] leading-snug pt-1">{diff.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            SECTION D: RESUME UPLOAD (OPTIONAL)
        ========================================================================= */}
        <section className="sketch-card p-6 sm:p-8 bg-white space-y-6">
          <div className="flex items-center justify-between border-b-2 border-dashed border-[#e5e7eb] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
              <h2 className="font-extrabold text-[18px] text-[#141416]">4. Resume Upload (Optional)</h2>
            </div>
            <span className="text-[12px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Personalized Questions
            </span>
          </div>

          <p className="text-[13px] text-[#6b7280]">
            Upload your resume to let Gemini AI extract your actual projects, tech stack, and experience. Questions will directly probe decisions you made in your real projects!
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e.target.files?.[0])}
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
          />

          {!resumeFile ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#d4d4d8] hover:border-[#e11d48] bg-[#faf8f5] hover:bg-rose-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-white border-2 border-[#18181b] flex items-center justify-center text-[#e11d48] shadow-sm">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-[15px] font-bold text-[#141416]">
                  Click to upload or drag &amp; drop your resume
                </p>
                <p className="text-[12px] text-[#71717a]">
                  Supports PDF or Word DOCX (Up to 5MB) · Fully Optional
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50/60 border-2 border-emerald-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-[#141416]">{resumeFile.name}</h4>
                  <p className="text-[12px] text-emerald-800">
                    {formatFileSize(resumeFile.size)} · Ready for Gemini Project Analysis
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 bg-white border border-[#18181b] text-[12px] font-bold rounded-lg hover:bg-[#faf8f5]"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => setResumeFile(null)}
                  className="p-1 rounded-lg text-red-600 hover:bg-red-100"
                  title="Remove resume"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {fileError && (
            <p className="text-[12px] font-bold text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> {fileError}
            </p>
          )}
        </section>

        {/* =========================================================================
            START CHALLENGE BUTTON SECTION
        ========================================================================= */}
        <div className="text-center pt-4 pb-12 space-y-3">
          <button
            type="button"
            onClick={handleStartChallenge}
            disabled={isSubmitting}
            className="sketch-btn-red px-10 py-4 text-[18px] font-extrabold flex items-center gap-3 mx-auto cursor-pointer shadow-lg active:scale-98 transition-transform disabled:opacity-50"
          >
            <Zap className="w-5 h-5 text-white" />
            <span>Start AI Interview Challenge</span>
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <p className="text-[13px] text-[#71717a]">
            Questions are generated one-by-one by Google Gemini and dynamically adapt to your answers.
          </p>
        </div>
      </main>

      {/* =========================================================================
          LOADING MODAL OVERLAY
      ========================================================================= */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#faf8f5] sketch-card p-8 text-center space-y-6 animate-scaleUp">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#e11d48] text-white flex items-center justify-center border-2 border-[#18181b] shadow-[4px_4px_0px_#18181b]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-2">
              <h3 className="text-[20px] font-black text-[#141416]">
                Initializing AI Interview Chamber
              </h3>
              <p className="text-[14px] font-bold text-[#e11d48] min-h-[24px]">
                {LOADING_STEPS[loadingStepIndex]}
              </p>
              <p className="text-[12px] text-[#71717a]">
                Preparing personalized technical screening for &ldquo;{isCustomGoal ? customGoalText : selectedGoal}&rdquo;...
              </p>
            </div>

            <div className="w-full bg-[#e5e7eb] h-2 rounded-full overflow-hidden border border-[#18181b]">
              <div
                className="bg-[#e11d48] h-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(95, ((loadingStepIndex + 1) / LOADING_STEPS.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
