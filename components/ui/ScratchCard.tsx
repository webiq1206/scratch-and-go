import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated, Dimensions, Platform } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import * as Haptics from 'expo-haptics';
import { BorderRadius } from '@/constants/design';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = 400;
const SCRATCH_THRESHOLD = 25;
const SCRATCH_HOLE_SIZE = 50;
const GRID_SIZE = 12;

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

    // Add scratches for surrounding cells to create larger scratch effect
    const offsets = [
      [0, 0], [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [1, -1], [-1, 1], [1, 1],
      [-2, 0], [2, 0], [0, -2], [0, 2]
    ];

    const baseCellX = Math.floor(x / GRID_SIZE);
    const baseCellY = Math.floor(y / GRID_SIZE);
    
    let addedNew = false;
    
    for (const [ox, oy] of offsets) {
      const cellX = baseCellX + ox;
      const cellY = baseCellY + oy;
      const cellKey = `${cellX},${cellY}`;
      
      if (!scratchedCells.current.has(cellKey)) {
        scratchedCells.current.add(cellKey);
        addedNew = true;
      }
    }
    
    if (!addedNew) return;
    
    const totalCells = Math.ceil(CARD_WIDTH / GRID_SIZE) * Math.ceil(CARD_HEIGHT / GRID_SIZE);
    const scratchedCount = scratchedCells.current.size;
    scratchPercentage.current = (scratchedCount / totalCells) * 100;
    
    console.log(`Scratch progress: ${scratchPercentage.current.toFixed(1)}% (${scratchedCount}/${totalCells} cells)`);
    
    setScratches((prev) => [...prev, { x, y }]);
    
    if (scratchPercentage.current >= SCRATCH_THRESHOLD && !isRevealedRef.current) {
      console.log('Scratch threshold reached! Revealing content...');
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
        const shouldSet = !disabledRef.current && !isRevealedRef.current;
        console.log('onStartShouldSetPanResponder:', shouldSet);
        return shouldSet;
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
        
        console.log('PanResponder: Grant - Touch started');
        
        if (onTouchStart) {
          onTouchStart();
        }
        
        if (!hasStartedRef.current) {
          hasStartedRef.current = true;
          console.log('PanResponder: First scratch started');
          if (onScratchStart) {
            onScratchStart();
          }
        }
        
        const { locationX, locationY } = evt.nativeEvent;
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
        console.log('PanResponder: Released');
        if (onTouchEnd) {
          onTouchEnd();
        }
      },
      onPanResponderTerminate: () => {
        console.log('PanResponder: Terminated');
        if (onTouchEnd) {
          onTouchEnd();
        }
      },
    })
  ).current;



  // Handle web touch/mouse events directly for better compatibility
  const handleWebTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (disabledRef.current || isRevealedRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Web: Touch/Mouse start');
    
    if (onTouchStart) {
      onTouchStart();
    }
    
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      console.log('Web: First scratch started');
      if (onScratchStart) {
        onScratchStart();
      }
    }
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    addScratch(x, y);
    triggerHaptic();
  }, [onTouchStart, onScratchStart, addScratch, triggerHaptic]);

  const handleWebTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (disabledRef.current || isRevealedRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    addScratch(x, y);
    triggerHaptic();
  }, [addScratch, triggerHaptic]);

  const handleWebTouchEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    console.log('Web: Touch/Mouse end');
    if (onTouchEnd) {
      onTouchEnd();
    }
  }, [onTouchEnd]);

  // Generate clip-path for web scratches
  const getWebClipPath = useCallback(() => {
    if (scratches.length === 0) return 'none';
    
    // Create circles for each scratch point
    const circles = scratches.map((scratch) => {
      return `circle(${SCRATCH_HOLE_SIZE / 2}px at ${scratch.x}px ${scratch.y}px)`;
    });
    
    return circles.join(', ');
  }, [scratches]);

  if (Platform.OS === 'web') {
    const clipPath = getWebClipPath();
    const hasScratches = scratches.length > 0;
    
    return (
      <View style={styles.container}>
        {/* Reveal layer - always at the bottom */}
        <View style={styles.revealLayer}>
          {revealContent}
        </View>

        {/* Scratch layer with holes punched through */}
        {!isRevealed && (
          <Animated.View 
            style={[styles.scratchLayerWeb, { opacity }]}
            {...{
              onTouchStart: handleWebTouchStart,
              onTouchMove: handleWebTouchMove,
              onTouchEnd: handleWebTouchEnd,
              onMouseDown: handleWebTouchStart,
              onMouseMove: (e: any) => {
                if (e.buttons === 1) {
                  handleWebTouchMove(e);
                }
              },
              onMouseUp: handleWebTouchEnd,
              onMouseLeave: handleWebTouchEnd,
            } as any}
          >
            {/* Main scratch layer content */}
            <View style={styles.scratchLayerContent}>
              {scratchLayer}
            </View>
            
            {/* Scratch holes - rendered as transparent circles that show reveal content */}
            {hasScratches && (
              <View 
                style={[
                  styles.scratchHolesContainer,
                  {
                    clipPath: clipPath,
                    WebkitClipPath: clipPath,
                  } as any
                ]}
              >
                {revealContent}
              </View>
            )}
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
  scratchLayerWeb: {
    ...StyleSheet.absoluteFillObject,
    cursor: 'crosshair',
    touchAction: 'none',
    userSelect: 'none',
  } as any,
  scratchLayerContent: {
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
  scratchHolesContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  } as any,
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});
