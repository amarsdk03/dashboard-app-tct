import { supabase } from '@/lib/supabase';


export async function getListaTornei(searchParam: string | null) {
    let query = supabase
        .from('torneo')
        .select(`
            id,
            nome,
            descrizione,
            data_inizio,
            data_fine,
            logo_torneo,
            svolto_in,
            data_creazione,
            data_ultima_modifica,
            campo:svolto_in(
                id,
                nome,
                indirizzo
            )
        `);

    if (searchParam && searchParam.trim().length > 0) {
        query = query.ilike('nome', `%${searchParam}%`);
    }

    query = query
        .order('data_inizio', { ascending: false, nullsFirst: false })
        .order('nome', { ascending: true })
        .abortSignal(AbortSignal.timeout(20000));

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type listaTorneiType = Awaited<
    ReturnType<typeof getListaTornei>
>[number];


export async function getDatiTorneo(idTorneo: number) {
    const query = supabase
        .from('torneo')
        .select(`
            *,
            campo:svolto_in(
                id,
                nome,
                indirizzo,
                link_google_maps
            )
        `)
        .eq('id', idTorneo)
        .maybeSingle();

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type datiTorneoType = Awaited<
    ReturnType<typeof getDatiTorneo>
>;


export async function getStatisticheTorneo(idTorneo: number) {
    const query = supabase
        .from('lista_categorie')
        .select(`
            categoria_id,
            categoria_nome,
            girone,
            torneo_id,
            torneo_nome
        `)
        .eq('torneo_id', idTorneo)
        .abortSignal(AbortSignal.timeout(20000));

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type statisticheTorneoType = Awaited<
    ReturnType<typeof getStatisticheTorneo>
>;


export async function insertTorneo(payload: {
    nome: string;
    descrizione?: string | null;
    data_inizio?: string | null;
    data_fine?: string | null;
    logo_torneo?: string | null;
    svolto_in?: number | null;
}) {
    const { data, error } = await supabase
        .from('torneo')
        .insert(payload)
        .select()
        .single();

    if (error) throw error;

    return data;
}

export type insertTorneoPayload = Parameters<typeof insertTorneo>[0];


export async function updateTorneo(
    idTorneo: number,
    payload: {
        nome?: string;
        descrizione?: string | null;
        data_inizio?: string | null;
        data_fine?: string | null;
        logo_torneo?: string | null;
        svolto_in?: number | null;
    },
) {
    const { data, error } = await supabase
        .from('torneo')
        .update({ ...payload, data_ultima_modifica: new Date().toISOString() })
        .eq('id', idTorneo)
        .select()
        .single();

    if (error) throw error;

    return data;
}

export type updateTorneoPayload = Parameters<typeof updateTorneo>[1];