import { Ionicons } from '@expo/vector-icons';
import { Tabs as ExpoTabs } from 'expo-router';
import React from 'react';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {
    return (
        <ExpoTabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textSecondary,
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: Colors.border,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                    backgroundColor: Colors.card,
                    elevation: 0, // Removes shadow on Android
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            <ExpoTabs.Screen
                name="index"
                options={{
                    title: 'HOME',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={24} color={color} />
                    ),
                }}
            />
            <ExpoTabs.Screen
                name="history"
                options={{
                    title: 'HISTORY',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="time" size={24} color={color} />
                    ),
                }}
            />
            <ExpoTabs.Screen
                name="classes"
                options={{
                    title: 'CLASSES',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="school" size={24} color={color} />
                    ),
                }}
            />
            <ExpoTabs.Screen
                name="profile"
                options={{
                    title: 'PROFILE',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={24} color={color} />
                    ),
                }}
            />
        </ExpoTabs>
    );
}
