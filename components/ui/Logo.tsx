import React from 'react';
import { Image as ExpoImage } from 'expo-image';
import { StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  color?: string;
}

// Heart logo from imgbb - https://ibb.co/XfBLqqLJ
const LOGO_URI = 'https://i.ibb.co/XfBLqqLJ/image.png';

/**
 * Brand heart logo component
 * Uses the actual hand-drawn heart image
 */
export default function Logo({ 
  size = 48, 
  color,
}: LogoProps) {
  return (
    <ExpoImage
      source={{ uri: LOGO_URI }}
      style={[
        styles.logo,
        { 
          width: size, 
          height: size,
        }
      ]}
      contentFit="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    // Default styling
  },
});
