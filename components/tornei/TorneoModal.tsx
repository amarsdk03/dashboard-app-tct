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
import { Row } from '@expo/ui';
import { InterText } from '@/components/InterText';
import DateTimePickerField from '@/components/input/DateTimePickerField';
import TextInputField from '@/components/input/TextInputField';

export type TorneoModalMode = 'view' | 'create' | 'edit';

type Props = {
    mode: TorneoModalMode;
    torneoId: number;
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

/*
* Modal per la visualizzazione, creazione o modifica dei dati di un torneo e delle sue categorie
* */
export default function TorneoModal(props: Props) {
    const slideAnim = useRef(new Animated.Value(600)).current;

    // Animazione iniziale del modal
    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
        }).start();
    }, []);

    // Animazione di uscita del modal
    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: 600,
            duration: 280,
            useNativeDriver: true,
        }).start(() => props.onClose());
    };

    const [form, setForm] = useState<datiTorneo>({
        id: props.mode !== 'create' ? props.torneoId : null,
        nome: '',
        descrizione: '',
        dataInizio: null,
        dataFine: null,
        urlLogo: '',
    });

    // Se sono in modalità visualizzazione o modifica, recupero i dati dal database
    useEffect(() => {
        if (props.mode !== 'create') {
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

    const handleDateChange = (key: keyof datiTorneo, value: Date) => {
        setForm({ ...form, [key]: value });
    };

    const handleSubmit = () => {
        console.log('Form creato correttamente:', form);
        // Handle submission logic here (e.g., API call for torneo-cdt)
    };

    return (
        <Animated.View
            style={[
                styles.animatedWrapper,
                { transform: [{ translateY: slideAnim }] },
            ]}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
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
                            placeholder={'Quota iscrizione, numero posti disponibili, modulistica...'}
                            multiline={true}
                        />

                        <Row spacing={16}>
                            <View style={styles.flexChild}>
                                <DateTimePickerField
                                    label="Data Inizio"
                                    value={form.dataInizio}
                                    onChange={(val) => handleDateChange('dataInizio', val)}
                                />
                            </View>
                            <View style={styles.flexChild}>
                                <DateTimePickerField
                                    label="Data Fine"
                                    value={form.dataFine}
                                    onChange={(val) => handleDateChange('dataFine', val)}
                                />
                            </View>
                        </Row>

                        <TextInputField
                            label={'URL Logo'}
                            value={form.urlLogo}
                            onChange={(val) => handleInputChange('urlLogo', val)}
                            placeholder={'https://example.com/logo.png'}
                        />

                        <Row spacing={16}>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonDestructive]}
                                onPress={handleClose}
                                activeOpacity={0.8}
                            >
                                <InterText style={[styles.buttonText, styles.buttonDestructiveText]}>
                                    Annulla modifiche
                                </InterText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleSubmit}
                                activeOpacity={0.8}
                            >
                                <InterText style={styles.buttonText}>Crea</InterText>
                            </TouchableOpacity>
                        </Row>
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
        padding: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
        marginTop: 4,
    },
    formCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2, // Soft shadow for Android
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    flexChild: {
        flex: 1,
    },
    button: {
        flex: 1,
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        marginTop: 12,

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