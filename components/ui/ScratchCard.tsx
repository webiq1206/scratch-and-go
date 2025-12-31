import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated, Dimensions, Platform } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import * as Haptics from 'expo-haptics';
import { BorderRadius } from '@/constants/design';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = 400;

interface ScratchCardProps {
  onScratchStart?: () => void;
  onScratchComplete: () => void;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  scratchLayer: React.ReactNode;
  revealContent: React.ReactNode;
  disabled?: boolean;
}

export default function ScratchCard({ 
  onScratchStart,
  onScratchComplete,
  onTouchStart,
  onTouchEnd,
  scratchLayer,
  revealContent,
  disabled = false
}: ScratchCardProps) {
  const [scratches, setScratches] = useState<{ x: number; y: number }[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const isRevealedRef = useRef(false);
  const disabledRef = useRef(disabled);
  const hasStartedRef = useRef(false);
  const scratchPercentage = useRef(0);
  
  disabledRef.current = disabled;
  isRevealedRef.current = isRevealed;

  const addScratch = useCallback((x: number, y: number) => {
    setScratches((prev) => {
      const newScratches = [...prev, { x, y }];
      const uniquePositions = new Set(
        newScratches.map(s => `${Math.floor(s.x / 20)},${Math.floor(s.y / 20)}`)
      );
      scratchPercentage.current = (uniquePositions.size / ((CARD_WIDTH / 20) * (CARD_HEIGHT / 20))) * 100;
      return newScratches;
    });
  }, []);

  const checkScratchProgress = useCallback(() => {
    if (isRevealedRef.current) return;
    
    if (scratchPercentage.current >= 30) {
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

  useEffect(() => {
    checkScratchProgress();
  }, [checkScratchProgress]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        return !disabledRef.current && !isRevealedRef.current;
      },
      onStartShouldSetPanResponderCapture: () => {
        return true;
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
        
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderMove: (evt) => {
        if (disabledRef.current || isRevealedRef.current) return;
        
        const { locationX, locationY } = evt.nativeEvent;
        addScratch(locationX, locationY);
        
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderRelease: () => {
        if (disabledRef.current || isRevealedRef.current) return;
        
        checkScratchProgress();
        
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
                    left: scratch.x - 30,
                    top: scratch.y - 30,
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
                        left: scratch.x - 25,
                        top: scratch.y - 25,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'black',
  },
  scratchMarkWeb: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});
