import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, ActivityIndicator, TouchableOpacity, Image, Dimensions, InteractionManager, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Heart, Users, MapPin, ChevronLeft, Clock, DollarSign, Lightbulb, Play, RefreshCw, Share2, ThumbsDown, Bookmark, Sun, Cloud, CloudRain, Snowflake, Zap, Coffee, Palette, Utensils, Mountain, Home as HomeIcon, Shuffle, User, LogOut, Settings, X, Sliders, Crown, Check, Timer, CheckCircle } from 'lucide-react-native';
import Logo from '@/components/ui/Logo';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';

import ScratchCard from '@/components/ui/ScratchCard';
import LocationSelector from '@/components/ui/LocationSelector';
import PreferencesSetupModal from '@/components/ui/PreferencesSetupModal';
import { useActivity } from '@/contexts/ActivityContext';
import { useLocation } from '@/contexts/LocationContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAlert } from '@/contexts/AlertContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useMemoryBook } from '@/contexts/MemoryBookContext';
import { Filters, AdvancedFilters, CuisineType, AccessibilityOption, TimeOfDay, GroupSize, CUISINE_OPTIONS, ACCESSIBILITY_OPTIONS, GROUP_SIZE_OPTIONS, TIME_OF_DAY_OPTIONS } from '@/types/activity';
import { shareActivity } from '@/utils/shareActivity';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MODE_KEY = 'scratch_and_go_mode';

type Mode = 'couples' | 'family';
type WizardStep = 'welcome' | 'category' | 'budget' | 'timing' | 'setting' | 'summary';

interface WizardAnswers {
  category?: string;
  budget?: string;
  timing?: string;
  setting?: 'indoor' | 'outdoor' | 'either';
}

// Default advanced filters
const DEFAULT_ADVANCED_FILTERS: AdvancedFilters = {};

// Helper to format cooldown time
const formatCooldownTime = (ms: number): string => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

// Category icons mapping
const getCategoryIcon = (category: string, size: number = 20, color: string = Colors.text) => {
  const icons: Record<string, React.ReactNode> = {
    'Chill': <Coffee size={size} color={color} />,
    'Active': <Zap size={size} color={color} />,
    'Creative': <Palette size={size} color={color} />,
    'Foodie': <Utensils size={size} color={color} />,
    'Adventure': <Mountain size={size} color={color} />,
    'Educational': <Lightbulb size={size} color={color} />,
    'Outdoor': <Sun size={size} color={color} />,
  };
  return icons[category] || <Heart size={size} color={color} />;
};

// Weather icon helper
const getWeatherIcon = (condition: string, size: number = 18) => {
  const conditionLower = condition.toLowerCase();
  if (conditionLower.includes('rain') || conditionLower.includes('shower')) {
    return <CloudRain size={size} color={Colors.textLight} />;
  } else if (conditionLower.includes('snow')) {
    return <Snowflake size={size} color={Colors.textLight} />;
  } else if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
    return <Cloud size={size} color={Colors.textLight} />;
  }
  return <Sun size={size} color={Colors.accent} />;
};

