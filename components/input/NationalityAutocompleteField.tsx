import React, { useMemo, useState } from 'react';
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { InterText } from '@/components/InterText';
import {
    filterNationalities,
    findNationality,
    getNationalityFlag,
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
    placeholder,
}: Props) {
    const [focused, setFocused] = useState(false);
    const currentValue = value ?? '';
    const exactCountry = useMemo(() => findNationality(currentValue), [currentValue]);
    const exactFlag = getNationalityFlag(currentValue);
    const suggestions = useMemo(
        () => filterNationalities(currentValue, 6),
        [currentValue],
    );
    const showSuggestions = focused && !readonly && suggestions.length > 0;

    function handleSelect(name: string) {
        onChange(name);
        setFocused(false);
    }

    if (readonly) {
        return (
            <View style={styles.inputGroup}>
                <InterText style={styles.label}>{label}:</InterText>
                <View style={styles.readonlyBox}>
                    {exactFlag && <InterText style={styles.flag}>{exactFlag}</InterText>}
                    <InterText style={styles.readonlyValue}>
                        {currentValue.trim() ? currentValue : 'N/A'}
                    </InterText>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.inputGroup}>
            <InterText style={styles.label}>{label}:</InterText>
            <View style={styles.inputWrapper}>
                <TextInput
                    value={currentValue}
                    onChangeText={onChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => {
                        setTimeout(() => setFocused(false), 120);
                    }}
                    placeholder={placeholder}
                    placeholderTextColor="#94a3b8"
                    style={[styles.input, exactFlag && styles.inputWithFlag]}
                    autoCapitalize="words"
                />
                {exactFlag && (
                    <View style={styles.flagBadge}>
                        <InterText style={styles.flag}>{exactFlag}</InterText>
                    </View>
                )}
            </View>

            {showSuggestions && (
                <View style={styles.suggestions}>
                    {suggestions.map((country) => {
                        const active = exactCountry?.code === country.code;
                        return (
                            <TouchableOpacity
                                key={country.code}
                                style={[styles.suggestionRow, active && styles.suggestionRowActive]}
                                onPress={() => handleSelect(country.name)}
                                activeOpacity={0.85}>
                                <InterText style={styles.suggestionFlag}>{country.flag}</InterText>
                                <View style={styles.suggestionTextBox}>
                                    <InterText style={styles.suggestionName}>{country.name}</InterText>
                                    <InterText style={styles.suggestionCode}>{country.code}</InterText>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    inputGroup: {
        marginBottom: 16,
        position: 'relative',
        zIndex: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111111',
        marginBottom: 8,
        fontFamily: 'Inter-SemiBold',
    },
    inputWrapper: {
        position: 'relative',
    },
    input: {
        width: '100%',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: '#0f172a',
        fontFamily: 'Inter',
        fontSize: 14,
    },
    inputWithFlag: {
        paddingRight: 48,
    },
    flagBadge: {
        position: 'absolute',
        right: 12,
        top: 11,
    },
    flag: {
        fontSize: 18,
    },
    suggestions: {
        marginTop: 6,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 4,
    },
    suggestionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    suggestionRowActive: {
        backgroundColor: '#f8fafc',
    },
    suggestionFlag: {
        fontSize: 20,
    },
    suggestionTextBox: {
        flex: 1,
    },
    suggestionName: {
        color: '#0f172a',
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        fontWeight: '600',
    },
    suggestionCode: {
        color: '#64748b',
        fontFamily: 'Inter',
        fontSize: 12,
        marginTop: 2,
    },
    readonlyBox: {
        minHeight: 46,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    readonlyValue: {
        color: '#475569',
        fontFamily: 'Inter',
        fontSize: 14,
    },
});
