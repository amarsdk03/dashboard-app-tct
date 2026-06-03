import { supabase } from '@/lib/supabase';


export async function getPartiteSquadra(idSquadra: number) {
    const { data, error } = await supabase
        .from('partita')
        .select(`
            *,
            squadra_casa:id_squadra_casa(
                id,
                nome
            ),
            squadra_ospite:id_squadra_ospite(
                id,
                nome
            )
        `)
        .or(`id_squadra_casa.eq.${idSquadra},id_squadra_ospite.eq.${idSquadra}`)
        .order('fischio_inizio', { ascending: true });

    if (error) throw error;

    return data;
}

export type partiteSquadraType = Awaited<
    ReturnType<typeof getPartiteSquadra>
>;



export async function getListaCategorie() {
    const { data, error } = await supabase
        .from('lista_categorie')
        .select('*')
        .order('torneo_id', { ascending: false });

    if (error) throw error;

    return data ?? [];
}

export type listaCategorieType = Awaited<
    ReturnType<typeof getListaCategorie>
>;



export async function getListaPartite(
    idTorneo: number | null,
    idCategoria: number | null,
    valGirone: string | null
) {
    let query = supabase
        .from('risultati_partite')
        .select(`*`);

    if (idTorneo && idTorneo > 0) {
        query = query.eq('torneo_id', idTorneo);
    } else {
        // TEMP: if invalid id, return results from 3rd edition
        query = query.eq('torneo_id', 3);
    }

    if (idCategoria && !isNaN(Number(idCategoria)) && Number(idCategoria) > -1) {
        query = query.eq('categoria_id', Number(idCategoria));
    }

    if (valGirone && valGirone.trim() !== '') {
        query = query.eq('girone', valGirone);
    }

    query = query.order('fischio_inizio', {ascending: false});

    const {data, error} = await query;
    if (error) throw error;

    return data ?? [];
}

export type listaPartiteType = Awaited<
    ReturnType<typeof getListaPartite>
>;



export async function getProssimiIncontri(idTorneo: number, dateFilter: Date) {
    const {data, error} = await supabase
        .from('risultati_partite')
        .select(`*`)
        .eq('torneo_id', idTorneo)
        .gte('fischio_inizio', dateFilter.toISOString())
        .order('fischio_inizio', {ascending: true})
        .limit(6);

    if (error) throw error;

    return data ?? [];
}

export type prossimiIncontriType = Awaited<
    ReturnType<typeof getProssimiIncontri>
>;



export async function getDatiPartita(idPartita: number) {
    const {data, error} = await supabase
        .from('risultati_partite')
        .select(`*`)
        .eq('id_partita', idPartita)
        .maybeSingle();

    if (error) throw error;

    return data ?? null;
}

export type datiPartitaType = Awaited<
    ReturnType<typeof getDatiPartita>
>;



export async function getAzioniPartita(idPartita: number) {
    const {data, error} = await supabase
        .from('azioni_partite')
        .select(`*`)
        .eq('p_id', idPartita);

    if (error) throw error;

    return data ?? [];
}

export type azioniPartitaType = Awaited<
    ReturnType<typeof getAzioniPartita>
>;



export async function getDatiCampo(idCampo: number) {
    const {data, error} = await supabase
        .from('campo')
        .select(`*`)
        .eq('id', idCampo);

    if (error) throw error;

    return data ?? null;
}

export type datiCampoType = Awaited<
    ReturnType<typeof getDatiCampo>
>;



export async function getContentPartita(idPartita: number) {
    const {data, error} = await supabase
        .from('partita')
        .select('highlights_yt, link_post_ig')
        .eq('id', idPartita);

    if (error) throw error;

    return data ?? null;
}

export type contentPartitaType = Awaited<
    ReturnType<typeof getContentPartita>
>;
