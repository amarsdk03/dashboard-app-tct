import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import SquadraModal, { SquadraModalMode } from '@/components/squadre/SquadraModal';

export default function SquadraModalRoute() {
    const params = useLocalSearchParams<{
        mode?: SquadraModalMode;
        squadraId?: string;
        torneoId?: string;
    }>();

    const mode: SquadraModalMode =
        params.mode === 'view' || params.mode === 'edit' ? params.mode : 'create';
    const squadraId = params.squadraId ? Number(params.squadraId) : undefined;
    const torneoId = params.torneoId ? Number(params.torneoId) : undefined;

    return (
        <View style={styles.container}>
            <SquadraModal
                mode={mode}
                squadraId={squadraId}
                torneoId={torneoId}
                onClose={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/squadre');
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
