import {
    arbitriPartitaType,
    azioniPartitaType,
    campiPartitaType,
    datiPartitaType,
    deleteAzionePartita,
    getArbitriPartita,
    getAzioniPartita,
    getCampiPartita,
    getConteggioPartiteTorneo,
    getDatiPartita,
    getGiocatoriPartita,
    getListaPartite,
    getPartiteOggi,
    getStatisticheHomeTorneo,
    giocatoriPartitaType,
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
} from '@/data/partite';
import {
    createSquadraConRoster,
    createSquadraConRosterPayload,
    deleteIscrizioneSquadra,
    deleteIscrizioneSquadraType,
    getGiocatoriDisponibiliSquadra,
    giocatoriDisponibiliSquadraType,
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
    getSetupTorneo,
    insertCategoriaTorneo,
    insertCategoriaTorneoPayload,
    listaSquadreTorneoSetupType,
    setupTorneoType,
    updateCategoriaTorneo,
    updateCategoriaTorneoPayload,
    upsertCalendarioTorneo,
    upsertCalendarioTorneoPayload,
} from '@/data/tornei';
import {
    categorieGestioneTorneoType,
    classificheTorneoType,
    getCategorieGestioneTorneo,
    getClassificheTorneo,
} from '@/data/classifiche';
import { createGiocatoreConIscrizione, createGiocatoreConIscrizionePayload, } from '@/data/giocatori';
import { canAccessAdminArea, getDeniedAccessReason, isAdminAuthState, } from '@/lib/auth-guards';
import { readRequiredPublicEnvValue } from '@/lib/env';

async function assertMatchCount() {
    return await getConteggioPartiteTorneo(1);
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

async function assertPartitaAdminContract() {
    const giocatori: giocatoriPartitaType = await getGiocatoriPartita(1);
    const campi: campiPartitaType = await getCampiPartita();
    const arbitri: arbitriPartitaType = await getArbitriPartita();

    const firstPlayerId: number | null = giocatori[0]?.id ?? null;
    const firstCampoId: number | null = campi[0]?.id ?? null;
    const firstArbitroId: number | null = arbitri[0]?.id ?? null;

    return { firstPlayerId, firstCampoId, firstArbitroId };
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

async function assertTorneoAdminContracts(
    categoriaUpdate: updateCategoriaTorneoPayload,
    calendarioPayload: upsertCalendarioTorneoPayload
) {
    const setup: setupTorneoType = await getSetupTorneo(1);
    const categoria = await updateCategoriaTorneo(1, categoriaUpdate);
    const calendario = await upsertCalendarioTorneo(1, calendarioPayload);
    const classifiche: classificheTorneoType = await getClassificheTorneo(1);
    const categorie: categorieGestioneTorneoType = await getCategorieGestioneTorneo(1);

    return {
        setupTorneoId: setup.torneo?.id ?? null,
        categoriaId: categoria.id,
        calendarioCount: calendario.length,
        classificheCount: classifiche.length,
        categorieCount: categorie.length,
    };
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

async function assertAtomicWriteContracts(
    giocatorePayload: createGiocatoreConIscrizionePayload,
    squadraPayload: createSquadraConRosterPayload
) {
    const giocatore = await createGiocatoreConIscrizione(giocatorePayload);
    const squadra = await createSquadraConRoster(squadraPayload);

    return {
        giocatoreId: giocatore.giocatore.id,
        iscrizioneId: giocatore.iscrizione.id,
        squadraId: squadra.squadra.id,
        rosterCount: squadra.iscrizioni.length,
    };
}

async function assertSquadraAvailablePlayersContract() {
    const giocatori: giocatoriDisponibiliSquadraType[] = await getGiocatoriDisponibiliSquadra(
        1,
        'Mario'
    );
    const firstId: number | null = giocatori[0]?.id ?? null;

    return { giocatori, firstId };
}

function assertAuthGuardContract() {
    const allowed: boolean = canAccessAdminArea({
        isLoading: false,
        isLoggedIn: true,
        claims: { app_role: 'admin' },
        profile: null,
    });

    const deniedReason: string | null = getDeniedAccessReason({
        isLoading: false,
        isLoggedIn: true,
        claims: null,
        profile: { ruolo: 'viewer' },
    });

    const adminState: boolean = isAdminAuthState({
        isLoggedIn: true,
        claims: { role: 'admin' },
        profile: null,
    });

    return { allowed, deniedReason, adminState };
}

function assertEnvContract() {
    const value: string = readRequiredPublicEnvValue(
        'EXPO_PUBLIC_SUPABASE_URL',
        'https://example.supabase.co'
    );

    return value;
}

void assertMatchCount;
void assertHomeContracts;
void assertPartiteListFilters;
void assertPartitaCreateContract;
void assertPartitaUpdateContract;
void assertAzionePartitaWriteContracts;
void assertPartitaDetailContract;
void assertPartitaAdminContract;
void assertTorneoCompletoContracts;
void assertTorneoAdminContracts;
void assertSquadraWriteContracts;
void assertAtomicWriteContracts;
void assertSquadraAvailablePlayersContract;
void assertAuthGuardContract;
void assertEnvContract;
