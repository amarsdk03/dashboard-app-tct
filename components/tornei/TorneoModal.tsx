import React, { useEffect, useMemo, useState } from 'react';
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
    ArrowRightIcon,
    ListOrderedIcon,
    PlusIcon,
    SaveIcon,
    SquarePenIcon,
    Trash2Icon,
} from 'lucide-react-native';
import { Link } from 'expo-router';
import {
    createTorneoSetup,
    datiTorneoType,
    getDatiTorneo,
    getSetupTorneo,
    setupTorneoType,
    updateTorneoSetup,
} from '@/data/tornei';
import {
    categorieGestioneTorneoType,
    classificheTorneoType,
    getCategorieGestioneTorneo,
    getClassificheTorneo,
} from '@/data/classifiche';
import { getListaGiocatori } from '@/data/giocatori';
import { getConteggioPartiteTorneo } from '@/data/partite';
import { getListaSquadre } from '@/data/squadre';
import { InterText } from '@/components/InterText';
import DateTimePickerField from '@/components/input/DateTimePickerField';
import TextInputField from '@/components/input/TextInputField';
import errorMessage from '@/components/ErrorMessage';
import TorneoLinkedDataSummary from '@/components/tornei/TorneoLinkedDataSummary';

export type TorneoModalMode = 'view' | 'create' | 'edit';

type Props = {
    mode: TorneoModalMode;
    torneoId?: number;
    onClose: () => void;
};

interface datiTorneo {
    id: number | null;
    nome: string | null;
    descrizione: string | null;
    dataInizio: Date | null;
    dataFine: Date | null;
    urlLogo: string | null;
}

type LinkedDataSummary = {
    squadreCount: number;
    giocatoriCount: number;
    partiteCount: number;
};

type CreateStep = 0 | 1 | 2;

type CategoriaDraft = {
    draftId: string;
    nome: string;
    numGironi: string;
    durataPartita: string;
    fasiPartite: string;
    squadreText: string;
};

type PartitaDraft = {
    draftId: string;
    categoriaDraftId: string;
    categoriaNome: string;
    girone: string;
    squadraCasa: string;
    squadraOspite: string;
    fase: string;
    giornata: string;
    dataPartita: Date | null;
    oraPartita: string;
};

type CategoriaNormalizzata = {
    draft: CategoriaDraft;
    nome: string;
    numGironi: number;
    durataPartita: number | null;
    fasiPartite: string[];
    squadre: string[];
};

type EditCategoriaDraft = {
    id: number;
    nome: string;
    numGironi: string;
    durataPartita: string;
    fasiPartite: string;
    numQualificate: string;
    numPlayoff: string;
    numEliminate: string;
};

type EditPartitaDraft = {
    draftId: string;
    id: number | null;
    idCategoria: string;
    idSquadraCasa: string;
    idSquadraOspite: string;
    girone: string;
    fase: string;
    giornata: string;
    dataPartita: Date | null;
    oraPartita: string;
};

const CREATE_STEPS = ['Dati', 'Categorie', 'Partite'];
const DEFAULT_FASES = 'Gironi';
const GIRONE_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function createDraftId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createCategoriaDraft(): CategoriaDraft {
    return {
        draftId: createDraftId(),
        nome: '',
        numGironi: '1',
        durataPartita: '25',
        fasiPartite: DEFAULT_FASES,
        squadreText: '',
    };
}

