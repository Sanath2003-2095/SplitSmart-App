import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, ActivityIndicator, Alert, ScrollView, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserGroups, createGroup, addMemberToGroup, Group } from '../services/group';
import Button from '../components/Button';
import Input from '../components/Input';
import ScreenWrapper from '../components/ScreenWrapper';
import Header from '../components/Header';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, commonStyles } from '../services/theme';

const { width } = Dimensions.get('window');

const GroupsScreen = ({ navigation, route }: any) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [creating, setCreating] = useState(false);

    // New state for member management
    const [newMemberName, setNewMemberName] = useState('');
    const [newMembers, setNewMembers] = useState<string[]>([]);

    const fetchGroups = async () => {
        try {
            const userGroups = await getUserGroups();
            setGroups(userGroups);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch groups');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchGroups();
            // Handle Quick Add action
            if (route.params?.action === 'create') {
                setModalVisible(true);
                // Clear the param so it doesn't reopen on subsequent focus
                navigation.setParams({ action: null });
            }
        });
        return unsubscribe;
    }, [navigation, route.params]);

    useEffect(() => {
        if (route.params?.receiptData && !loading) {
            Alert.alert(
                'Receipt Scanned',
                'Please select a group to split this bill with.',
                [{ text: 'OK' }]
            );
        }
    }, [route.params?.receiptData, loading]);

    const handleAddMember = () => {
        if (newMemberName.trim()) {
            setNewMembers([...newMembers, newMemberName.trim()]);
            setNewMemberName('');
        }
    };

    const removeMember = (index: number) => {
        const updatedMembers = [...newMembers];
        updatedMembers.splice(index, 1);
        setNewMembers(updatedMembers);
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        setCreating(true);
        try {
            const groupId = await createGroup(newGroupName);

            // Add other members
            if (newMembers.length > 0) {
                for (const memberName of newMembers) {
                    await addMemberToGroup(groupId, memberName);
                }
            }

            setNewGroupName('');
            setNewMembers([]);
            setModalVisible(false);
            fetchGroups();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setCreating(false);
        }
    };

    const getGradientColors = (name: string) => {
        const gradients = [
            ['#7F5AF0', '#6246EA'],
            ['#2CB67D', '#239063'],
            ['#F472B6', '#D65A98'],
            ['#3DA9FC', '#094067'],
            ['#FF8906', '#E53170'],
        ];
        const index = name.length % gradients.length;
        return gradients[index] as [string, string, ...string[]];
    };


    return (
        <ScreenWrapper>
            <Header
                title="Groups"
                subtitle="Manage your shared expenses"
                rightAction={
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('QRScanner')}
                            style={styles.iconButton}
                        >
                            <Ionicons name="scan-outline" size={24} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setModalVisible(true)}
                            style={styles.addButton}
                        >
                            <Ionicons name="add" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                }
            />

            <View style={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary.main} />
                    </View>
                ) : (
                    <FlatList
                        data={groups}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.groupCardContainer}
                                onPress={() => {
                                    if (route.params?.receiptData) {
                                        navigation.navigate('SplitBill', {
                                            groupId: item.id,
                                            receiptData: route.params.receiptData,
                                            splitMode: route.params.splitMode
                                        });
                                        navigation.setParams({ receiptData: null, splitMode: null });
                                    } else {
                                        navigation.navigate('GroupDetails', {
                                            groupId: item.id,
                                            groupName: item.name
                                        });
                                    }
                                }}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                                    style={styles.groupCardGradient}
                                >
                                    <View style={styles.groupCardContent}>
                                        <View style={styles.groupHeader}>
                                            <View style={styles.groupInfo}>
                                                <LinearGradient
                                                    colors={getGradientColors(item.name)}
                                                    style={styles.groupAvatar}
                                                >
                                                    <Text style={styles.groupAvatarText}>
                                                        {item.name.substring(0, 2).toUpperCase()}
                                                    </Text>
                                                </LinearGradient>
                                                <View style={styles.groupTextContainer}>
                                                    <Text numberOfLines={1} style={styles.groupName}>
                                                        {item.name}
                                                    </Text>
                                                    <Text style={styles.groupMembersCount}>
                                                        {item.members.length} {item.members.length === 1 ? 'member' : 'members'}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.chevronContainer}>
                                                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                                            </View>
                                        </View>

                                        <View style={styles.groupFooter}>
                                            <View style={styles.memberAvatars}>
                                                {item.members.slice(0, 5).map((member, i) => (
                                                    <View key={i} style={styles.miniAvatarContainer}>
                                                        <LinearGradient
                                                            colors={getGradientColors(member.name)}
                                                            style={styles.miniAvatar}
                                                        >
                                                            <Text style={styles.miniAvatarText}>
                                                                {member.name.substring(0, 1)}
                                                            </Text>
                                                        </LinearGradient>
                                                    </View>
                                                ))}
                                                {item.members.length > 5 && (
                                                    <View style={[styles.miniAvatarContainer, styles.moreMembersAvatar]}>
                                                        <Text style={styles.moreMembersText}>
                                                            +{item.members.length - 5}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={styles.viewDetailsText}>
                                                View Details
                                            </Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconContainer}>
                                    <Ionicons name="people" size={48} color={theme.colors.primary.main} />
                                </View>
                                <Text style={styles.emptyTitle}>
                                    No groups yet
                                </Text>
                                <Text style={styles.emptySubtitle}>
                                    Create a group to start splitting bills with friends. It's easy!
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Create Group Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                New Group
                            </Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <Input
                                label="Group Name"
                                value={newGroupName}
                                onChangeText={setNewGroupName}
                                placeholder="e.g. Trip to Paris"
                                leftIcon={<Ionicons name="people-outline" size={20} color={theme.colors.text.secondary} />}
                            />

                            <Text style={styles.sectionTitle}>
                                Add Members
                            </Text>

                            <View style={styles.addMemberRow}>
                                <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                                    <Input
                                        label="Member Name"
                                        value={newMemberName}
                                        onChangeText={setNewMemberName}
                                        placeholder="Enter name"
                                        containerStyle={{ marginBottom: 0 }}
                                    />
                                </View>
                                <TouchableOpacity
                                    onPress={handleAddMember}
                                    style={styles.addMemberButton}
                                >
                                    <Ionicons name="add" size={28} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>

                            {newMembers.length > 0 && (
                                <View style={styles.membersList}>
                                    {newMembers.map((member, index) => (
                                        <View
                                            key={index}
                                            style={styles.memberChip}
                                        >
                                            <Text style={styles.memberChipText}>{member}</Text>
                                            <TouchableOpacity
                                                onPress={() => removeMember(index)}
                                                style={styles.removeMemberButton}
                                            >
                                                <Ionicons name="close" size={14} color={theme.colors.text.primary} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <Button
                                title="Create Group"
                                onPress={handleCreateGroup}
                                loading={creating}
                                disabled={!newGroupName}
                                variant="filled"
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    headerActions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface.containerHigh,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.primary.main,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.glow,
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.sm,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 100,
        paddingTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xs,
    },
    groupCardContainer: {
        marginBottom: theme.spacing.md,
    },
    groupCardGradient: {
        borderRadius: 24,
        padding: 1,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    groupCardContent: {
        backgroundColor: theme.colors.surface.main,
        borderRadius: 20,
        padding: theme.spacing.md,
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.md,
    },
    groupInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: theme.spacing.md,
    },
    groupAvatar: {
        width: 64,
        height: 64,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
        ...theme.shadows.md,
    },
    groupAvatarText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    groupTextContainer: {
        flex: 1,
    },
    groupName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    groupMembersCount: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        fontWeight: '500',
    },
    chevronContainer: {
        backgroundColor: theme.colors.surface.containerHigh,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
    },
    groupFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.sm,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    memberAvatars: {
        flexDirection: 'row',
        marginLeft: 8,
    },
    miniAvatarContainer: {
        width: 36,
        height: 36,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface.main,
        borderWidth: 2,
        borderColor: theme.colors.surface.main,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -12,
        overflow: 'hidden',
    },
    miniAvatar: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    miniAvatarText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    moreMembersAvatar: {
        backgroundColor: theme.colors.surface.containerHigh,
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreMembersText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.text.secondary,
    },
    viewDetailsText: {
        fontSize: 12,
        color: theme.colors.primary.main,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 80,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 96,
        height: 96,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface.containerHigh,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.lg,
        ...theme.shadows.glow,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    emptySubtitle: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: theme.spacing.md,
    },
    modalContent: {
        backgroundColor: theme.colors.surface.main,
        borderRadius: 32,
        padding: theme.spacing.lg,
        width: '100%',
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        ...theme.shadows.lg,
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
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface.containerHigh,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBody: {
        // flex: 1, // caused collapse in auto-height modal
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    addMemberRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: theme.spacing.lg,
    },
    addMemberButton: {
        width: 56,
        height: 56,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.secondary.main,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2, // Align with input bottom
        ...theme.shadows.sm,
    },
    membersList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
    },
    memberChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface.containerHigh,
        borderRadius: theme.borderRadius.full,
        paddingLeft: theme.spacing.md,
        paddingRight: theme.spacing.xs,
        paddingVertical: theme.spacing.xs,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    memberChipText: {
        color: theme.colors.text.primary,
        fontWeight: '500',
        marginRight: theme.spacing.xs,
    },
    removeMemberButton: {
        width: 24,
        height: 24,
        borderRadius: theme.borderRadius.full,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalFooter: {
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
});

export default GroupsScreen;
