import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    ArrowLeftIcon,
    SquarePenIcon,
} from 'lucide-react-native';
import { Link } from 'expo-router';
import {
    datiTorneoType,
    getDatiTorneo,
} from '@/data/tornei';
import { categorieGestioneTorneoType, getCategorieGestioneTorneo } from '@/data/classifiche';
import { getListaGiocatori } from '@/data/giocatori';
import { getConteggioPartiteTorneo } from '@/data/partite';
import { getListaSquadre } from '@/data/squadre';
import { InterText } from '@/components/generic/InterText';
import DateTimePickerField from '@/components/input/DateTimePickerField';
import TextInputField from '@/components/input/TextInputField';
import errorMessage from '@/components/generic/ErrorMessage';
import TorneoLinkedData from '@/components/tornei/TorneoLinkedData';
import ChipPickerField from '@/components/input/ChipPickerField';
import { getListaCampi, listaCampiType } from '@/data/campi';
import FormButton from '@/components/input/FormButton';

type Props = {
    torneoId: number | null;
    onClose: () => void;
};

interface datiTorneo {
    id: number;
    nome: string | null;
    descrizione: string | null;
    dataInizio: Date | null;
    dataFine: Date | null;
    idCampo: string | null;
}

type LinkedDataSummary = {
    squadreCount: number;
    giocatoriCount: number;
    partiteCount: number;
};

