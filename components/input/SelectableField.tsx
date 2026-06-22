import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { InterText } from '@/components/generic/InterText';
import React from 'react';
import TextInputField from '@/components/input/TextInputField';

type SelectableFieldProps<T> = {
    label: string;
    readonly: boolean;
    options: T[];
    selectedId: string | null;
    getId: (item: T) => string | null;
    getValue: (item: T) => string;
    onSelect: (item: T) => void;
};

export default function SelectableField<T>({
    label,
    readonly,
    options,
    selectedId,
    getId,
    getValue,
    onSelect,
}: SelectableFieldProps<T>) {
    const selected = options.find((option) => getId(option) === selectedId) ?? null;

    if (readonly) {
        return (
            <TextInputField
                label={label}
                value={selected ? getValue(selected) : 'N/A'}
                onChange={() => null}
                placeholder={'Nessun opzione selezionata'}
                readonly={true}
            />
        );
    }

    return (
        <View style={styles.inputGroup}>
            <InterText style={styles.label}>{label}:</InterText>
            <View style={styles.chipRow}>
                {options.length === 0 ? (
                    <InterText style={styles.emptyOptions}>Nessuna opzione disponibile</InterText>
                ) : (
                    options.map((option) => {
                        const id = getId(option);
                        const active = id === selectedId;
                        return (
                            <TouchableOpacity
                                key={String(id ?? getValue(option))}
                                style={[styles.chip, active && styles.chipActive]}
                                onPress={() => onSelect(option)}
                                activeOpacity={0.85}>
                                <InterText
                                    style={[styles.chipText, active && styles.chipTextActive]}
                                    numberOfLines={1}>
                                    {getValue(option)}
                                </InterText>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    inputGroup: {
        marginBottom: 20,
        gap: 4,
    },
    label: {
        color: '#111111',
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
    },
    readonlyValue: {
        color: '#737373',
        fontFamily: 'Inter',
        fontSize: 13,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        maxWidth: '100%',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        paddingHorizontal: 11,
        paddingVertical: 8,
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
    emptyOptions: {
        color: '#a6a6a6',
        fontFamily: 'Inter',
        fontSize: 13,
        paddingVertical: 8,
    },
});
