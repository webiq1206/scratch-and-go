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
}

export const RELIGIONS = [
  { id: 'christianity', label: 'Christianity' },
  { id: 'mormon', label: 'Mormon (LDS)' },
  { id: 'islam', label: 'Islam' },
  { id: 'judaism', label: 'Judaism' },
  { id: 'buddhism', label: 'Buddhism' },
  { id: 'hinduism', label: 'Hinduism' },
  { id: 'other', label: 'Other' },
  { id: 'none', label: 'Prefer not to specify' },
];

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'includeAlcohol',
    question: 'Include activities with alcohol?',
    description: 'This includes bars, breweries, wine tastings, and cocktail experiences',
    yesLabel: 'Yes, include them',
    noLabel: 'No, skip these',
  },
  {
    id: 'includeReligious',
    question: 'Include religious or faith-based activities?',
    description: 'This includes churches, temples, faith gatherings, and religious celebrations',
    yesLabel: 'Yes, include them',
    noLabel: 'No, skip these',
  },
  {
    id: 'includeGambling',
    question: 'Include gambling or casino activities?',
    description: 'This includes casinos, betting venues, and games of chance',
    yesLabel: 'Yes, include them',
    noLabel: 'No, skip these',
  },
  {
    id: 'includeWeapons',
    question: 'Include activities with weapons?',
    description: 'This includes shooting ranges, hunting, archery, and similar activities',
    yesLabel: 'Yes, include them',
    noLabel: 'No, skip these',
  },
];
