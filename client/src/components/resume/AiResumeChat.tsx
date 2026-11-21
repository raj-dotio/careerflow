import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  RotateCcw,
  RotateCw,
  CheckCircle2,
  FileUp,
  Briefcase,
  User,
  GraduationCap,
  Code2,
  FolderGit2,
  Award,
  SlidersHorizontal,
  RefreshCw,
  FileCheck,
  Download,
  AlertCircle,
  Wand2,
} from 'lucide-react';
import { type ResumeData } from '../../utils/sampleResume';
import { type ResumePatchOp } from '../../utils/resumePatch';

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  question?: string | null;
  inputType?: 'text' | 'single_choice' | 'multi_choice' | 'yes_no';
  quickOptions?: string[];
  allowCustomAnswer?: boolean;
  section?: 'basics' | 'experience' | 'education' | 'skills' | 'projects' | 'awards' | 'style';
  patchesApplied?: ResumePatchOp[];
  suggestions?: string[];
  isComplete?: boolean;
}

interface AiResumeChatProps {
  resume: ResumeData;
  onApplyPatches: (patches: ResumePatchOp[], targetSection?: string) => void;
  onJumpToSection: (section: 'basics' | 'experience' | 'education' | 'skills' | 'projects' | 'awards' | 'style') => void;
  onSwitchToManual: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onDownloadPdf: () => void;
  onCheckAts: () => void;
  onSave: () => void;
  onImportParsedResume: (parsedData: ResumeData) => void;
}

const SECTIONS: Array<{
  id: 'basics' | 'experience' | 'education' | 'skills' | 'projects' | 'awards' | 'style';
  label: string;
  icon: any;
}> = [
  { id: 'basics', label: 'Basics', icon: User },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Code2 },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'awards', label: 'Honors', icon: Award },
  { id: 'style', label: 'Theme', icon: Sparkles },
];

