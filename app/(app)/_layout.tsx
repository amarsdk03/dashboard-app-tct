import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { getListaPartite } from '@/data/partite';
import { scheduleUpcomingMatchReminders } from '@/lib/notifications';

export default function AppLayout() {
    useEffect(() => {
        getListaPartite(null, { upcomingOnly: true })
            .then((partite) =>
                scheduleUpcomingMatchReminders(
                    partite.map((partita) => ({
                        idPartita: partita.id_partita,
                        fischioInizio: partita.fischio_inizio,
                        squadraCasa: partita.squadra_casa_nome,
                        squadraOspite: partita.squadra_ospite_nome,
                    }))
                )
            )
            .catch(() => null);
    }, []);

    // This renders the navigation stack for all authenticated app routes.
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            <Stack.Screen
                name="impostazioni"
                options={{
                    headerTitle: 'Impostazioni',
                }}
            />
        </Stack>
    );
}
