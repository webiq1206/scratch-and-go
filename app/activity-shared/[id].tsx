import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, X, Heart, Clock, DollarSign, Package, Lightbulb, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';
import { useMemoryBook } from '@/contexts/MemoryBookContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import type { Activity } from '@/types/activity';

export default function ActivitySharedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { saveActivity, savedActivities } = useMemoryBook();
  const { preferences } = usePreferences();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isOnboarded = preferences.completedOnboarding;
  const isSaved = activity ? savedActivities.some((a) => a.title === activity.title) : false;

  useEffect(() => {
    if (id) {
      decodeAndLoadActivity(id);
    }
  }, [id]);

  const decodeAndLoadActivity = (encodedId: string) => {
    try {
      const decoded = decodeURIComponent(encodedId);
      const activityData = JSON.parse(atob(decoded));
      setActivity(activityData);
      console.log('Loaded shared activity:', activityData);
    } catch (error) {
      console.error('Error decoding activity:', error);
      Alert.alert('Error', 'Invalid activity link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!activity) return;

    if (!isOnboarded) {
      Alert.alert(
        'Join Scratch & Go',
        'Create an account to save activities and discover more!',
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Get Started',
            onPress: () => router.replace('/welcome' as any),
          },
        ]
      );
      return;
    }

    if (isSaved) {
      Alert.alert('Already Saved', 'This activity is already in your Memory Book!');
      return;
    }

    setIsSaving(true);
    try {
      await saveActivity(activity);
      Alert.alert('Saved!', 'Activity added to your Memory Book');
    } catch (error) {
      console.error('Error saving activity:', error);
      Alert.alert('Error', 'Failed to save activity');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGetStarted = () => {
    if (isOnboarded) {
      router.replace('/(main)/(home)' as any);
    } else {
      router.replace('/welcome' as any);
    }
  };

  const handleClose = () => {
    if (isOnboarded) {
      router.replace('/(main)/(home)' as any);
    } else {
      router.back();
    }
  };

  const getCostDisplay = (cost: string) => {
    if (cost === 'free') return 'Free';
    return cost.toUpperCase();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading activity...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activity) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Activity Not Found</Text>
          <Text style={styles.errorText}>
            This link appears to be invalid or expired.
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <TouchableOpacity
        style={styles.closeIcon}
        onPress={handleClose}
        activeOpacity={0.7}
      >
        <X size={24} color={Colors.text} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Sparkles size={32} color={Colors.white} />
          </LinearGradient>

          <Text style={styles.badgeText}>Shared Activity</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.emoji}>{activity.emoji}</Text>
          <Text style={styles.title}>{activity.title}</Text>
          <Text style={styles.description}>{activity.description}</Text>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <DollarSign size={20} color={Colors.accent} />
              <Text style={styles.metaLabel}>Cost</Text>
              <Text style={styles.metaValue}>{getCostDisplay(activity.cost)}</Text>
            </View>

            <View style={styles.metaItem}>
              <Clock size={20} color={Colors.primary} />
              <Text style={styles.metaLabel}>Duration</Text>
              <Text style={styles.metaValue}>{activity.duration}</Text>
            </View>
          </View>

          {activity.supplies && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Package size={20} color={Colors.text} />
                <Text style={styles.sectionTitle}>What You&apos;ll Need</Text>
              </View>
              <Text style={styles.sectionText}>{activity.supplies}</Text>
            </View>
          )}

          {activity.proTip && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Lightbulb size={20} color={Colors.accent} />
                <Text style={styles.sectionTitle}>Pro Tip</Text>
              </View>
              <Text style={styles.sectionText}>{activity.proTip}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveButton, isSaved && styles.saveButtonDisabled]}
            onPress={handleSave}
            activeOpacity={0.7}
            disabled={isSaving || isSaved}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Heart
                  size={20}
                  color={Colors.white}
                  fill={isSaved ? Colors.white : 'transparent'}
                />
                <Text style={styles.saveButtonText}>
                  {isSaved ? 'Already Saved' : 'Save to Memory Book'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {!isOnboarded && (
            <View style={styles.ctaContainer}>
              <View style={styles.divider} />
              
              <View style={styles.ctaContent}>
                <Text style={styles.ctaTitle}>Love This Activity?</Text>
                <Text style={styles.ctaText}>
                  Join Scratch & Go to discover unlimited personalized date nights and
                  family activities!
                </Text>

                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Sparkles size={16} color={Colors.primary} />
                    <Text style={styles.featureText}>AI-powered activity suggestions</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Heart size={16} color={Colors.primary} />
                    <Text style={styles.featureText}>Save and organize your favorites</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Crown size={16} color={Colors.accent} />
                    <Text style={styles.featureText}>Premium plans available</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={handleGetStarted}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.ctaButtonGradient}
                  >
                    <Text style={styles.ctaButtonText}>Get Started Free</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textLight,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
    marginTop: Spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    color: Colors.text,
    fontSize: Typography.sizes.h2,
    fontWeight: Typography.weights.regular,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.textLight,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  closeIcon: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.regular,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  emoji: {
    fontSize: 72,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.text,
    fontSize: Typography.sizes.h1,
    fontWeight: Typography.weights.regular,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    color: Colors.textLight,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  metaItem: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metaLabel: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.small,
    fontWeight: Typography.weights.regular,
  },
  metaValue: {
    color: Colors.text,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
  },
  section: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: Typography.sizes.h3,
    fontWeight: Typography.weights.regular,
  },
  sectionText: {
    color: Colors.textLight,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
    lineHeight: 22,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
  },
  closeButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.large,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  closeButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
  },
  ctaContainer: {
    marginTop: Spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.xl,
  },
  ctaContent: {
    alignItems: 'center',
  },
  ctaTitle: {
    color: Colors.text,
    fontSize: Typography.sizes.h2,
    fontWeight: Typography.weights.regular,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  ctaText: {
    color: Colors.textLight,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  featuresList: {
    alignSelf: 'stretch',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureText: {
    color: Colors.textLight,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
  },
  ctaButton: {
    alignSelf: 'stretch',
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
  },
  ctaButtonGradient: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
  },
});
