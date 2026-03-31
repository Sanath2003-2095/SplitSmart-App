import React from 'react';
import { View, Text } from 'react-native';

const StyleTest = () => {
    return (
        <View className="flex-1 justify-center items-center bg-blue-500">
            <Text className="text-white text-4xl font-bold">
                Tailwind is Working!
            </Text>
            <View className="w-32 h-32 bg-red-500 mt-4 rounded-full" />
        </View>
    );
};

export default StyleTest;
