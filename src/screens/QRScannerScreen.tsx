import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { joinGroup } from '../services/group';
import ScreenWrapper from '../components/ScreenWrapper';
import Header from '../components/Header';
import { theme } from '../services/theme';

const QRScannerScreen = ({ navigation }: any) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <ScreenWrapper>
                <Header title="Scan QR Code" showBack />
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={64} color={theme.colors.primary.main} />
                    <Text style={styles.permissionText}>
                        We need your permission to show the camera
                    </Text>
                    <TouchableOpacity
                        onPress={requestPermission}
                        style={styles.permissionButton}
                    >
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    const handleBarCodeScanned = async ({ type, data }: any) => {
        if (scanned) return;
        setScanned(true);

        try {
            const parsedData = JSON.parse(data);
            if (parsedData.type === 'join_group' && parsedData.groupId) {
                Alert.alert(
                    'Join Group',
                    `Do you want to join "${parsedData.groupName || 'this group'}"?`,
                    [
                        {
                            text: 'Cancel',
                            onPress: () => setScanned(false),
                            style: 'cancel',
                        },
                        {
                            text: 'Join',
                            onPress: async () => {
                                try {
                                    await joinGroup(parsedData.groupId);
                                    Alert.alert('Success', 'You have joined the group!');
                                    navigation.replace('GroupDetails', {
                                        groupId: parsedData.groupId,
                                        groupName: parsedData.groupName,
                                    });
                                } catch (error: any) {
                                    Alert.alert('Error', error.message);
                                    setScanned(false);
                                }
                            },
                        },
                    ]
                );
            } else {
                Alert.alert('Invalid QR Code', 'This QR code is not a valid group invite.', [
                    { text: 'OK', onPress: () => setScanned(false) },
                ]);
            }
        } catch (error) {
            Alert.alert('Invalid QR Code', 'Could not parse QR code data.', [
                { text: 'OK', onPress: () => setScanned(false) },
            ]);
        }
    };

    return (
        <ScreenWrapper>
            <Header title="Scan QR Code" showBack />
            <View style={styles.cameraContainer}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr"],
                    }}
                />
                <View style={styles.overlay}>
                    <View style={styles.scanFrame} />
                    <Text style={styles.instructionText}>
                        Align QR code within frame
                    </Text>
                </View>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
    },
    permissionText: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '500',
        color: theme.colors.text.primary,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    permissionButton: {
        backgroundColor: theme.colors.primary.main,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.xl,
    },
    permissionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: 'black',
        borderRadius: theme.borderRadius.xl,
        overflow: 'hidden',
        margin: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        borderRadius: theme.borderRadius.xl,
        backgroundColor: 'transparent',
    },
    instructionText: {
        color: 'white',
        marginTop: theme.spacing.lg,
        fontWeight: '500',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        overflow: 'hidden',
    },
});

export default QRScannerScreen;
