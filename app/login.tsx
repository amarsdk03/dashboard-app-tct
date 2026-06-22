import { useState } from 'react';
import { StyleSheet, View, ImageBackground, Image, Pressable, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { InterText } from '@/components/generic/InterText';
import { Eye, EyeOff } from 'lucide-react-native';
import { Input } from '@/components/ui/input';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    function printError(error: Error) {
        console.error('Errore:', error.message);
        Alert.alert('Errore durante il login', error.message);
    }

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            printError(error);
        }
        setLoading(false);
    }

    return (
        <View className="flex-1 bg-[#8e8171]">
            <ImageBackground
                source={require('@/assets/images/background-login.png')}
                className="flex-1 items-center"
                resizeMode="cover"
                style={{ backgroundColor: '#8e8171' }}>
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
            </ImageBackground>
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
    }
});
