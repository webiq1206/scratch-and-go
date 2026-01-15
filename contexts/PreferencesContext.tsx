import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences, DEFAULT_PREFERENCES, PersonalizationData, FamilyMember, CoupleNames, GroupType } from '@/types/preferences';

const PREFERENCES_KEY = 'scratch_and_go_preferences';

export const [PreferencesProvider, usePreferences] = createContextHook(() => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    try {
      const updated = { ...preferences, ...newPreferences };
      setPreferences(updated);
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const getContentRestrictions = () => {
    const restrictions: string[] = [];
    
    if (!preferences.includeAlcohol) {
      restrictions.push('Never suggest alcohol, bars, breweries, wineries, cocktails, or drinking');
    }
    
    if (!preferences.includeReligious) {
      restrictions.push('Never suggest religious activities, churches, temples, or faith-based events');
    } else if (preferences.religion && preferences.religion !== 'none') {
      const religionNames: { [key: string]: string } = {
        christianity: 'Christian',
        mormon: 'Mormon (Latter-day Saints)',
        islam: 'Islamic',
        judaism: 'Jewish',
        buddhism: 'Buddhist',
        hinduism: 'Hindu',
        other: 'interfaith or general spiritual',
      };
      const religionName = religionNames[preferences.religion] || 'their faith';
      restrictions.push(`User is interested in ${religionName} activities. Suggest relevant places of worship, faith-based events, and religious celebrations that align with this faith.`);
    }
    
    if (!preferences.includeKidFriendly) {
      restrictions.push('Avoid suggesting activities specifically designed for children, playgrounds, or kid-focused venues');
    } else {
      restrictions.push('Include family-friendly activities that are suitable for children and create memorable moments for families');
    }
    
    if (!preferences.includeOutdoorAdventures) {
      restrictions.push('Avoid suggesting hiking, nature trails, camping, or activities requiring significant outdoor activity');
    } else {
      restrictions.push('Include outdoor adventures like hiking, nature walks, parks, and outdoor exploration opportunities to create lasting memories in nature');
    }

    if (!preferences.includeArtsAndCulture) {
      restrictions.push('Avoid suggesting museums, art galleries, theaters, and cultural venues');
    } else {
      restrictions.push('Include arts and culture experiences like museums, galleries, theaters, and cultural festivals for enriching moments together');
    }

    if (!preferences.includeLiveEntertainment) {
      restrictions.push('Avoid suggesting concerts, live shows, and entertainment venues');
    } else {
      restrictions.push('Include live entertainment like concerts, shows, comedy clubs, and performances for unforgettable nights with loved ones');
    }

    restrictions.push('Never suggest politically affiliated events');
    restrictions.push('Avoid specific dietary places (use "restaurant" not "steakhouse")');
    restrictions.push('Keep all content appropriate and inclusive');
    restrictions.push('Focus on creating and capturing meaningful moments with loved ones that will become cherished memories');
    restrictions.push('Emphasize experiences that bring people together and strengthen relationships');
    
    return restrictions;
  };

  // Personalization helpers
  const getPersonalization = useCallback((): PersonalizationData | undefined => {
    return preferences.personalization;
  }, [preferences.personalization]);

  const updatePersonalization = useCallback(async (personalizationData: Partial<PersonalizationData>) => {
    const currentPersonalization = preferences.personalization || {
      groupType: 'couples' as GroupType,
    };
    const updatedPersonalization = {
      ...currentPersonalization,
      ...personalizationData,
    };
    await updatePreferences({ personalization: updatedPersonalization });
  }, [preferences.personalization, updatePreferences]);

  const setCoupleNames = useCallback(async (names: CoupleNames) => {
    await updatePersonalization({ coupleNames: names });
  }, [updatePersonalization]);

  const setFamilyLastName = useCallback(async (lastName: string) => {
    await updatePersonalization({ familyLastName: lastName });
  }, [updatePersonalization]);

  const setFamilyMembers = useCallback(async (members: FamilyMember[]) => {
    await updatePersonalization({ familyMembers: members });
  }, [updatePersonalization]);

  const addFamilyMember = useCallback(async (member: Omit<FamilyMember, 'id'>) => {
    const currentMembers = preferences.personalization?.familyMembers || [];
    const newMember: FamilyMember = {
      ...member,
      id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    await setFamilyMembers([...currentMembers, newMember]);
  }, [preferences.personalization?.familyMembers, setFamilyMembers]);

  const updateFamilyMember = useCallback(async (memberId: string, updates: Partial<Omit<FamilyMember, 'id'>>) => {
    const currentMembers = preferences.personalization?.familyMembers || [];
    const updatedMembers = currentMembers.map(member => 
      member.id === memberId ? { ...member, ...updates } : member
    );
    await setFamilyMembers(updatedMembers);
  }, [preferences.personalization?.familyMembers, setFamilyMembers]);

  const removeFamilyMember = useCallback(async (memberId: string) => {
    const currentMembers = preferences.personalization?.familyMembers || [];
    await setFamilyMembers(currentMembers.filter(m => m.id !== memberId));
  }, [preferences.personalization?.familyMembers, setFamilyMembers]);

  // Get personalized display name
  const getDisplayName = useCallback((): string | null => {
    const personalization = preferences.personalization;
    if (!personalization) return null;

    if (personalization.groupType === 'couples' && personalization.coupleNames) {
      const { partner1, partner2 } = personalization.coupleNames;
      if (partner1 && partner2) {
        return `${partner1} & ${partner2}`;
      }
      return partner1 || partner2 || null;
    }

    if (personalization.groupType === 'family' && personalization.familyLastName) {
      return `The ${personalization.familyLastName} Family`;
    }

    return null;
  }, [preferences.personalization]);

  // Get family member ages summary for activity suggestions
  const getFamilyAgesSummary = useCallback((): string | null => {
    const members = preferences.personalization?.familyMembers;
    if (!members || members.length === 0) return null;

    const ages = members.map(m => m.age).sort((a, b) => a - b);
    const youngest = ages[0];
    const oldest = ages[ages.length - 1];

    if (ages.length === 1) {
      return `${members[0].name} (age ${ages[0]})`;
    }

    const ageGroups: string[] = [];
    const toddlers = members.filter(m => m.age >= 0 && m.age <= 3);
    const youngKids = members.filter(m => m.age >= 4 && m.age <= 7);
    const kids = members.filter(m => m.age >= 8 && m.age <= 12);
    const teens = members.filter(m => m.age >= 13 && m.age <= 17);
    const adults = members.filter(m => m.age >= 18);

    if (toddlers.length > 0) ageGroups.push(`${toddlers.length} toddler${toddlers.length > 1 ? 's' : ''} (0-3)`);
    if (youngKids.length > 0) ageGroups.push(`${youngKids.length} young kid${youngKids.length > 1 ? 's' : ''} (4-7)`);
    if (kids.length > 0) ageGroups.push(`${kids.length} kid${kids.length > 1 ? 's' : ''} (8-12)`);
    if (teens.length > 0) ageGroups.push(`${teens.length} teen${teens.length > 1 ? 's' : ''} (13-17)`);
    if (adults.length > 0) ageGroups.push(`${adults.length} adult${adults.length > 1 ? 's' : ''}`);

    return ageGroups.join(', ');
  }, [preferences.personalization?.familyMembers]);

  // Get personalization context for activity generation
  const getPersonalizationContext = useCallback((): string | null => {
    const personalization = preferences.personalization;
    if (!personalization) return null;

    if (personalization.groupType === 'couples') {
      const names = personalization.coupleNames;
      if (names?.partner1 && names?.partner2) {
        return `This activity is for a couple: ${names.partner1} and ${names.partner2}. Make suggestions personal and romantic.`;
      }
      return null;
    }

    if (personalization.groupType === 'family') {
      const parts: string[] = [];
      
      if (personalization.familyLastName) {
        parts.push(`This activity is for the ${personalization.familyLastName} family.`);
      }
      
      const members = personalization.familyMembers;
      if (members && members.length > 0) {
        const memberDescriptions = members.map(m => `${m.name} (age ${m.age})`).join(', ');
        parts.push(`Family members: ${memberDescriptions}.`);
        
        const agesSummary = getFamilyAgesSummary();
        if (agesSummary) {
          parts.push(`Age breakdown: ${agesSummary}.`);
        }

        // Add age-appropriate guidance
        const ages = members.map(m => m.age);
        const youngest = Math.min(...ages);
        const oldest = Math.max(...ages);
        
        if (youngest <= 3) {
          parts.push('Include considerations for toddlers - shorter activities, stroller-friendly locations, nap-time awareness.');
        } else if (youngest <= 7) {
          parts.push('Activities should be engaging for young children - interactive, not too long, with movement breaks.');
        } else if (youngest <= 12) {
          parts.push('Activities should appeal to kids - fun, engaging, with some educational value.');
        }
        
        if (oldest >= 13 && youngest <= 10) {
          parts.push('Consider the age gap - find activities that appeal to both teens and younger kids.');
        }
      }

      return parts.length > 0 ? parts.join(' ') : null;
    }

    return null;
  }, [preferences.personalization, getFamilyAgesSummary]);

  return {
    preferences,
    isLoading,
    updatePreferences,
    getContentRestrictions,
    // Personalization
    getPersonalization,
    updatePersonalization,
    setCoupleNames,
    setFamilyLastName,
    setFamilyMembers,
    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember,
    getDisplayName,
    getFamilyAgesSummary,
    getPersonalizationContext,
  };
});