export default function HomeScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [wizardStep, setWizardStep] = useState<WizardStep>('welcome');
  const [wizardAnswers, setWizardAnswers] = useState<WizardAnswers>({});
  const [hasStartedScratch, setHasStartedScratch] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0];
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scratchCardKeyRef = useRef<string>(`card-${Date.now()}`);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(DEFAULT_ADVANCED_FILTERS);
  const [cooldownDisplay, setCooldownDisplay] = useState<string | null>(null);
  
  const { 
    currentActivity, 
    generateActivity, 
    regenerateActivity,
    isGenerating, 
    isLimitReached, 
    remainingScratches,
    markAsNotInterested,
    clearCurrentActivity,
    generationError,
    isCooldownActive,
    getCooldownRemaining,
  } = useActivity();

  const { location } = useLocation();
  const { isPremium } = useSubscription();
  const { alert, showSuccess, showError, showInfo } = useAlert();
  const { user, isAuthenticated, logout } = useAuth();
  const { preferences, getDisplayName, getPersonalization } = usePreferences();
  const { getCompletedActivities, saveActivity, savedActivities, isActivitySaved } = useMemoryBook();
  const [isSharing, setIsSharing] = useState(false);
  const [showPreferencesSetup, setShowPreferencesSetup] = useState(false);
  const pendingWizardActionRef = useRef<(() => void) | null>(null);
  
  // Check if current activity is saved in Memory Book
  const isActivitySavedInMemoryBook = useMemo(() => {
    if (!currentActivity) return false;
    return savedActivities.some(a => a.title === currentActivity.title);
  }, [currentActivity, savedActivities]);
  
  // Get personalized display name
  const displayName = getDisplayName();
  const personalization = getPersonalization();

  // Cooldown timer update
  useEffect(() => {
    if (isPremium) {
      setCooldownDisplay(null);
      return;
    }
    
    const updateCooldown = () => {
      const remaining = getCooldownRemaining();
      if (remaining > 0) {
        setCooldownDisplay(formatCooldownTime(remaining));
      } else {
        setCooldownDisplay(null);
      }
    };
    
    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [isPremium, getCooldownRemaining]);

  // Show error alert when generation fails
  useEffect(() => {
    if (generationError) {
      alert(
        'Generation Failed',
        generationError,
        [
          {
            text: 'Try Again',
            onPress: async () => {
              if (wizardStep === 'summary' && wizardAnswers.setting) {
                const filters: Filters = {
                  mode: mode || 'couples',
                  category: wizardAnswers.category || 'Any',
                  budget: wizardAnswers.budget || 'Any',
                  timing: wizardAnswers.timing || 'Any',
                  setting: wizardAnswers.setting,
                  location: location || undefined,
                  advancedFilters: isPremium ? advancedFilters : undefined,
                };
                await generateActivity(filters);
              } else {
                await regenerateActivity();
              }
            }
          },
          { text: 'OK', style: 'cancel' }
        ],
        'error'
      );
    }
  }, [generationError]);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      loadMode();
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        loadMode();
      });
      return () => task.cancel();
    }, [])
  );

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [wizardStep]);

  const loadMode = async () => {
    const savedMode = await AsyncStorage.getItem(MODE_KEY);
    if (savedMode) {
      setMode(savedMode as Mode);
    }
  };

  const handleModeSelection = async (selectedMode: Mode) => {
    await AsyncStorage.setItem(MODE_KEY, selectedMode);
    setMode(selectedMode);
    setWizardStep('welcome');
    setWizardAnswers({});
    setHasStartedScratch(false);
    clearCurrentActivity();
  };

  const getPremiumCategories = useCallback(() => {
    return mode === 'couples' ? ['Adventure'] : ['Outdoor'];
  }, [mode]);

  const isCategoryPremium = useCallback((category: string) => {
    return getPremiumCategories().includes(category);
  }, [getPremiumCategories]);

  const handleWizardAnswer = useCallback((key: keyof WizardAnswers, value: string | 'indoor' | 'outdoor' | 'either') => {
    if (key === 'category' && isCategoryPremium(value as string) && !isPremium) {
      alert(
        'Premium Category',
        `'${value}' is a premium category. Upgrade to unlock exclusive activity categories!`,
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/paywall' as any) }
        ],
        'info'
      );
      return;
    }

    const updatedAnswers = { ...wizardAnswers, [key]: value };
    setWizardAnswers(updatedAnswers);
    
    slideAnim.setValue(SCREEN_WIDTH);
    const stepOrder: WizardStep[] = ['welcome', 'category', 'budget', 'timing', 'setting', 'summary'];
    const currentIndex = stepOrder.indexOf(wizardStep);
    if (currentIndex < stepOrder.length - 1) {
      setWizardStep(stepOrder[currentIndex + 1]);
    }

    if (key === 'setting' && mode) {
      if (isLimitReached && !isPremium) {
        alert(
          'Scratch Limit Reached',
          `You've used your 3 free scratches this month! Upgrade to premium for unlimited scratches.`,
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Upgrade', onPress: () => router.push('/paywall' as any) }
          ],
          'warning'
        );
        return;
      }

      // Check cooldown for free users
      if (!isPremium && isCooldownActive()) {
        const remaining = getCooldownRemaining();
        alert(
          'Cooldown Active',
          `Free users can scratch once every 24 hours. Your next scratch is available in ${formatCooldownTime(remaining)}.\n\nUpgrade to Premium for unlimited scratches with no cooldown!`,
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Upgrade', onPress: () => router.push('/paywall' as any) }
          ],
          'warning'
        );
        return;
      }

      InteractionManager.runAfterInteractions(async () => {
        const filters: Filters = {
          mode,
          category: updatedAnswers.category || 'Any',
          budget: updatedAnswers.budget || 'Any',
          timing: updatedAnswers.timing || 'Any',
          setting: updatedAnswers.setting || 'either',
          location: location || undefined,
          advancedFilters: isPremium ? advancedFilters : undefined,
        };
        const result = await generateActivity(filters);
        if (!result.success) {
          if (result.reason === 'cooldown_active') {
            const remaining = getCooldownRemaining();
            alert(
              'Cooldown Active',
              `Your next scratch is available in ${formatCooldownTime(remaining)}.`,
              [
                { text: 'Not Now', style: 'cancel' },
                { text: 'Upgrade', onPress: () => router.push('/paywall' as any) }
              ],
              'warning'
            );
          } else if (result.reason === 'premium_category') {
            alert(
              'Premium Category',
              'This category is only available for Premium users. Upgrade to unlock exclusive activity categories!',
              [
                { text: 'Not Now', style: 'cancel' },
                { text: 'Upgrade', onPress: () => router.push('/paywall' as any) }
              ],
              'info'
            );
          } else if (result.reason === 'limit_reached') {
            alert(
              'Scratch Limit Reached',
              `You've used your 3 free scratches this month! Upgrade to premium for unlimited scratches.`,
              [
                { text: 'Not Now', style: 'cancel' },
                { text: 'Upgrade', onPress: () => router.push('/paywall' as any) }
              ],
              'warning'
            );
          }
        }
      });
    }
  }, [isCategoryPremium, isPremium, router, slideAnim, wizardStep, wizardAnswers, mode, isLimitReached, location, generateActivity, isCooldownActive, getCooldownRemaining, advancedFilters]);

  const handleWizardBack = useCallback(() => {
    const stepOrder: WizardStep[] = ['welcome', 'category', 'budget', 'timing', 'setting', 'summary'];
    const currentIndex = stepOrder.indexOf(wizardStep);
    if (currentIndex > 0) {
      slideAnim.setValue(-SCREEN_WIDTH);
      setWizardStep(stepOrder[currentIndex - 1]);
    }
  }, [slideAnim, wizardStep]);

  const handleStartWizard = useCallback(() => {
    // Check if preferences are configured before starting
    if (!preferences.hasConfiguredPreferences) {
      // Store the action to continue after preferences setup
      pendingWizardActionRef.current = () => {
        setWizardAnswers({});
        setWizardStep('category');
        slideAnim.setValue(SCREEN_WIDTH);
      };
      setShowPreferencesSetup(true);
      return;
    }
    
    setWizardAnswers({});
    setWizardStep('category');
    slideAnim.setValue(SCREEN_WIDTH);
  }, [slideAnim, preferences.hasConfiguredPreferences]);

  const handleRestartWizard = useCallback(() => {
    setWizardAnswers({});
    setWizardStep('welcome');
    setHasStartedScratch(false);
    setIsDescriptionExpanded(false);
    scratchCardKeyRef.current = `card-${Date.now()}`;
    clearCurrentActivity();
  }, [clearCurrentActivity]);

  const handlePreferencesSetupComplete = useCallback(() => {
    setShowPreferencesSetup(false);
    // Execute the pending action after preferences are set
    if (pendingWizardActionRef.current) {
      pendingWizardActionRef.current();
      pendingWizardActionRef.current = null;
    }
  }, []);

  const wizardProgress = useMemo(() => {
    const steps = ['category', 'budget', 'timing', 'setting'];
    const currentIndex = steps.indexOf(wizardStep);
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / steps.length) * 100;
  }, [wizardStep]);

  const handleScratchStart = async () => {
    if (hasStartedScratch) return;
    setHasStartedScratch(true);
    setIsSavedForLater(false);
    setScrollEnabled(false);
  };

  const handleStartActivity = useCallback(() => {
    if (!currentActivity) return;
    
    router.push({
      pathname: '/activity-in-progress' as any,
      params: {
        activityId: Date.now().toString(),
        title: currentActivity.title,
        description: currentActivity.description,
        duration: currentActivity.duration,
        cost: currentActivity.cost,
        category: currentActivity.category,
        proTip: currentActivity.proTip || '',
        mode: mode || 'couples',
      }
    });
  }, [currentActivity, router, mode]);

  const handleShareActivity = useCallback(async () => {
    if (!currentActivity || isSharing) return;
    
    setIsSharing(true);
    try {
      await shareActivity(currentActivity);
    } catch (error) {
      showError('Share Failed', 'Unable to share activity. Please try again.');
    } finally {
      setIsSharing(false);
    }
  }, [currentActivity, isSharing]);

  const handleSaveForLater = async () => {
    if (!currentActivity) return;

    // Check if already saved to Memory Book
    if (isActivitySavedInMemoryBook) {
      showInfo('Already Saved', 'This activity is already in your Memory Book.');
      return;
    }
    
    try {
      // Save to Memory Book without marking as active (saved for later)
      saveActivity(currentActivity, undefined, false);
      showSuccess('Saved!', 'Activity saved to your Memory Book.');
    } catch (error) {
      console.error('Error saving activity:', error);
      showError('Error', 'Failed to save activity. Please try again.');
    }
  };

  const handleRegenerateActivity = async () => {
    if (isGenerating) return;

    if (isLimitReached && !isPremium) {
      alert(
        'Scratch Limit Reached',
        `You've used your 3 free scratches this month! Upgrade to premium for unlimited scratches.`,
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/paywall' as any) }
        ],
        'warning'
      );
      return;
    }

    // Check cooldown for free users
    if (!isPremium && isCooldownActive()) {
      const remaining = getCooldownRemaining();
      alert(
        'Cooldown Active',
        `Free users can scratch once every 24 hours. Your next scratch is available in ${formatCooldownTime(remaining)}.\n\nUpgrade to Premium for unlimited scratches with no cooldown!`,
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/paywall' as any) }
        ],
        'warning'
      );
      return;
    }

    setIsSavedForLater(false);
    setHasStartedScratch(false);
    setIsDescriptionExpanded(false);
    scratchCardKeyRef.current = `card-${Date.now()}`;
    const result = await regenerateActivity();
    if (!result.success) {
      if (result.reason === 'cooldown_active') {
        const remaining = getCooldownRemaining();
        alert(
          'Cooldown Active',
          `Your next scratch is available in ${formatCooldownTime(remaining)}.`,
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Upgrade', onPress: () => router.push('/paywall' as any) }
          ],
          'warning'
        );
      } else if (result.reason === 'premium_category') {
        alert(
          'Premium Category',
          'This category is only available for Premium users. Upgrade to unlock exclusive activity categories!',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Upgrade', onPress: () => router.push('/paywall' as any) }
          ],
          'info'
        );
      } else if (result.reason === 'limit_reached') {
        alert(
          'Scratch Limit Reached',
          `You've used your 3 free scratches this month! Upgrade to premium for unlimited scratches.`,
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Upgrade', onPress: () => router.push('/paywall' as any) }
          ],
          'warning'
        );
      }
    }
  };

  const handleScratchComplete = useCallback(() => {
    if (!currentActivity) {
      showInfo(
        'Activity Not Ready',
        'The activity is still being generated. Please wait a moment and try again.'
      );
      return;
    }
    setScrollEnabled(true);
  }, [currentActivity]);

  const handleNotInterested = async () => {
    if (!currentActivity) return;
    
    alert(
      'Not Interested',
      "We'll avoid suggesting similar activities in the future.",
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip This One', 
          onPress: async () => {
            await markAsNotInterested();
            setHasStartedScratch(false);
            setScrollEnabled(true);
            scratchCardKeyRef.current = `card-${Date.now()}`;
            if (isLimitReached && !isPremium) {
              alert(
                'Scratch Limit Reached',
                `You've used your 3 free scratches this month!`,
                [
                  { text: 'Not Now', style: 'cancel' },
                  { text: 'Upgrade', onPress: () => router.push('/paywall' as any) }
                ],
                'warning'
              );
            } else {
              await regenerateActivity();
            }
          }
        }
      ],
      'info'
    );
  };

  const handleLogout = () => {
    setShowProfileModal(false);
    alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/welcome' as any);
            } catch (error) {
              showError('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ],
      'warning'
    );
  };

  const handleGoToSettings = () => {
    setShowProfileModal(false);
    router.push('/settings' as any);
  };

  // Advanced filters handlers
  const toggleCuisine = (cuisine: CuisineType) => {
    setAdvancedFilters(prev => {
      const current = prev.cuisinePreferences || [];
      const updated = current.includes(cuisine)
        ? current.filter(c => c !== cuisine)
        : [...current, cuisine];
      return { ...prev, cuisinePreferences: updated };
    });
  };

  const toggleAccessibility = (option: AccessibilityOption) => {
    setAdvancedFilters(prev => {
      const current = prev.accessibility || [];
      const updated = current.includes(option)
        ? current.filter(a => a !== option)
        : [...current, option];
      return { ...prev, accessibility: updated };
    });
  };

  const setTimeOfDay = (time: TimeOfDay) => {
    setAdvancedFilters(prev => ({ ...prev, preferredTimeOfDay: time }));
  };

  const setGroupSize = (size: GroupSize) => {
    setAdvancedFilters(prev => ({ ...prev, groupSize: size }));
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);
  };

  const hasAdvancedFilters = useMemo(() => {
    return (
      (advancedFilters.cuisinePreferences && advancedFilters.cuisinePreferences.length > 0) ||
      (advancedFilters.accessibility && advancedFilters.accessibility.length > 0) ||
      (advancedFilters.preferredTimeOfDay && advancedFilters.preferredTimeOfDay !== 'any') ||
      advancedFilters.groupSize !== undefined
    );
  }, [advancedFilters]);

  const categories = mode === 'couples' 
    ? [
        { label: 'Chill', description: 'Relaxed vibes', icon: 'Chill' },
        { label: 'Active', description: 'Get moving', icon: 'Active' },
        { label: 'Creative', description: 'Make something', icon: 'Creative' },
        { label: 'Foodie', description: 'Taste & explore', icon: 'Foodie' },
        { label: 'Adventure', description: 'Try new things', icon: 'Adventure' },
      ]
    : [
        { label: 'Chill', description: 'Relaxed together', icon: 'Chill' },
        { label: 'Active', description: 'Fun & energetic', icon: 'Active' },
        { label: 'Creative', description: 'Arts & crafts', icon: 'Creative' },
        { label: 'Educational', description: 'Learn together', icon: 'Educational' },
        { label: 'Outdoor', description: 'Nature fun', icon: 'Outdoor' },
      ];

  const budgetOptions = [
    { label: 'Free', description: 'No cost' },
    { label: '$', description: 'Under $25' },
    { label: '$$', description: '$25 - $75' },
    { label: '$$$', description: '$75+' },
  ];
  
  const timingOptions = [
    { label: 'Quick (1-2h)', description: 'Perfect for busy days' },
    { label: 'Half Day', description: '3-5 hours of fun' },
    { label: 'Full Day', description: 'Make it epic' },
  ];

  const settingOptions = [
    { label: 'Indoor', value: 'indoor' as const, description: 'Cozy & comfortable', icon: <HomeIcon size={24} color={Colors.text} /> },
    { label: 'Outdoor', value: 'outdoor' as const, description: 'Fresh air', icon: <Sun size={24} color={Colors.text} /> },
    { label: 'Either', value: 'either' as const, description: 'Surprise me', icon: <Shuffle size={24} color={Colors.text} /> },
  ];

  const renderWizardContent = () => {
    const slideTransform = slideAnim.interpolate({
      inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      outputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    });

    const opacity = slideAnim.interpolate({
      inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      outputRange: [0, 1, 0],
    });

    switch (wizardStep) {
      case 'welcome':
        const getWelcomeTitle = () => {
          if (displayName) {
            if (mode === 'couples') {
              return `Ready for a date, ${displayName}?`;
            }
            return `Ready for some fun, ${displayName}?`;
          }
          return mode === 'couples' ? 'Ready for a special moment?' : 'Ready for family fun?';
        };
        
        return (
          <Animated.View style={[styles.wizardContent, { transform: [{ translateX: slideTransform }], opacity }]}>
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeIconContainer}>
                <Logo size={56} color={Colors.primary} />
              </View>
              <Text style={styles.welcomeTitle}>
                {getWelcomeTitle()}
              </Text>
              <Text style={styles.welcomeDescription}>
                Answer a few quick questions and we'll find the perfect {mode === 'couples' ? 'date' : 'activity'} for you.
              </Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartWizard}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startButtonGradient}
                >
                  <Text style={styles.startButtonText}>Let's Go</Text>
                  <Logo size={22} color={Colors.backgroundDark} />
                </LinearGradient>
              </TouchableOpacity>

              {/* Advanced Filters Button */}
              {isPremium ? (
                <TouchableOpacity
                  style={styles.advancedFiltersButton}
                  onPress={() => setShowAdvancedFilters(true)}
                  activeOpacity={0.7}
                >
                  <Sliders size={18} color={Colors.primary} />
                  <Text style={styles.advancedFiltersButtonText}>
                    Advanced Filters
                    {hasAdvancedFilters && ' •'}
                  </Text>
                  {hasAdvancedFilters && (
                    <View style={styles.filterCountBadge}>
                      <Text style={styles.filterCountText}>
                        {(advancedFilters.cuisinePreferences?.length || 0) + 
                         (advancedFilters.accessibility?.length || 0) +
                         (advancedFilters.preferredTimeOfDay && advancedFilters.preferredTimeOfDay !== 'any' ? 1 : 0) +
                         (advancedFilters.groupSize ? 1 : 0)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.advancedFiltersButtonLocked}
                  onPress={() => {
                    alert(
                      'Premium Feature',
                      'Advanced filters including cuisine preferences, accessibility options, and more are available with Premium.\n\nUpgrade to customize your activity suggestions!',
                      [
                        { text: 'Not Now', style: 'cancel' },
                        { text: 'Upgrade', onPress: () => router.push('/paywall' as any) }
                      ],
                      'info'
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Crown size={16} color={Colors.primary} />
                  <Text style={styles.advancedFiltersButtonLockedText}>Advanced Filters</Text>
                  <View style={styles.proBadgeSmall}>
                    <Text style={styles.proBadgeSmallText}>PRO</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        );

      case 'category':
        return (
          <Animated.View style={[styles.wizardContent, { transform: [{ translateX: slideTransform }], opacity }]}>
            <View style={styles.questionContainer}>
              <Text style={styles.questionNumber}>1 of 4</Text>
              <Text style={styles.questionTitle}>What's the vibe?</Text>
              <Text style={styles.questionSubtitle}>Pick what matches your mood</Text>
              
              <View style={styles.optionsGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.label}
                    style={[
                      styles.optionCard,
                      wizardAnswers.category === cat.label && styles.optionCardSelected,
                    ]}
                    onPress={() => handleWizardAnswer('category', cat.label)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionIconContainer}>
                      {getCategoryIcon(cat.icon, 24, wizardAnswers.category === cat.label ? Colors.primary : Colors.textLight)}
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionLabel, wizardAnswers.category === cat.label && styles.optionLabelSelected]}>{cat.label}</Text>
                      <Text style={styles.optionDescription}>{cat.description}</Text>
                    </View>
                    {isCategoryPremium(cat.label) && !isPremium && (
                      <View style={styles.premiumTag}>
                        <Text style={styles.premiumTagText}>PRO</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        );

      case 'budget':
        return (
          <Animated.View style={[styles.wizardContent, { transform: [{ translateX: slideTransform }], opacity }]}>
            <View style={styles.questionContainer}>
              <Text style={styles.questionNumber}>2 of 4</Text>
              <Text style={styles.questionTitle}>What's your budget?</Text>
              <Text style={styles.questionSubtitle}>Every budget makes memories</Text>
              
              <View style={styles.budgetGrid}>
                {budgetOptions.map((budget) => (
                  <TouchableOpacity
                    key={budget.label}
                    style={[
                      styles.budgetCard,
                      wizardAnswers.budget === budget.label && styles.budgetCardSelected,
                    ]}
                    onPress={() => handleWizardAnswer('budget', budget.label)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.budgetLabel, wizardAnswers.budget === budget.label && styles.budgetLabelSelected]}>{budget.label}</Text>
                    <Text style={styles.budgetDescription}>{budget.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        );

      case 'timing':
        return (
          <Animated.View style={[styles.wizardContent, { transform: [{ translateX: slideTransform }], opacity }]}>
            <View style={styles.questionContainer}>
              <Text style={styles.questionNumber}>3 of 4</Text>
              <Text style={styles.questionTitle}>How much time?</Text>
              <Text style={styles.questionSubtitle}>Quality over quantity</Text>
              
              <View style={styles.optionsGrid}>
                {timingOptions.map((timing) => (
                  <TouchableOpacity
                    key={timing.label}
                    style={[
                      styles.optionCard,
                      wizardAnswers.timing === timing.label && styles.optionCardSelected,
                    ]}
                    onPress={() => handleWizardAnswer('timing', timing.label)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionIconContainer}>
                      <Clock size={24} color={wizardAnswers.timing === timing.label ? Colors.primary : Colors.textLight} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionLabel, wizardAnswers.timing === timing.label && styles.optionLabelSelected]}>{timing.label}</Text>
                      <Text style={styles.optionDescription}>{timing.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        );

      case 'setting':
        return (
          <Animated.View style={[styles.wizardContent, { transform: [{ translateX: slideTransform }], opacity }]}>
            <View style={styles.questionContainer}>
              <Text style={styles.questionNumber}>4 of 4</Text>
              <Text style={styles.questionTitle}>Indoor or outdoor?</Text>
              {location?.weather && (
                <View style={styles.weatherHint}>
                  {getWeatherIcon(location.weather.condition)}
                  <Text style={styles.weatherHintText}>
                    {location.weather.temp}°F and {location.weather.condition.toLowerCase()}
                  </Text>
                </View>
              )}
              
              <View style={styles.settingGrid}>
                {settingOptions.map((setting) => (
                  <TouchableOpacity
                    key={setting.value}
                    style={[
                      styles.settingCard,
                      wizardAnswers.setting === setting.value && styles.settingCardSelected,
                    ]}
                    onPress={() => handleWizardAnswer('setting', setting.value)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.settingIconContainer, wizardAnswers.setting === setting.value && styles.settingIconContainerSelected]}>
                      {React.cloneElement(setting.icon, { color: wizardAnswers.setting === setting.value ? Colors.primary : Colors.textLight })}
                    </View>
                    <Text style={[styles.settingLabel, wizardAnswers.setting === setting.value && styles.settingLabelSelected]}>{setting.label}</Text>
                    <Text style={styles.settingDescription}>{setting.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        );

      case 'summary':
        return (
          <Animated.View style={[styles.wizardContent, { transform: [{ translateX: slideTransform }], opacity }]}>
            <View style={styles.summaryContainer}>
              <View style={styles.cardContainer}>
                <ScratchCard
                  disabled={isGenerating}
                  resetKey={scratchCardKeyRef.current}
                  isActivityReady={!!currentActivity && !isGenerating}
                  onScratchStart={handleScratchStart}
                  onScratchComplete={handleScratchComplete}
                  onTouchStart={() => setScrollEnabled(false)}
                  onTouchEnd={() => setScrollEnabled(true)}
                  revealContent={
                    <View style={styles.revealContent}>
                      {isGenerating || !currentActivity ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color={Colors.primary} />
                          <Text style={styles.loadingText}>Creating your perfect {mode === 'couples' ? 'date' : 'activity'}...</Text>
                        </View>
                      ) : (
                        <ScrollView 
                          style={styles.revealScroll}
                          contentContainerStyle={styles.revealScrollContent}
                          showsVerticalScrollIndicator={true}
                          nestedScrollEnabled
                        >
                          {/* Activity Title */}
                          <Text style={styles.revealTitle}>{currentActivity.title}</Text>
                          
                          {/* Category Badge */}
                          <View style={styles.categoryBadge}>
                            {getCategoryIcon(currentActivity.category, 14, Colors.primary)}
                            <Text style={styles.categoryBadgeText}>{currentActivity.category}</Text>
                          </View>
                          
                          {/* Description - limited to 2 lines initially */}
                          <Text 
                            style={styles.revealDescription} 
                            numberOfLines={isDescriptionExpanded ? undefined : 2}
                          >
                            {currentActivity.description}
                          </Text>
                          {currentActivity.description && currentActivity.description.length > 80 && (
                            <TouchableOpacity
                              onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.expandButton}>
                                {isDescriptionExpanded ? 'Show less' : 'Read more'}
                              </Text>
                            </TouchableOpacity>
                          )}
                          
                          {/* Quick Stats */}
                          <View style={styles.quickStats}>
                            <View style={styles.statChip}>
                              <Clock size={14} color={Colors.textLight} />
                              <Text style={styles.statChipText}>{currentActivity.duration}</Text>
                            </View>
                            <View style={styles.statChip}>
                              <DollarSign size={14} color={Colors.textLight} />
                              <Text style={styles.statChipText}>{currentActivity.cost === 'free' ? 'Free' : currentActivity.cost}</Text>
                            </View>
                          </View>
                          
                          {/* PRIMARY ACTION - Start Activity Button (prominent placement) */}
                          {(() => {
                            // Check if this activity has been completed
                            const completedActivities = getCompletedActivities();
                            const isCompleted = completedActivities.some(
                              a => a.title === currentActivity.title && 
                                   a.description === currentActivity.description
                            );
                            
                            if (isCompleted) {
                              return (
                                <View style={[styles.primaryAction, styles.completedAction]}>
                                  <View style={styles.primaryActionGradient}>
                                    <CheckCircle size={20} color={Colors.success} />
                                    <Text style={[styles.primaryActionText, { color: Colors.success }]}>
                                      {mode === 'couples' ? 'Date Completed' : 'Activity Completed'}
                                    </Text>
                                  </View>
                                </View>
                              );
                            }
                            
                            return (
                              <TouchableOpacity
                                style={styles.primaryAction}
                                onPress={handleStartActivity}
                                activeOpacity={0.8}
                              >
                                <LinearGradient
                                  colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={styles.primaryActionGradient}
                                >
                                  <Play size={20} color={Colors.backgroundDark} fill={Colors.backgroundDark} />
                                  <Text style={styles.primaryActionText}>
                                    {mode === 'couples' ? 'Start This Date' : 'Start Activity'}
                                  </Text>
                                </LinearGradient>
                              </TouchableOpacity>
                            );
                          })()}
                          
                          {/* Pro Tip - Now below the primary action */}
                          {currentActivity.proTip && (
                            <View style={styles.proTipContainer}>
                              <View style={styles.proTipHeader}>
                                <Crown size={16} color={Colors.primary} />
                                <Text style={styles.proTipLabel}>Pro Tip</Text>
                              </View>
                              <Text style={styles.proTipText}>{currentActivity.proTip}</Text>
                            </View>
                          )}
                          
                          {/* Secondary Actions */}
                          <View style={styles.secondaryActions}>
                            <TouchableOpacity
                              style={styles.secondaryAction}
                              onPress={handleRegenerateActivity}
                              disabled={isGenerating}
                              activeOpacity={0.7}
                            >
                              <RefreshCw size={18} color={Colors.primary} />
                              <Text style={styles.secondaryActionText}>New Idea</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              style={styles.secondaryAction}
                              onPress={handleSaveForLater}
                              disabled={isActivitySavedInMemoryBook}
                              activeOpacity={0.7}
                            >
                              <Bookmark size={18} color={isActivitySavedInMemoryBook ? Colors.primary : Colors.textLight} fill={isActivitySavedInMemoryBook ? Colors.primary : 'none'} />
                              <Text style={[styles.secondaryActionText, isActivitySavedInMemoryBook && { color: Colors.primary }]}>
                                {isActivitySavedInMemoryBook ? 'Saved' : 'Save'}
                              </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              style={styles.secondaryAction}
                              onPress={handleShareActivity}
                              disabled={isSharing}
                              activeOpacity={0.7}
                            >
                              <Share2 size={18} color={Colors.textLight} />
                              <Text style={styles.secondaryActionText}>Share</Text>
                            </TouchableOpacity>
                          </View>
                          
                          {/* Skip Action */}
                          <TouchableOpacity
                            style={styles.skipAction}
                            onPress={handleNotInterested}
                            activeOpacity={0.7}
                          >
                            <ThumbsDown size={14} color={Colors.textMuted} />
                            <Text style={styles.skipActionText}>Not for me</Text>
                          </TouchableOpacity>
                        </ScrollView>
                      )}
                    </View>
                  }
                />
              </View>

              {/* Current Preferences */}
              <View style={styles.preferencesInfo}>
                <View style={styles.preferencesChips}>
                  <View style={styles.preferenceChip}>
                    <Text style={styles.preferenceChipText}>{wizardAnswers.category}</Text>
                  </View>
                  <View style={styles.preferenceChip}>
                    <Text style={styles.preferenceChipText}>{wizardAnswers.budget}</Text>
                  </View>
                  <View style={styles.preferenceChip}>
                    <Text style={styles.preferenceChipText}>{wizardAnswers.timing}</Text>
                  </View>
                  <View style={styles.preferenceChip}>
                    <Text style={styles.preferenceChipText}>
                      {wizardAnswers.setting === 'indoor' ? 'Indoor' : wizardAnswers.setting === 'outdoor' ? 'Outdoor' : 'Either'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.changePreferencesButton}
                  onPress={handleRestartWizard}
                  activeOpacity={0.7}
                >
                  <Text style={styles.changePreferencesText}>Change preferences</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  // Mode Selection Screen
  if (!mode) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.modeSelectionContainer}>
          <View style={styles.modeHeader}>
            <Logo size={56} color={Colors.primary} />
            <Text style={styles.modeTitle}>Scratch & Go</Text>
            <Text style={styles.modeSubtitle}>Discover your next adventure</Text>
          </View>

          <View style={styles.modeCardsContainer}>
            <TouchableOpacity 
              style={styles.modeCard}
              onPress={() => handleModeSelection('couples')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['rgba(255, 107, 138, 0.15)', 'rgba(255, 107, 138, 0.05)']}
                style={styles.modeCardGradient}
              >
                <View style={styles.modeIconContainer}>
                  <Heart size={32} color={Colors.primary} />
                </View>
                <Text style={styles.modeCardTitle}>Couples</Text>
                <Text style={styles.modeCardDescription}>Date nights and romantic moments</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modeCard}
              onPress={() => handleModeSelection('family')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['rgba(255, 107, 138, 0.15)', 'rgba(255, 107, 138, 0.05)']}
                style={styles.modeCardGradient}
              >
                <View style={styles.modeIconContainer}>
                  <Users size={32} color={Colors.primary} />
                </View>
                <Text style={styles.modeCardTitle}>Family</Text>
                <Text style={styles.modeCardDescription}>Fun activities for everyone</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.switchNote}>You can change this anytime in Settings</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Preferences Setup Modal - shown before first activity */}
      <PreferencesSetupModal
        visible={showPreferencesSetup}
        onComplete={handlePreferencesSetupComplete}
        onSkip={handlePreferencesSetupComplete}
      />

      {/* Advanced Filters Modal (Premium Only) */}
      <Modal
        visible={showAdvancedFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdvancedFilters(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowAdvancedFilters(false)}
        >
          <Pressable style={styles.advancedFiltersModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.advancedFiltersHeader}>
              <View style={styles.advancedFiltersTitleRow}>
                <Crown size={20} color={Colors.primary} />
                <Text style={styles.advancedFiltersTitle}>Advanced Filters</Text>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>PRO</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.advancedFiltersClose}
                onPress={() => setShowAdvancedFilters(false)}
                activeOpacity={0.7}
              >
                <X size={20} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.advancedFiltersContent} showsVerticalScrollIndicator={false}>
              {/* Cuisine Preferences */}
              {(wizardAnswers.category === 'Foodie' || !wizardAnswers.category) && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Cuisine Preferences</Text>
                  <Text style={styles.filterSectionSubtitle}>Select your preferred cuisines</Text>
                  <View style={styles.filterChipsGrid}>
                    {CUISINE_OPTIONS.map((cuisine) => (
                      <TouchableOpacity
                        key={cuisine.value}
                        style={[
                          styles.filterChip,
                          advancedFilters.cuisinePreferences?.includes(cuisine.value) && styles.filterChipSelected
                        ]}
                        onPress={() => toggleCuisine(cuisine.value)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.filterChipText,
                          advancedFilters.cuisinePreferences?.includes(cuisine.value) && styles.filterChipTextSelected
                        ]}>
                          {cuisine.label}
                        </Text>
                        {advancedFilters.cuisinePreferences?.includes(cuisine.value) && (
                          <Check size={14} color={Colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Accessibility Options */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Accessibility Needs</Text>
                <Text style={styles.filterSectionSubtitle}>Venues must meet these requirements</Text>
                <View style={styles.filterChipsGrid}>
                  {ACCESSIBILITY_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterChip,
                        advancedFilters.accessibility?.includes(option.value) && styles.filterChipSelected
                      ]}
                      onPress={() => toggleAccessibility(option.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.filterChipIcon}>{option.icon}</Text>
                      <Text style={[
                        styles.filterChipText,
                        advancedFilters.accessibility?.includes(option.value) && styles.filterChipTextSelected
                      ]}>
                        {option.label}
                      </Text>
                      {advancedFilters.accessibility?.includes(option.value) && (
                        <Check size={14} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Time of Day */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Preferred Time</Text>
                <Text style={styles.filterSectionSubtitle}>Best time for this activity</Text>
                <View style={styles.timeOptionsGrid}>
                  {TIME_OF_DAY_OPTIONS.map((time) => (
                    <TouchableOpacity
                      key={time.value}
                      style={[
                        styles.timeOption,
                        advancedFilters.preferredTimeOfDay === time.value && styles.timeOptionSelected
                      ]}
                      onPress={() => setTimeOfDay(time.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.timeOptionLabel,
                        advancedFilters.preferredTimeOfDay === time.value && styles.timeOptionLabelSelected
                      ]}>
                        {time.label}
                      </Text>
                      <Text style={styles.timeOptionHours}>{time.hours}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Group Size */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Group Size</Text>
                <Text style={styles.filterSectionSubtitle}>How many people?</Text>
                <View style={styles.groupSizeGrid}>
                  {GROUP_SIZE_OPTIONS.map((group) => (
                    <TouchableOpacity
                      key={group.value}
                      style={[
                        styles.groupSizeOption,
                        advancedFilters.groupSize === group.value && styles.groupSizeOptionSelected
                      ]}
                      onPress={() => setGroupSize(group.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.groupSizeLabel,
                        advancedFilters.groupSize === group.value && styles.groupSizeLabelSelected
                      ]}>
                        {group.label}
                      </Text>
                      <Text style={styles.groupSizeDescription}>{group.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.advancedFiltersFooter}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearAdvancedFilters}
                activeOpacity={0.7}
              >
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyFiltersButton}
                onPress={() => setShowAdvancedFilters(false)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.applyFiltersGradient}
                >
                  <Text style={styles.applyFiltersText}>Apply Filters</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowProfileModal(false)}
        >
          <Pressable style={styles.profileModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.profileModalHeader}>
              <Text style={styles.profileModalTitle}>Profile</Text>
              <TouchableOpacity
                style={styles.profileModalClose}
                onPress={() => setShowProfileModal(false)}
                activeOpacity={0.7}
              >
                <X size={20} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
            
            {isAuthenticated && user ? (
              <>
                <View style={styles.profileInfo}>
                  {user.photoUrl ? (
                    <Image 
                      source={{ uri: user.photoUrl }} 
                      style={styles.profileModalAvatar}
                    />
                  ) : (
                    <View style={styles.profileModalAvatarPlaceholder}>
                      <User size={32} color={Colors.textLight} />
                    </View>
                  )}
                  <Text style={styles.profileName}>{user.name}</Text>
                  <Text style={styles.profileEmail}>{user.email}</Text>
                  {user.provider !== 'none' && (
                    <View style={styles.providerBadge}>
                      <Text style={styles.providerBadgeText}>
                        Signed in with {user.provider === 'google' ? 'Google' : 'Facebook'}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.profileActions}>
                  <TouchableOpacity
                    style={styles.profileActionButton}
                    onPress={handleGoToSettings}
                    activeOpacity={0.7}
                  >
                    <Settings size={20} color={Colors.text} />
                    <Text style={styles.profileActionText}>Settings</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.profileActionButton, styles.logoutActionButton]}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                  >
                    <LogOut size={20} color={Colors.error} />
                    <Text style={styles.logoutActionText}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.profileInfo}>
                <View style={styles.profileModalAvatarPlaceholder}>
                  <User size={32} color={Colors.textLight} />
                </View>
                <Text style={styles.profileName}>Guest</Text>
                <Text style={styles.profileEmail}>Not signed in</Text>
                <TouchableOpacity
                  style={styles.signInButton}
                  onPress={() => {
                    setShowProfileModal(false);
                    router.push('/welcome' as any);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.signInButtonText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Logo size={28} color={Colors.primary} />
          <View>
            <Text style={styles.appName}>Scratch & Go</Text>
            <Text style={styles.modeLabel}>
              {displayName || (mode === 'couples' ? 'Couples' : 'Family')}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <LocationSelector />
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setShowProfileModal(true)}
            activeOpacity={0.7}
          >
            {isAuthenticated && user?.photoUrl ? (
              <Image 
                source={{ uri: user.photoUrl }} 
                style={styles.profileAvatar}
              />
            ) : (
              <View style={styles.profileAvatarPlaceholder}>
                <User size={18} color={Colors.textLight} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        scrollEventThrottle={16}
        nestedScrollEnabled={false}
      >
        {/* Progress Bar */}
        {wizardStep !== 'welcome' && wizardStep !== 'summary' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View 
                style={[styles.progressBarFill, { width: `${wizardProgress}%` }]}
              />
            </View>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleWizardBack}
              activeOpacity={0.7}
            >
              <ChevronLeft size={20} color={Colors.textLight} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {renderWizardContent()}

        {/* Scratch Counter & Cooldown */}
        {wizardStep === 'summary' && (
          <View style={styles.scratchCountContainer}>
            {cooldownDisplay && !isPremium ? (
              <View style={styles.cooldownContainer}>
                <Timer size={14} color={Colors.primary} />
                <Text style={styles.cooldownText}>
                  Next scratch in {cooldownDisplay}
                </Text>
                <TouchableOpacity 
                  onPress={() => router.push('/paywall' as any)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.upgradeLink}>Upgrade for no cooldown</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.scratchCountText}>
                {isPremium ? 'Unlimited scratches • No cooldown' : `${remainingScratches} scratches left this month`}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  appName: {
    fontSize: Typography.sizes.body,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modeLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    marginTop: 2,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  profileAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  
  // Profile Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  profileModal: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  profileModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  profileModalTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  profileModalClose: {
    padding: Spacing.xs,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  profileModalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.md,
  },
  profileModalAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  profileName: {
    fontSize: Typography.sizes.h3,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  profileEmail: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    marginBottom: Spacing.sm,
  },
  providerBadge: {
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  providerBadgeText: {
    fontSize: Typography.sizes.small,
    color: Colors.textMuted,
  },
  profileActions: {
    gap: Spacing.sm,
  },
  profileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.medium,
  },
  profileActionText: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  logoutActionButton: {
    backgroundColor: Colors.errorMuted,
  },
  logoutActionText: {
    fontSize: Typography.sizes.body,
    color: Colors.error,
    fontWeight: '500' as const,
  },
  signInButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
  },
  signInButtonText: {
    fontSize: Typography.sizes.body,
    color: Colors.backgroundDark,
    fontWeight: '600' as const,
  },
  
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  
  // Progress
  progressContainer: {
    paddingTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: Colors.cardBackground,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
  },
  backButtonText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
  },
  
  // Wizard
  wizardContent: {
    flex: 1,
  },
  
  // Welcome
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  welcomeIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  welcomeTitle: {
    fontSize: Typography.sizes.h1,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  welcomeDescription: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  startButton: {
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
  },
  startButtonText: {
    fontSize: Typography.sizes.h3,
    fontWeight: '600' as const,
    color: Colors.backgroundDark,
  },
  
  // Questions
  questionContainer: {
    paddingTop: Spacing.lg,
  },
  questionNumber: {
    fontSize: Typography.sizes.small,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  questionTitle: {
    fontSize: Typography.sizes.h1,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  questionSubtitle: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    marginBottom: Spacing.xl,
  },
  
  // Options Grid
  optionsGrid: {
    gap: Spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: Typography.sizes.body,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: Colors.primary,
  },
  optionDescription: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },
  premiumTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  premiumTagText: {
    fontSize: Typography.sizes.tiny,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  
  // Budget Grid
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  budgetCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  budgetCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  budgetLabel: {
    fontSize: Typography.sizes.h2,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  budgetLabelSelected: {
    color: Colors.primary,
  },
  budgetDescription: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    textAlign: 'center',
  },
  
  // Setting Grid
  settingGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  settingCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  settingCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  settingIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  settingIconContainerSelected: {
    backgroundColor: Colors.primaryMuted,
  },
  settingLabel: {
    fontSize: Typography.sizes.body,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  settingLabelSelected: {
    color: Colors.primary,
  },
  settingDescription: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    textAlign: 'center',
  },
  weatherHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  weatherHintText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
  },
  
  // Summary
  summaryContainer: {
    paddingTop: Spacing.md,
    alignItems: 'center',
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  
  // Reveal Content
  revealContent: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  revealScroll: {
    flex: 1,
  },
  revealScrollContent: {
    padding: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  revealTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    lineHeight: 26,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  categoryBadgeText: {
    fontSize: Typography.sizes.small,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  revealDescription: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  expandButton: {
    fontSize: Typography.sizes.small,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statChipText: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },
  proTipContainer: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  proTipLabel: {
    fontSize: Typography.sizes.small,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  proTipText: {
    fontSize: Typography.sizes.caption,
    color: Colors.text,
    lineHeight: 20,
  },
  
  // Actions
  primaryAction: {
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  completedAction: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  primaryActionText: {
    fontSize: Typography.sizes.body,
    fontWeight: '600' as const,
    color: Colors.backgroundDark,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  secondaryAction: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.sm,
  },
  secondaryActionText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
  },
  skipAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  skipActionText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
  },
  
  // Preferences
  preferencesInfo: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  preferencesChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  preferenceChip: {
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  preferenceChipText: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },
  changePreferencesButton: {
    paddingVertical: Spacing.sm,
  },
  changePreferencesText: {
    fontSize: Typography.sizes.small,
    color: Colors.textMuted,
  },
  
  // Scratch Count
  scratchCountContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  scratchCountText: {
    fontSize: Typography.sizes.small,
    color: Colors.textMuted,
  },
  
  // Mode Selection
  modeSelectionContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  modeHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  modeTitle: {
    fontSize: Typography.sizes.hero,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  modeSubtitle: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
  },
  modeCardsContainer: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  modeCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modeCardGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  modeIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  modeCardTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  modeCardDescription: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
  },
  switchNote: {
    fontSize: Typography.sizes.small,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  
  // Cooldown styles
  cooldownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  cooldownText: {
    fontSize: Typography.sizes.small,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  upgradeLink: {
    fontSize: Typography.sizes.small,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  
  // Advanced Filters Button styles
  advancedFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  advancedFiltersButtonText: {
    fontSize: Typography.sizes.body,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  filterCountBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterCountText: {
    fontSize: Typography.sizes.tiny,
    color: Colors.backgroundDark,
    fontWeight: '600' as const,
  },
  advancedFiltersButtonLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  advancedFiltersButtonLockedText: {
    fontSize: Typography.sizes.body,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  proBadgeSmall: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
  },
  proBadgeSmallText: {
    fontSize: 9,
    color: Colors.white,
    fontWeight: '700' as const,
  },
  
  // Advanced Filters Modal styles
  advancedFiltersModal: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderBottomWidth: 0,
  },
  advancedFiltersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  advancedFiltersTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  advancedFiltersTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  premiumBadgeText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '700' as const,
  },
  advancedFiltersClose: {
    padding: Spacing.xs,
  },
  advancedFiltersContent: {
    padding: Spacing.lg,
    maxHeight: 400,
  },
  filterSection: {
    marginBottom: Spacing.xl,
  },
  filterSectionTitle: {
    fontSize: Typography.sizes.body,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  filterSectionSubtitle: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    marginBottom: Spacing.md,
  },
  filterChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterChipSelected: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  filterChipIcon: {
    fontSize: 14,
  },
  filterChipText: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },
  filterChipTextSelected: {
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  timeOptionsGrid: {
    gap: Spacing.sm,
  },
  timeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  timeOptionSelected: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  timeOptionLabel: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  timeOptionLabelSelected: {
    color: Colors.primary,
  },
  timeOptionHours: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },
  groupSizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  groupSizeOption: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm) / 2 - Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  groupSizeOptionSelected: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  groupSizeLabel: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  groupSizeLabelSelected: {
    color: Colors.primary,
  },
  groupSizeDescription: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },
  advancedFiltersFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  clearFiltersButton: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  clearFiltersText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    fontWeight: '500' as const,
  },
  applyFiltersButton: {
    flex: 2,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
  },
  applyFiltersGradient: {
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyFiltersText: {
    fontSize: Typography.sizes.body,
    color: Colors.backgroundDark,
    fontWeight: '600' as const,
  },
});
