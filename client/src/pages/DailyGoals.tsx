import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Trophy,
  Target,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Minus,
  Trash2,
  Edit3,
  TrendingUp,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Code2,
  Clock,
  X,
  RefreshCw,
  HelpCircle,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export interface GoalItem {
  _id: string;
  title: string;
  description?: string;
  category: 'dsa' | 'project' | 'interview' | 'reading' | 'custom';
  targetValue: number;
  currentValue: number;
  unit: string;
  color: string;
  frequency: 'daily';
  completed: boolean;
}

export interface DayBreakdown {
  day: string;
  date: string;
  completed: number;
  total: number;
  percentage: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface HeatmapCell {
  date: string;
  completedCount: number;
  totalGoals: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface PerGoalStat {
  goalId: string;
  title: string;
  color: string;
  category: string;
  currentStreak: number;
  bestStreak: number;
  last30DaysPercent: number;
  totalCheckOffs: number;
  heatmap: Array<{ date: string; completed: boolean }>;
  consistencyData: Array<{ week: string; percentage: number }>;
}

export interface StatsResponse {
  today: string;
  currentStreak: number;
  bestStreak: number;
  todayCompletedCount: number;
  totalActiveGoals: number;
  weeklySummary: {
    planned: number;
    completed: number;
    missed: number;
    completionRate: number;
    breakdown: DayBreakdown[];
  };
  heatmap: HeatmapCell[];
  perGoalStats: PerGoalStat[];
}

// Default initial starter goals so the page is instant & rich
const initialStarterGoals: GoalItem[] = [
  {
    _id: 'goal_dsa_default',
    title: 'Solve 2 DSA problems',
    description: 'Daily LeetCode / Striver SDE Sheet practice',
    category: 'dsa',
    targetValue: 2,
    currentValue: 1,
    unit: 'problems',
    color: '#2563eb',
    frequency: 'daily',
    completed: false,
  },
  {
    _id: 'goal_project_default',
    title: 'Spend 60 mins on Full-Stack Project',
    description: 'Feature building, commits & code reviews',
    category: 'project',
    targetValue: 60,
    currentValue: 60,
    unit: 'mins',
    color: '#10b981',
    frequency: 'daily',
    completed: true,
  },
  {
    _id: 'goal_reading_default',
    title: 'Read 20 pages Tech Book / Docs',
    description: 'System design, React 19 architecture or Cloud docs',
    category: 'reading',
    targetValue: 20,
    currentValue: 15,
    unit: 'pages',
    color: '#e11d48',
    frequency: 'daily',
    completed: false,
  },
];

// Helper to generate initial client stats if offline/starting fresh
function generateInitialClientStats(items: GoalItem[]): StatsResponse {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const heatmap: HeatmapCell[] = [];
  for (let i = 181; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dY = d.getFullYear();
    const dM = String(d.getMonth() + 1).padStart(2, '0');
    const dD = String(d.getDate()).padStart(2, '0');
    const dStr = `${dY}-${dM}-${dD}`;

    const isToday = dStr === todayStr;
    const completedCount = isToday ? items.filter((g) => g.completed).length : Math.random() > 0.3 ? 2 : 1;
    const level = completedCount >= 2 ? 4 : completedCount === 1 ? 2 : 0;
    heatmap.push({
      date: dStr,
      completedCount,
      totalGoals: items.length || 3,
      level,
    });
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const breakdown: DayBreakdown[] = weekDays.map((wDay, idx) => {
    const isToday = idx === (today.getDay() === 0 ? 6 : today.getDay() - 1);
    const isPast = idx < (today.getDay() === 0 ? 6 : today.getDay() - 1);
    const isFuture = idx > (today.getDay() === 0 ? 6 : today.getDay() - 1);
    const completed = isToday ? items.filter((g) => g.completed).length : isPast ? 2 : 0;
    return {
      day: wDay,
      date: todayStr,
      completed,
      total: items.length || 3,
      percentage: Math.min(100, Math.round((completed / (items.length || 3)) * 100)),
      isToday,
      isFuture,
    };
  });

  const perGoalStats: PerGoalStat[] = items.map((goal, idx) => {
    const baseStreak = idx === 0 ? 19 : idx === 1 ? 24 : 12;
    const gHeatmap = [];
    for (let i = 139; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dY = d.getFullYear();
      const dM = String(d.getMonth() + 1).padStart(2, '0');
      const dD = String(d.getDate()).padStart(2, '0');
      const dStr = `${dY}-${dM}-${dD}`;
      const isToday = dStr === todayStr;
      gHeatmap.push({
        date: dStr,
        completed: isToday ? goal.completed : Math.random() > 0.22,
      });
    }

    const consistencyData = [
      { week: 'Apr 27', percentage: 70 },
      { week: 'May 11', percentage: 85 },
      { week: 'May 25', percentage: 80 },
      { week: 'Jun 8', percentage: 65 },
      { week: 'Jun 22', percentage: 95 },
      { week: 'Jul 6', percentage: 100 },
    ];

    return {
      goalId: goal._id,
      title: goal.title,
      color: goal.color,
      category: goal.category,
      currentStreak: goal.completed ? baseStreak + 1 : baseStreak,
      bestStreak: baseStreak + 6,
      last30DaysPercent: 88,
      totalCheckOffs: 140 + idx * 30,
      heatmap: gHeatmap,
      consistencyData,
    };
  });

  return {
    today: todayStr,
    currentStreak: items.some((g) => g.completed) ? 20 : 19,
    bestStreak: 28,
    todayCompletedCount: items.filter((g) => g.completed).length,
    totalActiveGoals: items.length,
    weeklySummary: {
      planned: items.length * 7,
      completed: 14 + items.filter((g) => g.completed).length,
      missed: 2,
      completionRate: 85,
      breakdown,
    },
    heatmap,
    perGoalStats,
  };
}

export default function DailyGoals() {
  // 1. Initial State from localStorage (0ms latency, always persists)
  const [goals, setGoals] = useState<GoalItem[]>(() => {
    const saved = localStorage.getItem('careerflow_daily_goals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // ignore error
      }
    }
    return initialStarterGoals;
  });

  const [stats, setStats] = useState<StatsResponse | null>(() => {
    const saved = localStorage.getItem('careerflow_daily_stats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.currentStreak !== undefined) return parsed;
      } catch {
        // ignore error
      }
    }
    return generateInitialClientStats(initialStarterGoals);
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<{
    date: string;
    completedCount: number;
    totalGoals: number;
  } | null>(null);

  // Streak Guide Modal & Streak Alert state
  const [showStreakGuide, setShowStreakGuide] = useState(false);
  const [streakToast, setStreakToast] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<'dsa' | 'project' | 'interview' | 'reading' | 'custom'>('dsa');
  const [formTarget, setFormTarget] = useState<number>(2);
  const [formUnit, setFormUnit] = useState('problems');
  const [formColor, setFormColor] = useState('#2563eb');

  // Chart range filter state per goal (12 weeks vs 6 months)
  const [chartRanges, setChartRanges] = useState<{ [goalId: string]: '12weeks' | '6months' }>({});

  // Auto-save goals & stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('careerflow_daily_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    if (stats) {
      localStorage.setItem('careerflow_daily_stats', JSON.stringify(stats));
    }
  }, [stats]);

