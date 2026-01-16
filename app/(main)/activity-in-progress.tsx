import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useMemoryBook } from '@/contexts/MemoryBookContext';
import { useLocation } from '@/contexts/LocationContext';
import { useAlert } from '@/contexts/AlertContext';
import { Activity } from '@/types/activity';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';
import { Clock, DollarSign, X, MapPin, Sparkles, Edit3, FileText, Camera, Image as ImageIcon, Trash2, CheckCircle, Heart, Users, Save, CloudSun, Crown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ActivityInProgressScreen() {
  const params = useLocalSearchParams<{
    activityId: string;
    title: string;
    description: string;
    duration: string;
    cost: string;
    category: string;
    proTip: string;
    mode: string;
  }>();

  const { 
    saveActivity, 
    getSavedActivity,
    savedActivities,
    startActivity, 
    updateLocationSnapshot,
    updateNotes,
    addPhoto,
    removePhoto,
    markAsCompleted
  } = useMemoryBook();
  const { location } = useLocation();
  const { alert, showError, showSuccess } = useAlert();

  const [savedActivityId, setSavedActivityId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const notesInputRef = useRef<TextInput>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedActivityKeyRef = useRef<string | null>(null);

  // Create activity object from params (memoized to prevent unnecessary re-renders)
  const activity: Activity = useMemo(() => ({
    title: params.title || 'Activity',
    description: params.description || '',
    cost: (params.cost as 'free' | '$' | '$$' | '$$$') || 'free',
    duration: params.duration || '1-2 hours',
    category: params.category || 'Any',
    proTip: params.proTip || '',
  }), [params.title, params.description, params.cost, params.duration, params.category, params.proTip]);

  const mode = params.mode || 'couples';

  // Validate required params
  useEffect(() => {
    if (!params.title || !params.description) {
      alert(
        'Invalid Activity',
        'Required activity information is missing. Please try again.',
        [
          {
            text: 'Go Back',
            onPress: () => router.back(),
          },
        ],
        'error'
      );
      return;
    }
  }, [params.title, params.description, router]);

  // Initialize activity - create a stable key from activity properties
  useEffect(() => {
    // Validate activity before saving
    if (!activity.title || !activity.description) {
      return;
    }

    // Create a stable key from activity properties
    const activityKey = `${activity.title}-${activity.description}-${activity.category}`;

    // Prevent re-initialization if we've already initialized for this activity
    if (initializedActivityKeyRef.current === activityKey) {
      return;
    }

    // Mark as initialized for this activity
    initializedActivityKeyRef.current = activityKey;

    // Check for existing activity by title and description to prevent duplicates
    // Use savedActivities directly (not getSavedActivities) to include active activities
    const existingByContent = savedActivities.find(
      a => a.title === activity.title && 
           a.description === activity.description &&
           Math.abs(a.savedAt - Date.now()) < 60000 // Within last minute
    );

    if (existingByContent) {
      // Use existing activity instead of creating duplicate
      setSavedActivityId(existingByContent.id);
      setNotesText(existingByContent.notes || '');
      setPhotos(existingByContent.photos || []);
      setIsCompleted(existingByContent.isCompleted || false);
      if (!existingByContent.isActive && !existingByContent.isCompleted) {
        startActivity(existingByContent.id);
      }
      return;
    }

    // Save activity to Memory Book and mark as active
    try {
      const saved = saveActivity(activity);
      setSavedActivityId(saved.id);
      startActivity(saved.id);
      if (location) {
        updateLocationSnapshot(saved.id);
      }
      setNotesText(saved.notes || '');
      setPhotos(saved.photos || []);
      setIsCompleted(saved.isCompleted || false);
    } catch (error) {
      console.error('Error saving activity:', error);
      showError('Error', 'Failed to save activity. Please try again.');
      router.back();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.title, activity.description, activity.category, savedActivities.length]);

  // Update completion status when saved activity changes
  useEffect(() => {
    if (savedActivityId) {
      const savedActivity = getSavedActivity(savedActivityId);
      if (savedActivity) {
        setIsCompleted(savedActivity.isCompleted || false);
      }
    }
  }, [savedActivityId, getSavedActivity]);

  // Update photos when saved activity changes
  useEffect(() => {
    if (savedActivityId) {
      const savedActivity = getSavedActivity(savedActivityId);
      if (savedActivity) {
        setPhotos(savedActivity.photos || []);
      }
    }
  }, [savedActivityId, getSavedActivity]);

  // Auto-save notes after user stops typing (debounced)
  useEffect(() => {
    if (!savedActivityId || !isEditingNotes) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to save after 1 second of no typing
    saveTimeoutRef.current = setTimeout(() => {
      if (savedActivityId) {
        try {
          updateNotes(savedActivityId, notesText);
        } catch (error) {
          console.error('Error auto-saving notes:', error);
        }
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [notesText, savedActivityId, isEditingNotes, updateNotes]);

  const handleStartEditing = () => {
    setIsEditingNotes(true);
    // Focus input after a brief delay to ensure it's rendered
    setTimeout(() => {
      notesInputRef.current?.focus();
    }, 100);
  };

  const handleSaveNotes = () => {
    if (!savedActivityId) return;
    try {
      updateNotes(savedActivityId, notesText);
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      showError('Error', 'Failed to save notes. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    if (!savedActivityId) return;

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission Required', 'Camera permission is needed to take photos.', undefined, 'warning');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        try {
          addPhoto(savedActivityId, result.assets[0].uri);
          // Update local state immediately for responsive UI
          setPhotos(prev => [...prev, result.assets[0].uri]);
        } catch (error) {
          console.error('Error adding photo:', error);
          showError('Error', 'Failed to add photo. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showError('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handlePickPhoto = async () => {
    if (!savedActivityId) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission Required', 'Photo library permission is needed to select photos.', undefined, 'warning');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets.length > 0) {
        try {
          // Add all photos and update state
          const newPhotoUris = result.assets.map(asset => asset.uri);
          result.assets.forEach(asset => {
            addPhoto(savedActivityId, asset.uri);
          });
          // Update local state immediately for responsive UI
          setPhotos(prev => [...prev, ...newPhotoUris]);
        } catch (error) {
          console.error('Error adding photos:', error);
          showError('Error', 'Failed to add some photos. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      showError('Error', 'Failed to pick photo. Please try again.');
    }
  };

  const handleRemovePhoto = (photoUri: string) => {
    if (!savedActivityId) return;

    alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            try {
              removePhoto(savedActivityId, photoUri);
              setPhotos(prev => prev.filter(uri => uri !== photoUri));
            } catch (error) {
              console.error('Error removing photo:', error);
              showError('Error', 'Failed to remove photo. Please try again.');
            }
          }
        }
      ],
      'warning'
    );
  };

  const handleMarkComplete = () => {
    if (!savedActivityId) return;

    alert(
      mode === 'couples' ? 'Complete Date?' : 'Complete Activity?',
      mode === 'couples' 
        ? 'Mark this date as completed and save it to your Memory Book?'
        : 'Mark this activity as completed and save it to your Memory Book?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            try {
              const completedAt = Date.now();
              markAsCompleted(savedActivityId, completedAt);
              setIsCompleted(true);
              
              // Save final notes before redirecting
              if (notesText && savedActivityId) {
                updateNotes(savedActivityId, notesText);
              }
              
              // Show success message and redirect to Memory Book (Memories tab)
              showSuccess(
                'Memory Saved!',
                mode === 'couples'
                  ? 'Your date has been saved to your Memory Book!'
                  : 'Your activity has been saved to your Memory Book!'
              );
              
              // Redirect to Memory Book with memories tab active
              setTimeout(() => {
                router.replace('/(main)/memory-book?tab=memories' as any);
              }, 500);
            } catch (error) {
              console.error('Error marking activity as complete:', error);
              showError('Error', 'Failed to mark activity as complete. Please try again.');
              setIsCompleted(false);
            }
          }
        }
      ],
      'info'
    );
  };

  const getCostDisplay = (cost: string) => {
    if (cost === 'free') return 'Free';
    return cost;
  };

  const getCostColor = (cost: string) => {
    if (cost === 'free') return Colors.accent;
    if (cost === '$') return Colors.primary;
    if (cost === '$$') return Colors.primary;
    return Colors.primary;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{ 
          title: mode === 'couples' ? 'Date In Progress' : 'Activity In Progress',
          headerShown: false,
        }} 
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.activeIndicator}>
              {isCompleted ? (
                <>
                  <CheckCircle size={16} color={Colors.accent} />
                  <Text style={[styles.activeText, { color: Colors.accent }]}>
                    {mode === 'couples' ? 'Date Completed' : 'Activity Completed'}
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeText}>
                    {mode === 'couples' ? 'Date In Progress' : 'Activity In Progress'}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Activity Header Card */}
          <View style={styles.headerCard}>
            <View style={styles.iconContainer}>
              {mode === 'couples' ? (
                <Heart size={40} color={Colors.primary} />
              ) : (
                <Users size={40} color={Colors.primary} />
              )}
            </View>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <Text style={styles.activityCategory}>{activity.category}</Text>
          </View>

          {/* Description Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>About This {mode === 'couples' ? 'Date' : 'Activity'}</Text>
            <Text style={styles.description}>{activity.description}</Text>
          </View>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <View style={[styles.detailIconContainer, { backgroundColor: Colors.primary + '20' }]}>
                <Clock size={24} color={Colors.primary} />
              </View>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{activity.duration}</Text>
            </View>

            <View style={styles.detailCard}>
              <View style={[styles.detailIconContainer, { backgroundColor: getCostColor(activity.cost) + '20' }]}>
                <DollarSign size={24} color={getCostColor(activity.cost)} />
              </View>
              <Text style={styles.detailLabel}>Cost</Text>
              <Text style={[styles.detailValue, { color: getCostColor(activity.cost) }]}>
                {getCostDisplay(activity.cost)}
              </Text>
            </View>
          </View>

          {/* Pro Tip Card */}
          {activity.proTip && (
            <View style={[styles.card, styles.proTipCard]}>
              <View style={styles.proTipHeader}>
                <Crown size={20} color={Colors.primary} />
                <Text style={styles.proTipTitle}>Pro Tip</Text>
              </View>
              <Text style={styles.proTipText}>{activity.proTip}</Text>
            </View>
          )}

          {/* Location Card */}
          {location && (
            <View style={styles.card}>
              <View style={styles.locationHeader}>
                <MapPin size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Location</Text>
              </View>
              <Text style={styles.locationText}>
                {location.city}, {location.region}
              </Text>
              {location.weather && (
                <View style={styles.weatherInfo}>
                  <CloudSun size={18} color={Colors.textLight} />
                  <Text style={styles.weatherText}>
                    {location.weather.temp}°F - {location.weather.condition}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Notes Card */}
          <View style={styles.card}>
            <View style={styles.notesHeader}>
              <View style={styles.notesTitleRow}>
                <FileText size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Capture the Moment</Text>
              </View>
              {!isEditingNotes && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleStartEditing}
                  activeOpacity={0.7}
                >
                  <Edit3 size={18} color={Colors.primary} />
                  <Text style={styles.editButtonText}>
                    {notesText ? 'Edit' : 'Add Notes'}
                  </Text>
                </TouchableOpacity>
              )}
              {isEditingNotes && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveNotes}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>

            {isEditingNotes ? (
              <TextInput
                ref={notesInputRef}
                style={styles.notesInput}
                value={notesText}
                onChangeText={setNotesText}
                placeholder="What's happening? How are you feeling? What are you enjoying most?"
                placeholderTextColor={Colors.textLight}
                multiline
                textAlignVertical="top"
                autoFocus
              />
            ) : (
              <TouchableOpacity
                style={styles.notesDisplay}
                onPress={handleStartEditing}
                activeOpacity={0.7}
              >
                {notesText ? (
                  <Text style={styles.notesText}>{notesText}</Text>
                ) : (
                  <View style={styles.emptyNotes}>
                    <Text style={styles.emptyNotesText}>
                      Tap to add notes about your experience...
                    </Text>
                    <Text style={styles.emptyNotesHint}>
                      Capture memories, feelings, and moments as they happen
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {isEditingNotes && (
              <View style={styles.autoSaveHint}>
                <Save size={12} color={Colors.textSecondary} />
                <Text style={styles.autoSaveText}>Auto-saving as you type...</Text>
              </View>
            )}
          </View>

          {/* Photos Card */}
          <View style={styles.card}>
            <View style={styles.photosHeader}>
              <View style={styles.photosTitleRow}>
                <Camera size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Photos</Text>
                {photos.length > 0 && (
                  <Text style={styles.photoCount}>({photos.length})</Text>
                )}
              </View>
            </View>

            {photos.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.photosScroll}
                contentContainerStyle={styles.photosScrollContent}
              >
                {photos.map((photoUri, index) => (
                  <View key={index} style={styles.photoWrapper}>
                    <Image 
                      source={{ uri: photoUri }} 
                      style={styles.photo}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => handleRemovePhoto(photoUri)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={16} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyPhotos}>
                <View style={styles.emptyPhotosIcon}>
                  <Camera size={32} color={Colors.textLight} />
                </View>
                <Text style={styles.emptyPhotosText}>
                  No photos yet
                </Text>
                <Text style={styles.emptyPhotosHint}>
                  Capture memories as they happen
                </Text>
              </View>
            )}

            <View style={styles.photoButtons}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={handleTakePhoto}
                activeOpacity={0.7}
              >
                <Camera size={20} color={Colors.primary} />
                <Text style={styles.photoButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoButton, styles.photoButtonSecondary]}
                onPress={handlePickPhoto}
                activeOpacity={0.7}
              >
                <ImageIcon size={20} color={Colors.text} />
                <Text style={styles.photoButtonTextSecondary}>Choose from Library</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Completion Section */}
          {!isCompleted && (
            <View style={styles.completionSection}>
              <TouchableOpacity
                style={styles.completeButton}
                onPress={handleMarkComplete}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.primaryGradientStart, Colors.primary, Colors.primaryGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.completeButtonGradient}
                >
                  <CheckCircle size={24} color={Colors.white} />
                  <Text style={styles.completeButtonText}>
                    Complete {mode === 'couples' ? 'Date' : 'Activity'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
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
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  activeText: {
    fontSize: Typography.sizes.body,
    color: Colors.primary,
    fontWeight: '400' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  headerCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  activityTitle: {
    fontSize: Typography.sizes.h1,
    fontWeight: '400' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  activityCategory: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sectionTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: '400' as const,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    lineHeight: 24,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  detailIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: Typography.sizes.h3,
    fontWeight: '400' as const,
    color: Colors.text,
  },
  proTipCard: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary + '40',
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  proTipTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  proTipText: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    lineHeight: 22,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  locationText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    marginBottom: Spacing.sm,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  weatherText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  notesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  editButtonText: {
    fontSize: Typography.sizes.caption,
    color: Colors.primary,
    fontWeight: '400' as const,
  },
  saveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
  },
  saveButtonText: {
    fontSize: Typography.sizes.caption,
    color: Colors.white,
    fontWeight: '400' as const,
  },
  notesInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    minHeight: 150,
    fontSize: Typography.sizes.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    lineHeight: 22,
  },
  notesDisplay: {
    minHeight: 100,
  },
  notesText: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    lineHeight: 24,
  },
  emptyNotes: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyNotesText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  emptyNotesHint: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  autoSaveHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  autoSaveText: {
    fontSize: Typography.sizes.small,
    color: Colors.textSecondary,
  },
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  photosTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  photoCount: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    marginLeft: Spacing.xs,
  },
  photosScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  photosScrollContent: {
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  },
  photoWrapper: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.cardBackground,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyPhotos: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
  },
  emptyPhotosIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyPhotosText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  emptyPhotosHint: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  photoButtonSecondary: {
    borderColor: Colors.cardBorder,
    backgroundColor: 'transparent',
  },
  photoButtonText: {
    fontSize: Typography.sizes.body,
    color: Colors.primary,
    fontWeight: '400' as const,
  },
  photoButtonTextSecondary: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    fontWeight: '400' as const,
  },
  completionSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  completeButton: {
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  completeButtonText: {
    fontSize: Typography.sizes.h3,
    fontWeight: '400' as const,
    color: Colors.white,
  },
});
