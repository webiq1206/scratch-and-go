import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Crown, 
  Heart, 
  Users, 
  Settings as SettingsIcon, 
  RefreshCw, 
  Shield, 
  FileText, 
  LogOut, 
  ChevronRight,
  Wine,
  Church,
  Baby,
  TreePine,
  Palette,
  Music,
  Sparkles
} from 'lucide-react-native';
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
  const [isRestoring, setIsRestoring] = useState(false);

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
    }
  };

  const handleModeChange = async (newMode: Mode) => {
    try {
      await AsyncStorage.setItem(MODE_KEY, newMode);
      setMode(newMode);
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
      ios: 'To manage your subscription, open the Settings app, tap your Apple ID, then Subscriptions.',
      android: 'To manage your subscription, open the Google Play Store, tap Menu, then Subscriptions.',
      default: 'Subscription management is available through the app store on mobile devices.',
    });
    
    Alert.alert('Manage Subscription', message, [
      { text: 'OK', style: 'default' },
      Platform.OS === 'ios' ? {
        text: 'Open Settings',
        onPress: () => Linking.openURL('App-Prefs:root=STORE'),
      } : Platform.OS === 'android' ? {
        text: 'Open Play Store',
        onPress: () => Linking.openURL('https://play.google.com/store/account/subscriptions'),
      } : undefined,
    ].filter(Boolean) as any);
  };

  const handleRestorePurchases = async () => {
    if (isRestoring) return;
    
    setIsRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        Alert.alert('Success', 'Your purchases have been restored!');
      } else {
        Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases to restore.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleResetPreferences = () => {
    Alert.alert(
      'Reset Preferences',
      'This will reset all content preferences to defaults. Continue?',
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
            Alert.alert('Done', 'Preferences have been reset.');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/welcome' as any);
            } catch (error) {
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
    return endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getSubscriptionStatusText = () => {
    if (isTrial) {
      const daysRemaining = getTrialDaysRemaining();
      return `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left in trial`;
    }
    if (isPremium) {
      const endDate = formatSubscriptionEndDate();
      return endDate ? `Renews ${endDate}` : 'Active';
    }
    return '3 free scratches per month';
  };

  // Religion Picker Screen
  if (showReligionPicker) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ 
          headerShown: true,
          title: 'Select Religion',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '500' as const },
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
                {preferences.religion === religion.id && (
                  <View style={styles.religionCheck} />
                )}
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
        headerTitleStyle: { fontWeight: '500' as const },
      }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Subscription Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Crown size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Subscription</Text>
          </View>
          
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionRow}>
              <View>
                <Text style={styles.subscriptionTier}>
                  {isTrial ? 'Premium Trial' : isPremium ? 'Premium' : 'Free'}
                </Text>
                <Text style={styles.subscriptionStatus}>{getSubscriptionStatusText()}</Text>
              </View>
              {(isPremium || isTrial) && (
                <View style={styles.premiumBadge}>
                  <Crown size={12} color={Colors.backgroundDark} />
                  <Text style={styles.premiumBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            
            <View style={styles.subscriptionActions}>
              {!isPremium && !isTrial ? (
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={handleUpgradeToPremium}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.upgradeButtonGradient}
                  >
                    <Sparkles size={16} color={Colors.backgroundDark} />
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
                disabled={isRestoring}
                activeOpacity={0.7}
              >
                <RefreshCw size={14} color={Colors.textMuted} />
                <Text style={styles.restoreButtonText}>
                  {isRestoring ? 'Restoring...' : 'Restore Purchases'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Mode Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SettingsIcon size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Mode</Text>
          </View>
          
          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'couples' && styles.modeButtonActive]}
              onPress={() => handleModeChange('couples')}
              activeOpacity={0.7}
            >
              <Heart size={20} color={mode === 'couples' ? Colors.primary : Colors.textLight} />
              <Text style={[styles.modeButtonText, mode === 'couples' && styles.modeButtonTextActive]}>
                Couples
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modeButton, mode === 'family' && styles.modeButtonActive]}
              onPress={() => handleModeChange('family')}
              activeOpacity={0.7}
            >
              <Users size={20} color={mode === 'family' ? Colors.primary : Colors.textLight} />
              <Text style={[styles.modeButtonText, mode === 'family' && styles.modeButtonTextActive]}>
                Family
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Content Preferences</Text>
          </View>

          <View style={styles.preferencesList}>
            <PreferenceToggle
              icon={<Wine size={18} color={Colors.textLight} />}
              title="Alcohol Activities"
              description="Bars, breweries, wine tastings"
              value={preferences.includeAlcohol}
              onToggle={(value) => handleToggle('includeAlcohol', value)}
            />

            <PreferenceToggle
              icon={<Church size={18} color={Colors.textLight} />}
              title="Religious Activities"
              description={preferences.includeReligious ? `Faith events - ${getSelectedReligionLabel()}` : 'Churches, temples, faith events'}
              value={preferences.includeReligious}
              onToggle={(value) => handleToggle('includeReligious', value)}
              onEdit={preferences.includeReligious ? () => setShowReligionPicker(true) : undefined}
            />

            <PreferenceToggle
              icon={<Baby size={18} color={Colors.textLight} />}
              title="Kid-Friendly"
              description="Playgrounds, family parks, museums"
              value={preferences.includeKidFriendly}
              onToggle={(value) => handleToggle('includeKidFriendly', value)}
            />

            <PreferenceToggle
              icon={<TreePine size={18} color={Colors.textLight} />}
              title="Outdoor Adventures"
              description="Hiking, nature walks, beaches"
              value={preferences.includeOutdoorAdventures}
              onToggle={(value) => handleToggle('includeOutdoorAdventures', value)}
            />

            <PreferenceToggle
              icon={<Palette size={18} color={Colors.textLight} />}
              title="Arts & Culture"
              description="Museums, galleries, theaters"
              value={preferences.includeArtsAndCulture}
              onToggle={(value) => handleToggle('includeArtsAndCulture', value)}
            />

            <PreferenceToggle
              icon={<Music size={18} color={Colors.textLight} />}
              title="Live Entertainment"
              description="Concerts, comedy shows, performances"
              value={preferences.includeLiveEntertainment}
              onToggle={(value) => handleToggle('includeLiveEntertainment', value)}
            />
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Legal</Text>
          </View>
          
          <View style={styles.legalLinks}>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push('/privacy-policy' as any)}
              activeOpacity={0.7}
            >
              <Shield size={18} color={Colors.textLight} />
              <Text style={styles.linkButtonText}>Privacy Policy</Text>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push('/terms-of-service' as any)}
              activeOpacity={0.7}
            >
              <FileText size={18} color={Colors.textLight} />
              <Text style={styles.linkButtonText}>Terms of Service</Text>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        {isAuthenticated && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Account</Text>
            </View>
            
            {user?.email && (
              <Text style={styles.accountEmail}>{user.email}</Text>
            )}
            
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <LogOut size={18} color={Colors.error} />
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reset Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetPreferences}
            activeOpacity={0.7}
          >
            <RefreshCw size={16} color={Colors.textMuted} />
            <Text style={styles.resetButtonText}>Reset All Preferences</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

