import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useStats } from '@/contexts/StatsContext';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Trophy,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Target,
  Bookmark,
  CheckCircle2,
  Flame,
  ChevronRight
} from 'lucide-react-native';
import Logo from '@/components/ui/Logo';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const { stats, streakData } = useStats();

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatMoney = (amount: number): string => {
    if (amount === 0) return '$0';
    return `$${amount.toLocaleString()}`;
  };

  const cardWidth = (width - Spacing.lg * 2 - Spacing.md) / 2;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <TrendingUp size={28} color={Colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Your Journey</Text>
          <Text style={styles.headerSubtitle}>
            Track your progress and achievements
          </Text>
        </View>

        {/* Year Recap Button */}
        <TouchableOpacity
          style={styles.yearRecapButton}
          onPress={() => router.push('/(main)/year-recap' as any)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.yearRecapGradient}
          >
            <View style={styles.yearRecapContent}>
              <View style={styles.yearRecapIcon}>
                <Calendar size={24} color={Colors.white} />
              </View>
              <View style={styles.yearRecapText}>
                <Text style={styles.yearRecapTitle}>{new Date().getFullYear()} Year in Review</Text>
                <Text style={styles.yearRecapSubtitle}>See your highlights</Text>
              </View>
              <ChevronRight size={20} color={Colors.white} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Streak Card */}
        {stats.currentStreak > 0 && (
          <View style={styles.streakCard}>
            <LinearGradient
              colors={[Colors.accentMuted, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.streakGradient}
            >
              <View style={styles.streakIcon}>
                <Flame size={24} color={Colors.accent} />
              </View>
              <View style={styles.streakContent}>
                <Text style={styles.streakValue}>{stats.currentStreak} Week Streak</Text>
                <Text style={styles.streakLabel}>Keep it going!</Text>
              </View>
              {stats.longestStreak > stats.currentStreak && (
                <View style={styles.streakBest}>
                  <Trophy size={14} color={Colors.textMuted} />
                  <Text style={styles.streakBestText}>Best: {stats.longestStreak}</Text>
                </View>
              )}
            </LinearGradient>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { width: cardWidth }]}>
            <View style={styles.statIcon}>
              <Logo size={24} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats.totalScratched}</Text>
            <Text style={styles.statLabel}>Scratched</Text>
          </View>

          <View style={[styles.statCard, { width: cardWidth }]}>
            <View style={styles.statIcon}>
              <Bookmark size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats.totalSaved}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>

          <View style={[styles.statCard, { width: cardWidth }]}>
            <View style={styles.statIcon}>
              <CheckCircle2 size={20} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>{stats.totalCompleted}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={[styles.statCard, { width: cardWidth }]}>
            <View style={styles.statIcon}>
              <Target size={20} color={Colors.accent} />
            </View>
            <Text style={styles.statValue}>{stats.currentMonthScratches}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        {/* Time & Money Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment</Text>
          <View style={styles.investmentRow}>
            <View style={styles.investmentCard}>
              <View style={[styles.investmentIcon, { backgroundColor: Colors.primaryMuted }]}>
                <Clock size={24} color={Colors.primary} />
              </View>
              <Text style={styles.investmentValue}>{formatTime(stats.estimatedTimeSpent)}</Text>
              <Text style={styles.investmentLabel}>Time invested</Text>
            </View>
            <View style={styles.investmentCard}>
              <View style={[styles.investmentIcon, { backgroundColor: Colors.successMuted }]}>
                <DollarSign size={24} color={Colors.success} />
              </View>
              <Text style={styles.investmentValue}>{formatMoney(stats.estimatedMoneySpent)}</Text>
              <Text style={styles.investmentLabel}>Money invested</Text>
            </View>
          </View>
        </View>

        {/* Favorite Categories */}
        {stats.favoriteCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            <View style={styles.categoriesContainer}>
              {stats.favoriteCategories.slice(0, 5).map((category, index) => (
                <View key={category.category} style={styles.categoryItem}>
                  <View style={styles.categoryRank}>
                    <Text style={styles.categoryRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.category}</Text>
                    <View style={styles.categoryBar}>
                      <View 
                        style={[
                          styles.categoryBarFill, 
                          { width: `${category.percentage}%` }
                        ]} 
                      />
                    </View>
                  </View>
                  <Text style={styles.categoryCount}>{category.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Weekly Activity */}
        {streakData.weeklyActivities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly Activity</Text>
            <Text style={styles.sectionSubtitle}>Last 12 weeks</Text>
            <View style={styles.weeklyContainer}>
              {streakData.weeklyActivities.map((week, index) => (
                <View key={index} style={styles.weekBlock}>
                  <View 
                    style={[
                      styles.weekBar,
                      week.hasActivity ? styles.weekBarActive : styles.weekBarInactive
                    ]}
                  />
                </View>
              ))}
            </View>
            <View style={styles.weeklyLabels}>
              <Text style={styles.weeklyLabel}>Now</Text>
              <Text style={styles.weeklyLabel}>12w ago</Text>
            </View>
          </View>
        )}

        {/* Monthly Recap */}
        {stats.monthlyRecap.highlights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{stats.monthlyRecap.month} Recap</Text>
            <View style={styles.recapCard}>
              <View style={styles.recapStats}>
                <View style={styles.recapStatItem}>
                  <Text style={styles.recapStatValue}>{stats.monthlyRecap.activitiesScratched}</Text>
                  <Text style={styles.recapStatLabel}>Scratched</Text>
                </View>
                <View style={styles.recapDivider} />
                <View style={styles.recapStatItem}>
                  <Text style={styles.recapStatValue}>{stats.monthlyRecap.activitiesCompleted}</Text>
                  <Text style={styles.recapStatLabel}>Completed</Text>
                </View>
                <View style={styles.recapDivider} />
                <View style={styles.recapStatItem}>
                  <Text style={styles.recapStatValue}>{formatTime(stats.monthlyRecap.totalTimeSpent)}</Text>
                  <Text style={styles.recapStatLabel}>Time</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Empty State */}
        {stats.totalCompleted === 0 && stats.totalScratched === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Logo size={56} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Start Your Journey</Text>
            <Text style={styles.emptyText}>
              Scratch your first activity to begin tracking your adventures!
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.sizes.h1,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
  },
  
  // Year Recap
  yearRecapButton: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
  },
  yearRecapGradient: {
    padding: Spacing.lg,
  },
  yearRecapContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearRecapIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  yearRecapText: {
    flex: 1,
  },
  yearRecapTitle: {
    fontSize: Typography.sizes.body,
    fontWeight: '600' as const,
    color: Colors.white,
    marginBottom: 2,
  },
  yearRecapSubtitle: {
    fontSize: Typography.sizes.small,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  // Streak
  streakCard: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  streakGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  streakContent: {
    flex: 1,
  },
  streakValue: {
    fontSize: Typography.sizes.h3,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  streakLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },
  streakBest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakBestText: {
    fontSize: Typography.sizes.small,
    color: Colors.textMuted,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.sizes.h2,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },
  
  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  
  // Investment
  investmentRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  investmentCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  investmentIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  investmentValue: {
    fontSize: Typography.sizes.h2,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  investmentLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },
  
  // Categories
  categoriesContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  categoryRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryRankText: {
    fontSize: Typography.sizes.small,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  categoryInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  categoryName: {
    fontSize: Typography.sizes.caption,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  categoryBar: {
    height: 4,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  categoryCount: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    fontWeight: '500' as const,
  },
  
  // Weekly
  weeklyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  weekBlock: {
    flex: 1,
    paddingHorizontal: 2,
  },
  weekBar: {
    height: 32,
    borderRadius: BorderRadius.xs,
  },
  weekBarActive: {
    backgroundColor: Colors.primary,
  },
  weekBarInactive: {
    backgroundColor: Colors.backgroundLight,
  },
  weeklyLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyLabel: {
    fontSize: Typography.sizes.tiny,
    color: Colors.textMuted,
  },
  
  // Recap
  recapCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  recapStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  recapStatItem: {
    alignItems: 'center',
  },
  recapStatValue: {
    fontSize: Typography.sizes.h3,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  recapStatLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },
  recapDivider: {
    width: 1,
    backgroundColor: Colors.cardBorder,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  
  bottomSpacer: {
    height: Spacing.xxl,
  },
});

