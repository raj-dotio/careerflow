import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  Clock,
  AlertCircle,
  Keyboard,
  Send,
  Bot,
  Sparkles,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import femaleAiVideo from '../assets/videos/female-ai.mp4';
import maleAiVideo from '../assets/videos/male-ai.mp4';
import logo2 from '../assets/new2.png';
import { fetchGeminiTtsAudio, transcribeRecordedAudio } from '../utils/speechUtils';

interface QuestionItem {
  index: number;
  question: string;
  spokenText?: string;
  spokenJudgment?: string;
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
}

interface ActiveSession {
  interviewId: string;
  role: string;
  experience: string;
  mode: string;
  interviewerGender: 'female' | 'male';
  totalRounds?: number;
  questions: QuestionItem[];
}

export default function MockChamberRoom() {
  const navigate = useNavigate();

  const [session, setSession] = useState<ActiveSession | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Audio / Speech State (Powered by Gemini TTS)
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Candidate Speech Recognition & MediaRecorder State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [isTypingMode, setIsTypingMode] = useState(false);
  const [speechSupported] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(60);
  const [timeTaken, setTimeTaken] = useState(0);

  // Evaluation & Processing State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [recentFeedback, setRecentFeedback] = useState<string | null>(null);

  // Media Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const recordingTimerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // 1. Initialize Session from Storage
  useEffect(() => {
    const saved = sessionStorage.getItem('activeInterviewSession');
    if (!saved) {
      navigate('/mock-chamber');
      return;
    }

    try {
      const parsed: ActiveSession = JSON.parse(saved);
      if (!parsed.questions || parsed.questions.length === 0) {
        navigate('/mock-chamber');
        return;
      }
      setSession(parsed);
      setTimeLeft(parsed.questions[0].timeLimit || 60);
    } catch {
      navigate('/mock-chamber');
    }

    return () => {
      stopAudio();
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // 2. Setup Optional WebSpeech API for Live Preview (Works without blocking MediaRecorder)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (event: any) => {
          let currentText = '';
          for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript + ' ';
          }
          if (currentText.trim()) {
            setTranscript(currentText.trim());
            setManualText(currentText.trim());
          }
        };

        rec.onerror = (event: any) => {
          // In Brave or strict browsers, SpeechRecognition throws 'network'.
          // We intentionally do NOT block or switch to typing mode here,
          // because MediaRecorder is capturing actual microphone audio for Gemini!
          if (event.error === 'not-allowed') {
            setMicError('Microphone permission denied. Please allow microphone in browser or type below.');
            setIsTypingMode(true);
          }
        };

        recognitionRef.current = rec;
      } catch (e) {
        console.warn('SpeechRecognition initialization note:', e);
      }
    }
  }, []);

  // 3. Question Change Handler: Speak question using Gemini TTS & reset timers & prefetch next
  useEffect(() => {
    if (!session || !session.questions[currentQIndex]) return;

    const currentQuestion = session.questions[currentQIndex];
    setTimeLeft(currentQuestion.timeLimit || 60);
    setTimeTaken(0);
    setTranscript('');
    setManualText('');
    setRecentFeedback(null);
    setTtsError(null);
    setRecordingSeconds(0);

    // Stop current audio and start synthesis with full natural spoken prompt
    stopAudio();
    const textToSpeak = currentQuestion.spokenText || currentQuestion.question;
    playQuestionAudio(textToSpeak);

    // Prefetch next question audio after a 5-second delay to avoid free-tier rate-limit spikes
    let prefetchTimer: any = null;
    if (currentQIndex + 1 < session.questions.length && session.questions[currentQIndex + 1]?.question) {
      const nextQ = session.questions[currentQIndex + 1];
      const nextText = nextQ.spokenText || nextQ.question;
      prefetchTimer = setTimeout(() => {
        fetchGeminiTtsAudio(nextText, session.interviewerGender).catch(() => {});
      }, 5000);
    }

    // Start timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
      setTimeTaken((prev) => prev + 1);
    }, 1000);

    return () => {
      stopAudio();
      if (prefetchTimer) clearTimeout(prefetchTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQIndex, session]);

  // 4. Gemini TTS Playback & Avatar Synchronization
  const playQuestionAudio = async (text: string) => {
    if (!session || isMuted) return;

    stopAudio();
    setIsTtsLoading(true);
    setTtsError(null);

    try {
      const audioUrl = await fetchGeminiTtsAudio(text, session.interviewerGender);
      setIsTtsLoading(false);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      }
    } catch (err: any) {
      console.warn('[MockChamberRoom] TTS playback error:', err);
      setIsTtsLoading(false);
      setIsAiSpeaking(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setTtsError('Voice synthesis temporarily unavailable. You can read the question below and continue.');
    }
  };

  const handleAudioPlay = () => {
    setIsAiSpeaking(true);
    stopRecording();
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleAudioEnded = () => {
    setIsAiSpeaking(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    // Auto-start microphone recording after interviewer question finishes
    if (!isTypingMode && speechSupported && !micError) {
      startRecording();
    }
  };

  const handleAudioError = () => {
    setIsAiSpeaking(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setTtsError('Voice playback encountered an issue. You can read the question and reply.');
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAiSpeaking(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // 5. Native MediaRecorder Microphone Recording (Brave, Chrome, Safari, Firefox compatible)
  const startRecording = async () => {
    if (isRecording || isAiSpeaking || isTtsLoading) return;
    stopAudio();
    setMicError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const chunks = audioChunksRef.current;
        if (chunks.length > 0) {
          const audioBlob = new Blob(chunks, { type: mimeType });
          if (audioBlob.size > 500) {
            setIsTranscribing(true);
            try {
              const text = await transcribeRecordedAudio(audioBlob);
              if (text && text.trim()) {
                setTranscript(text.trim());
                setManualText(text.trim());
              }
            } catch (e) {
              console.warn('[MockChamberRoom] Transcribe error:', e);
            } finally {
              setIsTranscribing(false);
            }
          }
        }
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Try running WebSpeech recognition in parallel for live text in Chrome
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
    } catch (err: any) {
      console.warn('[MockChamberRoom] Microphone access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Microphone permission was denied. Please allow microphone in your browser settings or use typing mode.');
        setIsTypingMode(true);
      } else {
        setMicError(`Unable to start microphone (${err.message || 'Error'}). You can type your answer.`);
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    stopRecordingAndGetTranscript().catch(() => {});
  };

  const stopRecordingAndGetTranscript = (): Promise<string> => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    setIsRecording(false);

    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return Promise.resolve((transcript || manualText).trim());
    }

    setIsTranscribing(true);

    return new Promise<string>((resolve) => {
      const recorder = mediaRecorderRef.current!;
      recorder.onstop = async () => {
        try {
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          }
          const chunks = audioChunksRef.current;
          if (chunks.length > 0) {
            const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
            if (audioBlob.size > 500) {
              const text = await transcribeRecordedAudio(audioBlob);
              if (text && text.trim()) {
                setTranscript(text.trim());
                setManualText(text.trim());
                resolve(text.trim());
                return;
              }
            }
          }
          resolve((transcript || manualText).trim());
        } catch (err) {
          console.warn('[MockChamberRoom] Transcription error in onstop:', err);
          resolve((transcript || manualText).trim());
        } finally {
          setIsTranscribing(false);
        }
      };

      try {
        recorder.stop();
      } catch {
        setIsTranscribing(false);
        resolve((transcript || manualText).trim());
      }
    });
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecordingAndGetTranscript().catch(() => {});
    } else {
      stopAudio();
      startRecording();
    }
  };

  const toggleMute = () => {
    if (!isMuted) {
      stopAudio();
    } else if (session && session.questions[currentQIndex]) {
      const text = session.questions[currentQIndex].spokenText || session.questions[currentQIndex].question;
      playQuestionAudio(text);
    }
    setIsMuted(!isMuted);
  };

  // 6. Submit Answer to Backend
  const handleProceedNext = async () => {
    if (!session) return;
    stopAudio();

    let finalAnswer = (isTypingMode ? manualText : transcript || manualText).trim();

    // If currently recording, wait for recorder to finish and transcribe
    if (isRecording) {
      finalAnswer = await stopRecordingAndGetTranscript();
    } else if (isTranscribing) {
      let waitCount = 0;
      while (isTranscribing && waitCount < 12) {
        await new Promise((r) => setTimeout(r, 300));
        waitCount++;
      }
      finalAnswer = (isTypingMode ? manualText : transcript || manualText).trim();
    }

    // Guard against accidental empty submissions
    if (!finalAnswer) {
      const confirmed = window.confirm(
        'You have not provided an answer yet. Would you like to skip this question without a response?'
      );
      if (!confirmed) {
        return;
      }
    }

    setIsEvaluating(true);

    try {
      const res = await fetch('/api/mock-interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: session.interviewId,
          questionIndex: currentQIndex,
          answer: finalAnswer,
          timeTaken,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.evaluation?.feedback) {
          setRecentFeedback(json.evaluation.feedback);
        }

        let hasNext = json.hasMore;
        if (json.nextQuestion) {
          setSession((prev) => {
            if (!prev) return prev;
            const updated = [...prev.questions];
            updated[json.nextQuestion.index] = json.nextQuestion;
            const updatedSession = { ...prev, questions: updated };
            sessionStorage.setItem('activeInterviewSession', JSON.stringify(updatedSession));
            return updatedSession;
          });
          hasNext = true;
        }

        const maxRounds = session.totalRounds || 5;
        if (hasNext && currentQIndex + 1 < maxRounds) {
          setTimeout(() => {
            setCurrentQIndex((prev) => prev + 1);
          }, 1200);
        } else {
          setTimeout(() => {
            handleFinishInterview();
          }, 1200);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to submit answer');
      }
    } catch (err: any) {
      console.warn('Answer submission warning:', err);
      // Even if warning, try advancing if next question was cached or finish
      if (currentQIndex + 1 < (session.totalRounds || 5)) {
        setTimeout(() => {
          setCurrentQIndex((prev) => prev + 1);
        }, 800);
      } else {
        handleFinishInterview();
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  // 7. Skip Question
  const handleSkipQuestion = async () => {
    if (!session) return;
    stopAudio();
    stopRecording();
    setIsEvaluating(true);

    try {
      const res = await fetch('/api/mock-interview/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: session.interviewId,
          currentQuestionIndex: currentQIndex,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const maxRounds = session.totalRounds || 5;
        if (json.nextQuestion) {
          setSession((prev) => {
            if (!prev) return prev;
            const updated = [...prev.questions];
            updated[json.nextQuestion.index] = json.nextQuestion;
            const updatedSession = { ...prev, questions: updated };
            sessionStorage.setItem('activeInterviewSession', JSON.stringify(updatedSession));
            return updatedSession;
          });

          if (currentQIndex + 1 < maxRounds) {
            setCurrentQIndex((prev) => prev + 1);
            return;
          }
        }
      }
      handleFinishInterview();
    } catch (err) {
      console.warn('Skip question error:', err);
      handleFinishInterview();
    } finally {
      setIsEvaluating(false);
    }
  };

  // 8. Complete Interview & Generate Report
  const handleFinishInterview = async () => {
    if (!session) return;
    stopAudio();
    stopRecording();
    setIsEvaluating(true);

    try {
      const res = await fetch('/api/mock-interview/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId: session.interviewId }),
      });

      if (res.ok) {
        const json = await res.json();
        navigate(`/mock-chamber/report/${json.interviewId || session.interviewId}`);
      } else {
        navigate(`/mock-chamber/report/${session.interviewId}`);
      }
    } catch {
      navigate(`/mock-chamber/report/${session.interviewId}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center text-[#71717a]">
        Initializing interview chamber...
      </div>
    );
  }

  const totalRounds = session.totalRounds || 5;
  const currentQ = session.questions[currentQIndex] || session.questions[0];
  const progressPercent = Math.round(((currentQIndex + 1) / totalRounds) * 100);
  const interviewerName = session.interviewerGender === 'male' ? 'Rahul' : 'Priya';
  const interviewerVoiceModel = session.interviewerGender === 'male' ? 'Gemini Puck' : 'Gemini Kore';

  return (
    <div className="min-h-screen bg-[#0e0e11] text-[#f4f4f5] font-sans antialiased flex flex-col selection:bg-[#e11d48] selection:text-white">
      {/* Hidden Audio Player for Gemini Voice Playback */}
      <audio
        ref={audioRef}
        onPlay={handleAudioPlay}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        className="hidden"
        preload="auto"
      />

      {/* 1. TOP STATUS BAR */}
      <header className="px-4 py-3 bg-[#18181b]/90 border-b border-white/10 backdrop-blur-md flex items-center justify-between gap-4 z-40">
        <div className="flex items-center gap-3">
          <Link to="/mock-chamber" className="flex items-center gap-2 text-white hover:text-[#e11d48] transition-colors">
            <img src={logo2} alt="CareerFlow Logo" className="h-8 w-auto object-contain brightness-150" />
          </Link>
          <div className="hidden sm:block w-[1px] h-5 bg-white/20" />
          <div className="hidden sm:flex items-center gap-2 text-[12px] font-bold text-white/70">
            <span className="text-white font-mono uppercase">{session.role}</span>
            <span>•</span>
            <span className="text-[#e11d48]">{session.mode} Round</span>
          </div>
        </div>

        {/* Question Counter & Timer */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[12px] font-bold font-mono">
            <span className="text-[#e11d48]">Q{currentQIndex + 1}</span>
            <span className="text-white/40">/</span>
            <span>{totalRounds}</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-mono font-bold border ${
              timeLeft < 15
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : 'bg-white/5 text-white/80 border-white/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={toggleMute}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleFinishInterview}
            className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/30 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap"
          >
            End Interview
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-white/10 h-1">
        <div className="bg-[#e11d48] h-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* 2. MAIN CHAMBER STAGE */}
      <div className="flex-1 flex flex-col max-w-[1100px] w-full mx-auto px-4 py-4 md:py-6 gap-4">
        {/* VIDEO AVATAR & SUBTITLES CONTAINER */}
        <div className="relative aspect-video max-h-[460px] w-full rounded-[20px] overflow-hidden bg-black border border-white/10 shadow-2xl mx-auto flex items-center justify-center">
          <video
            ref={videoRef}
            src={session.interviewerGender === 'male' ? maleAiVideo : femaleAiVideo}
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          {/* AI Status Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[11.5px] font-bold">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isTtsLoading
                  ? 'bg-amber-400 animate-pulse'
                  : isAiSpeaking
                  ? 'bg-[#e11d48] animate-ping'
                  : isRecording
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-white/40'
              }`}
            />
            <span className="font-mono text-white/90">
              {isTtsLoading ? (
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Interviewer is thinking...</span>
                </span>
              ) : isAiSpeaking ? (
                `${interviewerName} Speaking...`
              ) : isRecording ? (
                'Listening to Candidate...'
              ) : (
                'Candidate Answering'
              )}
            </span>
          </div>

          {/* Interviewer Info Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[11px] text-white/80 font-bold">
            <Bot className="w-3.5 h-3.5 text-[#e11d48]" />
            <span>{interviewerName}</span>
            <span className="text-white/40 font-mono text-[10px]">({interviewerVoiceModel})</span>
          </div>

          {/* LIVE CAPTIONS / QUESTION SUBTITLES BOX */}
          <div className="absolute bottom-4 inset-x-4 sm:inset-x-8 bg-black/85 backdrop-blur-md border border-white/15 p-4 rounded-[14px] text-center shadow-lg">
            <div className="text-[11px] font-mono text-[#e11d48] font-black uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5 flex-wrap">
              <Sparkles className="w-3 h-3" />
              <span>
                Question {currentQIndex + 1} of {totalRounds} • Topic: {currentQ?.topic || 'Core Engineering'} • Difficulty: {currentQ?.difficulty || 'medium'}
              </span>
            </div>

            {/* Intermediary Spoken Judgment if available for Rounds 2+ */}
            {currentQ?.spokenJudgment && (
              <div className="mb-2.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[12px] font-medium max-w-xl mx-auto shadow-sm">
                <span className="font-bold text-white/90">{interviewerName}:</span>
                <span>"{currentQ.spokenJudgment}"</span>
              </div>
            )}

            <p className="text-[15.5px] sm:text-[17.5px] font-bold text-white leading-snug drop-shadow-sm">
              "{currentQ?.question || 'Preparing your next question...'}"
            </p>

            {/* TTS Error or Retry Option */}
            {ttsError && currentQ && (
              <div className="mt-2 text-[12px] text-amber-300 flex items-center justify-center gap-2">
                <span>{ttsError}</span>
                <button
                  type="button"
                  onClick={() => playQuestionAudio(currentQ.spokenText || currentQ.question)}
                  className="px-2 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Voice</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. CANDIDATE INTERACTIVE CONSOLE */}
        <div className="bg-[#18181b] border border-white/10 rounded-[18px] p-4 sm:p-5 shadow-xl space-y-4">
          {/* Header Controls */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-white">Your Live Response</span>
              {isRecording && (
                <span className="flex items-center gap-1.5 text-[11px] font-mono text-red-400 font-bold bg-red-950/60 px-2.5 py-0.5 rounded-full border border-red-500/40 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>RECORDING LIVE ({Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')})</span>
                </span>
              )}
              {isTranscribing && (
                <span className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300 font-bold bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                  <span>Transcribing with Gemini...</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[12px]">
              <button
                onClick={() => playQuestionAudio(currentQ.question)}
                disabled={isTtsLoading || isAiSpeaking}
                className="px-2.5 py-1 rounded-[8px] bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white/80 border border-white/10 flex items-center gap-1 transition-colors cursor-pointer"
                title="Re-speak the current question using Gemini TTS"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Repeat Voice</span>
              </button>

              <button
                onClick={() => {
                  if (isRecording) stopRecording();
                  setIsTypingMode(!isTypingMode);
                }}
                className="px-2.5 py-1 rounded-[8px] bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Keyboard className="w-3.5 h-3.5 text-[#e11d48]" />
                <span>{isTypingMode ? 'Switch to Voice Mode' : 'Switch to Type Mode'}</span>
              </button>
            </div>
          </div>

          {/* Mic Denied Warning (Only when permission explicitly denied) */}
          {micError && (
            <div className="p-3 rounded-[10px] bg-red-950/50 border border-red-500/40 text-red-200 text-[12px] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{micError}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMicError(null);
                  startRecording();
                }}
                className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-500/40 font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
              >
                Grant & Retry
              </button>
            </div>
          )}

          {/* Transcript / Input Canvas */}
          {isTypingMode ? (
            <div>
              <textarea
                rows={3}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Type your structured answer here (press 'Submit & Next Question' when ready)..."
                className="w-full p-3 rounded-[10px] bg-black/40 border border-white/10 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-[#e11d48]"
              />
            </div>
          ) : (
            <div className="min-h-[80px] max-h-[160px] overflow-y-auto p-3.5 rounded-[12px] bg-black/40 border border-white/10 text-[14px] leading-relaxed">
              {isTranscribing ? (
                <div className="flex items-center gap-2 text-amber-300 text-[13px] py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Converting your speech to text using Gemini Multimodal AI...</span>
                </div>
              ) : isRecording ? (
                <div className="flex items-center gap-2 text-red-400 text-[13px] py-1 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span>
                    Listening to your voice ({Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}). Speak your answer clearly. When done, click "Done Speaking".
                  </span>
                </div>
              ) : transcript.trim() || manualText.trim() ? (
                <div className="space-y-1">
                  <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Captured Answer (Voice Transcribed):</span>
                  </div>
                  <p className="text-white font-medium">{transcript.trim() || manualText.trim()}</p>
                </div>
              ) : (
                <span className="text-white/40 italic flex items-center gap-2 py-1">
                  <Mic className="w-4 h-4 text-[#e11d48] animate-pulse" />
                  <span>
                    {isAiSpeaking
                      ? `${interviewerName} is speaking. Mic will activate automatically when finished...`
                      : "Click 'Start Speaking' below to record your answer natively. Gemini AI will transcribe your speech."}
                  </span>
                </span>
              )}
            </div>
          )}

          {/* AI Instant Redline Feedback Toast */}
          {recentFeedback && (
            <div className="p-3 rounded-[10px] bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[12.5px] flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold">Interviewer Redline: </span>
                <span>{recentFeedback}</span>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!isTypingMode && (
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={isAiSpeaking || isTtsLoading || isTranscribing}
                  className={`px-5 py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer w-full sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 animate-pulse'
                      : 'bg-[#e11d48] hover:bg-[#be123c] text-white shadow-lg shadow-[#e11d48]/20'
                  }`}
                  title={isAiSpeaking ? 'Microphone is paused while interviewer is speaking' : ''}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4 text-white" />
                      <span>Done Speaking ({Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')})</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-white" />
                      <span>{isAiSpeaking ? 'Interviewer Speaking...' : isTranscribing ? 'Transcribing...' : 'Start Speaking'}</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleSkipQuestion}
                className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 text-[13px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Skip</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleProceedNext}
              disabled={isEvaluating || isTranscribing}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white text-[#141416] hover:bg-white/90 font-bold text-[13.5px] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isEvaluating ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#141416] border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating Answer...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#e11d48]" />
                  <span>
                    {currentQIndex + 1 === session.questions.length ? 'Submit & Finalize' : 'Submit & Next Question'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
