import React, { useState, useEffect } from 'react';
import {
    View,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    StyleSheet,
} from 'react-native';
import { Link } from 'expo-router';
import { getListaTornei, listaTorneiType } from '@/data/tornei';
import { PlusIcon, TrophyIcon } from 'lucide-react-native';
import { InterText } from '@/components/InterText';
import TorneoCard from '@/components/tornei/TorneoCard';
import errorMessage from '@/components/ErrorMessage';

export default function TorneiScreen() {
    const [tornei, setTornei] = useState<listaTorneiType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    async function loadTornei(isRefresh = false) {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const data = await getListaTornei(null);
            setTornei(data ?? []);
        } catch (error: any) {
            errorMessage('Impossibile recuperare i dati', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    function handleDelete() {
        Alert.alert('Coming soon...');
    }

    useEffect(() => {
        loadTornei().then(r => null);
    }, []);

    return (
        <View className="bg-background flex-1">
            {/* ── Header ── */}
            <View className="bg-background p-6 pb-4">
                <View className="flex-row items-center justify-between">
                    <InterText className="text-3xl font-black">Lista tornei</InterText>
                    <Link href="/tornei/modal" asChild>
                        <TouchableOpacity style={styles.button} activeOpacity={0.85}>
                            <PlusIcon size={16} color="#fff" />
                            <InterText style={styles.buttonText}>Crea nuovo</InterText>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>

            {/* ── List ── */}
            {loading ? (
                <View className="flex-1 items-center justify-center gap-3">
                    <ActivityIndicator size="large" />
                    <InterText className="text-muted-foreground">Caricamento tornei...</InterText>
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
                            <View className="bg-muted rounded-full p-5">
                                <TrophyIcon size={36} color="hsl(var(--muted-foreground))" />
                            </View>
                            <InterText className="text-foreground text-lg font-semibold">
                                Nessun torneo trovato
                            </InterText>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <Link
                            key={item.id}
                            href={`/tornei/modal?mode=view&torneoId=${item.id}`}
                            asChild>
                            <TouchableOpacity activeOpacity={0.85}>
                                <TorneoCard
                                    key={item.id}
                                    id={item.id}
                                    nomeTorneo={item.nome}
                                    logoTorneo={item.logo_torneo}
                                    dataInizio={item.data_inizio}
                                    dataFine={item.data_fine}
                                    nomeCampo={(item.campo as any)?.nome}
                                />
                            </TouchableOpacity>
                        </Link>
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

        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    listItem: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    }
});
