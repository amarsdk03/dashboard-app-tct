import {
    filterNationalities,
    findNationality,
    formatNationalityLabel,
    getNationalityFlag,
    NATIONALITIES,
} from '@/constants/nationalities';
import {
    getConteggioPartiteTorneo,
    getAzioniPartita,
    getDatiPartita,
    getListaPartite,
    getPartiteOggi,
    getStatisticheHomeTorneo,
    azioniPartitaType,
    datiPartitaType,
    homeTorneoStatsType,
    insertPartita,
    insertPartitaPayload,
    listaPartiteType,
    partiteOggiType,
} from '@/data/partite';
import {
    getGiocatoriDisponibiliSquadra,
    giocatoriDisponibiliSquadraType,
    insertIscrizioneSquadra,
    insertIscrizioneSquadraPayload,
    insertSquadra,
    insertSquadraPayload,
    updateSquadra,
    updateSquadraPayload,
} from '@/data/squadre';

const filtered = filterNationalities('ita');
const firstName: string | undefined = filtered[0]?.name;
const exactFlag: string | null = getNationalityFlag('Italia');
const exactLabel: string | null = formatNationalityLabel('Italia');
const exactCountry = findNationality('Italia');
const listLength: number = NATIONALITIES.length;

async function assertMatchCount() {
    const count: number = await getConteggioPartiteTorneo(1);
    return count;
}

async function assertHomeContracts() {
    const today: partiteOggiType[] = await getPartiteOggi(1, new Date('2026-06-08T12:00:00'));
    const stats: homeTorneoStatsType = await getStatisticheHomeTorneo(
        1,
        new Date('2026-06-08T12:00:00')
    );

    const upcoming: number = stats.upcomingMatches;
    const goals: number = stats.goalsScored;

    return { today, upcoming, goals };
}

async function assertPartiteListFilters() {
    const filtered: listaPartiteType[] = await getListaPartite(1, {
        search: 'Pink',
        idCategoria: null,
        valGirone: null,
        upcomingOnly: true,
        now: new Date('2026-06-08T12:00:00'),
    });

    return filtered;
}

async function assertPartitaCreateContract(payload: insertPartitaPayload) {
    const created = await insertPartita(payload);
    const id: number = created.id;
    return id;
}

async function assertPartitaDetailContract() {
    const partita: datiPartitaType = await getDatiPartita(1);
    const azioni: azioniPartitaType = await getAzioniPartita(1);
    const firstActionType = azioni[0]?.a_tipo ?? null;

    return { partita, azioni, firstActionType };
}

async function assertSquadraWriteContracts(
    squadraPayload: insertSquadraPayload,
    squadraUpdate: updateSquadraPayload,
    iscrizionePayload: insertIscrizioneSquadraPayload
) {
    const created = await insertSquadra(squadraPayload);
    const updated = await updateSquadra(created.id, squadraUpdate);
    const iscrizione = await insertIscrizioneSquadra(iscrizionePayload);

    const createdId: number = created.id;
    const updatedName: string = updated.nome;
    const iscrizioneId: number = iscrizione.id;

    return { createdId, updatedName, iscrizioneId };
}

async function assertSquadraAvailablePlayersContract() {
    const giocatori: giocatoriDisponibiliSquadraType[] = await getGiocatoriDisponibiliSquadra(
        1,
        'Mario'
    );
    const firstId: number | null = giocatori[0]?.id ?? null;

    return { giocatori, firstId };
}

void firstName;
void exactFlag;
void exactLabel;
void exactCountry;
void listLength;
void assertMatchCount;
void assertHomeContracts;
void assertPartiteListFilters;
void assertPartitaCreateContract;
void assertPartitaDetailContract;
void assertSquadraWriteContracts;
void assertSquadraAvailablePlayersContract;
