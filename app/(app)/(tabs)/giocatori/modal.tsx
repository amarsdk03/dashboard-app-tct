import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import GiocatoreModal, { GiocatoreModalMode } from '@/components/giocatori/GiocatoreModal';

export default function GiocatoreModalRoute() {
    const params = useLocalSearchParams<{
        mode?: GiocatoreModalMode;
        giocatoreId?: string;
        torneoId?: string;
    }>();

    const mode: GiocatoreModalMode =
        params.mode === 'view' || params.mode === 'edit' ? params.mode : 'create';
    const giocatoreId = params.giocatoreId ? Number(params.giocatoreId) : undefined;
    const torneoId = params.torneoId ? Number(params.torneoId) : undefined;

    return (
        <View style={styles.container}>
            <GiocatoreModal
                mode={mode}
                giocatoreId={giocatoreId}
                torneoId={torneoId}
                onClose={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/giocatori');
                    }
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
});
