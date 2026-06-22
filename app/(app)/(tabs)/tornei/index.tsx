import React, { useEffect, useState } from 'react';
import {
    View,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
    SectionList,
} from 'react-native';
import { Link } from 'expo-router';
import {
    getListaTornei,
    listaTorneiStatusFilter,
    listaTorneiType,
} from '@/data/tornei';
import { TrophyIcon } from 'lucide-react-native';
import { InterText } from '@/components/generic/InterText';
import TorneoCard from '@/components/tornei/TorneoCard';
import errorMessage from '@/components/generic/ErrorMessage';

function raggruppaTornei(items: listaTorneiType[]) {
    const groups: { [key: string]: listaTorneiType[] } = {};

    items.forEach((item) => {
        const year = item.data_fine ? new Date(item.data_fine).getFullYear().toString() : 'N/A';
        if (!groups[year]) groups[year] = [];
        groups[year].push(item);
    });

    return Object.keys(groups)
        .sort((a, b) => parseInt(b) - parseInt(a))
        .map((year) => ({
            title: year != 'N/A' ? "Fino al " + year : "Nessuna data specificata",
            data: groups[year],
        }));
}

export default function TorneiScreen() {
    const [tornei, setTornei] = useState<listaTorneiType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    async function loadTornei(isRefresh = false) {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setLoadError(null);

        try {
            const data = await getListaTornei(null, {});
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

    // Caricamento iniziale dei dati al montaggio del componente
    useEffect(() => {
        loadTornei().then(r => null);
    }, []);

    return (
        <View className="bg-background flex-1">
            {/* ── List ── */}
            {loading ? (
                <View className="flex-1 items-center justify-center gap-3">
                    <ActivityIndicator size="large" />
                    <InterText className="text-muted-foreground">Caricamento tornei...</InterText>
                </View>
            ) : (
                <SectionList
                    sections={raggruppaTornei(tornei)}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerClassName="px-5 pb-28 pt-1"
                    onRefresh={() => loadTornei(true)}
                    refreshing={refreshing}
                    showsVerticalScrollIndicator={true}
                    stickySectionHeadersEnabled={false}
                    ItemSeparatorComponent={<View className="my-1"></View>}
                    ListEmptyComponent={
                        <View className="mt-16 items-center gap-3">
                            <View className="bg-muted rounded-full p-5">
                                <TrophyIcon size={36} color="#737373" />
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
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={styles.sectionHeaderContainer}>
                            <InterText style={styles.sectionHeaderTitle}>{title}</InterText>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: 12,
    },
    sectionHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 12,
        gap: 12,
    },
    sectionHeaderTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0f172a',
    },
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
