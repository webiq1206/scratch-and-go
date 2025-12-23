import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ActivityProvider } from "@/contexts/ActivityContext";
import { PreferencesProvider, usePreferences } from "@/contexts/PreferencesContext";
import { LocationProvider } from "@/contexts/LocationContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { preferences, isLoading } = usePreferences();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inMain = segments[0] === '(main)';
    const inWelcome = segments[0] === 'welcome';

    if (!preferences.completedOnboarding && !inWelcome) {
      router.replace('/welcome');
    } else if (preferences.completedOnboarding && !inMain) {
      router.replace('/(main)/(home)');
    }
  }, [isLoading, preferences.completedOnboarding, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(main)" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <LocationProvider>
          <ActivityProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </ActivityProvider>
        </LocationProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  );
}
