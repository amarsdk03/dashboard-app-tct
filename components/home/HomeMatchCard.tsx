import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CalendarDaysIcon } from 'lucide-react-native';
import { InterText } from '@/components/generic/InterText';

type Props = {
    fase: string | null;
    categoria: string | null;
    girone: string | null;
    fischioInizio: string | null;
    squadraCasa: string | null;
    squadraOspite: string | null;
    goalCasa: number | null;
    goalOspite: number | null;
};

function formatTime(value: string | null) {
    if (!value) return 'Da definire';

    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Da definire';

    return new Intl.DateTimeFormat('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function formatResult(goalCasa: number | null, goalOspite: number | null) {
    if (goalCasa === null || goalOspite === null) return null;
    return `${goalCasa} - ${goalOspite}`;
}

export default function HomeMatchCard({
    fase,
    categoria,
    girone,
    fischioInizio,
    squadraCasa,
    squadraOspite,
    goalCasa,
    goalOspite,
}: Props) {
    const meta = [categoria, fase, girone ? `Girone ${girone}` : null]
        .filter(Boolean)
        .join(' · ');
    const result = formatResult(goalCasa, goalOspite);

    return (
        <View style={styles.card}>
            <View style={styles.metaRow}>
                <View style={styles.timePill}>
                    <CalendarDaysIcon size={15} color="#b3642c" />
                    <InterText style={styles.timeText}>{formatTime(fischioInizio)}</InterText>
                </View>
                {meta.length > 0 && (
                    <InterText style={styles.metaText} numberOfLines={1}>
                        {meta}
                    </InterText>
                )}
            </View>

            <View style={styles.matchRow}>
                <InterText style={styles.teamName} numberOfLines={1}>
                    {squadraCasa ?? 'Squadra casa'}
                </InterText>

                <View style={[styles.scoreBox, result && styles.scoreBoxPlayed]}>
                    <InterText style={[styles.scoreText, result && styles.scoreTextPlayed]}>
                        {result ?? 'vs'}
                    </InterText>
                </View>

                <InterText style={styles.teamName} numberOfLines={1}>
                    {squadraOspite ?? 'Squadra ospite'}
                </InterText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 14,
        gap: 14,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    timePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        backgroundColor: '#fff7ed',
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    timeText: {
        color: '#9a3412',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
    },
    metaText: {
        flex: 1,
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 12,
    },
    matchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    teamName: {
        flex: 1,
        minWidth: 0,
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
    scoreBox: {
        minWidth: 54,
        minHeight: 38,
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
        fontSize: 13,
        fontWeight: '600',
    },
    scoreTextPlayed: {
        color: '#ffffff',
    },
});
