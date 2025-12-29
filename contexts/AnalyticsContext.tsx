import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalyticsEvent, AnalyticsProperties, AnalyticsUser } from '@/types/analytics';

const ANALYTICS_ENABLED_KEY = 'scratch_and_go_analytics_enabled';
const USER_ID_KEY = 'scratch_and_go_user_id';
const SESSION_START_KEY = 'scratch_and_go_session_start';

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const [AnalyticsProvider, useAnalytics] = createContextHook(() => {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionStart, setSessionStart] = useState<number>(Date.now());

  useEffect(() => {
    initializeAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeAnalytics = async () => {
    try {
      const enabled = await AsyncStorage.getItem(ANALYTICS_ENABLED_KEY);
      if (enabled !== null) {
        setAnalyticsEnabled(enabled === 'true');
      }

      let storedUserId = await AsyncStorage.getItem(USER_ID_KEY);
      if (!storedUserId) {
        storedUserId = generateUserId();
        await AsyncStorage.setItem(USER_ID_KEY, storedUserId);
      }
      setUserId(storedUserId);

      const storedSessionStart = await AsyncStorage.getItem(SESSION_START_KEY);
      if (storedSessionStart) {
        setSessionStart(parseInt(storedSessionStart));
      } else {
        await AsyncStorage.setItem(SESSION_START_KEY, sessionStart.toString());
      }

      trackEvent('app_launched', {
        platform: 'mobile',
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  };

  const trackEvent = (event: AnalyticsEvent, properties?: AnalyticsProperties) => {
    if (!analyticsEnabled) {
      console.log('[Analytics Disabled]', event, properties);
      return;
    }

    const eventData = {
      event,
      userId,
      timestamp: Date.now(),
      sessionDuration: Date.now() - sessionStart,
      ...properties,
    };

    console.log('[Analytics Event]', eventData);

    logEventToStorage(eventData);
  };

  const logEventToStorage = async (eventData: any) => {
    try {
      const eventsKey = 'scratch_and_go_analytics_events';
      const storedEvents = await AsyncStorage.getItem(eventsKey);
      const events = storedEvents ? JSON.parse(storedEvents) : [];
      
      events.push(eventData);
      
      const recentEvents = events.slice(-100);
      await AsyncStorage.setItem(eventsKey, JSON.stringify(recentEvents));
    } catch (error) {
      console.error('Failed to log event to storage:', error);
    }
  };

  const identifyUser = (userProperties: AnalyticsUser) => {
    if (!analyticsEnabled) return;

    console.log('[Analytics Identify]', { userId, ...userProperties });
  };

  const setAnalyticsPreference = async (enabled: boolean) => {
    setAnalyticsEnabled(enabled);
    await AsyncStorage.setItem(ANALYTICS_ENABLED_KEY, enabled.toString());
    console.log(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
  };

  const getSessionDuration = () => {
    return Date.now() - sessionStart;
  };

  const resetSession = async () => {
    const newSessionStart = Date.now();
    setSessionStart(newSessionStart);
    await AsyncStorage.setItem(SESSION_START_KEY, newSessionStart.toString());
  };

  return {
    analyticsEnabled,
    userId,
    trackEvent,
    identifyUser,
    setAnalyticsPreference,
    getSessionDuration,
    resetSession,
  };
});
