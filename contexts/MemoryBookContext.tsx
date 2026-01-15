import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, SavedActivity, LocationData } from '@/types/activity';

const SAVED_ACTIVITIES_KEY = 'scratch_and_go_saved_activities';
const LOCATION_KEY = 'scratch_and_go_location';

export const [MemoryBookProvider, useMemoryBook] = createContextHook(() => {
  const [savedActivities, setSavedActivities] = useState<SavedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);

  // Load location from storage to avoid circular dependency with LocationContext
  useEffect(() => {
    const loadLocation = async () => {
      try {
        const stored = await AsyncStorage.getItem(LOCATION_KEY);
        if (stored) {
          setCurrentLocation(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load location in MemoryBook:', error);
      }
    };
    loadLocation();
  }, []);

  useEffect(() => {
    loadSavedActivities();
  }, []);

  const loadSavedActivities = async () => {
    try {
      const stored = await AsyncStorage.getItem(SAVED_ACTIVITIES_KEY);
      if (stored) {
        const activities = JSON.parse(stored) as SavedActivity[];
        setSavedActivities(activities);
      }
    } catch (error) {
      console.error('Failed to load saved activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSavedActivities = async (activities: SavedActivity[]) => {
    try {
      await AsyncStorage.setItem(SAVED_ACTIVITIES_KEY, JSON.stringify(activities));
    } catch (error) {
      console.error('Failed to save activities:', error);
    }
  };

  const saveActivity = (activity: Activity, scheduledFor?: number) => {
    const isScheduled = scheduledFor !== undefined && scheduledFor > Date.now();
    const savedActivity: SavedActivity = {
      ...activity,
      id: Date.now().toString() + Math.random().toString(36),
      savedAt: Date.now(),
      isActive: !isScheduled, // If scheduled for later, don't mark as active yet
      isCompleted: false,
      photos: [],
      locationSnapshot: currentLocation || undefined,
      scheduledFor: scheduledFor,
      isScheduled: isScheduled,
      startedAt: isScheduled ? undefined : Date.now(), // Start immediately if not scheduled
    };

    const updated = [savedActivity, ...savedActivities];
    setSavedActivities(updated);
    saveSavedActivities(updated);
    // Note: Activity interactions are tracked separately via ActivityContext when needed

    console.log('Activity saved:', savedActivity.title, isScheduled ? `scheduled for ${new Date(scheduledFor!).toLocaleString()}` : 'starting now');
    return savedActivity;
  };

  const createManualActivity = (activityData: {
    title: string;
    description: string;
    category: string;
    cost: 'free' | '$' | '$$' | '$$$';
    duration: string;
    proTip?: string;
    photos?: string[];
    notes?: string;
  }) => {
    const activity: Activity = {
      title: activityData.title,
      description: activityData.description,
      category: activityData.category,
      cost: activityData.cost,
      duration: activityData.duration,
      proTip: activityData.proTip || 'Enjoy the moment and make it memorable!',
    };

    const savedActivity: SavedActivity = {
      ...activity,
      id: Date.now().toString() + Math.random().toString(36),
      savedAt: Date.now(),
      isActive: false,
      isCompleted: true, // Mark as completed since user is logging it after doing it
      completedAt: Date.now(),
      photos: activityData.photos || [],
      notes: activityData.notes || '',
      locationSnapshot: currentLocation || undefined,
    };

    const updated = [savedActivity, ...savedActivities];
    setSavedActivities(updated);
    saveSavedActivities(updated);

    console.log('Manual activity created:', savedActivity.title);
    return savedActivity;
  };

  const unsaveActivity = (activityId: string) => {
    const updated = savedActivities.filter(a => a.id !== activityId);
    setSavedActivities(updated);
    saveSavedActivities(updated);
    console.log('Activity removed:', activityId);
  };

  const startActivity = (activityId: string) => {
    const updated = savedActivities.map(act =>
      act.id === activityId
        ? { ...act, isActive: true, startedAt: Date.now() }
        : act
    );
    setSavedActivities(updated);
    saveSavedActivities(updated);
    console.log('Activity started:', activityId);
  };

  const stopActivity = (activityId: string) => {
    const updated = savedActivities.map(act =>
      act.id === activityId
        ? { ...act, isActive: false }
        : act
    );
    setSavedActivities(updated);
    saveSavedActivities(updated);
    console.log('Activity stopped:', activityId);
  };

  const markAsCompleted = (activityId: string, completedAt: number = Date.now()) => {
    const updated = savedActivities.map(act =>
      act.id === activityId
        ? { ...act, isActive: false, isCompleted: true, completedAt }
        : act
    );
    setSavedActivities(updated);
    saveSavedActivities(updated);
    // Note: Activity interactions are tracked separately via ActivityContext when needed
    console.log('Activity marked as completed:', activityId);
  };

  const markAsIncomplete = (activityId: string) => {
    const updated = savedActivities.map(activity =>
      activity.id === activityId
        ? { ...activity, isCompleted: false, completedAt: undefined }
        : activity
    );
    setSavedActivities(updated);
    saveSavedActivities(updated);
    console.log('Activity marked as incomplete:', activityId);
  };

  const updateRating = (activityId: string, rating: number) => {
    const updated = savedActivities.map(activity =>
      activity.id === activityId
        ? { ...activity, rating }
        : activity
    );
    setSavedActivities(updated);
    saveSavedActivities(updated);
    console.log('Activity rating updated:', activityId, rating);
  };

  const updateNotes = (activityId: string, notes: string) => {
    const updated = savedActivities.map(activity =>
      activity.id === activityId
        ? { ...activity, notes }
        : activity
    );
    setSavedActivities(updated);
    saveSavedActivities(updated);
    console.log('Activity notes updated:', activityId);
  };

  const addPhoto = (activityId: string, photoUri: string) => {
    const updated = savedActivities.map(activity =>
      activity.id === activityId
        ? { ...activity, photos: [...(activity.photos || []), photoUri] }
        : activity
    );
    setSavedActivities(updated);
    saveSavedActivities(updated);
    console.log('Photo added to activity:', activityId);
  };

  const removePhoto = (activityId: string, photoUri: string) => {
    const updated = savedActivities.map(activity =>
      activity.id === activityId
        ? { ...activity, photos: (activity.photos || []).filter(p => p !== photoUri) }
        : activity
    );
    setSavedActivities(updated);
    saveSavedActivities(updated);
    console.log('Photo removed from activity:', activityId);
  };

  const updateLocationSnapshot = (activityId: string, locationData?: LocationData) => {
    const updated = savedActivities.map(activity =>
      activity.id === activityId
        ? { ...activity, locationSnapshot: locationData || currentLocation || undefined }
        : activity
    );
    setSavedActivities(updated);
    saveSavedActivities(updated);
    console.log('Location snapshot updated for activity:', activityId);
  };

  const isActivitySaved = (activityTitle: string): boolean => {
    return savedActivities.some(a => a.title === activityTitle);
  };

  const getSavedActivity = (activityId: string): SavedActivity | undefined => {
    return savedActivities.find(a => a.id === activityId);
  };

  const getSavedActivities = (): SavedActivity[] => {
    return savedActivities.filter(a => !a.isCompleted && !a.isActive);
  };

  const getActiveActivities = (): SavedActivity[] => {
    return savedActivities.filter(a => a.isActive && !a.isCompleted);
  };

  const getCompletedActivities = (): SavedActivity[] => {
    return savedActivities.filter(a => a.isCompleted);
  };

  const getScheduledActivities = (): SavedActivity[] => {
    return savedActivities.filter(a => a.isScheduled && !a.isCompleted && !a.isActive);
  };

  const updateScheduledTime = (activityId: string, scheduledFor: number) => {
    const updated = savedActivities.map(activity =>
      activity.id === activityId
        ? { 
            ...activity, 
            scheduledFor, 
            isScheduled: scheduledFor > Date.now() 
          }
        : activity
    );
    setSavedActivities(updated);
    saveSavedActivities(updated);
    console.log('Activity scheduled time updated:', activityId, new Date(scheduledFor).toLocaleString());
  };

  const startScheduledActivity = (activityId: string) => {
    const updated = savedActivities.map(activity =>
      activity.id === activityId
        ? { 
            ...activity, 
            isActive: true, 
            isScheduled: false, 
            startedAt: Date.now() 
          }
        : activity
    );
    setSavedActivities(updated);
    saveSavedActivities(updated);
    console.log('Scheduled activity started:', activityId);
  };

  // Get an activity that needs attention (active in-progress or scheduled due now)
  const getActivityToResume = (): SavedActivity | null => {
    // First, check for any active (in-progress) activities
    const activeActivity = savedActivities.find(a => a.isActive && !a.isCompleted);
    if (activeActivity) {
      return activeActivity;
    }

    // Then, check for any scheduled activities that are due (scheduled time has passed)
    const now = Date.now();
    const dueScheduled = savedActivities.find(
      a => a.isScheduled && 
           !a.isCompleted && 
           !a.isActive && 
           a.scheduledFor && 
           a.scheduledFor <= now
    );
    if (dueScheduled) {
      return dueScheduled;
    }

    return null;
  };

  // Get upcoming scheduled activities (within the next 24 hours)
  const getUpcomingActivities = (): SavedActivity[] => {
    const now = Date.now();
    const twentyFourHoursLater = now + 24 * 60 * 60 * 1000;
    return savedActivities.filter(
      a => a.isScheduled && 
           !a.isCompleted && 
           !a.isActive && 
           a.scheduledFor && 
           a.scheduledFor > now &&
           a.scheduledFor <= twentyFourHoursLater
    ).sort((a, b) => (a.scheduledFor || 0) - (b.scheduledFor || 0));
  };

  return {
    savedActivities,
    isLoading,
    saveActivity,
    createManualActivity,
    unsaveActivity,
    startActivity,
    stopActivity,
    markAsCompleted,
    markAsIncomplete,
    updateRating,
    updateNotes,
    addPhoto,
    removePhoto,
    updateLocationSnapshot,
    isActivitySaved,
    getSavedActivity,
    getSavedActivities,
    getActiveActivities,
    getCompletedActivities,
    // Scheduling functions
    getScheduledActivities,
    updateScheduledTime,
    startScheduledActivity,
    getActivityToResume,
    getUpcomingActivities,
  };
});
