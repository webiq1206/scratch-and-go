import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';

interface FilterPillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  emoji?: string;
  description?: string;
  isPremium?: boolean;
  showPremiumBadge?: boolean;
}

export default function FilterPill({ label, selected, onPress, description, isPremium, showPremiumBadge }: FilterPillProps) {
  return (
    <TouchableOpacity
      style={[styles.pill, selected && styles.selected, isPremium && !showPremiumBadge && styles.premiumLocked]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.pillContent}>
        <View style={styles.textContainer}>
          <Text style={[styles.text, selected && styles.selectedText, isPremium && !showPremiumBadge && styles.premiumText]}>{label}</Text>
          {description && selected && (
            <Text style={[styles.description, selected && styles.selectedDescription]}>{description}</Text>
          )}
        </View>
        {isPremium && !showPremiumBadge && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>PRO</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: '#252525',
    borderWidth: 1.5,
    borderColor: '#333333',
    marginRight: Spacing.sm,
  },
  selected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  premiumLocked: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    backgroundColor: Colors.primaryMuted,
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  description: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  selectedDescription: {
    color: 'rgba(26, 26, 26, 0.7)',
  },
  text: {
    fontSize: Typography.sizes.caption,
    fontWeight: '400' as const,
    color: '#B8B8B8',
  },
  selectedText: {
    color: '#1A1A1A',
    fontWeight: '400' as const,
  },
  premiumText: {
    color: Colors.primary,
  },
  premiumBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.white,
    letterSpacing: 0.5,
  },
});
