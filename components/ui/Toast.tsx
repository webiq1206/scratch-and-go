import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius, Shadows } from '@/constants/design';

export interface ToastProps {
  visible: boolean;
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onDismiss: () => void;
  position?: 'top' | 'bottom';
}

const getStylesForType = (type: ToastProps['type']) => {
  switch (type) {
    case 'success':
      return {
        Icon: CheckCircle,
        color: Colors.success,
        backgroundColor: 'rgba(34, 197, 94, 0.95)',
        borderColor: Colors.success,
      };
    case 'warning':
      return {
        Icon: AlertTriangle,
        color: Colors.warning,
        backgroundColor: 'rgba(245, 158, 11, 0.95)',
        borderColor: Colors.warning,
      };
    case 'error':
      return {
        Icon: AlertCircle,
        color: Colors.error,
        backgroundColor: 'rgba(239, 68, 68, 0.95)',
        borderColor: Colors.error,
      };
    case 'info':
    default:
      return {
        Icon: Info,
        color: Colors.primary,
        backgroundColor: 'rgba(255, 107, 138, 0.95)',
        borderColor: Colors.primary,
      };
  }
};

export default function Toast({
  visible,
  title,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  position = 'top',
}: ToastProps) {
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  const { Icon, color, backgroundColor, borderColor } = getStylesForType(type);

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [translateY, opacity, position, onDismiss]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (visible) {
      // Reset position for animation
      translateY.setValue(position === 'top' ? -100 : 100);
      opacity.setValue(0);
      
      // Animate in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      if (duration > 0) {
        timer = setTimeout(() => {
          handleDismiss();
        }, duration);
      }
    }
    
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [visible, duration, position, translateY, opacity, handleDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.containerTop : styles.containerBottom,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor,
            borderColor,
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
          <Icon size={20} color={Colors.white} />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
        
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: Spacing.lg,
  },
  containerTop: {
    top: Platform.OS === 'ios' ? 60 : 40,
  },
  containerBottom: {
    bottom: Platform.OS === 'ios' ? 100 : 80,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    ...Shadows.medium,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.small,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
  message: {
    fontSize: Typography.sizes.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  closeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
});
