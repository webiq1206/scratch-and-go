import createContextHook from '@nkzw/create-context-hook';
import { useMutation } from '@tanstack/react-query';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { Activity, ActivitySchema, Filters, ActivityWithInteraction } from '@/types/activity';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePreferences } from './PreferencesContext';
import { useLocation } from './LocationContext';
import { useSubscription } from './SubscriptionContext';

const HISTORY_KEY = 'scratch_and_go_history';
const SCRATCH_COUNT_KEY = 'scratch_and_go_count';
const SCRATCH_MONTH_KEY = 'scratch_and_go_month';
const INTERACTIONS_KEY = 'scratch_and_go_interactions';

export const [ActivityProvider, useActivity] = createContextHook(() => {
  const { getContentRestrictions } = usePreferences();
  const { location } = useLocation();
  const { isPremium } = useSubscription();
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [activityHistory, setActivityHistory] = useState<Activity[]>([]);
  const [activityInteractions, setActivityInteractions] = useState<ActivityWithInteraction[]>([]);
  const [scratchCount, setScratchCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadHistory();
    loadScratchCount();
    loadInteractions();
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

  const loadInteractions = async () => {
    try {
      const stored = await AsyncStorage.getItem(INTERACTIONS_KEY);
      if (stored) {
        setActivityInteractions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load activity interactions:', error);
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
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - please try again')), 30000)
      );
      
      const currentSeason = getCurrentSeason();
      const currentTimeOfDay = getTimeOfDay();
      const historyTitles = activityHistory.map(a => a.title).join(', ');
      const currentLocation = filters.location || location;
      const weather = currentLocation?.weather;

      const notInterestedActivities = activityInteractions
        .filter(a => a.interactionType === 'not_interested')
        .slice(0, 10)
        .map(a => `${a.title} (${a.category})`);
      
      const completedAndRatedActivities = activityInteractions
        .filter(a => a.interactionType === 'completed')
        .slice(0, 5);

      const contentRestrictions = getContentRestrictions();
      const systemPrompt = `You are an expert at creating unique, engaging ${filters.mode === 'couples' ? 'date night' : 'family'} activity ideas.

${currentLocation ? `LOCATION CONTEXT:
The user is in ${currentLocation.city}, ${currentLocation.region}, ${currentLocation.country}.
Consider local attractions, landmarks, venues, and region-specific activities.
Suggest activities that take advantage of what makes this location unique.
Mention specific places or areas when relevant (but keep suggestions flexible).
` : ''}

${weather ? `CURRENT WEATHER:
- Temperature: ${weather.temp}°F (feels like ${weather.feelsLike}°F)
- Conditions: ${weather.condition} - ${weather.description}
- Wind: ${weather.windSpeed} mph
- Humidity: ${weather.humidity}%

IMPORTANT WEATHER CONSIDERATIONS:
${weather.condition === 'Rain' || weather.condition === 'Thunderstorm' ? '- Weather is WET/RAINY: Strongly prioritize INDOOR activities or covered venues. Avoid outdoor activities unless they work in rain (museums, indoor entertainment, cooking, etc.).' : ''}${weather.condition === 'Snow' ? '- Weather is SNOWY: Consider winter activities (skiing, ice skating, cozy indoor activities). Outdoor activities should embrace the snow or be indoors.' : ''}${weather.temp < 32 ? '- Temperature is FREEZING: Prioritize indoor activities or brief outdoor activities with warm destinations.' : ''}${weather.temp < 50 && weather.temp >= 32 ? '- Temperature is COLD: Indoor activities preferred, or outdoor with warm clothing considerations.' : ''}${weather.temp > 85 ? '- Temperature is HOT: Consider indoor AC activities, water activities, or evening outdoor activities.' : ''}${weather.condition === 'Clear' && weather.temp >= 60 && weather.temp <= 85 ? '- Perfect weather for OUTDOOR activities! Take advantage of the beautiful conditions.' : ''}
` : ''}

TIME OF DAY: ${currentTimeOfDay}
${currentTimeOfDay === 'Morning' ? 'Consider breakfast spots, brunch activities, morning outdoor activities, farmers markets.' : ''}
${currentTimeOfDay === 'Afternoon' ? 'Consider lunch spots, daytime activities, matinee shows, afternoon adventures.' : ''}
${currentTimeOfDay === 'Evening' ? 'Consider dinner spots, sunset activities, evening entertainment, nighttime experiences.' : ''}
${currentTimeOfDay === 'Night' ? 'Consider late-night activities, stargazing, 24-hour venues, nighttime entertainment.' : ''}

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
- Time of day: ${currentTimeOfDay}
${currentLocation ? `- Location: ${currentLocation.city}, ${currentLocation.region}` : ''}
${weather ? `- Current weather: ${weather.temp}°F, ${weather.condition}` : ''}

Previously generated activities (avoid repeating): ${historyTitles || 'None'}

${notInterestedActivities.length > 0 ? `USER DISLIKES (avoid similar themes/categories):
${notInterestedActivities.join(', ')}
Do NOT suggest activities similar to these in theme, style, or category.` : ''}

${completedAndRatedActivities.length > 0 ? `SUCCESSFUL ACTIVITIES (user enjoyed these):
${completedAndRatedActivities.map(a => `${a.title} - ${a.category}`).join(', ')}
Consider suggesting activities with similar themes or styles.` : ''}

IMPORTANT: Make this suggestion highly relevant to the local area and current conditions. Consider:
- Current ACTUAL weather conditions (not just typical weather)
${weather && (weather.condition === 'Rain' || weather.condition === 'Thunderstorm' || weather.condition === 'Snow') ? '- WEATHER ALERT: Adjust for current precipitation - indoor activities are STRONGLY preferred' : ''}
- Popular attractions and hidden gems in ${currentLocation?.city || 'the area'}
- Cultural events and local experiences
- Time-appropriate activities for ${currentTimeOfDay.toLowerCase()}
- Nearby natural features (beaches, mountains, parks, etc.)
${weather && weather.condition === 'Clear' && weather.temp >= 60 && weather.temp <= 85 ? '- BEAUTIFUL WEATHER: Take advantage of perfect outdoor conditions!' : ''}

Create something unique, exciting, and memorable. Use inclusive language ("your partner" not gendered terms).`;

      const activity = await Promise.race([
        generateObject({
          messages: [
            {
              role: 'user',
              content: systemPrompt,
            },
          ],
          schema: ActivitySchema,
        }),
        timeoutPromise,
      ]) as Activity;

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
      
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('Generation timed out');
      }
    },
    retry: 2,
    retryDelay: 1000,
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

  const trackInteraction = async (activity: Activity, interactionType: 'saved' | 'completed' | 'skipped' | 'not_interested') => {
    const interaction: ActivityWithInteraction = {
      ...activity,
      interactionType,
      interactionDate: Date.now(),
    };

    const newInteractions = [interaction, ...activityInteractions].slice(0, 100);
    setActivityInteractions(newInteractions);
    await AsyncStorage.setItem(INTERACTIONS_KEY, JSON.stringify(newInteractions));
    console.log(`Tracked ${interactionType} interaction for: ${activity.title}`);
  };

  const skipCurrentActivity = async () => {
    if (currentActivity) {
      await trackInteraction(currentActivity, 'skipped');
    }
    clearCurrentActivity();
  };

  const markAsNotInterested = async () => {
    if (currentActivity) {
      await trackInteraction(currentActivity, 'not_interested');
    }
    clearCurrentActivity();
  };

  return {
    currentActivity,
    activityHistory,
    activityInteractions,
    scratchCount,
    isGenerating,
    generateActivity,
    saveToHistory,
    clearCurrentActivity,
    trackInteraction,
    skipCurrentActivity,
    markAsNotInterested,
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

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}
