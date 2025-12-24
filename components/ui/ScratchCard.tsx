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
      onStartShouldSetPanResponder: (evt, gestureState) => {
        const shouldSet = !disabledRef.current && !isRevealedRef.current;
        console.log('[ScratchCard] onStartShouldSetPanResponder:', shouldSet, 'dx:', gestureState.dx, 'dy:', gestureState.dy);
        return shouldSet;
      },
      onStartShouldSetPanResponderCapture: (evt, gestureState) => {
        const shouldCapture = !disabledRef.current && !isRevealedRef.current;
        console.log('[ScratchCard] CAPTURE on start:', shouldCapture);
        return shouldCapture;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const shouldSet = !disabledRef.current && !isRevealedRef.current;
        console.log('[ScratchCard] onMoveShouldSetPanResponder:', shouldSet, 'dx:', gestureState.dx, 'dy:', gestureState.dy);
        return shouldSet;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        const shouldCapture = !disabledRef.current && !isRevealedRef.current;
        console.log('[ScratchCard] CAPTURE on move:', shouldCapture, 'dx:', gestureState.dx, 'dy:', gestureState.dy);
        return shouldCapture;
      },
      onPanResponderTerminationRequest: () => {
        console.log('[ScratchCard] Termination requested - REJECTING');
        return false;
      },
      onShouldBlockNativeResponder: () => {
        console.log('[ScratchCard] Blocking native responder');
        return true;
      },
      onPanResponderGrant: (evt, gestureState) => {
        console.log('[ScratchCard] GRANT - Touch started!');
        if (disabledRef.current || isRevealedRef.current) {
          console.log('[ScratchCard] But card is disabled or revealed, ignoring');
          return;
        }
        const { locationX, locationY } = evt.nativeEvent;
        console.log('[ScratchCard] Touch location:', locationX, locationY);
        
        if (onTouchStart) {
          console.log('[ScratchCard] Calling onTouchStart - disabling scroll');
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
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (disabledRef.current || isRevealedRef.current) return;
        const { locationX, locationY } = evt.nativeEvent;
        console.log('[ScratchCard] Move:', locationX, locationY, 'dx:', gestureState.dx, 'dy:', gestureState.dy);
        addScratch(locationX, locationY);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (disabledRef.current || isRevealedRef.current) return;
        console.log('[ScratchCard] Released! Total scratches:', scratches.length);
        checkScratchProgress();
        
        if (onTouchEnd) {
          console.log('[ScratchCard] Calling onTouchEnd - re-enabling scroll');
          onTouchEnd();
        }
      },
      onPanResponderTerminate: (evt, gestureState) => {
        console.log('[ScratchCard] Gesture TERMINATED');
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
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.revealLayer}>
        {revealContent}
      </View>

      {!isRevealed && (
        <Animated.View 
          style={[StyleSheet.absoluteFill, { opacity }]} 
          pointerEvents="none"
        >
          <MaskedView
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
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
