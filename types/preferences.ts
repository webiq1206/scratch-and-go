export interface UserPreferences {
  includeAlcohol: boolean;
  includeReligious: boolean;
  religion?: string;
  includeGambling: boolean;
  includeWeapons: boolean;
  completedOnboarding: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  includeAlcohol: false,
  includeReligious: false,
  religion: undefined,
  includeGambling: false,
  includeWeapons: false,
  completedOnboarding: false,
};

export interface OnboardingQuestion {
  id: keyof UserPreferences;
  question: string;
  description: string;
  yesLabel: string;
  noLabel: string;
  emoji: string;
}

export const RELIGIONS = [
  { id: 'christianity', label: 'Christianity', emoji: '✝️' },
  { id: 'islam', label: 'Islam', emoji: '☪️' },
  { id: 'judaism', label: 'Judaism', emoji: '✡️' },
  { id: 'buddhism', label: 'Buddhism', emoji: '☸️' },
  { id: 'hinduism', label: 'Hinduism', emoji: '🕉️' },
  { id: 'other', label: 'Other', emoji: '🙏' },
  { id: 'none', label: 'Prefer not to specify', emoji: '⚪' },
];

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'includeAlcohol',
    question: 'Include activities with alcohol?',
    description: 'This includes bars, breweries, wine tastings, and cocktail experiences',
    yesLabel: 'Yes, include them',
    noLabel: 'No, skip these',
    emoji: '🍷',
  },
  {
    id: 'includeReligious',
    question: 'Include religious or faith-based activities?',
    description: 'This includes churches, temples, faith gatherings, and religious celebrations',
    yesLabel: 'Yes, include them',
    noLabel: 'No, skip these',
    emoji: '🙏',
  },
  {
    id: 'includeGambling',
    question: 'Include gambling or casino activities?',
    description: 'This includes casinos, betting venues, and games of chance',
    yesLabel: 'Yes, include them',
    noLabel: 'No, skip these',
    emoji: '🎰',
  },
  {
    id: 'includeWeapons',
    question: 'Include activities with weapons?',
    description: 'This includes shooting ranges, hunting, archery, and similar activities',
    yesLabel: 'Yes, include them',
    noLabel: 'No, skip these',
    emoji: '🎯',
  },
];
