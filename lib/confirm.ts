import { Alert } from 'react-native';

export function confirmDiscardChanges(onConfirm: () => void) {
    Alert.alert(
        'Scartare le modifiche?',
        'I dati non salvati di questa schermata verranno persi.',
        [
            { text: 'Annulla', style: 'cancel' },
            {
                text: 'Scarta',
                style: 'destructive',
                onPress: onConfirm,
            },
        ]
    );
}
