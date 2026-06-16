import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Link, type Href, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { PlusIcon, SearchIcon, SlidersHorizontal, UserRound } from 'lucide-react-native';
import { InterText } from '@/components/InterText';
import errorMessage from '@/components/ErrorMessage';
import GiocatoreCard from '@/components/giocatori/GiocatoreCard';
import { getListaGiocatori, listaGiocatoriType } from '@/data/giocatori';
import { getListaSquadre, listaSquadreType } from '@/data/squadre';
import { getListaTornei, listaTorneiType } from '@/data/tornei';
import { Enums } from '@/types/database.types';

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
    const [count, setCount] = useState<number | null>(null);
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
            setCount(0);
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
                },
            );
            const nextGiocatori = data.result ?? [];
            const totalCount = data.count ?? 0;

            if (!isCurrentRequest()) return;

            setGiocatori((current) => {
                if (page === 1) return nextGiocatori;

                const seenIds = new Set(
                    current
                        .map((giocatore) => giocatore.g_id)
                        .filter((id): id is number => typeof id === 'number'),
                );
                const uniqueNext = nextGiocatori.filter((giocatore) => {
                    if (typeof giocatore.g_id !== 'number') return true;
                    if (seenIds.has(giocatore.g_id)) return false;
                    seenIds.add(giocatore.g_id);
                    return true;
                });

                return [...current, ...uniqueNext];
            });
            setCount(totalCount);
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
                <View style={styles.headerRow}>
                    <InterText style={styles.title}>Lista giocatori</InterText>
                    <Link href={createHref} asChild>
                        <TouchableOpacity style={styles.roundButton} activeOpacity={0.85}>
                            <PlusIcon size={22} color="#ffffff" strokeWidth={3} />
                        </TouchableOpacity>
                    </Link>
                </View>

                <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                        <SearchIcon size={18} color="#6b7280" />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Cerca per nome, cognome..."
                            placeholderTextColor="#9ca3af"
                            style={styles.searchInput}
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={handleFilterPress}
                        activeOpacity={0.85}>
                        <SlidersHorizontal size={20} color="#0f6096" strokeWidth={2.5} />
                    </TouchableOpacity>
                </View>

                {filterOpen && (
                    <View style={styles.filterPanel}>
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

                        <View style={styles.filterSection}>
                            <InterText style={styles.filterLabel}>Squadra</InterText>
                            <View style={styles.chipRow}>
                                <TouchableOpacity
                                    style={[styles.chip, !selectedSquadra && styles.chipActive]}
                                    onPress={() => setSelectedSquadra(null)}
                                    activeOpacity={0.85}>
                                    <InterText
                                        style={[styles.chipText, !selectedSquadra && styles.chipTextActive]}>
                                        Tutte
                                    </InterText>
                                </TouchableOpacity>
                                {squadre.map((squadra) => {
                                    const active = selectedSquadra?.s_id === squadra.s_id;
                                    return (
                                        <TouchableOpacity
                                            key={`${squadra.t_id}-${squadra.s_id}`}
                                            style={[styles.chip, active && styles.chipActive]}
                                            onPress={() => setSelectedSquadra(squadra)}
                                            activeOpacity={0.85}>
                                            <InterText
                                                style={[styles.chipText, active && styles.chipTextActive]}
                                                numberOfLines={1}>
                                                {squadra.s_nome}
                                            </InterText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={styles.filterSection}>
                            <InterText style={styles.filterLabel}>Ruolo</InterText>
                            <View style={styles.chipRow}>
                                <TouchableOpacity
                                    style={[styles.chip, !selectedRole && styles.chipActive]}
                                    onPress={() => setSelectedRole(null)}
                                    activeOpacity={0.85}>
                                    <InterText
                                        style={[styles.chipText, !selectedRole && styles.chipTextActive]}>
                                        Tutti
                                    </InterText>
                                </TouchableOpacity>
                                {RUOLI.map((ruolo) => {
                                    const active = selectedRole === ruolo;
                                    return (
                                        <TouchableOpacity
                                            key={ruolo}
                                            style={[styles.chip, active && styles.chipActive]}
                                            onPress={() => setSelectedRole(ruolo)}
                                            activeOpacity={0.85}>
                                            <InterText
                                                style={[styles.chipText, active && styles.chipTextActive]}>
                                                {ruolo}
                                            </InterText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={styles.filterActions}>
                            <TouchableOpacity
                                style={[styles.actionChip, captainFilter && styles.actionChipActive]}
                                onPress={() => setCaptainFilter((value) => !value)}
                                activeOpacity={0.85}>
                                <InterText
                                    style={[
                                        styles.actionChipText,
                                        captainFilter && styles.actionChipTextActive,
                                    ]}>
                                    Solo capitani
                                </InterText>
                            </TouchableOpacity>
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
                                    <InterText style={[styles.tabText, active && styles.tabTextActive]}>
                                        {tab.label}
                                    </InterText>
                                    {active && <View style={styles.tabIndicator} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <InterText style={styles.countText}>
                        {count ?? 0} risultati totali
                    </InterText>
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
                        <View className="mt-16 items-center gap-3">
                            <View className="bg-muted rounded-full p-5">
                                <UserRound size={36} color="hsl(var(--muted-foreground))" />
                            </View>
                            <InterText className="text-foreground text-lg font-semibold">
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
                                linkFoto={item.g_link_foto}
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 20,
    },
    title: {
        flex: 1,
        color: '#111111',
        fontSize: 30,
        fontWeight: '800',
        fontFamily: 'Inter-Bold',
    },
    roundButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#b98e6b',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
    },
    searchBox: {
        flex: 1,
        minHeight: 46,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    searchInput: {
        flex: 1,
        color: '#0f172a',
        fontSize: 14,
        fontFamily: 'Inter',
        paddingVertical: 10,
    },
    filterButton: {
        width: 46,
        height: 46,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterPanel: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        padding: 14,
        gap: 14,
        marginBottom: 14,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    filterSection: {
        gap: 8,
    },
    filterLabel: {
        color: '#111111',
        fontSize: 12,
        fontWeight: '700',
        fontFamily: 'Inter-Bold',
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
        backgroundColor: '#f8fafc',
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    chipActive: {
        borderColor: '#0f172a',
        backgroundColor: '#0f172a',
    },
    chipText: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    chipTextActive: {
        color: '#ffffff',
    },
    filterActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
        flexWrap: 'wrap',
    },
    actionChip: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    actionChipActive: {
        borderColor: '#be185d',
        backgroundColor: '#fce7f3',
    },
    actionChipText: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    actionChipTextActive: {
        color: '#be185d',
    },
    resetButton: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 9,
        backgroundColor: '#e5e7eb',
    },
    resetText: {
        color: '#6b7280',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    applyButton: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 9,
        backgroundColor: '#0f172a',
    },
    applyText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    tabsRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tabs: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 18,
    },
    tabButton: {
        paddingTop: 8,
        paddingBottom: 9,
        gap: 7,
        alignItems: 'center',
    },
    tabText: {
        color: '#374151',
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    tabTextActive: {
        color: '#0f6096',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: -1,
        height: 2,
        width: '100%',
        borderRadius: 2,
        backgroundColor: '#0f6096',
    },
    countText: {
        color: '#6b7280',
        fontSize: 13,
        fontFamily: 'Inter',
        paddingBottom: 12,
    },
    selectedTournament: {
        color: '#6b7280',
        fontSize: 12,
        fontFamily: 'Inter',
        marginTop: 8,
    },
    footerLoader: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
});
