import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
// import Animated from 'react-native-reanimated'; // DISABLED FOR EXPO GO
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../services/theme';

const SuccessAnimation = () => {
    return (
        <View style={styles.container}>
            <View style={styles.circle}>
                <Ionicons name="checkmark" size={50} color="white" />
            </View>
            <Text style={styles.text}>
                Payment Successful!
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    circle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: theme.colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
});

export default SuccessAnimation;
