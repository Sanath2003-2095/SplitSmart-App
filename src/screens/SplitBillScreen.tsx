import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Switch, StyleSheet, Platform, KeyboardAvoidingView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Group, getGroup } from '../services/group';
import { addExpense, getGroupExpenses, Expense } from '../services/expense';
import { createRecurringExpense } from '../services/recurring';
import { auth } from '../../firebaseConfig';
import Button from '../components/Button';
import ScreenWrapper from '../components/ScreenWrapper';
import Header from '../components/Header';
import Card from '../components/Card';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../services/theme';

type SplitMode = 'equal' | 'percentage' | 'items';

const SplitBillScreen = ({ navigation, route }: any) => {
    const { groupId, receiptData } = route.params;
    const [group, setGroup] = useState<Group | null>(null);
    const [mode, setMode] = useState<SplitMode>(route.params?.splitMode || 'equal');
    const [loading, setLoading] = useState(false);
    const currency = receiptData?.currency || '₹';

    // Form State
    const [description, setDescription] = useState(receiptData?.merchant || '');
    const [category, setCategory] = useState(receiptData?.category || 'General');
    const [totalAmount, setTotalAmount] = useState(receiptData?.total?.toString() || '');
    const [tax, setTax] = useState(receiptData?.tax?.toString() || '');
    const [tip, setTip] = useState(receiptData?.tip?.toString() || '');

    // Split State
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [percentages, setPercentages] = useState<{ [key: string]: string }>({});
    const [itemAssignments, setItemAssignments] = useState<{ [key: number]: string[] }>({}); // itemIndex -> userIds[]

    // Recurring State
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
    const [recurringDate, setRecurringDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash'); // Added paymentMethod state

    // Balances State
    const [balances, setBalances] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        loadGroup();
        calculateBalances();
    }, [groupId]);

    const loadGroup = async () => {
        try {
            const groupData = await getGroup(groupId);
            setGroup(groupData);
            if (groupData) {
                // Default: select all members
                const allMemberIds = groupData.members.map(m => m.id);
                setSelectedMembers(allMemberIds);

                // Initialize percentages
                const initialPercentages: any = {};
                const share = (100 / groupData.members.length).toFixed(2);
                allMemberIds.forEach(id => initialPercentages[id] = share);
                setPercentages(initialPercentages);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load group');
        }
    };

    const calculateBalances = async () => {
        try {
            const expenses = await getGroupExpenses(groupId);
            const newBalances: { [key: string]: number } = {};

            expenses.forEach((expense: Expense) => {
                // Amount paid by payer
                newBalances[expense.paidBy] = (newBalances[expense.paidBy] || 0) + expense.amount;

                // Amount owed by split members (simplified equal split logic for now as per existing data structure)
                // In a real app, we'd need to parse the split details from the expense if stored complexly
                // Assuming 'equal' split for historical data or basic implementation
                if (expense.splitType === 'equal') {
                    // We don't have the exact split members list in the basic Expense interface shown earlier
                    // But assuming we can get it or it defaults to all group members for now if not stored
                    // For this enhancement, let's just show what they PAID for now as "Spent", 
                    // or if we want "Owes", we need to know who was involved.
                    // Let's stick to "Total Spent" by user for now as a proxy for activity, 
                    // OR if we want "Pending", we need to know who paid for whom.

                    // Let's implement a simple "Net Balance" if we assume everyone splits equally
                    // This is an approximation without full split history in the Expense type
                }
            });

            // Since the user asked for "pending amount", let's try to calculate it properly
            // We need to know who was included in the split. 
            // The current Expense interface in `expense.ts` doesn't explicitly show `splitBetween` in the `Expense` type definition (it was in params).
            // Let's update the logic to just show "Total Paid" by that user in this group for now, 
            // as calculating exact "Owes" requires more data than we might have readily available without modifying the Expense model deeply.
            // Wait, the user said "pending how much they have pending amount".
            // Let's try to calculate a simple "Owes" based on: (Total Group Spend / Num Members) - (Amount Paid by Member)
            // This assumes equal splitting of everything.

            const totalGroupSpend = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            // We need the group members count, which we might not have inside this function easily if group isn't loaded yet.
            // But we can do it in the render or wait for group.

            // Let's store just the "Paid" amount here and calculate net in render
            setBalances(newBalances);

        } catch (error) {
            console.error("Error calculating balances", error);
        }
    };

    const handleSave = async () => {
        if (!description || !totalAmount) {
            Alert.alert('Error', 'Please enter description and amount');
            return;
        }

        setLoading(true);
        try {
            let finalSplit: string[] = [];

            let splitDetails: { [key: string]: number } | undefined;

            if (mode === 'equal') {
                finalSplit = selectedMembers;
            } else if (mode === 'percentage') {
                finalSplit = Object.keys(percentages).filter(k => parseFloat(percentages[k]) > 0);
            } else if (mode === 'items') {
                const involvedUsers = new Set<string>();
                splitDetails = {};

                // 1. Calculate base item costs per user
                receiptData?.items?.forEach((item: any, index: number) => {
                    const assignedUsers = itemAssignments[index] || [];
                    if (assignedUsers.length > 0) {
                        const perUserCost = item.amount / assignedUsers.length;
                        assignedUsers.forEach(uid => {
                            involvedUsers.add(uid);
                            splitDetails![uid] = (splitDetails![uid] || 0) + perUserCost;
                        });
                    }
                });

                // 2. Distribute Tax and Tip proportionally to the base cost
                const totalBaseCost = Object.values(splitDetails).reduce((sum, val) => sum + val, 0);
                const totalTax = parseFloat(tax) || 0;
                const totalTip = parseFloat(tip) || 0;
                const totalExtras = totalTax + totalTip;

                if (totalBaseCost > 0 && totalExtras > 0) {
                    Object.keys(splitDetails).forEach(uid => {
                        const userShare = splitDetails![uid];
                        const proportion = userShare / totalBaseCost;
                        splitDetails![uid] += totalExtras * proportion;
                    });
                }

                finalSplit = Array.from(involvedUsers);
            }

            const expenseParams = {
                groupId,
                description,
                amount: parseFloat(totalAmount),
                tax: parseFloat(tax) || 0,
                tip: parseFloat(tip) || 0,
                paidBy: auth.currentUser?.uid || 'unknown',
                date: receiptData?.date || new Date().toISOString(),
                splitBetween: finalSplit,
                splitDetails, // Pass calculated details
                currency,
                paymentMethod, // Pass paymentMethod
                category // Pass category
            };

            await addExpense(expenseParams);

            if (isRecurring) {
                await createRecurringExpense(frequency, expenseParams, recurringDate);
                Alert.alert('Success', 'Expense saved and recurring schedule created!');
            }

            navigation.navigate('GroupDetails', { groupId });
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMember = (userId: string) => {
        if (selectedMembers.includes(userId)) {
            setSelectedMembers(selectedMembers.filter(id => id !== userId));
        } else {
            setSelectedMembers([...selectedMembers, userId]);
        }
    };

    const toggleItemAssignment = (itemIndex: number, userId: string) => {
        const current = itemAssignments[itemIndex] || [];
        const newAssignments = { ...itemAssignments };

        if (current.includes(userId)) {
            newAssignments[itemIndex] = current.filter(id => id !== userId);
        } else {
            newAssignments[itemIndex] = [...current, userId];
        }
        setItemAssignments(newAssignments);
    };

    const getGradientColors = (name: string) => {
        const gradients = [
            theme.colors.gradients.primary,
            theme.colors.gradients.secondary,
            theme.colors.gradients.warning,
            ['#3DA9FC', '#094067'],
            ['#FF8906', '#E53170'],
        ];
        const index = name.length % gradients.length;
        return gradients[index] as [string, string, ...string[]];
    };

    const renderEqualTab = () => (
        <View>
            <Text style={styles.sectionTitle}>
                Select People
            </Text>
            {Array.from(new Map(group?.members.map(m => [m.id, m])).values()).map((member) => {
                const isSelected = selectedMembers.includes(member.id);
                // Calculate simple estimated balance (Total Paid by User)
                // For a true "Pending" (Owes), we'd need (Total Group Spend / Member Count) - Paid
                // Let's show "Paid: $X" for now as it's safer data
                const paidAmount = balances[member.id] || 0;

                return (
                    <TouchableOpacity
                        key={member.id}
                        onPress={() => toggleMember(member.id)}
                        style={[
                            styles.memberItem,
                            isSelected && styles.memberItemSelected
                        ]}
                    >
                        <View style={styles.memberInfo}>
                            <LinearGradient
                                colors={getGradientColors(member.name)}
                                style={styles.avatar}
                            >
                                <Text style={styles.avatarText}>
                                    {member.name.charAt(0).toUpperCase()}
                                </Text>
                            </LinearGradient>
                            <View>
                                <Text style={[
                                    styles.memberName,
                                    isSelected && styles.memberNameSelected
                                ]}>
                                    {member.name}
                                </Text>
                                <Text style={styles.memberBalance}>
                                    {/* Show the split amount for this specific bill */}
                                    Split: {currency}{(parseFloat(totalAmount || '0') / (selectedMembers.length || 1)).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                        {isSelected && (
                            <View style={styles.checkIcon}>
                                <Ionicons name="checkmark" size={16} color="white" />
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View >
    );

    const renderPercentageTab = () => (
        <View>
            <Text style={styles.sectionTitle}>
                Set Percentages
            </Text>
            {Array.from(new Map(group?.members.map(m => [m.id, m])).values()).map((member) => (
                <View key={member.id} style={styles.percentageItem}>
                    <View style={styles.memberInfo}>
                        <LinearGradient
                            colors={getGradientColors(member.name)}
                            style={styles.avatar}
                        >
                            <Text style={styles.avatarText}>
                                {member.name.charAt(0).toUpperCase()}
                            </Text>
                        </LinearGradient>
                        <Text style={styles.memberName}>{member.name}</Text>
                    </View>
                    <View style={styles.percentageInputContainer}>
                        <TextInput
                            value={percentages[member.id]}
                            onChangeText={(text) => setPercentages({ ...percentages, [member.id]: text })}
                            keyboardType="numeric"
                            style={styles.percentageInput}
                            placeholder="0"
                            placeholderTextColor={theme.colors.text.disabled}
                        />
                        <Text style={styles.percentageSymbol}>%</Text>
                    </View>
                </View>
            ))}
        </View>
    );

    const renderItemsTab = () => (
        <View>
            <Text style={styles.sectionTitle}>
                Assign Items
            </Text>
            {receiptData?.items?.map((item: any, index: number) => (
                <Card key={index} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                        <Text style={styles.itemDescription}>{item.description}</Text>
                        <Text style={styles.itemAmount}>{currency}{item.amount}</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assigneeScroll}>
                        {/* Ensure unique members to prevent multi-selection bug if duplicates exist */}
                        {Array.from(new Map(group?.members.map(m => [m.id, m])).values()).map((member) => {
                            const isAssigned = itemAssignments[index]?.includes(member.id);
                            return (
                                <TouchableOpacity
                                    key={member.id}
                                    onPress={() => toggleItemAssignment(index, member.id)}
                                    style={[
                                        styles.assigneeChip,
                                        isAssigned && styles.assigneeChipSelected
                                    ]}
                                >
                                    <Text style={[
                                        styles.assigneeText,
                                        isAssigned && styles.assigneeTextSelected
                                    ]}>
                                        {member.name.split(' ')[0]}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </Card>
            ))}
        </View>
    );

    return (
        <ScreenWrapper>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <Header
                    title="Split Bill"
                    showBack
                    rightAction={
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={loading}
                            style={{
                                backgroundColor: theme.colors.primary.main,
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: 20,
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Save</Text>
                        </TouchableOpacity>
                    }
                />

                <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                    {/* Total Amount Card */}
                    <LinearGradient
                        colors={theme.colors.gradients.primary as [string, string, ...string[]]}
                        style={styles.totalCard}
                    >
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <View style={styles.amountContainer}>
                            <Text style={styles.currencySymbol}>{currency}</Text>
                            <TextInput
                                value={totalAmount}
                                onChangeText={setTotalAmount}
                                keyboardType="numeric"
                                style={styles.amountInput}
                                placeholder="0.00"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                            />
                        </View>
                        <View style={styles.descriptionContainer}>
                            <TextInput
                                value={description}
                                onChangeText={setDescription}
                                style={styles.descriptionInput}
                                placeholder="What's this for?"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                            />
                        </View>
                        <View style={[styles.descriptionContainer, { marginTop: 10 }]}>
                            <TextInput
                                value={category}
                                onChangeText={setCategory}
                                style={styles.descriptionInput}
                                placeholder="Category (e.g. Food)"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                            />
                        </View>
                        <View style={styles.extrasContainer}>
                            <View style={styles.extraItem}>
                                <Text style={styles.extraLabel}>Tax</Text>
                                <View style={styles.extraInputContainer}>
                                    <Text style={styles.extraCurrency}>{currency}</Text>
                                    <TextInput
                                        value={tax}
                                        onChangeText={setTax}
                                        keyboardType="numeric"
                                        style={styles.extraInput}
                                        placeholder="0.00"
                                        placeholderTextColor="rgba(255,255,255,0.5)"
                                    />
                                </View>
                            </View>
                            <View style={styles.extraItem}>
                                <Text style={styles.extraLabel}>Tip</Text>
                                <View style={styles.extraInputContainer}>
                                    <Text style={styles.extraCurrency}>{currency}</Text>
                                    <TextInput
                                        value={tip}
                                        onChangeText={setTip}
                                        keyboardType="numeric"
                                        style={styles.extraInput}
                                        placeholder="0.00"
                                        placeholderTextColor="rgba(255,255,255,0.5)"
                                    />
                                </View>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Payment Method */}
                    <View style={styles.paymentMethodContainer}>
                        <Text style={styles.sectionTitle}>Payment Method</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paymentMethodsScroll}>
                            {['Cash', 'Card', 'UPI', 'Other'].map((method) => (
                                <TouchableOpacity
                                    key={method}
                                    onPress={() => setPaymentMethod(method)}
                                    style={[
                                        styles.paymentMethodChip,
                                        paymentMethod === method && styles.paymentMethodChipSelected
                                    ]}
                                >
                                    <Text style={[
                                        styles.paymentMethodText,
                                        paymentMethod === method && styles.paymentMethodTextSelected
                                    ]}>
                                        {method}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Split Modes */}
                    <View style={styles.modeContainer}>
                        {(['equal', 'percentage', 'items'] as SplitMode[]).map((m) => (
                            <TouchableOpacity
                                key={m}
                                onPress={() => setMode(m)}
                                style={[
                                    styles.modeButton,
                                    mode === m && styles.modeButtonSelected
                                ]}
                            >
                                <Text style={[
                                    styles.modeText,
                                    mode === m && styles.modeTextSelected
                                ]}>
                                    {m}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Content based on mode */}
                    {mode === 'equal' && renderEqualTab()}
                    {mode === 'percentage' && renderPercentageTab()}
                    {mode === 'items' && renderItemsTab()}

                    {/* Recurring Option */}
                    <View style={styles.recurringContainer}>
                        <View style={styles.recurringHeader}>
                            <Text style={styles.recurringTitle}>Recurring Expense</Text>
                            <Switch
                                value={isRecurring}
                                onValueChange={setIsRecurring}
                                trackColor={{ false: theme.colors.surface.containerHigh, true: theme.colors.primary.main }}
                                thumbColor={isRecurring ? '#fff' : '#f4f3f4'}
                            />
                        </View>
                        {isRecurring && (
                            <View>
                                <View style={styles.frequencyContainer}>
                                    {(['weekly', 'monthly', 'yearly'] as const).map((freq) => (
                                        <TouchableOpacity
                                            key={freq}
                                            onPress={() => setFrequency(freq)}
                                            style={[
                                                styles.frequencyButton,
                                                frequency === freq && styles.frequencyButtonSelected
                                            ]}
                                        >
                                            <Text style={[
                                                styles.frequencyText,
                                                frequency === freq && styles.frequencyTextSelected
                                            ]}>
                                                {freq}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={styles.datePickerButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <View style={styles.dateInfo}>
                                        <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
                                        <Text style={styles.dateLabel}>Starts on</Text>
                                    </View>
                                    <Text style={styles.dateValue}>
                                        {recurringDate.toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </Text>
                                </TouchableOpacity>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={recurringDate}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(event, selectedDate) => {
                                            setShowDatePicker(Platform.OS === 'ios');
                                            if (selectedDate) {
                                                setRecurringDate(selectedDate);
                                            }
                                        }}
                                        minimumDate={new Date()}
                                        textColor="white"
                                        themeVariant="dark"
                                    />
                                )}

                                {Platform.OS === 'ios' && showDatePicker && (
                                    <View style={styles.datePickerActions}>
                                        <TouchableOpacity
                                            onPress={() => setShowDatePicker(false)}
                                            style={styles.datePickerDoneButton}
                                        >
                                            <Text style={styles.datePickerDoneText}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Footer Action */}
                <View style={styles.footer}>
                    {paymentMethod === 'UPI' && (
                        <Button
                            title="Pay Now"
                            onPress={() => {
                                // Attempt to open generic UPI intent
                                Linking.openURL('upi://pay').catch(() => {
                                    Alert.alert('Error', 'Could not open UPI app');
                                });
                            }}
                            variant="outlined"
                            style={{ marginBottom: 10 }}
                        />
                    )}
                    <Button
                        title="Save Expense"
                        onPress={handleSave}
                        loading={loading}
                        variant="filled"
                        size="lg"
                    />
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
    },
    totalCard: {
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.xl,
        marginBottom: theme.spacing.lg,
        ...theme.shadows.glow,
    },
    totalLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        marginBottom: 4,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginRight: 8,
    },
    amountInput: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        flex: 1,
    },
    descriptionContainer: {
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    descriptionInput: {
        fontSize: 18,
        fontWeight: '500',
        color: 'white',
    },
    extrasContainer: {
        flexDirection: 'row',
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'space-between',
        gap: theme.spacing.md,
    },
    extraItem: {
        flex: 1,
    },
    extraLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        marginBottom: 4,
    },
    extraInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
    },
    extraCurrency: {
        color: 'white',
        fontSize: 14,
        marginRight: 4,
    },
    extraInput: {
        color: 'white',
        fontWeight: '500',
        flex: 1,
    },
    modeContainer: {
        flexDirection: 'row',
        marginBottom: theme.spacing.lg,
        backgroundColor: theme.colors.surface.containerHigh,
        padding: 4,
        borderRadius: theme.borderRadius.lg,
    },
    modeButton: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    modeButtonSelected: {
        backgroundColor: theme.colors.surface.main,
        ...theme.shadows.sm,
    },
    modeText: {
        fontWeight: 'bold',
        textTransform: 'capitalize',
        color: theme.colors.text.secondary,
    },
    modeTextSelected: {
        color: theme.colors.primary.main,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.surface.main,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    memberItemSelected: {
        backgroundColor: theme.colors.primary.container,
        borderColor: theme.colors.primary.main,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    memberNameSelected: {
        color: theme.colors.primary.dark,
    },
    memberBalance: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    checkIcon: {
        backgroundColor: theme.colors.primary.main,
        borderRadius: theme.borderRadius.full,
        padding: 2,
    },
    percentageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.surface.main,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    percentageInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface.containerHigh,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    percentageInput: {
        width: 48,
        textAlign: 'right',
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginRight: 4,
    },
    percentageSymbol: {
        color: theme.colors.text.secondary,
        fontWeight: 'bold',
    },
    itemCard: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface.main,
        ...theme.shadows.sm,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    itemDescription: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    itemAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.primary.main,
    },
    assigneeScroll: {
        paddingVertical: 4,
    },
    assigneeChip: {
        marginRight: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'transparent',
    },
    assigneeChipSelected: {
        backgroundColor: theme.colors.primary.main,
        borderColor: theme.colors.primary.main,
    },
    assigneeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.text.secondary,
    },
    assigneeTextSelected: {
        color: 'white',
    },
    recurringContainer: {
        marginTop: theme.spacing.md,
        backgroundColor: theme.colors.surface.main,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    recurringHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    recurringTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    frequencyContainer: {
        flexDirection: 'row',
        marginTop: theme.spacing.md,
        backgroundColor: theme.colors.surface.containerHigh,
        padding: 4,
        borderRadius: theme.borderRadius.md,
    },
    frequencyButton: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
        alignItems: 'center',
    },
    paymentMethodContainer: {
        marginBottom: theme.spacing.lg,
    },
    paymentMethodsScroll: {
        flexDirection: 'row',
    },
    paymentMethodChip: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface.containerHigh,
        marginRight: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    paymentMethodChipSelected: {
        backgroundColor: theme.colors.primary.main,
        borderColor: theme.colors.primary.light,
    },
    paymentMethodText: {
        color: theme.colors.text.secondary,
        fontWeight: '600',
    },
    paymentMethodTextSelected: {
        color: 'white',
    },
    frequencyButtonSelected: {
        backgroundColor: theme.colors.surface.main,
        ...theme.shadows.sm,
    },
    frequencyText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'capitalize',
        color: theme.colors.text.secondary,
    },
    frequencyTextSelected: {
        color: theme.colors.primary.main,
    },
    footer: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface.main,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        ...theme.shadows.lg,
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surface.containerHigh,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginTop: theme.spacing.md,
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    dateLabel: {
        color: theme.colors.text.secondary,
        fontSize: 14,
        fontWeight: '500',
    },
    dateValue: {
        color: theme.colors.primary.main,
        fontSize: 16,
        fontWeight: 'bold',
    },
    datePickerActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.surface.containerHigh,
        borderBottomLeftRadius: theme.borderRadius.md,
        borderBottomRightRadius: theme.borderRadius.md,
    },
    datePickerDoneButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
    },
    datePickerDoneText: {
        color: theme.colors.primary.main,
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default SplitBillScreen;
