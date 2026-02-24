import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import PrimaryButton from '../components/PrimaryButton';
import { Colors } from '../constants/Colors';

export default function RegisterStudentScreen() {
    const [fullName, setFullName] = useState('');
    const [regNumber, setRegNumber] = useState('');
    const [department, setDepartment] = useState('');
    const [level, setLevel] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleOpenCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Camera permission is needed to capture the student face.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 5],
            quality: 0.6,
        });

        if (result.canceled) {
            return;
        }

        const asset = result.assets[0];
        setImageUri(asset.uri);
    };

    const handleSaveStudent = async () => {
        if (!fullName.trim() || !regNumber.trim() || !department.trim() || !level.trim()) {
            Alert.alert('Missing fields', 'Please completely fill out the form.');
            return;
        }
        if (!imageUri) {
            Alert.alert('No face image', 'Please capture a clear portrait before saving.');
            return;
        }

        try {
            setIsSaving(true);
            const apiUrl = process.env.EXPO_PUBLIC_API_URL;
            if (!apiUrl) throw new Error("API URL is not configured. Please check your .env file.");

            const formData = new FormData();
            formData.append('name', fullName.trim());
            formData.append('registrationNumber', regNumber.trim());
            formData.append('department', department.trim());
            formData.append('level', level.trim());

            const filename = imageUri.split('/').pop() || 'photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            formData.append('image', { uri: imageUri, name: filename, type } as any);

            const response = await fetch(`${apiUrl}/register`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Server error occurred.');
            }

            Alert.alert('Thank you', 'Your face has been registered.');
            setFullName('');
            setRegNumber('');
            setDepartment('');
            setLevel('');
            setImageUri(null);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to save student.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.content}>
                <Text style={styles.title}>Student Registration</Text>
                <Text style={styles.subtitle}>Enter your full name and capture your face.</Text>

                <View style={styles.formSection}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.simpleInputContainer}>
                            <TextInput
                                style={styles.simpleInput}
                                placeholder="Enter your full name"
                                placeholderTextColor={Colors.textSecondary}
                                value={fullName}
                                onChangeText={setFullName}
                                autoCorrect={false}
                                autoCapitalize="words"
                                keyboardType="default"
                                returnKeyType="next"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Registration Number</Text>
                        <View style={styles.simpleInputContainer}>
                            <TextInput
                                style={styles.simpleInput}
                                placeholder="e.g. 123456"
                                placeholderTextColor={Colors.textSecondary}
                                value={regNumber}
                                onChangeText={setRegNumber}
                                autoCorrect={false}
                                autoCapitalize="none"
                                keyboardType="default"
                                returnKeyType="next"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Department</Text>
                        <View style={styles.simpleInputContainer}>
                            <TextInput
                                style={styles.simpleInput}
                                placeholder="e.g. Computer Science"
                                placeholderTextColor={Colors.textSecondary}
                                value={department}
                                onChangeText={setDepartment}
                                autoCorrect={false}
                                autoCapitalize="words"
                                keyboardType="default"
                                returnKeyType="next"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Level/Year</Text>
                        <View style={styles.simpleInputContainer}>
                            <TextInput
                                style={styles.simpleInput}
                                placeholder="e.g. 300L"
                                placeholderTextColor={Colors.textSecondary}
                                value={level}
                                onChangeText={setLevel}
                                autoCorrect={false}
                                autoCapitalize="none"
                                keyboardType="default"
                                returnKeyType="done"
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.cameraButton} onPress={handleOpenCamera}>
                        <Ionicons name="camera" size={20} color={Colors.card} style={styles.cameraIcon} />
                        <Text style={styles.cameraButtonText}>
                            {imageUri ? 'Retake Photo' : 'Open Camera'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.bottomFooter}>
                <PrimaryButton
                    title={isSaving ? 'Saving...' : 'Save Student Record'}
                    icon="checkmark-circle"
                    onPress={handleSaveStudent}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0A192F',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 24,
        textAlign: 'center',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 60,
    },
    identitySection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: Colors.card,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.card,
    },
    identityTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0A192F',
        marginBottom: 4,
    },
    identitySubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 16,
    },
    outlineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    outlineButtonIcon: {
        marginRight: 8,
    },
    outlineButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
    },
    cameraButton: {
        marginTop: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        borderRadius: 24,
        paddingVertical: 14,
    },
    cameraIcon: {
        marginRight: 8,
    },
    cameraButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.card,
    },
    simpleInputContainer: {
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.card,
        paddingHorizontal: 16,
        height: 56,
        justifyContent: 'center',
    },
    simpleInput: {
        fontSize: 16,
        color: Colors.text,
    },
    formSection: {
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 8,
        marginLeft: 4,
    },
    dropdownContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 24,
        paddingHorizontal: 16,
        height: 56,
    },
    dropdownPlaceholder: {
        fontSize: 16,
        color: Colors.text,
    },
    scanCard: {
        backgroundColor: '#EEF2FF', // Very light blue background
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#E0E7FF',
        marginBottom: 24,
    },
    scanCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    scanIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#C7D2FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    scanTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0A192F',
    },
    scanSubtitle: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
        marginBottom: 16,
    },
    captureButton: {
        flexDirection: 'row',
        backgroundColor: Colors.card,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    captureButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.primary,
    },
    privacyNotice: {
        fontSize: 12,
        color: Colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 18,
    },
    bottomFooter: {
        padding: 24,
        paddingTop: 16,
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
});
