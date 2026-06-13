import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Link, type Href } from 'expo-router';
import {
    AwardIcon,
    CalendarDaysIcon,
    CircleDotIcon,
    PlusIcon,
    SettingsIcon,
    ShieldIcon,
    TrophyIcon,
    UsersRoundIcon,
} from 'lucide-react-native';
import errorMessage from '@/components/ErrorMessage';
import HomeMatchCard from '@/components/home/HomeMatchCard';
import HomeQuickAction from '@/components/home/HomeQuickAction';
import HomeStatCard from '@/components/home/HomeStatCard';
import { InterText } from '@/components/InterText';
import { useAuthContext } from '@/hooks/use-auth-context';
import { getListaGiocatori } from '@/data/giocatori';
import {
    getPartiteOggi,
    getStatisticheHomeTorneo,
    homeTorneoStatsType,
    partiteOggiType,
} from '@/data/partite';
import { getListaSquadre } from '@/data/squadre';
import { getListaTornei, listaTorneiType } from '@/data/tornei';

function formatDateRange(dataInizio: string | null, dataFine: string | null) {
    if (!dataInizio && !dataFine) return 'Date da definire';

    const formatter = new Intl.DateTimeFormat('it-IT', {
        day: '2-digit',
        month: 'short',
    });

    const start = dataInizio ? new Date(dataInizio) : null;
    const end = dataFine ? new Date(dataFine) : null;
    const startText = start && !isNaN(start.getTime()) ? formatter.format(start) : null;
    const endText = end && !isNaN(end.getTime()) ? formatter.format(end) : null;

    if (startText && endText) return `${startText} - ${endText}`;
    return startText ?? endText ?? 'Date da definire';
}

function buildTorneoHref(path: '/partite' | '/squadre' | '/giocatori', torneoId?: number) {
    if (!torneoId) return path as Href;
    return `${path}?torneoId=${torneoId}` as Href;
}

const emptyStats: homeTorneoStatsType = {
    upcomingMatches: 0,
    goalsScored: 0,
};

