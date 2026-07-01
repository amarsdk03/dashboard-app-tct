export type MatchReminderContentInput = {
    squadraCasa: string | null;
    squadraOspite: string | null;
    fischioInizio: string | null;
};

export function getReminderDate(kickoffIso: string | null, minutesBefore: number) {
    if (!kickoffIso) return null;

    const kickoff = new Date(kickoffIso);
    if (Number.isNaN(kickoff.getTime())) return null;

    return new Date(kickoff.getTime() - minutesBefore * 60 * 1000);
}

export function buildMatchReminderNotificationContent(match: MatchReminderContentInput) {
    const home = match.squadraCasa?.trim() || 'Squad. casa';
    const away = match.squadraOspite?.trim() || 'Squad. ospite';

    return {
        title: `${home} vs ${away}`,
        body: `La partita inizia tra 15 minuti. Conferma i dati!`,
    };
}
