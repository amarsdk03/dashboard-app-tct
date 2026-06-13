import '@/global.css';

import { Stack } from 'expo-router';
import {
    useFonts,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import 'react-native-reanimated';
import { SplashScreenController } from '@/components/splash-screen-controller';
import { useAuthContext } from '@/hooks/use-auth-context';
import AuthProvider from '@/providers/auth-provider';

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary,
} from 'expo-router';

export default function Root() {
    const [loaded, error] = useFonts({
        Inter: Inter_400Regular,
        'Inter-Medium': Inter_500Medium,
        'Inter-SemiBold': Inter_600SemiBold,
        'Inter-Bold': Inter_700Bold,
    });

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return null;
    }

    // Set up the auth context and render your layout inside of it.
    return (
        <AuthProvider>
            <SplashScreenController />
            <RootNavigator />
        </AuthProvider>
    );
}

// Create a new component that can access the AuthProvider context
function RootNavigator() {
    const auth = useAuthContext();
    const shouldShowLogin = !auth.isLoading && !auth.isLoggedIn;

    if (auth.isLoading) {
        return null;
    }

    return (
        <Stack>
            <Stack.Protected guard={auth.isLoggedIn}>
                <Stack.Screen name="(app)" options={{ headerShown: false }} />
            </Stack.Protected>

            <Stack.Protected guard={shouldShowLogin}>
                <Stack.Screen name="login" options={{ headerShown: false }} />
            </Stack.Protected>
        </Stack>
    );
}
