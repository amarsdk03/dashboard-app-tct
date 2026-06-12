import { supabase } from '@/lib/supabase';
import { TablesInsert, TablesUpdate } from '@/types/database.types';

function getLocalDayRange(now: Date) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return {
        startIso: start.toISOString(),
        endIso: end.toISOString(),
    };
}

export async function getPartiteSquadra(idSquadra: number) {
    const { data, error } = await supabase
        .from('partita')
        .select(
            `
            *,
            squadra_casa:id_squadra_casa(
                id,
                nome
            ),
            squadra_ospite:id_squadra_ospite(
                id,
                nome
            )
        `
        )
        .or(`id_squadra_casa.eq.${idSquadra},id_squadra_ospite.eq.${idSquadra}`)
        .order('fischio_inizio', { ascending: true })
        .abortSignal(AbortSignal.timeout(20000));

    if (error) throw error;

    return data;
}

export type partiteSquadraType = Awaited<ReturnType<typeof getPartiteSquadra>>;

export async function getListaCategorie() {
    const { data, error } = await supabase
        .from('lista_categorie')
        .select('*')
        .order('torneo_id', { ascending: false })
        .abortSignal(AbortSignal.timeout(20000));

    if (error) throw error;

    return data ?? [];
}

export type listaCategorieType = Awaited<ReturnType<typeof getListaCategorie>>;

export type listaPartiteFilters = {
    search?: string | null;
    idCategoria?: number | null;
    valGirone?: string | null;
    upcomingOnly?: boolean;
    now?: Date;
};

export async function getListaPartite(
    idTorneo: number | null,
    filtersOrIdCategoria: listaPartiteFilters | number | null = null,
    valGironeParam: string | null = null
) {
    const filters: listaPartiteFilters =
        typeof filtersOrIdCategoria === 'object' && filtersOrIdCategoria !== null
            ? filtersOrIdCategoria
            : {
                  idCategoria: filtersOrIdCategoria,
                  valGirone: valGironeParam,
              };

    let query = supabase.from('risultati_partite').select(`*`);

    if (idTorneo && idTorneo > 0) {
        query = query.eq('torneo_id', idTorneo);
    }

    const idCategoria = filters.idCategoria;
    if (idCategoria && !isNaN(Number(idCategoria)) && Number(idCategoria) > -1) {
        query = query.eq('categoria_id', Number(idCategoria));
    }

    const valGirone = filters.valGirone;
    if (valGirone && valGirone.trim() !== '') {
        query = query.eq('girone', valGirone);
    }

    const search = filters.search?.trim();
    if (search) {
        query = query.or(
            [
                `squadra_casa_nome.ilike.%${search}%`,
                `squadra_ospite_nome.ilike.%${search}%`,
                `categoria_nome.ilike.%${search}%`,
                `fase.ilike.%${search}%`,
                `girone.ilike.%${search}%`,
            ].join(',')
        );
    }

    if (filters.upcomingOnly) {
        query = query.gte('fischio_inizio', (filters.now ?? new Date()).toISOString());
    }

    query = query
        .order('fischio_inizio', { ascending: filters.upcomingOnly ?? false })
        .abortSignal(AbortSignal.timeout(20000));

    const { data, error } = await query;
    if (error) throw error;

    return data ?? [];
}

export type listaPartiteType = Awaited<ReturnType<typeof getListaPartite>>[number];

export async function insertPartita(payload: TablesInsert<'partita'>) {
    const { data, error } = await supabase.from('partita').insert(payload).select().single();

    if (error) throw error;

    return data;
}

export type insertPartitaType = Awaited<ReturnType<typeof insertPartita>>;
export type insertPartitaPayload = Parameters<typeof insertPartita>[0];

export async function updatePartita(idPartita: number, payload: TablesUpdate<'partita'>) {
    const { data, error } = await supabase
        .from('partita')
        .update({ ...payload, data_ultima_modifica: new Date().toISOString() })
        .eq('id', idPartita)
        .select()
        .single();

    if (error) throw error;

    return data;
}

export type updatePartitaType = Awaited<ReturnType<typeof updatePartita>>;
export type updatePartitaPayload = Parameters<typeof updatePartita>[1];

export async function insertAzionePartita(payload: TablesInsert<'azione'>) {
    const { data, error } = await supabase.from('azione').insert(payload).select().single();

    if (error) throw error;

    return data;
}

export type insertAzionePartitaType = Awaited<ReturnType<typeof insertAzionePartita>>;
export type insertAzionePartitaPayload = Parameters<typeof insertAzionePartita>[0];

export async function updateAzionePartita(idAzione: number, payload: TablesUpdate<'azione'>) {
    const { data, error } = await supabase
        .from('azione')
        .update({ ...payload, data_ultima_modifica: new Date().toISOString() })
        .eq('id', idAzione)
        .select()
        .single();

    if (error) throw error;

    return data;
}

