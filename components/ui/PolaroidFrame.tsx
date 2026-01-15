import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Camera, Heart, Users, Plus, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius, Shadows } from '@/constants/design';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PolaroidSize = 'small' | 'medium' | 'large' | 'hero';

interface PolaroidFrameProps {
  /** Image URI to display */
  imageUri?: string | null;
  /** Caption text below the image */
  caption?: string;
  /** Size variant */
  size?: PolaroidSize;
  /** Rotation angle in degrees */
  rotation?: number;
  /** Whether this is a placeholder for empty state */
  isEmpty?: boolean;
  /** Placeholder prompt text */
  emptyPrompt?: string;
  /** Mode for theming (couples or family) */
  mode?: 'couples' | 'family';
  /** Callback when pressed */
  onPress?: () => void;
  /** Whether to show tape decoration */
  showTape?: boolean;
  /** Custom style overrides */
  style?: any;
}

const SIZE_CONFIG = {
  small: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md * 2) / 3,
    aspectRatio: 1.2,
    padding: 4,
    bottomPadding: 16,
    fontSize: Typography.sizes.tiny,
    iconSize: 16,
  },
  medium: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2,
    aspectRatio: 1.25,
    padding: 6,
    bottomPadding: 24,
    fontSize: Typography.sizes.small,
    iconSize: 20,
  },
  large: {
    width: SCREEN_WIDTH - Spacing.lg * 4,
    aspectRatio: 1.25,
    padding: 8,
    bottomPadding: 32,
    fontSize: Typography.sizes.body,
    iconSize: 24,
  },
  hero: {
    width: SCREEN_WIDTH - Spacing.lg * 2,
    aspectRatio: 1.3,
    padding: 10,
    bottomPadding: 40,
    fontSize: Typography.sizes.body,
    iconSize: 32,
  },
};

export default function PolaroidFrame({
  imageUri,
  caption,
  size = 'medium',
  rotation = 0,
  isEmpty = false,
  emptyPrompt,
  mode = 'couples',
  onPress,
  showTape = false,
  style,
}: PolaroidFrameProps) {
  const config = SIZE_CONFIG[size];
  const frameWidth = config.width;
  const frameHeight = frameWidth * config.aspectRatio;
  const imageHeight = frameHeight - config.bottomPadding - config.padding * 2;

  const renderContent = () => {
    if (imageUri && !isEmpty) {
      return (
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            {
              height: imageHeight,
              borderRadius: 2,
            },
          ]}
          contentFit="cover"
          transition={300}
        />
      );
    }

    // Empty state
    return (
      <View
        style={[
          styles.emptyContent,
          {
            height: imageHeight,
            backgroundColor: Colors.backgroundLight,
          },
        ]}
      >
        <View style={styles.emptyIconContainer}>
          {mode === 'couples' ? (
            <Heart size={config.iconSize} color={Colors.primary} />
          ) : (
            <Users size={config.iconSize} color={Colors.primary} />
          )}
        </View>
        {emptyPrompt && size !== 'small' && (
          <Text style={[styles.emptyPrompt, { fontSize: config.fontSize }]}>
            {emptyPrompt}
          </Text>
        )}
        {!emptyPrompt && size !== 'small' && (
          <View style={styles.emptyAddIcon}>
            <Plus size={config.iconSize * 0.6} color={Colors.textMuted} />
          </View>
        )}
      </View>
    );
  };

  const frame = (
    <View
      style={[
        styles.frame,
        {
          width: frameWidth,
          height: frameHeight,
          padding: config.padding,
          paddingBottom: config.bottomPadding,
          transform: [{ rotate: `${rotation}deg` }],
        },
        style,
      ]}
    >
      {showTape && (
        <View style={styles.tapeContainer}>
          <View style={[styles.tape, styles.tapeLeft]} />
        </View>
      )}
      
      {renderContent()}
      
      {caption && (
        <Text
          style={[
            styles.caption,
            { fontSize: config.fontSize },
          ]}
          numberOfLines={1}
        >
          {caption}
        </Text>
      )}
      
      {isEmpty && !caption && (
        <View style={styles.captionPlaceholder}>
          <View style={[styles.captionLine, { width: '60%' }]} />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {frame}
      </TouchableOpacity>
    );
  }

  return frame;
}

// Mini polaroid for decorative floating backgrounds
interface MiniPolaroidProps {
  imageUri?: string;
  rotation?: number;
  style?: any;
}

export function MiniPolaroid({ imageUri, rotation = 0, style }: MiniPolaroidProps) {
  const size = 60;
  const padding = 3;
  const bottomPadding = 12;
  const imageHeight = size - bottomPadding - padding * 2;

  return (
    <View
      style={[
        styles.miniFrame,
        {
          width: size,
          height: size + bottomPadding - padding,
          padding,
          paddingBottom: bottomPadding,
          transform: [{ rotate: `${rotation}deg` }],
        },
        style,
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[styles.image, { height: imageHeight, borderRadius: 1 }]}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.miniEmpty,
            { height: imageHeight },
          ]}
        >
          <Sparkles size={12} color={Colors.primary} />
        </View>
      )}
    </View>
  );
}

// Polaroid stack for showing multiple memories
interface PolaroidStackProps {
  images: (string | null)[];
  size?: PolaroidSize;
  mode?: 'couples' | 'family';
  onPress?: () => void;
}

export function PolaroidStack({
  images,
  size = 'medium',
  mode = 'couples',
  onPress,
}: PolaroidStackProps) {
  const displayImages = images.slice(0, 3);
  const rotations = [-5, 2, -1];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
      style={styles.stackContainer}
    >
      {displayImages.map((img, index) => (
        <View
          key={index}
          style={[
            styles.stackItem,
            {
              zIndex: displayImages.length - index,
              marginTop: index * 8,
              marginLeft: index * 6,
            },
          ]}
        >
          <PolaroidFrame
            imageUri={img}
            size={size}
            rotation={rotations[index] || 0}
            isEmpty={!img}
            mode={mode}
          />
        </View>
      ))}
      {images.length > 3 && (
        <View style={styles.stackBadge}>
          <Text style={styles.stackBadgeText}>+{images.length - 3}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#F5F5F0',
    borderRadius: 2,
    ...Shadows.medium,
  },
  miniFrame: {
    backgroundColor: '#F5F5F0',
    borderRadius: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  image: {
    width: '100%',
    backgroundColor: Colors.backgroundLight,
  },
  emptyContent: {
    width: '100%',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderStyle: 'dashed',
  },
  emptyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyPrompt: {
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.xs,
  },
  emptyAddIcon: {
    marginTop: Spacing.xs,
  },
  miniEmpty: {
    width: '100%',
    borderRadius: 1,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    color: '#333',
    textAlign: 'center',
    marginTop: 'auto',
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  captionPlaceholder: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: Spacing.xs,
  },
  captionLine: {
    height: 2,
    backgroundColor: '#E0E0E0',
    borderRadius: 1,
  },
  tapeContainer: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  tape: {
    width: 40,
    height: 16,
    backgroundColor: 'rgba(255, 235, 180, 0.8)',
    borderRadius: 2,
  },
  tapeLeft: {
    transform: [{ rotate: '-3deg' }],
  },
  stackContainer: {
    position: 'relative',
  },
  stackItem: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  stackBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    zIndex: 100,
  },
  stackBadgeText: {
    fontSize: Typography.sizes.tiny,
    fontWeight: '600',
    color: Colors.backgroundDark,
  },
});
