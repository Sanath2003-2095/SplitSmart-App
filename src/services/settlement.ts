import { Expense } from './expense';
import { Group } from './group';

export interface Debt {
    from: string;
    to: string;
    amount: number;
}

export const calculateDebts = (expenses: Expense[], groupMembers: string[]): Debt[] => {
    const balances: { [userId: string]: number } = {};

    // Initialize balances
    groupMembers.forEach(member => balances[member] = 0);

    // Calculate net balance for each user
    expenses.forEach(expense => {
        const paidBy = expense.paidBy;
        const amount = expense.amount;

        // Payer gets positive balance (owed money)
        balances[paidBy] = (balances[paidBy] || 0) + amount;

        if (expense.splitDetails) {
            // Exact split provided
            Object.entries(expense.splitDetails).forEach(([userId, share]) => {
                balances[userId] = (balances[userId] || 0) - share;
            });
        } else if (expense.splitBetween && expense.splitBetween.length > 0) {
            // Split equally among specific members
            const splitAmount = amount / expense.splitBetween.length;
            expense.splitBetween.forEach(member => {
                balances[member] = (balances[member] || 0) - splitAmount;
            });
        } else {
            // Fallback: Split equally among all group members
            const splitAmount = amount / groupMembers.length;
            groupMembers.forEach(member => {
                balances[member] = (balances[member] || 0) - splitAmount;
            });
        }
    });

    // Separate into debtors and creditors
    const debtors: { id: string, amount: number }[] = [];
    const creditors: { id: string, amount: number }[] = [];

    Object.entries(balances).forEach(([id, amount]) => {
        if (amount < -0.01) debtors.push({ id, amount }); // Negative means they owe
        if (amount > 0.01) creditors.push({ id, amount }); // Positive means they are owed
    });

    // Sort by magnitude to minimize transactions (greedy approach)
    debtors.sort((a, b) => a.amount - b.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const debts: Debt[] = [];
    let i = 0; // debtor index
    let j = 0; // creditor index

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        // The amount to settle is the minimum of what debtor owes and creditor is owed
        const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

        debts.push({
            from: debtor.id,
            to: creditor.id,
            amount: Number(amount.toFixed(2))
        });

        // Update remaining amounts
        debtor.amount += amount;
        creditor.amount -= amount;

        // Move indices if settled
        if (Math.abs(debtor.amount) < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    return debts;
};
