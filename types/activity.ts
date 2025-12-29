import { z } from 'zod';

export const ActivitySchema = z.object({
  title: z.string().describe('Activity title (3-6 words)'),
  description: z.string().describe('Activity description (2-3 sentences)'),
  cost: z.enum(['free', '$', '$$', '$$$']).describe('Estimated cost tier'),
  duration: z.string().describe('Estimated duration (e.g., "1-2 hours", "Half day")'),
  supplies: z.string().optional().describe('Supplies or preparation needed'),
  proTip: z.string().describe('One pro tip to enhance the experience'),
  category: z.string().describe('Activity category'),
});

export type Activity = z.infer<typeof ActivitySchema>;

export interface SavedActivity extends Activity {
  id: string;
  savedAt: number;
  isCompleted: boolean;
  completedAt?: number;
  rating?: number;
  notes?: string;
  photos?: string[];
  locationSnapshot?: LocationData;
}

export type Mode = 'couples' | 'family';

export interface WeatherData {
  temp: number;
  feelsLike: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  timestamp: number;
}

export interface LocationData {
  city: string;
  region: string;
  country: string;
  coords?: {
    latitude: number;
    longitude: number;
  };
  weather?: WeatherData;
}

export type Filters = {
  mode: Mode;
  category: string;
  budget: string;
  timing: string;
  kidAges?: string;
  setting?: 'indoor' | 'outdoor' | 'either';
  location?: LocationData;
};

export type ActivityInteraction = 'saved' | 'completed' | 'skipped' | 'not_interested';

export interface ActivityWithInteraction extends Activity {
  interactionType: ActivityInteraction;
  interactionDate: number;
  rating?: number;
}

export interface UserLearningProfile {
  dislikedCategories: Record<string, number>;
  likedCategories: Record<string, number>;
  dislikedThemes: string[];
  likedThemes: string[];
  preferredBudget?: string;
  preferredDuration?: string;
  preferredSetting?: 'indoor' | 'outdoor';
  lastUpdated: number;
}
