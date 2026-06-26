import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

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

export async function getCategorieClassifica(idCategoria: number | null, idTorneo?: number) {
    let query = supabase.from('categoria').select('num_qualificate, num_playoff, num_eliminate');

    if (idCategoria) {
        query = query.eq('id', idCategoria);
    } else if (idTorneo) {
        query = query.eq('id_torneo', idTorneo);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (
        data || [
            {
                num_qualificate: 0,
                num_playoff: 0,
                num_eliminate: 0,
            },
        ]
    );
}

export type categorieClassificaType = Awaited<
    ReturnType<typeof getCategorieClassifica>
>;

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

export async function getSquadreAssociateTorneo(idTorneo: number) {
    const squadreById = new Map<
        number,
        Pick<
            Tables<'squadra'>,
            'id' | 'nome' | 'acronimo' | 'link_stemma' | 'colore_squadra' | 'username_ig'
        > & { fonte: 'iscrizione' | 'calendario' | 'iscrizione_calendario' }
    >();

    const addSquadra = (
        squadra:
            | (Pick<
                  Tables<'squadra'>,
                  'id' | 'nome' | 'acronimo' | 'link_stemma' | 'colore_squadra' | 'username_ig'
              > & { fonte?: 'iscrizione' | 'calendario' })
            | null
            | undefined,
        fonte: 'iscrizione' | 'calendario'
    ) => {
        if (!squadra?.id) return;

        const current = squadreById.get(squadra.id);
        const nextFonte =
            current && current.fonte !== fonte ? 'iscrizione_calendario' : current?.fonte ?? fonte;

        squadreById.set(squadra.id, {
            id: squadra.id,
            nome: squadra.nome,
            acronimo: squadra.acronimo,
            link_stemma: squadra.link_stemma,
            colore_squadra: squadra.colore_squadra,
            username_ig: squadra.username_ig,
            fonte: nextFonte,
        });
    };

    const { data: iscrizioni, error: iscrizioniError } = await supabase
        .from('iscrizione')
        .select(
            `
            squadra:id_squadra(
                id,
                nome,
                acronimo,
                link_stemma,
                colore_squadra,
                username_ig
            )
        `
        )
        .eq('id_torneo', idTorneo)
        .abortSignal(AbortSignal.timeout(20000));

    if (iscrizioniError) throw iscrizioniError;

    (iscrizioni ?? []).forEach((row) => {
        addSquadra(row.squadra, 'iscrizione');
    });

    const { data: partite, error: partiteError } = await supabase
        .from('risultati_partite')
        .select(
            `
            squadra_casa_id,
            squadra_casa_nome,
            squadra_casa_acronimo,
            squadra_casa_stemma,
            squadra_casa_colore,
            squadra_ospite_id,
            squadra_ospite_nome,
            squadra_ospite_acronimo,
            squadra_ospite_stemma,
            squadra_ospite_colore
        `
        )
        .eq('torneo_id', idTorneo)
        .abortSignal(AbortSignal.timeout(20000));

    if (partiteError) throw partiteError;

    (partite ?? []).forEach((partita) => {
        if (partita.squadra_casa_id && partita.squadra_casa_nome) {
            addSquadra(
                {
                    id: partita.squadra_casa_id,
                    nome: partita.squadra_casa_nome,
                    acronimo: partita.squadra_casa_acronimo ?? '',
                    link_stemma: partita.squadra_casa_stemma,
                    colore_squadra: partita.squadra_casa_colore,
                    username_ig: null,
                },
                'calendario'
            );
        }

        if (partita.squadra_ospite_id && partita.squadra_ospite_nome) {
            addSquadra(
                {
                    id: partita.squadra_ospite_id,
                    nome: partita.squadra_ospite_nome,
                    acronimo: partita.squadra_ospite_acronimo ?? '',
                    link_stemma: partita.squadra_ospite_stemma,
                    colore_squadra: partita.squadra_ospite_colore,
                    username_ig: null,
                },
                'calendario'
            );
        }
    });

    return Array.from(squadreById.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
}

export type squadreAssociateTorneoType = Awaited<ReturnType<typeof getSquadreAssociateTorneo>>;

export async function getSetupTorneo(idTorneo: number) {
    const { data: torneo, error: torneoError } = await supabase
        .from('torneo')
        .select('*')
        .eq('id', idTorneo)
        .maybeSingle();

    if (torneoError) throw torneoError;

    const { data: categorie, error: categorieError } = await supabase
        .from('categoria')
        .select('*')
        .eq('id_torneo', idTorneo)
        .order('nome', { ascending: true })
        .abortSignal(AbortSignal.timeout(20000));

    if (categorieError) throw categorieError;

    const { data: calendario, error: calendarioError } = await supabase
        .from('risultati_partite')
        .select('*')
        .eq('torneo_id', idTorneo)
        .order('fischio_inizio', { ascending: true, nullsFirst: false })
        .order('categoria_nome', { ascending: true })
        .order('girone', { ascending: true })
        .order('giornata', { ascending: true, nullsFirst: false })
        .abortSignal(AbortSignal.timeout(20000));

    if (calendarioError) throw calendarioError;

    const squadreAssociate = await getSquadreAssociateTorneo(idTorneo);

    return {
        torneo,
        categorie: categorie ?? [],
        calendario: calendario ?? [],
        squadreAssociate,
    };
}

export type setupTorneoType = Awaited<ReturnType<typeof getSetupTorneo>>;

export async function updateCategoriaTorneo(
    idCategoria: number,
    payload: TablesUpdate<'categoria'>
) {
    const { data, error } = await supabase
        .from('categoria')
        .update({ ...payload, data_ultima_modifica: new Date().toISOString() })
        .eq('id', idCategoria)
        .select()
        .single();

    if (error) throw error;

    return data;
}

export type updateCategoriaTorneoPayload = Parameters<typeof updateCategoriaTorneo>[1];

export type upsertCalendarioTorneoPayload = Array<
    Pick<TablesInsert<'partita'>, 'id_categoria' | 'id_squadra_casa' | 'id_squadra_ospite' | 'fase'> &
        Partial<
            Pick<
                TablesInsert<'partita'>,
                | 'id'
                | 'girone'
                | 'giornata'
                | 'fischio_inizio'
                | 'campo_svolgimento'
                | 'id_arbitro'
            >
        >
>;

export async function upsertCalendarioTorneo(
    idTorneo: number,
    payload: upsertCalendarioTorneoPayload
) {
    if (payload.length === 0) return [];

    const { data: categorie, error: categorieError } = await supabase
        .from('categoria')
        .select('id')
        .eq('id_torneo', idTorneo)
        .abortSignal(AbortSignal.timeout(20000));

    if (categorieError) throw categorieError;

    const categoriaIds = new Set((categorie ?? []).map((categoria) => categoria.id));
    const invalidCategoria = payload.find((partita) => !categoriaIds.has(partita.id_categoria));

    if (invalidCategoria) {
        throw new Error('Una o piu partite non appartengono alle categorie del torneo.');
    }

    const now = new Date().toISOString();
    const toInsert: TablesInsert<'partita'>[] = [];
    const toUpdate: Array<TablesUpdate<'partita'> & { id: number }> = [];

    payload.forEach((partita) => {
        const nextPartita: TablesUpdate<'partita'> = {
            id_categoria: partita.id_categoria,
            id_squadra_casa: partita.id_squadra_casa,
            id_squadra_ospite: partita.id_squadra_ospite,
            fase: partita.fase,
            girone: partita.girone ?? 'A',
            giornata: partita.giornata ?? null,
            fischio_inizio: partita.fischio_inizio ?? null,
            data_ultima_modifica: now,
        };

        if ('campo_svolgimento' in partita) {
            nextPartita.campo_svolgimento = partita.campo_svolgimento ?? null;
        }

        if ('id_arbitro' in partita) {
            nextPartita.id_arbitro = partita.id_arbitro ?? null;
        }

        if (partita.id) {
            toUpdate.push({ id: partita.id, ...nextPartita });
        } else {
            toInsert.push(nextPartita as TablesInsert<'partita'>);
        }
    });

    const updated = [];

    for (const partita of toUpdate) {
        const { id, ...updatePayload } = partita;
        const { data, error } = await supabase
            .from('partita')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        updated.push(data);
    }

    const { data: inserted, error: insertError } = toInsert.length
        ? await supabase.from('partita').insert(toInsert).select()
        : { data: [], error: null };

    if (insertError) throw insertError;

    return [...updated, ...(inserted ?? [])];
}

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
}) {
    const rpcPayload = removeUndefined({
        torneo: payload.torneo,
        categorie: payload.categorie.map((categoria, index) => ({
            ...categoria,
            client_id: String(index),
        })),
        squadre: payload.squadre.map((squadra, index) => ({
            ...squadra,
            client_id: String(index),
        })),
    });

    const { data: rpcData, error: rpcError } = await (supabase as any).rpc('create_torneo_setup', {
        payload: rpcPayload,
    });

    if (rpcError) {
        if (!isMissingRpcError(rpcError)) throw rpcError;
    } else if (
        rpcData?.torneo &&
        Array.isArray(rpcData?.categorie) &&
        Array.isArray(rpcData?.squadre)
    ) {
        return rpcData as {
            torneo: Tables<'torneo'>;
            categorie: Tables<'categoria'>[];
            squadre: Tables<'squadra'>[];
        };
    } else {
        throw new Error('Risposta RPC create_torneo_setup non valida.');
    }

    // Fallback RPC assente: questa sequenza client-side non e' atomica.
    // Applicare docs/database/atomic-rpc.sql per rendere transazionale la creazione torneo.
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

    return {
        torneo,
        categorie: categorie ?? [],
        squadre: squadre ?? [],
    };
}

