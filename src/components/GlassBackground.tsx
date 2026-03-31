import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const GlassBackground = ({ children }: { children?: React.ReactNode }) => {
    return (
        <View style={styles.container}>
            {/* Deep Space Background */}
            <LinearGradient
                colors={['#0F0C29', '#302B63', '#24243E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Ambient Orbs */}
            <View style={[styles.orb, styles.orb1]} />
            <View style={[styles.orb, styles.orb2]} />
            <View style={[styles.orb, styles.orb3]} />

            {/* Content Overlay */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
        zIndex: 10,
    },
    orb: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.5,
        // Web compatibility for blur
        ...Platform.select({
            web: {
                filter: 'blur(80px)',
            },
            default: {}, // React Native doesn't support CSS filter directly on Views without libraries, 
            // but we can rely on opacity and layering or add an Image blur if needed. 
            // For now, simpler circles with opacity work well as "orbs" behind blur views.
        }),
    },
    orb1: {
        width: width * 0.8,
        height: width * 0.8,
        backgroundColor: '#7F00FF',
        top: -width * 0.2,
        left: -width * 0.2,
    },
    orb2: {
        width: width * 0.7,
        height: width * 0.7,
        backgroundColor: '#00D2FF',
        bottom: height * 0.1,
        right: -width * 0.2,
    },
    orb3: {
        width: width * 0.4,
        height: width * 0.4,
        backgroundColor: '#FF0080',
        top: height * 0.3,
        left: -width * 0.1,
        opacity: 0.3,
    }
});

export default GlassBackground;
