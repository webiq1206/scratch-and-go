import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Linking, Platform, TextInput, Modal, Pressable } from 'react-native';
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
  Sparkles,
  User,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Camera
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { useMemoryBook } from '@/contexts/MemoryBookContext';
import { RELIGIONS, FamilyMember, GroupType } from '@/types/preferences';
import PolaroidFrame from '@/components/ui/PolaroidFrame';

const MODE_KEY = 'scratch_and_go_mode';

type Mode = 'couples' | 'family';

// Mode-specific content
const getModeContent = (mode: Mode) => ({
  couples: {
    modeLabel: 'For two',
    modeDescription: 'Perfect for romantic adventures',
    personalizationTitle: 'Your Names',
    personalizationDescription: 'Add your names for a more personalized date experience',
  },
  family: {
    modeLabel: 'For everyone',
    modeDescription: 'Fun for the whole family',
    personalizationTitle: 'Your Family',
    personalizationDescription: 'Add your family details for personalized activity suggestions',
  },
});

export default function SettingsScreen() {
  const router = useRouter();
  const { 
    preferences, 
    updatePreferences,
    getPersonalization,
    updatePersonalization,
    setCoupleNames,
    setFamilyLastName,
    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember,
    getDisplayName
  } = usePreferences();
  const { isPremium, isTrial, getTrialDaysRemaining, getSubscriptionEndDate, restorePurchases } = useSubscription();
  const { user, logout, isAuthenticated } = useAuth();
  const { alert, showSuccess, showError, showInfo } = useAlert();
  const { getCompletedActivities } = useMemoryBook();
  const [mode, setMode] = useState<Mode>('couples');
  const [showReligionPicker, setShowReligionPicker] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  // Get user photos for decorative element
  const userPhotos = useMemo(() => {
    const completed = getCompletedActivities();
    return completed
      .filter(a => a.photos && a.photos.length > 0)
      .flatMap(a => a.photos!)
      .slice(0, 2);
  }, [getCompletedActivities]);
  
  const content = getModeContent(mode)[mode];
  
  // Personalization state
  const [partner1Name, setPartner1Name] = useState('');
  const [partner2Name, setPartner2Name] = useState('');
  const [familyLastName, setFamilyLastNameLocal] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAge, setNewMemberAge] = useState('');

  useEffect(() => {
    loadMode();
    loadPersonalization();
  }, []);

  const loadPersonalization = () => {
    const personalization = getPersonalization();
    if (personalization) {
      if (personalization.coupleNames) {
        setPartner1Name(personalization.coupleNames.partner1 || '');
        setPartner2Name(personalization.coupleNames.partner2 || '');
      }
      if (personalization.familyLastName) {
        setFamilyLastNameLocal(personalization.familyLastName);
      }
    }
  };

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
      // Also update personalization groupType
      await updatePersonalization({ groupType: newMode as GroupType });
    } catch (error) {
      console.error('Error saving mode:', error);
      showError('Error', 'Failed to save mode. Please try again.');
    }
  };

  const handleSaveCoupleNames = async () => {
    if (!partner1Name.trim() && !partner2Name.trim()) {
      return; // Don't save empty names
    }
    try {
      await setCoupleNames({
        partner1: partner1Name.trim(),
        partner2: partner2Name.trim(),
      });
      showSuccess('Saved', 'Names saved successfully!');
    } catch (error) {
      showError('Error', 'Failed to save names. Please try again.');
    }
  };

  const handleSaveFamilyName = async () => {
    if (!familyLastName.trim()) {
      return;
    }
    try {
      await setFamilyLastName(familyLastName.trim());
      showSuccess('Saved', 'Family name saved successfully!');
    } catch (error) {
      showError('Error', 'Failed to save family name. Please try again.');
    }
  };

  const handleAddFamilyMember = async () => {
    const name = newMemberName.trim();
    const age = parseInt(newMemberAge, 10);
    
    if (!name) {
      showError('Error', 'Please enter a name.');
      return;
    }
    if (isNaN(age) || age < 0 || age > 120) {
      showError('Error', 'Please enter a valid age.');
      return;
    }

    try {
      await addFamilyMember({ name, age });
      setNewMemberName('');
      setNewMemberAge('');
      setShowAddMemberModal(false);
      showSuccess('Added', `${name} has been added to the family!`);
    } catch (error) {
      showError('Error', 'Failed to add family member. Please try again.');
    }
  };

  const handleEditFamilyMember = async () => {
    if (!editingMember) return;
    
    const name = newMemberName.trim();
    const age = parseInt(newMemberAge, 10);
    
    if (!name) {
      showError('Error', 'Please enter a name.');
      return;
    }
    if (isNaN(age) || age < 0 || age > 120) {
      showError('Error', 'Please enter a valid age.');
      return;
    }

    try {
      await updateFamilyMember(editingMember.id, { name, age });
      setEditingMember(null);
      setNewMemberName('');
      setNewMemberAge('');
      setShowEditMemberModal(false);
      showSuccess('Updated', `${name}'s information has been updated!`);
    } catch (error) {
      showError('Error', 'Failed to update family member. Please try again.');
    }
  };

  const handleRemoveFamilyMember = (member: FamilyMember) => {
    alert(
      'Remove Family Member',
      `Are you sure you want to remove ${member.name} from your family?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFamilyMember(member.id);
              showSuccess('Removed', `${member.name} has been removed.`);
            } catch (error) {
              showError('Error', 'Failed to remove family member.');
            }
          },
        },
      ],
      'warning'
    );
  };

  const openEditMemberModal = (member: FamilyMember) => {
    setEditingMember(member);
    setNewMemberName(member.name);
    setNewMemberAge(member.age.toString());
    setShowEditMemberModal(true);
  };

  const familyMembers = preferences.personalization?.familyMembers || [];

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
    
    alert('Manage Subscription', message, [
      { text: 'OK', style: 'default' },
      Platform.OS === 'ios' ? {
        text: 'Open Settings',
        onPress: () => Linking.openURL('App-Prefs:root=STORE'),
      } : Platform.OS === 'android' ? {
        text: 'Open Play Store',
        onPress: () => Linking.openURL('https://play.google.com/store/account/subscriptions'),
      } : undefined,
    ].filter(Boolean) as any, 'info');
  };

  const handleRestorePurchases = async () => {
    if (isRestoring) return;
    
    setIsRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        showSuccess('Success', 'Your purchases have been restored!');
      } else {
        showInfo('No Purchases Found', 'We couldn\'t find any previous purchases to restore.');
      }
    } catch (error) {
      showError('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleResetPreferences = () => {
    alert(
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
            showSuccess('Done', 'Preferences have been reset.');
          },
        },
      ],
      'warning'
    );
  };

  const handleLogout = () => {
    alert(
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
              showError('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ],
      'warning'
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
                  <Crown size={12} color={Colors.white} />
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

        {/* Mode Section - Enhanced */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            {mode === 'couples' ? (
              <Heart size={18} color={Colors.primary} fill={Colors.primary} />
            ) : (
              <Users size={18} color={Colors.primary} />
            )}
            <Text style={styles.sectionTitle}>Mode</Text>
          </View>
          
          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'couples' && styles.modeButtonActive]}
              onPress={() => handleModeChange('couples')}
              activeOpacity={0.7}
            >
              <View style={styles.modeIconContainer}>
                <Heart size={24} color={mode === 'couples' ? Colors.primary : Colors.textLight} fill={mode === 'couples' ? Colors.primary : 'none'} />
              </View>
              <View style={styles.modeTextContainer}>
                <Text style={[styles.modeButtonText, mode === 'couples' && styles.modeButtonTextActive]}>
                  Couples
                </Text>
                <Text style={styles.modeDescription}>
                  {getModeContent('couples').modeDescription}
                </Text>
              </View>
              {mode === 'couples' && (
                <View style={styles.modeCheckmark}>
                  <Check size={14} color={Colors.backgroundDark} />
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modeButton, mode === 'family' && styles.modeButtonActive]}
              onPress={() => handleModeChange('family')}
              activeOpacity={0.7}
            >
              <View style={styles.modeIconContainer}>
                <Users size={24} color={mode === 'family' ? Colors.primary : Colors.textLight} />
              </View>
              <View style={styles.modeTextContainer}>
                <Text style={[styles.modeButtonText, mode === 'family' && styles.modeButtonTextActive]}>
                  Family
                </Text>
                <Text style={styles.modeDescription}>
                  {getModeContent('family').modeDescription}
                </Text>
              </View>
              {mode === 'family' && (
                <View style={styles.modeCheckmark}>
                  <Check size={14} color={Colors.backgroundDark} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Personalization Section - Enhanced */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>{content.personalizationTitle}</Text>
          </View>
          
          {mode === 'couples' ? (
            <View style={styles.personalizationCard}>
              {/* Mini polaroid accent */}
              {userPhotos.length > 0 && (
                <View style={styles.personalizationPolaroidAccent}>
                  <PolaroidFrame
                    imageUri={userPhotos[0]}
                    size="small"
                    rotation={-6}
                    mode={mode}
                    style={{ opacity: 0.6 }}
                  />
                </View>
              )}
              <Text style={styles.personalizationDescription}>
                {content.personalizationDescription}
              </Text>
              
              <View style={styles.nameInputContainer}>
                <View style={styles.nameInputWrapper}>
                  <Text style={styles.nameLabel}>Partner 1</Text>
                  <TextInput
                    style={styles.nameInput}
                    value={partner1Name}
                    onChangeText={setPartner1Name}
                    placeholder="Enter name"
                    placeholderTextColor={Colors.textMuted}
                    onBlur={handleSaveCoupleNames}
                    returnKeyType="next"
                  />
                </View>
                
                <View style={styles.nameInputWrapper}>
                  <Text style={styles.nameLabel}>Partner 2</Text>
                  <TextInput
                    style={styles.nameInput}
                    value={partner2Name}
                    onChangeText={setPartner2Name}
                    placeholder="Enter name"
                    placeholderTextColor={Colors.textMuted}
                    onBlur={handleSaveCoupleNames}
                    returnKeyType="done"
                  />
                </View>
              </View>
              
              {(partner1Name || partner2Name) && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewLabel}>Preview:</Text>
                  <Text style={styles.previewText}>
                    {partner1Name && partner2Name 
                      ? `${partner1Name} & ${partner2Name}` 
                      : partner1Name || partner2Name}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.personalizationCard}>
              {/* Mini polaroid accent */}
              {userPhotos.length > 0 && (
                <View style={styles.personalizationPolaroidAccent}>
                  <PolaroidFrame
                    imageUri={userPhotos[0]}
                    size="small"
                    rotation={6}
                    mode={mode}
                    style={{ opacity: 0.6 }}
                  />
                </View>
              )}
              <Text style={styles.personalizationDescription}>
                {content.personalizationDescription}
              </Text>
              
              {/* Family Last Name */}
              <View style={styles.familyNameSection}>
                <Text style={styles.nameLabel}>Family Name</Text>
                <View style={styles.familyNameInputRow}>
                  <Text style={styles.familyNamePrefix}>The</Text>
                  <TextInput
                    style={styles.familyNameInput}
                    value={familyLastName}
                    onChangeText={setFamilyLastNameLocal}
                    placeholder="Your last name"
                    placeholderTextColor={Colors.textMuted}
                    onBlur={handleSaveFamilyName}
                    returnKeyType="done"
                  />
                  <Text style={styles.familyNameSuffix}>Family</Text>
                </View>
              </View>
              
              {/* Family Members */}
              <View style={styles.familyMembersSection}>
                <View style={styles.familyMembersHeader}>
                  <Text style={styles.familyMembersTitle}>Family Members</Text>
                  <TouchableOpacity
                    style={styles.addMemberButton}
                    onPress={() => {
                      setNewMemberName('');
                      setNewMemberAge('');
                      setShowAddMemberModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color={Colors.primary} />
                    <Text style={styles.addMemberButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
                
                {familyMembers.length === 0 ? (
                  <Text style={styles.noMembersText}>
                    No family members added yet. Add members to get age-appropriate activity suggestions.
                  </Text>
                ) : (
                  <View style={styles.membersList}>
                    {familyMembers.map((member) => (
                      <View key={member.id} style={styles.memberItem}>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{member.name}</Text>
                          <Text style={styles.memberAge}>Age {member.age}</Text>
                        </View>
                        <View style={styles.memberActions}>
                          <TouchableOpacity
                            style={styles.memberActionButton}
                            onPress={() => openEditMemberModal(member)}
                            activeOpacity={0.7}
                          >
                            <Edit3 size={16} color={Colors.textLight} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.memberActionButton}
                            onPress={() => handleRemoveFamilyMember(member)}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={16} color={Colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
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

      {/* Add Family Member Modal */}
      <Modal
        visible={showAddMemberModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowAddMemberModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Family Member</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAddMemberModal(false)}
                activeOpacity={0.7}
              >
                <X size={20} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMemberName}
                  onChangeText={setNewMemberName}
                  placeholder="Enter name"
                  placeholderTextColor={Colors.textMuted}
                  autoFocus
                />
              </View>
              
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Age</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMemberAge}
                  onChangeText={setNewMemberAge}
                  placeholder="Enter age"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddMemberModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleAddFamilyMember}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalSaveButtonGradient}
                >
                  <Plus size={16} color={Colors.backgroundDark} />
                  <Text style={styles.modalSaveButtonText}>Add Member</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit Family Member Modal */}
      <Modal
        visible={showEditMemberModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditMemberModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowEditMemberModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Family Member</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowEditMemberModal(false)}
                activeOpacity={0.7}
              >
                <X size={20} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMemberName}
                  onChangeText={setNewMemberName}
                  placeholder="Enter name"
                  placeholderTextColor={Colors.textMuted}
                  autoFocus
                />
              </View>
              
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Age</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMemberAge}
                  onChangeText={setNewMemberAge}
                  placeholder="Enter age"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowEditMemberModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleEditFamilyMember}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalSaveButtonGradient}
                >
                  <Check size={16} color={Colors.backgroundDark} />
                  <Text style={styles.modalSaveButtonText}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    color: Colors.white,
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
  
  // Mode - Enhanced
  modeContainer: {
    gap: Spacing.md,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  modeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTextContainer: {
    flex: 1,
  },
  modeButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  modeButtonTextActive: {
    color: Colors.primary,
  },
  modeDescription: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },
  modeCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
  
  // Personalization
  personalizationCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    position: 'relative',
    overflow: 'hidden',
  },
  personalizationPolaroidAccent: {
    position: 'absolute',
    top: -20,
    right: -20,
    transform: [{ rotate: '15deg' }],
    opacity: 0.4,
  },
  personalizationDescription: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  nameInputContainer: {
    gap: Spacing.md,
  },
  nameInputWrapper: {
    gap: Spacing.xs,
  },
  nameLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    fontWeight: '500' as const,
  },
  nameInput: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  previewContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  previewLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.textMuted,
  },
  previewText: {
    fontSize: Typography.sizes.body,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  familyNameSection: {
    marginBottom: Spacing.xl,
  },
  familyNameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  familyNamePrefix: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
  },
  familyNameInput: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  familyNameSuffix: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
  },
  familyMembersSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: Spacing.lg,
  },
  familyMembersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  familyMembersTitle: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.medium,
  },
  addMemberButtonText: {
    fontSize: Typography.sizes.small,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  noMembersText: {
    fontSize: Typography.sizes.small,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  membersList: {
    gap: Spacing.sm,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  memberAge: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  memberActionButton: {
    padding: Spacing.sm,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.xl,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  modalTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalBody: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  modalInputGroup: {
    gap: Spacing.xs,
  },
  modalInputLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    fontWeight: '500' as const,
  },
  modalInput: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalActions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    paddingTop: 0,
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalCancelButtonText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
  },
  modalSaveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  modalSaveButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '600' as const,
    color: Colors.backgroundDark,
  },
});
