type PublicEnvName = 'EXPO_PUBLIC_SUPABASE_URL' | 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY';

export function readRequiredPublicEnvValue(name: PublicEnvName, value: string | undefined) {
    const trimmed = value?.trim();

    if (!trimmed) {
        throw new Error(`${name} is required. Add it to .env.local or the EAS build environment.`);
    }

    return trimmed;
}

export const supabaseEnv = {
    url: readRequiredPublicEnvValue(
        'EXPO_PUBLIC_SUPABASE_URL',
        process.env.EXPO_PUBLIC_SUPABASE_URL
    ),
    publishableKey: readRequiredPublicEnvValue(
        'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
        process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ),
};
