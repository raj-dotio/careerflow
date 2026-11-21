import { Request, Response } from 'express';
import { Goal, GoalProgress, IGoal } from '../models/goal.model.js';
import { AuthRequest } from '../middlewares/isAuth.js';

// Date utility helpers (zero dependencies)
export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(d: Date, days: number): Date {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
}

export function diffInDays(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcA - utcB) / msPerDay);
}

// 1. GET /api/goals - Fetch all goals for user
export const getGoals = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).userId || (req.query.userId as string) || 'guest';
    const todayStr = formatDate(new Date());

    const goals = await Goal.find({ userId }).sort({ createdAt: -1 });

    // Sync today's completion status from GoalProgress
    const todayProgress = await GoalProgress.find({
      userId,
      date: todayStr,
    });

    const progressMap = new Map<string, { value: number; completed: boolean }>();
    todayProgress.forEach((p) => {
      progressMap.set(p.goalId, { value: p.value, completed: p.completed });
    });

    const goalsWithTodayStatus = goals.map((g) => {
      const gObj = g.toObject();
      const p = progressMap.get(g._id.toString());
      if (p) {
        gObj.currentValue = p.value;
        gObj.completed = p.completed;
      }
      return gObj;
    });

    res.status(200).json({
      success: true,
      goals: goalsWithTodayStatus,
      today: todayStr,
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch goals' });
  }
};

// 2. POST /api/goals - Create a new goal
export const createGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).userId || (req.body.userId as string) || 'guest';
    const { title, description, category, targetValue, unit, color } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ success: false, message: 'Goal title is required' });
      return;
    }

    const numTarget = Math.max(1, Number(targetValue) || 1);

    const goal = await Goal.create({
      userId,
      title: title.trim(),
      description: description?.trim() || '',
      category: category || 'custom',
      targetValue: numTarget,
      currentValue: 0,
      unit: unit?.trim() || 'tasks',
      color: color || '#e11d48',
      frequency: 'daily',
      completed: false,
    });

    const todayStr = formatDate(new Date());
    await GoalProgress.findOneAndUpdate(
      { goalId: goal._id.toString(), date: todayStr },
      {
        userId,
        goalId: goal._id.toString(),
        date: todayStr,
        value: 0,
        targetValue: numTarget,
        completed: false,
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      goal,
      message: 'Daily goal created successfully',
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ success: false, message: 'Failed to create goal' });
  }
};

// 3. PUT /api/goals/:id - Update an existing goal
export const updateGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, category, targetValue, unit, color } = req.body;

    const goal = await Goal.findById(id);
    if (!goal) {
      res.status(404).json({ success: false, message: 'Goal not found' });
      return;
    }

    if (title !== undefined) goal.title = title.trim();
    if (description !== undefined) goal.description = description.trim();
    if (category !== undefined) goal.category = category;
    if (targetValue !== undefined) goal.targetValue = Math.max(1, Number(targetValue) || 1);
    if (unit !== undefined) goal.unit = unit.trim();
    if (color !== undefined) goal.color = color;

    await goal.save();

    // Update today's progress targetValue if present
    const todayStr = formatDate(new Date());
    const progress = await GoalProgress.findOne({ goalId: id, date: todayStr });
    if (progress) {
      progress.targetValue = goal.targetValue;
      progress.completed = progress.value >= goal.targetValue;
      await progress.save();
    }

    res.status(200).json({
      success: true,
      goal,
      message: 'Goal updated successfully',
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ success: false, message: 'Failed to update goal' });
  }
};

// 4. DELETE /api/goals/:id - Delete a goal and its progress
export const deleteGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const goal = await Goal.findByIdAndDelete(id);
    if (!goal) {
      res.status(404).json({ success: false, message: 'Goal not found' });
      return;
    }

    await GoalProgress.deleteMany({ goalId: id });

    res.status(200).json({
      success: true,
      message: 'Goal and related progress deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ success: false, message: 'Failed to delete goal' });
  }
};

// 5. POST /api/goals/:id/progress - Update progress or toggle completion for a date
export const updateGoalProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).userId || (req.body.userId as string) || 'guest';
    const { date, value, delta, completed } = req.body;

    const goal = await Goal.findById(id);
    if (!goal) {
      res.status(404).json({ success: false, message: 'Goal not found' });
      return;
    }

    const targetDate = date ? String(date) : formatDate(new Date());

    let progress = await GoalProgress.findOne({ goalId: id, date: targetDate });

    if (!progress) {
      progress = new GoalProgress({
        userId,
        goalId: id,
        date: targetDate,
        value: 0,
        targetValue: goal.targetValue,
        completed: false,
      });
    }

    if (delta !== undefined) {
      progress.value = Math.max(0, progress.value + Number(delta));
    } else if (value !== undefined) {
      progress.value = Math.max(0, Number(value));
    }

    if (completed !== undefined) {
      progress.completed = Boolean(completed);
      if (progress.completed && progress.value < goal.targetValue) {
        progress.value = goal.targetValue;
      } else if (!progress.completed && progress.value >= goal.targetValue) {
        progress.value = Math.max(0, goal.targetValue - 1);
      }
    } else {
      progress.completed = progress.value >= goal.targetValue;
    }

    await progress.save();

    // If today, also update goal doc for quick reads
    const todayStr = formatDate(new Date());
    if (targetDate === todayStr) {
      goal.currentValue = progress.value;
      goal.completed = progress.completed;
      await goal.save();
    }

    res.status(200).json({
      success: true,
      progress,
      goal,
      message: 'Progress recorded',
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ success: false, message: 'Failed to update progress' });
  }
};