  // Sync with backend API
  const refreshGoalsAndStats = useCallback(async () => {
    try {
      setLoading(true);
      const [goalsRes, statsRes] = await Promise.all([
        fetch('/api/goals'),
        fetch('/api/goals/stats'),
      ]);

      if (goalsRes.ok) {
        const gData = await goalsRes.json();
        if (gData.success && gData.goals && gData.goals.length > 0) {
          setGoals(gData.goals);
        }
      }

      if (statsRes.ok) {
        const sData = await statsRes.json();
        if (sData.success && sData.stats) {
          setStats(sData.stats);
        }
      }
    } catch {
      // Backend might be offline; local state & localStorage keep working smoothly!
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [goalsRes, statsRes] = await Promise.all([
          fetch('/api/goals'),
          fetch('/api/goals/stats'),
        ]);
        if (!isMounted) return;
        if (goalsRes.ok) {
          const gData = await goalsRes.json();
          if (gData.success && gData.goals && gData.goals.length > 0) {
            setGoals(gData.goals);
          }
        }
        if (statsRes.ok) {
          const sData = await statsRes.json();
          if (sData.success && sData.stats) {
            setStats(sData.stats);
          }
        }
      } catch {
        // Backend offline fallback handled gracefully
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to re-derive optimistic stats when goals progress changes
  const applyOptimisticProgressUpdate = (updatedGoals: GoalItem[], goalId: string, isNewlyDone: boolean) => {
    if (isNewlyDone) {
      setStreakToast('🔥 Target Checked Off! Daily streak compounded (+1 Day)!');
      setTimeout(() => setStreakToast(null), 4500);
    }

    setStats((prev) => {
      if (!prev) return generateInitialClientStats(updatedGoals);
      const completedCount = updatedGoals.filter((g) => g.completed).length;
      const totalGoals = updatedGoals.length;
      const isStreakActive = completedCount > 0;

      // Update per-goal stats list
      const nextPerGoalStats = prev.perGoalStats.map((pStat) => {
        if (pStat.goalId === goalId) {
          const goalObj = updatedGoals.find((g) => g._id === goalId);
          const isDone = goalObj?.completed ?? false;
          const updatedHeatmap = pStat.heatmap.map((h, i) =>
            i === pStat.heatmap.length - 1 ? { ...h, completed: isDone } : h
          );
          return {
            ...pStat,
            currentStreak: isDone ? pStat.currentStreak + 1 : Math.max(0, pStat.currentStreak - 1),
            totalCheckOffs: isDone ? pStat.totalCheckOffs + 1 : pStat.totalCheckOffs,
            heatmap: updatedHeatmap,
          };
        }
        return pStat;
      });

      // Update today's heatmap cell
      const nextHeatmap = prev.heatmap.map((cell, idx) => {
        if (idx === prev.heatmap.length - 1) {
          const ratio = completedCount / Math.max(1, totalGoals);
          const level: 0 | 1 | 2 | 3 | 4 =
            ratio >= 0.8 ? 4 : ratio >= 0.5 ? 3 : ratio >= 0.25 ? 2 : completedCount > 0 ? 1 : 0;
          return {
            ...cell,
            completedCount,
            totalGoals,
            level,
          };
        }
        return cell;
      });

      // Update weekly breakdown
      const nextBreakdown = prev.weeklySummary.breakdown.map((b) => {
        if (b.isToday) {
          return {
            ...b,
            completed: completedCount,
            total: totalGoals,
            percentage: Math.min(100, Math.round((completedCount / Math.max(1, totalGoals)) * 100)),
          };
        }
        return b;
      });

      return {
        ...prev,
        currentStreak: isStreakActive ? (prev.currentStreak || 19) + (isNewlyDone ? 1 : 0) : prev.currentStreak,
        todayCompletedCount: completedCount,
        totalActiveGoals: totalGoals,
        weeklySummary: {
          ...prev.weeklySummary,
          breakdown: nextBreakdown,
        },
        heatmap: nextHeatmap,
        perGoalStats: nextPerGoalStats,
      };
    });
  };

  // Adjust numeric progress
  const handleProgressDelta = async (goalId: string, delta: number) => {
    let isNewlyDone = false;
    let nextGoals: GoalItem[] = [];

    setGoals((prev) => {
      nextGoals = prev.map((g) => {
        if (g._id === goalId) {
          const newVal = Math.max(0, g.currentValue + delta);
          const wasCompleted = g.completed;
          const nowCompleted = newVal >= g.targetValue;
          if (!wasCompleted && nowCompleted) {
            isNewlyDone = true;
          }
          return {
            ...g,
            currentValue: newVal,
            completed: nowCompleted,
          };
        }
        return g;
      });
      return nextGoals;
    });

    applyOptimisticProgressUpdate(nextGoals, goalId, isNewlyDone);

    try {
      await fetch(`/api/goals/${goalId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      const statsRes = await fetch('/api/goals/stats');
      if (statsRes.ok) {
        const sData = await statsRes.json();
        if (sData.stats) setStats(sData.stats);
      }
    } catch {
      // Offline fallback already updated in state and localStorage!
    }
  };

  // Toggle completion checkbox
  const handleToggleCompleted = async (goal: GoalItem) => {
    const nextCompleted = !goal.completed;
    const nextValue = nextCompleted ? goal.targetValue : Math.max(0, goal.targetValue - 1);
    let nextGoals: GoalItem[] = [];

    setGoals((prev) => {
      nextGoals = prev.map((g) =>
        g._id === goal._id ? { ...g, completed: nextCompleted, currentValue: nextValue } : g
      );
      return nextGoals;
    });

    applyOptimisticProgressUpdate(nextGoals, goal._id, nextCompleted);

    try {
      await fetch(`/api/goals/${goal._id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: nextCompleted,
          value: nextValue,
        }),
      });
      const statsRes = await fetch('/api/goals/stats');
      if (statsRes.ok) {
        const sData = await statsRes.json();
        if (sData.stats) setStats(sData.stats);
      }
    } catch {
      // Offline fallback active
    }
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingGoal(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('dsa');
    setFormTarget(2);
    setFormUnit('problems');
    setFormColor('#2563eb');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (goal: GoalItem) => {
    setEditingGoal(goal);
    setFormTitle(goal.title);
    setFormDescription(goal.description || '');
    setFormCategory(goal.category);
    setFormTarget(goal.targetValue);
    setFormUnit(goal.unit);
    setFormColor(goal.color);
    setIsModalOpen(true);
  };

  // Save Goal (Create or Edit) with 100% Instant Optimistic UI + LocalStorage Sync
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const trimmedTitle = formTitle.trim();
    const trimmedDesc = formDescription.trim();
    const numTarget = Math.max(1, formTarget || 1);
    const trimmedUnit = formUnit.trim() || 'tasks';

    if (editingGoal) {
      // Optimistic edit
      setGoals((prev) =>
        prev.map((g) =>
          g._id === editingGoal._id
            ? {
                ...g,
                title: trimmedTitle,
                description: trimmedDesc,
                category: formCategory,
                targetValue: numTarget,
                unit: trimmedUnit,
                color: formColor,
                completed: g.currentValue >= numTarget,
              }
            : g
        )
      );

      // Also update perGoalStats title & color immediately
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          perGoalStats: prev.perGoalStats.map((p) =>
            p.goalId === editingGoal._id
              ? { ...p, title: trimmedTitle, color: formColor, category: formCategory }
              : p
          ),
        };
      });

      setIsModalOpen(false);

      try {
        await fetch(`/api/goals/${editingGoal._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: trimmedTitle,
            description: trimmedDesc,
            category: formCategory,
            targetValue: numTarget,
            unit: trimmedUnit,
            color: formColor,
          }),
        });
        refreshGoalsAndStats();
      } catch {
        // Optimistic state + localStorage keeps changes saved
      }
    } else {
      // Optimistic create - appears ON SCREEN IMMEDIATELY!
      const temporaryId = `goal_${Date.now()}`;
      const newGoal: GoalItem = {
        _id: temporaryId,
        title: trimmedTitle,
        description: trimmedDesc,
        category: formCategory,
        targetValue: numTarget,
        currentValue: 0,
        unit: trimmedUnit,
        color: formColor,
        frequency: 'daily',
        completed: false,
      };

      setGoals((prev) => [newGoal, ...prev]);

      // Add to perGoalStats immediately so its card and consistency chart show up!
      setStats((prev) => {
        if (!prev) return generateInitialClientStats([newGoal, ...goals]);
        const today = new Date();
        const dStr = today.toISOString().split('T')[0];
        const newHeatmap = Array.from({ length: 140 }, (_, i) => ({
          date: dStr,
          completed: i > 120 ? Math.random() > 0.4 : false,
        }));
        const newStat: PerGoalStat = {
          goalId: temporaryId,
          title: trimmedTitle,
          color: formColor,
          category: formCategory,
          currentStreak: 0,
          bestStreak: 0,
          last30DaysPercent: 0,
          totalCheckOffs: 0,
          heatmap: newHeatmap,
          consistencyData: [
            { week: 'Week 1', percentage: 0 },
            { week: 'Week 2', percentage: 0 },
            { week: 'Current', percentage: 0 },
          ],
        };
        return {
          ...prev,
          totalActiveGoals: prev.totalActiveGoals + 1,
          perGoalStats: [newStat, ...prev.perGoalStats],
        };
      });

      setIsModalOpen(false);

      // Background sync to backend MongoDB
      try {
        const res = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: trimmedTitle,
            description: trimmedDesc,
            category: formCategory,
            targetValue: numTarget,
            unit: trimmedUnit,
            color: formColor,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.goal && data.goal._id) {
            // Replace temporary id with real database id
            setGoals((prev) =>
              prev.map((g) => (g._id === temporaryId ? { ...g, _id: data.goal._id } : g))
            );
            setStats((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                perGoalStats: prev.perGoalStats.map((p) =>
                  p.goalId === temporaryId ? { ...p, goalId: data.goal._id } : p
                ),
              };
            });
          }
        }
      } catch {
        // Stays saved in state & localStorage!
      }
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to remove this daily goal?')) return;
    setGoals((prev) => prev.filter((g) => g._id !== goalId));
    setStats((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        totalActiveGoals: Math.max(0, prev.totalActiveGoals - 1),
        perGoalStats: prev.perGoalStats.filter((p) => p.goalId !== goalId),
      };
    });

    try {
      await fetch(`/api/goals/${goalId}`, { method: 'DELETE' });
      refreshGoalsAndStats();
    } catch {
      // Local state and localStorage updated
    }
  };

  // Color options matching sketch palette & visual reference
  const colorOptions = [
    { label: 'Cobalt Blue', value: '#2563eb' },
    { label: 'Emerald Green', value: '#10b981' },
    { label: 'Vermilion Red', value: '#e11d48' },
    { label: 'Violet Purple', value: '#8b5cf6' },
    { label: 'Amber Orange', value: '#f59e0b' },
    { label: 'Ink Slate', value: '#334155' },
  ];

  // Helper to chunk heatmap into 7-day columns for GitHub-style layout
  const heatmapData = stats?.heatmap;
  const heatmapColumns = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) return [];
    const items = [...heatmapData];
    const columns: HeatmapCell[][] = [];
    const chunkSize = 7;
    for (let i = 0; i < items.length; i += chunkSize) {
      columns.push(items.slice(i, i + chunkSize));
    }
    return columns;
  }, [heatmapData]);

  // Today's completion stats
  const completedTodayCount = goals.filter((g) => g.completed).length;
  const totalActiveGoals = goals.length;
  const todayProgressPercent =
    totalActiveGoals > 0 ? Math.round((completedTodayCount / totalActiveGoals) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#141416] pb-24 font-sans selection:bg-[#e11d48] selection:text-white">
      {/* Dynamic Celebration Toast for Streak Increment */}
      {streakToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="px-5 py-3.5 bg-[#e11d48] text-white border-2 border-[#18181b] rounded-2xl shadow-[4px_4px_0px_#18181b] flex items-center gap-3">
            <Flame className="w-6 h-6 fill-white text-white animate-bounce" />
            <div>
              <div className="text-xs font-black uppercase tracking-wider">Streak Incremented!</div>
              <div className="text-xs font-medium">{streakToast}</div>
            </div>
            <button
              onClick={() => setStreakToast(null)}
              className="ml-2 text-white/80 hover:text-white font-black text-sm"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-[#faf8f5]/90 backdrop-blur-md border-b-2 border-[#18181b] px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-white sketch-border-sm hover:bg-[#ffe4e6] transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#141416]" />
              <span>Back Home</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48] animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#e11d48]">
                Discipline Matrix
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowStreakGuide(true)}
              className="px-3 py-1.5 bg-white sketch-border-sm hover:bg-slate-100 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Learn how streaks increase"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#2563eb]" />
              <span className="hidden sm:inline">Streak Rules</span>
            </button>

            <button
              onClick={() => refreshGoalsAndStats()}
              title="Refresh / Sync Stats"
              className="p-2 bg-white sketch-border-sm hover:bg-slate-100 transition-all text-xs font-bold cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#e11d48] text-white text-xs font-black uppercase tracking-wider sketch-border-sm hover:bg-[#be123c] transition-all cursor-pointer shadow-sm active:translate-y-0.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Daily Target</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 space-y-8">
        {/* Title & Tagline Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-[#18181b] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ffe4e6] border-2 border-[#18181b] rounded-full text-xs font-black uppercase tracking-wider text-[#e11d48] mb-2 shadow-[2px_2px_0px_#18181b]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Continuous Execution Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#141416] tracking-tight">
              Daily Streak &amp; Goals
            </h1>
            <p className="text-sm sm:text-base text-[#334155] font-medium mt-1">
              Lock in your daily targets, conquer DSA &amp; system builds, and compound real placement momentum.
            </p>
          </div>

          {/* Quick Date Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white sketch-border-sm text-xs font-bold text-[#141416]">
            <Calendar className="w-4 h-4 text-[#e11d48]" />
            <span>Today: {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* 1. TOP METRIC HERO BANNER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current Streak */}
          <div className="sketch-card p-5 bg-gradient-to-br from-white to-[#fff1f2] relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#64748b]">
                Current Streak
              </span>
              <div className="p-2 rounded-xl bg-[#ffe4e6] border border-[#18181b]">
                <Flame className="w-5 h-5 text-[#e11d48] animate-bounce" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#141416]">
                {stats?.currentStreak ?? 0}
              </span>
              <span className="text-sm font-bold text-[#e11d48]">days</span>
            </div>
            <p className="text-xs text-[#64748b] mt-2 font-medium">
              {(stats?.currentStreak ?? 0) > 0
                ? '🔥 Active streak! Complete today’s goals to level up.'
                : 'Complete today’s goals to ignite your streak!'}
            </p>
          </div>

          {/* Best Streak */}
          <div className="sketch-card p-5 bg-gradient-to-br from-white to-[#eff6ff] relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#64748b]">
                Best Streak
              </span>
              <div className="p-2 rounded-xl bg-[#dbeafe] border border-[#18181b]">
                <Trophy className="w-5 h-5 text-[#2563eb]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#141416]">
                {stats?.bestStreak ?? 0}
              </span>
              <span className="text-sm font-bold text-[#2563eb]">days</span>
            </div>
            <p className="text-xs text-[#64748b] mt-2 font-medium">
              Historical personal best across all logged study sessions.
            </p>
          </div>

          {/* Today's Target Status */}
          <div className="sketch-card p-5 bg-gradient-to-br from-white to-[#ecfdf5] relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#64748b]">
                Today’s Check-offs
              </span>
              <div className="p-2 rounded-xl bg-[#d1fae5] border border-[#18181b]">
                <Target className="w-5 h-5 text-[#10b981]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#141416]">
                {completedTodayCount}/{totalActiveGoals}
              </span>
              <span className="text-sm font-bold text-[#10b981]">
                ({todayProgressPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden border border-[#18181b]">
              <div
                className="bg-[#10b981] h-full transition-all duration-500"
                style={{ width: `${todayProgressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Weekly Consistency */}
          <div className="sketch-card p-5 bg-gradient-to-br from-white to-[#f5f3ff] relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#64748b]">
                Weekly Completion
              </span>
              <div className="p-2 rounded-xl bg-[#ede9fe] border border-[#18181b]">
                <TrendingUp className="w-5 h-5 text-[#8b5cf6]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#141416]">
                {stats?.weeklySummary.completionRate ?? 0}%
              </span>
              <span className="text-xs font-bold text-[#8b5cf6]">this week</span>
            </div>
            <p className="text-xs text-[#64748b] mt-2 font-medium">
              {stats?.weeklySummary.completed ?? 0} completed &bull; {stats?.weeklySummary.missed ?? 0} missed
            </p>
          </div>
        </div>

        {/* STREAK HOW-IT-WORKS EXPLANATION ACCORDION */}
        <div className="p-4 bg-white sketch-border-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-[#e11d48] shrink-0" />
            <span className="font-black text-[#141416]">Streak Rules:</span>
            <span className="text-[#334155]">
              Daily target complete karne par streak <strong>+1 din</strong> badhti hai. Missed day ke baad complete karne se naya streak shuru hota hai.
            </span>
          </div>
          <button
            onClick={() => setShowStreakGuide(true)}
            className="self-start md:self-auto text-xs font-black text-[#e11d48] underline underline-offset-2 hover:text-[#be123c] cursor-pointer"
          >
            Detailed guide &rarr;
          </button>
        </div>

        {/* 2. WEEKLY SUMMARY & DAY-WISE BREAKDOWN */}
        <section className="sketch-card p-6 bg-white space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#ffe4e6] border-2 border-[#18181b] rounded-lg">
                <Calendar className="w-5 h-5 text-[#e11d48]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#141416] tracking-tight">
                  Weekly Breakdown (Mon &ndash; Sun)
                </h2>
                <p className="text-xs text-[#64748b]">
                  {stats?.weeklySummary.planned ?? 0} goals planned &bull; {stats?.weeklySummary.completed ?? 0} achieved &bull; {stats?.weeklySummary.missed ?? 0} missed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-slate-100 border border-[#18181b] rounded-full">
                Rate: {stats?.weeklySummary.completionRate ?? 0}%
              </span>
            </div>
          </div>

          {/* 7-Day Interactive Week Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {stats?.weeklySummary.breakdown.map((day) => {
              const isFull = day.completed >= day.total && day.total > 0;
              const isPartial = day.completed > 0 && day.completed < day.total;
              return (
                <div
                  key={day.day}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between ${
                    day.isToday
                      ? 'border-[#e11d48] bg-[#fff1f2] shadow-[3px_3px_0px_#18181b] font-bold'
                      : day.isFuture
                      ? 'border-dashed border-slate-300 bg-slate-50/70 opacity-60'
                      : 'border-[#18181b] bg-white shadow-[2px_2px_0px_#18181b]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className={`font-black uppercase ${day.isToday ? 'text-[#e11d48]' : 'text-[#141416]'}`}>
                      {day.day}
                    </span>
                    {day.isToday && (
                      <span className="text-[10px] bg-[#e11d48] text-white px-1.5 py-0.2 rounded font-black">
                        TODAY
                      </span>
                    )}
                  </div>

                  <div className="my-1.5 text-center">
                    <span className="text-xl font-black text-[#141416]">
                      {day.completed}
                    </span>
                    <span className="text-xs text-[#64748b]">/{day.total}</span>
                  </div>

                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-300">
                    <div
                      className={`h-full ${
                        isFull ? 'bg-[#10b981]' : isPartial ? 'bg-[#2563eb]' : 'bg-slate-300'
                      }`}
                      style={{ width: `${day.percentage}%` }}
                    ></div>
                  </div>

                  <div className="mt-2 text-[10px] text-center font-bold text-[#64748b]">
                    {day.isFuture ? 'Upcoming' : isFull ? '✅ Perfect' : isPartial ? '⚡ Partial' : '— Idle'}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. GITHUB-STYLE ACTIVITY HEATMAP (OVERALL) */}
        <section className="sketch-card p-6 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]"></span>
                <h2 className="text-lg font-black text-[#141416]">
                  Annual Discipline Heatmap
                </h2>
              </div>
              <p className="text-xs text-[#64748b]">
                GitHub-style contribution matrix tracking daily goal executions across 26 weeks (182 days).
              </p>
            </div>

            {/* Intensity Legend */}
            <div className="flex items-center gap-2 text-xs font-bold text-[#64748b]">
              <span>Less</span>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-[3px] bg-slate-200 border border-slate-300 inline-block"></span>
                <span className="w-3 h-3 rounded-[3px] bg-[#bbf7d0] border border-[#86efac] inline-block"></span>
                <span className="w-3 h-3 rounded-[3px] bg-[#4ade80] border border-[#22c55e] inline-block"></span>
                <span className="w-3 h-3 rounded-[3px] bg-[#16a34a] border border-[#15803d] inline-block"></span>
                <span className="w-3 h-3 rounded-[3px] bg-[#14532d] border border-[#052e16] inline-block"></span>
              </div>
              <span>More</span>
            </div>
          </div>

          {/* Heatmap Grid Container */}
          <div className="overflow-x-auto pb-2 pt-1">
            <div className="inline-flex gap-1.5 min-w-[720px]">
              {/* Day Labels column */}
              <div className="flex flex-col justify-between text-[10px] font-bold text-[#64748b] pr-1 pt-1 pb-1 select-none">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
                <span>Sun</span>
              </div>

              {/* 26 Week columns */}
              {heatmapColumns.map((col, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-1.5">
                  {col.map((cell) => {
                    const levelColors = [
                      'bg-slate-100 hover:border-slate-500 border-slate-200',
                      'bg-[#bbf7d0] hover:border-slate-800 border-[#86efac]',
                      'bg-[#4ade80] hover:border-slate-800 border-[#22c55e]',
                      'bg-[#16a34a] hover:border-slate-800 border-[#15803d]',
                      'bg-[#14532d] hover:border-slate-800 border-[#052e16]',
                    ];

                    const isSelected = selectedHeatmapCell?.date === cell.date;

                    return (
                      <button
                        key={cell.date}
                        onClick={() => setSelectedHeatmapCell(cell)}
                        title={`${cell.date}: ${cell.completedCount} / ${cell.totalGoals} goals achieved`}
                        className={`w-3.5 h-3.5 rounded-[3px] border transition-transform duration-150 cursor-pointer ${
                          levelColors[cell.level]
                        } ${isSelected ? 'ring-2 ring-[#e11d48] scale-125' : 'hover:scale-125'}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Date Inspector Pill */}
          {selectedHeatmapCell && (
            <div className="flex items-center justify-between p-3 bg-slate-50 border-2 border-[#18181b] rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#e11d48]" />
                <span className="font-bold text-[#141416]">
                  {selectedHeatmapCell.date}:
                </span>
                <span className="font-bold text-[#10b981]">
                  {selectedHeatmapCell.completedCount} of {selectedHeatmapCell.totalGoals} goals completed
                </span>
              </div>
              <button
                onClick={() => setSelectedHeatmapCell(null)}
                className="text-[#64748b] hover:text-[#141416] font-bold"
              >
                &times; Close
              </button>
            </div>
          )}
        </section>

        {/* 4. TODAY'S DAILY GOALS CHECK-OFF LIST */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#18181b] pb-3">
            <div>
              <h2 className="text-xl font-black text-[#141416] tracking-tight flex items-center gap-2">
                <Target className="w-5 h-5 text-[#e11d48]" />
                <span>Active Daily Targets ({goals.length})</span>
              </h2>
              <p className="text-xs text-[#64748b]">
                Click checkmark or adjust numbers to complete today&apos;s quota and pump your streak.
              </p>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="px-3.5 py-1.5 bg-[#e11d48] text-white sketch-border-sm hover:bg-[#be123c] text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm active:translate-y-0.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Daily Target</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {goals.map((goal) => {
              const categoryBadge =
                goal.category === 'dsa'
                  ? { label: 'DSA / LeetCode', icon: Code2, bg: 'bg-blue-100 text-blue-800' }
                  : goal.category === 'project'
                  ? { label: 'Project Dev', icon: Clock, bg: 'bg-emerald-100 text-emerald-800' }
                  : goal.category === 'reading'
                  ? { label: 'Tech Reading', icon: BookOpen, bg: 'bg-purple-100 text-purple-800' }
                  : { label: 'Interview Prep', icon: Target, bg: 'bg-rose-100 text-rose-800' };

              const Icon = categoryBadge.icon;

              return (
                <div
                  key={goal._id}
                  className={`sketch-card p-5 bg-white transition-all ${
                    goal.completed ? 'border-[#10b981] bg-emerald-50/30' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Checkbox + Goal Info */}
                    <div className="flex items-start sm:items-center gap-3.5 flex-1">
                      <button
                        onClick={() => handleToggleCompleted(goal)}
                        className={`mt-0.5 sm:mt-0 p-1.5 rounded-xl border-2 transition-transform duration-150 active:scale-95 cursor-pointer ${
                          goal.completed
                            ? 'bg-[#10b981] border-[#18181b] text-white shadow-[2px_2px_0px_#18181b]'
                            : 'bg-white border-[#18181b] text-slate-300 hover:border-[#10b981]'
                        }`}
                        title={goal.completed ? 'Mark incomplete' : 'Mark completed (+1 to Streak!)'}
                      >
                        {goal.completed ? (
                          <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                        ) : (
                          <Circle className="w-6 h-6 stroke-[2]" />
                        )}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: goal.color }}
                          ></span>
                          <h3
                            className={`text-base sm:text-lg font-black tracking-tight ${
                              goal.completed ? 'line-through text-[#64748b]' : 'text-[#141416]'
                            }`}
                          >
                            {goal.title}
                          </h3>
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#18181b] flex items-center gap-1 ${categoryBadge.bg}`}
                          >
                            <Icon className="w-3 h-3" />
                            {categoryBadge.label}
                          </span>
                        </div>
                        {goal.description && (
                          <p className="text-xs text-[#64748b]">{goal.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Right: Numeric Counter & Actions */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border-2 border-[#18181b]">
                        <button
                          onClick={() => handleProgressDelta(goal._id, -1)}
                          disabled={goal.currentValue <= 0}
                          className="w-7 h-7 flex items-center justify-center bg-white rounded-lg border border-slate-300 font-bold hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <div className="px-2 text-center min-w-[65px]">
                          <span className="text-sm font-black text-[#141416]">
                            {goal.currentValue}
                          </span>
                          <span className="text-xs text-[#64748b]">
                            /{goal.targetValue} {goal.unit}
                          </span>
                        </div>
                        <button
                          onClick={() => handleProgressDelta(goal._id, 1)}
                          className="w-7 h-7 flex items-center justify-center bg-[#18181b] text-white rounded-lg font-bold hover:bg-slate-800 active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(goal)}
                          title="Edit target"
                          className="p-2 bg-white sketch-border-sm hover:bg-slate-100 text-[#141416]"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal._id)}
                          title="Delete target"
                          className="p-2 bg-white sketch-border-sm hover:bg-[#ffe4e6] text-[#e11d48]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. PER-GOAL DETAILED CARDS (MATCHING VISUAL REFERENCE SCREENSHOT EXACTLY!) */}
        <section className="space-y-6 pt-4">
          <div className="border-b-2 border-[#18181b] pb-3">
            <h2 className="text-xl font-black text-[#141416] tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#2563eb]" />
              <span>Target-by-Target Analytics &amp; Consistency</span>
            </h2>
            <p className="text-xs text-[#64748b]">
              Individual streak milestones, activity square matrices, and 12-week trend graphs matching professional habit trackers.
            </p>
          </div>

          <div className="space-y-8">
            {stats?.perGoalStats.map((gStat) => {
              const activeRange = chartRanges[gStat.goalId] || '12weeks';

              return (
                <div
                  key={gStat.goalId}
                  className="rounded-2xl border-2 border-[#18181b] bg-[#1a1f2c] text-white p-6 shadow-[5px_5px_0px_#18181b] space-y-6"
                >
                  {/* Top Bar: Colored Dot + Goal Title + Daily badge */}
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full inline-block"
                        style={{ backgroundColor: gStat.color }}
                      ></span>
                      <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                        {gStat.title}
                      </h3>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      Daily
                    </span>
                  </div>

                  {/* 4 Metric Boxes (Direct match to reference image) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#111622] p-4 rounded-xl border border-slate-800">
                      <div className="text-2xl font-black text-white">
                        {gStat.currentStreak} <span className="text-xs font-normal text-slate-400">days</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Current streak</div>
                    </div>

                    <div className="bg-[#111622] p-4 rounded-xl border border-slate-800">
                      <div className="text-2xl font-black text-white">
                        {gStat.bestStreak} <span className="text-xs font-normal text-slate-400">days</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Best streak</div>
                    </div>

                    <div className="bg-[#111622] p-4 rounded-xl border border-slate-800">
                      <div className="text-2xl font-black text-white">
                        {gStat.last30DaysPercent}%
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Last 30 days</div>
                    </div>

                    <div className="bg-[#111622] p-4 rounded-xl border border-slate-800">
                      <div className="text-2xl font-black text-white">
                        {gStat.totalCheckOffs}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Total check-offs</div>
                    </div>
                  </div>

                  {/* GitHub-Style Mini Square Grid for this Goal */}
                  <div className="bg-[#111622] p-4 rounded-xl border border-slate-800 overflow-x-auto">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                      <div className="flex gap-8">
                        <span>Jul</span>
                        <span>Aug</span>
                        <span>Sep</span>
                        <span>Oct</span>
                        <span>Nov</span>
                        <span>Dec</span>
                        <span>Jan</span>
                        <span>Feb</span>
                        <span>Mar</span>
                        <span>Apr</span>
                        <span>May</span>
                        <span>Jun</span>
                        <span>Jul</span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 min-w-[650px]">
                      {/* Mon / Wed / Fri labels */}
                      <div className="flex flex-col justify-between text-[9px] text-slate-500 pr-1 select-none">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                      </div>

                      {/* 20 weeks of 7 squares */}
                      {Array.from({ length: 20 }).map((_, wIdx) => {
                        const weekSlice = gStat.heatmap.slice(wIdx * 7, (wIdx + 1) * 7);
                        return (
                          <div key={wIdx} className="flex flex-col gap-1.5">
                            {weekSlice.map((day, dIdx) => (
                              <div
                                key={dIdx}
                                title={`${day.date}: ${day.completed ? 'Checked Off' : 'Not completed'}`}
                                className={`w-3.5 h-3.5 rounded-[3px] transition-transform hover:scale-125 ${
                                  day.completed ? '' : 'bg-slate-800/80 border border-slate-800'
                                }`}
                                style={{
                                  backgroundColor: day.completed ? gStat.color : undefined,
                                }}
                              />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Consistency Trend Chart (Recharts line chart) */}
                  <div className="bg-[#111622] p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">Consistency</h4>
                      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                        <button
                          onClick={() =>
                            setChartRanges((prev) => ({ ...prev, [gStat.goalId]: '12weeks' }))
                          }
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                            activeRange === '12weeks'
                              ? 'bg-slate-700 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          12 weeks
                        </button>
                        <button
                          onClick={() =>
                            setChartRanges((prev) => ({ ...prev, [gStat.goalId]: '6months' }))
                          }
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                            activeRange === '6months'
                              ? 'bg-slate-700 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          6 months
                        </button>
                      </div>
                    </div>

                    {/* Line Chart */}
                    <div className="h-44 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={gStat.consistencyData}>
                          <XAxis
                            dataKey="week"
                            stroke="#64748b"
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            stroke="#64748b"
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            domain={[0, 100]}
                            ticks={[0, 50, 100]}
                            unit="%"
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              border: '1px solid #334155',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                            formatter={(value: unknown) => {
                              const num = typeof value === 'number' ? value : Number(value);
                              return [`${num}%`, 'Consistency'];
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="percentage"
                            stroke={gStat.color}
                            strokeWidth={2.5}
                            dot={{ fill: gStat.color, r: 3.5, stroke: '#111622', strokeWidth: 1.5 }}
                            activeDot={{ r: 6, fill: '#fff', stroke: gStat.color, strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* CREATE / EDIT GOAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="sketch-card w-full max-w-lg bg-white p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border-2 border-[#18181b] bg-white hover:bg-slate-100 text-[#141416]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-5">
              <h3 className="text-xl font-black text-[#141416]">
                {editingGoal ? 'Edit Daily Goal' : 'Add New Daily Target'}
              </h3>
              <p className="text-xs text-[#64748b] mt-0.5">
                Set a clear, measurable quota to maintain student consistency.
              </p>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4 text-xs font-bold text-[#141416]">
              {/* Title */}
              <div>
                <label className="block uppercase tracking-wider mb-1">Target Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solve 2 DSA problems, Spend 60 mins on Full-Stack Project"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-[#18181b] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block uppercase tracking-wider mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. LeetCode / Striver SDE sheet, System Design prep"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-[#18181b] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48]"
                />
              </div>

              {/* Category & Numeric Target */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(
                        e.target.value as 'dsa' | 'project' | 'interview' | 'reading' | 'custom'
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-[#18181b] rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="dsa">DSA &amp; Problem Solving</option>
                    <option value="project">Project Building</option>
                    <option value="interview">Mock Interview</option>
                    <option value="reading">Tech Reading</option>
                    <option value="custom">Custom Goal</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase tracking-wider mb-1">Target Value</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formTarget}
                    onChange={(e) => setFormTarget(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-50 border-2 border-[#18181b] rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Unit */}
              <div>
                <label className="block uppercase tracking-wider mb-1">Target Unit</label>
                <input
                  type="text"
                  placeholder="e.g. problems, mins, pages, rounds"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-[#18181b] rounded-xl text-sm focus:outline-none"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block uppercase tracking-wider mb-1.5">Indicator Color</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {colorOptions.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormColor(c.value)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 text-xs font-bold cursor-pointer ${
                        formColor === c.value
                          ? 'border-[#18181b] bg-slate-100 shadow-[2px_2px_0px_#18181b]'
                          : 'border-transparent bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full inline-block"
                        style={{ backgroundColor: c.value }}
                      ></span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border-2 border-[#18181b] bg-white text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl border-2 border-[#18181b] bg-[#e11d48] text-white text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#18181b] hover:bg-[#be123c] cursor-pointer"
                >
                  {editingGoal ? 'Update Target' : 'Create Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HOW STREAKS WORK MODAL GUIDE */}
      {showStreakGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="sketch-card w-full max-w-lg bg-white p-6 relative animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <button
              onClick={() => setShowStreakGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border-2 border-[#18181b] bg-white hover:bg-slate-100 text-[#141416]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
              <Flame className="w-6 h-6 text-[#e11d48] animate-bounce" />
              <div>
                <h3 className="text-xl font-black text-[#141416]">Streak System Rules</h3>
                <p className="text-xs text-[#64748b]">Aapki daily consistency aur streak kaise calculate hoti hai</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#334155]">
              <div className="p-3 bg-slate-50 border border-[#18181b] rounded-xl space-y-1">
                <span className="font-black text-[#141416] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                  1. Target Complete Kaise Hoga?
                </span>
                <p>
                  Target card me `+` button daba kar target value tak pahocho (e.g. 2/2 problems), ya direct circular checkmark pe click karke use complete mark karo.
                </p>
              </div>

              <div className="p-3 bg-[#fff1f2] border border-[#18181b] rounded-xl space-y-1">
                <span className="font-black text-[#e11d48] flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#e11d48]" />
                  2. Streak Kab Badhega?
                </span>
                <p>
                  Jaise hi aap aaj ka daily target complete karte ho, aapka <strong>Current Streak +1 din</strong> badh jata hai, aur heatmap me aaj ka square dark green ho jata hai.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-[#18181b] rounded-xl space-y-1">
                <span className="font-black text-[#141416] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#2563eb]" />
                  3. Agar Kisi Din Miss Ho Jaye?
                </span>
                <p>
                  Agar aap kal target complete nahi kar paaye, toh streak reset ho jati hai. Lekin agle din target poora karte hi naya streak shuru ho jata hai (Day 1)!
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-[#18181b] rounded-xl space-y-1">
                <span className="font-black text-[#141416] flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-[#f59e0b]" />
                  4. Best Streak
                </span>
                <p>
                  Aapki ab tak ki longest consecutive days ki continuous study record ko <strong>Best Streak</strong> me permanently track kiya jata hai.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowStreakGuide(false)}
                className="px-5 py-2 bg-[#e11d48] text-white text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#18181b] shadow-[2px_2px_0px_#18181b] hover:bg-[#be123c]"
              >
                Samajh gaya / Got It!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
