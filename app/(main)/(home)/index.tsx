import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, ActivityIndicator, Alert, TouchableOpacity, Image, Dimensions, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';

import ScratchCard from '@/components/ui/ScratchCard';
import LocationSelector from '@/components/ui/LocationSelector';
import { useActivity } from '@/contexts/ActivityContext';
import { useLocation } from '@/contexts/LocationContext';
import { useMemoryBook } from '@/contexts/MemoryBookContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

import { Filters } from '@/types/activity';
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

export default function HomeScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [wizardStep, setWizardStep] = useState<WizardStep>('welcome');
  const [wizardAnswers, setWizardAnswers] = useState<WizardAnswers>({});
  const [hasStartedScratch, setHasStartedScratch] = useState(false);
  const shimmerAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(0))[0];
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  
  const { 
    currentActivity, 
    generateActivity, 
    regenerateActivity,
    saveForLaterActivity,
    isActivitySavedForLater,
    isGenerating, 
    isLimitReached, 
    remainingScratches,
    markAsNotInterested,
    clearCurrentActivity
  } = useActivity();

  const { location } = useLocation();
  const { saveActivity, isActivitySaved } = useMemoryBook();
  const { isPremium } = useSubscription();
  const [isSaved, setIsSaved] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSavedForLater, setIsSavedForLater] = useState(false);

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
  }, [wizardStep, slideAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

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
    return mode === 'couples' 
      ? ['Adventure'] 
      : ['Outdoor'];
  }, [mode]);

  const isCategoryPremium = useCallback((category: string) => {
    return getPremiumCategories().includes(category);
  }, [getPremiumCategories]);

  const handleWizardAnswer = useCallback((key: keyof WizardAnswers, value: string | 'indoor' | 'outdoor' | 'either') => {
    if (key === 'category' && isCategoryPremium(value as string) && !isPremium) {
      Alert.alert(
        'Premium Category',
        `'${value}' is a premium category. Upgrade to unlock exclusive activity categories!`,
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/paywall' as any) }
        ]
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
      if (isLimitReached) {
        Alert.alert(
          'Scratch Limit Reached',
          `You've used your 3 free scratches this month! Upgrade to premium for unlimited scratches.`,
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Upgrade', onPress: () => router.push('/paywall' as any) }
          ]
        );
        return;
      }

      InteractionManager.runAfterInteractions(() => {
        const filters: Filters = {
          mode,
          category: updatedAnswers.category || 'Any',
          budget: updatedAnswers.budget || 'Any',
          timing: updatedAnswers.timing || 'Anytime',
          setting: updatedAnswers.setting,
          location: location || undefined,
        };
        
        generateActivity(filters);
      });
    }
  }, [isCategoryPremium, isPremium, router, slideAnim, wizardStep, wizardAnswers, mode, isLimitReached, location, generateActivity]);

  const handleWizardBack = useCallback(() => {
    const stepOrder: WizardStep[] = ['welcome', 'category', 'budget', 'timing', 'setting', 'summary'];
    const currentIndex = stepOrder.indexOf(wizardStep);
    if (currentIndex > 0) {
      slideAnim.setValue(-SCREEN_WIDTH);
      setWizardStep(stepOrder[currentIndex - 1]);
    }
  }, [slideAnim, wizardStep]);

  const handleStartWizard = useCallback(() => {
    setWizardAnswers({});
    setWizardStep('category');
    slideAnim.setValue(SCREEN_WIDTH);
  }, [slideAnim]);

  const handleRestartWizard = useCallback(() => {
    setWizardAnswers({});
    setWizardStep('welcome');
    setHasStartedScratch(false);
    clearCurrentActivity();
  }, [clearCurrentActivity]);

  const wizardProgress = useMemo(() => {
    const steps = ['category', 'budget', 'timing', 'setting'];
    const currentIndex = steps.indexOf(wizardStep);
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / steps.length) * 100;
  }, [wizardStep]);

  const handleScratchStart = async () => {
    if (hasStartedScratch) return;
    
    setHasStartedScratch(true);
    setIsSaved(false);
    setIsSavedForLater(false);
    setScrollEnabled(false);
  };

  const handleSaveActivity = useCallback(() => {
    if (!currentActivity || isSaved) return;
    
    setIsSaved(true);
    
    InteractionManager.runAfterInteractions(() => {
      saveActivity(currentActivity);
      
      Alert.alert(
        'Saved!',
        'Activity saved to your Memory Book! Remember to capture photos during this special moment with your loved ones to preserve the memory forever.',
        [
          { text: 'Got it!', style: 'default' }
        ]
      );
    });
  }, [currentActivity, isSaved, saveActivity]);

  const handleShareActivity = useCallback(async () => {
    if (!currentActivity || isSharing) return;
    
    setIsSharing(true);
    try {
      await shareActivity(currentActivity);
    } catch (error) {
      console.error('Error sharing activity:', error);
      Alert.alert(
        'Share Failed',
        'Unable to share activity. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSharing(false);
    }
  }, [currentActivity, isSharing]);

  const handleSaveForLater = async () => {
    if (!currentActivity || isSavedForLater) return;

    if (isActivitySavedForLater(currentActivity.title)) {
      Alert.alert(
        'Already Saved',
        'This activity is already in your saved for later list.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setIsSavedForLater(true);
    
    InteractionManager.runAfterInteractions(async () => {
      const success = await saveForLaterActivity();
      if (success) {
        Alert.alert(
          'Saved for Later!',
          'This activity has been added to your queue. You can find it anytime in the Queue tab.',
          [{ text: 'Got it!' }]
        );
      } else {
        setIsSavedForLater(false);
      }
    });
  };

  const handleRegenerateActivity = async () => {
    if (isGenerating) return;

    if (isLimitReached) {
      Alert.alert(
        'Scratch Limit Reached',
        `You've used your 3 free scratches this month! Upgrade to premium for unlimited scratches.`,
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/paywall' as any) }
        ]
      );
      return;
    }

    setIsSaved(false);
    setIsSavedForLater(false);
    setHasStartedScratch(false);
    await regenerateActivity();
  };

  const handleScratchComplete = useCallback(() => {
    console.log('Scratch complete - activity revealed');
    setScrollEnabled(true);
  }, []);

  const handleNotInterested = () => {
    if (!currentActivity) return;
    
    Alert.alert(
      'Not Interested',
      'This helps us learn your preferences. We&apos;ll avoid suggesting similar activities in the future.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Not Interested', 
          style: 'destructive',
          onPress: async () => {
            await markAsNotInterested();
            setHasStartedScratch(false);
            setIsSaved(false);
            setScrollEnabled(true);
          }
        }
      ]
    );
  };

  const categories = mode === 'couples' 
    ? [
        { label: 'Chill', description: 'Low-key vibes' },
        { label: 'Active', description: 'Get moving' },
        { label: 'Creative', description: 'Make something' },
        { label: 'Foodie', description: 'Taste & explore' },
        { label: 'Adventure', description: 'Try new things' },
      ]
    : [
        { label: 'Chill', description: 'Relax together' },
        { label: 'Active', description: 'Fun & energetic' },
        { label: 'Creative', description: 'Arts & crafts' },
        { label: 'Educational', description: 'Learn together' },
        { label: 'Outdoor', description: 'Nature fun' },
      ];

  const budgetOptions = [
    { label: 'Free', description: 'No cost at all' },
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
    { label: 'Indoor', value: 'indoor' as const, description: 'Cozy & comfortable' },
    { label: 'Outdoor', value: 'outdoor' as const, description: 'Fresh air & nature' },
    { label: 'Either', value: 'either' as const, description: 'Surprise me!' },
  ];

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

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
        return (
          <Animated.View style={[styles.wizardContent, { transform: [{ translateX: slideTransform }], opacity }]}>
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeIconContainer}>
                <Image 
                  source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/y0y3gb7wc49gdw8yub9ef' }}
                  style={styles.welcomeIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.welcomeTitle}>
                Let&apos;s create a{mode === 'couples' ? ' romantic' : 'n unforgettable'} moment
              </Text>
              <Text style={styles.welcomeDescription}>
                {mode === 'couples' 
                  ? 'Answer a few quick questions and we&apos;ll find the perfect experience to share with your partner'
                  : 'Answer a few questions to discover the perfect family activity everyone will love'
                }
              </Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartWizard}
                activeOpacity={0.8}
              >
                <Text style={styles.startButtonText}>Let&apos;s Go!</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        );

      case 'category':
        return (
          <Animated.View style={[styles.wizardContent, { transform: [{ translateX: slideTransform }], opacity }]}>
            <View style={styles.questionContainer}>
              <Text style={styles.questionNumber}>Question 1 of 4</Text>
              <Text style={styles.questionTitle}>
                What kind of vibe are {mode === 'couples' ? 'you two' : 'you all'} feeling?
              </Text>
              <Text style={styles.questionSubtitle}>Pick what matches your mood today</Text>
              
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
                    <View style={styles.optionContent}>
                      <Text style={styles.optionLabel}>{cat.label}</Text>
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
              <Text style={styles.questionNumber}>Question 2 of 4</Text>
              <Text style={styles.questionTitle}>What&apos;s your budget for this?</Text>
              <Text style={styles.questionSubtitle}>Be honest - every budget makes memories</Text>
              
              <View style={styles.optionsGrid}>
                {budgetOptions.map((budget) => (
                  <TouchableOpacity
                    key={budget.label}
                    style={[
                      styles.optionCard,
                      wizardAnswers.budget === budget.label && styles.optionCardSelected,
                    ]}
                    onPress={() => handleWizardAnswer('budget', budget.label)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <Text style={styles.optionLabel}>{budget.label}</Text>
                      <Text style={styles.optionDescription}>{budget.description}</Text>
                    </View>
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
              <Text style={styles.questionNumber}>Question 3 of 4</Text>
              <Text style={styles.questionTitle}>How much time do you have?</Text>
              <Text style={styles.questionSubtitle}>Quality matters more than quantity</Text>
              
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
                    <View style={styles.optionContent}>
                      <Text style={styles.optionLabel}>{timing.label}</Text>
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
              <Text style={styles.questionNumber}>Question 4 of 4</Text>
              <Text style={styles.questionTitle}>Indoor or outdoor?</Text>
              <Text style={styles.questionSubtitle}>
                {location?.weather ? `Currently ${location.weather.temp}°F and ${location.weather.condition.toLowerCase()}` : 'What sounds better right now?'}
              </Text>
              
              <View style={styles.optionsGrid}>
                {settingOptions.map((setting) => (
                  <TouchableOpacity
                    key={setting.value}
                    style={[
                      styles.optionCard,
                      wizardAnswers.setting === setting.value && styles.optionCardSelected,
                    ]}
                    onPress={() => handleWizardAnswer('setting', setting.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <Text style={styles.optionLabel}>{setting.label}</Text>
                      <Text style={styles.optionDescription}>{setting.description}</Text>
                    </View>
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
                  onScratchStart={handleScratchStart}
                  onScratchComplete={handleScratchComplete}
                  onTouchStart={() => setScrollEnabled(false)}
                  onTouchEnd={() => setScrollEnabled(true)}
                  scratchLayer={
                    <LinearGradient
                      colors={[Colors.primaryGradientStart, Colors.primary, Colors.primaryDark, Colors.primaryGradientEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.scratchLayer}
                    >
                      <Animated.View
                        style={[
                          styles.shimmer,
                          {
                            transform: [{ translateX: shimmerTranslate }],
                          },
                        ]}
                      />
                      <View style={styles.scratchContent}>
                        <Text style={styles.scratchText}>Scratch to Reveal</Text>
                        <Text style={styles.scratchSubtext}>Your adventure awaits</Text>
                      </View>
                    </LinearGradient>
                  }
                  revealContent={
                    <View style={styles.revealContent}>
                      {isGenerating || !currentActivity ? (
                        <>
                          <ActivityIndicator size="large" color={Colors.primary} />
                          <Text style={styles.revealTitle}>Creating your adventure...</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.revealTitle} numberOfLines={3}>{currentActivity.title}</Text>
                          <Text style={styles.revealDescription} numberOfLines={4}>{currentActivity.description}</Text>
                          {location?.weather && (
                            <View style={styles.weatherBox}>
                              <Text style={styles.weatherIcon}>{location.weather.icon}</Text>
                              <View style={styles.weatherInfo}>
                                <Text style={styles.weatherTemp}>{location.weather.temp}°F</Text>
                                <Text style={styles.weatherCondition}>{location.weather.condition}</Text>
                              </View>
                            </View>
                          )}
                          <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                              <Text style={styles.statLabel}>Duration</Text>
                              <Text style={styles.statValue}>{currentActivity.duration}</Text>
                            </View>
                            <View style={styles.statItem}>
                              <Text style={styles.statLabel}>Cost</Text>
                              <Text style={styles.statValue}>{currentActivity.cost === 'free' ? 'Free' : currentActivity.cost}</Text>
                            </View>
                          </View>
                          {currentActivity.proTip && (
                            <View style={styles.proTipBox}>
                              <Text style={styles.proTipLabel}>Pro Tip</Text>
                              <Text style={styles.proTipText}>{currentActivity.proTip}</Text>
                            </View>
                          )}
                          <View style={styles.actionButtons}>
                            <TouchableOpacity
                              style={[
                                styles.saveButton,
                                (isSaved || isActivitySaved(currentActivity.title)) && styles.saveButtonDisabled
                              ]}
                              onPress={handleSaveActivity}
                              disabled={isSaved || isActivitySaved(currentActivity.title)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.saveButtonContent}>
                                <Text style={styles.saveButtonText}>
                                  {(isSaved || isActivitySaved(currentActivity.title)) ? 'Saved to Memory Book' : 'Save to Memory Book'}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          </View>
                          <View style={styles.secondaryActions}>
                            <TouchableOpacity
                              style={styles.regenerateButton}
                              onPress={handleRegenerateActivity}
                              disabled={isGenerating}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.regenerateButtonText}>{isGenerating ? 'Generating...' : '🔄 Generate New Idea'}</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={styles.tertiaryActions}>
                            <TouchableOpacity
                              style={styles.actionLink}
                              onPress={handleShareActivity}
                              disabled={isSharing}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.actionLinkText}>Share</Text>
                            </TouchableOpacity>
                            <View style={styles.actionDivider} />
                            <TouchableOpacity
                              style={styles.actionLink}
                              onPress={handleSaveForLater}
                              disabled={isSavedForLater || isActivitySavedForLater(currentActivity.title)}
                              activeOpacity={0.7}
                            >
                              <Text style={[
                                styles.actionLinkText,
                                (isSavedForLater || isActivitySavedForLater(currentActivity.title)) && styles.actionLinkTextDisabled
                              ]}>
                                {(isSavedForLater || isActivitySavedForLater(currentActivity.title)) ? 'Saved for Later' : 'Save for Later'}
                              </Text>
                            </TouchableOpacity>
                            <View style={styles.actionDivider} />
                            <TouchableOpacity
                              style={styles.actionLink}
                              onPress={handleNotInterested}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.actionLinkText}>Not Interested</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  }
                />
              </View>

              <View style={styles.preferencesInfo}>
                <View style={styles.preferencesRow}>
                  <Text style={styles.preferenceItem}>{wizardAnswers.category}</Text>
                  <Text style={styles.preferenceSeparator}>•</Text>
                  <Text style={styles.preferenceItem}>{wizardAnswers.budget}</Text>
                  <Text style={styles.preferenceSeparator}>•</Text>
                  <Text style={styles.preferenceItem}>{wizardAnswers.timing}</Text>
                  <Text style={styles.preferenceSeparator}>•</Text>
                  <Text style={styles.preferenceItem}>
                    {wizardAnswers.setting === 'indoor' ? 'Indoor' : wizardAnswers.setting === 'outdoor' ? 'Outdoor' : 'Either'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.changeAnswersLink}
                  onPress={handleRestartWizard}
                  activeOpacity={0.7}
                >
                  <Text style={styles.changeAnswersLinkText}>Change preferences</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  if (!mode) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.modeSelectionContainer}>
          <View style={styles.modeHeader}>
            <Text style={styles.modeTitle}>Scratch & Go</Text>
            <Text style={styles.modeSubtitle}>Scratch your next adventure</Text>
          </View>

          <View style={styles.modeCardsContainer}>
            <TouchableOpacity 
              style={styles.modeCard}
              onPress={() => handleModeSelection('couples')}
              activeOpacity={0.9}
            >
              <View style={styles.modeCardImageContainer}>
                <View style={styles.polaroidGrid}>
                  <View style={[styles.polaroidColumn, styles.column1]}>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '-12deg' }], marginTop: 5 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1609902726285-00668009f004?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '8deg' }], marginTop: -5 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                  
                  <View style={[styles.polaroidColumn, styles.column2]}>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '6deg' }], marginTop: 40 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1606502726235-c3b91576e196?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '-7deg' }], marginTop: 8 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1543364195-bfe6e4932397?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                  
                  <View style={[styles.polaroidColumn, styles.column3]}>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '-9deg' }], marginTop: 18 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '5deg' }], marginTop: -3 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                  
                  <View style={[styles.polaroidColumn, styles.column4]}>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '11deg' }], marginTop: 52 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '-6deg' }], marginTop: 10 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1529473814998-077b4fec6770?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                </View>
              </View>
              <Text style={styles.modeCardTitle}>Couples Mode</Text>
              <Text style={styles.modeCardDescription}>Cherish moments together</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modeCard}
              onPress={() => handleModeSelection('family')}
              activeOpacity={0.9}
            >
              <View style={styles.modeCardImageContainer}>
                <View style={styles.polaroidGrid}>
                  <View style={[styles.polaroidColumn, styles.column1]}>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '10deg' }], marginTop: 8 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1611689037241-d8dfe4280835?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '-9deg' }], marginTop: -2 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                  
                  <View style={[styles.polaroidColumn, styles.column2]}>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '-5deg' }], marginTop: 45 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1567653418876-5bb0e566e1c2?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '7deg' }], marginTop: 5 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                  
                  <View style={[styles.polaroidColumn, styles.column3]}>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '4deg' }], marginTop: 22 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1593197497196-e08d95058347?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '-8deg' }], marginTop: -5 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1543035038-f1f6155e2dc2?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                  
                  <View style={[styles.polaroidColumn, styles.column4]}>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '-7deg' }], marginTop: 58 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '9deg' }], marginTop: 8 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1560785477-d43d2b34e0df?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                </View>
              </View>
              <Text style={styles.modeCardTitle}>Family Mode</Text>
              <Text style={styles.modeCardDescription}>Build lasting family memories</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.switchNote}>You can switch anytime</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/y0y3gb7wc49gdw8yub9ef' }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View>
            <View style={styles.appNameRow}>
              <Text style={styles.appName}>Scratch & Go</Text>
              {isPremium && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.modeLabel}>{mode === 'couples' ? 'Couples Mode' : 'Family Mode'}</Text>
          </View>
        </View>
        <LocationSelector />
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
        {wizardStep !== 'summary' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View 
                style={[
                  styles.progressBarFill,
                  { width: `${wizardProgress}%` }
                ]}
              />
            </View>
            {wizardStep !== 'welcome' && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleWizardBack}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {renderWizardContent()}

        {wizardStep === 'summary' && (
          <View style={styles.scratchCountContainer}>
            <Text style={styles.scratchCountText}>
              {isPremium ? 'Unlimited scratches' : `${remainingScratches} scratches remaining this month`}
            </Text>
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
    paddingVertical: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  appName: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.text,
  },
  premiumBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '400' as const,
    color: Colors.backgroundDark,
    letterSpacing: 0.5,
  },
  modeLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  cardContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  scratchLayer: {
    flex: 1,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 100,
  },
  scratchContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  scratchText: {
    fontSize: Typography.sizes.h2,
    fontWeight: '400' as const,
    color: Colors.backgroundDark,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scratchSubtext: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.backgroundDark,
    opacity: 0.8,
  },
  revealContent: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  revealTitle: {
    fontSize: Typography.sizes.body,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    lineHeight: 20,
  },
  revealDescription: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.xs,
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  proTipBox: {
    backgroundColor: Colors.accent + '20',
    padding: Spacing.xs,
    borderRadius: 8,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    width: '100%',
  },
  proTipLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.accent,
    marginBottom: 4,
  },
  proTipText: {
    fontSize: 11,
    color: Colors.text,
    lineHeight: 15,
  },
  weatherBox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  weatherIcon: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  weatherCondition: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  scratchCountContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    backgroundColor: Colors.cardBackground,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
  },
  scratchCountText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    fontWeight: '400' as const,
  },
  modeSelectionContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  modeHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xxl * 2,
  },
  modeTitle: {
    fontSize: 32,
    fontWeight: '400' as const,
    color: '#FFFFFF',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  modeSubtitle: {
    fontSize: Typography.sizes.body,
    color: '#B8B8B8',
  },
  modeCardsContainer: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  modeCard: {
    backgroundColor: '#252525',
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  modeCardImageContainer: {
    marginBottom: Spacing.lg,
    height: 120,
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  polaroidGrid: {
    flexDirection: 'row',
    width: '100%',
    height: 220,
    position: 'relative',
    overflow: 'hidden',
  },
  polaroidColumn: {
    width: 80,
    position: 'absolute',
    gap: 12,
  },
  column1: {
    left: -25,
  },
  column2: {
    left: 70,
  },
  column3: {
    left: 165,
  },
  column4: {
    right: -25,
  },
  polaroidFrame: {
    width: 80,
    height: 100,
    backgroundColor: '#FFFFFF',
    padding: 6,
    paddingBottom: 18,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  polaroidPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  modeCardTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '400' as const,
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  modeCardDescription: {
    fontSize: Typography.sizes.body,
    color: '#B8B8B8',
    textAlign: 'center',
  },
  switchNote: {
    fontSize: Typography.sizes.small,
    color: '#666666',
    textAlign: 'center',
  },
  actionButtons: {
    marginTop: Spacing.xs,
    width: '100%',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 10,
    width: '100%',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },

  secondaryActions: {
    marginTop: Spacing.xs,
    width: '100%',
  },
  regenerateButton: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 10,
    width: '100%',
  },
  regenerateButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
    textAlign: 'center',
  },
  tertiaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    width: '100%',
    paddingHorizontal: Spacing.sm,
    justifyContent: 'center',
  },
  actionLink: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
  },
  actionLinkTextDisabled: {
    color: Colors.textSecondary,
    opacity: 0.5,
  },
  actionDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.cardBorder,
  },
  wizardContent: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  welcomeIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  welcomeIcon: {
    width: 60,
    height: 60,
  },
  welcomeTitle: {
    fontSize: Typography.sizes.h1,
    fontWeight: '400' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 36,
  },
  welcomeDescription: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl * 2,
    borderRadius: BorderRadius.large,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    fontSize: Typography.sizes.h3,
    fontWeight: '400' as const,
    color: Colors.backgroundDark,
  },
  questionContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  questionNumber: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    fontWeight: '400' as const,
  },
  questionTitle: {
    fontSize: Typography.sizes.h1,
    fontWeight: '400' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
    lineHeight: 32,
  },
  questionSubtitle: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  optionsGrid: {
    gap: Spacing.md,
  },
  optionCard: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: Typography.sizes.h3,
    fontWeight: '400' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  optionDescription: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
  },
  premiumTag: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  premiumTagText: {
    fontSize: 10,
    fontWeight: '400' as const,
    color: Colors.backgroundDark,
    letterSpacing: 0.5,
  },
  summaryContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  preferencesInfo: {
    marginTop: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  preferencesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  preferenceItem: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
  },
  preferenceSeparator: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    opacity: 0.5,
  },
  changeAnswersLink: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  changeAnswersLinkText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    marginBottom: Spacing.lg,
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
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
  },
});
