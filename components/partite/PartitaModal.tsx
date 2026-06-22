import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { ArrowLeftIcon, PencilIcon, PlusIcon, SaveIcon, Trash2Icon } from 'lucide-react-native';
import { InterText } from '@/components/generic/InterText';
import DateTimePickerField from '@/components/input/DateTimePickerField';
import TextInputField from '@/components/input/TextInputField';
import errorMessage from '@/components/generic/ErrorMessage';
import {
    getAzioniPartita,
    getDatiPartita,
    insertAzionePartita,
    getListaCategorie,
    insertPartita,
    deleteAzionePartita,
    updateAzionePartita,
    updatePartita,
    getGiocatoriPartita,
    getGiocatoriSquadrePartita,
    getCampiPartita,
    getArbitriPartita,
    azioniPartitaType,
    arbitriPartitaType,
    campiPartitaType,
    datiPartitaType,
    giocatoriPartitaType,
    listaCategorieType,
} from '@/data/partite';
import { getListaSquadre, listaSquadreType } from '@/data/squadre';
import { getListaTornei, listaTorneiType } from '@/data/tornei';
import { Enums } from '@/types/database.types';

export type PartitaModalMode = 'view' | 'create' | 'edit';

type Props = {
    mode: PartitaModalMode;
    partitaId?: number;
    torneoId?: number;
    onClose: () => void;
};

type FormState = {
    idTorneo: number | null;
    idCategoria: number | null;
    girone: string | null;
    idSquadraCasa: number | null;
    idSquadraOspite: number | null;
    fase: string;
    giornata: string;
    dataPartita: Date | null;
    oraPartita: string;
    campoSvolgimento: number | null;
    idArbitro: number | null;
    mvpPartita: number | null;
    vintaATavolino: VittoriaTavolino;
    highlightsYt: string;
    linkPostIg: string;
};

type CategoriaOption = {
    id: number;
    nome: string;
};

type TipoAzione = Enums<'tipo_azione'>;
type AssegnamentoAzione = Enums<'assegnamento_azione'>;
type VittoriaTavolino = Enums<'vittoria_tavolino'>;

type ReportFormState = {
    tipo: TipoAzione;
    assegnamento: AssegnamentoAzione;
    idGiocatore: number | null;
    minuto: string;
    dettagli: string;
};

const FASI_RAPIDE = ['Gironi', 'Ottavi di finale', 'Quarti di finale', 'Semifinale', 'Finale'];
const TIPI_AZIONE: TipoAzione[] = [
    'Goal',
    'Assist',
    'Goal su rigore',
    'Autogoal',
    'Cartellino giallo',
    'Cartellino rosso',
    'Calcio di rigore segnato',
    'Calcio di rigore sbagliato',
    'Sostituzione',
    'Infortunio',
];
const ASSEGNAMENTI_AZIONE: AssegnamentoAzione[] = ['Casa', 'Ospiti'];
const VITTORIE_TAVOLINO: VittoriaTavolino[] = ['No', 'Casa', 'Ospiti'];

function parsePositiveNumber(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = Number(trimmed);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : NaN;
}

function buildKickoffIso(date: Date | null, time: string) {
    if (!date) return null;

    const match = time.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    const result = new Date(date);

    if (match) {
        result.setHours(Number(match[1]), Number(match[2]), 0, 0);
    } else {
        result.setHours(0, 0, 0, 0);
    }

    return result.toISOString();
}

