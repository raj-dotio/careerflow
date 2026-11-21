import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Video,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Award,
  Coffee,
  Brain,
  GraduationCap,
  Flame,
  CheckCircle2,
  Send,
  Bot,
  MessageSquare,
  Compass,
} from 'lucide-react';

import femaleAiVideo from '../assets/videos/female-ai.mp4';
import maleAiVideo from '../assets/videos/male-ai.mp4';
import logo2 from '../assets/new2.png';

// Types
type CompanyId = 'google' | 'microsoft' | 'amazon' | 'stripe';

interface FlyingCap {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  speed: number;
}

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  // Video interviewer state
  const [selectedGender, setSelectedGender] = useState<'female' | 'male'>('female');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Simulation milestone tab
  const [activeMilestone, setActiveMilestone] = useState<number>(1);

  // Interactive ATS Bullet Redline demo
  const [activeBulletIndex, setActiveBulletIndex] = useState(0);
  const [customBullet, setCustomBullet] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedResult, setOptimizedResult] = useState<string | null>(null);

  // Floating scholar hats celebration state
  const [tossedCaps, setTossedCaps] = useState<FlyingCap[]>([]);
  const [streakCount, setStreakCount] = useState(14);
  const [solvedCount, setSolvedCount] = useState(1650);

  // Interactive Quiz challenge state
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Company track
  const [selectedCompany, setSelectedCompany] = useState<CompanyId>('google');

  // Parallax scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Toss Graduation Caps Fun Interaction
  const handleTossCaps = () => {
    const newCaps: FlyingCap[] = Array.from({ length: 14 }).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 90 + 5, // percent
      y: 90 + Math.random() * 20,
      rotation: Math.random() * 70 - 35,
      scale: 0.75 + Math.random() * 0.5,
      speed: 1.5 + Math.random() * 2,
    }));
    setTossedCaps(newCaps);

    // Increase solved counter & streak for student engagement
    setSolvedCount((prev) => prev + 10);
    setStreakCount((prev) => prev + 1);

    setTimeout(() => {
      setTossedCaps([]);
    }, 4500);
  };

  // Preset student resume bullet points
  const sampleBullets = [
    {
      original: 'Built a web application for student attendance and handled API requests.',
      optimized:
        'Engineered an automated student attendance portal with React & Go microservices, reducing manual logging time by 82% across 3,400 daily campus check-ins.',
      role: 'Full-Stack SDE',
      gain: '+24% ATS Match',
    },
    {
      original: 'Worked on database queries and made endpoints run faster.',
      optimized:
        'Profiled PostgreSQL execution plans and implemented Redis cluster caching, slashing p99 database response latency from 320ms to 48ms under simulated 10k RPS load.',
      role: 'Backend Systems',
      gain: '+31% ATS Match',
    },
    {
      original: 'Helped teammates with machine learning models for sentiment analysis.',
      optimized:
        'Trained and quantized BERT sentiment transformers using PyTorch, achieving 94.2% test accuracy and reducing cloud inference cost by $1,200/month.',
      role: 'AI / ML Engineer',
      gain: '+28% ATS Match',
    },
  ];

  const handleRunOptimizer = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setOptimizedResult(
        customBullet.trim().length > 0
          ? `Engineered high-throughput architecture for "${customBullet.trim()}", driving 45% measurable performance lift and zero-downtime deployment verified across campus cohorts.`
          : sampleBullets[activeBulletIndex].optimized
      );
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] paper-texture text-[#141416] font-sans antialiased selection:bg-[#e11d48] selection:text-white relative overflow-x-hidden">
      {/* =========================================================================
          BACKGROUND PARALLAX SCROLL ELEMENTS (FLOATING BOOKS & SCHOLAR HATS)
      ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {/* Floating Scholar Hat 1 (Top Left) */}
        <div
          className="absolute left-[3%] top-[14%] transition-transform duration-300 ease-out opacity-85"
          style={{
            transform: `translate3d(0, ${scrollY * 0.18}px, 0) rotate(${12 + scrollY * 0.03}deg)`,
          }}
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 text-[#18181b] animate-float-gentle drop-shadow-md">
            <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
              {/* Mortarboard Diamond */}
              <polygon
                points="50,15 92,34 50,53 8,34"
                fill="#18181b"
                stroke="#18181b"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <polygon points="50,22 82,35 50,47 18,35" fill="#2d3748" />
              {/* Cap Skull Underneath */}
              <path
                d="M26,43 L26,62 C26,73 74,73 74,62 L74,43"
                fill="#18181b"
                stroke="#18181b"
                strokeWidth="2"
              />
              {/* Tassel */}
              <circle cx="50" cy="34" r="3.5" fill="#e11d48" />
              <path
                d="M50,34 Q62,42 66,54 L66,68"
                fill="none"
                stroke="#e11d48"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <rect x="63" y="66" width="6" height="12" rx="2" fill="#e11d48" />
            </svg>
          </div>
          <span className="font-hand text-[14px] text-[#e11d48] font-bold block -mt-1 ml-3 transform -rotate-6">
            placement goal
          </span>
        </div>

        {/* Floating Open Book 1 (Top Right) */}
        <div
          className="absolute right-[4%] top-[22%] transition-transform duration-300 ease-out opacity-80"
          style={{
            transform: `translate3d(0, ${scrollY * -0.12}px, 0) rotate(${-15 + scrollY * -0.02}deg)`,
          }}
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 text-[#18181b] animate-float-reverse drop-shadow-md">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Left Page */}
              <path
                d="M50,75 C35,66 18,68 12,71 L12,32 C18,29 35,27 50,36 Z"
                fill="#ffffff"
                stroke="#18181b"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Right Page */}
              <path
                d="M50,75 C65,66 82,68 88,71 L88,32 C82,29 65,27 50,36 Z"
                fill="#ffffff"
                stroke="#18181b"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Spine */}
              <path d="M50,36 L50,76" stroke="#18181b" strokeWidth="2.5" />
              {/* Code Lines on Left Page */}
              <line x1="20" y1="40" x2="42" y2="40" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
              <line x1="20" y1="48" x2="38" y2="48" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
              <line x1="20" y1="56" x2="44" y2="56" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
              {/* Code Lines on Right Page */}
              <line x1="58" y1="40" x2="80" y2="40" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />
              <line x1="58" y1="48" x2="76" y2="48" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
              <line x1="58" y1="56" x2="72" y2="56" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
              {/* Red bookmark ribbon */}
              <path d="M50,76 L50,88 L46,84 L42,88 L42,76" fill="#e11d48" stroke="#18181b" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="font-hand text-[13px] text-[#18181b] font-bold block ml-2">
            algorithms
          </span>
        </div>

        {/* Floating Scholar Hat 2 (Mid-Page Left) */}
        <div
          className="absolute left-[2%] top-[56%] transition-transform duration-300 ease-out opacity-85"
          style={{
            transform: `translate3d(0, ${scrollY * 0.1}px, 0) rotate(${scrollY * 0.04 - 8}deg)`,
          }}
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 text-[#18181b] animate-float-reverse drop-shadow-md">
            <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
              <polygon points="50,16 90,34 50,52 10,34" fill="#18181b" stroke="#18181b" strokeWidth="2.5" />
              <polygon points="50,23 80,35 50,46 20,35" fill="#2d3748" />
              <path d="M28,42 L28,60 C28,70 72,70 72,60 L72,42" fill="#18181b" stroke="#18181b" strokeWidth="2" />
              <circle cx="50" cy="34" r="3" fill="#e11d48" />
              <path d="M50,34 Q64,44 68,56 L68,66" fill="none" stroke="#e11d48" strokeWidth="2.5" />
              <rect x="65" y="64" width="6" height="10" rx="1.5" fill="#e11d48" />
            </svg>
          </div>
        </div>

        {/* Floating Stack of Books (Mid-Page Right) */}
        <div
          className="absolute right-[3%] top-[68%] transition-transform duration-300 ease-out opacity-80"
          style={{
            transform: `translate3d(0, ${scrollY * -0.09}px, 0) rotate(${10 + scrollY * 0.02}deg)`,
          }}
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 text-[#18181b] animate-float-gentle drop-shadow-md">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Bottom Book */}
              <rect x="15" y="60" width="70" height="15" rx="3" fill="#e11d48" stroke="#18181b" strokeWidth="2.5" />
              <rect x="20" y="63" width="60" height="9" rx="1" fill="#ffffff" />
              {/* Middle Book */}
              <rect x="20" y="44" width="62" height="14" rx="3" fill="#ffffff" stroke="#18181b" strokeWidth="2.5" />
              <line x1="28" y1="51" x2="72" y2="51" stroke="#18181b" strokeWidth="2" strokeDasharray="3 2" />
              {/* Top Book (tilted) */}
              <g transform="rotate(-6 30 30)">
                <rect x="22" y="28" width="58" height="14" rx="3" fill="#3b82f6" stroke="#18181b" strokeWidth="2.5" />
                <rect x="26" y="31" width="50" height="8" rx="1" fill="#ffffff" />
              </g>
            </svg>
          </div>
          <span className="font-hand text-[13px] text-[#e11d48] font-bold block text-right pr-2">
            2:00 AM grind
          </span>
        </div>

        {/* Dynamic Tossed Graduation Caps Celebration */}
        {tossedCaps.map((cap) => (
          <div
            key={cap.id}
            className="absolute transition-all duration-1000 ease-out"
            style={{
              left: `${cap.x}%`,
              top: `${cap.y}%`,
              transform: `scale(${cap.scale}) rotate(${cap.rotation}deg)`,
              animation: 'scholarHatToss 3.5s cubic-bezier(0.25, 1, 0.5, 1) forwards',
            }}
          >
            <div className="w-14 h-14 drop-shadow-lg">
              <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                <polygon points="50,15 92,34 50,53 8,34" fill="#18181b" stroke="#18181b" strokeWidth="2.5" />
                <path d="M26,43 L26,62 C26,73 74,73 74,62 L74,43" fill="#18181b" stroke="#18181b" strokeWidth="2" />
                <circle cx="50" cy="34" r="3.5" fill="#e11d48" />
                <path d="M50,34 Q62,42 66,54 L66,68" fill="none" stroke="#e11d48" strokeWidth="2.5" />
                <rect x="63" y="66" width="6" height="12" rx="2" fill="#e11d48" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* =========================================================================
          1. TOP NAVIGATION BAR (Clean, Minimal, Transparent Header)
      ========================================================================= */}
      <header className="sticky top-0 z-50 pt-3 px-4 sm:px-6 pb-2.5 bg-[#faf8f5]/90 backdrop-blur-md">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo - Enlarged */}
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0"
          >
            <img src={logo2} alt="CareerFlow Logo" className="h-14 sm:h-16 md:h-20 w-auto object-contain" />
          </Link>

          {/* Central Navigation - Centered */}
          <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-8 text-[13.5px] lg:text-[14px] font-semibold text-[#3f3f46] mx-auto">
            <Link
              to="/roadmap"
              className="flex items-center gap-2 text-[#e11d48] hover:text-[#be123c] transition-colors whitespace-nowrap font-bold"
            >
              <Compass className="w-4 h-4 text-[#e11d48]" />
              <span>Learning Roadmap</span>
            </Link>
            <Link
              to="/builder"
              className="flex items-center gap-2 hover:text-[#e11d48] transition-colors whitespace-nowrap"
            >
              <FileText className="w-4 h-4 text-[#71717a]" />
              <span>Resume Builder</span>
            </Link>
            <Link
              to="/ats"
              className="flex items-center gap-2 hover:text-[#e11d48] transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-[#71717a]" />
              <span>ATS Diagnostics</span>
            </Link>
            <Link
              to="/goals"
              className="flex items-center gap-2 hover:text-[#e11d48] transition-colors whitespace-nowrap font-bold"
            >
              <Flame className="w-4 h-4 text-[#e11d48]" />
              <span>Daily Streaks</span>
            </Link>
            <Link
              to="/mock-chamber"
              className="flex items-center gap-2 text-[#e11d48] hover:text-[#be123c] transition-colors whitespace-nowrap font-bold"
            >
              <Bot className="w-4 h-4 text-[#e11d48]" />
              <span>AI Mock Chamber</span>
            </Link>
            <a
              href="#student-quiz"
              className="flex items-center gap-2 hover:text-[#e11d48] transition-colors whitespace-nowrap"
            >
              <Zap className="w-4 h-4 text-[#71717a]" />
              <span>Quick Challenge</span>
            </a>
          </nav>

          {/* Balanced right spacer matching logo size for clean centering */}
          <div className="hidden md:block shrink-0 opacity-0 pointer-events-none select-none" aria-hidden="true">
            <img src={logo2} alt="" className="h-12 sm:h-14 md:h-16 w-auto object-contain" />
          </div>
        </div>

        {/* THE RED THREAD OF PLACEMENT FATE (Wavy Line from Reference Images 1 & 4) */}
        <div className="max-w-[1140px] mx-auto mt-2 overflow-hidden h-3">
          <svg viewBox="0 0 1200 12" className="w-full text-[#e11d48] opacity-90">
            <path
              d="M0,6 Q150,12 300,5 T600,6 T900,4 T1200,6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </header>

      {/* =========================================================================
          2. HERO SECTION: "HOW ONE STUDENT REACHES THE OFFER"
      ========================================================================= */}
      <section className="pt-10 pb-16 px-4">
        <div className="max-w-[1080px] mx-auto text-center relative z-20">
          {/* Hand-drawn editorial category badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white sketch-border-sm text-[13px] font-bold text-[#141416] mb-5 transform -rotate-1">
            <Flame className="w-4 h-4 text-[#e11d48]" />
            <span>Campus Placement Simulator · {streakCount}-Day Campus Streak Active</span>
          </div>

          <h1 className="text-[40px] sm:text-[62px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#141416] max-w-4xl mx-auto">
            When a student opens CareerFlow, we run their career forward.
          </h1>

          <p className="mt-5 text-[18px] sm:text-[22px] leading-[1.4] text-[#4b5563] max-w-2xl mx-auto font-medium">
            Not one placement outcome. <span className="text-[#e11d48] font-bold">Ten thousand of them</span>, each a little different.
            From the midnight debug to the graduation cap in the air.
          </p>

          {/* Main Action Sketched Red Button with Icon Logo */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/goals"
              className="sketch-btn-red px-7 py-3.5 text-[17px] flex items-center gap-2.5 cursor-pointer shadow-md hover:scale-102 transition-transform"
            >
              <Flame className="w-5 h-5 fill-white text-white animate-bounce" />
              <span>Daily Streak &amp; Goals Matrix</span>
            </Link>

            <Link
              to="/roadmap"
              className="sketch-btn-white px-6 py-3.5 text-[16px] flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <Compass className="w-4 h-4 text-[#e11d48]" />
              <span>Personalized Learning Roadmap</span>
            </Link>

            <Link
              to="/builder"
              className="sketch-btn-white px-6 py-3.5 text-[16px] flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <FileText className="w-4 h-4 text-[#e11d48]" />
              <span>Reactive Resume Builder</span>
            </Link>

            <Link
              to="/ats"
              className="sketch-btn-white px-6 py-3.5 text-[16px] flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-[#e11d48]" />
              <span>ATS Diagnostics</span>
              <ChevronRight className="w-4 h-4 text-[#e11d48]" />
            </Link>

            <Link
              to="/mock-chamber"
              className="sketch-btn-white px-6 py-3.5 text-[16px] flex items-center gap-2 cursor-pointer bg-white border-2 border-[#18181b] hover:bg-[#fff1f2]"
            >
              <Bot className="w-4 h-4 text-[#e11d48]" />
              <span>Enter AI Mock Chamber</span>
              <ChevronRight className="w-4 h-4 text-[#e11d48]" />
            </Link>
          </div>

          {/* Handwritten Annotation Note */}
          <div className="mt-4 flex justify-center items-center gap-2">
            <span className="font-hand text-[17px] text-[#e11d48] font-bold transform -rotate-2">
              ✨ 84.6% students secure Tier-1 tech offers after 30 days
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. SIX SKETCH CARDS (Modeled on Akai Ito Reference Image 1)
      ========================================================================= */}
      <section id="journey" className="py-12 px-4 relative z-20">
        <div className="max-w-[1080px] mx-auto">
          <div className="text-left mb-6">
            <div className="flex items-center gap-2">
              <span className="font-hand text-[22px] text-[#e11d48] font-bold">Phase by phase</span>
              <span className="text-[14px] text-[#6b7280]">· How preparation bends and breaks</span>
            </div>
            <h2 className="text-[28px] sm:text-[36px] font-extrabold tracking-tight text-[#141416]">
              Six milestones between you and your dream offer
            </h2>
          </div>

          {/* 3x2 Grid of Sketched Border Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 01 */}
            <div className="sketch-card p-6 flex flex-col justify-between">
              <div>
                <span className="text-[13px] font-mono font-bold text-[#e11d48] block mb-2">01</span>
                <div className="w-9 h-9 text-[#e11d48] mb-3">
                  <Coffee className="w-8 h-8" />
                </div>
                <h3 className="text-[20px] font-extrabold text-[#141416] mb-2 tracking-tight">
                  A world is coded
                </h3>
                <p className="text-[14px] leading-[1.5] text-[#4b5563]">
                  Data structures, syntax bugs, caffeine, and test cases are rolled fresh for every semester. One life starts with Python in a dorm room. Another starts with raw C pointers.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t-2 border-dashed border-[#e5e7eb] flex justify-between items-center text-[12px] font-mono text-[#6b7280]">
                <span>CAMPUS DAY 01</span>
                <span className="text-[#e11d48] font-bold">400+ Problems</span>
              </div>
            </div>

            {/* Card 02 */}
            <div className="sketch-card p-6 flex flex-col justify-between">
              <div>
                <span className="text-[13px] font-mono font-bold text-[#e11d48] block mb-2">02</span>
                <div className="w-9 h-9 text-[#e11d48] mb-3">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-[20px] font-extrabold text-[#141416] mb-2 tracking-tight">
                  The resume moves in
                </h3>
                <p className="text-[14px] leading-[1.5] text-[#4b5563]">
                  Your resume carries everything you learned: how you debugged microservices, what hackathons you won, when you stayed up till 4 AM. Recruiter ATS algorithms judge it in 1.4 seconds.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t-2 border-dashed border-[#e5e7eb] flex justify-between items-center text-[12px] font-mono text-[#6b7280]">
                <span>ATS COMPLIANCE</span>
                <span className="text-[#e11d48] font-bold">96% Passed</span>
              </div>
            </div>

            {/* Card 03 */}
            <div className="sketch-card p-6 flex flex-col justify-between">
              <div>
                <span className="text-[13px] font-mono font-bold text-[#e11d48] block mb-2">03</span>
                <div className="w-9 h-9 text-[#e11d48] mb-3">
                  <Video className="w-8 h-8" />
                </div>
                <h3 className="text-[20px] font-extrabold text-[#141416] mb-2 tracking-tight">
                  Technical round happens
                </h3>
                <p className="text-[14px] leading-[1.5] text-[#4b5563]">
                  System design, concurrency locks, dynamic programming, Redis partitions. Each simulation runs a 45-minute live technical interview with AI avatars. We watch where your explanation bends and where it breaks.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t-2 border-dashed border-[#e5e7eb] flex justify-between items-center text-[12px] font-mono text-[#6b7280]">
                <span>EVALUATION HUD</span>
                <span className="text-[#e11d48] font-bold">Adaptive AI</span>
              </div>
            </div>

            {/* Card 04 */}
            <div className="sketch-card p-6 flex flex-col justify-between">
              <div>
                <span className="text-[13px] font-mono font-bold text-[#e11d48] block mb-2">04</span>
                <div className="w-9 h-9 text-[#e11d48] mb-3">
                  <Brain className="w-8 h-8" />
                </div>
                <h3 className="text-[20px] font-extrabold text-[#141416] mb-2 tracking-tight">
                  Every answer is scored
                </h3>
                <p className="text-[14px] leading-[1.5] text-[#4b5563]">
                  Not memorization. Recovery: how fast you recognize an edge case after the interviewer probes. How articulately you discuss trade-offs under high pressure. That is what predicts the hire.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t-2 border-dashed border-[#e5e7eb] flex justify-between items-center text-[12px] font-mono text-[#6b7280]">
                <span>METRICS</span>
                <span className="text-[#e11d48] font-bold">134 WPM Pace</span>
              </div>
            </div>

            {/* Card 05 */}
            <div className="sketch-card p-6 flex flex-col justify-between">
              <div>
                <span className="text-[13px] font-mono font-bold text-[#e11d48] block mb-2">05</span>
                <div className="w-9 h-9 text-[#e11d48] mb-3">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-[20px] font-extrabold text-[#141416] mb-2 tracking-tight">
                  Ten thousand times over
                </h3>
                <p className="text-[14px] leading-[1.5] text-[#4b5563]">
                  A candidate has to survive at least 9 rounds out of 10. You and CareerFlow simulate 4,200 variations. Fewer than one in fifty campus applicants get this prepared.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t-2 border-dashed border-[#e5e7eb] flex justify-between items-center text-[12px] font-mono text-[#6b7280]">
                <span>SIMULATION PROBABILITY</span>
                <span className="text-[#e11d48] font-bold">84.6% Cleared</span>
              </div>
            </div>

            {/* Card 06 */}
            <div className="sketch-card p-6 flex flex-col justify-between bg-[#fef2f2]/60">
              <div>
                <span className="text-[13px] font-mono font-bold text-[#e11d48] block mb-2">06</span>
                <div className="w-9 h-9 text-[#e11d48] mb-3">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-[20px] font-extrabold text-[#141416] mb-2 tracking-tight">
                  Then the offer drops
                </h3>
                <p className="text-[14px] leading-[1.5] text-[#4b5563]">
                  The simulation ends where your real professional career begins. You get an engineering team, a signing bonus, and a joining date. The scholar hat flies into the air.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t-2 border-dashed border-[#e5e7eb] flex justify-between items-center text-[12px] font-mono text-[#6b7280]">
                <span>FINAL STAGE</span>
                <span className="text-[#e11d48] font-bold">Offer Letter</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. MAIN INTERACTIVE SIMULATION STUDIO (Modeled on Akai Ito Ref 2, 4, 5)
      ========================================================================= */}
      <section id="simulation" className="py-16 px-4 relative z-20">
        <div className="max-w-[1080px] mx-auto">
          {/* Section banner */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="font-hand text-[20px] text-[#e11d48] font-bold">Live Student Cockpit</span>
              <h2 className="text-[32px] sm:text-[44px] font-extrabold tracking-tight text-[#141416]">
                The Placement Simulation Chamber
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-black text-white rounded-full text-[12px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#e11d48] animate-ping" />
              <span>Scroll to drop · sweep to scatter</span>
            </div>
          </div>

          {/* Two-Column Studio Layout with Hand-drawn Comic Borders */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT PANEL: Telemetry, Scores & Squiggly Brainwave (Like Reference Image 4) */}
            <div className="lg:col-span-5 sketch-card p-6 sm:p-7 space-y-6">
              {/* Header */}
              <div className="border-b-2 border-dashed border-[#e5e7eb] pb-4">
                <div className="flex items-center justify-between text-[13px] font-mono text-[#6b7280]">
                  <span className="text-[#e11d48] font-bold flex items-center gap-1.5">
                    <span>⚡</span> Simulation · You × Target FAANG
                  </span>
                  <span>COHORT #2026</span>
                </div>

                <div className="mt-4">
                  <div className="text-[36px] sm:text-[42px] font-extrabold text-[#141416] tracking-tight leading-none">
                    {solvedCount.toLocaleString()} / 2,000
                  </div>
                  <div className="text-[13px] text-[#6b7280] font-medium mt-1">
                    Questions &amp; System Architecture Scenarios Cleared
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[52px] font-extrabold text-[#141416] leading-none tracking-tight">
                      84.6%
                    </span>
                    <span className="text-[13px] font-mono font-bold text-[#e11d48]">
                      +4.2% system design went well
                    </span>
                  </div>

                  {/* Red Sketched Progress Bar */}
                  <div className="w-full h-3 bg-[#e5e7eb] rounded-full mt-2 p-0.5 border border-[#18181b] overflow-hidden">
                    <div
                      className="h-full bg-[#e11d48] rounded-full transition-all duration-500"
                      style={{ width: '84.6%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Hand-Drawn Brainwave / Heartbeat Squiggle (As in Reference 2 & 4) */}
              <div className="py-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#6b7280] mb-1">
                  <span>PRESSURE TELEMETRY</span>
                  <span className="text-[#e11d48]">NORMALIZED</span>
                </div>
                <svg viewBox="0 0 320 30" className="w-full text-[#18181b] overflow-visible">
                  <path
                    d="M0,15 L40,15 L50,6 L60,24 L70,8 L80,18 L90,15 L140,15 L148,2 L158,28 L168,10 L178,22 L188,15 L250,15 L260,7 L270,23 L280,15 L320,15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Interactive Milestone Checkpoints (Clickable) */}
              <div className="space-y-2 text-[14px]">
                {[
                  { id: 1, title: 'The Midnight Dynamic Programming', score: 96, tag: '02:14 AM' },
                  { id: 2, title: 'The Distributed Cache Stampede', score: 91, tag: 'System Design', active: true },
                  { id: 3, title: 'Concurrency & Deadlock Triage', score: 99, tag: 'Hard' },
                  { id: 4, title: 'Behavioral STAR: Handling Failures', score: 88, tag: 'Bar Raiser' },
                  { id: 5, title: 'The Offer Letter Milestone', score: 98, tag: 'Scholar Hat' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveMilestone(item.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-[10px] text-left transition-all ${
                      activeMilestone === item.id
                        ? 'bg-[#fef2f2] border-2 border-[#18181b] font-bold shadow-xs'
                        : 'hover:bg-[#f4f4f5] text-[#4b5563]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${activeMilestone === item.id ? 'bg-[#e11d48]' : 'bg-[#d1d5db]'}`} />
                      <span className={activeMilestone === item.id ? 'text-[#e11d48] underline underline-offset-4' : ''}>
                        {item.title}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[13px] text-[#141416]">{item.score}</span>
                  </button>
                ))}
              </div>

              {/* Bottom CTA Button */}
              <button
                onClick={handleTossCaps}
                className="w-full sketch-btn-red py-3 text-[15px] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-white" />
                <span>Run 100 More Practice Rounds</span>
              </button>
            </div>

            {/* RIGHT PANEL: Illustrated Student Study Frame + Embedded Video Evaluator */}
            <div className="lg:col-span-7 sketch-card p-6 sm:p-7 relative bg-white">
              {/* Illustrated Photo Frame Title Bar (Modeled on Akai Ito Ref 2 & 5) */}
              <div className="flex items-center justify-between mb-4 border-b-2 border-dashed border-[#e5e7eb] pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-[#fef2f2] text-[#e11d48] sketch-border-sm text-[12px] font-mono font-bold">
                    Friday · 11:42 PM
                  </span>
                  <span className="text-[13px] font-bold text-[#141416]">Hostel Room Study Chamber</span>
                </div>

                {/* Avatar Switcher */}
                <div className="flex items-center gap-1.5 bg-[#f4f4f5] p-1 rounded-full border border-[#18181b]">
                  <button
                    onClick={() => setSelectedGender('female')}
                    className={`px-3 py-1 rounded-full text-[12px] font-bold transition-all ${
                      selectedGender === 'female' ? 'bg-[#e11d48] text-white shadow-xs' : 'text-[#6b7280]'
                    }`}
                  >
                    Claire (AI)
                  </button>
                  <button
                    onClick={() => setSelectedGender('male')}
                    className={`px-3 py-1 rounded-full text-[12px] font-bold transition-all ${
                      selectedGender === 'male' ? 'bg-[#e11d48] text-white shadow-xs' : 'text-[#6b7280]'
                    }`}
                  >
                    David (AI)
                  </button>
                </div>
              </div>

              {/* Comic-Bordered Main Screen Frame */}
              <div className="sketch-border-lg overflow-hidden bg-black relative group aspect-video sm:aspect-4/3 max-h-[420px] flex items-center justify-center">
                <video
                  ref={videoRef}
                  key={selectedGender}
                  src={selectedGender === 'female' ? femaleAiVideo : maleAiVideo}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Video controls */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleVideoPlayback}
                      className="w-8 h-8 rounded-full bg-white text-[#18181b] border-2 border-[#18181b] flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={toggleMute}
                      className="w-8 h-8 rounded-full bg-white text-[#18181b] border-2 border-[#18181b] flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="px-3 py-1 bg-black/80 backdrop-blur-md text-white text-[11px] font-mono rounded-full border border-white/20">
                    REALTIME AUDIO FEEDBACK · 142ms
                  </div>
                </div>

                {/* Hand-Drawn Manga Title Card inside the video frame (Like "The IKEA thing.") */}
                <div className="absolute top-4 left-4 bg-white text-[#141416] sketch-border-sm px-3.5 py-1.5 transform -rotate-2 shadow-md">
                  <span className="font-extrabold text-[15px] sm:text-[17px] tracking-tight">
                    {activeMilestone === 1 && 'The 2:00 AM breakthrough.'}
                    {activeMilestone === 2 && 'The Distributed cache question.'}
                    {activeMilestone === 3 && 'Handling the edge-case lock.'}
                    {activeMilestone === 4 && 'The STAR behavioral story.'}
                    {activeMilestone === 5 && 'The graduation cap moment.'}
                  </span>
                </div>
              </div>

              {/* Student Dialogue / AI Follow-up Speech Box */}
              <div className="mt-5 p-4 bg-[#faf8f5] sketch-border-sm">
                <div className="flex items-center gap-2 text-[12px] font-mono text-[#e11d48] font-bold mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-[#e11d48]" />
                  <span>AI LEAD EVALUATOR</span>
                  <span className="text-[#6b7280]">· IIT BOMBAY COHORT BENCHMARK</span>
                </div>
                <p className="text-[14px] leading-relaxed text-[#141416] font-medium">
                  {activeMilestone === 1 &&
                    '"You just optimized O(N^2) brute force into an O(N log N) divide-and-conquer strategy. Walk me through the memory footprint of your recursion stack."'}
                  {activeMilestone === 2 &&
                    '"When 20,000 concurrent students try to reserve a test slot simultaneously, how will your token bucket prevent Redis replica lag from corrupting counts?"'}
                  {activeMilestone === 3 &&
                    '"Notice that mutex contention slows throughput. Can you convert this to optimistic lock-free CAS operations?"'}
                  {activeMilestone === 4 &&
                    '"Tell me about a project where your initial code completely failed 48 hours before submission, and how you recovered."'}
                  {activeMilestone === 5 &&
                    '"Outstanding depth across all 4 technical rounds. Your composite readiness index is 94.6%. Ready for Google L4."'}
                </p>
              </div>

              {/* Floating Action Badge */}
              <div className="mt-4 flex items-center justify-between text-[12px] text-[#6b7280]">
                <span>Student ID: CF-STU-2026-X</span>
                <span className="font-hand text-[15px] text-[#e11d48] font-bold">
                  ✨ Interactive voice &amp; code analysis active
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. INTERACTIVE ATS RESUME REDLINE LAB (STUDENT RESUME OPTIMIZER)
      ========================================================================= */}
      <section id="ats-redline" className="py-16 px-4 bg-[#ffffff] border-y-2 border-[#18181b]">
        <div className="max-w-[1080px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-hand text-[22px] text-[#e11d48] font-bold">Interactive Lab</span>
            <h2 className="text-[32px] sm:text-[44px] font-extrabold tracking-tight text-[#141416]">
              Turn vague bullet points into offer-magnet lines
            </h2>
            <p className="mt-2 text-[16px] text-[#4b5563]">
              Click a student bullet below or type your own to see CareerFlow's instant redline transformation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Preset Bullets + Input */}
            <div className="lg:col-span-5 space-y-4">
              <span className="text-[12px] font-mono font-bold text-[#6b7280] block">
                SELECT A SAMPLE RESUME BULLET:
              </span>

              {sampleBullets.map((bullet, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveBulletIndex(idx);
                    setOptimizedResult(null);
                    setCustomBullet('');
                  }}
                  className={`w-full p-3.5 text-left sketch-border-sm transition-all ${
                    activeBulletIndex === idx && !customBullet
                      ? 'bg-[#fef2f2] border-2 border-[#e11d48] font-bold shadow-xs'
                      : 'bg-white hover:bg-[#faf8f5]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#6b7280] mb-1">
                    <span>{bullet.role}</span>
                    <span className="text-[#e11d48] font-bold">{bullet.gain}</span>
                  </div>
                  <p className="text-[13px] text-[#141416] leading-snug">"{bullet.original}"</p>
                </button>
              ))}

              {/* Custom Input */}
              <div className="pt-2">
                <span className="text-[12px] font-mono font-bold text-[#6b7280] block mb-1">
                  OR TYPE YOUR OWN BULLET POINT:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customBullet}
                    onChange={(e) => setCustomBullet(e.target.value)}
                    placeholder="e.g. Made an e-commerce website with payment gateway..."
                    className="flex-1 px-3.5 py-2.5 text-[13px] bg-[#faf8f5] sketch-border-sm focus:outline-none"
                  />
                  <button
                    onClick={handleRunOptimizer}
                    disabled={isOptimizing}
                    className="sketch-btn-red px-4 py-2 text-[13px] font-bold flex items-center gap-1"
                  >
                    {isOptimizing ? '...' : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: The Redline Transformation Box (Hand-drawn comic paper) */}
            <div className="lg:col-span-7 sketch-card p-6 sm:p-7 bg-[#faf8f5] space-y-5">
              <div className="flex items-center justify-between border-b-2 border-dashed border-[#e5e7eb] pb-3">
                <span className="font-bold text-[15px] text-[#141416] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#e11d48]" />
                  Recruiter &amp; ATS Score Matrix
                </span>
                <span className="px-2.5 py-0.5 bg-[#e11d48] text-white text-[11px] font-mono font-bold rounded-full">
                  GOOGLE XYZ FORMULA
                </span>
              </div>

              {/* Original Line (Red strikethrough) */}
              <div className="p-3.5 rounded-[10px] bg-white border border-[#e5e7eb] text-[13px]">
                <span className="font-mono text-[11px] text-[#9ca3af] block mb-1">BEFORE (WEAK SIGNAL):</span>
                <p className="text-[#6b7280] line-through font-medium">
                  {customBullet.trim() || sampleBullets[activeBulletIndex].original}
                </p>
              </div>

              {/* Optimized Line (Hero green/black) */}
              <div className="p-4 rounded-[12px] bg-white sketch-border-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#e11d48] font-bold">
                    AFTER CAREERFLOW RE-ENGINEERING:
                  </span>
                  <span className="text-[12px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 99% ATS Pass Rate
                  </span>
                </div>

                <p className="text-[14px] sm:text-[15px] font-bold text-[#141416] leading-relaxed">
                  {optimizedResult || sampleBullets[activeBulletIndex].optimized}
                </p>
              </div>

              {/* Breakdown tags */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[12px]">
                <div className="p-2 bg-white rounded-[8px] border border-[#e5e7eb]">
                  <span className="text-[#6b7280] block text-[10px] font-mono">ACTION VERB</span>
                  <span className="font-bold text-[#141416]">Engineered</span>
                </div>
                <div className="p-2 bg-white rounded-[8px] border border-[#e5e7eb]">
                  <span className="text-[#6b7280] block text-[10px] font-mono">MEASURED METRIC</span>
                  <span className="font-bold text-[#e11d48]">82% Faster</span>
                </div>
                <div className="p-2 bg-white rounded-[8px] border border-[#e5e7eb]">
                  <span className="text-[#6b7280] block text-[10px] font-mono">SCALE PROOF</span>
                  <span className="font-bold text-[#141416]">3,400 Users</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. QUICK STUDENT CHALLENGE WIDGET (INTERACTIVE ENGAGEMENT)
      ========================================================================= */}
      <section id="student-quiz" className="py-16 px-4 relative z-20">
        <div className="max-w-[760px] mx-auto sketch-card p-6 sm:p-8 bg-white text-left">
          <div className="flex items-center justify-between border-b-2 border-dashed border-[#e5e7eb] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#e11d48]" />
              <span className="font-bold text-[14px] text-[#141416]">30-Second Placement Challenge</span>
            </div>
            <span className="font-mono text-[12px] text-[#e11d48] font-bold">+50 XP POINTS</span>
          </div>

          <h3 className="text-[19px] sm:text-[22px] font-extrabold text-[#141416] leading-snug">
            "Your database query takes 4.2 seconds because of table scans on 10 million student records. Which index strategy minimizes write overhead?"
          </h3>

          <div className="mt-5 space-y-2.5">
            {[
              { id: 1, text: 'A) Add single-column indexes on all 18 fields in the table.', correct: false },
              { id: 2, text: 'B) Create a Composite Index covering the query filter predicates in order of cardinality.', correct: true },
              { id: 3, text: 'C) Switch the entire table to MongoDB without indexing.', correct: false },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setQuizAnswer(option.id);
                  setQuizSubmitted(true);
                }}
                className={`w-full p-3.5 rounded-[10px] text-left text-[14px] sketch-border-sm transition-all ${
                  quizSubmitted && option.correct
                    ? 'bg-emerald-50 border-2 border-emerald-600 font-bold text-emerald-900'
                    : quizSubmitted && quizAnswer === option.id && !option.correct
                    ? 'bg-red-50 border-2 border-red-600 font-bold text-red-900'
                    : 'bg-[#faf8f5] hover:bg-white text-[#141416]'
                }`}
              >
                {option.text}
              </button>
            ))}
          </div>

          {quizSubmitted && (
            <div className="mt-4 p-4 rounded-[10px] bg-[#faf8f5] border border-[#18181b] flex items-center justify-between animate-fadeIn">
              <div className="text-[13px] text-[#141416]">
                <span className="font-bold block text-[#e11d48]">
                  {quizAnswer === 2 ? '✓ Brilliant! Composite indexing reduces B-Tree index bloat.' : '✗ Not quite: Over-indexing degrades write IOPS.'}
                </span>
                <span className="text-[#6b7280]">Target companies test this exact trade-off in Round 2.</span>
              </div>
              <button
                onClick={() => {
                  setQuizSubmitted(false);
                  setQuizAnswer(null);
                }}
                className="text-[12px] font-bold underline text-[#141416]"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          7. COMPANY REPUTATION TRACKS (GOOGLE, MICROSOFT, AMAZON, STRIPE)
      ========================================================================= */}
      <section className="py-14 px-4 bg-[#141416] text-white relative z-20">
        <div className="max-w-[1080px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-hand text-[20px] text-[#e11d48] font-bold">Curated Company Tracks</span>
            <h2 className="text-[32px] sm:text-[42px] font-extrabold tracking-tight text-white">
              Target firm evaluation rubrics
            </h2>
            <p className="mt-2 text-[16px] text-[#9ca3af]">
              Select your dream employer to see their exact interview focus.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {[
              { id: 'google', name: 'Google (L3/L4)' },
              { id: 'microsoft', name: 'Microsoft (SDE-1)' },
              { id: 'amazon', name: 'Amazon (AWS SDE)' },
              { id: 'stripe', name: 'Stripe (Backend)' },
            ].map((company) => (
              <button
                key={company.id}
                onClick={() => setSelectedCompany(company.id as CompanyId)}
                className={`px-5 py-2.5 rounded-full text-[14px] font-bold transition-all ${
                  selectedCompany === company.id
                    ? 'bg-[#e11d48] text-white shadow-md'
                    : 'bg-[#27272a] text-[#a1a1aa] hover:text-white border border-white/10'
                }`}
              >
                {company.name}
              </button>
            ))}
          </div>

          <div className="bg-[#1c1c1f] rounded-[18px] border-2 border-white/20 p-6 sm:p-8">
            {selectedCompany === 'google' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-[12px] bg-[#27272a] border border-white/10">
                  <span className="text-[12px] font-mono text-[#e11d48] font-bold">ROUND 1 & 2</span>
                  <h4 className="text-[18px] font-bold text-white mt-1">Data Structures & Big-O</h4>
                  <p className="text-[13px] text-[#9ca3af] mt-2 leading-relaxed">
                    Graph traversals (BFS/DFS), Topological Sort, Dynamic Programming with strict time/space limits.
                  </p>
                </div>
                <div className="p-4 rounded-[12px] bg-[#27272a] border border-white/10">
                  <span className="text-[12px] font-mono text-[#e11d48] font-bold">ROUND 3</span>
                  <h4 className="text-[18px] font-bold text-white mt-1">System Architecture</h4>
                  <p className="text-[13px] text-[#9ca3af] mt-2 leading-relaxed">
                    MapReduce pipelines, distributed key-value storage, and handling partial network failure.
                  </p>
                </div>
                <div className="p-4 rounded-[12px] bg-[#27272a] border border-white/10">
                  <span className="text-[12px] font-mono text-[#e11d48] font-bold">ROUND 4</span>
                  <h4 className="text-[18px] font-bold text-white mt-1">Googlyness Leadership</h4>
                  <p className="text-[13px] text-[#9ca3af] mt-2 leading-relaxed">
                    Navigating ambiguous requirements and demonstrating intellectual humility during code review.
                  </p>
                </div>
              </div>
            )}

            {selectedCompany === 'microsoft' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-[12px] bg-[#27272a] border border-white/10">
                  <span className="text-[12px] font-mono text-[#e11d48] font-bold">TECHNICAL</span>
                  <h4 className="text-[18px] font-bold text-white mt-1">Clean Modular Design</h4>
                  <p className="text-[13px] text-[#9ca3af] mt-2 leading-relaxed">
                    Separation of concerns, defensive programming against null pointers, and SOLID principles.
                  </p>
                </div>
                <div className="p-4 rounded-[12px] bg-[#27272a] border border-white/10">
                  <span className="text-[12px] font-mono text-[#e11d48] font-bold">SYSTEMS</span>
                  <h4 className="text-[18px] font-bold text-white mt-1">Cloud Resiliency</h4>
                  <p className="text-[13px] text-[#9ca3af] mt-2 leading-relaxed">
                    Asynchronous messaging queues, service bus retries, and high-availability database replication.
                  </p>
                </div>
                <div className="p-4 rounded-[12px] bg-[#27272a] border border-white/10">
                  <span className="text-[12px] font-mono text-[#e11d48] font-bold">CULTURE</span>
                  <h4 className="text-[18px] font-bold text-white mt-1">Growth Mindset</h4>
                  <p className="text-[13px] text-[#9ca3af] mt-2 leading-relaxed">
                    Active listening, learning from production incidents, and empathetic team collaboration.
                  </p>
                </div>
              </div>
            )}

            {selectedCompany === 'amazon' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-[12px] bg-[#27272a] border border-white/10">
                  <span className="text-[12px] font-mono text-[#e11d48] font-bold">LP FOCUS 1</span>
                  <h4 className="text-[18px] font-bold text-white mt-1">Customer Obsession</h4>
                  <p className="text-[13px] text-[#9ca3af] mt-2 leading-relaxed">
                    Working backwards from the customer problem before writing a single line of architecture.
                  </p>
                </div>
                <div className="p-4 rounded-[12px] bg-[#27272a] border border-white/10">
                  <span className="text-[12px] font-mono text-[#e11d48] font-bold">LP FOCUS 2</span>
                  <h4 className="text-[18px] font-bold text-white mt-1">Bias for Action</h4>
                  <p className="text-[13px] text-[#9ca3af] mt-2 leading-relaxed">
                    Calculated risk taking with two-way door decisions and rapid iterative prototyping.
                  </p>
                </div>
                <div className="p-4 rounded-[12px] bg-[#27272a] border border-white/10">
                  <span className="text-[12px] font-mono text-[#e11d48] font-bold">BAR RAISER</span>
                  <h4 className="text-[18px] font-bold text-white mt-1">Dive Deep</h4>
                  <p className="text-[13px] text-[#9ca3af] mt-2 leading-relaxed">
                    Inspecting low-level metrics, query execution logs, and verifying root causes.
                  </p>
                </div>
              </div>
            )}

            {selectedCompany === 'stripe' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-[12px] bg-[#27272a] border border-white/10">
                  <span className="text-[12px] font-mono text-[#e11d48] font-bold">CODING</span>
                  <h4 className="text-[18px] font-bold text-white mt-1">API Ergonomics</h4>
                  <p className="text-[13px] text-[#9ca3af] mt-2 leading-relaxed">
                    Crafting intuitive public SDKs, consistent error formats, and backwards-compatible data models.
                  </p>
                </div>
                <div className="p-4 rounded-[12px] bg-[#27272a] border border-white/10">
                  <span className="text-[12px] font-mono text-[#e11d48] font-bold">DISTRIBUTED</span>
                  <h4 className="text-[18px] font-bold text-white mt-1">Financial Invariants</h4>
                  <p className="text-[13px] text-[#9ca3af] mt-2 leading-relaxed">
                    Idempotency keys, atomic ledger transactions, and zero double-charge guarantees.
                  </p>
                </div>
                <div className="p-4 rounded-[12px] bg-[#27272a] border border-white/10">
                  <span className="text-[12px] font-mono text-[#e11d48] font-bold">DEBUGGING</span>
                  <h4 className="text-[18px] font-bold text-white mt-1">Production Triage</h4>
                  <p className="text-[13px] text-[#9ca3af] mt-2 leading-relaxed">
                    Live bug investigation inside a real codebase using terminal logs and unit test suites.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. FOOTER: EDITORIAL CAMPUS SIGN-OFF
      ========================================================================= */}
      <footer className="py-14 px-4 bg-[#faf8f5] border-t-2 border-[#18181b] relative z-20 text-[#6b7280]">
        <div className="max-w-[1080px] mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b-2 border-dashed border-[#e5e7eb]">
            <div className="flex items-center gap-3">
              <img src={logo2} alt="CareerFlow Logo" className="h-8 w-auto object-contain" />
              <span className="text-[12px] text-[#9ca3af]">· Campus Placement Intelligence Platform</span>
            </div>

            <button
              onClick={handleTossCaps}
              className="sketch-btn-red px-5 py-2 text-[14px] font-bold cursor-pointer flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4 text-white" />
              <span>Toss Hats Once More</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[12px] text-[#9ca3af] gap-4">
            <p>
              Copyright &copy; 2026 CareerFlow. Inspired by Akai Ito aesthetic &amp; built for ambitious engineering students.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-[#141416]">University Portals</a>
              <a href="#" className="hover:text-[#141416]">Student Privacy</a>
              <a href="#" className="hover:text-[#141416]">Placement Rubrics</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
