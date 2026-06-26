import React, { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { InterText } from '@/components/generic/InterText';

let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
    DateTimePicker = require('@expo/ui/community/datetime-picker').default;
}

interface DateTimePickerFieldProps {
    mode: 'date' | 'time' | 'datetime';
    label: string;
    value: Date | null;
    readonly?: boolean;
    onChange: (date: Date | null) => void;
    placeholder?: string;
}

function toInputValue(date: Date | null, mode: 'date' | 'time' | 'datetime'): string {
    if (!date) return '';

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');

    if (mode === 'time') return `${hh}:${mm}`;
    if (mode === 'datetime') return `${y}-${m}-${d}T${hh}:${mm}`;
    return `${y}-${m}-${d}`; // mode === 'date'
}

function fromInputValue(
    val: string,
    mode: 'date' | 'time' | 'datetime',
    baseDate: Date | null
): Date | null {
    if (!val) return null;

    // Se c'è già una data memorizzata nello stato, preserviamola come base
    const finalDate = baseDate ? new Date(baseDate) : new Date();

    if (mode === 'time') {
        const [hh, mm] = val.split(':').map(Number);
        finalDate.setHours(hh, mm, 0, 0);
        return finalDate;
    }

    if (mode === 'datetime') {
        const [datePart, timePart] = val.split('T');
        const [y, m, d] = datePart.split('-').map(Number);
        const [hh, mm] = timePart.split(':').map(Number);
        return new Date(y, m - 1, d, hh, mm, 0, 0);
    }

    // mode === 'date'
    const [y, m, d] = val.split('-').map(Number);
    finalDate.setFullYear(y, m - 1, d);
    return finalDate;
}

function formatDisplayValue(date: Date | null, mode: 'date' | 'time' | 'datetime'): string {
    if (!date) return '';

    // mode === 'date'
    if (mode === 'date') {
        return date.toLocaleDateString(undefined, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }

    // mode === 'time'
    if (mode === 'time') {
        return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    // mode === 'datetime'
    const dataPart = date.toLocaleDateString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const oraPart = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    return `${dataPart} - ${oraPart}`;
}

export default function DateTimePickerField({
    mode,
    label,
    readonly = false,
    value,
    onChange,
    placeholder = 'Seleziona data',
}: DateTimePickerFieldProps) {
    const [showPicker, setShowPicker] = useState(false);
    const webInputRef = useRef<any>(null);

    const placeholderValue = readonly ? 'N/A' : placeholder;

    const handleWebChange = (e: any) => {
        onChange(fromInputValue(e.target.value, mode, value));
    };

    return (
        <View style={styles.inputContainer}>
            <InterText style={styles.label}>{label}:</InterText>

            <Pressable
                disabled={readonly}
                style={[styles.fieldBox, readonly && styles.readonlyFieldBox]}
                onPress={() => {
                    if (Platform.OS === 'web') {
                        webInputRef.current?.showPicker?.();
                    } else {
                        setShowPicker(true);
                    }
                }}>
                <Text
                    style={[
                        styles.inputText,
                        !value && styles.placeholder,
                        readonly && styles.readonlyInputText,
                    ]}>
                    {value ? formatDisplayValue(value, mode) : placeholderValue}
                </Text>

                {/* Clear button */}
                {value && !readonly && Platform.OS !== 'web' && (
                    <Pressable
                        style={styles.clearBtn}
                        onPress={(e) => {
                            e.stopPropagation();
                            onChange(null);
                        }}>
                        <Text style={styles.clearBtnLabel}>X</Text>
                    </Pressable>
                )}

                {/* Input web invisibile, customizzato sul mode */}
                {Platform.OS === 'web' && (
                    <input
                        ref={webInputRef}
                        type={mode === 'datetime' ? 'datetime-local' : mode}
                        value={toInputValue(value, mode)}
                        onChange={handleWebChange}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            opacity: 0,
                            width: '100%',
                            height: '100%',
                            cursor: 'pointer',
                            border: 'none',
                            background: 'transparent',
                        }}
                    />
                )}
            </Pressable>

            {/* Native Picker */}
            {Platform.OS !== 'web' && showPicker && DateTimePicker && (
                <DateTimePicker
                    value={value ?? new Date()}
                    mode={mode}
                    presentation="dialog"
                    onValueChange={(event: any, selectedDate: Date) => {
                        setShowPicker(false);
                        onChange(selectedDate);
                    }}
                    onDismiss={() => setShowPicker(false)}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        marginBottom: 5,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111111',
        marginBottom: 5,
    },
    fieldBox: {
        position: 'relative',
        backgroundColor: '#ffffff',
        borderColor: '#e6e6e6',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 44,
    },
    readonlyFieldBox: {
        backgroundColor: '#f2f2f2',
        borderColor: '#f0f0f0',
        color: '#808080',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 44,
    },
    inputText: {
        fontSize: 13,
        color: '#404040',
    },
    readonlyInputText: {
        color: '#808080',
    },
    placeholder: {
        color: '#c8c8c8',
    },
    clearBtn: {
        position: 'absolute',
        right: 12,
        backgroundColor: '#f37979',
        borderRadius: 20,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearBtnLabel: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});