import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/database.types';

type ClassificaAccumulator = {
    categoria_id: number | null;
    categoria_nome: string | null;
    girone: string | null;
    squadra_id: number;
    squadra_nome: string;
    squadra_acronimo: string | null;
    squadra_colore: string | null;
    squadra_stemma: string | null;
    giocate: number;
    vinte: number;
    pareggiate: number;
    perse: number;
    punti: number;
    goal_fatti: number;
    goal_subiti: number;
};

function makeClassificaKey(categoriaId: number | null, girone: string | null, squadraId: number) {
    return `${categoriaId ?? 'no-categoria'}:${girone ?? 'no-girone'}:${squadraId}`;
}

function getOrCreateClassificaRow(
    rows: Map<string, ClassificaAccumulator>,
    params: Pick<
        ClassificaAccumulator,
        | 'categoria_id'
        | 'categoria_nome'
        | 'girone'
        | 'squadra_id'
        | 'squadra_nome'
        | 'squadra_acronimo'
        | 'squadra_colore'
        | 'squadra_stemma'
    >
) {
    const key = makeClassificaKey(params.categoria_id, params.girone, params.squadra_id);
    const current = rows.get(key);

    if (current) return current;

    const nextRow: ClassificaAccumulator = {
        ...params,
        giocate: 0,
        vinte: 0,
        pareggiate: 0,
        perse: 0,
        punti: 0,
        goal_fatti: 0,
        goal_subiti: 0,
    };

    rows.set(key, nextRow);

    return nextRow;
}

