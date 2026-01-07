import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated, Dimensions, Platform } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import * as Haptics from 'expo-haptics';
import { BorderRadius } from '@/constants/design';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = 400;
const SCRATCH_THRESHOLD = 30;
const SCRATCH_HOLE_SIZE = 60;
const GRID_SIZE = 15;

interface ScratchCardProps {
  onScratchStart?: () => void;
  onScratchComplete: () => void;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  scratchLayer: React.ReactNode;
  revealContent: React.ReactNode;
  disabled?: boolean;
  resetKey?: string | number;
}

export default function ScratchCard({ 
  onScratchStart,
  onScratchComplete,
  onTouchStart,
  onTouchEnd,
  scratchLayer,
  revealContent,
  disabled = false,
  resetKey
}: ScratchCardProps) {
  const [scratches, setScratches] = useState<{ x: number; y: number }[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const isRevealedRef = useRef(false);
  const disabledRef = useRef(disabled);
  const hasStartedRef = useRef(false);
  const scratchPercentage = useRef(0);
  const lastHapticTime = useRef(0);
  const scratchedCells = useRef(new Set<string>());
  
  disabledRef.current = disabled;
  isRevealedRef.current = isRevealed;

  useEffect(() => {
    setScratches([]);
    setIsRevealed(false);
    isRevealedRef.current = false;
    hasStartedRef.current = false;
    scratchPercentage.current = 0;
    scratchedCells.current.clear();
    opacity.setValue(1);
  }, [resetKey, opacity]);

  const addScratch = useCallback((x: number, y: number) => {
    if (isRevealedRef.current || disabledRef.current) return;

    const cellX = Math.floor(x / GRID_SIZE);
    const cellY = Math.floor(y / GRID_SIZE);
    const cellKey = `${cellX},${cellY}`;
    
    if (scratchedCells.current.has(cellKey)) return;
    
    scratchedCells.current.add(cellKey);
    
    const totalCells = Math.ceil(CARD_WIDTH / GRID_SIZE) * Math.ceil(CARD_HEIGHT / GRID_SIZE);
    const scratchedCount = scratchedCells.current.size;
    scratchPercentage.current = (scratchedCount / totalCells) * 100;
    
    setScratches((prev) => [...prev, { x, y }]);
    
    if (scratchPercentage.current >= SCRATCH_THRESHOLD && !isRevealedRef.current) {
      setIsRevealed(true);
      isRevealedRef.current = true;
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onScratchComplete();
      });
    }
  }, [opacity, onScratchComplete]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS === 'web') return;
    
    const now = Date.now();
    if (now - lastHapticTime.current > 50) {
      lastHapticTime.current = now;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        return !disabledRef.current && !isRevealedRef.current;
      },
      onStartShouldSetPanResponderCapture: () => {
        return !disabledRef.current && !isRevealedRef.current;
      },
      onMoveShouldSetPanResponder: () => {
        return !disabledRef.current && !isRevealedRef.current;
      },
      onMoveShouldSetPanResponderCapture: () => {
        return !disabledRef.current && !isRevealedRef.current;
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (disabledRef.current || isRevealedRef.current) return;
        
        const { locationX, locationY } = evt.nativeEvent;
        
        if (onTouchStart) {
          onTouchStart();
        }
        
        if (!hasStartedRef.current) {
          hasStartedRef.current = true;
          if (onScratchStart) {
            onScratchStart();
          }
        }
        
        addScratch(locationX, locationY);
        triggerHaptic();
      },
      onPanResponderMove: (evt) => {
        if (disabledRef.current || isRevealedRef.current) return;
        
        const { locationX, locationY } = evt.nativeEvent;
        addScratch(locationX, locationY);
        triggerHaptic();
      },
      onPanResponderRelease: () => {
        if (disabledRef.current || isRevealedRef.current) return;
        
        if (onTouchEnd) {
          onTouchEnd();
        }
      },
      onPanResponderTerminate: () => {
        if (onTouchEnd) {
          onTouchEnd();
        }
      },
    })
  ).current;



  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.revealLayer}>
          {revealContent}
        </View>

        {!isRevealed && (
          <Animated.View 
            style={[styles.scratchLayer, { opacity }]}
            {...panResponder.panHandlers}
          >
            {scratchLayer}
            
            {scratches.map((scratch, index) => (
              <View
                key={index}
                style={[
                  styles.scratchMarkWeb,
                  {
                    left: scratch.x - (SCRATCH_HOLE_SIZE / 2),
                    top: scratch.y - (SCRATCH_HOLE_SIZE / 2),
                  },
                ]}
              />
            ))}
          </Animated.View>
        )}
        {disabled && <View style={styles.disabledOverlay} />}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.revealLayer}>
        {revealContent}
      </View>

      {!isRevealed && (
        <Animated.View 
          style={[StyleSheet.absoluteFill, { opacity }]}
          {...panResponder.panHandlers}
        >
          <MaskedView
            style={StyleSheet.absoluteFill}
            maskElement={
              <View style={styles.maskContainer}>
                <View style={styles.maskBase} />
                {scratches.map((scratch, index) => (
                  <View
                    key={index}
                    style={[
                      styles.scratchHole,
                      {
                        left: scratch.x - (SCRATCH_HOLE_SIZE / 2),
                        top: scratch.y - (SCRATCH_HOLE_SIZE / 2),
                      },
                    ]}
                  />
                ))}
              </View>
            }
          >
            <View style={StyleSheet.absoluteFill}>
              {scratchLayer}
            </View>
          </MaskedView>
        </Animated.View>
      )}
      {disabled && <View style={styles.disabledOverlay} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  revealLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  scratchLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  maskContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  maskBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
  },
  scratchHole: {
    position: 'absolute',
    width: SCRATCH_HOLE_SIZE,
    height: SCRATCH_HOLE_SIZE,
    borderRadius: SCRATCH_HOLE_SIZE / 2,
    backgroundColor: 'black',
  },
  scratchMarkWeb: {
    position: 'absolute',
    width: SCRATCH_HOLE_SIZE,
    height: SCRATCH_HOLE_SIZE,
    borderRadius: SCRATCH_HOLE_SIZE / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});
