import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { type Href } from 'expo-router';
import { CalendarDaysIcon, ShieldIcon, UsersRoundIcon } from 'lucide-react-native';
import { InterText } from '@/components/generic/InterText';
import HomeQuickAction from '@/components/home/HomeQuickAction';
import HomeStatCard from '@/components/home/HomeStatCard';

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
        icon: <ShieldIcon size={16} color="#15803d" />,
    },
    {
        label: 'Vedi giocatori',
        path: '/giocatori',
        icon: <UsersRoundIcon size={16} color="#1d4ed8" />,
    },
    {
        label: 'Vedi partite',
        path: '/partite',
        icon: <CalendarDaysIcon size={16} color="#be123c" />,
    },
] as const;

export default function TorneoLinkedData({
    torneoId,
    loading,
    squadreCount,
    giocatoriCount,
    partiteCount,
}: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <InterText style={styles.title}>Dati collegati al torneo:</InterText>
                {loading && <ActivityIndicator size="small" />}
            </View>

            <View style={styles.countGrid}>
                <HomeStatCard
                    label="Squadre"
                    value={squadreCount}
                    tone="green"
                    icon={<ShieldIcon size={20} color="#15803d" />}
                    smallValueSize={true}
                />
                <HomeStatCard
                    label="Giocatori"
                    value={giocatoriCount}
                    tone="blue"
                    icon={<UsersRoundIcon size={20} color="#1d4ed8" />}
                    smallValueSize={true}
                />
                <HomeStatCard
                    label="Partite"
                    value={partiteCount}
                    tone="red"
                    icon={<CalendarDaysIcon size={20} color="#be123c" />}
                    smallValueSize={true}
                />
            </View>

            <View style={styles.actions}>
                {ACTIONS.map((action, index) => {
                    const href = `${action.path}?torneoId=${torneoId}` as Href;
                    return <HomeQuickAction key={index} label={action.label} href={href} icon={action.icon} />;
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
        borderTopColor: '#e2e8f0',
        borderTopWidth: 1,
        paddingTop: 25,
        paddingBottom: 15,
    },
    headerRow: {
        minHeight: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    title: {
        color: '#111111',
        fontFamily: 'Inter-Bold',
        fontSize: 17,
        fontWeight: '700',
    },
    helperText: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '400',
        lineHeight: 19,
        marginBottom: 20,
    },
    countGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    countTile: {
        flex: 1,
        minHeight: 72,
        borderWidth: 2,
        borderColor: '#e6d4c3',
        backgroundColor: '#f2e6da',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 10,
        justifyContent: 'center',
    },
    countValue: {
        color: '#997a4d',
        fontFamily: 'Inter-Bold',
        fontSize: 28,
        fontWeight: '700',
    },
    countLabel: {
        color: '#806640',
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        fontWeight: '500',
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
