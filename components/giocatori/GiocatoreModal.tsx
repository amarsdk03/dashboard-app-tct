import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Link, type Href } from 'expo-router';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    PlusIcon,
    SaveIcon,
    SquarePenIcon,
    XIcon,
} from 'lucide-react-native';
import { InterText } from '@/components/generic/InterText';
import DateTimePickerField from '@/components/input/DateTimePickerField';
import ImageInputField from '@/components/input/ImageInputField';
import TextInputField from '@/components/input/TextInputField';
import NationalitySelectField from '@/components/input/NationalitySelectField';
import errorMessage from '@/components/generic/ErrorMessage';
import {
    createGiocatoreConIscrizioni,
    deleteIscrizione,
    getDatiGiocatoreConIscrizioni,
    insertIscrizione,
    updateGiocatore,
    updateIscrizione,
} from '@/data/giocatori';
import { getListaSquadre, listaSquadreType } from '@/data/squadre';
import { getListaTornei, listaTorneiType } from '@/data/tornei';
import { Enums } from '@/types/database.types';
import GenericSelectField from '@/components/input/GenericSelectField';
import TeamSelectField from '@/components/input/TeamSelectField';
import ChipPickerField from '@/components/input/ChipPickerField';
import FormButton from '@/components/input/FormButton';
import {
    createRegistrationDraft,
    RegistrationDraft,
    validateRegistrationDrafts,
} from '@/lib/registration-utils';
import { confirmDiscardChanges } from '@/lib/confirm';

export type GiocatoreModalMode = 'view' | 'create' | 'edit';

type Props = {
    mode: GiocatoreModalMode;
    giocatoreId?: number;
    torneoId?: number;
    onClose: () => void;
};

type FormState = {
    id: number | null;
    nome: string;
    cognome: string;
    linkFoto: string;
    nazionalita: string;
    dataNascita: Date | null;
    ruoloPrincipale: Enums<'ruolo_giocatore'> | null;
    piedePrincipale: Enums<'piede_principale'> | null;
    nomeMaglia: string;
    numeroMaglia: string;
    usernameIg: string;
    isCapitano: boolean;
    registrations: RegistrationDraft[];
};

const RUOLI: Enums<'ruolo_giocatore'>[] = [
    'Tecnico',
    'Portiere',
    'Difensore',
    'Centrocampista',
    'Attaccante',
];

const PIEDI: Enums<'piede_principale'>[] = ['Destro', 'Sinistro', 'Entrambi'];

const EMPTY_FORM: FormState = {
    id: null,
    nome: '',
    cognome: '',
    linkFoto: '',
    nazionalita: '',
    dataNascita: null,
    ruoloPrincipale: null,
    piedePrincipale: null,
    nomeMaglia: '',
    numeroMaglia: '',
    usernameIg: '',
    isCapitano: false,
    registrations: [],
};

