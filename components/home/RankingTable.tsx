import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { InterText } from '@/components/generic/InterText';

export interface SquadraClassifica {
    id: number;
    nome: string;
    acronimo: string;
    stemma: string;
    giocate: number;
    vinte: number;
    pareggi: number;
    perse: number;
    golFatti: number;
    golSubiti: number;
    diffReti: number;
    punti: number;
}

interface RankingTableProps {
    datiSquadre: SquadraClassifica[];
    mostraClassifiche?: boolean;
    mostraLeggenda?: boolean;
    numQualificate?: number;
    numPlayoff?: number;
    numEliminate?: number;
}

const DEFAULT_LOGO_PATH = require('@/assets/images/logo.png');

function ZoneBar({ color }: { color: string | null }) {
    if (!color) return <View style={styles.zoneBarPlaceholder} />;
    return <View style={[styles.zoneBar, { backgroundColor: color }]} />;
}

function PosBox({ pos }: { pos: number }) {
    const boxStyle =
        pos === 1
            ? styles.posBox1
            : pos === 2
              ? styles.posBox2
              : pos === 3
                ? styles.posBox3
                : styles.posBoxDefault;
    const textStyle =
        pos === 1
            ? styles.posText1
            : pos === 2
              ? styles.posText2
              : pos === 3
                ? styles.posText3
                : styles.posTextDefault;

    return (
        <View style={[styles.posBox, boxStyle]}>
            <InterText style={[styles.posText, textStyle]}>{pos}</InterText>
        </View>
    );
}

