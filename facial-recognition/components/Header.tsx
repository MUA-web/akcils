import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface HeaderProps {
    userName: string;
    date: string;
    avatarUrl?: string;
    onNotificationPress?: () => void;
}

export default function Header({ userName, date, avatarUrl, onNotificationPress }: HeaderProps) {
    return (
        <View style={styles.container}>
            <View style={styles.leftSection}>
                <View style={styles.avatarContainer}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    ) : (
                        <Ionicons name="person" size={24} color={Colors.textSecondary} />
                    )}
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.greeting}>Good Morning, {userName}</Text>
                    <Text style={styles.date}>{date}</Text>
                </View>
            </View>

            <TouchableOpacity onPress={onNotificationPress} style={styles.notificationBtn}>
                <Ionicons name="notifications" size={22} color={Colors.text} />
                <View style={styles.badge} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginRight: 12,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        flex: 1,
        paddingRight: 10,
    },
    greeting: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0A192F', // very dark blue
    },
    date: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
        marginTop: 4,
    },
    notificationBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    badge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.danger,
        borderWidth: 2,
        borderColor: Colors.card,
    },
});
