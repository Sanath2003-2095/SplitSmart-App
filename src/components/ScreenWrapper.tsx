import React from 'react';
import { StatusBar, View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../services/theme';

interface ScreenWrapperProps {
    children: React.ReactNode;
    style?: ViewStyle;
    bg?: string;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
    children,
    style,
    bg = theme.colors.background
}) => {
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <View style={[styles.content, style]}>
                {children}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
});

export default ScreenWrapper;
