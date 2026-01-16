import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, ActivityIndicator, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Users, Check, Mail, Lock, User as UserIcon } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';
import { UserPreferences, DEFAULT_PREFERENCES, ONBOARDING_QUESTIONS, RELIGIONS } from '@/types/preferences';
import { useAuth } from '@/contexts/AuthContext';

const MODE_KEY = 'scratch_and_go_mode';
const PREFERENCES_KEY = 'scratch_and_go_preferences';

type OnboardingStep = 'mode' | 'preferences' | 'religion';
type WelcomeStep = OnboardingStep | 'login';

export default function WelcomeScreen() {
  const router = useRouter();
  const { loginWithGoogle, loginWithFacebook, signupWithEmail, loginWithEmail, isAuthenticated, authError } = useAuth();
  const [step, setStep] = useState<OnboardingStep | 'login'>('login');
  const [selectedMode, setSelectedMode] = useState<'couples' | 'family' | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
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

  // Check onboarding status and ensure mode selection is shown on first login
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const savedPreferences = await AsyncStorage.getItem(PREFERENCES_KEY);
        
        // If onboarding is complete, navigate to home
        if (savedPreferences) {
          try {
            const prefs = JSON.parse(savedPreferences);
            if (prefs && prefs.completedOnboarding) {
              router.replace('/(main)/(home)' as any);
              return;
            }
          } catch (e) {
            // Continue with onboarding if parsing fails
          }
        }
        
        // If authenticated, check if we need to show mode selection
        if (isAuthenticated) {
          const savedMode = await AsyncStorage.getItem(MODE_KEY);
          if (savedMode) {
            // Pre-select the saved mode, but still show mode selection screen
            setSelectedMode(savedMode as 'couples' | 'family');
          }
          // Always show mode selection on first login (when onboarding not complete)
          // This ensures users can see and confirm/change their mode selection
          if (step === 'login') {
            setStep('mode');
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };
    
    checkOnboardingStatus();
  }, [isAuthenticated, router, step]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
      // After successful login, show mode selection if not already selected
      const savedMode = await AsyncStorage.getItem(MODE_KEY);
      if (!savedMode) {
        setStep('mode');
      }
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
      // After successful login, show mode selection if not already selected
      const savedMode = await AsyncStorage.getItem(MODE_KEY);
      if (!savedMode) {
        setStep('mode');
      }
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

  const handleModeSelect = async (mode: 'couples' | 'family') => {
    setSelectedMode(mode);
    await AsyncStorage.setItem(MODE_KEY, mode);
    // Skip preferences step - go directly to home
    // User will set preferences before their first activity
    await completeOnboarding(DEFAULT_PREFERENCES);
  };

  const handleEmailSignup = async () => {
    if (!email || !password || !name) {
      return;
    }
    setIsLoggingIn(true);
    try {
      await signupWithEmail(email, password, name);
      const savedMode = await AsyncStorage.getItem(MODE_KEY);
      if (!savedMode) {
        setStep('mode');
      }
    } catch (error) {
      console.error('Email signup error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      return;
    }
    setIsLoggingIn(true);
    try {
      await loginWithEmail(email, password);
      const savedMode = await AsyncStorage.getItem(MODE_KEY);
      if (!savedMode) {
        setStep('mode');
      }
    } catch (error) {
      console.error('Email login error:', error);
    } finally {
      setIsLoggingIn(false);
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

  // Couples mode polaroid images - romantic couple stock photos
  const couplesPolaroids = [
    { uri: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=500&fit=crop&crop=faces', rotate: '-4deg' },
    { uri: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=500&fit=crop&crop=faces', rotate: '3deg' },
    { uri: 'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=400&h=500&fit=crop&crop=faces', rotate: '-2deg' },
  ];

  // Family mode polaroid images - happy family stock photos
  const familyPolaroids = [
    { uri: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=500&fit=crop&crop=faces', rotate: '-3deg' },
    { uri: 'https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?w=400&h=500&fit=crop&crop=faces', rotate: '4deg' },
    { uri: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400&h=500&fit=crop&crop=faces', rotate: '-2deg' },
  ];

  if (step === 'mode') {
    return (
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.modeScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modeHeaderContainer}>
            <Text style={styles.setupTitle}>Choose Your Mode</Text>
            <Text style={styles.setupSubtitle}>Select how you'll use Scratch & Go</Text>
          </View>

          <View style={styles.modeCardsContainer}>
            {/* Couples Mode Card */}
            <TouchableOpacity
              style={[
                styles.modePolaroidCard,
                selectedMode === 'couples' && styles.modePolaroidCardSelected
              ]}
              onPress={() => handleModeSelect('couples')}
              activeOpacity={0.9}
            >
              <View style={styles.polaroidCluster}>
                {couplesPolaroids.map((photo, index) => (
                  <View
                    key={index}
                    style={[
                      styles.clusterPolaroid,
                      {
                        transform: [{ rotate: photo.rotate }],
                        marginLeft: index * 28,
                        zIndex: 3 - index,
                      }
                    ]}
                  >
                    <Image source={{ uri: photo.uri }} style={styles.clusterPolaroidImage} />
                  </View>
                ))}
              </View>
              <View style={styles.modeCardContent}>
                <View style={styles.modeCardTitleRow}>
                  <Heart size={20} color={Colors.primary} />
                  <Text style={styles.modeCardTitle}>Couples</Text>
                  {selectedMode === 'couples' && (
                    <View style={styles.modeCardCheckmark}>
                      <Check size={14} color="#1A1A1A" strokeWidth={3} />
                    </View>
                  )}
                </View>
                <Text style={styles.modeCardDescription}>
                  Romantic dates & couple activities
                </Text>
              </View>
            </TouchableOpacity>

            {/* Family Mode Card */}
            <TouchableOpacity
              style={[
                styles.modePolaroidCard,
                selectedMode === 'family' && styles.modePolaroidCardSelected
              ]}
              onPress={() => handleModeSelect('family')}
              activeOpacity={0.9}
            >
              <View style={styles.polaroidCluster}>
                {familyPolaroids.map((photo, index) => (
                  <View
                    key={index}
                    style={[
                      styles.clusterPolaroid,
                      {
                        transform: [{ rotate: photo.rotate }],
                        marginLeft: index * 28,
                        zIndex: 3 - index,
                      }
                    ]}
                  >
                    <Image source={{ uri: photo.uri }} style={styles.clusterPolaroidImage} />
                  </View>
                ))}
              </View>
              <View style={styles.modeCardContent}>
                <View style={styles.modeCardTitleRow}>
                  <Users size={20} color={Colors.primary} />
                  <Text style={styles.modeCardTitle}>Family</Text>
                  {selectedMode === 'family' && (
                    <View style={styles.modeCardCheckmark}>
                      <Check size={14} color="#1A1A1A" strokeWidth={3} />
                    </View>
                  )}
                </View>
                <Text style={styles.modeCardDescription}>
                  Family activities & memories together
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.modeNote}>
            You can change this anytime in settings
          </Text>
        </ScrollView>
      </View>
    );
  }

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
    // Ensure mode is selected before showing preferences
    if (!selectedMode) {
      // If no mode selected, go back to mode selection
      setStep('mode');
      return null;
    }

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

  // Show login screen if step is 'login' or if not authenticated and step is not explicitly set
  if (step === 'login' || (!isAuthenticated && step !== 'mode' && step !== 'preferences' && step !== 'religion')) {
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
            Discover meaningful moments to share{'\n'}with the people you love most.
          </Text>

          <View style={styles.authButtonsContainer}>
            <TouchableOpacity
              onPress={handleGoogleLogin}
              activeOpacity={0.8}
              style={styles.socialButton}
              disabled={isLoggingIn}
              accessibilityLabel="Sign in with Google"
              accessibilityRole="button"
              accessibilityState={{ disabled: isLoggingIn }}
            >
              <View style={styles.socialButtonContent}>
                <Image
                  source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
                  style={styles.socialIcon}
                  accessibilityIgnoresInvertColors
                />
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleFacebookLogin}
              activeOpacity={0.8}
              style={[styles.socialButton, styles.facebookButton]}
              disabled={isLoggingIn}
              accessibilityLabel="Sign in with Facebook"
              accessibilityRole="button"
              accessibilityState={{ disabled: isLoggingIn }}
            >
              <View style={styles.socialButtonContent}>
                <Image
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg' }}
                  style={styles.socialIcon}
                  accessibilityIgnoresInvertColors
                />
                <Text style={[styles.socialButtonText, styles.facebookButtonText]}>Continue with Facebook</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.dividerContainer} accessibilityElementsHidden>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            {!showEmailForm ? (
              <TouchableOpacity
                onPress={() => setShowEmailForm(true)}
                activeOpacity={0.8}
                style={styles.emailButton}
                disabled={isLoggingIn}
              >
                <Mail size={20} color={Colors.primary} />
                <Text style={styles.emailButtonText}>Continue with Email</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.emailForm}>
                {isSignup && (
                  <View style={styles.inputContainer}>
                    <UserIcon size={18} color={Colors.textLight} />
                    <TextInput
                      style={styles.input}
                      placeholder="Name"
                      placeholderTextColor={Colors.textMuted}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                )}
                <View style={styles.inputContainer}>
                  <Mail size={18} color={Colors.textLight} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={Colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Lock size={18} color={Colors.textLight} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={Colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                
                {authError && (
                  <Text style={styles.errorText}>{authError}</Text>
                )}

                <TouchableOpacity
                  onPress={isSignup ? handleEmailSignup : handleEmailLogin}
                  activeOpacity={0.8}
                  style={{ width: '100%' }}
                  disabled={isLoggingIn || !email || !password || (isSignup && !name)}
                >
                  <LinearGradient
                    colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.nextButton, (!email || !password || (isSignup && !name)) && styles.nextButtonDisabled]}
                  >
                    {isLoggingIn ? (
                      <ActivityIndicator color="#1A1A1A" />
                    ) : (
                      <Text style={styles.nextButtonText}>
                        {isSignup ? 'Create Account' : 'Sign In'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setIsSignup(!isSignup);
                    setEmail('');
                    setPassword('');
                    setName('');
                  }}
                  style={styles.switchAuthButton}
                >
                  <Text style={styles.switchAuthText}>
                    {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  // This should never be reached, but TypeScript needs it
  return null;
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
  modeScrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: 80,
    paddingBottom: Spacing.xxl,
    justifyContent: 'flex-start',
  },
  modeHeaderContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  modeCardsContainer: {
    width: '100%',
    gap: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  modePolaroidCard: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.large,
    borderWidth: 2,
    borderColor: '#333333',
    overflow: 'hidden',
  },
  modePolaroidCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 107, 157, 0.08)',
  },
  polaroidCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    height: 140,
  },
  clusterPolaroid: {
    width: 85,
    height: 105,
    backgroundColor: '#E8E8E8',
    padding: 5,
    paddingBottom: 18,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    position: 'absolute',
  },
  clusterPolaroidImage: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  modeCardContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  modeCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  modeCardTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '500' as const,
    color: '#FFFFFF',
    flex: 1,
  },
  modeCardCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeCardDescription: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    lineHeight: 22,
    paddingLeft: 28,
  },
  modeNote: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: Spacing.md,
  },
  emailButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emailButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  emailForm: {
    width: '100%',
    gap: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.body,
    color: Colors.text,
  },
  errorText: {
    fontSize: Typography.sizes.small,
    color: Colors.error,
    textAlign: 'center',
    marginTop: -Spacing.sm,
  },
  switchAuthButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  switchAuthText: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
});
