import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image, Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Link, type Href } from 'expo-router';
import {
    ArrowLeftIcon,
    PlusIcon,
    SaveIcon,
    SearchIcon,
    ShieldIcon,
    SquarePenIcon,
    XIcon,
} from 'lucide-react-native';
import { InterText } from '@/components/generic/InterText';
import ImageInputField from '@/components/input/ImageInputField';
import TextInputField from '@/components/input/TextInputField';
import errorMessage from '@/components/generic/ErrorMessage';
import { insertGiocatore } from '@/data/giocatori';
import {
    createSquadraConRoster,
    deleteIscrizioneSquadra,
    formazioneSquadraType,
    getDatiSquadra,
    getFormazioneSquadra,
    getGiocatoriDisponibiliSquadra,
    getStatisticheSquadra,
    giocatoriDisponibiliSquadraType,
    insertIscrizioneSquadra,
    statisticheSquadraType,
    updateSquadra,
} from '@/data/squadre';
import { getListaTornei, listaTorneiType } from '@/data/tornei';
import ChipPickerField from '@/components/input/ChipPickerField';
import FormButton from '@/components/input/FormButton';
import GenericSelectField from '@/components/input/GenericSelectField';

export type SquadraModalMode = 'view' | 'create' | 'edit';

type Props = {
    mode: SquadraModalMode;
    squadraId?: number;
    torneoId?: number;
    onClose: () => void;
};

type FormState = {
    nome: string;
    acronimo: string;
    linkStemma: string;
    coloreSquadra: string;
    usernameIg: string;
    idCapitano: number | null;
    idTorneo: number | null;
    selectedPlayerIds: number[];
};

const EMPTY_FORM: FormState = {
    nome: '',
    acronimo: '',
    linkStemma: '',
    coloreSquadra: '',
    usernameIg: '',
    idCapitano: null,
    idTorneo: null,
    selectedPlayerIds: [],
};

