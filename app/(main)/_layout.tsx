import React from 'react';
import { Tabs } from 'expo-router';
import { Home, BookHeart, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

export default function MainLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: Colors.backgroundDark,
          borderTopWidth: 1,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500' as const,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="memory-book"
        options={{
          title: 'Memories',
          tabBarIcon: ({ color, size }) => (
            <BookHeart size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="year-recap"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
