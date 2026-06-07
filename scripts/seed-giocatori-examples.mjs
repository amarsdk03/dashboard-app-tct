import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadLocalEnv() {
    const envPath = resolve(process.cwd(), '.env.local');

    try {
        const file = readFileSync(envPath, 'utf8');
        for (const line of file.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
            const [key, ...rest] = trimmed.split('=');
            if (!process.env[key]) {
                process.env[key] = rest.join('=').replace(/^["']|["']$/g, '');
            }
        }
    } catch {
        // .env.local is optional; explicit environment variables can be used instead.
    }
}

function requiredEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

function avatarUrl(name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=ffffff&bold=true&size=256`;
}

const EXAMPLE_PLAYERS = [
    {
        nome: 'Angelo',
        cognome: 'Del Piero',
        nazionalita: 'Italia',
        ruolo_principale: 'Attaccante',
        piede_principale: 'Destro',
        nome_maglia: 'Del Piero',
        numero_maglia: '10',
        username_ig: '@angelogol',
        is_capitano: false,
    },
    {
        nome: 'Lamine',
        cognome: 'Yamal',
        nazionalita: 'Spagna',
        ruolo_principale: 'Attaccante',
        piede_principale: 'Sinistro',
        nome_maglia: 'Yamal',
        numero_maglia: '19',
        username_ig: '@lamineyamal',
        is_capitano: false,
    },
    {
        nome: 'Federico',
        cognome: 'Dimarco',
        nazionalita: 'Italia',
        ruolo_principale: 'Difensore',
        piede_principale: 'Sinistro',
        nome_maglia: 'Dimarco',
        numero_maglia: '32',
        username_ig: '@fededimarco',
        is_capitano: false,
    },
    {
        nome: 'Amar',
        cognome: 'Sidkir',
        nazionalita: 'Marocco',
        ruolo_principale: 'Centrocampista',
        piede_principale: 'Destro',
        nome_maglia: 'Sidkir',
        numero_maglia: '8',
        username_ig: '@amarsidkir',
        is_capitano: true,
    },
    {
        nome: 'Alessandro',
        cognome: 'Gremes',
        nazionalita: 'Italia',
        ruolo_principale: 'Portiere',
        piede_principale: 'Destro',
        nome_maglia: 'Gremes',
        numero_maglia: '30',
        username_ig: '@alessandrogremes',
        is_capitano: false,
    },
];

async function selectTargetTorneo(supabase) {
    if (process.env.SEED_TORNEO_ID) {
        return Number(process.env.SEED_TORNEO_ID);
    }

    const { data, error } = await supabase
        .from('torneo')
        .select('id, nome, data_inizio')
        .order('data_inizio', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    if (!data?.id) throw new Error('No torneo found. Set SEED_TORNEO_ID.');

    console.log(`Using torneo ${data.id}: ${data.nome}`);
    return data.id;
}

async function selectTargetSquadra(supabase, torneoId) {
    if (process.env.SEED_SQUADRA_ID) {
        return Number(process.env.SEED_SQUADRA_ID);
    }

    const { data, error } = await supabase
        .from('ricerca_squadre')
        .select('s_id, s_nome')
        .eq('t_id', torneoId)
        .order('s_nome', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    if (!data?.s_id) throw new Error('No squadra found for target torneo. Set SEED_SQUADRA_ID.');

    console.log(`Using squadra ${data.s_id}: ${data.s_nome}`);
    return data.s_id;
}

async function findExistingPlayer(supabase, player) {
    const { data, error } = await supabase
        .from('giocatore')
        .select('*')
        .eq('nome', player.nome)
        .eq('cognome', player.cognome)
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function ensurePlayer(supabase, player) {
    const existing = await findExistingPlayer(supabase, player);
    if (existing) {
        console.log(`Reusing giocatore ${existing.id}: ${player.nome} ${player.cognome}`);
        return existing;
    }

    const fullName = `${player.nome} ${player.cognome}`;
    const { data, error } = await supabase
        .from('giocatore')
        .insert({
            ...player,
            link_foto: avatarUrl(fullName),
        })
        .select()
        .single();

    if (error) throw error;
    console.log(`Created giocatore ${data.id}: ${fullName}`);
    return data;
}

async function ensureIscrizione(supabase, giocatoreId, torneoId, squadraId) {
    const { data: existing, error: existingError } = await supabase
        .from('iscrizione')
        .select('*')
        .eq('id_giocatore', giocatoreId)
        .eq('id_torneo', torneoId)
        .limit(1)
        .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
        console.log(`Reusing iscrizione ${existing.id} for giocatore ${giocatoreId}`);
        return existing;
    }

    const { data, error } = await supabase
        .from('iscrizione')
        .insert({
            id_giocatore: giocatoreId,
            id_torneo: torneoId,
            id_squadra: squadraId,
            dettagli: 'Giocatore esempio creato dallo script seed dashboard.',
        })
        .select()
        .single();

    if (error) throw error;
    console.log(`Created iscrizione ${data.id} for giocatore ${giocatoreId}`);
    return data;
}

async function main() {
    loadLocalEnv();

    const supabaseUrl = requiredEnv('EXPO_PUBLIC_SUPABASE_URL');
    const supabaseKey = requiredEnv('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    const adminEmail = requiredEnv('SEED_ADMIN_EMAIL');
    const adminPassword = requiredEnv('SEED_ADMIN_PASSWORD');

    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });

    const { error: authError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
    });

    if (authError) throw authError;

    const torneoId = await selectTargetTorneo(supabase);
    const squadraId = await selectTargetSquadra(supabase, torneoId);

    for (const player of EXAMPLE_PLAYERS) {
        const giocatore = await ensurePlayer(supabase, player);
        await ensureIscrizione(supabase, giocatore.id, torneoId, squadraId);
    }

    await supabase.auth.signOut();
    console.log('Seed completed.');
}

main().catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
});