function emptyToNull(value: string) {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

type PendingCreatePlayer = Omit<giocatoriDisponibiliSquadraType, 'id'> & {
    id: number;
    isPending: true;
};

type CreatePickerPlayer = giocatoriDisponibiliSquadraType | PendingCreatePlayer;
type PickerPlayer = CreatePickerPlayer | formazioneSquadraType[number];

function getPlayerName(player: PickerPlayer) {
    if ('giocatore' in player) {
        return [player.giocatore?.nome, player.giocatore?.cognome].filter(Boolean).join(' ');
    }

    return [player.nome, player.cognome].filter(Boolean).join(' ');
}

function getPlayerId(player: PickerPlayer) {
    if ('giocatore' in player) return player.giocatore?.id ?? player.id_giocatore;
    return player.id;
}

function getPlayerRole(player: PickerPlayer) {
    if ('giocatore' in player) return player.giocatore?.ruolo_principale ?? null;
    return player.ruolo_principale ?? null;
}

function getPlayerPhoto(player: PickerPlayer) {
    if ('giocatore' in player) return player.giocatore?.link_foto ?? null;
    return player.link_foto ?? null;
}

function getRosterPlayerIds(rows: formazioneSquadraType) {
    return rows.map((row) => row.id_giocatore);
}

function isTeamAction(action: statisticheSquadraType[number], idSquadra: number) {
    if (action.id_squadra_azione === idSquadra) return true;
    if (action.a_assegnamento === 'Casa' && action.p_id_squadra_casa === idSquadra) return true;
    if (action.a_assegnamento === 'Ospiti' && action.p_id_squadra_ospite === idSquadra) return true;
    return false;
}

function buildStats(actions: statisticheSquadraType, idSquadra?: number) {
    const ownActions = idSquadra
        ? actions.filter((action) => isTeamAction(action, idSquadra))
        : actions;

    return {
        goals: ownActions.filter(
            (action) =>
                action.a_tipo === 'Goal' ||
                action.a_tipo === 'Goal su rigore' ||
                action.a_tipo === 'Calcio di rigore segnato'
        ).length,
        yellowCards: ownActions.filter((action) => action.a_tipo === 'Cartellino giallo').length,
        redCards: ownActions.filter((action) => action.a_tipo === 'Cartellino rosso').length,
        actions: ownActions.length,
    };
}

export default function SquadraModal({ mode, squadraId, torneoId, onClose }: Props) {
    const [tornei, setTornei] = useState<listaTorneiType[]>([]);
    const [availablePlayers, setAvailablePlayers] = useState<giocatoriDisponibiliSquadraType[]>([]);
    const [selectedCreatePlayers, setSelectedCreatePlayers] = useState<CreatePickerPlayer[]>([]);
    const [roster, setRoster] = useState<formazioneSquadraType>([]);
    const [statsRows, setStatsRows] = useState<statisticheSquadraType>([]);
    const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, idTorneo: torneoId ?? null });
    const [loading, setLoading] = useState(mode !== 'create');
    const [submitting, setSubmitting] = useState(false);
    const [playerSearch, setPlayerSearch] = useState('');
    const [debouncedPlayerSearch, setDebouncedPlayerSearch] = useState('');
    const [playersLoading, setPlayersLoading] = useState(false);
    const [newPlayerOpen, setNewPlayerOpen] = useState(false);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerSurname, setNewPlayerSurname] = useState('');
    const [creatingPlayer, setCreatingPlayer] = useState(false);
    const [rosterMutationPlayerId, setRosterMutationPlayerId] = useState<number | null>(null);
    const tempPlayerIdRef = useRef(-1);
    const playerSearchRequestRef = useRef(0);

    const readonly = mode === 'view';
    const isCreate = mode === 'create';
    const editHref = useMemo(() => {
        return `/squadre/modal?mode=edit&squadraId=${squadraId}&torneoId=${form.idTorneo ?? torneoId ?? ''}` as Href;
    }, [form.idTorneo, squadraId, torneoId]);

    const selectedRosterPlayers = useMemo(() => {
        if (isCreate) {
            return selectedCreatePlayers;
        }

        return roster;
    }, [isCreate, roster, selectedCreatePlayers]);

    const selectedPlayerIds = useMemo(() => {
        if (isCreate) return form.selectedPlayerIds;
        return getRosterPlayerIds(roster);
    }, [form.selectedPlayerIds, isCreate, roster]);

    const stats = useMemo(() => buildStats(statsRows, squadraId), [statsRows, squadraId]);

    function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    function addPlayerToSelection(player: CreatePickerPlayer) {
        setSelectedCreatePlayers((current) => {
            if (current.some((selected) => selected.id === player.id)) return current;
            return [...current, player];
        });
        setForm((current) => {
            if (current.selectedPlayerIds.includes(player.id)) return current;
            return { ...current, selectedPlayerIds: [...current.selectedPlayerIds, player.id] };
        });
    }

    function removePlayerFromSelection(playerId: number) {
        setSelectedCreatePlayers((current) => current.filter((player) => player.id !== playerId));
        setForm((current) => {
            const selectedPlayerIds = current.selectedPlayerIds.filter((id) => id !== playerId);
            const idCapitano =
                current.idCapitano && selectedPlayerIds.includes(current.idCapitano)
                    ? current.idCapitano
                    : null;

            return { ...current, selectedPlayerIds, idCapitano };
        });
    }

    function selectCreateTorneo(idTorneo: number | null) {
        playerSearchRequestRef.current += 1;
        setAvailablePlayers([]);
        setSelectedCreatePlayers([]);
        setPlayerSearch('');
        setDebouncedPlayerSearch('');
        setForm((current) => ({
            ...current,
            idTorneo,
            idCapitano: null,
            selectedPlayerIds: [],
        }));
    }

    async function loadTornei() {
        const data = await getListaTornei(null);
        const lista = data ?? [];
        setTornei(lista);
        setForm((current) => ({
            ...current,
            idTorneo: current.idTorneo ?? lista[0]?.id ?? null,
        }));
    }

    async function loadAvailablePlayers(idTorneo: number, searchParam: string) {
        const requestId = playerSearchRequestRef.current + 1;
        playerSearchRequestRef.current = requestId;
        setPlayersLoading(true);
        try {
            const data = await getGiocatoriDisponibiliSquadra(idTorneo, searchParam);
            if (playerSearchRequestRef.current !== requestId) return;
            setAvailablePlayers(data ?? []);
        } finally {
            if (playerSearchRequestRef.current === requestId) {
                setPlayersLoading(false);
            }
        }
    }

    async function refreshRoster() {
        if (!squadraId || !form.idTorneo) return;

        const formazione = (await getFormazioneSquadra(squadraId, form.idTorneo)) ?? [];
        const rosterPlayerIds = getRosterPlayerIds(formazione);

        setRoster(formazione);
        setForm((current) => ({
            ...current,
            selectedPlayerIds: rosterPlayerIds,
            idCapitano:
                current.idCapitano && rosterPlayerIds.includes(current.idCapitano)
                    ? current.idCapitano
                    : null,
        }));
    }

    async function handleAddRosterPlayer(player: giocatoriDisponibiliSquadraType) {
        if (!squadraId || !form.idTorneo) {
            errorMessage('Dati mancanti', 'Impossibile determinare squadra o torneo.');
            return;
        }

        if (roster.some((row) => row.id_giocatore === player.id)) return;

        setRosterMutationPlayerId(player.id);

        try {
            await insertIscrizioneSquadra({
                id_giocatore: player.id,
                id_squadra: squadraId,
                id_torneo: form.idTorneo,
            });
            setAvailablePlayers((current) => current.filter((item) => item.id !== player.id));
            setPlayerSearch('');
            setDebouncedPlayerSearch('');
            await refreshRoster();
        } catch (error: any) {
            errorMessage('Impossibile aggiungere giocatore', error.message ?? String(error));
        } finally {
            setRosterMutationPlayerId(null);
        }
    }

    async function handleRemoveRosterPlayer(playerId: number) {
        if (!squadraId) return;

        const iscrizione = roster.find((row) => row.id_giocatore === playerId);
        if (!iscrizione) return;

        setRosterMutationPlayerId(playerId);

        try {
            await deleteIscrizioneSquadra(iscrizione.id);

            if (form.idCapitano === playerId) {
                await updateSquadra(squadraId, { id_capitano: null });
                setForm((current) => ({ ...current, idCapitano: null }));
            }

            await refreshRoster();

            if (form.idTorneo && debouncedPlayerSearch.length >= 2) {
                await loadAvailablePlayers(form.idTorneo, debouncedPlayerSearch);
            }
        } catch (error: any) {
            errorMessage('Impossibile rimuovere giocatore', error.message ?? String(error));
        } finally {
            setRosterMutationPlayerId(null);
        }
    }

    function confirmRemoveRosterPlayer(playerId: number) {
        const player = roster.find((row) => row.id_giocatore === playerId);
        const playerName = player ? getPlayerName(player) : 'questo giocatore';

        Alert.alert('Rimuovere dalla rosa?', `${playerName} verra rimosso dalla squadra.`, [
            { text: 'Annulla', style: 'cancel' },
            {
                text: 'Rimuovi',
                style: 'destructive',
                onPress: () => handleRemoveRosterPlayer(playerId).then(() => null),
            },
        ]);
    }

    async function handleCreateInlinePlayer() {
        const nome = newPlayerName.trim();
        const cognome = newPlayerSurname.trim();

        if (!nome || !cognome) {
            errorMessage('Dati mancanti', 'Inserisci nome e cognome del giocatore.');
            return;
        }

        setCreatingPlayer(true);

        if (isCreate) {
            const nuovoGiocatore: PendingCreatePlayer = {
                id: tempPlayerIdRef.current,
                nome,
                cognome,
                is_capitano: false,
                ruolo_principale: null,
                link_foto: null,
                nome_maglia: null,
                numero_maglia: null,
                isPending: true,
            };

            tempPlayerIdRef.current -= 1;
            addPlayerToSelection(nuovoGiocatore);
            setNewPlayerName('');
            setNewPlayerSurname('');
            setNewPlayerOpen(false);
            setPlayerSearch('');
            setDebouncedPlayerSearch('');
            setCreatingPlayer(false);
            return;
        }

        if (!squadraId || !form.idTorneo) {
            errorMessage('Dati mancanti', 'Impossibile determinare squadra o torneo.');
            setCreatingPlayer(false);
            return;
        }

        try {
            const createdPlayer = await insertGiocatore({ nome, cognome });
            await insertIscrizioneSquadra({
                id_giocatore: createdPlayer.id,
                id_squadra: squadraId,
                id_torneo: form.idTorneo,
            });
            setNewPlayerName('');
            setNewPlayerSurname('');
            setNewPlayerOpen(false);
            setPlayerSearch('');
            setDebouncedPlayerSearch('');
            setAvailablePlayers([]);
            await refreshRoster();
        } catch (error: any) {
            errorMessage('Impossibile creare giocatore', error.message ?? String(error));
        } finally {
            setCreatingPlayer(false);
        }
    }

    async function loadExistingSquadra() {
        if (!squadraId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const [dati, formazione, statistiche] = await Promise.all([
                getDatiSquadra(squadraId),
                torneoId ? getFormazioneSquadra(squadraId, torneoId) : Promise.resolve([]),
                getStatisticheSquadra(squadraId, torneoId),
            ]);

            const rosterRows = formazione ?? [];
            const rosterPlayerIds = getRosterPlayerIds(rosterRows);
            const idCapitano =
                dati?.id_capitano && rosterPlayerIds.includes(dati.id_capitano)
                    ? dati.id_capitano
                    : null;

            setRoster(rosterRows);
            setStatsRows(statistiche ?? []);
            setForm({
                nome: dati?.nome ?? '',
                acronimo: dati?.acronimo ?? '',
                linkStemma: dati?.link_stemma ?? '',
                coloreSquadra: dati?.colore_squadra ?? '',
                usernameIg: dati?.username_ig ?? '',
                idCapitano,
                idTorneo: torneoId ?? null,
                selectedPlayerIds: rosterPlayerIds,
            });
        } catch (error: any) {
            errorMessage('Impossibile recuperare la squadra', error.message ?? String(error));
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit() {
        const nome = form.nome.trim();
        const acronimo = form.acronimo.trim().toUpperCase();

        if (!nome) {
            errorMessage('Dati mancanti', 'Inserisci il nome della squadra.');
            return;
        }

        if (!acronimo) {
            errorMessage('Dati mancanti', "Inserisci l'acronimo della squadra.");
            return;
        }

        if (isCreate && !form.idTorneo) {
            errorMessage('Dati mancanti', 'Seleziona un torneo.');
            return;
        }

        if (isCreate && selectedCreatePlayers.length === 0) {
            errorMessage(
                'Dati mancanti',
                'Seleziona almeno un giocatore libero per questo torneo. La squadra viene mostrata in lista solo dopo una iscrizione.'
            );
            return;
        }

        setSubmitting(true);

        try {
            if (isCreate) {
                await createSquadraConRoster({
                    squadra: {
                        nome,
                        acronimo,
                        link_stemma: emptyToNull(form.linkStemma),
                        colore_squadra: emptyToNull(form.coloreSquadra),
                        username_ig: emptyToNull(form.usernameIg),
                        id_capitano:
                            form.idCapitano && form.idCapitano > 0 ? form.idCapitano : null,
                    },
                    id_torneo: form.idTorneo as number,
                    id_capitano: form.idCapitano,
                    roster: selectedCreatePlayers.map((player) => {
                        if ('isPending' in player) {
                            return {
                                client_id: player.id,
                                giocatore: {
                                    nome: player.nome,
                                    cognome: player.cognome,
                                },
                            };
                        }

                        return { id_giocatore: player.id };
                    }),
                });
            } else if (squadraId) {
                await updateSquadra(squadraId, {
                    nome,
                    acronimo,
                    link_stemma: emptyToNull(form.linkStemma),
                    colore_squadra: emptyToNull(form.coloreSquadra),
                    username_ig: emptyToNull(form.usernameIg),
                    id_capitano: form.idCapitano,
                });
            }

            onClose();
        } catch (error: any) {
            errorMessage('Impossibile salvare la squadra', error.message ?? String(error));
        } finally {
            setSubmitting(false);
        }
    }

    useEffect(() => {
        if (isCreate) {
            loadTornei()
                .catch((error: any) =>
                    errorMessage('Impossibile recuperare i tornei', error.message ?? String(error))
                )
                .finally(() => setLoading(false));
            return;
        }

        loadExistingSquadra().then(() => null);
    }, [isCreate, squadraId, torneoId]);

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedPlayerSearch(playerSearch.trim()), 280);
        return () => clearTimeout(timeout);
    }, [playerSearch]);

    useEffect(() => {
        if (readonly || !form.idTorneo) return;

        if (debouncedPlayerSearch.length < 2) {
            playerSearchRequestRef.current += 1;
            setAvailablePlayers([]);
            setPlayersLoading(false);
            return;
        }

        loadAvailablePlayers(form.idTorneo, debouncedPlayerSearch).catch((error: any) => {
            setPlayersLoading(false);
            errorMessage('Impossibile recuperare i giocatori', error.message ?? String(error));
        });
    }, [debouncedPlayerSearch, form.idTorneo, readonly]);

    if (loading) {
        return (
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.formCard}>
                    <View className="items-center justify-center gap-3 py-16">
                        <ActivityIndicator size="large" />
                        <InterText className="text-muted-foreground">
                            Caricamento squadra...
                        </InterText>
                    </View>
                    <FooterButton label="Torna indietro" variant="secondary" onPress={onClose} />
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.formCard}>
                <View style={styles.modalHeader}>
                    <View>
                        {!isCreate && (
                            <InterText style={styles.eyebrow}>
                                {mode === 'view' ? 'Info squadra' : 'Modifica dati squadra'}
                            </InterText>
                        )}
                        <InterText style={styles.title}>
                            {mode === 'create' ? 'Nuova squadra' : form.nome || 'Squadra'}
                        </InterText>
                    </View>
                    {readonly && (
                        <Link href={editHref} asChild>
                            <TouchableOpacity style={styles.iconButton} activeOpacity={0.85}>
                                <SquarePenIcon size={18} color="#ffffff" />
                            </TouchableOpacity>
                        </Link>
                    )}
                </View>

                {readonly && <TeamHeader form={form} />}

                {readonly && (
                    <View style={styles.statsGrid}>
                        <StatTile label="Giocatori" value={roster.length} />
                        <StatTile label="Goal" value={stats.goals} />
                        <StatTile label="Gialli" value={stats.yellowCards} />
                        <StatTile label="Rossi" value={stats.redCards} />
                    </View>
                )}

                {isCreate && (
                    <GenericSelectField
                        label="Torneo"
                        placeholder="Seleziona torneo"
                        enableNullValue={false}
                        value={form.idTorneo?.toString() || ''}
                        options={tornei.map((torneo) => ({
                            id: String(torneo.id),
                            name: torneo.nome,
                        }))}
                        onChange={(val) => {
                            selectCreateTorneo(Number.parseInt(val));
                        }}
                        readonly={readonly}
                    />
                )}

                <View style={styles.row}>
                    <View style={styles.flexChild}>
                        <TextInputField
                            label="Nome squadra"
                            readonly={readonly}
                            value={form.nome}
                            onChange={(value) => setField('nome', value)}
                            placeholder="Real Madrid CdF"
                        />
                    </View>
                    <View style={styles.flexChild}>
                        <TextInputField
                            label="Acronimo"
                            readonly={readonly}
                            value={form.acronimo}
                            onChange={(value) => setField('acronimo', value.toUpperCase())}
                            placeholder="RMA"
                        />
                    </View>
                    <View style={styles.flexChild}>
                        <TextInputField
                            label="Colore squadra"
                            readonly={readonly}
                            value={form.coloreSquadra}
                            onChange={(value) => setField('coloreSquadra', value)}
                            placeholder="#ffcc33"
                        />
                    </View>
                    <View style={styles.flexChild}>
                        <TextInputField
                            label="Instagram"
                            readonly={readonly}
                            value={form.usernameIg}
                            onChange={(value) => setField('usernameIg', value)}
                            placeholder="@realmadrid"
                        />
                    </View>
                </View>

                {isCreate && (
                    <PlayerSearchPicker
                        label="Giocatori da iscrivere"
                        players={availablePlayers}
                        selectedPlayers={selectedCreatePlayers}
                        selectedIds={selectedPlayerIds}
                        search={playerSearch}
                        loading={playersLoading}
                        newPlayerOpen={newPlayerOpen}
                        newPlayerName={newPlayerName}
                        newPlayerSurname={newPlayerSurname}
                        creatingPlayer={creatingPlayer}
                        onSearchChange={setPlayerSearch}
                        onAdd={addPlayerToSelection}
                        onRemove={removePlayerFromSelection}
                        onToggleNewPlayer={() => setNewPlayerOpen((value) => !value)}
                        onNewPlayerNameChange={setNewPlayerName}
                        onNewPlayerSurnameChange={setNewPlayerSurname}
                        onCreateNewPlayer={handleCreateInlinePlayer}
                        selectedTitle="Selezionati"
                        emptyText="Nessun giocatore libero per questo torneo. Crea prima un giocatore o libera una iscrizione."
                    />
                )}

                {!isCreate && !readonly && (
                    <PlayerSearchPicker
                        label="Rosa"
                        players={availablePlayers}
                        selectedPlayers={roster}
                        selectedIds={selectedPlayerIds}
                        search={playerSearch}
                        loading={playersLoading}
                        newPlayerOpen={newPlayerOpen}
                        newPlayerName={newPlayerName}
                        newPlayerSurname={newPlayerSurname}
                        creatingPlayer={creatingPlayer}
                        busyPlayerId={rosterMutationPlayerId}
                        onSearchChange={setPlayerSearch}
                        onAdd={handleAddRosterPlayer}
                        onRemove={confirmRemoveRosterPlayer}
                        onToggleNewPlayer={() => setNewPlayerOpen((value) => !value)}
                        onNewPlayerNameChange={setNewPlayerName}
                        onNewPlayerSurnameChange={setNewPlayerSurname}
                        onCreateNewPlayer={handleCreateInlinePlayer}
                        selectedTitle="Rosa attuale"
                        emptyText="Nessun giocatore libero per questo torneo. Puoi creare un nuovo giocatore e aggiungerlo subito."
                    />
                )}

                <View className={'my-4'}>
                    <ChipPickerField<PickerPlayer>
                        label="Capitano squadra"
                        readonly={readonly}
                        options={selectedRosterPlayers}
                        selectedId={form.idCapitano?.toString() ?? null}
                        getId={(player) => getPlayerId(player)?.toString() ?? ''}
                        getValue={(player) =>
                            getPlayerName(player) || `Giocatore ${getPlayerId(player)}`
                        }
                        onSelect={(player) => setField('idCapitano', getPlayerId(player) ?? null)}
                    />
                </View>

                {!isCreate && readonly && (
                    <RosterSection
                        roster={roster}
                        idCapitano={form.idCapitano}
                        emptyText="Nessun giocatore iscritto a questa squadra"
                    />
                )}

                <View style={styles.dynamicRow}>
                    {readonly ? (
                        <FormButton
                            type={'secondary'}
                            label={'Torna indietro'}
                            onPress={onClose}
                            icon={ArrowLeftIcon}
                        />
                    ) : (
                        <FormButton
                            type={'destructive'}
                            label={'Indietro'}
                            onPress={onClose}
                            icon={ArrowLeftIcon}
                        />
                    )}
                    {!readonly && (
                        <FormButton
                            label={mode === 'create' ? 'Crea squadra' : 'Salva modifiche'}
                            onPress={handleSubmit}
                            icon={SaveIcon}
                            disabled={submitting}
                        />
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

function TeamHeader({ form }: { form: FormState }) {
    return (
        <View style={styles.teamHeader}>
            <View style={styles.logoBox}>
                {form.linkStemma ? (
                    <Image
                        source={{ uri: form.linkStemma }}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                ) : (
                    <ShieldIcon size={26} color="#64748b" />
                )}
            </View>
            <View style={styles.teamHeaderContent}>
                <InterText style={styles.teamName} numberOfLines={2}>
                    {form.nome || 'Squadra'}
                </InterText>
                <View style={styles.metaRow}>
                    <View
                        style={[
                            styles.colorDot,
                            { backgroundColor: form.coloreSquadra || '#cbd5e1' },
                        ]}
                    />
                    <InterText style={styles.teamMeta} numberOfLines={1}>
                        {form.acronimo || 'N/A'}
                    </InterText>
                </View>
            </View>
        </View>
    );
}

function StatTile({ label, value }: { label: string; value: number }) {
    return (
        <View style={styles.statTile}>
            <InterText style={styles.statValue}>{value}</InterText>
            <InterText style={styles.statLabel}>{label}</InterText>
        </View>
    );
}

function PlayerSearchPicker({
    label,
    players,
    selectedPlayers,
    selectedIds,
    search,
    loading,
    newPlayerOpen,
    newPlayerName,
    newPlayerSurname,
    creatingPlayer,
    busyPlayerId,
    onSearchChange,
    onAdd,
    onRemove,
    onToggleNewPlayer,
    onNewPlayerNameChange,
    onNewPlayerSurnameChange,
    onCreateNewPlayer,
    selectedTitle,
    emptyText,
}: {
    label: string;
    players: giocatoriDisponibiliSquadraType[];
    selectedPlayers: PickerPlayer[];
    selectedIds: number[];
    search: string;
    loading: boolean;
    newPlayerOpen: boolean;
    newPlayerName: string;
    newPlayerSurname: string;
    creatingPlayer: boolean;
    busyPlayerId?: number | null;
    onSearchChange: (value: string) => void;
    onAdd: (player: giocatoriDisponibiliSquadraType) => void;
    onRemove: (id: number) => void;
    onToggleNewPlayer: () => void;
    onNewPlayerNameChange: (value: string) => void;
    onNewPlayerSurnameChange: (value: string) => void;
    onCreateNewPlayer: () => void;
    selectedTitle: string;
    emptyText: string;
}) {
    const suggestions = players.filter((player) => !selectedIds.includes(player.id)).slice(0, 8);

    return (
        <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <InterText style={styles.label}>{label}:</InterText>

            <View style={styles.searchInputBox}>
                <SearchIcon size={16} color="#bfbfbf" />
                <TextInput
                    value={search}
                    onChangeText={onSearchChange}
                    placeholder="Cerca per nome o cognome..."
                    placeholderTextColor="#bfbfbf"
                    style={styles.searchInput}
                />
            </View>

            <View style={styles.suggestionsBox}>
                {search.trim().length < 2 ? (
                    <InterText style={styles.emptyOptions}>
                        Scrivi almeno 2 lettere per visualizzare i suggerimenti...
                    </InterText>
                ) : loading ? (
                    <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" />
                        <InterText style={styles.emptyOptions}>Ricerca giocatori...</InterText>
                    </View>
                ) : suggestions.length === 0 ? (
                    <InterText style={styles.emptyOptions}>{emptyText}</InterText>
                ) : (
                    suggestions.map((player) => {
                        const isBusy = busyPlayerId === player.id;

                        return (
                            <TouchableOpacity
                                key={player.id}
                                style={[styles.suggestionRow, isBusy && { opacity: 0.6 }]}
                                onPress={() => onAdd(player)}
                                disabled={isBusy}
                                activeOpacity={0.85}>
                                <PlayerAvatar player={player} />
                                <View style={styles.playerContent}>
                                    <InterText style={styles.playerName} numberOfLines={1}>
                                        {getPlayerName(player) || `Giocatore ${player.id}`}
                                    </InterText>
                                    <InterText style={styles.playerMeta} numberOfLines={1}>
                                        {getPlayerRole(player) ?? 'Ruolo non assegnato'}
                                    </InterText>
                                </View>
                                <View style={styles.addMiniButton}>
                                    {isBusy ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <PlusIcon size={15} color="#ffffff" strokeWidth={2.8} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>

            {selectedPlayers.length > 0 && (
                <View style={styles.selectedPlayersBox}>
                    <View style={styles.sectionHeader}>
                        <InterText style={styles.sectionTitle}>{selectedTitle}</InterText>
                        <View style={styles.countBadge}>
                            <InterText style={styles.countText}>{selectedPlayers.length}</InterText>
                        </View>
                    </View>
                    <View style={styles.rosterList}>
                        {selectedPlayers.map((player) => {
                            const playerId = getPlayerId(player);
                            const isBusy = playerId ? busyPlayerId === playerId : false;

                            return (
                                <View key={player.id} style={styles.playerRow}>
                                    <PlayerAvatar player={player} />
                                    <View style={styles.playerContent}>
                                        <InterText style={styles.playerName} numberOfLines={1}>
                                            {getPlayerName(player) || `Giocatore ${playerId}`}
                                        </InterText>
                                        <InterText style={styles.playerMeta} numberOfLines={1}>
                                            {getPlayerRole(player) ?? 'Ruolo non assegnato'}
                                        </InterText>
                                    </View>
                                    {playerId && (
                                        <TouchableOpacity
                                            style={[
                                                styles.removeMiniButton,
                                                isBusy && { opacity: 0.6 },
                                            ]}
                                            onPress={() => onRemove(playerId)}
                                            disabled={isBusy}
                                            activeOpacity={0.85}>
                                            {isBusy ? (
                                                <ActivityIndicator size="small" color="#7c3f3f" />
                                            ) : (
                                                <XIcon
                                                    size={15}
                                                    color="#7c3f3f"
                                                    strokeWidth={2.7}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            <TouchableOpacity
                style={styles.inlineAddButton}
                onPress={onToggleNewPlayer}
                activeOpacity={0.85}>
                <PlusIcon size={16} color="#0f172a" strokeWidth={2.7} />
                <InterText style={styles.inlineAddText}>Aggiungi giocatore</InterText>
            </TouchableOpacity>

            {newPlayerOpen && (
                <View style={styles.newPlayerBox}>
                    <View style={styles.row}>
                        <View style={styles.flexChild}>
                            <InterText style={styles.smallLabel}>Nome</InterText>
                            <TextInput
                                value={newPlayerName}
                                onChangeText={onNewPlayerNameChange}
                                placeholder="Nome"
                                placeholderTextColor="#94a3b8"
                                style={styles.newPlayerInput}
                            />
                        </View>
                        <View style={styles.flexChild}>
                            <InterText style={styles.smallLabel}>Cognome</InterText>
                            <TextInput
                                value={newPlayerSurname}
                                onChangeText={onNewPlayerSurnameChange}
                                placeholder="Cognome"
                                placeholderTextColor="#94a3b8"
                                style={styles.newPlayerInput}
                            />
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.createInlineButton, creatingPlayer && { opacity: 0.6 }]}
                        onPress={onCreateNewPlayer}
                        disabled={creatingPlayer}
                        activeOpacity={0.85}>
                        <SaveIcon size={15} color="#ffffff" />
                        <InterText style={styles.createInlineText}>
                            {creatingPlayer ? 'Creazione...' : 'Crea e seleziona'}
                        </InterText>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

function PlayerAvatar({ player }: { player: PickerPlayer }) {
    const photo = getPlayerPhoto(player);
    const name = getPlayerName(player);

    return (
        <View style={styles.playerAvatar}>
            {photo ? (
                <Image
                    source={{ uri: photo }}
                    style={styles.playerImage}
                    resizeMode="cover"
                />
            ) : (
                <InterText style={styles.playerInitials}>
                    {(name[0] ?? 'G').toUpperCase()}
                </InterText>
            )}
        </View>
    );
}

function RosterSection({
    roster,
    idCapitano,
    emptyText,
}: {
    roster: formazioneSquadraType;
    idCapitano: number | null;
    emptyText: string;
}) {
    return (
        <View style={styles.rosterSection}>
            <View style={styles.sectionHeader}>
                <InterText style={styles.sectionTitle}>Rosa</InterText>
                <View style={styles.countBadge}>
                    <InterText style={styles.countText}>{roster.length}</InterText>
                </View>
            </View>
            {roster.length === 0 ? (
                <InterText style={styles.emptyOptions}>{emptyText}</InterText>
            ) : (
                <View style={styles.rosterList}>
                    {roster.map((row) => (
                        <View key={row.id} style={styles.playerRow}>
                            <View style={styles.playerAvatar}>
                                {row.giocatore?.link_foto ? (
                                    <Image
                                        source={{ uri: row.giocatore.link_foto }}
                                        style={styles.playerImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <InterText style={styles.playerInitials}>
                                        {(row.giocatore?.nome?.[0] ?? 'G').toUpperCase()}
                                    </InterText>
                                )}
                            </View>
                            <View style={styles.playerContent}>
                                <InterText style={styles.playerName} numberOfLines={1}>
                                    {getPlayerName(row) || `Giocatore ${row.id_giocatore}`}
                                </InterText>
                                <InterText style={styles.playerMeta} numberOfLines={1}>
                                    {[
                                        row.giocatore?.ruolo_principale,
                                        row.giocatore?.numero_maglia
                                            ? `#${row.giocatore.numero_maglia}`
                                            : null,
                                        row.giocatore?.id === idCapitano ? 'Capitano' : null,
                                    ]
                                        .filter(Boolean)
                                        .join(' - ') || 'Dettagli non disponibili'}
                                </InterText>
                            </View>
                        </View>
                    ))}
                </View>
            )}
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 20,
    },
    inputField: {
        gap: 15,
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
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
    },
    teamHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 14,
        marginBottom: 18,
    },
    logoBox: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    logo: {
        width: 64,
        height: 64,
    },
    teamHeaderContent: {
        flex: 1,
        minWidth: 0,
        gap: 8,
    },
    teamName: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        fontWeight: '700',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    colorDot: {
        width: 10,
        height: 10,
        borderRadius: 999,
    },
    teamMeta: {
        color: '#64748b',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    statTile: {
        flex: 1,
        minWidth: 92,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        padding: 12,
    },
    statValue: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 22,
        fontWeight: '700',
    },
    statLabel: {
        color: '#64748b',
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        fontWeight: '500',
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
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
    },
    smallLabel: {
        color: '#475569',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
    },
    searchInputBox: {
        minHeight: 46,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    searchInput: {
        flex: 1,
        color: '#0f172a',
        fontFamily: 'Inter',
        fontSize: 14,
        minWidth: 0,
        paddingVertical: 10,
    },
    suggestionsBox: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#faf6f2',
        backgroundColor: '#ffffff',
        padding: 8,
        marginBottom: 10,
        gap: 8,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    suggestionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 12,
        backgroundColor: '#fcfaf7',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 10,
    },
    addMiniButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
    },
    removeMiniButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8e8e8',
    },
    selectedPlayersBox: {
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 12,
        marginTop: 4,
        marginBottom: 10,
    },
    inlineAddButton: {
        minHeight: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    inlineAddText: {
        color: '#0f172a',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        fontWeight: '600',
    },
    newPlayerBox: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
        padding: 12,
        marginTop: 10,
        gap: 10,
    },
    newPlayerInput: {
        minHeight: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        fontFamily: 'Inter',
        fontSize: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    createInlineButton: {
        minHeight: 42,
        borderRadius: 12,
        backgroundColor: '#0f172a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    createInlineText: {
        color: '#ffffff',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        fontWeight: '600',
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
    rosterSection: {
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 16,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 10,
    },
    sectionTitle: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        fontWeight: '700',
    },
    countBadge: {
        minWidth: 28,
        height: 26,
        borderRadius: 999,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    countText: {
        color: '#475569',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
    },
    rosterList: {
        gap: 8,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 10,
    },
    playerAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    playerImage: {
        width: 42,
        height: 42,
    },
    playerInitials: {
        color: '#64748b',
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        fontWeight: '700',
    },
    playerContent: {
        flex: 1,
        minWidth: 0,
    },
    playerName: {
        color: '#0f172a',
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        fontWeight: '600',
    },
    playerMeta: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 12,
    },
    dynamicRow: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        width: '100%',
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
