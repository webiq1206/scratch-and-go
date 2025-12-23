import React, { useState, useRef } from 'react';
import { View, StyleSheet, PanResponder, Animated, Dimensions } from 'react-native';
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
}

export default function ScratchCard({ 
  onScratchStart,
  onScratchComplete, 
  scratchLayer,
  revealContent 
}: ScratchCardProps) {
  const [scratches, setScratches] = useState<{ x: number; y: number }[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        if (scratches.length === 0 && onScratchStart) {
          onScratchStart();
        }
        addScratch(locationX, locationY);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        addScratch(locationX, locationY);
        if (scratches.length % 3 === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderRelease: () => {
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
                styles.scratchMark,
                {
                  left: scratch.x - 20,
                  top: scratch.y - 20,
                },
              ]}
            />
          ))}
        </Animated.View>
      )}
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
  scratchMark: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