export type updateAzionePartitaType = Awaited<ReturnType<typeof updateAzionePartita>>;
export type updateAzionePartitaPayload = Parameters<typeof updateAzionePartita>[1];

export async function deleteAzionePartita(idAzione: number) {
    const { data, error } = await supabase
        .from('azione')
        .delete()
        .eq('id', idAzione)
        .select()
        .single();

    if (error) throw error;

    return data;
}

export type deleteAzionePartitaType = Awaited<ReturnType<typeof deleteAzionePartita>>;

export async function getProssimiIncontri(idTorneo: number, dateFilter: Date) {
    const { data, error } = await supabase
        .from('risultati_partite')
        .select(`*`)
        .eq('torneo_id', idTorneo)
        .gte('fischio_inizio', dateFilter.toISOString())
        .order('fischio_inizio', { ascending: true })
        .limit(6)
        .abortSignal(AbortSignal.timeout(20000));

    if (error) throw error;

    return data ?? [];
}

export type prossimiIncontriType = Awaited<ReturnType<typeof getProssimiIncontri>>;

export async function getPartiteOggi(idTorneo: number, now = new Date()) {
    const { startIso, endIso } = getLocalDayRange(now);

    const { data, error } = await supabase
        .from('risultati_partite')
        .select(`*`)
        .eq('torneo_id', idTorneo)
        .gte('fischio_inizio', startIso)
        .lte('fischio_inizio', endIso)
        .order('fischio_inizio', { ascending: true })
        .limit(3)
        .abortSignal(AbortSignal.timeout(20000));

    if (error) throw error;

    return data ?? [];
}

export type partiteOggiType = Awaited<ReturnType<typeof getPartiteOggi>>[number];

export async function getStatisticheHomeTorneo(idTorneo: number, now = new Date()) {
    const { count: upcomingMatches, error: upcomingError } = await supabase
        .from('risultati_partite')
        .select('id_partita', { count: 'exact', head: true })
        .eq('torneo_id', idTorneo)
        .gte('fischio_inizio', now.toISOString())
        .abortSignal(AbortSignal.timeout(20000));

    if (upcomingError) throw upcomingError;

    const { data: goalRows, error: goalError } = await supabase
        .from('risultati_partite')
        .select('goal_casa, goal_ospite')
        .eq('torneo_id', idTorneo)
        .abortSignal(AbortSignal.timeout(20000));

    if (goalError) throw goalError;

    const goalsScored = (goalRows ?? []).reduce((total, match) => {
        return total + (match.goal_casa ?? 0) + (match.goal_ospite ?? 0);
    }, 0);

    return {
        upcomingMatches: upcomingMatches ?? 0,
        goalsScored,
    };
}

export type homeTorneoStatsType = Awaited<ReturnType<typeof getStatisticheHomeTorneo>>;

export async function getConteggioPartiteTorneo(idTorneo: number) {
    const { count, error } = await supabase
        .from('risultati_partite')
        .select('id_partita', { count: 'exact', head: true })
        .eq('torneo_id', idTorneo)
        .abortSignal(AbortSignal.timeout(20000));

    if (error) throw error;

    return count ?? 0;
}

export type conteggioPartiteTorneoType = Awaited<ReturnType<typeof getConteggioPartiteTorneo>>;

export async function getDatiPartita(idPartita: number) {
    const { data, error } = await supabase
        .from('risultati_partite')
        .select(`*`)
        .eq('id_partita', idPartita)
        .maybeSingle();

    if (error) throw error;

    return data ?? null;
}

export type datiPartitaType = Awaited<ReturnType<typeof getDatiPartita>>;

export async function getAzioniPartita(idPartita: number) {
    const { data, error } = await supabase
        .from('azioni_partite')
        .select(`*`)
        .eq('p_id', idPartita)
        .abortSignal(AbortSignal.timeout(20000));

    if (error) throw error;

    return data ?? [];
}

export type azioniPartitaType = Awaited<ReturnType<typeof getAzioniPartita>>;

export async function getDatiCampo(idCampo: number) {
    const { data, error } = await supabase.from('campo').select(`*`).eq('id', idCampo);

    if (error) throw error;

    return data ?? null;
}

export type datiCampoType = Awaited<ReturnType<typeof getDatiCampo>>;

export async function getContentPartita(idPartita: number) {
    const { data, error } = await supabase
        .from('partita')
        .select('highlights_yt, link_post_ig')
        .eq('id', idPartita);

    if (error) throw error;

    return data ?? null;
}

export type contentPartitaType = Awaited<ReturnType<typeof getContentPartita>>;
