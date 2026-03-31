import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getRecurringExpenses, deleteRecurringExpense, RecurringExpense } from '../services/recurring';
import ScreenWrapper from '../components/ScreenWrapper';
import Header from '../components/Header';
import Card from '../components/Card';
import { theme } from '../services/theme';

const RecurringExpensesScreen = ({ navigation }: any) => {
    const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadExpenses = async () => {
        try {
            const data = await getRecurringExpenses();
            setExpenses(data);
        } catch (error) {
            console.error('Error loading recurring expenses:', error);
            Alert.alert('Error', 'Failed to load recurring expenses');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadExpenses();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadExpenses();
    };

    const handleDelete = (id: string) => {
        console.log('Delete requested for ID:', id);
        Alert.alert(
            'Delete Schedule',
            'Are you sure you want to stop this recurring expense?',
            [
                { text: 'Cancel', style: 'cancel', onPress: () => console.log('Delete cancelled') },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        console.log('Delete confirmed for ID:', id);
                        try {
                            await deleteRecurringExpense(id);
                            console.log('Delete successful, reloading...');
                            await loadExpenses();
                        } catch (error) {
                            console.error('Delete failed:', error);
                            Alert.alert('Error', 'Failed to delete schedule');
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <ScreenWrapper>
            <Header title="Recurring Expenses" showBack />
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary.main} />
                }
            >
                {expenses.length === 0 && !loading ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={64} color={theme.colors.text.disabled} />
                        <Text style={styles.emptyText}>No recurring expenses scheduled</Text>
                        <Text style={styles.emptySubText}>
                            When you split a bill, you can choose to make it recurring.
                        </Text>
                    </View>
                ) : (
                    expenses.map((item) => (
                        <Card key={item.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.titleContainer}>
                                    <Text style={styles.description}>{item.expenseParams.description}</Text>
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{item.frequency}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleDelete(item.id)}
                                    style={styles.deleteButton}
                                >
                                    <Ionicons name="trash-outline" size={20} color={theme.colors.error.main} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.detailsContainer}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Amount</Text>
                                    <Text style={styles.amount}>
                                        {item.expenseParams.currency || '₹'}{item.expenseParams.amount.toFixed(2)}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Next Due</Text>
                                    <Text style={styles.date}>{formatDate(item.nextDueDate)}</Text>
                                </View>
                            </View>
                        </Card>
                    ))
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: theme.spacing.md,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        padding: theme.spacing.xl,
    },
    emptyText: {
        color: theme.colors.text.primary,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: theme.spacing.lg,
    },
    emptySubText: {
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginTop: theme.spacing.sm,
        lineHeight: 20,
    },
    card: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface.main,
        ...theme.shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.md,
    },
    titleContainer: {
        flex: 1,
        marginRight: theme.spacing.md,
    },
    description: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    badge: {
        backgroundColor: theme.colors.primary.container,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    badgeText: {
        color: theme.colors.primary.main,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    deleteButton: {
        padding: 8,
        backgroundColor: 'rgba(239, 69, 101, 0.1)',
        borderRadius: theme.borderRadius.md,
    },
    detailsContainer: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        color: theme.colors.text.secondary,
        fontSize: 14,
    },
    amount: {
        color: theme.colors.text.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    date: {
        color: theme.colors.text.primary,
        fontSize: 14,
        fontWeight: '500',
    },
});

export default RecurringExpensesScreen;
