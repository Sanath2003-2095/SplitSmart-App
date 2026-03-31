import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientCardProps {
    colors?: readonly [string, string, ...string[]];
    className?: string;
    children: React.ReactNode;
    style?: ViewStyle;
}

const GradientCard: React.FC<GradientCardProps> = ({
    colors = ['#4F46E5', '#7C3AED'], // Indigo to Violet default
    className = "",
    children,
    style
}) => {
    return (
        <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className={`rounded-2xl p-6 shadow-lg ${className}`}
            style={style}
        >
            {children}
        </LinearGradient>
    );
};

export default GradientCard;
