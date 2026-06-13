import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Constants from 'expo-constants';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    BellIcon,
    ChevronRightIcon,
    ClockIcon,
    InfoIcon,
    InstagramIcon,
    LogOutIcon,
    MailIcon,
    ShieldCheckIcon,
    UserRoundIcon,
} from 'lucide-react-native';
import { InterText } from '@/components/InterText';
import { useAuthContext } from '@/hooks/use-auth-context';
import { supabase } from '@/lib/supabase';

type AccountSession = {
    email: string | null;
    lastSignInAt: string | null;
};

type DetailRowProps = {
    icon: ReactNode;
    label: string;
    value: string;
};

type ContactRowProps = {
    icon: ReactNode;
    label: string;
    value: string;
    onPress: () => void;
};

function getStringField(source: any, keys: string[]) {
    for (const key of keys) {
        const value = source?.[key];
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim();
        }
    }

    return null;
}

function formatDateTime(value: string | null) {
    if (!value) return 'Non disponibile';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Non disponibile';

    return new Intl.DateTimeFormat('it-IT', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

function getNotificationStatus() {
    if (Platform.OS === 'web') {
        const notificationApi = (globalThis as any).Notification;
        if (!notificationApi?.permission) {
            return {
                title: 'Permesso non configurato',
                description: 'Il browser non espone lo stato dei permessi per questa sessione.',
            };
        }

        const permissionLabels: Record<string, string> = {
            default: 'Non richiesto',
            granted: 'Consentito',
            denied: 'Negato',
        };

        return {
            title: permissionLabels[notificationApi.permission] ?? notificationApi.permission,
            description: 'Stato letto dal permesso notifiche del browser.',
        };
    }

    return {
        title: 'Non configurate',
        description: 'Questa build non include una API notifiche push dedicata.',
    };
}

function DetailRow({ icon, label, value }: DetailRowProps) {
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailIcon}>{icon}</View>
            <View style={styles.detailTextBlock}>
                <InterText style={styles.detailLabel}>{label}</InterText>
                <InterText style={styles.detailValue} numberOfLines={2}>
                    {value}
                </InterText>
            </View>
        </View>
    );
}

function ContactRow({ icon, label, value, onPress }: ContactRowProps) {
    return (
        <TouchableOpacity style={styles.contactRow} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.detailIcon}>{icon}</View>
            <View style={styles.detailTextBlock}>
                <InterText style={styles.detailLabel}>{label}</InterText>
                <InterText style={styles.detailValue} numberOfLines={1}>
                    {value}
                </InterText>
            </View>
            <ChevronRightIcon size={18} color="#94a3b8" />
        </TouchableOpacity>
    );
}

