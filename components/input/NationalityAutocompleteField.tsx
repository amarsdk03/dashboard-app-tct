import React, { useMemo, useState } from 'react';
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ChevronDownIcon, SearchIcon } from 'lucide-react-native';
import { InterText } from '@/components/generic/InterText';
import {
    filterNationalities,
    findNationality,
    formatNationalityLabel,
    NationalityOption,
} from '@/constants/nationalities';

type Props = {
    label: string;
    readonly?: boolean;
    value: string | null;
    onChange: (value: string) => void;
    placeholder?: string;
};

export default function NationalityAutocompleteField({
    label,
    readonly = false,
    value,
    onChange,
    placeholder = 'Seleziona nazionalità',
}: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const currentValue = value ?? '';
    const selectedCountry = useMemo(() => findNationality(currentValue), [currentValue]);
    const selectedLabel = formatNationalityLabel(currentValue);
    const suggestions = useMemo(() => {
        return filterNationalities(search || currentValue, 8);
    }, [currentValue, search]);

    function handleOpen() {
        if (readonly) return;
        setSearch('');
        setOpen((current) => !current);
    }

    function handleSelect(country: NationalityOption) {
        onChange(country.name);
        setSearch('');
        setOpen(false);
    }

    if (readonly) {
        return (
            <View style={styles.inputGroup}>
                <InterText style={styles.label}>{label}:</InterText>
                <View style={styles.selectBox}>
                    <CountryMark country={selectedCountry} />
                    <InterText style={styles.selectText}>
                        {selectedLabel ?? (currentValue.trim() ? currentValue : 'N/A')}
                    </InterText>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.inputGroup}>
            <InterText style={styles.label}>{label}:</InterText>

            <TouchableOpacity
                style={[styles.selectBox, open && styles.selectBoxOpen]}
                onPress={handleOpen}
                activeOpacity={0.85}>
                <CountryMark country={selectedCountry} />
                <InterText
                    style={[styles.selectText, !selectedLabel && styles.placeholderText]}
                    numberOfLines={1}>
                    {selectedLabel ?? (currentValue.trim() ? currentValue : placeholder)}
                </InterText>
                <ChevronDownIcon
                    size={18}
                    color="#64748b"
                    style={[styles.chevron, open && styles.chevronOpen]}
                />
            </TouchableOpacity>

            {open && (
                <View style={styles.dropdown}>
                    <View style={styles.searchBox}>
                        <SearchIcon size={16} color="#64748b" />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Cerca nazionalità..."
                            placeholderTextColor="#94a3b8"
                            style={styles.searchInput}
                            autoCapitalize="words"
                            autoFocus
                        />
                    </View>

                    <View style={styles.options}>
                        {suggestions.length === 0 ? (
                            <InterText style={styles.emptyText}>Nessuna nazionalità trovata</InterText>
                        ) : (
                            suggestions.map((country) => {
                                const active = selectedCountry?.code === country.code;
                                return (
                                    <TouchableOpacity
                                        key={country.code}
                                        style={[styles.optionRow, active && styles.optionRowActive]}
                                        onPress={() => handleSelect(country)}
                                        activeOpacity={0.85}>
                                        <CountryMark country={country} />
                                        <View style={styles.optionTextBox}>
                                            <InterText style={styles.optionName}>
                                                {country.name}
                                            </InterText>
                                            <InterText style={styles.optionCode}>
                                                {country.code}
                                            </InterText>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                </View>
            )}
        </View>
    );
}

function CountryMark({ country }: { country: NationalityOption | null }) {
    if (!country) {
        return (
            <View style={styles.flagFallback}>
                <InterText style={styles.flagFallbackText}>--</InterText>
            </View>
        );
    }

    return (
        <View style={styles.flagBox}>
            <InterText style={styles.flag}>{country.flag}</InterText>
        </View>
    );
}

const styles = StyleSheet.create({
    inputGroup: {
        marginBottom: 16,
        position: 'relative',
        zIndex: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111111',
        marginBottom: 8,
        fontFamily: 'Inter-SemiBold',
    },
    selectBox: {
        minHeight: 48,
        width: '100%',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    selectBoxOpen: {
        borderColor: '#0f172a',
        backgroundColor: '#ffffff',
    },
    selectText: {
        flex: 1,
        color: '#0f172a',
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        fontWeight: '600',
    },
    placeholderText: {
        color: '#94a3b8',
        fontFamily: 'Inter',
        fontWeight: '400',
    },
    chevron: {
        transform: [{ rotate: '0deg' }],
    },
    chevronOpen: {
        transform: [{ rotate: '180deg' }],
    },
    flagBox: {
        width: 32,
        height: 32,
        borderRadius: 999,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flagFallback: {
        width: 32,
        height: 32,
        borderRadius: 999,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flagFallbackText: {
        color: '#64748b',
        fontFamily: 'Inter-Bold',
        fontSize: 10,
        fontWeight: '700',
    },
    flag: {
        fontSize: 18,
    },
    dropdown: {
        marginTop: 6,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 8,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 4,
        gap: 8,
    },
    searchBox: {
        minHeight: 42,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        backgroundColor: '#f8fafc',
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchInput: {
        flex: 1,
        color: '#0f172a',
        fontFamily: 'Inter',
        fontSize: 14,
        paddingVertical: 9,
    },
    options: {
        maxHeight: 280,
        overflow: 'hidden',
        borderRadius: 10,
    },
    optionRow: {
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    optionRowActive: {
        backgroundColor: '#f8fafc',
    },
    optionTextBox: {
        flex: 1,
        minWidth: 0,
    },
    optionName: {
        color: '#0f172a',
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        fontWeight: '600',
    },
    optionCode: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 12,
        marginTop: 2,
    },
    emptyText: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 13,
        padding: 12,
        textAlign: 'center',
    },
});
