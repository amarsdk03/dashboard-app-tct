import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
    buildMatchReminderNotificationContent,
    getReminderDate,
} from '@/lib/notification-utils';

const MATCH_REMINDER_CHANNEL_ID = 'match-reminders';
const MATCH_REMINDER_DATA_TYPE = 'match-reminder-30';
const REMINDER_MINUTES_BEFORE = 30;

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

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export function supportsLocalNotifications() {
    return Platform.OS === 'ios' || Platform.OS === 'android';
}

export async function configureNotificationChannel() {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync(MATCH_REMINDER_CHANNEL_ID, {
        name: 'Promemoria partite',
        importance: Notifications.AndroidImportance.DEFAULT,
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

    const permissions = await Notifications.getPermissionsAsync();

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
        description: 'Consenti le notifiche per ricevere il promemoria 30 minuti prima.',
    };
}

export async function requestNotificationPermission() {
    if (!supportsLocalNotifications()) {
        return getNotificationPermissionStatus();
    }

    await configureNotificationChannel();
    await Notifications.requestPermissionsAsync();
    return getNotificationPermissionStatus();
}

async function clearScheduledMatchReminders() {
    if (!supportsLocalNotifications()) return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
        scheduled
            .filter((notification) => notification.content.data?.type === MATCH_REMINDER_DATA_TYPE)
            .map((notification) =>
                Notifications.cancelScheduledNotificationAsync(notification.identifier)
            )
    );
}

export async function scheduleUpcomingMatchReminders(matches: MatchReminderInput[], now = new Date()) {
    if (!supportsLocalNotifications()) return 0;

    const permission = await getNotificationPermissionStatus();
    if (!permission.granted) return 0;

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

        await Notifications.scheduleNotificationAsync({
            content: {
                ...content,
                data: {
                    type: MATCH_REMINDER_DATA_TYPE,
                    idPartita: match.idPartita,
                },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: reminderDate,
                channelId: MATCH_REMINDER_CHANNEL_ID,
            },
        });

        scheduledCount += 1;
    }

    return scheduledCount;
}
