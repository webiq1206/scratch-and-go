export type GroupType = 'couples' | 'family';

export interface FamilyMember {
  id: string;
  name: string;
  age: number;
}

export interface CoupleNames {
  partner1: string;
  partner2: string;
}

export interface PersonalizationData {
  groupType: GroupType;
  coupleNames?: CoupleNames;
  familyLastName?: string;
  familyMembers?: FamilyMember[];
}

export interface UserPreferences {
  includeAlcohol: boolean;
  includeReligious: boolean;
  religion?: string;
  includeKidFriendly: boolean;
  includeOutdoorAdventures: boolean;
  includeArtsAndCulture: boolean;
  includeLiveEntertainment: boolean;
  completedOnboarding: boolean;
  hasConfiguredPreferences: boolean;
  personalization?: PersonalizationData;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  includeAlcohol: false,
  includeReligious: false,
  religion: undefined,
  includeKidFriendly: true,
  includeOutdoorAdventures: true,
  includeArtsAndCulture: true,
  includeLiveEntertainment: true,
  completedOnboarding: false,
  hasConfiguredPreferences: false,
  personalization: undefined,
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
    description: 'This includes hiking trails, nature walks, beaches, parks, and outdoor exploration to create memorable moments in nature',
    yesLabel: 'Yes, include them',
    noLabel: 'No, skip these',
  },
  {
    id: 'includeArtsAndCulture',
    question: 'Include arts and culture experiences?',
    description: 'Museums, art galleries, theaters, cultural festivals, and creative experiences to share with loved ones',
    yesLabel: 'Yes, include them',
    noLabel: 'No, skip these',
  },
  {
    id: 'includeLiveEntertainment',
    question: 'Include live entertainment and shows?',
    description: 'Concerts, live music, comedy shows, performances, and entertainment venues for memorable nights out',
    yesLabel: 'Yes, include them',
    noLabel: 'No, skip these',
  },
];
