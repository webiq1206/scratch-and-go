import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { ThumbsUp, ThumbsDown, Trash2, Users, CheckCircle, Clock, Heart, Sparkles, Send, MessageCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';
import { useCollaborative } from '@/contexts/CollaborativeContext';
import { CollaborativeActivity } from '@/types/collaborative';
import { useMemoryBook } from '@/contexts/MemoryBookContext';
import { useAlert } from '@/contexts/AlertContext';
import PolaroidFrame from '@/components/ui/PolaroidFrame';
import { MODE_KEY } from '@/constants/storageKeys';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
type Mode = 'couples' | 'family';

// Mode-specific content
const getModeContent = (mode: Mode) => ({
  couples: {
    title: 'Date Ideas Queue',
    subtitle: 'Plan special moments together',
    pendingEmpty: 'No date ideas waiting! Share activities with your partner to plan together.',
    approvedEmpty: 'Vote yes on date ideas to see them here, ready for your next romantic adventure!',
    addedBy: 'Suggested by',
    savePrompt: 'Save to Our Dates',
  },
  family: {
    title: 'Family Activity Queue',
    subtitle: 'Plan adventures for everyone',
    pendingEmpty: 'No activities waiting! Share ideas with your family to plan together.',
    approvedEmpty: 'Vote yes on activities to see them here, ready for family fun!',
    addedBy: 'Suggested by',
    savePrompt: 'Save to Family Activities',
  },
});

export default function QueueScreen() {
  const {
    voteOnActivity,
    removeFromQueue,
    getUserVote,
    getVoteCounts,
    pendingActivities,
    approvedActivities,
  } = useCollaborative();

  const { saveActivity, savedActivities } = useMemoryBook();
  const { alert, showSuccess, showError } = useAlert();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<Mode>('couples');
  const [isModeLoading, setIsModeLoading] = useState(true);

  // Load mode with error handling
  useEffect(() => {
    const loadMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(MODE_KEY);
        if (savedMode && (savedMode === 'couples' || savedMode === 'family')) {
          setMode(savedMode);
        } else if (savedMode) {
          // Invalid mode value, clear and use default
          console.error('Invalid mode value in storage, using default');
          await AsyncStorage.removeItem(MODE_KEY);
        }
      } catch (error) {
        console.error('Failed to load mode:', error);
        // Use default mode on error
      } finally {
        setIsModeLoading(false);
      }
    };
    loadMode();
  }, []);

  const content = getModeContent(mode)[mode];

  // Get user photos for empty state decoration
  const userPhotos = useMemo(() => {
    const completed = savedActivities.filter(a => a.isCompleted);
    return completed
      .filter(a => a.photos && a.photos.length > 0)
      .flatMap(a => a.photos!)
      .slice(0, 3);
  }, [savedActivities]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  const handleVote = async (activityId: string, vote: 'yes' | 'no') => {
    await voteOnActivity(activityId, vote);
  };

  const handleDelete = (activityId: string) => {
    alert(
      'Remove Activity',
      'Are you sure you want to remove this from the queue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeFromQueue(activityId);
          },
        },
      ],
      'warning'
    );
  };

  const handleSaveToMemoryBook = async (activity: CollaborativeActivity) => {
    try {
      // Map CollaborativeActivity to Activity type for saving
      const activityToSave = {
        title: activity.title,
        description: activity.description,
        cost: activity.cost,
        duration: activity.duration,
        category: activity.category,
        proTip: activity.proTip,
        supplies: activity.supplies,
      };
      // Save to Memory Book without marking as active (saved for later)
      saveActivity(activityToSave, undefined, false);
      showSuccess('Saved!', mode === 'couples' 
        ? 'Date idea saved for your next adventure together!' 
        : 'Activity saved for your next family adventure!');
    } catch {
      showError('Error', 'Failed to save. Please try again.');
    }
  };

  const renderActivityCard = ({ item }: { item: CollaborativeActivity }) => {
    const userVote = getUserVote(item);
    const { yesVotes, noVotes } = getVoteCounts(item);

    return (
      <View style={styles.activityCard}>
        {/* Decorative corner accent */}
        <View style={styles.cardCornerAccent}>
          {mode === 'couples' ? (
            <Heart size={12} color={Colors.primary} fill={Colors.primary} />
          ) : (
            <Users size={12} color={Colors.primary} />
          )}
        </View>

        <View style={styles.cardHeader}>
          <View style={styles.headerText}>
            <Text style={styles.activityTitle}>{item.title}</Text>
            <View style={styles.addedByRow}>
              <MessageCircle size={12} color={Colors.textMuted} />
              <Text style={styles.addedBy}>{content.addedBy} {item.addedByName}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
            <Trash2 size={18} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.metadata}>
          <View style={styles.metadataChip}>
            <Text style={styles.metadataLabel}>
              {item.cost === 'free' ? 'Free' : item.cost.toUpperCase()}
            </Text>
          </View>
          <View style={styles.metadataChip}>
            <Clock size={12} color={Colors.textLight} />
            <Text style={styles.metadataLabel}>{item.duration}</Text>
          </View>
        </View>

        {item.note && (
          <View style={styles.noteContainer}>
            <Sparkles size={14} color={Colors.accent} />
            <Text style={styles.note}>{item.note}</Text>
          </View>
        )}

        {item.status === 'pending' && (
          <View style={styles.votingSection}>
            <View style={styles.voteCount}>
              <View style={styles.voteCountItem}>
                <ThumbsUp size={14} color={Colors.success} />
                <Text style={[styles.voteCountText, { color: Colors.success }]}>{yesVotes}</Text>
              </View>
              <View style={styles.voteCountItem}>
                <ThumbsDown size={14} color={Colors.error} />
                <Text style={[styles.voteCountText, { color: Colors.error }]}>{noVotes}</Text>
              </View>
            </View>

            <View style={styles.voteButtons}>
              <TouchableOpacity
                style={[
                  styles.voteButton,
                  styles.yesButton,
                  userVote?.vote === 'yes' && styles.yesButtonVoted,
                ]}
                onPress={() => handleVote(item.id, 'yes')}
              >
                <ThumbsUp size={18} color={userVote?.vote === 'yes' ? Colors.backgroundDark : Colors.success} />
                <Text
                  style={[
                    styles.voteButtonText,
                    { color: userVote?.vote === 'yes' ? Colors.backgroundDark : Colors.success },
                  ]}
                >
                  Let's do it!
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.voteButton,
                  styles.noButton,
                  userVote?.vote === 'no' && styles.noButtonVoted,
                ]}
                onPress={() => handleVote(item.id, 'no')}
              >
                <ThumbsDown size={18} color={userVote?.vote === 'no' ? Colors.white : Colors.error} />
                <Text
                  style={[
                    styles.voteButtonText,
                    { color: userVote?.vote === 'no' ? Colors.white : Colors.error },
                  ]}
                >
                  Not this time
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {item.status === 'approved' && (
          <View style={styles.approvedSection}>
            <View style={styles.approvedBadge}>
              <CheckCircle size={20} color={Colors.success} />
              <Text style={styles.approvedText}>Ready to go!</Text>
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleSaveToMemoryBook(item)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                <Send size={16} color={Colors.backgroundDark} />
                <Text style={styles.saveButtonText}>{content.savePrompt}</Text>
              </LinearGradient>
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
          title: content.title,
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.white,
          headerTitleStyle: {
            fontSize: Typography.sizes.h3,
            fontWeight: '500' as const,
          },
        }}
      />

      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <View style={styles.headerIcon}>
            {mode === 'couples' ? (
              <Heart size={24} color={Colors.primary} fill={Colors.primary} />
            ) : (
              <Users size={24} color={Colors.primary} />
            )}
          </View>
          <View style={styles.headerSparkle}>
            <Sparkles size={12} color={Colors.accent} />
          </View>
        </View>
        <Text style={styles.headerTitle}>{content.title}</Text>
        <Text style={styles.headerSubtitle}>
          {content.subtitle}
        </Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Clock size={18} color={activeTab === 'pending' ? Colors.backgroundDark : Colors.textLight} />
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Waiting ({pendingActivities.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
          onPress={() => setActiveTab('approved')}
        >
          <CheckCircle size={18} color={activeTab === 'approved' ? Colors.backgroundDark : Colors.textLight} />
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
          {/* Empty Polaroid decoration */}
          <View style={styles.emptyPolaroidsRow}>
            <PolaroidFrame
              imageUri={userPhotos[0]}
              size="small"
              isEmpty={!userPhotos[0]}
              mode={mode}
              rotation={-8}
              style={{ opacity: 0.6 }}
            />
            <PolaroidFrame
              imageUri={userPhotos[1]}
              size="small"
              isEmpty={!userPhotos[1]}
              mode={mode}
              rotation={4}
              style={{ marginTop: 20, opacity: 0.8 }}
            />
            <PolaroidFrame
              imageUri={userPhotos[2]}
              size="small"
              isEmpty={!userPhotos[2]}
              mode={mode}
              rotation={-3}
              style={{ opacity: 0.6 }}
            />
          </View>

          <Text style={styles.emptyTitle}>
            {activeTab === 'pending' ? 'No Ideas Waiting' : 'Nothing Approved Yet'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'pending' ? content.pendingEmpty : content.approvedEmpty}
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
  headerIconContainer: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSparkle: {
    position: 'absolute',
    top: -4,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  headerTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '600' as const,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.body,
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
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  activeTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.sizes.body,
    fontWeight: '500' as const,
    color: Colors.textLight,
  },
  activeTabText: {
    color: Colors.backgroundDark,
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
    position: 'relative',
    overflow: 'hidden',
  },
  cardCornerAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    backgroundColor: Colors.primaryMuted,
    borderBottomLeftRadius: BorderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingRight: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    paddingRight: Spacing.xl,
  },
  headerText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: '600' as const,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  addedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  addedBy: {
    fontSize: Typography.sizes.small,
    color: Colors.textMuted,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  description: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  metadata: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metadataChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  metadataLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.accentMuted,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.md,
  },
  note: {
    flex: 1,
    fontSize: Typography.sizes.body,
    color: Colors.text,
    fontStyle: 'italic' as const,
    lineHeight: 22,
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
    gap: Spacing.xl,
  },
  voteCountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  voteCountText: {
    fontSize: Typography.sizes.body,
    fontWeight: '600' as const,
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
    borderColor: Colors.success,
  },
  yesButtonVoted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  noButton: {
    backgroundColor: 'transparent',
    borderColor: Colors.error,
  },
  noButtonVoted: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  voteButtonText: {
    fontSize: Typography.sizes.small,
    fontWeight: '500' as const,
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
    fontWeight: '600' as const,
    color: Colors.success,
  },
  saveButton: {
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  saveButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '600' as const,
    color: Colors.backgroundDark,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyPolaroidsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '600' as const,
    color: Colors.white,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
});
