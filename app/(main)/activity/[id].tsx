import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useMemoryBook } from '@/contexts/MemoryBookContext';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';
import { Clock, DollarSign, Calendar, Star, CheckCircle, Trash2, Edit3, Save, X } from 'lucide-react-native';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams();
  const { getSavedActivity, markAsCompleted, markAsIncomplete, updateRating, updateNotes, unsaveActivity } = useMemoryBook();
  
  const activity = getSavedActivity(id as string);
  
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(activity?.notes || '');

  if (!activity) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ title: 'Activity Not Found' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorText}>Activity not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSaveNotes = () => {
    updateNotes(activity.id, notesText);
    setIsEditingNotes(false);
    Alert.alert('Saved', 'Your notes have been saved');
  };

  const handleCancelEdit = () => {
    setNotesText(activity.notes || '');
    setIsEditingNotes(false);
  };

  const handleMarkComplete = () => {
    markAsCompleted(activity.id);
    Alert.alert('Completed!', 'Activity marked as completed');
  };

  const handleMarkIncomplete = () => {
    markAsIncomplete(activity.id);
    Alert.alert('Unmarked', 'Activity marked as incomplete');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            unsaveActivity(activity.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleRatingPress = (rating: number) => {
    updateRating(activity.id, rating);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{ 
          title: 'Activity Details',
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.text,
        }} 
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{activity.emoji}</Text>
          </View>

          <Text style={styles.title}>{activity.title}</Text>
          <Text style={styles.description}>{activity.description}</Text>

          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Clock size={18} color={Colors.textLight} />
                <View>
                  <Text style={styles.metaLabel}>Duration</Text>
                  <Text style={styles.metaValue}>{activity.duration}</Text>
                </View>
              </View>
              <View style={styles.metaItem}>
                <DollarSign size={18} color={Colors.textLight} />
                <View>
                  <Text style={styles.metaLabel}>Cost</Text>
                  <Text style={styles.metaValue}>{activity.cost === 'free' ? 'Free' : activity.cost}</Text>
                </View>
              </View>
            </View>

            {activity.isCompleted && activity.completedAt && (
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Calendar size={18} color={Colors.primary} />
                  <View>
                    <Text style={styles.metaLabel}>Completed</Text>
                    <Text style={styles.metaValue}>
                      {new Date(activity.completedAt).toLocaleDateString('en-US', { 
                        year: 'numeric',
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {activity.category && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Category</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{activity.category}</Text>
              </View>
            </View>
          )}

          {activity.supplies && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Supplies Needed</Text>
              <Text style={styles.sectionText}>{activity.supplies}</Text>
            </View>
          )}

          {activity.proTip && (
            <View style={styles.proTipSection}>
              <Text style={styles.proTipLabel}>💡 Pro Tip</Text>
              <Text style={styles.proTipText}>{activity.proTip}</Text>
            </View>
          )}

          {activity.isCompleted && (
            <View style={styles.ratingSection}>
              <Text style={styles.sectionLabel}>Your Rating</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleRatingPress(star)}
                    activeOpacity={0.7}
                    style={styles.starButton}
                  >
                    <Star
                      size={32}
                      color={Colors.accent}
                      fill={(activity.rating && star <= activity.rating) ? Colors.accent : 'none'}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              {activity.rating && (
                <Text style={styles.ratingText}>{activity.rating} out of 5 stars</Text>
              )}
            </View>
          )}

          <View style={styles.notesSection}>
            <View style={styles.notesSectionHeader}>
              <Text style={styles.sectionLabel}>Notes</Text>
              {!isEditingNotes ? (
                <TouchableOpacity 
                  onPress={() => setIsEditingNotes(true)}
                  activeOpacity={0.7}
                  style={styles.editButton}
                >
                  <Edit3 size={16} color={Colors.primary} />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.editActions}>
                  <TouchableOpacity 
                    onPress={handleCancelEdit}
                    activeOpacity={0.7}
                    style={styles.cancelButton}
                  >
                    <X size={16} color={Colors.textLight} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleSaveNotes}
                    activeOpacity={0.7}
                    style={styles.saveButton}
                  >
                    <Save size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            {isEditingNotes ? (
              <TextInput
                style={styles.notesInput}
                value={notesText}
                onChangeText={setNotesText}
                placeholder="Add your thoughts, memories, or tips..."
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                autoFocus
              />
            ) : (
              <View style={styles.notesDisplay}>
                {activity.notes ? (
                  <Text style={styles.notesText}>{activity.notes}</Text>
                ) : (
                  <Text style={styles.notesPlaceholder}>No notes yet. Tap Edit to add some!</Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.actionsSection}>
            {!activity.isCompleted ? (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={handleMarkComplete}
                activeOpacity={0.8}
              >
                <CheckCircle size={20} color={Colors.text} />
                <Text style={styles.completeButtonText}>Mark as Completed</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.incompleteButton}
                onPress={handleMarkIncomplete}
                activeOpacity={0.8}
              >
                <CheckCircle size={20} color={Colors.primary} />
                <Text style={styles.incompleteButtonText}>Mark as Incomplete</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Trash2 size={20} color="#FF4444" />
              <Text style={styles.deleteButtonText}>Delete Activity</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  emojiContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    fontSize: Typography.sizes.h1,
    fontWeight: '400' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  metaContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },
  metaItem: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  metaLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  metaValue: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    fontWeight: '400' as const,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.sizes.h3,
    fontWeight: '400' as const,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  sectionText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    lineHeight: 24,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: Typography.sizes.body,
    color: Colors.primary,
    fontWeight: '400' as const,
  },
  proTipSection: {
    backgroundColor: Colors.accent + '15',
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  proTipLabel: {
    fontSize: Typography.sizes.h3,
    fontWeight: '400' as const,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  proTipText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    lineHeight: 24,
  },
  ratingSection: {
    marginBottom: Spacing.lg,
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  starButton: {
    padding: Spacing.xs,
  },
  ratingText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
  },
  notesSection: {
    marginBottom: Spacing.lg,
  },
  notesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  editButtonText: {
    fontSize: Typography.sizes.caption,
    color: Colors.primary,
    fontWeight: '400' as const,
  },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    padding: Spacing.sm,
  },
  saveButton: {
    padding: Spacing.sm,
  },
  notesInput: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
    fontSize: Typography.sizes.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.primary,
    minHeight: 120,
  },
  notesDisplay: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    minHeight: 80,
  },
  notesText: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    lineHeight: 24,
  },
  notesPlaceholder: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    fontStyle: 'italic' as const,
  },
  actionsSection: {
    gap: Spacing.md,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.medium,
  },
  completeButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.text,
  },
  incompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.cardBackground,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  incompleteButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.primary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.cardBackground,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  deleteButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: '#FF4444',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.sizes.h2,
    color: Colors.textLight,
    marginBottom: Spacing.xl,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.medium,
  },
  backButtonText: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    fontWeight: '400' as const,
  },
});
