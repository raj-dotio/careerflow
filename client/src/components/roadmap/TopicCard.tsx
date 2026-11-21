import { useState } from 'react';
import {
  Check,
  Clock,
  ExternalLink,
  Video,
  BookOpen,
  Code,
  Rocket,
  Lightbulb,
  FileText,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import type { IRoadmapTopic } from '../../types/roadmap';

interface TopicCardProps {
  topic: IRoadmapTopic;
  onUpdate: (
    topicId: string,
    payload: {
      status?: 'pending' | 'in_progress' | 'completed';
      confidenceScore?: number;
      notes?: string;
    }
  ) => Promise<void>;
}

export default function TopicCard({ topic, onUpdate }: TopicCardProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(Boolean(topic.notes));
  const [localNotes, setLocalNotes] = useState<string>(topic.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [notesSavedMsg, setNotesSavedMsg] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const isCompleted = topic.status === 'completed';
  const isInProgress = topic.status === 'in_progress';

  const handleToggleCheck = async () => {
    setIsUpdating(true);
    try {
      const nextStatus = isCompleted ? 'pending' : 'completed';
      await onUpdate(topic._id, { status: nextStatus });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as 'pending' | 'in_progress' | 'completed';
    setIsUpdating(true);
    try {
      await onUpdate(topic._id, { status: newStatus });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfidenceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const score = Number(e.target.value);
    await onUpdate(topic._id, { confidenceScore: score });
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await onUpdate(topic._id, { notes: localNotes });
      setNotesSavedMsg(true);
      setTimeout(() => setNotesSavedMsg(false), 2000);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'beginner':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'intermediate':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'advanced':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-300';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-300';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-300';
    return 'text-rose-600 bg-rose-50 border-rose-300';
  };

  return (
    <div
      className={`rounded-2xl border-2 transition-all ${
        isCompleted
          ? 'bg-[#fcfdfa] border-emerald-700/50 shadow-xs'
          : isInProgress
          ? 'bg-white border-[#18181b] shadow-sm ring-1 ring-[#18181b]'
          : 'bg-white border-[#e4e4e7] hover:border-[#18181b]'
      }`}
    >
      {/* Top Header Row */}
      <div className="p-4 sm:p-5 flex items-start gap-3.5">
        {/* Instant Checkbox */}
        <button
          type="button"
          onClick={handleToggleCheck}
          disabled={isUpdating}
          className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
            isCompleted
              ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
              : 'border-[#18181b] bg-white hover:bg-[#ffe4e6]'
          }`}
          title={isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
        >
          {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
        </button>

        {/* Topic Title & Metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getDifficultyBadge(
                topic.difficulty
              )}`}
            >
              {topic.difficulty}
            </span>

            <span className="text-xs font-semibold text-[#71717a] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {topic.estimatedHours} hrs
            </span>

            <span className="text-xs font-semibold text-[#a1a1aa] hidden sm:inline">•</span>

            <span className="text-xs text-[#71717a] font-medium truncate">
              {topic.module}
            </span>
          </div>

          <h3
            className={`text-base font-extrabold tracking-tight transition-all ${
              isCompleted ? 'text-zinc-500 line-through' : 'text-[#141416]'
            }`}
          >
            {topic.orderIndex}. {topic.title}
          </h3>

          <p className="text-xs sm:text-sm text-[#52525b] mt-1 leading-relaxed">
            {topic.description}
          </p>
        </div>

        {/* Right Status Dropdown & Expand Button */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={topic.status}
            onChange={handleStatusChange}
            disabled={isUpdating}
            className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border-2 transition-all cursor-pointer focus:outline-none ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-800 border-emerald-600'
                : isInProgress
                ? 'bg-amber-50 text-amber-800 border-amber-600'
                : 'bg-white text-[#52525b] border-[#18181b]'
            }`}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-[#e4e4e7] hover:border-[#18181b] bg-white text-[#52525b] cursor-pointer"
            title={isExpanded ? 'Collapse details' : 'Expand resources & notes'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Section: Confidence, Notes, Resources, AI Notes & Practice Project */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#f4f4f5] space-y-5">
          {/* Controls Bar: Confidence & Notes Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 bg-[#faf8f5] p-3.5 rounded-xl border border-[#e4e4e7]">
            {/* Confidence Rating Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[#141416] mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#e11d48]" />
                  Self-Assessed Confidence
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md border text-xs font-black ${getConfidenceColor(
                    topic.confidenceScore
                  )}`}
                >
                  {topic.confidenceScore}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={topic.confidenceScore}
                onChange={handleConfidenceChange}
                className="w-full accent-[#e11d48] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#71717a] font-semibold mt-1">
                <span>Doubtful (&lt;40%)</span>
                <span>Adequate (60%)</span>
                <span>Mastered (90%+)</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNotesOpen(!isNotesOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#18181b] bg-white text-xs font-bold hover:bg-[#f4f4f5] cursor-pointer shadow-xs"
              >
                <FileText className="w-3.5 h-3.5 text-[#e11d48]" />
                <span>{topic.notes ? 'Edit Study Note' : '+ Add Note'}</span>
              </button>
            </div>
          </div>

          {/* Notes Section Drawer */}
          {isNotesOpen && (
            <div className="p-3.5 bg-white rounded-xl border-2 border-[#18181b] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#141416]">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#e11d48]" />
                  Personal Topic Note & Key Takeaways
                </span>
                {notesSavedMsg && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Saved!
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                placeholder="Write your reflection here: What did you build? What was tricky? Any gotchas to revise before interviews..."
                className="w-full p-2.5 text-xs sm:text-sm bg-[#fafafa] border border-[#d4d4d8] rounded-lg focus:outline-none focus:border-[#18181b] focus:bg-white leading-relaxed"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="px-3.5 py-1.5 sketch-btn-red text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSavingNotes ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          )}

          {/* AI Mentor Advice Callout */}
          {topic.aiNotes && (
            <div className="p-3.5 rounded-xl bg-[#fff1f2] border border-[#fecdd3] flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-[#e11d48] shrink-0 mt-0.5" />
              <div className="text-xs text-[#881337] leading-relaxed">
                <strong className="font-extrabold">Mentor Pro-Tip: </strong>
                {topic.aiNotes}
              </div>
            </div>
          )}

          {/* Practice Mini-Project Assignment */}
          {topic.practiceProject && (
            <div className="p-3.5 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] flex items-start gap-2.5">
              <Rocket className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs text-[#14532d] leading-relaxed">
                <strong className="font-extrabold">Mini-Project Sprint: </strong>
                {topic.practiceProject}
              </div>
            </div>
          )}

          {/* Curated Resources Section */}
          {topic.resources && topic.resources.length > 0 && (
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#141416] mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#e11d48]" />
                Curated Tutorials, Docs & Practice Links
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {topic.resources.map((res, idx) => {
                  const isYt = res.type === 'youtube' || res.url.includes('youtube.com');
                  const isExercise = res.type === 'exercise';
                  return (
                    <a
                      key={idx}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl border border-[#e4e4e7] hover:border-[#18181b] bg-[#fafafa] hover:bg-white flex items-center justify-between gap-2 group transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isYt ? (
                          <div className="w-6 h-6 rounded-md bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                            <Video className="w-3.5 h-3.5" />
                          </div>
                        ) : isExercise ? (
                          <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <Code className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-md bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                            <BookOpen className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="text-xs font-bold text-[#141416] truncate group-hover:text-[#e11d48] transition-colors">
                          {res.title}
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[#a1a1aa] group-hover:text-[#18181b] shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
