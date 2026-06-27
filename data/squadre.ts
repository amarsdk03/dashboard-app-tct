import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

function dedupeSquadre<
    T extends { s_id: number | null; t_id: number | null; s_nome: string | null },
>(data: T[] | null) {
    const result: T[] = [];
    const seen = new Set<string>();

    for (const squadra of data ?? []) {
        const key = squadra.s_id
            ? `id:${squadra.s_id}`
            : `name:${squadra.t_id ?? 'none'}:${squadra.s_nome ?? 'none'}`;

        if (seen.has(key)) continue;

        seen.add(key);
        result.push(squadra);
    }

    return result;
}

async function hydrateSquadreCaptains<
    T extends {
        s_id_capitano: number | null;
        g_nome: string | null;
        g_cognome: string | null;
    },
>(squadre: T[]) {
    const captainIds = Array.from(
        new Set(
            squadre
                .map((squadra) => squadra.s_id_capitano)
                .filter((id): id is number => typeof id === 'number')
        )
    );

    if (captainIds.length === 0) {
        return squadre.map((squadra) => ({ ...squadra, g_nome: null, g_cognome: null }));
    }

    const { data, error } = await supabase
        .from('giocatore')
        .select('id, nome, cognome')
        .in('id', captainIds)
        .abortSignal(AbortSignal.timeout(20000));

    if (error) throw error;

    const captainsById = new Map((data ?? []).map((giocatore) => [giocatore.id, giocatore]));

    return squadre.map((squadra) => {
        const captain = squadra.s_id_capitano
            ? captainsById.get(squadra.s_id_capitano)
            : null;

        return {
            ...squadra,
            g_nome: captain?.nome ?? null,
            g_cognome: captain?.cognome ?? null,
        };
    });
}

export async function getListaSquadre(searchParam: string | null, idTorneo: number | null) {
    let query = supabase
        .from('ricerca_squadre')
        .select(
            `
            t_id,
            t_nome,
            s_id,
            s_nome,
            s_id_capitano,
            s_acronimo,
            s_link_stemma,
            s_colore_squadra,
            g_nome,
            g_cognome
        `
        );

    if (idTorneo) {
        query = query.eq('t_id', idTorneo);
    }

    if (searchParam && searchParam.trim().length > 0) {
        query = query.ilike('s_nome', `%${searchParam.trim()}%`);
    }

    query = query.order('s_nome', { ascending: true });

    if (idTorneo) {
        query = query.order('t_id', { ascending: false });
    }

    query = query
        .abortSignal(AbortSignal.timeout(20000));

    const { data, error } = await query;
    if (error) throw error;

    return hydrateSquadreCaptains(dedupeSquadre(data));
}

export type listaSquadreType = Awaited<ReturnType<typeof getListaSquadre>>[number];

