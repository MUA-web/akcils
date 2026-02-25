import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
    Image,
    StatusBar,
    Modal,
    Pressable,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function Dashboard() {
    const router = useRouter();
    const [role, setRole] = useState<'admin' | 'student'>('student');
    const [userName, setUserName] = useState('');
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [stats, setStats] = useState({
        registered: 0,
        present: 0,
        late: 0,
        absent: 0,
        attendanceRate: 0,
        personalRate: 0,
    });
    const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                const user = session.user;
                const userRole = user.user_metadata?.role || 'student';
                setRole(userRole);
                setUserName(user.user_metadata?.full_name || 'User');
                setUserProfile(user.user_metadata);
                // Trigger dashboard data fetch without awaiting all of it for the main UI to show up
                fetchDashboardData(userRole, user.user_metadata);
            } else {
                setRole('admin');
                setUserName('Admin Setup');
                fetchDashboardData('admin', null);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            // Set loading to false as soon as user profile (role/name) is determined
            setIsLoading(false);
        }
    };

    const fetchDashboardData = async (userRole: 'admin' | 'student', profile: any) => {
        try {
            if (userRole === 'admin') {
                // Parallelize fetching registered count and attendance stats
                const [regResult, attResponse] = await Promise.all([
                    supabase.from('faces').select('*', { count: 'exact', head: true }),
                    fetch(`${API_URL}/attendance`).then(res => res.json()).catch(err => {
                        console.error('Error fetching attendance stats:', err);
                        return { count: 0, records: [] };
                    })
                ]);

                const regCount = regResult.count || 0;
                const presentCount = attResponse.count || 0;

                setStats(prev => ({
                    ...prev,
                    registered: regCount,
                    present: presentCount,
                    absent: Math.max(0, regCount - presentCount),
                    attendanceRate: regCount ? Math.round((presentCount / regCount) * 100) : 0
                }));
                setRecentAttendance((attResponse.records || []).slice(0, 5));
            } else {
                // Student stats
                const regNo = profile?.reg_no;
                const deptName = profile?.department;
                const levelLabel = profile?.level;

                if (regNo) {
                    try {
                        // 1. Fetch all attendance records for student
                        // 2. Fetch all courses for student's dept/level to get total sessions
                        const [attResponse, coursesResult] = await Promise.all([
                            fetch(`${API_URL}/attendance/student/${encodeURIComponent(regNo)}`).then(res => res.json()),
                            supabase
                                .from('courses')
                                .select('total_sessions, departments(name), levels(label)')
                                .eq('departments.name', deptName)
                                .eq('levels.label', levelLabel)
                        ]);

                        const attended = attResponse.count || 0;

                        // Filter courses manually since Supabase filter on join might be tricky depending on schema
                        // But we already joined, so let's just sum up
                        // If schema allows, we should fetch by foreign keys if we had them in profile, 
                        // but profile uses text names currently.

                        // Fallback: Fetch courses by joining or filtering
                        const { data: allCourses } = await supabase
                            .from('courses')
                            .select('*, departments!inner(name), levels!inner(label)')
                            .eq('departments.name', deptName)
                            .eq('levels.label', levelLabel);

                        const totalSessionsSum = (allCourses || []).reduce((sum, c) => sum + (c.total_sessions || 40), 0) || 40;

                        setStats(prev => ({
                            ...prev,
                            personalRate: Math.round((attended / totalSessionsSum) * 100)
                        }));
                    } catch (e) {
                        console.error('Error fetching student attendance:', e);
                    }
                }
            }
        } catch (error) {
            console.error('Error in fetchDashboardData:', error);
        }
    };

    const toggleRole = () => setRole(prev => prev === 'admin' ? 'student' : 'admin');
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const menuItems = [
        { id: '1', title: 'Attendance Log', icon: 'list-outline', route: '/(admin)/attendance-log' },
        { id: '2', title: 'Student Management', icon: 'people-outline', route: '/(admin)/students' },
        { id: '3', title: 'Department Settings', icon: 'business-outline', route: '/(admin)/departments' },
        { id: '4', title: 'Course Creation', icon: 'book-outline', route: '/(admin)/courses' },
        { id: '5', title: 'Level Configuration', icon: 'layers-outline', route: '/(admin)/levels' },
        { id: '6', title: 'Admin Settings', icon: 'settings-outline', route: '/(admin)/settings' },
    ];

    const renderMenu = () => (
        <Modal
            visible={isMenuOpen}
            transparent={true}
            animationType="fade"
            onRequestClose={toggleMenu}
        >
            <Pressable style={styles.menuOverlay} onPress={toggleMenu}>
                <View style={styles.menuDrawer}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={styles.menuHeader}>
                            <Image
                                source={{ uri: 'https://i.pravatar.cc/150?img=12' }}
                                style={styles.menuAvatar}
                            />
                            <View>
                                <Text style={styles.menuAdminName}>{userName}</Text>
                                <Text style={styles.menuAdminRole}>{role === 'admin' ? 'System Administrator' : 'Student Account'}</Text>
                            </View>
                            <TouchableOpacity onPress={toggleMenu} style={styles.closeMenuBtn}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.menuDivider} />

                        <ScrollView style={styles.menuItemsList}>
                            {menuItems.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.menuItem}
                                    onPress={() => {
                                        toggleMenu();
                                        router.push(item.route as any);
                                    }}
                                >
                                    <View style={styles.menuItemIconBox}>
                                        <Ionicons name={item.icon as any} size={22} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.menuItemText}>{item.title}</Text>
                                    <Ionicons name="chevron-forward" size={16} color={Colors.inactive} />
                                </TouchableOpacity>
                            ))}

                            <View style={[styles.menuDivider, { marginHorizontal: 0, marginVertical: 12 }]} />

                            <TouchableOpacity onPress={() => { toggleMenu(); toggleRole(); }} style={styles.menuItem}>
                                <View style={[styles.menuItemIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.08)' }]}>
                                    <Ionicons name="swap-horizontal-outline" size={22} color="#0891B2" />
                                </View>
                                <Text style={styles.menuItemText}>Switch to {role === 'admin' ? 'Student' : 'Admin'} Mode</Text>
                            </TouchableOpacity>
                        </ScrollView>

                        <View style={styles.menuFooter}>
                            <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await supabase.auth.signOut(); router.replace('/(auth)/login'); }}>
                                <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
                                <Text style={styles.logoutText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>
            </Pressable>
        </Modal>
    );

    const renderHeader = () => (
        <LinearGradient
            colors={role === 'admin' ? ['#4F46E5', '#7C3AED', '#C026D3'] : ['#06B6D4', '#3B82F6', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
        >
            <SafeAreaView edges={['top']}>
                <View style={styles.headerTopNav}>
                    <View style={styles.headerLeft}>
                        {role === 'student' && (
                            <TouchableOpacity style={styles.avatarMainBox}>
                                <Image
                                    source={{ uri: 'https://i.pravatar.cc/150?img=33' }}
                                    style={styles.avatarMain}
                                />
                            </TouchableOpacity>
                        )}
                        <View>
                            <View style={styles.badgeRow}>
                                <View style={styles.activeIndicator} />
                                <Text style={styles.onlineText}>{role.toUpperCase()} MODE</Text>
                            </View>
                            <Text style={styles.headerTitle}>
                                {role === 'admin' ? `Welcome back, ${userName.split(' ')[0]}` : `Hello, ${userName.split(' ')[0]}`}
                            </Text>
                        </View>
                    </View>
                    {role === 'admin' && (
                        <TouchableOpacity onPress={toggleMenu} style={styles.menuToggleBtnRight}>
                            <Ionicons name="menu-outline" size={32} color="#FFF" />
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        </LinearGradient>
    );

    const renderAdminView = () => (
        <>
            <View style={styles.horizontalStatsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalStatsPadding}>
                    <Card style={styles.horizontalCard}>
                        <View style={styles.cardHeaderRow}>
                            <View style={[styles.trendDot, { backgroundColor: '#EEF2FF' }]}>
                                <Ionicons name="people-outline" size={14} color={Colors.primary} />
                            </View>
                            <Ionicons name="ellipsis-horizontal" size={16} color={Colors.inactive} />
                        </View>
                        <Text style={styles.cardMainVal}>{stats.registered}</Text>
                        <Text style={styles.cardSubtext}>Total Registered</Text>
                    </Card>

                    <Card style={styles.horizontalCard}>
                        <View style={styles.cardHeaderRow}>
                            <View style={[styles.trendDot, { backgroundColor: Colors.successSurface }]}>
                                <Ionicons name="checkmark-circle-outline" size={14} color={Colors.success} />
                            </View>
                            <Ionicons name="trending-up" size={16} color={Colors.success} />
                        </View>
                        <Text style={styles.cardMainVal}>{stats.present}</Text>
                        <Text style={styles.cardSubtext}>Today's Present</Text>
                    </Card>

                    <Card style={styles.horizontalCard}>
                        <View style={styles.cardHeaderRow}>
                            <View style={[styles.trendDot, { backgroundColor: Colors.dangerSurface }]}>
                                <Ionicons name="close-circle-outline" size={14} color={Colors.danger} />
                            </View>
                            <Ionicons name="trending-down" size={16} color={Colors.danger} />
                        </View>
                        <Text style={styles.cardMainVal}>{stats.absent}</Text>
                        <Text style={styles.cardSubtext}>Today's Absent</Text>
                    </Card>
                </ScrollView>
            </View>

            <View style={styles.sectionBody}>
                <View style={styles.overviewHeader}>
                    <Text style={styles.sectionTitle}>Attendance Management</Text>
                </View>

                <Card style={styles.actionCard}>
                    <View style={styles.actionLeft}>
                        <LinearGradient colors={['#F5F3FF', '#EDE9FE']} style={styles.actionIconBox}>
                            <Ionicons name="camera-outline" size={24} color={Colors.primary} />
                        </LinearGradient>
                        <View>
                            <Text style={styles.actionTitle}>Mark Attendance</Text>
                            <Text style={styles.actionSubtitle}>Open face recognition scanner</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.primaryActionBtn}
                        onPress={() => router.push('/(tabs)/classes' as any)}
                    >
                        <Ionicons name="scan-outline" size={20} color="#FFF" />
                    </TouchableOpacity>
                </Card>

                <View style={styles.overviewHeader}>
                    <Text style={styles.sectionTitle}>Recent Attendance</Text>
                    <TouchableOpacity onPress={() => router.push('/(admin)/attendance-log' as any)}>
                        <Text style={{ color: Colors.primary, fontWeight: '600' }}>View All</Text>
                    </TouchableOpacity>
                </View>

                {recentAttendance.length > 0 ? (
                    recentAttendance.map((item, index) => (
                        <Card key={index} style={[styles.recentActivityCard, { marginBottom: 12 }]}>
                            <View style={styles.activityRow}>
                                <View style={[styles.activityAvatar, { backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Ionicons name="person" size={24} color={Colors.primary} />
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityName}>{item.name}</Text>
                                    <Text style={styles.activityTime}>{item.department} • {item.level}</Text>
                                </View>
                                <View style={styles.timeBadge}>
                                    <Text style={styles.timeBadgeText}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                </View>
                            </View>
                        </Card>
                    ))
                ) : (
                    <Card style={styles.recentActivityCard}>
                        <View style={styles.activityRow}>
                            <View style={[styles.activityAvatar, { backgroundColor: Colors.inactive + '20', justifyContent: 'center', alignItems: 'center' }]}>
                                <Ionicons name="calendar-outline" size={24} color={Colors.inactive} />
                            </View>
                            <View style={styles.activityInfo}>
                                <Text style={styles.activityName}>No Attendance Today</Text>
                                <Text style={styles.activityTime}>Mark attendance to see records here</Text>
                            </View>
                        </View>
                    </Card>
                )}
            </View>
        </>
    );

    const renderStudentView = () => (
        <View style={styles.sectionBody}>
            <View style={styles.overviewHeader}>
                <Text style={styles.sectionTitle}>Academic Policy</Text>
                <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            </View>

            <Card style={[styles.policyCard, { borderLeftWidth: 4, borderLeftColor: Colors.warning }]}>
                <View style={styles.activityRow}>
                    <View style={styles.policyIconBox}>
                        <Ionicons name="school" size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.activityInfo}>
                        <Text style={styles.activityName}>Attendance Requirement</Text>
                        <Text style={styles.activityTime}>Mandatory for Exam Eligibility</Text>
                    </View>
                    <View style={styles.policyBadge}>
                        <Ionicons name="alert-circle" size={14} color={Colors.warning} />
                        <Text style={styles.policyBadgeText}>75% MINIMUM</Text>
                    </View>
                </View>
                <View style={styles.policyMessage}>
                    <Text style={styles.policyMessageText}>
                        "You must maintain at least 75% total attendance to be eligible to sit for semester examinations."
                    </Text>
                </View>
            </Card>

            <View style={styles.overviewHeader}>
                <Text style={styles.sectionTitle}>Enrollment</Text>
            </View>

            <Card style={styles.actionCard}>
                <View style={styles.actionLeft}>
                    <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={styles.actionIconBox}>
                        <Ionicons name="person-add-outline" size={24} color={Colors.success} />
                    </LinearGradient>
                    <View>
                        <Text style={styles.actionTitle}>Enroll My Face</Text>
                        <Text style={styles.actionSubtitle}>Register your biometric blueprint</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: Colors.success }]}
                    onPress={() => router.push('/(tabs)/register' as any)}
                >
                    <Ionicons name="chevron-forward" size={20} color="#FFF" />
                </TouchableOpacity>
            </Card>

            <View style={styles.overviewHeader}>
                <Text style={styles.sectionTitle}>Semester Progress</Text>
            </View>

            <Card style={styles.progressCard}>
                <View style={styles.progressTextRow}>
                    <Text style={styles.progressLabel}>My Progress toward Exam</Text>
                    <Text style={styles.progressPercent}>{stats.personalRate}%</Text>
                </View>
                <View style={styles.progBarOuter}>
                    <LinearGradient
                        colors={['#06B6D4', '#3B82F6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progBarInner, { width: `${stats.personalRate}%` }]}
                    />
                </View>
                <View style={styles.progressInfoRow}>
                    <Ionicons name="sparkles" size={14} color={Colors.warning} />
                    <Text style={styles.progressTip}>You're eligible for exams! Keep it up.</Text>
                </View>
            </Card>
        </View>
    );

    return (
        <View style={styles.baseContainer}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
                {renderHeader()}
                {isLoading ? (
                    <View style={{ padding: 40 }}>
                        <ActivityIndicator color={Colors.primary} size="large" />
                    </View>
                ) : (
                    role === 'admin' ? renderAdminView() : renderStudentView()
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
            {renderMenu()}
        </View>
    );
}

const styles = StyleSheet.create({
    baseContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    headerGradient: {
        paddingBottom: 60,
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
    },
    headerTopNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuToggleBtnRight: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarMainBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        marginRight: 12,
    },
    avatarMain: {
        width: '100%',
        height: '100%',
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    activeIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4ADE80',
    },
    onlineText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    horizontalStatsWrapper: {
        marginTop: -40,
        zIndex: 10,
    },
    horizontalStatsPadding: {
        paddingHorizontal: 24,
        gap: 16,
        paddingBottom: 20,
    },
    horizontalCard: {
        width: 160,
        padding: 20,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    trendDot: {
        width: 32,
        height: 32,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardMainVal: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.text,
    },
    cardSubtext: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
        marginTop: 2,
    },
    sectionBody: {
        paddingHorizontal: 24,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
    },
    overviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 24,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    actionIconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
    },
    actionSubtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    primaryActionBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recentActivityCard: {
        padding: 16,
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    activityAvatar: {
        width: 48,
        height: 48,
        borderRadius: 14,
        marginRight: 12,
    },
    activityInfo: {
        flex: 1,
    },
    activityName: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.text,
    },
    activityTime: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    progressCard: {
        padding: 24,
    },
    progressTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    progressPercent: {
        fontSize: 18,
        fontWeight: '900',
        color: Colors.primary,
    },
    policyCard: {
        padding: 20,
        marginBottom: 12,
    },
    policyIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    policyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    policyBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#F59E0B',
    },
    policyMessage: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    policyMessageText: {
        fontSize: 13,
        color: Colors.text,
        fontWeight: '600',
        lineHeight: 18,
        fontStyle: 'italic',
    },
    progBarOuter: {
        height: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progBarInner: {
        height: '100%',
        borderRadius: 4,
    },
    progressInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 8,
    },
    progressTip: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    menuDrawer: {
        width: width * 0.75,
        height: height,
        backgroundColor: '#FFF',
        borderTopRightRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    menuHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        paddingTop: 40,
    },
    menuAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    menuAdminName: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
    },
    menuAdminRole: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    closeMenuBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 4,
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 24,
    },
    menuItemsList: {
        padding: 24,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    menuItemIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(79, 70, 229, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuItemText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    menuFooter: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.danger,
    },
    timeBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    timeBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
});
