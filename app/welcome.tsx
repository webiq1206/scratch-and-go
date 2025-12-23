import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
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

  const polaroidImages = [
    { uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/projects/xz00xar8pn4xhtrdicpyk/generations/1735017775890_polaroid1.webp', rotation: '-8deg', top: 20, left: 10, zIndex: 3 },
    { uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/projects/xz00xar8pn4xhtrdicpyk/generations/1735017775908_polaroid2.webp', rotation: '5deg', top: 50, right: 20, zIndex: 5 },
    { uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/projects/xz00xar8pn4xhtrdicpyk/generations/1735017775924_polaroid3.webp', rotation: '12deg', top: 180, left: 30, zIndex: 2 },
    { uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/projects/xz00xar8pn4xhtrdicpyk/generations/1735017775941_polaroid4.webp', rotation: '-5deg', top: 140, right: 10, zIndex: 4 },
    { uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/projects/xz00xar8pn4xhtrdicpyk/generations/1735017775957_polaroid5.webp', rotation: '3deg', top: 280, left: 50, zIndex: 1 },
    { uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/projects/xz00xar8pn4xhtrdicpyk/generations/1735017775973_polaroid6.webp', rotation: '-10deg', top: 260, right: 40, zIndex: 6 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.photoCollageContainer}>
        {polaroidImages.map((photo, index) => (
          <View
            key={index}
            style={[
              styles.polaroid,
              {
                transform: [{ rotate: photo.rotation }],
                top: photo.top,
                left: photo.left,
                right: photo.right,
                zIndex: photo.zIndex,
              },
            ]}
          >
            <Image source={{ uri: photo.uri }} style={styles.polaroidImage} />
          </View>
        ))}
        <View style={styles.photoOverlay} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.heartContainer}>
          <Heart size={48} color="#FF6B9D" strokeWidth={2.5} fill="#FF6B9D" />
        </View>

        <Text style={styles.mainTagline}>Inclusive, reliable, safe.</Text>
        <Text style={styles.subTagline}>
          Go beyond your social circle & connect{'\n'}with people near and far.
        </Text>

        <TouchableOpacity
          onPress={() => {
            setSelectedMode('couples');
            setStep('preferences');
          }}
          activeOpacity={0.8}
          style={{ width: '100%' }}
        >
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginPrompt}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/(main)/(home)')}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  photoCollageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.55,
    position: 'relative',
    backgroundColor: '#1A1A1A',
  },
  polaroid: {
    position: 'absolute',
    width: 110,
    height: 130,
    backgroundColor: '#FFFFFF',
    padding: 8,
    paddingBottom: 20,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  polaroidImage: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartContainer: {
    marginBottom: Spacing.lg,
  },
  mainTagline: {
    fontSize: 24,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subTagline: {
    fontSize: Typography.sizes.body,
    color: '#B8B8B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  nextButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  nextButtonText: {
    fontSize: Typography.sizes.h3,
    fontWeight: Typography.weights.semibold,
    color: '#1A1A1A',
  },
  loginContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  loginPrompt: {
    fontSize: Typography.sizes.body,
    color: '#B8B8B8',
  },
  loginLink: {
    fontSize: Typography.sizes.body,
    color: '#FFFFFF',
    fontWeight: Typography.weights.semibold,
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
    borderRadius: 2,
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
