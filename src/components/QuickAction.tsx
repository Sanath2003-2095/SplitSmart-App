import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface QuickActionProps {
    title: string;
    subtitle?: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    gradientColors?: readonly [string, string, ...string[]];
}

const QuickAction: React.FC<QuickActionProps> = ({
    title,
    subtitle,
    icon,
    onPress,
    gradientColors = ['#F3F4F6', '#FFFFFF'] // Default subtle gradient
}) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="flex-1 mx-2 shadow-md rounded-2xl overflow-hidden"
            style={{ elevation: 4 }}
        >
            <LinearGradient
                colors={gradientColors}
                className="p-4 items-center justify-center h-32"
            >
                <View className="w-14 h-14 rounded-full bg-white/90 items-center justify-center mb-3 shadow-sm">
                    <Ionicons name={icon} size={28} color="#4F46E5" />
                </View>
                <Text className="text-gray-900 font-bold text-center text-sm">{title}</Text>
                {subtitle && <Text className="text-gray-500 text-xs text-center mt-1">{subtitle}</Text>}
            </LinearGradient>
        </TouchableOpacity>
    );
};

export default QuickAction;
