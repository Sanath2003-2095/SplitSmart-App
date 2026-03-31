import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { analyzeReceiptWithGemini } from '../services/gemini';
import { theme } from '../services/theme';

const OCRScreen = ({ navigation, route }: any) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [processing, setProcessing] = useState(false);
    const cameraRef = useRef<CameraView>(null);
    const { groupId, fromHome, initialImage } = route.params || {};

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [scannedData, setScannedData] = useState<any>(null);
    const [selectedCategory, setSelectedCategory] = useState('General');
    const [customCategory, setCustomCategory] = useState('');
    const [splitMode, setSplitMode] = useState<'equal' | 'percentage' | 'items'>('equal');

    const categories = ['General', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping'];

    const processReceipt = async (uri: string) => {
        setProcessing(true);
        try {
            // Use Gemini API for analysis
            const data = await analyzeReceiptWithGemini(uri);
            setScannedData(data);
            setModalVisible(true);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', 'Failed to process receipt. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleContinue = () => {
        setModalVisible(false);
        const finalCategory = customCategory.trim() || selectedCategory;
        const finalData = { ...scannedData, category: finalCategory };

        if (fromHome) {
            navigation.navigate('GroupsTab', {
                screen: 'GroupsList',
                params: {
                    receiptData: finalData,
                    splitMode
                }
            });
        } else {
            navigation.navigate('SplitBill', {
                groupId,
                receiptData: finalData,
                splitMode
            });
        }
    };

    useEffect(() => {
        if (initialImage) {
            processReceipt(initialImage);
        }
    }, [initialImage]);

    // If we have an initial image (upload flow), we don't need camera permissions immediately
    if (!initialImage) {
        if (!permission) {
            // Camera permissions are still loading.
            return <View style={styles.container} />;
        }

        if (!permission.granted) {
            // Camera permissions are not granted yet.
            return (
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>We need your permission to show the camera</Text>
                    <TouchableOpacity
                        onPress={requestPermission}
                        style={styles.permissionButton}
                    >
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.cancelButton}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            );
        }
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync();
                if (photo) {
                    processReceipt(photo.uri);
                }
            } catch (error) {
                console.error(error);
                Alert.alert('Error', 'Failed to take picture');
            }
        }
    };

    return (
        <View style={styles.container}>
            {(!initialImage && permission?.granted) && (
                <CameraView
                    style={StyleSheet.absoluteFill}
                    ref={cameraRef}
                />
            )}
            <View style={styles.overlay} pointerEvents="box-none">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.closeButton}
                >
                    <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>

                <View style={styles.controlsContainer}>
                    {processing ? (
                        <View style={styles.processingContainer}>
                            <ActivityIndicator size="large" color="white" />
                            <Text style={styles.processingText}>Scanning Receipt...</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={takePicture}
                            style={styles.captureButtonOuter}
                        >
                            <View style={styles.captureButtonInner} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>


            {/* Category & Split Mode Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Receipt Details</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            {/* Category Selection */}
                            <Text style={styles.sectionTitle}>Select Category</Text>
                            <View style={styles.categoriesContainer}>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => {
                                            setSelectedCategory(cat);
                                            setCustomCategory('');
                                        }}
                                        style={[
                                            styles.categoryChip,
                                            selectedCategory === cat && !customCategory ? styles.categoryChipSelected : null
                                        ]}
                                    >
                                        <Text style={[
                                            styles.categoryText,
                                            selectedCategory === cat && !customCategory ? styles.categoryTextSelected : null
                                        ]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Or Custom Category</Text>
                            <TextInput
                                value={customCategory}
                                onChangeText={(text) => {
                                    setCustomCategory(text);
                                    if (text) setSelectedCategory('');
                                }}
                                placeholder="e.g. Office Supplies"
                                placeholderTextColor={theme.colors.text.disabled}
                                style={styles.customInput}
                            />

                            {/* Split Mode Selection */}
                            <Text style={styles.sectionTitle}>Split Type</Text>
                            <View style={styles.splitModesContainer}>
                                {[
                                    { id: 'equal', label: 'Equal Split', icon: 'people' },
                                    { id: 'percentage', label: 'By Percentage', icon: 'pie-chart' },
                                    { id: 'items', label: 'By Item', icon: 'list' }
                                ].map((mode) => (
                                    <TouchableOpacity
                                        key={mode.id}
                                        onPress={() => setSplitMode(mode.id as any)}
                                        style={[
                                            styles.splitModeCard,
                                            splitMode === mode.id && styles.splitModeCardSelected
                                        ]}
                                    >
                                        <Ionicons
                                            name={mode.icon as any}
                                            size={24}
                                            color={splitMode === mode.id ? 'white' : theme.colors.text.secondary}
                                        />
                                        <Text style={[
                                            styles.splitModeText,
                                            splitMode === mode.id && styles.splitModeTextSelected
                                        ]}>
                                            {mode.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            onPress={handleContinue}
                            style={styles.continueButton}
                        >
                            <Text style={styles.continueButtonText}>Continue</Text>
                            <Ionicons name="arrow-forward" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal >
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: 'black',
    },
    permissionText: {
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
        fontSize: 18,
        color: 'white',
    },
    permissionButton: {
        backgroundColor: theme.colors.primary.main,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    permissionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        marginTop: theme.spacing.xl,
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 16,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        flex: 1,
        justifyContent: 'space-between',
        padding: theme.spacing.xl,
    },
    closeButton: {
        marginTop: theme.spacing.xl,
        alignSelf: 'flex-start',
        padding: theme.spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: theme.borderRadius.full,
    },
    controlsContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.xxl,
    },
    processingContainer: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.xl,
        alignItems: 'center',
    },
    processingText: {
        color: 'white',
        marginTop: theme.spacing.md,
        fontWeight: 'bold',
        fontSize: 16,
    },
    captureButtonOuter: {
        width: 80,
        height: 80,
        borderRadius: theme.borderRadius.full,
        borderWidth: 4,
        borderColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    captureButtonInner: {
        width: 64,
        height: 64,
        borderRadius: theme.borderRadius.full,
        backgroundColor: 'white',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    modalContent: {
        backgroundColor: theme.colors.surface.main,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: theme.spacing.lg,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    modalBody: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    categoryChip: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface.containerHigh,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    categoryChipSelected: {
        backgroundColor: theme.colors.primary.main,
        borderColor: theme.colors.primary.main,
    },
    categoryText: {
        color: theme.colors.text.secondary,
        fontWeight: '500',
    },
    categoryTextSelected: {
        color: 'white',
        fontWeight: 'bold',
    },
    inputLabel: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    customInput: {
        backgroundColor: theme.colors.surface.containerHigh,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        color: theme.colors.text.primary,
        fontSize: 16,
        marginBottom: theme.spacing.lg,
    },
    splitModesContainer: {
        gap: theme.spacing.sm,
    },
    splitModeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.surface.containerHigh,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: theme.spacing.md,
    },
    splitModeCardSelected: {
        backgroundColor: theme.colors.primary.main,
        borderColor: theme.colors.primary.main,
    },
    splitModeText: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text.secondary,
    },
    splitModeTextSelected: {
        color: 'white',
        fontWeight: 'bold',
    },
    continueButton: {
        backgroundColor: theme.colors.primary.main,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
    },
    continueButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default OCRScreen;
