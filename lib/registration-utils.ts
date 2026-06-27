export type RegistrationDraft = {
    localId: string;
    id: number | null;
    idTorneo: number | null;
    idSquadra: number | null;
    dettagli: string;
};

export type RegistrationValidationResult = {
    valid: boolean;
    message: string | null;
};

export function createRegistrationDraft(overrides: Partial<RegistrationDraft> = {}) {
    return {
        localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        id: null,
        idTorneo: null,
        idSquadra: null,
        dettagli: '',
        ...overrides,
    };
}

export function validateRegistrationDrafts(
    registrations: RegistrationDraft[]
): RegistrationValidationResult {
    if (registrations.length === 0) {
        return {
            valid: false,
            message: 'Inserisci almeno una iscrizione per il giocatore.',
        };
    }

    const tournamentIds = new Set<number>();

    for (const registration of registrations) {
        if (!registration.idTorneo || !registration.idSquadra) {
            return {
                valid: false,
                message: 'Ogni iscrizione deve avere torneo e squadra.',
            };
        }

        if (tournamentIds.has(registration.idTorneo)) {
            return {
                valid: false,
                message: 'Un giocatore non puo avere piu iscrizioni nello stesso torneo.',
            };
        }

        tournamentIds.add(registration.idTorneo);
    }

    return {
        valid: true,
        message: null,
    };
}
