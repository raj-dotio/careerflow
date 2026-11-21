import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Home as HomeIcon,
  ChevronDown,
  ChevronUp,
  Brain,
  MessageSquare,
  BookOpen,
  Printer,
  Loader2,
} from 'lucide-react';

interface QuestionEval {
  questionNumber: number;
  question: string;
  userAnswer: string;
  score: number;
  whatWentWell: string;
  whatWasMissing: string;
  howToImprove: string;
  idealAnswer: string;
}

interface FinalEvaluation {
  overallScore: number;
  performanceLevel: 'Outstanding' | 'Proficient' | 'Developing' | 'Needs Practice';
  performanceSummary: string;
  estimatedKnowledgeLevel: string;
  questionEvaluations: QuestionEval[];
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

interface ResultsSessionData {
  _id: string;
  goal: string;
  difficulty: string;
  questionCount: number;
  completedAt?: string;
  finalEvaluation: FinalEvaluation;
}

export default function ChallengeResults() {
  const { id } = useParams<{ id: string }>();

  const [session, setSession] = useState<ResultsSessionData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!id) return;

    const fetchResults = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/challenges/${id}/results`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to load challenge results.');
        }

        setSession(data.session);

        // Expand first question by default
        if (data.session?.finalEvaluation?.questionEvaluations?.length > 0) {
          setExpandedQuestions({ 1: true });
        }
      } catch (err: any) {
        console.error('Results fetch error:', err);
        setError(err.message || 'Could not load interview evaluation.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [id]);

  const toggleQuestion = (qNum: number) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qNum]: !prev[qNum],
    }));
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (score >= 70) return 'text-purple-700 bg-purple-50 border-purple-300';
    if (score >= 55) return 'text-blue-700 bg-blue-50 border-blue-300';
    return 'text-amber-700 bg-amber-50 border-amber-300';
  };

  const getPerformanceBadge = (level: string) => {
    switch (level) {
      case 'Outstanding':
        return 'bg-emerald-600 text-white';
      case 'Proficient':
        return 'bg-[#e11d48] text-white';
      case 'Developing':
        return 'bg-blue-600 text-white';
      case 'Needs Practice':
      default:
        return 'bg-amber-600 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6 text-center">
        <div className="sketch-card p-8 bg-white max-w-md w-full space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#e11d48] text-white flex items-center justify-center border border-[#18181b] animate-spin">
            <Loader2 className="w-6 h-6" />
          </div>
          <h2 className="text-[18px] font-bold text-[#141416]">Synthesizing AI Evaluation Report...</h2>
          <p className="text-[13px] text-[#71717a]">
            Compiling recruiter benchmarks, individual question redlines, and adaptive trajectories.
          </p>
        </div>
      </div>
    );
  }

  if (error || !session || !session.finalEvaluation) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6 text-center">
        <div className="sketch-card p-8 bg-white max-w-md w-full space-y-4">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
          <h2 className="text-[20px] font-bold text-[#141416]">Report Unavailable</h2>
          <p className="text-[13px] text-[#6b7280]">
            {error || 'The evaluation for this challenge could not be loaded.'}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/challenge/setup"
              className="sketch-btn-red px-5 py-2.5 text-[14px] inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Challenge</span>
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 bg-white border border-[#18181b] rounded-xl text-[14px] font-bold hover:bg-[#faf8f5]"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const evaluation = session.finalEvaluation;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#141416] font-sans antialiased selection:bg-[#e11d48] selection:text-white pb-16">
      {/* 1. Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e4e4e7] px-4 py-3 shadow-xs print:hidden">
        <div className="max-w-[1140px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-[6px] bg-[#e11d48] border border-[#18181b] flex items-center justify-center p-1 text-white">
                <GraduationCap className="w-full h-full" />
              </div>
              <span className="font-extrabold text-[16px] text-[#141416]">CareerFlow</span>
            </Link>
            <span className="text-[#a1a1aa]">/</span>
            <span className="font-semibold text-[13px] text-[#71717a]">
              Challenge Performance Report
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#d4d4d8] text-[#18181b] rounded-md text-[12px] font-bold hover:bg-[#f4f4f5] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#71717a]" />
              <span>Print Report</span>
            </button>

            <Link
              to="/challenge/setup"
              className="sketch-btn-red px-3.5 py-1.5 text-[12px] font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Challenge</span>
            </Link>

            <Link
              to="/"
              className="p-1.5 text-[#71717a] hover:text-[#141416] rounded-md hover:bg-[#faf8f5] border border-[#d4d4d8]"
              title="Home"
            >
              <HomeIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Report Container */}
      <main className="max-w-[1080px] mx-auto px-4 py-10 space-y-8">
        {/* =========================================================================
            HERO SCORE & EXECUTIVE SUMMARY
        ========================================================================= */}
        <div className="sketch-card p-6 sm:p-9 bg-white space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-dashed border-[#e5e7eb] pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-50 text-[#e11d48] border border-rose-200 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Verified by Google Gemini
              </div>
              <h1 className="text-[26px] sm:text-[34px] font-black text-[#141416] tracking-tight">
                {session.goal}
              </h1>
              <p className="text-[13px] text-[#71717a] mt-1">
                Completed {session.questionCount} adaptive technical questions · Baseline: {session.difficulty}
              </p>
            </div>

            {/* Score Pill / Visual */}
            <div className="flex items-center gap-4 bg-[#faf8f5] p-4 rounded-2xl border-2 border-[#18181b] shadow-[3px_3px_0px_#18181b] self-start sm:self-auto">
              <div className="text-center">
                <div className="text-[44px] font-black text-[#141416] leading-none">
                  {evaluation.overallScore}
                </div>
                <div className="text-[11px] font-mono font-bold text-[#71717a] mt-1">
                  OUT OF 100
                </div>
              </div>
              <div className="h-10 w-0.5 bg-[#e5e7eb]" />
              <div className="space-y-1">
                <span
                  className={`px-3 py-1 rounded-md text-[12px] font-bold inline-block shadow-xs ${getPerformanceBadge(
                    evaluation.performanceLevel
                  )}`}
                >
                  {evaluation.performanceLevel}
                </span>
                <span className="text-[11px] font-mono text-[#71717a] block">
                  {evaluation.estimatedKnowledgeLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Summary Text */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#faf8f5] border border-[#e5e7eb] space-y-2">
            <span className="font-mono text-[11px] font-bold text-[#e11d48] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Recruiter &amp; Director Assessment
            </span>
            <p className="text-[14px] sm:text-[15px] font-medium text-[#141416] leading-relaxed">
              {evaluation.performanceSummary}
            </p>
          </div>
        </div>

        {/* =========================================================================
            ADAPTIVE TRAJECTORY & COGNITIVE BREAKDOWN
        ========================================================================= */}
        {evaluation.adaptiveTrajectory && (
          <div className="sketch-card p-6 sm:p-8 bg-white space-y-4">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[#e5e7eb] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" />
                <h3 className="font-extrabold text-[17px] text-[#141416]">
                  Adaptive Performance Trajectory
                </h3>
              </div>
              <span className="font-mono text-[11px] text-[#71717a]">Live Difficulty Scaling</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
              <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#e5e7eb] space-y-1">
                <span className="text-[11px] font-mono text-[#71717a] uppercase block">Initial Estimate</span>
                <span className="font-bold text-[14px] text-[#141416] block">
                  {evaluation.adaptiveTrajectory.initialKnowledgeLevel}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#e5e7eb] space-y-1">
                <span className="text-[11px] font-mono text-[#71717a] uppercase block">Demonstrated Level</span>
                <span className="font-bold text-[14px] text-emerald-700 block">
                  {evaluation.adaptiveTrajectory.finalDemonstratedLevel}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#e5e7eb] space-y-1">
                <span className="text-[11px] font-mono text-[#71717a] uppercase block">Under Difficulty</span>
                <span className="font-bold text-[13px] text-[#141416] block">
                  {evaluation.adaptiveTrajectory.handlingOfHardQuestions}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#e5e7eb] space-y-1">
                <span className="text-[11px] font-mono text-[#71717a] uppercase block">Session Progression</span>
                <span className="font-bold text-[13px] text-[#141416] block">
                  {evaluation.adaptiveTrajectory.performanceProgression}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STRENGTHS VS WEAKNESSES GRID
        ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strongest Skills */}
          <div className="sketch-card p-6 bg-white space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-dashed border-[#e5e7eb] pb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-[16px] text-[#141416]">Demonstrated Strengths</h3>
            </div>
            <div className="space-y-2">
              {evaluation.strongestSkills.map((str, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-[13px] font-medium flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                  <span>{str}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weakest / Growth Areas */}
          <div className="sketch-card p-6 bg-white space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-dashed border-[#e5e7eb] pb-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h3 className="font-extrabold text-[16px] text-[#141416]">Priority Growth Areas</h3>
            </div>
            <div className="space-y-2">
              {evaluation.weakestAreas.map((weak, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-950 text-[13px] font-medium flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                  <span>{weak}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* =========================================================================
            PROBLEM SOLVING & COMMUNICATION ASSESSMENT
        ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="sketch-card p-6 bg-white space-y-2">
            <span className="font-mono text-[11px] font-bold text-[#e11d48] uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-4 h-4" />
              Problem Solving &amp; Analytical Depth
            </span>
            <p className="text-[13.5px] text-[#4b5563] leading-relaxed">
              {evaluation.problemSolvingAssessment}
            </p>
          </div>

          <div className="sketch-card p-6 bg-white space-y-2">
            <span className="font-mono text-[11px] font-bold text-[#0284c7] uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              Technical Communication &amp; Precision
            </span>
            <p className="text-[13.5px] text-[#4b5563] leading-relaxed">
              {evaluation.communicationAssessment}
            </p>
          </div>
        </div>

        {/* =========================================================================
            DETAILED QUESTION-BY-QUESTION REDLINES & IDEAL ANSWERS
        ========================================================================= */}
        <div className="sketch-card p-6 sm:p-8 bg-white space-y-6">
          <div className="flex items-center justify-between border-b-2 border-dashed border-[#e5e7eb] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" />
              <h3 className="font-extrabold text-[18px] text-[#141416]">
                Question-by-Question Diagnostic
              </h3>
            </div>
            <span className="text-[12px] font-mono text-[#71717a]">
              {evaluation.questionEvaluations.length} Questions Evaluated
            </span>
          </div>

          <div className="space-y-4">
            {evaluation.questionEvaluations.map((q) => {
              const isOpen = !!expandedQuestions[q.questionNumber];

              return (
                <div
                  key={q.questionNumber}
                  className="border-2 border-[#18181b] rounded-xl overflow-hidden bg-white shadow-xs"
                >
                  {/* Question Header Accordion Bar */}
                  <button
                    type="button"
                    onClick={() => toggleQuestion(q.questionNumber)}
                    className="w-full p-4 bg-[#faf8f5] hover:bg-white text-left flex items-center justify-between gap-3 transition-colors cursor-pointer border-b border-[#e5e7eb]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-[#18181b] text-white flex items-center justify-center text-[12px] font-mono font-bold shrink-0">
                        Q{q.questionNumber}
                      </span>
                      <p className="font-bold text-[14px] text-[#141416] truncate">
                        {q.question}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${getScoreBadgeColor(
                          q.score
                        )}`}
                      >
                        {q.score}/100
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#71717a]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#71717a]" />
                      )}
                    </div>
                  </button>

                  {/* Question Details Body */}
                  {isOpen && (
                    <div className="p-5 space-y-4 text-[13px] animate-fadeIn bg-white">
                      {/* Full Question Text */}
                      <div className="p-3 rounded-lg bg-[#faf8f5] border border-[#e5e7eb]">
                        <span className="font-mono text-[10px] text-[#71717a] font-bold block mb-1">
                          FULL QUESTION:
                        </span>
                        <p className="font-bold text-[#141416] text-[14px]">
                          {q.question}
                        </p>
                      </div>

                      {/* Candidate's Submitted Answer */}
                      <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200">
                        <span className="font-mono text-[10px] text-[#71717a] font-bold block mb-1">
                          YOUR SUBMITTED RESPONSE:
                        </span>
                        <p className="text-[#374151] italic leading-relaxed whitespace-pre-wrap">
                          {q.userAnswer || '[No response submitted]'}
                        </p>
                      </div>

                      {/* Diagnostic Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                          <span className="font-mono text-[11px] font-bold text-emerald-800 block mb-1">
                            ✓ WHAT WENT WELL
                          </span>
                          <p className="text-emerald-950 font-medium">{q.whatWentWell}</p>
                        </div>

                        <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200">
                          <span className="font-mono text-[11px] font-bold text-amber-800 block mb-1">
                            ✗ WHAT WAS MISSING
                          </span>
                          <p className="text-amber-950 font-medium">{q.whatWasMissing}</p>
                        </div>
                      </div>

                      {/* Actionable Advice */}
                      <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-blue-950">
                        <span className="font-mono text-[11px] font-bold text-blue-800 block mb-1">
                          💡 HOW TO ELEVATE THIS TO TOP 5% TIER
                        </span>
                        <p className="font-medium">{q.howToImprove}</p>
                      </div>

                      {/* Recruiter Ideal Benchmark Answer */}
                      <div className="p-4 rounded-lg bg-[#18181b] text-white space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-[#e11d48]">
                            RECRUITER BENCHMARK (IDEAL ANSWER):
                          </span>
                          <span className="text-[10px] font-mono text-[#a1a1aa]">
                            STAFF SDE STANDARD
                          </span>
                        </div>
                        <p className="text-[13px] text-[#e4e4e7] leading-relaxed pt-1">
                          {q.idealAnswer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            RECOMMENDED LEARNING TOPICS & NEXT STEPS
        ========================================================================= */}
        <div className="sketch-card p-6 sm:p-8 bg-white space-y-5">
          <div className="flex items-center justify-between border-b-2 border-dashed border-[#e5e7eb] pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#e11d48]" />
              <h3 className="font-extrabold text-[17px] text-[#141416]">
                Recommended Technical Roadmap
              </h3>
            </div>
            <span className="font-mono text-[11px] text-[#71717a]">Targeted Mastery</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {evaluation.recommendedLearningTopics.map((topic, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#faf8f5] border-2 border-[#18181b] space-y-1"
              >
                <span className="text-[10px] font-mono font-bold text-[#e11d48] block">
                  TOPIC 0{idx + 1}
                </span>
                <h4 className="font-bold text-[14px] text-[#141416]">{topic}</h4>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <span className="font-mono text-[11px] font-bold text-[#71717a] block mb-2">
              TACTICAL IMPROVEMENT SUGGESTIONS:
            </span>
            <ul className="space-y-1.5 text-[13px] text-[#4b5563]">
              {evaluation.technicalImprovementSuggestions.map((sug, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#e11d48] font-bold">›</span>
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* =========================================================================
            FOOTER ACTIONS
        ========================================================================= */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 print:hidden">
          <Link
            to="/challenge/setup"
            className="sketch-btn-red px-7 py-3 text-[15px] font-extrabold flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Launch Another Challenge</span>
          </Link>

          <Link
            to="/skills"
            className="sketch-btn-white px-6 py-3 text-[15px] font-bold flex items-center gap-2 cursor-pointer"
          >
            <Award className="w-4 h-4 text-[#e11d48]" />
            <span>Track in Skill Tracker</span>
          </Link>

          <Link
            to="/"
            className="px-6 py-3 bg-white border border-[#18181b] rounded-xl text-[14px] font-bold hover:bg-[#faf8f5] flex items-center gap-2"
          >
            <HomeIcon className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
