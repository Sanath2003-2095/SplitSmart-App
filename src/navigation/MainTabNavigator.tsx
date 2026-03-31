import React from 'react';
import { View, TouchableOpacity, Text, Platform, StyleSheet, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HomeScreen from '../screens/HomeScreen';
import GroupsNavigator from './GroupsNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import { theme } from '../services/theme';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    return (
        <View style={styles.tabBarContainer}>
            <View style={styles.tabBar}>
                {state.routes.map((route: any, index: any) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    // Special handling for the middle "Scan" button
                    if (route.name === 'Scan') {
                        return (
                            <View key={index} style={styles.addButtonContainer}>
                                <TouchableOpacity
                                    onPress={onPress}
                                    activeOpacity={0.9}
                                    style={styles.addButtonWrapper}
                                >
                                    <LinearGradient
                                        colors={theme.colors.gradients.primary as [string, string, ...string[]]}
                                        style={styles.addButton}
                                    >
                                        <Ionicons name="scan" size={32} color="white" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        );
                    }

                    let iconName: any;
                    let label: string = '';

                    if (route.name === 'Dashboard') {
                        iconName = isFocused ? 'home' : 'home-outline';
                        label = 'Home';
                    } else if (route.name === 'GroupsTab') {
                        iconName = isFocused ? 'people' : 'people-outline';
                        label = 'Groups';
                    } else if (route.name === 'Profile') {
                        iconName = isFocused ? 'person' : 'person-outline';
                        label = 'Profile';
                    }

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={onPress}
                            style={styles.tabItem}
                        >
                            <View style={[
                                styles.iconContainer,
                                isFocused && styles.iconContainerFocused
                            ]}>
                                <Ionicons
                                    name={iconName}
                                    size={24}
                                    color={isFocused ? theme.colors.primary.main : theme.colors.text.disabled}
                                />
                            </View>
                            {isFocused && (
                                <Text style={styles.tabLabel}>
                                    {label}
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

// Placeholder for the Scan action
const ScanPlaceholder = () => <View />;

const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                }
            }}
        >
            <Tab.Screen name="Dashboard" component={HomeScreen} />
            <Tab.Screen
                name="Scan"
                component={ScanPlaceholder}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        // Navigate to Groups -> OCR
                        navigation.navigate('GroupsTab', {
                            screen: 'OCR',
                            params: { fromHome: true }
                        });
                    },
                })}
            />
            <Tab.Screen
                name="GroupsTab"
                component={GroupsNavigator}
                options={{ title: 'Groups' }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        navigation.navigate('GroupsTab', { screen: 'GroupsList' });
                    },
                })}
            />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 24 : 16,
        left: 16,
        right: 16,
        alignItems: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface.main,
        borderRadius: theme.borderRadius.xxl,
        height: 72,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        width: '100%',
        maxWidth: 500, // Limit width on tablets/web
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        ...theme.shadows.card,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    iconContainer: {
        padding: 8,
        borderRadius: theme.borderRadius.md,
        backgroundColor: 'transparent',
    },
    iconContainerFocused: {
        backgroundColor: theme.colors.primary.container,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: theme.colors.primary.main,
        marginTop: 2,
    },
    addButtonContainer: {
        top: -24,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    addButtonWrapper: {
        borderRadius: theme.borderRadius.full,
        backgroundColor: 'transparent',
        ...theme.shadows.glow,
    },
    addButton: {
        width: 64,
        height: 64,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: theme.colors.surface.main,
    },
});

export default MainTabNavigator;
