import { StyleSheet, TouchableOpacity } from 'react-native';
import { Href, Link } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';
import React from 'react';

export default function CreateButton({ link }: { link: Href }) {
    return (
        <Link href={link} asChild>
            <TouchableOpacity style={styles.createButton} activeOpacity={0.7}>
                <PlusIcon style={styles.createButtonIcon} strokeWidth={2.5} />
            </TouchableOpacity>
        </Link>
    );
}

const styles = StyleSheet.create({
    createButton: {
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
    createButtonIcon: {
        width: 25,
        height: 25,
        color: '#ffffff',
    },
});