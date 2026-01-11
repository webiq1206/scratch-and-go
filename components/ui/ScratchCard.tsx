import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated, Dimensions, Platform, Text } from 'react-native';

import * as Haptics from 'expo-haptics';
import { BorderRadius } from '@/constants/design';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = 400;
const SCRATCH_THRESHOLD = 75;
const CELL_SIZE = 14;
const BRUSH_RADIUS = 26;

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
  const [grid, setGrid] = useState<boolean[][]>(() => 
    Array(ROWS).fill(null).map(() => Array(COLS).fill(false))
  );
  const [isRevealed, setIsRevealed] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const isRevealedRef = useRef(false);
  const disabledRef = useRef(disabled);
  const hasStartedRef = useRef(false);
  const gridRef = useRef<boolean[][]>(grid);
  const scratchCountRef = useRef(0);
  const lastHapticTime = useRef(0);
  const isMouseDown = useRef(false);
  const batchedUpdates = useRef<{row: number; col: number}[]>([]);
  const updateScheduled = useRef(false);
  
  disabledRef.current = disabled;
  isRevealedRef.current = isRevealed;
  gridRef.current = grid;

  useEffect(() => {
    const newGrid = Array(ROWS).fill(null).map(() => Array(COLS).fill(false));
    setGrid(newGrid);
    gridRef.current = newGrid;
    scratchCountRef.current = 0;
    setIsRevealed(false);
    isRevealedRef.current = false;
    hasStartedRef.current = false;
    batchedUpdates.current = [];
    updateScheduled.current = false;
    opacity.setValue(1);
  }, [resetKey, opacity]);

  const flushBatchedUpdates = useCallback(() => {
    if (batchedUpdates.current.length === 0) return;
    
    const updates = [...batchedUpdates.current];
    batchedUpdates.current = [];
    updateScheduled.current = false;

    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => [...row]);
      let newCount = scratchCountRef.current;
      
      for (const {row, col} of updates) {
        if (!newGrid[row][col]) {
          newGrid[row][col] = true;
          newCount++;
        }
      }
      
      scratchCountRef.current = newCount;
      
      const percentage = (newCount / TOTAL_CELLS) * 100;
      console.log(`Scratch: ${percentage.toFixed(1)}%`);

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
      
      return newGrid;
    });
  }, [opacity, onScratchComplete]);

  const scratchAt = useCallback((x: number, y: number) => {
    if (isRevealedRef.current || disabledRef.current) return;

    const centerCol = Math.floor(x / CELL_SIZE);
    const centerRow = Math.floor(y / CELL_SIZE);
    const cellRadius = Math.ceil(BRUSH_RADIUS / CELL_SIZE);

    for (let dr = -cellRadius; dr <= cellRadius; dr++) {
      for (let dc = -cellRadius; dc <= cellRadius; dc++) {
        const row = centerRow + dr;
        const col = centerCol + dc;
        
        if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
          const cellCenterX = col * CELL_SIZE + CELL_SIZE / 2;
          const cellCenterY = row * CELL_SIZE + CELL_SIZE / 2;
          const distance = Math.sqrt(Math.pow(x - cellCenterX, 2) + Math.pow(y - cellCenterY, 2));
          
          if (distance <= BRUSH_RADIUS && !gridRef.current[row][col]) {
            batchedUpdates.current.push({row, col});
          }
        }
      }
    }

    if (!updateScheduled.current && batchedUpdates.current.length > 0) {
      updateScheduled.current = true;
      requestAnimationFrame(flushBatchedUpdates);
    }
  }, [flushBatchedUpdates]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS === 'web') return;
    
    const now = Date.now();
    if (now - lastHapticTime.current > 60) {
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
    flushBatchedUpdates();
    if (onTouchEnd) onTouchEnd();
  }, [onTouchEnd, flushBatchedUpdates]);

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
      const { x, y } = getLocationFromEvent(e, e.currentTarget);
      handleScratchStart(x, y);
    },
    onTouchMove: (e: any) => {
      e.preventDefault();
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

  const getCellColor = useCallback((row: number, col: number) => {
    const yPercent = row / ROWS;
    const r = Math.round(255 - (255 - 255) * yPercent);
    const g = Math.round(107 - (107 - 64) * yPercent);
    const b = Math.round(138 - (138 - 129) * yPercent);
    return `rgb(${r}, ${g}, ${b})`;
  }, []);

  const renderScratchCells = () => {
    const cells: React.ReactNode[] = [];
    
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (!grid[row][col]) {
          cells.push(
            <View
              key={`${col}-${row}`}
              style={[
                styles.cell,
                {
                  left: col * CELL_SIZE,
                  top: row * CELL_SIZE,
                  width: CELL_SIZE + 1,
                  height: CELL_SIZE + 1,
                  backgroundColor: getCellColor(row, col),
                },
              ]}
            />
          );
        }
      }
    }
    
    return cells;
  };

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
            {renderScratchCells()}
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
  },
  cell: {
    position: 'absolute',
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
