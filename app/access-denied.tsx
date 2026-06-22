import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ShieldAlertIcon } from 'lucide-react-native';

import { InterText } from '@/components/generic/InterText';
import { useAuthContext } from '@/hooks/use-auth-context';
import { getDeniedAccessReason } from '@/lib/auth-guards';
import { supabase } from '@/lib/supabase';

export default function AccessDeniedScreen() {
    const auth = useAuthContext();
    const reason = getDeniedAccessReason(auth) ?? 'Accesso non disponibile.';

    async function handleLogout() {
        const { error } = await supabase.auth.signOut();

        if (error) {
            Alert.alert('Errore durante il logout', error.message);
        }
    }

    return (
        <View style={styles.screen}>
            <View style={styles.card}>
                <View style={styles.iconBox}>
                    <ShieldAlertIcon size={34} color="#7c3f3f" />
                </View>
                <InterText style={styles.title}>Accesso non autorizzato</InterText>
                <InterText style={styles.description}>{reason}</InterText>
                <TouchableOpacity style={styles.button} onPress={handleLogout} activeOpacity={0.85}>
                    <InterText style={styles.buttonText}>Esci</InterText>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#f8fafc',
    },
    card: {
        width: '100%',
        maxWidth: 420,
        alignItems: 'center',
        gap: 14,
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: '#ffffff',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    iconBox: {
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 32,
        backgroundColor: '#f6e4e4',
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 22,
        color: '#0f172a',
        textAlign: 'center',
    },
    description: {
        fontFamily: 'Inter',
        fontSize: 15,
        lineHeight: 22,
        color: '#64748b',
        textAlign: 'center',
    },
    button: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#0f172a',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    buttonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: '#ffffff',
    },
});
