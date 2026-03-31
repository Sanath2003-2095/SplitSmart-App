import { StyleSheet } from 'react-native';
import { theme } from '../services/theme';

export const componentStyles = StyleSheet.create({
    // Modern Card
    card: {
        backgroundColor: theme.colors.surface.container,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },

    // Glass Morphism Card
    glassCard: {
        backgroundColor: 'rgba(26, 26, 46, 0.7)',
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        // backdropFilter: 'blur(10px)', // Not supported in React Native natively
    },

    // Modern Button
    button: {
        height: 56,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.lg,
    },

    // Input Container
    inputContainer: {
        backgroundColor: 'rgba(36, 36, 56, 0.8)',
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(127, 90, 240, 0.2)',
        paddingHorizontal: theme.spacing.md,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
    },

    // Floating Action Button
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primary.main,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 24,
        right: 24,
        shadowColor: theme.colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },

    // Tab Bar
    tabBar: {
        backgroundColor: theme.colors.surface.container,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        height: 80,
        paddingBottom: 20,
    },

    // List Item
    listItem: {
        backgroundColor: theme.colors.surface.container,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginVertical: theme.spacing.xs,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
});

// Modern Text Styles
export const textStyles = StyleSheet.create({
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: theme.colors.text.primary,
        letterSpacing: -0.5,
    },

    subtitle: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        letterSpacing: -0.2,
    },

    body: {
        fontSize: 16,
        color: theme.colors.text.primary,
        lineHeight: 24,
    },

    caption: {
        fontSize: 12,
        color: theme.colors.text.disabled,
        letterSpacing: 0.5,
    },

    gradientText: {
        fontWeight: '700',
        fontSize: 28,
        letterSpacing: -0.3,
    },
});