export default function TorneoModal(props: Props) {
    const [loading, setLoading] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summary, setSummary] = useState<LinkedDataSummary>({
        squadreCount: 0,
        giocatoriCount: 0,
        partiteCount: 0,
    });
    const [campi, setCampi] = useState<listaCampiType[]>([]);
    const [editSetupLoading, setEditSetupLoading] = useState(false);
    const [categorieGestione, setCategorieGestione] = useState<categorieGestioneTorneoType>([]);

    const [form, setForm] = useState<datiTorneo>({
        id: props.torneoId || -1,
        nome: '',
        descrizione: '',
        dataInizio: null,
        dataFine: null,
        idCampo: null,
    });

    const handleClose = () => {
        props.onClose();
    };

    async function loadCampi() {
        const data = await getListaCampi();
        const lista = data ?? [];
        setCampi(lista);
        setForm((current) => ({
            ...current,
            idCampo: current.idCampo ?? (lista[0]?.id != null ? String(lista[0].id) : null),
        }));
    }

    useEffect(() => {
        loadCampi().then(() => null);
    }, []);

    useEffect(() => {
        setLoading(true);

        getDatiTorneo(props.torneoId || -1)
            .then((dati: datiTorneoType) => {
                if (!dati) return;

                setForm({
                    id: dati?.id,
                    nome: dati?.nome ?? '',
                    descrizione: dati?.descrizione ?? '',
                    dataInizio: dati?.data_inizio ? new Date(dati.data_inizio) : null,
                    dataFine: dati?.data_fine ? new Date(dati.data_fine) : null,
                    idCampo: dati?.campo?.id != null ? String(dati.campo.id) : null,
                });
            })
            .catch((error) => {
                errorMessage('Impossibile recuperare i dati', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [props.torneoId]);

    useEffect(() => {
        if (!props.torneoId) {
            setSummary({
                squadreCount: 0,
                giocatoriCount: 0,
                partiteCount: 0,
            });
            return;
        }

        setSummaryLoading(true);

        Promise.all([
            getListaSquadre(null, props.torneoId),
            getListaGiocatori('', props.torneoId, 1, 1),
            getConteggioPartiteTorneo(props.torneoId),
        ])
            .then(([squadre, giocatori, partiteCount]) => {
                setSummary({
                    squadreCount: squadre.length,
                    giocatoriCount: giocatori.count ?? 0,
                    partiteCount,
                });
            })
            .catch((error) => {
                errorMessage('Impossibile recuperare i dati collegati', error);
                setSummary({
                    squadreCount: 0,
                    giocatoriCount: 0,
                    partiteCount: 0,
                });
            })
            .finally(() => {
                setSummaryLoading(false);
            });
    }, [props.torneoId]);

    useEffect(() => {
        if (props.torneoId) {
            setEditSetupLoading(true);

            Promise.all([getCategorieGestioneTorneo(props.torneoId)])
                .then(([categorieGestioneTorneo]) => {
                    setCategorieGestione(categorieGestioneTorneo);
                })
                .catch((error) => {
                    errorMessage('Impossibile recuperare categorie e calendario', error);
                })
                .finally(() => {
                    setEditSetupLoading(false);
                });
        }
    }, [props.torneoId]);

    if (loading) {
        return (
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.formCard}>
                    <View className="flex-1 items-center justify-center gap-3 py-16">
                        <ActivityIndicator size="large" />
                        <InterText className="text-muted-foreground">Caricamento dati...</InterText>
                    </View>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonSecondary]}
                        onPress={handleClose}
                        activeOpacity={0.8}>
                        <ArrowLeftIcon size={16} color="#6b7280" />
                        <InterText style={[styles.buttonText, styles.buttonSecondaryText]}>
                            Torna indietro
                        </InterText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.formCard}>
                <View style={styles.section}>
                    <InterText style={styles.sectionTitle}>Dati principali:</InterText>

                    <View style={styles.formCol}>
                        <TextInputField
                            label={'Nome torneo'}
                            readonly={true}
                            value={form.nome}
                            onChange={() => null}
                            placeholder={'es: 4° Edizione - 2025/2026'}
                        />

                        <TextInputField
                            label={'Descrizione'}
                            readonly={true}
                            value={form.descrizione}
                            onChange={() => null}
                            placeholder={
                                'Quota di iscrizione, numero di posti disponibili, link a modulistiche varie, ecc...'
                            }
                            multiline={true}
                        />

                        <View style={styles.formRow}>
                            <View style={styles.flexChild}>
                                <DateTimePickerField
                                    mode={'date'}
                                    label="Data d'inizio"
                                    readonly={true}
                                    value={form.dataInizio}
                                    onChange={() => null}
                                />
                            </View>
                            <View style={styles.flexChild}>
                                <DateTimePickerField
                                    mode={'date'}
                                    label="Data di fine"
                                    readonly={true}
                                    value={form.dataFine}
                                    onChange={() => null}
                                />
                            </View>
                        </View>

                        <ChipPickerField
                            label="Campo svolgimento"
                            readonly={true}
                            options={campi}
                            selectedId={form.idCampo}
                            getId={(campo) => campo.id.toString()}
                            getValue={(campo) => campo.nome}
                            onSelect={() => null}
                        />
                    </View>
                </View>

                <TorneoLinkedData
                    torneoId={form.id}
                    loading={summaryLoading}
                    squadreCount={summary.squadreCount}
                    giocatoriCount={summary.giocatoriCount}
                    partiteCount={summary.partiteCount}
                />

                {form.id &&
                    (editSetupLoading ? (
                        <View style={styles.emptyState}>
                            <ActivityIndicator />
                            <InterText style={styles.emptyStateText}>
                                Caricamento categorie e classifiche...
                            </InterText>
                        </View>
                    ) : (
                        <ReadonlyTournamentManagement categorie={categorieGestione} />
                    ))}

                <View style={[styles.dynamicRow, { marginTop: 12 }]}>
                    <FormButton
                        type={'secondary'}
                        label={'Indietro'}
                        onPress={handleClose}
                        icon={ArrowLeftIcon}
                    />
                    <Link
                        key={form.id}
                        href={`/tornei/modal?mode=edit&torneoId=${form.id}`}
                        asChild>
                        <FormButton label={'Modifica'} icon={SquarePenIcon} />
                    </Link>
                </View>
            </View>
        </ScrollView>
    );
}

function ReadonlyTournamentManagement({ categorie }: { categorie: categorieGestioneTorneoType }) {
    return (
        <View style={[styles.section, styles.container]}>
            <InterText style={styles.sectionTitle}>Categorie del torneo:</InterText>

            {categorie.length === 0 ? (
                <View style={styles.emptyState}>
                    <InterText style={styles.emptyStateText}>
                        Nessuna categoria configurata per questo torneo.
                    </InterText>
                </View>
            ) : (
                categorie.map((categoria) => (
                    <View key={categoria.id} style={styles.subCard}>
                        <View style={styles.subCardHeader}>
                            <InterText style={styles.subCardTitle}>{categoria.nome}</InterText>
                            <InterText style={styles.tableStat}>
                                {categoria.partite_count} partite
                            </InterText>
                        </View>
                        <View style={styles.detailGrid}>
                            <ReadonlyStat
                                label="Gironi previsti"
                                value={String(categoria.num_gironi)}
                            />
                            <ReadonlyStat
                                label="Gironi calendario"
                                value={
                                    categoria.gironi_calendario.length
                                        ? categoria.gironi_calendario.join(', ')
                                        : '-'
                                }
                            />
                            <ReadonlyStat label="Squadre" value={String(categoria.squadre_count)} />
                            <ReadonlyStat
                                label="Fasi"
                                value={
                                    categoria.fasi_partite?.length
                                        ? categoria.fasi_partite.join(', ')
                                        : 'Gironi'
                                }
                            />
                            <ReadonlyStat
                                label="Qualificate"
                                value={String(categoria.num_qualificate)}
                            />
                            <ReadonlyStat label="Playoff" value={String(categoria.num_playoff)} />
                            <ReadonlyStat
                                label="Eliminate"
                                value={String(categoria.num_eliminate)}
                            />
                        </View>
                    </View>
                ))
            )}
        </View>
    );
}

