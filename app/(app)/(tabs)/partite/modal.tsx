import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import PartitaModal, { PartitaModalMode } from '@/components/partite/PartitaModal';

export default function PartitaModalRoute() {
    const params = useLocalSearchParams<{
        mode?: PartitaModalMode;
        partitaId?: string;
        torneoId?: string;
    }>();

    const mode: PartitaModalMode =
        params.mode === 'view' || params.mode === 'edit' ? params.mode : 'create';
    const partitaId = params.partitaId ? Number(params.partitaId) : undefined;
    const torneoId = params.torneoId ? Number(params.torneoId) : undefined;

    return (
        <View style={styles.container}>
            <PartitaModal
                mode={mode}
                partitaId={partitaId}
                torneoId={torneoId}
                onClose={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/partite');
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
