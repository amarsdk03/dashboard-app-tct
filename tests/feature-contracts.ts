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
    insertAzionePartita,
    insertAzionePartitaPayload,
    insertPartita,
    insertPartitaPayload,
    listaPartiteType,
    partiteOggiType,
    updateAzionePartita,
    updateAzionePartitaPayload,
    updatePartita,
    updatePartitaPayload,
    deleteAzionePartita,
} from '@/data/partite';
import {
    getGiocatoriDisponibiliSquadra,
    giocatoriDisponibiliSquadraType,
    deleteIscrizioneSquadra,
    deleteIscrizioneSquadraType,
    insertIscrizioneSquadra,
    insertIscrizioneSquadraPayload,
    insertSquadra,
    insertSquadraPayload,
    updateSquadra,
    updateSquadraPayload,
} from '@/data/squadre';
import {
    createTorneoCompleto,
    createTorneoCompletoPayload,
    getListaSquadreTorneoSetup,
    insertCategoriaTorneo,
    insertCategoriaTorneoPayload,
    listaSquadreTorneoSetupType,
} from '@/data/tornei';

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

async function assertPartitaUpdateContract(payload: updatePartitaPayload) {
    const updated = await updatePartita(1, payload);
    const id: number = updated.id;
    return id;
}

async function assertAzionePartitaWriteContracts(
    azionePayload: insertAzionePartitaPayload,
    azioneUpdate: updateAzionePartitaPayload
) {
    const created = await insertAzionePartita(azionePayload);
    const updated = await updateAzionePartita(created.id, azioneUpdate);
    const deleted = await deleteAzionePartita(updated.id);

    const createdId: number = created.id;
    const updatedType = updated.tipo;
    const deletedId: number = deleted.id;

    return { createdId, updatedType, deletedId };
}

async function assertPartitaDetailContract() {
    const partita: datiPartitaType = await getDatiPartita(1);
    const azioni: azioniPartitaType = await getAzioniPartita(1);
    const firstActionType = azioni[0]?.a_tipo ?? null;

    return { partita, azioni, firstActionType };
}

async function assertTorneoCompletoContracts(payload: createTorneoCompletoPayload) {
    const squadre: listaSquadreTorneoSetupType = await getListaSquadreTorneoSetup('Aquila');
    const categoriaPayload: insertCategoriaTorneoPayload = {
        id_torneo: 1,
        nome: 'Pulcini',
        num_gironi: 1,
        fasi_partite: ['Gironi'],
    };
    const categoria = await insertCategoriaTorneo(categoriaPayload);
    const created = await createTorneoCompleto(payload);

    const firstSquadraId: number | null = squadre[0]?.id ?? null;
    const categoriaId: number = categoria.id;
    const torneoId: number = created.torneo.id;
    const categorieCount: number = created.categorie.length;
    const partiteCount: number = created.partite.length;

    return { firstSquadraId, categoriaId, torneoId, categorieCount, partiteCount };
}

async function assertSquadraWriteContracts(
    squadraPayload: insertSquadraPayload,
    squadraUpdate: updateSquadraPayload,
    iscrizionePayload: insertIscrizioneSquadraPayload
) {
    const created = await insertSquadra(squadraPayload);
    const updated = await updateSquadra(created.id, squadraUpdate);
    const iscrizione = await insertIscrizioneSquadra(iscrizionePayload);
    const deletedIscrizione: deleteIscrizioneSquadraType = await deleteIscrizioneSquadra(
        iscrizione.id
    );

    const createdId: number = created.id;
    const updatedName: string = updated.nome;
    const iscrizioneId: number = iscrizione.id;
    const deletedIscrizioneId: number = deletedIscrizione.id;

    return { createdId, updatedName, iscrizioneId, deletedIscrizioneId };
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
void assertPartitaUpdateContract;
void assertAzionePartitaWriteContracts;
void assertPartitaDetailContract;
void assertTorneoCompletoContracts;
void assertSquadraWriteContracts;
void assertSquadraAvailablePlayersContract;
