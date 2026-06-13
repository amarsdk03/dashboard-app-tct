import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { supabaseEnv } from '@/lib/env';
import { Database } from '@/types/database.types';

const isSSR = typeof window === 'undefined';

const ExpoWebSecureStoreAdapter = {
    getItem: (key: string) => {
        if (isSSR) return null;
        return AsyncStorage.getItem(key);
    },
    setItem: (key: string, value: string) => {
        if (isSSR) return;
        return AsyncStorage.setItem(key, value);
    },
    removeItem: (key: string) => {
        if (isSSR) return;
        return AsyncStorage.removeItem(key);
    },
};

export const supabase = createClient<Database>(supabaseEnv.url, supabaseEnv.publishableKey, {
    auth: {
        storage: ExpoWebSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
