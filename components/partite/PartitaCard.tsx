import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { InterText } from '@/components/InterText';

type Props = {
    fischioInizio: string | null;
    squadraCasa: string | null;
    squadraOspite: string | null;
    squadraCasaAcronimo?: string | null;
    squadraOspiteAcronimo?: string | null;
    squadraCasaStemma?: string | null;
    squadraOspiteStemma?: string | null;
    squadraCasaColore?: string | null;
    squadraOspiteColore?: string | null;
    goalCasa: number | null;
    goalOspite: number | null;
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

function formatTime(value: string | null) {
    if (!value) return 'vs';

    const date = new Date(value);
    if (isNaN(date.getTime())) return 'vs';

    return new Intl.DateTimeFormat('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function formatStatus(value: string | null, isPlayed: boolean) {
    if (isPlayed) return 'Risultato';
    if (!value) return 'Da programmare';

    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Da programmare';

    const diffMinutes = Math.round((date.getTime() - Date.now()) / 60000);
    if (diffMinutes > 0 && diffMinutes < 60) return `Tra ${diffMinutes} minuti`;
    if (diffMinutes >= 60 && diffMinutes < 24 * 60) {
        const hours = Math.round(diffMinutes / 60);
        return `Tra ${hours} ${hours === 1 ? 'ora' : 'ore'}`;
    }

    return formatDateTime(value);
}

function formatScore(goalCasa: number | null, goalOspite: number | null) {
    if (goalCasa === null || goalOspite === null) return 'Da giocare';

    return `${goalCasa} - ${goalOspite}`;
}

export default function PartitaCard({
    fischioInizio,
    squadraCasa,
    squadraOspite,
    squadraCasaAcronimo,
    squadraOspiteAcronimo,
    squadraCasaStemma,
    squadraOspiteStemma,
    squadraCasaColore,
    squadraOspiteColore,
    goalCasa,
    goalOspite,
    categoria,
    fase,
    girone,
}: Props) {
    const score = formatScore(goalCasa, goalOspite);
    const isPlayed = goalCasa !== null && goalOspite !== null;
    const primaryValue = isPlayed ? score : formatTime(fischioInizio);
    const status = formatStatus(fischioInizio, isPlayed);
    const leftMeta = [fase, categoria].filter(Boolean).join(' · ');
    const gironeLabel = girone ? `Girone ${girone}` : null;

    return (
        <View style={styles.card}>
            <View style={styles.metaRow}>
                <InterText style={styles.phaseText} numberOfLines={1}>
                    {leftMeta || 'Partita'}
                </InterText>
                <View style={[styles.statusPill, isPlayed && styles.statusPillPlayed]}>
                    <InterText style={[styles.statusText, isPlayed && styles.statusTextPlayed]}>
                        {status}
                    </InterText>
                </View>
                <InterText style={styles.groupText} numberOfLines={1}>
                    {gironeLabel ?? 'Girone -'}
                </InterText>
            </View>

            <View style={styles.matchRow}>
                <View style={styles.teamColumn}>
                    <TeamBadge
                        name={squadraCasa}
                        acronym={squadraCasaAcronimo}
                        logo={squadraCasaStemma}
                        color={squadraCasaColore}
                    />
                    <InterText style={styles.teamName} numberOfLines={2}>
                        {squadraCasa ?? 'Squadra casa'}
                    </InterText>
                </View>

                <View style={[styles.scoreBox, isPlayed && styles.scoreBoxPlayed]}>
                    <InterText
                        style={[
                            styles.scoreText,
                            isPlayed && styles.scoreTextPlayed,
                            !isPlayed && styles.scoreTextScheduled,
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit>
                        {primaryValue}
                    </InterText>
                </View>

                <View style={styles.teamColumn}>
                    <TeamBadge
                        name={squadraOspite}
                        acronym={squadraOspiteAcronimo}
                        logo={squadraOspiteStemma}
                        color={squadraOspiteColore}
                    />
                    <InterText style={styles.teamName} numberOfLines={2}>
                        {squadraOspite ?? 'Squadra ospite'}
                    </InterText>
                </View>
            </View>

            {!isPlayed && (
                <InterText style={styles.dateText} numberOfLines={1}>
                    {formatDateTime(fischioInizio)}
                </InterText>
            )}
        </View>
    );
}

function TeamBadge({
    name,
    acronym,
    logo,
    color,
}: {
    name: string | null;
    acronym?: string | null;
    logo?: string | null;
    color?: string | null;
}) {
    const fallback = acronym || name?.slice(0, 3).toUpperCase() || 'TCT';

    return (
        <View style={[styles.logoBox, { backgroundColor: color ?? '#f1f5f9' }]}>
            {logo ? (
                <Image source={{ uri: logo }} style={styles.logo} resizeMode="contain" />
            ) : (
                <InterText style={styles.logoFallback} numberOfLines={1}>
                    {fallback}
                </InterText>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 13,
        gap: 11,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    phaseText: {
        flex: 1,
        color: '#64748b',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
    },
    statusPill: {
        maxWidth: 132,
        borderRadius: 999,
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    statusPillPlayed: {
        backgroundColor: '#fee2e2',
    },
    statusText: {
        color: '#64748b',
        fontFamily: 'Inter-SemiBold',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    statusTextPlayed: {
        color: '#991b1b',
    },
    groupText: {
        flex: 1,
        color: '#64748b',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'right',
    },
    matchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    teamColumn: {
        flex: 1,
        minWidth: 72,
        alignItems: 'center',
        gap: 6,
    },
    logoBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    logo: {
        width: 36,
        height: 36,
    },
    logoFallback: {
        color: '#64748b',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
    },
    teamName: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 12,
        fontWeight: '700',
        minHeight: 32,
        textAlign: 'center',
        lineHeight: 16,
    },
    scoreBox: {
        minWidth: 66,
        maxWidth: 86,
        minHeight: 42,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    scoreBoxPlayed: {
        backgroundColor: '#0f172a',
        borderColor: '#0f172a',
    },
    scoreText: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    scoreTextPlayed: {
        color: '#ffffff',
    },
    scoreTextScheduled: {
        color: '#0f172a',
        fontSize: 16,
    },
    dateText: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 12,
        textAlign: 'center',
    },
});
