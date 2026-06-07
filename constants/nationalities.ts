export type NationalityOption = {
    name: string;
    code: string;
    flag: string;
};

export const NATIONALITIES: NationalityOption[] = [
    { name: 'Italia', code: 'IT', flag: '🇮🇹' },
    { name: 'Albania', code: 'AL', flag: '🇦🇱' },
    { name: 'Marocco', code: 'MA', flag: '🇲🇦' },
    { name: 'Tunisia', code: 'TN', flag: '🇹🇳' },
    { name: 'Romania', code: 'RO', flag: '🇷🇴' },
    { name: 'Moldavia', code: 'MD', flag: '🇲🇩' },
    { name: 'Ucraina', code: 'UA', flag: '🇺🇦' },
    { name: 'Brasile', code: 'BR', flag: '🇧🇷' },
    { name: 'Argentina', code: 'AR', flag: '🇦🇷' },
    { name: 'Francia', code: 'FR', flag: '🇫🇷' },
    { name: 'Germania', code: 'DE', flag: '🇩🇪' },
    { name: 'Spagna', code: 'ES', flag: '🇪🇸' },
    { name: 'Senegal', code: 'SN', flag: '🇸🇳' },
    { name: 'Ghana', code: 'GH', flag: '🇬🇭' },
    { name: 'Nigeria', code: 'NG', flag: '🇳🇬' },
    { name: 'Austria', code: 'AT', flag: '🇦🇹' },
    { name: 'Belgio', code: 'BE', flag: '🇧🇪' },
    { name: 'Bosnia ed Erzegovina', code: 'BA', flag: '🇧🇦' },
    { name: 'Bulgaria', code: 'BG', flag: '🇧🇬' },
    { name: 'Camerun', code: 'CM', flag: '🇨🇲' },
    { name: 'Canada', code: 'CA', flag: '🇨🇦' },
    { name: 'Cile', code: 'CL', flag: '🇨🇱' },
    { name: 'Cina', code: 'CN', flag: '🇨🇳' },
    { name: 'Colombia', code: 'CO', flag: '🇨🇴' },
    { name: 'Costa d’Avorio', code: 'CI', flag: '🇨🇮' },
    { name: 'Croazia', code: 'HR', flag: '🇭🇷' },
    { name: 'Danimarca', code: 'DK', flag: '🇩🇰' },
    { name: 'Ecuador', code: 'EC', flag: '🇪🇨' },
    { name: 'Egitto', code: 'EG', flag: '🇪🇬' },
    { name: 'Grecia', code: 'GR', flag: '🇬🇷' },
    { name: 'India', code: 'IN', flag: '🇮🇳' },
    { name: 'Inghilterra', code: 'GB-ENG', flag: '🏴' },
    { name: 'Irlanda', code: 'IE', flag: '🇮🇪' },
    { name: 'Kosovo', code: 'XK', flag: '🇽🇰' },
    { name: 'Macedonia del Nord', code: 'MK', flag: '🇲🇰' },
    { name: 'Messico', code: 'MX', flag: '🇲🇽' },
    { name: 'Olanda', code: 'NL', flag: '🇳🇱' },
    { name: 'Perù', code: 'PE', flag: '🇵🇪' },
    { name: 'Polonia', code: 'PL', flag: '🇵🇱' },
    { name: 'Portogallo', code: 'PT', flag: '🇵🇹' },
    { name: 'Regno Unito', code: 'GB', flag: '🇬🇧' },
    { name: 'Repubblica Ceca', code: 'CZ', flag: '🇨🇿' },
    { name: 'Russia', code: 'RU', flag: '🇷🇺' },
    { name: 'Serbia', code: 'RS', flag: '🇷🇸' },
    { name: 'Slovacchia', code: 'SK', flag: '🇸🇰' },
    { name: 'Slovenia', code: 'SI', flag: '🇸🇮' },
    { name: 'Stati Uniti', code: 'US', flag: '🇺🇸' },
    { name: 'Svezia', code: 'SE', flag: '🇸🇪' },
    { name: 'Svizzera', code: 'CH', flag: '🇨🇭' },
    { name: 'Turchia', code: 'TR', flag: '🇹🇷' },
    { name: 'Uruguay', code: 'UY', flag: '🇺🇾' },
];

export function normalizeNationality(value: string) {
    return value
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[’']/g, '')
        .toLowerCase();
}

export function findNationality(value: string | null | undefined) {
    if (!value) return null;

    const normalized = normalizeNationality(value);
    if (!normalized) return null;

    return (
        NATIONALITIES.find((country) => normalizeNationality(country.name) === normalized) ??
        NATIONALITIES.find((country) => country.code.toLowerCase() === normalized) ??
        null
    );
}

export function filterNationalities(query: string, limit = 6) {
    const normalized = normalizeNationality(query);
    if (!normalized) return NATIONALITIES.slice(0, limit);

    const startsWith = NATIONALITIES.filter((country) =>
        normalizeNationality(country.name).startsWith(normalized),
    );
    const includes = NATIONALITIES.filter((country) => {
        const name = normalizeNationality(country.name);
        return !name.startsWith(normalized) && name.includes(normalized);
    });

    return [...startsWith, ...includes].slice(0, limit);
}

export function getNationalityFlag(value: string | null | undefined) {
    return findNationality(value)?.flag ?? null;
}
