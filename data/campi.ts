import { supabase } from '@/lib/supabase';

export async function getListaCampi() {
    const query = supabase
        .from('campo')
        .select(`
            id,
            nome,
            indirizzo,
            dettagli,
            link_google_maps
        `)
        .abortSignal(AbortSignal.timeout(20000));

    const { data, error } = await query;
    if (error) throw error;

    return data;
}

export type listaCampiType = Awaited<ReturnType<typeof getListaCampi>>[number];