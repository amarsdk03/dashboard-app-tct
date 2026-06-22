import { router, useLocalSearchParams } from 'expo-router';
import TorneoModalSummary from '@/components/tornei/TorneoModalSummary';
import TorneoModalForm from '@/components/tornei/TorneoModalForm';
import { StyleSheet, View } from 'react-native';

export type TorneoModalMode = 'view' | 'create' | 'edit';

export default function TorneoModalRoute() {
    const params = useLocalSearchParams<{
        mode: TorneoModalMode;
        torneoId?: string;
    }>();

    const mode: TorneoModalMode =
        params.mode === 'view' || params.mode === 'edit' ? params.mode : 'create';
    const torneoId = params.torneoId ? Number(params.torneoId) : null;

    return (
        <View style={styles.container}>
            {mode === 'view' ? (
                <TorneoModalSummary
                    torneoId={torneoId}
                    onClose={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace('/tornei');
                        }
                    }}
                />
            ) : (
                <TorneoModalForm
                    mode={mode}
                    torneoId={torneoId}
                    onClose={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace('/tornei');
                        }
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
});
