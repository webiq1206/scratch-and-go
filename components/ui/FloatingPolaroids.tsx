import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MiniPolaroid } from './PolaroidFrame';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PolaroidPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  rotation: number;
  imageUri?: string;
  opacity?: number;
  scale?: number;
}

interface FloatingPolaroidsProps {
  /** Array of user memory images to display */
  userImages?: string[];
  /** Mode for theming */
  mode?: 'couples' | 'family';
  /** Density of polaroids (sparse, normal, dense) */
  density?: 'sparse' | 'normal' | 'dense';
  /** Whether to animate subtly */
  animated?: boolean;
  /** Custom positions override */
  positions?: PolaroidPosition[];
  /** Gradient overlay for content readability */
  showGradient?: boolean;
  /** Gradient direction */
  gradientDirection?: 'top' | 'bottom' | 'both';
  /** Children to render on top */
  children?: React.ReactNode;
}

const SPARSE_POSITIONS: PolaroidPosition[] = [
  { top: 60, left: -20, rotation: -15, opacity: 0.4 },
  { top: 120, right: -15, rotation: 12, opacity: 0.35 },
  { bottom: 200, left: -25, rotation: 8, opacity: 0.3 },
  { bottom: 100, right: -20, rotation: -10, opacity: 0.35 },
];

const NORMAL_POSITIONS: PolaroidPosition[] = [
  { top: 40, left: -15, rotation: -12, opacity: 0.5 },
  { top: 80, right: -10, rotation: 8, opacity: 0.45 },
  { top: 180, left: 20, rotation: 5, opacity: 0.35 },
  { top: 260, right: -20, rotation: -15, opacity: 0.4 },
  { bottom: 280, left: -20, rotation: 10, opacity: 0.3 },
  { bottom: 180, right: 10, rotation: -8, opacity: 0.35 },
  { bottom: 80, left: 30, rotation: 6, opacity: 0.4 },
];

const DENSE_POSITIONS: PolaroidPosition[] = [
  { top: 30, left: -20, rotation: -15, opacity: 0.5 },
  { top: 50, right: -15, rotation: 10, opacity: 0.45 },
  { top: 130, left: 10, rotation: 5, opacity: 0.4 },
  { top: 180, right: -25, rotation: -12, opacity: 0.5 },
  { top: 280, left: -15, rotation: 8, opacity: 0.35 },
  { top: 340, right: 5, rotation: -6, opacity: 0.4 },
  { bottom: 340, left: -10, rotation: 12, opacity: 0.35 },
  { bottom: 260, right: -20, rotation: -10, opacity: 0.4 },
  { bottom: 180, left: 20, rotation: 3, opacity: 0.45 },
  { bottom: 100, right: 15, rotation: -8, opacity: 0.5 },
  { bottom: 40, left: -25, rotation: 15, opacity: 0.35 },
];

const getPositions = (density: 'sparse' | 'normal' | 'dense') => {
  switch (density) {
    case 'sparse':
      return SPARSE_POSITIONS;
    case 'dense':
      return DENSE_POSITIONS;
    default:
      return NORMAL_POSITIONS;
  }
};

