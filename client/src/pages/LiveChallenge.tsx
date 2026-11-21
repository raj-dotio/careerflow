import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Bot,
  Loader2,
  AlertCircle,
  ArrowRight,
  HelpCircle,
  CornerDownLeft,
  LogOut,
  BrainCircuit,
} from 'lucide-react';

interface QuestionItem {
  questionNumber: number;
  question: string;
  topic: string;
  difficulty: string;
  questionType: string;
  userAnswer?: string;
  aiFeedbackAck?: string;
}

interface ChallengeSessionData {
  _id: string;
  goal: string;
  questionCount: number;
  difficulty: string;
  currentDifficulty: string;
  currentQuestionIndex: number;
  currentQuestion: QuestionItem | null;
  totalAnswered: number;
  status: 'in-progress' | 'completed';
  questions: QuestionItem[];
}

export default function LiveChallenge() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<ChallengeSessionData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(null);
  const [answerInput, setAnswerInput] = useState<string>('');
  const [lastAck, setLastAck] = useState<string | null>(null);

  // States
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 1. Fetch Session on Mount / Refresh
  useEffect(() => {
    if (!id) return;

    const fetchSession = async () => {
      try {
        setIsLoadingSession(true);
        const res = await fetch(`/api/challenges/${id}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to load challenge session.');
        }

        const sess: ChallengeSessionData = data.session;
        setSession(sess);

        if (sess.status === 'completed') {
          navigate(`/challenge/${id}/results`, { replace: true });
          return;
        }

        if (sess.currentQuestion) {
          setCurrentQuestion(sess.currentQuestion);
        } else if (sess.questions && sess.questions[sess.currentQuestionIndex]) {
          setCurrentQuestion(sess.questions[sess.currentQuestionIndex]);
        }

        // If previous question has an acknowledgment, show it
        if (sess.currentQuestionIndex > 0) {
          const prevQ = sess.questions[sess.currentQuestionIndex - 1];
          if (prevQ && prevQ.aiFeedbackAck) {
            setLastAck(prevQ.aiFeedbackAck);
          }
        }
      } catch (err: any) {
        console.error('Failed to load session:', err);
        setSubmitError(err.message || 'Could not load interview session.');
      } finally {
        setIsLoadingSession(false);
      }
    };

    fetchSession();
  }, [id, navigate]);

  // Focus textarea when question changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentQuestion]);

  // 2. Submit Answer
  const handleSubmitAnswer = async () => {
    if (!answerInput.trim()) {
      setSubmitError('Please provide your response before proceeding.');
      return;
    }

    if (isSubmitting || !id) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/challenges/${id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answerInput.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to process answer with Gemini AI.');
      }

      // Check if finished
      if (data.isCompleted) {
        navigate(`/challenge/${id}/results`, { replace: true });
        return;
      }

      // Advance to next question
      if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);
        setLastAck(data.aiAcknowledgment || null);
        setAnswerInput('');

        setSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            currentQuestionIndex: data.currentQuestionIndex,
            currentDifficulty: data.currentDifficulty || prev.currentDifficulty,
            currentQuestion: data.nextQuestion,
            totalAnswered: prev.totalAnswered + 1,
          };
        });
      }
    } catch (err: any) {
      console.error('Submit answer error:', err);
      setSubmitError(err.message || 'Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut Ctrl+Enter or Cmd+Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  // Loading Screen
  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6 text-center">
        <div className="sketch-card p-8 bg-white max-w-md w-full space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#e11d48] text-white flex items-center justify-center border border-[#18181b] animate-spin">
            <Loader2 className="w-6 h-6" />
          </div>
          <h2 className="text-[18px] font-bold text-[#141416]">Connecting to AI Interview Chamber...</h2>
          <p className="text-[13px] text-[#71717a]">
            Restoring session context, question trajectory, and Gemini AI interviewer.
          </p>
        </div>
      </div>
    );
  }

  // Not found / Error state
  if (!session || !currentQuestion) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6 text-center">
        <div className="sketch-card p-8 bg-white max-w-md w-full space-y-4">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
          <h2 className="text-[20px] font-bold text-[#141416]">Interview Session Not Found</h2>
          <p className="text-[13px] text-[#6b7280]">
            The challenge session could not be found or may have expired.
          </p>
          <Link
            to="/challenge/setup"
            className="sketch-btn-red px-5 py-2.5 text-[14px] inline-flex items-center gap-2"
          >
            <span>Start New Challenge</span>
          </Link>
        </div>
      </div>
    );
  }

  const qNum = currentQuestion.questionNumber || session.currentQuestionIndex + 1;
  const totalQ = session.questionCount;
  const progressPercent = Math.min(100, Math.round(((qNum - 1) / totalQ) * 100));

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#141416] font-sans antialiased selection:bg-[#e11d48] selection:text-white flex flex-col justify-between">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e4e4e7] px-4 py-3 shadow-xs">
        <div className="max-w-[1140px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-[6px] bg-[#e11d48] border border-[#18181b] flex items-center justify-center p-1 text-white">
                <GraduationCap className="w-full h-full" />
              </div>
              <span className="font-extrabold text-[16px] text-[#141416] hidden sm:inline">
                CareerFlow
              </span>
            </Link>
            <span className="text-[#a1a1aa] hidden sm:inline">/</span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-50 text-[#e11d48] border border-rose-200 truncate max-w-[220px] sm:max-w-none">
                {session.goal}
              </span>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#18181b] text-white">
                {session.currentDifficulty}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[12px] font-mono font-bold text-[#141416]">
                Question {qNum} of {totalQ}
              </span>
            </div>
            <button
              onClick={() => setShowExitModal(true)}
              className="p-1.5 text-[#71717a] hover:text-red-600 rounded-md hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
              title="Exit Interview"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="max-w-[1140px] mx-auto mt-2">
          <div className="w-full bg-[#f4f4f5] h-1.5 rounded-full overflow-hidden border border-[#e4e4e7]">
            <div
              className="bg-[#e11d48] h-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* 2. Main Interview Arena */}
      <main className="max-w-[920px] w-full mx-auto px-4 py-8 flex-1 space-y-6">
        {/* Previous Acknowledgment from Gemini Interviewer */}
        {lastAck && (
          <div className="p-4 rounded-xl bg-amber-50/80 border-2 border-amber-300 text-amber-950 flex items-start gap-3 text-[13px] animate-fadeIn">
            <Bot className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-mono text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Interviewer Observation
              </span>
              <p className="font-medium italic leading-relaxed text-[13.5px]">
                &ldquo;{lastAck}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* AI Interviewer Question Card */}
        <div className="sketch-card p-6 sm:p-8 bg-white space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-[#e5e7eb] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-[#e11d48] text-white flex items-center justify-center border border-[#18181b] shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white animate-pulse" />
              </div>
              <div>
                <span className="font-bold text-[14px] text-[#141416] block">
                  CareerFlow AI Staff Interviewer
                </span>
                <span className="text-[11px] text-[#71717a]">
                  Adaptive Assessment Engine
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#faf8f5] border border-[#e5e7eb] text-[#71717a]">
                {currentQuestion.topic}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-rose-50 text-[#e11d48] border border-rose-200">
                {currentQuestion.questionType}
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2 py-1">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-mono font-bold text-[#e11d48]">
                QUESTION {qNum} OF {totalQ}:
              </span>
            </div>
            <h2 className="text-[19px] sm:text-[23px] font-black text-[#141416] leading-snug tracking-tight">
              {currentQuestion.question}
            </h2>
          </div>
        </div>

        {/* Candidate Response Card */}
        <div className="sketch-card p-6 sm:p-7 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[14px] text-[#141416] flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#e11d48]" />
              Your Candidate Response
            </span>
            <span className="text-[11px] font-mono text-[#71717a]">
              {answerInput.length} characters
            </span>
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={7}
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              placeholder="Structure your answer clearly. Discuss the underlying architecture, practical trade-offs, edge-cases, and how you would handle this in production..."
              className="w-full p-4 rounded-xl border-2 border-[#18181b] bg-[#faf8f5] text-[14px] text-[#141416] font-medium leading-relaxed outline-none focus:bg-white focus:border-[#e11d48] transition-all resize-y"
            />
          </div>

          {submitError && (
            <p className="text-[12px] font-bold text-red-600 flex items-center gap-1.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4" /> {submitError}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-[12px] text-[#71717a]">
              <CornerDownLeft className="w-3.5 h-3.5" />
              <span>Press </span>
              <kbd className="px-1.5 py-0.5 bg-[#f4f4f5] border border-[#d4d4d8] rounded text-[11px] font-mono font-bold text-[#18181b]">
                Ctrl + Enter
              </kbd>
              <span> to submit response</span>
            </div>

            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={isSubmitting || !answerInput.trim()}
              className="sketch-btn-red px-6 py-2.5 text-[14px] font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98 transition-transform"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Evaluating Response...</span>
                </>
              ) : (
                <>
                  <span>
                    {qNum === totalQ ? 'Submit Final Answer' : 'Submit & Next Question'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tip Box */}
        <div className="p-3.5 rounded-xl bg-[#faf8f5] border border-[#e5e7eb] text-[12px] text-[#6b7280] flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#e11d48] shrink-0" />
          <span>
            <strong>Pro Tip:</strong> Like a senior interviewer at top tech firms, Gemini evaluates not just correctness, but your ability to articulate practical trade-offs, scalability boundaries, and failure modes.
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center text-[12px] text-[#a1a1aa] border-t border-[#e5e7eb] bg-white">
        CareerFlow Adaptive AI Interview Engine · Powered by Google Gemini
      </footer>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="sketch-card p-6 bg-white max-w-sm w-full space-y-4">
            <h3 className="text-[17px] font-bold text-[#141416]">Exit Interview Challenge?</h3>
            <p className="text-[13px] text-[#6b7280]">
              Your progress so far has been saved. You can resume this session later or return to setup.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 border border-[#d4d4d8] rounded-lg text-[13px] font-bold hover:bg-[#faf8f5]"
              >
                Continue Interview
              </button>
              <button
                onClick={() => navigate('/challenge/setup')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-[13px] font-bold hover:bg-red-700"
              >
                Exit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
