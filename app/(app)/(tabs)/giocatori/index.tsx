import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { type Href, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SearchIcon, SlidersHorizontal, UserRound } from 'lucide-react-native';
import { InterText } from '@/components/generic/InterText';
import errorMessage from '@/components/generic/ErrorMessage';
import GiocatoreCard from '@/components/giocatori/GiocatoreCard';
import { getListaGiocatori, listaGiocatoriType } from '@/data/giocatori';
import { getListaSquadre, listaSquadreType } from '@/data/squadre';
import { getListaTornei, listaTorneiType } from '@/data/tornei';
import { Enums } from '@/types/database.types';
import TeamSelectField from '@/components/input/TeamSelectField';
import GenericSelectField from '@/components/input/GenericSelectField';

const RESULTS_PER_PAGE = 30;

type TabKey = 'tutti' | 'questanno' | 'capitani';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'tutti', label: 'Tutti' },
    { key: 'questanno', label: "Quest'anno" },
    { key: 'capitani', label: 'Capitani' },
];

const RUOLI: Enums<'ruolo_giocatore'>[] = [
    'Tecnico',
    'Portiere',
    'Difensore',
    'Centrocampista',
    'Attaccante',
];

export default function GiocatoriScreen() {
    const params = useLocalSearchParams<{ torneoId?: string }>();
    const router = useRouter();
    const [tornei, setTornei] = useState<listaTorneiType[]>([]);
    const [selectedTorneo, setSelectedTorneo] = useState<listaTorneiType | null>(null);
    const [squadre, setSquadre] = useState<listaSquadreType[]>([]);
    const [selectedSquadra, setSelectedSquadra] = useState<listaSquadreType | null>(null);
    const [selectedRole, setSelectedRole] = useState<Enums<'ruolo_giocatore'> | null>(null);
    const [captainFilter, setCaptainFilter] = useState(false);
    const [giocatori, setGiocatori] = useState<listaGiocatoriType[]>([]);
    const [resultCount, setResultCount] = useState<number>(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeTab, setActiveTab] = useState<TabKey>('tutti');
    const [filterOpen, setFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const requestSeqRef = useRef(0);

    const createHref = useMemo<Href>(() => {
        if (!selectedTorneo?.id) return '/giocatori/modal?mode=create' as Href;
        return `/giocatori/modal?mode=create&torneoId=${selectedTorneo.id}` as Href;
    }, [selectedTorneo?.id]);
    const routeTorneoId = useMemo(() => {
        const value = Number(params.torneoId);
        return Number.isFinite(value) && value > 0 ? value : null;
    }, [params.torneoId]);
    const queryKey = useMemo(
        () =>
            JSON.stringify({
                torneoId: selectedTorneo?.id ?? null,
                squadraId: selectedSquadra?.s_id ?? null,
                ruolo: selectedRole,
                capitani: activeTab === 'capitani' || captainFilter,
                search: debouncedSearch,
            }),
        [
            selectedTorneo?.id,
            selectedSquadra?.s_id,
            selectedRole,
            activeTab,
            captainFilter,
            debouncedSearch,
        ]
    );
    const latestQueryKeyRef = useRef(queryKey);

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
        }
    }

    async function loadSquadre(idTorneo: number) {
        try {
            const data = await getListaSquadre(null, idTorneo);
            setSquadre(data ?? []);
        } catch (error: any) {
            errorMessage('Impossibile recuperare le squadre', error.message ?? String(error));
        }
    }

    async function loadGiocatori(page = 1, isRefresh = false) {
        const requestId = requestSeqRef.current + 1;
        requestSeqRef.current = requestId;
        const requestQueryKey = queryKey;
        const isCurrentRequest = () =>
            requestSeqRef.current === requestId && latestQueryKeyRef.current === requestQueryKey;

        if (!selectedTorneo?.id) {
            setGiocatori([]);
            setCurrentPage(1);
            setHasMore(false);
            setLoading(false);
            return;
        }

        if (page > 1) setLoadingMore(true);
        else if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await getListaGiocatori(
                debouncedSearch,
                selectedTorneo.id,
                page,
                RESULTS_PER_PAGE,
                {
                    idSquadra: selectedSquadra?.s_id,
                    nomeSquadra: selectedSquadra?.s_nome,
                    ruolo: selectedRole,
                    soloCapitani: activeTab === 'capitani' || captainFilter,
                }
            );
            const nextGiocatori = data.result ?? [];
            const totalCount = data.count ?? 0;
            setResultCount(totalCount);

            if (!isCurrentRequest()) return;

            setGiocatori((current) => {
                if (page === 1) return nextGiocatori;

                const seenIds = new Set(
                    current
                        .map((giocatore) => giocatore.g_id)
                        .filter((id): id is number => typeof id === 'number')
                );
                const uniqueNext = nextGiocatori.filter((giocatore) => {
                    if (typeof giocatore.g_id !== 'number') return true;
                    if (seenIds.has(giocatore.g_id)) return false;
                    seenIds.add(giocatore.g_id);
                    return true;
                });

                return [...current, ...uniqueNext];
            });
            setCurrentPage(page);
            setHasMore(page * RESULTS_PER_PAGE < totalCount && nextGiocatori.length > 0);
        } catch (error: any) {
            if (!isCurrentRequest()) return;
            errorMessage('Impossibile recuperare i giocatori', error.message ?? String(error));
        } finally {
            if (isCurrentRequest()) {
                setLoading(false);
                setRefreshing(false);
                setLoadingMore(false);
            }
        }
    }

    function handleFilterPress() {
        setFilterOpen((value) => !value);
    }

    function handleTabPress(key: TabKey) {
        setActiveTab(key);
        if (key === 'questanno' && tornei[0]) {
            setSelectedTorneo(tornei[0]);
        }
    }

    function handleSelectTorneo(torneo: listaTorneiType) {
        setSelectedTorneo(torneo);
        setSelectedSquadra(null);
    }

    function handleResetFilters() {
        setSelectedSquadra(null);
        setSelectedRole(null);
        setCaptainFilter(false);
        setSearch('');
        setDebouncedSearch('');
        setActiveTab('tutti');
        setFilterOpen(false);
    }

    function handleLoadMore() {
        if (loading || refreshing || loadingMore || !hasMore) return;
        loadGiocatori(currentPage + 1).then(() => null);
    }

    useEffect(() => {
        latestQueryKeyRef.current = queryKey;
    }, [queryKey]);

    useEffect(() => {
        loadTornei().then(() => null);
    }, []);

    useEffect(() => {
        if (!routeTorneoId || tornei.length === 0) return;

        const routeMatch = tornei.find((torneo) => torneo.id === routeTorneoId);
        if (routeMatch) {
            setSelectedTorneo(routeMatch);
            setSelectedSquadra(null);
        }
    }, [routeTorneoId, tornei]);

    useEffect(() => {
        if (selectedTorneo?.id) {
            loadSquadre(selectedTorneo.id).then(() => null);
        } else {
            setSquadre([]);
            setSelectedSquadra(null);
        }
    }, [selectedTorneo?.id]);

    useFocusEffect(
        useCallback(() => {
            loadGiocatori(1).then(() => null);
        }, [
            selectedTorneo?.id,
            selectedSquadra?.s_id,
            selectedRole,
            captainFilter,
            debouncedSearch,
            activeTab,
        ])
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
                            placeholder="Cerca per nome, cognome..."
                            placeholderTextColor="#dadada"
                            style={styles.searchInput}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.filterButton, filterOpen && styles.filterButtonActive]}
                        onPress={handleFilterPress}
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
                            label="Tornei"
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

                        <TeamSelectField
                            label="Squadra"
                            enableNullValue={true}
                            defaultNullValue="Qualsiasi"
                            value={selectedSquadra?.s_id ? selectedSquadra.s_id.toString() : ''}
                            teams={squadre.map((s, index) => ({
                                id: String(s.s_id ?? index),
                                name: s.s_nome ?? 'Squadra senza nome',
                                logoUrl: s.s_link_stemma ?? undefined,
                            }))}
                            onChange={(teamId) => {
                                if (!teamId) {
                                    setSelectedSquadra(null);
                                } else {
                                    const originalSquadra = squadre.find(
                                        (s) => String(s.s_id) === teamId
                                    );
                                    if (originalSquadra) {
                                        setSelectedSquadra(originalSquadra);
                                    }
                                }
                            }}
                            defaultLabelStyle={false}
                        />

                        <GenericSelectField
                            label="Ruolo"
                            placeholder="Seleziona ruolo"
                            enableNullValue={true}
                            defaultNullValue="Qualsiasi"
                            value={selectedRole ?? ''}
                            options={RUOLI.map((ruolo) => ({
                                id: ruolo,
                                name: ruolo,
                            }))}
                            onChange={(val) => {
                                type Ruolo = (typeof RUOLI)[number];
                                setSelectedRole(val ? (val as Ruolo) : null);
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

                <View style={styles.tabsRow}>
                    <View style={styles.tabs}>
                        {TABS.map((tab) => {
                            const active = activeTab === tab.key;
                            return (
                                <TouchableOpacity
                                    key={tab.key}
                                    style={styles.tabButton}
                                    onPress={() => handleTabPress(tab.key)}
                                    activeOpacity={0.85}>
                                    <InterText
                                        style={[styles.tabText, active && styles.tabTextActive]}>
                                        {tab.label}
                                    </InterText>
                                    <View
                                        style={[
                                            styles.tabIndicator,
                                            active && styles.tabIndicatorActive,
                                        ]}
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.totalTextContainer}>
                    <InterText style={styles.totalText}>{resultCount} risultati totali</InterText>
                </View>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center gap-3">
                    <ActivityIndicator size="large" />
                    <InterText className="text-muted-foreground">
                        Caricamento giocatori...
                    </InterText>
                </View>
            ) : (
                <FlatList
                    data={giocatori}
                    keyExtractor={(item, index) => String(item.g_id ?? index)}
                    contentContainerClassName="px-5 pb-28 gap-3 pt-1"
                    onRefresh={() => loadGiocatori(1, true)}
                    refreshing={refreshing}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.35}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={styles.footerLoader}>
                                <ActivityIndicator size="small" />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View className="mt-32 items-center gap-3">
                            <View className="bg-muted rounded-full p-2">
                                <UserRound size={48} color="#737373" />
                            </View>
                            <InterText className="text-lg font-semibold text-gray-500">
                                Nessun giocatore trovato
                            </InterText>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const detailsHref = (
                            item.g_id && selectedTorneo?.id
                                ? `/giocatori/modal?mode=view&giocatoreId=${item.g_id}&torneoId=${selectedTorneo.id}`
                                : '/giocatori/modal?mode=create'
                        ) as Href;
                        const editHref = (
                            item.g_id && selectedTorneo?.id
                                ? `/giocatori/modal?mode=edit&giocatoreId=${item.g_id}&torneoId=${selectedTorneo.id}`
                                : '/giocatori/modal?mode=create'
                        ) as Href;

                        return (
                            <GiocatoreCard
                                id={item.g_id ?? ''}
                                nome={item.g_nome}
                                cognome={item.g_cognome}
                                linkFoto={item.s_link_stemma}
                                nomeSquadra={item.s_nome}
                                acronimoSquadra={item.s_acronimo}
                                coloreSquadra={item.s_colore_squadra}
                                isCapitano={item.g_is_capitano}
                                onOpen={() => router.push(detailsHref)}
                                onEdit={() => router.push(editHref)}
                            />
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
        fontSize: 13,
        fontFamily: 'Inter',
        color: '#0f172a',
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
    tabsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e6e6e6',
        marginBottom: 10,
    },
    tabs: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        flexShrink: 1,
    },
    tabButton: {
        minHeight: 38,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    tabText: {
        color: '#475569',
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#b98e6b',
    },
    tabIndicator: {
        height: 3,
        width: '100%',
        minWidth: 34,
        borderRadius: 999,
    },
    tabIndicatorActive: {
        backgroundColor: '#b98e6b',
    },
    totalTextContainer: {
        width: '100%',
        textAlign: 'left',
        marginTop: 2,
    },
    totalText: {
        textAlign: 'left',
        color: '#64748b',
        fontFamily: 'Inter-Medium',
        fontSize: 13,
        fontWeight: '500',
        flexShrink: 0,
    },
    countText: {
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
    footerLoader: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
});
