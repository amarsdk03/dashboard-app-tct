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
import { Text } from '@/components/ui/text';
import { getListaTornei, listaTorneiType } from '@/data/tornei';
import { Plus, Trophy } from 'lucide-react-native';
import { InterText } from '@/components/InterText';

export default function TorneiScreen() {
    const [tornei, setTornei] = useState<listaTorneiType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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
                    <InterText className="text-2xl font-black">Lista tornei</InterText>
                    <Link href="/tornei/modal" asChild>
                        <TouchableOpacity style={styles.button} activeOpacity={0.85}>
                            <Plus size={16} color="#fff" />
                            <InterText style={styles.buttonText}>Crea nuovo</InterText>
                        </TouchableOpacity>
                    </Link>
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
                            <View className="bg-muted rounded-full p-5">
                                <Trophy size={36} color="hsl(var(--muted-foreground))" />
                            </View>
                            <Text className="text-foreground text-lg font-semibold">
                                Nessun torneo trovato
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <InterText style={styles.listItem}>{item.nome}</InterText>
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
        fontSize: 14,
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
