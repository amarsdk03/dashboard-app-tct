import { supabase } from '@/lib/supabase';


function dedupeSquadre<T extends { s_id: number | null; t_id: number | null; s_nome: string | null }>(
    data: T[] | null,
) {
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


export async function getListaSquadre(
    searchParam: string | null,
    idTorneo: number,
) {
    let query = supabase
        .from('ricerca_squadre')
        .select(`
            t_id,
            t_nome,
            s_id,
            s_nome,
            s_id_capitano,
            s_acronimo,
            s_link_stemma,
            s_colore_squadra
        `)
        .eq('t_id', idTorneo);

    if (searchParam && searchParam.trim().length > 0) {
        query = query.or(`s_nome.ilike.%${searchParam}%`);
    }

    query = query
        .order('s_nome', {ascending: true})
        .order('t_id', {ascending: false})
        .abortSignal(AbortSignal.timeout(20000));

    const { data, error } = await query;
    if (error) throw error;

    return dedupeSquadre(data);
}

export type listaSquadreType = Awaited<
    ReturnType<typeof getListaSquadre>
>[number];



export async function getDatiSquadra(idSquadra: number) {
    const query = supabase
        .from('squadra')
        .select(`
            *,
            giocatore:id_capitano(
                id,
                nome,
                cognome
            )
        `)
        .eq('id', idSquadra)
        .maybeSingle();

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type datiSquadraType = Awaited<
    ReturnType<typeof getDatiSquadra>
>;



export async function getStatisticheSquadra(idSquadra: number) {
    const query = supabase
        .from('azioni_partite')
        .select(`*`)
        .or(`p_id_squadra_casa.eq.${idSquadra},p_id_squadra_ospite.eq.${idSquadra}`);

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type statisticheSquadraType = Awaited<
    ReturnType<typeof getStatisticheSquadra>
>;



export async function getFormazioneSquadra(idSquadra: number, idTorneo: number) {
    const query = supabase
        .from('iscrizione')
        .select(`
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
        `)
        .eq('id_torneo', idTorneo)
        .eq('id_squadra', idSquadra);

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type formazioneSquadraType = Awaited<
    ReturnType<typeof getFormazioneSquadra>
>;



export async function getIdSquadraGiocatore(idGiocatore: number) {
    const query = supabase
        .from('iscrizione')
        .select(`id_squadra`)
        .eq('id_giocatore', idGiocatore)
        .order('id_torneo', {ascending: false})
        .limit(1)
        .maybeSingle();

    const { data, error } = await query;
    if (error) throw error;

    return data;
}
