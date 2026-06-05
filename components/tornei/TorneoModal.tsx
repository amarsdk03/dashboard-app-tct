import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    ScrollView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { getDatiTorneo, datiTorneoType, insertTorneo, updateTorneo } from '@/data/tornei';
import { InterText } from '@/components/InterText';
import DateTimePickerField from '@/components/input/DateTimePickerField';
import TextInputField from '@/components/input/TextInputField';
import { ArrowLeftIcon, SaveIcon, SquarePenIcon } from 'lucide-react-native';
import { Link } from 'expo-router';
import errorMessage from '@/components/ErrorMessage';

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

export default function TorneoModal(props: Props) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleClose = () => {
        props.onClose();
    };

    const [form, setForm] = useState<datiTorneo>({
        id: props.mode !== 'create' ? props.torneoId ?? null : null,
        nome: '',
        descrizione: '',
        dataInizio: null,
        dataFine: null,
        urlLogo: '',
    });

    useEffect(() => {
        if (props.mode === 'create' || !props.torneoId) {
            return;
        }

        setLoading(true);

        getDatiTorneo(props.torneoId)
            .then((dati: datiTorneoType) => {
                setForm({
                    id: dati.id,
                    nome: dati.nome,
                    descrizione: dati.descrizione,
                    dataInizio: dati.data_inizio ? new Date(dati.data_inizio) : null,
                    dataFine: dati.data_fine ? new Date(dati.data_fine) : null,
                    urlLogo: dati.logo_torneo ?? null,
                });
            })
            .catch((error) => {
                errorMessage('Impossibile recuperare i dati', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [props.mode, props.torneoId]);

    const handleInputChange = (key: keyof datiTorneo, value: string) => {
        setForm({ ...form, [key]: value });
    };

    const handleDateChange = (key: keyof datiTorneo, value: Date | null) => {
        if (value) {
            // Create a copy and zero out the time to keep ONLY the date
            const dateOnly = new Date(value);
            dateOnly.setHours(0, 0, 0, 0);
            setForm({ ...form, [key]: dateOnly });
        } else {
            setForm({ ...form, [key]: value });
        }
    };

    const handleSubmit = async () => {
        // Basic validation
        if (!form.nome?.trim()) {
            errorMessage('Campi obbligatori mancanti', 'Il nome del torneo è obbligatorio');
            return;
        }

        // Convert Date objects back to ISO strings for Supabase
        const payload = {
            nome: form.nome,
            descrizione: form.descrizione ?? null,
            data_inizio: form.dataInizio ? form.dataInizio.toISOString() : null,
            data_fine: form.dataFine ? form.dataFine.toISOString() : null,
            logo_torneo: form.urlLogo ?? null,
        };

        setSubmitting(true);

        try {
            if (props.mode === 'create') {
                await insertTorneo(payload);
            } else if (props.mode === 'edit') {
                if (!form.id) {
                    errorMessage('Errore', 'ID torneo mancante');
                    return;
                }
                await updateTorneo(form.id, payload);
            } else {
                errorMessage(
                    'handleSubmit(): modalità non supportata',
                    'props.mode = ' + props.mode
                );
                return;
            }

            handleClose(); // Navigate back on success
        } catch (error: any) {
            errorMessage('Impossibile salvare i dati', error);
        } finally {
            console.log('Dati aggiornati correttamente: ', payload);
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
                <TextInputField
                    label={'Nome Torneo'}
                    readonly={props.mode === 'view'}
                    value={form.nome}
                    onChange={(val) => handleInputChange('nome', val)}
                    placeholder={'4° Edizione - 2025/2026'}
                />
                <TextInputField
                    label={'Descrizione'}
                    readonly={props.mode === 'view'}
                    value={form.descrizione}
                    onChange={(val) => handleInputChange('descrizione', val)}
                    placeholder={'Quota iscrizione, numero posti disponibili, link regolamento...'}
                    multiline={true}
                />

                <View style={styles.row}>
                    <View style={styles.flexChild}>
                        <DateTimePickerField
                            mode={'date'}
                            label="Data d'inizio"
                            readonly={props.mode === 'view'}
                            value={form.dataInizio}
                            onChange={(val) => handleDateChange('dataInizio', val)}
                            placeholder="Seleziona..."
                        />
                    </View>
                    <View style={styles.flexChild}>
                        <DateTimePickerField
                            mode={'date'}
                            label="Data di fine"
                            readonly={props.mode === 'view'}
                            value={form.dataFine}
                            onChange={(val) => handleDateChange('dataFine', val)}
                            placeholder="Seleziona..."
                        />
                    </View>
                </View>

                <TextInputField
                    label={'URL Logo'}
                    readonly={props.mode === 'view'}
                    value={form.urlLogo}
                    onChange={(val) => handleInputChange('urlLogo', val)}
                    placeholder={'https://example.com/logo.png'}
                />

                <View style={[styles.dynamicRow, { marginTop: 12 }]}>
                    {props.mode !== 'view' ? (
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
                                <TouchableOpacity
                                    style={styles.button}
                                    activeOpacity={0.8}>
                                    <SquarePenIcon size={16} color="#fff" />
                                    <InterText style={styles.buttonText}>Modifica</InterText>
                                </TouchableOpacity>
                            </Link>
                        </>
                    )}

                    {props.mode !== 'view' && (
                        <TouchableOpacity
                            style={[styles.button, submitting && { opacity: 0.6 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                            activeOpacity={0.8}>
                            <SaveIcon size={16} color="#fff" />
                            <InterText style={styles.buttonText}>
                                {props.mode === 'create' ? 'Crea nuovo' : 'Salva modifiche'}
                            </InterText>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    loadingText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
        textAlign: 'center',
    },
    scrollContainer: {
        padding: 16,
        paddingBottom: 128, // NEEDED to add scrolling to bottom
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