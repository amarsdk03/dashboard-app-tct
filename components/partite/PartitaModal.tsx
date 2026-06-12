import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ArrowLeftIcon, SaveIcon } from 'lucide-react-native';
import { InterText } from '@/components/InterText';
import DateTimePickerField from '@/components/input/DateTimePickerField';
import TextInputField from '@/components/input/TextInputField';
import errorMessage from '@/components/ErrorMessage';
import {
    getAzioniPartita,
    getDatiPartita,
    getListaCategorie,
    insertPartita,
    azioniPartitaType,
    datiPartitaType,
    listaCategorieType,
} from '@/data/partite';
import { getListaSquadre, listaSquadreType } from '@/data/squadre';
import { getListaTornei, listaTorneiType } from '@/data/tornei';

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
};

type CategoriaOption = {
    id: number;
    nome: string;
};

const FASI_RAPIDE = ['Gironi', 'Ottavi di finale', 'Quarti di finale', 'Semifinale', 'Finale'];

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

export default function PartitaModal({ mode, partitaId, torneoId, onClose }: Props) {
    const [tornei, setTornei] = useState<listaTorneiType[]>([]);
    const [categorie, setCategorie] = useState<listaCategorieType>([]);
    const [squadre, setSquadre] = useState<listaSquadreType[]>([]);
    const [partita, setPartita] = useState<datiPartitaType>(null);
    const [azioni, setAzioni] = useState<azioniPartitaType>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
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
    });

    const readonly = mode === 'view';
    const isCreate = mode === 'create';

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

    function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    function selectTorneo(idTorneo: number) {
        setForm((current) => ({
            ...current,
            idTorneo,
            idCategoria: null,
            girone: null,
            idSquadraCasa: null,
            idSquadraOspite: null,
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
            if (!isCreate) {
                if (!partitaId) {
                    setPartita(null);
                    setAzioni([]);
                    return;
                }

                const [partitaData, azioniData] = await Promise.all([
                    getDatiPartita(partitaId),
                    getAzioniPartita(partitaId),
                ]);

                setPartita(partitaData);
                setAzioni(azioniData ?? []);
                return;
            }

            const [torneiData, categorieData] = await Promise.all([
                getListaTornei(null),
                getListaCategorie(),
            ]);
            const torneiList = torneiData ?? [];

            setTornei(torneiList);
            setCategorie(categorieData ?? []);
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

    async function handleSubmit() {
        if (!isCreate) {
            errorMessage(
                'Funzione non disponibile',
                'La modifica delle partite non e ancora implementata.'
            );
            return;
        }

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
            await insertPartita({
                fase,
                id_categoria: form.idCategoria,
                id_squadra_casa: form.idSquadraCasa,
                id_squadra_ospite: form.idSquadraOspite,
                girone: form.girone ?? undefined,
                giornata: giornata || null,
                fischio_inizio: buildKickoffIso(form.dataPartita, form.oraPartita),
            });

            onClose();
        } catch (error: any) {
            errorMessage('Impossibile creare la partita', error.message ?? String(error));
        } finally {
            setSubmitting(false);
        }
    }

    useEffect(() => {
        loadInitialData().then(() => null);
    }, []);

    useEffect(() => {
        if (isCreate && form.idTorneo) {
            loadSquadre(form.idTorneo).then(() => null);
        } else {
            setSquadre([]);
        }
    }, [form.idTorneo, isCreate]);

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

    if (!isCreate) {
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
                            {mode === 'create' ? 'Nuova partita' : `Partita ${partitaId ?? ''}`}
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
                            onSelect={(squadra) => setField('idSquadraCasa', squadra.s_id)}
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
                            onSelect={(squadra) => setField('idSquadraOspite', squadra.s_id)}
                            emptyText="Nessuna squadra disponibile"
                        />
                    </View>
                </View>

                <View style={styles.dynamicRow}>
                    <FooterButton label="Annulla" variant="destructive" onPress={onClose} />
                    <TouchableOpacity
                        style={[styles.button, submitting && { opacity: 0.6 }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                        activeOpacity={0.8}>
                        <SaveIcon size={16} color="#fff" />
                        <InterText style={styles.buttonText}>
                            {submitting ? 'Creazione...' : 'Crea partita'}
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
}: {
    title: string;
    actions: azioniPartitaType;
    homeTeam: string | null;
    awayTeam: string | null;
    emptyText: string;
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
                        <View
                            key={`${action.a_id ?? action.a_tipo ?? 'azione'}-${index}`}
                            style={styles.actionRow}>
                            <View
                                style={[
                                    styles.actionMarker,
                                    isCardAction(action) && styles.cardActionMarker,
                                ]}
                            />
                            <View style={styles.actionContent}>
                                <InterText style={styles.actionTitle} numberOfLines={1}>
                                    {action.a_tipo ?? 'Azione'}
                                </InterText>
                                <InterText style={styles.actionMeta} numberOfLines={2}>
                                    {actionPlayerLabel(action)} -{' '}
                                    {actionTeamLabel(action, homeTeam, awayTeam)}
                                </InterText>
                            </View>
                        </View>
                    ))}
                </View>
            )}
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
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    summaryScore: {
        color: '#ffffff',
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
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    flexChild: {
        flex: 1,
        minWidth: 220,
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
