import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, SavedActivity } from '@/types/activity';
import { useActivity } from './ActivityContext';
import { useLocation } from './LocationContext';

const SAVED_ACTIVITIES_KEY = 'scratch_and_go_saved_activities';

export const [MemoryBookProvider, useMemoryBook] = createContextHook(() => {
  const { trackInteraction } = useActivity();
  const { location } = useLocation();
  const [savedActivities, setSavedActivities] = useState<SavedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const saveActivity = (activity: Activity) => {
    const savedActivity: SavedActivity = {
      ...activity,
      id: Date.now().toString() + Math.random().toString(36),
      savedAt: Date.now(),
      isCompleted: false,
      photos: [],
      locationSnapshot: location || undefined,
    };

    const updated = [savedActivity, ...savedActivities];
    setSavedActivities(updated);
    saveSavedActivities(updated);
    trackInteraction(activity, 'saved');

    console.log('Activity saved:', savedActivity.title);
    return savedActivity;
  };

  const unsaveActivity = (activityId: string) => {
    const updated = savedActivities.filter(a => a.id !== activityId);
    setSavedActivities(updated);
    saveSavedActivities(updated);
    console.log('Activity removed:', activityId);
  };

  const markAsCompleted = (activityId: string, completedAt: number = Date.now()) => {
    const activity = savedActivities.find(a => a.id === activityId);
    const updated = savedActivities.map(act =>
      act.id === activityId
        ? { ...act, isCompleted: true, completedAt }
        : act
    );
    setSavedActivities(updated);
    saveSavedActivities(updated);
    if (activity) {
      trackInteraction(activity, 'completed');
    }
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

  const updateLocationSnapshot = (activityId: string) => {
    const updated = savedActivities.map(activity =>
      activity.id === activityId
        ? { ...activity, locationSnapshot: location || undefined }
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
    return savedActivities.filter(a => !a.isCompleted);
  };

  const getCompletedActivities = (): SavedActivity[] => {
    return savedActivities.filter(a => a.isCompleted);
  };

  return {
    savedActivities,
    isLoading,
    saveActivity,
    unsaveActivity,
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
    getCompletedActivities,
  };
});