export async function getDatiSquadra(idSquadra: number) {
    const query = supabase
        .from('squadra')
        .select(
            `
            *,
            giocatore:id_capitano(
                id,
                nome,
                cognome
            )
        `
        )
        .eq('id', idSquadra)
        .maybeSingle();

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type datiSquadraType = Awaited<ReturnType<typeof getDatiSquadra>>;

export async function getStatisticheSquadra(idSquadra: number, idTorneo?: number | null) {
    let query = supabase
        .from('azioni_partite')
        .select(`*`)
        .or(`p_id_squadra_casa.eq.${idSquadra},p_id_squadra_ospite.eq.${idSquadra}`);

    if (idTorneo) {
        query = query.eq('t_id', idTorneo);
    }

    query = query.abortSignal(AbortSignal.timeout(20000));

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type statisticheSquadraType = Awaited<ReturnType<typeof getStatisticheSquadra>>;

export async function getFormazioneSquadra(idSquadra: number, idTorneo: number) {
    const query = supabase
        .from('iscrizione')
        .select(
            `
            *,
            giocatore(
                id,
                nome,
                cognome,
                is_capitano,
                ruolo_principale,
                link_foto,
                nome_maglia,
                numero_maglia
            )
        `
        )
        .eq('id_torneo', idTorneo)
        .eq('id_squadra', idSquadra)
        .abortSignal(AbortSignal.timeout(20000));

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type formazioneSquadraType = Awaited<ReturnType<typeof getFormazioneSquadra>>;

export async function getGiocatoriDisponibiliSquadra(
    idTorneo: number,
    searchParam: string | null = null
) {
    const search = searchParam?.trim() ?? '';
    const selectFields = `
        id,
        nome,
        cognome,
        is_capitano,
        ruolo_principale,
        link_foto,
        nome_maglia,
        numero_maglia
    `;

    const iscrizioniPromise = supabase
        .from('iscrizione')
        .select('id_giocatore')
        .eq('id_torneo', idTorneo)
        .abortSignal(AbortSignal.timeout(20000));

    const giocatoriPromises =
        search.length > 0
            ? [
                  supabase
                      .from('giocatore')
                      .select(selectFields)
                      .ilike('nome', `%${search}%`)
                      .order('nome', { ascending: true })
                      .order('cognome', { ascending: true })
                      .limit(16)
                      .abortSignal(AbortSignal.timeout(20000)),
                  supabase
                      .from('giocatore')
                      .select(selectFields)
                      .ilike('cognome', `%${search}%`)
                      .order('nome', { ascending: true })
                      .order('cognome', { ascending: true })
                      .limit(16)
                      .abortSignal(AbortSignal.timeout(20000)),
              ]
            : [
                  supabase
                      .from('giocatore')
                      .select(selectFields)
                      .order('nome', { ascending: true })
                      .order('cognome', { ascending: true })
                      .limit(16)
                      .abortSignal(AbortSignal.timeout(20000)),
              ];

    const [iscrizioniResult, ...giocatoriResults] = await Promise.all([
        iscrizioniPromise,
        ...giocatoriPromises,
    ]);

    const { data: iscrizioni, error: iscrizioniError } = iscrizioniResult;
    if (iscrizioniError) throw iscrizioniError;

    const iscritti = new Set((iscrizioni ?? []).map((iscrizione) => iscrizione.id_giocatore));
    const giocatori = new Map<
        number,
        NonNullable<(typeof giocatoriResults)[number]['data']>[number]
    >();

    for (const result of giocatoriResults) {
        if (result.error) throw result.error;

        for (const giocatore of result.data ?? []) {
            if (!iscritti.has(giocatore.id)) {
                giocatori.set(giocatore.id, giocatore);
            }
        }
    }

    return Array.from(giocatori.values()).slice(0, 16);
}

export type giocatoriDisponibiliSquadraType = Awaited<
    ReturnType<typeof getGiocatoriDisponibiliSquadra>
>[number];

export async function insertSquadra(payload: TablesInsert<'squadra'>) {
    const { data, error } = await supabase.from('squadra').insert(payload).select().single();

    if (error) throw error;

    return data;
}

export type insertSquadraPayload = Parameters<typeof insertSquadra>[0];

export async function updateSquadra(idSquadra: number, payload: TablesUpdate<'squadra'>) {
    const { data, error } = await supabase
        .from('squadra')
        .update({ ...payload, data_ultima_modifica: new Date().toISOString() })
        .eq('id', idSquadra)
        .select()
        .single();

    if (error) throw error;

    return data;
}

export type updateSquadraPayload = Parameters<typeof updateSquadra>[1];

export async function insertIscrizioneSquadra(payload: TablesInsert<'iscrizione'>) {
    const { data, error } = await supabase.from('iscrizione').insert(payload).select().single();

    if (error) throw error;

    return data;
}

export type insertIscrizioneSquadraPayload = Parameters<typeof insertIscrizioneSquadra>[0];

type RosterExistingPlayerInput = {
    id_giocatore: number;
    dettagli?: string | null;
};

type RosterNewPlayerInput = {
    giocatore: TablesInsert<'giocatore'>;
    client_id?: number | string | null;
    dettagli?: string | null;
};

type CreateSquadraConRosterInput = {
    squadra: TablesInsert<'squadra'>;
    id_torneo: number;
    id_capitano?: number | string | null;
    roster: Array<RosterExistingPlayerInput | RosterNewPlayerInput>;
};

function removeUndefined<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map((item) => removeUndefined(item)) as T;
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([, item]) => item !== undefined)
                .map(([key, item]) => [key, removeUndefined(item)])
        ) as T;
    }

    return value;
}

