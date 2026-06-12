import { supabase } from '@/lib/supabase';
import { TablesInsert, TablesUpdate } from '@/types/database.types';

export type listaTorneiStatusFilter = 'tutti' | 'in_corso' | 'futuri' | 'conclusi';

export type listaTorneiFilters = {
    status?: listaTorneiStatusFilter;
    today?: string;
};

function getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export async function getListaTornei(
    searchParam: string | null,
    filters: listaTorneiFilters = {}
) {
    let query = supabase.from('torneo').select(`
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
        query = query.ilike('nome', `%${searchParam.trim()}%`);
    }

    const status = filters.status ?? 'tutti';
    const today = filters.today ?? getTodayDateString();

    if (status === 'in_corso') {
        query = query.lte('data_inizio', today).gte('data_fine', today);
    }

    if (status === 'futuri') {
        query = query.gt('data_inizio', today);
    }

    if (status === 'conclusi') {
        query = query.lt('data_fine', today);
    }

    query = query
        .order('data_inizio', { ascending: false, nullsFirst: false })
        .order('nome', { ascending: true })
        .abortSignal(AbortSignal.timeout(20000));

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type listaTorneiType = Awaited<ReturnType<typeof getListaTornei>>[number];

export async function getDatiTorneo(idTorneo: number) {
    const query = supabase
        .from('torneo')
        .select(
            `
            *,
            campo:svolto_in(
                id,
                nome,
                indirizzo,
                link_google_maps
            )
        `
        )
        .eq('id', idTorneo)
        .maybeSingle();

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type datiTorneoType = Awaited<ReturnType<typeof getDatiTorneo>>;

export async function getStatisticheTorneo(idTorneo: number) {
    const query = supabase
        .from('lista_categorie')
        .select(
            `
            categoria_id,
            categoria_nome,
            girone,
            torneo_id,
            torneo_nome
        `
        )
        .eq('torneo_id', idTorneo)
        .abortSignal(AbortSignal.timeout(20000));

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type statisticheTorneoType = Awaited<ReturnType<typeof getStatisticheTorneo>>;

export async function insertTorneo(
    payload: {
        nome: string;
    } & TablesInsert<'torneo'>
) {
    const { data, error } = await supabase.from('torneo').insert(payload).select().single();

    if (error) throw error;

    return data;
}

export type insertTorneoPayload = Parameters<typeof insertTorneo>[0];

export async function updateTorneo(idTorneo: number, payload: TablesUpdate<'torneo'>) {
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

export type torneoSetupCategoriaInput = {
    nome: string;
    num_gironi: number;
    durata_partita?: number | null;
    fasi_partite?: string[];
    num_eliminate?: number;
    num_playoff?: number;
    num_qualificate?: number;
};

export type torneoSetupSquadraInput = Pick<
    TablesInsert<'squadra'>,
    'nome' | 'acronimo' | 'colore_squadra' | 'link_stemma' | 'username_ig'
>;

export type torneoSetupPartitaInput = {
    categoriaIndex: number;
    squadraCasaIndex: number;
    squadraOspiteIndex: number;
    fase: string;
    girone?: string | null;
    giornata?: number | null;
    fischio_inizio?: string | null;
};

export async function createTorneoSetup(payload: {
    torneo: insertTorneoPayload;
    categorie: torneoSetupCategoriaInput[];
    squadre: torneoSetupSquadraInput[];
    partite: torneoSetupPartitaInput[];
}) {
    const torneo = await insertTorneo(payload.torneo);

    const categoriePayload: TablesInsert<'categoria'>[] = payload.categorie.map((categoria) => ({
        id_torneo: torneo.id,
        nome: categoria.nome,
        durata_partita: categoria.durata_partita ?? null,
        fasi_partite: categoria.fasi_partite?.length ? categoria.fasi_partite : ['Gironi'],
        num_gironi: categoria.num_gironi,
        num_eliminate: categoria.num_eliminate ?? 0,
        num_playoff: categoria.num_playoff ?? 0,
        num_qualificate: categoria.num_qualificate ?? 0,
    }));

    const { data: categorie, error: categorieError } = categoriePayload.length
        ? await supabase.from('categoria').insert(categoriePayload).select()
        : { data: [], error: null };
    if (categorieError) throw categorieError;

    const squadrePayload: TablesInsert<'squadra'>[] = payload.squadre.map((squadra) => ({
        nome: squadra.nome,
        acronimo: squadra.acronimo,
        colore_squadra: squadra.colore_squadra ?? null,
        link_stemma: squadra.link_stemma ?? null,
        username_ig: squadra.username_ig ?? null,
    }));

    const { data: squadre, error: squadreError } = squadrePayload.length
        ? await supabase.from('squadra').insert(squadrePayload).select()
        : { data: [], error: null };
    if (squadreError) throw squadreError;

    const partitePayload: TablesInsert<'partita'>[] = payload.partite.map((partita) => {
        const categoria = categorie?.[partita.categoriaIndex];
        const squadraCasa = squadre?.[partita.squadraCasaIndex];
        const squadraOspite = squadre?.[partita.squadraOspiteIndex];

        if (!categoria || !squadraCasa || !squadraOspite) {
            throw new Error('Calendario non coerente con categorie e squadre inserite.');
        }

        return {
            fase: partita.fase,
            girone: partita.girone ?? undefined,
            giornata: partita.giornata ?? null,
            fischio_inizio: partita.fischio_inizio ?? null,
            id_categoria: categoria.id,
            id_squadra_casa: squadraCasa.id,
            id_squadra_ospite: squadraOspite.id,
        };
    });

    const { data: partite, error: partiteError } = partitePayload.length
        ? await supabase.from('partita').insert(partitePayload).select()
        : { data: [], error: null };
    if (partiteError) throw partiteError;

    return {
        torneo,
        categorie: categorie ?? [],
        squadre: squadre ?? [],
        partite: partite ?? [],
    };
}

export type createTorneoSetupType = Awaited<ReturnType<typeof createTorneoSetup>>;

export type listaSquadreTorneoSetupType = Awaited<ReturnType<typeof getListaSquadreTorneoSetup>>;

export async function getListaSquadreTorneoSetup(searchParam: string | null = null) {
    let query = supabase
        .from('squadra')
        .select('id, nome, acronimo, link_stemma, colore_squadra, username_ig')
        .order('nome', { ascending: true })
        .abortSignal(AbortSignal.timeout(20000));

    if (searchParam && searchParam.trim().length > 0) {
        query = query.ilike('nome', `%${searchParam.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data ?? [];
}

export async function insertCategoriaTorneo(payload: TablesInsert<'categoria'>) {
    const { data, error } = await supabase.from('categoria').insert(payload).select().single();

    if (error) throw error;

    return data;
}

export type insertCategoriaTorneoPayload = Parameters<typeof insertCategoriaTorneo>[0];

export type createTorneoCompletoPayload = Parameters<typeof createTorneoSetup>[0];

export async function createTorneoCompleto(payload: createTorneoCompletoPayload) {
    return createTorneoSetup(payload);
}

export type createTorneoCompletoType = Awaited<ReturnType<typeof createTorneoCompleto>>;
