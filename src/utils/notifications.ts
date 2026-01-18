import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            Alert.alert('Debug', 'Permission not granted: ' + finalStatus);
            return;
        }

        // Get the token from Expo
        try {
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ??
                Constants?.easConfig?.projectId;

            if (!projectId) {
                console.warn('No projectId found in Expo config.');
            }

            token = (await Notifications.getExpoPushTokenAsync({
                ...(projectId ? { projectId } : {}),
            })).data;
            console.log('Successfully generated push token');
        } catch (e: any) {
            console.error('Error getting push token:', e);
            Alert.alert('Push Token Error', e.message || 'Unknown error');
        }
    } else {
        Alert.alert('Debug', 'Not a physical device (Device.isDevice is false)');
    }

    return token;
}

export async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: any) {
    const message = {
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data || { type: 'general' },
        priority: 'high',
        badge: 1,
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Push notification send result:', JSON.stringify(result));
    return result;
}
