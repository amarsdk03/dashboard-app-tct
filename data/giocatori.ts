import { supabase } from '@/lib/supabase';
import { Enums, TablesInsert, TablesUpdate } from '@/types/database.types';


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
    filters: filtroGiocatoriType = {},
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
        .order('s_nome', {ascending: true})
        .order('g_nome', {ascending: true})
        .order('g_cognome', {ascending: true})
        .range(resultsPerPage * (currentPage - 1), (resultsPerPage * currentPage) - 1)
        .abortSignal(AbortSignal.timeout(20000));

    const { data, count, error } = await query;
    if (error) throw error;

    const result = data;
    return { result, count };
}

export type listaGiocatoriType = Awaited<
    ReturnType<typeof getListaGiocatori>
>['result'][number];



export async function getDatiGiocatore(idGiocatore: number) {
    const query = supabase
        .from('giocatore')
        .select(`*`)
        .eq('id', idGiocatore)
        .maybeSingle();

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type datiGiocatoreType = Awaited<
    ReturnType<typeof getDatiGiocatore>
>;


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



export async function getStatisticheGiocatore(idGiocatore: number) {
    const query = supabase
        .from('azioni_giocatori')
        .select(`*`)
        .eq('g_id', idGiocatore);

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type statisticheGiocatoreType = Awaited<
    ReturnType<typeof getStatisticheGiocatore>
>;


export async function insertGiocatore(payload: TablesInsert<'giocatore'>) {
    const { data, error } = await supabase
        .from('giocatore')
        .insert(payload)
        .select()
        .single();

    if (error) throw error;

    return data;
}

export type insertGiocatorePayload = Parameters<typeof insertGiocatore>[0];


export async function updateGiocatore(
    idGiocatore: number,
    payload: TablesUpdate<'giocatore'>,
) {
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
    const { data, error } = await supabase
        .from('iscrizione')
        .insert(payload)
        .select()
        .single();

    if (error) throw error;

    return data;
}

export type insertIscrizionePayload = Parameters<typeof insertIscrizione>[0];


export async function updateIscrizione(
    idIscrizione: number,
    payload: TablesUpdate<'iscrizione'>,
) {
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
