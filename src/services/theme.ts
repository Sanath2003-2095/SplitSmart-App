// theme.ts - Modern Design System
export const theme = {
    // Color Palette
    colors: {
        primary: {
            main: '#7F5AF0',
            light: '#9A7BFF',
            dark: '#6246EA',
            container: '#E8E1FF',
        },
        secondary: {
            main: '#2CB67D',
            light: '#4CD6A1',
            dark: '#1F9D6C',
            container: '#D5F2E5',
        },
        error: {
            main: '#EF4565',
            light: '#FF7B93',
            dark: '#D32F4F',
            container: '#FFE4E9',
        },
        warning: {
            main: '#FF8906',
            light: '#FFA940',
            dark: '#E57600',
            container: '#FFE9CC',
        },
        info: {
            main: '#3DA9FC',
            light: '#6DC1FF',
            dark: '#0B7BC2',
            container: '#D6EEFF',
        },

        // Surface Colors
        background: '#0F0F1A',
        surface: {
            main: '#1A1A2E',
            container: '#242438',
            containerHigh: '#2E2E42',
            containerLow: '#161626',
        },

        // Text Colors
        text: {
            primary: '#FFFFFF',
            secondary: '#B8B8D1',
            disabled: '#6B6B8A',
            onPrimary: '#FFFFFF',
            onSecondary: '#FFFFFF',
        },

        // Status
        success: '#2CB67D',

        // Gradients
        gradients: {
            primary: ['#7F5AF0', '#6246EA'],
            secondary: ['#2CB67D', '#1F9D6C'],
            warning: ['#FF8906', '#E53170'],
            surface: ['#1A1A2E', '#242438'],
        }
    },

    // Typography
    typography: {
        h1: {
            fontSize: 32,
            fontWeight: '800',
            lineHeight: 40,
            letterSpacing: -0.5,
        },
        h2: {
            fontSize: 28,
            fontWeight: '700',
            lineHeight: 36,
            letterSpacing: -0.3,
        },
        h3: {
            fontSize: 24,
            fontWeight: '600',
            lineHeight: 32,
            letterSpacing: -0.2,
        },
        h4: {
            fontSize: 20,
            fontWeight: '600',
            lineHeight: 28,
        },
        body1: {
            fontSize: 16,
            fontWeight: '400',
            lineHeight: 24,
        },
        body2: {
            fontSize: 14,
            fontWeight: '400',
            lineHeight: 20,
        },
        caption: {
            fontSize: 12,
            fontWeight: '400',
            lineHeight: 16,
        },
        button: {
            fontSize: 16,
            fontWeight: '600',
            letterSpacing: 0.25,
        },
    },

    // Spacing
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },

    // Border Radius
    borderRadius: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
        full: 999,
    },

    // Shadows
    shadows: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', // Web
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', // Web
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
            boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.3)', // Web
        },
        glow: {
            shadowColor: '#7F5AF0',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 8,
            boxShadow: '0px 0px 16px rgba(127, 90, 240, 0.4)', // Web
        },
        card: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', // Web
        },
        inner: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
            boxShadow: 'inset 0px 2px 4px rgba(0, 0, 0, 0.05)', // Web (inset supported on web)
        },
    },

    // Animations
    animations: {
        fast: 150,
        normal: 300,
        slow: 500,
    },
};

// Common styles
export const commonStyles = {
    // Card Styles
    card: {
        backgroundColor: theme.colors.surface.container,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        ...theme.shadows.md,
    },

    // Button Styles
    buttonPrimary: {
        backgroundColor: theme.colors.primary.main,
        borderRadius: theme.borderRadius.full,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        ...theme.shadows.sm,
    },

    // Input Styles
    input: {
        backgroundColor: theme.colors.surface.containerHigh,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.surface.containerHigh,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        color: theme.colors.text.primary,
    },

    // Container
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    // Screen Wrapper
    screenWrapper: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
};