export default function AiResumeChat({
  resume,
  onApplyPatches,
  onJumpToSection,
  onSwitchToManual,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDownloadPdf,
  onCheckAts,
  onSave,
  onImportParsedResume,
}: AiResumeChatProps) {
  const [currentSection, setCurrentSection] = useState<'basics' | 'experience' | 'education' | 'skills' | 'projects' | 'awards' | 'style'>('basics');
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [targetJd, setTargetJd] = useState('');
  const [showJdModal, setShowJdModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Works great for Indian English / Hinglish

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Send initial message on mount if messages are empty
  useEffect(() => {
    if (messages.length === 0) {
      sendChatTurn({ isInitial: true });
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in this browser. Please use Chrome or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      }
    }
  };

  const sendChatTurn = async (params: {
    messageText?: string;
    selectedOption?: string | string[];
    isInitial?: boolean;
    sectionOverride?: 'basics' | 'experience' | 'education' | 'skills' | 'projects' | 'awards' | 'style';
  }) => {
    setIsThinking(true);
    setErrorMessage(null);

    const activeSec = params.sectionOverride || currentSection;

    // Append user message if not initial
    if (!params.isInitial && (params.messageText || params.selectedOption)) {
      const userContent = params.messageText
        ? params.messageText
        : Array.isArray(params.selectedOption)
        ? params.selectedOption.join(', ')
        : String(params.selectedOption);

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: userContent,
        section: activeSec,
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    try {
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.text + (m.question ? `\nQuestion asked: ${m.question}` : ''),
      }));

      const res = await fetch('/api/resume-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'user-session',
          userMessage: params.messageText,
          selectedOption: params.selectedOption,
          currentSection: activeSec,
          resume,
          history: historyPayload,
          targetJd: targetJd.trim() || undefined,
          isInitial: params.isInitial,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('AI Coach rate limit reached. Please wait a moment and click Retry.');
        }
        throw new Error(json.message || 'Failed to communicate with AI Guide.');
      }

      const data = json.data;

      // Apply patches if returned
      if (Array.isArray(data.resume_patch) && data.resume_patch.length > 0) {
        onApplyPatches(data.resume_patch, data.current_section);
      }

      // Check section completion
      if (data.section_complete) {
        setCompletedSections((prev) => new Set(prev).add(activeSec));
        if (data.next_section && SECTIONS.some((s) => s.id === data.next_section)) {
          setCurrentSection(data.next_section);
          onJumpToSection(data.next_section);
        }
      } else if (data.current_section && data.current_section !== currentSection) {
        setCurrentSection(data.current_section);
        onJumpToSection(data.current_section);
      }

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: data.assistant_message,
        question: data.question,
        inputType: data.input_type || 'text',
        quickOptions: data.quick_options || [],
        allowCustomAnswer: data.allow_custom_answer !== false,
        section: data.current_section || activeSec,
        patchesApplied: data.resume_patch || [],
        suggestions: data.suggestions || [],
        isComplete: data.section_complete && data.current_section === 'style',
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setSelectedChips([]);
      setInputText('');
    } catch (err: any) {
      console.error('[AiResumeChat] Error:', err);
      setErrorMessage(err?.message || 'Something went wrong. Please retry.');
    } finally {
      setIsThinking(false);
    }
  };

  const handleSendCustomText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isThinking) return;
    sendChatTurn({ messageText: inputText.trim() });
  };

  const handleChipClick = (option: string, isMulti: boolean) => {
    if (isMulti) {
      setSelectedChips((prev) =>
        prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
      );
    } else {
      sendChatTurn({ selectedOption: option });
    }
  };

  const handleApplyMultiChips = () => {
    if (selectedChips.length === 0 || isThinking) return;
    sendChatTurn({ selectedOption: selectedChips });
  };

  const handleSkipQuestion = () => {
    sendChatTurn({ messageText: 'Skip this question for now. Move to the next detail.' });
  };

  const handleGoBack = () => {
    if (canUndo) {
      onUndo();
    }
    const secIndex = SECTIONS.findIndex((s) => s.id === currentSection);
    if (secIndex > 0) {
      const prevSec = SECTIONS[secIndex - 1].id;
      setCurrentSection(prevSec);
      onJumpToSection(prevSec);
      sendChatTurn({
        messageText: `Let us revisit and refine the ${prevSec} section.`,
        sectionOverride: prevSec,
      });
    }
  };

  const handleSectionTabClick = (sectionId: 'basics' | 'experience' | 'education' | 'skills' | 'projects' | 'awards' | 'style') => {
    setCurrentSection(sectionId);
    onJumpToSection(sectionId);
    sendChatTurn({
      messageText: `I want to work on the ${sectionId} section now.`,
      sectionOverride: sectionId,
    });
  };

  // Upload and parse existing resume file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('/api/resume-ai/parse', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to parse uploaded resume document.');
      }

      if (json.data && json.data.resume) {
        onImportParsedResume(json.data.resume);

        const welcomeText = `${json.data.initialGreeting || 'I successfully parsed your document!'} Let us review and boost its ATS score.`;
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-upload-${Date.now()}`,
            role: 'assistant',
            text: welcomeText,
            question: 'What target software role or company level are you aiming for with this resume?',
            inputType: 'single_choice',
            quickOptions: ['Full-Stack Engineer', 'Backend Engineer', 'Frontend Engineer', 'AI/ML Engineer', 'DevOps / Cloud'],
            allowCustomAnswer: true,
            section: 'basics',
          },
        ]);
        setCurrentSection('basics');
        onJumpToSection('basics');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error processing resume file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="flex flex-col h-full bg-white select-text">
      {/* 1. Header Toolbar with Mode Switcher & Undo/Redo */}
      <div className="border-b-2 border-[#18181b] px-4 py-3 bg-[#faf8f5] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#ffe4e6] text-[#e11d48] sketch-border-sm flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 text-[#e11d48]" />
          </div>
          <div>
            <h3 className="font-extrabold text-[14px] text-[#18181b] flex items-center gap-1.5 leading-none">
              <span>AI Resume Guide</span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#e11d48] text-white rounded">
                LIVE
              </span>
            </h3>
            <p className="text-[11px] text-[#71717a] font-medium mt-0.5">
              Interactive ATS Career Coach
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Undo / Redo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo AI changes"
            className={`p-1.5 sketch-border-sm text-[11px] font-bold flex items-center cursor-pointer transition-all ${
              canUndo
                ? 'bg-white hover:bg-[#ffe4e6] text-[#18181b]'
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed opacity-50'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo AI changes"
            className={`p-1.5 sketch-border-sm text-[11px] font-bold flex items-center cursor-pointer transition-all ${
              canRedo
                ? 'bg-white hover:bg-[#ffe4e6] text-[#18181b]'
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed opacity-50'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Switch to Manual Form toggle */}
          <button
            onClick={onSwitchToManual}
            title="Switch to traditional manual form editor"
            className="sketch-btn-white px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 hover:bg-[#ffe4e6] cursor-pointer"
          >
            <SlidersHorizontal className="w-3 h-3 text-[#e11d48]" />
            <span className="hidden sm:inline">Manual Edit</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Section Stepper Progress Bar */}
      <div className="border-b-2 border-[#18181b] bg-white px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {SECTIONS.map((sec, idx) => {
          const isCurrent = currentSection === sec.id;
          const isDone = completedSections.has(sec.id);
          const Icon = sec.icon;

          return (
            <button
              key={sec.id}
              onClick={() => handleSectionTabClick(sec.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-[8px] whitespace-nowrap transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-[#e11d48] text-white sketch-border-sm shadow-sm'
                  : isDone
                  ? 'bg-[#ecfdf5] text-[#059669] border border-[#059669]/30'
                  : 'bg-[#faf8f5] text-[#71717a] hover:bg-[#ffe4e6] border border-[#18181b]/15'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3 h-3 text-[#059669]" />
              ) : (
                <Icon className={`w-3 h-3 ${isCurrent ? 'text-white' : 'text-[#71717a]'}`} />
              )}
              <span>{sec.label}</span>
              {idx < SECTIONS.length - 1 && (
                <span className={`text-[10px] ml-0.5 ${isCurrent ? 'text-white/60' : 'text-zinc-300'}`}>›</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Action Badges for Smart Workflows: Upload Resume & Target JD */}
      <div className="bg-[#faf8f5] border-b border-[#18181b]/20 px-4 py-2 flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2">
          {/* Hidden File Input for PDF/DOCX Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white sketch-border-sm text-[#18181b] font-bold hover:bg-[#ffe4e6] cursor-pointer"
          >
            <FileUp className="w-3 h-3 text-[#e11d48]" />
            <span>{isUploading ? 'Extracting text...' : 'Import Resume (PDF/DOCX)'}</span>
          </button>

          <button
            onClick={() => setShowJdModal(!showJdModal)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 sketch-border-sm font-bold cursor-pointer transition-all ${
              targetJd ? 'bg-[#ffe4e6] text-[#e11d48]' : 'bg-white text-[#18181b] hover:bg-[#ffe4e6]'
            }`}
          >
            <Briefcase className="w-3 h-3 text-[#e11d48]" />
            <span>{targetJd ? 'JD Linked ✓' : 'Target Job Description'}</span>
          </button>
        </div>

        <span className="font-mono text-[10px] text-[#71717a] hidden sm:inline">
          Honest ATS Writer
        </span>
      </div>

      {/* Expandable Target JD Panel */}
      {showJdModal && (
        <div className="p-3 bg-[#fff1f2] border-b-2 border-[#18181b] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#e11d48] flex items-center gap-1">
              <Wand2 className="w-3.5 h-3.5" /> Paste Target Job Description:
            </span>
            <button
              onClick={() => setShowJdModal(false)}
              className="text-[10px] text-[#71717a] hover:text-[#18181b] font-bold"
            >
              Close ✕
            </button>
          </div>
          <textarea
            rows={2}
            value={targetJd}
            onChange={(e) => setTargetJd(e.target.value)}
            placeholder="Paste role responsibilities or tech stack (e.g. Next.js, Go, Redis, Microservices)..."
            className="w-full p-2 bg-white sketch-border-sm text-[11px] text-[#18181b] focus:outline-none focus:border-[#e11d48]"
          />
          <p className="text-[10px] text-[#71717a]">
            💡 AI will naturally align keywords into your genuine experience without fabricating facts.
          </p>
        </div>
      )}

      {/* 4. Chat Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-[13px] bg-white">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {msg.role === 'assistant' ? (
              <div className="max-w-[90%] space-y-1.5">
                <div className="p-3.5 bg-[#faf8f5] sketch-border-sm text-[#18181b] space-y-2">
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono font-bold text-[#e11d48]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>CAREER COACH</span>
                    {msg.section && (
                      <span className="text-zinc-400">· {msg.section.toUpperCase()}</span>
                    )}
                  </div>
                  <p className="leading-relaxed font-medium text-[13px]">{msg.text}</p>

                  {/* If patches were applied, highlight what was polished */}
                  {msg.patchesApplied && msg.patchesApplied.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-200/80 flex items-center gap-1.5 text-[11px] text-[#059669] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Updated live preview with ATS-optimized phrasing!</span>
                    </div>
                  )}

                  {/* Suggestions / ATS Tips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-1.5 p-2 bg-white rounded border border-[#18181b]/10 text-[11px] text-[#3f3f46]">
                      <span className="font-bold text-[#e11d48]">💡 Pro Tip: </span>
                      {msg.suggestions.join(' ')}
                    </div>
                  )}
                </div>

                {/* Question Callout */}
                {msg.question && (
                  <div className="p-3 bg-[#ffe4e6]/60 border-l-4 border-[#e11d48] sketch-border-sm text-[#18181b]">
                    <p className="font-bold text-[13px] text-[#18181b]">{msg.question}</p>
                  </div>
                )}

                {/* Final Review CTA when resume is complete */}
                {msg.isComplete && (
                  <div className="p-3 bg-[#ecfdf5] border-2 border-[#059669] sketch-border-sm space-y-2">
                    <span className="font-bold text-[#059669] text-[12px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Resume Creation Complete!
                    </span>
                    <p className="text-[11px] text-[#065f46]">
                      Your resume has been crafted according to high-signal ATS guidelines. You can
                      now test your ATS match score or download the final PDF.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={onCheckAts}
                        className="sketch-btn-red px-3 py-1 text-[11px] font-bold flex items-center gap-1"
                      >
                        <FileCheck className="w-3 h-3" /> Check ATS Score
                      </button>
                      <button
                        onClick={onDownloadPdf}
                        className="sketch-btn-white px-3 py-1 text-[11px] font-bold flex items-center gap-1"
                      >
                        <Download className="w-3 h-3 text-[#e11d48]" /> Download PDF
                      </button>
                      <button
                        onClick={onSave}
                        className="px-3 py-1 bg-white border border-[#18181b] text-[11px] font-bold rounded hover:bg-zinc-50"
                      >
                        Save to Cloud
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-[85%] p-3 bg-[#18181b] text-white sketch-border-sm">
                <p className="leading-relaxed font-medium text-[13px]">{msg.text}</p>
              </div>
            )}
          </div>
        ))}

        {/* Thinking / Typing Indicator */}
        {isThinking && (
          <div className="flex items-center gap-2 p-3 bg-[#faf8f5] sketch-border-sm max-w-[80%] text-[#71717a] text-[12px]">
            <RefreshCw className="w-3.5 h-3.5 text-[#e11d48] animate-spin" />
            <span className="font-medium animate-pulse">
              AI Coach is polishing ATS bullets &amp; updating preview...
            </span>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-300 rounded flex items-start gap-2 text-red-700 text-[12px]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1">
              <p className="font-bold">{errorMessage}</p>
              <button
                onClick={() => sendChatTurn({ messageText: 'Retry last turn' })}
                className="mt-1 text-[11px] font-bold underline hover:text-red-900 cursor-pointer"
              >
                Click to Retry
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 5. Interactive Bottom Area: Quick Option Chips & Custom Input */}
      <div className="border-t-2 border-[#18181b] p-3 bg-[#faf8f5] space-y-2.5">
        {/* Quick Option Chips (if offered by last assistant message) */}
        {lastAssistantMessage?.quickOptions && lastAssistantMessage.quickOptions.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#71717a]">
              <span>
                {lastAssistantMessage.inputType === 'multi_choice'
                  ? 'Select one or more options:'
                  : 'Quick Select:'}
              </span>
              {lastAssistantMessage.inputType === 'multi_choice' && selectedChips.length > 0 && (
                <button
                  onClick={handleApplyMultiChips}
                  disabled={isThinking}
                  className="px-2.5 py-0.5 bg-[#e11d48] text-white font-bold rounded hover:bg-[#be123c] text-[10px] cursor-pointer"
                >
                  Add Selected ({selectedChips.length}) ➔
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {lastAssistantMessage.quickOptions.map((opt) => {
                const isSelected = selectedChips.includes(opt);
                const isMulti = lastAssistantMessage.inputType === 'multi_choice';

                return (
                  <button
                    key={opt}
                    onClick={() => handleChipClick(opt, isMulti)}
                    disabled={isThinking}
                    className={`px-3 py-1.5 text-[12px] font-bold sketch-border-sm cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#e11d48] text-white'
                        : 'bg-white hover:bg-[#ffe4e6] text-[#18181b]'
                    }`}
                  >
                    {opt} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Text / Shorthand / Hinglish Input */}
        <form onSubmit={handleSendCustomText} className="space-y-1.5">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isThinking}
              placeholder={
                isListening
                  ? 'Listening to your voice... Speak now'
                  : 'Answer in rough words or Hinglish (e.g. stripe me intern tha, redis cache lagaya)...'
              }
              className={`w-full pl-3.5 pr-20 py-2.5 sketch-border-sm text-[13px] bg-white font-medium text-[#18181b] focus:outline-none focus:border-[#e11d48] transition-all ${
                isListening ? 'border-red-500 ring-2 ring-red-400 bg-red-50/30' : ''
              }`}
            />

            <div className="absolute right-2 flex items-center gap-1">
              {/* Mic Button */}
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? 'Stop recording' : 'Voice input (Speak in Hinglish or English)'}
                className={`p-1.5 rounded-md cursor-pointer transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-[#71717a] hover:text-[#e11d48] hover:bg-[#ffe4e6]'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isThinking}
                className={`p-1.5 bg-[#e11d48] text-white rounded-md cursor-pointer transition-all ${
                  !inputText.trim() || isThinking
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-[#be123c]'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom helper shortcuts: Skip question, Go back, Quick refinements */}
          <div className="flex items-center justify-between text-[11px] text-[#71717a] pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGoBack}
                disabled={isThinking}
                className="hover:text-[#18181b] underline font-medium cursor-pointer"
              >
                ← Go back / Edit previous
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={handleSkipQuestion}
                disabled={isThinking}
                className="hover:text-[#e11d48] font-bold cursor-pointer"
              >
                Skip for now ➔
              </button>
            </div>

            {/* Quick Refinement Triggers */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px]">
              <span className="text-zinc-400">Refine:</span>
              <button
                type="button"
                onClick={() => sendChatTurn({ messageText: 'Make the bullets more concise and punchy.' })}
                className="px-1.5 py-0.5 bg-white border border-[#18181b]/20 rounded hover:bg-[#ffe4e6] cursor-pointer"
              >
                Concise
              </button>
              <button
                type="button"
                onClick={() => sendChatTurn({ messageText: 'Add more strong technical keywords.' })}
                className="px-1.5 py-0.5 bg-white border border-[#18181b]/20 rounded hover:bg-[#ffe4e6] cursor-pointer"
              >
                Tech Keywords
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
