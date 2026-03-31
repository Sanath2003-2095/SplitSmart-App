import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../services/theme';

interface HeaderProps {
    title: string;
    showBack?: boolean;
    rightAction?: React.ReactNode;
    subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({
    title,
    showBack = false,
    rightAction,
    subtitle
}) => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.leftContainer}>
                {showBack && (
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                )}
                <View>
                    <Text style={styles.title}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text style={styles.subtitle}>
                            {subtitle}
                        </Text>
                    )}
                </View>
            </View>
            {rightAction && (
                <View style={styles.rightAction}>
                    {rightAction}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        marginBottom: theme.spacing.xs,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        marginRight: theme.spacing.md,
        width: 40,
        height: 40,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface.container,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    rightAction: {
        marginLeft: theme.spacing.md,
    },
});

export default Header;
