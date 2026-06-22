import React from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { MapPin, Calendar } from 'lucide-react-native';
import { InterText } from '@/components/generic/InterText';

interface TorneoCardProps {
    id: string | number;
    nomeTorneo: string;
    logoTorneo?: string | null;
    nomeCampo?: string | null;
    dataInizio?: string | Date | null;
    dataFine?: string | Date | null;
}

function formatDate(date?: string | Date | null): string | null {
    if (!date) return null;
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
    });
}

function buildDateRange(
    dataInizio?: string | Date | null,
    dataFine?: string | Date | null
): string | null {
    const start = formatDate(dataInizio);
    const end = formatDate(dataFine);

    if (!start && !end) return null;

    if (start && end) {
        const dFine = typeof dataFine === 'string' ? new Date(dataFine) : dataFine;
        const anno = dFine && !isNaN(dFine.getTime()) ? dFine.getFullYear() : '';

        return `${start} - ${end} ${anno}`.trim();
    }

    return start ?? end;
}

export default function TorneoCard({
    id,
    nomeTorneo,
    logoTorneo,
    nomeCampo,
    dataInizio,
    dataFine,
}: TorneoCardProps) {
    const dateRange = buildDateRange(dataInizio, dataFine);
    const logoFallback = require('@/assets/images/logo-eagle-only.png');
    const hasMeta = !!(nomeCampo || dateRange);

    return (
        <View style={styles.card}>
            <View style={styles.main}>
                <Image
                    source={logoTorneo ? { uri: logoTorneo } : logoFallback}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <View style={styles.header}>
                    <InterText style={styles.title} numberOfLines={2}>
                        {nomeTorneo}
                    </InterText>

                    {hasMeta && (
                        <View style={styles.metaRow}>
                            {dateRange && (
                                <View style={styles.metaItem}>
                                    <Calendar size={12} color={COLORS.icon} strokeWidth={1.75} />
                                    <InterText style={styles.metaText}>{dateRange}</InterText>
                                </View>
                            )}
                            {nomeCampo && (
                                <View style={styles.metaItem}>
                                    <MapPin size={12} color={COLORS.icon} strokeWidth={1.75} />
                                    <InterText style={styles.metaText} numberOfLines={1}>
                                        {nomeCampo}
                                    </InterText>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.idPill}>
                <InterText style={styles.idText}>{id}</InterText>
            </View>
        </View>
    );
}

const COLORS = {
    surface: '#FFFFFF',
    border: '#E8EAF0',
    accent: '#b3642c',
    accentBg: '#EEF3FE',
    accentLine: '#498fc8',
    title: '#111318',
    meta: '#6B7280',
    icon: '#9CA3AF',
    idBg: '#F3F4F6',
    idText: '#9CA3AF',
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        gap: 12,
        backgroundColor: COLORS.surface,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#1A1F3680',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
            },
            android: {
                elevation: 3,
            },
        }),
    },

    // ── Header ──────────────────────────────────────────────────────────────────

    main: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
    },

    header: {
        justifyContent: 'center',
        gap: 2,
        flex: 1,
    },

    logo: {
        height: 56,
        width: 'auto',
        aspectRatio: 1,
    },

    title: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.title,
        lineHeight: 28,
        flexShrink: 1,
    },

    // ── ID pill ─────────────────────────────────────────────────────────────────

    idPill: {
        backgroundColor: COLORS.idBg,
        borderRadius: 20,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignSelf: 'flex-start',
    },

    idText: {
        fontSize: 10,
        fontWeight: '500',
        color: COLORS.idText,
        letterSpacing: 0.3,
    },

    // ── Meta ────────────────────────────────────────────────────────────────────

    metaRow: {
        gap: 3,
    },

    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    metaText: {
        fontSize: 11,
        fontWeight: '400',
        color: COLORS.meta,
        flex: 1,
    },
});
