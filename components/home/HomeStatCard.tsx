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

const cardToneStyles: Record<Tone, { backgroundColor: string; borderColor: string }> = {
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

const textToneStyles: Record<Tone, { color: string }> = {
    red: {
        color: '#59161a',
    },
    gold: {
        color: '#877109',
    },
    green: {
        color: '#13732f',
    },
    blue: {
        color: '#123a73',
    },
};

export default function HomeStatCard({ label, value, tone, icon }: Props) {
    return (
        <View style={[styles.card, cardToneStyles[tone]]}>
            <View style={styles.topRow}>
                <View style={styles.iconBox}>{icon}</View>
                <InterText style={[styles.value, textToneStyles[tone]]}>{value}</InterText>
            </View>
            <InterText style={[styles.label, textToneStyles[tone]]} numberOfLines={2}>
                {label}
            </InterText>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        minWidth: 0,
        minHeight: 96,
        borderRadius: 12,
        borderWidth: 2,
        paddingVertical: 8,
        paddingHorizontal: 14,
        justifyContent: 'center',
        gap: 8,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    value: {
        fontFamily: 'Inter-Bold',
        fontSize: 44,
        fontWeight: '700',
    },
    label: {
        color: '#475569',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
        textAlign: 'center',
    },
});
