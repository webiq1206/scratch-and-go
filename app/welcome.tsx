import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';
import { UserPreferences, DEFAULT_PREFERENCES, ONBOARDING_QUESTIONS, RELIGIONS } from '@/types/preferences';
import { useAuth } from '@/contexts/AuthContext';

const MODE_KEY = 'scratch_and_go_mode';
const PREFERENCES_KEY = 'scratch_and_go_preferences';

type OnboardingStep = 'mode' | 'preferences' | 'religion';

export default function WelcomeScreen() {
  const router = useRouter();
  const { loginWithGoogle, loginWithFacebook, isAuthenticated } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('mode');
  const [selectedMode, setSelectedMode] = useState<'couples' | 'family' | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const checkExistingMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(MODE_KEY);
        const savedPreferences = await AsyncStorage.getItem(PREFERENCES_KEY);
        
        if (savedMode && savedPreferences) {
          try {
            const prefs = JSON.parse(savedPreferences);
            if (prefs && prefs.completedOnboarding) {
              router.replace('/(main)/(home)' as any);
            }
          } catch (parseError) {
            console.error('Error parsing saved preferences:', parseError);
            // If preferences are corrupted, clear them and start fresh
            await AsyncStorage.removeItem(PREFERENCES_KEY);
            await AsyncStorage.removeItem(MODE_KEY);
          }
        }
      } catch (error) {
        console.error('Error checking existing mode:', error);
        // Continue with onboarding if there's an error
      }
    };
    
    checkExistingMode();
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      setStep('preferences');
      setSelectedMode('couples');
    }
  }, [isAuthenticated]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google login error:', error);
      // Error handling is managed by AuthContext, but we ensure loading state is cleared
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithFacebook();
    } catch (error) {
      console.error('Facebook login error:', error);
      // Error handling is managed by AuthContext, but we ensure loading state is cleared
    } finally {
      setIsLoggingIn(false);
    }
  };



  const handlePreferenceAnswer = (value: boolean) => {
    // Safety check: ensure question index is valid
    if (currentQuestionIndex >= ONBOARDING_QUESTIONS.length) {
      completeOnboarding(preferences);
      return;
    }
    
    const currentQuestion = ONBOARDING_QUESTIONS[currentQuestionIndex];
    const updatedPreferences = {
      ...preferences,
      [currentQuestion.id]: value,
    };
    setPreferences(updatedPreferences);

    if (currentQuestion.id === 'includeReligious' && value === true) {
      setStep('religion');
      return;
    }

    if (currentQuestionIndex < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      completeOnboarding(updatedPreferences);
    }
  };

  const handleReligionSelection = (religionId: string) => {
    const updatedPreferences = {
      ...preferences,
      religion: religionId,
    };
    setPreferences(updatedPreferences);

    if (currentQuestionIndex < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setStep('preferences');
    } else {
      completeOnboarding(updatedPreferences);
    }
  };

  const completeOnboarding = async (finalPreferences: UserPreferences) => {
    try {
      const preferencesWithFlag = {
        ...finalPreferences,
        completedOnboarding: true,
      };
      
      // Ensure mode is set (default to 'couples' if not selected)
      const modeToSave = selectedMode || 'couples';
      await AsyncStorage.setItem(MODE_KEY, modeToSave);
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferencesWithFlag));
      router.replace('/(main)/(home)' as any);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still navigate to home even if storage fails - user can retry later
      router.replace('/(main)/(home)' as any);
    }
  };

  if (step === 'religion') {
    const progress = ((currentQuestionIndex + 1) / ONBOARDING_QUESTIONS.length) * 100;

    return (
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.setupTitle}>Setting Up Your Experience</Text>
            <Text style={styles.setupSubtitle}>Help us personalize your activities</Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              Question {currentQuestionIndex + 1} of {ONBOARDING_QUESTIONS.length}
            </Text>
          </View>

          <View style={styles.questionContent}>
            <Text style={styles.questionTitle}>What is your religion?</Text>
            <Text style={styles.questionDescription}>
              This helps us suggest relevant faith-based activities and places of worship
            </Text>
          </View>

          <View style={styles.religionGrid}>
            {RELIGIONS.map((religion) => (
              <TouchableOpacity
                key={religion.id}
                style={styles.religionCard}
                onPress={() => handleReligionSelection(religion.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.religionLabel}>{religion.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (step === 'preferences') {
    // Safety check: ensure question index is valid
    if (currentQuestionIndex >= ONBOARDING_QUESTIONS.length) {
      completeOnboarding(preferences);
      return null;
    }
    
    const currentQuestion = ONBOARDING_QUESTIONS[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / ONBOARDING_QUESTIONS.length) * 100;

    return (
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.setupTitle}>Setting Up Your Experience</Text>
            <Text style={styles.setupSubtitle}>Help us personalize your activities</Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              Question {currentQuestionIndex + 1} of {ONBOARDING_QUESTIONS.length}
            </Text>
          </View>

          <View style={styles.questionContent}>
            <Text style={styles.questionTitle}>{currentQuestion.question}</Text>
            <Text style={styles.questionDescription}>{currentQuestion.description}</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.answerButton}
              onPress={() => handlePreferenceAnswer(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.answerButtonText}>{currentQuestion.yesLabel}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.answerButtonSecondary}
              onPress={() => handlePreferenceAnswer(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.answerButtonSecondaryText}>{currentQuestion.noLabel}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.privacyNote}>
            This is a one-time setup. You can always change these preferences later in your settings.
          </Text>
        </ScrollView>
      </View>
    );
  }

  const polaroidImages = [
    { uri: 'https://r2-pub.rork.com/generated-images/b6d4e365-2f71-4c09-801a-cb3e4230f9aa.png', offset: 20, rotate: '-3deg' },
    { uri: 'https://r2-pub.rork.com/generated-images/369a252a-1ff2-448c-916f-5baf6aa39b58.png', offset: -5, rotate: '2deg' },
    { uri: 'https://r2-pub.rork.com/generated-images/28fbaf27-94f2-4a5d-ad1a-6a9b9be5b347.png', offset: 15, rotate: '-2deg' },
    { uri: 'https://r2-pub.rork.com/generated-images/06c17602-3ffd-4f65-8b61-07f234377b70.png', offset: -10, rotate: '4deg' },
    { uri: 'https://r2-pub.rork.com/generated-images/6a58e16a-503a-44ea-b4f1-67416714ca98.png', offset: 30, rotate: '3deg' },
    { uri: 'https://r2-pub.rork.com/generated-images/a162487b-00e2-4d1f-9663-ba25f6b37151.png', offset: 5, rotate: '-4deg' },
    { uri: 'https://r2-pub.rork.com/generated-images/ced576bf-8e1b-430d-875c-14ead9797187.png', offset: 25, rotate: '2deg' },
    { uri: 'https://r2-pub.rork.com/generated-images/3d621e77-1dcf-4aaf-b2da-9b966f6f130f.png', offset: -15, rotate: '-3deg' },
    { uri: 'https://r2-pub.rork.com/generated-images/c5f5349d-7bc9-444e-a675-f5c37a67648c.png', offset: 35, rotate: '-2deg' },
    { uri: 'https://r2-pub.rork.com/generated-images/54dc9a48-bc9c-47df-a041-6a45af6bcc6e.png', offset: 10, rotate: '3deg' },
    { uri: 'https://r2-pub.rork.com/generated-images/8a59d14e-42c8-47c4-a54c-c0400d953bb0.png', offset: 40, rotate: '-4deg' },
    { uri: 'https://r2-pub.rork.com/generated-images/14b9dd81-cead-4151-958b-e1ff18fc5330.png', offset: 0, rotate: '2deg' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.photoCollageContainer}>
        <View style={styles.polaroidGridWrapper}>
          <View style={styles.polaroidGrid}>
            {polaroidImages.map((photo, index) => (
              <View key={index} style={[styles.polaroid, { marginTop: photo.offset, transform: [{ rotate: photo.rotate }] }]}>
                <Image source={{ uri: photo.uri }} style={styles.polaroidImage} />
              </View>
            ))}
          </View>
        </View>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.85)', '#000000']}
          locations={[0, 0.3, 0.6, 0.75]}
          style={styles.photoOverlay}
        />
      </View>

      <View style={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, Spacing.xxl) }]}>
        <Text style={styles.mainTagline}>Create memories that last forever.</Text>
        <Text style={styles.subTagline}>
          Discover meaningful moments to share{('\n')}with the people you love most.
        </Text>

        <View style={styles.authButtonsContainer}>
          <TouchableOpacity
            onPress={handleGoogleLogin}
            activeOpacity={0.8}
            style={styles.socialButton}
            disabled={isLoggingIn}
          >
            <View style={styles.socialButtonContent}>
              <Image
                source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleFacebookLogin}
            activeOpacity={0.8}
            style={[styles.socialButton, styles.facebookButton]}
            disabled={isLoggingIn}
          >
            <View style={styles.socialButtonContent}>
              <Image
                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg' }}
                style={styles.socialIcon}
              />
              <Text style={[styles.socialButtonText, styles.facebookButtonText]}>Continue with Facebook</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            onPress={() => {
              setSelectedMode('couples');
              setStep('preferences');
            }}
            activeOpacity={0.8}
            style={{ width: '100%' }}
            disabled={isLoggingIn}
          >
            <LinearGradient
              colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButton}
            >
              {isLoggingIn ? (
                <ActivityIndicator color="#1A1A1A" />
              ) : (
                <Text style={styles.nextButtonText}>Continue</Text>
              )}
            </LinearGradient>
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
    backgroundColor: '#000000',
  },
  photoCollageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000000',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 70,
  },
  polaroidGridWrapper: {
    width: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  polaroidGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingHorizontal: 0,
    marginLeft: -30,
    width: SCREEN_WIDTH + 60,
    gap: 10,
  },
  polaroid: {
    width: (SCREEN_WIDTH - 20) / 4,
    height: ((SCREEN_WIDTH - 20) / 4) * 1.25,
    backgroundColor: '#E8E8E8',
    padding: 7,
    paddingBottom: 20,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 12,
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
    zIndex: 10,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },

  mainTagline: {
    fontSize: 24,
    fontWeight: '400' as const,
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
    fontWeight: '400' as const,
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
    fontWeight: '400' as const,
  },
  authButtonsContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  socialButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  socialButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '500' as const,
    color: '#1A1A1A',
  },
  facebookButtonText: {
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#333333',
  },
  dividerText: {
    fontSize: Typography.sizes.small,
    color: '#B8B8B8',
    marginHorizontal: Spacing.md,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.xl,
    justifyContent: 'flex-start',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: '400' as const,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  setupSubtitle: {
    fontSize: Typography.sizes.body,
    color: '#B8B8B8',
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: Spacing.xxl,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B9D',
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.sizes.small,
    color: '#B8B8B8',
    textAlign: 'center',
  },
  questionContent: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },

  questionTitle: {
    fontSize: Typography.sizes.h1,
    fontWeight: '400' as const,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  questionDescription: {
    fontSize: Typography.sizes.body,
    color: '#B8B8B8',
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
  gradientButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  answerButtonText: {
    fontSize: Typography.sizes.h3,
    fontWeight: '400' as const,
    color: '#1A1A1A',
  },
  answerButtonSecondary: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#333333',
  },
  answerButtonSecondaryText: {
    fontSize: Typography.sizes.h3,
    fontWeight: '400' as const,
    color: '#FFFFFF',
  },
  privacyNote: {
    fontSize: Typography.sizes.small,
    color: '#B8B8B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  religionGrid: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  religionCard: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.large,
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  religionLabel: {
    fontSize: Typography.sizes.h3,
    fontWeight: '400' as const,
    color: '#FFFFFF',
  },
});
