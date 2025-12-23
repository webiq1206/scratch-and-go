import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import Colors from '@/constants/colors';
import { BorderRadius } from '@/constants/design';
import { useMemoryBook } from '@/contexts/MemoryBookContext';
import { SavedActivity } from '@/types/activity';
import { Heart, Clock, DollarSign, Calendar, CheckCircle, Star, FileText } from 'lucide-react-native';

type Tab = 'saved' | 'completed';

export default function MemoryBookScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('saved');
  const [refreshing, setRefreshing] = useState(false);
  const { getSavedActivities, getCompletedActivities, markAsCompleted, markAsIncomplete, unsaveActivity, updateRating } = useMemoryBook();

  const savedActivities = getSavedActivities();
  const completedActivities = getCompletedActivities();

  const displayedActivities = activeTab === 'saved' ? savedActivities : completedActivities;

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleMarkComplete = (activityId: string) => {
    markAsCompleted(activityId);
  };

  const handleMarkIncomplete = (activityId: string) => {
    markAsIncomplete(activityId);
  };

  const handleDelete = (activityId: string) => {
    unsaveActivity(activityId);
  };

  const handleActivityPress = (activity: SavedActivity) => {
    router.push(`/activity/${activity.id}`);
  };

  const handleRatingChange = (activityId: string, rating: number) => {
    updateRating(activityId, rating);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Adventures</Text>
        <Text style={styles.subtitle}>
          {activeTab === 'saved' 
            ? 'Activities waiting for you'
            : 'Memories you\'ve created'
          }
        </Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
          onPress={() => setActiveTab('saved')}
          activeOpacity={0.7}
        >
          <Heart 
            size={18} 
            color={activeTab === 'saved' ? Colors.primary : Colors.textLight}
            fill={activeTab === 'saved' ? Colors.primary : 'none'}
          />
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            Saved ({savedActivities.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
          activeOpacity={0.7}
        >
          <CheckCircle 
            size={18} 
            color={activeTab === 'completed' ? Colors.primary : Colors.textLight}
            fill={activeTab === 'completed' ? Colors.primary : 'none'}
          />
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Completed ({completedActivities.length})
          </Text>
        </TouchableOpacity>
      </View>

      {displayedActivities.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>
            {activeTab === 'saved' ? '💝' : '🎉'}
          </Text>
          <Text style={styles.emptyTitle}>
            {activeTab === 'saved' ? 'No saved adventures' : 'No completed adventures'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'saved'
              ? 'Start scratching cards and save activities\nyou want to try'
              : 'Mark activities as complete to see\nthem appear here'
            }
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {displayedActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onPress={() => handleActivityPress(activity)}
              onMarkComplete={() => handleMarkComplete(activity.id)}
              onMarkIncomplete={() => handleMarkIncomplete(activity.id)}
              onDelete={() => handleDelete(activity.id)}
              onRatingChange={(rating) => handleRatingChange(activity.id, rating)}
              isCompleted={activeTab === 'completed'}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

interface ActivityCardProps {
  activity: SavedActivity;
  onPress: () => void;
  onMarkComplete: () => void;
  onMarkIncomplete: () => void;
  onDelete: () => void;
  onRatingChange: (rating: number) => void;
  isCompleted: boolean;
}

function ActivityCard({ activity, onPress, onMarkComplete, onMarkIncomplete, onDelete, onRatingChange, isCompleted }: ActivityCardProps) {
  return (
    <TouchableOpacity
      style={styles.activityCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.activityHeader}>
        <Text style={styles.activityEmoji}>{activity.emoji}</Text>
        <View style={styles.activityHeaderText}>
          <Text style={styles.activityTitle} numberOfLines={2}>{activity.title}</Text>
          <Text style={styles.activityDescription} numberOfLines={2}>{activity.description}</Text>
        </View>
      </View>

      <View style={styles.activityMeta}>
        <View style={styles.metaItem}>
          <Clock size={14} color={Colors.textLight} />
          <Text style={styles.metaText}>{activity.duration}</Text>
        </View>
        <View style={styles.metaItem}>
          <DollarSign size={14} color={Colors.textLight} />
          <Text style={styles.metaText}>{activity.cost === 'free' ? 'Free' : activity.cost}</Text>
        </View>
        {activity.isCompleted && activity.completedAt && (
          <View style={styles.metaItem}>
            <Calendar size={14} color={Colors.primary} />
            <Text style={styles.metaText}>
              {new Date(activity.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        )}
        {activity.notes && (
          <View style={styles.metaItem}>
            <FileText size={14} color={Colors.accent} />
            <Text style={styles.metaText}>Note</Text>
          </View>
        )}
      </View>

      {isCompleted && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingLabel}>Rate your experience:</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={(e) => {
                  e.stopPropagation();
                  onRatingChange(star);
                }}
                activeOpacity={0.7}
                style={styles.starButton}
              >
                <Star
                  size={24}
                  color={Colors.accent}
                  fill={(activity.rating && star <= activity.rating) ? Colors.accent : 'none'}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.activityActions}>
        {!activity.isCompleted ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onMarkComplete();
            }}
            activeOpacity={0.7}
          >
            <CheckCircle size={16} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onMarkIncomplete();
            }}
            activeOpacity={0.7}
          >
            <CheckCircle size={16} color={Colors.textLight} />
            <Text style={styles.actionButtonText}>Mark Incomplete</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.hero,
    fontWeight: '400' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tabActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.textLight,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '400' as const,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  activityCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  activityHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  activityEmoji: {
    fontSize: 48,
  },
  activityHeaderText: {
    flex: 1,
    gap: Spacing.xs,
  },
  activityTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: '400' as const,
    color: Colors.text,
  },
  activityDescription: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    lineHeight: 18,
  },
  activityMeta: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
  },
  activityActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: Typography.sizes.caption,
    fontWeight: '400' as const,
    color: Colors.primary,
  },
  deleteButton: {
    flex: 0.6,
    borderColor: '#FF4444',
  },
  deleteButtonText: {
    fontSize: Typography.sizes.caption,
    fontWeight: '400' as const,
    color: '#FF4444',
  },
  ratingContainer: {
    paddingVertical: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  ratingLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    marginBottom: Spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  starButton: {
    padding: Spacing.xs,
  },
});
