import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { MoreVertical, UsersRound } from 'lucide-react-native';
import { InterText } from '@/components/InterText';

type Props = {
    id: number | string;
    nome: string | null;
    cognome: string | null;
    linkFoto?: string | null;
    nomeSquadra?: string | null;
    acronimoSquadra?: string | null;
    coloreSquadra?: string | null;
    isCapitano?: boolean | null;
};

function getInitials(nome: string | null, cognome: string | null, fallback?: string | null) {
    const fullName = `${nome ?? ''} ${cognome ?? ''}`.trim();
    if (fullName.length > 0) {
        return fullName
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase();
    }

    return (fallback ?? String(nome ?? cognome ?? '?')).slice(0, 3).toUpperCase();
}

function normalizeHexColor(color?: string | null) {
    if (!color) return null;
    const trimmed = color.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
    return null;
}

function getReadableTextColor(backgroundColor: string) {
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#111318' : '#ffffff';
}

export default function GiocatoreCard({
    nome,
    cognome,
    linkFoto,
    nomeSquadra,
    acronimoSquadra,
    coloreSquadra,
    isCapitano,
}: Props) {
    const displayName = `${nome ?? ''} ${cognome ?? ''}`.trim() || 'Giocatore senza nome';
    const initials = getInitials(nome, cognome, acronimoSquadra);
    const avatarBg = normalizeHexColor(coloreSquadra) ?? COLORS.avatarBg;
    const avatarText = normalizeHexColor(coloreSquadra)
        ? getReadableTextColor(avatarBg)
        : COLORS.avatarText;

    return (
        <View style={styles.card}>
            <View style={styles.main}>
                {linkFoto ? (
                    <Image source={{ uri: linkFoto }} style={styles.avatar} resizeMode="cover" />
                ) : (
                    <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
                        <InterText style={[styles.avatarText, { color: avatarText }]}>
                            {initials}
                        </InterText>
                    </View>
                )}

                <View style={styles.content}>
                    <View style={styles.nameRow}>
                        <InterText style={styles.name} numberOfLines={1}>
                            {displayName}
                        </InterText>
                        {isCapitano && (
                            <View style={styles.captainPill}>
                                <InterText style={styles.captainText}>C</InterText>
                            </View>
                        )}
                    </View>

                    <View style={styles.teamRow}>
                        <UsersRound size={13} color={COLORS.icon} strokeWidth={2} />
                        <InterText style={styles.teamText} numberOfLines={1}>
                            {nomeSquadra ?? acronimoSquadra ?? 'Squadra non assegnata'}
                        </InterText>
                    </View>
                </View>
            </View>

            <MoreVertical size={20} color={COLORS.iconStrong} strokeWidth={2.25} />
        </View>
    );
}

const COLORS = {
    surface: '#ffffff',
    border: '#f1f5f9',
    title: '#111318',
    meta: '#4b5563',
    icon: '#4b5563',
    iconStrong: '#6b7280',
    avatarBg: '#e5e7eb',
    avatarText: '#9ca3af',
    captainBg: '#fce7f3',
    captainText: '#be185d',
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    main: {
        flex: 1,
        minWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    content: {
        flex: 1,
        minWidth: 0,
        gap: 5,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    name: {
        flex: 1,
        color: COLORS.title,
        fontSize: 18,
        fontWeight: '500',
        fontFamily: 'Inter-Medium',
    },
    captainPill: {
        backgroundColor: COLORS.captainBg,
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    captainText: {
        color: COLORS.captainText,
        fontSize: 10,
        fontWeight: '700',
        fontFamily: 'Inter-Bold',
    },
    teamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    teamText: {
        flex: 1,
        color: COLORS.meta,
        fontSize: 14,
        fontFamily: 'Inter',
    },
});
