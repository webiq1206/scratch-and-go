import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { 
  SubscriptionStatus, 
  SubscriptionTier, 
  DEFAULT_SUBSCRIPTION_STATUS 
} from '@/types/subscription';

const SUBSCRIPTION_STORAGE_KEY = '@scratch_and_go:subscription';

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(DEFAULT_SUBSCRIPTION_STATUS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveSubscriptionStatus = async (status: SubscriptionStatus) => {
    try {
      await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(status));
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error saving subscription status:', error);
    }
  };

  const loadSubscriptionStatus = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SubscriptionStatus;
        
        if (parsed.tier === 'trial' && parsed.trialEndsAt) {
          const trialEndDate = new Date(parsed.trialEndsAt);
          if (trialEndDate < new Date()) {
            setSubscriptionStatus({ tier: 'free' });
            await saveSubscriptionStatus({ tier: 'free' });
          } else {
            setSubscriptionStatus(parsed);
          }
        } else if (parsed.tier === 'premium' && parsed.expiresAt) {
          const expiryDate = new Date(parsed.expiresAt);
          if (expiryDate < new Date()) {
            setSubscriptionStatus({ tier: 'free' });
            await saveSubscriptionStatus({ tier: 'free' });
          } else {
            setSubscriptionStatus(parsed);
          }
        } else {
          setSubscriptionStatus(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptionStatus();
  }, [loadSubscriptionStatus]);

  const isPremium = useCallback((): boolean => {
    if (subscriptionStatus.tier === 'premium') {
      if (subscriptionStatus.expiresAt) {
        const expiryDate = new Date(subscriptionStatus.expiresAt);
        return expiryDate > new Date();
      }
      return true;
    }
    
    if (subscriptionStatus.tier === 'trial') {
      if (subscriptionStatus.trialEndsAt) {
        const trialEndDate = new Date(subscriptionStatus.trialEndsAt);
        return trialEndDate > new Date();
      }
      return true;
    }
    
    return false;
  }, [subscriptionStatus]);

  const isTrial = useCallback((): boolean => {
    if (subscriptionStatus.tier === 'trial' && subscriptionStatus.trialEndsAt) {
      const trialEndDate = new Date(subscriptionStatus.trialEndsAt);
      return trialEndDate > new Date();
    }
    return false;
  }, [subscriptionStatus]);

  const updateSubscriptionTier = async (tier: SubscriptionTier, options?: {
    expiresAt?: string;
    trialEndsAt?: string;
    cancelAtPeriodEnd?: boolean;
  }) => {
    const newStatus: SubscriptionStatus = {
      tier,
      expiresAt: options?.expiresAt,
      trialEndsAt: options?.trialEndsAt,
      cancelAtPeriodEnd: options?.cancelAtPeriodEnd,
    };
    await saveSubscriptionStatus(newStatus);
  };

  const startTrial = async (durationDays: number = 7) => {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + durationDays);
    
    await updateSubscriptionTier('trial', {
      trialEndsAt: trialEndsAt.toISOString(),
    });
  };

  const activatePremium = async (interval: 'monthly' | 'yearly') => {
    const expiresAt = new Date();
    if (interval === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }
    
    await updateSubscriptionTier('premium', {
      expiresAt: expiresAt.toISOString(),
    });
  };

  const cancelSubscription = async () => {
    await saveSubscriptionStatus({
      ...subscriptionStatus,
      cancelAtPeriodEnd: true,
    });
  };

  const restorePurchases = async () => {
    console.log('Restore purchases called - mock implementation');
    return false;
  };

  const getTrialDaysRemaining = (): number => {
    if (subscriptionStatus.tier === 'trial' && subscriptionStatus.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(subscriptionStatus.trialEndsAt);
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    return 0;
  };

  const getSubscriptionEndDate = (): Date | null => {
    if (subscriptionStatus.tier === 'premium' && subscriptionStatus.expiresAt) {
      return new Date(subscriptionStatus.expiresAt);
    }
    if (subscriptionStatus.tier === 'trial' && subscriptionStatus.trialEndsAt) {
      return new Date(subscriptionStatus.trialEndsAt);
    }
    return null;
  };

  return {
    subscriptionStatus,
    isLoading,
    isPremium: isPremium(),
    isTrial: isTrial(),
    updateSubscriptionTier,
    startTrial,
    activatePremium,
    cancelSubscription,
    restorePurchases,
    getTrialDaysRemaining,
    getSubscriptionEndDate,
  };
});
