import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import TextInputField from '@/components/input/TextInputField';
import InputLabel from '@/components/input/InputLabel';

interface ColorPickerFieldProps {
    label: string;
    value: string | null;
    readonly?: boolean;
    onChange: (text: string) => void;
    placeholder?: string;
    required?: boolean;
    tooltip?: string;
}

const PRESET_COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#0f172a', // slate-900
    '#475569', // slate-600
    '#94a3b8', // slate-400
    '#ffffff', // white
];

function isValidHex(value: string) {
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);
}

function normalizeHex(value: string) {
    const stripped = value.startsWith('#') ? value : `#${value}`;
    return stripped.toUpperCase();
}

export default function ColorPickerField({
    label,
    value,
    readonly = false,
    onChange,
    placeholder = '#000000',
    required = false,
    tooltip,
}: ColorPickerFieldProps) {
    const [hexInput, setHexInput] = useState(value ?? '');

    const resolvedColor = value && isValidHex(value) ? value : null;

    if (readonly) {
        return (
            <TextInputField
                label={label}
                value={resolvedColor ? resolvedColor.toUpperCase() : 'N/A'}
                onChange={() => null}
                placeholder={placeholder}
                readonly={true}
                tooltip={tooltip}
            />
        );
    }

    function handlePresetPress(color: string) {
        setHexInput(color.toUpperCase());
        onChange(color);
    }

    function handleHexChange(text: string) {
        setHexInput(text);
        const normalized = normalizeHex(text);
        if (isValidHex(normalized)) {
            onChange(normalized);
        }
    }

    function handleHexBlur() {
        const normalized = normalizeHex(hexInput);
        if (isValidHex(normalized)) {
            setHexInput(normalized);
            onChange(normalized);
        } else if (!hexInput.trim()) {
            setHexInput('');
        }
    }

    return (
        <View style={styles.inputGroup}>
            <InputLabel label={label} required={required} tooltip={tooltip} style={styles.label} />

            {/* ── Preview + hex input row ── */}
            <View style={styles.hexRow}>
                <View
                    style={[
                        styles.colorPreview,
                        resolvedColor
                            ? { backgroundColor: resolvedColor }
                            : styles.colorPreviewEmpty,
                    ]}
                />
                <TextInput
                    style={styles.hexInput}
                    value={hexInput}
                    onChangeText={handleHexChange}
                    onBlur={handleHexBlur}
                    placeholder={placeholder}
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={7}
                />
            </View>

            {/* ── Preset swatches ── */}
            <View style={styles.swatchRow}>
                {PRESET_COLORS.map((color) => {
                    const active = value?.toUpperCase() === color.toUpperCase();
                    return (
                        <TouchableOpacity
                            key={color}
                            style={[
                                styles.swatch,
                                { backgroundColor: color },
                                color === '#ffffff' && styles.swatchWhite,
                                active && styles.swatchActive,
                            ]}
                            onPress={() => handlePresetPress(color)}
                            activeOpacity={0.75}
                        />
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    inputGroup: {
        marginBottom: 20,
        gap: 10,
    },
    label: {
        color: '#111111',
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: '500',
    },
    hexRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    colorPreview: {
        width: 40,
        height: 40,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    colorPreviewEmpty: {
        backgroundColor: '#f8fafc',
        borderStyle: 'dashed',
    },
    hexInput: {
        flex: 1,
        height: 40,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        color: '#0f172a',
        fontFamily: 'Inter',
        fontSize: 14,
    },
    swatchRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    swatch: {
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    swatchWhite: {
        borderColor: '#cbd5e1',
    },
    swatchActive: {
        borderWidth: 2.5,
        borderColor: '#0f172a',
    },
});
