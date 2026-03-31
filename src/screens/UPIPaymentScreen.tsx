import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Linking,
    KeyboardAvoidingView,
    Platform,
    ActionSheetIOS,
    SafeAreaView,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../services/theme';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const UPIPaymentScreen = () => {
    const navigation = useNavigation();
    const [vpa, setVpa] = useState('');
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePay = async () => {
        if (!vpa || !amount || !name) {
            Alert.alert('Error', 'Please fill in all required fields (VPA, Name, Amount)');
            return;
        }

        if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        setLoading(true);

        // Construct UPI Deep Link
        // format: upi://pay?pa=<upi_id>&pn=<name>&am=<amount>&tn=<note>&cu=INR
        const upiUrl = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(note)}&cu=INR`;

        try {
            // Attempt to open directly first. This handles cases where canOpenURL returns false (Android 11+)
            // but the app is actually installed and can handle the intent.
            await Linking.openURL(upiUrl);
        } catch (error) {
            console.log('Direct open failed, checking support...', error);

            try {
                const supported = await Linking.canOpenURL(upiUrl);

                if (supported) {
                    await Linking.openURL(upiUrl);
                } else {
                    // Fallback for simulators: Simulate payment success
                    Alert.alert(
                        'Demo Mode',
                        'UPI app not found (or not visible). Simulate successful payment?',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Simulate Success',
                                onPress: () => {
                                    Alert.alert('Success', `Payment of ₹${amount} to ${name} was successful!`, [
                                        { text: 'OK', onPress: () => navigation.goBack() }
                                    ]);
                                }
                            }
                        ]
                    );
                }
            } catch (err) {
                // Even on error, allow simulation for demo
                Alert.alert(
                    'Error',
                    'Failed to open UPI app. Simulate success?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Simulate',
                            onPress: () => {
                                Alert.alert('Success', `Payment of ₹${amount} successful!`, [
                                    { text: 'OK', onPress: () => navigation.goBack() }
                                ]);
                            }
                        }
                    ]
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.colors.primary.main, theme.colors.primary.dark]}
                style={styles.header}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>UPI Payment</Text>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.formCard}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Receiver UPI ID / VPA</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. example@upi"
                                value={vpa}
                                onChangeText={setVpa}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Receiver Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. John Doe"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Amount (₹)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Note (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Bill payment"
                                value={note}
                                onChangeText={setNote}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.payButton}
                            onPress={handlePay}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={theme.colors.gradients.primary as [string, string, ...string[]]}
                                style={styles.gradientButton}
                            >
                                <Text style={styles.payButtonText}>
                                    {loading ? 'Processing...' : 'Pay Now'}
                                </Text>
                                {!loading && <Ionicons name="arrow-forward" size={20} color="white" />}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.secureBadge}>
                            <Ionicons name="shield-checkmark" size={16} color={theme.colors.success} />
                            <Text style={styles.secureText}>Secured by Splitsmart</Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    formCard: {
        backgroundColor: 'white',
        borderRadius: theme.borderRadius.xl,
        padding: 24,
        ...theme.shadows.card,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: theme.borderRadius.lg,
        padding: 16,
        fontSize: 16,
        color: '#1A1A2E',
        backgroundColor: '#F8FAFC',
    },
    payButton: {
        marginTop: 10,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    payButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    secureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        gap: 6,
    },
    secureText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        fontWeight: '500',
    }
});

export default UPIPaymentScreen;
