import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius, Shadows } from '@/constants/design';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface BrandedAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'info' | 'success' | 'warning' | 'error';
  onDismiss?: () => void;
}

const getIconForType = (type: BrandedAlertProps['type']) => {
  switch (type) {
    case 'success':
      return { Icon: CheckCircle, color: Colors.success };
    case 'warning':
      return { Icon: AlertTriangle, color: Colors.warning };
    case 'error':
      return { Icon: AlertCircle, color: Colors.error };
    case 'info':
    default:
      return { Icon: Info, color: Colors.primary };
  }
};

export default function BrandedAlert({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  type = 'info',
  onDismiss,
}: BrandedAlertProps) {
  const { Icon, color } = getIconForType(type);
  
  const handleButtonPress = (button: AlertButton) => {
    button.onPress?.();
    onDismiss?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* Icon Header */}
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Icon size={32} color={color} />
          </View>

          {/* Content */}
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}

          {/* Buttons */}
          <View style={[
            styles.buttonContainer,
            buttons.length > 2 && styles.buttonContainerVertical
          ]}>
            {buttons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    buttons.length <= 2 && styles.buttonHorizontal,
                    buttons.length > 2 && styles.buttonVertical,
                    isDestructive && styles.buttonDestructive,
                    isCancel && styles.buttonCancel,
                    !isDestructive && !isCancel && styles.buttonDefault,
                  ]}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isDestructive && styles.buttonTextDestructive,
                      isCancel && styles.buttonTextCancel,
                      !isDestructive && !isCancel && styles.buttonTextDefault,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.overlay,
    padding: Spacing.xl,
  },
  alertContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.large,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.h2,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: Typography.sizes.body * Typography.lineHeights.normal,
    marginBottom: Spacing.lg,
  },
  buttonContainer: {
    width: '100%',
    marginTop: Spacing.md,
    flexDirection: 'row',
  },
  buttonContainerVertical: {
    flexDirection: 'column',
  },
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonHorizontal: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  buttonVertical: {
    marginBottom: Spacing.sm,
  },
  buttonDefault: {
    backgroundColor: Colors.primary,
  },
  buttonCancel: {
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.cardBorderLight,
  },
  buttonDestructive: {
    backgroundColor: Colors.errorMuted,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  buttonText: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.medium,
  },
  buttonTextDefault: {
    color: Colors.backgroundDark,
  },
  buttonTextCancel: {
    color: Colors.textLight,
  },
  buttonTextDestructive: {
    color: Colors.error,
  },
});
