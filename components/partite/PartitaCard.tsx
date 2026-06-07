import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CalendarDaysIcon } from 'lucide-react-native';
import { InterText } from '@/components/InterText';

type Props = {
    fischioInizio: string | null;
    squadraCasa: string | null;
    squadraOspite: string | null;
    goalCasa: number | null;
    goalOspite: number | null;
    rigoriCasa: number | null;
    rigoriOspite: number | null;
    categoria: string | null;
    fase: string | null;
    girone: string | null;
};

function formatDateTime(value: string | null) {
    if (!value) return 'Data da definire';

    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Data da definire';

    return new Intl.DateTimeFormat('it-IT', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function formatScore(
    goalCasa: number | null,
    goalOspite: number | null,
    rigoriCasa: number | null,
    rigoriOspite: number | null,
) {
    if (goalCasa === null || goalOspite === null) return 'Da giocare';

    const score = `${goalCasa} - ${goalOspite}`;
    if (rigoriCasa !== null && rigoriOspite !== null) {
        return `${score} (${rigoriCasa}-${rigoriOspite} dcr)`;
    }

    return score;
}

export default function PartitaCard({
    fischioInizio,
    squadraCasa,
    squadraOspite,
    goalCasa,
    goalOspite,
    rigoriCasa,
    rigoriOspite,
    categoria,
    fase,
    girone,
}: Props) {
    const score = formatScore(goalCasa, goalOspite, rigoriCasa, rigoriOspite);
    const isPlayed = goalCasa !== null && goalOspite !== null;
    const meta = [categoria, fase, girone ? `Girone ${girone}` : null].filter(Boolean).join(' · ');

    return (
        <View style={styles.card}>
            <View style={styles.dateBox}>
                <CalendarDaysIcon size={18} color="#0f172a" />
                <InterText style={styles.dateText}>{formatDateTime(fischioInizio)}</InterText>
            </View>

            <View style={styles.matchRow}>
                <View style={styles.teams}>
                    <InterText style={styles.teamName} numberOfLines={1}>
                        {squadraCasa ?? 'Squadra casa'}
                    </InterText>
                    <InterText style={styles.teamName} numberOfLines={1}>
                        {squadraOspite ?? 'Squadra ospite'}
                    </InterText>
                </View>
                <View style={[styles.scoreBox, isPlayed && styles.scoreBoxPlayed]}>
                    <InterText style={[styles.scoreText, isPlayed && styles.scoreTextPlayed]}>
                        {score}
                    </InterText>
                </View>
            </View>

            {meta.length > 0 && (
                <InterText style={styles.meta} numberOfLines={1}>
                    {meta}
                </InterText>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 14,
        gap: 12,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    dateBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateText: {
        color: '#475569',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    matchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    teams: {
        flex: 1,
        minWidth: 0,
        gap: 6,
    },
    teamName: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 15,
        fontWeight: '700',
    },
    scoreBox: {
        minWidth: 92,
        minHeight: 40,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    scoreBoxPlayed: {
        backgroundColor: '#0f172a',
        borderColor: '#0f172a',
    },
    scoreText: {
        color: '#64748b',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    scoreTextPlayed: {
        color: '#ffffff',
    },
    meta: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 12,
    },
});
