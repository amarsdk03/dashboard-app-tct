import React, { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { type Href, Link } from 'expo-router';
import {
    AwardIcon,
    CalendarDaysIcon,
    ChevronRightIcon,
    MailIcon,
    PlusIcon,
    ShieldIcon,
    TrendingUpIcon,
    TrophyIcon,
    UsersRoundIcon,
} from 'lucide-react-native';
import errorMessage from '@/components/generic/ErrorMessage';
import HomeMatchCard from '@/components/home/HomeMatchCard';
import HomeQuickAction from '@/components/home/HomeQuickAction';
import HomeStatCard from '@/components/home/HomeStatCard';
import { InterText } from '@/components/generic/InterText';
import { getListaGiocatori } from '@/data/giocatori';
import {
    getPartiteOggi,
    getStatisticheHomeTorneo,
    homeTorneoStatsType,
    partiteOggiType,
} from '@/data/partite';
import { getListaSquadre } from '@/data/squadre';
import { getListaTornei, listaTorneiType } from '@/data/tornei';
import CurrentRankingsTables from '@/components/home/CurrentRankingsTables';
import { useAuthContext } from '@/hooks/use-auth-context';

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

type ContactRowProps = {
    icon: ReactNode;
    label: string;
    value: string;
    onPress: () => void;
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
        const name =
            profile?.full_name ?? profile?.name ?? (fullName || email?.split('@')[0] || 'Admin');

        return name.charAt(0).toUpperCase() + name.slice(1);
    }, [claims?.email, profile]);

    async function openExternalUrl(url: string) {
        try {
            const canOpen = await Linking.canOpenURL(url);
            if (!canOpen) {
                Alert.alert(
                    'Link non disponibile',
                    'Non riesco ad aprire questo contatto dal dispositivo.'
                );
                return;
            }

            await Linking.openURL(url);
        } catch {
            Alert.alert(
                'Link non disponibile',
                'Non riesco ad aprire questo contatto dal dispositivo.'
            );
        }
    }

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
                        <View>
                            <View style={styles.greetingBlock}>
                                <InterText style={styles.eyebrow}>Bentornato,</InterText>
                                <InterText style={styles.title} numberOfLines={1}>
                                    {adminName}!
                                </InterText>
                            </View>

                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <InterText style={styles.sectionTitle}>
                                        Partite di oggi
                                    </InterText>
                                    <Link href={buildTorneoHref('/partite', torneo.id)} asChild>
                                        <TouchableOpacity activeOpacity={0.75}>
                                            <InterText style={styles.sectionLink}>
                                                Vedi tutte
                                            </InterText>
                                        </TouchableOpacity>
                                    </Link>
                                </View>

                                {partiteOggi.length > 0 ? (
                                    <View style={styles.matchList}>
                                        {partiteOggi.map((p, index) => (
                                            <Link
                                                key={p.id_partita ?? `${p.fischio_inizio}-${index}`}
                                                href={`/partite/modal?mode=edit&partitaId=${p.id_partita}&torneoId=${p.torneo_id}`}
                                                asChild>
                                                <TouchableOpacity activeOpacity={0.9}>
                                                    <HomeMatchCard
                                                        fase={p.fase}
                                                        categoria={p.categoria_nome}
                                                        girone={p.girone}
                                                        fischioInizio={p.fischio_inizio}
                                                        squadraCasa={p.squadra_casa_nome}
                                                        squadraOspite={p.squadra_ospite_nome}
                                                        squadraCasaAcronimo={
                                                            p.squadra_casa_acronimo
                                                        }
                                                        squadraOspiteAcronimo={
                                                            p.squadra_ospite_acronimo
                                                        }
                                                        squadraCasaStemma={p.squadra_casa_stemma}
                                                        squadraOspiteStemma={
                                                            p.squadra_ospite_stemma
                                                        }
                                                        goalCasa={p.goal_casa}
                                                        goalOspite={p.goal_ospite}
                                                    />
                                                </TouchableOpacity>
                                            </Link>
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
                        </View>

                        <View style={styles.section}>
                            <InterText style={styles.sectionTitle}>Statistiche rapide</InterText>

                            <Link href={`/tornei/modal?mode=view&torneoId=${torneo.id}`} asChild>
                                <TouchableOpacity activeOpacity={0.9}>
                                    <View style={styles.torneoCard}>
                                        <View style={styles.torneoIcon}>
                                            <AwardIcon size={22} color="#b3642c" />
                                        </View>
                                        <View style={styles.torneoTextBlock}>
                                            <InterText style={styles.torneoLabel}>
                                                Torneo in corso:
                                            </InterText>
                                            <InterText style={styles.torneoName} numberOfLines={1}>
                                                {torneo.nome}
                                            </InterText>
                                            <InterText style={styles.torneoMeta} numberOfLines={1}>
                                                {formatDateRange(
                                                    torneo.data_inizio,
                                                    torneo.data_fine
                                                )}
                                            </InterText>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </Link>

                            <View style={styles.statsGrid}>
                                <View style={styles.statsRow}>
                                    <HomeStatCard
                                        label="Partite in arrivo"
                                        value={stats.upcomingMatches}
                                        tone="red"
                                        icon={<CalendarDaysIcon size={36} color="#be123c" />}
                                    />
                                    <HomeStatCard
                                        label="Goal segnati"
                                        value={stats.goalsScored}
                                        tone="gold"
                                        icon={<TrendingUpIcon size={36} color="#b45309" />}
                                    />
                                </View>
                                <View style={styles.statsRow}>
                                    <HomeStatCard
                                        label="Squadre iscritte"
                                        value={squadreCount}
                                        tone="green"
                                        icon={<ShieldIcon size={36} color="#15803d" />}
                                    />
                                    <HomeStatCard
                                        label="Giocatori iscritti"
                                        value={giocatoriCount}
                                        tone="blue"
                                        icon={<UsersRoundIcon size={36} color="#1d4ed8" />}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <InterText style={styles.sectionTitle}>Classifiche attuali</InterText>
                            <CurrentRankingsTables />
                        </View>

                        <View style={styles.section}>
                            <InterText style={styles.sectionTitle}>Azioni rapide</InterText>
                            <View style={styles.actionsList}>
                                <HomeQuickAction
                                    label="Apri partite recenti"
                                    href={buildTorneoHref('/partite', torneo.id)}
                                    icon={<CalendarDaysIcon size={19} color="#be123c" />}
                                />
                                <HomeQuickAction
                                    label="Apri squadre attuali"
                                    href={buildTorneoHref('/squadre', torneo.id)}
                                    icon={<ShieldIcon size={19} color="#15803d" />}
                                />
                                <HomeQuickAction
                                    label="Apri giocatori attivi"
                                    href={buildTorneoHref('/giocatori', torneo.id)}
                                    icon={<UsersRoundIcon size={19} color="#1d4ed8" />}
                                />
                            </View>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTextBlock}>
                                    <InterText style={styles.sectionTitle}>
                                        Contatti utili
                                    </InterText>
                                    <InterText style={styles.sectionSubtitle}>
                                        Problemi durante l'utilizzo dell'app? Errori o bug strani?
                                        Nessun problema: contattaci e ti risponderemo il prima
                                        possibile!
                                    </InterText>
                                </View>
                            </View>

                            <View style={styles.contactList}>
                                <ContactRow
                                    icon={<MailIcon size={18} color="#0f172a" />}
                                    label="Email:"
                                    value="amarsdk03@gmail.com"
                                    onPress={() => openExternalUrl('mailto:amarsdk03@gmail.com')}
                                />
                                <ContactRow
                                    icon={<MailIcon size={18} color="#0f172a" />}
                                    label="Email:"
                                    value="alessandrogremes04@gmail.com"
                                    onPress={() =>
                                        openExternalUrl('mailto:alessandrogremes04@gmail.com')
                                    }
                                />
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

function ContactRow({ icon, label, value, onPress }: ContactRowProps) {
    return (
        <TouchableOpacity style={styles.contactRow} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.detailIcon}>{icon}</View>
            <View style={styles.detailTextBlock}>
                <InterText style={styles.detailLabel}>{label}</InterText>
                <InterText style={styles.detailValue} numberOfLines={1}>
                    {value}
                </InterText>
            </View>
            <ChevronRightIcon size={18} color="#94a3b8" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        padding: 20,
        paddingBottom: 120,
        gap: 32,
    },
    greetingBlock: {
        flex: 1,
        minWidth: 0,
        marginTop: 4,
        marginBottom: 24,
    },
    contactList: {
        gap: 4,
    },
    contactRow: {
        minHeight: 52,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    detailIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailTextBlock: {
        flex: 1,
        minWidth: 0,
    },
    detailLabel: {
        color: '#64748b',
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        fontWeight: '500',
    },
    detailValue: {
        color: '#0f172a',
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
        marginTop: 2,
    },
    card: {
        gap: 16,
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
    eyebrow: {
        color: '#64748b',
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 2,
    },
    title: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 32,
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
        marginBottom: 2,
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
    sectionSubtitle: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 13,
        lineHeight: 19,
        marginTop: 2,
    },
    sectionTextBlock: {
        flex: 1,
        minWidth: 0,
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
