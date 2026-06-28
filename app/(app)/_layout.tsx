import { useRouter, Stack } from 'expo-router';
import { useAuthContext } from '@/hooks/use-auth-context';
import { useEffect } from 'react';

import { getListaPartite } from '@/data/partite';
import { scheduleUpcomingMatchReminders } from '@/lib/notifications';

export default function AppLayout() {
    const auth = useAuthContext();
    const router = useRouter();

    useEffect(() => {
        if (auth.isLoading) return;
        if (!auth.isLoggedIn) {
            router.replace('/login');
        }
    }, [auth.isLoggedIn, auth.isLoading]);

    // Don't render children until auth is resolved
    if (auth.isLoading) return null;
    // Don't flash protected content before redirect fires
    if (!auth.isLoggedIn) return null;

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
