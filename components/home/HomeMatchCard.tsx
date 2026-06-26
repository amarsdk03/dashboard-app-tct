import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { InterText } from '@/components/generic/InterText';
import { CircleIcon } from 'lucide-react-native';
import LiveCircle from '@/components/generic/LiveCircle';

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
        day: 'numeric',
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

function formatStatus(value: string | null, isPlayed: boolean, isLive: boolean) {
    if (isLive) return 'In corso';
    if (isPlayed) return 'Terminata';
    if (!value) return 'Da programmare';

    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Da programmare';

    const diffMinutes = Math.round((date.getTime() - Date.now()) / 60000);

    if (diffMinutes <= 0) {
        return 'Da programmare';
    } else if (diffMinutes < 60) {
        return `Tra ${diffMinutes} minut${diffMinutes === 1 ? 'o' : 'i'}`;
    } else if (diffMinutes < 24 * 60) {
        const hours = Math.round(diffMinutes / 60);
        return `Tra ${hours} ${hours === 1 ? 'ora' : 'ore'}`;
    } else if (diffMinutes < 7 * 24 * 60) {
        const days = Math.round(diffMinutes / (24 * 60));
        return `Tra ${days} ${days === 1 ? 'giorno' : 'giorni'}`;
    } else if (diffMinutes < 30 * 24 * 60) {
        const weeks = Math.round(diffMinutes / (7 * 24 * 60));
        return `Tra ${weeks} ${weeks === 1 ? 'settimana' : 'settimane'}`;
    } else if (diffMinutes < 365 * 24 * 60) {
        const months = Math.round(diffMinutes / (30 * 24 * 60));
        return `Tra ${months} ${months === 1 ? 'mese' : 'mesi'}`;
    } else {
        return 'Tra 1+ anno';
    }
}

function formatScore(goalCasa: number | null, goalOspite: number | null) {
    if (goalCasa === null || goalOspite === null) return 'Da giocare';

    return `${goalCasa} - ${goalOspite}`;
}

export default function HomeMatchCard({
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
    const { isPlayed, isLive } = React.useMemo(() => {
        if (!fischioInizio) return { isPlayed: false, isLive: false };

        const matchDate = new Date(fischioInizio);
        if (isNaN(matchDate.getTime())) return { isPlayed: false, isLive: false };

        const diffMs = Date.now() - matchDate.getTime();
        const diffMinutes = diffMs / 60_000;

        const isLive = diffMinutes >= 0 && diffMinutes < 90;
        const isPlayed = diffMinutes >= 90;

        return { isPlayed, isLive };
    }, [fischioInizio]);

    const score = formatScore(goalCasa, goalOspite);
    const primaryValue = isPlayed ? score : isLive ? score : 'In arrivo';
    const status = formatStatus(fischioInizio, isPlayed, isLive);

    const gironeLabel = girone || null;
    const leftMeta = [categoria, gironeLabel].filter(Boolean).join(' - ');

    return (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <InterText style={styles.phaseText} numberOfLines={1}>
                    {leftMeta || 'Partita'}
                </InterText>
                <View
                    style={[
                        styles.statusPill,
                        isPlayed && styles.statusPillPlayed,
                        isLive && styles.statusPillLive,
                        isLive && { flexDirection: 'row', alignItems: 'center' },
                    ]}>
                    {isLive && <LiveCircle />}
                    <InterText
                        style={[
                            styles.statusText,
                            isPlayed && styles.statusTextPlayed,
                            isLive && styles.statusTextLive,
                        ]}>
                        {status}
                    </InterText>
                </View>
                <InterText style={styles.groupText} numberOfLines={1}>
                    {fase ?? 'Girone -'}
                </InterText>
            </View>

            <View style={styles.cardRow}>
                <TeamBadge
                    name={squadraCasa}
                    acronym={squadraCasaAcronimo}
                    logo={squadraCasaStemma}
                    color={squadraCasaColore}
                />

                <View style={[styles.scoreBox, isPlayed && styles.scoreBoxPlayed]}>
                    <InterText
                        style={[
                            styles.scoreText,
                            isPlayed && styles.scoreTextPlayed,
                            !isPlayed && !isLive && styles.scoreTextScheduled,
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit>
                        {primaryValue}
                    </InterText>
                </View>

                <TeamBadge
                    name={squadraOspite}
                    acronym={squadraOspiteAcronimo}
                    logo={squadraOspiteStemma}
                    color={squadraOspiteColore}
                />
            </View>
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
    const fallback = acronym || name?.slice(0, 3).toUpperCase() || '???';

    return (
        <View style={[styles.logoBox, { backgroundColor: logo && color ? color : '#f1f5f9' }]}>
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
        padding: 12,
        gap: 12,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        gap: 8,
    },
    teamNamesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        paddingTop: 8,
        paddingBottom: 16,
    },
    phaseText: {
        flex: 1,
        color: '#64748b',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
    },
    statusPillLive: {
        backgroundColor: '#ffeded',
    },
    statusTextLive: {
        color: '#994d4d',
    },
    statusPill: {
        maxWidth: 132,
        borderRadius: 999,
        backgroundColor: '#fff2d9',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    statusPillPlayed: {
        backgroundColor: '#f1f5f9',
    },
    statusText: {
        color: '#8c8370',
        fontFamily: 'Inter-SemiBold',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    statusTextPlayed: {
        color: '#64748b',
    },
    groupText: {
        flex: 1,
        color: '#64748b',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'right',
    },
    teamColumn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 6,
    },
    logoBox: {
        width: 44,
        height: 44,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    logo: {
        width: 44,
        height: 44,
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
        lineHeight: 16,
    },
    teamNameLeft: {
        textAlign: 'left',
    },
    teamNameRight: {
        right: 0,
        textAlign: 'right',
    },
    scoreBox: {
        minWidth: 66,
        maxWidth: 86,
        minHeight: 42,
        marginTop: 1,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderColor: '#fff',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    scoreBoxPlayed: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    scoreText: {
        color: '#404040',
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
    },
    scoreTextPlayed: {
        color: '#404040',
    },
    scoreTextScheduled: {
        color: '#0f172a',
        fontSize: 16,
    },
    dateText: {
        position: 'absolute',
        left: 0,
        right: 0,
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 12,
        textAlign: 'center',
    },
});
