import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ArrowLeftIcon } from 'lucide-react-native';
import { InterText } from '@/components/InterText';

export type GiocatoreModalMode = 'view' | 'create' | 'edit';

type Props = {
    mode: GiocatoreModalMode;
    giocatoreId?: number;
    torneoId?: number;
    onClose: () => void;
};

export default function GiocatoreModal({ mode, giocatoreId, torneoId, onClose }: Props) {
    const title =
        mode === 'create'
            ? 'Nuovo giocatore'
            : mode === 'edit'
              ? 'Modifica giocatore'
              : 'Dati giocatore';

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.formCard}>
                <InterText style={styles.title}>{title}</InterText>
                <InterText style={styles.description}>
                    {giocatoreId
                        ? `ID giocatore: ${giocatoreId}`
                        : 'Wizard di creazione in preparazione'}
                    {torneoId ? ` · Torneo: ${torneoId}` : ''}
                </InterText>

                <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={onClose}
                    activeOpacity={0.8}>
                    <ArrowLeftIcon size={16} color="#6b7280" />
                    <InterText style={[styles.buttonText, styles.buttonSecondaryText]}>
                        Torna indietro
                    </InterText>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        padding: 16,
        paddingBottom: 128,
    },
    formCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        gap: 12,
    },
    title: {
        color: '#111111',
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        fontWeight: '700',
    },
    description: {
        color: '#6b7280',
        fontSize: 14,
        fontFamily: 'Inter',
    },
    button: {
        width: '100%',
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    buttonSecondary: {
        backgroundColor: '#e5e7eb',
    },
    buttonSecondaryText: {
        color: '#6b7280',
    },
});