function splitList(value: string) {
    return value
        .split(/[\n,;]+/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function uniqueValues(values: string[]) {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const value of values) {
        const key = value.trim().toLocaleLowerCase('it');
        if (!key || seen.has(key)) continue;

        seen.add(key);
        result.push(value.trim());
    }

    return result;
}

function parsePositiveInteger(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return Number.NaN;

    const parsed = Number(trimmed);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
}

function parseOptionalPositiveInteger(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.NaN;
}

function parseNonNegativeInteger(value: string, fallback = 0) {
    const trimmed = value.trim();
    if (!trimmed) return fallback;

    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

function splitKickoff(isoValue: string | null | undefined) {
    if (!isoValue) {
        return {
            dataPartita: null,
            oraPartita: '',
        };
    }

    const date = new Date(isoValue);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return {
        dataPartita: date,
        oraPartita: `${hours}:${minutes}`,
    };
}

function makeAcronimo(nome: string) {
    const initials = nome
        .split(/\s+/)
        .map((word) => word[0])
        .join('')
        .replace(/[^a-z0-9]/gi, '')
        .slice(0, 3)
        .toUpperCase();

    return initials || nome.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase() || 'TCT';
}

function buildKickoffIso(date: Date | null, time: string) {
    if (!date) return null;

    const kickoff = new Date(date);
    const trimmedTime = time.trim();

    if (trimmedTime) {
        const [hours, minutes] = trimmedTime.split(':').map(Number);
        kickoff.setHours(hours, minutes, 0, 0);
    } else {
        kickoff.setHours(0, 0, 0, 0);
    }

    return kickoff.toISOString();
}

function getTeamKey(teamName: string) {
    return teamName.trim().toLocaleLowerCase('it');
}

function normalizzaCategorie(categorie: CategoriaDraft[]): CategoriaNormalizzata[] {
    return categorie
        .map((draft) => {
            const durataPartita = parseOptionalPositiveInteger(draft.durataPartita);
            return {
                draft,
                nome: draft.nome.trim(),
                numGironi: parsePositiveInteger(draft.numGironi),
                durataPartita: Number.isNaN(durataPartita) ? Number.NaN : durataPartita,
                fasiPartite: splitList(draft.fasiPartite),
                squadre: uniqueValues(splitList(draft.squadreText)),
            };
        })
        .filter((categoria) => categoria.nome.length > 0);
}

function groupTeams(squadre: string[], numGironi: number) {
    const gruppi: string[][] = Array.from({ length: numGironi }, () => []);

    squadre.forEach((squadra, index) => {
        gruppi[index % numGironi].push(squadra);
    });

    return gruppi;
}

export default function TorneoModal(props: Props) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summary, setSummary] = useState<LinkedDataSummary>({
        squadreCount: 0,
        giocatoriCount: 0,
        partiteCount: 0,
    });
    const [createStep, setCreateStep] = useState<CreateStep>(0);
    const [categorieDraft, setCategorieDraft] = useState<CategoriaDraft[]>([
        createCategoriaDraft(),
    ]);
    const [partiteDraft, setPartiteDraft] = useState<PartitaDraft[]>([]);
    const [editSetupLoading, setEditSetupLoading] = useState(false);
    const [editCategorieDraft, setEditCategorieDraft] = useState<EditCategoriaDraft[]>([]);
    const [editPartiteDraft, setEditPartiteDraft] = useState<EditPartitaDraft[]>([]);
    const [editSquadre, setEditSquadre] = useState<setupTorneoType['squadreAssociate']>([]);
    const [classifiche, setClassifiche] = useState<classificheTorneoType>([]);
    const [categorieGestione, setCategorieGestione] = useState<categorieGestioneTorneoType>([]);

    const [form, setForm] = useState<datiTorneo>({
        id: props.mode !== 'create' ? props.torneoId ?? null : null,
        nome: '',
        descrizione: '',
        dataInizio: null,
        dataFine: null,
        urlLogo: '',
    });

    const readonly = props.mode === 'view';
    const isCreate = props.mode === 'create';
    const categorieNormalizzate = useMemo(
        () => normalizzaCategorie(categorieDraft),
        [categorieDraft]
    );
    const editCategorieById = useMemo(() => {
        return new Map(editCategorieDraft.map((categoria) => [categoria.id, categoria]));
    }, [editCategorieDraft]);

    const handleClose = () => {
        props.onClose();
    };

    useEffect(() => {
        if (props.mode === 'create' || !props.torneoId) {
            return;
        }

        setLoading(true);

        getDatiTorneo(props.torneoId)
            .then((dati: datiTorneoType) => {
                setForm({
                    id: dati?.id ?? null,
                    nome: dati?.nome ?? '',
                    descrizione: dati?.descrizione ?? '',
                    dataInizio: dati?.data_inizio ? new Date(dati.data_inizio) : null,
                    dataFine: dati?.data_fine ? new Date(dati.data_fine) : null,
                    urlLogo: dati?.logo_torneo ?? '',
                });
            })
            .catch((error) => {
                errorMessage('Impossibile recuperare i dati', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [props.mode, props.torneoId]);

    useEffect(() => {
        if (props.mode !== 'view' || !props.torneoId) {
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
    }, [props.mode, props.torneoId]);

    useEffect(() => {
        if (props.mode === 'create' || !props.torneoId) {
            setEditCategorieDraft([]);
            setEditPartiteDraft([]);
            setEditSquadre([]);
            setClassifiche([]);
            setCategorieGestione([]);
            return;
        }

        setEditSetupLoading(true);

        Promise.all([
            getSetupTorneo(props.torneoId),
            getClassificheTorneo(props.torneoId),
            getCategorieGestioneTorneo(props.torneoId),
        ])
            .then(([setup, classificheTorneo, categorieGestioneTorneo]) => {
                if (props.mode === 'edit') {
                    setEditCategorieDraft(
                        setup.categorie.map((categoria) => ({
                            id: categoria.id,
                            nome: categoria.nome,
                            numGironi: String(categoria.num_gironi),
                            durataPartita:
                                categoria.durata_partita == null
                                    ? ''
                                    : String(categoria.durata_partita),
                            fasiPartite: categoria.fasi_partite.join(', '),
                            numQualificate: String(categoria.num_qualificate),
                            numPlayoff: String(categoria.num_playoff),
                            numEliminate: String(categoria.num_eliminate),
                        }))
                    );

                    setEditPartiteDraft(
                        setup.calendario.map((partita) => {
                            const kickoff = splitKickoff(partita.fischio_inizio);

                            return {
                                draftId: createDraftId(),
                                id: partita.id_partita,
                                idCategoria: partita.categoria_id
                                    ? String(partita.categoria_id)
                                    : '',
                                idSquadraCasa: partita.squadra_casa_id
                                    ? String(partita.squadra_casa_id)
                                    : '',
                                idSquadraOspite: partita.squadra_ospite_id
                                    ? String(partita.squadra_ospite_id)
                                    : '',
                                girone: partita.girone ?? 'A',
                                fase: partita.fase ?? 'Gironi',
                                giornata:
                                    partita.giornata == null ? '' : String(partita.giornata),
                                dataPartita: kickoff.dataPartita,
                                oraPartita: kickoff.oraPartita,
                            };
                        })
                    );

                    setEditSquadre(setup.squadreAssociate);
                }

                setClassifiche(classificheTorneo);
                setCategorieGestione(categorieGestioneTorneo);
            })
            .catch((error) => {
                errorMessage('Impossibile recuperare categorie e calendario', error);
            })
            .finally(() => {
                setEditSetupLoading(false);
            });
    }, [props.mode, props.torneoId]);

    const handleInputChange = (key: keyof datiTorneo, value: string) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const handleDateChange = (key: keyof datiTorneo, value: Date | null) => {
        if (value) {
            const dateOnly = new Date(value);
            dateOnly.setHours(0, 0, 0, 0);
            setForm((current) => ({ ...current, [key]: dateOnly }));
        } else {
            setForm((current) => ({ ...current, [key]: value }));
        }
    };

    const setCategoriaField = (
        draftId: string,
        key: keyof Omit<CategoriaDraft, 'draftId'>,
        value: string
    ) => {
        setCategorieDraft((current) =>
            current.map((categoria) =>
                categoria.draftId === draftId ? { ...categoria, [key]: value } : categoria
            )
        );
    };

    const addCategoria = () => {
        setCategorieDraft((current) => [...current, createCategoriaDraft()]);
    };

    const removeCategoria = (draftId: string) => {
        setCategorieDraft((current) => {
            if (current.length === 1) return current;
            return current.filter((categoria) => categoria.draftId !== draftId);
        });
        setPartiteDraft((current) =>
            current.filter((partita) => partita.categoriaDraftId !== draftId)
        );
    };

    const setPartitaField = (
        draftId: string,
        key: keyof Omit<PartitaDraft, 'draftId'>,
        value: string | Date | null
    ) => {
        setPartiteDraft((current) =>
            current.map((partita) =>
                partita.draftId === draftId ? { ...partita, [key]: value } : partita
            )
        );
    };

    const addEmptyPartita = () => {
        const categoria = categorieNormalizzate[0];
        const firstTeam = categoria?.squadre[0] ?? '';
        const secondTeam = categoria?.squadre[1] ?? '';

        setPartiteDraft((current) => [
            ...current,
            {
                draftId: createDraftId(),
                categoriaDraftId: categoria?.draft.draftId ?? '',
                categoriaNome: categoria?.nome ?? '',
                girone: 'A',
                squadraCasa: firstTeam,
                squadraOspite: secondTeam,
                fase: 'Gironi',
                giornata: '',
                dataPartita: form.dataInizio,
                oraPartita: '',
            },
        ]);
    };

    const removePartita = (draftId: string) => {
        setPartiteDraft((current) => current.filter((partita) => partita.draftId !== draftId));
    };

    const setEditCategoriaField = (
        idCategoria: number,
        key: keyof Omit<EditCategoriaDraft, 'id'>,
        value: string
    ) => {
        setEditCategorieDraft((current) =>
            current.map((categoria) =>
                categoria.id === idCategoria ? { ...categoria, [key]: value } : categoria
            )
        );
    };

    const setEditPartitaField = (
        draftId: string,
        key: keyof Omit<EditPartitaDraft, 'draftId' | 'id'>,
        value: string | Date | null
    ) => {
        setEditPartiteDraft((current) =>
            current.map((partita) =>
                partita.draftId === draftId ? { ...partita, [key]: value } : partita
            )
        );
    };

    const addEditPartita = () => {
        const categoria = editCategorieDraft[0];
        const squadraCasa = editSquadre[0];
        const squadraOspite = editSquadre[1];

        setEditPartiteDraft((current) => [
            ...current,
            {
                draftId: createDraftId(),
                id: null,
                idCategoria: categoria ? String(categoria.id) : '',
                idSquadraCasa: squadraCasa ? String(squadraCasa.id) : '',
                idSquadraOspite: squadraOspite ? String(squadraOspite.id) : '',
                girone: 'A',
                fase: 'Gironi',
                giornata: '',
                dataPartita: form.dataInizio,
                oraPartita: '',
            },
        ]);
    };

    const removeEditPartita = (draftId: string) => {
        setEditPartiteDraft((current) => current.filter((partita) => partita.draftId !== draftId));
    };

    const selectPartitaCategoria = (partitaId: string, categoria: CategoriaNormalizzata) => {
        setPartiteDraft((current) =>
            current.map((partita) =>
                partita.draftId === partitaId
                    ? {
                          ...partita,
                          categoriaDraftId: categoria.draft.draftId,
                          categoriaNome: categoria.nome,
                          squadraCasa: categoria.squadre.includes(partita.squadraCasa)
                              ? partita.squadraCasa
                              : categoria.squadre[0] ?? '',
                          squadraOspite: categoria.squadre.includes(partita.squadraOspite)
                              ? partita.squadraOspite
                              : categoria.squadre[1] ?? '',
                      }
                    : partita
            )
        );
    };

    const generateGironiFixtures = () => {
        const nextPartite: PartitaDraft[] = [];

        for (const categoria of categorieNormalizzate) {
            const gruppi = groupTeams(categoria.squadre, categoria.numGironi);

            gruppi.forEach((squadreGirone, gironeIndex) => {
                let giornata = 1;
                const girone = GIRONE_LABELS[gironeIndex] ?? String(gironeIndex + 1);

                for (let i = 0; i < squadreGirone.length; i += 1) {
                    for (let j = i + 1; j < squadreGirone.length; j += 1) {
                        nextPartite.push({
                            draftId: createDraftId(),
                            categoriaDraftId: categoria.draft.draftId,
                            categoriaNome: categoria.nome,
                            girone,
                            squadraCasa: squadreGirone[i],
                            squadraOspite: squadreGirone[j],
                            fase: 'Gironi',
                            giornata: String(giornata),
                            dataPartita: form.dataInizio,
                            oraPartita: '',
                        });
                        giornata += 1;
                    }
                }
            });
        }

        if (nextPartite.length === 0) {
            errorMessage(
                'Calendario non generato',
                'Inserisci almeno due squadre nella stessa categoria.'
            );
            return;
        }

        setPartiteDraft(nextPartite);
    };

    const validateTournamentFields = () => {
        if (!form.nome?.trim()) {
            errorMessage('Campi obbligatori mancanti', 'Il nome del torneo è obbligatorio');
            return false;
        }

        if (form.dataInizio && form.dataFine && form.dataFine < form.dataInizio) {
            errorMessage(
                'Date non valide',
                'La data di fine deve essere uguale o successiva alla data di inizio.'
            );
            return false;
        }

        return true;
    };

    const validateCategorie = () => {
        if (categorieNormalizzate.length === 0) {
            errorMessage('Categorie mancanti', 'Inserisci almeno una categoria del torneo.');
            return false;
        }

        for (const categoria of categorieNormalizzate) {
            if (Number.isNaN(categoria.durataPartita)) {
                errorMessage(
                    'Durata non valida',
                    `Controlla la durata partita per ${categoria.nome}.`
                );
                return false;
            }

            if (Number.isNaN(categoria.numGironi)) {
                errorMessage(
                    'Gironi non validi',
                    `Controlla il numero gironi per ${categoria.nome}.`
                );
                return false;
            }

            if (categoria.squadre.length === 1) {
                errorMessage(
                    'Squadre insufficienti',
                    `La categoria ${categoria.nome} ha una sola squadra. Aggiungine almeno due o svuota l'elenco.`
                );
                return false;
            }
        }

        return true;
    };

    const handleNextCreateStep = () => {
        if (createStep === 0 && !validateTournamentFields()) return;
        if (createStep === 1 && !validateCategorie()) return;

        setCreateStep((current) => Math.min(current + 1, 2) as CreateStep);
    };

    const handlePrevCreateStep = () => {
        setCreateStep((current) => Math.max(current - 1, 0) as CreateStep);
    };

    const buildTorneoPayload = () => ({
        nome: form.nome?.trim() ?? '',
        descrizione: form.descrizione?.trim() ? form.descrizione.trim() : null,
        data_inizio: form.dataInizio ? form.dataInizio.toISOString() : null,
        data_fine: form.dataFine ? form.dataFine.toISOString() : null,
        logo_torneo: form.urlLogo?.trim() ? form.urlLogo.trim() : null,
    });

    const buildEditCategoriePayload = () => {
        return editCategorieDraft.map((categoria) => {
            const numGironi = parsePositiveInteger(categoria.numGironi);
            const durataPartita = parseOptionalPositiveInteger(categoria.durataPartita);
            const numQualificate = parseNonNegativeInteger(categoria.numQualificate);
            const numPlayoff = parseNonNegativeInteger(categoria.numPlayoff);
            const numEliminate = parseNonNegativeInteger(categoria.numEliminate);

            if (!categoria.nome.trim()) {
                throw new Error('Ogni categoria deve avere un nome.');
            }

            if (
                Number.isNaN(numGironi) ||
                Number.isNaN(durataPartita) ||
                Number.isNaN(numQualificate) ||
                Number.isNaN(numPlayoff) ||
                Number.isNaN(numEliminate)
            ) {
                throw new Error(`Controlla i numeri della categoria ${categoria.nome}.`);
            }

            return {
                id: categoria.id,
                payload: {
                    nome: categoria.nome.trim(),
                    num_gironi: numGironi,
                    durata_partita: durataPartita,
                    fasi_partite: splitList(categoria.fasiPartite).length
                        ? splitList(categoria.fasiPartite)
                        : ['Gironi'],
                    num_qualificate: numQualificate,
                    num_playoff: numPlayoff,
                    num_eliminate: numEliminate,
                },
            };
        });
    };

    const buildEditCalendarioPayload = () => {
        return editPartiteDraft.map((partita) => {
            const idCategoria = Number.parseInt(partita.idCategoria, 10);
            const idSquadraCasa = Number.parseInt(partita.idSquadraCasa, 10);
            const idSquadraOspite = Number.parseInt(partita.idSquadraOspite, 10);
            const giornata = parseOptionalPositiveInteger(partita.giornata);

            if (!idCategoria || !editCategorieById.has(idCategoria)) {
                throw new Error('Ogni partita deve avere una categoria valida.');
            }

            if (!idSquadraCasa || !idSquadraOspite) {
                throw new Error('Ogni partita deve avere due squadre valide.');
            }

            if (idSquadraCasa === idSquadraOspite) {
                throw new Error('Le due squadre della stessa partita devono essere diverse.');
            }

            if (!partita.fase.trim()) {
                throw new Error('Ogni partita deve avere una fase.');
            }

            if (Number.isNaN(giornata)) {
                throw new Error('La giornata deve essere un numero intero positivo.');
            }

            if (
                partita.oraPartita.trim() &&
                !/^([01]\d|2[0-3]):([0-5]\d)$/.test(partita.oraPartita.trim())
            ) {
                throw new Error("Inserisci l'orario partita nel formato HH:mm.");
            }

            if (partita.oraPartita.trim() && !partita.dataPartita) {
                throw new Error("Se inserisci l'orario, seleziona anche la data.");
            }

            return {
                id: partita.id ?? undefined,
                id_categoria: idCategoria,
                id_squadra_casa: idSquadraCasa,
                id_squadra_ospite: idSquadraOspite,
                fase: partita.fase.trim(),
                girone: partita.girone.trim() || 'A',
                giornata: giornata || null,
                fischio_inizio: buildKickoffIso(partita.dataPartita, partita.oraPartita),
            };
        });
    };

    const handleSubmit = async () => {
        if (!validateTournamentFields()) return;

        const payload = buildTorneoPayload();

        setSubmitting(true);

        try {
            if (props.mode === 'create') {
                if (!validateCategorie()) return;

                const categoriaIndexByDraftId = new Map<string, number>();
                const squadraIndexByName = new Map<string, number>();
                const squadre: { nome: string; acronimo: string }[] = [];

                categorieNormalizzate.forEach((categoria, categoriaIndex) => {
                    categoriaIndexByDraftId.set(categoria.draft.draftId, categoriaIndex);

                    categoria.squadre.forEach((squadra) => {
                        const key = getTeamKey(squadra);
                        if (squadraIndexByName.has(key)) return;

                        squadraIndexByName.set(key, squadre.length);
                        squadre.push({
                            nome: squadra,
                            acronimo: makeAcronimo(squadra),
                        });
                    });
                });

                const partite = partiteDraft.map((partita) => {
                    const categoriaIndex = categoriaIndexByDraftId.get(partita.categoriaDraftId);
                    const squadraCasaIndex = squadraIndexByName.get(getTeamKey(partita.squadraCasa));
                    const squadraOspiteIndex = squadraIndexByName.get(
                        getTeamKey(partita.squadraOspite)
                    );
                    const giornata = parseOptionalPositiveInteger(partita.giornata);

                    if (categoriaIndex === undefined) {
                        throw new Error(`Categoria non valida per ${partita.squadraCasa}.`);
                    }

                    if (squadraCasaIndex === undefined || squadraOspiteIndex === undefined) {
                        throw new Error('Ogni partita deve usare squadre presenti nella categoria.');
                    }

                    if (squadraCasaIndex === squadraOspiteIndex) {
                        throw new Error('Le due squadre della stessa partita devono essere diverse.');
                    }

                    if (!partita.fase.trim()) {
                        throw new Error('Ogni partita deve avere una fase.');
                    }

                    if (Number.isNaN(giornata)) {
                        throw new Error('La giornata deve essere un numero intero positivo.');
                    }

                    if (
                        partita.oraPartita.trim() &&
                        !/^([01]\d|2[0-3]):([0-5]\d)$/.test(partita.oraPartita.trim())
                    ) {
                        throw new Error("Inserisci l'orario partita nel formato HH:mm.");
                    }

                    if (partita.oraPartita.trim() && !partita.dataPartita) {
                        throw new Error("Se inserisci l'orario, seleziona anche la data.");
                    }

                    return {
                        categoriaIndex,
                        squadraCasaIndex,
                        squadraOspiteIndex,
                        fase: partita.fase.trim(),
                        girone: partita.girone.trim() || 'A',
                        giornata: giornata || null,
                        fischio_inizio: buildKickoffIso(
                            partita.dataPartita,
                            partita.oraPartita
                        ),
                    };
                });

                await createTorneoSetup({
                    torneo: payload,
                    categorie: categorieNormalizzate.map((categoria) => ({
                        nome: categoria.nome,
                        num_gironi: categoria.numGironi,
                        durata_partita: categoria.durataPartita,
                        fasi_partite: categoria.fasiPartite.length
                            ? categoria.fasiPartite
                            : ['Gironi'],
                    })),
                    squadre,
                    partite,
                });
            } else if (props.mode === 'edit') {
                if (!form.id) {
                    errorMessage('Errore', 'ID torneo mancante');
                    return;
                }
                const categoriePayload = buildEditCategoriePayload();
                const calendarioPayload = buildEditCalendarioPayload();

                await updateTorneoSetup(form.id, {
                    torneo: payload,
                    categorie: categoriePayload,
                    calendario: calendarioPayload,
                });
            } else {
                errorMessage(
                    'handleSubmit(): modalità non supportata',
                    'props.mode = ' + props.mode
                );
                return;
            }

            handleClose();
        } catch (error: any) {
            errorMessage('Impossibile salvare i dati', error.message ?? String(error));
        } finally {
            setSubmitting(false);
        }
    };

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
                {isCreate && (
                    <CreateStepHeader currentStep={createStep} steps={CREATE_STEPS} />
                )}

                {(!isCreate || createStep === 0) && (
                    <TournamentFields
                        mode={props.mode}
                        form={form}
                        onInputChange={handleInputChange}
                        onDateChange={handleDateChange}
                    />
                )}

                {isCreate && createStep === 1 && (
                    <CreateCategoriesStep
                        categorie={categorieDraft}
                        onFieldChange={setCategoriaField}
                        onAdd={addCategoria}
                        onRemove={removeCategoria}
                    />
                )}

                {isCreate && createStep === 2 && (
                    <CreateFixturesStep
                        categorie={categorieNormalizzate}
                        partite={partiteDraft}
                        onGenerate={generateGironiFixtures}
                        onAdd={addEmptyPartita}
                        onRemove={removePartita}
                        onFieldChange={setPartitaField}
                        onSelectCategoria={selectPartitaCategoria}
                    />
                )}

                {props.mode === 'edit' && (
                    editSetupLoading ? (
                        <View style={styles.emptyState}>
                            <ActivityIndicator />
                            <InterText style={styles.emptyStateText}>
                                Caricamento gestione categorie e calendario...
                            </InterText>
                        </View>
                    ) : (
                        <EditTournamentManagement
                            categorie={editCategorieDraft}
                            partite={editPartiteDraft}
                            squadre={editSquadre}
                            classifiche={classifiche}
                            onCategoriaFieldChange={setEditCategoriaField}
                            onPartitaFieldChange={setEditPartitaField}
                            onAddPartita={addEditPartita}
                            onRemovePartita={removeEditPartita}
                        />
                    )
                )}

                {readonly && form.id && (
                    <TorneoLinkedDataSummary
                        torneoId={form.id}
                        loading={summaryLoading}
                        squadreCount={summary.squadreCount}
                        giocatoriCount={summary.giocatoriCount}
                        partiteCount={summary.partiteCount}
                    />
                )}

                {readonly && form.id && (
                    editSetupLoading ? (
                        <View style={styles.emptyState}>
                            <ActivityIndicator />
                            <InterText style={styles.emptyStateText}>
                                Caricamento categorie e classifiche...
                            </InterText>
                        </View>
                    ) : (
                        <ReadonlyTournamentManagement
                            categorie={categorieGestione}
                            classifiche={classifiche}
                        />
                    )
                )}

                <View style={[styles.dynamicRow, { marginTop: 12 }]}>
                    {isCreate && createStep > 0 ? (
                        <TouchableOpacity
                            style={[styles.button, styles.buttonSecondary]}
                            onPress={handlePrevCreateStep}
                            activeOpacity={0.8}>
                            <ArrowLeftIcon size={16} color="#6b7280" />
                            <InterText style={[styles.buttonText, styles.buttonSecondaryText]}>
                                Indietro
                            </InterText>
                        </TouchableOpacity>
                    ) : props.mode !== 'view' ? (
                        <TouchableOpacity
                            style={[styles.button, styles.buttonDestructive]}
                            onPress={handleClose}
                            activeOpacity={0.8}>
                            <ArrowLeftIcon size={16} color="#7c3f3f" />
                            <InterText style={[styles.buttonText, styles.buttonDestructiveText]}>
                                Annulla
                            </InterText>
                        </TouchableOpacity>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonSecondary]}
                                onPress={handleClose}
                                activeOpacity={0.8}>
                                <ArrowLeftIcon size={16} color="#6b7280" />
                                <InterText style={[styles.buttonText, styles.buttonSecondaryText]}>
                                    Torna indietro
                                </InterText>
                            </TouchableOpacity>
                            <Link
                                key={form.id}
                                href={`/tornei/modal?mode=edit&torneoId=${form.id}`}
                                asChild>
                                <TouchableOpacity style={styles.button} activeOpacity={0.8}>
                                    <SquarePenIcon size={16} color="#fff" />
                                    <InterText style={styles.buttonText}>Modifica</InterText>
                                </TouchableOpacity>
                            </Link>
                        </>
                    )}

                    {isCreate && createStep < 2 ? (
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleNextCreateStep}
                            activeOpacity={0.8}>
                            <ArrowRightIcon size={16} color="#fff" />
                            <InterText style={styles.buttonText}>Avanti</InterText>
                        </TouchableOpacity>
                    ) : props.mode !== 'view' ? (
                        <TouchableOpacity
                            style={[styles.button, submitting && { opacity: 0.6 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                            activeOpacity={0.8}>
                            <SaveIcon size={16} color="#fff" />
                            <InterText style={styles.buttonText}>
                                {props.mode === 'create' ? 'Crea torneo' : 'Salva modifiche'}
                            </InterText>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        </ScrollView>
    );
}

function TournamentFields({
    mode,
    form,
    onInputChange,
    onDateChange,
}: {
    mode: TorneoModalMode;
    form: datiTorneo;
    onInputChange: (key: keyof datiTorneo, value: string) => void;
    onDateChange: (key: keyof datiTorneo, value: Date | null) => void;
}) {
    const readonly = mode === 'view';

    return (
        <>
            <TextInputField
                label={'Nome Torneo'}
                readonly={readonly}
                value={form.nome}
                onChange={(val) => onInputChange('nome', val)}
                placeholder={'4° Edizione - 2025/2026'}
            />
            <TextInputField
                label={'Descrizione'}
                readonly={readonly}
                value={form.descrizione}
                onChange={(val) => onInputChange('descrizione', val)}
                placeholder={'Quota iscrizione, numero posti disponibili, link regolamento...'}
                multiline={true}
            />

            <View style={styles.row}>
                <View style={styles.flexChild}>
                    <DateTimePickerField
                        mode={'date'}
                        label="Data d'inizio"
                        readonly={readonly}
                        value={form.dataInizio}
                        onChange={(val) => onDateChange('dataInizio', val)}
                        placeholder="Seleziona..."
                    />
                </View>
                <View style={styles.flexChild}>
                    <DateTimePickerField
                        mode={'date'}
                        label="Data di fine"
                        readonly={readonly}
                        value={form.dataFine}
                        onChange={(val) => onDateChange('dataFine', val)}
                        placeholder="Seleziona..."
                    />
                </View>
            </View>

            <TextInputField
                label={'URL Logo'}
                readonly={readonly}
                value={form.urlLogo}
                onChange={(val) => onInputChange('urlLogo', val)}
                placeholder={'https://example.com/logo.png'}
            />
        </>
    );
}

function CreateStepHeader({ currentStep, steps }: { currentStep: CreateStep; steps: string[] }) {
    return (
        <View style={styles.stepHeader}>
            {steps.map((step, index) => {
                const active = index === currentStep;
                const completed = index < currentStep;

                return (
                    <View key={step} style={styles.stepItem}>
                        <View
                            style={[
                                styles.stepDot,
                                active && styles.stepDotActive,
                                completed && styles.stepDotCompleted,
                            ]}>
                            <InterText
                                style={[
                                    styles.stepDotText,
                                    (active || completed) && styles.stepDotTextActive,
                                ]}>
                                {index + 1}
                            </InterText>
                        </View>
                        <InterText
                            style={[
                                styles.stepLabel,
                                active && styles.stepLabelActive,
                                completed && styles.stepLabelCompleted,
                            ]}
                            numberOfLines={1}>
                            {step}
                        </InterText>
                    </View>
                );
            })}
        </View>
    );
}

function CreateCategoriesStep({
    categorie,
    onFieldChange,
    onAdd,
    onRemove,
}: {
    categorie: CategoriaDraft[];
    onFieldChange: (
        draftId: string,
        key: keyof Omit<CategoriaDraft, 'draftId'>,
        value: string
    ) => void;
    onAdd: () => void;
    onRemove: (draftId: string) => void;
}) {
    return (
        <View style={styles.section}>
            <InterText style={styles.sectionTitle}>Categorie, gironi e squadre</InterText>
            <InterText style={styles.helperText}>
                Inserisci le squadre una per riga. I gironi vengono creati sulle partite; non
                esiste una tabella gironi separata nel database.
            </InterText>

            {categorie.map((categoria, index) => (
                <View key={categoria.draftId} style={styles.subCard}>
                    <View style={styles.subCardHeader}>
                        <InterText style={styles.subCardTitle}>Categoria {index + 1}</InterText>
                        {categorie.length > 1 && (
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => onRemove(categoria.draftId)}
                                activeOpacity={0.8}>
                                <Trash2Icon size={16} color="#7c3f3f" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <TextInputField
                        label="Nome categoria"
                        value={categoria.nome}
                        onChange={(value) => onFieldChange(categoria.draftId, 'nome', value)}
                        placeholder="Open, Over 35, Femminile..."
                    />

                    <View style={styles.row}>
                        <View style={styles.flexChild}>
                            <TextInputField
                                label="Numero gironi"
                                value={categoria.numGironi}
                                onChange={(value) =>
                                    onFieldChange(categoria.draftId, 'numGironi', value)
                                }
                                placeholder="1"
                            />
                        </View>
                        <View style={styles.flexChild}>
                            <TextInputField
                                label="Durata partita"
                                value={categoria.durataPartita}
                                onChange={(value) =>
                                    onFieldChange(categoria.draftId, 'durataPartita', value)
                                }
                                placeholder="25"
                            />
                        </View>
                    </View>

                    <TextInputField
                        label="Fasi partite"
                        value={categoria.fasiPartite}
                        onChange={(value) => onFieldChange(categoria.draftId, 'fasiPartite', value)}
                        placeholder="Gironi, Quarti, Semifinale, Finale"
                    />

                    <TextInputField
                        label="Squadre"
                        value={categoria.squadreText}
                        onChange={(value) => onFieldChange(categoria.draftId, 'squadreText', value)}
                        placeholder={'Aquila Trento\nReal Duomo\nAtletico Adige'}
                        multiline={true}
                    />
                </View>
            ))}

            <TouchableOpacity style={styles.outlineButton} onPress={onAdd} activeOpacity={0.85}>
                <PlusIcon size={16} color="#0f172a" />
                <InterText style={styles.outlineButtonText}>Aggiungi categoria</InterText>
            </TouchableOpacity>
        </View>
    );
}

function CreateFixturesStep({
    categorie,
    partite,
    onGenerate,
    onAdd,
    onRemove,
    onFieldChange,
    onSelectCategoria,
}: {
    categorie: CategoriaNormalizzata[];
    partite: PartitaDraft[];
    onGenerate: () => void;
    onAdd: () => void;
    onRemove: (draftId: string) => void;
    onFieldChange: (
        draftId: string,
        key: keyof Omit<PartitaDraft, 'draftId'>,
        value: string | Date | null
    ) => void;
    onSelectCategoria: (partitaId: string, categoria: CategoriaNormalizzata) => void;
}) {
    return (
        <View style={styles.section}>
            <InterText style={styles.sectionTitle}>Partite base e calendario</InterText>
            <InterText style={styles.helperText}>
                Puoi generare un girone all'italiana per le squadre inserite o aggiungere partite
                manuali. Data e ora sono opzionali.
            </InterText>

            <View style={styles.dynamicRow}>
                <TouchableOpacity style={styles.outlineButton} onPress={onGenerate} activeOpacity={0.85}>
                    <ArrowRightIcon size={16} color="#0f172a" />
                    <InterText style={styles.outlineButtonText}>Genera gironi</InterText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.outlineButton} onPress={onAdd} activeOpacity={0.85}>
                    <PlusIcon size={16} color="#0f172a" />
                    <InterText style={styles.outlineButtonText}>Aggiungi partita</InterText>
                </TouchableOpacity>
            </View>

            {partite.length === 0 ? (
                <View style={styles.emptyState}>
                    <InterText style={styles.emptyStateText}>
                        Nessuna partita pronta. Il torneo verra creato con categorie e squadre,
                        senza calendario iniziale.
                    </InterText>
                </View>
            ) : (
                partite.map((partita, index) => (
                    <View key={partita.draftId} style={styles.subCard}>
                        <View style={styles.subCardHeader}>
                            <InterText style={styles.subCardTitle}>Partita {index + 1}</InterText>
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => onRemove(partita.draftId)}
                                activeOpacity={0.8}>
                                <Trash2Icon size={16} color="#7c3f3f" />
                            </TouchableOpacity>
                        </View>

                        <CategoriaChipPicker
                            categorie={categorie}
                            selectedDraftId={partita.categoriaDraftId}
                            onSelect={(categoria) => onSelectCategoria(partita.draftId, categoria)}
                        />

                        <View style={styles.row}>
                            <View style={styles.flexChild}>
                                <TextInputField
                                    label="Squadra casa"
                                    value={partita.squadraCasa}
                                    onChange={(value) =>
                                        onFieldChange(partita.draftId, 'squadraCasa', value)
                                    }
                                    placeholder="Squadra casa"
                                />
                            </View>
                            <View style={styles.flexChild}>
                                <TextInputField
                                    label="Squadra ospite"
                                    value={partita.squadraOspite}
                                    onChange={(value) =>
                                        onFieldChange(partita.draftId, 'squadraOspite', value)
                                    }
                                    placeholder="Squadra ospite"
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.flexChild}>
                                <TextInputField
                                    label="Girone"
                                    value={partita.girone}
                                    onChange={(value) =>
                                        onFieldChange(partita.draftId, 'girone', value)
                                    }
                                    placeholder="A"
                                />
                            </View>
                            <View style={styles.flexChild}>
                                <TextInputField
                                    label="Fase"
                                    value={partita.fase}
                                    onChange={(value) =>
                                        onFieldChange(partita.draftId, 'fase', value)
                                    }
                                    placeholder="Gironi"
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.flexChild}>
                                <TextInputField
                                    label="Giornata"
                                    value={partita.giornata}
                                    onChange={(value) =>
                                        onFieldChange(partita.draftId, 'giornata', value)
                                    }
                                    placeholder="1"
                                />
                            </View>
                            <View style={styles.flexChild}>
                                <TextInputField
                                    label="Ora"
                                    value={partita.oraPartita}
                                    onChange={(value) =>
                                        onFieldChange(partita.draftId, 'oraPartita', value)
                                    }
                                    placeholder="20:30"
                                />
                            </View>
                        </View>

                        <DateTimePickerField
                            mode="date"
                            label="Data partita"
                            value={partita.dataPartita}
                            onChange={(value) =>
                                onFieldChange(partita.draftId, 'dataPartita', value)
                            }
                            placeholder="Opzionale"
                        />
                    </View>
                ))
            )}
        </View>
    );
}

function EditTournamentManagement({
    categorie,
    partite,
    squadre,
    classifiche,
    onCategoriaFieldChange,
    onPartitaFieldChange,
    onAddPartita,
    onRemovePartita,
}: {
    categorie: EditCategoriaDraft[];
    partite: EditPartitaDraft[];
    squadre: setupTorneoType['squadreAssociate'];
    classifiche: classificheTorneoType;
    onCategoriaFieldChange: (
        idCategoria: number,
        key: keyof Omit<EditCategoriaDraft, 'id'>,
        value: string
    ) => void;
    onPartitaFieldChange: (
        draftId: string,
        key: keyof Omit<EditPartitaDraft, 'draftId' | 'id'>,
        value: string | Date | null
    ) => void;
    onAddPartita: () => void;
    onRemovePartita: (draftId: string) => void;
}) {
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
                <InterText style={styles.sectionTitle}>Gestione torneo</InterText>
                <ListOrderedIcon size={18} color="#0f172a" />
            </View>
            <InterText style={styles.helperText}>
                Le squadre associate sono derivate in modo pragmatico da iscrizioni e calendario:
                non esiste una tabella squadra-torneo dedicata.
            </InterText>

            {categorie.map((categoria) => (
                <View key={categoria.id} style={styles.subCard}>
                    <View style={styles.subCardHeader}>
                        <InterText style={styles.subCardTitle}>{categoria.nome}</InterText>
                    </View>

                    <TextInputField
                        label="Nome categoria"
                        value={categoria.nome}
                        onChange={(value) =>
                            onCategoriaFieldChange(categoria.id, 'nome', value)
                        }
                        placeholder="Open"
                    />

                    <View style={styles.row}>
                        <View style={styles.flexChild}>
                            <TextInputField
                                label="Gironi"
                                value={categoria.numGironi}
                                onChange={(value) =>
                                    onCategoriaFieldChange(categoria.id, 'numGironi', value)
                                }
                                placeholder="1"
                            />
                        </View>
                        <View style={styles.flexChild}>
                            <TextInputField
                                label="Durata"
                                value={categoria.durataPartita}
                                onChange={(value) =>
                                    onCategoriaFieldChange(categoria.id, 'durataPartita', value)
                                }
                                placeholder="25"
                            />
                        </View>
                    </View>

                    <TextInputField
                        label="Fasi categoria"
                        value={categoria.fasiPartite}
                        onChange={(value) =>
                            onCategoriaFieldChange(categoria.id, 'fasiPartite', value)
                        }
                        placeholder="Gironi, Semifinale, Finale"
                    />

                    <View style={styles.row}>
                        <View style={styles.flexChild}>
                            <TextInputField
                                label="Qualificate"
                                value={categoria.numQualificate}
                                onChange={(value) =>
                                    onCategoriaFieldChange(categoria.id, 'numQualificate', value)
                                }
                                placeholder="0"
                            />
                        </View>
                        <View style={styles.flexChild}>
                            <TextInputField
                                label="Playoff"
                                value={categoria.numPlayoff}
                                onChange={(value) =>
                                    onCategoriaFieldChange(categoria.id, 'numPlayoff', value)
                                }
                                placeholder="0"
                            />
                        </View>
                        <View style={styles.flexChild}>
                            <TextInputField
                                label="Eliminate"
                                value={categoria.numEliminate}
                                onChange={(value) =>
                                    onCategoriaFieldChange(categoria.id, 'numEliminate', value)
                                }
                                placeholder="0"
                            />
                        </View>
                    </View>
                </View>
            ))}

            <View style={styles.subCard}>
                <View style={styles.subCardHeader}>
                    <InterText style={styles.subCardTitle}>Calendario</InterText>
                    <TouchableOpacity
                        style={[styles.iconButton, squadre.length < 2 && { opacity: 0.5 }]}
                        onPress={onAddPartita}
                        disabled={squadre.length < 2}
                        activeOpacity={0.8}>
                        <PlusIcon size={16} color="#0f172a" />
                    </TouchableOpacity>
                </View>
                <InterText style={styles.helperText}>
                    Il salvataggio aggiorna partite esistenti e inserisce nuove partite. La
                    cancellazione di partite esistenti resta fuori da questa azione.
                </InterText>

                {squadre.length < 2 && (
                    <View style={styles.emptyState}>
                        <InterText style={styles.emptyStateText}>
                            Servono almeno due squadre associate per aggiungere nuove partite.
                            Aggiungile da iscrizioni o da partite esistenti.
                        </InterText>
                    </View>
                )}

                {partite.length === 0 ? (
                    <View style={styles.emptyState}>
                        <InterText style={styles.emptyStateText}>
                            Nessuna partita nel calendario del torneo.
                        </InterText>
                    </View>
                ) : (
                    partite.map((partita, index) => (
                        <View key={partita.draftId} style={styles.nestedCard}>
                            <View style={styles.subCardHeader}>
                                <InterText style={styles.subCardTitle}>
                                    Partita {index + 1}
                                </InterText>
                                {partita.id === null && (
                                    <TouchableOpacity
                                        style={styles.iconButton}
                                        onPress={() => onRemovePartita(partita.draftId)}
                                        activeOpacity={0.8}>
                                        <Trash2Icon size={16} color="#7c3f3f" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <IdChipPicker
                                label="Categoria"
                                options={categorie.map((categoria) => ({
                                    id: categoria.id,
                                    label: categoria.nome,
                                }))}
                                selectedId={partita.idCategoria}
                                onSelect={(id) =>
                                    onPartitaFieldChange(partita.draftId, 'idCategoria', id)
                                }
                            />

                            <IdChipPicker
                                label="Squadra casa"
                                options={squadre.map((squadra) => ({
                                    id: squadra.id,
                                    label: squadra.nome,
                                }))}
                                selectedId={partita.idSquadraCasa}
                                onSelect={(id) =>
                                    onPartitaFieldChange(partita.draftId, 'idSquadraCasa', id)
                                }
                            />

                            <IdChipPicker
                                label="Squadra ospite"
                                options={squadre.map((squadra) => ({
                                    id: squadra.id,
                                    label: squadra.nome,
                                }))}
                                selectedId={partita.idSquadraOspite}
                                onSelect={(id) =>
                                    onPartitaFieldChange(partita.draftId, 'idSquadraOspite', id)
                                }
                            />

                            <View style={styles.row}>
                                <View style={styles.flexChild}>
                                    <TextInputField
                                        label="Girone"
                                        value={partita.girone}
                                        onChange={(value) =>
                                            onPartitaFieldChange(partita.draftId, 'girone', value)
                                        }
                                        placeholder="A"
                                    />
                                </View>
                                <View style={styles.flexChild}>
                                    <TextInputField
                                        label="Fase"
                                        value={partita.fase}
                                        onChange={(value) =>
                                            onPartitaFieldChange(partita.draftId, 'fase', value)
                                        }
                                        placeholder="Gironi"
                                    />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={styles.flexChild}>
                                    <TextInputField
                                        label="Giornata"
                                        value={partita.giornata}
                                        onChange={(value) =>
                                            onPartitaFieldChange(
                                                partita.draftId,
                                                'giornata',
                                                value
                                            )
                                        }
                                        placeholder="1"
                                    />
                                </View>
                                <View style={styles.flexChild}>
                                    <TextInputField
                                        label="Ora"
                                        value={partita.oraPartita}
                                        onChange={(value) =>
                                            onPartitaFieldChange(
                                                partita.draftId,
                                                'oraPartita',
                                                value
                                            )
                                        }
                                        placeholder="20:30"
                                    />
                                </View>
                            </View>

                            <DateTimePickerField
                                mode="date"
                                label="Data partita"
                                value={partita.dataPartita}
                                onChange={(value) =>
                                    onPartitaFieldChange(partita.draftId, 'dataPartita', value)
                                }
                                placeholder="Opzionale"
                            />
                        </View>
                    ))
                )}
            </View>

            <ClassifichePreview classifiche={classifiche} />
        </View>
    );
}

function ReadonlyTournamentManagement({
    categorie,
    classifiche,
}: {
    categorie: categorieGestioneTorneoType;
    classifiche: classificheTorneoType;
}) {
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
                <InterText style={styles.sectionTitle}>Categorie e classifiche</InterText>
                <ListOrderedIcon size={18} color="#0f172a" />
            </View>

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
                            <ReadonlyStat
                                label="Squadre"
                                value={String(categoria.squadre_count)}
                            />
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
                            <ReadonlyStat
                                label="Playoff"
                                value={String(categoria.num_playoff)}
                            />
                            <ReadonlyStat
                                label="Eliminate"
                                value={String(categoria.num_eliminate)}
                            />
                        </View>
                    </View>
                ))
            )}

            <ClassifichePreview classifiche={classifiche} />
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

function IdChipPicker({
    label,
    options,
    selectedId,
    onSelect,
}: {
    label: string;
    options: { id: number; label: string }[];
    selectedId: string;
    onSelect: (id: string) => void;
}) {
    return (
        <View style={styles.inputGroup}>
            <InterText style={styles.label}>{label}</InterText>
            <View style={styles.chipRow}>
                {options.map((option) => {
                    const active = selectedId === String(option.id);
                    return (
                        <TouchableOpacity
                            key={option.id}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => onSelect(String(option.id))}
                            activeOpacity={0.85}>
                            <InterText
                                style={[styles.chipText, active && styles.chipTextActive]}
                                numberOfLines={1}>
                                {option.label}
                            </InterText>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

function ClassifichePreview({ classifiche }: { classifiche: classificheTorneoType }) {
    return (
        <View style={styles.subCard}>
            <InterText style={styles.subCardTitle}>Classifiche</InterText>
            {classifiche.length === 0 ? (
                <View style={[styles.emptyState, { marginTop: 12 }]}>
                    <InterText style={styles.emptyStateText}>
                        Nessun risultato con gol disponibile per calcolare la classifica.
                    </InterText>
                </View>
            ) : (
                <View style={styles.table}>
                    {classifiche.map((row) => (
                        <View
                            key={`${row.categoria_id}-${row.girone}-${row.squadra_id}`}
                            style={styles.tableRow}>
                            <View style={styles.tableTeam}>
                                <InterText style={styles.tableTitle} numberOfLines={1}>
                                    {row.posizione}. {row.squadra_nome}
                                </InterText>
                                <InterText style={styles.tableMeta} numberOfLines={1}>
                                    {row.categoria_nome ?? 'Categoria'} · Girone{' '}
                                    {row.girone ?? '-'}
                                </InterText>
                            </View>
                            <InterText style={styles.tableStat}>{row.punti} pt</InterText>
                            <InterText style={styles.tableStat}>
                                {row.goal_fatti}:{row.goal_subiti}
                            </InterText>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

function CategoriaChipPicker({
    categorie,
    selectedDraftId,
    onSelect,
}: {
    categorie: CategoriaNormalizzata[];
    selectedDraftId: string;
    onSelect: (categoria: CategoriaNormalizzata) => void;
}) {
    return (
        <View style={styles.inputGroup}>
            <InterText style={styles.label}>Categoria:</InterText>
            <View style={styles.chipRow}>
                {categorie.map((categoria) => {
                    const active = selectedDraftId === categoria.draft.draftId;
                    return (
                        <TouchableOpacity
                            key={categoria.draft.draftId}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => onSelect(categoria)}
                            activeOpacity={0.85}>
                            <InterText
                                style={[styles.chipText, active && styles.chipTextActive]}
                                numberOfLines={1}>
                                {categoria.nome}
                            </InterText>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
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
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    row: {
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
        backgroundColor: '#b3642c',
        borderColor: '#b3642c',
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
        color: '#b3642c',
        fontWeight: '600',
    },
    section: {
        gap: 14,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    subCard: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 16,
        padding: 14,
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
        marginBottom: 12,
        gap: 8,
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
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 12,
        minHeight: 46,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        shadowColor: '#0f172a',
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
