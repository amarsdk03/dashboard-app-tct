import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { buildMatchReminderNotificationContent, getReminderDate } from '@/lib/notification-utils';

const MATCH_REMINDER_CHANNEL_ID = 'match-reminders';
const MATCH_REMINDER_DATA_TYPE = 'match-reminder-15';
const REMINDER_MINUTES_BEFORE = 15;

export type MatchReminderInput = {
    idPartita: number | null;
    fischioInizio: string | null;
    squadraCasa: string | null;
    squadraOspite: string | null;
};

export type NotificationPermissionStatus = {
    granted: boolean;
    title: string;
    description: string;
};

// expo-notifications remote push was removed from Expo Go in SDK 53.
// Guard every call behind this check so the module doesn't crash at import time.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Lazy-load the module so the top-level setNotificationHandler() call
// inside expo-notifications never runs in Expo Go.
const getNotifications = (() => {
    let mod: typeof import('expo-notifications') | null = null;
    return () => {
        if (isExpoGo) return null;
        if (!mod) mod = require('expo-notifications');
        return mod;
    };
})();

// Set the handler once, guarded
const N = getNotifications();
if (N) {
    N.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: !__DEV__,
            shouldShowList: !__DEV__,
            shouldPlaySound: !__DEV__,
            shouldSetBadge: false,
        }),
    });
}

export function supportsLocalNotifications() {
    return !isExpoGo && (Platform.OS === 'ios' || Platform.OS === 'android');
}

export async function configureNotificationChannel() {
    const N = getNotifications();
    if (!N || Platform.OS !== 'android') return;

    await N.setNotificationChannelAsync(MATCH_REMINDER_CHANNEL_ID, {
        name: 'Promemoria partite',
        importance: N.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#b98e6b',
    });
}

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
    if (!supportsLocalNotifications()) {
        return {
            granted: false,
            title: 'Non disponibili',
            description: 'Le notifiche locali sono disponibili solo su iOS e Android.',
        };
    }

    const N = getNotifications()!;
    const permissions = await N.getPermissionsAsync();

    if (permissions.granted) {
        return {
            granted: true,
            title: 'Consentite',
            description: 'Promemoria locali attivi per le partite imminenti.',
        };
    }

    if (permissions.status === 'denied') {
        return {
            granted: false,
            title: 'Negate',
            description: 'Abilita le notifiche dalle impostazioni del dispositivo.',
        };
    }

    return {
        granted: false,
        title: 'Non richieste',
        description: 'Consenti le notifiche per ricevere il promemoria 15 minuti prima.',
    };
}

export async function requestNotificationPermission() {
    if (!supportsLocalNotifications()) {
        return getNotificationPermissionStatus();
    }

    await configureNotificationChannel();
    const N = getNotifications()!;
    await N.requestPermissionsAsync();
    return getNotificationPermissionStatus();
}

async function clearScheduledMatchReminders() {
    const N = getNotifications();
    if (!N || !supportsLocalNotifications()) return;

    const scheduled = await N.getAllScheduledNotificationsAsync();
    await Promise.all(
        scheduled
            .filter((n) => n.content.data?.type === MATCH_REMINDER_DATA_TYPE)
            .map((n) => N.cancelScheduledNotificationAsync(n.identifier))
    );
}

export async function scheduleUpcomingMatchReminders(
    matches: MatchReminderInput[],
    now = new Date()
) {
    if (!supportsLocalNotifications()) return 0;

    const permission = await getNotificationPermissionStatus();
    if (!permission.granted) return 0;

    const N = getNotifications()!;
    await configureNotificationChannel();
    await clearScheduledMatchReminders();

    let scheduledCount = 0;

    for (const match of matches) {
        const reminderDate = getReminderDate(match.fischioInizio, REMINDER_MINUTES_BEFORE);
        if (!reminderDate || reminderDate <= now) continue;

        const content = buildMatchReminderNotificationContent({
            squadraCasa: match.squadraCasa,
            squadraOspite: match.squadraOspite,
            fischioInizio: match.fischioInizio,
        });

        await N.scheduleNotificationAsync({
            content: {
                ...content,
                data: {
                    type: MATCH_REMINDER_DATA_TYPE,
                    idPartita: match.idPartita,
                },
            },
            trigger: {
                type: N.SchedulableTriggerInputTypes.DATE,
                date: reminderDate,
                channelId: MATCH_REMINDER_CHANNEL_ID,
            },
        });

        scheduledCount += 1;
    }

    return scheduledCount;
}
