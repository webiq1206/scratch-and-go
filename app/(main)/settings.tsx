import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings as SettingsIcon, User, Heart } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';
import { usePreferences } from '@/contexts/PreferencesContext';
import { RELIGIONS } from '@/types/preferences';

const MODE_KEY = 'scratch_and_go_mode';

type Mode = 'couples' | 'family';

export default function SettingsScreen() {
  const { preferences, updatePreferences } = usePreferences();
  const [mode, setMode] = useState<Mode>('couples');
  const [showReligionPicker, setShowReligionPicker] = useState(false);

  useEffect(() => {
    loadMode();
  }, []);

  const loadMode = async () => {
    const savedMode = await AsyncStorage.getItem(MODE_KEY);
    if (savedMode) {
      setMode(savedMode as Mode);
    }
  };

  const handleModeChange = async (newMode: Mode) => {
    await AsyncStorage.setItem(MODE_KEY, newMode);
    setMode(newMode);
    Alert.alert('Mode Updated', `Switched to ${newMode === 'couples' ? 'Couples' : 'Family'} mode`);
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
                <Text style={styles.preferenceTitle}>Gambling Activities</Text>
                <Text style={styles.preferenceDescription}>
                  Casinos, betting venues
                </Text>
              </View>
              <Switch
                value={preferences.includeGambling}
                onValueChange={(value) => handleToggle('includeGambling', value)}
                trackColor={{ false: '#3A3A3A', true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Weapons Activities</Text>
                <Text style={styles.preferenceDescription}>
                  Shooting ranges, hunting, archery
                </Text>
              </View>
              <Switch
                value={preferences.includeWeapons}
                onValueChange={(value) => handleToggle('includeWeapons', value)}
                trackColor={{ false: '#3A3A3A', true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.footerNote}>
            These settings help personalize your activity suggestions. Changes take effect immediately.
          </Text>
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
});
