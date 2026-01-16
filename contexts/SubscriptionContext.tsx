import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ENTITLEMENT_ID = 'premium';

function getRCApiKey(): string {
  try {
    let apiKey = '';
    
    if (__DEV__ || Platform.OS === 'web') {
      apiKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || '';
      if (!apiKey) {
        console.warn('[RevenueCat] Missing EXPO_PUBLIC_REVENUECAT_TEST_API_KEY - purchases will not work in development');
      }
    } else {
      apiKey = Platform.select({
        ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '',
        android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '',
        default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || '',
      }) || '';
      
      if (!apiKey) {
        const platform = Platform.OS;
        console.warn(`[RevenueCat] Missing API key for ${platform} - purchases will not work`);
        console.warn(`[RevenueCat] Set EXPO_PUBLIC_REVENUECAT_${platform.toUpperCase()}_API_KEY in your environment`);
      }
    }
    
    return apiKey;
  } catch {
    console.warn('[RevenueCat] Failed to get API key');
    return '';
  }
}

// Lazy load Purchases module to avoid initialization issues
let PurchasesModule: typeof import('react-native-purchases').default | null = null;
let isConfigured = false;

async function initializePurchases(): Promise<typeof import('react-native-purchases').default | null> {
  if (PurchasesModule && isConfigured) {
    return PurchasesModule;
  }

  try {
    const purchasesImport = await import('react-native-purchases');
    PurchasesModule = purchasesImport.default;
    const LOG_LEVEL = purchasesImport.LOG_LEVEL;
    
    const apiKey = getRCApiKey();
    
    if (apiKey && PurchasesModule && !isConfigured) {
      console.log('[RevenueCat] Configuring with API key...');
      PurchasesModule.setLogLevel(LOG_LEVEL.DEBUG);
      PurchasesModule.configure({ apiKey });
      isConfigured = true;
    } else if (!apiKey) {
      console.warn('[RevenueCat] No API key found, purchases will not work');
    }
    
    return PurchasesModule;
  } catch (error) {
    console.warn('[RevenueCat] Failed to initialize:', error);
    return null;
  }
}

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const initRef = useRef(false);

  // Initialize Purchases on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    initializePurchases()
      .then(() => {
        setIsInitialized(true);
      })
      .catch((error) => {
        console.warn('[RevenueCat] Initialization failed:', error);
        setIsInitialized(true); // Still set to true so queries can proceed (with null results)
      });
  }, []);

  const customerInfoQuery = useQuery({
    queryKey: ['revenuecat', 'customerInfo'],
    queryFn: async () => {
      const Purchases = await initializePurchases();
      if (!Purchases) {
        console.log('[RevenueCat] Purchases not available, returning null customer info');
        return null;
      }
      console.log('[RevenueCat] Fetching customer info...');
      const info = await Purchases.getCustomerInfo();
      console.log('[RevenueCat] Customer info:', JSON.stringify(info.entitlements.active, null, 2));
      return info;
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
    enabled: isInitialized,
  });

  const offeringsQuery = useQuery({
    queryKey: ['revenuecat', 'offerings'],
    queryFn: async () => {
      const Purchases = await initializePurchases();
      if (!Purchases) {
        console.log('[RevenueCat] Purchases not available, returning null offerings');
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
    enabled: isInitialized,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: any) => {
      const Purchases = await initializePurchases();
      if (!Purchases) {
        throw new Error('Purchases not available');
      }
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
      const Purchases = await initializePurchases();
      if (!Purchases) {
        throw new Error('Purchases not available');
      }
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

  const purchasePackage = useCallback(async (pkg: any) => {
    return purchaseAsync(pkg);
  }, [purchaseAsync]);

  const restorePurchases = useCallback(async () => {
    const customerInfo = await restoreAsync();
    const hasEntitlement = !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
    return hasEntitlement;
  }, [restoreAsync]);

  const refreshCustomerInfo = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['revenuecat', 'customerInfo'] });
  }, [queryClient]);

  return {
    customerInfo: customerInfoQuery.data ?? null,
    offerings: offeringsQuery.data ?? null,
    isLoading: !isInitialized || customerInfoQuery.isLoading || offeringsQuery.isLoading,
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
    // Trial functionality - not implemented in current version
    getTrialDaysRemaining: (): number => 0,
    // These functions are placeholders for future subscription management features
    // They are kept for API compatibility but do nothing in the current implementation
    activatePremium: async () => {
      console.warn('activatePremium is not implemented - use purchasePackage instead');
    },
    startTrial: async () => {
      console.warn('startTrial is not implemented in current version');
    },
    cancelSubscription: async () => {
      console.warn('cancelSubscription should be done through platform settings (App Store/Play Store)');
    },
    updateSubscriptionTier: async () => {
      console.warn('updateSubscriptionTier is not implemented - use purchasePackage for upgrades');
    },
  };
});
