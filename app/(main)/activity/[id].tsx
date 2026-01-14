import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, Image as RNImage, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { useMemoryBook } from '@/contexts/MemoryBookContext';
import { useCollaborative } from '@/contexts/CollaborativeContext';
import { useLocation } from '@/contexts/LocationContext';
import { shareActivity, shareMemory, shareMemoryToFacebook, shareMemoryToInstagram } from '@/utils/shareActivity';
import { addActivityToCalendar, calculateEndDate } from '@/utils/calendarUtils';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';
import { Clock, DollarSign, Calendar, CheckCircle, Trash2, Edit3, Save, X, Share2, Users, CalendarPlus, Camera, MapPin, Plus, ChevronLeft, ChevronRight, FileText, Facebook, Instagram } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams();
  const { getSavedActivity, startActivity, stopActivity, markAsCompleted, markAsIncomplete, updateRating, updateNotes, unsaveActivity, addPhoto, removePhoto, updateLocationSnapshot } = useMemoryBook();
  const { addToQueue } = useCollaborative();
  const { location } = useLocation();
  
  // Handle id as string or array (Expo Router can return arrays)
  const activityId = Array.isArray(id) ? id[0] : id;
  const activity = activityId ? getSavedActivity(activityId) : null;
  
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [queueNote, setQueueNote] = useState('');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photosScrollRef = useRef<ScrollView>(null);
  const [isSharingMemory, setIsSharingMemory] = useState(false);

  // Sync notesText when activity changes
  useEffect(() => {
    if (activity?.notes !== undefined) {
      setNotesText(activity.notes || '');
    }
  }, [activity?.notes]);

  // Check if this is a completed memory (only after null check)
  const isMemory = activity?.isCompleted || false;
  const photos = activity?.photos || [];
  const hasPhotos = photos.length > 0;

  const formatMemoryTimestamp = (timestamp?: number): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handlePhotoScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    setCurrentPhotoIndex(index);
  };

  const scrollToPhoto = (index: number) => {
    photosScrollRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
  };

  if (!activity) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ title: 'Activity Not Found' }} />
        <View style={styles.errorContainer}>
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
    if (!activity) return;
    try {
      updateNotes(activity.id, notesText);
      setIsEditingNotes(false);
      Alert.alert('Saved', 'Your notes have been saved');
    } catch (error) {
      console.error('Error saving notes:', error);
      Alert.alert('Error', 'Failed to save notes. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    if (!activity) return;
    setNotesText(activity.notes || '');
    setIsEditingNotes(false);
  };

  const handleStartActivity = () => {
    if (!activity) return;
    try {
      startActivity(activity.id);
      Alert.alert(
        'Activity Started!',
        'Time to make some amazing memories! Don\'t forget to take photos and add notes along the way.',
        [{ text: 'Got it!' }]
      );
    } catch (error) {
      console.error('Error starting activity:', error);
      Alert.alert('Error', 'Failed to start activity. Please try again.');
    }
  };

  const handleStopActivity = () => {
    if (!activity) return;
    Alert.alert(
      'Pause Activity?',
      'You can continue this activity later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause',
          onPress: () => {
            try {
              stopActivity(activity.id);
              Alert.alert('Activity Paused', 'You can resume anytime!');
            } catch (error) {
              console.error('Error pausing activity:', error);
              Alert.alert('Error', 'Failed to pause activity. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleMarkComplete = () => {
    if (!activity) return;
    if (!activity.photos || activity.photos.length === 0) {
      Alert.alert(
        'Add Photos First?',
        'Capture this special moment before completing! Photos help you remember this memory forever.',
        [
          { text: 'Add Photos', onPress: () => handleTakePhoto() },
          { 
            text: 'Complete Without Photos', 
            style: 'destructive',
            onPress: () => completeActivity()
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      completeActivity();
    }
  };

  const completeActivity = () => {
    if (!activity) return;
    try {
      markAsCompleted(activity.id);
      Alert.alert(
        '✨ Memory Complete!',
        'Would you like to share this experience?',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Share', onPress: handleShareActivity }
        ]
      );
    } catch (error) {
      console.error('Error completing activity:', error);
      Alert.alert('Error', 'Failed to mark activity as complete. Please try again.');
    }
  };

  const handleMarkIncomplete = () => {
    if (!activity) return;
    try {
      markAsIncomplete(activity.id);
      Alert.alert('Unmarked', 'Activity marked as incomplete');
    } catch (error) {
      console.error('Error marking incomplete:', error);
      Alert.alert('Error', 'Failed to update activity. Please try again.');
    }
  };

  const handleDelete = () => {
    if (!activity) return;
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              unsaveActivity(activity.id);
              router.back();
            } catch (error) {
              console.error('Error deleting activity:', error);
              Alert.alert('Error', 'Failed to delete activity. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleRatingPress = (rating: number) => {
    if (!activity) return;
    try {
      updateRating(activity.id, rating);
    } catch (error) {
      console.error('Error updating rating:', error);
      Alert.alert('Error', 'Failed to update rating. Please try again.');
    }
  };

  const handleShareActivity = async () => {
    if (isSharing || !activity) return;
    
    setIsSharing(true);
    try {
      await shareActivity(activity);
    } catch (error) {
      console.error('Error sharing activity:', error);
      Alert.alert(
        'Share Failed',
        'Unable to share activity. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSharing(false);
    }
  };

  const handleAddToQueue = async () => {
    if (!activity) return;
    await addToQueue(activity, queueNote);
    setShowQueueModal(false);
    setQueueNote('');
    Alert.alert('Added!', 'Activity added to collaborative queue');
  };

  const handleAddToCalendar = async () => {
    if (isAddingToCalendar || !activity) return;
    
    setIsAddingToCalendar(true);
    try {
      const endDate = calculateEndDate(selectedDate, activity.duration);
      const success = await addActivityToCalendar({
        activity,
        startDate: selectedDate,
        endDate,
        notes: activity.notes,
      });
      
      if (success) {
        setShowCalendarModal(false);
        setSelectedDate(new Date());
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  const onDateChange = (_event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const onTimeChange = (_event: any, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handlePickPhoto = async () => {
    if (!activity) return;
    try {
      if (Platform.OS !== 'web') {
        const { launchImageLibraryAsync, requestMediaLibraryPermissionsAsync, MediaTypeOptions } = await import('expo-image-picker');
        
        const permissionResult = await requestMediaLibraryPermissionsAsync();
        
        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Please allow access to your photo library to add photos.');
          return;
        }

        setIsUploadingPhoto(true);
        const result = await launchImageLibraryAsync({
          mediaTypes: MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          addPhoto(activity.id, result.assets[0].uri);
          Alert.alert('Success', 'Photo added successfully!');
        }
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result && activity) {
                addPhoto(activity.id, event.target.result as string);
                Alert.alert('Success', 'Photo added successfully!');
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to add photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleTakePhoto = async () => {
    if (!activity) return;
    try {
      if (Platform.OS !== 'web') {
        const { launchCameraAsync, requestCameraPermissionsAsync, MediaTypeOptions } = await import('expo-image-picker');
        
        const permissionResult = await requestCameraPermissionsAsync();
        
        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
          return;
        }

        setIsUploadingPhoto(true);
        const result = await launchCameraAsync({
          mediaTypes: MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          addPhoto(activity.id, result.assets[0].uri);
          Alert.alert('Success', 'Photo added successfully!');
        }
      } else {
        Alert.alert('Not Supported', 'Camera is not supported on web. Please use "Add from Library" instead.');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = (photoUri: string) => {
    if (!activity) return;
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removePhoto(activity.id, photoUri),
        },
      ]
    );
  };

  const handleUpdateLocation = () => {
    if (!activity) return;
    updateLocationSnapshot(activity.id);
    Alert.alert('Updated', 'Location snapshot updated to current location');
  };

  const handleShareMemory = async () => {
    if (isSharingMemory || !activity) return;
    setIsSharingMemory(true);
    try {
      await shareMemory(activity);
    } catch (error) {
      console.error('Error sharing memory:', error);
    } finally {
      setIsSharingMemory(false);
    }
  };

  const handleShareToFacebook = async () => {
    if (isSharingMemory || !activity) return;
    setIsSharingMemory(true);
    try {
      await shareMemoryToFacebook(activity);
    } catch (error) {
      console.error('Error sharing to Facebook:', error);
      Alert.alert('Error', 'Failed to share to Facebook');
    } finally {
      setIsSharingMemory(false);
    }
  };

  const handleShareToInstagram = async () => {
    if (isSharingMemory || !activity) return;
    setIsSharingMemory(true);
    try {
      await shareMemoryToInstagram(activity);
    } catch (error) {
      console.error('Error sharing to Instagram:', error);
      Alert.alert('Error', 'Failed to share to Instagram');
    } finally {
      setIsSharingMemory(false);
    }
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
          {/* Photo Slideshow for Completed Memories */}
          {isMemory && (
            <View style={styles.slideshowContainer}>
              {hasPhotos ? (
                <>
              <ScrollView
                ref={photosScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handlePhotoScroll}
                scrollEventThrottle={16}
                style={styles.slideshowScroll}
              >
                {photos.map((photoUri, index) => (
                  <View key={index} style={styles.slide}>
                    <Image
                      source={{ uri: photoUri }}
                      style={styles.slideImage}
                      contentFit="cover"
                    />
                  </View>
                ))}
              </ScrollView>

              {/* Photo Indicators */}
              {photos.length > 1 && (
                <View style={styles.photoIndicators}>
                  {photos.map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.indicator,
                        index === currentPhotoIndex && styles.indicatorActive
                      ]}
                      onPress={() => scrollToPhoto(index)}
                      activeOpacity={0.7}
                    />
                  ))}
                </View>
              )}

              {/* Photo Counter */}
              {photos.length > 1 && (
                <View style={styles.photoCounter}>
                  <Text style={styles.photoCounterText}>
                    {currentPhotoIndex + 1} / {photos.length}
                  </Text>
                </View>
              )}

              {/* Navigation Arrows */}
              {photos.length > 1 && (
                <>
                  {currentPhotoIndex > 0 && (
                    <TouchableOpacity
                      style={[styles.navArrow, styles.navArrowLeft]}
                      onPress={() => scrollToPhoto(currentPhotoIndex - 1)}
                      activeOpacity={0.7}
                    >
                      <ChevronLeft size={24} color={Colors.white} />
                    </TouchableOpacity>
                  )}
                  {currentPhotoIndex < photos.length - 1 && (
                    <TouchableOpacity
                      style={[styles.navArrow, styles.navArrowRight]}
                      onPress={() => scrollToPhoto(currentPhotoIndex + 1)}
                      activeOpacity={0.7}
                    >
                      <ChevronRight size={24} color={Colors.white} />
                    </TouchableOpacity>
                  )}
                </>
              )}
                </>
              ) : (
                <View style={styles.emptyPhotoContainer}>
                  <View style={styles.emptyPhotoIconContainer}>
                    <Camera size={48} color={Colors.textLight} />
                  </View>
                  <Text style={styles.emptyPhotoTitle}>No Photos Yet</Text>
                  <Text style={styles.emptyPhotoText}>
                    This memory doesn't have any photos yet. Add photos to make it even more special!
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Memory Header for Completed Memories */}
          {isMemory && (
            <View style={styles.memoryHeader}>
              <Text style={styles.memoryTitle}>{activity.title}</Text>
              {activity.completedAt && (
                <View style={styles.memoryTimestamp}>
                  <Calendar size={16} color={Colors.textLight} />
                  <Text style={styles.memoryTimestampText}>
                    {formatMemoryTimestamp(activity.completedAt)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Regular Title for Non-Memories */}
          {!isMemory && (
            <>
              <Text style={styles.title}>{activity.title}</Text>
              <Text style={styles.description}>{activity.description}</Text>
            </>
          )}

          {activity.locationSnapshot && (
            <View style={styles.locationSection}>
              <MapPin size={16} color={Colors.primary} />
              <View style={styles.locationDetails}>
                <Text style={styles.locationText}>
                  {activity.locationSnapshot.city}, {activity.locationSnapshot.region}
                </Text>
                <Text style={styles.locationSubtext}>{activity.locationSnapshot.country}</Text>
              </View>
              <TouchableOpacity onPress={handleUpdateLocation} style={styles.updateLocationButton}>
                <Text style={styles.updateLocationText}>Update</Text>
              </TouchableOpacity>
            </View>
          )}

          {location?.weather && (
            <View style={styles.weatherSection}>
              <Text style={styles.weatherIcon}>{location.weather.icon}</Text>
              <View style={styles.weatherDetails}>
                <Text style={styles.weatherTemp}>{location.weather.temp}°F</Text>
                <Text style={styles.weatherCondition}>{location.weather.condition}</Text>
                <Text style={styles.weatherSubtext}>Feels like {location.weather.feelsLike}°F • Wind {location.weather.windSpeed} mph</Text>
              </View>
            </View>
          )}

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
              <Text style={styles.proTipLabel}>Pro Tip</Text>
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
                    <RNImage
                      source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/u0k4jkmq0pcfxvnip8sbu' }}
                      style={[
                        styles.starIcon,
                        { opacity: (activity.rating && star <= activity.rating) ? 1 : 0.3 }
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              {activity.rating && (
                <Text style={styles.ratingText}>{activity.rating} out of 5 stars</Text>
              )}
            </View>
          )}

          {/* Notes Section - Prominent for Memories */}
          {isMemory && (
            <View style={styles.memoryNotesSection}>
              <View style={styles.memoryNotesHeader}>
                <FileText size={20} color={Colors.primary} />
                <Text style={styles.memoryNotesTitle}>Memory Notes</Text>
              </View>
              {activity.notes ? (
                <Text style={styles.memoryNotesText}>{activity.notes}</Text>
              ) : (
                <Text style={styles.memoryNotesEmpty}>
                  No notes captured for this memory
                </Text>
              )}
            </View>
          )}

          {/* Regular Notes Section for Non-Memories */}
          {!isMemory && (
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
                  placeholder="Capture this memory... What made this moment special with your loved ones?"
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
                    <Text style={styles.notesPlaceholder}>Capture the memory! What made this moment with loved ones special?</Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Activity Details Section for Memories */}
          {isMemory && (
            <View style={styles.memoryDetailsSection}>
              <Text style={styles.memoryDetailsTitle}>Activity Details</Text>
              <Text style={styles.memoryDescription}>{activity.description}</Text>
              
              <View style={styles.memoryDetailsGrid}>
                <View style={styles.memoryDetailCard}>
                  <Clock size={20} color={Colors.primary} />
                  <Text style={styles.memoryDetailLabel}>Duration</Text>
                  <Text style={styles.memoryDetailValue}>{activity.duration}</Text>
                </View>
                <View style={styles.memoryDetailCard}>
                  <DollarSign size={20} color={Colors.accent} />
                  <Text style={styles.memoryDetailLabel}>Cost</Text>
                  <Text style={styles.memoryDetailValue}>
                    {activity.cost === 'free' ? 'Free' : activity.cost}
                  </Text>
                </View>
              </View>

              {activity.proTip && (
                <View style={styles.memoryProTip}>
                  <Text style={styles.memoryProTipLabel}>💡 Pro Tip</Text>
                  <Text style={styles.memoryProTipText}>{activity.proTip}</Text>
                </View>
              )}

              {activity.locationSnapshot && (
                <View style={styles.memoryLocation}>
                  <MapPin size={16} color={Colors.textLight} />
                  <Text style={styles.memoryLocationText}>
                    {activity.locationSnapshot.city}, {activity.locationSnapshot.region}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Social Sharing Section for Memories */}
          {isMemory && (
            <View style={styles.socialSharingSection}>
              <Text style={styles.socialSharingTitle}>Share This Memory</Text>
              <Text style={styles.socialSharingSubtitle}>
                Spread the joy and help others discover their next adventure
              </Text>
              
              <View style={styles.socialButtonsRow}>
                <TouchableOpacity
                  style={[styles.socialButton, styles.facebookButton]}
                  onPress={handleShareToFacebook}
                  disabled={isSharingMemory}
                  activeOpacity={0.8}
                >
                  <Facebook size={20} color={Colors.white} />
                  <Text style={styles.socialButtonText}>Facebook</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialButton, styles.instagramButton]}
                  onPress={handleShareToInstagram}
                  disabled={isSharingMemory}
                  activeOpacity={0.8}
                >
                  <Instagram size={20} color={Colors.white} />
                  <Text style={styles.socialButtonText}>Instagram</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialButton, styles.genericShareButton]}
                  onPress={handleShareMemory}
                  disabled={isSharingMemory}
                  activeOpacity={0.8}
                >
                  <Share2 size={20} color={Colors.text} />
                  <Text style={[styles.socialButtonText, styles.genericShareButtonText]}>More</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.brandingNote}>
                <Text style={styles.brandingNoteText}>
                  💫 Shared with Scratch & Go
                </Text>
              </View>
            </View>
          )}

          {/* Regular Photos Section for Non-Memories */}
          {!isMemory && (
            <View style={styles.photosSection}>
              <View style={styles.photosSectionHeader}>
                <Text style={styles.sectionLabel}>Moments with Loved Ones</Text>
                <View style={styles.photoButtons}>
                  {Platform.OS !== 'web' && (
                    <TouchableOpacity
                      onPress={handleTakePhoto}
                      style={styles.photoActionButton}
                      disabled={isUploadingPhoto}
                    >
                      <Camera size={16} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={handlePickPhoto}
                    style={styles.photoActionButton}
                    disabled={isUploadingPhoto}
                  >
                    <Plus size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {activity.photos && activity.photos.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.photosScroll}
                  contentContainerStyle={styles.photosScrollContent}
                >
                  {activity.photos.map((photoUri, index) => (
                    <TouchableOpacity
                      key={index}
                      onLongPress={() => handleRemovePhoto(photoUri)}
                      activeOpacity={0.8}
                      style={styles.photoContainer}
                    >
                      <Image
                        source={{ uri: photoUri }}
                        style={styles.photo}
                        contentFit="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noPhotosContainer}>
                  <Camera size={40} color={Colors.primary} />
                  <Text style={styles.noPhotosText}>Capture This Moment!</Text>
                  <Text style={styles.noPhotosSubtext}>Take a photo with your loved ones to remember this moment forever</Text>
                  <TouchableOpacity
                    style={styles.addPhotoPromptButton}
                    onPress={handleTakePhoto}
                    activeOpacity={0.8}
                  >
                    <Camera size={18} color={Colors.white} />
                    <Text style={styles.addPhotoPromptText}>Take Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View style={styles.actionsSection}>
            {!activity.isActive && !activity.isCompleted && (
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartActivity}
                activeOpacity={0.8}
              >
                <CheckCircle size={24} color={Colors.white} />
                <Text style={styles.startButtonText}>Start Activity</Text>
              </TouchableOpacity>
            )}

            {activity.isActive && !activity.isCompleted && (
              <View style={styles.activeActivityBanner}>
                <View style={styles.activeIndicator} />
                <View style={styles.activeContent}>
                  <Text style={styles.activeTitle}>Activity In Progress</Text>
                  <Text style={styles.activeSubtitle}>Take photos and add notes as you go!</Text>
                </View>
              </View>
            )}

            {activity.isActive && (
              <TouchableOpacity
                style={styles.pauseButton}
                onPress={handleStopActivity}
                activeOpacity={0.8}
              >
                <X size={20} color={Colors.textLight} />
                <Text style={styles.pauseButtonText}>Pause Activity</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.calendarButton}
              onPress={() => setShowCalendarModal(true)}
              activeOpacity={0.8}
            >
              <CalendarPlus size={20} color={Colors.text} />
              <Text style={styles.calendarButtonText}>Add to Calendar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareActivityButton}
              onPress={handleShareActivity}
              disabled={isSharing}
              activeOpacity={0.8}
            >
              <Share2 size={20} color={Colors.text} />
              <Text style={styles.shareActivityButtonText}>Share Activity</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.queueButton}
              onPress={() => setShowQueueModal(true)}
              activeOpacity={0.8}
            >
              <Users size={20} color={Colors.white} />
              <Text style={styles.queueButtonText}>Add to Queue</Text>
            </TouchableOpacity>

            {(activity.isActive || !activity.isCompleted) && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={handleMarkComplete}
                activeOpacity={0.8}
              >
                <CheckCircle size={20} color={Colors.text} />
                <Text style={styles.completeButtonText}>Complete Activity</Text>
              </TouchableOpacity>
            )}

            {activity.isCompleted && (
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

      {showCalendarModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule Activity</Text>
            <Text style={styles.modalSubtitle}>Pick a date and time for this activity</Text>
            
            <View style={styles.dateTimeSection}>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Calendar size={18} color={Colors.primary} />
                <Text style={styles.dateTimeButtonText}>
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.8}
              >
                <Clock size={18} color={Colors.primary} />
                <Text style={styles.dateTimeButtonText}>
                  {selectedDate.toLocaleTimeString('en-US', { 
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {Platform.OS === 'ios' && showDatePicker && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  textColor={Colors.text}
                  minimumDate={new Date()}
                />
              </View>
            )}

            {Platform.OS === 'ios' && showTimePicker && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  display="spinner"
                  onChange={onTimeChange}
                  textColor={Colors.text}
                />
              </View>
            )}

            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            {Platform.OS === 'android' && showTimePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowCalendarModal(false);
                  setSelectedDate(new Date());
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmButton, isAddingToCalendar && { opacity: 0.5 }]}
                onPress={handleAddToCalendar}
                disabled={isAddingToCalendar}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>
                  {isAddingToCalendar ? 'Adding...' : 'Add to Calendar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {showQueueModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add to Queue</Text>
            <Text style={styles.modalSubtitle}>Add a note for your partner (optional)</Text>
            
            <TextInput
              style={styles.queueNoteInput}
              value={queueNote}
              onChangeText={setQueueNote}
              placeholder="Why do you want to do this activity?"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowQueueModal(false);
                  setQueueNote('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleAddToQueue}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>Add to Queue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  weatherSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  weatherIcon: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  weatherDetails: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: Typography.sizes.h2,
    color: Colors.text,
    fontWeight: '400' as const,
  },
  weatherCondition: {
    fontSize: Typography.sizes.body,
    color: Colors.primary,
    marginTop: 2,
  },
  weatherSubtext: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    marginTop: 4,
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
  starIcon: {
    width: 32,
    height: 32,
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
  locationSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.sm,
  },
  locationDetails: {
    flex: 1,
  },
  locationText: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    fontWeight: '400' as const,
  },
  locationSubtext: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    marginTop: 2,
  },
  updateLocationButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  updateLocationText: {
    fontSize: Typography.sizes.caption,
    color: Colors.primary,
    fontWeight: '400' as const,
  },
  photosSection: {
    marginBottom: Spacing.lg,
  },
  photosSectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.md,
  },
  photoButtons: {
    flexDirection: 'row' as const,
    gap: Spacing.sm,
  },
  photoActionButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  photosScroll: {
    marginHorizontal: -Spacing.lg,
  },
  photosScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  photoContainer: {
    width: 160,
    height: 160,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden' as const,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  noPhotosContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.xxl,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed' as const,
  },
  noPhotosText: {
    fontSize: Typography.sizes.h3,
    color: Colors.text,
    marginTop: Spacing.md,
    fontWeight: '500' as const,
  },
  noPhotosSubtext: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    marginTop: Spacing.xs,
    textAlign: 'center' as const,
    paddingHorizontal: Spacing.lg,
  },
  addPhotoPromptButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginTop: Spacing.lg,
  },
  addPhotoPromptText: {
    fontSize: Typography.sizes.body,
    color: Colors.white,
    fontWeight: '500' as const,
  },
  actionsSection: {
    gap: Spacing.md,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.medium,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    fontSize: Typography.sizes.h3,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  activeActivityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: Spacing.md,
  },
  activeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  activeContent: {
    flex: 1,
  },
  activeTitle: {
    fontSize: Typography.sizes.body,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  activeSubtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.cardBackground,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  pauseButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.textLight,
  },
  shareActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.medium,
  },
  shareActivityButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.text,
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
  queueButton: {
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
  queueButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.white,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.medium,
  },
  calendarButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.text,
  },
  dateTimeSection: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.backgroundDark,
    padding: Spacing.lg,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  dateTimeButtonText: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    fontWeight: '400' as const,
  },
  pickerContainer: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '400' as const,
    color: Colors.white,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  queueNoteInput: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    fontSize: Typography.sizes.body,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    minHeight: 100,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalCancelText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.textLight,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.white,
  },
  // Slideshow Styles
  slideshowContainer: {
    width: SCREEN_WIDTH,
    minHeight: 400,
    marginBottom: Spacing.xl,
    marginHorizontal: -Spacing.lg, // Negative margin to extend full width
    position: 'relative',
    borderRadius: 0, // No border radius for full-width slideshow
    overflow: 'hidden',
    backgroundColor: Colors.cardBackground,
  },
  emptyPhotoContainer: {
    width: '100%',
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.backgroundDark,
  },
  emptyPhotoIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    borderStyle: 'dashed',
  },
  emptyPhotoTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyPhotoText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  slideshowScroll: {
    width: '100%',
    height: '100%',
  },
  slide: {
    width: SCREEN_WIDTH,
    height: 400,
  },
  slideImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.large,
  },
  photoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    position: 'absolute',
    bottom: Spacing.lg,
    left: 0,
    right: 0,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
    opacity: 0.4,
  },
  indicatorActive: {
    opacity: 1,
    width: 24,
    backgroundColor: Colors.primary,
  },
  photoCounter: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.medium,
  },
  photoCounterText: {
    fontSize: Typography.sizes.caption,
    color: Colors.white,
    fontWeight: '500' as const,
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  navArrowLeft: {
    left: Spacing.md,
  },
  navArrowRight: {
    right: Spacing.md,
  },
  // Memory Header Styles
  memoryHeader: {
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  memoryTitle: {
    fontSize: Typography.sizes.h1,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  memoryTimestamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  memoryTimestampText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
  },
  // Memory Notes Styles
  memoryNotesSection: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  memoryNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  memoryNotesTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  memoryNotesText: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    lineHeight: 24,
  },
  memoryNotesEmpty: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    fontStyle: 'italic' as const,
  },
  // Memory Details Styles
  memoryDetailsSection: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  memoryDetailsTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  memoryDescription: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  memoryDetailsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  memoryDetailCard: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  memoryDetailLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  memoryDetailValue: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  memoryProTip: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  memoryProTipLabel: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  memoryProTipText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    lineHeight: 20,
  },
  memoryLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  memoryLocationText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
  },
  // Social Sharing Styles
  socialSharingSection: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  socialSharingTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  socialSharingSubtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.medium,
    minHeight: 48,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  instagramButton: {
    backgroundColor: '#E4405F',
  },
  genericShareButton: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  socialButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
  genericShareButtonText: {
    color: Colors.text,
  },
  brandingNote: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  brandingNoteText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    fontStyle: 'italic' as const,
  },
});
