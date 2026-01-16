/**
 * Network state utilities for offline support
 * Provides hooks and functions to detect network connectivity
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

const DEFAULT_STATE: NetworkState = {
  isConnected: true,
  isInternetReachable: true,
  type: null,
};

/**
 * Hook to track network connectivity
 * Returns current network state and a refresh function
 */
export function useNetworkState(): NetworkState & { refresh: () => Promise<void> } {
  const [networkState, setNetworkState] = useState<NetworkState>(DEFAULT_STATE);

  const checkNetworkState = useCallback(async () => {
    // For web platform, use navigator.onLine
    if (Platform.OS === 'web') {
      setNetworkState({
        isConnected: navigator.onLine,
        isInternetReachable: navigator.onLine,
        type: navigator.onLine ? 'wifi' : null,
      });
      return;
    }

    // For native platforms, try to import NetInfo
    try {
      const NetInfo = await import('@react-native-community/netinfo');
      const state = await NetInfo.default.fetch();
      setNetworkState({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    } catch {
      // NetInfo not available, assume connected
      setNetworkState(DEFAULT_STATE);
    }
  }, []);

  useEffect(() => {
    checkNetworkState();

    // For web, listen to online/offline events
    if (Platform.OS === 'web') {
      const handleOnline = () => {
        setNetworkState({
          isConnected: true,
          isInternetReachable: true,
          type: 'wifi',
        });
      };

      const handleOffline = () => {
        setNetworkState({
          isConnected: false,
          isInternetReachable: false,
          type: null,
        });
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // For native, set up NetInfo subscription
    let unsubscribe: (() => void) | null = null;

    const setupSubscription = async () => {
      try {
        const NetInfo = await import('@react-native-community/netinfo');
        unsubscribe = NetInfo.default.addEventListener(state => {
          setNetworkState({
            isConnected: state.isConnected ?? true,
            isInternetReachable: state.isInternetReachable,
            type: state.type,
          });
        });
      } catch {
        // NetInfo not available
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [checkNetworkState]);

  return {
    ...networkState,
    refresh: checkNetworkState,
  };
}

/**
 * Check if the device is currently offline
 */
export function isOffline(state: NetworkState): boolean {
  return !state.isConnected || state.isInternetReachable === false;
}

/**
 * Get a user-friendly message for the current network state
 */
export function getNetworkMessage(state: NetworkState): string | null {
  if (!state.isConnected) {
    return 'You are currently offline. Some features may not be available.';
  }
  if (state.isInternetReachable === false) {
    return 'Unable to reach the internet. Please check your connection.';
  }
  return null;
}
