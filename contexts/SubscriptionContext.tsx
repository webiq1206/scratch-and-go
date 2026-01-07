import { useCallback } from 'react';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import Purchases, { 
  PurchasesOfferings, 
  CustomerInfo, 
  PurchasesPackage,
  LOG_LEVEL 
} from 'react-native-purchases';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ENTITLEMENT_ID = 'premium';

function getRCApiKey(): string {
  if (__DEV__ || Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || '';
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '',
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '',
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || '',
  }) || '';
}

const apiKey = getRCApiKey();

if (apiKey) {
  console.log('[RevenueCat] Configuring with API key...');
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
} else {
  console.warn('[RevenueCat] No API key found, purchases will not work');
}

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const queryClient = useQueryClient();

  const customerInfoQuery = useQuery({
    queryKey: ['revenuecat', 'customerInfo'],
    queryFn: async () => {
      if (!apiKey) {
        console.log('[RevenueCat] No API key, returning null customer info');
        return null;
      }
      console.log('[RevenueCat] Fetching customer info...');
      const info = await Purchases.getCustomerInfo();
      console.log('[RevenueCat] Customer info:', JSON.stringify(info.entitlements.active, null, 2));
      return info;
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const offeringsQuery = useQuery({
    queryKey: ['revenuecat', 'offerings'],
    queryFn: async () => {
      if (!apiKey) {
        console.log('[RevenueCat] No API key, returning null offerings');
        return null;
      }
      console.log('[RevenueCat] Fetching offerings...');
      const offerings = await Purchases.getOfferings();
      console.log('[RevenueCat] Offerings:', JSON.stringify(offerings.current?.availablePackages.map(p => ({
        identifier: p.identifier,
        product: p.product.identifier,
        price: p.product.priceString,
      })), null, 2));
      return offerings;
    },
    staleTime: 1000 * 60 * 10,
    retry: 2,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      console.log('[RevenueCat] Purchasing package:', pkg.identifier);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      console.log('[RevenueCat] Purchase successful');
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(['revenuecat', 'customerInfo'], customerInfo);
    },
    onError: (error: any) => {
      console.error('[RevenueCat] Purchase error:', error);
      if (error.userCancelled) {
        console.log('[RevenueCat] User cancelled purchase');
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      console.log('[RevenueCat] Restoring purchases...');
      const customerInfo = await Purchases.restorePurchases();
      console.log('[RevenueCat] Restore successful');
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(['revenuecat', 'customerInfo'], customerInfo);
    },
    onError: (error) => {
      console.error('[RevenueCat] Restore error:', error);
    },
  });

  const isPremium = useCallback((): boolean => {
    const customerInfo = customerInfoQuery.data;
    if (!customerInfo) return false;
    
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    return !!entitlement;
  }, [customerInfoQuery.data]);

  const getSubscriptionEndDate = useCallback((): Date | null => {
    const customerInfo = customerInfoQuery.data;
    if (!customerInfo) return null;
    
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (entitlement?.expirationDate) {
      return new Date(entitlement.expirationDate);
    }
    return null;
  }, [customerInfoQuery.data]);

  const { mutateAsync: purchaseAsync } = purchaseMutation;
  const { mutateAsync: restoreAsync } = restoreMutation;

  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    return purchaseAsync(pkg);
  }, [purchaseAsync]);

  const restorePurchases = useCallback(async () => {
    const customerInfo = await restoreAsync();
    const hasEntitlement = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    return hasEntitlement;
  }, [restoreAsync]);

  const refreshCustomerInfo = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['revenuecat', 'customerInfo'] });
  }, [queryClient]);

  return {
    customerInfo: customerInfoQuery.data as CustomerInfo | null,
    offerings: offeringsQuery.data as PurchasesOfferings | null,
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    isPremium: isPremium(),
    isTrial: false,
    subscriptionStatus: {
      tier: isPremium() ? 'premium' as const : 'free' as const,
    },
    getSubscriptionEndDate,
    purchasePackage,
    restorePurchases,
    refreshCustomerInfo,
    getTrialDaysRemaining: (): number => 0,
    activatePremium: async () => {},
    startTrial: async () => {},
    cancelSubscription: async () => {},
    updateSubscriptionTier: async () => {},
  };
});
