import { GoogleGenerativeAI } from "@google/generative-ai";
import { readAsStringAsync } from 'expo-file-system/legacy';
import { ReceiptData } from './ocr';

// Initialize Gemini API
// TODO: Replace with user's API key or fetch from secure storage/config
const API_KEY = "AIzaSyD8F8t-NSTTlIksM_lX1hu9aG6xSr08Oh8";

const genAI = new GoogleGenerativeAI(API_KEY);

import { Platform } from 'react-native';

const path = "/Users/govindkumar/Downloads/Mobile_app/BillSplitter/assets/modals/tf_receipt_classifier_final.h5";

export const analyzeReceiptWithGemini = async (imageUri: string): Promise<ReceiptData> => {
    try {
        let base64;

        if (Platform.OS === 'web') {
            // Fetch the image and convert to base64
            const response = await fetch(imageUri);
            const blob = await response.blob();
            base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
                    const base64String = result.split(',')[1] || result;
                    resolve(base64String);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } else {
            // 1. Read file as Base64
            base64 = await readAsStringAsync(imageUri, {
                encoding: 'base64',
            });
        }

        // 2. Prepare the model
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // 3. Construct the prompt
        const prompt = `
            Analyze this receipt image and extract the following information in JSON format:
            - merchant: The name of the store or merchant.
            - date: The date of the transaction (YYYY-MM-DD format). If not found, use today's date.
            - total: The total amount of the receipt as a number.
            - currency: The currency symbol or code (e.g., "$", "₹", "EUR", "USD", "INR"). Default to "$" if not found.
            - tax: The total tax amount as a number. If not found, use 0.
            - tip: The tip amount as a number. If not found, use 0.
            - items: An array of items purchased, each with a 'description' and 'amount'.
            
            Return ONLY the JSON object, no markdown formatting.
            Example:
            {
                "merchant": "Store Name",
                "date": "2023-10-27",
                "total": 123.45,
                "currency": "$",
                "tax": 5.00,
                "tip": 2.00,
                "items": [
                    { "description": "Item 1", "amount": 10.00 },
                    { "description": "Item 2", "amount": 5.00 }
                ]
            }
        `;

        // 4. Generate content
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64,
                    mimeType: "image/jpeg", // Assuming JPEG, can detect if needed
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        // 5. Parse JSON
        // Clean up potential markdown code blocks
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonString);

        return {
            merchant: data.merchant || "Unknown Merchant",
            date: data.date || new Date().toISOString().split('T')[0],
            total: typeof data.total === 'number' ? data.total : parseFloat(data.total) || 0,
            currency: data.currency || "$",
            tax: typeof data.tax === 'number' ? data.tax : parseFloat(data.tax) || 0,
            tip: typeof data.tip === 'number' ? data.tip : parseFloat(data.tip) || 0,
            items: Array.isArray(data.items) ? data.items.map((item: any) => ({
                description: item.description || "Unknown Item",
                amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0
            })) : []
        };

    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        throw new Error("Failed to analyze receipt with Gemini.");
    }
};
