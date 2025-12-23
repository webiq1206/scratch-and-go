import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';
import { UserPreferences, DEFAULT_PREFERENCES, ONBOARDING_QUESTIONS } from '@/types/preferences';
import Button from '@/components/ui/Button';

const MODE_KEY = 'scratch_and_go_mode';
const PREFERENCES_KEY = 'scratch_and_go_preferences';

type OnboardingStep = 'mode' | 'preferences';

export default function WelcomeScreen() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('mode');
  const [selectedMode, setSelectedMode] = useState<'couples' | 'family' | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    const checkExistingMode = async () => {
      const savedMode = await AsyncStorage.getItem(MODE_KEY);
      const savedPreferences = await AsyncStorage.getItem(PREFERENCES_KEY);
      
      if (savedMode && savedPreferences) {
        const prefs = JSON.parse(savedPreferences);
        if (prefs.completedOnboarding) {
          router.replace('/(main)/(home)');
        }
      }
    };
    
    checkExistingMode();
  }, [router]);

  const handleModeSelection = (mode: 'couples' | 'family') => {
    setSelectedMode(mode);
    setStep('preferences');
  };

  const handlePreferenceAnswer = (value: boolean) => {
    const currentQuestion = ONBOARDING_QUESTIONS[currentQuestionIndex];
    const updatedPreferences = {
      ...preferences,
      [currentQuestion.id]: value,
    };
    setPreferences(updatedPreferences);

    if (currentQuestionIndex < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      completeOnboarding(updatedPreferences);
    }
  };

  const completeOnboarding = async (finalPreferences: UserPreferences) => {
    const preferencesWithFlag = {
      ...finalPreferences,
      completedOnboarding: true,
    };
    
    await AsyncStorage.setItem(MODE_KEY, selectedMode!);
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferencesWithFlag));
    router.replace('/(main)/(home)');
  };

  if (step === 'preferences') {
    const currentQuestion = ONBOARDING_QUESTIONS[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / ONBOARDING_QUESTIONS.length) * 100;

    return (
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              Question {currentQuestionIndex + 1} of {ONBOARDING_QUESTIONS.length}
            </Text>
          </View>

          <View style={styles.questionContent}>
            <Text style={styles.questionEmoji}>{currentQuestion.emoji}</Text>
            <Text style={styles.questionTitle}>{currentQuestion.question}</Text>
            <Text style={styles.questionDescription}>{currentQuestion.description}</Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={currentQuestion.yesLabel}
              onPress={() => handlePreferenceAnswer(true)}
              variant="primary"
              style={styles.answerButton}
            />
            <Button
              title={currentQuestion.noLabel}
              onPress={() => handlePreferenceAnswer(false)}
              variant="secondary"
              style={styles.answerButton}
            />
          </View>

          <Text style={styles.privacyNote}>
            These preferences help us personalize your experience.
            You can change them anytime in settings.
          </Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.logo}>✨</Text>
        <Text style={styles.title}>Scratch & Go</Text>
        <Text style={styles.tagline}>Scratch your next adventure</Text>

        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => handleModeSelection('couples')}
            activeOpacity={0.7}
          >
            <Text style={styles.modeEmoji}>💑</Text>
            <Text style={styles.modeTitle}>Couples Mode</Text>
            <Text style={styles.modeDescription}>Date night ideas for two</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => handleModeSelection('family')}
            activeOpacity={0.7}
          >
            <Text style={styles.modeEmoji}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.modeTitle}>Family Mode</Text>
            <Text style={styles.modeDescription}>Fun activities for everyone</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.switchText}>You can switch anytime</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  logo: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    marginBottom: Spacing.xxl,
  },
  cardsContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  modeCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modeEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  modeTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  modeDescription: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
  },
  switchText: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    marginTop: Spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    justifyContent: 'center',
  },
  progressContainer: {
    marginBottom: Spacing.xxl,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    textAlign: 'center',
  },
  questionContent: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  questionEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  questionTitle: {
    fontSize: Typography.sizes.h1,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  questionDescription: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  answerButton: {
    width: '100%',
  },
  privacyNote: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
