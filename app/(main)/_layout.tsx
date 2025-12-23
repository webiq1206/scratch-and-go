import React from 'react';
import { Tabs } from 'expo-router';
import { Book, Home } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.background,
          borderTopWidth: 1,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: Typography.sizes.small,
          fontWeight: Typography.weights.medium,
          marginBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="memory-book"
        options={{
          title: 'Memories',
          tabBarIcon: ({ color, size }) => <Book size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
