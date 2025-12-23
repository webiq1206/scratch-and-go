import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';

WebBrowser.maybeCompleteAuthSession();

export type AuthProvider = 'google' | 'facebook' | 'none';

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  provider: AuthProvider;
  accessToken?: string;
}

const AUTH_USER_KEY = 'scratch_and_go_user';

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

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'rork-app',
    path: 'auth',
  });

  console.log('Auth redirect URI:', redirectUri);

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
        setUser(JSON.parse(savedUser));
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
        console.error('No access token received');
        return;
      }

      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const userInfo = await userInfoResponse.json();
      console.log('Google user info:', userInfo);

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
    } catch (error) {
      console.error('Error handling Google login:', error);
    }
  };

  const handleFacebookSuccess = async (response: AuthSession.AuthSessionResult) => {
    try {
      if (response.type !== 'success') return;

      const { authentication } = response as { type: 'success'; authentication: AuthSession.TokenResponse | null };
      const accessToken = authentication?.accessToken;

      if (!accessToken) {
        console.error('No access token received');
        return;
      }

      const userInfoResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`
      );

      const userInfo = await userInfoResponse.json();
      console.log('Facebook user info:', userInfo);

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
    } catch (error) {
      console.error('Error handling Facebook login:', error);
    }
  };

  const loginWithGoogle = async () => {
    try {
      console.log('Attempting Google login...');
      await googlePromptAsync();
    } catch (error) {
      console.error('Error during Google login:', error);
    }
  };

  const loginWithFacebook = async () => {
    try {
      console.log('Attempting Facebook login...');
      await facebookPromptAsync();
    } catch (error) {
      console.error('Error during Facebook login:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_USER_KEY);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return {
    user,
    isLoading,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    isAuthenticated: !!user,
  };
});
