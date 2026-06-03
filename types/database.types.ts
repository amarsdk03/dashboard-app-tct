export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assegnazione_trofeo: {
        Row: {
          data_creazione: string
          data_ultima_modifica: string
          dettagli: string | null
          id: number
          id_giocatore: number
          id_torneo: number
          id_trofeo: number
        }
        Insert: {
          data_creazione?: string
          data_ultima_modifica?: string
          dettagli?: string | null
          id?: number
          id_giocatore: number
          id_torneo: number
          id_trofeo: number
        }
        Update: {
          data_creazione?: string
          data_ultima_modifica?: string
          dettagli?: string | null
          id?: number
          id_giocatore?: number
          id_torneo?: number
          id_trofeo?: number
        }
        Relationships: [
          {
            foreignKeyName: "assegnazione_trofeo_id_giocatore_fkey"
            columns: ["id_giocatore"]
            isOneToOne: false
            referencedRelation: "azioni_giocatori"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "assegnazione_trofeo_id_giocatore_fkey"
            columns: ["id_giocatore"]
            isOneToOne: false
            referencedRelation: "giocatore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assegnazione_trofeo_id_giocatore_fkey"
            columns: ["id_giocatore"]
            isOneToOne: false
            referencedRelation: "ricerca_giocatori"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "assegnazione_trofeo_id_giocatore_fkey"
            columns: ["id_giocatore"]
            isOneToOne: false
            referencedRelation: "ricerca_squadre"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "assegnazione_trofeo_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "azioni_partite"
            referencedColumns: ["t_id"]
          },
          {
            foreignKeyName: "assegnazione_trofeo_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "lista_categorie"
            referencedColumns: ["torneo_id"]
          },
          {
            foreignKeyName: "assegnazione_trofeo_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "ricerca_squadre"
            referencedColumns: ["t_id"]
          },
          {
            foreignKeyName: "assegnazione_trofeo_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "risultati_partite"
            referencedColumns: ["torneo_id"]
          },
          {
            foreignKeyName: "assegnazione_trofeo_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "torneo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assegnazione_trofeo_id_trofeo_fkey"
            columns: ["id_trofeo"]
            isOneToOne: false
            referencedRelation: "trofeo"
            referencedColumns: ["id"]
          },
        ]
      }
      azione: {
        Row: {
          assegnamento:
            | Database["public"]["Enums"]["assegnamento_azione"]
            | null
          data_creazione: string
          data_ultima_modifica: string | null
          dettagli: string | null
          id: number
          id_giocatore: number | null
          id_partita: number
          minuto: number | null
          tipo: Database["public"]["Enums"]["tipo_azione"]
        }
        Insert: {
          assegnamento?:
            | Database["public"]["Enums"]["assegnamento_azione"]
            | null
          data_creazione?: string
          data_ultima_modifica?: string | null
          dettagli?: string | null
          id?: number
          id_giocatore?: number | null
          id_partita: number
          minuto?: number | null
          tipo: Database["public"]["Enums"]["tipo_azione"]
        }
        Update: {
          assegnamento?:
            | Database["public"]["Enums"]["assegnamento_azione"]
            | null
          data_creazione?: string
          data_ultima_modifica?: string | null
          dettagli?: string | null
          id?: number
          id_giocatore?: number | null
          id_partita?: number
          minuto?: number | null
          tipo?: Database["public"]["Enums"]["tipo_azione"]
        }
        Relationships: [
          {
            foreignKeyName: "azione_id_giocatore_fkey"
            columns: ["id_giocatore"]
            isOneToOne: false
            referencedRelation: "azioni_giocatori"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "azione_id_giocatore_fkey"
            columns: ["id_giocatore"]
            isOneToOne: false
            referencedRelation: "giocatore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "azione_id_giocatore_fkey"
            columns: ["id_giocatore"]
            isOneToOne: false
            referencedRelation: "ricerca_giocatori"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "azione_id_giocatore_fkey"
            columns: ["id_giocatore"]
            isOneToOne: false
            referencedRelation: "ricerca_squadre"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "azione_id_partita_fkey"
            columns: ["id_partita"]
            isOneToOne: false
            referencedRelation: "azioni_partite"
            referencedColumns: ["p_id"]
          },
          {
            foreignKeyName: "azione_id_partita_fkey"
            columns: ["id_partita"]
            isOneToOne: false
            referencedRelation: "partita"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "azione_id_partita_fkey"
            columns: ["id_partita"]
            isOneToOne: false
            referencedRelation: "risultati_partite"
            referencedColumns: ["id_partita"]
          },
        ]
      }
      campo: {
        Row: {
          data_creazione: string
          data_ultima_modifica: string
          dettagli: string | null
          id: number
          indirizzo: string | null
          link_google_maps: string | null
          nome: string
        }
        Insert: {
          data_creazione?: string
          data_ultima_modifica?: string
          dettagli?: string | null
          id?: number
          indirizzo?: string | null
          link_google_maps?: string | null
          nome: string
        }
        Update: {
          data_creazione?: string
          data_ultima_modifica?: string
          dettagli?: string | null
          id?: number
          indirizzo?: string | null
          link_google_maps?: string | null
          nome?: string
        }
        Relationships: []
      }
      categoria: {
        Row: {
          data_creazione: string
          data_ultima_modifica: string
          durata_partita: number | null
          fasi_partite: string[]
          id: number
          id_torneo: number
          nome: string
          num_eliminate: number
          num_gironi: number
          num_playoff: number
          num_qualificate: number
        }
        Insert: {
          data_creazione?: string
          data_ultima_modifica?: string
          durata_partita?: number | null
          fasi_partite: string[]
          id?: number
          id_torneo: number
          nome: string
          num_eliminate?: number
          num_gironi: number
          num_playoff?: number
          num_qualificate?: number
        }
        Update: {
          data_creazione?: string
          data_ultima_modifica?: string
          durata_partita?: number | null
          fasi_partite?: string[]
          id?: number
          id_torneo?: number
          nome?: string
          num_eliminate?: number
          num_gironi?: number
          num_playoff?: number
          num_qualificate?: number
        }
        Relationships: [
          {
            foreignKeyName: "categoria_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "azioni_partite"
            referencedColumns: ["t_id"]
          },
          {
            foreignKeyName: "categoria_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "lista_categorie"
            referencedColumns: ["torneo_id"]
          },
          {
            foreignKeyName: "categoria_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "ricerca_squadre"
            referencedColumns: ["t_id"]
          },
          {
            foreignKeyName: "categoria_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "risultati_partite"
            referencedColumns: ["torneo_id"]
          },
          {
            foreignKeyName: "categoria_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "torneo"
            referencedColumns: ["id"]
          },
        ]
      }
      giocatore: {
        Row: {
          altezza: number | null
          cognome: string
          data_creazione: string
          data_nascita: string | null
          data_ultima_modifica: string
          id: number
          is_capitano: boolean
          link_foto: string | null
          nazionalita: string | null
          nome: string
          nome_maglia: string | null
          numero_maglia: string | null
          peso: number | null
          piede_principale:
            | Database["public"]["Enums"]["piede_principale"]
            | null
          ruolo_principale:
            | Database["public"]["Enums"]["ruolo_giocatore"]
            | null
          username_ig: string | null
        }
        Insert: {
          altezza?: number | null
          cognome: string
          data_creazione?: string
          data_nascita?: string | null
          data_ultima_modifica?: string
          id?: number
          is_capitano?: boolean
          link_foto?: string | null
          nazionalita?: string | null
          nome: string
          nome_maglia?: string | null
          numero_maglia?: string | null
          peso?: number | null
          piede_principale?:
            | Database["public"]["Enums"]["piede_principale"]
            | null
          ruolo_principale?:
            | Database["public"]["Enums"]["ruolo_giocatore"]
            | null
          username_ig?: string | null
        }
        Update: {
          altezza?: number | null
          cognome?: string
          data_creazione?: string
          data_nascita?: string | null
          data_ultima_modifica?: string
          id?: number
          is_capitano?: boolean
          link_foto?: string | null
          nazionalita?: string | null
          nome?: string
          nome_maglia?: string | null
          numero_maglia?: string | null
          peso?: number | null
          piede_principale?:
            | Database["public"]["Enums"]["piede_principale"]
            | null
          ruolo_principale?:
            | Database["public"]["Enums"]["ruolo_giocatore"]
            | null
          username_ig?: string | null
        }
        Relationships: []
      }
      iscrizione: {
        Row: {
          data_creazione: string
          data_ultima_modifica: string
          dettagli: string | null
          id: number
          id_giocatore: number
          id_squadra: number
          id_torneo: number
        }
        Insert: {
          data_creazione?: string
          data_ultima_modifica?: string
          dettagli?: string | null
          id?: number
          id_giocatore: number
          id_squadra: number
          id_torneo: number
        }
        Update: {
          data_creazione?: string
          data_ultima_modifica?: string
          dettagli?: string | null
          id?: number
          id_giocatore?: number
          id_squadra?: number
          id_torneo?: number
        }
        Relationships: [
          {
            foreignKeyName: "iscrizione_id_giocatore_fkey"
            columns: ["id_giocatore"]
            isOneToOne: false
            referencedRelation: "azioni_giocatori"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "iscrizione_id_giocatore_fkey"
            columns: ["id_giocatore"]
            isOneToOne: false
            referencedRelation: "giocatore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iscrizione_id_giocatore_fkey"
            columns: ["id_giocatore"]
            isOneToOne: false
            referencedRelation: "ricerca_giocatori"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "iscrizione_id_giocatore_fkey"
            columns: ["id_giocatore"]
            isOneToOne: false
            referencedRelation: "ricerca_squadre"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "iscrizione_id_squadra_fkey"
            columns: ["id_squadra"]
            isOneToOne: false
            referencedRelation: "ricerca_squadre"
            referencedColumns: ["s_id"]
          },
          {
            foreignKeyName: "iscrizione_id_squadra_fkey"
            columns: ["id_squadra"]
            isOneToOne: false
            referencedRelation: "risultati_partite"
            referencedColumns: ["squadra_casa_id"]
          },
          {
            foreignKeyName: "iscrizione_id_squadra_fkey"
            columns: ["id_squadra"]
            isOneToOne: false
            referencedRelation: "risultati_partite"
            referencedColumns: ["squadra_ospite_id"]
          },
          {
            foreignKeyName: "iscrizione_id_squadra_fkey"
            columns: ["id_squadra"]
            isOneToOne: false
            referencedRelation: "squadra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iscrizione_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "azioni_partite"
            referencedColumns: ["t_id"]
          },
          {
            foreignKeyName: "iscrizione_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "lista_categorie"
            referencedColumns: ["torneo_id"]
          },
          {
            foreignKeyName: "iscrizione_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "ricerca_squadre"
            referencedColumns: ["t_id"]
          },
          {
            foreignKeyName: "iscrizione_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "risultati_partite"
            referencedColumns: ["torneo_id"]
          },
          {
            foreignKeyName: "iscrizione_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "torneo"
            referencedColumns: ["id"]
          },
        ]
      }
      partita: {
        Row: {
          campo_svolgimento: number | null
          data_creazione: string
          data_ultima_modifica: string
          fase: string
          fischio_inizio: string | null
          giornata: number | null
          girone: string
          highlights_yt: string | null
          id: number
          id_arbitro: number | null
          id_categoria: number
          id_squadra_casa: number
          id_squadra_ospite: number
          link_post_ig: string | null
          mvp_partita: number | null
          vinta_a_tavolino: Database["public"]["Enums"]["vittoria_tavolino"]
        }
        Insert: {
          campo_svolgimento?: number | null
          data_creazione?: string
          data_ultima_modifica?: string
          fase: string
          fischio_inizio?: string | null
          giornata?: number | null
          girone?: string
          highlights_yt?: string | null
          id?: number
          id_arbitro?: number | null
          id_categoria: number
          id_squadra_casa: number
          id_squadra_ospite: number
          link_post_ig?: string | null
          mvp_partita?: number | null
          vinta_a_tavolino?: Database["public"]["Enums"]["vittoria_tavolino"]
        }
        Update: {
          campo_svolgimento?: number | null
          data_creazione?: string
          data_ultima_modifica?: string
          fase?: string
          fischio_inizio?: string | null
          giornata?: number | null
          girone?: string
          highlights_yt?: string | null
          id?: number
          id_arbitro?: number | null
          id_categoria?: number
          id_squadra_casa?: number
          id_squadra_ospite?: number
          link_post_ig?: string | null
          mvp_partita?: number | null
          vinta_a_tavolino?: Database["public"]["Enums"]["vittoria_tavolino"]
        }
        Relationships: [
          {
            foreignKeyName: "partita_campo_svolgimento_fkey"
            columns: ["campo_svolgimento"]
            isOneToOne: false
            referencedRelation: "campo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partita_id_arbitro_fkey"
            columns: ["id_arbitro"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partita_id_categoria_fkey"
            columns: ["id_categoria"]
            isOneToOne: false
            referencedRelation: "azioni_partite"
            referencedColumns: ["c_id"]
          },
          {
            foreignKeyName: "partita_id_categoria_fkey"
            columns: ["id_categoria"]
            isOneToOne: false
            referencedRelation: "categoria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partita_id_categoria_fkey"
            columns: ["id_categoria"]
            isOneToOne: false
            referencedRelation: "lista_categorie"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "partita_id_categoria_fkey"
            columns: ["id_categoria"]
            isOneToOne: false
            referencedRelation: "risultati_partite"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "partita_id_squadra_casa_fkey"
            columns: ["id_squadra_casa"]
            isOneToOne: false
            referencedRelation: "ricerca_squadre"
            referencedColumns: ["s_id"]
          },
          {
            foreignKeyName: "partita_id_squadra_casa_fkey"
            columns: ["id_squadra_casa"]
            isOneToOne: false
            referencedRelation: "risultati_partite"
            referencedColumns: ["squadra_casa_id"]
          },
          {
            foreignKeyName: "partita_id_squadra_casa_fkey"
            columns: ["id_squadra_casa"]
            isOneToOne: false
            referencedRelation: "risultati_partite"
            referencedColumns: ["squadra_ospite_id"]
          },
          {
            foreignKeyName: "partita_id_squadra_casa_fkey"
            columns: ["id_squadra_casa"]
            isOneToOne: false
            referencedRelation: "squadra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partita_id_squadra_ospite_fkey"
            columns: ["id_squadra_ospite"]
            isOneToOne: false
            referencedRelation: "ricerca_squadre"
            referencedColumns: ["s_id"]
          },
          {
            foreignKeyName: "partita_id_squadra_ospite_fkey"
            columns: ["id_squadra_ospite"]
            isOneToOne: false
            referencedRelation: "risultati_partite"
            referencedColumns: ["squadra_casa_id"]
          },
          {
            foreignKeyName: "partita_id_squadra_ospite_fkey"
            columns: ["id_squadra_ospite"]
            isOneToOne: false
            referencedRelation: "risultati_partite"
            referencedColumns: ["squadra_ospite_id"]
          },
          {
            foreignKeyName: "partita_id_squadra_ospite_fkey"
            columns: ["id_squadra_ospite"]
            isOneToOne: false
            referencedRelation: "squadra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partita_mvp_partita_fkey"
            columns: ["mvp_partita"]
            isOneToOne: false
            referencedRelation: "azioni_giocatori"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "partita_mvp_partita_fkey"
            columns: ["mvp_partita"]
            isOneToOne: false
            referencedRelation: "giocatore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partita_mvp_partita_fkey"
            columns: ["mvp_partita"]
            isOneToOne: false
            referencedRelation: "ricerca_giocatori"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "partita_mvp_partita_fkey"
            columns: ["mvp_partita"]
            isOneToOne: false
            referencedRelation: "ricerca_squadre"
            referencedColumns: ["g_id"]
          },
        ]
      }
      squadra: {
        Row: {
          acronimo: string
          colore_squadra: string | null
          data_creazione: string
          data_ultima_modifica: string
          id: number
          id_capitano: number | null
          link_stemma: string | null
          nome: string
          username_ig: string | null
        }
        Insert: {
          acronimo: string
          colore_squadra?: string | null
          data_creazione?: string
          data_ultima_modifica?: string
          id?: number
          id_capitano?: number | null
          link_stemma?: string | null
          nome: string
          username_ig?: string | null
        }
        Update: {
          acronimo?: string
          colore_squadra?: string | null
          data_creazione?: string
          data_ultima_modifica?: string
          id?: number
          id_capitano?: number | null
          link_stemma?: string | null
          nome?: string
          username_ig?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "squadra_id_capitano_fkey"
            columns: ["id_capitano"]
            isOneToOne: false
            referencedRelation: "azioni_giocatori"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "squadra_id_capitano_fkey"
            columns: ["id_capitano"]
            isOneToOne: false
            referencedRelation: "giocatore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squadra_id_capitano_fkey"
            columns: ["id_capitano"]
            isOneToOne: false
            referencedRelation: "ricerca_giocatori"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "squadra_id_capitano_fkey"
            columns: ["id_capitano"]
            isOneToOne: false
            referencedRelation: "ricerca_squadre"
            referencedColumns: ["g_id"]
          },
        ]
      }
      staff: {
        Row: {
          data_creazione: string
          data_ultima_modifica: string
          id: number
          indirizzo_email: string | null
          link_foto: string | null
          nominativo: string
          numero_telefono: string | null
          ruolo: string | null
          username_ig: string | null
        }
        Insert: {
          data_creazione?: string
          data_ultima_modifica?: string
          id?: number
          indirizzo_email?: string | null
          link_foto?: string | null
          nominativo: string
          numero_telefono?: string | null
          ruolo?: string | null
          username_ig?: string | null
        }
        Update: {
          data_creazione?: string
          data_ultima_modifica?: string
          id?: number
          indirizzo_email?: string | null
          link_foto?: string | null
          nominativo?: string
          numero_telefono?: string | null
          ruolo?: string | null
          username_ig?: string | null
        }
        Relationships: []
      }
      torneo: {
        Row: {
          data_creazione: string
          data_fine: string | null
          data_inizio: string | null
          data_ultima_modifica: string
          descrizione: string | null
          id: number
          logo_torneo: string | null
          nome: string
          svolto_in: number | null
        }
        Insert: {
          data_creazione?: string
          data_fine?: string | null
          data_inizio?: string | null
          data_ultima_modifica?: string
          descrizione?: string | null
          id?: number
          logo_torneo?: string | null
          nome: string
          svolto_in?: number | null
        }
        Update: {
          data_creazione?: string
          data_fine?: string | null
          data_inizio?: string | null
          data_ultima_modifica?: string
          descrizione?: string | null
          id?: number
          logo_torneo?: string | null
          nome?: string
          svolto_in?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "torneo_svolto_in_fkey"
            columns: ["svolto_in"]
            isOneToOne: false
            referencedRelation: "campo"
            referencedColumns: ["id"]
          },
        ]
      }
      trofeo: {
        Row: {
          colore: string | null
          data_creazione: string
          data_ultima_modifica: string
          descrizione: string | null
          id: number
          logo: string | null
          titolo: string
        }
        Insert: {
          colore?: string | null
          data_creazione?: string
          data_ultima_modifica?: string
          descrizione?: string | null
          id?: number
          logo?: string | null
          titolo: string
        }
        Update: {
          colore?: string | null
          data_creazione?: string
          data_ultima_modifica?: string
          descrizione?: string | null
          id?: number
          logo?: string | null
          titolo?: string
        }
        Relationships: []
      }
    }
    Views: {
      azioni_giocatori: {
        Row: {
          a_tipo: Database["public"]["Enums"]["tipo_azione"] | null
          g_cognome: string | null
          g_id: number | null
          g_nome: string | null
          n_partite: number | null
          num_mvp: number | null
          total: number | null
        }
        Relationships: []
      }
      azioni_partite: {
        Row: {
          a_assegnamento:
            | Database["public"]["Enums"]["assegnamento_azione"]
            | null
          a_id: number | null
          a_id_giocatore: number | null
          a_tipo: Database["public"]["Enums"]["tipo_azione"] | null
          c_durata_partita: number | null
          c_id: number | null
          c_nome: string | null
          c_num_eliminate: number | null
          c_num_gironi: number | null
          c_num_playoff: number | null
          c_num_qualificate: number | null
          id_squadra_azione: number | null
          p_campo_svolgimento: number | null
          p_cognome: string | null
          p_fase: string | null
          p_fischio_inizio: string | null
          p_girone: string | null
          p_id: number | null
          p_id_arbitro: number | null
          p_id_squadra_casa: number | null
          p_id_squadra_ospite: number | null
          p_mvp_partita: number | null
          p_nome: string | null
          p_nome_squadra_casa: string | null
          p_nome_squadra_ospite: string | null
          p_vinta_a_tavolino:
            | Database["public"]["Enums"]["vittoria_tavolino"]
            | null
          t_id: number | null
          t_logo_torneo: string | null
          t_nome: string | null
          t_svolto_in: number | null
        }
        Relationships: [
          {
            foreignKeyName: "azione_id_giocatore_fkey"
            columns: ["a_id_giocatore"]
            isOneToOne: false
            referencedRelation: "azioni_giocatori"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "azione_id_giocatore_fkey"
            columns: ["a_id_giocatore"]
            isOneToOne: false
            referencedRelation: "giocatore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "azione_id_giocatore_fkey"
            columns: ["a_id_giocatore"]
            isOneToOne: false
            referencedRelation: "ricerca_giocatori"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "azione_id_giocatore_fkey"
            columns: ["a_id_giocatore"]
            isOneToOne: false
            referencedRelation: "ricerca_squadre"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "partita_campo_svolgimento_fkey"
            columns: ["p_campo_svolgimento"]
            isOneToOne: false
            referencedRelation: "campo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partita_id_arbitro_fkey"
            columns: ["p_id_arbitro"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partita_id_squadra_casa_fkey"
            columns: ["p_id_squadra_casa"]
            isOneToOne: false
            referencedRelation: "ricerca_squadre"
            referencedColumns: ["s_id"]
          },
          {
            foreignKeyName: "partita_id_squadra_casa_fkey"
            columns: ["p_id_squadra_casa"]
            isOneToOne: false
            referencedRelation: "risultati_partite"
            referencedColumns: ["squadra_casa_id"]
          },
          {
            foreignKeyName: "partita_id_squadra_casa_fkey"
            columns: ["p_id_squadra_casa"]
            isOneToOne: false
            referencedRelation: "risultati_partite"
            referencedColumns: ["squadra_ospite_id"]
          },
          {
            foreignKeyName: "partita_id_squadra_casa_fkey"
            columns: ["p_id_squadra_casa"]
            isOneToOne: false
            referencedRelation: "squadra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partita_id_squadra_ospite_fkey"
            columns: ["p_id_squadra_ospite"]
            isOneToOne: false
            referencedRelation: "ricerca_squadre"
            referencedColumns: ["s_id"]
          },
          {
            foreignKeyName: "partita_id_squadra_ospite_fkey"
            columns: ["p_id_squadra_ospite"]
            isOneToOne: false
            referencedRelation: "risultati_partite"
            referencedColumns: ["squadra_casa_id"]
          },
          {
            foreignKeyName: "partita_id_squadra_ospite_fkey"
            columns: ["p_id_squadra_ospite"]
            isOneToOne: false
            referencedRelation: "risultati_partite"
            referencedColumns: ["squadra_ospite_id"]
          },
          {
            foreignKeyName: "partita_id_squadra_ospite_fkey"
            columns: ["p_id_squadra_ospite"]
            isOneToOne: false
            referencedRelation: "squadra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partita_mvp_partita_fkey"
            columns: ["p_mvp_partita"]
            isOneToOne: false
            referencedRelation: "azioni_giocatori"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "partita_mvp_partita_fkey"
            columns: ["p_mvp_partita"]
            isOneToOne: false
            referencedRelation: "giocatore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partita_mvp_partita_fkey"
            columns: ["p_mvp_partita"]
            isOneToOne: false
            referencedRelation: "ricerca_giocatori"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "partita_mvp_partita_fkey"
            columns: ["p_mvp_partita"]
            isOneToOne: false
            referencedRelation: "ricerca_squadre"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "torneo_svolto_in_fkey"
            columns: ["t_svolto_in"]
            isOneToOne: false
            referencedRelation: "campo"
            referencedColumns: ["id"]
          },
        ]
      }
      lista_categorie: {
        Row: {
          categoria_id: number | null
          categoria_nome: string | null
          girone: string | null
          torneo_id: number | null
          torneo_nome: string | null
        }
        Relationships: []
      }
      ricerca_giocatori: {
        Row: {
          g_cognome: string | null
          g_id: number | null
          g_is_capitano: boolean | null
          g_link_foto: string | null
          g_nazionalita: string | null
          g_nome: string | null
          g_ruolo_principale:
            | Database["public"]["Enums"]["ruolo_giocatore"]
            | null
          id_torneo: number | null
          s_acronimo: string | null
          s_colore_squadra: string | null
          s_link_stemma: string | null
          s_nome: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iscrizione_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "azioni_partite"
            referencedColumns: ["t_id"]
          },
          {
            foreignKeyName: "iscrizione_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "lista_categorie"
            referencedColumns: ["torneo_id"]
          },
          {
            foreignKeyName: "iscrizione_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "ricerca_squadre"
            referencedColumns: ["t_id"]
          },
          {
            foreignKeyName: "iscrizione_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "risultati_partite"
            referencedColumns: ["torneo_id"]
          },
          {
            foreignKeyName: "iscrizione_id_torneo_fkey"
            columns: ["id_torneo"]
            isOneToOne: false
            referencedRelation: "torneo"
            referencedColumns: ["id"]
          },
        ]
      }
      ricerca_squadre: {
        Row: {
          g_cognome: string | null
          g_id: number | null
          g_nome: string | null
          s_acronimo: string | null
          s_colore_squadra: string | null
          s_id: number | null
          s_id_capitano: number | null
          s_link_stemma: string | null
          s_nome: string | null
          t_id: number | null
          t_nome: string | null
        }
        Relationships: [
          {
            foreignKeyName: "squadra_id_capitano_fkey"
            columns: ["s_id_capitano"]
            isOneToOne: false
            referencedRelation: "azioni_giocatori"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "squadra_id_capitano_fkey"
            columns: ["s_id_capitano"]
            isOneToOne: false
            referencedRelation: "giocatore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squadra_id_capitano_fkey"
            columns: ["s_id_capitano"]
            isOneToOne: false
            referencedRelation: "ricerca_giocatori"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "squadra_id_capitano_fkey"
            columns: ["s_id_capitano"]
            isOneToOne: false
            referencedRelation: "ricerca_squadre"
            referencedColumns: ["g_id"]
          },
        ]
      }
      risultati_partite: {
        Row: {
          campo_svolgimento: number | null
          categoria_id: number | null
          categoria_nome: string | null
          durata_partita: number | null
          fase: string | null
          fischio_inizio: string | null
          giornata: number | null
          girone: string | null
          goal_casa: number | null
          goal_ospite: number | null
          id_arbitro: number | null
          id_partita: number | null
          mvp_partita: number | null
          rigori_casa: number | null
          rigori_ospite: number | null
          squadra_casa_acronimo: string | null
          squadra_casa_colore: string | null
          squadra_casa_id: number | null
          squadra_casa_nome: string | null
          squadra_casa_stemma: string | null
          squadra_ospite_acronimo: string | null
          squadra_ospite_colore: string | null
          squadra_ospite_id: number | null
          squadra_ospite_nome: string | null
          squadra_ospite_stemma: string | null
          torneo_id: number | null
          torneo_nome: string | null
          vinta_a_tavolino:
            | Database["public"]["Enums"]["vittoria_tavolino"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "partita_campo_svolgimento_fkey"
            columns: ["campo_svolgimento"]
            isOneToOne: false
            referencedRelation: "campo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partita_id_arbitro_fkey"
            columns: ["id_arbitro"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partita_mvp_partita_fkey"
            columns: ["mvp_partita"]
            isOneToOne: false
            referencedRelation: "azioni_giocatori"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "partita_mvp_partita_fkey"
            columns: ["mvp_partita"]
            isOneToOne: false
            referencedRelation: "giocatore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partita_mvp_partita_fkey"
            columns: ["mvp_partita"]
            isOneToOne: false
            referencedRelation: "ricerca_giocatori"
            referencedColumns: ["g_id"]
          },
          {
            foreignKeyName: "partita_mvp_partita_fkey"
            columns: ["mvp_partita"]
            isOneToOne: false
            referencedRelation: "ricerca_squadre"
            referencedColumns: ["g_id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      assegnamento_azione: "Casa" | "Ospiti"
      piede_principale: "Destro" | "Sinistro" | "Entrambi"
      ruolo_giocatore:
        | "Tecnico"
        | "Portiere"
        | "Difensore"
        | "Centrocampista"
        | "Attaccante"
      tipo_azione:
        | "Goal"
        | "Assist"
        | "Goal su rigore"
        | "Autogoal"
        | "Cartellino giallo"
        | "Cartellino rosso"
        | "Calcio di rigore segnato"
        | "Calcio di rigore sbagliato"
        | "Sostituzione"
        | "Infortunio"
      vittoria_tavolino: "No" | "Casa" | "Ospiti"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      assegnamento_azione: ["Casa", "Ospiti"],
      piede_principale: ["Destro", "Sinistro", "Entrambi"],
      ruolo_giocatore: [
        "Tecnico",
        "Portiere",
        "Difensore",
        "Centrocampista",
        "Attaccante",
      ],
      tipo_azione: [
        "Goal",
        "Assist",
        "Goal su rigore",
        "Autogoal",
        "Cartellino giallo",
        "Cartellino rosso",
        "Calcio di rigore segnato",
        "Calcio di rigore sbagliato",
        "Sostituzione",
        "Infortunio",
      ],
      vittoria_tavolino: ["No", "Casa", "Ospiti"],
    },
  },
} as const
