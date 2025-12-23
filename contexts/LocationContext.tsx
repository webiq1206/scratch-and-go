import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { LocationData } from '@/types/activity';

const LOCATION_KEY = 'scratch_and_go_location';

export const [LocationProvider, useLocation] = createContextHook(() => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSavedLocation();
  }, []);

  const loadSavedLocation = async () => {
    try {
      const stored = await AsyncStorage.getItem(LOCATION_KEY);
      if (stored) {
        setLocation(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load saved location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          setError('Geolocation is not supported by your browser');
          return false;
        }
        return true;
      }

      const { requestForegroundPermissionsAsync } = await import('expo-location');
      const { status } = await requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission not granted');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setError('Failed to request location permission');
      return false;
    }
  };

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

    setIsLoading(true);
    setError(null);

    try {
      if (Platform.OS === 'web') {
        return await getWebLocation();
      } else {
        return await getNativeLocation();
      }
    } catch (error) {
      console.error('Failed to get location:', error);
      setError('Failed to get your location');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getWebLocation = (): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationData = await reverseGeocode(latitude, longitude);
          resolve(locationData);
        },
        (error) => {
          console.error('Web geolocation error:', error);
          setError('Failed to get your location');
          resolve(null);
        }
      );
    });
  };

  const getNativeLocation = async (): Promise<LocationData | null> => {
    try {
      const { getCurrentPositionAsync, reverseGeocodeAsync } = await import('expo-location');
      
      const position = await getCurrentPositionAsync({
        accuracy: 4,
      });

      const { latitude, longitude } = position.coords;
      const geocoded = await reverseGeocodeAsync({ latitude, longitude });

      if (geocoded && geocoded.length > 0) {
        const place = geocoded[0];
        const locationData: LocationData = {
          city: place.city || place.subregion || 'Unknown City',
          region: place.region || place.subregion || 'Unknown Region',
          country: place.country || 'Unknown Country',
          coords: { latitude, longitude },
        };

        await saveLocation(locationData);
        setLocation(locationData);
        return locationData;
      }

      return null;
    } catch (error) {
      console.error('Native location error:', error);
      throw error;
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number): Promise<LocationData | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await response.json();

      const locationData: LocationData = {
        city: data.address.city || data.address.town || data.address.village || 'Unknown City',
        region: data.address.state || data.address.region || 'Unknown Region',
        country: data.address.country || 'Unknown Country',
        coords: { latitude, longitude },
      };

      await saveLocation(locationData);
      setLocation(locationData);
      return locationData;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  };

  const saveLocation = async (locationData: LocationData) => {
    try {
      await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(locationData));
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  };

  const setManualLocation = async (locationData: LocationData) => {
    setLocation(locationData);
    await saveLocation(locationData);
  };

  const clearLocation = async () => {
    setLocation(null);
    await AsyncStorage.removeItem(LOCATION_KEY);
  };

  return {
    location,
    isLoading,
    error,
    getCurrentLocation,
    setManualLocation,
    clearLocation,
    hasLocation: !!location,
  };
});
