export interface ReceiptItem {
    description: string;
    amount: number;
}

export interface ReceiptData {
    merchant: string;
    date: string;
    total: number;
    currency?: string;
    tax?: number;
    tip?: number;
    items: ReceiptItem[];
}

export const scanReceipt = async (imageUri: string): Promise<ReceiptData> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock response
    return {
        merchant: "Starbucks",
        date: new Date().toISOString().split('T')[0],
        total: 25.50,
        items: [
            { description: "Latte", amount: 5.50 },
            { description: "Cappuccino", amount: 6.00 },
            { description: "Muffin", amount: 4.00 },
            { description: "Sandwich", amount: 10.00 }
        ]
    };
};
