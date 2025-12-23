import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ActivityProvider } from "@/contexts/ActivityContext";
import { PreferencesProvider, usePreferences } from "@/contexts/PreferencesContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { MemoryBookProvider } from "@/contexts/MemoryBookContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { preferences, isLoading } = usePreferences();
  const segments = useSegments();
  const router = useRouter();
  const hasNavigated = React.useRef(false);

  useEffect(() => {
    console.log('[Navigation] isLoading:', isLoading, 'completedOnboarding:', preferences.completedOnboarding, 'segments:', segments);
    
    if (isLoading) return;
    if (hasNavigated.current) return;

    const handleNavigation = async () => {
      try {
        const inMain = segments[0] === '(main)';
        const inWelcome = segments[0] === 'welcome';

        console.log('[Navigation] inMain:', inMain, 'inWelcome:', inWelcome);

        if (!preferences.completedOnboarding && !inWelcome) {
          console.log('[Navigation] Navigating to welcome');
          router.replace('/welcome');
        } else if (preferences.completedOnboarding && !inMain) {
          console.log('[Navigation] Navigating to main');
          router.replace('/(main)/(home)');
        }

        hasNavigated.current = true;
        await SplashScreen.hideAsync();
        console.log('[Navigation] Splash screen hidden');
      } catch (error) {
        console.error('[Navigation] Error:', error);
        await SplashScreen.hideAsync();
      }
    };

    handleNavigation();
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
  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <LocationProvider>
          <ActivityProvider>
            <MemoryBookProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </MemoryBookProvider>
          </ActivityProvider>
        </LocationProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  );
}
