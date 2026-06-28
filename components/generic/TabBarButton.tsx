import { StyleSheet, TouchableOpacity } from 'react-native';
import { Href, Link } from 'expo-router';
import {
    ExternalLinkIcon,
    CircleQuestionMark,
    LucideIcon,
    PlusIcon,
    SettingsIcon,
} from 'lucide-react-native';
import React from 'react';

type TabBarButtonProps = {
    link?: Href;
    type?: 'create' | 'settings' | 'feedback' | 'external';
    onPress?: () => void;
    accessibilityLabel?: string;
};

const ICONS: Record<NonNullable<TabBarButtonProps['type']>, LucideIcon> = {
    create: PlusIcon,
    settings: SettingsIcon,
    feedback: CircleQuestionMark,
    external: ExternalLinkIcon,
};

export default function TabBarButton({
    link,
    type = 'create',
    onPress,
    accessibilityLabel,
}: TabBarButtonProps) {
    const Icon = ICONS[type];
    const button = (
        <TouchableOpacity
            style={styles.tabBarButton}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}>
            <Icon style={styles.tabBarButtonIcon} strokeWidth={type === 'settings' ? 1.5 : 2.5} />
        </TouchableOpacity>
    );

    if (!link) return button;

    return (
        <Link href={link} asChild>
            {button}
        </Link>
    );
}

const styles = StyleSheet.create({
    tabBarButton: {
        width: 38,
        height: 38,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#b98e6b',
        shadowColor: '#291b0f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    tabBarButtonIcon: {
        width: 25,
        height: 25,
        color: '#ffffff',
    },
});
