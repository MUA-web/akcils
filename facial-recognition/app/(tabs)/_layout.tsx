import { Ionicons } from '@expo/vector-icons';
import { Tabs as ExpoTabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {
    return (
        <ExpoTabs
            initialRouteName="index"
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textSecondary,
                tabBarStyle: {
                    display: 'none',
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '700',
                    marginTop: 4,
                },
            }}
        >
            <ExpoTabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="grid" size={24} color={color} />
                    ),
                }}
            />

            <ExpoTabs.Screen
                name="history"
                options={{
                    href: null,
                    title: 'History',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="time" size={24} color={color} />
                    ),
                }}
            />

            {/* Center Tab for Enrollment */}
            <ExpoTabs.Screen
                name="register"
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        navigation.navigate('register');
                    },
                })}
                options={{
                    tabBarLabel: () => null,
                    tabBarIcon: () => (
                        <View style={styles.fabContainer}>
                            <LinearGradient
                                colors={[Colors.primary, Colors.secondary]}
                                style={styles.fab}
                            >
                                <Ionicons name="add" size={32} color="#FFF" />
                            </LinearGradient>
                        </View>
                    ),
                }}
            />

            <ExpoTabs.Screen
                name="classes"
                options={{
                    href: null,
                    title: 'Attendance',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="camera" size={24} color={color} />
                    ),
                }}
            />
            <ExpoTabs.Screen
                name="profile"
                options={{
                    title: 'Account',
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="person" size={24} color={color} />
                    ),
                }}
            />
        </ExpoTabs>
    );
}

const styles = StyleSheet.create({
    fabContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        top: -12, // Float out of tab bar
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
