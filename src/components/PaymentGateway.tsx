import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Image,
    Linking,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../services/theme';
import Input from './Input';
import Button from './Button';
import SuccessAnimation from './SuccessAnimation';
import UPIQRCode from './UPIQRCode';

interface PaymentGatewayProps {
    visible: boolean;
    onClose: () => void;
    amount: number;
    recipientName: string;
    recipientUpiId?: string;
    onSuccess: () => void;
}

type PaymentMethod = 'CARD' | 'UPI' | 'NETBANKING';

const PaymentGateway: React.FC<PaymentGatewayProps> = ({
    visible,
    onClose,
    amount,
    recipientName,
    recipientUpiId,
    onSuccess
}) => {
    const [method, setMethod] = useState<PaymentMethod | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Card State
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [nameOnCard, setNameOnCard] = useState('');

    // UPI State
    const [showQr, setShowQr] = useState(false);

    useEffect(() => {
        if (visible) {
            // Reset state on open
            setMethod(null);
            setLoading(false);
            setSuccess(false);
            setCardNumber('');
            setExpiry('');
            setCvv('');
            setShowQr(false);
        }
    }, [visible]);

    const handlePayment = async () => {
        setLoading(true);
        // Simulate network delay
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            // Close after success animation
            setTimeout(() => {
                onSuccess();
                // onClose is handled by parent usually, but we could close it here too if parent doesn't
            }, 2000);
        }, 2000);
    };

    const handleUpiAppPay = async () => {
        if (!recipientUpiId) {
            Alert.alert('Error', 'No recipient UPI ID');
            return;
        }
        const upiUrl = `upi://pay?pa=${recipientUpiId}&pn=${encodeURIComponent(recipientName)}&am=${amount}&cu=INR`;
        try {
            const supported = await Linking.canOpenURL(upiUrl);
            if (supported) {
                await Linking.openURL(upiUrl);
                // In a real scenario, we'd wait for app switch return or use a library that handles callbacks
                // For this mock, we'll confirm strictly manually or simulate after a delay
                Alert.alert(
                    'Confirm Payment',
                    'Did you complete the payment in the UPI app?',
                    [
                        { text: 'No' },
                        { text: 'Yes', onPress: () => handlePayment() }
                    ]
                );
            } else {
                Alert.alert('Error', 'No UPI apps installed');
            }
        } catch (err) {
            Alert.alert('Error', 'Could not open UPI app');
        }
    };

    const renderMethods = () => (
        <View style={styles.methodsContainer}>
            <Text style={styles.sectionTitle}>Payment Options</Text>

            <TouchableOpacity
                style={styles.methodCard}
                onPress={() => setMethod('CARD')}
            >
                <View style={styles.methodIcon}>
                    <Ionicons name="card-outline" size={24} color={theme.colors.primary.main} />
                </View>
                <View style={styles.methodInfo}>
                    <Text style={styles.methodTitle}>Card</Text>
                    <Text style={styles.methodSubtitle}>Visa, Mastercard, RuPay</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.methodCard}
                onPress={() => setMethod('UPI')}
            >
                <View style={styles.methodIcon}>
                    <Ionicons name="qr-code-outline" size={24} color={theme.colors.primary.main} />
                </View>
                <View style={styles.methodInfo}>
                    <Text style={styles.methodTitle}>UPI</Text>
                    <Text style={styles.methodSubtitle}>Google Pay, PhonePe, Paytm</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.methodCard}
                onPress={() => setMethod('NETBANKING')}
            >
                <View style={styles.methodIcon}>
                    <Ionicons name="business-outline" size={24} color={theme.colors.primary.main} />
                </View>
                <View style={styles.methodInfo}>
                    <Text style={styles.methodTitle}>Netbanking</Text>
                    <Text style={styles.methodSubtitle}>All Indian banks</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
        </View>
    );

    const renderCardForm = () => (
        <View style={styles.formContainer}>
            <View style={styles.formHeader}>
                <TouchableOpacity onPress={() => setMethod(null)} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.formTitle}>Enter Card Details</Text>
            </View>

            <Input
                label="Card Number"
                placeholder="0000 0000 0000 0000"
                keyboardType="numeric"
                value={cardNumber}
                onChangeText={text => setCardNumber(text.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                maxLength={19}
            />

            <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <Input
                        label="Expiry"
                        placeholder="MM/YY"
                        value={expiry}
                        onChangeText={setExpiry}
                        maxLength={5}
                    />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Input
                        label="CVV"
                        placeholder="123"
                        keyboardType="numeric"
                        value={cvv}
                        onChangeText={setCvv}
                        maxLength={3}
                        secureTextEntry
                    />
                </View>
            </View>

            <Input
                label="Name on Card"
                placeholder="John Doe"
                value={nameOnCard}
                onChangeText={setNameOnCard}
            />

            <Button
                title={`Pay ₹${amount.toFixed(2)}`}
                onPress={handlePayment}
                style={{ marginTop: 20 }}
            />
        </View>
    );

    const renderUPIOptions = () => (
        <View style={styles.formContainer}>
            <View style={styles.formHeader}>
                <TouchableOpacity onPress={() => setMethod(null)} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.formTitle}>UPI Payment</Text>
            </View>

            {showQr ? (
                <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <UPIQRCode
                        upiId={recipientUpiId || 'demo@upi'}
                        amount={amount}
                        name={recipientName}
                        size={200}
                    />
                    <Text style={styles.helperText}>Scan this QR code to pay</Text>
                    <Button
                        title="I have paid"
                        onPress={handlePayment}
                        variant="outlined"
                        style={{ marginTop: 20, width: '100%' }}
                    />
                    <Button
                        title="Back to Options"
                        onPress={() => setShowQr(false)}
                        variant="text"
                        style={{ marginTop: 10 }}
                    />
                </View>
            ) : (
                <View style={{ marginTop: 20 }}>
                    <TouchableOpacity style={styles.upiOption} onPress={handleUpiAppPay}>
                        <View style={[styles.methodIcon, { backgroundColor: '#f0f0f0' }]}>
                            <Ionicons name="apps-outline" size={24} color="black" />
                        </View>
                        <View>
                            <Text style={styles.methodTitle}>Pay via UPI App</Text>
                            <Text style={styles.methodSubtitle}>Google Pay, PhonePe, Paytm</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.upiOption} onPress={() => setShowQr(true)}>
                        <View style={[styles.methodIcon, { backgroundColor: '#f0f0f0' }]}>
                            <Ionicons name="qr-code" size={24} color="black" />
                        </View>
                        <View>
                            <Text style={styles.methodTitle}>Show QR Code</Text>
                            <Text style={styles.methodSubtitle}>Scan with any UPI app</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <Input
                        label="Or enter UPI ID"
                        placeholder="username@upi"
                    />
                    <Button
                        title="Verify and Pay"
                        onPress={handlePayment}
                        variant="tonal"
                        style={{ marginTop: 10 }}
                    />
                </View>
            )}
        </View>
    );

    const renderNetbanking = () => (
        <View style={styles.formContainer}>
            <View style={styles.formHeader}>
                <TouchableOpacity onPress={() => setMethod(null)} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.formTitle}>Netbanking</Text>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
                {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra Bank'].map((bank, index) => (
                    <TouchableOpacity key={index} style={styles.bankOption} onPress={handlePayment}>
                        <View style={styles.bankIcon}>
                            <Text style={styles.bankInitial}>{bank.charAt(0)}</Text>
                        </View>
                        <Text style={styles.bankName}>{bank}</Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
                <View style={styles.container}>
                    {/* Header with Amount */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.payToText}>Paying to {recipientName}</Text>
                            <Text style={styles.amountText}>₹{amount.toFixed(2)}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {loading ? (
                            <View style={styles.centerState}>
                                <ActivityIndicator size="large" color={theme.colors.primary.main} />
                                <Text style={styles.processingText}>Processing Payment...</Text>
                                <Text style={styles.doNotBackText}>Do not press back or close the app</Text>
                            </View>
                        ) : success ? (
                            <View style={styles.centerState}>
                                <SuccessAnimation />
                            </View>
                        ) : (
                            <>
                                {method === null && renderMethods()}
                                {method === 'CARD' && renderCardForm()}
                                {method === 'UPI' && renderUPIOptions()}
                                {method === 'NETBANKING' && renderNetbanking()}
                            </>
                        )}
                    </View>

                    {/* Footer Trust Badge */}
                    {!loading && !success && (
                        <View style={styles.footer}>
                            <Ionicons name="shield-checkmark" size={12} color={theme.colors.text.secondary} />
                            <Text style={styles.footerText}>100% Secure Payments by Splitsmart</Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '85%',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#f8f9fa',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    payToText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    amountText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    closeButton: {
        padding: 5,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        gap: 6,
    },
    footerText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: 20,
    },
    methodsContainer: {
        flex: 1,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    methodIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(127, 90, 240, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    methodInfo: {
        flex: 1,
    },
    methodTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    methodSubtitle: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    formContainer: {
        flex: 1,
    },
    formHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    backButton: {
        marginRight: 16,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    row: {
        flexDirection: 'row',
    },
    centerState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    processingText: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    doNotBackText: {
        marginTop: 8,
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    upiOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 20,
    },
    helperText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginVertical: 10,
    },
    bankOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    bankIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    bankInitial: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text.secondary,
    },
    bankName: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text.primary,
    }
});

export default PaymentGateway;
