import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ShieldIcon } from 'lucide-react-native';
import { InterText } from '@/components/InterText';
import SquadraCard from '@/components/squadre/SquadraCard';
import errorMessage from '@/components/ErrorMessage';
import { getListaSquadre, listaSquadreType } from '@/data/squadre';
import { getListaTornei, listaTorneiType } from '@/data/tornei';

export default function SquadreScreen() {
    const params = useLocalSearchParams<{ torneoId?: string }>();
    const [tornei, setTornei] = useState<listaTorneiType[]>([]);
    const [selectedTorneo, setSelectedTorneo] = useState<listaTorneiType | null>(null);
    const [squadre, setSquadre] = useState<listaSquadreType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const routeTorneoId = useMemo(() => {
        const value = Number(params.torneoId);
        return Number.isFinite(value) && value > 0 ? value : null;
    }, [params.torneoId]);

    async function loadTornei() {
        try {
            const data = await getListaTornei(null);
            const lista = data ?? [];
            setTornei(lista);
            setSelectedTorneo((current) => {
                const routeMatch = routeTorneoId
                    ? lista.find((torneo) => torneo.id === routeTorneoId)
                    : null;
                const currentMatch = current
                    ? lista.find((torneo) => torneo.id === current.id)
                    : null;

                return routeMatch ?? currentMatch ?? lista[0] ?? null;
            });
        } catch (error: any) {
            errorMessage('Impossibile recuperare i tornei', error.message ?? String(error));
            setLoading(false);
        }
    }

    async function loadSquadre(isRefresh = false) {
        if (!selectedTorneo?.id) {
            setSquadre([]);
            setLoading(false);
            return;
        }

        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await getListaSquadre(null, selectedTorneo.id);
            setSquadre(data ?? []);
        } catch (error: any) {
            errorMessage('Impossibile recuperare le squadre', error.message ?? String(error));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    function handleSelectTorneo(torneo: listaTorneiType) {
        setSelectedTorneo(torneo);
    }

    useEffect(() => {
        loadTornei().then(() => null);
    }, []);

    useEffect(() => {
        if (!routeTorneoId || tornei.length === 0) return;

        const routeMatch = tornei.find((torneo) => torneo.id === routeTorneoId);
        if (routeMatch) {
            setSelectedTorneo(routeMatch);
        }
    }, [routeTorneoId, tornei]);

    useEffect(() => {
        loadSquadre().then(() => null);
    }, [selectedTorneo?.id]);

    return (
        <View className="bg-background flex-1">
            <View className="bg-background p-6 pb-4">
                <View style={styles.headerRow}>
                    <InterText style={styles.title}>Lista squadre</InterText>
                    <View style={styles.countBadge}>
                        <InterText style={styles.countText}>{squadre.length}</InterText>
                    </View>
                </View>

                <View style={styles.filterSection}>
                    <InterText style={styles.filterLabel}>Torneo</InterText>
                    <View style={styles.chipRow}>
                        {tornei.map((torneo) => {
                            const active = selectedTorneo?.id === torneo.id;
                            return (
                                <TouchableOpacity
                                    key={torneo.id}
                                    style={[styles.chip, active && styles.chipActive]}
                                    onPress={() => handleSelectTorneo(torneo)}
                                    activeOpacity={0.85}>
                                    <InterText
                                        style={[styles.chipText, active && styles.chipTextActive]}
                                        numberOfLines={1}>
                                        {torneo.nome}
                                    </InterText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {selectedTorneo && (
                    <InterText style={styles.selectedTournament} numberOfLines={1}>
                        {selectedTorneo.nome}
                    </InterText>
                )}
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center gap-3">
                    <ActivityIndicator size="large" />
                    <InterText className="text-muted-foreground">
                        Caricamento squadre...
                    </InterText>
                </View>
            ) : (
                <FlatList
                    data={squadre}
                    keyExtractor={(item, index) => String(item.s_id ?? index)}
                    contentContainerClassName="px-5 pb-28 gap-3 pt-1"
                    onRefresh={() => loadSquadre(true)}
                    refreshing={refreshing}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="mt-16 items-center gap-3">
                            <View className="bg-muted rounded-full p-5">
                                <ShieldIcon size={36} color="hsl(var(--muted-foreground))" />
                            </View>
                            <InterText className="text-foreground text-lg font-semibold">
                                Nessuna squadra trovata
                            </InterText>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <SquadraCard
                            nome={item.s_nome}
                            acronimo={item.s_acronimo}
                            linkStemma={item.s_link_stemma}
                            coloreSquadra={item.s_colore_squadra}
                            nomeCapitano={item.g_nome}
                            cognomeCapitano={item.g_cognome}
                        />
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 18,
    },
    title: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 30,
        fontWeight: '700',
    },
    countBadge: {
        minWidth: 44,
        height: 36,
        borderRadius: 999,
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    countText: {
        color: '#ffffff',
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        fontWeight: '700',
    },
    filterSection: {
        gap: 8,
        marginBottom: 12,
    },
    filterLabel: {
        color: '#64748b',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        maxWidth: '100%',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        paddingHorizontal: 11,
        paddingVertical: 8,
    },
    chipActive: {
        borderColor: '#0f172a',
        backgroundColor: '#0f172a',
    },
    chipText: {
        color: '#475569',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#ffffff',
    },
    selectedTournament: {
        color: '#64748b',
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        fontWeight: '500',
    },
});
