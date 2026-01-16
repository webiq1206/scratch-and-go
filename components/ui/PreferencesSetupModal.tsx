import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, ChevronRight, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';
import { UserPreferences, ONBOARDING_QUESTIONS, RELIGIONS } from '@/types/preferences';
import { usePreferences } from '@/contexts/PreferencesContext';

interface PreferencesSetupModalProps {
  visible: boolean;
  onComplete: () => void;
  onSkip?: () => void;
}

type SetupStep = 'intro' | 'preferences' | 'religion';

export default function PreferencesSetupModal({ visible, onComplete, onSkip }: PreferencesSetupModalProps) {
  const { preferences, updatePreferences, markPreferencesConfigured } = usePreferences();
  const [step, setStep] = useState<SetupStep>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [localPreferences, setLocalPreferences] = useState<Partial<UserPreferences>>({});

  const handleStart = () => {
    setStep('preferences');
    setCurrentQuestionIndex(0);
    setLocalPreferences({});
  };

  const handleSkip = async () => {
    // Mark preferences as configured with defaults
    await markPreferencesConfigured();
    onSkip?.();
    onComplete();
    resetState();
  };

  const handlePreferenceAnswer = async (value: boolean) => {
    if (currentQuestionIndex >= ONBOARDING_QUESTIONS.length) {
      await finishSetup(localPreferences);
      return;
    }
    
    const currentQuestion = ONBOARDING_QUESTIONS[currentQuestionIndex];
    const updatedPreferences = {
      ...localPreferences,
      [currentQuestion.id]: value,
    };
    setLocalPreferences(updatedPreferences);

    // If user said yes to religious activities, ask about religion
    if (currentQuestion.id === 'includeReligious' && value === true) {
      setStep('religion');
      return;
    }

    if (currentQuestionIndex < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      await finishSetup(updatedPreferences);
    }
  };

  const handleReligionSelection = async (religionId: string) => {
    const updatedPreferences = {
      ...localPreferences,
      religion: religionId,
    };
    setLocalPreferences(updatedPreferences);

    if (currentQuestionIndex < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setStep('preferences');
    } else {
      await finishSetup(updatedPreferences);
    }
  };

  const finishSetup = async (finalPreferences: Partial<UserPreferences>) => {
    await updatePreferences({
      ...finalPreferences,
      hasConfiguredPreferences: true,
    });
    onComplete();
    resetState();
  };

  const resetState = () => {
    setStep('intro');
    setCurrentQuestionIndex(0);
    setLocalPreferences({});
  };

  const progress = ((currentQuestionIndex + 1) / ONBOARDING_QUESTIONS.length) * 100;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <X size={24} color={Colors.textLight} />
          </TouchableOpacity>

          {step === 'intro' && (
            <View style={styles.introContainer}>
              <View style={styles.iconContainer}>
                <Sparkles size={48} color={Colors.primary} />
              </View>
              <Text style={styles.introTitle}>One Quick Step</Text>
              <Text style={styles.introSubtitle}>
                Before your first activity, let's personalize your experience with a few quick questions.
              </Text>
              <Text style={styles.introNote}>
                This helps us suggest activities you'll actually love!
              </Text>
              
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStart}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startButtonGradient}
                >
                  <Text style={styles.startButtonText}>Let's Do It</Text>
                  <ChevronRight size={20} color={Colors.backgroundDark} />
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'preferences' && currentQuestionIndex < ONBOARDING_QUESTIONS.length && (
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.headerContainer}>
                <Text style={styles.setupTitle}>Quick Setup</Text>
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
                <Text style={styles.questionTitle}>
                  {ONBOARDING_QUESTIONS[currentQuestionIndex].question}
                </Text>
                <Text style={styles.questionDescription}>
                  {ONBOARDING_QUESTIONS[currentQuestionIndex].description}
                </Text>
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
                    <Text style={styles.answerButtonText}>
                      {ONBOARDING_QUESTIONS[currentQuestionIndex].yesLabel}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.answerButtonSecondary}
                  onPress={() => handlePreferenceAnswer(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.answerButtonSecondaryText}>
                    {ONBOARDING_QUESTIONS[currentQuestionIndex].noLabel}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.privacyNote}>
                You can change these anytime in Settings
              </Text>
            </ScrollView>
          )}

          {step === 'religion' && (
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.headerContainer}>
                <Text style={styles.setupTitle}>Quick Setup</Text>
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
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    minHeight: '60%',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
    padding: Spacing.xs,
  },
  
  // Intro styles
  introContainer: {
    padding: Spacing.xl,
    paddingTop: 60,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  introTitle: {
    fontSize: Typography.sizes.h1,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  introSubtitle: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  introNote: {
    fontSize: Typography.sizes.small,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Spacing.xxl,
  },
  startButton: {
    width: '100%',
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  startButtonText: {
    fontSize: Typography.sizes.h3,
    fontWeight: '600' as const,
    color: Colors.backgroundDark,
  },
  skipButton: {
    paddingVertical: Spacing.md,
  },
  skipButtonText: {
    fontSize: Typography.sizes.body,
    color: Colors.textMuted,
  },
  
  // Preferences styles
  scrollContent: {
    padding: Spacing.xl,
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: '400' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  setupSubtitle: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: Spacing.xxl,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.backgroundLight,
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
    color: Colors.textMuted,
    textAlign: 'center',
  },
  questionContent: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  questionTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '500' as const,
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
  gradientButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  answerButtonText: {
    fontSize: Typography.sizes.h3,
    fontWeight: '500' as const,
    color: Colors.backgroundDark,
  },
  answerButtonSecondary: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  answerButtonSecondaryText: {
    fontSize: Typography.sizes.h3,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  privacyNote: {
    fontSize: Typography.sizes.small,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Religion styles
  religionGrid: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  religionCard: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.large,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  religionLabel: {
    fontSize: Typography.sizes.body,
    fontWeight: '500' as const,
    color: Colors.text,
    textAlign: 'center',
  },
});