export default function FloatingPolaroids({
  userImages = [],
  mode = 'couples',
  density = 'normal',
  animated = true,
  positions,
  showGradient = true,
  gradientDirection = 'bottom',
  children,
}: FloatingPolaroidsProps) {
  const animatedValues = useRef<Animated.Value[]>([]);
  const polaroidPositions = positions || getPositions(density);

  // Initialize animated values
  useEffect(() => {
    if (animated) {
      animatedValues.current = polaroidPositions.map(() => new Animated.Value(0));
      
      // Create subtle floating animation for each polaroid
      const animations = animatedValues.current.map((value, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(value, {
              toValue: 1,
              duration: 3000 + index * 500,
              useNativeDriver: true,
            }),
            Animated.timing(value, {
              toValue: 0,
              duration: 3000 + index * 500,
              useNativeDriver: true,
            }),
          ])
        );
      });

      Animated.parallel(animations).start();
    }
  }, [animated, polaroidPositions.length]);

  const renderGradient = () => {
    if (!showGradient) return null;

    const gradientColors = ['transparent', 'rgba(13, 13, 13, 0.6)', 'rgba(13, 13, 13, 0.95)', Colors.background];
    const reverseGradient = ['rgba(13, 13, 13, 0.95)', 'rgba(13, 13, 13, 0.6)', 'transparent'];

    if (gradientDirection === 'both') {
      return (
        <>
          <LinearGradient
            colors={reverseGradient}
            style={[styles.gradient, styles.gradientTop]}
            pointerEvents="none"
          />
          <LinearGradient
            colors={gradientColors}
            style={[styles.gradient, styles.gradientBottom]}
            pointerEvents="none"
          />
        </>
      );
    }

    if (gradientDirection === 'top') {
      return (
        <LinearGradient
          colors={reverseGradient}
          style={[styles.gradient, styles.gradientTop]}
          pointerEvents="none"
        />
      );
    }

    return (
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.3, 0.6, 0.85]}
        style={[styles.gradient, styles.gradientBottom]}
        pointerEvents="none"
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Floating Polaroids */}
      <View style={styles.polaroidsContainer} pointerEvents="none">
        {polaroidPositions.map((pos, index) => {
          const imageUri = userImages[index % userImages.length] || undefined;
          
          const animatedStyle = animated && animatedValues.current[index]
            ? {
                transform: [
                  {
                    translateY: animatedValues.current[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 6],
                    }),
                  },
                ],
              }
            : {};

          return (
            <Animated.View
              key={index}
              style={[
                styles.polaroidWrapper,
                {
                  top: pos.top,
                  bottom: pos.bottom,
                  left: pos.left,
                  right: pos.right,
                  opacity: pos.opacity ?? 0.4,
                  transform: [{ scale: pos.scale ?? 1 }],
                },
                animatedStyle,
              ]}
            >
              <MiniPolaroid
                imageUri={imageUri}
                rotation={pos.rotation}
              />
            </Animated.View>
          );
        })}
      </View>

      {/* Gradient Overlay */}
      {renderGradient()}

      {/* Content */}
      {children && (
        <View style={styles.contentContainer}>
          {children}
        </View>
      )}
    </View>
  );
}

// Compact version for section headers
interface PolaroidAccentProps {
  userImages?: string[];
  mode?: 'couples' | 'family';
  position?: 'left' | 'right' | 'both';
}

export function PolaroidAccent({ userImages = [], mode = 'couples', position = 'right' }: PolaroidAccentProps) {
  const leftImage = userImages[0];
  const rightImage = userImages[1] || userImages[0];

  if (position === 'both') {
    return (
      <>
        <View style={[styles.accentPolaroid, styles.accentLeft]}>
          <MiniPolaroid imageUri={leftImage} rotation={-8} />
        </View>
        <View style={[styles.accentPolaroid, styles.accentRight]}>
          <MiniPolaroid imageUri={rightImage} rotation={6} />
        </View>
      </>
    );
  }

  return (
    <View style={[styles.accentPolaroid, position === 'left' ? styles.accentLeft : styles.accentRight]}>
      <MiniPolaroid imageUri={userImages[0]} rotation={position === 'left' ? -8 : 6} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: -1,
  },
  polaroidsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  polaroidWrapper: {
    position: 'absolute',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '50%',
  },
  gradientTop: {
    top: 0,
  },
  gradientBottom: {
    bottom: 0,
  },
  contentContainer: {
    flex: 1,
    zIndex: 10,
  },
  accentPolaroid: {
    position: 'absolute',
    opacity: 0.4,
  },
  accentLeft: {
    left: -15,
    top: '50%',
    marginTop: -30,
  },
  accentRight: {
    right: -15,
    top: '50%',
    marginTop: -30,
  },
});
