import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../../components/Card';
import Header from '../../components/Header';
import { Colors } from '../../constants/Colors';

export default function DashboardScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* Header Section */}
                <Header
                    userName="Mr. John"
                    date="Tuesday, October 24th"
                    avatarUrl="https://i.pravatar.cc/150?img=11"
                />

                {/* Summary Row */}
                <View style={styles.summaryRow}>
                    <Card style={styles.summaryCard}>
                        <Ionicons name="people" size={24} color={Colors.primary} />
                        <Text style={styles.summaryLabel}>TOTAL</Text>
                        <Text style={styles.summaryValue}>120</Text>
                    </Card>
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <TouchableOpacity style={styles.primaryActionCard} activeOpacity={0.9}>
                    <View style={styles.primaryActionTextContent}>
                        <Text style={styles.primaryActionTitle}>Start Attendance</Text>
                        <Text style={styles.primaryActionSubtitle}>Open AI Face Recognition</Text>
                    </View>
                    <View style={styles.primaryActionIconBox}>
                        <Ionicons name="scan-outline" size={32} color={Colors.card} />
                    </View>
                </TouchableOpacity>

                <View style={styles.secondaryActionsRow}>
                    <TouchableOpacity style={styles.secondaryActionCard} activeOpacity={0.8}>
                        <View style={[styles.secondaryActionIconBox, { backgroundColor: '#FFF7ED' }]}>
                            <Ionicons name="bar-chart" size={24} color="#EA580C" />
                        </View>
                        <Text style={styles.secondaryActionTitle}>Reports</Text>
                        <Text style={styles.secondaryActionSubtitle}>View statistics</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent History */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent History</Text>
                    <TouchableOpacity>
                        <Text style={styles.viewAllText}>VIEW ALL</Text>
                    </TouchableOpacity>
                </View>

                <Card style={styles.historyCard}>
                    <View style={styles.historyIconBox}>
                        <Ionicons name="time-outline" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.historyTextContent}>
                        <Text style={styles.historyTitle}>Class 10-B Attendance</Text>
                        <Text style={styles.historySubtitle}>Today, 09:15 AM • 28/30 present</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </Card>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        padding: 24,
        paddingTop: 40,
        paddingBottom: 40,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        borderRadius: 24,
    },
    iconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginTop: 12,
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0A192F',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0A192F',
        marginBottom: 16,
    },
    primaryActionCard: {
        backgroundColor: Colors.primary, // Dark blue from the design
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    primaryActionTextContent: {
        flex: 1,
    },
    primaryActionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.card,
        marginBottom: 4,
    },
    primaryActionSubtitle: {
        fontSize: 14,
        color: Colors.card,
        opacity: 0.8,
    },
    primaryActionIconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryActionsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    secondaryActionCard: {
        flex: 1,
        backgroundColor: Colors.card,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.textSecondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    secondaryActionIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    secondaryActionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0A192F',
        marginBottom: 4,
    },
    secondaryActionSubtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    viewAllText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primary,
        letterSpacing: 0.5,
    },
    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    historyIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    historyTextContent: {
        flex: 1,
    },
    historyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0A192F',
        marginBottom: 4,
    },
    historySubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
});
