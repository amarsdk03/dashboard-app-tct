import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import {
    CalendarDaysIcon,
    ChevronRightIcon,
    ShieldIcon,
    UsersRoundIcon,
} from 'lucide-react-native';
import { InterText } from '@/components/InterText';

type Props = {
    torneoId: number;
    loading: boolean;
    squadreCount: number;
    giocatoriCount: number;
    partiteCount: number;
};

const ACTIONS = [
    {
        label: 'Vedi squadre',
        path: '/squadre',
        icon: ShieldIcon,
    },
    {
        label: 'Vedi giocatori',
        path: '/giocatori',
        icon: UsersRoundIcon,
    },
    {
        label: 'Vedi partite',
        path: '/partite',
        icon: CalendarDaysIcon,
    },
] as const;

export default function TorneoLinkedDataSummary({
    torneoId,
    loading,
    squadreCount,
    giocatoriCount,
    partiteCount,
}: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <InterText style={styles.title}>Dati collegati</InterText>
                {loading && <ActivityIndicator size="small" />}
            </View>

            <View style={styles.countGrid}>
                <CountTile label="Squadre" value={squadreCount} />
                <CountTile label="Giocatori" value={giocatoriCount} />
                <CountTile label="Partite" value={partiteCount} />
            </View>

            <View style={styles.actions}>
                {ACTIONS.map((action) => {
                    const Icon = action.icon;
                    const href = `${action.path}?torneoId=${torneoId}` as Href;
                    return (
                        <Link key={action.path} href={href} asChild>
                            <TouchableOpacity style={styles.actionButton} activeOpacity={0.85}>
                                <View style={styles.actionIcon}>
                                    <Icon size={15} color="#0f172a" />
                                </View>
                                <InterText style={styles.actionText}>{action.label}</InterText>
                                <ChevronRightIcon size={15} color="#64748b" />
                            </TouchableOpacity>
                        </Link>
                    );
                })}
            </View>
        </View>
    );
}

function CountTile({ label, value }: { label: string; value: number }) {
    return (
        <View style={styles.countTile}>
            <InterText style={styles.countValue}>{value}</InterText>
            <InterText style={styles.countLabel}>{label}</InterText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 14,
        marginTop: 4,
        marginBottom: 18,
    },
    headerRow: {
        minHeight: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    title: {
        color: '#111111',
        fontFamily: 'Inter-Bold',
        fontSize: 17,
        fontWeight: '700',
    },
    countGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    countTile: {
        flex: 1,
        minHeight: 72,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 10,
        justifyContent: 'center',
    },
    countValue: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        fontWeight: '700',
    },
    countLabel: {
        color: '#64748b',
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    actions: {
        gap: 8,
    },
    actionButton: {
        minHeight: 44,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
    },
    actionIcon: {
        width: 28,
        height: 28,
        borderRadius: 999,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        flex: 1,
        color: '#0f172a',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        fontWeight: '600',
    },
});
