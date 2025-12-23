import createContextHook from '@nkzw/create-context-hook';
import { useMutation } from '@tanstack/react-query';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { Activity, ActivitySchema, Filters } from '@/types/activity';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePreferences } from './PreferencesContext';
import { useLocation } from './LocationContext';
import { useSubscription } from './SubscriptionContext';

const HISTORY_KEY = 'scratch_and_go_history';
const SCRATCH_COUNT_KEY = 'scratch_and_go_count';
const SCRATCH_MONTH_KEY = 'scratch_and_go_month';

export const [ActivityProvider, useActivity] = createContextHook(() => {
  const { getContentRestrictions } = usePreferences();
  const { location } = useLocation();
  const { isPremium } = useSubscription();
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [activityHistory, setActivityHistory] = useState<Activity[]>([]);
  const [scratchCount, setScratchCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadHistory();
    loadScratchCount();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      if (stored) {
        setActivityHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load activity history:', error);
    }
  };

  const loadScratchCount = async () => {
    try {
      const currentMonth = new Date().getMonth();
      const storedMonth = await AsyncStorage.getItem(SCRATCH_MONTH_KEY);
      const storedCount = await AsyncStorage.getItem(SCRATCH_COUNT_KEY);

      if (storedMonth && parseInt(storedMonth) !== currentMonth) {
        await AsyncStorage.setItem(SCRATCH_COUNT_KEY, '0');
        await AsyncStorage.setItem(SCRATCH_MONTH_KEY, currentMonth.toString());
        setScratchCount(0);
      } else if (storedCount) {
        setScratchCount(parseInt(storedCount));
      }
    } catch (error) {
      console.error('Failed to load scratch count:', error);
    }
  };

  const incrementScratchCount = async () => {
    const newCount = scratchCount + 1;
    setScratchCount(newCount);
    await AsyncStorage.setItem(SCRATCH_COUNT_KEY, newCount.toString());
    await AsyncStorage.setItem(SCRATCH_MONTH_KEY, new Date().getMonth().toString());
  };

  const generateActivityMutation = useMutation({
    mutationFn: async (filters: Filters) => {
      console.log('Generating activity with filters:', filters);
      
      const currentSeason = getCurrentSeason();
      const historyTitles = activityHistory.map(a => a.title).join(', ');
      const currentLocation = filters.location || location;

      const contentRestrictions = getContentRestrictions();
      const systemPrompt = `You are an expert at creating unique, engaging ${filters.mode === 'couples' ? 'date night' : 'family'} activity ideas.

${currentLocation ? `LOCATION CONTEXT:
The user is in ${currentLocation.city}, ${currentLocation.region}, ${currentLocation.country}.
Consider local attractions, landmarks, venues, and region-specific activities.
Suggest activities that take advantage of what makes this location unique.
Mention specific places or areas when relevant (but keep suggestions flexible).
` : ''}

CRITICAL CONTENT RESTRICTIONS:
${contentRestrictions.map(r => `- ${r}`).join('\n')}

Generate a personalized activity with these parameters:
- Mode: ${filters.mode}
- Category: ${filters.category !== 'Any' ? filters.category : 'any category'}
- Budget: ${filters.budget !== 'Any' ? filters.budget : 'any budget'}
- Duration: ${filters.timing !== 'Anytime' ? filters.timing : 'any duration'}
${filters.setting && filters.setting !== 'either' ? `- Setting: ${filters.setting}` : ''}
${filters.kidAges ? `- Kid ages: ${filters.kidAges}` : ''}
- Current season: ${currentSeason}
${currentLocation ? `- Location: ${currentLocation.city}, ${currentLocation.region}` : ''}

Previously generated activities (avoid repeating): ${historyTitles || 'None'}

IMPORTANT: Make this suggestion highly relevant to the local area. Consider:
- Local weather and seasonal activities typical for this region
- Popular attractions and hidden gems in ${currentLocation?.city || 'the area'}
- Cultural events and local experiences
- Indoor/outdoor options based on typical weather
- Nearby natural features (beaches, mountains, parks, etc.)

Create something unique, exciting, and memorable. Use inclusive language ("your partner" not gendered terms).`;

      const activity = await generateObject({
        messages: [
          {
            role: 'user',
            content: systemPrompt,
          },
        ],
        schema: ActivitySchema,
      });

      console.log('Generated activity:', activity);
      return activity;
    },
    onSuccess: (activity) => {
      setCurrentActivity(activity);
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('Activity generation failed:', error);
      setIsGenerating(false);
    },
  });

  const generateActivity = async (filters: Filters) => {
    if (!isPremium && scratchCount >= 3) {
      console.log('Scratch limit reached for this month');
      return false;
    }

    setIsGenerating(true);
    await incrementScratchCount();
    generateActivityMutation.mutate(filters);
    return true;
  };

  const saveToHistory = async () => {
    if (!currentActivity) return;

    const newHistory = [currentActivity, ...activityHistory];
    setActivityHistory(newHistory);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const clearCurrentActivity = () => {
    setCurrentActivity(null);
  };

  return {
    currentActivity,
    activityHistory,
    scratchCount,
    isGenerating,
    generateActivity,
    saveToHistory,
    clearCurrentActivity,
    isLimitReached: !isPremium && scratchCount >= 3,
    remainingScratches: isPremium ? Infinity : Math.max(0, 3 - scratchCount),
  };
});

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}
