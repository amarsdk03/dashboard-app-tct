import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Href, Link } from 'expo-router';
import { ChevronRightIcon } from 'lucide-react-native';
import { InterText } from '@/components/InterText';

type Props = {
    label: string;
    href: Href;
    icon: React.ReactNode;
};

export default function HomeQuickAction({ label, href, icon }: Props) {
    return (
        <Link href={href} asChild>
            <Pressable style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
                <View style={styles.iconBox}>{icon}</View>
                <InterText style={styles.label} numberOfLines={1}>
                    {label}
                </InterText>
                <ChevronRightIcon size={18} color="#94a3b8" />
            </Pressable>
        </Link>
    );
}

const styles = StyleSheet.create({
    action: {
        minHeight: 58,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        paddingHorizontal: 14,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    actionPressed: {
        opacity: 0.78,
    },
    iconBox: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        flex: 1,
        minWidth: 0,
        color: '#0f172a',
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        fontWeight: '600',
    },
});
