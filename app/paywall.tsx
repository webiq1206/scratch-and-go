import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Sparkles, Zap, Star, Crown, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';

export default function PaywallScreen() {
  const router = useRouter();
  const { activatePremium, restorePurchases } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const benefits = [
    { icon: Zap, text: 'Unlimited scratches every month', color: Colors.accent },
    { icon: Star, text: 'Exclusive premium activity categories', color: Colors.accent },
    { icon: Sparkles, text: 'Priority support from our team', color: Colors.accent },
    { icon: Crown, text: '100% ad-free experience', color: Colors.accent },
  ];

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await activatePremium(selectedPlan);
      
      Alert.alert(
        '🎉 Welcome to Premium!',
        'You now have unlimited access to all premium features.',
        [
          {
            text: 'Start Exploring',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Restore Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const monthlyPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'monthly')!;
  const yearlyPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'yearly')!;

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
          <TouchableOpacity
            style={[
              styles.pricingCard,
              selectedPlan === 'yearly' && styles.pricingCardSelected,
            ]}
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.7}
          >
            {yearlyPlan.discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>Save {yearlyPlan.discount}%</Text>
              </View>
            )}
            <View style={styles.pricingHeader}>
              <Text style={styles.pricingName}>{yearlyPlan.name}</Text>
              <View style={styles.checkContainer}>
                {selectedPlan === 'yearly' && (
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
              <Text style={styles.pricingPrice}>${yearlyPlan.price}</Text>
              <Text style={styles.pricingInterval}>/year</Text>
            </View>
            <Text style={styles.pricingNote}>
              Just ${(yearlyPlan.price / 12).toFixed(2)}/month
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pricingCard,
              selectedPlan === 'monthly' && styles.pricingCardSelected,
            ]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.7}
          >
            <View style={styles.pricingHeader}>
              <Text style={styles.pricingName}>{monthlyPlan.name}</Text>
              <View style={styles.checkContainer}>
                {selectedPlan === 'monthly' && (
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
              <Text style={styles.pricingPrice}>${monthlyPlan.price}</Text>
              <Text style={styles.pricingInterval}>/month</Text>
            </View>
            <Text style={styles.pricingNote}>Billed monthly</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.purchaseButton}
          onPress={handlePurchase}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.purchaseGradient}
          >
            <Text style={styles.purchaseButtonText}>
              {isProcessing ? 'Processing...' : 'Continue'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

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
            <TouchableOpacity onPress={() => console.log('Terms pressed')}>
              <Text style={styles.legalLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>•</Text>
            <TouchableOpacity onPress={() => console.log('Privacy pressed')}>
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
  purchaseButton: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
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
