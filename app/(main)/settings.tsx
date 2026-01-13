import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings as SettingsIcon, User, Heart, Crown, RefreshCw, Edit, Shield, FileText, LogOut } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { RELIGIONS } from '@/types/preferences';

const MODE_KEY = 'scratch_and_go_mode';

type Mode = 'couples' | 'family';

export default function SettingsScreen() {
  const router = useRouter();
  const { preferences, updatePreferences } = usePreferences();
  const { isPremium, isTrial, getTrialDaysRemaining, getSubscriptionEndDate, restorePurchases } = useSubscription();
  const { user, logout, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<Mode>('couples');
  const [showReligionPicker, setShowReligionPicker] = useState(false);

  useEffect(() => {
    loadMode();
  }, []);

  const loadMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(MODE_KEY);
      if (savedMode) {
        setMode(savedMode as Mode);
      }
    } catch (error) {
      console.error('Error loading mode:', error);
      // Continue with default mode if loading fails
    }
  };

  const handleModeChange = async (newMode: Mode) => {
    try {
      await AsyncStorage.setItem(MODE_KEY, newMode);
      setMode(newMode);
      Alert.alert('Mode Updated', `Switched to ${newMode === 'couples' ? 'Couples' : 'Family'} mode`);
    } catch (error) {
      console.error('Error saving mode:', error);
      Alert.alert('Error', 'Failed to save mode. Please try again.');
    }
  };

  const handleToggle = async (key: keyof typeof preferences, value: boolean) => {
    if (key === 'includeReligious' && value && !preferences.religion) {
      setShowReligionPicker(true);
    } else if (key === 'includeReligious' && !value) {
      await updatePreferences({ [key]: value, religion: undefined });
    } else {
      await updatePreferences({ [key]: value });
    }
  };

  const handleReligionSelect = async (religionId: string) => {
    await updatePreferences({ religion: religionId, includeReligious: true });
    setShowReligionPicker(false);
  };

  const getSelectedReligionLabel = () => {
    if (!preferences.religion) return 'Not selected';
    const religion = RELIGIONS.find(r => r.id === preferences.religion);
    return religion?.label || 'Not selected';
  };

  const handleUpgradeToPremium = () => {
    router.push('/paywall' as any);
  };

  const handleManageSubscription = () => {
    const message = Platform.select({
      ios: 'To manage your subscription, open the App Store, tap your profile icon, then tap Subscriptions.',
      android: 'To manage your subscription, open the Google Play Store, tap Menu → Subscriptions.',
      default: 'Subscription management is available through the app store on mobile devices.',
    });
    
    Alert.alert('Manage Subscription', message, [
      { text: 'OK', style: 'default' },
      Platform.OS === 'ios' ? {
        text: 'Open App Store',
        onPress: () => Linking.openURL('itms-apps://apps.apple.com/account/subscriptions'),
      } : Platform.OS === 'android' ? {
        text: 'Open Play Store',
        onPress: () => Linking.openURL('https://play.google.com/store/account/subscriptions'),
      } : undefined,
    ].filter(Boolean) as any);
  };

  const handleRestorePurchases = async () => {
    try {
      Alert.alert(
        'Restore Purchases',
        'Checking for previous purchases...',
        [{ text: 'Cancel', style: 'cancel' }]
      );
      
      const restored = await restorePurchases();
      
      if (restored) {
        Alert.alert('Success', 'Your purchases have been restored!');
      } else {
        Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases to restore.');
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    }
  };

  const handleResetPreferences = () => {
    Alert.alert(
      'Reset Preferences',
      'This will clear your content preferences and you can set them up again. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await updatePreferences({
              includeAlcohol: false,
              includeReligious: false,
              includeKidFriendly: true,
              includeOutdoorAdventures: true,
              includeArtsAndCulture: true,
              includeLiveEntertainment: true,
              religion: undefined,
            });
            Alert.alert('Preferences Reset', 'Your content preferences have been reset to defaults.');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You can sign back in anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigate to welcome screen after logout
              router.replace('/welcome' as any);
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatSubscriptionEndDate = () => {
    const endDate = getSubscriptionEndDate();
    if (!endDate) return null;
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return endDate.toLocaleDateString(undefined, options);
  };

  const getSubscriptionStatusText = () => {
    if (isTrial) {
      const daysRemaining = getTrialDaysRemaining();
      return `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining in trial`;
    }
    if (isPremium) {
      const endDate = formatSubscriptionEndDate();
      if (endDate) {
        return `Active • Renews ${endDate}`;
      }
      return 'Active';
    }
    return '3 free scratches per month';
  };

  const getSubscriptionTierLabel = () => {
    if (isTrial) return 'Premium Trial';
    if (isPremium) return 'Premium';
    return 'Free';
  };

  if (showReligionPicker) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ 
          headerShown: true,
          title: 'Select Religion',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '400' as const },
        }} />
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.pickerTitle}>What is your religion?</Text>
          <Text style={styles.pickerDescription}>
            This helps us suggest relevant faith-based activities
          </Text>
          
          <View style={styles.religionList}>
            {RELIGIONS.map((religion) => (
              <TouchableOpacity
                key={religion.id}
                style={[
                  styles.religionOption,
                  preferences.religion === religion.id && styles.religionOptionSelected
                ]}
                onPress={() => handleReligionSelect(religion.id)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.religionOptionText,
                  preferences.religion === religion.id && styles.religionOptionTextSelected
                ]}>
                  {religion.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Settings',
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '400' as const },
      }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Crown size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Subscription</Text>
          </View>
          
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionTier}>{getSubscriptionTierLabel()}</Text>
                {(isPremium || isTrial) && (
                  <View style={styles.premiumBadge}>
                    <LinearGradient
                      colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.premiumBadgeGradient}
                    >
                      <Crown size={12} color="#1A1A1A" />
                      <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                    </LinearGradient>
                  </View>
                )}
              </View>
            </View>
            
            <Text style={styles.subscriptionStatus}>{getSubscriptionStatusText()}</Text>
            
            <View style={styles.subscriptionActions}>
              {!isPremium && !isTrial ? (
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={handleUpgradeToPremium}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.upgradeButtonGradient}
                  >
                    <Crown size={18} color="#1A1A1A" />
                    <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.manageButton}
                  onPress={handleManageSubscription}
                  activeOpacity={0.7}
                >
                  <Text style={styles.manageButtonText}>Manage Subscription</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={handleRestorePurchases}
                activeOpacity={0.7}
              >
                <RefreshCw size={16} color={Colors.textLight} />
                <Text style={styles.restoreButtonText}>Restore Purchases</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Mode</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Choose between date night ideas or family activities
          </Text>
          
          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'couples' && styles.modeButtonActive]}
              onPress={() => handleModeChange('couples')}
              activeOpacity={0.7}
            >
              {mode === 'couples' ? (
                <LinearGradient
                  colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modeGradient}
                >
                  <Heart size={20} color="#1A1A1A" />
                  <Text style={styles.modeButtonTextActive}>Couples</Text>
                </LinearGradient>
              ) : (
                <>
                  <Heart size={20} color={Colors.textLight} />
                  <Text style={styles.modeButtonText}>Couples</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modeButton, mode === 'family' && styles.modeButtonActive]}
              onPress={() => handleModeChange('family')}
              activeOpacity={0.7}
            >
              {mode === 'family' ? (
                <LinearGradient
                  colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modeGradient}
                >
                  <User size={20} color="#1A1A1A" />
                  <Text style={styles.modeButtonTextActive}>Family</Text>
                </LinearGradient>
              ) : (
                <>
                  <User size={20} color={Colors.textLight} />
                  <Text style={styles.modeButtonText}>Family</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SettingsIcon size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Content Preferences</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Customize what types of activities you&apos;d like to see
          </Text>

          <View style={styles.preferencesList}>
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Alcohol Activities</Text>
                <Text style={styles.preferenceDescription}>
                  Bars, breweries, wine tastings
                </Text>
              </View>
              <Switch
                value={preferences.includeAlcohol}
                onValueChange={(value) => handleToggle('includeAlcohol', value)}
                trackColor={{ false: '#3A3A3A', true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <View style={styles.preferenceHeader}>
                  <Text style={styles.preferenceTitle}>Religious Activities</Text>
                  {preferences.includeReligious && (
                    <TouchableOpacity
                      onPress={() => setShowReligionPicker(true)}
                      style={styles.editButton}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.preferenceDescription}>
                  {preferences.includeReligious 
                    ? `Churches, temples, faith events • ${getSelectedReligionLabel()}`
                    : 'Churches, temples, faith events'
                  }
                </Text>
              </View>
              <Switch
                value={preferences.includeReligious}
                onValueChange={(value) => handleToggle('includeReligious', value)}
                trackColor={{ false: '#3A3A3A', true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Kid-Friendly Activities</Text>
                <Text style={styles.preferenceDescription}>
                  Playgrounds, family parks, kid-friendly museums
                </Text>
              </View>
              <Switch
                value={preferences.includeKidFriendly}
                onValueChange={(value) => handleToggle('includeKidFriendly', value)}
                trackColor={{ false: '#3A3A3A', true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Outdoor Adventures</Text>
                <Text style={styles.preferenceDescription}>
                  Hiking trails, nature walks, beaches, parks
                </Text>
              </View>
              <Switch
                value={preferences.includeOutdoorAdventures}
                onValueChange={(value) => handleToggle('includeOutdoorAdventures', value)}
                trackColor={{ false: '#3A3A3A', true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Arts & Culture</Text>
                <Text style={styles.preferenceDescription}>
                  Museums, galleries, theaters, cultural experiences
                </Text>
              </View>
              <Switch
                value={preferences.includeArtsAndCulture}
                onValueChange={(value) => handleToggle('includeArtsAndCulture', value)}
                trackColor={{ false: '#3A3A3A', true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Live Entertainment</Text>
                <Text style={styles.preferenceDescription}>
                  Concerts, live music, comedy shows, performances
                </Text>
              </View>
              <Switch
                value={preferences.includeLiveEntertainment}
                onValueChange={(value) => handleToggle('includeLiveEntertainment', value)}
                trackColor={{ false: '#3A3A3A', true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Edit size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Manage Preferences</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Reset your content preferences to start fresh
          </Text>
          
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetPreferences}
            activeOpacity={0.7}
          >
            <RefreshCw size={18} color={Colors.text} />
            <Text style={styles.resetButtonText}>Reset All Preferences</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Legal & Privacy</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Review our policies and terms
          </Text>
          
          <View style={styles.legalLinks}>
            <TouchableOpacity
              style={styles.legalButton}
              onPress={() => Linking.openURL('https://scratchandgo.app/privacy')}
              activeOpacity={0.7}
            >
              <Shield size={18} color={Colors.textLight} />
              <Text style={styles.legalButtonText}>Privacy Policy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.legalButton}
              onPress={() => Linking.openURL('https://scratchandgo.app/terms')}
              activeOpacity={0.7}
            >
              <FileText size={18} color={Colors.textLight} />
              <Text style={styles.legalButtonText}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {isAuthenticated && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <User size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Account</Text>
              </View>
              <Text style={styles.sectionDescription}>
                {user?.email ? `Signed in as ${user.email}` : 'Manage your account'}
              </Text>
              
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <LogOut size={18} color={Colors.error || '#FF4444'} />
                <Text style={styles.logoutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />
          </>
        )}

        <View style={styles.section}>
          <Text style={styles.footerNote}>
            These settings help personalize your activity suggestions. Changes take effect immediately.
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: '400' as const,
    color: Colors.text,
  },
  sectionDescription: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#262626',
    marginVertical: Spacing.lg,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modeButton: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.large,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  modeButtonActive: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  modeGradient: {
    width: '100%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  modeButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.textLight,
  },
  modeButtonTextActive: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: '#1A1A1A',
  },
  preferencesList: {
    gap: Spacing.lg,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: '#262626',
  },
  preferenceInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  preferenceTitle: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    lineHeight: 18,
  },
  editButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  editButtonText: {
    fontSize: Typography.sizes.small,
    color: Colors.primary,
    fontWeight: '400' as const,
  },
  footerNote: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  pickerTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '400' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  pickerDescription: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  religionList: {
    gap: Spacing.md,
  },
  religionOption: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.medium,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  religionOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
  },
  religionOptionText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  religionOptionTextSelected: {
    color: Colors.primary,
  },
  subscriptionCard: {
    padding: Spacing.lg,
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: '#262626',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  subscriptionTier: {
    fontSize: Typography.sizes.h3,
    fontWeight: '400' as const,
    color: Colors.text,
  },
  premiumBadge: {
    borderRadius: BorderRadius.small,
    overflow: 'hidden',
  },
  premiumBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  premiumBadgeText: {
    fontSize: Typography.sizes.small,
    fontWeight: '400' as const,
    color: '#1A1A1A',
  },
  subscriptionStatus: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    marginBottom: Spacing.lg,
  },
  subscriptionActions: {
    gap: Spacing.md,
  },
  upgradeButton: {
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  upgradeButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: '#1A1A1A',
  },
  manageButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.medium,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.primary,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  restoreButtonText: {
    fontSize: Typography.sizes.caption,
    fontWeight: '400' as const,
    color: Colors.textLight,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.medium,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  resetButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.medium,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    marginTop: Spacing.md,
  },
  logoutButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.error || '#FF4444',
  },
  legalLinks: {
    gap: Spacing.md,
  },
  legalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.medium,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#262626',
  },
  legalButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.text,
  },
  versionText: {
    fontSize: Typography.sizes.small,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
