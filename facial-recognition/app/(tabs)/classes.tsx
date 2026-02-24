import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View, Dimensions, Image } from 'react-native';
import { CameraView, useCameraPermissions, CameraType, FlashMode } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');
const FRAME_SIZE = width * 0.65;

export default function AttendanceCameraScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraType>('front');
    const [flash, setFlash] = useState<FlashMode>('off');

    const [isLoading, setIsLoading] = useState(false);
    const [successMatch, setSuccessMatch] = useState<any>(null);

    const cameraRef = useRef<CameraView>(null);

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>We need your permission to show the camera</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    const toggleFlash = () => {
        setFlash(current => (current === 'off' ? 'on' : 'off'));
    };

    const handleScanFace = async () => {
        if (!cameraRef.current || isLoading) return;

        try {
            setIsLoading(true);
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.6,
                base64: false,
            });

            if (!photo || !photo.uri) throw new Error('Failed to take picture.');

            const apiUrl = process.env.EXPO_PUBLIC_API_URL;
            if (!apiUrl) throw new Error("API URL is not configured. Please check your .env file.");

            const formData = new FormData();
            const filename = photo.uri.split('/').pop() || 'photo.jpg';
            const matchFormat = /\.(\w+)$/.exec(filename);
            const type = matchFormat ? `image/${matchFormat[1]}` : `image`;

            formData.append('image', { uri: photo.uri, name: filename, type } as any);

            const response = await fetch(`${apiUrl}/recognize`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Server error occurred during recognition.');
            }

            const data = await response.json();
            const recognizedFaces = data.recognized;

            if (!recognizedFaces || recognizedFaces.length === 0) {
                throw new Error('No face detected or matched in the frame.');
            }

            const bestMatch = recognizedFaces[0];
            if (bestMatch.label === 'unknown') {
                Alert.alert('Not recognized', 'Student not found or confidence too low. Please try again.');
                return;
            }

            // Fetch matched student details from Supabase using their name
            const { data: matchedStudent, error: fetchError } = await supabase
                .from('faces')
                .select('*')
                .eq('name', bestMatch.label)
                .single();

            if (fetchError || !matchedStudent) {
                // If the user was registered via the backend, they will be in the faces table!
                throw new Error('Matched student details not found in database.');
            }

            // Show Success Modal
            setSuccessMatch({
                name: matchedStudent.name,
                regNumber: matchedStudent.registration_number || `SF-UNKNOWN`,
                level: matchedStudent.level || 'Unknown Level',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

        } catch (err: any) {
            Alert.alert('Scan Failed', err.message || 'An error occurred while scanning.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                facing={facing}
                flash={flash}
            />

            {/* Dark Overlay Wrapper (Simulating transparency hole) */}
            <View style={styles.overlayContainer}>
                {/* Top Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </TouchableOpacity>

                    <View style={styles.headerTitles}>
                        <Text style={styles.headerSubtitle}>SMARTFACE AI</Text>
                        <Text style={styles.headerTitle}>Attendance Camera</Text>
                    </View>

                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="settings-sharp" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Instruction Badge */}
                <View style={styles.instructionBadge}>
                    <View style={styles.instructionDot} />
                    <Text style={styles.instructionText}>Align face inside the frame</Text>
                </View>

                {/* Frame Container */}
                <View style={styles.frameWrapper}>
                    {/* 4 Corners */}
                    <View style={[styles.corner, styles.topLeftCorner]} />
                    <View style={[styles.corner, styles.topRightCorner]} />
                    <View style={[styles.corner, styles.bottomLeftCorner]} />
                    <View style={[styles.corner, styles.bottomRightCorner]} />

                    {/* Scanning Indicator inside frame (Optional) */}
                    {isLoading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#4ADE80" />
                            <Text style={styles.loadingText}>Analyzing Face...</Text>
                        </View>
                    )}
                </View>

                {/* Right Side Buttons */}
                <View style={styles.rightControls}>
                    <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
                        <Ionicons name="camera-reverse" size={22} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconButton, { marginTop: 16 }]} onPress={toggleFlash}>
                        <Ionicons name={flash === 'on' ? "flash" : "flash-off"} size={22} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Bottom Capture Button (Fallback for manual trigger) */}
                {!successMatch && !isLoading && (
                    <TouchableOpacity style={styles.captureButtonWrapper} onPress={handleScanFace}>
                        <View style={styles.captureButton}>
                            <Ionicons name="scan-outline" size={28} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                )}
            </View>

            {/* Bottom Modal Result */}
            {successMatch && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>

                        {/* Success Banner */}
                        <View style={styles.successBanner}>
                            <View style={styles.successIconCircle}>
                                <Ionicons name="checkmark" size={16} color="#FFF" />
                            </View>
                            <Text style={styles.successBannerText}>Attendance Marked Successfully</Text>
                        </View>

                        {/* User Info Row */}
                        <View style={styles.userInfoRow}>
                            <View style={styles.avatarWrapper}>
                                <Image
                                    source={{ uri: 'https://i.pravatar.cc/150?img=11' }}
                                    style={styles.avatar}
                                />
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark-circle" size={16} color="#2563EB" />
                                </View>
                            </View>

                            <View style={styles.userDetails}>
                                <Text style={styles.userName}>{successMatch.name}</Text>
                                <Text style={styles.userId}>Student ID: #{successMatch.regNumber}</Text>
                                <View style={styles.tagsRow}>
                                    <View style={styles.tag}>
                                        <Text style={styles.tagText}>{successMatch.level}</Text>
                                    </View>
                                    <View style={[styles.tag, { backgroundColor: '#F1F5F9' }]}>
                                        <Text style={[styles.tagText, { color: '#64748B' }]}>{successMatch.time}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Actions */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.doneButton} onPress={() => setSuccessMatch(null)}>
                                <Text style={styles.doneButtonText}>Done</Text>
                                <Ionicons name="chevron-forward" size={16} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.refreshButton} onPress={() => setSuccessMatch(null)}>
                                <Ionicons name="refresh" size={24} color="#0F172A" />
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: 24,
    },
    permissionText: {
        color: '#FFF',
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    permissionButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    permissionButtonText: {
        color: '#FFF',
        fontWeight: '700',
    },
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)', // Dark tint over the camera
        paddingTop: 50,
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitles: {
        alignItems: 'center',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 2,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    instructionBadge: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    instructionDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4ADE80',
        marginRight: 8,
    },
    instructionText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '500',
    },
    frameWrapper: {
        position: 'absolute',
        top: height * 0.35,
        left: (width - FRAME_SIZE) / 2,
        width: FRAME_SIZE,
        height: FRAME_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#4ADE80', // bright green
    },
    topLeftCorner: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 24,
    },
    topRightCorner: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 24,
    },
    bottomLeftCorner: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 24,
    },
    bottomRightCorner: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 24,
    },
    loadingOverlay: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 20,
        borderRadius: 16,
    },
    loadingText: {
        color: '#FFF',
        marginTop: 12,
        fontWeight: '600',
    },
    rightControls: {
        position: 'absolute',
        right: 24,
        top: height * 0.45,
    },
    captureButtonWrapper: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    captureButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    modalOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 32,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7', // light green
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        marginBottom: 24,
    },
    successIconCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#22C55E',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    successBannerText: {
        color: '#166534',
        fontWeight: '700',
        fontSize: 14,
    },
    userInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarWrapper: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#F1F5F9',
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 2,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    userId: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 8,
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    tag: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    doneButton: {
        flex: 1,
        backgroundColor: '#1E3A8A', // Dark blue
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        paddingVertical: 16,
        gap: 8,
    },
    doneButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    refreshButton: {
        width: 56,
        height: 56,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
