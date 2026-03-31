import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Platform, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from '../services/auth';
import { auth } from '../../firebaseConfig';
import { getUserGroups, getUserProfile, saveUserProfile } from '../services/group';
import Button from '../components/Button';
import Input from '../components/Input';
import ScreenWrapper from '../components/ScreenWrapper';
import Card from '../components/Card';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../services/theme';
import UPIQRCode from '../components/UPIQRCode';

const ProfileScreen = () => {
    const navigation = useNavigation<any>();
    const user = auth.currentUser;
    const [groupCount, setGroupCount] = useState(0);
    const [upiId, setUpiId] = useState('');
    const [saving, setSaving] = useState(false);
    const [qrVisible, setQrVisible] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const groups = await getUserGroups();
            setGroupCount(groups.length);

            const profile = await getUserProfile();
            if (profile.upiId) {
                setUpiId(profile.upiId);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await saveUserProfile(upiId);
            Alert.alert('Success', 'Profile updated');
        } catch (error) {
            Alert.alert('Error', 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const getInitials = () => {
        if (user?.displayName) {
            return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        }
        return user?.email?.substring(0, 2).toUpperCase() || '??';
    };

    return (
        <ScreenWrapper>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header / Profile Card */}
                <View style={styles.header}>
                    <LinearGradient
                        colors={theme.colors.gradients.primary as [string, string, ...string[]]}
                        style={styles.avatarContainer}
                    >
                        <Text style={styles.avatarText}>
                            {getInitials()}
                        </Text>
                    </LinearGradient>
                    <Text style={styles.userName}>
                        {user?.displayName || 'User'}
                    </Text>
                    <Text style={styles.userEmail}>
                        {user?.email}
                    </Text>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <Card style={styles.statCard}>
                        <Text style={styles.statNumber}>{groupCount}</Text>
                        <Text style={styles.statLabel}>Groups</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={[styles.statNumber, { color: theme.colors.secondary.main }]}>0</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </Card>
                </View>

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    <Text style={styles.sectionTitle}>
                        Payment Settings
                    </Text>
                    <Card style={styles.menuCard}>
                        <View style={{ padding: theme.spacing.md }}>
                            <Input
                                label="UPI ID"
                                value={upiId}
                                onChangeText={setUpiId}
                                placeholder="username@upi"
                                leftIcon={<Ionicons name="card-outline" size={20} color={theme.colors.text.secondary} />}
                            />
                            <Button
                                title="Save Profile"
                                onPress={handleSaveProfile}
                                loading={saving}
                                style={{ marginTop: theme.spacing.sm }}
                            />
                            {upiId ? (
                                <Button
                                    title="Show QR Code"
                                    onPress={() => setQrVisible(true)}
                                    variant="outlined"
                                    icon={<Ionicons name="qr-code-outline" size={20} color={theme.colors.primary.main} />}
                                    style={{ marginTop: theme.spacing.sm, borderColor: theme.colors.primary.main }}
                                />
                            ) : null}
                            <Button
                                title="Pay via UPI"
                                onPress={() => navigation.navigate('UPIPayment')}
                                variant="tonal"
                                icon={<Ionicons name="send-outline" size={20} color={theme.colors.primary.main} />}
                                style={{ marginTop: theme.spacing.sm }}
                            />
                        </View>
                    </Card>

                    <Text style={[styles.sectionTitle, { marginTop: theme.spacing.lg }]}>
                        Settings
                    </Text>

                    <Card style={styles.menuCard}>
                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: theme.colors.surface.containerHigh }]}>
                                    <Ionicons name="person-outline" size={20} color={theme.colors.primary.main} />
                                </View>
                                <Text style={styles.menuItemText}>Edit Profile</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.disabled} />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: theme.colors.surface.containerHigh }]}>
                                    <Ionicons name="notifications-outline" size={20} color={theme.colors.secondary.main} />
                                </View>
                                <Text style={styles.menuItemText}>Notifications</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.disabled} />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: theme.colors.surface.containerHigh }]}>
                                    <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.info.main} />
                                </View>
                                <Text style={styles.menuItemText}>Security</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.disabled} />
                        </TouchableOpacity>
                    </Card>
                </View>

                {/* Sign Out */}
                <View style={styles.footer}>
                    <Button
                        title="Sign Out"
                        onPress={handleSignOut}
                        variant="outlined"
                        icon={<Ionicons name="log-out-outline" size={20} color={theme.colors.primary.main} />}
                        style={styles.signOutButton}
                    />
                </View>
                <View style={{ height: 100 }} />
            </ScrollView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={qrVisible}
                onRequestClose={() => setQrVisible(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.9)' }]}>
                    <View style={styles.menuCard}>
                        <View style={{ alignItems: 'center', padding: theme.spacing.xl }}>
                            <Text style={[styles.sectionTitle, { marginBottom: theme.spacing.lg }]}>
                                My Payment QR
                            </Text>
                            <UPIQRCode
                                upiId={upiId}
                                name={user?.displayName || 'User'}
                                size={220}
                            />
                            <Button
                                title="Close"
                                onPress={() => setQrVisible(false)}
                                style={{ marginTop: theme.spacing.xl, width: '100%' }}
                                variant="tonal"
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        marginTop: theme.spacing.xl,
        marginBottom: theme.spacing.xl,
    },
    avatarContainer: {
        width: 112,
        height: 112,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
        ...theme.shadows.glow,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: theme.colors.text.secondary,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    statCard: {
        flex: 1,
        padding: theme.spacing.md,
        alignItems: 'center',
        backgroundColor: theme.colors.surface.main,
        ...theme.shadows.sm,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.primary.main,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text.secondary,
    },
    menuContainer: {
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: theme.spacing.md,
    },
    menuCard: {
        padding: 0,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface.main,
        ...theme.shadows.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginLeft: 68, // Align with text
    },
    footer: {
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },
    signOutButton: {
        borderColor: 'rgba(239, 69, 101, 0.5)',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        padding: theme.spacing.lg,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
});

export default ProfileScreen;
