import { Alert } from 'react-native';

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
}

export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = true } = options;
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxAttempts) {
        const waitTime = backoff ? delay * attempt : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

export function handleNetworkError(error: any) {
  console.error('Network error:', error);
  
  if (error.message?.includes('Network request failed')) {
    Alert.alert(
      'No Internet Connection',
      'Please check your internet connection and try again.',
      [{ text: 'OK' }]
    );
    return;
  }
  
  if (error.message?.includes('timeout')) {
    Alert.alert(
      'Request Timeout',
      'The request took too long. Please try again.',
      [{ text: 'OK' }]
    );
    return;
  }
  
  Alert.alert(
    'Connection Error',
    'Unable to connect to the server. Please try again later.',
    [{ text: 'OK' }]
  );
}

export function handleAIGenerationError(error: any) {
  console.error('AI generation error:', error);
  
  Alert.alert(
    'Generation Failed',
    'Unable to generate activity suggestion. Please try again.',
    [{ text: 'OK' }]
  );
}

export function handleLocationError(error: any) {
  console.error('Location error:', error);
  
  if (error.code === 'E_LOCATION_SERVICES_DISABLED') {
    Alert.alert(
      'Location Services Disabled',
      'Please enable location services in your device settings to get personalized activity suggestions.',
      [{ text: 'OK' }]
    );
    return;
  }
  
  if (error.code === 'E_LOCATION_UNAVAILABLE') {
    Alert.alert(
      'Location Unavailable',
      'Unable to determine your location. You can manually enter your location in settings.',
      [{ text: 'OK' }]
    );
    return;
  }
  
  Alert.alert(
    'Location Error',
    'Unable to access your location. Please check your permissions.',
    [{ text: 'OK' }]
  );
}

export function handleStorageError(error: any) {
  console.error('Storage error:', error);
  
  Alert.alert(
    'Storage Error',
    'Unable to save data. Please check your device storage and try again.',
    [{ text: 'OK' }]
  );
}
