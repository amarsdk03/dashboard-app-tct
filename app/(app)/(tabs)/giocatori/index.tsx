import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Link, type Href } from 'expo-router';
import { PlusIcon, SearchIcon, SlidersHorizontal, UserRound } from 'lucide-react-native';
import { InterText } from '@/components/InterText';
import errorMessage from '@/components/ErrorMessage';
import GiocatoreCard from '@/components/giocatori/GiocatoreCard';
import { getListaGiocatori, listaGiocatoriType } from '@/data/giocatori';
import { getListaTornei, listaTorneiType } from '@/data/tornei';

const RESULTS_PER_PAGE = 30;

type TabKey = 'tutti' | 'questanno' | 'capitani';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'tutti', label: 'Tutti' },
    { key: 'questanno', label: "Quest'anno" },
    { key: 'capitani', label: 'Capitani' },
];

export default function GiocatoriScreen() {
    const [tornei, setTornei] = useState<listaTorneiType[]>([]);
    const [selectedTorneo, setSelectedTorneo] = useState<listaTorneiType | null>(null);
    const [giocatori, setGiocatori] = useState<listaGiocatoriType[]>([]);
    const [count, setCount] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<TabKey>('tutti');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const createHref = useMemo<Href>(() => {
        if (!selectedTorneo?.id) return '/giocatori/modal?mode=create' as Href;
        return `/giocatori/modal?mode=create&torneoId=${selectedTorneo.id}` as Href;
    }, [selectedTorneo?.id]);

    async function loadTornei() {
        try {
            const data = await getListaTornei(null);
            const lista = data ?? [];
            setTornei(lista);
            setSelectedTorneo((current) => current ?? lista[0] ?? null);
        } catch (error: any) {
            errorMessage('Impossibile recuperare i tornei', error.message ?? String(error));
        }
    }

    async function loadGiocatori(isRefresh = false) {
        if (!selectedTorneo?.id) {
            setGiocatori([]);
            setCount(0);
            setLoading(false);
            return;
        }

        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await getListaGiocatori(
                search,
                selectedTorneo.id,
                1,
                RESULTS_PER_PAGE,
                { soloCapitani: activeTab === 'capitani' },
            );
            setGiocatori(data.result ?? []);
            setCount(data.count ?? 0);
        } catch (error: any) {
            errorMessage('Impossibile recuperare i giocatori', error.message ?? String(error));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    function handleFilterPress() {
        Alert.alert('Filtri giocatori', 'I filtri avanzati arrivano nel prossimo step.');
    }

    function handleTabPress(key: TabKey) {
        setActiveTab(key);
        if (key === 'questanno' && tornei[0]) {
            setSelectedTorneo(tornei[0]);
        }
    }

    useEffect(() => {
        loadTornei().then(() => null);
    }, []);

    useEffect(() => {
        loadGiocatori().then(() => null);
    }, [selectedTorneo?.id, search, activeTab]);

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
                    onRefresh={() => loadGiocatori(true)}
                    refreshing={refreshing}
                    showsVerticalScrollIndicator={false}
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
                        const href = (
                            item.g_id && selectedTorneo?.id
                                ? `/giocatori/modal?mode=view&giocatoreId=${item.g_id}&torneoId=${selectedTorneo.id}`
                                : '/giocatori/modal?mode=create'
                        ) as Href;

                        return (
                            <Link href={href} asChild>
                                <TouchableOpacity activeOpacity={0.85}>
                                    <GiocatoreCard
                                        id={item.g_id ?? ''}
                                        nome={item.g_nome}
                                        cognome={item.g_cognome}
                                        linkFoto={item.g_link_foto}
                                        nomeSquadra={item.s_nome}
                                        acronimoSquadra={item.s_acronimo}
                                        coloreSquadra={item.s_colore_squadra}
                                        isCapitano={item.g_is_capitano}
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
});
