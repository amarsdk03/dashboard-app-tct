import React, { useState } from 'react';
import {
    View,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    StyleSheet,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { getListaTornei, listaTorneiType } from '@/data/tornei';
import TorneoModal, { TorneoModalMode } from '@/components/tornei/TorneoModal';
import { Plus, Trophy } from 'lucide-react-native';
import { InterText } from '@/components/InterText';

export default function TorneiScreen() {
    const [tornei, setTornei] = useState<listaTorneiType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<TorneoModalMode>('view');
    const [selectedId, setSelectedId] = useState<number | undefined>(undefined);

    async function loadTornei(isRefresh = false) {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const data = await getListaTornei(null);
            console.log('Tornei caricati:', data);

            setTornei(data ?? []);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
            Alert.alert('Errore', msg);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    function openModal(mode: TorneoModalMode, id?: number) {
        setModalMode(mode);
        setSelectedId(id);
        setShowModal(true);
    }

    function handleDelete() {
        Alert.alert('Coming soon...');
    }

    if (showModal) {
        return (
            <TorneoModal
                mode={modalMode}
                torneoId={selectedId as number}
                onClose={() => setShowModal(false)}
            />
        );
    }

    return (
        <View className="flex-1 bg-background">
            {/* ── Header ── */}
            <View className="bg-background p-4">
                <View className="mb-4 flex-row items-center justify-between">
                    <InterText className="text-2xl font-black">
                        Lista tornei
                    </InterText>
                    <TouchableOpacity
                        onPress={() => openModal('create')}
                        style={styles.button}
                        activeOpacity={0.85}
                    >
                        <Plus size={16} color="#fff" />
                        <InterText style={styles.buttonText}>
                            Crea nuovo
                        </InterText>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── List ── */}
            {loading ? (
                <View className="flex-1 items-center justify-center gap-3">
                    <ActivityIndicator size="large" />
                    <Text className="text-muted-foreground">Caricamento tornei...</Text>
                </View>
            ) : (
                <FlatList
                    data={tornei}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerClassName="px-5 pb-8 gap-3 pt-2"
                    onRefresh={() => loadTornei(true)}
                    refreshing={refreshing}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="mt-16 items-center gap-3">
                            <View className="rounded-full bg-muted p-5">
                                <Trophy size={36} color="hsl(var(--muted-foreground))" />
                            </View>
                            <Text className="text-lg font-semibold text-foreground">
                                Nessun torneo trovato
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <Text className="text-lg font-semibold text-foreground">
                            item.nome
                        </Text>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: 12,

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
    },
});