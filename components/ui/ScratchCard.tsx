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
      onMoveShouldSetPanResponder: () => true,
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
    const scratchPercentage = (scratches.length * 100) / 150;
    
    if (scratchPercentage >= 60 && !isRevealed) {
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
  },
  revealLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  scratchLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  scratchMark: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
});
