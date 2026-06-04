import React, { useEffect, useState, useRef } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Animated,
} from 'react-native';
import { getDatiTorneo, datiTorneoType } from '@/data/tornei';
import { InterText } from '@/components/InterText';
import DateTimePickerField from '@/components/input/DateTimePickerField';
import TextInputField from '@/components/input/TextInputField';

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
    const slideAnim = useRef(new Animated.Value(600)).current;

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
        }).start();
    }, []);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: 600,
            duration: 280,
            useNativeDriver: true,
        }).start(() => props.onClose());
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
        if (props.mode !== 'create' && props.torneoId) {
            getDatiTorneo(props.torneoId)
                .then((dati: datiTorneoType) => {
                    setForm({
                        id: dati.id,
                        nome: dati.nome,
                        descrizione: dati.descrizione,
                        dataInizio: dati.dataInizio,
                        dataFine: dati.dataFine,
                        urlLogo: dati.urlLogo,
                    });
                })
                .catch((error) => {
                    console.error('Errore caricamento dati:', error);
                    Alert.alert('Errore', 'Impossibile caricare i dati');
                });
        }
    }, [props.mode, props.torneoId]);

    const handleInputChange = (key: keyof datiTorneo, value: string) => {
        setForm({ ...form, [key]: value });
    };

    const handleDateChange = (key: keyof datiTorneo, value: Date | null) => {
        if (value) {
            // Create a copy and zero out the time to keep ONLY the date
            const dateOnly = new Date(value);
            dateOnly.setHours(0, 0, 0, 0);

            setForm({ ...form, [key]: value });
        } else {
            setForm({ ...form, [key]: value });
        }
    };

    const handleSubmit = () => {
        console.log('Form creato correttamente:', form);
    };

    return (
        <Animated.View style={[styles.animatedWrapper, { transform: [{ translateY: slideAnim }] }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}>
                    <View style={styles.formCard}>
                        <TextInputField
                            label={'Nome Torneo'}
                            value={form.nome}
                            onChange={(val) => handleInputChange('nome', val)}
                            placeholder={'4° Edizione - 2025/2026'}
                        />
                        <TextInputField
                            label={'Descrizione'}
                            value={form.descrizione}
                            onChange={(val) => handleInputChange('descrizione', val)}
                            placeholder={
                                'Quota iscrizione, numero posti disponibili, link regolamento...'
                            }
                            multiline={true}
                        />

                        <View style={styles.row}>
                            <View style={styles.flexChild}>
                                <DateTimePickerField
                                    mode={'date'}
                                    label="Data d'inizio"
                                    value={form.dataInizio}
                                    onChange={(val) => handleDateChange('dataInizio', val)}
                                    placeholder="Seleziona..."
                                />
                            </View>
                            <View style={styles.flexChild}>
                                <DateTimePickerField
                                    mode={'date'}
                                    label="Data di fine"
                                    value={form.dataFine}
                                    onChange={(val) => handleDateChange('dataFine', val)}
                                    placeholder="Seleziona..."
                                />
                            </View>
                        </View>

                        <TextInputField
                            label={'URL Logo'}
                            value={form.urlLogo}
                            onChange={(val) => handleInputChange('urlLogo', val)}
                            placeholder={'https://example.com/logo.png'}
                        />

                        <View style={[styles.row, { marginTop: 12 }]}>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonDestructive]}
                                onPress={handleClose}
                                activeOpacity={0.8}>
                                <InterText
                                    style={[styles.buttonText, styles.buttonDestructiveText]}>
                                    Annulla
                                </InterText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleSubmit}
                                activeOpacity={0.8}>
                                <InterText style={styles.buttonText}>Crea</InterText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    animatedWrapper: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContainer: {
        padding: 16,
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
    flexChild: {
        flex: 1,
    },
    button: {
        flex: 1,
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 12,
        alignSelf: 'center',
        alignItems: 'center',

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
});