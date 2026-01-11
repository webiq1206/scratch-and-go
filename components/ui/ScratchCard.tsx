import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated, Dimensions, Platform, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BorderRadius } from '@/constants/design';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = 400;
const SCRATCH_THRESHOLD = 75;
const CELL_SIZE = 20;
const BRUSH_RADIUS = 35;

const COLS = Math.ceil(CARD_WIDTH / CELL_SIZE);
const ROWS = Math.ceil(CARD_HEIGHT / CELL_SIZE);
const TOTAL_CELLS = COLS * ROWS;

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
  const [scratchedCells, setScratchedCells] = useState<Set<string>>(new Set());
  const [isRevealed, setIsRevealed] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const isRevealedRef = useRef(false);
  const disabledRef = useRef(disabled);
  const hasStartedRef = useRef(false);
  const scratchedCellsRef = useRef<Set<string>>(new Set());
  const lastHapticTime = useRef(0);
  const isMouseDown = useRef(false);
  
  disabledRef.current = disabled;
  isRevealedRef.current = isRevealed;

  useEffect(() => {
    setScratchedCells(new Set());
    scratchedCellsRef.current = new Set();
    setIsRevealed(false);
    isRevealedRef.current = false;
    hasStartedRef.current = false;
    opacity.setValue(1);
  }, [resetKey, opacity]);

  const checkAndReveal = useCallback(() => {
    const percentage = (scratchedCellsRef.current.size / TOTAL_CELLS) * 100;
    console.log(`Scratch: ${percentage.toFixed(1)}% (${scratchedCellsRef.current.size}/${TOTAL_CELLS})`);

    if (percentage >= SCRATCH_THRESHOLD && !isRevealedRef.current) {
      console.log('75% threshold reached! Auto-revealing...');
      setIsRevealed(true);
      isRevealedRef.current = true;
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onScratchComplete();
      });
    }
  }, [opacity, onScratchComplete]);

  const scratchAt = useCallback((x: number, y: number) => {
    if (isRevealedRef.current || disabledRef.current) return;

    const centerCol = Math.floor(x / CELL_SIZE);
    const centerRow = Math.floor(y / CELL_SIZE);
    const cellRadius = Math.ceil(BRUSH_RADIUS / CELL_SIZE);
    
    const newCells: string[] = [];

    for (let dr = -cellRadius; dr <= cellRadius; dr++) {
      for (let dc = -cellRadius; dc <= cellRadius; dc++) {
        const row = centerRow + dr;
        const col = centerCol + dc;
        
        if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
          const cellCenterX = col * CELL_SIZE + CELL_SIZE / 2;
          const cellCenterY = row * CELL_SIZE + CELL_SIZE / 2;
          const distance = Math.sqrt(Math.pow(x - cellCenterX, 2) + Math.pow(y - cellCenterY, 2));
          
          const key = `${row}-${col}`;
          if (distance <= BRUSH_RADIUS && !scratchedCellsRef.current.has(key)) {
            scratchedCellsRef.current.add(key);
            newCells.push(key);
          }
        }
      }
    }

    if (newCells.length > 0) {
      setScratchedCells(new Set(scratchedCellsRef.current));
      checkAndReveal();
    }
  }, [checkAndReveal]);

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
    
    scratchAt(x, y);
    triggerHaptic();
  }, [onTouchStart, onScratchStart, scratchAt, triggerHaptic]);

  const handleScratchMove = useCallback((x: number, y: number) => {
    if (disabledRef.current || isRevealedRef.current) return;
    scratchAt(x, y);
    triggerHaptic();
  }, [scratchAt, triggerHaptic]);

  const handleScratchEnd = useCallback(() => {
    if (onTouchEnd) onTouchEnd();
  }, [onTouchEnd]);

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

  const getLocationFromEvent = useCallback((e: any, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
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

  const getCellColor = useCallback((row: number) => {
    const yPercent = row / ROWS;
    const r = Math.round(255 - (255 - 255) * yPercent);
    const g = Math.round(107 - (107 - 64) * yPercent);
    const b = Math.round(138 - (138 - 129) * yPercent);
    return `rgb(${r}, ${g}, ${b})`;
  }, []);

  const renderScratchGrid = useCallback(() => {
    const rows: React.ReactNode[] = [];
    
    for (let row = 0; row < ROWS; row++) {
      const rowCells: React.ReactNode[] = [];
      const rowColor = getCellColor(row);
      
      for (let col = 0; col < COLS; col++) {
        const key = `${row}-${col}`;
        const isScratched = scratchedCells.has(key);
        
        rowCells.push(
          <View
            key={key}
            style={[
              styles.cell,
              {
                backgroundColor: isScratched ? 'transparent' : rowColor,
              },
            ]}
          />
        );
      }
      
      rows.push(
        <View key={`row-${row}`} style={styles.row}>
          {rowCells}
        </View>
      );
    }
    
    return rows;
  }, [scratchedCells, getCellColor]);

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
          <View style={styles.cellsContainer} pointerEvents="none">
            {renderScratchGrid()}
          </View>
          
          <View style={styles.textOverlay} pointerEvents="none">
            <Text style={styles.scratchTitle}>Scratch to Reveal</Text>
            <Text style={styles.scratchSubtitle}>Your adventure awaits</Text>
          </View>
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
  cellsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    height: CELL_SIZE,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  textOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scratchTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scratchSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});
