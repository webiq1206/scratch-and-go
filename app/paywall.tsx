import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Sparkles, Zap, Star, Crown, Check } from 'lucide-react-native';
import { PurchasesPackage } from 'react-native-purchases';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function PaywallScreen() {
  const router = useRouter();
  const { 
    offerings, 
    isLoading, 
    isPurchasing, 
    isRestoring,
    purchasePackage, 
    restorePurchases 
  } = useSubscription();
  
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

  const benefits = [
    { icon: Zap, text: 'Unlimited scratches every month', color: Colors.accent },
    { icon: Star, text: 'Exclusive premium activity categories', color: Colors.accent },
    { icon: Sparkles, text: 'Priority support from our team', color: Colors.accent },
    { icon: Crown, text: '100% ad-free experience', color: Colors.accent },
  ];

  const packages = offerings?.current?.availablePackages || [];
  const monthlyPackage = packages.find(p => p.identifier === 'monthly' || p.identifier === '$rc_monthly');
  const annualPackage = packages.find(p => p.identifier === 'annual' || p.identifier === '$rc_annual');

  React.useEffect(() => {
    if (annualPackage && !selectedPackage) {
      setSelectedPackage(annualPackage);
    } else if (monthlyPackage && !selectedPackage) {
      setSelectedPackage(monthlyPackage);
    }
  }, [annualPackage, monthlyPackage, selectedPackage]);

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a plan');
      return;
    }

    try {
      await purchasePackage(selectedPackage);
      
      Alert.alert(
        'Welcome to Premium!',
        'You now have unlimited access to all premium features.',
        [
          {
            text: 'Start Exploring',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('[Paywall] Purchase error:', error);
      if (error.userCancelled) {
        // User cancelled - no action needed
        return;
      }
      Alert.alert('Purchase Failed', error.message || 'Something went wrong. Please try again.');
    }
  };

  const handleRestore = async () => {
    try {
      const restored = await restorePurchases();
      
      if (restored) {
        Alert.alert(
          'Purchases Restored',
          'Your premium subscription has been restored.',
          [{ text: 'Great!', onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any previous purchases to restore.'
        );
      }
    } catch (error: any) {
      console.error('[Paywall] Restore error:', error);
      Alert.alert('Restore Failed', error.message || 'Something went wrong. Please try again.');
    }
  };

  const handleClose = () => {
    router.back();
  };

  const getMonthlyEquivalent = (pkg: PurchasesPackage): string | null => {
    if (pkg.identifier === 'annual' || pkg.identifier === '$rc_annual') {
      const yearlyPrice = pkg.product.price;
      const monthly = yearlyPrice / 12;
      return monthly.toFixed(2);
    }
    return null;
  };

  const getSavingsPercent = (): number | null => {
    if (monthlyPackage && annualPackage) {
      const monthlyYearly = monthlyPackage.product.price * 12;
      const annualPrice = annualPackage.product.price;
      const savings = Math.round((1 - annualPrice / monthlyYearly) * 100);
      return savings > 0 ? savings : null;
    }
    return null;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const savingsPercent = getSavingsPercent();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={handleClose}
        activeOpacity={0.7}
      >
        <X size={24} color={Colors.textLight} />
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Crown size={40} color="#1A1A1A" />
          </LinearGradient>
          
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>
            Unlock unlimited activity suggestions and exclusive features
          </Text>
        </View>

        <View style={styles.benefitsContainer}>
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <View key={index} style={styles.benefitItem}>
                <View style={styles.benefitIconContainer}>
                  <IconComponent size={20} color={benefit.color} />
                </View>
                <Text style={styles.benefitText}>{benefit.text}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.pricingContainer}>
          {annualPackage && (
            <TouchableOpacity
              style={[
                styles.pricingCard,
                selectedPackage?.identifier === annualPackage.identifier && styles.pricingCardSelected,
              ]}
              onPress={() => setSelectedPackage(annualPackage)}
              activeOpacity={0.7}
            >
              {savingsPercent && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>Save {savingsPercent}%</Text>
                </View>
              )}
              <View style={styles.pricingHeader}>
                <Text style={styles.pricingName}>Yearly</Text>
                <View style={styles.checkContainer}>
                  {selectedPackage?.identifier === annualPackage.identifier && (
                    <LinearGradient
                      colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                      style={styles.checkGradient}
                    >
                      <Check size={16} color="#1A1A1A" />
                    </LinearGradient>
                  )}
                </View>
              </View>
              <View style={styles.pricingPriceRow}>
                <Text style={styles.pricingPrice}>{annualPackage.product.priceString}</Text>
                <Text style={styles.pricingInterval}>/year</Text>
              </View>
              <Text style={styles.pricingNote}>
                Just ${getMonthlyEquivalent(annualPackage)}/month
              </Text>
            </TouchableOpacity>
          )}

          {monthlyPackage && (
            <TouchableOpacity
              style={[
                styles.pricingCard,
                selectedPackage?.identifier === monthlyPackage.identifier && styles.pricingCardSelected,
              ]}
              onPress={() => setSelectedPackage(monthlyPackage)}
              activeOpacity={0.7}
            >
              <View style={styles.pricingHeader}>
                <Text style={styles.pricingName}>Monthly</Text>
                <View style={styles.checkContainer}>
                  {selectedPackage?.identifier === monthlyPackage.identifier && (
                    <LinearGradient
                      colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                      style={styles.checkGradient}
                    >
                      <Check size={16} color="#1A1A1A" />
                    </LinearGradient>
                  )}
                </View>
              </View>
              <View style={styles.pricingPriceRow}>
                <Text style={styles.pricingPrice}>{monthlyPackage.product.priceString}</Text>
                <Text style={styles.pricingInterval}>/month</Text>
              </View>
              <Text style={styles.pricingNote}>Billed monthly</Text>
            </TouchableOpacity>
          )}

          {packages.length === 0 && (
            <View style={styles.noPackagesContainer}>
              <Text style={styles.noPackagesText}>
                No subscription plans available at this time.
              </Text>
            </View>
          )}
        </View>

        {packages.length > 0 && (
          <TouchableOpacity
            style={[styles.purchaseButton, (isPurchasing || !selectedPackage) && styles.purchaseButtonDisabled]}
            onPress={handlePurchase}
            disabled={isPurchasing || !selectedPackage}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.purchaseGradient}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color="#1A1A1A" />
              ) : (
                <Text style={styles.purchaseButtonText}>Continue</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isRestoring}
          activeOpacity={0.7}
        >
          <Text style={styles.restoreButtonText}>
            {isRestoring ? 'Restoring...' : 'Restore Purchases'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period.
          </Text>
          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('https://scratchandgo.app/terms')}>
              <Text style={styles.legalLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>•</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://scratchandgo.app/privacy')}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: Spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.regular,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  benefitsContainer: {
    marginBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  benefitIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: Typography.sizes.body,
    color: Colors.text,
    fontWeight: Typography.weights.regular,
    lineHeight: 22,
  },
  pricingContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  pricingCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: '#262626',
    position: 'relative',
  },
  pricingCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 107, 157, 0.05)',
  },
  discountBadge: {
    position: 'absolute',
    top: -12,
    right: Spacing.lg,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  discountText: {
    fontSize: Typography.sizes.small,
    fontWeight: Typography.weights.regular,
    color: '#1A1A1A',
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  pricingName: {
    fontSize: Typography.sizes.h3,
    fontWeight: Typography.weights.regular,
    color: Colors.text,
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  pricingPrice: {
    fontSize: 36,
    fontWeight: Typography.weights.regular,
    color: Colors.text,
  },
  pricingInterval: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    marginLeft: 4,
  },
  pricingNote: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
  },
  noPackagesContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  noPackagesText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
  },
  purchaseButton: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonText: {
    fontSize: Typography.sizes.h3,
    fontWeight: Typography.weights.regular,
    color: '#1A1A1A',
  },
  restoreButton: {
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  restoreButtonText: {
    fontSize: Typography.sizes.body,
    color: Colors.primary,
    fontWeight: Typography.weights.regular,
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  footerText: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legalLink: {
    fontSize: Typography.sizes.small,
    color: Colors.primary,
    fontWeight: Typography.weights.regular,
  },
  legalSeparator: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },
});
