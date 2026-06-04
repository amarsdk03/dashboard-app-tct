import { router, useLocalSearchParams } from 'expo-router';
import TorneoModal, { TorneoModalMode } from '@/components/tornei/TorneoModal';
import { StyleSheet, View } from 'react-native';

export default function TorneoModalRoute() {
    const params = useLocalSearchParams<{
        mode?: TorneoModalMode;
        torneoId?: string;
    }>();

    const mode: TorneoModalMode =
        params.mode === 'view' || params.mode === 'edit' ? params.mode : 'create';
    const torneoId = params.torneoId ? Number(params.torneoId) : undefined;

    return (
        <View style={styles.container}>
            <TorneoModal
                mode={mode}
                torneoId={Number.isFinite(torneoId) ? torneoId : undefined}
                onClose={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/tornei');
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
