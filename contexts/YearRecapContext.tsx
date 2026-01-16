import createContextHook from '@nkzw/create-context-hook';
import { useMemo, useCallback, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, SavedActivity } from '@/types/activity';
import { YearRecapData, MonthData, YearActivity, YearHighlight } from '@/types/yearRecap';

const HISTORY_KEY = 'scratch_and_go_history';
const SAVED_ACTIVITIES_KEY = 'scratch_and_go_saved_activities';

export const [YearRecapProvider, useYearRecap] = createContextHook(() => {
  const [savedActivities, setSavedActivities] = useState<SavedActivity[]>([]);
  const [activityHistory, setActivityHistory] = useState<Activity[]>([]);

  // Load data from AsyncStorage to avoid circular dependencies
  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedStr, historyStr] = await Promise.all([
          AsyncStorage.getItem(SAVED_ACTIVITIES_KEY),
          AsyncStorage.getItem(HISTORY_KEY),
        ]);
        
        // Parse saved activities with error handling
        if (savedStr) {
          try {
            const parsed = JSON.parse(savedStr);
            if (Array.isArray(parsed)) {
              setSavedActivities(parsed);
            }
          } catch (parseError) {
            console.error('Corrupted saved activities in year recap:', parseError);
          }
        }
        
        // Parse activity history with error handling
        if (historyStr) {
          try {
            const parsed = JSON.parse(historyStr);
            if (Array.isArray(parsed)) {
              setActivityHistory(parsed);
            }
          } catch (parseError) {
            console.error('Corrupted activity history in year recap:', parseError);
          }
        }
      } catch (error) {
        console.error('Failed to load year recap data:', error);
      }
    };
    
    loadData();
    
    // Refresh data periodically (30 seconds instead of 10 for performance)
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate streak data locally instead of depending on StatsContext
  const streakData = useMemo(() => {
    const completedActivities = savedActivities
      .filter(a => a.isCompleted && a.completedAt)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    if (completedActivities.length === 0) {
      return { currentStreak: 0, longestStreak: 0, weeklyActivities: [] };
    }

    const weeklyActivities: { weekStart: number; weekEnd: number; hasActivity: boolean }[] = [];
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

  const getYearRecap = useCallback((year: number = new Date().getFullYear()): YearRecapData => {
    const yearStart = new Date(year, 0, 1).getTime();
    const yearEnd = new Date(year, 11, 31, 23, 59, 59).getTime();

    const yearActivities = savedActivities.filter(
      activity => activity.completedAt && 
                 activity.completedAt >= yearStart && 
                 activity.completedAt <= yearEnd &&
                 activity.isCompleted
    );

    const yearScratched = activityHistory.filter(activity => {
      const activityDate = new Date(activity.title).getTime();
      return activityDate >= yearStart && activityDate <= yearEnd;
    });

    let totalTimeSpent = 0;
    yearActivities.forEach(activity => {
      const duration = activity.duration.toLowerCase();
      if (duration.includes('quick') || duration.includes('1-2 hour')) {
        totalTimeSpent += 90;
      } else if (duration.includes('half day')) {
        totalTimeSpent += 240;
      } else if (duration.includes('full day')) {
        totalTimeSpent += 480;
      } else if (duration.includes('hour')) {
        const match = duration.match(/(\d+)/);
        if (match) {
          totalTimeSpent += parseInt(match[1]) * 60;
        }
      }
    });

    let totalMoneySpent = 0;
    yearActivities.forEach(activity => {
      switch (activity.cost) {
        case '$': totalMoneySpent += 25; break;
        case '$$': totalMoneySpent += 75; break;
        case '$$$': totalMoneySpent += 150; break;
      }
    });

    const categoryCounts: Record<string, number> = {};
    yearActivities.forEach(activity => {
      categoryCounts[activity.category] = (categoryCounts[activity.category] || 0) + 1;
    });
    const favoriteCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const topThreeActivities: YearActivity[] = yearActivities
      .filter(a => a.rating && a.rating >= 4)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.completedAt || 0) - (a.completedAt || 0))
      .slice(0, 3)
      .map(a => ({
        title: a.title,
        category: a.category,
        rating: a.rating,
        completedAt: a.completedAt || 0,
      }));

    const monthlyBreakdown: MonthData[] = [];
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1).getTime();
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59).getTime();
      
      const monthActivities = yearActivities.filter(
        a => a.completedAt && a.completedAt >= monthStart && a.completedAt <= monthEnd
      );

      const monthCategories: Record<string, number> = {};
      monthActivities.forEach(activity => {
        monthCategories[activity.category] = (monthCategories[activity.category] || 0) + 1;
      });
      const topCategory = Object.entries(monthCategories).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      monthlyBreakdown.push({
        month: new Date(year, month).toLocaleDateString('en-US', { month: 'short' }),
        monthNumber: month,
        count: monthActivities.length,
        topCategory,
      });
    }

    const totalRatings = yearActivities.filter(a => a.rating).length;
    const sumRatings = yearActivities.reduce((sum, a) => sum + (a.rating || 0), 0);
    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    const highlights: YearHighlight[] = [];

    if (streakData.longestStreak >= 4) {
      highlights.push({
        type: 'streak',
        title: 'Streak Master',
        description: `${streakData.longestStreak} week streak!`,
        emoji: '',
        value: streakData.longestStreak,
      });
    }

    if (yearActivities.length >= 52) {
      highlights.push({
        type: 'achievement',
        title: 'Weekly Warrior',
        description: 'Completed an activity every week!',
        emoji: '⭐',
        value: yearActivities.length,
      });
    } else if (yearActivities.length >= 26) {
      highlights.push({
        type: 'achievement',
        title: 'Bi-Weekly Champion',
        description: 'Kept the spark alive all year!',
        emoji: '✨',
        value: yearActivities.length,
      });
    } else if (yearActivities.length >= 12) {
      highlights.push({
        type: 'achievement',
        title: 'Monthly Explorer',
        description: 'Made memories every month!',
        emoji: '',
        value: yearActivities.length,
      });
    }

    if (favoriteCategory) {
      const categoryCount = categoryCounts[favoriteCategory];
      highlights.push({
        type: 'category',
        title: `${favoriteCategory} Enthusiast`,
        description: `Loved ${categoryCount} ${favoriteCategory.toLowerCase()} activities`,
        emoji: getCategoryEmoji(favoriteCategory),
        value: categoryCount,
      });
    }

    if (totalTimeSpent >= 2400) {
      highlights.push({
        type: 'time',
        title: 'Time Well Spent',
        description: `${Math.round(totalTimeSpent / 60)} hours of quality time`,
        emoji: '⏰',
        value: Math.round(totalTimeSpent / 60),
      });
    }

    if (totalMoneySpent === 0 && yearActivities.length >= 5) {
      highlights.push({
        type: 'money',
        title: 'Budget Master',
        description: 'Enjoyed free activities all year!',
        emoji: '',
        value: 0,
      });
    }

    const personalizedMessage = generatePersonalizedMessage(
      yearActivities.length,
      favoriteCategory,
      streakData.longestStreak
    );

    return {
      year,
      totalActivitiesCompleted: yearActivities.length,
      totalTimeSpent,
      totalMoneySpent,
      totalScratched: yearScratched.length,
      favoriteCategory,
      topThreeActivities,
      monthlyBreakdown,
      streakRecord: streakData.longestStreak,
      totalSaved: savedActivities.filter(a => 
        a.savedAt >= yearStart && a.savedAt <= yearEnd
      ).length,
      averageRating,
      highlights,
      personalizedMessage,
    };
  }, [savedActivities, activityHistory, streakData]);

  const currentYearRecap = useMemo(() => {
    return getYearRecap(new Date().getFullYear());
  }, [getYearRecap]);

  return {
    currentYearRecap,
    getYearRecap,
  };
});

function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    'Adventure': '',
    'Food & Dining': '',
    'Arts & Culture': '',
    'Entertainment': '',
    'Relaxation': '',
    'Fitness & Sports': '',
    'Learning': '',
    'Games': '',
    'Nature': '',
    'Creative': '',
  };
  return emojiMap[category] || '';
}

function generatePersonalizedMessage(
  totalCompleted: number,
  favoriteCategory: string | null,
  longestStreak: number
): string {
  if (totalCompleted === 0) {
    return 'Ready to start making memories? Your year in review is waiting to be written!';
  }

  if (totalCompleted >= 52) {
    return `What an incredible year! You completed ${totalCompleted} activities and made unforgettable memories every single week. You're living life to the fullest!`;
  }

  if (totalCompleted >= 26) {
    return `Amazing year! ${totalCompleted} activities completed and countless memories created. Your dedication to quality time is inspiring!`;
  }

  if (totalCompleted >= 12) {
    return `Great year of adventures! ${totalCompleted} activities and so many special moments. Keep building those memories!`;
  }

  return `You completed ${totalCompleted} ${totalCompleted === 1 ? 'activity' : 'activities'} this year. Every moment counts, and you're making beautiful memories together!`;
}
