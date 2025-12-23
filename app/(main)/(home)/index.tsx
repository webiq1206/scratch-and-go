import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Menu, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';

import ScratchCard from '@/components/ui/ScratchCard';
import FilterPill from '@/components/ui/FilterPill';
import { useActivity } from '@/contexts/ActivityContext';
import { Filters } from '@/types/activity';

const MODE_KEY = 'scratch_and_go_mode';

type Mode = 'couples' | 'family';

export default function HomeScreen() {
  const [mode, setMode] = useState<Mode>('couples');
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
    remainingScratches 
  } = useActivity();

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

  const handleScratchStart = async () => {
    if (hasStartedScratch) return;
    
    if (isLimitReached) {
      Alert.alert(
        'Scratch Limit Reached',
        `You've used your 3 free scratches this month! Upgrade to premium for unlimited scratches.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    setHasStartedScratch(true);
    
    const filters: Filters = {
      mode,
      category: categoryFilter,
      budget: budgetFilter,
      timing: timingFilter,
    };
    
    await generateActivity(filters);
  };

  const handleScratchComplete = () => {
    console.log('Scratch complete - activity revealed');
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Menu size={24} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.modeIndicator}>
          <Text style={styles.modeEmoji}>{mode === 'couples' ? '💑' : '👨‍👩‍👧‍👦'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headline}>Ready for an adventure?</Text>

        <View style={styles.cardContainer}>
          <ScratchCard
            onScratchStart={handleScratchStart}
            onScratchComplete={handleScratchComplete}
            scratchLayer={
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF8C00', '#FFD700']}
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
                  <Sparkles size={48} color={Colors.backgroundDark} strokeWidth={2} />
                  <Text style={styles.scratchText}>Scratch Me</Text>
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
                  </>
                )}
              </View>
            }
          />
        </View>

        <View style={styles.scratchCountContainer}>
          <Text style={styles.scratchCountText}>
            {remainingScratches} scratches remaining this month
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
                  onPress={() => setCategoryFilter(cat)}
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
    paddingVertical: Spacing.md,
  },
  menuButton: {
    padding: Spacing.sm,
  },
  modeIndicator: {
    padding: Spacing.sm,
  },
  modeEmoji: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headline: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
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
    fontWeight: Typography.weights.bold,
    color: Colors.backgroundDark,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  revealContent: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  revealEmoji: {
    fontSize: 72,
  },
  revealTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  revealDescription: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
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
    fontWeight: Typography.weights.semibold,
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
    fontWeight: Typography.weights.semibold,
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  proTipText: {
    fontSize: Typography.sizes.caption,
    color: Colors.text,
    lineHeight: 18,
  },
  scratchCountContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  scratchCountText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    fontWeight: Typography.weights.medium,
  },
  filtersSection: {
    gap: Spacing.lg,
  },
  filterRow: {
    gap: Spacing.sm,
  },
  filterLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semibold,
    color: Colors.textLight,
    marginLeft: Spacing.xs,
  },
  filterScroll: {
    paddingRight: Spacing.lg,
  },
});
