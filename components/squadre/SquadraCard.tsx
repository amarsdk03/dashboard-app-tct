import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ShieldIcon } from 'lucide-react-native';
import { InterText } from '@/components/generic/InterText';

type Props = {
    nome: string | null;
    acronimo: string | null;
    linkStemma: string | null;
    coloreSquadra: string | null;
    nomeCapitano?: string | null;
    cognomeCapitano?: string | null;
};

export default function SquadraCard({
    nome,
    acronimo,
    linkStemma,
    coloreSquadra,
    nomeCapitano,
    cognomeCapitano,
}: Props) {
    const captain = [nomeCapitano, cognomeCapitano].filter(Boolean).join(' ');

    return (
        <View style={styles.card}>
            <View style={styles.logoBox}>
                {linkStemma ? (
                    <Image source={{ uri: linkStemma }} style={styles.logo} resizeMode="contain" />
                ) : (
                    <ShieldIcon size={24} color="#64748b" />
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <InterText style={styles.name} numberOfLines={1}>
                        {nome ?? 'Squadra senza nome'}
                    </InterText>
                    {acronimo && (
                        <View style={styles.acronymBadge}>
                            <InterText style={styles.acronym}>{acronimo}</InterText>
                        </View>
                    )}
                </View>

                <View style={styles.metaRow}>
                    <View
                        style={[styles.colorDot, { backgroundColor: coloreSquadra ?? '#cbd5e1' }]}
                    />
                    <InterText style={styles.meta} numberOfLines={1}>
                        {captain ? `Capitano: ${captain}` : 'Capitano non assegnato'}
                    </InterText>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        minHeight: 86,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    logoBox: {
        width: 54,
        height: 54,
        borderRadius: 14,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    logo: {
        width: 42,
        height: 42,
    },
    content: {
        flex: 1,
        minWidth: 0,
        gap: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    name: {
        flex: 1,
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        fontWeight: '700',
    },
    acronymBadge: {
        borderRadius: 999,
        backgroundColor: '#0f172a',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    acronym: {
        color: '#ffffff',
        fontFamily: 'Inter-SemiBold',
        fontSize: 11,
        fontWeight: '600',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    colorDot: {
        width: 10,
        height: 10,
        borderRadius: 999,
    },
    meta: {
        flex: 1,
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 13,
    },
});
