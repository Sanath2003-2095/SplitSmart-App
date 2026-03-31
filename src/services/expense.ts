import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../firebaseConfig';

export interface Expense {
    id: string;
    groupId: string;
    description: string;
    amount: number;
    currency?: string;
    category?: string; // Added category
    paymentMethod?: string; // Added paymentMethod
    tax?: number;
    tip?: number;
    paidBy: string; // User ID
    createdAt: any;
    splitType: 'equal' | 'exact' | 'percentage';
    splitBetween?: string[];
    splitDetails?: { [userId: string]: number }; // Added splitDetails
    // Simplified for now, can be expanded
}

export interface CreateExpenseParams {
    groupId: string;
    description: string;
    amount: number;
    currency?: string;
    category?: string; // Added category
    paymentMethod?: string; // Added paymentMethod
    tax?: number;
    tip?: number;
    paidBy?: string;
    splitType?: 'equal' | 'exact' | 'percentage';
    splitBetween?: string[];
    splitDetails?: { [userId: string]: number }; // Added splitDetails
    date?: string;
}

const EXPENSES_STORAGE_KEY = 'bill_splitter_expenses';

export const addExpense = async ({
    groupId,
    description,
    amount,
    currency = 'Rs.',
    category = 'General', // Default category
    paymentMethod = 'Cash', // Default paymentMethod
    tax = 0,
    tip = 0,
    paidBy,
    splitType = 'equal',
    splitBetween,
    splitDetails
}: CreateExpenseParams): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        const newExpense: Expense = {
            id: Date.now().toString(),
            groupId,
            description,
            amount: Number(amount),
            currency,
            category,
            paymentMethod,
            tax: Number(tax),
            tip: Number(tip),
            paidBy: paidBy || user.uid,
            splitType,
            splitBetween,
            splitDetails, // Added splitDetails
            createdAt: new Date().toISOString()
        };

        const existingExpensesJson = await AsyncStorage.getItem(EXPENSES_STORAGE_KEY);
        const existingExpenses: Expense[] = existingExpensesJson ? JSON.parse(existingExpensesJson) : [];

        const updatedExpenses = [...existingExpenses, newExpense];
        await AsyncStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(updatedExpenses));

        return newExpense.id;
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const getGroupExpenses = async (groupId: string): Promise<Expense[]> => {
    try {
        const existingExpensesJson = await AsyncStorage.getItem(EXPENSES_STORAGE_KEY);
        const existingExpenses: Expense[] = existingExpensesJson ? JSON.parse(existingExpensesJson) : [];

        const groupExpenses = existingExpenses.filter(expense => expense.groupId === groupId);
        return groupExpenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error: any) {
        throw new Error(error.message);
    }
};
export const getAllExpenses = async (): Promise<Expense[]> => {
    const user = auth.currentUser;
    if (!user) return [];

    try {
        const existingExpensesJson = await AsyncStorage.getItem(EXPENSES_STORAGE_KEY);
        const existingExpenses: Expense[] = existingExpensesJson ? JSON.parse(existingExpensesJson) : [];

        // Filter expenses where the user is involved (paid by them or split with them)
        // For simplicity in this dashboard view, we'll focus on expenses PAID BY the user for the "Total Balance" (Spending)
        // or we could show everything. Let's show expenses paid by the user.
        const userExpenses = existingExpenses.filter(expense => expense.paidBy === user.uid);

        return userExpenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error: any) {
        console.error("Error fetching all expenses:", error);
        return [];
    }
};
