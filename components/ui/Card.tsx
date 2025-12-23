import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function Card({ children, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#252525',
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#333333',
  },
});
