import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences, DEFAULT_PREFERENCES } from '@/types/preferences';

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
        islam: 'Islamic',
        judaism: 'Jewish',
        buddhism: 'Buddhist',
        hinduism: 'Hindu',
        other: 'interfaith or general spiritual',
      };
      const religionName = religionNames[preferences.religion] || 'their faith';
      restrictions.push(`User is interested in ${religionName} activities. Suggest relevant places of worship, faith-based events, and religious celebrations that align with this faith.`);
    }
    
    if (!preferences.includeGambling) {
      restrictions.push('Never suggest gambling, casinos, or betting');
    }
    
    if (!preferences.includeWeapons) {
      restrictions.push('Never suggest hunting or activities involving weapons');
    }

    restrictions.push('Never suggest politically affiliated events');
    restrictions.push('Avoid specific dietary places (use "restaurant" not "steakhouse")');
    restrictions.push('Keep all content appropriate and inclusive');
    
    return restrictions;
  };

  return {
    preferences,
    isLoading,
    updatePreferences,
    getContentRestrictions,
  };
});
