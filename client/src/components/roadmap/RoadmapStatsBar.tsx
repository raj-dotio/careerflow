import {
  CheckCircle2,
  Flame,
  Award,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { IRoadmapStats } from '../../types/roadmap';

interface StatsBarProps {
  stats: IRoadmapStats;
  totalWeeks: number;
}

export default function RoadmapStatsBar({ stats, totalWeeks }: StatsBarProps) {
  return (
    <div className="space-y-4">
      {/* Primary Progress Hero Strip */}
      <div className="sketch-card p-5 bg-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="w-full md:w-1/2 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#141416]">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[#71717a]">
              <Sparkles className="w-3.5 h-3.5 text-[#e11d48]" />
              Roadmap Completion
            </span>
            <span className="text-sm font-black text-[#e11d48]">
              {stats.completionPercent}% Complete
            </span>
          </div>

          <div className="w-full h-3.5 bg-[#f4f4f5] rounded-full border border-[#18181b] overflow-hidden p-0.5">
            <div
              className="h-full bg-[#e11d48] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.max(stats.completionPercent, 2)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#71717a] font-medium">
            <span>{stats.completedTopics} of {stats.totalTopics} milestones unlocked</span>
            <span>{stats.completedHours}h completed / {stats.totalHours}h estimated</span>
          </div>
        </div>

        {/* Current Week Banner Pill */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-[#f4f4f5]">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#faf8f5] border-2 border-[#18181b] rounded-xl shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#e11d48] text-white flex items-center justify-center font-black text-sm">
              W{stats.currentWeek}
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">
                Current Active Focus
              </div>
              <div className="text-xs font-black text-[#141416]">
                Week {stats.currentWeek} of {totalWeeks}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Micro-Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Completed Topics */}
        <div className="p-4 bg-white rounded-xl border-2 border-[#18181b] shadow-xs">
          <div className="flex items-center justify-between text-[#71717a] mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[#141416]">
            {stats.completedTopics}
            <span className="text-xs font-semibold text-[#71717a] ml-1">/ {stats.totalTopics}</span>
          </div>
          <div className="text-[11px] text-[#71717a] mt-0.5 font-medium">
            {stats.pendingTopics} pending milestones
          </div>
        </div>

        {/* Metric 2: In-Progress */}
        <div className="p-4 bg-white rounded-xl border-2 border-[#18181b] shadow-xs">
          <div className="flex items-center justify-between text-[#71717a] mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-[#141416]">
            {stats.inProgressTopics}
          </div>
          <div className="text-[11px] text-[#71717a] mt-0.5 font-medium">
            Active studying topics
          </div>
        </div>

        {/* Metric 3: Confidence Score */}
        <div className="p-4 bg-white rounded-xl border-2 border-[#18181b] shadow-xs">
          <div className="flex items-center justify-between text-[#71717a] mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Confidence</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-[#141416]">
            {stats.averageConfidence}%
          </div>
          <div className="text-[11px] text-[#71717a] mt-0.5 font-medium">
            Self-assessed readiness
          </div>
        </div>

        {/* Metric 4: Learning Streak */}
        <div className="p-4 bg-white rounded-xl border-2 border-[#18181b] shadow-xs">
          <div className="flex items-center justify-between text-[#71717a] mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Study Streak</span>
            <Flame className="w-4 h-4 text-[#e11d48]" />
          </div>
          <div className="text-2xl font-black text-[#e11d48] flex items-center gap-1">
            <span>{Math.max(stats.streakCount, 1)}</span>
            <span className="text-xs font-semibold text-[#71717a]">Days 🔥</span>
          </div>
          <div className="text-[11px] text-[#71717a] mt-0.5 font-medium">
            Keep momentum alive!
          </div>
        </div>
      </div>
    </div>
  );
}
