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
    updateTorneoSetup,
} from '@/data/tornei';
import { InterText } from '@/components/generic/InterText';
import DateTimePickerField from '@/components/input/DateTimePickerField';
import TextInputField from '@/components/input/TextInputField';
import errorMessage from '@/components/generic/ErrorMessage';
import ChipPickerField from '@/components/input/ChipPickerField';
import { getListaCampi, listaCampiType } from '@/data/campi';
import { TorneoModalMode } from '@/app/(app)/(tabs)/tornei/modal';
import FormButton from '@/components/input/FormButton';
import { confirmDiscardChanges } from '@/lib/confirm';

type Props = {
    mode: TorneoModalMode;
    torneoId: number | null;
    onClose: () => void;
};

interface datiTorneo {
    id: number | null;
    nome: string | null;
    descrizione: string | null;
    dataInizio: Date | null;
    dataFine: Date | null;
    idCampo: string | null;
}

type CategoriaType = {
    tempId: string;
    nome: string;
    numGironi: string;
    durataPartita: string;
    fasiPartite: string;
};

type CategoriaNormalizzata = {
    draft: CategoriaType;
    nome: string;
    numGironi: number;
    durataPartita: number | null;
    fasiPartite: string[];
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

const CREATE_STEPS = ['Dati torneo', 'Dati categorie', 'Conferma dati'];

function defaultCategorie(): CategoriaType[] {
    return [
        {
            tempId: '0',
            nome: 'Tesserati',
            numGironi: '2',
            durataPartita: '25',
            fasiPartite: 'Fase a gironi, Quarti di finale, Semifinale, Spareggio 3° posto, Finale',
        },
        {
            tempId: '1',
            nome: 'Amatori',
            numGironi: '2',
            durataPartita: '25',
            fasiPartite: 'Fase a gironi, Quarti di finale, Semifinale, Spareggio 3° posto, Finale',
        },
    ];
}

function splitList(value: string) {
    return value
        .split(/[\n,;]+/)
        .map((item) => item.trim())
        .filter(Boolean);
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

function normalizzaCategorie(categorie: CategoriaType[]): CategoriaNormalizzata[] {
    return categorie
        .map((draft) => {
            const durataPartita = parseOptionalPositiveInteger(draft.durataPartita);
            return {
                draft,
                nome: draft.nome.trim(),
                numGironi: parsePositiveInteger(draft.numGironi),
                durataPartita: Number.isNaN(durataPartita) ? Number.NaN : durataPartita,
                fasiPartite: splitList(draft.fasiPartite),
            };
        })
        .filter((categoria) => categoria.nome.length > 0);
}

export default function TorneoModalForm(props: Props) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [createStep, setCreateStep] = useState<number>(0);
    const [categorieDraft, setCategorieDraft] = useState<CategoriaType[]>(defaultCategorie());
    const [campi, setCampi] = useState<listaCampiType[]>([]);
    const [editCategorieDraft, setEditCategorieDraft] = useState<EditCategoriaDraft[]>([]);

    const [form, setForm] = useState<datiTorneo>({
        id: props.mode !== 'create' ? (props.torneoId ?? null) : null,
        nome: '',
        descrizione: '',
        dataInizio: null,
        dataFine: null,
        idCampo: null,
    });

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

    const handleCancelForm = () => {
        confirmDiscardChanges(handleClose);
    };

    async function loadCampi() {
        const data = await getListaCampi();
        const lista = data ?? [];
        setCampi(lista.reverse());
        setForm((current) => ({
            ...current,
            idCampo: current.idCampo ?? (lista[0]?.id != null ? String(lista[0].id) : null),
        }));
    }

    useEffect(() => {
        loadCampi().then(_ => null);
    }, []);

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
                    idCampo: dati?.campo?.id != null ? String(dati.campo.id) : null,
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
        if (props.mode === 'create' || !props.torneoId) {
            setEditCategorieDraft([]);
            return;
        }

        Promise.all([getSetupTorneo(props.torneoId)])
            .then(([setup]) => {
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
                    setCategorieDraft(
                        setup.categorie.map((categoria) => ({
                            tempId: String(categoria.id),
                            nome: categoria.nome,
                            numGironi: String(categoria.num_gironi),
                            durataPartita:
                                categoria.durata_partita == null
                                    ? ''
                                    : String(categoria.durata_partita),
                            fasiPartite: categoria.fasi_partite.join(', '),
                        }))
                    );
                }
            })
            .catch((error) => {
                errorMessage('Impossibile recuperare categorie e calendario', error);
            })
            .finally(() => null);
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
        key: keyof Omit<CategoriaType, 'tempId'>,
        value: string
    ) => {
        setCategorieDraft((current) =>
            current.map((categoria) =>
                categoria.tempId === draftId ? { ...categoria, [key]: value } : categoria
            )
        );
    };

    const addCategoria = () => {
        setCategorieDraft((current) => [
            ...current,
            {
                tempId: (current[current.length - 1]?.tempId ?? 0) + 1,
                nome: 'Categoria n.' + (current.length + 1),
                numGironi: '2',
                durataPartita: '25',
                fasiPartite:
                    'Fase a gironi, Quarti di finale, Semifinale, Spareggio 3° posto, Finale',
            },
        ]);
    };

    const removeCategoria = (draftId: string) => {
        setCategorieDraft((current) => {
            if (current.length === 1) return current;
            return current.filter((categoria) => categoria.tempId !== draftId);
        });
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
                    'Numero gironi non valido',
                    `Controlla il numero gironi per ${categoria.nome}.`
                );
                return false;
            } else if (Number(categoria.numGironi) < 1 || Number(categoria.numGironi) > 16) {
                errorMessage(
                    'Numero gironi non valido',
                    `Il numero di gironi per ${categoria.nome} dev'essere compreso tra 1 e 16.`
                );
                return false;
            }
        }

        return true;
    };

    const handleNextCreateStep = () => {
        if (createStep === 0 && !validateTournamentFields()) return;
        if (createStep === 1 && !validateCategorie()) return;

        setCreateStep((current) => Math.min(current + 1, 2));
    };

    const handlePrevCreateStep = () => {
        setCreateStep((current) => Math.max(current - 1, 0));
    };

    const buildTorneoPayload = () => ({
        nome: form.nome?.trim() ?? '',
        descrizione: form.descrizione?.trim() ? form.descrizione.trim() : null,
        data_inizio: form.dataInizio ? form.dataInizio.toISOString() : null,
        data_fine: form.dataFine ? form.dataFine.toISOString() : null,
        id_campo: form.idCampo ? Number(form.idCampo) : null,
    });

    const handleSubmit = async () => {
        if (!validateTournamentFields()) return;

        const payload = buildTorneoPayload();

        setSubmitting(true);

        try {
            if (props.mode === 'create') {
                if (!validateCategorie()) return;

                const categoriaIndexByDraftId = new Map<string, number>();
                const squadre: { nome: string; acronimo: string }[] = [];

                categorieNormalizzate.forEach((categoria, categoriaIndex) => {
                    categoriaIndexByDraftId.set(categoria.draft.tempId, categoriaIndex);
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
                });
            } else if (props.mode === 'edit') {
                if (!form.id) {
                    errorMessage('Errore', 'ID torneo mancante');
                    return;
                }

                if (!validateCategorie()) return;

                await updateTorneoSetup(form.id, {
                    torneo: payload,
                    categorie: categorieNormalizzate.map((categoria) => {
                        const id = Number.parseInt(categoria.draft.tempId, 10);
                        const current = editCategorieById.get(id);

                        if (!current) {
                            throw new Error(
                                'Una o piu categorie non appartengono al torneo in modifica.'
                            );
                        }

                        return {
                            id,
                            payload: {
                                nome: categoria.nome,
                                num_gironi: categoria.numGironi,
                                durata_partita: categoria.durataPartita,
                                fasi_partite: categoria.fasiPartite.length
                                    ? categoria.fasiPartite
                                    : ['Gironi'],
                                num_qualificate: Number.parseInt(current.numQualificate, 10) || 0,
                                num_playoff: Number.parseInt(current.numPlayoff, 10) || 0,
                                num_eliminate: Number.parseInt(current.numEliminate, 10) || 0,
                            },
                        };
                    }),
                    calendario: [],
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
                <CreateStepHeader currentStep={createStep} steps={CREATE_STEPS} />

                {createStep === 0 && (
                    <FormDatiTorneo
                        mode={props.mode}
                        form={form}
                        campi={campi}
                        onInputChange={handleInputChange}
                        onDateChange={handleDateChange}
                    />
                )}

                {createStep === 1 && (
                    <CreateCategoriesStep
                        categorie={categorieDraft}
                        onFieldChange={setCategoriaField}
                        onAdd={addCategoria}
                        onRemove={removeCategoria}
                        canChangeCount={props.mode === 'create' || props.mode === 'edit'}
                    />
                )}

                {createStep === 2 && (
                    <View style={styles.sectionHeaderRow}>
                        <InterText style={styles.sectionTitle}>
                            Conferma {props.mode === 'create' ? 'creazione' : 'modifica'}:
                        </InterText>
                        <InterText style={styles.helperText}>
                            {props.mode === 'create'
                                ? 'Sei sicuro di voler creare questo torneo?'
                                : 'Sei sicuro di voler applicare queste modifiche?'}
                        </InterText>
                        <View style={styles.formCol}></View>
                    </View>
                )}

                <View style={[styles.dynamicRow, { marginTop: 12 }]}>
                    {createStep > 0 ? (
                        <FormButton
                            type={'secondary'}
                            label={'Indietro'}
                            onPress={handlePrevCreateStep}
                            icon={ArrowLeftIcon}
                        />
                    ) : props.mode !== 'view' ? (
                        <FormButton
                            type={'destructive'}
                            label={'Annulla'}
                            onPress={handleCancelForm}
                            icon={ArrowLeftIcon}
                        />
                    ) : (
                        <>
                            <FormButton
                                type={'destructive'}
                                label={'Torna indietro'}
                                onPress={handleClose}
                                icon={ArrowLeftIcon}
                            />
                            <Link
                                key={form.id}
                                href={`/tornei/modal?mode=edit&torneoId=${form.id}`}
                                asChild>
                                <FormButton label={'Modifica'} icon={SquarePenIcon} />
                            </Link>
                        </>
                    )}

                    {createStep < 2 ? (
                        <FormButton
                            label={'Avanti'}
                            onPress={handleNextCreateStep}
                            icon={ArrowRightIcon}
                        />
                    ) : props.mode !== 'view' ? (
                        <FormButton
                            label={props.mode === 'create' ? 'Crea torneo' : 'Salva modifiche'}
                            onPress={handleSubmit}
                            icon={SaveIcon}
                            disabled={submitting}
                        />
                    ) : null}
                </View>
            </View>
        </ScrollView>
    );
}

function CreateStepHeader({ currentStep, steps }: { currentStep: number; steps: string[] }) {
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

function FormDatiTorneo({
    mode,
    form,
    campi,
    onInputChange,
    onDateChange,
}: {
    mode: TorneoModalMode;
    form: datiTorneo;
    campi: listaCampiType[];
    onInputChange: (key: keyof datiTorneo, value: string) => void;
    onDateChange: (key: keyof datiTorneo, value: Date | null) => void;
}) {
    const readonly = mode === 'view';

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
                <InterText style={styles.sectionTitle}>Dati principali:</InterText>
                <InterText style={styles.helperText}>
                    Dati principali del torneo. Il nome è un campo obbligatorio.
                </InterText>
            </View>

            <View style={styles.formCol}>
                <TextInputField
                    label={'Nome torneo'}
                    readonly={readonly}
                    value={form.nome}
                    onChange={(val) => onInputChange('nome', val)}
                    placeholder={'es: 4° Edizione - 2025/2026'}
                    required={true}
                />

                <TextInputField
                    label={'Descrizione'}
                    readonly={readonly}
                    value={form.descrizione}
                    onChange={(val) => onInputChange('descrizione', val)}
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
                            readonly={readonly}
                            value={form.dataInizio}
                            onChange={(val) => onDateChange('dataInizio', val)}
                        />
                    </View>
                    <View style={styles.flexChild}>
                        <DateTimePickerField
                            mode={'date'}
                            label="Data di fine"
                            readonly={readonly}
                            value={form.dataFine}
                            onChange={(val) => onDateChange('dataFine', val)}
                        />
                    </View>
                </View>

                <ChipPickerField
                    label="Campo svolgimento"
                    readonly={readonly}
                    options={campi}
                    selectedId={form.idCampo}
                    getId={(campo) => campo.id.toString()}
                    getValue={(campo) => campo.nome}
                    onSelect={(campo) => onInputChange('idCampo', String(campo.id))}
                />
            </View>
        </View>
    );
}

function CreateCategoriesStep({
    categorie,
    onFieldChange,
    onAdd,
    onRemove,
    canChangeCount = true,
}: {
    categorie: CategoriaType[];
    onFieldChange: (
        draftId: string,
        key: keyof Omit<CategoriaType, 'tempId'>,
        value: string
    ) => void;
    onAdd: () => void;
    onRemove: (draftId: string) => void;
    canChangeCount?: boolean;
}) {
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
                <InterText style={styles.sectionTitle}>Dati categorie:</InterText>
                <InterText style={styles.helperText}>
                    Ogni edizione del torneo deve avere almeno una categoria principale. Ogni
                    categoria può avere al massimo 16 gironi (dalla A alla R). Le fasi partite
                    devono essere divise da una virgola.
                </InterText>
            </View>

            <View style={styles.formCol}>
                {categorie.map((categoria, index) => (
                    <View key={categoria.tempId} style={styles.subCard}>
                        <View style={styles.subCardHeader}>
                            <InterText style={styles.subCardTitle}>Categoria {index + 1}</InterText>
                            {canChangeCount && categorie.length > 1 && (
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={() => onRemove(categoria.tempId)}
                                    activeOpacity={0.8}>
                                    <Trash2Icon size={16} color="#7c3f3f" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <TextInputField
                            label="Nome categoria"
                            value={categoria.nome}
                            onChange={(value) => onFieldChange(categoria.tempId, 'nome', value)}
                            placeholder="Tesserati, Amatori..."
                        />

                        <View style={styles.formRow}>
                            <View style={styles.flexChild}>
                                <TextInputField
                                    label="Numero gironi"
                                    value={categoria.numGironi}
                                    onChange={(value) =>
                                        onFieldChange(categoria.tempId, 'numGironi', value)
                                    }
                                    placeholder="2"
                                    inputMode="numeric"
                                />
                            </View>
                            <View style={styles.flexChild}>
                                <TextInputField
                                    label="Durata partita"
                                    value={categoria.durataPartita}
                                    onChange={(value) =>
                                        onFieldChange(categoria.tempId, 'durataPartita', value)
                                    }
                                    placeholder="25"
                                    inputMode="numeric"
                                />
                            </View>
                        </View>

                        <TextInputField
                            label="Fasi partite"
                            value={categoria.fasiPartite}
                            onChange={(value) =>
                                onFieldChange(categoria.tempId, 'fasiPartite', value)
                            }
                            placeholder="es: Fase a gironi, Semifinale, Finale"
                            tooltip="Separa le fasi con una virgola."
                            multiline={true}
                        />
                    </View>
                ))}

                {canChangeCount && (
                    <TouchableOpacity
                        style={styles.outlineButton}
                        onPress={onAdd}
                        activeOpacity={0.85}>
                        <PlusIcon size={16} color="#0f172a" />
                        <InterText style={styles.outlineButtonText}>Aggiungi categoria</InterText>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        padding: 16,
        paddingBottom: 128,
    },
    section: {
        gap: 14,
    },
    sectionHeaderRow: {
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
        lineHeight: 18,
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
    formCol: {
        gap: 12,
        paddingVertical: 10,
        marginBottom: 20,
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
