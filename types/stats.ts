export interface ActivityStats {
  totalScratched: number;
  totalSaved: number;
  totalCompleted: number;
  currentMonthScratches: number;
  favoriteCategories: CategoryStat[];
  estimatedTimeSpent: number;
  estimatedMoneySpent: number;
  currentStreak: number;
  longestStreak: number;
  monthlyRecap: MonthlyRecap;
}

export interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export interface MonthlyRecap {
  month: string;
  year: number;
  activitiesScratched: number;
  activitiesCompleted: number;
  topCategory: string | null;
  totalTimeSpent: number;
  totalMoneySpent: number;
  highlights: string[];
}

export interface WeeklyActivity {
  weekStart: number;
  weekEnd: number;
  hasActivity: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  weeklyActivities: WeeklyActivity[];
}