export async function getListaTornei() {
    const query = supabase
        .from('torneo')
        .select(
            `
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
        `
        )
        .order('id', { ascending: false })
        .abortSignal(AbortSignal.timeout(20000));

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type listaTorneiType = Awaited<ReturnType<typeof getListaTornei>>;

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

export type categorieClassificaType = Awaited<ReturnType<typeof getCategorieClassifica>>;

export async function getClassificheTorneo(idTorneo: number) {
    const { data, error } = await supabase
        .from('risultati_partite')
        .select(
            `
            torneo_id,
            categoria_id,
            categoria_nome,
            girone,
            goal_casa,
            goal_ospite,
            squadra_casa_id,
            squadra_casa_nome,
            squadra_casa_acronimo,
            squadra_casa_colore,
            squadra_casa_stemma,
            squadra_ospite_id,
            squadra_ospite_nome,
            squadra_ospite_acronimo,
            squadra_ospite_colore,
            squadra_ospite_stemma
        `
        )
        .eq('torneo_id', idTorneo)
        .abortSignal(AbortSignal.timeout(20000));

    if (error) throw error;

    const rows = new Map<string, ClassificaAccumulator>();

    (data ?? []).forEach((partita) => {
        if (
            partita.squadra_casa_id == null ||
            partita.squadra_ospite_id == null ||
            partita.squadra_casa_nome == null ||
            partita.squadra_ospite_nome == null ||
            partita.goal_casa == null ||
            partita.goal_ospite == null
        ) {
            return;
        }

        const casa = getOrCreateClassificaRow(rows, {
            categoria_id: partita.categoria_id,
            categoria_nome: partita.categoria_nome,
            girone: partita.girone,
            squadra_id: partita.squadra_casa_id,
            squadra_nome: partita.squadra_casa_nome,
            squadra_acronimo: partita.squadra_casa_acronimo,
            squadra_colore: partita.squadra_casa_colore,
            squadra_stemma: partita.squadra_casa_stemma,
        });

        const ospite = getOrCreateClassificaRow(rows, {
            categoria_id: partita.categoria_id,
            categoria_nome: partita.categoria_nome,
            girone: partita.girone,
            squadra_id: partita.squadra_ospite_id,
            squadra_nome: partita.squadra_ospite_nome,
            squadra_acronimo: partita.squadra_ospite_acronimo,
            squadra_colore: partita.squadra_ospite_colore,
            squadra_stemma: partita.squadra_ospite_stemma,
        });

        casa.giocate += 1;
        casa.goal_fatti += partita.goal_casa;
        casa.goal_subiti += partita.goal_ospite;

        ospite.giocate += 1;
        ospite.goal_fatti += partita.goal_ospite;
        ospite.goal_subiti += partita.goal_casa;

        if (partita.goal_casa > partita.goal_ospite) {
            casa.vinte += 1;
            casa.punti += 3;
            ospite.perse += 1;
        } else if (partita.goal_casa < partita.goal_ospite) {
            ospite.vinte += 1;
            ospite.punti += 3;
            casa.perse += 1;
        } else {
            casa.pareggiate += 1;
            casa.punti += 1;
            ospite.pareggiate += 1;
            ospite.punti += 1;
        }
    });

    const ordered = Array.from(rows.values()).sort((a, b) => {
        const categoriaCompare = (a.categoria_nome ?? '').localeCompare(
            b.categoria_nome ?? '',
            'it'
        );
        if (categoriaCompare !== 0) return categoriaCompare;

        const gironeCompare = (a.girone ?? '').localeCompare(b.girone ?? '', 'it');
        if (gironeCompare !== 0) return gironeCompare;

        if (b.punti !== a.punti) return b.punti - a.punti;

        const diffA = a.goal_fatti - a.goal_subiti;
        const diffB = b.goal_fatti - b.goal_subiti;
        if (diffB !== diffA) return diffB - diffA;

        if (b.goal_fatti !== a.goal_fatti) return b.goal_fatti - a.goal_fatti;

        return a.squadra_nome.localeCompare(b.squadra_nome, 'it');
    });

    const posizioneByGroup = new Map<string, number>();

    return ordered.map((row) => {
        const groupKey = `${row.categoria_id ?? 'no-categoria'}:${row.girone ?? 'no-girone'}`;
        const posizione = (posizioneByGroup.get(groupKey) ?? 0) + 1;
        posizioneByGroup.set(groupKey, posizione);

        return {
            ...row,
            differenza_reti: row.goal_fatti - row.goal_subiti,
            posizione,
        };
    });
}

export type classificheTorneoType = Awaited<ReturnType<typeof getClassificheTorneo>>;

export async function getCategorieGestioneTorneo(idTorneo: number) {
    const { data: categorie, error: categorieError } = await supabase
        .from('categoria')
        .select('*')
        .eq('id_torneo', idTorneo)
        .order('nome', { ascending: true })
        .abortSignal(AbortSignal.timeout(20000));

    if (categorieError) throw categorieError;

    const { data: partite, error: partiteError } = await supabase
        .from('risultati_partite')
        .select('categoria_id, girone, squadra_casa_id, squadra_ospite_id, id_partita')
        .eq('torneo_id', idTorneo)
        .abortSignal(AbortSignal.timeout(20000));

    if (partiteError) throw partiteError;

    const statsByCategoria = new Map<
        number,
        {
            gironi: Set<string>;
            squadre: Set<number>;
            partite: Set<number>;
        }
    >();

    (partite ?? []).forEach((partita) => {
        if (!partita.categoria_id) return;

        const current = statsByCategoria.get(partita.categoria_id) ?? {
            gironi: new Set<string>(),
            squadre: new Set<number>(),
            partite: new Set<number>(),
        };

        if (partita.girone) current.gironi.add(partita.girone);
        if (partita.squadra_casa_id) current.squadre.add(partita.squadra_casa_id);
        if (partita.squadra_ospite_id) current.squadre.add(partita.squadra_ospite_id);
        if (partita.id_partita) current.partite.add(partita.id_partita);

        statsByCategoria.set(partita.categoria_id, current);
    });

    return ((categorie ?? []) as Tables<'categoria'>[]).map((categoria) => {
        const stats = statsByCategoria.get(categoria.id);

        return {
            ...categoria,
            gironi_calendario: Array.from(stats?.gironi ?? []).sort((a, b) =>
                a.localeCompare(b, 'it')
            ),
            squadre_count: stats?.squadre.size ?? 0,
            partite_count: stats?.partite.size ?? 0,
        };
    });
}

export type categorieGestioneTorneoType = Awaited<ReturnType<typeof getCategorieGestioneTorneo>>;
