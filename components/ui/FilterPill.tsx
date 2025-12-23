import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Crown } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';

interface FilterPillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  isPremium?: boolean;
  showPremiumBadge?: boolean;
}

export default function FilterPill({ label, selected, onPress, isPremium, showPremiumBadge }: FilterPillProps) {
  return (
    <TouchableOpacity
      style={[styles.pill, selected && styles.selected, isPremium && !showPremiumBadge && styles.premiumLocked]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.pillContent}>
        <Text style={[styles.text, selected && styles.selectedText, isPremium && !showPremiumBadge && styles.premiumText]}>{label}</Text>
        {isPremium && !showPremiumBadge && (
          <Crown size={12} color={Colors.accent} />
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
    borderColor: Colors.accent,
    borderWidth: 1.5,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    color: Colors.accent,
  },
});
