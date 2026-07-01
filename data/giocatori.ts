import { supabase } from '@/lib/supabase';
import { Enums, Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

export type filtroGiocatoriType = {
    idSquadra?: number | null;
    nomeSquadra?: string | null;
    ruolo?: Enums<'ruolo_giocatore'> | null;
    soloCapitani?: boolean;
};

export async function getListaGiocatori(
    searchParam: string | null,
    idTorneo: number,
    currentPage: number,
    resultsPerPage: number,
    filters: filtroGiocatoriType = {}
) {
    let query = supabase
        .from('ricerca_giocatori')
        .select(`*`, { count: 'exact' })
        .eq('id_torneo', idTorneo);

    if (searchParam && searchParam.trim().length > 0) {
        query = query.or(`g_nome.ilike.%${searchParam}%,g_cognome.ilike.%${searchParam}%`);
    }

    if (filters.nomeSquadra && filters.nomeSquadra.trim().length > 0) {
        query = query.eq('s_nome', filters.nomeSquadra);
    }

    if (filters.ruolo) {
        query = query.eq('g_ruolo_principale', filters.ruolo);
    }

    if (filters.soloCapitani) {
        query = query.eq('g_is_capitano', true);
    }

    query = query
        .order('s_nome', { ascending: true })
        .order('g_nome', { ascending: true })
        .order('g_cognome', { ascending: true })
        .range(resultsPerPage * (currentPage - 1), resultsPerPage * currentPage - 1)
        .abortSignal(AbortSignal.timeout(20000));

    const { data, count, error } = await query;
    if (error) throw error;

    const result = data;
    return { result, count };
}

export type listaGiocatoriType = Awaited<ReturnType<typeof getListaGiocatori>>['result'][number];

export async function getDatiGiocatore(idGiocatore: number) {
    const query = supabase.from('giocatore').select(`*`).eq('id', idGiocatore).maybeSingle();

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type datiGiocatoreType = Awaited<ReturnType<typeof getDatiGiocatore>>;

export async function getDatiGiocatoreConIscrizione(idGiocatore: number, idTorneo: number) {
    const { data: giocatore, error: giocatoreError } = await supabase
        .from('giocatore')
        .select(`*`)
        .eq('id', idGiocatore)
        .maybeSingle();

    if (giocatoreError) throw giocatoreError;

    const { data: iscrizione, error: iscrizioneError } = await supabase
        .from('iscrizione')
        .select(`*`)
        .eq('id_giocatore', idGiocatore)
        .eq('id_torneo', idTorneo)
        .maybeSingle();

    if (iscrizioneError) throw iscrizioneError;

    return { giocatore, iscrizione };
}

export type datiGiocatoreConIscrizioneType = Awaited<
    ReturnType<typeof getDatiGiocatoreConIscrizione>
>;

export async function getDatiGiocatoreConIscrizioni(idGiocatore: number) {
    const { data: giocatore, error: giocatoreError } = await supabase
        .from('giocatore')
        .select(`*`)
        .eq('id', idGiocatore)
        .maybeSingle();

    if (giocatoreError) throw giocatoreError;

    const { data: iscrizioni, error: iscrizioniError } = await supabase
        .from('iscrizione')
        .select(
            `
            *,
            squadra:id_squadra(
                id,
                nome,
                acronimo,
                link_stemma
            )
        `
        )
        .eq('id_giocatore', idGiocatore)
        .order('id_torneo', { ascending: false })
        .abortSignal(AbortSignal.timeout(20000));

    if (iscrizioniError) throw iscrizioniError;

    return { giocatore, iscrizioni: iscrizioni ?? [] };
}

export type datiGiocatoreConIscrizioniType = Awaited<
    ReturnType<typeof getDatiGiocatoreConIscrizioni>
>;

export async function getStatisticheGiocatore(idGiocatore: number) {
    const query = supabase.from('azioni_giocatori').select(`*`).eq('g_id', idGiocatore);

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type statisticheGiocatoreType = Awaited<ReturnType<typeof getStatisticheGiocatore>>;

export async function insertGiocatore(payload: TablesInsert<'giocatore'>) {
    const { data, error } = await supabase.from('giocatore').insert(payload).select().single();

    if (error) throw error;

    return data;
}

export type insertGiocatorePayload = Parameters<typeof insertGiocatore>[0];

type CreateGiocatoreConIscrizioneInput = {
    giocatore: TablesInsert<'giocatore'>;
    iscrizione: Omit<TablesInsert<'iscrizione'>, 'id_giocatore'> & {
        id_giocatore?: number;
    };
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

export async function createGiocatoreConIscrizione(payload: CreateGiocatoreConIscrizioneInput) {
    const normalizedPayload = removeUndefined(payload);
    const { data, error } = await (supabase as any).rpc('create_giocatore_con_iscrizione', {
        payload: normalizedPayload,
    });

    if (error) {
        if (!isMissingRpcError(error)) throw error;
    } else if (data?.giocatore && data?.iscrizione) {
        return data as {
            giocatore: Tables<'giocatore'>;
            iscrizione: Tables<'iscrizione'>;
        };
    } else {
        throw new Error('Risposta RPC create_giocatore_con_iscrizione non valida.');
    }

    // Fallback RPC assente: questa sequenza client-side non e' atomica.
    // Se l'iscrizione fallisce dopo la creazione del giocatore, il DB puo restare parziale.
    const giocatore = await insertGiocatore(normalizedPayload.giocatore);
    const iscrizione = await insertIscrizione({
        ...normalizedPayload.iscrizione,
        id_giocatore: giocatore.id,
    });

    return { giocatore, iscrizione };
}

export type createGiocatoreConIscrizionePayload = Parameters<
    typeof createGiocatoreConIscrizione
>[0];

export type createGiocatoreConIscrizioneType = Awaited<
    ReturnType<typeof createGiocatoreConIscrizione>
>;

type CreateGiocatoreConIscrizioniInput = {
    giocatore: TablesInsert<'giocatore'>;
    iscrizioni: Array<
        Omit<TablesInsert<'iscrizione'>, 'id_giocatore'> & {
            id_giocatore?: number;
        }
    >;
};

export async function createGiocatoreConIscrizioni(payload: CreateGiocatoreConIscrizioniInput) {
    const normalizedPayload = removeUndefined(payload);
    const giocatore = await insertGiocatore(normalizedPayload.giocatore);
    const iscrizioni: Tables<'iscrizione'>[] = [];

    for (const iscrizionePayload of normalizedPayload.iscrizioni) {
        iscrizioni.push(
            await insertIscrizione({
                ...iscrizionePayload,
                id_giocatore: giocatore.id,
            })
        );
    }

    return { giocatore, iscrizioni };
}

export type createGiocatoreConIscrizioniPayload = Parameters<
    typeof createGiocatoreConIscrizioni
>[0];

export type createGiocatoreConIscrizioniType = Awaited<
    ReturnType<typeof createGiocatoreConIscrizioni>
>;

export async function updateGiocatore(idGiocatore: number, payload: TablesUpdate<'giocatore'>) {
    const { data, error } = await supabase
        .from('giocatore')
        .update({ ...payload, data_ultima_modifica: new Date().toISOString() })
        .eq('id', idGiocatore)
        .select()
        .single();

    if (error) throw error;

    return data;
}

export type updateGiocatorePayload = Parameters<typeof updateGiocatore>[1];

export async function insertIscrizione(payload: TablesInsert<'iscrizione'>) {
    const { data, error } = await supabase.from('iscrizione').insert(payload).select().single();

    if (error) throw error;

    return data;
}

export type insertIscrizionePayload = Parameters<typeof insertIscrizione>[0];

export async function updateIscrizione(idIscrizione: number, payload: TablesUpdate<'iscrizione'>) {
    const { data, error } = await supabase
        .from('iscrizione')
        .update({ ...payload, data_ultima_modifica: new Date().toISOString() })
        .eq('id', idIscrizione)
        .select()
        .single();

    if (error) throw error;

    return data;
}

export type updateIscrizionePayload = Parameters<typeof updateIscrizione>[1];

export async function deleteIscrizione(idIscrizione: number) {
    const { data, error } = await supabase
        .from('iscrizione')
        .delete()
        .eq('id', idIscrizione)
        .select()
        .single();

    if (error) throw error;

    return data;
}

export type deleteIscrizioneType = Awaited<ReturnType<typeof deleteIscrizione>>;
