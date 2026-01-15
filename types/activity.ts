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
  isActive: boolean;
  startedAt?: number;
  isCompleted: boolean;
  completedAt?: number;
  rating?: number;
  notes?: string;
  photos?: string[];
  locationSnapshot?: LocationData;
  // Scheduling fields
  scheduledFor?: number; // Timestamp for when the activity is scheduled
  isScheduled?: boolean; // Whether this activity is scheduled for later
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
  // Advanced filters (premium only)
  advancedFilters?: AdvancedFilters;
};

// Advanced filters available only to premium users
export interface AdvancedFilters {
  // Exact budget range in dollars
  budgetRange?: {
    min: number;
    max: number;
  };
  // Cuisine preferences for Foodie category
  cuisinePreferences?: CuisineType[];
  // Accessibility requirements
  accessibility?: AccessibilityOption[];
  // Preferred time of day
  preferredTimeOfDay?: TimeOfDay;
  // Group size
  groupSize?: GroupSize;
  // Distance preference in miles
  maxDistance?: number;
}

export type CuisineType = 
  | 'italian'
  | 'mexican'
  | 'asian'
  | 'american'
  | 'mediterranean'
  | 'indian'
  | 'thai'
  | 'japanese'
  | 'chinese'
  | 'french'
  | 'seafood'
  | 'vegetarian'
  | 'vegan'
  | 'bbq'
  | 'cafe'
  | 'dessert';

export type AccessibilityOption =
  | 'wheelchair_accessible'
  | 'stroller_friendly'
  | 'senior_friendly'
  | 'quiet_environment'
  | 'outdoor_seating'
  | 'private_space';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'any';

export type GroupSize = 'intimate' | 'small' | 'medium' | 'large';

// Cooldown tracking for free users
export interface ScratchCooldown {
  lastScratchTimestamp: number | null;
  cooldownEndTimestamp: number | null;
}

export const COOLDOWN_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const CUISINE_OPTIONS: { value: CuisineType; label: string }[] = [
  { value: 'italian', label: 'Italian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'asian', label: 'Asian Fusion' },
  { value: 'american', label: 'American' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'indian', label: 'Indian' },
  { value: 'thai', label: 'Thai' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'french', label: 'French' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'bbq', label: 'BBQ' },
  { value: 'cafe', label: 'Café & Brunch' },
  { value: 'dessert', label: 'Desserts' },
];

export const ACCESSIBILITY_OPTIONS: { value: AccessibilityOption; label: string; icon: string }[] = [
  { value: 'wheelchair_accessible', label: 'Wheelchair Accessible', icon: '♿' },
  { value: 'stroller_friendly', label: 'Stroller Friendly', icon: '👶' },
  { value: 'senior_friendly', label: 'Senior Friendly', icon: '👴' },
  { value: 'quiet_environment', label: 'Quiet Environment', icon: '🤫' },
  { value: 'outdoor_seating', label: 'Outdoor Seating', icon: '🌳' },
  { value: 'private_space', label: 'Private Space', icon: '🚪' },
];

export const GROUP_SIZE_OPTIONS: { value: GroupSize; label: string; description: string }[] = [
  { value: 'intimate', label: 'Intimate', description: '2 people' },
  { value: 'small', label: 'Small', description: '3-4 people' },
  { value: 'medium', label: 'Medium', description: '5-8 people' },
  { value: 'large', label: 'Large', description: '9+ people' },
];

export const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string; hours: string }[] = [
  { value: 'morning', label: 'Morning', hours: '6am - 12pm' },
  { value: 'afternoon', label: 'Afternoon', hours: '12pm - 5pm' },
  { value: 'evening', label: 'Evening', hours: '5pm - 9pm' },
  { value: 'night', label: 'Night', hours: '9pm - 2am' },
  { value: 'any', label: 'Any Time', hours: 'Flexible' },
];

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
