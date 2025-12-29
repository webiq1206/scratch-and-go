import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { ThumbsUp, ThumbsDown, Trash2, Users, CheckCircle, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';
import { useCollaborative } from '@/contexts/CollaborativeContext';
import { CollaborativeActivity } from '@/types/collaborative';
import { useMemoryBook } from '@/contexts/MemoryBookContext';

export default function QueueScreen() {
  const {
    voteOnActivity,
    removeFromQueue,
    getUserVote,
    getVoteCounts,
    pendingActivities,
    approvedActivities,
  } = useCollaborative();

  const { saveActivity } = useMemoryBook();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  const handleVote = async (activityId: string, vote: 'yes' | 'no') => {
    await voteOnActivity(activityId, vote);
  };

  const handleDelete = (activityId: string) => {
    Alert.alert(
      'Remove Activity',
      'Are you sure you want to remove this activity from the queue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeFromQueue(activityId);
          },
        },
      ]
    );
  };

  const handleSaveToMemoryBook = async (activity: CollaborativeActivity) => {
    try {
      await saveActivity(activity);
      Alert.alert('Success', 'Activity saved to Memory Book!');
    } catch {
      Alert.alert('Error', 'Failed to save activity. Please try again.');
    }
  };

  const renderActivityCard = ({ item }: { item: CollaborativeActivity }) => {
    const userVote = getUserVote(item);
    const { yesVotes, noVotes } = getVoteCounts(item);

    return (
      <View style={styles.activityCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerText}>
            <Text style={styles.activityTitle}>{item.title}</Text>
            <Text style={styles.addedBy}>Added by {item.addedByName}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
            <Trash2 size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Cost:</Text>
            <Text style={styles.metadataValue}>
              {item.cost === 'free' ? 'Free' : item.cost.toUpperCase()}
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Duration:</Text>
            <Text style={styles.metadataValue}>{item.duration}</Text>
          </View>
        </View>

        {item.note && (
          <View style={styles.noteContainer}>
            <Text style={styles.note}>{item.note}</Text>
          </View>
        )}

        {item.status === 'pending' && (
          <View style={styles.votingSection}>
            <View style={styles.voteCount}>
              <ThumbsUp size={16} color={Colors.accent} />
              <Text style={styles.voteCountText}>{yesVotes}</Text>
              <ThumbsDown size={16} color={Colors.error} />
              <Text style={styles.voteCountText}>{noVotes}</Text>
            </View>

            <View style={styles.voteButtons}>
              <TouchableOpacity
                style={[
                  styles.voteButton,
                  styles.yesButton,
                  userVote?.vote === 'yes' && styles.votedButton,
                ]}
                onPress={() => handleVote(item.id, 'yes')}
              >
                <ThumbsUp size={20} color={userVote?.vote === 'yes' ? Colors.white : Colors.accent} />
                <Text
                  style={[
                    styles.voteButtonText,
                    userVote?.vote === 'yes' && styles.votedButtonText,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.voteButton,
                  styles.noButton,
                  userVote?.vote === 'no' && styles.votedButton,
                ]}
                onPress={() => handleVote(item.id, 'no')}
              >
                <ThumbsDown size={20} color={userVote?.vote === 'no' ? Colors.white : Colors.error} />
                <Text
                  style={[
                    styles.voteButtonText,
                    userVote?.vote === 'no' && styles.votedButtonText,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {item.status === 'approved' && (
          <View style={styles.approvedSection}>
            <View style={styles.approvedBadge}>
              <CheckCircle size={20} color={Colors.accent} />
              <Text style={styles.approvedText}>Approved!</Text>
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleSaveToMemoryBook(item)}
            >
              <Text style={styles.saveButtonText}>Save to Memory Book</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const displayActivities = activeTab === 'pending' ? pendingActivities : approvedActivities;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Activity Queue',
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.white,
          headerTitleStyle: {
            fontSize: Typography.sizes.h3,
            fontWeight: Typography.weights.regular,
          },
        }}
      />

      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Users size={24} color={Colors.primary} />
        </View>
        <Text style={styles.headerTitle}>Collaborative Queue</Text>
        <Text style={styles.headerSubtitle}>
          Plan special moments together with your loved ones
        </Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Clock size={18} color={activeTab === 'pending' ? Colors.primary : Colors.textLight} />
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending ({pendingActivities.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
          onPress={() => setActiveTab('approved')}
        >
          <CheckCircle size={18} color={activeTab === 'approved' ? Colors.primary : Colors.textLight} />
          <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>
            Approved ({approvedActivities.length})
          </Text>
        </TouchableOpacity>
      </View>

      {displayActivities.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
          <Users size={64} color={Colors.cardBorder} />
          <Text style={styles.emptyTitle}>
            {activeTab === 'pending' ? 'No Pending Activities' : 'No Approved Activities'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'pending'
              ? 'Share activities with your loved ones to create memories together!'
              : 'Approved activities will appear here - ready to become beautiful memories!'}
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={displayActivities}
          renderItem={renderActivityCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: Typography.weights.regular,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
    color: Colors.textLight,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.large,
    backgroundColor: Colors.cardBackground,
    gap: Spacing.sm,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
    color: Colors.textLight,
  },
  activeTabText: {
    color: Colors.white,
  },
  list: {
    padding: Spacing.lg,
  },
  activityCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  emoji: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: Typography.weights.regular,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  addedBy: {
    fontSize: Typography.sizes.small,
    fontWeight: Typography.weights.regular,
    color: Colors.textLight,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  description: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
    color: Colors.textLight,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  metadata: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  metadataItem: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  metadataLabel: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
    color: Colors.textLight,
  },
  metadataValue: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
    color: Colors.white,
  },
  noteContainer: {
    backgroundColor: Colors.backgroundDark,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.md,
  },
  note: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
    color: Colors.textLight,
    fontStyle: 'italic' as const,
  },
  votingSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  voteCount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  voteCountText: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
    color: Colors.white,
    marginRight: Spacing.md,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  yesButton: {
    backgroundColor: 'transparent',
    borderColor: Colors.accent,
  },
  noButton: {
    backgroundColor: 'transparent',
    borderColor: Colors.error,
  },
  votedButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  voteButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
    color: Colors.white,
  },
  votedButtonText: {
    color: Colors.white,
  },
  approvedSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  approvedText: {
    fontSize: Typography.sizes.h3,
    fontWeight: Typography.weights.regular,
    color: Colors.accent,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: Typography.weights.regular,
    color: Colors.white,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
});
