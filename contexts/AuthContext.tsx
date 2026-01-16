import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { AUTH_USER_KEY } from '@/constants/storageKeys';

// Safely call maybeCompleteAuthSession
try {
  WebBrowser.maybeCompleteAuthSession();
} catch (error) {
  console.warn('[Auth] Failed to complete auth session:', error);
}

export type AuthProvider = 'google' | 'facebook' | 'none';

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  provider: AuthProvider;
  accessToken?: string;
}

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const facebookDiscovery = {
  authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
};

export const [AuthContext, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'rork-app',
    path: 'auth',
  });

  // Clear auth error after 5 seconds
  useEffect(() => {
    if (authError) {
      const timer = setTimeout(() => setAuthError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [authError]);

  const clearError = useCallback(() => setAuthError(null), []);

  const [, googleResponse, googlePromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: Platform.select({
        ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
        android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
        web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
        default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
      }),
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
    },
    discovery
  );

  const [, facebookResponse, facebookPromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '',
      scopes: ['public_profile', 'email', 'user_photos', 'publish_to_groups', 'instagram_basic', 'instagram_content_publish'],
      redirectUri,
      extraParams: {
        display: Platform.select({ web: 'popup', default: 'touch' }),
      },
    },
    facebookDiscovery
  );

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleSuccess(googleResponse);
    }
  }, [googleResponse]);

  useEffect(() => {
    if (facebookResponse?.type === 'success') {
      handleFacebookSuccess(facebookResponse);
    }
  }, [facebookResponse]);

  const loadUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && typeof parsed === 'object' && parsed.id) {
            setUser(parsed);
          } else {
            console.error('Invalid user data structure, clearing');
            await AsyncStorage.removeItem(AUTH_USER_KEY);
          }
        } catch (parseError) {
          console.error('Corrupted user data, clearing:', parseError);
          await AsyncStorage.removeItem(AUTH_USER_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: AuthSession.AuthSessionResult) => {
    try {
      if (response.type !== 'success') return;

      const { authentication } = response as { type: 'success'; authentication: AuthSession.TokenResponse | null };
      const accessToken = authentication?.accessToken;

      if (!accessToken) {
        setAuthError('Failed to authenticate with Google. Please try again.');
        console.error('No access token received');
        return;
      }

      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!userInfoResponse.ok) {
        setAuthError('Failed to get user info from Google. Please try again.');
        return;
      }

      const userInfo = await userInfoResponse.json();

      const newUser: User = {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        photoUrl: userInfo.picture,
        provider: 'google',
        accessToken,
      };

      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
      setUser(newUser);
      setAuthError(null);
    } catch (error) {
      console.error('Error handling Google login:', error);
      setAuthError('An error occurred during Google login. Please try again.');
    }
  };

  const handleFacebookSuccess = async (response: AuthSession.AuthSessionResult) => {
    try {
      if (response.type !== 'success') return;

      const { authentication } = response as { type: 'success'; authentication: AuthSession.TokenResponse | null };
      const accessToken = authentication?.accessToken;

      if (!accessToken) {
        setAuthError('Failed to authenticate with Facebook. Please try again.');
        console.error('No access token received');
        return;
      }

      const userInfoResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`
      );

      if (!userInfoResponse.ok) {
        setAuthError('Failed to get user info from Facebook. Please try again.');
        return;
      }

      const userInfo = await userInfoResponse.json();

      const newUser: User = {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email || '',
        photoUrl: userInfo.picture?.data?.url,
        provider: 'facebook',
        accessToken,
      };

      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
      setUser(newUser);
      setAuthError(null);
    } catch (error) {
      console.error('Error handling Facebook login:', error);
      setAuthError('An error occurred during Facebook login. Please try again.');
    }
  };

  const loginWithGoogle = async () => {
    try {
      setAuthError(null);
      await googlePromptAsync();
    } catch (error) {
      console.error('Error during Google login:', error);
      setAuthError('Failed to start Google login. Please try again.');
    }
  };

  const loginWithFacebook = async () => {
    try {
      setAuthError(null);
      await facebookPromptAsync();
    } catch (error) {
      console.error('Error during Facebook login:', error);
      setAuthError('Failed to start Facebook login. Please try again.');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_USER_KEY);
      setUser(null);
      setAuthError(null);
    } catch (error) {
      console.error('Error logging out:', error);
      setAuthError('Failed to log out. Please try again.');
    }
  };

  return {
    user,
    isLoading,
    authError,
    clearError,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    isAuthenticated: !!user,
  };
});
