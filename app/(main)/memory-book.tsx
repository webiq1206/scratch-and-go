import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';

export default function MemoryBookScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Adventures</Text>
        <Text style={styles.subtitle}>Your saved memories will appear here</Text>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No adventures yet</Text>
        <Text style={styles.emptyText}>Start scratching to create memorable moments{"\n"}and build your adventure collection</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes.hero,
    fontWeight: '400' as const,
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.body,
    color: '#B8B8B8',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },

  emptyTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '400' as const,
    color: '#FFFFFF',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.body,
    color: '#B8B8B8',
    textAlign: 'center',
    lineHeight: 24,
  },
});
