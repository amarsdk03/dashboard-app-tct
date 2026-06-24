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
import { Picker } from '@react-native-picker/picker';
import { Link, type Href, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { CalendarDaysIcon, SearchIcon, SlidersHorizontal } from 'lucide-react-native';
import { InterText } from '@/components/generic/InterText';
import PartitaCard from '@/components/partite/PartitaCard';
import errorMessage from '@/components/generic/ErrorMessage';
import {
    getListaCategorie,
    getListaPartite,
    listaCategorieType,
    listaPartiteType,
} from '@/data/partite';
import { getListaTornei, listaTorneiType } from '@/data/tornei';

type TabKey = 'tutti' | 'questanno' | 'inarrivo';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'tutti', label: 'Tutti' },
    { key: 'questanno', label: "Quest'anno" },
    { key: 'inarrivo', label: 'In arrivo' },
];

export default function PartiteScreen() {
    const params = useLocalSearchParams<{ torneoId?: string }>();
    const [tornei, setTornei] = useState<listaTorneiType[]>([]);
    const [selectedTorneo, setSelectedTorneo] = useState<listaTorneiType | null>(null);
    const [categorie, setCategorie] = useState<listaCategorieType>([]);
    const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | null>(null);
    const [selectedGirone, setSelectedGirone] = useState<string | null>(null);
    const [partite, setPartite] = useState<listaPartiteType[]>([]);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeTab, setActiveTab] = useState<TabKey>('tutti');
    const [filterOpen, setFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const routeTorneoId = useMemo(() => {
        const value = Number(params.torneoId);
        return Number.isFinite(value) && value > 0 ? value : null;
    }, [params.torneoId]);

    const availableCategorie = useMemo(() => {
        const result: { id: number; nome: string }[] = [];
        const seen = new Set<number>();

        for (const categoria of categorie) {
            if (categoria.torneo_id !== selectedTorneo?.id || !categoria.categoria_id) continue;
            if (seen.has(categoria.categoria_id)) continue;

            seen.add(categoria.categoria_id);
            result.push({
                id: categoria.categoria_id,
                nome: categoria.categoria_nome ?? `Categoria ${categoria.categoria_id}`,
            });
        }

        return result.sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
    }, [categorie, selectedTorneo?.id]);

    const availableGironi = useMemo(() => {
        const values = new Set<string>();

        for (const categoria of categorie) {
            if (categoria.torneo_id !== selectedTorneo?.id || !categoria.girone) continue;
            if (selectedCategoriaId && categoria.categoria_id !== selectedCategoriaId) continue;
            values.add(categoria.girone);
        }

        return Array.from(values).sort((a, b) => a.localeCompare(b, 'it'));
    }, [categorie, selectedCategoriaId, selectedTorneo?.id]);

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

    async function loadCategorie() {
        try {
            const data = await getListaCategorie();
            setCategorie(data ?? []);
        } catch (error: any) {
            errorMessage('Impossibile recuperare le categorie', error.message ?? String(error));
        }
    }

    async function loadPartite(isRefresh = false) {
        if (!selectedTorneo?.id) {
            setPartite([]);
            setLoading(false);
            return;
        }

        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await getListaPartite(selectedTorneo.id, {
                search: debouncedSearch,
                idCategoria: selectedCategoriaId,
                valGirone: selectedGirone,
                upcomingOnly: activeTab === 'inarrivo',
            });
            setPartite(data ?? []);
        } catch (error: any) {
            errorMessage('Impossibile recuperare le partite', error.message ?? String(error));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    function handleSelectTorneo(torneo: listaTorneiType) {
        setSelectedTorneo(torneo);
        setSelectedCategoriaId(null);
        setSelectedGirone(null);
        if (activeTab === 'questanno' && torneo.id !== tornei[0]?.id) {
            setActiveTab('tutti');
        }
    }

    function handleTabPress(key: TabKey) {
        setActiveTab(key);
        if (key === 'questanno' && tornei[0]) {
            setSelectedTorneo(tornei[0]);
            setSelectedCategoriaId(null);
            setSelectedGirone(null);
        }
    }

    function handleResetFilters() {
        setSelectedCategoriaId(null);
        setSelectedGirone(null);
        setSearch('');
        setDebouncedSearch('');
        setActiveTab('tutti');
        setFilterOpen(false);
    }

    useEffect(() => {
        loadTornei().then(() => null);
        loadCategorie().then(() => null);
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
            loadPartite().then(() => null);
        }, [selectedTorneo?.id, selectedCategoriaId, selectedGirone, debouncedSearch, activeTab])
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
                            placeholder="Cerca per squadre, girone..."
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
                        <View style={styles.filterSection}>
                            <InterText style={styles.filterLabel}>Torneo</InterText>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={selectedTorneo?.id ?? null}
                                    onValueChange={(itemValue) => {
                                        const torneo = tornei.find((t) => t.id === itemValue);
                                        if (torneo) handleSelectTorneo(torneo);
                                    }}
                                    style={styles.picker}
                                    dropdownIconColor="#b98e6b"
                                    itemStyle={styles.pickerItem}>
                                    {tornei.map((torneo) => (
                                        <Picker.Item
                                            key={torneo.id}
                                            label={' ' + torneo.nome}
                                            value={torneo.id}
                                            color="#0f172a"
                                            fontFamily="Inter"
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.filterSection}>
                            <InterText style={styles.filterLabel}>Categoria</InterText>
                            <View style={styles.chipRow}>
                                <TouchableOpacity
                                    style={[styles.chip, !selectedCategoriaId && styles.chipActive]}
                                    onPress={() => {
                                        setSelectedCategoriaId(null);
                                        setSelectedGirone(null);
                                    }}
                                    activeOpacity={0.85}>
                                    <InterText
                                        style={[
                                            styles.chipText,
                                            !selectedCategoriaId && styles.chipTextActive,
                                        ]}>
                                        Tutte
                                    </InterText>
                                </TouchableOpacity>
                                {availableCategorie.map((categoria) => {
                                    const active = selectedCategoriaId === categoria.id;
                                    return (
                                        <TouchableOpacity
                                            key={categoria.id}
                                            style={[styles.chip, active && styles.chipActive]}
                                            onPress={() => {
                                                setSelectedCategoriaId(categoria.id);
                                                setSelectedGirone(null);
                                            }}
                                            activeOpacity={0.85}>
                                            <InterText
                                                style={[
                                                    styles.chipText,
                                                    active && styles.chipTextActive,
                                                ]}
                                                numberOfLines={1}>
                                                {categoria.nome}
                                            </InterText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={styles.filterSection}>
                            <InterText style={styles.filterLabel}>Girone</InterText>
                            <View style={styles.chipRow}>
                                <TouchableOpacity
                                    style={[styles.chip, !selectedGirone && styles.chipActive]}
                                    onPress={() => setSelectedGirone(null)}
                                    activeOpacity={0.85}>
                                    <InterText
                                        style={[
                                            styles.chipText,
                                            !selectedGirone && styles.chipTextActive,
                                        ]}>
                                        Tutti
                                    </InterText>
                                </TouchableOpacity>
                                {availableGironi.map((girone) => {
                                    const active = selectedGirone === girone;
                                    return (
                                        <TouchableOpacity
                                            key={girone}
                                            style={[styles.chip, active && styles.chipActive]}
                                            onPress={() => setSelectedGirone(girone)}
                                            activeOpacity={0.85}>
                                            <InterText
                                                style={[
                                                    styles.chipText,
                                                    active && styles.chipTextActive,
                                                ]}>
                                                {girone}
                                            </InterText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

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
                    <InterText style={styles.totalText}>
                        {partite.length} risultati totali
                    </InterText>
                </View>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center gap-3">
                    <ActivityIndicator size="large" />
                    <InterText className="text-muted-foreground">Caricamento partite...</InterText>
                </View>
            ) : (
                <FlatList
                    data={partite}
                    keyExtractor={(item, index) => String(item.id_partita ?? index)}
                    contentContainerClassName="px-5 pb-28 gap-3 pt-1"
                    onRefresh={() => loadPartite(true)}
                    refreshing={refreshing}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="mt-32 items-center gap-3">
                            <View className="bg-muted rounded-full p-2">
                                <CalendarDaysIcon size={48} color="#737373" />
                            </View>
                            <InterText className="text-lg font-semibold text-gray-500">
                                Nessuna partita trovata
                            </InterText>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const href = (
                            item.id_partita
                                ? `/partite/modal?mode=view&partitaId=${item.id_partita}&torneoId=${selectedTorneo?.id ?? item.torneo_id ?? ''}`
                                : `/partite/modal?mode=create&torneoId=${selectedTorneo?.id ?? ''}`
                        ) as Href;

                        return (
                            <Link href={href} asChild>
                                <TouchableOpacity activeOpacity={0.85}>
                                    <PartitaCard
                                        fischioInizio={item.fischio_inizio}
                                        squadraCasa={item.squadra_casa_nome}
                                        squadraOspite={item.squadra_ospite_nome}
                                        goalCasa={item.goal_casa}
                                        goalOspite={item.goal_ospite}
                                        squadraCasaAcronimo={item.squadra_casa_acronimo}
                                        squadraOspiteAcronimo={item.squadra_ospite_acronimo}
                                        squadraCasaStemma={item.squadra_casa_stemma}
                                        squadraOspiteStemma={item.squadra_ospite_stemma}
                                        squadraCasaColore={item.squadra_casa_colore}
                                        squadraOspiteColore={item.squadra_ospite_colore}
                                        categoria={item.categoria_nome}
                                        fase={item.fase}
                                        girone={item.girone}
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
});
