import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../services/theme';

interface CardProps extends ViewProps {
    children: React.ReactNode;
    gradient?: boolean;
    gradientColors?: readonly [string, string, ...string[]];
    style?: ViewStyle;
}

const Card: React.FC<CardProps> = ({
    children,
    gradient = false,
    gradientColors = theme.colors.gradients.primary,
    style,
    ...props
}) => {
    if (gradient) {
        return (
            <LinearGradient
                colors={gradientColors as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, style]}
                {...props}
            >
                {children}
            </LinearGradient>
        );
    }

    return (
        <View
            style={[styles.card, styles.cardSurface, style]}
            {...props}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        ...theme.shadows.card,
    },
    cardSurface: {
        backgroundColor: theme.colors.surface.main,
    },
});

export default Card;