export default function HomeScreen() {
    const { claims, profile } = useAuthContext();
    const [torneo, setTorneo] = useState<listaTorneiType | null>(null);
    const [partiteOggi, setPartiteOggi] = useState<partiteOggiType[]>([]);
    const [stats, setStats] = useState<homeTorneoStatsType>(emptyStats);
    const [squadreCount, setSquadreCount] = useState(0);
    const [giocatoriCount, setGiocatoriCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const adminName = useMemo(() => {
        const fullName = [profile?.nome, profile?.cognome].filter(Boolean).join(' ');
        const email = typeof claims?.email === 'string' ? claims.email : null;
        return profile?.full_name ?? profile?.name ?? (fullName || email?.split('@')[0] || 'Admin');
    }, [claims?.email, profile]);

    const createHref = useMemo<Href>(() => {
        if (!torneo?.id) return '/tornei/modal' as Href;
        return `/giocatori/modal?mode=create&torneoId=${torneo.id}` as Href;
    }, [torneo?.id]);

    async function loadHome(isRefresh = false) {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const tornei = await getListaTornei(null);
            const currentTorneo = tornei?.[0] ?? null;
            setTorneo(currentTorneo);

            if (!currentTorneo?.id) {
                setPartiteOggi([]);
                setStats(emptyStats);
                setSquadreCount(0);
                setGiocatoriCount(0);
                return;
            }

            const [todayMatches, homeStats, squadre, giocatori] = await Promise.all([
                getPartiteOggi(currentTorneo.id),
                getStatisticheHomeTorneo(currentTorneo.id),
                getListaSquadre(null, currentTorneo.id),
                getListaGiocatori('', currentTorneo.id, 1, 1),
            ]);

            setPartiteOggi(todayMatches ?? []);
            setStats(homeStats);
            setSquadreCount(squadre?.length ?? 0);
            setGiocatoriCount(giocatori.count ?? 0);
        } catch (error: any) {
            errorMessage('Impossibile caricare la dashboard', error.message ?? String(error));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        loadHome().then(() => null);
    }, []);

    return (
        <View style={styles.screen}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => loadHome(true)} />
                }>
                <View style={styles.header}>
                    <View style={styles.greetingBlock}>
                        <InterText style={styles.eyebrow}>Bentornato,</InterText>
                        <InterText style={styles.title} numberOfLines={1}>
                            {adminName}
                        </InterText>
                    </View>

                    <View style={styles.headerActions}>
                        <Link href={createHref} asChild>
                            <TouchableOpacity style={styles.roundButton} activeOpacity={0.85}>
                                <PlusIcon size={22} color="#ffffff" strokeWidth={3} />
                            </TouchableOpacity>
                        </Link>
                        <Link href="/impostazioni" asChild>
                            <TouchableOpacity style={styles.secondaryRoundButton} activeOpacity={0.85}>
                                <SettingsIcon size={20} color="#0f172a" />
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.loadingState}>
                        <ActivityIndicator size="large" />
                        <InterText style={styles.mutedText}>Caricamento dashboard...</InterText>
                    </View>
                ) : !torneo ? (
                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIcon}>
                            <TrophyIcon size={34} color="#b3642c" />
                        </View>
                        <InterText style={styles.emptyTitle}>Nessun torneo configurato</InterText>
                        <InterText style={styles.emptyText}>
                            Crea un torneo per iniziare a vedere partite, squadre e giocatori.
                        </InterText>
                        <Link href="/tornei/modal" asChild>
                            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85}>
                                <PlusIcon size={16} color="#ffffff" />
                                <InterText style={styles.primaryButtonText}>Crea torneo</InterText>
                            </TouchableOpacity>
                        </Link>
                    </View>
                ) : (
                    <>
                        <View style={styles.torneoCard}>
                            <View style={styles.torneoIcon}>
                                <AwardIcon size={22} color="#b3642c" />
                            </View>
                            <View style={styles.torneoTextBlock}>
                                <InterText style={styles.torneoLabel}>Torneo attivo</InterText>
                                <InterText style={styles.torneoName} numberOfLines={1}>
                                    {torneo.nome}
                                </InterText>
                                <InterText style={styles.torneoMeta} numberOfLines={1}>
                                    {formatDateRange(torneo.data_inizio, torneo.data_fine)}
                                </InterText>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <InterText style={styles.sectionTitle}>Partite di oggi</InterText>
                                <Link href={buildTorneoHref('/partite', torneo.id)} asChild>
                                    <TouchableOpacity activeOpacity={0.75}>
                                        <InterText style={styles.sectionLink}>Vedi tutte</InterText>
                                    </TouchableOpacity>
                                </Link>
                            </View>

                            {partiteOggi.length > 0 ? (
                                <View style={styles.matchList}>
                                    {partiteOggi.map((partita, index) => (
                                        <HomeMatchCard
                                            key={partita.id_partita ?? `${partita.fischio_inizio}-${index}`}
                                            fase={partita.fase}
                                            categoria={partita.categoria_nome}
                                            girone={partita.girone}
                                            fischioInizio={partita.fischio_inizio}
                                            squadraCasa={partita.squadra_casa_nome}
                                            squadraOspite={partita.squadra_ospite_nome}
                                            goalCasa={partita.goal_casa}
                                            goalOspite={partita.goal_ospite}
                                        />
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.emptyInlineCard}>
                                    <CalendarDaysIcon size={22} color="#94a3b8" />
                                    <InterText style={styles.emptyInlineText}>
                                        Nessuna partita in programma oggi
                                    </InterText>
                                </View>
                            )}
                        </View>

                        <View style={styles.section}>
                            <InterText style={styles.sectionTitle}>Statistiche torneo</InterText>
                            <View style={styles.statsGrid}>
                                <View style={styles.statsRow}>
                                    <HomeStatCard
                                        label="Partite in arrivo"
                                        value={stats.upcomingMatches}
                                        tone="red"
                                        icon={<CalendarDaysIcon size={20} color="#be123c" />}
                                    />
                                    <HomeStatCard
                                        label="Goal segnati"
                                        value={stats.goalsScored}
                                        tone="gold"
                                        icon={<CircleDotIcon size={20} color="#b45309" />}
                                    />
                                </View>
                                <View style={styles.statsRow}>
                                    <HomeStatCard
                                        label="Squadre iscritte"
                                        value={squadreCount}
                                        tone="green"
                                        icon={<ShieldIcon size={20} color="#15803d" />}
                                    />
                                    <HomeStatCard
                                        label="Giocatori iscritti"
                                        value={giocatoriCount}
                                        tone="blue"
                                        icon={<UsersRoundIcon size={20} color="#1d4ed8" />}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <InterText style={styles.sectionTitle}>Azioni rapide</InterText>
                            <View style={styles.actionsList}>
                                <HomeQuickAction
                                    label="Gestisci tornei"
                                    href="/tornei"
                                    icon={<TrophyIcon size={19} color="#b3642c" />}
                                />
                                <HomeQuickAction
                                    label="Apri partite"
                                    href={buildTorneoHref('/partite', torneo.id)}
                                    icon={<CalendarDaysIcon size={19} color="#be123c" />}
                                />
                                <HomeQuickAction
                                    label="Apri squadre"
                                    href={buildTorneoHref('/squadre', torneo.id)}
                                    icon={<ShieldIcon size={19} color="#15803d" />}
                                />
                                <HomeQuickAction
                                    label="Apri giocatori"
                                    href={buildTorneoHref('/giocatori', torneo.id)}
                                    icon={<UsersRoundIcon size={19} color="#1d4ed8" />}
                                />
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        padding: 20,
        paddingBottom: 122,
        gap: 22,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        paddingTop: 4,
    },
    greetingBlock: {
        flex: 1,
        minWidth: 0,
    },
    eyebrow: {
        color: '#64748b',
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        fontWeight: '500',
    },
    title: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 30,
        fontWeight: '700',
        lineHeight: 38,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    roundButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    secondaryRoundButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    loadingState: {
        minHeight: 360,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    mutedText: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 14,
    },
    emptyCard: {
        minHeight: 360,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        padding: 24,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#fff7ed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptyText: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    primaryButton: {
        marginTop: 6,
        backgroundColor: '#0f172a',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        fontWeight: '600',
    },
    torneoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        padding: 16,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    torneoIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#fff7ed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    torneoTextBlock: {
        flex: 1,
        minWidth: 0,
    },
    torneoLabel: {
        color: '#b3642c',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    torneoName: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 17,
        fontWeight: '700',
        marginTop: 2,
    },
    torneoMeta: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 13,
        marginTop: 2,
    },
    section: {
        gap: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    sectionTitle: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        fontWeight: '700',
    },
    sectionLink: {
        color: '#b3642c',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        fontWeight: '600',
    },
    matchList: {
        gap: 10,
    },
    emptyInlineCard: {
        minHeight: 78,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        padding: 16,
    },
    emptyInlineText: {
        color: '#64748b',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        fontWeight: '600',
    },
    statsGrid: {
        gap: 12,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionsList: {
        gap: 10,
    },
});