export default function RankingTable({
    datiSquadre,
    mostraClassifiche = true,
    mostraLeggenda = true,
    numQualificate = 0,
    numPlayoff = 0,
    numEliminate = 0,
}: RankingTableProps) {
    const totalTeams = datiSquadre.length;

    function getZoneColor(pos: number): string | null {
        if (!mostraClassifiche) return null;
        if (numQualificate > 0 && pos <= numQualificate) return '#22c55e';
        if (numPlayoff > 0 && pos > numQualificate && pos <= numQualificate + numPlayoff)
            return '#eab308';
        if (numEliminate > 0 && pos > totalTeams - numEliminate) return '#ef4444';
        return null;
    }

    return (
        <View>
            {/* ── Table ── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.table}>
                    {/* Header */}
                    <View style={[styles.row, styles.headerRow]}>
                        {mostraClassifiche && (
                            <View style={[styles.cell, styles.cellPos]}>
                                <InterText style={styles.headerText}>Pos</InterText>
                            </View>
                        )}
                        <View style={[styles.cell, styles.cellTeam]}>
                            <InterText style={styles.headerText}>Squadra</InterText>
                        </View>
                        <View style={[styles.cell, styles.cellStat]}>
                            <InterText style={[styles.headerText, styles.headerPT]}>PT</InterText>
                        </View>
                        <View style={[styles.cell, styles.cellStat]}>
                            <InterText style={styles.headerText}>G</InterText>
                        </View>
                        <View style={[styles.cell, styles.cellStat]}>
                            <InterText style={[styles.headerText, styles.headerV]}>V</InterText>
                        </View>
                        <View style={[styles.cell, styles.cellStat]}>
                            <InterText style={[styles.headerText, styles.headerN]}>N</InterText>
                        </View>
                        <View style={[styles.cell, styles.cellStat]}>
                            <InterText style={[styles.headerText, styles.headerP]}>P</InterText>
                        </View>
                        <View style={[styles.cell, styles.cellStat]}>
                            <InterText style={styles.headerText}>GF</InterText>
                        </View>
                        <View style={[styles.cell, styles.cellStat]}>
                            <InterText style={styles.headerText}>GS</InterText>
                        </View>
                        <View style={[styles.cell, styles.cellStat]}>
                            <InterText style={styles.headerText}>DR</InterText>
                        </View>
                    </View>

                    {/* Rows */}
                    {datiSquadre.map((squadra, index) => {
                        const pos = index + 1;
                        const zoneColor = getZoneColor(pos);
                        const diffColor =
                            squadra.diffReti > 0
                                ? '#22c55e'
                                : squadra.diffReti < 0
                                  ? '#ef4444'
                                  : '#64748b';

                        return (
                            <View key={squadra.id} style={[styles.row, styles.dataRow]}>
                                {mostraClassifiche && (
                                    <View style={[styles.cell, styles.cellPos, styles.posCell]}>
                                        <ZoneBar color={zoneColor} />
                                        <PosBox pos={pos} />
                                    </View>
                                )}

                                <View style={[styles.cell, styles.cellTeam]}>
                                    <Image
                                        source={
                                            squadra.stemma
                                                ? { uri: squadra.stemma }
                                                : DEFAULT_LOGO_PATH
                                        }
                                        style={styles.teamLogo}
                                        resizeMode="cover"
                                    />
                                    <InterText style={styles.teamName} numberOfLines={1}>
                                        {squadra.nome}
                                    </InterText>
                                    <InterText style={styles.teamAcronimo}>
                                        ({squadra.acronimo || squadra.nome.slice(0, 3)})
                                    </InterText>
                                </View>

                                <View style={[styles.cell, styles.cellStat, styles.cellPT]}>
                                    <InterText style={styles.statPT}>{squadra.punti}</InterText>
                                </View>
                                <View style={[styles.cell, styles.cellStat]}>
                                    <InterText style={styles.statMono}>{squadra.giocate}</InterText>
                                </View>
                                <View style={[styles.cell, styles.cellStat]}>
                                    <InterText style={[styles.statMono, styles.statV]}>
                                        {squadra.vinte}
                                    </InterText>
                                </View>
                                <View style={[styles.cell, styles.cellStat]}>
                                    <InterText style={[styles.statMono, styles.statN]}>
                                        {squadra.pareggi}
                                    </InterText>
                                </View>
                                <View style={[styles.cell, styles.cellStat]}>
                                    <InterText style={[styles.statMono, styles.statP]}>
                                        {squadra.perse}
                                    </InterText>
                                </View>
                                <View style={[styles.cell, styles.cellStat]}>
                                    <InterText style={[styles.statMono, styles.statMuted]}>
                                        {squadra.golFatti}
                                    </InterText>
                                </View>
                                <View style={[styles.cell, styles.cellStat]}>
                                    <InterText style={[styles.statMono, styles.statMuted]}>
                                        {squadra.golSubiti}
                                    </InterText>
                                </View>
                                <View style={[styles.cell, styles.cellStat]}>
                                    <InterText style={[styles.statMono, { color: diffColor }]}>
                                        {squadra.diffReti > 0
                                            ? `+${squadra.diffReti}`
                                            : squadra.diffReti}
                                    </InterText>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* ── Legend ── */}
            {mostraLeggenda && (
                <View style={styles.legenda}>
                    {mostraClassifiche && (
                        <View style={styles.legendaSection}>
                            <InterText style={styles.legendaTitle}>Fasce classifica</InterText>
                            <View style={styles.legendaRow}>
                                {numQualificate > 0 && (
                                    <View style={styles.legendaItem}>
                                        <View
                                            style={[
                                                styles.legendaDot,
                                                { backgroundColor: '#22c55e' },
                                            ]}
                                        />
                                        <InterText style={styles.legendaText}>
                                            Qualificazione diretta
                                        </InterText>
                                    </View>
                                )}
                                {numPlayoff > 0 && (
                                    <View style={styles.legendaItem}>
                                        <View
                                            style={[
                                                styles.legendaDot,
                                                { backgroundColor: '#eab308' },
                                            ]}
                                        />
                                        <InterText style={styles.legendaText}>Playoff</InterText>
                                    </View>
                                )}
                                {numEliminate > 0 && (
                                    <View style={styles.legendaItem}>
                                        <View
                                            style={[
                                                styles.legendaDot,
                                                { backgroundColor: '#ef4444' },
                                            ]}
                                        />
                                        <InterText style={styles.legendaText}>
                                            Eliminazione
                                        </InterText>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    <View style={styles.legendaSection}>
                        <InterText style={styles.legendaTitle}>Legenda statistiche</InterText>
                        <View style={styles.legendaRow}>
                            {[
                                { key: 'PT', label: 'Punti', color: '#e2e8f0' },
                                { key: 'G', label: 'Giornata', color: '#e2e8f0' },
                                { key: 'V', label: 'Vittorie', color: '#4ade80' },
                                { key: 'N', label: 'Pareggi', color: '#facc15' },
                                { key: 'P', label: 'Sconfitte', color: '#f87171' },
                                { key: 'GF', label: 'Goal fatti', color: '#e2e8f0' },
                                { key: 'GS', label: 'Goal subiti', color: '#e2e8f0' },
                                { key: 'DR', label: 'Diff. reti', color: '#e2e8f0' },
                            ].map(({ key, label, color }) => (
                                <View key={key} style={styles.legendaItem}>
                                    <InterText style={[styles.legendaKey, { color }]}>
                                        {key}:
                                    </InterText>
                                    <InterText style={styles.legendaText}>{label}</InterText>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    table: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerRow: {
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingVertical: 8,
    },
    dataRow: {
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        minHeight: 46,
    },
    cell: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cellPos: {
        width: 52,
        flexDirection: 'row',
        gap: 4,
    },
    posCell: {
        paddingLeft: 4,
    },
    cellTeam: {
        width: 200,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'flex-start',
        paddingHorizontal: 10,
    },
    cellStat: {
        width: 40,
    },
    cellPT: {
        backgroundColor: '#f1f5f9',
    },

    // Header text
    headerText: {
        color: '#808080',
        fontFamily: 'Inter-SemiBold',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    headerPT: { color: '#0f172a' },
    headerV: { color: '#16a34a' },
    headerN: { color: '#ca8a04' },
    headerP: { color: '#dc2626' },

    // Zone bar
    zoneBar: {
        width: 3,
        height: 28,
        borderRadius: 999,
    },
    zoneBarPlaceholder: {
        width: 3,
    },

    // Position box
    posBox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    posBox1: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fcd34d' },
    posBox2: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
    posBox3: { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fdba74' },
    posBoxDefault: { backgroundColor: 'transparent' },
    posText: { fontSize: 11, fontFamily: 'Inter-SemiBold', fontWeight: '600', textAlign: 'center' },
    posText1: { color: '#b45309' },
    posText2: { color: '#475569' },
    posText3: { color: '#c2410c' },
    posTextDefault: { color: '#94a3b8' },

    // Team cell
    teamLogo: {
        width: 22,
        height: 22,
        borderRadius: 11,
    },
    teamName: {
        color: '#0f172a',
        fontFamily: 'Inter-SemiBold',
        fontSize: 13,
        fontWeight: '600',
        flexShrink: 1,
    },
    teamAcronimo: {
        color: '#94a3b8',
        fontFamily: 'Inter',
        fontSize: 11,
    },

    // Stat cells
    statPT: {
        color: '#0f172a',
        fontFamily: 'Inter-Bold',
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
    },
    statMono: {
        color: '#475569',
        fontFamily: 'Inter',
        fontSize: 13,
        textAlign: 'center',
    },
    statV: { color: '#16a34a' },
    statN: { color: '#ca8a04' },
    statP: { color: '#dc2626' },
    statMuted: { color: '#94a3b8' },

    // Legend
    legenda: {
        marginTop: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
        padding: 14,
        gap: 14,
    },
    legendaSection: {
        gap: 8,
    },
    legendaTitle: {
        color: '#0f172a',
        fontFamily: 'Inter-SemiBold',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    legendaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    legendaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendaDot: {
        width: 8,
        height: 8,
        borderRadius: 999,
    },
    legendaKey: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
    },
    legendaText: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 12,
    },
});
