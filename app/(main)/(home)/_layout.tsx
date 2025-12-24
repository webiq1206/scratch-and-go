import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MODE_KEY = 'scratch_and_go_mode';

export default function HomeLayout() {
  const router = useRouter();

  useEffect(() => {
    const checkMode = async () => {
      const savedMode = await AsyncStorage.getItem(MODE_KEY);
      if (!savedMode) {
        router.replace('/welcome' as any);
      }
    };
    checkMode();
  }, [router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
