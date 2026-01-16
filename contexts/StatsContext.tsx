import createContextHook from '@nkzw/create-context-hook';
import { useMemo, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, SavedActivity } from '@/types/activity';
import { ActivityStats, CategoryStat, MonthlyRecap, StreakData, WeeklyActivity } from '@/types/stats';
import { HISTORY_KEY, SCRATCH_COUNT_KEY, SAVED_ACTIVITIES_KEY } from '@/constants/storageKeys';

// Duration estimates in minutes (used for time spent calculations)
// These are approximate values for typical activity durations
const DURATION_ESTIMATES = {
  QUICK_ACTIVITY: 90,      // 1.5 hours for "quick" or "1-2 hour" activities
  HALF_DAY: 240,           // 4 hours for "half day" activities
  FULL_DAY: 480,           // 8 hours for "full day" activities
} as const;

// Cost estimates in dollars (used for money spent calculations)
// These represent typical spending ranges for each cost tier
const COST_ESTIMATES = {
  FREE: 0,                 // No cost
  LOW: 25,                 // '$' tier - budget-friendly activities
  MEDIUM: 75,              // '$$' tier - moderate cost activities
  HIGH: 150,               // '$$$' tier - premium/expensive activities
} as const;

// Stats refresh interval (30 seconds) - how often data is reloaded from storage
const STATS_REFRESH_INTERVAL_MS = 30000;

