import React, { useState, useRef } from 'react';
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
  scratchLayer: React.ReactNode;
  revealContent: React.ReactNode;
  disabled?: boolean;
}

export default function ScratchCard({ 
  onScratchStart,
  onScratchComplete, 
  scratchLayer,
  revealContent,
  disabled = false
}: ScratchCardProps) {
  const [scratches, setScratches] = useState<{ x: number; y: number }[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onStartShouldSetPanResponderCapture: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponderCapture: () => !disabled,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (disabled) return;
        const { locationX, locationY } = evt.nativeEvent;
        if (scratches.length === 0 && onScratchStart) {
          onScratchStart();
        }
        addScratch(locationX, locationY);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (evt) => {
        if (disabled) return;
        const { locationX, locationY } = evt.nativeEvent;
        addScratch(locationX, locationY);
        if (scratches.length % 3 === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderRelease: () => {
        if (disabled) return;
        checkScratchProgress();
      },
    })
  ).current;

  const addScratch = (x: number, y: number) => {
    setScratches((prev) => [...prev, { x, y }]);
  };

  const checkScratchProgress = () => {
    const scratchPercentage = (scratches.length * 100) / 200;
    
    if (scratchPercentage >= 50 && !isRevealed) {
      setIsRevealed(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onScratchComplete();
      });
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container} pointerEvents={disabled ? 'none' : 'auto'}>
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
                    left: scratch.x - 25,
                    top: scratch.y - 25,
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
    <View style={styles.container} pointerEvents={disabled ? 'none' : 'auto'}>
      <View style={styles.revealLayer}>
        {revealContent}
      </View>

      {!isRevealed && (
        <Animated.View style={{ opacity }} pointerEvents={disabled ? 'none' : 'auto'}>
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
            <View 
              style={StyleSheet.absoluteFill}
              {...panResponder.panHandlers}
            >
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});
