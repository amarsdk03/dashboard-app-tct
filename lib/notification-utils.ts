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
    const home = match.squadraCasa?.trim() || 'Squadra casa';
    const away = match.squadraOspite?.trim() || 'Squadra ospite';

    return {
        title: 'Partita tra 15 minuti',
        body: `${home} - ${away} inizia tra 15 minuti.`,
    };
}
