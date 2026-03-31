import './global.css';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { ActivityIndicator, View, LogBox } from 'react-native';
import * as Notifications from 'expo-notifications';

// Ignore web-specific warnings that don't affect mobile
LogBox.ignoreLogs([
  'Invalid DOM property',
  'props.pointerEvents is deprecated',
  'Blocked aria-hidden',
]);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Screens
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import RecurringExpensesScreen from './src/screens/RecurringExpensesScreen';
import UPIPaymentScreen from './src/screens/UPIPaymentScreen';
import { checkAndProcessRecurringExpenses } from './src/services/recurring';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        checkAndProcessRecurringExpenses();
      }
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          presentation: 'card',
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="RecurringExpenses" component={RecurringExpensesScreen} />
            <Stack.Screen name="UPIPayment" component={UPIPaymentScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
