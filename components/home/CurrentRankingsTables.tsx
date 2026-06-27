import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { getListaPartite, listaPartiteType } from '@/data/partite';
import { categorieClassificaType, getCategorieClassifica, getListaTornei } from '@/data/tornei';

import { InterText } from '@/components/generic/InterText';
import RankingTable, { SquadraClassifica } from '@/components/home/RankingTable';

// Struttura dati raggruppata: Categoria -> Girone -> Array di Squadre
export interface ClassificheRaggruppate {
    [categoria: string]: {
        [girone: string]: SquadraClassifica[];
    };
}

export function calcolaClassifiche(listaPartite: listaPartiteType[]) {
    const mappaClassifiche: ClassificheRaggruppate = {};

    listaPartite.forEach((partita) => {
        const catNome = partita.categoria_nome ?? "???";
        const girNome = partita.girone ?? "???";

        // Consideriamo solo le partite giocate con un risultato valido
        if (partita.goal_casa === null || partita.goal_ospite === null) return;
        if (!partita.squadra_casa_id || !partita.squadra_ospite_id) return;

        if (!mappaClassifiche[catNome]) mappaClassifiche[catNome] = {};
        if (!mappaClassifiche[catNome][girNome]) mappaClassifiche[catNome][girNome] = [];

        const rigaGirone = mappaClassifiche[catNome][girNome];

        // Inizializza la squadra di casa se non esiste nel girone
        let casa = rigaGirone.find(s => s.id === partita.squadra_casa_id);
        if (!casa) {
            casa = {
                id: partita.squadra_casa_id,
                nome: partita.squadra_casa_nome ?? "Home",
                acronimo: partita.squadra_casa_acronimo ?? "HOM",
                stemma: partita.squadra_casa_stemma ?? "",
                giocate: 0, vinte: 0, pareggi: 0, perse: 0, golFatti: 0, golSubiti: 0, diffReti: 0, punti: 0
            };
            rigaGirone.push(casa);
        }

        // Inizializza la squadra ospite se non esiste nel girone
        let ospite = rigaGirone.find(s => s.id === partita.squadra_ospite_id);
        if (!ospite) {
            ospite = {
                id: partita.squadra_ospite_id,
                nome: partita.squadra_ospite_nome ?? "Away",
                acronimo: partita.squadra_ospite_acronimo ?? "AWA",
                stemma: partita.squadra_ospite_stemma ?? "",
                giocate: 0, vinte: 0, pareggi: 0, perse: 0, golFatti: 0, golSubiti: 0, diffReti: 0, punti: 0
            };
            rigaGirone.push(ospite);
        }

        // Aggiornamento statistiche gol e partite giocate
        casa.giocate += 1;
        ospite.giocate += 1;
        casa.golFatti += partita.goal_casa;
        casa.golSubiti += partita.goal_ospite;
        ospite.golFatti += partita.goal_ospite;
        ospite.golSubiti += partita.goal_casa;

        // Calcolo esito partita (Punti: 3 per vittoria, 1 per pareggio, 0 per sconfitta)
        if (partita.goal_casa > partita.goal_ospite) {
            casa.vinte += 1;
            casa.punti += 3;
            ospite.perse += 1;
        } else if (partita.goal_casa < partita.goal_ospite) {
            ospite.vinte += 1;
            ospite.punti += 3;
            casa.perse += 1;
        } else {
            casa.pareggi += 1;
            casa.punti += 1;
            ospite.pareggi += 1;
            ospite.punti += 1;
        }

        casa.diffReti = casa.golFatti - casa.golSubiti;
        ospite.diffReti = ospite.golFatti - ospite.golSubiti;
    });

    // Ordinamento delle classifiche (Punti -> Differenza Reti -> Gol Fatti)
    Object.keys(mappaClassifiche).forEach(cat => {
        Object.keys(mappaClassifiche[cat]).forEach(gir => {
            mappaClassifiche[cat][gir].sort((a, b) => {
                if (b.punti !== a.punti) return b.punti - a.punti;
                if (b.diffReti !== a.diffReti) return b.diffReti - a.diffReti;
                return b.golFatti - a.golFatti;
            });
        });
    });

    return mappaClassifiche;
}

