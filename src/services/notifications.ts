import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
    }

    // For local notifications, we don't strictly need the token, but good to have for future
    // token = (await Notifications.getExpoPushTokenAsync()).data;
    // console.log(token);

    return token;
};

export const scheduleReminder = async (title: string, body: string, seconds: number) => {
    if (Platform.OS === 'web') {
        console.log('Notifications not supported on web:', title, body);
        return;
    }
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds,
            repeats: false,
        },
    });
};

export const sendImmediateNotification = async (title: string, body: string) => {
    if (Platform.OS === 'web') {
        console.log('Notifications not supported on web:', title, body);
        return;
    }
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: true,
        },
        trigger: null, // Immediate
    });
};
