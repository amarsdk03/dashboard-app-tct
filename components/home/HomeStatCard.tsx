import React from 'react';
import { StyleSheet, View } from 'react-native';
import { InterText } from '@/components/generic/InterText';

type Tone = 'red' | 'gold' | 'green' | 'blue';

type Props = {
    label: string;
    value: number;
    tone: Tone;
    icon: React.ReactNode;
};

const toneStyles: Record<Tone, { backgroundColor: string; borderColor: string }> = {
    red: {
        backgroundColor: '#fff1f2',
        borderColor: '#ffe4e6',
    },
    gold: {
        backgroundColor: '#fffbeb',
        borderColor: '#fef3c7',
    },
    green: {
        backgroundColor: '#f0fdf4',
        borderColor: '#dcfce7',
    },
    blue: {
        backgroundColor: '#eff6ff',
        borderColor: '#dbeafe',
    },
};

export default function HomeStatCard({ label, value, tone, icon }: Props) {
    return (
        <View style={[styles.card, toneStyles[tone]]}>
            <View style={styles.topRow}>
                <View style={styles.iconBox}>{icon}</View>
                <InterText style={styles.value}>{value}</InterText>
            </View>
            <InterText style={styles.label} numberOfLines={2}>
                {label}
            </InterText>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        minWidth: 0,
        minHeight: 118,
        borderRadius: 16,
        borderWidth: 1,
        padding: 14,
        justifyContent: 'space-between',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    value: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 28,
        fontWeight: '700',
    },
    label: {
        color: '#475569',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
    },
});
