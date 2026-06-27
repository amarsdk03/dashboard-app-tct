import assert from 'node:assert/strict';

import {
    validateRegistrationDrafts,
    type RegistrationDraft,
} from '../lib/registration-utils.ts';
import {
    buildMatchReminderNotificationContent,
    getReminderDate,
} from '../lib/notification-utils.ts';

const validRegistrations: RegistrationDraft[] = [
    {
        localId: '1',
        id: 10,
        idTorneo: 1,
        idSquadra: 20,
        dettagli: '',
    },
    {
        localId: '2',
        id: null,
        idTorneo: 2,
        idSquadra: 30,
        dettagli: 'Seconda edizione',
    },
];

assert.deepEqual(validateRegistrationDrafts(validRegistrations), {
    valid: true,
    message: null,
});

assert.deepEqual(validateRegistrationDrafts([]), {
    valid: false,
    message: 'Inserisci almeno una iscrizione per il giocatore.',
});

assert.deepEqual(
    validateRegistrationDrafts([
        { localId: '1', id: null, idTorneo: 1, idSquadra: 20, dettagli: '' },
        { localId: '2', id: null, idTorneo: 1, idSquadra: 30, dettagli: '' },
    ]),
    {
        valid: false,
        message: 'Un giocatore non puo avere piu iscrizioni nello stesso torneo.',
    }
);

assert.deepEqual(
    validateRegistrationDrafts([
        { localId: '1', id: null, idTorneo: 1, idSquadra: null, dettagli: '' },
    ]),
    {
        valid: false,
        message: 'Ogni iscrizione deve avere torneo e squadra.',
    }
);

assert.equal(
    getReminderDate('2026-06-27T20:30:00.000Z', 30)?.toISOString(),
    '2026-06-27T20:00:00.000Z'
);
assert.equal(getReminderDate(null, 30), null);
assert.equal(getReminderDate('not-a-date', 30), null);

assert.deepEqual(
    buildMatchReminderNotificationContent({
        squadraCasa: 'Aquila Trento',
        squadraOspite: 'Real Rovereto',
        fischioInizio: '2026-06-27T20:30:00.000Z',
    }),
    {
        title: 'Partita tra 30 minuti',
        body: 'Aquila Trento - Real Rovereto inizia tra 30 minuti.',
    }
);

console.log('refactoring-utils tests passed');