export type createTorneoSetupType = Awaited<ReturnType<typeof createTorneoSetup>>;

export type updateTorneoSetupPayload = {
    torneo: updateTorneoPayload;
    categorie: Array<{
        id: number;
        payload: updateCategoriaTorneoPayload;
    }>;
    calendario: upsertCalendarioTorneoPayload;
};

export async function updateTorneoSetup(idTorneo: number, payload: updateTorneoSetupPayload) {
    const normalizedPayload = removeUndefined(payload);
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc('update_torneo_setup', {
        p_id_torneo: idTorneo,
        payload: normalizedPayload,
    });

    if (rpcError) {
        if (!isMissingRpcError(rpcError)) throw rpcError;
    } else if (rpcData?.torneo && Array.isArray(rpcData?.categorie) && Array.isArray(rpcData?.partite)) {
        return rpcData as {
            torneo: Tables<'torneo'>;
            categorie: Tables<'categoria'>[];
            partite: Tables<'partita'>[];
        };
    } else {
        throw new Error('Risposta RPC update_torneo_setup non valida.');
    }

    // Fallback RPC assente: payload gia validato, ma le scritture client-side non sono atomiche.
    const torneo = await updateTorneo(idTorneo, normalizedPayload.torneo);
    const categorie = [];

    for (const categoria of normalizedPayload.categorie) {
        categorie.push(await updateCategoriaTorneo(categoria.id, categoria.payload));
    }

    const partite = await upsertCalendarioTorneo(idTorneo, normalizedPayload.calendario);

    return { torneo, categorie, partite };
}

export type updateTorneoSetupType = Awaited<ReturnType<typeof updateTorneoSetup>>;

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
