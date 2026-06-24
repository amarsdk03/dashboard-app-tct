import { StyleSheet, TouchableOpacity } from 'react-native';
import { Href, Link } from 'expo-router';
import { PlusIcon, SettingsIcon } from 'lucide-react-native';
import React from 'react';

type TabBarButtonProps = {
    link: Href;
    type?: 'create' | 'settings';
};

export default function TabBarButton({ link, type = 'create' }: TabBarButtonProps) {
    return (
        <Link href={link} asChild>
            <TouchableOpacity style={styles.tabBarButton} activeOpacity={0.7}>
                {type === 'create' ? (
                    <PlusIcon style={styles.tabBarButtonIcon} strokeWidth={2.5} />
                ) : (
                    <SettingsIcon style={styles.tabBarButtonIcon} strokeWidth={1.5} />
                )}
            </TouchableOpacity>
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