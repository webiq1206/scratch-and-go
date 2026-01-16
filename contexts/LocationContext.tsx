import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { LocationData, WeatherData } from '@/types/activity';
import { LOCATION_KEY } from '@/constants/storageKeys';
const WEATHER_CACHE_DURATION = 30 * 60 * 1000;
const LOCATION_CHECK_INTERVAL = 30 * 60 * 1000;
const SIGNIFICANT_DISTANCE = 50000;

export const [LocationProvider, useLocation] = createContextHook(() => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(true);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const lastErrorTime = useRef<number>(0);
  const ERROR_COOLDOWN = 60000;

  const loadSavedLocation = async () => {
    try {
      const stored = await AsyncStorage.getItem(LOCATION_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object' && parsed.city) {
            setLocation(parsed);
          } else {
            console.error('Invalid location data structure, clearing');
            await AsyncStorage.removeItem(LOCATION_KEY);
          }
        } catch (parseError) {
          console.error('Corrupted location data, clearing:', parseError);
          await AsyncStorage.removeItem(LOCATION_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load saved location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          setError('Geolocation is not supported by your browser');
          setHasPermissionError(true);
          setIsTrackingEnabled(false);
          return false;
        }
        if (hasPermissionError) {
          console.log('Permission previously denied, skipping request');
          return false;
        }
        return true;
      }

      const { requestForegroundPermissionsAsync } = await import('expo-location');
      const { status } = await requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission not granted');
        setHasPermissionError(true);
        setIsTrackingEnabled(false);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setError('Failed to request location permission');
      setHasPermissionError(true);
      setIsTrackingEnabled(false);
      return false;
    }
  }, [hasPermissionError]);

  const saveLocation = async (locationData: LocationData) => {
    try {
      await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(locationData));
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  };

  const fetchWeather = useCallback(async (latitude: number, longitude: number): Promise<WeatherData | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Weather API response not ok:', response.status);
        return null;
      }

      const data = await response.json();

      if (!data.current) {
        console.error('No weather data available');
        return null;
      }

      const weatherCode = data.current.weather_code;
      const { condition, description, icon } = getWeatherInfo(weatherCode);

      const weatherData: WeatherData = {
        temp: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        condition,
        description,
        icon,
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        timestamp: Date.now(),
      };

      console.log('Weather data fetched:', weatherData);
      return weatherData;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Weather fetch timed out');
      } else {
        console.error('Weather fetch failed:', error);
      }
      return null;
    }
  }, []);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number): Promise<LocationData | null> => {
    const createFallbackLocation = (): LocationData => ({
      city: 'Current Location',
      region: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
      country: '',
      coords: { latitude, longitude },
      weather: undefined,
    });

    const tryGeocode = async (): Promise<LocationData | null> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
          { 
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            },
            mode: 'cors',
          }
        );
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.log('Geocoding response not ok:', response.status);
          return null;
        }
        
        const data = await response.json();

        if (!data.address) {
          console.log('No address data in response');
          return null;
        }

        return {
          city: data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || data.address?.hamlet || 'Unknown City',
          region: data.address?.state || data.address?.region || data.address?.county || 'Unknown Region',
          country: data.address?.country || 'Unknown Country',
          coords: { latitude, longitude },
          weather: undefined,
        };
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Geocoding request timed out');
        } else {
          console.log('Geocoding fetch error (this is normal on some browsers):', error instanceof Error ? error.message : 'Unknown error');
        }
        return null;
      }
    };

    try {
      let locationData = await tryGeocode();
      
      if (!locationData) {
        console.log('Using coordinate-based fallback location');
        locationData = createFallbackLocation();
      }

      setLocation(locationData);
      saveLocation(locationData).catch(err => console.error('Failed to save location:', err));

      setTimeout(() => {
        fetchWeather(latitude, longitude).then(weather => {
          if (weather) {
            const updatedLocation = { ...locationData!, weather };
            setLocation(updatedLocation);
            saveLocation(updatedLocation).catch(err => console.error('Failed to save weather:', err));
          }
        }).catch(err => console.error('Weather fetch failed:', err));
      }, 1000);

      return locationData;
    } catch {
      console.log('Reverse geocoding failed completely, using fallback');
      const fallbackLocation = createFallbackLocation();
      setLocation(fallbackLocation);
      saveLocation(fallbackLocation).catch(err => console.error('Failed to save fallback location:', err));
      return fallbackLocation;
    }
  }, [saveLocation, fetchWeather]);

  const getWebLocation = useCallback((): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocation is not supported by your browser';
        console.error('Geolocation not supported');
        setError(errorMsg);
        resolve(null);
        return;
      }

      const timeoutId = setTimeout(() => {
        console.error('Geolocation timeout - no response after 15 seconds');
      }, 15000);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(timeoutId);
          console.log('Web location detected successfully');
          const { latitude, longitude } = position.coords;
          const locationData = await reverseGeocode(latitude, longitude);
          setError(null);
          setHasPermissionError(false);
          lastErrorTime.current = 0;
          resolve(locationData);
        },
        (error) => {
          clearTimeout(timeoutId);
          
          const errorMessages: { [key: number]: string } = {
            1: 'Location permission denied. Please enable location access in your browser settings.',
            2: 'Unable to determine your location. Please check your internet connection.',
            3: 'Location request timed out. Please try again.',
          };
          
          const errorMessage = errorMessages[error.code] || 'Failed to get your location';
          const errorDetails = {
            code: error.code,
            message: error.message || 'No message available',
            type: error.code === 1 ? 'PERMISSION_DENIED' : 
                  error.code === 2 ? 'POSITION_UNAVAILABLE' : 
                  error.code === 3 ? 'TIMEOUT' : 'UNKNOWN',
            timestamp: new Date().toISOString(),
          };
          
          console.error('Geolocation Error Details:', JSON.stringify(errorDetails, null, 2));
          
          if (error.code === 1) {
            setHasPermissionError(true);
            setIsTrackingEnabled(false);
            console.log('Disabling automatic location tracking due to permission denial');
          }
          
          lastErrorTime.current = Date.now();
          setError(errorMessage);
          resolve(null);
        },
        {
          timeout: 15000,
          enableHighAccuracy: false,
          maximumAge: 60000,
        }
      );
    });
  }, [reverseGeocode]);

  const getNativeLocation = useCallback(async (): Promise<LocationData | null> => {
    try {
      const { getCurrentPositionAsync, reverseGeocodeAsync } = await import('expo-location');
      
      const position = await getCurrentPositionAsync({
        accuracy: 4,
      });

      const { latitude, longitude } = position.coords;
      const geocoded = await reverseGeocodeAsync({ latitude, longitude });

      if (geocoded && geocoded.length > 0) {
        const place = geocoded[0];
        
        // Fetch weather with error handling
        let weather: WeatherData | null = null;
        try {
          weather = await fetchWeather(latitude, longitude);
        } catch (weatherError) {
          console.error('Weather fetch failed in native location:', weatherError);
          // Continue without weather data
        }

        const locationData: LocationData = {
          city: place.city || place.subregion || 'Unknown City',
          region: place.region || place.subregion || 'Unknown Region',
          country: place.country || 'Unknown Country',
          coords: { latitude, longitude },
          weather: weather || undefined,
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
  }, [fetchWeather, saveLocation]);

  const getCurrentLocation = useCallback(async (forceRetry: boolean = false): Promise<LocationData | null> => {
    if (hasPermissionError && !forceRetry) {
      console.log('Permission denied - skipping automatic location request');
      return null;
    }

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
  }, [getWebLocation, getNativeLocation, hasPermissionError, requestLocationPermission]);

  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  const checkAndUpdateLocationRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    checkAndUpdateLocationRef.current = async () => {
      if (!isTrackingEnabled || hasPermissionError) {
        return;
      }

      const now = Date.now();
      if (now - lastErrorTime.current < ERROR_COOLDOWN) {
        console.log('Skipping location check - in error cooldown period');
        return;
      }

      try {
        const newLocation = await getCurrentLocation();
        
        if (!newLocation || !location) {
          return;
        }

        const distance = calculateDistance(
          location.coords?.latitude || 0,
          location.coords?.longitude || 0,
          newLocation.coords?.latitude || 0,
          newLocation.coords?.longitude || 0
        );

        if (distance > SIGNIFICANT_DISTANCE) {
          console.log('Significant location change detected');
        }
      } catch (error) {
        console.error('Error checking location:', error instanceof Error ? error.message : String(error));
        lastErrorTime.current = Date.now();
      }
    };
  }, [isTrackingEnabled, hasPermissionError, location, calculateDistance, getCurrentLocation]);

  const setupLocationTracking = useCallback(() => {
    console.log('Setting up automatic location tracking');
    
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }

    trackingIntervalRef.current = setInterval(() => {
      checkAndUpdateLocationRef.current?.();
    }, LOCATION_CHECK_INTERVAL) as any;
  }, []);

  const stopLocationTracking = useCallback(() => {
    console.log('Stopping automatic location tracking');
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  }, []);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to foreground');
      setTimeout(() => {
        checkAndUpdateLocationRef.current?.();
      }, 1000);
    }
    appState.current = nextAppState;
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const initializeLocation = async () => {
      await loadSavedLocation();
      
      // If no saved location and tracking is enabled, try to get current location
      // Wait a bit for the app to fully load before requesting location
      setTimeout(async () => {
        if (!mounted) return;
        
        // Check if location was loaded from storage
        const stored = await AsyncStorage.getItem(LOCATION_KEY);
        if (!stored && isTrackingEnabled && !hasPermissionError) {
          console.log('No saved location found, attempting to get current location...');
          try {
            await getCurrentLocation();
          } catch (error) {
            console.log('Initial location request failed (this is normal if permission not granted):', error);
          }
        }
      }, 2000);
    };
    
    initializeLocation();
    
    const delayedSetup = setTimeout(() => {
      if (mounted) {
        setupLocationTracking();
      }
    }, 3000);
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      mounted = false;
      clearTimeout(delayedSetup);
      subscription.remove();
      stopLocationTracking();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isTrackingEnabled) {
      setupLocationTracking();
    } else {
      stopLocationTracking();
    }
  }, [isTrackingEnabled, setupLocationTracking, stopLocationTracking]);



  const setManualLocation = async (locationData: LocationData) => {
    setLocation(locationData);
    saveLocation(locationData).catch(err => console.error('Failed to save location:', err));
  };

  const refreshWeather = async () => {
    if (!location?.coords) {
      console.log('No location coordinates available for weather refresh');
      return;
    }

    const { latitude, longitude } = location.coords;

    if (location.weather && Date.now() - location.weather.timestamp < WEATHER_CACHE_DURATION) {
      console.log('Weather data is still fresh, skipping refresh');
      return;
    }

    console.log('Refreshing weather data...');
    const weather = await fetchWeather(latitude, longitude);

    if (weather) {
      const updatedLocation = { ...location, weather };
      setLocation(updatedLocation);
      await saveLocation(updatedLocation);
    }
  };

  const clearLocation = async () => {
    setLocation(null);
    await AsyncStorage.removeItem(LOCATION_KEY);
  };


  const toggleLocationTracking = (enabled: boolean) => {
    if (enabled && hasPermissionError) {
      console.log('Cannot enable tracking - permission was denied');
      return;
    }
    setIsTrackingEnabled(enabled);
    console.log(`Location tracking ${enabled ? 'enabled' : 'disabled'}`);
  };

  const retryLocationPermission = async () => {
    console.log('Retrying location permission...');
    setHasPermissionError(false);
    setError(null);
    lastErrorTime.current = 0;
    const result = await getCurrentLocation(true);
    if (result) {
      setIsTrackingEnabled(true);
      console.log('Location permission granted and tracking enabled');
    } else {
      console.log('Location permission still denied');
    }
    return result;
  };

  return {
    location,
    isLoading,
    error,
    getCurrentLocation,
    setManualLocation,
    clearLocation,
    refreshWeather,
    hasLocation: !!location,
    hasWeather: !!location?.weather,
    isTrackingEnabled,
    toggleLocationTracking,
    hasPermissionError,
    retryLocationPermission,
  };
});

function getWeatherInfo(weatherCode: number): { condition: string; description: string; icon: string } {
  if (weatherCode === 0) return { condition: 'Clear', description: 'Clear sky', icon: '☀️' };
  if (weatherCode <= 3) return { condition: 'Partly Cloudy', description: 'Partly cloudy', icon: '⛅' };
  if (weatherCode <= 48) return { condition: 'Foggy', description: 'Fog', icon: '🌫️' };
  if (weatherCode <= 57) return { condition: 'Drizzle', description: 'Drizzle', icon: '🌧️' };
  if (weatherCode <= 67) return { condition: 'Rain', description: 'Rain', icon: '🌧️' };
  if (weatherCode <= 77) return { condition: 'Snow', description: 'Snow', icon: '❄️' };
  if (weatherCode <= 82) return { condition: 'Rain', description: 'Rain showers', icon: '🌦️' };
  if (weatherCode <= 86) return { condition: 'Snow', description: 'Snow showers', icon: '🌨️' };
  if (weatherCode <= 99) return { condition: 'Thunderstorm', description: 'Thunderstorm', icon: '⛈️' };
  return { condition: 'Unknown', description: 'Weather unknown', icon: '🌡️' };
}
