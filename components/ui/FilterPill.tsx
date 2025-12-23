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
  text: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semibold,
    color: '#B8B8B8',
  },
  selectedText: {
    color: '#1A1A1A',
    fontWeight: Typography.weights.bold,
  },
});
