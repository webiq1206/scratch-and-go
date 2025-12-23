import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'large' | 'medium' | 'small';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export default function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'large',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const buttonStyle = [
    styles.base,
    styles[`${variant}Button` as keyof typeof styles] as ViewStyle,
    styles[`${size}Button` as keyof typeof styles] as ViewStyle,
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.baseText,
    styles[`${variant}Text` as keyof typeof styles] as TextStyle,
    styles[`${size}Text` as keyof typeof styles] as TextStyle,
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity 
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.backgroundDark : Colors.primary} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.medium,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  textButton: {
    backgroundColor: 'transparent',
  },
  largeButton: {
    height: 56,
    paddingHorizontal: Spacing.xl,
  },
  mediumButton: {
    height: 48,
    paddingHorizontal: Spacing.lg,
  },
  smallButton: {
    height: 40,
    paddingHorizontal: Spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  baseText: {
    fontWeight: Typography.weights.semibold,
  },
  primaryText: {
    color: Colors.backgroundDark,
    fontSize: Typography.sizes.body,
  },
  secondaryText: {
    color: Colors.primary,
    fontSize: Typography.sizes.body,
  },
  textText: {
    color: Colors.primary,
    fontSize: Typography.sizes.body,
  },
  largeText: {
    fontSize: Typography.sizes.h3,
  },
  mediumText: {
    fontSize: Typography.sizes.body,
  },
  smallText: {
    fontSize: Typography.sizes.caption,
  },
  disabledText: {
    opacity: 1,
  },
});
