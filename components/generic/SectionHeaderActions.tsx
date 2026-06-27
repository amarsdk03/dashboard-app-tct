import React, { useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { Href, useLocalSearchParams, usePathname } from 'expo-router';
import FeedbackModal from '@/components/generic/FeedbackModal';
import TabBarButton from '@/components/generic/TabBarButton';

type SectionKey = 'tornei' | 'partite' | 'squadre' | 'giocatori';

type Props = {
    section: SectionKey;
    createHref: Href;
};

const PUBLIC_URL_BUILDERS: Record<SectionKey, (id: string) => string> = {
    tornei: (id) => `https://torneo-citta-di-trento.vercel.app/classifiche?edizione=${id}`,
    partite: (id) => `https://torneo-citta-di-trento.vercel.app/partite/dettagli?id=${id}`,
    squadre: (id) => `https://torneo-citta-di-trento.vercel.app/squadre/dettagli?id=${id}`,
    giocatori: (id) => `https://torneo-citta-di-trento.vercel.app/giocatori/dettagli?id=${id}`,
};

const ID_PARAM_BY_SECTION: Record<SectionKey, string> = {
    tornei: 'torneoId',
    partite: 'partitaId',
    squadre: 'squadraId',
    giocatori: 'giocatoreId',
};

function getStringParam(value: string | string[] | undefined) {
    if (Array.isArray(value)) return value[0];
    return value;
}

async function openPublicUrl(url: string) {
    try {
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
            Alert.alert('Link non disponibile', 'Non riesco ad aprire il link pubblico.');
            return;
        }

        await Linking.openURL(url);
    } catch {
        Alert.alert('Link non disponibile', 'Non riesco ad aprire il link pubblico.');
    }
}

export default function SectionHeaderActions({ section, createHref }: Props) {
    const pathname = usePathname();
    const params = useLocalSearchParams();
    const [feedbackOpen, setFeedbackOpen] = useState(false);

    const modalMode = getStringParam(params.mode);
    const recordId = getStringParam(params[ID_PARAM_BY_SECTION[section]]);
    const isSectionModal = pathname === `/${section}/modal`;
    const showPublicLink = isSectionModal && (modalMode === 'view' || modalMode === 'edit') && recordId;
    const showCreate = !isSectionModal;

    const publicUrl = useMemo(() => {
        if (!showPublicLink || !recordId) return null;
        return PUBLIC_URL_BUILDERS[section](recordId);
    }, [recordId, section, showPublicLink]);

    return (
        <>
            <View style={styles.actions}>
                {showCreate && (
                    <TabBarButton
                        link={createHref}
                        type="create"
                        accessibilityLabel={`Crea ${section}`}
                    />
                )}
                {publicUrl && (
                    <TabBarButton
                        type="external"
                        onPress={() => openPublicUrl(publicUrl)}
                        accessibilityLabel="Apri pagina pubblica"
                    />
                )}
                <TabBarButton
                    type="feedback"
                    onPress={() => setFeedbackOpen(true)}
                    accessibilityLabel="Feedback e assistenza"
                />
            </View>
            <FeedbackModal visible={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
        </>
    );
}

const styles = StyleSheet.create({
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});
