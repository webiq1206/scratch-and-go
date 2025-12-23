import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, ActivityIndicator, Alert, TouchableOpacity, Image } from 'react-native';
import { Share2, ThumbsDown, RefreshCw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';

import ScratchCard from '@/components/ui/ScratchCard';
import FilterPill from '@/components/ui/FilterPill';
import LocationSelector from '@/components/ui/LocationSelector';
import { useActivity } from '@/contexts/ActivityContext';
import { useLocation } from '@/contexts/LocationContext';
import { useMemoryBook } from '@/contexts/MemoryBookContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Filters } from '@/types/activity';
import { shareActivity } from '@/utils/shareActivity';

const MODE_KEY = 'scratch_and_go_mode';

type Mode = 'couples' | 'family';

export default function HomeScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('Any');
  const [budgetFilter, setBudgetFilter] = useState('Any');
  const [timingFilter, setTimingFilter] = useState('Anytime');
  const [hasStartedScratch, setHasStartedScratch] = useState(false);
  const shimmerAnim = useState(new Animated.Value(0))[0];
  
  const { 
    currentActivity, 
    generateActivity, 
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

  useEffect(() => {
    const init = async () => {
      await loadMode();
    };
    init();
  }, []);

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
  };

  const getPremiumCategories = () => {
    return mode === 'couples' 
      ? ['Adventure'] 
      : ['Outdoor'];
  };

  const isCategoryPremium = (category: string) => {
    return getPremiumCategories().includes(category);
  };

  const handleCategorySelect = (category: string) => {
    if (isCategoryPremium(category) && !isPremium) {
      Alert.alert(
        'Premium Category',
        `'${category}' is a premium category. Upgrade to unlock exclusive activity categories!`,
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/paywall') }
        ]
      );
      return;
    }
    setCategoryFilter(category);
  };

  const handleScratchStart = async () => {
    if (hasStartedScratch || !mode) return;
    
    if (isLimitReached) {
      Alert.alert(
        'Scratch Limit Reached',
        `You've used your 3 free scratches this month! Upgrade to premium for unlimited scratches.`,
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/paywall') }
        ]
      );
      return;
    }
    
    setHasStartedScratch(true);
    setIsSaved(false);
    
    const filters: Filters = {
      mode,
      category: categoryFilter,
      budget: budgetFilter,
      timing: timingFilter,
      location: location || undefined,
    };
    
    await generateActivity(filters);
  };

  const handleSaveActivity = () => {
    if (!currentActivity || isSaved) return;
    
    saveActivity(currentActivity);
    setIsSaved(true);
    
    Alert.alert(
      '💝 Saved!',
      'Activity saved to your Memory Book! Remember to capture photos during this special moment with your loved ones to preserve the memory forever.',
      [
        { text: 'Got it!', style: 'default' }
      ]
    );
  };

  const handleShareActivity = async () => {
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
  };

  const handleScratchComplete = () => {
    console.log('Scratch complete - activity revealed');
  };

  const handleNotInterested = () => {
    if (!currentActivity) return;
    
    Alert.alert(
      'Not Interested',
      'This helps us learn your preferences. We\'ll avoid suggesting similar activities in the future.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Not Interested', 
          style: 'destructive',
          onPress: async () => {
            await markAsNotInterested();
            setHasStartedScratch(false);
            setIsSaved(false);
          }
        }
      ]
    );
  };

  const handleTryAgain = async () => {
    if (!mode) return;
    
    clearCurrentActivity();
    setHasStartedScratch(false);
    setIsSaved(false);
  };

  const categories = mode === 'couples' 
    ? ['Any', 'Chill', 'Active', 'Creative', 'Foodie', 'Adventure']
    : ['Any', 'Chill', 'Active', 'Creative', 'Educational', 'Outdoor'];

  const budgetOptions = ['Any', 'Free', '$', '$$', '$$$'];
  const timingOptions = ['Anytime', 'Quick (1-2h)', 'Half Day', 'Full Day'];

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

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
                        source={{ uri: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '8deg' }], marginTop: -5 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                  
                  <View style={[styles.polaroidColumn, styles.column2]}>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '6deg' }], marginTop: 40 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '-7deg' }], marginTop: 8 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                  
                  <View style={[styles.polaroidColumn, styles.column3]}>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '-9deg' }], marginTop: 18 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '5deg' }], marginTop: -3 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1530047625168-4b29bfbbe1fc?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                  
                  <View style={[styles.polaroidColumn, styles.column4]}>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '11deg' }], marginTop: 52 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '-6deg' }], marginTop: 10 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400&q=80' }}
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
                        source={{ uri: 'https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?w=400&q=80' }}
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
                        source={{ uri: 'https://images.unsplash.com/photo-1476234251651-f353703a034d?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '7deg' }], marginTop: 5 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                  
                  <View style={[styles.polaroidColumn, styles.column3]}>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '4deg' }], marginTop: 22 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1581625875194-dfd0f5008028?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '-8deg' }], marginTop: -5 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                  
                  <View style={[styles.polaroidColumn, styles.column4]}>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '-7deg' }], marginTop: 58 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1587362195166-44e3e3f8e5d3?w=400&q=80' }}
                        style={styles.polaroidPhoto}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={[styles.polaroidFrame, { transform: [{ rotate: '9deg' }], marginTop: 8 }]}>
                      <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400&q=80' }}
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
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.headline}>Create moments together</Text>
          <Text style={styles.subheadline}>Discover your next memory with loved ones</Text>
        </View>

        <View style={styles.cardContainer}>
          <ScratchCard
            onScratchStart={handleScratchStart}
            onScratchComplete={handleScratchComplete}
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
                  <Text style={styles.scratchText}>Scratch Me</Text>
                  <Text style={styles.scratchSubtext}>Drag to reveal</Text>
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
                    <Text style={styles.revealEmoji}>{currentActivity.emoji}</Text>
                    <Text style={styles.revealTitle}>{currentActivity.title}</Text>
                    <Text style={styles.revealDescription}>{currentActivity.description}</Text>
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
                        <Text style={styles.proTipLabel}>💡 Pro Tip</Text>
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
                          {(isSaved || isActivitySaved(currentActivity.title)) ? (
                            <Text style={styles.saveButtonText}>✓ Saved to Memory Book</Text>
                          ) : (
                            <>
                              <Image 
                                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/1n8u08ei0gt3gyiihcy40' }}
                                style={styles.heartIcon}
                                resizeMode="contain"
                              />
                              <Text style={styles.saveButtonText}>Save to Memory Book</Text>
                            </>
                          )}
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.shareButton}
                        onPress={handleShareActivity}
                        disabled={isSharing}
                        activeOpacity={0.7}
                      >
                        <Share2 size={20} color={Colors.text} />
                        <Text style={styles.shareButtonText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.secondaryActions}>
                      <TouchableOpacity
                        style={styles.notInterestedButton}
                        onPress={handleNotInterested}
                        activeOpacity={0.7}
                      >
                        <ThumbsDown size={16} color={Colors.textSecondary} />
                        <Text style={styles.notInterestedText}>Not Interested</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.tryAgainButton}
                        onPress={handleTryAgain}
                        activeOpacity={0.7}
                      >
                        <RefreshCw size={16} color={Colors.textSecondary} />
                        <Text style={styles.tryAgainText}>Try Again</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            }
          />
        </View>

        <View style={styles.scratchCountContainer}>
          <Text style={styles.scratchCountText}>
            {isPremium ? '✨ Unlimited scratches' : `${remainingScratches} scratches remaining this month`}
          </Text>
        </View>

        <View style={styles.filtersSection}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Category</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {categories.map((cat) => (
                <FilterPill
                  key={cat}
                  label={cat}
                  selected={categoryFilter === cat}
                  onPress={() => handleCategorySelect(cat)}
                  isPremium={isCategoryPremium(cat)}
                  showPremiumBadge={isPremium}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Budget</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {budgetOptions.map((budget) => (
                <FilterPill
                  key={budget}
                  label={budget}
                  selected={budgetFilter === budget}
                  onPress={() => setBudgetFilter(budget)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Timing</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {timingOptions.map((timing) => (
                <FilterPill
                  key={timing}
                  label={timing}
                  selected={timingFilter === timing}
                  onPress={() => setTimingFilter(timing)}
                />
              ))}
            </ScrollView>
          </View>
        </View>
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
  titleSection: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  headline: {
    fontSize: Typography.sizes.hero,
    fontWeight: '400' as const,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subheadline: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardContainer: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
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
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  revealEmoji: {
    fontSize: 72,
    marginBottom: Spacing.sm,
  },
  revealTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '400' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  revealDescription: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.primary,
  },
  proTipBox: {
    backgroundColor: Colors.accent + '20',
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.sm,
    maxWidth: '90%',
  },
  proTipLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: '400' as const,
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  proTipText: {
    fontSize: Typography.sizes.caption,
    color: Colors.text,
    lineHeight: 18,
  },
  weatherBox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  weatherIcon: {
    fontSize: 28,
    marginRight: Spacing.sm,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: Typography.sizes.h3,
    color: Colors.text,
    fontWeight: '400' as const,
  },
  weatherCondition: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    marginTop: 2,
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
  filtersSection: {
    gap: Spacing.lg,
  },
  filterRow: {
    gap: Spacing.sm,
  },
  filterLabel: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  filterScroll: {
    paddingRight: Spacing.lg,
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
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    width: '100%',
    paddingHorizontal: Spacing.lg,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
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
    gap: Spacing.xs,
  },
  saveButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.text,
  },
  heartIcon: {
    width: 18,
    height: 18,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
  },
  shareButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.text,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    width: '100%',
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  notInterestedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  notInterestedText: {
    fontSize: Typography.sizes.caption,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  tryAgainText: {
    fontSize: Typography.sizes.caption,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
  },
});
