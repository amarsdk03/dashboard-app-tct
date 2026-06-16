-- Proposed server-side RPC functions for multi-step admin writes.
--
-- Supabase executes each function call in a single PostgreSQL transaction. If
-- any INSERT/UPDATE raises an error, PostgreSQL rolls back every write done by
-- that function call, avoiding partial tournament/team/player setup.
--
-- Expected client calls:
--   supabase.rpc('create_giocatore_con_iscrizione', { payload: jsonb })
--   supabase.rpc('create_squadra_con_roster', { payload: jsonb })
--   supabase.rpc('create_torneo_setup', { payload: jsonb })

create or replace function public.create_giocatore_con_iscrizione(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
    v_giocatore giocatore%rowtype;
    v_iscrizione iscrizione%rowtype;
    v_player jsonb := payload->'giocatore';
    v_registration jsonb := payload->'iscrizione';
begin
    insert into giocatore (
        nome,
        cognome,
        link_foto,
        nazionalita,
        data_nascita,
        ruolo_principale,
        piede_principale,
        nome_maglia,
        numero_maglia,
        username_ig,
        is_capitano,
        altezza,
        peso
    )
    values (
        v_player->>'nome',
        v_player->>'cognome',
        nullif(v_player->>'link_foto', ''),
        nullif(v_player->>'nazionalita', ''),
        nullif(v_player->>'data_nascita', '')::date,
        nullif(v_player->>'ruolo_principale', '')::ruolo_giocatore,
        nullif(v_player->>'piede_principale', '')::piede_principale,
        nullif(v_player->>'nome_maglia', ''),
        nullif(v_player->>'numero_maglia', ''),
        nullif(v_player->>'username_ig', ''),
        coalesce((v_player->>'is_capitano')::boolean, false),
        nullif(v_player->>'altezza', '')::numeric,
        nullif(v_player->>'peso', '')::numeric
    )
    returning * into v_giocatore;

    insert into iscrizione (
        id_giocatore,
        id_torneo,
        id_squadra,
        dettagli
    )
    values (
        v_giocatore.id,
        (v_registration->>'id_torneo')::int,
        (v_registration->>'id_squadra')::int,
        nullif(v_registration->>'dettagli', '')
    )
    returning * into v_iscrizione;

    return jsonb_build_object(
        'giocatore', to_jsonb(v_giocatore),
        'iscrizione', to_jsonb(v_iscrizione)
    );
end;
$$;

create or replace function public.create_squadra_con_roster(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
    v_squadra squadra%rowtype;
    v_giocatore giocatore%rowtype;
    v_iscrizione iscrizione%rowtype;
    v_roster_item jsonb;
    v_player jsonb;
    v_id_torneo int := (payload->>'id_torneo')::int;
    v_requested_captain text := nullif(payload->>'id_capitano', '');
    v_resolved_captain int := nullif(payload->'squadra'->>'id_capitano', '')::int;
    v_iscrizioni jsonb := '[]'::jsonb;
begin
    insert into squadra (
        nome,
        acronimo,
        link_stemma,
        colore_squadra,
        username_ig,
        id_capitano
    )
    values (
        payload->'squadra'->>'nome',
        payload->'squadra'->>'acronimo',
        nullif(payload->'squadra'->>'link_stemma', ''),
        nullif(payload->'squadra'->>'colore_squadra', ''),
        nullif(payload->'squadra'->>'username_ig', ''),
        nullif(payload->'squadra'->>'id_capitano', '')::int
    )
    returning * into v_squadra;

    for v_roster_item in
        select value from jsonb_array_elements(coalesce(payload->'roster', '[]'::jsonb))
    loop
        if v_roster_item ? 'id_giocatore' then
            select *
            into v_giocatore
            from giocatore
            where id = (v_roster_item->>'id_giocatore')::int;

            if not found then
                raise exception 'Giocatore % non trovato', v_roster_item->>'id_giocatore';
            end if;
        else
            v_player := v_roster_item->'giocatore';

            insert into giocatore (
                nome,
                cognome,
                link_foto,
                nazionalita,
                data_nascita,
                ruolo_principale,
                piede_principale,
                nome_maglia,
                numero_maglia,
                username_ig,
                is_capitano,
                altezza,
                peso
            )
            values (
                v_player->>'nome',
                v_player->>'cognome',
                nullif(v_player->>'link_foto', ''),
                nullif(v_player->>'nazionalita', ''),
                nullif(v_player->>'data_nascita', '')::date,
                nullif(v_player->>'ruolo_principale', '')::ruolo_giocatore,
                nullif(v_player->>'piede_principale', '')::piede_principale,
                nullif(v_player->>'nome_maglia', ''),
                nullif(v_player->>'numero_maglia', ''),
                nullif(v_player->>'username_ig', ''),
                coalesce((v_player->>'is_capitano')::boolean, false),
                nullif(v_player->>'altezza', '')::numeric,
                nullif(v_player->>'peso', '')::numeric
            )
            returning * into v_giocatore;

            if v_requested_captain is not null
                and v_requested_captain = coalesce(v_roster_item->>'client_id', '')
            then
                v_resolved_captain := v_giocatore.id;
            end if;
        end if;

        if v_requested_captain is not null and v_requested_captain = v_giocatore.id::text then
            v_resolved_captain := v_giocatore.id;
        end if;

        insert into iscrizione (
            id_giocatore,
            id_squadra,
            id_torneo,
            dettagli
        )
        values (
            v_giocatore.id,
            v_squadra.id,
            v_id_torneo,
            nullif(v_roster_item->>'dettagli', '')
        )
        returning * into v_iscrizione;

        v_iscrizioni := v_iscrizioni || jsonb_build_array(to_jsonb(v_iscrizione));
    end loop;

    if v_resolved_captain is distinct from v_squadra.id_capitano then
        update squadra
        set id_capitano = v_resolved_captain,
            data_ultima_modifica = now()
        where id = v_squadra.id
        returning * into v_squadra;
    end if;

    return jsonb_build_object(
        'squadra', to_jsonb(v_squadra),
        'iscrizioni', v_iscrizioni
    );
end;
$$;

create or replace function public.create_torneo_setup(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
    v_torneo torneo%rowtype;
    v_categoria categoria%rowtype;
    v_squadra squadra%rowtype;
    v_partita partita%rowtype;
    v_categoria_item jsonb;
    v_squadra_item jsonb;
    v_partita_item jsonb;
    v_categoria_ids jsonb := '{}'::jsonb;
    v_squadra_ids jsonb := '{}'::jsonb;
    v_categorie jsonb := '[]'::jsonb;
    v_squadre jsonb := '[]'::jsonb;
    v_partite jsonb := '[]'::jsonb;
    v_categoria_id int;
    v_squadra_casa_id int;
    v_squadra_ospite_id int;
begin
    insert into torneo (
        nome,
        descrizione,
        data_inizio,
        data_fine,
        logo_torneo,
        svolto_in
    )
    values (
        payload->'torneo'->>'nome',
        nullif(payload->'torneo'->>'descrizione', ''),
        nullif(payload->'torneo'->>'data_inizio', '')::date,
        nullif(payload->'torneo'->>'data_fine', '')::date,
        nullif(payload->'torneo'->>'logo_torneo', ''),
        nullif(payload->'torneo'->>'svolto_in', '')::int
    )
    returning * into v_torneo;

    for v_categoria_item in
        select value from jsonb_array_elements(coalesce(payload->'categorie', '[]'::jsonb))
    loop
        insert into categoria (
            id_torneo,
            nome,
            num_gironi,
            fasi_partite,
            durata_partita,
            num_qualificate,
            num_eliminate,
            num_playoff
        )
        values (
            v_torneo.id,
            v_categoria_item->>'nome',
            (v_categoria_item->>'num_gironi')::int,
            array(select jsonb_array_elements_text(coalesce(v_categoria_item->'fasi_partite', '[]'::jsonb))),
            nullif(v_categoria_item->>'durata_partita', '')::int,
            coalesce(nullif(v_categoria_item->>'num_qualificate', '')::int, 0),
            coalesce(nullif(v_categoria_item->>'num_eliminate', '')::int, 0),
            coalesce(nullif(v_categoria_item->>'num_playoff', '')::int, 0)
        )
        returning * into v_categoria;

        if v_categoria_item ? 'client_id' then
            v_categoria_ids := jsonb_set(
                v_categoria_ids,
                array[v_categoria_item->>'client_id'],
                to_jsonb(v_categoria.id),
                true
            );
        end if;

        v_categorie := v_categorie || jsonb_build_array(to_jsonb(v_categoria));
    end loop;

    for v_squadra_item in
        select value from jsonb_array_elements(coalesce(payload->'squadre', '[]'::jsonb))
    loop
        insert into squadra (
            nome,
            acronimo,
            colore_squadra,
            link_stemma,
            username_ig
        )
        values (
            v_squadra_item->>'nome',
            v_squadra_item->>'acronimo',
            nullif(v_squadra_item->>'colore_squadra', ''),
            nullif(v_squadra_item->>'link_stemma', ''),
            nullif(v_squadra_item->>'username_ig', '')
        )
        returning * into v_squadra;

        if v_squadra_item ? 'client_id' then
            v_squadra_ids := jsonb_set(
                v_squadra_ids,
                array[v_squadra_item->>'client_id'],
                to_jsonb(v_squadra.id),
                true
            );
        end if;

        v_squadre := v_squadre || jsonb_build_array(to_jsonb(v_squadra));
    end loop;

    for v_partita_item in
        select value from jsonb_array_elements(coalesce(payload->'partite', '[]'::jsonb))
    loop
        v_categoria_id := coalesce(
            nullif(v_partita_item->>'id_categoria', '')::int,
            nullif(v_categoria_ids->>(v_partita_item->>'client_categoria_id'), '')::int
        );
        v_squadra_casa_id := coalesce(
            nullif(v_partita_item->>'id_squadra_casa', '')::int,
            nullif(v_squadra_ids->>(v_partita_item->>'client_squadra_casa_id'), '')::int
        );
        v_squadra_ospite_id := coalesce(
            nullif(v_partita_item->>'id_squadra_ospite', '')::int,
            nullif(v_squadra_ids->>(v_partita_item->>'client_squadra_ospite_id'), '')::int
        );

        insert into partita (
            id_categoria,
            id_squadra_casa,
            id_squadra_ospite,
            fase,
            girone,
            giornata,
            fischio_inizio,
            campo_svolgimento,
            id_arbitro,
            mvp_partita,
            highlights_yt,
            link_post_ig,
            vinta_a_tavolino
        )
        values (
            v_categoria_id,
            v_squadra_casa_id,
            v_squadra_ospite_id,
            v_partita_item->>'fase',
            coalesce(nullif(v_partita_item->>'girone', ''), 'A'),
            nullif(v_partita_item->>'giornata', '')::int,
            nullif(v_partita_item->>'fischio_inizio', '')::timestamptz,
            nullif(v_partita_item->>'campo_svolgimento', '')::int,
            nullif(v_partita_item->>'id_arbitro', '')::int,
            nullif(v_partita_item->>'mvp_partita', '')::int,
            nullif(v_partita_item->>'highlights_yt', ''),
            nullif(v_partita_item->>'link_post_ig', ''),
            coalesce(
                nullif(v_partita_item->>'vinta_a_tavolino', '')::vittoria_tavolino,
                'No'::vittoria_tavolino
            )
        )
        returning * into v_partita;

        v_partite := v_partite || jsonb_build_array(to_jsonb(v_partita));
    end loop;

    return jsonb_build_object(
        'torneo', to_jsonb(v_torneo),
        'categorie', v_categorie,
        'squadre', v_squadre,
        'partite', v_partite
    );
end;
$$;

create or replace function public.update_torneo_setup(p_id_torneo int, payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
    v_torneo torneo%rowtype;
    v_categoria categoria%rowtype;
    v_partita partita%rowtype;
    v_categoria_item jsonb;
    v_partita_item jsonb;
    v_categorie jsonb := '[]'::jsonb;
    v_partite jsonb := '[]'::jsonb;
begin
    update torneo
    set nome = payload->'torneo'->>'nome',
        descrizione = nullif(payload->'torneo'->>'descrizione', ''),
        data_inizio = nullif(payload->'torneo'->>'data_inizio', '')::date,
        data_fine = nullif(payload->'torneo'->>'data_fine', '')::date,
        logo_torneo = nullif(payload->'torneo'->>'logo_torneo', ''),
        svolto_in = nullif(payload->'torneo'->>'svolto_in', '')::int,
        data_ultima_modifica = now()
    where id = p_id_torneo
    returning * into v_torneo;

    if not found then
        raise exception 'Torneo % non trovato', p_id_torneo;
    end if;

    for v_categoria_item in
        select value from jsonb_array_elements(coalesce(payload->'categorie', '[]'::jsonb))
    loop
        update categoria
        set nome = v_categoria_item->'payload'->>'nome',
            num_gironi = (v_categoria_item->'payload'->>'num_gironi')::int,
            durata_partita = nullif(v_categoria_item->'payload'->>'durata_partita', '')::int,
            fasi_partite = array(
                select jsonb_array_elements_text(
                    coalesce(v_categoria_item->'payload'->'fasi_partite', '[]'::jsonb)
                )
            ),
            num_qualificate = coalesce(nullif(v_categoria_item->'payload'->>'num_qualificate', '')::int, 0),
            num_playoff = coalesce(nullif(v_categoria_item->'payload'->>'num_playoff', '')::int, 0),
            num_eliminate = coalesce(nullif(v_categoria_item->'payload'->>'num_eliminate', '')::int, 0),
            data_ultima_modifica = now()
        where id = (v_categoria_item->>'id')::int
          and id_torneo = p_id_torneo
        returning * into v_categoria;

        if not found then
            raise exception 'Categoria % non trovata nel torneo %', v_categoria_item->>'id', p_id_torneo;
        end if;

        v_categorie := v_categorie || jsonb_build_array(to_jsonb(v_categoria));
    end loop;

    for v_partita_item in
        select value from jsonb_array_elements(coalesce(payload->'calendario', '[]'::jsonb))
    loop
        if v_partita_item ? 'id' and nullif(v_partita_item->>'id', '') is not null then
            update partita
            set id_categoria = (v_partita_item->>'id_categoria')::int,
                id_squadra_casa = (v_partita_item->>'id_squadra_casa')::int,
                id_squadra_ospite = (v_partita_item->>'id_squadra_ospite')::int,
                fase = v_partita_item->>'fase',
                girone = coalesce(nullif(v_partita_item->>'girone', ''), 'A'),
                giornata = nullif(v_partita_item->>'giornata', '')::int,
                fischio_inizio = nullif(v_partita_item->>'fischio_inizio', '')::timestamptz,
                campo_svolgimento = nullif(v_partita_item->>'campo_svolgimento', '')::int,
                id_arbitro = nullif(v_partita_item->>'id_arbitro', '')::int,
                data_ultima_modifica = now()
            where id = (v_partita_item->>'id')::int
              and id_categoria in (select id from categoria where id_torneo = p_id_torneo)
            returning * into v_partita;

            if not found then
                raise exception 'Partita % non trovata nel torneo %', v_partita_item->>'id', p_id_torneo;
            end if;
        else
            insert into partita (
                id_categoria,
                id_squadra_casa,
                id_squadra_ospite,
                fase,
                girone,
                giornata,
                fischio_inizio,
                campo_svolgimento,
                id_arbitro
            )
            values (
                (v_partita_item->>'id_categoria')::int,
                (v_partita_item->>'id_squadra_casa')::int,
                (v_partita_item->>'id_squadra_ospite')::int,
                v_partita_item->>'fase',
                coalesce(nullif(v_partita_item->>'girone', ''), 'A'),
                nullif(v_partita_item->>'giornata', '')::int,
                nullif(v_partita_item->>'fischio_inizio', '')::timestamptz,
                nullif(v_partita_item->>'campo_svolgimento', '')::int,
                nullif(v_partita_item->>'id_arbitro', '')::int
            )
            returning * into v_partita;
        end if;

        v_partite := v_partite || jsonb_build_array(to_jsonb(v_partita));
    end loop;

    return jsonb_build_object(
        'torneo', to_jsonb(v_torneo),
        'categorie', v_categorie,
        'partite', v_partite
    );
end;
$$;
