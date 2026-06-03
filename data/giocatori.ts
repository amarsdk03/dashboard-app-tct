import { supabase } from '@/lib/supabase';


export async function getListaGiocatori(
    searchParam: string | null,
    idTorneo: number,
    currentPage: number,
    resultsPerPage: number,
) {
    let query = supabase
        .from('ricerca_giocatori')
        .select(`*`, { count: 'exact' })
        .eq('id_torneo', idTorneo);

    if (searchParam && searchParam.trim().length > 0) {
        query = query.or(`g_nome.ilike.%${searchParam}%,g_cognome.ilike.%${searchParam}%`);
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
