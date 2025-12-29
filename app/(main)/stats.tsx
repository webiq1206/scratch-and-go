import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useStats } from '@/contexts/StatsContext';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Award,
  Sparkles,
  Calendar
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const { stats, streakData } = useStats();

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const formatMoney = (amount: number): string => {
    if (amount === 0) return '$0';
    return `$${amount.toLocaleString()}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: Colors.backgroundDark },
          headerTintColor: Colors.text,
          headerTitle: 'Your Stats',
        }}
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Sparkles size={32} color={Colors.accent} />
          <Text style={styles.headerTitle}>Your Journey</Text>
          <Text style={styles.headerSubtitle}>
            Track your adventures and achievements
          </Text>
        </View>

        <TouchableOpacity
          style={styles.yearRecapButton}
          onPress={() => router.push('/(main)/year-recap' as any)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF6B6B', '#C471ED', '#12C2E9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.yearRecapGradient}
          >
            <View style={styles.yearRecapContent}>
              <Calendar size={28} color={Colors.white} />
              <View style={styles.yearRecapText}>
                <Text style={styles.yearRecapTitle}>Your {new Date().getFullYear()} Year in Review</Text>
                <Text style={styles.yearRecapSubtitle}>See your memories and achievements</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalScratched}</Text>
            <Text style={styles.statLabel}>Activities Scratched</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalSaved}</Text>
            <Text style={styles.statLabel}>Activities Saved</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalCompleted}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.currentMonthScratches}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        {stats.currentStreak > 0 && (
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakCard}
          >
            <Award size={32} color={Colors.white} />
            <View style={styles.streakContent}>
              <Text style={styles.streakValue}>{stats.currentStreak} Week Streak!</Text>
              <Text style={styles.streakLabel}>
                You&apos;re on fire! Keep completing activities.
              </Text>
              {stats.longestStreak > stats.currentStreak && (
                <Text style={styles.streakBest}>
                  Personal best: {stats.longestStreak} weeks
                </Text>
              )}
            </View>
          </LinearGradient>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time & Money</Text>
          <View style={styles.row}>
            <View style={styles.timeMoneyCard}>
              <Text style={styles.timeMoneyValue}>{formatTime(stats.estimatedTimeSpent)}</Text>
              <Text style={styles.timeMoneyLabel}>Time Spent</Text>
            </View>
            <View style={styles.timeMoneyCard}>
              <Text style={styles.timeMoneyValue}>{formatMoney(stats.estimatedMoneySpent)}</Text>
              <Text style={styles.timeMoneyLabel}>Invested</Text>
            </View>
          </View>
        </View>

        {stats.favoriteCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Favorite Categories</Text>
            <View style={styles.categoriesContainer}>
              {stats.favoriteCategories.map((category, index) => (
                <View key={category.category} style={styles.categoryItem}>
                  <View style={styles.categoryRank}>
                    <Text style={styles.categoryRankText}>#{index + 1}</Text>
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

        {stats.monthlyRecap.highlights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.recapHeader}>
              <Text style={styles.sectionTitle}>
                {stats.monthlyRecap.month} Recap
              </Text>
            </View>
            <View style={styles.recapCard}>
              <View style={styles.recapStats}>
                <View style={styles.recapStatItem}>
                  <Text style={styles.recapStatValue}>
                    {stats.monthlyRecap.activitiesScratched}
                  </Text>
                  <Text style={styles.recapStatLabel}>Scratched</Text>
                </View>
                <View style={styles.recapDivider} />
                <View style={styles.recapStatItem}>
                  <Text style={styles.recapStatValue}>
                    {stats.monthlyRecap.activitiesCompleted}
                  </Text>
                  <Text style={styles.recapStatLabel}>Completed</Text>
                </View>
                <View style={styles.recapDivider} />
                <View style={styles.recapStatItem}>
                  <Text style={styles.recapStatValue}>
                    {formatTime(stats.monthlyRecap.totalTimeSpent)}
                  </Text>
                  <Text style={styles.recapStatLabel}>Time</Text>
                </View>
              </View>
              {stats.monthlyRecap.highlights.length > 0 && (
                <View style={styles.highlightsContainer}>
                  <Text style={styles.highlightsTitle}>Highlights</Text>
                  {stats.monthlyRecap.highlights.map((highlight, index) => (
                    <View key={index} style={styles.highlightItem}>
                      <View style={styles.highlightDot} />
                      <Text style={styles.highlightText}>{highlight}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

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
              <Text style={styles.weeklyLabel}>12 weeks ago</Text>
            </View>
          </View>
        )}

        {stats.totalCompleted === 0 && stats.totalScratched === 0 && (
          <View style={styles.emptyState}>
            <Sparkles size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Start Your Journey</Text>
            <Text style={styles.emptyText}>
              Scratch your first activity card to begin tracking your adventures!
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
    backgroundColor: Colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.sizes.h1,
    fontWeight: Typography.weights.regular,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  statCard: {
    width: (width - Spacing.md * 2 - Spacing.sm) / 2,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statEmoji: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.sizes.h1,
    fontWeight: Typography.weights.regular,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    textAlign: 'center',
  },
  streakCard: {
    borderRadius: 16,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  streakContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  streakValue: {
    fontSize: Typography.sizes.h2,
    fontWeight: Typography.weights.regular,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  streakLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.white,
    opacity: 0.9,
  },
  streakBest: {
    fontSize: Typography.sizes.small,
    color: Colors.white,
    opacity: 0.8,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: Typography.weights.regular,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeMoneyCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  timeMoneyEmoji: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  timeMoneyValue: {
    fontSize: Typography.sizes.h2,
    fontWeight: Typography.weights.regular,
    color: Colors.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  timeMoneyLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
  },
  categoriesContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryRankText: {
    fontSize: Typography.sizes.caption,
    color: Colors.primaryGradientStart,
    fontWeight: Typography.weights.regular,
  },
  categoryInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  categoryName: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  categoryBar: {
    height: 6,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    backgroundColor: Colors.primaryGradientStart,
  },
  categoryCount: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    fontWeight: Typography.weights.regular,
  },
  recapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  recapEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  recapCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  recapStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  recapStatItem: {
    alignItems: 'center',
  },
  recapStatValue: {
    fontSize: Typography.sizes.h2,
    fontWeight: Typography.weights.regular,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  recapStatLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
  },
  recapDivider: {
    width: 1,
    backgroundColor: Colors.divider,
  },
  highlightsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.md,
  },
  highlightsTitle: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  highlightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primaryGradientStart,
    marginRight: Spacing.sm,
  },
  highlightText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
  },
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
    height: 40,
    borderRadius: 4,
  },
  weekBarActive: {
    backgroundColor: Colors.primaryGradientStart,
  },
  weekBarInactive: {
    backgroundColor: Colors.backgroundLight,
  },
  weeklyLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: Typography.weights.regular,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    maxWidth: 280,
  },
  bottomSpacer: {
    height: Spacing.xxl * 2,
  },
  yearRecapButton: {
    marginBottom: Spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  yearRecapGradient: {
    borderRadius: 16,
    padding: Spacing.lg,
  },
  yearRecapContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearRecapText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  yearRecapTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: Typography.weights.bold as any,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  yearRecapSubtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.white,
    opacity: 0.9,
  },
});
