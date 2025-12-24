import React from 'react';
import { Tabs } from 'expo-router';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.primary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: Colors.backgroundDark,
          borderTopWidth: 1,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: Typography.sizes.medium,
          fontWeight: Typography.weights.semibold,
          paddingVertical: 12,
        },
        tabBarIconStyle: {
          display: 'none',
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="memory-book"
        options={{
          title: 'Memories',
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: 'Queue',
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}
