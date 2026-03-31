import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Dimensions, TextInput, TextStyle, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signIn } from '../services/auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// import Animated, { FadeInDown, FadeInUp, SlideInRight, SlideInLeft } from 'react-native-reanimated'; // DISABLED FOR EXPO GO
import { theme, commonStyles } from '../services/theme';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        setError('');
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={commonStyles.container}>
            {/* Animated Background */}
            <View
                style={{ position: 'absolute', width: '100%', height: '100%' }}
            >
                <LinearGradient
                    colors={['#0F0F1A', '#1A1A2E', '#242438']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1 }}
                />

                {/* Animated Background Elements */}
                <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
                    <View
                        style={{
                            position: 'absolute',
                            top: -100,
                            right: -100,
                        }}
                    >
                        <View style={{
                            width: 300,
                            height: 300,
                            borderRadius: 150,
                            backgroundColor: theme.colors.primary.main,
                            opacity: 0.1,
                        }} />
                    </View>
                    <View
                        style={{
                            position: 'absolute',
                            bottom: -150,
                            left: -100,
                        }}
                    >
                        <View style={{
                            width: 400,
                            height: 400,
                            borderRadius: 200,
                            backgroundColor: theme.colors.secondary.main,
                            opacity: 0.08,
                        }} />
                    </View>
                </View>
            </View>

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={{
                            flexGrow: 1,
                            justifyContent: 'center',
                            paddingBottom: theme.spacing.xl
                        }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={{ paddingHorizontal: theme.spacing.lg }}>
                            {/* Header Section */}
                            <View
                                style={{ alignItems: 'center', marginBottom: theme.spacing.xxl }}
                            >
                                {/* Logo/Icon Container */}
                                <View
                                    style={{
                                        width: 120,
                                        height: 120,
                                        backgroundColor: 'rgba(127, 90, 240, 0.15)',
                                        borderRadius: 30,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: theme.spacing.lg,
                                        borderWidth: 1,
                                        borderColor: 'rgba(127, 90, 240, 0.3)',
                                        ...theme.shadows.glow,
                                    }}
                                >
                                    <LinearGradient
                                        colors={theme.colors.gradients.primary as [string, string]}
                                        style={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: 20,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <Ionicons name="receipt" size={40} color="white" />
                                    </LinearGradient>
                                </View>

                                {/* Title */}
                                <Text
                                    style={{
                                        ...(theme.typography.h1 as TextStyle),
                                        color: theme.colors.text.primary,
                                        textAlign: 'center',
                                        marginBottom: theme.spacing.sm,
                                        textShadowColor: 'rgba(127, 90, 240, 0.3)',
                                        textShadowOffset: { width: 0, height: 2 },
                                        textShadowRadius: 10,
                                    }}
                                >
                                    Welcome Back
                                </Text>

                                <Text
                                    style={{
                                        ...(theme.typography.body2 as TextStyle),
                                        color: theme.colors.text.secondary,
                                        textAlign: 'center',
                                        maxWidth: 280,
                                    }}
                                >
                                    Sign in to continue managing your shared expenses
                                </Text>
                            </View>

                            {/* Form Section */}
                            <View
                                style={{
                                    backgroundColor: 'rgba(26, 26, 46, 0.8)',
                                    borderRadius: theme.borderRadius.xl,
                                    padding: theme.spacing.lg,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                    ...theme.shadows.lg,
                                }}
                            >
                                {/* Email Input */}
                                <View style={{ marginBottom: theme.spacing.md }}>
                                    <Text style={{
                                        ...(theme.typography.caption as TextStyle),
                                        color: theme.colors.text.secondary,
                                        marginBottom: theme.spacing.xs,
                                        marginLeft: theme.spacing.xs,
                                        fontWeight: '600',
                                    }}>
                                        EMAIL ADDRESS
                                    </Text>
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: 'rgba(36, 36, 56, 0.8)',
                                        borderRadius: theme.borderRadius.lg,
                                        borderWidth: 1,
                                        borderColor: 'rgba(127, 90, 240, 0.2)',
                                        paddingHorizontal: theme.spacing.md,
                                        height: 56,
                                    }}>
                                        <Ionicons name="mail-outline" size={22} color={theme.colors.text.secondary} />
                                        <TextInput
                                            style={{
                                                flex: 1,
                                                marginLeft: theme.spacing.md,
                                                ...(theme.typography.body1 as TextStyle),
                                                color: theme.colors.text.primary,
                                            }}
                                            value={email}
                                            onChangeText={setEmail}
                                            placeholder="name@example.com"
                                            placeholderTextColor={theme.colors.text.disabled}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>
                                </View>

                                {/* Password Input */}
                                <View style={{ marginBottom: theme.spacing.lg }}>
                                    <Text style={{
                                        ...(theme.typography.caption as TextStyle),
                                        color: theme.colors.text.secondary,
                                        marginBottom: theme.spacing.xs,
                                        marginLeft: theme.spacing.xs,
                                        fontWeight: '600',
                                    }}>
                                        PASSWORD
                                    </Text>
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: 'rgba(36, 36, 56, 0.8)',
                                        borderRadius: theme.borderRadius.lg,
                                        borderWidth: 1,
                                        borderColor: 'rgba(127, 90, 240, 0.2)',
                                        paddingHorizontal: theme.spacing.md,
                                        height: 56,
                                    }}>
                                        <Ionicons name="lock-closed-outline" size={22} color={theme.colors.text.secondary} />
                                        <TextInput
                                            style={{
                                                flex: 1,
                                                marginLeft: theme.spacing.md,
                                                ...(theme.typography.body1 as TextStyle),
                                                color: theme.colors.text.primary,
                                            }}
                                            value={password}
                                            onChangeText={setPassword}
                                            placeholder="Enter your password"
                                            placeholderTextColor={theme.colors.text.disabled}
                                            secureTextEntry={!showPassword}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={{ padding: theme.spacing.xs }}
                                        >
                                            <Ionicons
                                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                                size={22}
                                                color={theme.colors.text.secondary}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity
                                        style={{ alignSelf: 'flex-end', marginTop: theme.spacing.sm }}
                                    >
                                        <Text style={{
                                            ...(theme.typography.caption as TextStyle),
                                            color: theme.colors.primary.light,
                                            fontWeight: '600',
                                        }}>
                                            Forgot Password?
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Error Message */}
                                {error ? (
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: 'rgba(239, 69, 101, 0.15)',
                                            borderRadius: theme.borderRadius.md,
                                            borderWidth: 1,
                                            borderColor: 'rgba(239, 69, 101, 0.3)',
                                            padding: theme.spacing.md,
                                            marginBottom: theme.spacing.md,
                                        }}
                                    >
                                        <Ionicons name="alert-circle" size={20} color={theme.colors.error.main} />
                                        <Text style={{
                                            ...(theme.typography.body2 as TextStyle),
                                            color: theme.colors.text.primary,
                                            marginLeft: theme.spacing.sm,
                                            flex: 1,
                                        }}>
                                            {error}
                                        </Text>
                                    </View>
                                ) : null}

                                {/* Sign In Button */}
                                <TouchableOpacity
                                    onPress={handleLogin}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                    style={{
                                        height: 56,
                                        borderRadius: theme.borderRadius.lg,
                                        overflow: 'hidden',
                                        marginTop: theme.spacing.md,
                                        ...theme.shadows.md,
                                    }}
                                >
                                    <LinearGradient
                                        colors={theme.colors.gradients.primary as [string, string]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{
                                            flex: 1,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {loading ? (
                                            <Text style={{
                                                ...(theme.typography.button as TextStyle),
                                                color: theme.colors.text.primary,
                                            }}>
                                                SIGNING IN...
                                            </Text>
                                        ) : (
                                            <Text style={{
                                                ...(theme.typography.button as TextStyle),
                                                color: theme.colors.text.primary,
                                            }}>
                                                SIGN IN
                                            </Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Sign Up Link */}
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: theme.spacing.lg,
                                    paddingTop: theme.spacing.md,
                                    borderTopWidth: 1,
                                    borderTopColor: 'rgba(255, 255, 255, 0.1)',
                                }}>
                                    <Text style={{
                                        ...(theme.typography.body2 as TextStyle),
                                        color: theme.colors.text.secondary,
                                    }}>
                                        Don't have an account?{' '}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('Signup')}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={{
                                            ...(theme.typography.body2 as TextStyle),
                                            color: theme.colors.primary.light,
                                            fontWeight: '600',
                                        }}>
                                            Sign Up
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Social Login */}
                                <View style={{ marginTop: theme.spacing.lg }}>
                                    <Text style={{
                                        ...(theme.typography.caption as TextStyle),
                                        color: theme.colors.text.disabled,
                                        textAlign: 'center',
                                        marginBottom: theme.spacing.md,
                                    }}>
                                        Or continue with
                                    </Text>

                                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.md }}>
                                        {['logo-google', 'logo-apple', 'logo-facebook'].map((icon, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={{
                                                    width: 56,
                                                    height: 56,
                                                    backgroundColor: theme.colors.surface.containerHigh,
                                                    borderRadius: theme.borderRadius.md,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderWidth: 1,
                                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name={icon as any} size={24} color={theme.colors.text.secondary} />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

export default LoginScreen;