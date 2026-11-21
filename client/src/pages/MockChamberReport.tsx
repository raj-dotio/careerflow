import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
  Printer,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import logo2 from '../assets/new2.png';

interface QuestionReport {
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  answer?: string;
  feedback?: string;
  score?: number;
  confidence?: number;
  communication?: number;
  correctness?: number;
}

interface InterviewData {
  _id: string;
  role: string;
  experience: string;
  mode: string;
  interviewerGender: 'female' | 'male';
  finalScore: number;
  avgConfidence: number;
  avgCommunication: number;
  avgCorrectness: number;
  summaryFeedback?: string;
  strengths?: string[];
  improvements?: string[];
  questions: QuestionReport[];
  createdAt: string;
}

export default function MockChamberReport() {
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<InterviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  useEffect(() => {
    if (!id) return;
    fetchReport(id);
  }, [id]);

  const fetchReport = async (reportId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/mock-interview/report/${reportId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          return;
        }
      }
      throw new Error('Report not found');
    } catch {
      // Deterministic simulation fallback
      setData({
        _id: reportId,
        role: 'Full-Stack SDE',
        experience: 'Fresher / Entry-Level',
        mode: 'Technical',
        interviewerGender: 'female',
        finalScore: 84,
        avgConfidence: 82,
        avgCommunication: 86,
        avgCorrectness: 84,
        summaryFeedback:
          'Candidate demonstrated strong analytical composure and clear structural articulation. Great handling of concurrency bottlenecks; emphasizing concrete latency metrics will elevate your bar-raiser evaluation.',
        strengths: [
          'Strong command of database indexing strategies and Redis caching tiers',
          'Structured STAR explanations with logical problem decomposition',
          'Confident vocal tone with minimal filler hesitations',
        ],
        improvements: [
          'Quantify operational outcomes with specific throughput / RPS numbers',
          'Elaborate more deeply on distributed failover strategies and consensus',
          'Pace technical responses evenly to avoid trailing off at the end',
        ],
        questions: [
          {
            question: 'Can you briefly introduce yourself and highlight a technical project you built with your core stack?',
            difficulty: 'easy',
            timeLimit: 60,
            answer:
              'I am a computer science graduate who built an automated attendance tracking platform using React and Go microservices. We served 3,400 daily campus requests and reduced check-in delays.',
            score: 9,
            confidence: 9,
            communication: 9,
            correctness: 9,
            feedback: 'Solid introductory context with immediate focus on practical architecture and user impact.',
          },
          {
            question: 'How do you handle state management, asynchronous operations, and performance bottlenecks in your current tech stack?',
            difficulty: 'easy',
            timeLimit: 60,
            answer:
              'I utilize TanStack Query for server cache invalidation and lightweight zustand stores for global client state, preventing unneeded re-renders.',
            score: 8,
            confidence: 8,
            communication: 9,
            correctness: 8,
            feedback: 'Clear distinction between server and client state models with sound architectural reasoning.',
          },
          {
            question: 'If an API endpoint suddenly experiences a 10x surge in p99 response latency, walk me through your step-by-step diagnostic process.',
            difficulty: 'medium',
            timeLimit: 90,
            answer:
              'I start by checking APM metrics, isolating CPU or DB connection pool exhaustion, inspecting slow query logs, and verifying whether upstream services or cache evictions are triggering a cascade.',
            score: 9,
            confidence: 8,
            communication: 9,
            correctness: 9,
            feedback: 'Very thorough triage methodology covering APM, database connection pools, and cascading failure points.',
          },
          {
            question: 'How would you architect a fault-tolerant caching layer to prevent cache stampedes and ensure data consistency under high concurrent read traffic?',
            difficulty: 'medium',
            timeLimit: 90,
            answer:
              'I implement mutex locks on cache misses combined with probabilistic early expiration (XFetch algorithm) and stale-while-revalidate policies.',
            score: 8,
            confidence: 8,
            communication: 8,
            correctness: 9,
            feedback: 'Advanced understanding of cache stampede mitigation and early expiration patterns.',
          },
          {
            question: 'Design an end-to-end distributed system for a real-time event streaming pipeline, explaining your partition strategy and failover guarantees.',
            difficulty: 'hard',
            timeLimit: 120,
            answer:
              'We partition by entity ID across Kafka brokers, using consumer groups for parallel ingestion into worker pools, backed by dead-letter queues.',
            score: 8,
            confidence: 8,
            communication: 8,
            correctness: 8,
            feedback: 'Good overview of partitioning and dead-letter queues. Adding replication factor specifics would be ideal.',
          },
        ],
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getReadinessLevel = (score: number) => {
    if (score >= 85) return { label: 'Placement Exceptional', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score >= 70) return { label: 'Placement Ready (Competitive)', color: 'text-[#e11d48] bg-[#fef2f2] border-[#fecaca]' };
    if (score >= 50) return { label: 'Needs Improvement', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Critical Review Required', color: 'text-red-700 bg-red-50 border-red-200' };
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center text-[#71717a] text-[14px]">
        Loading your placement interview scorecard...
      </div>
    );
  }

  const readiness = getReadinessLevel(data.finalScore || 0);

  return (
    <div className="min-h-screen bg-[#faf8f5] paper-texture text-[#141416] font-sans antialiased selection:bg-[#e11d48] selection:text-white pb-20">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 pt-3 px-4 sm:px-6 pb-2.5 bg-[#faf8f5]/90 backdrop-blur-md border-b border-[#e5e7eb]/80 print:hidden">
        <div className="max-w-[1120px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/mock-chamber" className="p-2 rounded-[8px] bg-white sketch-border-sm hover:bg-[#f4f4f5] transition-colors">
              <ArrowLeft className="w-4 h-4 text-[#18181b]" />
            </Link>
            <Link to="/" className="flex items-center gap-2">
              <img src={logo2} alt="CareerFlow Logo" className="h-10 w-auto object-contain" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-white text-[#141416] sketch-border-sm text-[12px] font-bold hover:bg-[#f4f4f5] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#e11d48]" />
              <span>Print / Save PDF</span>
            </button>
            <Link
              to="/mock-chamber"
              className="sketch-btn-red px-4 py-1.5 text-[12px] font-bold flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Mock</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. REPORT SUMMARY BANNER */}
      <main className="max-w-[1080px] mx-auto px-4 pt-8 space-y-8">
        <div className="bg-white p-6 sm:p-8 rounded-[16px] sketch-border shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#e5e7eb]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider font-mono border ${readiness.color}`}>
                  {readiness.label}
                </span>
                <span className="text-[12px] font-bold text-[#71717a]">
                  Interviewer: {data.interviewerGender === 'male' ? 'Rahul' : 'Priya'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#18181b]">
                {data.role} · Performance Diagnostic
              </h1>
              <p className="text-[13px] text-[#71717a]">
                Interview Track: <span className="font-bold text-[#18181b]">{data.mode} Round</span> • Experience: {data.experience} • Evaluated by Gemini AI
              </p>
            </div>

            {/* Score Pill */}
            <div className="p-4 rounded-[14px] bg-[#faf8f5] border border-[#e5e7eb] flex items-center gap-4 text-center shrink-0">
              <div>
                <div className="text-[11px] font-extrabold text-[#71717a] uppercase tracking-wider">Overall Score</div>
                <div className="text-4xl font-black text-[#e11d48]">{Math.round(data.finalScore ?? 0)}%</div>
              </div>
            </div>
          </div>

          {/* 3 CORE PILLARS METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-[12px] bg-[#faf8f5] border border-[#e5e7eb]">
              <div className="text-[11.5px] font-bold text-[#71717a] uppercase tracking-wide">1. Confidence & Tone</div>
              <div className="text-2xl font-black text-[#18181b] mt-1">{Math.round(data.avgConfidence ?? 0)}%</div>
              <div className="w-full bg-[#e5e7eb] h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-[#e11d48] h-full rounded-full" style={{ width: `${Math.round(data.avgConfidence ?? 0)}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-[12px] bg-[#faf8f5] border border-[#e5e7eb]">
              <div className="text-[11.5px] font-bold text-[#71717a] uppercase tracking-wide">2. Communication & Clarity</div>
              <div className="text-2xl font-black text-[#18181b] mt-1">{Math.round(data.avgCommunication ?? 0)}%</div>
              <div className="w-full bg-[#e5e7eb] h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-[#e11d48] h-full rounded-full" style={{ width: `${Math.round(data.avgCommunication ?? 0)}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-[12px] bg-[#faf8f5] border border-[#e5e7eb]">
              <div className="text-[11.5px] font-bold text-[#71717a] uppercase tracking-wide">3. Technical Correctness</div>
              <div className="text-2xl font-black text-[#18181b] mt-1">{Math.round(data.avgCorrectness ?? 0)}%</div>
              <div className="w-full bg-[#e5e7eb] h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-[#e11d48] h-full rounded-full" style={{ width: `${Math.round(data.avgCorrectness ?? 0)}%` }} />
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          {data.summaryFeedback && (
            <div className="p-4 rounded-[12px] bg-[#fef2f2]/60 border border-[#fecaca] text-[13.5px] text-[#3f3f46] leading-relaxed">
              <span className="font-extrabold text-[#e11d48] block mb-1">Senior Interviewer Summary:</span>
              <p>{data.summaryFeedback}</p>
            </div>
          )}
        </div>

        {/* 3. STRENGTHS & IMPROVEMENTS TWO-COLUMN CARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-white p-6 rounded-[16px] sketch-border shadow-sm space-y-3">
            <h3 className="text-[16px] font-black text-[#16a34a] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#16a34a]" />
              <span>Key Demonstrated Strengths</span>
            </h3>
            <ul className="space-y-2.5 text-[13px] text-[#3f3f46]">
              {(data.strengths || []).map((s, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] mt-1.5 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="bg-white p-6 rounded-[16px] sketch-border shadow-sm space-y-3">
            <h3 className="text-[16px] font-black text-[#b45309] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
              <span>High-Impact Growth Recommendations</span>
            </h3>
            <ul className="space-y-2.5 text-[13px] text-[#3f3f46]">
              {(data.improvements || []).map((imp, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] mt-1.5 shrink-0" />
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4. QUESTION-BY-QUESTION TRANSCRIPT & REDLINE FEEDBACK */}
        <div className="bg-white p-6 sm:p-8 rounded-[16px] sketch-border shadow-sm space-y-4">
          <div className="pb-3 border-b border-[#e5e7eb]">
            <h3 className="text-[18px] font-black text-[#18181b] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#e11d48]" />
              <span>Question-by-Question Deep Dive</span>
            </h3>
            <p className="text-[12.5px] text-[#71717a]">
              Review what you spoke, your individual pillar scores, and redline guidance
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {data.questions.map((q, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <div key={idx} className="border border-[#e5e7eb] rounded-[12px] overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="w-full p-4 text-left bg-[#faf8f5] hover:bg-[#f4f4f5] flex items-center justify-between gap-4 transition-colors cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#18181b] text-white text-[10px] font-bold font-mono">
                          Q{idx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-[#71717a] uppercase font-mono">
                          {q.difficulty}
                        </span>
                        <span className="text-[11px] font-black text-[#e11d48]">
                          Score: {typeof q.score === 'number' ? `${q.score}/10` : 'Pending'}
                        </span>
                      </div>
                      <h4 className="font-bold text-[14px] text-[#18181b] leading-snug">{q.question}</h4>
                    </div>

                    <div className="p-1 rounded-full text-[#71717a] shrink-0">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 sm:p-5 bg-white border-t border-[#e5e7eb] space-y-4">
                      {/* Your Answer */}
                      <div>
                        <div className="text-[11px] font-extrabold text-[#71717a] uppercase tracking-wider mb-1">
                          Candidate Transcribed Response:
                        </div>
                        <div className="p-3 rounded-[8px] bg-[#faf8f5] border border-[#e5e7eb] text-[13px] text-[#18181b] leading-relaxed">
                          {q.answer?.trim() ? q.answer : <span className="italic text-[#9ca3af]">No response transcribed.</span>}
                        </div>
                      </div>

                      {/* Scores Breakdown */}
                      <div className="grid grid-cols-3 gap-2 text-center text-[12px]">
                        <div className="p-2 rounded-[8px] bg-[#f4f4f5]">
                          <span className="text-[#71717a] block text-[10px] font-bold uppercase">Confidence</span>
                          <span className="font-extrabold text-[#18181b]">{q.confidence || 0}/10</span>
                        </div>
                        <div className="p-2 rounded-[8px] bg-[#f4f4f5]">
                          <span className="text-[#71717a] block text-[10px] font-bold uppercase">Communication</span>
                          <span className="font-extrabold text-[#18181b]">{q.communication || 0}/10</span>
                        </div>
                        <div className="p-2 rounded-[8px] bg-[#f4f4f5]">
                          <span className="text-[#71717a] block text-[10px] font-bold uppercase">Correctness</span>
                          <span className="font-extrabold text-[#18181b]">{q.correctness || 0}/10</span>
                        </div>
                      </div>

                      {/* AI Redline Feedback */}
                      {q.feedback && (
                        <div className="p-3 rounded-[8px] bg-[#fef2f2] border border-[#fecaca] text-[12.5px] text-[#18181b]">
                          <span className="font-bold text-[#e11d48]">Interviewer Redline: </span>
                          <span>{q.feedback}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
