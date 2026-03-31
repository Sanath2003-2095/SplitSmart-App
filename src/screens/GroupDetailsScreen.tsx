import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, ActivityIndicator, Alert, ScrollView, Linking, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getGroupExpenses, addExpense, Expense } from '../services/expense';
import { getGroup, Group, addMemberToGroup, getUserProfile } from '../services/group';
import { calculateDebts, Debt } from '../services/settlement';
import { sendImmediateNotification } from '../services/notifications';
import { auth } from '../../firebaseConfig';
import Button from '../components/Button';
import Input from '../components/Input';
import ScreenWrapper from '../components/ScreenWrapper';
import Header from '../components/Header';
import Card from '../components/Card';
import PaymentGateway from '../components/PaymentGateway';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, commonStyles } from '../services/theme';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

const GroupDetailsScreen = ({ route, navigation }: any) => {
    const { groupId, groupName } = route.params;
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [group, setGroup] = useState<Group | null>(null);
    const [loading, setLoading] = useState(true);

    // Modals
    const [modalVisible, setModalVisible] = useState(false);
    const [balancesVisible, setBalancesVisible] = useState(false);
    const [addMemberVisible, setAddMemberVisible] = useState(false);
    const [qrVisible, setQrVisible] = useState(false);

    // Payment Gateway State
    const [paymentGatewayVisible, setPaymentGatewayVisible] = useState(false);
    const [debtToSettle, setDebtToSettle] = useState<Debt | null>(null);

    const [debts, setDebts] = useState<Debt[]>([]);
    const [myUpiId, setMyUpiId] = useState(''); // State for user's UPI ID

    // Add Expense Form
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('₹');
    const [category, setCategory] = useState('General');
    const [adding, setAdding] = useState(false);

    // Add Member Form
    const [newMemberName, setNewMemberName] = useState('');
    const [addingMember, setAddingMember] = useState(false);

    // Member Details State
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [memberDetailsVisible, setMemberDetailsVisible] = useState(false);
    const [memberStats, setMemberStats] = useState({ paid: 0, share: 0, balance: 0 });

    const handleMemberPress = (member: any) => {
        const memberId = member.id;

        // Calculate stats
        let totalPaid = 0;
        let totalShare = 0;

        expenses.forEach(exp => {
            if (exp.paidBy === memberId) {
                totalPaid += exp.amount;
            }
            // Simplified share calculation (assuming equal split for now if not specified)
            // In a real app, we'd check splitType and splitBetween
            // For now, assuming equal split among all group members for historical data
            // or if splitBetween is present, check if member is in it
            const splitCount = exp.splitBetween ? exp.splitBetween.length : group?.members.length || 1;
            const isInvolved = exp.splitBetween ? exp.splitBetween.includes(memberId) : true;

            if (isInvolved) {
                totalShare += exp.amount / splitCount;
            }
        });

        setMemberStats({
            paid: totalPaid,
            share: totalShare,
            balance: totalPaid - totalShare
        });
        setSelectedMember(member);
        setMemberDetailsVisible(true);
    };

    const fetchExpenses = async () => {
        try {
            const [groupData, groupExpenses] = await Promise.all([
                getGroup(groupId),
                getGroupExpenses(groupId)
            ]);
            setGroup(groupData);
            setExpenses(groupExpenses);

            if (groupData) {
                const memberIds = groupData.members.map(m => m.id);
                const calculatedDebts = calculateDebts(groupExpenses, memberIds);
                setDebts(calculatedDebts);
            }
        } catch (error: any) {
            console.error('Error fetching group details:', error);
            Alert.alert('Error', 'Failed to load group details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
        loadUserProfile();
    }, [groupId]);

    const loadUserProfile = async () => {
        const profile = await getUserProfile();
        if (profile.upiId) {
            setMyUpiId(profile.upiId);
        }
    };

    useEffect(() => {
        if (route.params?.receiptData) {
            navigation.navigate('SplitBill', {
                groupId,
                receiptData: route.params.receiptData
            });
            navigation.setParams({ receiptData: null });
        }
    }, [route.params?.receiptData]);

    const handleAddExpense = async () => {
        if (!description || !amount) {
            Alert.alert('Error', 'Please enter description and amount');
            return;
        }

        setAdding(true);
        try {
            await addExpense({
                groupId,
                description,
                amount: parseFloat(amount),
                currency,
                category,
                paidBy: auth.currentUser?.uid || 'unknown',
                date: new Date().toISOString(),
                splitBetween: group?.members.map(m => m.id) || []
            });
            setModalVisible(false);
            setDescription('');
            setAmount('');
            setCurrency('₹');
            setCategory('General');
            fetchExpenses();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setAdding(false);
        }
    };

    const handleAddMember = async () => {
        if (!newMemberName.trim()) {
            Alert.alert('Error', 'Please enter a name');
            return;
        }

        setAddingMember(true);
        try {
            await addMemberToGroup(groupId, newMemberName);
            setNewMemberName('');
            setAddMemberVisible(false);
            fetchExpenses();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setAddingMember(false);
        }
    };

    const getMemberName = (id: string) => {
        const member = group?.members.find(m => m.id === id);
        return member ? member.name : 'Unknown';
    };

    const handlePaymentSuccess = async () => {
        if (!debtToSettle) return;

        try {
            await addExpense({
                groupId,
                description: `Payment to ${getMemberName(debtToSettle.to)}`,
                amount: debtToSettle.amount,
                currency: '₹',
                category: 'Transfer',
                paidBy: auth.currentUser?.uid || 'unknown',
                date: new Date().toISOString(),
                splitBetween: [debtToSettle.to] // Split only with the receiver means they "consume" the full amount I paid
            });

            setPaymentGatewayVisible(false);
            setBalancesVisible(false); // Close balances modal too
            setDebtToSettle(null);
            fetchExpenses(); // Refresh to show updated debts
            Alert.alert('Success', 'Payment recorded successfully!');
        } catch (error: any) {
            Alert.alert('Error', 'Failed to record payment: ' + error.message);
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    return (
        <ScreenWrapper>
            <Header
                title={groupName}
                showBack
                subtitle={`${group?.members.length} Members`}
                rightAction={
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            onPress={() => setQrVisible(true)}
                            style={styles.iconButton}
                        >
                            <Ionicons name="qr-code-outline" size={20} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setBalancesVisible(true)}
                            style={styles.iconButton}
                        >
                            <Ionicons name="wallet-outline" size={20} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Members List */}
            <View style={styles.membersSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.membersScrollContent}>
                    <TouchableOpacity
                        onPress={() => setAddMemberVisible(true)}
                        style={styles.addMemberItem}
                    >
                        <View style={styles.addMemberIconContainer}>
                            <Ionicons name="add" size={24} color={theme.colors.primary.main} />
                        </View>
                        <Text style={styles.memberName}>Add</Text>
                    </TouchableOpacity>

                    {group?.members.map((member) => (
                        <TouchableOpacity
                            key={member.id}
                            style={styles.memberItem}
                            onPress={() => handleMemberPress(member)}
                        >
                            <LinearGradient
                                colors={getGradientColors(member.name)}
                                style={styles.memberAvatar}
                            >
                                <Text style={styles.memberAvatarText}>
                                    {member.name.charAt(0).toUpperCase()}
                                </Text>
                            </LinearGradient>
                            <Text style={styles.memberName}>
                                {member.name.split(' ')[0]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.expensesContainer}>
                <View style={styles.expensesHeader}>
                    <Text style={styles.expensesTitle}>Expenses</Text>
                    <Text style={styles.expensesCount}>{expenses.length} items</Text>
                </View>

                <FlatList
                    data={expenses}
                    keyExtractor={(item) => item.id!}
                    renderItem={({ item }) => (
                        <Card style={styles.expenseCard}>
                            <View style={styles.expenseCardContent}>
                                <View style={styles.expenseIconContainer}>
                                    <Ionicons name="receipt" size={20} color={theme.colors.primary.main} />
                                </View>
                                <View style={styles.expenseDetails}>
                                    <Text numberOfLines={1} style={styles.expenseDescription}>{item.description}</Text>
                                    <Text style={styles.expensePaidBy}>
                                        Paid by {item.paidBy === auth.currentUser?.uid ? 'You' : getMemberName(item.paidBy)}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.expenseAmount}>
                                {item.currency || '₹'}{item.amount.toFixed(2)}
                            </Text>
                        </Card>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="receipt-outline" size={40} color={theme.colors.text.disabled} />
                            </View>
                            <Text style={styles.emptyText}>
                                No expenses yet.{'\n'}Add one to get started!
                            </Text>
                        </View>
                    }
                    contentContainerStyle={styles.expensesListContent}
                    showsVerticalScrollIndicator={false}
                />
            </View>

            {/* FABs */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    testID="camera-fab"
                    accessibilityLabel="Scan Receipt"
                    style={styles.cameraFab}
                    onPress={() => navigation.navigate('OCR', { groupId })}
                >
                    <Ionicons name="camera" size={22} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                    testID="add-expense-fab"
                    accessibilityLabel="Add Expense"
                    style={styles.addFab}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={32} color="white" />
                </TouchableOpacity>
            </View>

            {/* Add Expense Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.bottomSheetContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Expense</Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <Input
                                label="Description"
                                value={description}
                                onChangeText={setDescription}
                                placeholder="What is this for?"
                                leftIcon={<Ionicons name="create-outline" size={20} color={theme.colors.text.secondary} />}
                            />

                            <Text style={styles.inputLabel}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                                {['General', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping'].map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => setCategory(cat)}
                                        style={[
                                            styles.categoryChip,
                                            category === cat ? styles.categoryChipSelected : null
                                        ]}
                                    >
                                        <Text style={[
                                            styles.categoryChipText,
                                            category === cat ? styles.categoryChipTextSelected : null
                                        ]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.amountRow}>
                                <View style={{ width: '30%', marginRight: theme.spacing.md }}>
                                    <Input
                                        label="Currency"
                                        value={currency}
                                        onChangeText={setCurrency}
                                        placeholder="₹"
                                        containerStyle={{ marginBottom: 0 }}
                                        style={{ textAlign: 'center' }}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Input
                                        label="Amount"
                                        value={amount}
                                        onChangeText={setAmount}
                                        keyboardType="numeric"
                                        placeholder="0.00"
                                        leftIcon={<Ionicons name="cash-outline" size={20} color={theme.colors.text.secondary} />}
                                        containerStyle={{ marginBottom: 0 }}
                                    />
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <Button
                                title="Add Expense"
                                onPress={handleAddExpense}
                                loading={adding}
                                variant="filled"
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add Member Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={addMemberVisible}
                onRequestClose={() => setAddMemberVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.centerModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitleSmall}>Add Member</Text>
                            <TouchableOpacity onPress={() => setAddMemberVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                            </TouchableOpacity>
                        </View>

                        <Input
                            label="Member Name"
                            placeholder="e.g. John"
                            value={newMemberName}
                            onChangeText={setNewMemberName}
                            leftIcon={<Ionicons name="person-add-outline" size={20} color={theme.colors.text.secondary} />}
                        />

                        <Button
                            title="Add Member"
                            onPress={handleAddMember}
                            loading={addingMember}
                            style={{ marginTop: theme.spacing.md }}
                        />
                    </View>
                </View>
            </Modal>

            {/* Member Details Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={memberDetailsVisible}
                onRequestClose={() => setMemberDetailsVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.centerModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitleSmall}>{selectedMember?.name}</Text>
                            <TouchableOpacity onPress={() => setMemberDetailsVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.statsContainer}>
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Total Paid</Text>
                                <Text style={[styles.statValue, { color: theme.colors.success }]}>
                                    ₹{memberStats.paid.toFixed(2)}
                                </Text>
                            </View>
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Total Share</Text>
                                <Text style={[styles.statValue, { color: theme.colors.text.secondary }]}>
                                    ₹{memberStats.share.toFixed(2)}
                                </Text>
                            </View>
                            <View style={[styles.statRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Net Balance</Text>
                                <Text style={[
                                    styles.totalValue,
                                    { color: memberStats.balance >= 0 ? theme.colors.success : theme.colors.error.main }
                                ]}>
                                    {memberStats.balance >= 0 ? '+' : ''}₹{memberStats.balance.toFixed(2)}
                                </Text>
                            </View>
                            <Text style={styles.balanceStatusText}>
                                {memberStats.balance >= 0
                                    ? "Gets back"
                                    : "Owes"}
                            </Text>
                        </View>

                        <Button
                            title="Close"
                            onPress={() => setMemberDetailsVisible(false)}
                            variant="tonal"
                            fullWidth
                            style={{ marginTop: theme.spacing.lg }}
                        />
                    </View>
                </View>
            </Modal>

            {/* Balances Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={balancesVisible}
                onRequestClose={() => setBalancesVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.bottomSheetContent, { height: '75%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Balances</Text>
                            <TouchableOpacity
                                onPress={() => setBalancesVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.upiContainer}>
                            <Text style={styles.inputLabel}>Your UPI ID (for receiving payments)</Text>
                            <Input
                                value={myUpiId}
                                onChangeText={setMyUpiId}
                                placeholder="e.g. username@upi"
                                containerStyle={{ marginBottom: theme.spacing.md }}
                            />
                        </View>

                        <FlatList
                            data={debts}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <Card style={styles.balanceCard}>
                                    <View style={styles.balanceCardContent}>
                                        <View style={styles.balanceIconContainer}>
                                            <Ionicons name="arrow-forward" size={20} color={theme.colors.error.main} />
                                        </View>
                                        <View>
                                            <Text style={styles.balanceTextBold}>
                                                {item.from === auth.currentUser?.uid ? 'You' : getMemberName(item.from)}
                                            </Text>
                                            <Text style={styles.balanceText}>
                                                {item.from === auth.currentUser?.uid ? 'owe' : 'owes'} {item.to === auth.currentUser?.uid ? 'You' : getMemberName(item.to)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.balanceAmountContainer}>


                                        <Text style={styles.balanceAmount}>₹{item.amount.toFixed(2)}</Text>
                                        {item.from === auth.currentUser?.uid && (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    const toMember = group?.members.find(m => m.id === item.to);
                                                    setDebtToSettle(item);
                                                    setPaymentGatewayVisible(true);
                                                }}
                                                style={styles.payButton}
                                            >
                                                <Text style={styles.payButtonText}>Pay Now</Text>
                                            </TouchableOpacity>
                                        )}
                                        {item.to === auth.currentUser?.uid && (
                                            <TouchableOpacity
                                                onPress={async () => {
                                                    if (!myUpiId) {
                                                        Alert.alert('Missing UPI ID', 'Please enter your UPI ID above to include it in the request.');
                                                        return;
                                                    }
                                                    const paymentLink = `upi://pay?pa=${myUpiId}&pn=${auth.currentUser?.displayName || 'User'}&am=${item.amount}&cu=INR`;

                                                    // In a real app, we'd send this link via notification or chat
                                                    await sendImmediateNotification(
                                                        "Payment Request",
                                                        `Please pay ₹${item.amount.toFixed(2)} to ${myUpiId}. Link: ${paymentLink}`
                                                    );

                                                    // Also offer to share via system share sheet
                                                    Alert.alert(
                                                        "Request Sent",
                                                        `Request for ₹${item.amount.toFixed(2)} sent!`,
                                                        [
                                                            { text: 'OK' },
                                                            {
                                                                text: 'Share Link',
                                                                onPress: () => Linking.openURL(`whatsapp://send?text=Hey, please pay me ₹${item.amount.toFixed(2)} using this link: ${paymentLink}`)
                                                                    .catch(() => Alert.alert('Error', 'Could not open WhatsApp'))
                                                            }
                                                        ]
                                                    );
                                                }}
                                                style={styles.remindButton}
                                            >
                                                <Text style={styles.payButtonText}>Request</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </Card>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <View style={[styles.emptyIconContainer, { backgroundColor: 'rgba(44, 182, 125, 0.1)' }]}>
                                        <Ionicons name="checkmark-circle" size={48} color={theme.colors.secondary.main} />
                                    </View>
                                    <Text style={styles.emptyTitle}>All settled up!</Text>
                                    <Text style={styles.emptySubtitle}>No pending debts in this group.</Text>
                                </View>
                            }
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>

            {/* QR Code Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={qrVisible}
                onRequestClose={() => setQrVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.centerModalContent}>
                        <Text style={[styles.modalTitleSmall, { textAlign: 'center', marginBottom: theme.spacing.xs }]}>Share Group</Text>
                        <Text style={styles.qrSubtitle}>
                            Scan this QR code to join{'\n'}
                            <Text style={{ fontWeight: 'bold', color: theme.colors.primary.main }}>{groupName}</Text>
                        </Text>

                        <View style={styles.qrContainer}>
                            <QRCode
                                value={JSON.stringify({ type: 'join_group', groupId, groupName })}
                                size={200}
                                color="black"
                                backgroundColor="white"
                            />
                        </View>

                        <Button
                            title="Close"
                            onPress={() => setQrVisible(false)}
                            variant="tonal"
                            fullWidth
                        />
                    </View>
                </View>
            </Modal>

            {/* Payment Gateway */}
            {debtToSettle && (
                <PaymentGateway
                    visible={paymentGatewayVisible}
                    onClose={() => setPaymentGatewayVisible(false)}
                    amount={debtToSettle.amount}
                    recipientName={getMemberName(debtToSettle.to)}
                    recipientUpiId={group?.members.find(m => m.id === debtToSettle.to)?.upiId}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    upiContainer: {
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    headerActions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface.containerHigh,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
    },
    membersSection: {
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    membersScrollContent: {
        paddingVertical: theme.spacing.xs,
    },
    addMemberItem: {
        marginRight: theme.spacing.md,
        alignItems: 'center',
    },
    addMemberIconContainer: {
        width: 56,
        height: 56,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface.containerHigh,
        borderWidth: 1,
        borderColor: theme.colors.surface.containerHigh,
        borderStyle: 'dashed',
    },
    memberName: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.colors.text.secondary,
        marginTop: 4,
    },
    memberItem: {
        marginRight: theme.spacing.md,
        alignItems: 'center',
    },
    memberAvatar: {
        width: 56,
        height: 56,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
    },
    memberAvatarText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    expensesContainer: {
        flex: 1,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.surface.containerLow,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: theme.spacing.lg,
        ...theme.shadows.inner, // Assuming inner shadow or just elevation
    },
    expensesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    expensesTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    expensesCount: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        fontWeight: '500',
    },
    expenseCard: {
        marginBottom: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        ...theme.shadows.sm,
        backgroundColor: theme.colors.surface.main,
    },
    expenseCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: theme.spacing.md,
    },
    expenseIconContainer: {
        width: 40,
        height: 40,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.sm,
        backgroundColor: 'rgba(127, 90, 240, 0.1)',
    },
    expenseDetails: {
        flex: 1,
    },
    expenseDescription: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    expensePaidBy: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        fontWeight: '500',
        marginTop: 2,
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    expensesListContent: {
        paddingBottom: 100,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 48,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface.containerHigh,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 32,
        right: 24,
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    cameraFab: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.secondary.main,
        ...theme.shadows.md,
    },
    addFab: {
        width: 56,
        height: 56,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary.main,
        ...theme.shadows.glow,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end', // Default to bottom sheet style
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    bottomSheetContent: {
        backgroundColor: theme.colors.surface.main,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: theme.spacing.lg,
        height: '85%',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        ...theme.shadows.lg,
    },
    centerModalContent: {
        backgroundColor: theme.colors.surface.main,
        borderRadius: 32,
        padding: theme.spacing.lg,
        width: '90%',
        alignSelf: 'center',
        marginBottom: 'auto',
        marginTop: 'auto',
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
    modalTitleSmall: {
        fontSize: 20,
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
        flex: 1,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
        marginLeft: 4,
    },
    categoryScroll: {
        marginBottom: theme.spacing.md,
        maxHeight: 40,
    },
    categoryChip: {
        marginRight: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'transparent',
    },
    categoryChipSelected: {
        backgroundColor: theme.colors.primary.main,
        borderColor: theme.colors.primary.main,
    },
    categoryChipText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.text.secondary,
    },
    categoryChipTextSelected: {
        color: '#FFFFFF',
    },
    amountRow: {
        flexDirection: 'row',
        marginTop: theme.spacing.md,
    },
    modalFooter: {
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    statsContainer: {
        paddingVertical: theme.spacing.md,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    statLabel: {
        fontSize: 16,
        color: theme.colors.text.secondary,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    totalRow: {
        marginTop: theme.spacing.sm,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    balanceStatusText: {
        textAlign: 'right',
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 4,
    },
    balanceCard: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface.main,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    balanceCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    balanceIconContainer: {
        width: 32,
        height: 32,
        borderRadius: theme.borderRadius.full,
        backgroundColor: 'rgba(239, 69, 101, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    balanceTextBold: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    balanceText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    balanceAmountContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.xs,
    },
    balanceAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    payButton: {
        backgroundColor: theme.colors.primary.main,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
    },
    remindButton: {
        backgroundColor: theme.colors.warning.main,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
    },
    payButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginTop: theme.spacing.md,
    },
    emptySubtitle: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
    },
    qrSubtitle: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
        lineHeight: 24,
    },
    qrContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.lg,
        backgroundColor: 'white',
        borderRadius: theme.borderRadius.xl,
        marginBottom: theme.spacing.xl,
    },
});

export default GroupDetailsScreen;
