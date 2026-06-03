import { supabase } from '@/lib/supabase';


export async function getListaTornei() {
    const query = supabase
        .from('torneo')
        .select(`
            id,
            nome,
            descrizione,
            logo_torneo,
            data_inizio,
            data_fine,
            campo(
                id,
                nome,
                indirizzo,
                dettagli,
                link_google_maps
            )
        `)
        .order('id', { ascending: false })
        .abortSignal(AbortSignal.timeout(20000));

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type listaTorneiType = Awaited<
    ReturnType<typeof getListaTornei>
>;



export async function getCategorieClassifica(idCategoria: number | null, idTorneo?: number) {
    let query = supabase
        .from('categoria')
        .select("num_qualificate, num_playoff, num_eliminate");

    if (idCategoria) {
        query = query.eq('id', idCategoria);
    } else if (idTorneo) {
        query = query.eq('id_torneo', idTorneo);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [{
        num_qualificate: 0,
        num_playoff: 0,
        num_eliminate: 0
    }];
}

export type categorieClassificaType = Awaited<
    ReturnType<typeof getCategorieClassifica>
>;