export const [StatsProvider, useStats] = createContextHook(() => {
  const [activityHistory, setActivityHistory] = useState<Activity[]>([]);
  const [scratchCount, setScratchCount] = useState(0);
  const [savedActivities, setSavedActivities] = useState<SavedActivity[]>([]);

  // Load data from AsyncStorage to avoid circular dependencies
  useEffect(() => {
    const loadData = async () => {
      try {
        const [historyStr, countStr, savedStr] = await Promise.all([
          AsyncStorage.getItem(HISTORY_KEY),
          AsyncStorage.getItem(SCRATCH_COUNT_KEY),
          AsyncStorage.getItem(SAVED_ACTIVITIES_KEY),
        ]);
        
        // Parse history with error handling
        if (historyStr) {
          try {
            const parsed = JSON.parse(historyStr);
            if (Array.isArray(parsed)) {
              setActivityHistory(parsed);
            } else {
              console.error('Activity history is not an array, clearing corrupted data');
              await AsyncStorage.removeItem(HISTORY_KEY);
            }
          } catch (parseError) {
            console.error('Corrupted activity history, clearing:', parseError);
            await AsyncStorage.removeItem(HISTORY_KEY);
          }
        }
        
        // Parse count with NaN handling
        if (countStr) {
          const parsed = parseInt(countStr, 10);
          if (!isNaN(parsed) && parsed >= 0) {
            setScratchCount(parsed);
          } else {
            console.error('Invalid scratch count, resetting to 0');
            await AsyncStorage.removeItem(SCRATCH_COUNT_KEY);
            setScratchCount(0);
          }
        }
        
        // Parse saved activities with error handling
        if (savedStr) {
          try {
            const parsed = JSON.parse(savedStr);
            if (Array.isArray(parsed)) {
              setSavedActivities(parsed);
            } else {
              console.error('Saved activities is not an array, clearing corrupted data');
              await AsyncStorage.removeItem(SAVED_ACTIVITIES_KEY);
            }
          } catch (parseError) {
            console.error('Corrupted saved activities in stats, clearing:', parseError);
            await AsyncStorage.removeItem(SAVED_ACTIVITIES_KEY);
          }
        }
      } catch (error) {
        console.error('Failed to load stats data:', error);
      }
    };
    
    loadData();
    
    // Set up interval to refresh data periodically
    const interval = setInterval(loadData, STATS_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const calculateCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activityHistory.forEach(activity => {
      counts[activity.category] = (counts[activity.category] || 0) + 1;
    });
    return counts;
  }, [activityHistory]);

  const favoriteCategories = useMemo((): CategoryStat[] => {
    const total = activityHistory.length;
    if (total === 0) return [];

    const categoryStats = Object.entries(calculateCategoryCounts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return categoryStats;
  }, [calculateCategoryCounts, activityHistory.length]);

  const estimatedTimeSpent = useMemo(() => {
    const completedActivities = savedActivities.filter(a => a.isCompleted);
    let totalMinutes = 0;

    completedActivities.forEach(activity => {
      const duration = activity.duration.toLowerCase();
      if (duration.includes('quick') || duration.includes('1-2 hour')) {
        totalMinutes += DURATION_ESTIMATES.QUICK_ACTIVITY;
      } else if (duration.includes('half day')) {
        totalMinutes += DURATION_ESTIMATES.HALF_DAY;
      } else if (duration.includes('full day')) {
        totalMinutes += DURATION_ESTIMATES.FULL_DAY;
      } else if (duration.includes('hour')) {
        const match = duration.match(/(\d+)/);
        if (match) {
          totalMinutes += parseInt(match[1]) * 60;
        }
      }
    });

    return totalMinutes;
  }, [savedActivities]);

  const estimatedMoneySpent = useMemo(() => {
    const completedActivities = savedActivities.filter(a => a.isCompleted);
    let totalCost = 0;

    completedActivities.forEach(activity => {
      switch (activity.cost) {
        case 'free':
          totalCost += COST_ESTIMATES.FREE;
          break;
        case '$':
          totalCost += COST_ESTIMATES.LOW;
          break;
        case '$$':
          totalCost += COST_ESTIMATES.MEDIUM;
          break;
        case '$$$':
          totalCost += COST_ESTIMATES.HIGH;
          break;
      }
    });

    return totalCost;
  }, [savedActivities]);

  const calculateStreaks = useMemo((): StreakData => {
    const completedActivities = savedActivities
      .filter(a => a.isCompleted && a.completedAt)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    if (completedActivities.length === 0) {
      return { currentStreak: 0, longestStreak: 0, weeklyActivities: [] };
    }

    const weeklyActivities: WeeklyActivity[] = [];
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < 52; i++) {
      const weekEnd = now - (i * oneWeek);
      const weekStart = weekEnd - oneWeek;
      
      const hasActivity = completedActivities.some(
        activity => activity.completedAt && activity.completedAt >= weekStart && activity.completedAt <= weekEnd
      );

      weeklyActivities.push({ weekStart, weekEnd, hasActivity });
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < weeklyActivities.length; i++) {
      if (weeklyActivities[i].hasActivity) {
        tempStreak++;
        if (i === 0 || weeklyActivities[i - 1].hasActivity) {
          currentStreak = tempStreak;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (i === 0) {
          currentStreak = 0;
        }
        tempStreak = 0;
      }
    }

    return { currentStreak, longestStreak, weeklyActivities: weeklyActivities.slice(0, 12) };
  }, [savedActivities]);

  const monthlyRecap = useMemo((): MonthlyRecap => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthStart = new Date(currentYear, currentMonth, 1).getTime();
    const monthEnd = new Date(currentYear, currentMonth + 1, 0).getTime();

    const monthCompleted = savedActivities.filter(
      activity => activity.isCompleted && activity.completedAt && 
                 activity.completedAt >= monthStart && activity.completedAt <= monthEnd
    );

    const monthSaved = savedActivities.filter(
      activity => activity.savedAt >= monthStart && activity.savedAt <= monthEnd
    );

    const monthCategories: Record<string, number> = {};
    monthSaved.forEach(activity => {
      monthCategories[activity.category] = (monthCategories[activity.category] || 0) + 1;
    });

    const topCategory = Object.entries(monthCategories).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    let monthTimeSpent = 0;
    monthCompleted.forEach(activity => {
      const duration = activity.duration.toLowerCase();
      if (duration.includes('quick') || duration.includes('1-2 hour')) {
        monthTimeSpent += DURATION_ESTIMATES.QUICK_ACTIVITY;
      } else if (duration.includes('half day')) {
        monthTimeSpent += DURATION_ESTIMATES.HALF_DAY;
      } else if (duration.includes('full day')) {
        monthTimeSpent += DURATION_ESTIMATES.FULL_DAY;
      }
    });

    let monthMoneySpent = 0;
    monthCompleted.forEach(activity => {
      switch (activity.cost) {
        case '$': monthMoneySpent += COST_ESTIMATES.LOW; break;
        case '$$': monthMoneySpent += COST_ESTIMATES.MEDIUM; break;
        case '$$$': monthMoneySpent += COST_ESTIMATES.HIGH; break;
      }
    });

    const highlights: string[] = [];
    if (monthCompleted.length > 0) {
      highlights.push(`Completed ${monthCompleted.length} ${monthCompleted.length === 1 ? 'activity' : 'activities'}`);
    }
    if (topCategory) {
      highlights.push(`Loved ${topCategory} activities`);
    }
    if (calculateStreaks.currentStreak > 0) {
      highlights.push(`${calculateStreaks.currentStreak} week streak!`);
    }

    return {
      month: now.toLocaleDateString('en-US', { month: 'long' }),
      year: currentYear,
      activitiesScratched: scratchCount,
      activitiesCompleted: monthCompleted.length,
      topCategory,
      totalTimeSpent: monthTimeSpent,
      totalMoneySpent: monthMoneySpent,
      highlights,
    };
  }, [savedActivities, scratchCount, calculateStreaks.currentStreak]);

  const stats: ActivityStats = useMemo(() => ({
    totalScratched: activityHistory.length,
    totalSaved: savedActivities.length,
    totalCompleted: savedActivities.filter(a => a.isCompleted).length,
    currentMonthScratches: scratchCount,
    favoriteCategories,
    estimatedTimeSpent,
    estimatedMoneySpent,
    currentStreak: calculateStreaks.currentStreak,
    longestStreak: calculateStreaks.longestStreak,
    monthlyRecap,
  }), [
    activityHistory.length,
    savedActivities,
    scratchCount,
    favoriteCategories,
    estimatedTimeSpent,
    estimatedMoneySpent,
    calculateStreaks,
    monthlyRecap,
  ]);

  return {
    stats,
    streakData: calculateStreaks,
  };
});
