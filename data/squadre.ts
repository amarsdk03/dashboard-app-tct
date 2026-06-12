import { supabase } from '@/lib/supabase';
import { TablesInsert, TablesUpdate } from '@/types/database.types';

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

export async function getListaSquadre(searchParam: string | null, idTorneo: number) {
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
        )
        .eq('t_id', idTorneo);

    if (searchParam && searchParam.trim().length > 0) {
        query = query.ilike('s_nome', `%${searchParam.trim()}%`);
    }

    query = query
        .order('s_nome', { ascending: true })
        .order('t_id', { ascending: false })
        .abortSignal(AbortSignal.timeout(20000));

    const { data, error } = await query;
    if (error) throw error;

    return dedupeSquadre(data);
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
