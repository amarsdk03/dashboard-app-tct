import { useState } from 'react';
import { Alert, Image, ImageBackground, Modal, Pressable, StyleSheet, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { InterText } from '@/components/generic/InterText';
import { Eye, EyeOff, XIcon } from 'lucide-react-native';
import { Input } from '@/components/ui/input';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    function printError(error: Error) {
        const capitalizedMessage = error.message.charAt(0).toUpperCase() + error.message.slice(1);

        console.error('Errore:', capitalizedMessage);
        Alert.alert('Errore durante il login', capitalizedMessage);
    }

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        if (error) printError(error);
        setLoading(false);
    }

    return (
        <View className="flex-1 bg-[#8e8171]">
            <ImageBackground
                source={require('@/assets/images/background-login.png')}
                className="flex-1 items-center justify-between"
                resizeMode="cover"
                style={{ backgroundColor: '#8e8171' }}>
                {/* ── Main form ── */}
                <View className="mt-24 w-96 justify-center px-8">
                    <View className="mb-10 items-center">
                        <Image
                            source={require('@/assets/images/logo.png')}
                            style={{ width: 180, height: 180 }}
                            resizeMode="contain"
                        />
                        <InterText className="text-3xl font-bold text-white">
                            Dashboard Torneo
                        </InterText>
                    </View>

                    <View className="gap-4">
                        <Input
                            onChangeText={(text) => setEmail(text)}
                            value={email}
                            placeholder="Indirizzo email"
                            placeholderTextColor="rgba(255, 255, 255, 0.8)"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            style={[styles.input]}
                            className="h-12 rounded-2xl border-white bg-black/40 text-white"
                        />

                        <View className="relative justify-center">
                            <Input
                                onChangeText={(text) => setPassword(text)}
                                value={password}
                                secureTextEntry={!showPassword}
                                placeholder="Password"
                                placeholderTextColor="rgba(255, 255, 255, 0.8)"
                                autoCapitalize="none"
                                keyboardType="visible-password"
                                style={[styles.input]}
                                className="h-12 rounded-2xl border-white bg-black/40 text-white"
                            />
                            <Pressable
                                className="absolute right-2 p-1"
                                onPress={() => setShowPassword(!showPassword)}>
                                {showPassword ? (
                                    <EyeOff color="#ffffff" size={24} />
                                ) : (
                                    <Eye color="#ffffff" size={24} />
                                )}
                            </Pressable>
                        </View>
                    </View>

                    <View className="mt-8">
                        <Button
                            onPress={signInWithEmail}
                            disabled={loading}
                            style={[styles.loginButton]}
                            className="h-12 rounded-2xl bg-[#b98e6b]">
                            <InterText className="text-lg font-bold text-white">
                                {loading ? 'Accesso in corso...' : 'Accedi'}
                            </InterText>
                        </Button>
                    </View>
                </View>

                {/* ── Help trigger ── */}
                <Pressable style={styles.helpTrigger} onPress={() => setShowHelp(true)}>
                    <InterText style={styles.helpTriggerText}>Problemi di accesso?</InterText>
                </Pressable>

                {/* ── Help modal ── */}
                <Modal
                    visible={showHelp}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowHelp(false)}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setShowHelp(false)}>
                        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <View style={styles.modalHeader}>
                                <View style={styles.modalTitleGroup}>
                                    <InterText style={styles.modalTitle}>
                                        Problemi di accesso?
                                    </InterText>
                                    <InterText style={styles.modalSubtitle}>
                                        In caso di ulteriori problemi, contatta uno sviluppatore per
                                        assistenza!
                                    </InterText>
                                </View>
                                <Pressable
                                    style={styles.closeButton}
                                    onPress={() => setShowHelp(false)}>
                                    <XIcon size={18} color="#64748b" />
                                </Pressable>
                            </View>

                            <View style={styles.modalDivider} />

                            {/* Items */}
                            <View style={styles.modalBody}>
                                <HelpItem
                                    number="1"
                                    title="Email/password errata"
                                    body="Controlla che l'indirizzo email sia scritto correttamente: inoltre, le password sono sensibili alle maiuscole."
                                />
                                <View style={styles.itemDivider} />
                                <HelpItem
                                    number="2"
                                    title="Password dimenticata"
                                    body="Non è possibile effettuare il reset in autonomia: contatta uno degli sviluppatori per il reset della password."
                                />
                                <View style={styles.itemDivider} />
                                <HelpItem
                                    number="3"
                                    title="Account non ancora creato"
                                    body="L'accesso è riservato solo allo staff autorizzato: se non hai ancora un account, contattaci!"
                                />
                            </View>

                            <View style={styles.modalDivider} />

                            {/* Footer */}
                            <Pressable
                                style={styles.modalCloseFooter}
                                onPress={() => setShowHelp(false)}>
                                <InterText style={styles.modalCloseFooterText}>Chiudi</InterText>
                            </Pressable>
                        </Pressable>
                    </Pressable>
                </Modal>
            </ImageBackground>
        </View>
    );
}

function HelpItem({ number, title, body }: { number: string; title: string; body: string }) {
    return (
        <View style={styles.helpItem}>
            <View style={styles.helpNumber}>
                <InterText style={styles.helpNumberText}>{number}</InterText>
            </View>
            <View style={styles.helpItemContent}>
                <InterText style={styles.helpItemTitle}>{title}</InterText>
                <InterText style={styles.helpItemBody}>{body}</InterText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 20,
        paddingHorizontal: 12,
    },
    loginButton: {
        borderRadius: 16,
        height: 48,
    },

    // Help trigger
    helpTrigger: {
        marginBottom: 48,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 999,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    helpTriggerText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        fontWeight: '600',
    },

    // Modal backdrop
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },

    // Modal card
    modalCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: 20,
        gap: 12,
    },
    modalTitleGroup: {
        flex: 1,
        gap: 2,
    },
    modalTitle: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 17,
        fontWeight: '700',
    },
    modalSubtitle: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 13,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 999,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
    },
    modalBody: {
        padding: 20,
        gap: 14,
    },
    itemDivider: {
        height: 1,
        backgroundColor: '#f8fafc',
    },

    // Footer close button
    modalCloseFooter: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    modalCloseFooterText: {
        color: '#b98e6b',
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        fontWeight: '600',
    },

    // Help items
    helpItem: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    helpNumber: {
        width: 22,
        height: 22,
        borderRadius: 999,
        backgroundColor: '#b98e6b',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
        flexShrink: 0,
    },
    helpNumberText: {
        color: '#ffffff',
        fontFamily: 'Inter-SemiBold',
        fontSize: 11,
        fontWeight: '600',
    },
    helpItemContent: {
        flex: 1,
        gap: 3,
    },
    helpItemTitle: {
        color: '#0f172a',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        fontWeight: '600',
    },
    helpItemBody: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 12,
        lineHeight: 18,
    },
});
