import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { theme } from '../services/theme';

interface UPIQRCodeProps {
    upiId: string;
    amount?: string | number;
    name?: string;
    note?: string;
    size?: number;
}

const UPIQRCode: React.FC<UPIQRCodeProps> = ({
    upiId,
    amount,
    name = 'User',
    note = 'Payment',
    size = 200
}) => {
    // Construct UPI URI
    // Format: upi://pay?pa={upiId}&pn={name}&am={amount}&tn={note}&cu=INR
    const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}${amount ? `&am=${amount}` : ''}&tn=${encodeURIComponent(note)}&cu=INR`;

    if (!upiId) {
        return (
            <View style={[styles.container, { width: size, height: size }]}>
                <Text style={styles.errorText}>No UPI ID provided</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.qrWrapper}>
                <QRCode
                    value={upiUri}
                    size={size}
                    color="black"
                    backgroundColor="white"
                    quietZone={10}
                />
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.upiId}>{upiId}</Text>
                {name && <Text style={styles.name}>{name}</Text>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrWrapper: {
        padding: theme.spacing.md,
        backgroundColor: 'white',
        borderRadius: theme.borderRadius.xl,
        ...theme.shadows.md,
    },
    infoContainer: {
        marginTop: theme.spacing.md,
        alignItems: 'center',
    },
    upiId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    name: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    errorText: {
        color: theme.colors.error.main,
        textAlign: 'center',
    }
});

export default UPIQRCode;
