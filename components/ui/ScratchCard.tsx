import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated, Dimensions, Platform } from 'react-native';
import Svg, { Circle, Defs, Mask, Rect, LinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { BorderRadius } from '@/constants/design';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = 400;
const SCRATCH_THRESHOLD = 80; // Auto-reveal at 80%
const BRUSH_RADIUS = 35; // Circular brush radius in pixels
const INTERPOLATION_STEP = 3; // Pixels between interpolated points for smooth lines
const GRID_SIZE = 5; // Grid size for accurate area calculation (5px grid)

interface ScratchCardProps {
  onScratchStart?: () => void;
  onScratchComplete: () => void;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  revealContent: React.ReactNode;
  disabled?: boolean;
  resetKey?: string | number;
  isActivityReady?: boolean; // New prop to ensure activity is ready
}

export default function ScratchCard({
  onScratchStart,
  onScratchComplete,
  onTouchStart,
  onTouchEnd,
  revealContent,
  disabled = false,
  resetKey,
  isActivityReady = true, // Default to true for backward compatibility
}: ScratchCardProps) {
  const [renderTrigger, setRenderTrigger] = useState(0); // Counter to force re-renders
  const [isRevealed, setIsRevealed] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const isRevealedRef = useRef(false);
  const disabledRef = useRef(disabled);
  const hasStartedRef = useRef(false);
  const lastHapticTime = useRef(0);
  const isMouseDown = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const scratchCirclesRef = useRef<Array<{ x: number; y: number; r: number; id: number }>>([]);
  const circleIdCounter = useRef(0);
  // Pixel-based tracking for accurate area calculation
  const scratchedGridRef = useRef<Set<string>>(new Set());
  
  // Calculate total grid cells
  const totalGridCells = Math.ceil(CARD_WIDTH / GRID_SIZE) * Math.ceil(CARD_HEIGHT / GRID_SIZE);

  disabledRef.current = disabled;
  isRevealedRef.current = isRevealed;

  // Reset when resetKey changes (NOT when opacity changes!)
  useEffect(() => {
    scratchCirclesRef.current = [];
    scratchedGridRef.current = new Set();
    circleIdCounter.current = 0;
    setRenderTrigger(0);
    setIsRevealed(false);
    isRevealedRef.current = false;
    hasStartedRef.current = false;
    lastPoint.current = null;
    opacity.setValue(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]); // Only reset when resetKey changes, not opacity!

  // Calculate scratched percentage using accurate pixel-based method
  const calculateScratchedPercentage = useCallback(() => {
    const scratchedCount = scratchedGridRef.current.size;
    const percentage = (scratchedCount / totalGridCells) * 100;
    return percentage;
  }, [totalGridCells]);

  // Check threshold and auto-reveal
  const checkAndReveal = useCallback(() => {
    if (isRevealedRef.current) return;
    
    // Don't reveal if activity is not ready
    if (!isActivityReady) {
      return;
    }

    const percentage = calculateScratchedPercentage();

    if (percentage >= SCRATCH_THRESHOLD && !isRevealedRef.current) {
      setIsRevealed(true);
      isRevealedRef.current = true;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onScratchComplete();
      });
    }
  }, [opacity, onScratchComplete, calculateScratchedPercentage, isActivityReady]);

  // Add scratched grid cells for accurate area calculation
  const addScratchedGridCells = useCallback((x: number, y: number) => {
    // Clamp coordinates to card bounds
    const clampedX = Math.max(0, Math.min(CARD_WIDTH, x));
    const clampedY = Math.max(0, Math.min(CARD_HEIGHT, y));

    // Calculate grid bounds for the circle
    const minGridX = Math.max(0, Math.floor((clampedX - BRUSH_RADIUS) / GRID_SIZE));
    const maxGridX = Math.min(Math.ceil(CARD_WIDTH / GRID_SIZE) - 1, Math.ceil((clampedX + BRUSH_RADIUS) / GRID_SIZE));
    const minGridY = Math.max(0, Math.floor((clampedY - BRUSH_RADIUS) / GRID_SIZE));
    const maxGridY = Math.min(Math.ceil(CARD_HEIGHT / GRID_SIZE) - 1, Math.ceil((clampedY + BRUSH_RADIUS) / GRID_SIZE));

    // Check each grid cell within the circle
    for (let gridY = minGridY; gridY <= maxGridY; gridY++) {
      for (let gridX = minGridX; gridX <= maxGridX; gridX++) {
        // Calculate center of grid cell
        const cellCenterX = gridX * GRID_SIZE + GRID_SIZE / 2;
        const cellCenterY = gridY * GRID_SIZE + GRID_SIZE / 2;
        
        // Check if cell center is within circle radius
        const distance = Math.sqrt(
          Math.pow(clampedX - cellCenterX, 2) + 
          Math.pow(clampedY - cellCenterY, 2)
        );
        
        if (distance <= BRUSH_RADIUS) {
          const gridKey = `${gridX},${gridY}`;
          if (!scratchedGridRef.current.has(gridKey)) {
            scratchedGridRef.current.add(gridKey);
          }
        }
      }
    }
  }, []);

  // Add scratch point and update circles
  const addScratchPoint = useCallback((x: number, y: number) => {
    if (isRevealedRef.current || disabledRef.current) return;

    // Clamp to card bounds
    const clampedX = Math.max(BRUSH_RADIUS, Math.min(CARD_WIDTH - BRUSH_RADIUS, x));
    const clampedY = Math.max(BRUSH_RADIUS, Math.min(CARD_HEIGHT - BRUSH_RADIUS, y));

    // Add circle with unique ID
    const newCircle = { 
      x: clampedX, 
      y: clampedY, 
      r: BRUSH_RADIUS,
      id: circleIdCounter.current++
    };
    scratchCirclesRef.current.push(newCircle);
    
    // Add to grid for accurate area calculation
    addScratchedGridCells(clampedX, clampedY);
    
    // Don't limit circles - keep ALL of them for complete scratch persistence
    // Update render trigger periodically to force re-renders (every 3 circles)
    // This triggers React to re-render and show new circles from the ref
    if (scratchCirclesRef.current.length % 3 === 0 || scratchCirclesRef.current.length === 1) {
      setRenderTrigger(prev => prev + 1);
    }
    
    // Check for auto-reveal (throttled to avoid excessive checks)
    checkAndReveal();
  }, [addScratchedGridCells, checkAndReveal]);

  // Interpolate between two points for smooth continuous scratching
  const scratchBetween = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const steps = Math.max(1, Math.ceil(distance / INTERPOLATION_STEP));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      addScratchPoint(x, y);
    }
  }, [addScratchPoint]);

  // Haptic feedback with throttling
  const triggerHaptic = useCallback(() => {
    if (Platform.OS === 'web') return;

    const now = Date.now();
    if (now - lastHapticTime.current > 50) {
      lastHapticTime.current = now;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleScratchStart = useCallback((x: number, y: number) => {
    if (disabledRef.current || isRevealedRef.current) return;

    if (onTouchStart) onTouchStart();

    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      if (onScratchStart) onScratchStart();
    }

    lastPoint.current = { x, y };
    addScratchPoint(x, y);
    triggerHaptic();
  }, [onTouchStart, onScratchStart, addScratchPoint, triggerHaptic]);

  const handleScratchMove = useCallback((x: number, y: number) => {
    if (disabledRef.current || isRevealedRef.current) return;

    if (lastPoint.current) {
      // Interpolate between last point and current for smooth continuous scratching
      scratchBetween(lastPoint.current.x, lastPoint.current.y, x, y);
    } else {
      addScratchPoint(x, y);
    }

    lastPoint.current = { x, y };
    triggerHaptic();
  }, [addScratchPoint, scratchBetween, triggerHaptic]);

  const handleScratchEnd = useCallback(() => {
    lastPoint.current = null;
    
    // Force final re-render to ensure ALL circles are shown
    setRenderTrigger(prev => prev + 1);
    
    if (onTouchEnd) onTouchEnd();
  }, [onTouchEnd]);

  // PanResponder for native platforms
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current && !isRevealedRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current && !isRevealedRef.current,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        handleScratchStart(locationX, locationY);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        handleScratchMove(locationX, locationY);
      },
      onPanResponderRelease: handleScratchEnd,
      onPanResponderTerminate: handleScratchEnd,
    })
  ).current;

  // Web event handlers
  const getLocationFromEvent = useCallback((e: any, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    let clientX: number, clientY: number;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  const webHandlers = Platform.OS === 'web' ? {
    onTouchStart: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      const { x, y } = getLocationFromEvent(e, e.currentTarget);
      handleScratchStart(x, y);
    },
    onTouchMove: (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      const { x, y } = getLocationFromEvent(e, e.currentTarget);
      handleScratchMove(x, y);
    },
    onTouchEnd: (e: any) => {
      e.preventDefault();
      handleScratchEnd();
    },
    onMouseDown: (e: any) => {
      e.preventDefault();
      isMouseDown.current = true;
      const { x, y } = getLocationFromEvent(e, e.currentTarget);
      handleScratchStart(x, y);
    },
    onMouseMove: (e: any) => {
      if (!isMouseDown.current) return;
      e.preventDefault();
      const { x, y } = getLocationFromEvent(e, e.currentTarget);
      handleScratchMove(x, y);
    },
    onMouseUp: (e: any) => {
      e.preventDefault();
      isMouseDown.current = false;
      handleScratchEnd();
    },
    onMouseLeave: () => {
      if (isMouseDown.current) {
        isMouseDown.current = false;
        handleScratchEnd();
      }
    },
  } : {};

  return (
    <View style={styles.container}>
      <View style={styles.revealLayer}>
        {revealContent}
      </View>

      {!isRevealed && (
        <Animated.View
          style={[styles.scratchLayer, { opacity }]}
          {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
          {...(Platform.OS === 'web' ? webHandlers : {})}
        >
          <Svg
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <Defs>
              <LinearGradient id="scratchGradient" x1="0" y1="0" x2="0" y2={CARD_HEIGHT}>
                <Stop offset="0" stopColor="#FF6B9D" stopOpacity="1" />
                <Stop offset="0.5" stopColor="#FF4A8A" stopOpacity="1" />
                <Stop offset="1" stopColor="#FFB3D9" stopOpacity="1" />
              </LinearGradient>
              <Mask id="scratchMask">
                {/* White background - everything visible */}
                <Rect width={CARD_WIDTH} height={CARD_HEIGHT} fill="white" />
                {/* Black circles - scratched areas (hidden) */}
                {/* Render directly from ref to ensure persistence */}
                {scratchCirclesRef.current.map((circle) => (
                  <Circle
                    key={circle.id}
                    cx={circle.x}
                    cy={circle.y}
                    r={circle.r}
                    fill="black"
                  />
                ))}
              </Mask>
            </Defs>
            {/* Scratch layer with gradient */}
            <Rect
              width={CARD_WIDTH}
              height={CARD_HEIGHT}
              fill="url(#scratchGradient)"
              mask="url(#scratchMask)"
            />
          </Svg>
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
    cursor: 'crosshair',
    touchAction: 'none',
    userSelect: 'none',
  } as any,
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});
