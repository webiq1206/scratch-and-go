import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { LocationData, WeatherData } from '@/types/activity';

const LOCATION_KEY = 'scratch_and_go_location';
const WEATHER_CACHE_DURATION = 30 * 60 * 1000;
const LOCATION_CHECK_INTERVAL = 30 * 60 * 1000;
const SIGNIFICANT_DISTANCE = 50000;

export const [LocationProvider, useLocation] = createContextHook(() => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(true);
  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

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

  const saveLocation = async (locationData: LocationData) => {
    try {
      await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(locationData));
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  };

  const fetchWeather = async (latitude: number, longitude: number): Promise<WeatherData | null> => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`
      );
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
      console.error('Weather fetch failed:', error);
      return null;
    }
  };

  const reverseGeocode = useCallback(async (latitude: number, longitude: number): Promise<LocationData | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      const data = await response.json();

      const locationData: LocationData = {
        city: data.address.city || data.address.town || data.address.village || 'Unknown City',
        region: data.address.state || data.address.region || 'Unknown Region',
        country: data.address.country || 'Unknown Country',
        coords: { latitude, longitude },
        weather: undefined,
      };

      setLocation(locationData);
      saveLocation(locationData).catch(err => console.error('Failed to save location:', err));

      setTimeout(() => {
        fetchWeather(latitude, longitude).then(weather => {
          if (weather) {
            const updatedLocation = { ...locationData, weather };
            setLocation(updatedLocation);
            saveLocation(updatedLocation).catch(err => console.error('Failed to save weather:', err));
          }
        }).catch(err => console.error('Weather fetch failed:', err));
      }, 2000);

      return locationData;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Geocoding request timed out');
      } else {
        console.error('Reverse geocoding failed:', error);
      }
      return null;
    }
  }, []);

  const getWebLocation = useCallback((): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocation is not supported by your browser';
        console.error('Geolocation not supported');
        setError(errorMsg);
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log('Web location detected successfully');
          const { latitude, longitude } = position.coords;
          const locationData = await reverseGeocode(latitude, longitude);
          setError(null);
          resolve(locationData);
        },
        (error) => {
          const errorMessages: { [key: number]: string } = {
            1: 'Location permission denied. Please enable location access in your browser settings.',
            2: 'Unable to determine your location. Please check your internet connection.',
            3: 'Location request timed out. Please try again.',
          };
          
          const errorMessage = errorMessages[error.code] || 'Failed to get your location';
          console.error('Web geolocation error:', {
            code: error.code,
            message: error.message,
            type: error.code === 1 ? 'PERMISSION_DENIED' : 
                  error.code === 2 ? 'POSITION_UNAVAILABLE' : 
                  error.code === 3 ? 'TIMEOUT' : 'UNKNOWN',
          });
          console.error('User-facing error message:', errorMessage);
          
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
        const weather = await fetchWeather(latitude, longitude);

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
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
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
  }, [getWebLocation, getNativeLocation]);

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
      if (!isTrackingEnabled) {
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
        console.error('Error checking location:', error);
      }
    };
  }, [isTrackingEnabled, location, calculateDistance, getCurrentLocation]);

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
    loadSavedLocation();
    
    const delayedSetup = setTimeout(() => {
      setupLocationTracking();
    }, 3000);
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
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
    setIsTrackingEnabled(enabled);
    console.log(`Location tracking ${enabled ? 'enabled' : 'disabled'}`);
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
  };
});

function getWeatherInfo(weatherCode: number): { condition: string; description: string; icon: string } {
  if (weatherCode === 0) return { condition: 'Clear', description: 'Clear sky', icon: '' };
  if (weatherCode <= 3) return { condition: 'Partly Cloudy', description: 'Partly cloudy', icon: '' };
  if (weatherCode <= 48) return { condition: 'Foggy', description: 'Fog', icon: '' };
  if (weatherCode <= 57) return { condition: 'Drizzle', description: 'Drizzle', icon: '' };
  if (weatherCode <= 67) return { condition: 'Rain', description: 'Rain', icon: '' };
  if (weatherCode <= 77) return { condition: 'Snow', description: 'Snow', icon: '' };
  if (weatherCode <= 82) return { condition: 'Rain', description: 'Rain showers', icon: '' };
  if (weatherCode <= 86) return { condition: 'Snow', description: 'Snow showers', icon: '' };
  if (weatherCode <= 99) return { condition: 'Thunderstorm', description: 'Thunderstorm', icon: '' };
  return { condition: 'Unknown', description: 'Weather unknown', icon: '' };
}