export default function CurrentRankingsTables() {
    const [listaPartite, setListaPartite] = useState<listaPartiteType[]>([]);
    const [categorieClassifica, setCategorieClassifica] = useState<categorieClassificaType>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedGirone, setSelectedGirone] = useState<Record<string, string>>({});

    useEffect(() => {
        (async () => {
            setError(false);
            setLoading(true);

            try {
                const tornei = await getListaTornei(null, undefined);

                if (!tornei) {
                    setLoading(false);
                    return;
                }

                const ultimoTorneo = tornei[0].id;
                const [partite, categorieData] = await Promise.all([
                    getListaPartite(ultimoTorneo, null, null),
                    getCategorieClassifica(null, ultimoTorneo),
                ]);

                setCategorieClassifica(categorieData);
                setListaPartite(partite);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const classifiche = useMemo(() => calcolaClassifiche(listaPartite), [listaPartite]);

    if (loading) {
        return (
            <View style={styles.centeredBox}>
                <InterText style={styles.mutedText}>Recupero in corso...</InterText>
            </View>
        );
    }

    if (error || listaPartite.length === 0) {
        return (
            <View style={styles.centeredBox}>
                <InterText style={styles.mutedText}>Nessun incontro attualmente fissato</InterText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {Object.entries(classifiche).map(([categoriaNome, gironi]) => {
                const sortedGironi = Object.entries(gironi).sort(([a], [b]) => a.localeCompare(b));
                const defaultGirone = sortedGironi[0]?.[0] ?? '';
                const activeGirone = selectedGirone[categoriaNome] ?? defaultGirone;

                const activeDatiSquadre = gironi[activeGirone];

                return (
                    <View key={categoriaNome} style={styles.categoriaBlock}>
                        {/* Header row: category name + girone chips */}
                        <View style={styles.headerRow}>
                            <InterText style={styles.categoriaNome} numberOfLines={1}>
                                {categoriaNome}
                            </InterText>

                            {sortedGironi.length > 1 && (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.chipRow}>
                                    {sortedGironi.map(([gironeNome]) => {
                                        const active = activeGirone === gironeNome;
                                        return (
                                            <TouchableOpacity
                                                key={gironeNome}
                                                style={[styles.chip, active && styles.chipActive]}
                                                onPress={() =>
                                                    setSelectedGirone((prev) => ({
                                                        ...prev,
                                                        [categoriaNome]: gironeNome,
                                                    }))
                                                }
                                                activeOpacity={0.8}>
                                                <InterText
                                                    style={[
                                                        styles.chipText,
                                                        active && styles.chipTextActive,
                                                    ]}>
                                                    {`Girone ${gironeNome || '?'}`}
                                                </InterText>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </View>

                        {/* Active girone table */}
                        {activeDatiSquadre && (
                            <RankingTable
                                datiSquadre={activeDatiSquadre}
                                mostraClassifiche={activeGirone !== 'Unico'}
                                mostraLeggenda={false}
                                numQualificate={categorieClassifica?.[0]?.num_qualificate}
                                numPlayoff={categorieClassifica?.[0]?.num_playoff}
                                numEliminate={categorieClassifica?.[0]?.num_eliminate}
                            />
                        )}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        gap: 24,
    },
    centeredBox: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    mutedText: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 14,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    categoriaBlock: {
        gap: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'wrap',
    },
    categoriaNome: {
        color: '#475569',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        fontWeight: '700',
        flexShrink: 1,
    },
    chipRow: {
        flexDirection: 'row',
        gap: 6,
    },
    chip: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        paddingHorizontal: 11,
        paddingVertical: 7,
    },
    chipActive: {
        borderColor: '#0f172a',
        backgroundColor: '#0f172a',
    },
    chipText: {
        color: '#475569',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#ffffff',
    },
});
