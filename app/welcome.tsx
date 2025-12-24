import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, ActivityIndicator } from 'react-native';
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

  useEffect(() => {
    const checkExistingMode = async () => {
      const savedMode = await AsyncStorage.getItem(MODE_KEY);
      const savedPreferences = await AsyncStorage.getItem(PREFERENCES_KEY);
      
      if (savedMode && savedPreferences) {
        const prefs = JSON.parse(savedPreferences);
        if (prefs.completedOnboarding) {
          router.replace('/(main)/(home)' as any);
        }
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
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithFacebook();
    } finally {
      setIsLoggingIn(false);
    }
  };



  const handlePreferenceAnswer = (value: boolean) => {
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
    const preferencesWithFlag = {
      ...finalPreferences,
      completedOnboarding: true,
    };
    
    await AsyncStorage.setItem(MODE_KEY, selectedMode!);
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferencesWithFlag));
    router.replace('/(main)/(home)' as any);
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
    { uri: 'https://r2-pub.rork.com/generated-images/607ff251-9133-410d-ace6-05dca7cff93b.png', offset: 20, rotate: '-3deg' },
    { uri: 'https://r2-pub.rork.com/generated-images/048f8fae-5bc5-4aed-9540-052c641f597e.png', offset: -5, rotate: '2deg' },
    { uri: 'https://r2-pub.rork.com/generated-images/07d8a70f-801b-4db1-9df0-f279c96f76a5.png', offset: 15, rotate: '-2deg' },
    { uri: 'https://r2-pub.rork.com/generated-images/2ab872a7-455c-4c34-a695-a732c39bf7ab.png', offset: -10, rotate: '4deg' },
    { uri: 'https://r2-pub.rork.com/generated-images/095b3f39-4b79-4885-9987-db534bfa986c.png', offset: 30, rotate: '3deg' },
    { uri: 'https://r2-pub.rork.com/generated-images/edd5ca88-9972-49cb-8976-6c43c0717761.png', offset: 5, rotate: '-4deg' },
    { uri: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400', offset: 25, rotate: '2deg' },
    { uri: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400', offset: -15, rotate: '-3deg' },
    { uri: 'https://images.unsplash.com/photo-1541694458248-5aa2101c77df?w=400', offset: 35, rotate: '-2deg' },
    { uri: 'https://images.unsplash.com/photo-1516733968668-dbdce39c4651?w=400', offset: 10, rotate: '3deg' },
    { uri: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400', offset: 40, rotate: '-4deg' },
    { uri: 'https://images.unsplash.com/photo-1522038038628-2876b5e21c88?w=400', offset: 0, rotate: '2deg' },
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

      <View style={styles.contentContainer}>
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
    paddingBottom: Spacing.xxl,
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
