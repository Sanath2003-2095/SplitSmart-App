import React, { useRef } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, Animated, Pressable, Platform, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../services/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    variant?: 'filled' | 'outlined' | 'text' | 'tonal' | 'elevated' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'filled',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    style,
    fullWidth = true,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    };

    const getContainerStyle = (): ViewStyle => {
        let baseStyle: ViewStyle = {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.borderRadius.lg,
            height: 56,
            paddingHorizontal: theme.spacing.xl,
        };

        if (size === 'sm') {
            baseStyle.height = 40;
            baseStyle.paddingHorizontal = theme.spacing.md;
        } else if (size === 'lg') {
            baseStyle.height = 64;
            baseStyle.paddingHorizontal = theme.spacing.xxl;
        }

        if (!fullWidth) {
            baseStyle.alignSelf = 'flex-start';
        }

        if (disabled) {
            return { ...baseStyle, backgroundColor: theme.colors.surface.containerHigh, opacity: 0.5 };
        }

        switch (variant) {
            case 'filled':
                // Gradient handled separately
                return { ...baseStyle, ...theme.shadows.glow };
            case 'outlined':
                return { ...baseStyle, backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.colors.primary.main };
            case 'text':
                return { ...baseStyle, backgroundColor: 'transparent', height: 'auto', paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.sm };
            case 'tonal':
                return { ...baseStyle, backgroundColor: theme.colors.secondary.container };
            case 'elevated':
                return { ...baseStyle, backgroundColor: theme.colors.surface.main, ...theme.shadows.md };
            case 'danger':
                return { ...baseStyle, backgroundColor: theme.colors.error.main, ...theme.shadows.sm };
            default:
                return { ...baseStyle, backgroundColor: theme.colors.primary.main };
        }
    };

    const getTextStyle = (): TextStyle => {
        if (disabled) return { color: theme.colors.text.disabled, fontWeight: '500' };

        let baseStyle: TextStyle = {
            fontSize: 18,
            fontWeight: 'bold',
            letterSpacing: 0.5,
        };

        if (size === 'sm') baseStyle.fontSize = 14;
        if (size === 'lg') baseStyle.fontSize = 20;

        switch (variant) {
            case 'filled':
                return { ...baseStyle, color: theme.colors.text.onPrimary };
            case 'outlined':
                return { ...baseStyle, color: theme.colors.primary.main };
            case 'text':
                return { ...baseStyle, color: theme.colors.primary.main, fontWeight: '600' };
            case 'tonal':
                return { ...baseStyle, color: theme.colors.secondary.dark };
            case 'elevated':
                return { ...baseStyle, color: theme.colors.primary.main };
            case 'danger':
                return { ...baseStyle, color: theme.colors.text.onPrimary };
            default:
                return { ...baseStyle, color: theme.colors.text.onPrimary };
        }
    };

    const Content = () => (
        <>
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outlined' || variant === 'text' ? theme.colors.primary.main : theme.colors.text.onPrimary}
                    size="small"
                />
            ) : (
                <>
                    {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
                    <Text style={getTextStyle()}>
                        {title}
                    </Text>
                </>
            )}
        </>
    );

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            style={style}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                {variant === 'filled' && !disabled ? (
                    <LinearGradient
                        colors={theme.colors.gradients.primary as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={getContainerStyle()}
                    >
                        <Content />
                    </LinearGradient>
                ) : (
                    <View style={getContainerStyle()}>
                        <Content />
                    </View>
                )}
            </Animated.View>
        </Pressable>
    );
};

export default Button;
