import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Award,
  Zap,
  Volume2,
  FileText,
  RotateCcw,
  Upload,
  X,
  FileCheck,
} from 'lucide-react';

import femaleAiVideo from '../assets/videos/female-ai.mp4';
import maleAiVideo from '../assets/videos/male-ai.mp4';
import logo2 from '../assets/new2.png';
import { previewVoice } from '../utils/speechUtils';

interface PastInterview {
  _id: string;
  role: string;
  experience: string;
  mode: string;
  interviewerGender: 'female' | 'male';
  finalScore: number;
  status: string;
  createdAt: string;
  questions?: any[];
}

export default function MockChamberLanding() {
  const navigate = useNavigate();

  // Setup Form State
  const [role, setRole] = useState('Full-Stack Engineer');
  const [experience, setExperience] = useState('Fresher / Entry-Level');
  const [mode, setMode] = useState<'Technical' | 'HR' | 'Mixed'>('Technical');
  const [interviewerGender, setInterviewerGender] = useState<'female' | 'male'>('female');
  const [techStackInput, setTechStackInput] = useState('React, Node.js, TypeScript, PostgreSQL, System Design');

  // Resume Context State (Optional)
  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeWordCount, setResumeWordCount] = useState(0);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeModeTab, setResumeModeTab] = useState<'upload' | 'paste'>('upload');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Past Interviews History State
  const [pastInterviews, setPastInterviews] = useState<PastInterview[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Video hover preview refs
  const femaleVideoRef = useRef<HTMLVideoElement | null>(null);
  const maleVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch('/api/mock-interview/my-interviews');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPastInterviews(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch interview history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Direct client text reading for plain text or markdown
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const text = await file.text();
      setResumeText(text);
      setResumeFileName(file.name);
      setResumeWordCount(text.trim().split(/\s+/).filter(Boolean).length);
      return;
    }

    // Server-side parser for PDF / DOCX
    try {
      setIsUploadingResume(true);
      setErrorMsg('');
      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch('/api/mock-interview/upload-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResumeText(data.text);
        setResumeFileName(data.filename);
        setResumeWordCount(data.wordCount);
      } else {
        throw new Error(data.message || 'Failed to extract text from resume');
      }
    } catch (err: any) {
      console.error('Resume upload error:', err);
      setErrorMsg(err.message || 'Failed to parse resume file. You can paste the text directly.');
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleRemoveResume = () => {
    setResumeText('');
    setResumeFileName('');
    setResumeWordCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartSession = async () => {
    setIsLoading(true);
    setErrorMsg('');

    const targetRole = role.trim() || 'Software Engineer';
    const techArray = techStackInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      const res = await fetch('/api/mock-interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: targetRole,
          experience,
          mode,
          interviewerGender,
          techStack: techArray,
          resumeText: resumeText.trim(),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let message = `Server error ${res.status}`;
        try {
          const parsed = JSON.parse(text);
          if (parsed.message) message = parsed.message;
        } catch {
          // not json
        }
        throw new Error(message);
      }

      const json = await res.json();
      if (json.success && json.interviewId) {
        // Store session parameters for live room
        sessionStorage.setItem(
          'activeInterviewSession',
          JSON.stringify({
            interviewId: json.interviewId,
            role: targetRole,
            experience,
            mode,
            interviewerGender,
            totalRounds: json.totalRounds || 5,
            questions: json.questions,
          })
        );
        navigate('/mock-chamber/room');
      } else {
        throw new Error(json.message || 'Failed to initialize session');
      }
    } catch (err: any) {
      console.error('Start interview error:', err);
      setErrorMsg(err.message || 'Unable to connect to AI chamber. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] paper-texture text-[#141416] font-sans antialiased selection:bg-[#e11d48] selection:text-white">
      {/* 1. TOP NAVIGATION */}
      <header className="sticky top-0 z-50 pt-3 px-4 sm:px-6 pb-2.5 bg-[#faf8f5]/90 backdrop-blur-md border-b border-[#e5e7eb]/80">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0">
            <img src={logo2} alt="CareerFlow Logo" className="h-11 sm:h-13 w-auto object-contain" />
          </Link>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[13.5px] lg:text-[14px] font-semibold text-[#3f3f46]">
            <Link to="/builder" className="hover:text-[#e11d48] transition-colors flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#71717a]" />
              <span>Resume Builder</span>
            </Link>
            <Link to="/ats" className="hover:text-[#e11d48] transition-colors flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#71717a]" />
              <span>ATS Diagnostics</span>
            </Link>
            <Link to="/mock-chamber" className="text-[#e11d48] font-bold flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#e11d48]" />
              <span>AI Mock Chamber</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/ats"
              className="px-3.5 py-1.5 bg-white text-[#141416] sketch-border-sm text-[12px] font-bold hover:bg-[#f4f4f5] transition-all whitespace-nowrap"
            >
              Check ATS Score
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO HEADER */}
      <section className="pt-10 pb-8 px-4 text-center max-w-[880px] mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e11d48]/10 text-[#e11d48] text-[12px] font-bold tracking-wider font-mono uppercase mb-4 border border-[#e11d48]/20">
          <Sparkles className="w-3.5 h-3.5 text-[#e11d48]" />
          <span>Interactive Voice & Video Simulation</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-[#141416] tracking-tight leading-tight">
          AI Mock Interview Chamber
        </h1>

        <p className="mt-3 text-[16px] sm:text-[18px] text-[#52525b] font-medium max-w-[680px] mx-auto leading-relaxed">
          Face hyper-realistic conversational interviews with animated avatars, synchronized voice speech, and instant
          actionable feedback on <span className="text-[#e11d48] font-bold">confidence</span>,{' '}
          <span className="text-[#e11d48] font-bold">communication</span>, and{' '}
          <span className="text-[#e11d48] font-bold">correctness</span>.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6 text-[12px] font-bold text-[#3f3f46]">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white sketch-border-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a]" />
            <span>Spoken Speech Recognition</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white sketch-border-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a]" />
            <span>5 Adaptive Progression Rounds</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white sketch-border-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a]" />
            <span>Placement Readiness Scorecard</span>
          </div>
        </div>
      </section>

      {/* 3. MAIN SETUP & AVATAR SELECTION GRID */}
      <section className="max-w-[1120px] mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 7 COLS: SETUP FORM */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-[16px] sketch-border shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5e7eb]">
              <div>
                <h2 className="text-[20px] font-black text-[#18181b]">Configure Your Mock Session</h2>
                <p className="text-[13px] text-[#71717a]">Tailor the difficulty, technical breadth, and questions</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#faf8f5] border border-[#e5e7eb] flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#e11d48]" />
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-[10px] bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-[13px] font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Target Role - Custom input + Quick templates */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-extrabold text-[#18181b] uppercase tracking-wide">
                  Target Job Role
                </label>
                <span className="text-[11px] text-[#71717a]">Type custom role or select template</span>
              </div>
              <div className="relative mb-2.5">
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Full-Stack Engineer, Android Developer, Cybersecurity Analyst..."
                  className="w-full px-3.5 py-2.5 rounded-[8px] border-2 border-[#18181b] text-[14px] font-bold bg-[#faf8f5] focus:bg-white focus:outline-none focus:border-[#e11d48] text-[#18181b]"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Full-Stack Engineer',
                  'Frontend Developer',
                  'Backend Engineer',
                  'AI / ML Engineer',
                  'DevOps & Cloud',
                  'Data Scientist',
                  'Mobile Engineer',
                  'Security Analyst',
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRole(item)}
                    className={`px-2.5 py-1 text-[11.5px] font-bold rounded-full border transition-all ${
                      role === item
                        ? 'bg-[#18181b] text-white border-[#18181b]'
                        : 'bg-white text-[#52525b] border-[#e4e4e7] hover:border-[#18181b]'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-[13px] font-extrabold text-[#18181b] mb-2 uppercase tracking-wide">
                Experience Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Fresher / Entry-Level', '1-2 Years Experience', '3+ Years Experienced'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setExperience(lvl)}
                    className={`px-3 py-2 text-[12.5px] font-bold rounded-[8px] border text-center transition-all ${
                      experience === lvl
                        ? 'bg-[#18181b] text-white border-[#18181b]'
                        : 'bg-[#faf8f5] text-[#3f3f46] border-[#e4e4e7] hover:border-[#a1a1aa]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Interview Mode */}
            <div>
              <label className="block text-[13px] font-extrabold text-[#18181b] mb-2 uppercase tracking-wide">
                Interview Focus Mode
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'Technical', label: 'Technical & Coding', desc: 'Algorithms, system design, tech stack' },
                  { id: 'HR', label: 'HR & Behavioral', desc: 'STAR format, conflict, leadership' },
                  { id: 'Mixed', label: 'Mixed Campus Mock', desc: 'Hybrid technical + cultural evaluation' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id as any)}
                    className={`p-3 rounded-[10px] border text-left transition-all ${
                      mode === item.id
                        ? 'bg-[#fef2f2] border-[#e11d48] text-[#141416] ring-1 ring-[#e11d48]'
                        : 'bg-[#faf8f5] border-[#e4e4e7] hover:border-[#a1a1aa]'
                    }`}
                  >
                    <div className="font-extrabold text-[13px]">{item.label}</div>
                    <div className="text-[11px] text-[#71717a] mt-0.5 leading-tight">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tech Stack / Topics */}
            <div>
              <label className="block text-[13px] font-extrabold text-[#18181b] mb-1.5 uppercase tracking-wide">
                Key Topics / Tech Stack (Comma Separated)
              </label>
              <input
                type="text"
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
                placeholder="e.g. React, Node.js, Go, Redis, Docker, PostgreSQL, Concurrency"
                className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#d4d4d8] text-[13.5px] bg-[#faf8f5] focus:bg-white focus:outline-none focus:border-[#e11d48]"
              />
              <p className="text-[11px] text-[#71717a] mt-1">
                The AI interviewer will adapt its questions directly around these specific technologies.
              </p>
            </div>

            {/* Resume & Project Details (Optional) */}
            <div className="p-4 rounded-[12px] bg-[#faf8f5] border border-[#e5e7eb] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#e11d48]" />
                    <span className="font-extrabold text-[13px] text-[#18181b] uppercase tracking-wide">
                      Resume & Project Profile
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Optional
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[#71717a] mt-0.5">
                    Works with or without resume. If added, AI derives questions directly from your actual projects and experience.
                  </p>
                </div>
                {resumeText && (
                  <button
                    type="button"
                    onClick={handleRemoveResume}
                    className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear Resume</span>
                  </button>
                )}
              </div>

              {/* Status Badge */}
              {resumeText ? (
                <div className="p-2.5 rounded-[8px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] font-medium flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {resumeFileName ? `File: ${resumeFileName} ` : 'Resume text loaded '}
                      ({resumeWordCount} words) · <strong>AI will tailor questions to your projects!</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-[#71717a] bg-white p-2 rounded-[6px] border border-[#e5e7eb]">
                  ⚡ No resume attached: General questions will be tailored to your <strong>{role || 'selected role'}</strong> & tech stack.
                </div>
              )}

              {/* Upload or Paste Tabs */}
              <div className="flex items-center gap-2 border-b border-[#e5e7eb] pb-2 text-[12px] font-bold">
                <button
                  type="button"
                  onClick={() => setResumeModeTab('upload')}
                  className={`pb-1 px-2 border-b-2 transition-all cursor-pointer ${
                    resumeModeTab === 'upload' ? 'border-[#e11d48] text-[#e11d48]' : 'border-transparent text-[#71717a]'
                  }`}
                >
                  Upload File (PDF / DOCX / TXT)
                </button>
                <button
                  type="button"
                  onClick={() => setResumeModeTab('paste')}
                  className={`pb-1 px-2 border-b-2 transition-all cursor-pointer ${
                    resumeModeTab === 'paste' ? 'border-[#e11d48] text-[#e11d48]' : 'border-transparent text-[#71717a]'
                  }`}
                >
                  Paste Text / Bullets
                </button>
              </div>

              {resumeModeTab === 'upload' ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    onChange={handleResumeFileUpload}
                    className="hidden"
                    id="resume-file-input"
                  />
                  <label
                    htmlFor="resume-file-input"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#d4d4d8] rounded-[8px] hover:border-[#e11d48] bg-white cursor-pointer transition-all text-center"
                  >
                    <Upload className="w-5 h-5 text-[#e11d48] mb-1" />
                    <span className="text-[12.5px] font-bold text-[#18181b]">
                      {isUploadingResume ? 'Analyzing & extracting resume...' : 'Click to upload your resume'}
                    </span>
                    <span className="text-[11px] text-[#71717a] mt-0.5">Supports PDF, DOCX, TXT or Markdown files</span>
                  </label>
                </div>
              ) : (
                <div>
                  <textarea
                    rows={4}
                    value={resumeText}
                    onChange={(e) => {
                      setResumeText(e.target.value);
                      setResumeWordCount(e.target.value.trim().split(/\s+/).filter(Boolean).length);
                    }}
                    placeholder="Paste key projects, work experience, or resume summary here. E.g.: Built a real-time analytics engine in Go and Redis handling 50k events/sec..."
                    className="w-full p-3 rounded-[8px] border border-[#d4d4d8] text-[12.5px] bg-white focus:outline-none focus:border-[#e11d48]"
                  />
                </div>
              )}
            </div>

            {/* Launch Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartSession}
                disabled={isLoading}
                className="w-full sketch-btn-red py-3.5 text-[15px] font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Synthesizing Interview Questions...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-white" />
                    <span>Enter Live Interview Room</span>
                    <ArrowRight className="w-4 h-4 text-white ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT 5 COLS: INTERVIEWER AVATAR SELECTION */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-[16px] sketch-border shadow-sm">
              <div className="pb-3 border-b border-[#e5e7eb] mb-4">
                <h3 className="text-[17px] font-black text-[#18181b]">Choose AI Interviewer</h3>
                <p className="text-[12.5px] text-[#71717a]">Select your AI interviewer avatar and conversational tone</p>
              </div>

              {/* TWO AVATAR CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {/* 1. Female Interviewer (Priya / Tech Lead) */}
                <div
                  onClick={() => setInterviewerGender('female')}
                  onMouseEnter={() => femaleVideoRef.current?.play()}
                  onMouseLeave={() => femaleVideoRef.current?.pause()}
                  className={`p-4 rounded-[14px] border-2 cursor-pointer transition-all ${
                    interviewerGender === 'female'
                      ? 'border-[#e11d48] bg-[#fef2f2]/60 shadow-md ring-2 ring-[#e11d48]/20'
                      : 'border-[#e5e7eb] bg-[#faf8f5] hover:border-[#d4d4d8]'
                  }`}
                >
                  <div className="relative aspect-video rounded-[10px] overflow-hidden bg-black border border-black/20 mb-3 shadow-inner">
                    <video
                      ref={femaleVideoRef}
                      src={femaleAiVideo}
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs">
                      <Volume2 className="w-3 h-3 text-[#e11d48]" />
                      <span>Female Voice (Kore)</span>
                    </div>
                    {interviewerGender === 'female' && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#e11d48] text-white text-[10px] font-black">
                        SELECTED
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-[15px] text-[#18181b]">Priya</h4>
                      <p className="text-[12px] text-[#52525b]">Principal Systems Architect · Tech Lead</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          previewVoice('female');
                        }}
                        className="mt-2 text-[11px] font-bold text-[#e11d48] hover:text-[#be123c] flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-white border border-[#e11d48]/30 hover:bg-[#fff1f2] transition-colors cursor-pointer"
                        title="Click to hear Priya's voice powered by Gemini TTS"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Test Priya's Voice 🔊</span>
                      </button>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        interviewerGender === 'female' ? 'border-[#e11d48] bg-[#e11d48]' : 'border-[#d4d4d8]'
                      }`}
                    >
                      {interviewerGender === 'female' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>

                {/* 2. Male Interviewer (Rahul / Engineering Director) */}
                <div
                  onClick={() => setInterviewerGender('male')}
                  onMouseEnter={() => maleVideoRef.current?.play()}
                  onMouseLeave={() => maleVideoRef.current?.pause()}
                  className={`p-4 rounded-[14px] border-2 cursor-pointer transition-all ${
                    interviewerGender === 'male'
                      ? 'border-[#e11d48] bg-[#fef2f2]/60 shadow-md ring-2 ring-[#e11d48]/20'
                      : 'border-[#e5e7eb] bg-[#faf8f5] hover:border-[#d4d4d8]'
                  }`}
                >
                  <div className="relative aspect-video rounded-[10px] overflow-hidden bg-black border border-black/20 mb-3 shadow-inner">
                    <video
                      ref={maleVideoRef}
                      src={maleAiVideo}
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs">
                      <Volume2 className="w-3 h-3 text-[#e11d48]" />
                      <span>Male Voice (Puck)</span>
                    </div>
                    {interviewerGender === 'male' && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#e11d48] text-white text-[10px] font-black">
                        SELECTED
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-[15px] text-[#18181b]">Rahul</h4>
                      <p className="text-[12px] text-[#52525b]">Director of Engineering · Pragmatic STAR Bar-Raiser</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          previewVoice('male');
                        }}
                        className="mt-2 text-[11px] font-bold text-[#18181b] hover:text-black flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-white border border-[#d4d4d8] hover:bg-[#f4f4f5] transition-colors cursor-pointer"
                        title="Click to hear Rahul's voice powered by Gemini TTS"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Test Rahul's Voice 🔊</span>
                      </button>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        interviewerGender === 'male' ? 'border-[#e11d48] bg-[#e11d48]' : 'border-[#d4d4d8]'
                      }`}
                    >
                      {interviewerGender === 'male' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions Box */}
              <div className="mt-5 p-3.5 rounded-[10px] bg-[#faf8f5] border border-[#e5e7eb] text-[12px] text-[#52525b] space-y-2 leading-relaxed">
                <div className="font-bold text-[#18181b] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#e11d48]" />
                  <span>How the Live Session Works</span>
                </div>
                <p>1. The AI interviewer will speak each question using natural text-to-speech audio.</p>
                <p>2. Speak your answer into your microphone or toggle text mode to type.</p>
                <p>3. Receive real-time scoring across confidence, clarity, and technical correctness.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. PAST INTERVIEW HISTORY SECTION */}
        <div className="mt-14 bg-white p-6 sm:p-8 rounded-[16px] sketch-border shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e7eb]">
            <div>
              <h3 className="text-[18px] font-black text-[#18181b] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#e11d48]" />
                <span>Your Past Mock Chamber History</span>
              </h3>
              <p className="text-[13px] text-[#71717a]">Review past performance scorecards and tracks</p>
            </div>
            <button
              onClick={fetchHistory}
              className="text-[12px] font-bold text-[#52525b] hover:text-[#18181b] flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh History</span>
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="py-12 text-center text-[#71717a] text-[14px]">Loading previous mock records...</div>
          ) : pastInterviews.length === 0 ? (
            <div className="py-12 text-center text-[#71717a] space-y-2">
              <Bot className="w-10 h-10 text-[#d4d4d8] mx-auto" />
              <p className="font-bold text-[#18181b] text-[15px]">No interviews completed yet</p>
              <p className="text-[13px]">Configure your session above and take your first AI mock interview today!</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f4f4f5] mt-2">
              {pastInterviews.map((item) => (
                <div key={item._id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#faf8f5]/60 px-3 rounded-[8px] transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-[15px] text-[#18181b]">{item.role}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#f4f4f5] text-[#52525b] text-[11px] font-bold uppercase font-mono">
                        {item.mode}
                      </span>
                      <span className="text-[11px] text-[#71717a]">
                        Avatar: {item.interviewerGender === 'female' ? 'Aria (Female)' : 'Marcus (Male)'}
                      </span>
                    </div>
                    <div className="text-[12px] text-[#71717a] flex items-center gap-3">
                      <span>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>•</span>
                      <span>Experience: {item.experience}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-[11px] font-bold text-[#71717a] uppercase tracking-wide">Overall Score</div>
                      <div className="text-[18px] font-black text-[#e11d48]">{item.finalScore || 0}%</div>
                    </div>
                    <Link
                      to={`/mock-chamber/report/${item._id}`}
                      className="px-3.5 py-1.5 bg-white sketch-border-sm text-[12px] font-bold text-[#141416] hover:bg-[#f4f4f5] transition-all flex items-center gap-1"
                    >
                      <span>View Report</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-4 bg-white border-t border-[#e5e7eb] text-center text-[12px] text-[#71717a]">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo2} alt="CareerFlow Logo" className="h-6 w-auto object-contain" />
            <span>AI Mock Chamber</span>
          </div>
          <p>© 2026 CareerFlow. Real-time Gemini placement simulation.</p>
        </div>
      </footer>
    </div>
  );
}
