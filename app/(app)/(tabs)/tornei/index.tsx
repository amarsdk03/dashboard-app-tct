import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
    TextInput,
} from 'react-native';
import { Link } from 'expo-router';
import {
    getListaTornei,
    listaTorneiStatusFilter,
    listaTorneiType,
} from '@/data/tornei';
import { PlusIcon, SearchIcon, SlidersHorizontal, TrophyIcon } from 'lucide-react-native';
import { InterText } from '@/components/InterText';
import TorneoCard from '@/components/tornei/TorneoCard';
import errorMessage from '@/components/ErrorMessage';

const STATUS_FILTERS: { key: listaTorneiStatusFilter; label: string }[] = [
    { key: 'tutti', label: 'Tutti' },
    { key: 'in_corso', label: 'In corso' },
    { key: 'futuri', label: 'Futuri' },
    { key: 'conclusi', label: 'Conclusi' },
];

export default function TorneiScreen() {
    const [tornei, setTornei] = useState<listaTorneiType[]>([]);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeStatus, setActiveStatus] = useState<listaTorneiStatusFilter>('tutti');
    const [filterOpen, setFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const filterActive = useMemo(
        () => filterOpen || activeStatus !== 'tutti',
        [activeStatus, filterOpen]
    );

    async function loadTornei(isRefresh = false) {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setLoadError(null);

        try {
            const data = await getListaTornei(debouncedSearch, { status: activeStatus });
            setTornei(data ?? []);
        } catch (error: any) {
            const message = error?.message ?? String(error);
            setLoadError(message);
            errorMessage('Impossibile recuperare i tornei', message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    function handleResetFilters() {
        setSearch('');
        setDebouncedSearch('');
        setActiveStatus('tutti');
        setFilterOpen(false);
    }

    useEffect(() => {
        loadTornei().then(r => null);
    }, [debouncedSearch, activeStatus]);

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 350);
        return () => clearTimeout(timeout);
    }, [search]);

    return (
        <View className="bg-background flex-1">
            {/* ── Header ── */}
            <View className="bg-background p-6 pb-4">
                <View style={styles.headerRow}>
                    <InterText style={styles.title}>Lista tornei</InterText>
                    <Link href="/tornei/modal?mode=create" asChild>
                        <TouchableOpacity style={styles.button} activeOpacity={0.85}>
                            <PlusIcon size={16} color="#fff" />
                            <InterText style={styles.buttonText}>Crea nuovo</InterText>
                        </TouchableOpacity>
                    </Link>
                </View>

                <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                        <SearchIcon size={18} color="#6b7280" />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Cerca per nome torneo..."
                            placeholderTextColor="#9ca3af"
                            style={styles.searchInput}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.filterButton, filterActive && styles.filterButtonActive]}
                        onPress={() => setFilterOpen((value) => !value)}
                        activeOpacity={0.85}>
                        <SlidersHorizontal
                            size={20}
                            color={filterActive ? '#ffffff' : '#0f6096'}
                            strokeWidth={2.5}
                        />
                    </TouchableOpacity>
                </View>

                {filterOpen && (
                    <View style={styles.filterPanel}>
                        <View style={styles.filterSection}>
                            <InterText style={styles.filterLabel}>Stato torneo</InterText>
                            <View style={styles.chipRow}>
                                {STATUS_FILTERS.map((filter) => {
                                    const active = activeStatus === filter.key;
                                    return (
                                        <TouchableOpacity
                                            key={filter.key}
                                            style={[styles.chip, active && styles.chipActive]}
                                            onPress={() => setActiveStatus(filter.key)}
                                            activeOpacity={0.85}>
                                            <InterText
                                                style={[
                                                    styles.chipText,
                                                    active && styles.chipTextActive,
                                                ]}>
                                                {filter.label}
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

                <View style={styles.resultsRow}>
                    <InterText style={styles.totalText}>{tornei.length} risultati totali</InterText>
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
                    contentContainerClassName="px-5 pb-28 gap-3 pt-1"
                    onRefresh={() => loadTornei(true)}
                    refreshing={refreshing}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="mt-16 items-center gap-3">
                            <View className="bg-muted rounded-full p-5">
                                <TrophyIcon size={36} color="hsl(var(--muted-foreground))" />
                            </View>
                            <InterText className="text-foreground text-lg font-semibold">
                                {loadError ? 'Errore nel caricamento' : 'Nessun torneo trovato'}
                            </InterText>
                            {loadError && (
                                <TouchableOpacity
                                    style={styles.retryButton}
                                    onPress={() => loadTornei()}
                                    activeOpacity={0.85}>
                                    <InterText style={styles.retryText}>Riprova</InterText>
                                </TouchableOpacity>
                            )}
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 18,
    },
    title: {
        flex: 1,
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 30,
        fontWeight: '700',
    },
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
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
    },
    searchInput: {
        flex: 1,
        color: '#0f172a',
        fontFamily: 'Inter',
        fontSize: 15,
        minWidth: 0,
        paddingVertical: 0,
    },
    filterButton: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: '#eef6fb',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    filterButtonActive: {
        backgroundColor: '#0f6096',
        borderColor: '#0f6096',
    },
    filterPanel: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        padding: 14,
        marginBottom: 16,
        gap: 2,
        shadowColor: '#0f172a',
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
    },
    resetButton: {
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    resetText: {
        color: '#475569',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        fontWeight: '600',
    },
    applyButton: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#0f172a',
    },
    applyText: {
        color: '#ffffff',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        fontWeight: '600',
    },
    resultsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    totalText: {
        color: '#64748b',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
    },
    retryButton: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#0f172a',
    },
    retryText: {
        color: '#ffffff',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        fontWeight: '600',
    },
});
