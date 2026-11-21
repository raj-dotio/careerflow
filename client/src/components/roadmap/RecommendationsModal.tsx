import {
  Sparkles,
  ArrowRight,
  AlertCircle,
  Rocket,
  BookOpen,
  RotateCcw,
  X,
  ExternalLink,
} from 'lucide-react';
import type { IRecommendation } from '../../types/roadmap';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: IRecommendation | null;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  roadmapTitle?: string;
}

export default function RecommendationsModal({
  isOpen,
  onClose,
  recommendation,
  onRefresh,
  isRefreshing,
  roadmapTitle,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#faf8f5] rounded-3xl border-3 border-[#18181b] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-white border-b-2 border-[#18181b] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e11d48] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#e11d48]">
                {roadmapTitle ? `${roadmapTitle} • AI Coach` : 'Personalized Learning Coach'}
              </div>
              <h2 className="text-xl font-black text-[#141416]">
                Smart Recommendations & Insights
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-1.5 sketch-btn-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Re-analyze current progress"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Analyzing...' : 'Refresh AI'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl border border-[#e4e4e7] hover:border-[#18181b] bg-[#fafafa] hover:bg-white text-[#71717a] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Strategic Summary Box */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#18181b] shadow-xs">
            <div className="text-xs font-black uppercase tracking-wider text-[#71717a] mb-1.5">
              Strategic Status
            </div>
            <p className="text-sm font-bold text-[#141416] leading-relaxed">
              {recommendation?.summary ||
                'Keep progressing on your active milestones. The AI coach evaluates your progress and suggests targeted focus areas.'}
            </p>
            {recommendation?.encouragement && (
              <p className="text-xs text-[#52525b] mt-2 italic bg-[#faf8f5] p-2.5 rounded-lg border border-[#e4e4e7]">
                💡 "{recommendation.encouragement}"
              </p>
            )}
          </div>

          {/* Section 1: Next Recommended Topics */}
          {recommendation?.nextTopics && recommendation.nextTopics.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#141416] mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-[#e11d48]" />
                Top Next Actions to Build Momentum
              </h3>
              <div className="space-y-2.5">
                {recommendation.nextTopics.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white border-2 border-[#18181b] shadow-xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-md bg-[#e11d48] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-black text-[#141416]">{item.title}</h4>
                    </div>
                    <p className="text-xs text-[#52525b] pl-7">{item.reason}</p>
                    {item.expectedOutcome && (
                      <p className="text-[11px] text-emerald-700 font-semibold pl-7 mt-1">
                        ✦ Outcome: {item.expectedOutcome}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Revision & Weak Areas */}
          {recommendation?.revisionAreas && recommendation.revisionAreas.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#141416] mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Revision Watchlist (Low Confidence Topics)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {recommendation.revisionAreas.map((rev, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-amber-50/70 border border-amber-300 text-xs"
                  >
                    <div className="font-extrabold text-amber-900">{rev.title}</div>
                    <div className="text-amber-800 text-[11px] mt-0.5">{rev.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Recommended Practice Projects */}
          {recommendation?.practiceProjects && recommendation.practiceProjects.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#141416] mb-3 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-emerald-600" />
                Suggested Practice Project Sprints
              </h3>
              <div className="space-y-2.5">
                {recommendation.practiceProjects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white border border-[#18181b] shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-[#141416]">{proj.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {proj.focusArea}
                      </span>
                    </div>
                    <p className="text-xs text-[#52525b] leading-relaxed">{proj.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Recommended Resources */}
          {recommendation?.resources && recommendation.resources.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#141416] mb-2.5 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Recommended Tutorials & Official Documentation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recommendation.resources.map((res, idx) => (
                  <a
                    key={idx}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white rounded-xl border border-[#e4e4e7] hover:border-[#18181b] flex items-center justify-between text-xs font-bold text-[#141416] hover:text-[#e11d48] transition-all group"
                  >
                    <span className="truncate">{res.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#a1a1aa] group-hover:text-[#18181b] shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t-2 border-[#18181b] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 sketch-btn-red text-xs font-black cursor-pointer"
          >
            Got It, Back to Roadmap
          </button>
        </div>
      </div>
    </div>
  );
}
