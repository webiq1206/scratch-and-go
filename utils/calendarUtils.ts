import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import { Activity } from '@/types/activity';

export async function requestCalendarPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    Alert.alert(
      'Calendar Not Available',
      'Calendar integration is only available on iOS and Android devices.'
    );
    return false;
  }

  try {
    const { status: existingStatus } = await Calendar.getCalendarPermissionsAsync();
    
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Calendar permission is needed to add activities to your calendar. Please enable it in your device settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting calendar permissions:', error);
    Alert.alert('Error', 'Failed to request calendar permissions.');
    return false;
  }
}

export async function getDefaultCalendar(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      return null;
    }

    if (Platform.OS === 'ios') {
      const defaultCalendar = await Calendar.getDefaultCalendarAsync();
      return defaultCalendar.id;
    } else {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const writableCalendars = calendars.filter(
        cal => cal.allowsModifications && cal.source.name !== 'Birthdays'
      );
      
      if (writableCalendars.length > 0) {
        const primaryCalendar = writableCalendars.find(cal => cal.isPrimary) || writableCalendars[0];
        return primaryCalendar.id;
      }
      
      return null;
    }
  } catch (error) {
    console.error('Error getting default calendar:', error);
    return null;
  }
}

export interface AddToCalendarParams {
  activity: Activity;
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

export async function addActivityToCalendar({
  activity,
  startDate,
  endDate,
  notes,
}: AddToCalendarParams): Promise<boolean> {
  if (Platform.OS === 'web') {
    Alert.alert(
      'Calendar Not Available',
      'Calendar integration is only available on iOS and Android devices.'
    );
    return false;
  }

  try {
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      return false;
    }

    const calendarId = await getDefaultCalendar();
    if (!calendarId) {
      Alert.alert(
        'No Calendar Available',
        'No writable calendar found on your device. Please create a calendar first.'
      );
      return false;
    }

    const calculatedEndDate = endDate || new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const eventDetails = {
      title: activity.title,
      startDate,
      endDate: calculatedEndDate,
      notes: notes || activity.description,
      timeZone: 'default',
      location: activity.category,
    };

    const eventId = await Calendar.createEventAsync(calendarId, eventDetails);

    if (eventId) {
      Alert.alert(
        'Added to Calendar',
        `"${activity.title}" has been added to your calendar.`,
        [{ text: 'OK' }]
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error adding activity to calendar:', error);
    Alert.alert(
      'Error',
      'Failed to add activity to calendar. Please try again.'
    );
    return false;
  }
}

export function parseActivityDuration(duration: string): number {
  const hoursMatch = duration.match(/(\d+)\s*(?:hour|hr)/i);
  if (hoursMatch) {
    return parseInt(hoursMatch[1], 10);
  }
  
  const daysMatch = duration.match(/(\d+)\s*day/i);
  if (daysMatch) {
    return parseInt(daysMatch[1], 10) * 24;
  }
  
  return 2;
}

export function calculateEndDate(startDate: Date, duration: string): Date {
  const hours = parseActivityDuration(duration);
  return new Date(startDate.getTime() + hours * 60 * 60 * 1000);
}