function ReadonlyStat({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.detailItem}>
            <InterText style={styles.detailLabel}>{label}</InterText>
            <InterText style={styles.detailValue} numberOfLines={2}>
                {value}
            </InterText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderTopColor: '#e2e8f0',
        borderTopWidth: 1,
        paddingVertical: 25,
    },
    scrollContainer: {
        padding: 16,
        paddingBottom: 128,
    },
    section: {
        gap: 14,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        color: '#0f172a',
        fontSize: 18,
        fontWeight: '700',
    },
    helperText: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '400',
        lineHeight: 19,
    },
    formCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        gap: 20,
    },
    formCol: {
        gap: 12,
        paddingVertical: 5,
    },
    formRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 8,
    },
    dynamicRow: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        width: '100%',
        gap: 12,
    },
    flexChild: {
        flex: 1,
    },
    stepHeader: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    stepItem: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
    },
    stepDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    stepDotActive: {
        backgroundColor: '#0f172a',
        borderColor: '#0f172a',
    },
    stepDotCompleted: {
        backgroundColor: '#b98e6b',
        borderColor: '#ba875d',
    },
    stepDotText: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '700',
    },
    stepDotTextActive: {
        color: '#ffffff',
    },
    stepLabel: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
    stepLabelActive: {
        color: '#0f172a',
        fontWeight: '700',
    },
    stepLabelCompleted: {
        color: '#b37847',
        fontWeight: '600',
    },
    subCard: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 16,
        padding: 14,
        gap: 12,
    },
    nestedCard: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        padding: 12,
        marginTop: 12,
    },
    subCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    subCardTitle: {
        color: '#0f172a',
        fontSize: 15,
        fontWeight: '700',
    },
    detailGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    detailItem: {
        flexBasis: '47%',
        flexGrow: 1,
        minWidth: 132,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 12,
        padding: 10,
    },
    detailLabel: {
        color: '#64748b',
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    detailValue: {
        color: '#0f172a',
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 18,
    },
    iconButton: {
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111111',
        marginBottom: 6,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        maxWidth: '100%',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    chipActive: {
        backgroundColor: '#0f172a',
        borderColor: '#0f172a',
    },
    chipText: {
        color: '#475569',
        fontSize: 13,
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#ffffff',
    },
    emptyState: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        padding: 14,
    },
    emptyStateText: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '400',
        lineHeight: 19,
    },
    table: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    tableTeam: {
        flex: 1,
        minWidth: 0,
    },
    tableTitle: {
        color: '#0f172a',
        fontSize: 13,
        fontWeight: '700',
    },
    tableMeta: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '400',
        marginTop: 2,
    },
    tableStat: {
        color: '#0f172a',
        fontSize: 13,
        fontWeight: '700',
        minWidth: 42,
        textAlign: 'right',
    },
    button: {
        flex: 1,
        width: '100%',
        backgroundColor: '#b98e6b',
        borderRadius: 12,
        padding: 12,
        minHeight: 46,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        shadowColor: '#292929',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    buttonDestructive: {
        backgroundColor: '#d9a3a3',
    },
    buttonDestructiveText: {
        color: '#7c3f3f',
    },
    buttonSecondary: {
        backgroundColor: '#e5e7eb',
    },
    buttonSecondaryText: {
        color: '#6b7280',
    },
    outlineButton: {
        flex: 1,
        width: '100%',
        minHeight: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        paddingVertical: 11,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    outlineButtonText: {
        color: '#0f172a',
        fontSize: 14,
        fontWeight: '600',
    },
});
