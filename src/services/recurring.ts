import AsyncStorage from '@react-native-async-storage/async-storage';
import { addExpense, CreateExpenseParams } from './expense';

export interface RecurringExpense {
    id: string;
    frequency: 'weekly' | 'monthly' | 'yearly';
    nextDueDate: string;
    expenseParams: CreateExpenseParams;
    active: boolean;
}

const RECURRING_STORAGE_KEY = 'bill_splitter_recurring';

export const createRecurringExpense = async (
    frequency: 'weekly' | 'monthly' | 'yearly',
    expenseParams: CreateExpenseParams,
    startDate?: string | Date
): Promise<string> => {
    try {
        const existingJson = await AsyncStorage.getItem(RECURRING_STORAGE_KEY);
        const existing: RecurringExpense[] = existingJson ? JSON.parse(existingJson) : [];

        // If startDate is provided, use it. Otherwise start from now.
        // If startDate is in the future, that's the first due date.
        // If it's today, it's due today (but we might want to skip the immediate one if we just paid it).
        // Let's assume the user wants the NEXT occurrence based on this start date.

        const baseDate = startDate ? new Date(startDate) : new Date();

        // If the user picked a date, that IS the next due date (unless it's in the past, then we calculate next)
        let nextDue = baseDate;
        if (nextDue < new Date()) {
            nextDue = new Date(calculateNextDueDate(baseDate, frequency));
        }

        const newRecurring: RecurringExpense = {
            id: Date.now().toString(),
            frequency,
            nextDueDate: nextDue.toISOString(),
            expenseParams,
            active: true
        };

        const updated = [...existing, newRecurring];
        await AsyncStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(updated));
        return newRecurring.id;
    } catch (error) {
        console.error('Error creating recurring expense:', error);
        throw error;
    }
};

export const getRecurringExpenses = async (): Promise<RecurringExpense[]> => {
    try {
        const existingJson = await AsyncStorage.getItem(RECURRING_STORAGE_KEY);
        return existingJson ? JSON.parse(existingJson) : [];
    } catch (error) {
        console.error('Error fetching recurring expenses:', error);
        return [];
    }
};

export const deleteRecurringExpense = async (id: string): Promise<void> => {
    try {
        console.log('Service: Deleting recurring expense with ID:', id);
        const existingJson = await AsyncStorage.getItem(RECURRING_STORAGE_KEY);
        if (!existingJson) {
            console.log('Service: No existing recurring expenses found');
            return;
        }

        const existing: RecurringExpense[] = JSON.parse(existingJson);
        console.log('Service: Found existing expenses:', existing.length);

        const updated = existing.filter(item => {
            if (item.id === id) {
                console.log('Service: Found match to delete:', item.id);
                return false;
            }
            return true;
        });

        if (updated.length === existing.length) {
            console.warn('Service: No expense found with ID:', id);
        } else {
            console.log('Service: Updated list length:', updated.length);
        }

        await AsyncStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(updated));
        console.log('Service: Saved updated list to storage');
    } catch (error) {
        console.error('Error deleting recurring expense:', error);
        throw error;
    }
};

export const checkAndProcessRecurringExpenses = async (): Promise<void> => {
    try {
        const existingJson = await AsyncStorage.getItem(RECURRING_STORAGE_KEY);
        if (!existingJson) return;

        let recurringExpenses: RecurringExpense[] = JSON.parse(existingJson);
        const now = new Date();
        let changed = false;

        for (let i = 0; i < recurringExpenses.length; i++) {
            const recurring = recurringExpenses[i];
            if (!recurring.active) continue;

            const dueDate = new Date(recurring.nextDueDate);
            if (now >= dueDate) {
                // It's due! Create the expense.
                console.log(`Processing recurring expense: ${recurring.expenseParams.description}`);

                await addExpense({
                    ...recurring.expenseParams,
                    date: new Date().toISOString() // Set date to now
                });

                // Update next due date
                recurring.nextDueDate = calculateNextDueDate(dueDate, recurring.frequency);
                changed = true;
            }
        }

        if (changed) {
            await AsyncStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(recurringExpenses));
        }
    } catch (error) {
        console.error('Error processing recurring expenses:', error);
    }
};

const calculateNextDueDate = (currentDate: Date, frequency: 'weekly' | 'monthly' | 'yearly'): string => {
    const nextDate = new Date(currentDate);
    switch (frequency) {
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
    }
    return nextDate.toISOString();
};
