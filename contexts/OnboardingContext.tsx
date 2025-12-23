import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'scratch_and_go_onboarding';
const APP_VERSION_KEY = 'scratch_and_go_app_version';

const CURRENT_APP_VERSION = '1.0.0';

interface OnboardingState {
  hasSeenScratchTutorial: boolean;
  hasSeenFiltersTutorial: boolean;
  hasSeenMemoryBookTutorial: boolean;
  hasSeenQueueTutorial: boolean;
  lastSeenVersion: string;
}

const DEFAULT_ONBOARDING: OnboardingState = {
  hasSeenScratchTutorial: false,
  hasSeenFiltersTutorial: false,
  hasSeenMemoryBookTutorial: false,
  hasSeenQueueTutorial: false,
  lastSeenVersion: '',
};

export const [OnboardingProvider, useOnboarding] = createContextHook(() => {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(DEFAULT_ONBOARDING);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  useEffect(() => {
    loadOnboardingState();
  }, []);

  const loadOnboardingState = async () => {
    try {
      const [stored, lastVersion] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_KEY),
        AsyncStorage.getItem(APP_VERSION_KEY),
      ]);

      if (stored) {
        const state = JSON.parse(stored);
        setOnboardingState(state);
      }

      if (lastVersion && lastVersion !== CURRENT_APP_VERSION) {
        setShowWhatsNew(true);
      }
    } catch (error) {
      console.error('Failed to load onboarding state:', error);
    }
  };

  const saveOnboardingState = async (state: OnboardingState) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
      setOnboardingState(state);
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
  };

  const markScratchTutorialSeen = async () => {
    const newState = { ...onboardingState, hasSeenScratchTutorial: true };
    await saveOnboardingState(newState);
  };

  const markFiltersTutorialSeen = async () => {
    const newState = { ...onboardingState, hasSeenFiltersTutorial: true };
    await saveOnboardingState(newState);
  };

  const markMemoryBookTutorialSeen = async () => {
    const newState = { ...onboardingState, hasSeenMemoryBookTutorial: true };
    await saveOnboardingState(newState);
  };

  const markQueueTutorialSeen = async () => {
    const newState = { ...onboardingState, hasSeenQueueTutorial: true };
    await saveOnboardingState(newState);
  };

  const dismissWhatsNew = async () => {
    try {
      await AsyncStorage.setItem(APP_VERSION_KEY, CURRENT_APP_VERSION);
      setShowWhatsNew(false);
    } catch (error) {
      console.error('Failed to save app version:', error);
    }
  };

  const resetOnboarding = async () => {
    await saveOnboardingState(DEFAULT_ONBOARDING);
  };

  return {
    ...onboardingState,
    showWhatsNew,
    markScratchTutorialSeen,
    markFiltersTutorialSeen,
    markMemoryBookTutorialSeen,
    markQueueTutorialSeen,
    dismissWhatsNew,
    resetOnboarding,
  };
});