function emptyToNull(value: string) {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function dateToIso(date: Date | null) {
    return date ? date.toISOString() : null;
}

function parseDate(value: string | null) {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
}

export default function GiocatoreModal({ mode, giocatoreId, torneoId, onClose }: Props) {
    const [form, setForm] = useState<FormState>({
        ...EMPTY_FORM,
        registrations: [createRegistrationDraft({ idTorneo: torneoId ?? null })],
    });
    const [tornei, setTornei] = useState<listaTorneiType[]>([]);
    const [squadreByTorneo, setSquadreByTorneo] = useState<Record<number, listaSquadreType[]>>({});
    const [loading, setLoading] = useState(mode !== 'create');
    const [submitting, setSubmitting] = useState(false);
    const [createStep, setCreateStep] = useState<1 | 2>(1);

    const readonly = mode === 'view';
    const editHref = useMemo(() => {
        const primaryRegistration = form.registrations[0];
        return `/giocatori/modal?mode=edit&giocatoreId=${form.id ?? giocatoreId}&torneoId=${primaryRegistration?.idTorneo ?? torneoId ?? ''}` as Href;
    }, [form.id, form.registrations, giocatoreId, torneoId]);

    function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    function setRegistrationField<K extends keyof RegistrationDraft>(
        localId: string,
        key: K,
        value: RegistrationDraft[K]
    ) {
        setForm((current) => ({
            ...current,
            registrations: current.registrations.map((registration) =>
                registration.localId === localId ? { ...registration, [key]: value } : registration
            ),
        }));
    }

    function addRegistration() {
        setForm((current) => {
            const usedTournamentIds = new Set(
                current.registrations
                    .map((registration) => registration.idTorneo)
                    .filter((id): id is number => typeof id === 'number')
            );
            const nextTournament = tornei.find((torneo) => !usedTournamentIds.has(torneo.id));

            return {
                ...current,
                registrations: [
                    ...current.registrations,
                    createRegistrationDraft({ idTorneo: nextTournament?.id ?? null }),
                ],
            };
        });
    }

    function removeRegistration(localId: string) {
        setForm((current) => {
            if (current.registrations.length === 1) return current;
            return {
                ...current,
                registrations: current.registrations.filter(
                    (registration) => registration.localId !== localId
                ),
            };
        });
    }

    function confirmRemoveRegistration(registration: RegistrationDraft) {
        if (!registration.id) {
            removeRegistration(registration.localId);
            return;
        }

        Alert.alert(
            'Rimuovere iscrizione?',
            'Questa iscrizione verra eliminata dal giocatore al prossimo salvataggio.',
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: 'Rimuovi',
                    style: 'destructive',
                    onPress: () => removeRegistration(registration.localId),
                },
            ]
        );
    }

    async function loadTornei() {
        try {
            const data = await getListaTornei(null);
            const lista = data ?? [];
            setTornei(lista);
            setForm((current) => {
                if (mode !== 'create' || current.registrations[0]?.idTorneo) return current;

                const firstTorneoId = torneoId ?? lista[0]?.id ?? null;
                return {
                    ...current,
                    registrations: current.registrations.map((registration, index) =>
                        index === 0
                            ? { ...registration, idTorneo: firstTorneoId }
                            : registration
                    ),
                };
            });
        } catch (error: any) {
            errorMessage('Impossibile recuperare i tornei', error.message ?? String(error));
        }
    }

    async function loadSquadre(idTorneo: number) {
        if (squadreByTorneo[idTorneo]) return;

        try {
            const data = await getListaSquadre(null, idTorneo);
            setSquadreByTorneo((current) => ({
                ...current,
                [idTorneo]: data ?? [],
            }));
        } catch (error: any) {
            errorMessage('Impossibile recuperare le squadre', error.message ?? String(error));
        }
    }

    async function loadDati() {
        if (mode === 'create') {
            setLoading(false);
            return;
        }

        if (!giocatoreId) {
            errorMessage('Parametri mancanti', 'ID giocatore mancante');
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { giocatore, iscrizioni } = await getDatiGiocatoreConIscrizioni(giocatoreId);

            if (!giocatore) {
                errorMessage('Giocatore non trovato', `ID giocatore: ${giocatoreId}`);
                return;
            }

            const registrationDrafts =
                iscrizioni.length > 0
                    ? iscrizioni.map((iscrizione) =>
                          createRegistrationDraft({
                              localId: String(iscrizione.id),
                              id: iscrizione.id,
                              idTorneo: iscrizione.id_torneo,
                              idSquadra: iscrizione.id_squadra,
                              dettagli: iscrizione.dettagli ?? '',
                          })
                      )
                    : [createRegistrationDraft({ idTorneo: torneoId ?? null })];

            setForm({
                id: giocatore.id,
                nome: giocatore.nome ?? '',
                cognome: giocatore.cognome ?? '',
                linkFoto: giocatore.link_foto ?? '',
                nazionalita: giocatore.nazionalita ?? '',
                dataNascita: parseDate(giocatore.data_nascita),
                ruoloPrincipale: giocatore.ruolo_principale,
                piedePrincipale: giocatore.piede_principale,
                nomeMaglia: giocatore.nome_maglia ?? '',
                numeroMaglia: giocatore.numero_maglia ?? '',
                usernameIg: giocatore.username_ig ?? '',
                isCapitano: giocatore.is_capitano ?? false,
                registrations: registrationDrafts,
            });
        } catch (error: any) {
            errorMessage('Impossibile recuperare i dati', error.message ?? String(error));
        } finally {
            setLoading(false);
        }
    }

    function validatePlayerFields() {
        if (!form.nome.trim()) {
            errorMessage('Campi obbligatori mancanti', 'Il nome del giocatore è obbligatorio');
            return false;
        }

        if (!form.cognome.trim()) {
            errorMessage('Campi obbligatori mancanti', 'Il cognome del giocatore è obbligatorio');
            return false;
        }

        return true;
    }

    function validateRegistrationFields() {
        const validation = validateRegistrationDrafts(form.registrations);

        if (!validation.valid) {
            errorMessage('Iscrizioni non valide', validation.message ?? 'Controlla le iscrizioni.');
            return false;
        }

        return true;
    }

    function validateForm() {
        return validatePlayerFields() && validateRegistrationFields();
    }

    function handleNextStep() {
        if (validatePlayerFields()) {
            setCreateStep(2);
        }
    }

    function handlePrevStep() {
        setCreateStep(1);
    }

    function handleCancelForm() {
        confirmDiscardChanges(onClose);
    }

    async function handleCreateSubmit() {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            await createGiocatoreConIscrizioni({
                giocatore: {
                    nome: form.nome.trim(),
                    cognome: form.cognome.trim(),
                    link_foto: emptyToNull(form.linkFoto),
                    nazionalita: emptyToNull(form.nazionalita),
                    data_nascita: dateToIso(form.dataNascita),
                    ruolo_principale: form.ruoloPrincipale,
                    piede_principale: form.piedePrincipale,
                    nome_maglia: emptyToNull(form.nomeMaglia),
                    numero_maglia: emptyToNull(form.numeroMaglia),
                    username_ig: emptyToNull(form.usernameIg),
                    is_capitano: form.isCapitano,
                },
                iscrizioni: form.registrations.map((registration) => ({
                    id_torneo: registration.idTorneo!,
                    id_squadra: registration.idSquadra!,
                    dettagli: emptyToNull(registration.dettagli),
                })),
            });

            onClose();
        } catch (error: any) {
            errorMessage('Impossibile creare il giocatore', error.message ?? String(error));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleSubmit() {
        if (!validateForm()) return;

        if (!form.id) {
            errorMessage('Errore', 'ID giocatore mancante');
            return;
        }

        setSubmitting(true);
        try {
            await updateGiocatore(form.id, {
                nome: form.nome.trim(),
                cognome: form.cognome.trim(),
                link_foto: emptyToNull(form.linkFoto),
                nazionalita: emptyToNull(form.nazionalita),
                data_nascita: dateToIso(form.dataNascita),
                ruolo_principale: form.ruoloPrincipale,
                piede_principale: form.piedePrincipale,
                nome_maglia: emptyToNull(form.nomeMaglia),
                numero_maglia: emptyToNull(form.numeroMaglia),
                username_ig: emptyToNull(form.usernameIg),
                is_capitano: form.isCapitano,
            });

            const originalIds = new Set(
                (await getDatiGiocatoreConIscrizioni(form.id)).iscrizioni.map(
                    (iscrizione) => iscrizione.id
                )
            );
            const currentIds = new Set(
                form.registrations
                    .map((registration) => registration.id)
                    .filter((id): id is number => typeof id === 'number')
            );

            for (const originalId of originalIds) {
                if (!currentIds.has(originalId)) {
                    await deleteIscrizione(originalId);
                }
            }

            for (const registration of form.registrations) {
                const iscrizionePayload = {
                    id_giocatore: form.id,
                    id_torneo: registration.idTorneo!,
                    id_squadra: registration.idSquadra!,
                    dettagli: emptyToNull(registration.dettagli),
                };

                if (registration.id) {
                    await updateIscrizione(registration.id, iscrizionePayload);
                } else {
                    await insertIscrizione(iscrizionePayload);
                }
            }

            onClose();
        } catch (error: any) {
            errorMessage('Impossibile salvare i dati', error.message ?? String(error));
        } finally {
            setSubmitting(false);
        }
    }

    useEffect(() => {
        loadTornei().then(() => null);
    }, []);

    useEffect(() => {
        loadDati().then(() => null);
    }, [mode, giocatoreId, torneoId]);

    useEffect(() => {
        const torneoIds = Array.from(
            new Set(
                form.registrations
                    .map((registration) => registration.idTorneo)
                    .filter((id): id is number => typeof id === 'number')
            )
        );

        torneoIds.forEach((idTorneo) => {
            loadSquadre(idTorneo).then(() => null);
        });
    }, [form.registrations]);

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
                        onPress={onClose}
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
                {mode === 'create' && (
                    <View style={styles.stepHeader}>
                        <InterText style={styles.stepText}>Step {createStep} di 2</InterText>
                        <View style={styles.stepTrack}>
                            <View style={[styles.stepDot, styles.stepDotActive]} />
                            <View
                                style={[styles.stepDot, createStep === 2 && styles.stepDotActive]}
                            />
                        </View>
                    </View>
                )}

                {(mode !== 'create' || createStep === 1) && (
                    <>
                        <InterText style={styles.sectionTitle}>Dati giocatore:</InterText>

                        <View className="hidden">
                            <ImageInputField
                                label="Foto giocatore"
                                readonly={readonly}
                                value={form.linkFoto}
                                onChange={(value) => setField('linkFoto', value)}
                                placeholder="https://example.com/foto.png"
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={styles.flexChild}>
                                <TextInputField
                                    label="Nome"
                                    readonly={readonly}
                                    value={form.nome}
                                    onChange={(value) => setField('nome', value)}
                                    placeholder="Alessandro"
                                    required={true}
                                />
                            </View>
                            <View style={styles.flexChild}>
                                <TextInputField
                                    label="Cognome"
                                    readonly={readonly}
                                    value={form.cognome}
                                    onChange={(value) => setField('cognome', value)}
                                    placeholder="Del Piero"
                                    required={true}
                                />
                            </View>
                        </View>

                        <View style={styles.inputField}>
                            <DateTimePickerField
                                mode="date"
                                label="Data di nascita"
                                readonly={readonly}
                                value={form.dataNascita}
                                onChange={(value) => setField('dataNascita', value)}
                                placeholder="Seleziona..."
                            />
                        </View>

                        <View style={styles.inputField}>
                            <NationalitySelectField
                                value={form.nazionalita}
                                onChange={(value) => setField('nazionalita', value)}
                                readonly={readonly}
                            />
                        </View>

                        <View style={styles.inputField} />

                        <View style={styles.inputField}>
                            <ChipPickerField
                                label="Ruolo principale"
                                readonly={readonly}
                                options={RUOLI}
                                selectedId={form.ruoloPrincipale}
                                getId={(ruolo) => ruolo}
                                getValue={(ruolo) => ruolo}
                                onSelect={(value) => setField('ruoloPrincipale', value)}
                            />
                        </View>

                        <View style={styles.inputField}>
                            <ChipPickerField
                                label="Piede principale"
                                readonly={readonly}
                                options={PIEDI}
                                selectedId={form.piedePrincipale}
                                getId={(piede) => piede}
                                getValue={(piede) => piede}
                                onSelect={(value) => setField('piedePrincipale', value)}
                            />
                        </View>

                        <View style={styles.inputField}>
                            <View style={styles.row}>
                                <View style={styles.flexChild}>
                                    <TextInputField
                                        label="Nome maglia"
                                        readonly={readonly}
                                        value={form.nomeMaglia}
                                        onChange={(value) => setField('nomeMaglia', value)}
                                        placeholder="Del Piero"
                                    />
                                </View>
                                <View style={styles.flexChild}>
                                    <TextInputField
                                        label="Numero maglia"
                                        readonly={readonly}
                                        value={form.numeroMaglia}
                                        onChange={(value) => setField('numeroMaglia', value)}
                                        placeholder="10"
                                        inputMode="numeric"
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputField}>
                            <TextInputField
                                label="Username IG"
                                readonly={readonly}
                                value={form.usernameIg}
                                onChange={(value) => setField('usernameIg', value)}
                                placeholder="alessandrodelpiero"
                            />
                        </View>

                        <ToggleRow
                            label="Capitano/tecnico squadra?"
                            readonly={readonly}
                            value={form.isCapitano}
                            onChange={(value) => setField('isCapitano', value)}
                        />
                    </>
                )}

                {(mode !== 'create' || createStep === 2) && (
                    <>
                        <View style={styles.separator} />
                        <InterText style={styles.sectionTitle}>Storico carriera:</InterText>

                        <View style={styles.registrationList}>
                            {form.registrations.map((registration, index) => {
                                const squadre = registration.idTorneo
                                    ? (squadreByTorneo[registration.idTorneo] ?? [])
                                    : [];

                                return (
                                    <View key={registration.localId} style={styles.registrationCard}>
                                        <View style={styles.registrationHeader}>
                                            <InterText style={styles.registrationTitle}>
                                                Iscrizione {index + 1}
                                            </InterText>
                                            {!readonly && form.registrations.length > 1 && (
                                                <TouchableOpacity
                                                    style={styles.removeRegistrationButton}
                                                    onPress={() =>
                                                        confirmRemoveRegistration(registration)
                                                    }
                                                    activeOpacity={0.82}>
                                                    <XIcon size={15} color="#7c3f3f" />
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <GenericSelectField
                                            label="Torneo"
                                            placeholder="Seleziona torneo"
                                            enableNullValue={false}
                                            value={
                                                registration.idTorneo
                                                    ? registration.idTorneo.toString()
                                                    : ''
                                            }
                                            options={tornei.map((torneo) => ({
                                                id: String(torneo.id),
                                                name: torneo.nome,
                                            }))}
                                            onChange={(val) => {
                                                const idTorneo = Number.parseInt(val);
                                                setRegistrationField(
                                                    registration.localId,
                                                    'idTorneo',
                                                    idTorneo
                                                );
                                                setRegistrationField(
                                                    registration.localId,
                                                    'idSquadra',
                                                    null
                                                );
                                                loadSquadre(idTorneo).then(() => null);
                                            }}
                                            readonly={readonly}
                                            required={true}
                                        />

                                        <TeamSelectField
                                            label="Squadra"
                                            enableNullValue={false}
                                            value={
                                                registration.idSquadra
                                                    ? String(registration.idSquadra)
                                                    : ''
                                            }
                                            teams={squadre.map((s) => ({
                                                id: String(s.s_id),
                                                name: s.s_nome ?? 'Squadra senza nome',
                                                logoUrl: s.s_link_stemma ?? undefined,
                                            }))}
                                            onChange={(val) => {
                                                setRegistrationField(
                                                    registration.localId,
                                                    'idSquadra',
                                                    val ? Number.parseInt(val) : null
                                                );
                                            }}
                                            readonly={readonly}
                                            required={true}
                                        />

                                        <TextInputField
                                            label="Dettagli"
                                            readonly={readonly}
                                            value={registration.dettagli}
                                            onChange={(value) =>
                                                setRegistrationField(
                                                    registration.localId,
                                                    'dettagli',
                                                    value
                                                )
                                            }
                                            placeholder="Note iscrizione..."
                                            multiline
                                        />
                                    </View>
                                );
                            })}
                        </View>

                        {!readonly && (
                            <TouchableOpacity
                                style={styles.addRegistrationButton}
                                onPress={addRegistration}
                                activeOpacity={0.85}>
                                <PlusIcon size={16} color="#0f172a" />
                                <InterText style={styles.addRegistrationText}>
                                    Aggiungi iscrizione
                                </InterText>
                            </TouchableOpacity>
                        )}
                    </>
                )}

                <View style={[styles.dynamicRow, { marginTop: 12 }]}>
                    {mode === 'create' ? (
                        <>
                            {createStep === 1 ? (
                                <FormButton
                                    type={'destructive'}
                                    label={'Annulla'}
                                    onPress={handleCancelForm}
                                    icon={ArrowLeftIcon}
                                />
                            ) : (
                                <FormButton
                                    type={'secondary'}
                                    label={'Indietro'}
                                    onPress={handlePrevStep}
                                    icon={ArrowLeftIcon}
                                />
                            )}

                            {createStep === 1 ? (
                                <FormButton
                                    label={'Avanti'}
                                    onPress={handleNextStep}
                                    icon={ArrowRightIcon}
                                />
                            ) : (
                                <FormButton
                                    label={'Crea giocatore'}
                                    onPress={handleCreateSubmit}
                                    icon={SaveIcon}
                                    disabled={submitting}
                                />
                            )}
                        </>
                    ) : mode === 'edit' ? (
                        <FormButton
                            type={'destructive'}
                            label={'Annulla'}
                            onPress={handleCancelForm}
                            icon={ArrowLeftIcon}
                        />
                    ) : (
                        <>
                            <FormButton
                                type={'secondary'}
                                label={'Indietro'}
                                onPress={onClose}
                                icon={ArrowLeftIcon}
                            />
                            <Link href={editHref} asChild>
                                <FormButton label={'Modifica'} icon={SquarePenIcon} />
                            </Link>
                        </>
                    )}

                    {mode === 'edit' && (
                        <TouchableOpacity
                            style={[styles.button, submitting && { opacity: 0.6 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                            activeOpacity={0.8}>
                            <SaveIcon size={16} color="#fff" />
                            <InterText style={styles.buttonText}>Salva modifiche</InterText>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

type ToggleRowProps = {
    label: string;
    readonly: boolean;
    value: boolean;
    onChange: (value: boolean) => void;
};

function ToggleRow({ label, readonly, value, onChange }: ToggleRowProps) {
    return (
        <View style={styles.toggleRow}>
            <InterText style={styles.label}>{label}</InterText>
            <TouchableOpacity
                disabled={readonly}
                style={[styles.toggle, value && styles.toggleActive, readonly && styles.readonlyChip]}
                onPress={() => onChange(!value)}
                activeOpacity={0.85}>
                <InterText style={[styles.toggleText, value && styles.toggleTextActive]}>
                    {value ? 'Sì' : 'No'}
                </InterText>
            </TouchableOpacity>
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
    sectionTitle: {
        color: '#111111',
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Inter-Bold',
        marginBottom: 16,
    },
    stepHeader: {
        marginBottom: 18,
        gap: 8,
    },
    stepText: {
        color: '#6b7280',
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    stepTrack: {
        flexDirection: 'row',
        gap: 8,
    },
    stepDot: {
        flex: 1,
        height: 4,
        borderRadius: 999,
        backgroundColor: '#e5e7eb',
    },
    stepDotActive: {
        backgroundColor: '#0f172a',
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
    inputField: {
        marginVertical: 5,
    },
    flexChild: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 20,
        width: '100%',
        gap: 8,
    },
    registrationList: {
        gap: 12,
    },
    registrationCard: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: '#ffffff',
        padding: 14,
        gap: 4,
    },
    registrationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        gap: 10,
    },
    registrationTitle: {
        color: '#0f172a',
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        fontWeight: '600',
    },
    removeRegistrationButton: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#d9a3a3',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addRegistrationButton: {
        minHeight: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    addRegistrationText: {
        color: '#0f172a',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        fontWeight: '600',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111111',
        marginBottom: 4,
    },
    picker: {
        color: '#0f172a',
        backgroundColor: 'transparent',
        padding: Platform.OS === 'web' ? 10 : 0,
    },
    pickerItem: {
        fontSize: 13,
        fontFamily: 'Inter',
        color: '#0f172a',
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
        backgroundColor: '#f8fafc',
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    chipActive: {
        borderColor: '#0f172a',
        backgroundColor: '#0f172a',
    },
    readonlyChip: {
        opacity: 0.8,
    },
    chipText: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    chipTextActive: {
        color: '#ffffff',
    },
    readonlyValue: {
        color: '#737373',
        fontSize: 13,
        fontFamily: 'Inter',
    },
    emptyOptions: {
        color: '#737373',
        fontSize: 13,
        fontFamily: 'Inter',
    },
    toggleRow: {
        marginTop: 12,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    toggle: {
        minWidth: 64,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center',
    },
    toggleActive: {
        borderColor: '#0f172a',
        backgroundColor: '#0f172a',
    },
    toggleText: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    toggleTextActive: {
        color: '#ffffff',
    },
    separator: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 18,
    },
    button: {
        flex: 1,
        width: '100%',
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 12,
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
        fontFamily: 'Inter-SemiBold',
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
});
