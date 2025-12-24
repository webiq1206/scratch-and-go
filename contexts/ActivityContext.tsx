import createContextHook from '@nkzw/create-context-hook';
import { useMutation } from '@tanstack/react-query';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { Activity, ActivitySchema, Filters, ActivityWithInteraction, UserLearningProfile } from '@/types/activity';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePreferences } from './PreferencesContext';
import { useLocation } from './LocationContext';
import { useSubscription } from './SubscriptionContext';

const HISTORY_KEY = 'scratch_and_go_history';
const SCRATCH_COUNT_KEY = 'scratch_and_go_count';
const SCRATCH_MONTH_KEY = 'scratch_and_go_month';
const INTERACTIONS_KEY = 'scratch_and_go_interactions';
const LEARNING_PROFILE_KEY = 'scratch_and_go_learning_profile';
const SAVED_FOR_LATER_KEY = 'scratch_and_go_saved_for_later';

export const [ActivityProvider, useActivity] = createContextHook(() => {
  const { getContentRestrictions } = usePreferences();
  const { location } = useLocation();
  const { isPremium } = useSubscription();
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [currentFilters, setCurrentFilters] = useState<Filters | null>(null);
  const [activityHistory, setActivityHistory] = useState<Activity[]>([]);
  const [activityInteractions, setActivityInteractions] = useState<ActivityWithInteraction[]>([]);
  const [savedForLater, setSavedForLater] = useState<Activity[]>([]);
  const [learningProfile, setLearningProfile] = useState<UserLearningProfile>({
    dislikedCategories: {},
    likedCategories: {},
    dislikedThemes: [],
    likedThemes: [],
    lastUpdated: Date.now(),
  });
  const [scratchCount, setScratchCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadHistory();
    loadScratchCount();
    loadInteractions();
    loadLearningProfile();
    loadSavedForLater();
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

  const loadLearningProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(LEARNING_PROFILE_KEY);
      if (stored) {
        setLearningProfile(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load learning profile:', error);
    }
  };

  const loadSavedForLater = async () => {
    try {
      const stored = await AsyncStorage.getItem(SAVED_FOR_LATER_KEY);
      if (stored) {
        setSavedForLater(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load saved for later:', error);
    }
  };

  const updateLearningProfile = useCallback(async () => {
    if (activityInteractions.length === 0) return;

    const newProfile: UserLearningProfile = {
      dislikedCategories: {},
      likedCategories: {},
      dislikedThemes: [],
      likedThemes: [],
      lastUpdated: Date.now(),
    };

    const dislikedActivities = activityInteractions.filter(
      a => a.interactionType === 'not_interested' || a.interactionType === 'skipped'
    );
    
    const likedActivities = activityInteractions.filter(
      a => a.interactionType === 'completed' || a.interactionType === 'saved'
    );

    dislikedActivities.forEach(activity => {
      newProfile.dislikedCategories[activity.category] = 
        (newProfile.dislikedCategories[activity.category] || 0) + 1;
      
      const themes = extractThemes(activity.title, activity.description);
      themes.forEach(theme => {
        if (!newProfile.dislikedThemes.includes(theme)) {
          newProfile.dislikedThemes.push(theme);
        }
      });
    });

    likedActivities.forEach(activity => {
      newProfile.likedCategories[activity.category] = 
        (newProfile.likedCategories[activity.category] || 0) + 1;
      
      const themes = extractThemes(activity.title, activity.description);
      themes.forEach(theme => {
        if (!newProfile.likedThemes.includes(theme)) {
          newProfile.likedThemes.push(theme);
        }
      });
    });

    const budgetPrefs: Record<string, number> = {};
    likedActivities.forEach(a => {
      budgetPrefs[a.cost] = (budgetPrefs[a.cost] || 0) + 1;
    });
    if (Object.keys(budgetPrefs).length > 0) {
      newProfile.preferredBudget = Object.entries(budgetPrefs)
        .sort(([,a], [,b]) => b - a)[0][0];
    }

    const indoorOutdoorPrefs = { indoor: 0, outdoor: 0 };
    likedActivities.forEach(a => {
      const desc = a.description.toLowerCase();
      if (desc.includes('indoor') || desc.includes('inside')) {
        indoorOutdoorPrefs.indoor++;
      }
      if (desc.includes('outdoor') || desc.includes('outside') || desc.includes('park') || desc.includes('nature')) {
        indoorOutdoorPrefs.outdoor++;
      }
    });
    if (indoorOutdoorPrefs.indoor > indoorOutdoorPrefs.outdoor * 1.5) {
      newProfile.preferredSetting = 'indoor';
    } else if (indoorOutdoorPrefs.outdoor > indoorOutdoorPrefs.indoor * 1.5) {
      newProfile.preferredSetting = 'outdoor';
    }

    setLearningProfile(newProfile);
    await AsyncStorage.setItem(LEARNING_PROFILE_KEY, JSON.stringify(newProfile));
    console.log('Updated learning profile:', newProfile);
  }, [activityInteractions]);

  useEffect(() => {
    updateLearningProfile();
  }, [updateLearningProfile]);

  const extractThemes = (title: string, description: string): string[] => {
    const text = `${title} ${description}`.toLowerCase();
    const themes: string[] = [];

    const themeKeywords: Record<string, string[]> = {
      'food': ['food', 'restaurant', 'dining', 'eat', 'meal', 'cuisine', 'cook', 'recipe'],
      'music': ['music', 'concert', 'band', 'song', 'instrument', 'karaoke'],
      'sports': ['sport', 'game', 'athletic', 'exercise', 'fitness', 'gym', 'workout'],
      'art': ['art', 'paint', 'draw', 'craft', 'create', 'gallery', 'museum'],
      'nature': ['nature', 'hike', 'trail', 'park', 'outdoor', 'forest', 'beach', 'mountain'],
      'water': ['water', 'swim', 'beach', 'lake', 'river', 'ocean', 'boat', 'kayak'],
      'nightlife': ['bar', 'club', 'nightlife', 'party', 'drink', 'cocktail'],
      'culture': ['culture', 'museum', 'history', 'heritage', 'tradition', 'festival'],
      'shopping': ['shop', 'store', 'mall', 'market', 'boutique', 'browse'],
      'relaxation': ['relax', 'spa', 'massage', 'peaceful', 'calm', 'quiet', 'meditate'],
      'adventure': ['adventure', 'explore', 'discover', 'thrill', 'exciting', 'challenge'],
      'learning': ['learn', 'class', 'workshop', 'lesson', 'course', 'study', 'teach'],
      'movies': ['movie', 'film', 'cinema', 'theater', 'watch', 'screening'],
      'gaming': ['game', 'arcade', 'video game', 'board game', 'play'],
    };

    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        themes.push(theme);
      }
    });

    return themes;
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
        .filter(a => a.interactionType === 'not_interested' || a.interactionType === 'skipped')
        .slice(0, 15)
        .map(a => `${a.title} (${a.category})`);
      
      const completedAndRatedActivities = activityInteractions
        .filter(a => a.interactionType === 'completed' || a.interactionType === 'saved')
        .slice(0, 10);

      const stronglyDislikedCategories = Object.entries(learningProfile.dislikedCategories)
        .filter(([_, count]) => count >= 2)
        .map(([cat]) => cat);

      const preferredCategories = Object.entries(learningProfile.likedCategories)
        .filter(([_, count]) => count >= 2)
        .map(([cat]) => cat);

      const contentRestrictions = getContentRestrictions();
      
      const intelligentFilters = getIntelligentFilters(filters);
      
      const systemPrompt = `You are an expert at creating unique, engaging ${filters.mode === 'couples' ? 'date night' : 'family'} activity ideas.

USER LEARNING PROFILE - CRITICAL RESTRICTIONS:
${stronglyDislikedCategories.length > 0 ? `NEVER suggest these categories (user has rejected them multiple times):
${stronglyDislikedCategories.join(', ')}
ABSOLUTELY AVOID these categories at all costs.` : ''}

${learningProfile.dislikedThemes.length > 0 ? `AVOID these themes/topics:
${learningProfile.dislikedThemes.join(', ')}
Do not suggest activities related to these themes.` : ''}

${preferredCategories.length > 0 ? `User enjoys these categories (prioritize when possible):
${preferredCategories.join(', ')}` : ''}

${learningProfile.likedThemes.length > 0 ? `User likes these themes:
${learningProfile.likedThemes.join(', ')}` : ''}

${learningProfile.preferredBudget ? `User typically prefers: ${learningProfile.preferredBudget} activities` : ''}
${learningProfile.preferredSetting ? `User shows preference for: ${learningProfile.preferredSetting} activities` : ''}

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

Generate a personalized activity with these INTELLIGENT parameters:
- Mode: ${filters.mode}
- Category: ${intelligentFilters.category}
- Budget: ${intelligentFilters.budget}
- Duration: ${intelligentFilters.timing}
${intelligentFilters.setting && intelligentFilters.setting !== 'either' ? `- Setting: ${intelligentFilters.setting}` : ''}
${filters.kidAges ? `- Kid ages: ${filters.kidAges}` : ''}
- Current season: ${currentSeason}
- Time of day: ${currentTimeOfDay}
${currentLocation ? `- Location: ${currentLocation.city}, ${currentLocation.region}` : ''}
${weather ? `- Current weather: ${weather.temp}°F, ${weather.condition}` : ''}

Previously generated activities (avoid repeating): ${historyTitles || 'None'}

${notInterestedActivities.length > 0 ? `REJECTED ACTIVITIES - DO NOT SUGGEST SIMILAR:
${notInterestedActivities.join(', ')}
CRITICAL: Analyze WHY these were rejected and avoid similar patterns.` : ''}

${completedAndRatedActivities.length > 0 ? `SUCCESSFUL ACTIVITIES (user loved these):
${completedAndRatedActivities.map(a => `${a.title} - ${a.category}${a.rating ? ` (rated ${a.rating}/5)` : ''}`).join(', ')}
Prioritize activities similar in style and theme to these successful ones.` : ''}

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
    onSuccess: (activity, filters) => {
      setCurrentActivity(activity);
      setCurrentFilters(filters);
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
    setCurrentFilters(filters);
    await incrementScratchCount();
    generateActivityMutation.mutate(filters);
    return true;
  };

  const regenerateActivity = async () => {
    if (!currentFilters) {
      console.error('No filters available for regeneration');
      return false;
    }

    if (!isPremium && scratchCount >= 3) {
      console.log('Scratch limit reached for this month');
      return false;
    }

    setIsGenerating(true);
    await incrementScratchCount();
    generateActivityMutation.mutate(currentFilters);
    return true;
  };

  const saveForLaterActivity = async (activity?: Activity) => {
    const activityToSave = activity || currentActivity;
    if (!activityToSave) {
      console.error('No activity to save');
      return false;
    }

    const isDuplicate = savedForLater.some(a => a.title === activityToSave.title);
    if (isDuplicate) {
      console.log('Activity already saved for later');
      return false;
    }

    const newSavedForLater = [activityToSave, ...savedForLater];
    setSavedForLater(newSavedForLater);
    await AsyncStorage.setItem(SAVED_FOR_LATER_KEY, JSON.stringify(newSavedForLater));
    console.log('Activity saved for later:', activityToSave.title);
    return true;
  };

  const removeFromSavedForLater = async (activityTitle: string) => {
    const newSavedForLater = savedForLater.filter(a => a.title !== activityTitle);
    setSavedForLater(newSavedForLater);
    await AsyncStorage.setItem(SAVED_FOR_LATER_KEY, JSON.stringify(newSavedForLater));
  };

  const isActivitySavedForLater = (activityTitle: string): boolean => {
    return savedForLater.some(a => a.title === activityTitle);
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

  const getIntelligentFilters = (userFilters: Filters): Filters => {
    const intelligent = { ...userFilters };

    if (userFilters.category === 'Any' && Object.keys(learningProfile.likedCategories).length > 0) {
      const topCategory = Object.entries(learningProfile.likedCategories)
        .sort(([,a], [,b]) => b - a)[0][0];
      intelligent.category = topCategory;
      console.log(`🧠 Intelligent filter: Suggesting ${topCategory} based on user preferences`);
    }

    if (userFilters.budget === 'Any' && learningProfile.preferredBudget) {
      intelligent.budget = learningProfile.preferredBudget;
      console.log(`🧠 Intelligent filter: Budget set to ${learningProfile.preferredBudget}`);
    }

    if ((!userFilters.setting || userFilters.setting === 'either') && learningProfile.preferredSetting) {
      intelligent.setting = learningProfile.preferredSetting;
      console.log(`🧠 Intelligent filter: Setting preference: ${learningProfile.preferredSetting}`);
    }

    return intelligent;
  };

  const trackInteraction = async (activity: Activity, interactionType: 'saved' | 'completed' | 'skipped' | 'not_interested', rating?: number) => {
    const interaction: ActivityWithInteraction = {
      ...activity,
      interactionType,
      interactionDate: Date.now(),
      rating,
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
    currentFilters,
    activityHistory,
    activityInteractions,
    savedForLater,
    learningProfile,
    scratchCount,
    isGenerating,
    generateActivity,
    regenerateActivity,
    saveForLaterActivity,
    removeFromSavedForLater,
    isActivitySavedForLater,
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
