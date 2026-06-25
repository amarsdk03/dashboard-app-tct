import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { type Href, Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SearchIcon, ShieldIcon, SlidersHorizontal } from 'lucide-react-native';
import { InterText } from '@/components/generic/InterText';
import SquadraCard from '@/components/squadre/SquadraCard';
import errorMessage from '@/components/generic/ErrorMessage';
import { getListaSquadre, listaSquadreType } from '@/data/squadre';
import { getListaTornei, listaTorneiType } from '@/data/tornei';
import GenericSelectField from '@/components/input/GenericSelectField';

export default function SquadreScreen() {
    const params = useLocalSearchParams<{ torneoId?: string }>();
    const [tornei, setTornei] = useState<listaTorneiType[]>([]);
    const [selectedTorneo, setSelectedTorneo] = useState<listaTorneiType | null>(null);
    const [squadre, setSquadre] = useState<listaSquadreType[]>([]);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const routeTorneoId = useMemo(() => {
        const value = Number(params.torneoId);
        return Number.isFinite(value) && value > 0 ? value : null;
    }, [params.torneoId]);

    const createHref = useMemo<Href>(() => {
        if (!selectedTorneo?.id) return '/squadre/modal?mode=create' as Href;
        return `/squadre/modal?mode=create&torneoId=${selectedTorneo.id}` as Href;
    }, [selectedTorneo?.id]);

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
            const data = await getListaSquadre(debouncedSearch, selectedTorneo.id);
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

    function handleResetFilters() {
        setSearch('');
        setDebouncedSearch('');
        setSelectedTorneo(tornei[0] ?? null);
        setFilterOpen(false);
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

    useFocusEffect(
        useCallback(() => {
            loadSquadre().then(() => null);
        }, [selectedTorneo?.id, debouncedSearch])
    );

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 350);
        return () => clearTimeout(timeout);
    }, [search]);

    return (
        <View className="bg-background flex-1">
            <View className="bg-background p-6 pb-4">
                <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                        <SearchIcon size={18} color="#b3b3b3" />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Cerca per nome, acronimo..."
                            placeholderTextColor="#dadada"
                            style={styles.searchInput}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.filterButton, filterOpen && styles.filterButtonActive]}
                        onPress={() => setFilterOpen((value) => !value)}
                        activeOpacity={0.85}>
                        <SlidersHorizontal
                            size={20}
                            color={filterOpen ? '#ffffff' : '#b98e6b'}
                            strokeWidth={2.5}
                        />
                    </TouchableOpacity>
                </View>

                {filterOpen && (
                    <View style={styles.filterPanel}>
                        <GenericSelectField
                            label="Torneo"
                            placeholder="Seleziona torneo"
                            enableNullValue={false}
                            value={selectedTorneo?.id ? selectedTorneo?.id.toString() : ''}
                            options={tornei.map((torneo) => ({
                                id: String(torneo.id),
                                name: torneo.nome,
                            }))}
                            onChange={(val) => {
                                const torneo = tornei.find((t) => t.id.toString() === val);
                                if (torneo) handleSelectTorneo(torneo);
                            }}
                            defaultLabelStyle={false}
                        />

                        <View style={styles.filterActions}>
                            <TouchableOpacity
                                style={styles.resetButton}
                                onPress={handleResetFilters}
                                activeOpacity={0.85}>
                                <InterText style={styles.resetText}>Reset</InterText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={() => setFilterOpen(false)}
                                activeOpacity={0.85}>
                                <InterText style={styles.applyText}>Applica</InterText>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={styles.resultsRow}>
                    <InterText style={styles.totalText}>
                        {squadre.length} risultati totali
                    </InterText>
                </View>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center gap-3">
                    <ActivityIndicator size="large" />
                    <InterText className="text-muted-foreground">Caricamento squadre...</InterText>
                </View>
            ) : (
                <FlatList
                    data={squadre}
                    keyExtractor={(item, index) => String(item.s_id ?? index)}
                    contentContainerClassName="px-5 pb-28 gap-3"
                    onRefresh={() => loadSquadre(true)}
                    refreshing={refreshing}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="mt-32 items-center gap-3">
                            <View className="bg-muted rounded-full p-2">
                                <ShieldIcon size={48} color="#737373" />
                            </View>
                            <InterText className="text-lg font-semibold text-gray-500">
                                Nessuna squadra trovata
                            </InterText>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const href = (
                            item.s_id && selectedTorneo?.id
                                ? `/squadre/modal?mode=view&squadraId=${item.s_id}&torneoId=${selectedTorneo.id}`
                                : createHref
                        ) as Href;

                        return (
                            <Link href={href} asChild>
                                <TouchableOpacity activeOpacity={0.85}>
                                    <SquadraCard
                                        nome={item.s_nome}
                                        acronimo={item.s_acronimo}
                                        linkStemma={item.s_link_stemma}
                                        coloreSquadra={item.s_colore_squadra}
                                        nomeCapitano={item.g_nome}
                                        cognomeCapitano={item.g_cognome}
                                    />
                                </TouchableOpacity>
                            </Link>
                        );
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    searchBox: {
        flex: 1,
        minHeight: 50,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderColor: '#d9d9d9',
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
    },
    searchInput: {
        flex: 1,
        color: '#0d0703',
        fontFamily: 'Inter',
        fontSize: 13,
    },
    filterButton: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: '#e8d1be',
        borderColor: '#e6cab8',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    filterButtonActive: {
        backgroundColor: '#b98e6b',
        borderColor: '#b98e6b',
    },
    filterPanel: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        padding: 14,
        marginBottom: 16,
        gap: 2,
        shadowColor: '#808080',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
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
    pickerWrapper: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        marginTop: 2,
    },
    picker: {
        color: '#0f172a',
        backgroundColor: 'transparent',
        padding: Platform.OS === 'web' ? 10 : 0,
    },
    pickerItem: {
        fontSize: 12,
        fontFamily: 'Inter',
        color: '#0f172a',
    },
    filterActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 2,
    },
    resetButton: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        paddingHorizontal: 14,
        paddingVertical: 9,
    },
    resetText: {
        color: '#475569',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        fontWeight: '600',
    },
    applyButton: {
        borderRadius: 12,
        backgroundColor: '#0f172a',
        paddingHorizontal: 16,
        paddingVertical: 9,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    applyText: {
        color: '#ffffff',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        fontWeight: '600',
    },
    resultsRow: {
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 10,
    },
    totalText: {
        color: '#64748b',
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        fontWeight: '500',
    },
    selectedTournament: {
        color: '#64748b',
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        fontWeight: '500',
    },
});
