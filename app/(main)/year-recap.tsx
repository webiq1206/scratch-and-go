import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
  TouchableOpacity,
  Share,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Share2, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useYearRecap } from '@/contexts/YearRecapContext';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import Button from '@/components/ui/Button';
import { triggerHaptic } from '@/utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function YearRecapScreen() {
  const { currentYearRecap } = useYearRecap();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const totalSlides = 7;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentSlide, fadeAnim, scaleAnim]);

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (slideIndex !== currentSlide) {
      setCurrentSlide(slideIndex);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      triggerHaptic.light();
    }
  };

  const goToNextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      const nextSlide = currentSlide + 1;
      scrollViewRef.current?.scrollTo({ x: nextSlide * SCREEN_WIDTH, animated: true });
      setCurrentSlide(nextSlide);
      triggerHaptic.light();
    }
  };

  const goToPrevSlide = () => {
    if (currentSlide > 0) {
      const prevSlide = currentSlide - 1;
      scrollViewRef.current?.scrollTo({ x: prevSlide * SCREEN_WIDTH, animated: true });
      setCurrentSlide(prevSlide);
      triggerHaptic.light();
    }
  };

  const shareRecap = async () => {
    const message = generateShareMessage(currentYearRecap);
    
    try {
      await Share.share({
        message,
        title: `My ${currentYearRecap.year} Year in Review`,
      });
      triggerHaptic.success();
    } catch (error) {
      console.error('Error sharing recap:', error);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic.light();
              router.back();
            }}
            style={styles.closeButton}
          >
            <X size={24} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={shareRecap}
            style={styles.shareButton}
          >
            <Share2 size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
        >
          <Slide1 recap={currentYearRecap} fadeAnim={fadeAnim} scaleAnim={scaleAnim} />
          <Slide2 recap={currentYearRecap} fadeAnim={fadeAnim} scaleAnim={scaleAnim} />
          <Slide3 recap={currentYearRecap} fadeAnim={fadeAnim} scaleAnim={scaleAnim} />
          <Slide4 recap={currentYearRecap} fadeAnim={fadeAnim} scaleAnim={scaleAnim} />
          <Slide5 recap={currentYearRecap} fadeAnim={fadeAnim} scaleAnim={scaleAnim} />
          <Slide6 recap={currentYearRecap} fadeAnim={fadeAnim} scaleAnim={scaleAnim} />
          <Slide7 recap={currentYearRecap} fadeAnim={fadeAnim} scaleAnim={scaleAnim} />
        </ScrollView>

        <View style={styles.navigation}>
          {currentSlide > 0 && (
            <TouchableOpacity onPress={goToPrevSlide} style={styles.navButton}>
              <ArrowLeft size={24} color={Colors.white} />
            </TouchableOpacity>
          )}
          <View style={styles.pagination}>
            {Array.from({ length: totalSlides }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  currentSlide === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
          {currentSlide < totalSlides - 1 ? (
            <TouchableOpacity onPress={goToNextSlide} style={styles.navButton}>
              <ArrowRight size={24} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic.success();
                router.back();
              }}
              style={styles.navButton}
            >
              <X size={24} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
}

interface SlideProps {
  recap: any;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

function Slide1({ recap, fadeAnim, scaleAnim }: SlideProps) {
  return (
    <LinearGradient
      colors={['#FF6B6B', '#FF8E53', '#FFB347']}
      style={styles.slide}
    >
      <Animated.View
        style={[
          styles.slideContent,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.slideEmoji}>✨</Text>
        <Text style={styles.slideTitle}>Your {recap.year}</Text>
        <Text style={styles.slideSubtitle}>Year in Review</Text>
        <Text style={styles.slideDescription}>{recap.personalizedMessage}</Text>
      </Animated.View>
    </LinearGradient>
  );
}

function Slide2({ recap, fadeAnim, scaleAnim }: SlideProps) {
  return (
    <LinearGradient
      colors={['#667EEA', '#764BA2', '#F093FB']}
      style={styles.slide}
    >
      <Animated.View
        style={[
          styles.slideContent,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.slideEmoji}>🎯</Text>
        <Text style={styles.bigNumber}>{recap.totalActivitiesCompleted}</Text>
        <Text style={styles.slideTitle}>
          {recap.totalActivitiesCompleted === 1 ? 'Activity' : 'Activities'} Completed
        </Text>
        <Text style={styles.slideDescription}>
          {recap.totalActivitiesCompleted > 0
            ? 'Amazing! Every moment was a memory in the making.'
            : 'Ready to start your journey? The best memories are ahead!'}
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

function Slide3({ recap, fadeAnim, scaleAnim }: SlideProps) {
  const hours = Math.round(recap.totalTimeSpent / 60);
  return (
    <LinearGradient
      colors={['#11998E', '#38EF7D', '#A8E6CF']}
      style={styles.slide}
    >
      <Animated.View
        style={[
          styles.slideContent,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.slideEmoji}>⏰</Text>
        <Text style={styles.bigNumber}>{hours}</Text>
        <Text style={styles.slideTitle}>Hours of Quality Time</Text>
        <Text style={styles.slideDescription}>
          {hours > 0
            ? `That's ${Math.round(hours / 24)} days of unforgettable moments!`
            : 'Time well spent starts with a single activity.'}
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

function Slide4({ recap, fadeAnim, scaleAnim }: SlideProps) {
  return (
    <LinearGradient
      colors={['#FA709A', '#FEE140', '#FFDDE1']}
      style={styles.slide}
    >
      <Animated.View
        style={[
          styles.slideContent,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.slideEmoji}>{recap.favoriteCategory ? '❤️' : '🎨'}</Text>
        <Text style={styles.slideTitle}>
          {recap.favoriteCategory ? 'Favorite Category' : 'Explore Categories'}
        </Text>
        <Text style={styles.bigCategory}>
          {recap.favoriteCategory || 'Coming Soon'}
        </Text>
        <Text style={styles.slideDescription}>
          {recap.favoriteCategory
            ? 'You really loved these moments!'
            : 'Try different categories to find your favorites!'}
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

function Slide5({ recap, fadeAnim, scaleAnim }: SlideProps) {
  const monthsWithActivity = recap.monthlyBreakdown.filter((m: any) => m.count > 0).length;
  return (
    <LinearGradient
      colors={['#4E54C8', '#8F94FB', '#C6CFFF']}
      style={styles.slide}
    >
      <Animated.View
        style={[
          styles.slideContent,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.slideEmoji}>📅</Text>
        <Text style={styles.bigNumber}>{monthsWithActivity}</Text>
        <Text style={styles.slideTitle}>
          {monthsWithActivity === 1 ? 'Month' : 'Months'} Active
        </Text>
        <View style={styles.monthGrid}>
          {recap.monthlyBreakdown.map((month: any, index: number) => (
            <View
              key={index}
              style={[
                styles.monthBox,
                month.count > 0 && styles.monthBoxActive,
              ]}
            >
              <Text
                style={[
                  styles.monthText,
                  month.count > 0 && styles.monthTextActive,
                ]}
              >
                {month.month}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

function Slide6({ recap, fadeAnim, scaleAnim }: SlideProps) {
  return (
    <LinearGradient
      colors={['#F857A6', '#FF5858', '#FFAAAA']}
      style={styles.slide}
    >
      <Animated.View
        style={[
          styles.slideContent,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.slideEmoji}>🏆</Text>
        <Text style={styles.slideTitle}>Highlights</Text>
        {recap.highlights.length > 0 ? (
          <View style={styles.highlightsList}>
            {recap.highlights.slice(0, 4).map((highlight: any, index: number) => (
              <View key={index} style={styles.highlightItem}>
                <Text style={styles.highlightEmoji}>{highlight.emoji}</Text>
                <View style={styles.highlightText}>
                  <Text style={styles.highlightTitle}>{highlight.title}</Text>
                  <Text style={styles.highlightDescription}>{highlight.description}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.slideDescription}>
            Complete more activities to unlock achievements!
          </Text>
        )}
      </Animated.View>
    </LinearGradient>
  );
}

function Slide7({ recap, fadeAnim, scaleAnim }: SlideProps) {
  return (
    <LinearGradient
      colors={['#12C2E9', '#C471ED', '#F64F59']}
      style={styles.slide}
    >
      <Animated.View
        style={[
          styles.slideContent,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.slideEmoji}>💫</Text>
        <Text style={styles.slideTitle}>Here&apos;s to {recap.year + 1}!</Text>
        <Text style={styles.slideDescription}>
          Keep making memories, trying new things, and building amazing moments together.
        </Text>
        <Button
          title="Share Your Year"
          onPress={async () => {
            const message = generateShareMessage(recap);
            try {
              await Share.share({
                message,
                title: `My ${recap.year} Year in Review`,
              });
              triggerHaptic.success();
            } catch (error) {
              console.error('Error sharing:', error);
            }
          }}
          variant="primary"
          style={styles.shareButtonLarge}
        />
      </Animated.View>
    </LinearGradient>
  );
}

function generateShareMessage(recap: any): string {
  const emoji = '✨';
  let message = `${emoji} My ${recap.year} Year in Review ${emoji}\n\n`;
  
  if (recap.totalActivitiesCompleted > 0) {
    message += `🎯 ${recap.totalActivitiesCompleted} activities completed\n`;
  }
  
  const hours = Math.round(recap.totalTimeSpent / 60);
  if (hours > 0) {
    message += `⏰ ${hours} hours of quality time\n`;
  }
  
  if (recap.favoriteCategory) {
    message += `❤️ Loved ${recap.favoriteCategory} activities\n`;
  }
  
  if (recap.streakRecord > 0) {
    message += `🔥 ${recap.streakRecord} week streak!\n`;
  }
  
  message += `\n${recap.personalizedMessage}\n\n`;
  message += `Made with Scratch & Go - Making memories, one activity at a time! 💕`;
  
  return message;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  slideEmoji: {
    fontSize: 80,
    marginBottom: Spacing.xl,
  },
  slideTitle: {
    fontSize: 36,
    fontWeight: Typography.weights.bold as any,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  slideSubtitle: {
    fontSize: 28,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  slideDescription: {
    fontSize: 18,
    fontWeight: Typography.weights.regular as any,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.9,
  },
  bigNumber: {
    fontSize: 96,
    fontWeight: Typography.weights.bold as any,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  bigCategory: {
    fontSize: 32,
    fontWeight: Typography.weights.bold as any,
    color: Colors.white,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: Spacing.lg,
  },
  monthBox: {
    width: 70,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthBoxActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  monthText: {
    fontSize: 14,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.white,
  },
  monthTextActive: {
    color: '#4E54C8',
  },
  highlightsList: {
    width: '100%',
    marginTop: Spacing.lg,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  highlightEmoji: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  highlightText: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 18,
    fontWeight: Typography.weights.bold as any,
    color: Colors.white,
    marginBottom: 4,
  },
  highlightDescription: {
    fontSize: 14,
    fontWeight: Typography.weights.regular as any,
    color: Colors.white,
    opacity: 0.9,
  },
  navigation: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: Colors.white,
  },
  shareButtonLarge: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
});
