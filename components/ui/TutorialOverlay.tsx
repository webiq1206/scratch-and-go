import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { X, ArrowDown, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';

interface TutorialOverlayProps {
  visible: boolean;
  title: string;
  description: string;
  highlightArea?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  onDismiss: () => void;
  showArrow?: boolean;
}

export default function TutorialOverlay({
  visible,
  title,
  description,
  highlightArea,
  onDismiss,
  showArrow = true,
}: TutorialOverlayProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        
        {highlightArea && (
          <View
            style={[
              styles.highlight,
              {
                top: highlightArea.top,
                left: highlightArea.left,
                width: highlightArea.width,
                height: highlightArea.height,
              },
            ]}
          />
        )}

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Sparkles size={32} color={Colors.primary} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          {showArrow && (
            <View style={styles.arrowContainer}>
              <ArrowDown size={24} color={Colors.primary} />
            </View>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Got it!</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <X size={20} color={Colors.textLight} />
          </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  highlight: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.medium,
  },
  content: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    marginHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    maxWidth: 400,
    width: '90%',
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.h2,
    fontWeight: '400' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  arrowContainer: {
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.text,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.sm,
  },
});