export default function ImpostazioniScreen() {
    const { claims, profile } = useAuthContext();
    const [session, setSession] = useState<AccountSession>({
        email: null,
        lastSignInAt: null,
    });
    const [isSigningOut, setIsSigningOut] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function loadUser() {
            const { data, error } = await supabase.auth.getUser();
            if (!isMounted) return;

            if (error) {
                setSession({
                    email: typeof claims?.email === 'string' ? claims.email : null,
                    lastSignInAt: null,
                });
                return;
            }

            setSession({
                email: data.user?.email ?? (typeof claims?.email === 'string' ? claims.email : null),
                lastSignInAt: data.user?.last_sign_in_at ?? null,
            });
        }

        loadUser().then(() => null);

        return () => {
            isMounted = false;
        };
    }, [claims?.email]);

    const adminName = useMemo(() => {
        const fullName = [profile?.nome, profile?.cognome].filter(Boolean).join(' ');
        const metadataName = getStringField(claims?.user_metadata, ['full_name', 'name', 'nome']);

        return (
            getStringField(profile, ['full_name', 'name', 'nominativo']) ??
            (fullName.length > 0 ? fullName : null) ??
            getStringField(claims, ['full_name', 'name', 'nome']) ??
            metadataName ??
            session.email?.split('@')[0] ??
            'Admin'
        );
    }, [claims?.user_metadata, profile, session.email]);

    const adminRole = useMemo(() => {
        return (
            getStringField(profile, ['ruolo', 'role']) ??
            getStringField(claims?.app_metadata, ['ruolo', 'role']) ??
            getStringField(claims?.user_metadata, ['ruolo', 'role']) ??
            getStringField(claims, ['role', 'ruolo']) ??
            'Amministratore'
        );
    }, [claims, profile]);

    const notificationStatus = useMemo(() => getNotificationStatus(), []);
    const appName = Constants.expoConfig?.name ?? 'dashboard-cdt';
    const appVersion = Constants.expoConfig?.version ?? '1.0.0';

    async function openExternalUrl(url: string) {
        try {
            const canOpen = await Linking.canOpenURL(url);
            if (!canOpen) {
                Alert.alert('Link non disponibile', 'Non riesco ad aprire questo contatto dal dispositivo.');
                return;
            }

            await Linking.openURL(url);
        } catch {
            Alert.alert('Link non disponibile', 'Non riesco ad aprire questo contatto dal dispositivo.');
        }
    }

    async function handleLogout() {
        setIsSigningOut(true);

        const { error } = await supabase.auth.signOut();

        if (error) {
            Alert.alert('Errore durante il logout', error.message);
            setIsSigningOut(false);
        }
    }

    return (
        <View style={styles.screen}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <InterText style={styles.eyebrow}>Area amministratore</InterText>
                    <InterText style={styles.title}>Impostazioni</InterText>
                    <InterText style={styles.subtitle}>
                        Account, notifiche e riferimenti utili per la gestione del torneo.
                    </InterText>
                </View>

                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}>
                            <UserRoundIcon size={21} color="#b3642c" />
                        </View>
                        <View style={styles.sectionTextBlock}>
                            <InterText style={styles.sectionTitle}>Account</InterText>
                            <InterText style={styles.sectionSubtitle}>Sessione Supabase attiva</InterText>
                        </View>
                    </View>

                    <View style={styles.detailList}>
                        <DetailRow
                            icon={<ShieldCheckIcon size={18} color="#0f172a" />}
                            label="Nome"
                            value={adminName}
                        />
                        <DetailRow
                            icon={<UserRoundIcon size={18} color="#0f172a" />}
                            label="Ruolo"
                            value={adminRole}
                        />
                        <DetailRow
                            icon={<MailIcon size={18} color="#0f172a" />}
                            label="Email"
                            value={session.email ?? 'Non disponibile'}
                        />
                        <DetailRow
                            icon={<ClockIcon size={18} color="#0f172a" />}
                            label="Ultimo login"
                            value={formatDateTime(session.lastSignInAt)}
                        />
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}>
                            <BellIcon size={21} color="#b3642c" />
                        </View>
                        <View style={styles.sectionTextBlock}>
                            <InterText style={styles.sectionTitle}>Notifiche</InterText>
                            <InterText style={styles.sectionSubtitle}>
                                {notificationStatus.description}
                            </InterText>
                        </View>
                    </View>

                    <View style={styles.statusPill}>
                        <View style={styles.statusDot} />
                        <InterText style={styles.statusText}>{notificationStatus.title}</InterText>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}>
                            <InfoIcon size={21} color="#b3642c" />
                        </View>
                        <View style={styles.sectionTextBlock}>
                            <InterText style={styles.sectionTitle}>Applicazione</InterText>
                            <InterText style={styles.sectionSubtitle}>
                                Torneo Citta di Trento dashboard
                            </InterText>
                        </View>
                    </View>

                    <View style={styles.detailList}>
                        <DetailRow
                            icon={<InfoIcon size={18} color="#0f172a" />}
                            label="Nome app"
                            value={appName}
                        />
                        <DetailRow
                            icon={<InfoIcon size={18} color="#0f172a" />}
                            label="Versione"
                            value={appVersion}
                        />
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}>
                            <MailIcon size={21} color="#b3642c" />
                        </View>
                        <View style={styles.sectionTextBlock}>
                            <InterText style={styles.sectionTitle}>Contatti utili</InterText>
                            <InterText style={styles.sectionSubtitle}>
                                Supporto tecnico e organizzazione torneo
                            </InterText>
                        </View>
                    </View>

                    <View style={styles.contactList}>
                        <ContactRow
                            icon={<MailIcon size={18} color="#0f172a" />}
                            label="Supporto tecnico"
                            value="amarsdk03@gmail.com"
                            onPress={() => openExternalUrl('mailto:amarsdk03@gmail.com')}
                        />
                        <ContactRow
                            icon={<MailIcon size={18} color="#0f172a" />}
                            label="Supporto tecnico"
                            value="alessandrogremes04@gmail.com"
                            onPress={() => openExternalUrl('mailto:alessandrogremes04@gmail.com')}
                        />
                        <ContactRow
                            icon={<InstagramIcon size={18} color="#0f172a" />}
                            label="Organizzazione"
                            value="@torneocittaditrento"
                            onPress={() => openExternalUrl('https://www.instagram.com/torneocittaditrento/')}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.logoutButton, isSigningOut && styles.logoutButtonDisabled]}
                    onPress={handleLogout}
                    activeOpacity={0.85}
                    disabled={isSigningOut}>
                    {isSigningOut ? (
                        <ActivityIndicator color="#7c3f3f" />
                    ) : (
                        <LogOutIcon size={19} color="#7c3f3f" />
                    )}
                    <InterText style={styles.logoutButtonText}>
                        {isSigningOut ? 'Logout in corso...' : 'Logout'}
                    </InterText>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        padding: 20,
        paddingBottom: 44,
        gap: 16,
    },
    header: {
        gap: 4,
        paddingTop: 4,
        paddingBottom: 4,
    },
    eyebrow: {
        color: '#b3642c',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    title: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 30,
        fontWeight: '700',
        lineHeight: 38,
    },
    subtitle: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 14,
        lineHeight: 20,
    },
    card: {
        gap: 16,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        padding: 16,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sectionIcon: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: '#fff7ed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTextBlock: {
        flex: 1,
        minWidth: 0,
    },
    sectionTitle: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        fontWeight: '700',
    },
    sectionSubtitle: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 13,
        lineHeight: 19,
        marginTop: 2,
    },
    detailList: {
        gap: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    detailIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailTextBlock: {
        flex: 1,
        minWidth: 0,
    },
    detailLabel: {
        color: '#64748b',
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        fontWeight: '500',
    },
    detailValue: {
        color: '#0f172a',
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
        marginTop: 2,
    },
    statusPill: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 999,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#b3642c',
    },
    statusText: {
        color: '#0f172a',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        fontWeight: '600',
    },
    contactList: {
        gap: 4,
    },
    contactRow: {
        minHeight: 52,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoutButton: {
        minHeight: 52,
        borderRadius: 12,
        backgroundColor: '#d9a3a3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    logoutButtonDisabled: {
        opacity: 0.72,
    },
    logoutButtonText: {
        color: '#7c3f3f',
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        fontWeight: '700',
    },
});
