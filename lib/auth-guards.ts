import { AuthData } from '@/hooks/use-auth-context';

const ADMIN_ROLE_VALUES = new Set([
    'admin',
    'administrator',
    'amministratore',
    'gestore',
    'manager',
    'arbitro',
    'referee',
]);

function normalizeRole(value: unknown) {
    if (typeof value !== 'string') return null;

    return value.trim().toLowerCase();
}

function isAllowedRole(value: unknown) {
    const normalized = normalizeRole(value);

    return normalized ? ADMIN_ROLE_VALUES.has(normalized) : false;
}

function getNestedValue(source: unknown, path: string[]) {
    return path.reduce<unknown>((current, key) => {
        if (!current || typeof current !== 'object') return undefined;

        return (current as Record<string, unknown>)[key];
    }, source);
}

export function isAdminAuthState(auth: Pick<AuthData, 'claims' | 'profile' | 'isLoggedIn'>) {
    if (!auth.isLoggedIn) return false;

    const roleCandidates = [
        getNestedValue(auth.claims, ['app_metadata', 'role']),
        getNestedValue(auth.claims, ['app_metadata', 'ruolo']),
        getNestedValue(auth.claims, ['user_metadata', 'role']),
        getNestedValue(auth.claims, ['user_metadata', 'ruolo']),
        getNestedValue(auth.claims, ['role']),
        getNestedValue(auth.claims, ['ruolo']),
        getNestedValue(auth.claims, ['app_role']),
        getNestedValue(auth.profile, ['role']),
        getNestedValue(auth.profile, ['ruolo']),
    ];

    return roleCandidates.some(isAllowedRole);
}

export function canAccessAdminArea(auth: Pick<AuthData, 'claims' | 'profile' | 'isLoading' | 'isLoggedIn'>) {
    if (auth.isLoading) return false;

    return isAdminAuthState(auth);
}

export function getDeniedAccessReason(
    auth: Pick<AuthData, 'claims' | 'profile' | 'isLoading' | 'isLoggedIn'>
) {
    if (auth.isLoading) return null;
    if (!auth.isLoggedIn) return 'Effettua il login per accedere alla dashboard.';
    if (!isAdminAuthState(auth)) return 'Il tuo account non ha un ruolo amministratore abilitato.';

    return null;
}
