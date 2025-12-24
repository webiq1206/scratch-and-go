import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, PanResponder, Animated, Dimensions, Platform } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import * as Haptics from 'expo-haptics';
import { BorderRadius } from '@/constants/design';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = 300;

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
  
  disabledRef.current = disabled;
  isRevealedRef.current = isRevealed;

  const addScratch = useCallback((x: number, y: number) => {
    setScratches((prev) => [...prev, { x, y }]);
  }, []);

  const checkScratchProgress = useCallback(() => {
    if (isRevealed) return;
    
    const scratchPercentage = (scratches.length * 100) / 100;
    
    console.log('[ScratchCard] Progress:', scratchPercentage.toFixed(1), '% -', scratches.length, 'scratches');
    
    if (scratches.length >= 30) {
      console.log('[ScratchCard] Threshold reached! Revealing...');
      setIsRevealed(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        console.log('[ScratchCard] Animation complete, calling onScratchComplete');
        onScratchComplete();
      });
    }
  }, [scratches.length, isRevealed, opacity, onScratchComplete]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        const shouldSet = !disabledRef.current && !isRevealedRef.current;
        console.log('[ScratchCard] onStartShouldSetPanResponder - disabled:', disabledRef.current, 'isRevealed:', isRevealedRef.current, 'shouldSet:', shouldSet);
        return shouldSet;
      },
      onStartShouldSetPanResponderCapture: () => !disabledRef.current && !isRevealedRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current && !isRevealedRef.current,
      onMoveShouldSetPanResponderCapture: () => !disabledRef.current && !isRevealedRef.current,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (disabledRef.current || isRevealedRef.current) return;
        const { locationX, locationY } = evt.nativeEvent;
        console.log('[ScratchCard] Touch granted at:', locationX, locationY);
        
        if (onTouchStart) {
          onTouchStart();
        }
        
        if (!hasStartedRef.current) {
          console.log('[ScratchCard] First scratch - calling onScratchStart');
          hasStartedRef.current = true;
          if (onScratchStart) {
            onScratchStart();
          }
        }
        addScratch(locationX, locationY);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (evt) => {
        if (disabledRef.current || isRevealedRef.current) return;
        const { locationX, locationY } = evt.nativeEvent;
        addScratch(locationX, locationY);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderRelease: () => {
        if (disabledRef.current || isRevealedRef.current) return;
        console.log('[ScratchCard] Touch released');
        checkScratchProgress();
        
        if (onTouchEnd) {
          onTouchEnd();
        }
      },
      onPanResponderTerminate: () => {
        console.log('[ScratchCard] Gesture terminated');
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'black',
  },
  scratchMarkWeb: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});
