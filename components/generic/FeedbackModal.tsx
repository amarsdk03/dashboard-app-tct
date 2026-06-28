import React from 'react';
import { Alert, Linking, Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { InstagramIcon, MailIcon, XIcon } from 'lucide-react-native';
import { InterText } from '@/components/generic/InterText';

type Props = {
    visible: boolean;
    onClose: () => void;
};

type Contact = {
    label: string;
    value: string;
    url: string;
    type: 'mail' | 'instagram';
};

const CONTACTS: Contact[] = [
    {
        label: 'Sviluppatore app',
        value: 'amarsdk03@gmail.com',
        url: 'mailto:amarsdk03@gmail.com',
        type: 'mail',
    },
    {
        label: 'Sviluppatore app',
        value: 'alessandrogremes04@gmail.com',
        url: 'mailto:alessandrogremes04@gmail.com',
        type: 'mail',
    },
    {
        label: 'Organizzazione torneo',
        value: '@torneocittaditrento',
        url: 'https://www.instagram.com/torneocittaditrento/',
        type: 'instagram',
    },
];

async function openContact(url: string) {
    try {
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
            Alert.alert('Link non disponibile', 'Non riesco ad aprire questo contatto.');
            return;
        }

        await Linking.openURL(url);
    } catch {
        Alert.alert('Link non disponibile', 'Non riesco ad aprire questo contatto.');
    }
}

export default function FeedbackModal({ visible, onClose }: Props) {
    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.card}>
                    <View style={styles.header}>
                        <View style={styles.titleBlock}>
                            <InterText style={styles.title}>Bisogno di aiuto?</InterText>
                            <InterText style={styles.subtitle}>
                                Contattaci per problemi, richieste o semplicemente se vuoi farci
                                sapere qualcosa!
                            </InterText>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel="Chiudi feedback">
                            <XIcon size={18} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.contactList}>
                        {CONTACTS.map((contact) => {
                            const Icon = contact.type === 'mail' ? MailIcon : InstagramIcon;
                            return (
                                <TouchableOpacity
                                    key={contact.url}
                                    style={styles.contactRow}
                                    onPress={() => openContact(contact.url)}
                                    activeOpacity={0.82}>
                                    <View style={styles.contactIcon}>
                                        <Icon size={18} color="#0f172a" />
                                    </View>
                                    <View style={styles.contactText}>
                                        <InterText style={styles.contactLabel}>
                                            {contact.label}
                                        </InterText>
                                        <InterText style={styles.contactValue} numberOfLines={1}>
                                            {contact.value}
                                        </InterText>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.35)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 420,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        padding: 18,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
    },
    titleBlock: {
        flex: 1,
        gap: 5,
    },
    title: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        fontWeight: '700',
    },
    subtitle: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 13,
        lineHeight: 18,
    },
    closeButton: {
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    contactList: {
        gap: 10,
    },
    contactRow: {
        minHeight: 58,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    contactIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    contactText: {
        flex: 1,
        minWidth: 0,
        gap: 2,
    },
    contactLabel: {
        color: '#64748b',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
    },
    contactValue: {
        color: '#0f172a',
        fontFamily: 'Inter',
        fontSize: 14,
    },
});