// 6. GET /api/goals/stats - Get overall streaks, heatmap, weekly breakdown, and per-goal analytics
export const getGoalStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).userId || (req.query.userId as string) || 'guest';
    const today = new Date();
    const todayStr = formatDate(today);
    const yesterdayStr = formatDate(addDays(today, -1));

    // Fetch user goals
    const goals = await Goal.find({ userId });

    // Fetch all user progress records
    const allProgress = await GoalProgress.find({ userId });

    // 1. Group completions by date: Map<date, { completedCount: number, totalCount: number }>
    const dateMap = new Map<string, { completedCount: number; totalCount: number; goalIds: Set<string> }>();

    allProgress.forEach((p) => {
      let entry = dateMap.get(p.date);
      if (!entry) {
        entry = { completedCount: 0, totalCount: 0, goalIds: new Set<string>() };
        dateMap.set(p.date, entry);
      }
      entry.totalCount += 1;
      if (p.completed) {
        entry.completedCount += 1;
        entry.goalIds.add(p.goalId);
      }
    });

    // 2. Compute Overall Current Streak & Best Streak
    // A day qualifies as a streak day if >= 1 goal completed (or completedCount >= 1)
    let currentStreak = 0;
    let bestStreak = 0;

    // Check if today is completed
    const todayEntry = dateMap.get(todayStr);
    const todayIsDone = todayEntry ? todayEntry.completedCount > 0 : false;

    // Check if yesterday is completed
    const yesterdayEntry = dateMap.get(yesterdayStr);
    const yesterdayIsDone = yesterdayEntry ? yesterdayEntry.completedCount > 0 : false;

    // Determine current running streak
    let cursor = todayIsDone ? today : yesterdayIsDone ? addDays(today, -1) : null;

    if (cursor) {
      while (true) {
        const cursorStr = formatDate(cursor);
        const entry = dateMap.get(cursorStr);
        if (entry && entry.completedCount > 0) {
          currentStreak++;
          cursor = addDays(cursor, -1);
        } else {
          break;
        }
      }
    }

    // Calculate Best Streak across all recorded days in history
    const sortedDates = Array.from(dateMap.keys()).sort();
    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (const dStr of sortedDates) {
      const entry = dateMap.get(dStr);
      if (entry && entry.completedCount > 0) {
        const currDate = parseDate(dStr);
        if (prevDate) {
          const diff = diffInDays(currDate, prevDate);
          if (diff === 1) {
            tempStreak++;
          } else if (diff > 1) {
            tempStreak = 1;
          }
        } else {
          tempStreak = 1;
        }
        prevDate = currDate;
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
      }
    }
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }

    // 3. Overall GitHub-Style Activity Heatmap Grid (Past 26 weeks = 182 days)
    const heatmapDaysCount = 182; // 26 weeks
    const heatmap: Array<{
      date: string;
      completedCount: number;
      totalGoals: number;
      level: 0 | 1 | 2 | 3 | 4;
    }> = [];

    const activeGoalsCount = Math.max(1, goals.length);

    for (let i = heatmapDaysCount - 1; i >= 0; i--) {
      const dayDate = addDays(today, -i);
      const dayStr = formatDate(dayDate);
      const entry = dateMap.get(dayStr);
      const completedCount = entry ? entry.completedCount : 0;

      // Intensity level 0..4
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (completedCount > 0) {
        const ratio = completedCount / activeGoalsCount;
        if (ratio >= 0.8) level = 4;
        else if (ratio >= 0.5) level = 3;
        else if (ratio >= 0.25) level = 2;
        else level = 1;
      }

      heatmap.push({
        date: dayStr,
        completedCount,
        totalGoals: activeGoalsCount,
        level,
      });
    }

    // 4. Weekly Summary (Monday to Sunday of the current week)
    const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const weekStart = addDays(today, mondayOffset);

    const weekDaysName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekBreakdown = [];
    let weekPlanned = 0;
    let weekCompleted = 0;
    let weekMissed = 0;

    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      const dStr = formatDate(d);
      const isToday = dStr === todayStr;
      const isFuture = diffInDays(d, today) > 0;
      const isPast = diffInDays(d, today) < 0;

      const entry = dateMap.get(dStr);
      const dayCompleted = entry ? entry.completedCount : 0;
      const dayPlanned = activeGoalsCount;

      weekPlanned += dayPlanned;
      weekCompleted += dayCompleted;

      if (isPast && dayCompleted === 0) {
        weekMissed += dayPlanned;
      }

      weekBreakdown.push({
        day: weekDaysName[i],
        date: dStr,
        completed: dayCompleted,
        total: dayPlanned,
        percentage: Math.min(100, Math.round((dayCompleted / dayPlanned) * 100)),
        isToday,
        isFuture,
      });
    }

    const weeklyCompletionRate =
      weekPlanned > 0 ? Math.min(100, Math.round((weekCompleted / weekPlanned) * 100)) : 0;

    // 5. Per-Goal Analytics (matching reference image cards exactly!)
    // For each goal:
    // - Current streak
    // - Best streak
    // - Last 30 days %
    // - Total check-offs
    // - Heatmap squares (past 20 weeks)
    // - Consistency line data (12 weeks trend for Recharts)
    const goalProgressMap = new Map<string, Map<string, boolean>>();
    allProgress.forEach((p) => {
      let gMap = goalProgressMap.get(p.goalId);
      if (!gMap) {
        gMap = new Map<string, boolean>();
        goalProgressMap.set(p.goalId, gMap);
      }
      if (p.completed) {
        gMap.set(p.date, true);
      }
    });

    const perGoalStats = goals.map((goal) => {
      const gId = goal._id.toString();
      const gMap = goalProgressMap.get(gId) || new Map<string, boolean>();

      // Goal current streak
      let gCurrentStreak = 0;
      const gTodayDone = gMap.get(todayStr) === true;
      const gYesterdayDone = gMap.get(yesterdayStr) === true;
      let gCursor = gTodayDone ? today : gYesterdayDone ? addDays(today, -1) : null;

      if (gCursor) {
        while (true) {
          const cStr = formatDate(gCursor);
          if (gMap.get(cStr) === true) {
            gCurrentStreak++;
            gCursor = addDays(gCursor, -1);
          } else {
            break;
          }
        }
      }

      // Goal best streak
      const gCompletedDates = Array.from(gMap.keys()).sort();
      let gBestStreak = 0;
      let gTemp = 0;
      let gPrev: Date | null = null;

      for (const dStr of gCompletedDates) {
        const cDate = parseDate(dStr);
        if (gPrev) {
          const diff = diffInDays(cDate, gPrev);
          if (diff === 1) {
            gTemp++;
          } else if (diff > 1) {
            gTemp = 1;
          }
        } else {
          gTemp = 1;
        }
        gPrev = cDate;
        if (gTemp > gBestStreak) {
          gBestStreak = gTemp;
        }
      }
      if (gCurrentStreak > gBestStreak) {
        gBestStreak = gCurrentStreak;
      }

      // Last 30 days completion rate
      let last30CompletedCount = 0;
      for (let i = 29; i >= 0; i--) {
        const pastD = addDays(today, -i);
        const pastDStr = formatDate(pastD);
        if (gMap.get(pastDStr) === true) {
          last30CompletedCount++;
        }
      }
      const last30DaysPercent = Math.round((last30CompletedCount / 30) * 100);

      // Total check-offs
      const totalCheckOffs = gCompletedDates.length;

      // Mini-heatmap for this goal (past 140 days = 20 weeks)
      const goalHeatmap: Array<{ date: string; completed: boolean }> = [];
      for (let i = 139; i >= 0; i--) {
        const d = addDays(today, -i);
        const dStr = formatDate(d);
        goalHeatmap.push({
          date: dStr,
          completed: gMap.get(dStr) === true,
        });
      }

      // 12 Weeks Consistency Trend Data (for Recharts line chart)
      const consistencyData: Array<{ week: string; percentage: number }> = [];
      for (let w = 11; w >= 0; w--) {
        const weekEnd = addDays(today, -w * 7);
        let completedInWeek = 0;
        for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
          const checkD = addDays(weekEnd, -dayOffset);
          if (gMap.get(formatDate(checkD)) === true) {
            completedInWeek++;
          }
        }
        const percentage = Math.round((completedInWeek / 7) * 100);
        const label = `${weekEnd.toLocaleDateString('en-US', { month: 'short' })} ${weekEnd.getDate()}`;
        consistencyData.push({
          week: label,
          percentage,
        });
      }

      return {
        goalId: gId,
        title: goal.title,
        color: goal.color,
        category: goal.category,
        currentStreak: gCurrentStreak,
        bestStreak: gBestStreak,
        last30DaysPercent,
        totalCheckOffs,
        heatmap: goalHeatmap,
        consistencyData,
      };
    });

    res.status(200).json({
      success: true,
      stats: {
        today: todayStr,
        currentStreak,
        bestStreak,
        todayCompletedCount: todayEntry ? todayEntry.completedCount : 0,
        totalActiveGoals: activeGoalsCount,
        weeklySummary: {
          planned: weekPlanned,
          completed: weekCompleted,
          missed: weekMissed,
          completionRate: weeklyCompletionRate,
          breakdown: weekBreakdown,
        },
        heatmap,
        perGoalStats,
      },
    });
  } catch (error) {
    console.error('Error computing goal stats:', error);
    res.status(500).json({ success: false, message: 'Failed to compute goal stats' });
  }
};
