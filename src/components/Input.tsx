import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../services/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    helperText?: string;
    containerStyle?: ViewStyle;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
    label,
    value,
    error,
    helperText,
    containerStyle,
    leftIcon,
    rightIcon,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={[
                    styles.label,
                    error ? styles.labelError : isFocused ? styles.labelFocused : null
                ]}>
                    {label}
                </Text>
            )}

            <View style={[
                styles.inputContainer,
                error ? styles.inputContainerError : isFocused ? styles.inputContainerFocused : null
            ]}>
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

                <TextInput
                    {...props}
                    value={value}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={styles.input}
                    placeholderTextColor={theme.colors.text.disabled}
                />

                {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
            </View>

            {(error || helperText) && (
                <Text style={[styles.helperText, error ? styles.helperTextError : null]}>
                    {error || helperText}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: theme.spacing.xs,
        marginLeft: theme.spacing.xs,
        color: theme.colors.text.secondary,
    },
    labelFocused: {
        color: theme.colors.primary.main,
    },
    labelError: {
        color: theme.colors.error.main,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: theme.borderRadius.lg,
        height: 56,
        backgroundColor: theme.colors.surface.containerHigh,
        borderWidth: 1,
        borderColor: 'transparent',
        paddingHorizontal: theme.spacing.md,
    },
    inputContainerFocused: {
        borderColor: theme.colors.primary.main,
        backgroundColor: theme.colors.surface.main,
    },
    inputContainerError: {
        borderColor: theme.colors.error.main,
        backgroundColor: 'rgba(239, 69, 101, 0.1)',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text.primary,
        height: '100%',
    },
    leftIcon: {
        marginRight: theme.spacing.md,
    },
    rightIcon: {
        marginLeft: theme.spacing.md,
    },
    helperText: {
        fontSize: 12,
        marginTop: 6,
        marginLeft: theme.spacing.xs,
        color: theme.colors.text.secondary,
    },
    helperTextError: {
        color: theme.colors.error.main,
    },
});

export default Input;