function isMissingRpcError(error: unknown) {
    const rpcError = error as { code?: string; message?: string; details?: string };
    const message = `${rpcError.message ?? ''} ${rpcError.details ?? ''}`;

    return (
        rpcError.code === 'PGRST202' ||
        rpcError.code === '42883' ||
        /could not find the function|function .* does not exist|schema cache/i.test(message)
    );
}

function isExistingRosterPlayer(
    player: RosterExistingPlayerInput | RosterNewPlayerInput
): player is RosterExistingPlayerInput {
    return 'id_giocatore' in player;
}

export async function createSquadraConRoster(payload: CreateSquadraConRosterInput) {
    const requestedCaptainId = payload.id_capitano ?? payload.squadra.id_capitano ?? null;
    const normalizedPayload = removeUndefined({
        ...payload,
        id_capitano: requestedCaptainId,
        squadra: {
            ...payload.squadra,
            id_capitano:
                typeof payload.squadra.id_capitano === 'number' && payload.squadra.id_capitano > 0
                    ? payload.squadra.id_capitano
                    : null,
        },
    });

    const { data, error } = await (supabase as any).rpc('create_squadra_con_roster', {
        payload: normalizedPayload,
    });

    if (error) {
        if (!isMissingRpcError(error)) throw error;
    } else if (data?.squadra && Array.isArray(data?.iscrizioni)) {
        return data as {
            squadra: Tables<'squadra'>;
            iscrizioni: Tables<'iscrizione'>[];
        };
    } else {
        throw new Error('Risposta RPC create_squadra_con_roster non valida.');
    }

    // Fallback RPC assente: questa sequenza client-side non e' atomica.
    // Se una insert fallisce dopo squadra o alcune iscrizioni, il DB puo restare parziale.
    let squadra = await insertSquadra(normalizedPayload.squadra);
    const iscrizioni: Tables<'iscrizione'>[] = [];
    let resolvedCaptainId = squadra.id_capitano;

    for (const rosterPlayer of normalizedPayload.roster) {
        let idGiocatore: number;

        if (isExistingRosterPlayer(rosterPlayer)) {
            idGiocatore = rosterPlayer.id_giocatore;
        } else {
            const { data: giocatore, error: giocatoreError } = await supabase
                .from('giocatore')
                .insert(rosterPlayer.giocatore)
                .select()
                .single();

            if (giocatoreError) throw giocatoreError;

            idGiocatore = giocatore.id;

            if (
                requestedCaptainId !== null &&
                requestedCaptainId !== undefined &&
                String(requestedCaptainId) === String(rosterPlayer.client_id)
            ) {
                resolvedCaptainId = idGiocatore;
            }
        }

        if (String(requestedCaptainId) === String(idGiocatore)) {
            resolvedCaptainId = idGiocatore;
        }

        const iscrizione = await insertIscrizioneSquadra({
            id_giocatore: idGiocatore,
            id_squadra: squadra.id,
            id_torneo: normalizedPayload.id_torneo,
            dettagli: rosterPlayer.dettagli ?? null,
        });

        iscrizioni.push(iscrizione);
    }

    if (resolvedCaptainId !== squadra.id_capitano) {
        squadra = await updateSquadra(squadra.id, { id_capitano: resolvedCaptainId });
    }

    return { squadra, iscrizioni };
}

export type createSquadraConRosterPayload = Parameters<typeof createSquadraConRoster>[0];

export type createSquadraConRosterType = Awaited<ReturnType<typeof createSquadraConRoster>>;

export async function deleteIscrizioneSquadra(idIscrizione: number) {
    const { data, error } = await supabase
        .from('iscrizione')
        .delete()
        .eq('id', idIscrizione)
        .select()
        .single();

    if (error) throw error;

    return data;
}

export type deleteIscrizioneSquadraType = Awaited<ReturnType<typeof deleteIscrizioneSquadra>>;

export async function getIdSquadraGiocatore(idGiocatore: number) {
    const query = supabase
        .from('iscrizione')
        .select(`id_squadra`)
        .eq('id_giocatore', idGiocatore)
        .order('id_torneo', { ascending: false })
        .limit(1)
        .maybeSingle();

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type idSquadraGiocatoreType = Awaited<ReturnType<typeof getIdSquadraGiocatore>>;
