export interface UserPreferences {
  includeAlcohol: boolean;
  includeReligious: boolean;
  religion?: string;
  includeKidFriendly: boolean;
  includeOutdoorAdventures: boolean;
  completedOnboarding: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  includeAlcohol: false,
  includeReligious: false,
  religion: undefined,
  includeKidFriendly: true,
  includeOutdoorAdventures: true,
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
    id: 'includeKidFriendly',
    question: 'Include activities suitable for children?',
    description: 'This includes playgrounds, family parks, kid-friendly museums, and child-appropriate events',
    yesLabel: 'Yes, include them',
    noLabel: 'No, skip these',
  },
  {
    id: 'includeOutdoorAdventures',
    question: 'Include outdoor adventures?',
    description: 'This includes hiking trails, nature walks, beaches, parks, and outdoor exploration',
    yesLabel: 'Yes, include them',
    noLabel: 'No, skip these',
  },
];