function formatDateTime(value: string | null) {
    if (!value) return 'Data da definire';

    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Data da definire';

    return new Intl.DateTimeFormat('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function formatScore(partita: NonNullable<datiPartitaType>) {
    if (partita.goal_casa === null || partita.goal_ospite === null) return 'Da giocare';

    return `${partita.goal_casa} - ${partita.goal_ospite}`;
}

function getDatePart(value: string | null) {
    if (!value) return null;

    const date = new Date(value);
    if (isNaN(date.getTime())) return null;

    return date;
}

function getTimePart(value: string | null) {
    const date = getDatePart(value);
    if (!date) return '';

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function buildFormFromPartita(partita: NonNullable<datiPartitaType>): FormState {
    return {
        idTorneo: partita.torneo_id,
        idCategoria: partita.categoria_id,
        girone: partita.girone,
        idSquadraCasa: partita.squadra_casa_id,
        idSquadraOspite: partita.squadra_ospite_id,
        fase: partita.fase ?? '',
        giornata: partita.giornata ? String(partita.giornata) : '',
        dataPartita: getDatePart(partita.fischio_inizio),
        oraPartita: getTimePart(partita.fischio_inizio),
        campoSvolgimento: partita.campo_svolgimento,
        idArbitro: partita.id_arbitro,
        mvpPartita: partita.mvp_partita,
        vintaATavolino: partita.vinta_a_tavolino ?? 'No',
        highlightsYt: partita.highlights_yt ?? '',
        linkPostIg: partita.link_post_ig ?? '',
    };
}

function parseMinute(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = Number(trimmed);
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= 130 ? parsed : NaN;
}

function isGoalAction(action: azioniPartitaType[number]) {
    return (
        action.a_tipo === 'Goal' ||
        action.a_tipo === 'Goal su rigore' ||
        action.a_tipo === 'Autogoal' ||
        action.a_tipo === 'Calcio di rigore segnato' ||
        action.a_tipo === 'Calcio di rigore sbagliato'
    );
}

function isCardAction(action: azioniPartitaType[number]) {
    return action.a_tipo === 'Cartellino giallo' || action.a_tipo === 'Cartellino rosso';
}

function actionRequiresPlayer(tipo: TipoAzione) {
    return (
        tipo === 'Goal' ||
        tipo === 'Goal su rigore' ||
        tipo === 'Autogoal' ||
        tipo === 'Cartellino giallo' ||
        tipo === 'Cartellino rosso' ||
        tipo === 'Calcio di rigore segnato' ||
        tipo === 'Calcio di rigore sbagliato'
    );
}

function emptyToNull(value: string) {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

export default function PartitaModal({ mode, partitaId, torneoId, onClose }: Props) {
    const [activeMode, setActiveMode] = useState<PartitaModalMode>(mode);
    const [tornei, setTornei] = useState<listaTorneiType[]>([]);
    const [categorie, setCategorie] = useState<listaCategorieType>([]);
    const [squadre, setSquadre] = useState<listaSquadreType[]>([]);
    const [campi, setCampi] = useState<campiPartitaType>([]);
    const [arbitri, setArbitri] = useState<arbitriPartitaType>([]);
    const [giocatori, setGiocatori] = useState<giocatoriPartitaType>([]);
    const [partita, setPartita] = useState<datiPartitaType>(null);
    const [azioni, setAzioni] = useState<azioniPartitaType>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [deletingActionId, setDeletingActionId] = useState<number | null>(null);
    const [selectedActionId, setSelectedActionId] = useState<number | null>(null);
    const [form, setForm] = useState<FormState>({
        idTorneo: torneoId ?? null,
        idCategoria: null,
        girone: null,
        idSquadraCasa: null,
        idSquadraOspite: null,
        fase: 'Gironi',
        giornata: '',
        dataPartita: null,
        oraPartita: '',
        campoSvolgimento: null,
        idArbitro: null,
        mvpPartita: null,
        vintaATavolino: 'No',
        highlightsYt: '',
        linkPostIg: '',
    });
    const [reportForm, setReportForm] = useState<ReportFormState>({
        tipo: 'Goal',
        assegnamento: 'Casa',
        idGiocatore: null,
        minuto: '',
        dettagli: '',
    });

    const readonly = activeMode === 'view';
    const isCreate = activeMode === 'create';
    const isEdit = activeMode === 'edit';
    const campoPartita = campi.find((campo) => campo.id === partita?.campo_svolgimento) ?? null;
    const arbitroPartita = arbitri.find((arbitro) => arbitro.id === partita?.id_arbitro) ?? null;
    const mvpPartita = giocatori.find((giocatore) => giocatore.id === partita?.mvp_partita) ?? null;
    const reportTeamsMatchSavedPartita =
        !partita ||
        (partita.squadra_casa_id === form.idSquadraCasa &&
            partita.squadra_ospite_id === form.idSquadraOspite);

    const categorieTorneo = useMemo<CategoriaOption[]>(() => {
        const result: CategoriaOption[] = [];
        const seen = new Set<number>();

        for (const categoria of categorie) {
            if (categoria.torneo_id !== form.idTorneo || !categoria.categoria_id) continue;
            if (seen.has(categoria.categoria_id)) continue;

            seen.add(categoria.categoria_id);
            result.push({
                id: categoria.categoria_id,
                nome: categoria.categoria_nome ?? `Categoria ${categoria.categoria_id}`,
            });
        }

        return result.sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
    }, [categorie, form.idTorneo]);

    const gironiCategoria = useMemo(() => {
        const result = new Set<string>();

        for (const categoria of categorie) {
            if (categoria.categoria_id !== form.idCategoria || !categoria.girone) continue;
            result.add(categoria.girone);
        }

        return Array.from(result).sort((a, b) => a.localeCompare(b, 'it'));
    }, [categorie, form.idCategoria]);

    const giocatoriCasa = useMemo(
        () => giocatori.filter((giocatore) => giocatore.id_squadra === partita?.squadra_casa_id),
        [giocatori, partita?.squadra_casa_id]
    );

    const giocatoriOspiti = useMemo(
        () => giocatori.filter((giocatore) => giocatore.id_squadra === partita?.squadra_ospite_id),
        [giocatori, partita?.squadra_ospite_id]
    );

    const giocatoriReport = reportForm.assegnamento === 'Casa' ? giocatoriCasa : giocatoriOspiti;

    function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    function setReportField<K extends keyof ReportFormState>(key: K, value: ReportFormState[K]) {
        setReportForm((current) => ({ ...current, [key]: value }));
    }

    function selectTorneo(idTorneo: number) {
        setForm((current) => ({
            ...current,
            idTorneo,
            idCategoria: null,
            girone: null,
            idSquadraCasa: null,
            idSquadraOspite: null,
            mvpPartita: null,
        }));
    }

    function selectCategoria(categoria: CategoriaOption) {
        setForm((current) => ({
            ...current,
            idCategoria: categoria.id,
            girone: null,
        }));
    }

    async function loadInitialData() {
        setLoading(true);

        try {
            const [torneiData, categorieData, campiData, arbitriData] = await Promise.all([
                getListaTornei(null),
                getListaCategorie(),
                getCampiPartita(),
                getArbitriPartita(),
            ]);
            const torneiList = torneiData ?? [];

            setTornei(torneiList);
            setCategorie(categorieData ?? []);
            setCampi(campiData ?? []);
            setArbitri(arbitriData ?? []);

            if (!isCreate) {
                if (!partitaId) {
                    setPartita(null);
                    setAzioni([]);
                    setGiocatori([]);
                    return;
                }

                const [partitaData, azioniData, giocatoriData] = await Promise.all([
                    getDatiPartita(partitaId),
                    getAzioniPartita(partitaId),
                    getGiocatoriPartita(partitaId),
                ]);

                setPartita(partitaData);
                setAzioni(azioniData ?? []);
                setGiocatori(giocatoriData ?? []);
                if (partitaData) {
                    setForm(buildFormFromPartita(partitaData));
                }
                return;
            }

            setForm((current) => ({
                ...current,
                idTorneo: current.idTorneo ?? torneiList[0]?.id ?? null,
            }));
        } catch (error: any) {
            errorMessage(
                'Impossibile recuperare i dati della partita',
                error.message ?? String(error)
            );
        } finally {
            setLoading(false);
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

    async function loadGiocatoriSquadre(
        idTorneo: number,
        idSquadraCasa: number,
        idSquadraOspite: number
    ) {
        try {
            const data = await getGiocatoriSquadrePartita(idTorneo, idSquadraCasa, idSquadraOspite);
            setGiocatori(data ?? []);
            setForm((current) => {
                if (
                    !current.mvpPartita ||
                    data.some((giocatore) => giocatore.id === current.mvpPartita)
                ) {
                    return current;
                }

                return { ...current, mvpPartita: null };
            });
        } catch (error: any) {
            errorMessage('Impossibile recuperare i giocatori', error.message ?? String(error));
        }
    }

    async function handleSubmit() {
        const fase = form.fase.trim();
        if (!form.idCategoria) {
            errorMessage('Dati mancanti', 'Seleziona una categoria.');
            return;
        }

        if (!fase) {
            errorMessage('Dati mancanti', 'Inserisci la fase della partita.');
            return;
        }

        if (!form.idSquadraCasa || !form.idSquadraOspite) {
            errorMessage('Dati mancanti', 'Seleziona entrambe le squadre.');
            return;
        }

        if (form.idSquadraCasa === form.idSquadraOspite) {
            errorMessage('Dati non validi', 'Le due squadre devono essere diverse.');
            return;
        }

        const giornata = parsePositiveNumber(form.giornata);
        if (Number.isNaN(giornata)) {
            errorMessage('Dati non validi', 'La giornata deve essere un numero intero positivo.');
            return;
        }

        if (form.oraPartita.trim() && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(form.oraPartita.trim())) {
            errorMessage('Dati non validi', "Inserisci l'orario nel formato HH:mm.");
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                fase,
                id_categoria: form.idCategoria,
                id_squadra_casa: form.idSquadraCasa,
                id_squadra_ospite: form.idSquadraOspite,
                girone: form.girone ?? '',
                giornata: giornata || null,
                fischio_inizio: buildKickoffIso(form.dataPartita, form.oraPartita),
                campo_svolgimento: form.campoSvolgimento,
                id_arbitro: form.idArbitro,
                mvp_partita: form.mvpPartita,
                vinta_a_tavolino: form.vintaATavolino,
                highlights_yt: emptyToNull(form.highlightsYt),
                link_post_ig: emptyToNull(form.linkPostIg),
            };

            if (isCreate) {
                await insertPartita(payload);
                onClose();
                return;
            }

            if (!partitaId) {
                errorMessage('Dati mancanti', 'Identificativo partita non disponibile.');
                return;
            }

            await updatePartita(partitaId, payload);
            const [partitaData, azioniData, giocatoriData] = await Promise.all([
                getDatiPartita(partitaId),
                getAzioniPartita(partitaId),
                getGiocatoriPartita(partitaId),
            ]);
            setPartita(partitaData);
            setAzioni(azioniData ?? []);
            setGiocatori(giocatoriData ?? []);
            if (partitaData) setForm(buildFormFromPartita(partitaData));
            setActiveMode('view');
        } catch (error: any) {
            errorMessage(
                isCreate ? 'Impossibile creare la partita' : 'Impossibile salvare la partita',
                error.message ?? String(error)
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function refreshPartitaDetails() {
        if (!partitaId) return;

        const [partitaData, azioniData, giocatoriData] = await Promise.all([
            getDatiPartita(partitaId),
            getAzioniPartita(partitaId),
            getGiocatoriPartita(partitaId),
        ]);
        setPartita(partitaData);
        setAzioni(azioniData ?? []);
        setGiocatori(giocatoriData ?? []);
        if (partitaData) setForm(buildFormFromPartita(partitaData));
    }

    function resetReportForm() {
        setSelectedActionId(null);
        setReportForm({
            tipo: 'Goal',
            assegnamento: 'Casa',
            idGiocatore: null,
            minuto: '',
            dettagli: '',
        });
    }

    function prepareQuickAction(tipo: TipoAzione, assegnamento: AssegnamentoAzione) {
        const players = assegnamento === 'Casa' ? giocatoriCasa : giocatoriOspiti;

        setSelectedActionId(null);
        setReportForm((current) => ({
            ...current,
            tipo,
            assegnamento,
            idGiocatore:
                current.idGiocatore &&
                players.some((giocatore) => giocatore.id === current.idGiocatore)
                    ? current.idGiocatore
                    : (players[0]?.id ?? null),
        }));
    }

    function selectActionForEdit(action: azioniPartitaType[number]) {
        if (!action.a_id || !action.a_tipo) return;

        setSelectedActionId(action.a_id);
        setReportForm({
            tipo: action.a_tipo,
            assegnamento: action.a_assegnamento ?? 'Casa',
            idGiocatore: action.a_id_giocatore ?? null,
            minuto: action.a_minuto !== null ? String(action.a_minuto) : '',
            dettagli: action.a_dettagli ?? '',
        });
    }

    async function handleSaveAction() {
        if (!partitaId) {
            errorMessage('Dati mancanti', 'Identificativo partita non disponibile.');
            return;
        }

        if (!reportTeamsMatchSavedPartita) {
            errorMessage(
                'Salva prima la partita',
                'Hai cambiato le squadre: salva la partita prima di aggiornare il referto.'
            );
            return;
        }

        const minute = parseMinute(reportForm.minuto);
        if (Number.isNaN(minute)) {
            errorMessage('Dati non validi', 'Il minuto deve essere un numero tra 0 e 130.');
            return;
        }

        const selectedPlayers =
            reportForm.assegnamento === 'Casa' ? giocatoriCasa : giocatoriOspiti;
        const selectedPlayerIsValid =
            reportForm.idGiocatore === null ||
            selectedPlayers.some((giocatore) => giocatore.id === reportForm.idGiocatore);

        if (!selectedPlayerIsValid) {
            errorMessage(
                'Dati non validi',
                'Il giocatore selezionato non appartiene alla squadra.'
            );
            return;
        }

        if (actionRequiresPlayer(reportForm.tipo) && !reportForm.idGiocatore) {
            errorMessage('Dati mancanti', 'Seleziona un giocatore per questa azione.');
            return;
        }

        setReportSubmitting(true);

        try {
            const payload = {
                id_partita: partitaId,
                tipo: reportForm.tipo,
                assegnamento: reportForm.assegnamento,
                id_giocatore: reportForm.idGiocatore,
                minuto: minute,
                dettagli: reportForm.dettagli.trim() || null,
            };

            if (selectedActionId) {
                await updateAzionePartita(selectedActionId, payload);
            } else {
                await insertAzionePartita(payload);
            }

            resetReportForm();
            await refreshPartitaDetails();
        } catch (error: any) {
            errorMessage('Impossibile salvare il referto', error.message ?? String(error));
        } finally {
            setReportSubmitting(false);
        }
    }

    async function handleDeleteAction(idAzione: number) {
        setDeletingActionId(idAzione);

        try {
            await deleteAzionePartita(idAzione);
            if (selectedActionId === idAzione) resetReportForm();
            await refreshPartitaDetails();
        } catch (error: any) {
            errorMessage('Impossibile rimuovere azione', error.message ?? String(error));
        } finally {
            setDeletingActionId(null);
        }
    }

    function confirmDeleteAction(idAzione: number | null) {
        if (!idAzione) return;

        Alert.alert('Rimuovere azione?', 'La riga verra eliminata dal referto.', [
            { text: 'Annulla', style: 'cancel' },
            {
                text: 'Rimuovi',
                style: 'destructive',
                onPress: () => handleDeleteAction(idAzione).then(() => null),
            },
        ]);
    }

    useEffect(() => {
        loadInitialData().then(() => null);
    }, []);

    useEffect(() => {
        if (!readonly && form.idTorneo) {
            loadSquadre(form.idTorneo).then(() => null);
        } else {
            setSquadre([]);
        }
    }, [form.idTorneo, readonly]);

    useEffect(() => {
        if (!readonly && form.idTorneo && form.idSquadraCasa && form.idSquadraOspite) {
            loadGiocatoriSquadre(form.idTorneo, form.idSquadraCasa, form.idSquadraOspite).then(
                () => null
            );
        } else if (isCreate) {
            setGiocatori([]);
        }
    }, [form.idTorneo, form.idSquadraCasa, form.idSquadraOspite, isCreate, readonly]);

    if (loading) {
        return (
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.formCard}>
                    <View className="items-center justify-center gap-3 py-16">
                        <ActivityIndicator size="large" />
                        <InterText className="text-muted-foreground">Caricamento dati...</InterText>
                    </View>
                    <FooterButton label="Torna indietro" variant="secondary" onPress={onClose} />
                </View>
            </ScrollView>
        );
    }

    if (readonly) {
        const goalActions = azioni.filter(isGoalAction);
        const cardActions = azioni.filter(isCardAction);
        const otherActions = azioni.filter(
            (azione) => !isGoalAction(azione) && !isCardAction(azione)
        );

        return (
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.formCard}>
                    <View style={styles.modalHeader}>
                        <View>
                            <InterText style={styles.eyebrow}>Dettagli partita</InterText>
                            <InterText style={styles.title}>Partita {partitaId ?? ''}</InterText>
                        </View>
                    </View>

                    {partita ? (
                        <>
                            <MatchDetailSummary partita={partita} />

                            <View style={styles.detailGrid}>
                                <DetailItem label="Torneo" value={partita.torneo_nome} />
                                <DetailItem label="Categoria" value={partita.categoria_nome} />
                                <DetailItem label="Fase" value={partita.fase} />
                                <DetailItem
                                    label="Girone"
                                    value={partita.girone ? `Girone ${partita.girone}` : null}
                                />
                                <DetailItem
                                    label="Fischio d'inizio"
                                    value={formatDateTime(partita.fischio_inizio)}
                                />
                                <DetailItem
                                    label="Giornata"
                                    value={partita.giornata ? String(partita.giornata) : null}
                                />
                                <DetailItem label="Campo" value={campoPartita?.nome ?? null} />
                                <DetailItem
                                    label="Arbitro"
                                    value={arbitroPartita?.nominativo ?? null}
                                />
                                <DetailItem
                                    label="MVP"
                                    value={
                                        mvpPartita
                                            ? `${mvpPartita.nome} ${mvpPartita.cognome}`
                                            : null
                                    }
                                />
                                <DetailItem
                                    label="Tavolino"
                                    value={partita.vinta_a_tavolino ?? 'No'}
                                />
                                <DetailItem
                                    label="Highlights"
                                    value={partita.highlights_yt ?? null}
                                />
                                <DetailItem label="Post IG" value={partita.link_post_ig ?? null} />
                            </View>

                            <ActionSection
                                title="Goal e rigori"
                                actions={goalActions}
                                homeTeam={partita.squadra_casa_nome}
                                awayTeam={partita.squadra_ospite_nome}
                                emptyText="Nessun goal o rigore registrato"
                            />
                            <ActionSection
                                title="Cartellini"
                                actions={cardActions}
                                homeTeam={partita.squadra_casa_nome}
                                awayTeam={partita.squadra_ospite_nome}
                                emptyText="Nessun cartellino registrato"
                            />
                            <ActionSection
                                title="Altre azioni"
                                actions={otherActions}
                                homeTeam={partita.squadra_casa_nome}
                                awayTeam={partita.squadra_ospite_nome}
                                emptyText="Nessuna altra azione registrata"
                            />
                        </>
                    ) : (
                        <View style={styles.emptyDetailBox}>
                            <InterText style={styles.emptyDetailTitle}>
                                Partita non trovata
                            </InterText>
                            <InterText style={styles.emptyDetailText}>
                                Non e stato possibile recuperare i dettagli della partita.
                            </InterText>
                        </View>
                    )}

                    <View style={styles.dynamicRow}>
                        <FooterButton
                            label="Torna indietro"
                            variant="secondary"
                            onPress={onClose}
                        />
                        {partita && (
                            <TouchableOpacity
                                style={styles.button}
                                onPress={() => setActiveMode('edit')}
                                activeOpacity={0.8}>
                                <PencilIcon size={16} color="#fff" />
                                <InterText style={styles.buttonText}>Modifica</InterText>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.formCard}>
                <View style={styles.modalHeader}>
                    <View>
                        <InterText style={styles.eyebrow}>Partite</InterText>
                        <InterText style={styles.title}>
                            {isCreate ? 'Nuova partita' : `Modifica partita ${partitaId ?? ''}`}
                        </InterText>
                    </View>
                </View>

                <SelectSection
                    label="Torneo"
                    readonly={readonly}
                    options={tornei}
                    selectedId={form.idTorneo}
                    getId={(torneo) => torneo.id}
                    getLabel={(torneo) => torneo.nome ?? 'Torneo senza nome'}
                    onSelect={(torneo) => selectTorneo(torneo.id)}
                    emptyText="Nessun torneo disponibile"
                />

                <SelectSection
                    label="Categoria"
                    readonly={readonly}
                    options={categorieTorneo}
                    selectedId={form.idCategoria}
                    getId={(categoria) => categoria.id}
                    getLabel={(categoria) => categoria.nome}
                    onSelect={selectCategoria}
                    emptyText="Nessuna categoria disponibile per questo torneo"
                />

                <ChipSection
                    label="Girone"
                    readonly={readonly}
                    options={gironiCategoria}
                    selected={form.girone}
                    onSelect={(girone) => setField('girone', girone)}
                    onClear={() => setField('girone', null)}
                    emptyText="Seleziona una categoria per vedere i gironi"
                />

                <TextInputField
                    label="Fase"
                    readonly={readonly}
                    value={form.fase}
                    onChange={(value) => setField('fase', value)}
                    placeholder="Quarti di finale"
                />

                <ChipSection
                    label="Fasi rapide"
                    readonly={readonly}
                    options={FASI_RAPIDE}
                    selected={FASI_RAPIDE.includes(form.fase) ? form.fase : null}
                    onSelect={(fase) => setField('fase', fase)}
                    onClear={() => setField('fase', '')}
                    emptyText="Nessuna fase rapida"
                />

                <View style={styles.row}>
                    <View style={styles.flexChild}>
                        <DateTimePickerField
                            mode="date"
                            label="Data partita"
                            readonly={readonly}
                            value={form.dataPartita}
                            onChange={(date) => setField('dataPartita', date)}
                            placeholder="Seleziona..."
                        />
                    </View>
                    <View style={styles.flexChild}>
                        <TextInputField
                            label="Ora"
                            readonly={readonly}
                            value={form.oraPartita}
                            onChange={(value) => setField('oraPartita', value)}
                            placeholder="21:45"
                        />
                    </View>
                </View>

                <TextInputField
                    label="Giornata"
                    readonly={readonly}
                    value={form.giornata}
                    onChange={(value) => setField('giornata', value)}
                    placeholder="1"
                />

                <View style={styles.row}>
                    <View style={styles.flexChild}>
                        <SelectSection
                            label="Squadra casa"
                            readonly={readonly}
                            options={squadre}
                            selectedId={form.idSquadraCasa}
                            getId={(squadra) => squadra.s_id}
                            getLabel={(squadra) => squadra.s_nome ?? 'Squadra senza nome'}
                            onSelect={(squadra) => {
                                resetReportForm();
                                setForm((current) => ({
                                    ...current,
                                    idSquadraCasa: squadra.s_id,
                                    mvpPartita: null,
                                }));
                            }}
                            emptyText="Nessuna squadra disponibile"
                        />
                    </View>
                    <View style={styles.flexChild}>
                        <SelectSection
                            label="Squadra ospite"
                            readonly={readonly}
                            options={squadre}
                            selectedId={form.idSquadraOspite}
                            getId={(squadra) => squadra.s_id}
                            getLabel={(squadra) => squadra.s_nome ?? 'Squadra senza nome'}
                            onSelect={(squadra) => {
                                resetReportForm();
                                setForm((current) => ({
                                    ...current,
                                    idSquadraOspite: squadra.s_id,
                                    mvpPartita: null,
                                }));
                            }}
                            emptyText="Nessuna squadra disponibile"
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.flexChild}>
                        <SelectSection
                            label="Campo"
                            readonly={readonly}
                            options={campi}
                            selectedId={form.campoSvolgimento}
                            getId={(campo) => campo.id}
                            getLabel={(campo) => campo.nome}
                            onSelect={(campo) => setField('campoSvolgimento', campo.id)}
                            emptyText="Nessun campo disponibile"
                        />
                    </View>
                    <View style={styles.flexChild}>
                        <SelectSection
                            label="Arbitro"
                            readonly={readonly}
                            options={arbitri}
                            selectedId={form.idArbitro}
                            getId={(arbitro) => arbitro.id}
                            getLabel={(arbitro) =>
                                arbitro.ruolo
                                    ? `${arbitro.nominativo} - ${arbitro.ruolo}`
                                    : arbitro.nominativo
                            }
                            onSelect={(arbitro) => setField('idArbitro', arbitro.id)}
                            emptyText="Nessun arbitro disponibile"
                        />
                    </View>
                </View>

                <EnumChipSection
                    label="Vittoria a tavolino"
                    options={VITTORIE_TAVOLINO}
                    selected={form.vintaATavolino}
                    getLabel={(value) =>
                        value === 'No' ? 'No' : value === 'Casa' ? 'Casa' : 'Ospiti'
                    }
                    onSelect={(value) => setField('vintaATavolino', value as VittoriaTavolino)}
                />

                <SelectSection
                    label="MVP partita"
                    readonly={readonly}
                    options={giocatori}
                    selectedId={form.mvpPartita}
                    getId={(giocatore) => giocatore.id}
                    getLabel={(giocatore) =>
                        `${giocatore.nome} ${giocatore.cognome}${
                            giocatore.squadra_nome ? ` - ${giocatore.squadra_nome}` : ''
                        }`
                    }
                    onSelect={(giocatore) => setField('mvpPartita', giocatore.id)}
                    emptyText={
                        isCreate
                            ? 'Disponibile dopo il primo salvataggio della partita'
                            : 'Nessun giocatore disponibile'
                    }
                />

                <TextInputField
                    label="Highlights YouTube"
                    readonly={readonly}
                    value={form.highlightsYt}
                    onChange={(value) => setField('highlightsYt', value)}
                    placeholder="https://youtube.com/..."
                />

                <TextInputField
                    label="Post Instagram"
                    readonly={readonly}
                    value={form.linkPostIg}
                    onChange={(value) => setField('linkPostIg', value)}
                    placeholder="https://instagram.com/..."
                />

                {isEdit && partita && reportTeamsMatchSavedPartita && (
                    <ReportEditor
                        partita={partita}
                        azioni={azioni}
                        giocatori={giocatoriReport}
                        reportForm={reportForm}
                        reportSubmitting={reportSubmitting}
                        deletingActionId={deletingActionId}
                        selectedActionId={selectedActionId}
                        onReportFieldChange={setReportField}
                        onPrepareQuickAction={prepareQuickAction}
                        onSaveAction={handleSaveAction}
                        onCancelEdit={resetReportForm}
                        onSelectAction={selectActionForEdit}
                        onDeleteAction={confirmDeleteAction}
                    />
                )}

                {isEdit && partita && !reportTeamsMatchSavedPartita && (
                    <View style={styles.emptyDetailBox}>
                        <InterText style={styles.emptyDetailTitle}>
                            Referto bloccato
                        </InterText>
                        <InterText style={styles.emptyDetailText}>
                            Le squadre della partita sono state cambiate. Salva la partita prima
                            di aggiungere goal, cartellini o rigori.
                        </InterText>
                    </View>
                )}

                <View style={styles.dynamicRow}>
                    <FooterButton
                        label="Annulla"
                        variant="destructive"
                        onPress={() => {
                            if (isCreate) {
                                onClose();
                            } else {
                                if (partita) setForm(buildFormFromPartita(partita));
                                setActiveMode('view');
                            }
                        }}
                    />
                    <TouchableOpacity
                        style={[styles.button, submitting && { opacity: 0.6 }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                        activeOpacity={0.8}>
                        <SaveIcon size={16} color="#fff" />
                        <InterText style={styles.buttonText}>
                            {submitting
                                ? isCreate
                                    ? 'Creazione...'
                                    : 'Salvataggio...'
                                : isCreate
                                  ? 'Crea partita'
                                  : 'Salva partita'}
                        </InterText>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

function MatchDetailSummary({ partita }: { partita: NonNullable<datiPartitaType> }) {
    return (
        <View style={styles.summaryBox}>
            <View style={styles.summaryTeam}>
                <InterText style={styles.summaryTeamName} numberOfLines={2}>
                    {partita.squadra_casa_nome ?? 'Squadra casa'}
                </InterText>
            </View>
            <View style={styles.summaryScoreBox}>
                <InterText style={styles.summaryScore} numberOfLines={1} adjustsFontSizeToFit>
                    {formatScore(partita)}
                </InterText>
            </View>
            <View style={styles.summaryTeam}>
                <InterText style={styles.summaryTeamName} numberOfLines={2}>
                    {partita.squadra_ospite_nome ?? 'Squadra ospite'}
                </InterText>
            </View>
        </View>
    );
}

function DetailItem({ label, value }: { label: string; value: string | null }) {
    return (
        <View style={styles.detailItem}>
            <InterText style={styles.detailLabel}>{label}</InterText>
            <InterText style={styles.detailValue} numberOfLines={2}>
                {value ?? 'N/A'}
            </InterText>
        </View>
    );
}

function actionTeamLabel(
    action: azioniPartitaType[number],
    homeTeam: string | null,
    awayTeam: string | null
) {
    if (action.a_assegnamento === 'Casa') return homeTeam ?? 'Casa';
    if (action.a_assegnamento === 'Ospiti') return awayTeam ?? 'Ospiti';
    return 'Squadra non assegnata';
}

function actionPlayerLabel(action: azioniPartitaType[number]) {
    return [action.p_nome, action.p_cognome].filter(Boolean).join(' ') || 'Giocatore non assegnato';
}

function ActionSection({
    title,
    actions,
    homeTeam,
    awayTeam,
    emptyText,
    editable = false,
    deletingActionId = null,
    selectedActionId = null,
    onSelectAction,
    onDeleteAction,
}: {
    title: string;
    actions: azioniPartitaType;
    homeTeam: string | null;
    awayTeam: string | null;
    emptyText: string;
    editable?: boolean;
    deletingActionId?: number | null;
    selectedActionId?: number | null;
    onSelectAction?: (action: azioniPartitaType[number]) => void;
    onDeleteAction?: (idAzione: number | null) => void;
}) {
    return (
        <View style={styles.actionSection}>
            <View style={styles.actionSectionHeader}>
                <InterText style={styles.sectionTitle}>{title}</InterText>
                <View style={styles.actionCountBadge}>
                    <InterText style={styles.actionCountText}>{actions.length}</InterText>
                </View>
            </View>

            {actions.length === 0 ? (
                <InterText style={styles.emptyOptions}>{emptyText}</InterText>
            ) : (
                <View style={styles.actionList}>
                    {actions.map((action, index) => (
                        <TouchableOpacity
                            key={`${action.a_id ?? action.a_tipo ?? 'azione'}-${index}`}
                            style={[
                                styles.actionRow,
                                selectedActionId === action.a_id && styles.actionRowSelected,
                            ]}
                            disabled={!editable || !action.a_id}
                            onPress={() => onSelectAction?.(action)}
                            activeOpacity={0.86}>
                            <View
                                style={[
                                    styles.actionMarker,
                                    isCardAction(action) && styles.cardActionMarker,
                                ]}
                            />
                            <View style={styles.actionContent}>
                                <InterText style={styles.actionTitle} numberOfLines={1}>
                                    {action.a_minuto !== null
                                        ? `${action.a_minuto}' - ${action.a_tipo ?? 'Azione'}`
                                        : (action.a_tipo ?? 'Azione')}
                                </InterText>
                                <InterText style={styles.actionMeta} numberOfLines={2}>
                                    {actionPlayerLabel(action)} -{' '}
                                    {actionTeamLabel(action, homeTeam, awayTeam)}
                                    {action.a_dettagli ? ` - ${action.a_dettagli}` : ''}
                                </InterText>
                            </View>
                            {editable && (
                                <TouchableOpacity
                                    style={[
                                        styles.iconButton,
                                        deletingActionId === action.a_id && { opacity: 0.5 },
                                    ]}
                                    disabled={!action.a_id || deletingActionId === action.a_id}
                                    onPress={() => onDeleteAction?.(action.a_id)}
                                    activeOpacity={0.8}>
                                    <Trash2Icon size={16} color="#7c3f3f" />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

function ReportEditor({
    partita,
    azioni,
    giocatori,
    reportForm,
    reportSubmitting,
    deletingActionId,
    selectedActionId,
    onReportFieldChange,
    onPrepareQuickAction,
    onSaveAction,
    onCancelEdit,
    onSelectAction,
    onDeleteAction,
}: {
    partita: NonNullable<datiPartitaType>;
    azioni: azioniPartitaType;
    giocatori: giocatoriPartitaType;
    reportForm: ReportFormState;
    reportSubmitting: boolean;
    deletingActionId: number | null;
    selectedActionId: number | null;
    onReportFieldChange: <K extends keyof ReportFormState>(
        key: K,
        value: ReportFormState[K]
    ) => void;
    onPrepareQuickAction: (tipo: TipoAzione, assegnamento: AssegnamentoAzione) => void;
    onSaveAction: () => void;
    onCancelEdit: () => void;
    onSelectAction: (action: azioniPartitaType[number]) => void;
    onDeleteAction: (idAzione: number | null) => void;
}) {
    const goalActions = azioni.filter(isGoalAction);
    const cardActions = azioni.filter(isCardAction);
    const otherActions = azioni.filter((azione) => !isGoalAction(azione) && !isCardAction(azione));

    return (
        <View style={styles.reportBox}>
            <View style={styles.reportHeader}>
                <View>
                    <InterText style={styles.eyebrow}>Referto</InterText>
                    <InterText style={styles.sectionTitle}>Risultato e azioni</InterText>
                </View>
                <View style={styles.scoreMiniBox}>
                    <InterText style={styles.scoreMiniText}>{formatScore(partita)}</InterText>
                </View>
            </View>

            <View style={styles.quickGrid}>
                <QuickActionButton
                    label="Goal casa"
                    tone="home"
                    disabled={reportSubmitting}
                    onPress={() => onPrepareQuickAction('Goal', 'Casa')}
                />
                <QuickActionButton
                    label="Goal ospiti"
                    tone="away"
                    disabled={reportSubmitting}
                    onPress={() => onPrepareQuickAction('Goal', 'Ospiti')}
                />
                <QuickActionButton
                    label="Rigore casa"
                    tone="home"
                    disabled={reportSubmitting}
                    onPress={() => onPrepareQuickAction('Calcio di rigore segnato', 'Casa')}
                />
                <QuickActionButton
                    label="Rigore ospiti"
                    tone="away"
                    disabled={reportSubmitting}
                    onPress={() => onPrepareQuickAction('Calcio di rigore segnato', 'Ospiti')}
                />
                <QuickActionButton
                    label="Giallo casa"
                    tone="home"
                    disabled={reportSubmitting}
                    onPress={() => onPrepareQuickAction('Cartellino giallo', 'Casa')}
                />
                <QuickActionButton
                    label="Giallo ospiti"
                    tone="away"
                    disabled={reportSubmitting}
                    onPress={() => onPrepareQuickAction('Cartellino giallo', 'Ospiti')}
                />
                <QuickActionButton
                    label="Rosso casa"
                    tone="home"
                    disabled={reportSubmitting}
                    onPress={() => onPrepareQuickAction('Cartellino rosso', 'Casa')}
                />
                <QuickActionButton
                    label="Rosso ospiti"
                    tone="away"
                    disabled={reportSubmitting}
                    onPress={() => onPrepareQuickAction('Cartellino rosso', 'Ospiti')}
                />
            </View>

            <EnumChipSection
                label="Tipo azione"
                options={TIPI_AZIONE}
                selected={reportForm.tipo}
                onSelect={(value) => onReportFieldChange('tipo', value as TipoAzione)}
            />
            <EnumChipSection
                label="Squadra"
                options={ASSEGNAMENTI_AZIONE}
                selected={reportForm.assegnamento}
                getLabel={(value) =>
                    value === 'Casa'
                        ? (partita.squadra_casa_nome ?? 'Casa')
                        : (partita.squadra_ospite_nome ?? 'Ospiti')
                }
                onSelect={(value) => {
                    onReportFieldChange('assegnamento', value as AssegnamentoAzione);
                    onReportFieldChange('idGiocatore', null);
                }}
            />

            <SelectSection
                label="Giocatore"
                readonly={false}
                options={giocatori}
                selectedId={reportForm.idGiocatore}
                getId={(giocatore) => giocatore.id}
                getLabel={(giocatore) =>
                    `${giocatore.nome} ${giocatore.cognome}${
                        giocatore.numero_maglia ? ` #${giocatore.numero_maglia}` : ''
                    }`
                }
                onSelect={(giocatore) => onReportFieldChange('idGiocatore', giocatore.id)}
                emptyText="Nessun giocatore disponibile per questa squadra"
            />

            <View style={styles.row}>
                <View style={styles.minuteField}>
                    <TextInputField
                        label="Minuto"
                        value={reportForm.minuto}
                        onChange={(value) => onReportFieldChange('minuto', value)}
                        placeholder="42"
                    />
                </View>
                <View style={styles.flexChild}>
                    <TextInputField
                        label="Dettagli"
                        value={reportForm.dettagli}
                        onChange={(value) => onReportFieldChange('dettagli', value)}
                        placeholder="Nota rapida opzionale"
                    />
                </View>
            </View>

            <TouchableOpacity
                style={[
                    styles.button,
                    styles.reportSubmitButton,
                    reportSubmitting && { opacity: 0.6 },
                ]}
                onPress={onSaveAction}
                disabled={reportSubmitting}
                activeOpacity={0.8}>
                {selectedActionId ? (
                    <SaveIcon size={16} color="#fff" />
                ) : (
                    <PlusIcon size={16} color="#fff" />
                )}
                <InterText style={styles.buttonText}>
                    {reportSubmitting
                        ? 'Salvataggio...'
                        : selectedActionId
                          ? 'Aggiorna azione'
                          : 'Aggiungi azione'}
                </InterText>
            </TouchableOpacity>
            {selectedActionId && (
                <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary, styles.reportCancelButton]}
                    onPress={onCancelEdit}
                    activeOpacity={0.8}>
                    <ArrowLeftIcon size={16} color="#6b7280" />
                    <InterText style={[styles.buttonText, styles.buttonSecondaryText]}>
                        Annulla modifica
                    </InterText>
                </TouchableOpacity>
            )}

            <ActionSection
                title="Goal e rigori"
                actions={goalActions}
                homeTeam={partita.squadra_casa_nome}
                awayTeam={partita.squadra_ospite_nome}
                emptyText="Nessun goal o rigore registrato"
                editable
                deletingActionId={deletingActionId}
                selectedActionId={selectedActionId}
                onSelectAction={onSelectAction}
                onDeleteAction={onDeleteAction}
            />
            <ActionSection
                title="Cartellini"
                actions={cardActions}
                homeTeam={partita.squadra_casa_nome}
                awayTeam={partita.squadra_ospite_nome}
                emptyText="Nessun cartellino registrato"
                editable
                deletingActionId={deletingActionId}
                selectedActionId={selectedActionId}
                onSelectAction={onSelectAction}
                onDeleteAction={onDeleteAction}
            />
            <ActionSection
                title="Altre azioni"
                actions={otherActions}
                homeTeam={partita.squadra_casa_nome}
                awayTeam={partita.squadra_ospite_nome}
                emptyText="Nessuna altra azione registrata"
                editable
                deletingActionId={deletingActionId}
                selectedActionId={selectedActionId}
                onSelectAction={onSelectAction}
                onDeleteAction={onDeleteAction}
            />
        </View>
    );
}

function QuickActionButton({
    label,
    tone,
    disabled,
    onPress,
}: {
    label: string;
    tone: 'home' | 'away';
    disabled: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[
                styles.quickButton,
                tone === 'home' ? styles.quickButtonHome : styles.quickButtonAway,
                disabled && { opacity: 0.6 },
            ]}
            disabled={disabled}
            onPress={onPress}
            activeOpacity={0.85}>
            <PlusIcon size={14} color={tone === 'home' ? '#0f172a' : '#7c3f3f'} />
            <InterText style={styles.quickButtonText} numberOfLines={1}>
                {label}
            </InterText>
        </TouchableOpacity>
    );
}

function EnumChipSection<T extends string>({
    label,
    options,
    selected,
    getLabel,
    onSelect,
}: {
    label: string;
    options: T[];
    selected: T;
    getLabel?: (value: T) => string;
    onSelect: (value: T) => void;
}) {
    return (
        <View style={styles.inputGroup}>
            <InterText style={styles.label}>{label}:</InterText>
            <View style={styles.chipRow}>
                {options.map((option) => {
                    const active = selected === option;
                    return (
                        <TouchableOpacity
                            key={option}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => onSelect(option)}
                            activeOpacity={0.85}>
                            <InterText
                                style={[styles.chipText, active && styles.chipTextActive]}
                                numberOfLines={1}>
                                {getLabel ? getLabel(option) : option}
                            </InterText>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

type SelectSectionProps<T> = {
    label: string;
    readonly: boolean;
    options: T[];
    selectedId: number | null;
    getId: (item: T) => number | null;
    getLabel: (item: T) => string;
    onSelect: (item: T) => void;
    emptyText: string;
};

function SelectSection<T>({
    label,
    readonly,
    options,
    selectedId,
    getId,
    getLabel,
    onSelect,
    emptyText,
}: SelectSectionProps<T>) {
    const selected = options.find((option) => getId(option) === selectedId) ?? null;

    if (readonly) {
        return (
            <View style={styles.inputGroup}>
                <InterText style={styles.label}>{label}:</InterText>
                <InterText style={styles.readonlyValue}>
                    {selected ? getLabel(selected) : 'N/A'}
                </InterText>
            </View>
        );
    }

    return (
        <View style={styles.inputGroup}>
            <InterText style={styles.label}>{label}:</InterText>
            <View style={styles.chipRow}>
                {options.length === 0 ? (
                    <InterText style={styles.emptyOptions}>{emptyText}</InterText>
                ) : (
                    options.map((option) => {
                        const id = getId(option);
                        const active = id === selectedId;
                        return (
                            <TouchableOpacity
                                key={String(id ?? getLabel(option))}
                                style={[styles.chip, active && styles.chipActive]}
                                onPress={() => onSelect(option)}
                                activeOpacity={0.85}>
                                <InterText
                                    style={[styles.chipText, active && styles.chipTextActive]}
                                    numberOfLines={1}>
                                    {getLabel(option)}
                                </InterText>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>
        </View>
    );
}

type ChipSectionProps = {
    label: string;
    readonly: boolean;
    options: string[];
    selected: string | null;
    onSelect: (value: string) => void;
    onClear: () => void;
    emptyText: string;
};

function ChipSection({
    label,
    readonly,
    options,
    selected,
    onSelect,
    onClear,
    emptyText,
}: ChipSectionProps) {
    if (readonly) {
        return (
            <View style={styles.inputGroup}>
                <InterText style={styles.label}>{label}:</InterText>
                <InterText style={styles.readonlyValue}>{selected ?? 'N/A'}</InterText>
            </View>
        );
    }

    return (
        <View style={styles.inputGroup}>
            <InterText style={styles.label}>{label}:</InterText>
            <View style={styles.chipRow}>
                <TouchableOpacity
                    style={[styles.chip, !selected && styles.chipActive]}
                    onPress={onClear}
                    activeOpacity={0.85}>
                    <InterText style={[styles.chipText, !selected && styles.chipTextActive]}>
                        Nessuno
                    </InterText>
                </TouchableOpacity>
                {options.length === 0 ? (
                    <InterText style={styles.emptyOptions}>{emptyText}</InterText>
                ) : (
                    options.map((option) => {
                        const active = selected === option;
                        return (
                            <TouchableOpacity
                                key={option}
                                style={[styles.chip, active && styles.chipActive]}
                                onPress={() => onSelect(option)}
                                activeOpacity={0.85}>
                                <InterText
                                    style={[styles.chipText, active && styles.chipTextActive]}>
                                    {option}
                                </InterText>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>
        </View>
    );
}

function FooterButton({
    label,
    variant,
    onPress,
}: {
    label: string;
    variant: 'secondary' | 'destructive';
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                variant === 'secondary' ? styles.buttonSecondary : styles.buttonDestructive,
            ]}
            onPress={onPress}
            activeOpacity={0.8}>
            <ArrowLeftIcon size={16} color={variant === 'secondary' ? '#6b7280' : '#7c3f3f'} />
            <InterText
                style={[
                    styles.buttonText,
                    variant === 'secondary'
                        ? styles.buttonSecondaryText
                        : styles.buttonDestructiveText,
                ]}>
                {label}
            </InterText>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        padding: 16,
        paddingBottom: 128,
    },
    formCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    modalHeader: {
        marginBottom: 20,
    },
    eyebrow: {
        color: '#64748b',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    title: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 26,
        fontWeight: '700',
    },
    summaryBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 14,
        marginBottom: 18,
    },
    summaryTeam: {
        flex: 1,
        minWidth: 0,
        alignItems: 'center',
    },
    summaryTeamName: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 18,
        textAlign: 'center',
    },
    summaryScoreBox: {
        minWidth: 78,
        maxWidth: 112,
        minHeight: 48,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    summaryScore: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    detailGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 18,
    },
    detailItem: {
        flexGrow: 1,
        flexBasis: '45%',
        minWidth: 160,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        padding: 12,
    },
    detailLabel: {
        color: '#64748b',
        fontFamily: 'Inter-SemiBold',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    detailValue: {
        color: '#0f172a',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        fontWeight: '600',
    },
    actionSection: {
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 16,
        marginTop: 4,
        marginBottom: 16,
    },
    actionSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 10,
    },
    sectionTitle: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        fontWeight: '700',
    },
    actionCountBadge: {
        minWidth: 28,
        height: 26,
        borderRadius: 999,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    actionCountText: {
        color: '#475569',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
    },
    actionList: {
        gap: 8,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 10,
    },
    actionRowSelected: {
        borderColor: '#0f172a',
        backgroundColor: '#f1f5f9',
    },
    actionMarker: {
        width: 10,
        height: 36,
        borderRadius: 999,
        backgroundColor: '#0f6096',
    },
    cardActionMarker: {
        backgroundColor: '#b3642c',
    },
    actionContent: {
        flex: 1,
        minWidth: 0,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionTitle: {
        color: '#0f172a',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 2,
    },
    actionMeta: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 12,
    },
    emptyDetailBox: {
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 18,
        marginBottom: 12,
    },
    emptyDetailTitle: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    emptyDetailText: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 13,
    },
    reportBox: {
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 18,
        marginTop: 2,
        marginBottom: 8,
    },
    reportHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 14,
    },
    scoreMiniBox: {
        minWidth: 70,
        minHeight: 42,
        borderRadius: 12,
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    scoreMiniText: {
        color: '#ffffff',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        fontWeight: '700',
    },
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 18,
    },
    quickButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 9,
        maxWidth: '48%',
    },
    quickButtonHome: {
        borderColor: '#bfdbfe',
        backgroundColor: '#eff6ff',
    },
    quickButtonAway: {
        borderColor: '#fecaca',
        backgroundColor: '#fef2f2',
    },
    quickButtonText: {
        color: '#0f172a',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    flexChild: {
        flex: 1,
        minWidth: 220,
    },
    minuteField: {
        width: 110,
        minWidth: 110,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: '#111111',
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
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
    emptyOptions: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 13,
        paddingVertical: 8,
    },
    readonlyValue: {
        color: '#737373',
        fontFamily: 'Inter',
        fontSize: 13,
    },
    dynamicRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 12,
    },
    reportSubmitButton: {
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    reportCancelButton: {
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 12,
        backgroundColor: '#0f172a',
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 44,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    buttonText: {
        color: '#ffffff',
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        fontWeight: '600',
    },
    buttonSecondary: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonSecondaryText: {
        color: '#6b7280',
    },
    buttonDestructive: {
        backgroundColor: '#d9a3a3',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonDestructiveText: {
        color: '#7c3f3f',
    },
});
