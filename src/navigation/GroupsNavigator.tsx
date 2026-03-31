import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GroupsScreen from '../screens/GroupsScreen';
import GroupDetailsScreen from '../screens/GroupDetailsScreen';
import OCRScreen from '../screens/OCRScreen';
import SplitBillScreen from '../screens/SplitBillScreen';

import QRScannerScreen from '../screens/QRScannerScreen';

const Stack = createNativeStackNavigator();

const GroupsNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="GroupsList"
                component={GroupsScreen}
            />
            <Stack.Screen
                name="GroupDetails"
                component={GroupDetailsScreen}
            />
            <Stack.Screen
                name="OCR"
                component={OCRScreen}
            />
            <Stack.Screen name="SplitBill" component={SplitBillScreen} />
            <Stack.Screen name="QRScanner" component={QRScannerScreen} />
        </Stack.Navigator>
    );
};

export default GroupsNavigator;