interface PreferenceToggleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  onEdit?: () => void;
}

function PreferenceToggle({ icon, title, description, value, onToggle, onEdit }: PreferenceToggleProps) {
  return (
    <View style={styles.preferenceItem}>
      <View style={styles.preferenceIcon}>{icon}</View>
      <View style={styles.preferenceInfo}>
        <View style={styles.preferenceHeader}>
          <Text style={styles.preferenceTitle}>{title}</Text>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} activeOpacity={0.7}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.preferenceDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.backgroundLight, true: Colors.primary }}
        thumbColor={Colors.white}
      />
    </View>
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
    paddingBottom: Spacing.xxxl,
  },
  
  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.body,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  
  // Subscription
  subscriptionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  subscriptionTier: {
    fontSize: Typography.sizes.h3,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subscriptionStatus: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  premiumBadgeText: {
    fontSize: Typography.sizes.tiny,
    fontWeight: '600' as const,
    color: Colors.backgroundDark,
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
    paddingVertical: Spacing.md,
  },
  upgradeButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '600' as const,
    color: Colors.backgroundDark,
  },
  manageButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: Typography.sizes.body,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  restoreButtonText: {
    fontSize: Typography.sizes.small,
    color: Colors.textMuted,
  },
  
  // Mode
  modeContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  modeButtonText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
  },
  modeButtonTextActive: {
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  
  // Preferences
  preferencesList: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  preferenceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  preferenceTitle: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
  },
  preferenceDescription: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },
  editButton: {
    fontSize: Typography.sizes.small,
    color: Colors.primary,
  },
  
  // Legal
  legalLinks: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: Spacing.md,
  },
  linkButtonText: {
    flex: 1,
    fontSize: Typography.sizes.body,
    color: Colors.text,
  },
  
  // Account
  accountEmail: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    marginBottom: Spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.errorMuted,
    borderRadius: BorderRadius.medium,
  },
  logoutButtonText: {
    fontSize: Typography.sizes.body,
    color: Colors.error,
    fontWeight: '500' as const,
  },
  
  // Reset
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  resetButtonText: {
    fontSize: Typography.sizes.small,
    color: Colors.textMuted,
  },
  
  // Version
  versionText: {
    fontSize: Typography.sizes.small,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  
  // Religion Picker
  pickerTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  pickerDescription: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  religionList: {
    gap: Spacing.sm,
  },
  religionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  religionOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  religionOptionText: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
  },
  religionOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  religionCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
});
