export interface YearRecapData {
  year: number;
  totalActivitiesCompleted: number;
  totalTimeSpent: number;
  totalMoneySpent: number;
  totalScratched: number;
  favoriteCategory: string | null;
  topThreeActivities: YearActivity[];
  monthlyBreakdown: MonthData[];
  streakRecord: number;
  totalSaved: number;
  averageRating: number;
  highlights: YearHighlight[];
  personalizedMessage: string;
}

export interface YearActivity {
  title: string;
  category: string;
  rating?: number;
  completedAt: number;
}

export interface MonthData {
  month: string;
  monthNumber: number;
  count: number;
  topCategory: string | null;
}

export interface YearHighlight {
  type: 'streak' | 'category' | 'time' | 'money' | 'achievement';
  title: string;
  description: string;
  emoji: string;
  value?: number;
}
