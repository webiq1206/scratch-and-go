import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';

interface FilterPillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function FilterPill({ label, selected, onPress }: FilterPillProps) {
  return (
    <TouchableOpacity
      style={[styles.pill, selected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginRight: Spacing.sm,
  },
  selected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  text: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.medium,
    color: Colors.textLight,
  },
  selectedText: {
    color: Colors.backgroundDark,
  },
});
