import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';

const MODE_KEY = 'scratch_and_go_mode';

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkExistingMode = async () => {
      const savedMode = await AsyncStorage.getItem(MODE_KEY);
      if (savedMode) {
        router.replace('/(main)/(home)');
      }
    };
    
    checkExistingMode();
  }, [router]);

  const selectMode = async (mode: 'couples' | 'family') => {
    await AsyncStorage.setItem(MODE_KEY, mode);
    router.replace('/(main)/(home)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>✨</Text>
        <Text style={styles.title}>Scratch & Go</Text>
        <Text style={styles.tagline}>Scratch your next adventure</Text>

        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => selectMode('couples')}
            activeOpacity={0.7}
          >
            <Text style={styles.modeEmoji}>💑</Text>
            <Text style={styles.modeTitle}>Couples Mode</Text>
            <Text style={styles.modeDescription}>Date night ideas for two</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => selectMode('family')}
            activeOpacity={0.7}
          >
            <Text style={styles.modeEmoji}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.modeTitle}>Family Mode</Text>
            <Text style={styles.modeDescription}>Fun activities for everyone</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.switchText}>You can switch anytime</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  logo: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    marginBottom: Spacing.xxl,
  },
  cardsContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  modeCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modeEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  modeTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  modeDescription: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
  },
  switchText: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    marginTop: Spacing.lg,
  },
});
