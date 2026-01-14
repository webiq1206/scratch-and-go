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
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
    loadScratchCount();
    
    setTimeout(() => {
      loadInteractions();
      loadLearningProfile();
      loadSavedForLater();
    }, 500);
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

    setTimeout(async () => {
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
      console.log('Updated learning profile');
    }, 100);
  }, [activityInteractions]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      updateLearningProfile();
    }, 5000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityInteractions.length]);

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
      
      const systemPrompt = buildSystemPrompt({
        filters,
        intelligentFilters,
        stronglyDislikedCategories,
        learningProfile,
        preferredCategories,
        currentLocation,
        weather,
        currentTimeOfDay,
        contentRestrictions,
        currentSeason,
        historyTitles,
        notInterestedActivities,
        completedAndRatedActivities,
      });

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
      
      let errorMessage = 'Failed to generate activity. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message || errorMessage;
        }
      }
      setGenerationError(errorMessage);
      
      // Clear error after 5 seconds
      setTimeout(() => setGenerationError(null), 5000);
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
    setGenerationError(null); // Clear any previous errors
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
    setGenerationError(null); // Clear any previous errors
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
      console.log(`Intelligent filter: Suggesting ${topCategory} based on user preferences`);
    }

    if (userFilters.budget === 'Any' && learningProfile.preferredBudget) {
      intelligent.budget = learningProfile.preferredBudget;
      console.log(`Intelligent filter: Budget set to ${learningProfile.preferredBudget}`);
    }

    if ((!userFilters.setting || userFilters.setting === 'either') && learningProfile.preferredSetting) {
      intelligent.setting = learningProfile.preferredSetting;
      console.log(`Intelligent filter: Setting preference: ${learningProfile.preferredSetting}`);
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
    generationError,
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

function buildSystemPrompt(params: {
  filters: Filters;
  intelligentFilters: Filters;
  stronglyDislikedCategories: string[];
  learningProfile: UserLearningProfile;
  preferredCategories: string[];
  currentLocation: any;
  weather: any;
  currentTimeOfDay: string;
  contentRestrictions: string[];
  currentSeason: string;
  historyTitles: string;
  notInterestedActivities: string[];
  completedAndRatedActivities: any[];
}): string {
  const {
    filters,
    intelligentFilters,
    stronglyDislikedCategories,
    preferredCategories,
    currentLocation,
    weather,
    currentTimeOfDay,
    contentRestrictions,
    currentSeason,
    historyTitles,
    notInterestedActivities,
    completedAndRatedActivities,
  } = params;

  const isCouples = filters.mode === 'couples';
  const modeContext = isCouples ? 'romantic date or couples activity' : 'family activity that works for parents and kids together';
  
  const budgetGuide: Record<string, string> = {
    'Free': 'completely free - no purchases required, use public spaces, home activities, or free community events',
    '$': 'under $25 total - coffee shops, ice cream, thrift stores, budget-friendly local spots',
    '$$': '$25-75 total - casual dining, movies, bowling, mini golf, escape rooms',
    '$$$': '$75+ - nice restaurants, shows, experiences, day trips',
  };

  const timingGuide: Record<string, string> = {
    'Quick (1-2h)': '1-2 hours max - something you can do on a weeknight or squeeze into a busy day',
    'Half Day': '3-5 hours - a solid afternoon or morning adventure',
    'Full Day': '6+ hours - make it a memorable all-day experience',
  };

  const categoryGuide: Record<string, string> = {
    'Chill': isCouples 
      ? 'relaxed, low-key vibes - cozy cafes, scenic walks, stargazing, movie nights, bookstore browsing'
      : 'calm family bonding - board games, baking together, backyard camping, movie marathons, puzzle nights',
    'Active': isCouples
      ? 'physical activities together - hiking, biking, rock climbing, kayaking, tennis, dancing'
      : 'energetic family fun - playground adventures, bike rides, swimming, nature trails, sports in the park',
    'Creative': isCouples
      ? 'make something together - pottery class, painting, cooking a new recipe, DIY projects'
      : 'arts and crafts - painting, building projects, cooking together, making crafts, decorating',
    'Foodie': isCouples
      ? 'restaurants and dining experiences - trying new restaurants (prioritize restaurants over classes), romantic dinner spots, brunch places, food markets, wine bars, dessert cafes, food trucks, date night restaurants. For Quick (1-2h) timing, STRONGLY prefer restaurants you can visit immediately without advance booking. Only suggest cooking classes for Half Day or Full Day durations if budget allows.'
      : 'restaurants and family dining - family-friendly restaurants, kid-friendly cafes, pizza places, ice cream shops, food markets, casual dining. For Quick (1-2h) timing, STRONGLY prefer restaurants you can visit immediately without advance booking. Avoid cooking classes unless specifically requested for longer durations.',
    'Adventure': isCouples
      ? 'trying new experiences - escape rooms, go-karts, new neighborhoods, spontaneous road trips'
      : 'exciting discoveries - scavenger hunts, new parks, mini adventures, exploring somewhere new',
    'Educational': 'learning together - science museums, aquariums, zoos, historical sites, nature centers, planetariums',
    'Outdoor': 'nature and fresh air - hiking, beach days, picnics, nature walks, gardening, outdoor games',
  };

  const settingContext: Record<string, string> = {
    'indoor': 'MUST be indoors - home, restaurants, museums, malls, indoor venues only',
    'outdoor': 'MUST be outdoors - parks, trails, beaches, outdoor venues, nature',
    'either': 'can be indoor or outdoor based on what fits best',
  };

  let prompt = `Generate a realistic, practical ${modeContext} that someone would actually want to do.

CRITICAL REQUIREMENTS - Follow these exactly:
`;

  prompt += `\n1. BUDGET: ${filters.budget || 'Any'}`;
  if (filters.budget && budgetGuide[filters.budget]) {
    prompt += ` - ${budgetGuide[filters.budget]}`;
  }
  prompt += '\n   The activity MUST fit this budget. Do not suggest expensive activities for free/cheap budgets.';

  prompt += `\n\n2. DURATION: ${filters.timing || 'Anytime'}`;
  if (filters.timing && timingGuide[filters.timing]) {
    prompt += ` - ${timingGuide[filters.timing]}`;
  }
  prompt += '\n   The activity duration MUST match this time constraint.';

  prompt += `\n\n3. VIBE/CATEGORY: ${intelligentFilters.category || 'Any'}`;
  if (intelligentFilters.category && categoryGuide[intelligentFilters.category]) {
    prompt += ` - ${categoryGuide[intelligentFilters.category]}`;
  }

  const settingKey = filters.setting || 'either';
  prompt += `\n\n4. SETTING: ${settingKey}`;
  if (settingContext[settingKey]) {
    prompt += ` - ${settingContext[settingKey]}`;
  }

  if (currentLocation) {
    prompt += `\n\n5. LOCATION: ${currentLocation.city}, ${currentLocation.region}`;
    prompt += '\n   Suggest activities that would realistically be available in or near this location.';
    prompt += '\n   Reference local parks, neighborhoods, or types of venues typical for this area when relevant.';
  }

  if (weather) {
    prompt += `\n\n6. WEATHER: Currently ${weather.temp}°F and ${weather.condition.toLowerCase()}`;
    if (weather.condition === 'Rain' || weather.condition === 'Thunderstorm' || weather.condition === 'Snow') {
      prompt += '\n   Weather is poor - strongly prefer indoor activities unless user specifically chose outdoor.';
    } else if (weather.temp < 40) {
      prompt += "\n   It's cold - consider activities that keep people warm or are indoors.";
    } else if (weather.temp > 90) {
      prompt += "\n   It's very hot - consider activities with shade, AC, or water.";
    }
  }

  prompt += `\n\n7. TIME OF DAY: ${currentTimeOfDay}, SEASON: ${currentSeason}`;
  prompt += "\n   Make the activity appropriate for this time (e.g., don't suggest breakfast activities at night).";

  if (contentRestrictions.length > 0) {
    prompt += `\n\n8. CONTENT RESTRICTIONS: ${contentRestrictions.join(', ')}`;
  }

  prompt += `\n\nSTYLE GUIDELINES:`;
  prompt += `\n- Be SPECIFIC: "Walk along the riverfront trail and stop at a local coffee shop" not "Go for a walk"`;
  prompt += `\n- Be PRACTICAL: Something people can actually do today or this week`;
  prompt += `\n- Be IMMEDIATE: For Quick (1-2h) activities, STRICTLY avoid anything requiring advance booking, reservations days in advance, or scheduling. Prioritize walk-in restaurants, cafes, parks, shops, and spontaneous activities.`;
  prompt += `\n- Be REALISTIC: Match the budget and time constraints exactly`;
  prompt += `\n- Avoid cheesy or cliche suggestions (no "romantic picnic under the stars" unless it fits naturally)`;
  prompt += `\n- ${isCouples ? 'Focus on connection and quality time together' : 'Make it engaging for both kids and adults'}`;
  prompt += `\n- Title should be catchy but not over-the-top (3-6 words)`;
  prompt += `\n- Description should explain what to do specifically (2-3 sentences, be detailed but concise)`;
  prompt += `\n- Pro tip should be genuinely useful, not generic`;
  
  // Special handling for Foodie category
  if (intelligentFilters.category === 'Foodie') {
    if (filters.timing === 'Quick (1-2h)') {
      prompt += `\n\nFOODIE QUICK ACTIVITY REQUIREMENTS:`;
      prompt += `\n- MUST prioritize restaurants, cafes, food trucks, or food markets you can visit immediately`;
      prompt += `\n- NO cooking classes, workshops, or anything requiring advance registration`;
      prompt += `\n- Suggest specific types of cuisine or restaurant vibes (e.g., "Try a cozy Italian restaurant", "Visit a trendy brunch spot")`;
      prompt += `\n- Focus on dining experiences, trying new cuisines, or visiting food-focused venues`;
    }
  }

  if (stronglyDislikedCategories.length > 0) {
    prompt += `\n\nAVOID THESE CATEGORIES (user dislikes): ${stronglyDislikedCategories.join(', ')}`;
  }

  if (notInterestedActivities.length > 0) {
    prompt += `\n\nDO NOT SUGGEST these or similar: ${notInterestedActivities.slice(0, 5).join('; ')}`;
  }

  if (historyTitles) {
    const recentHistory = historyTitles.split(', ').slice(0, 8);
    if (recentHistory.length > 0) {
      prompt += `\n\nAVOID REPEATING (recently suggested): ${recentHistory.join(', ')}`;
    }
  }

  if (preferredCategories.length > 0) {
    prompt += `\n\nUSER TENDS TO ENJOY: ${preferredCategories.join(', ')} - lean toward these if they fit the filters`;
  }

  if (completedAndRatedActivities.length > 0) {
    const topActivities = completedAndRatedActivities.slice(0, 3).map(a => a.title);
    prompt += `\n\nACTIVITIES USER LOVED: ${topActivities.join(', ')} - use these as inspiration for the style/type`;
  }

  prompt += `\n\nNow generate ONE activity that perfectly matches ALL the above requirements.`;

  return prompt;
}
