import React, { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { InterText } from '@/components/generic/InterText';

// Lazy-load the native picker only on native platforms
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

// Converts a Date to "YYYY-MM-DD" for the HTML input value
function toInputValue(date: Date | null): string {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Parses "YYYY-MM-DD" back to a local midnight Date
function fromInputValue(val: string): Date | null {
    if (!val) return null;
    const [y, m, d] = val.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export default function DateTimePickerField(
    {
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
        onChange(fromInputValue(e.target.value));
    };

    return (
        <View style={styles.inputContainer}>
            <InterText style={styles.label}>{label}:</InterText>

            <Pressable
                disabled={readonly}
                style={[styles.fieldBox, readonly && styles.readonlyFieldBox]}
                onPress={() => {
                    if (Platform.OS === 'web') {
                        // Programmatically open the native browser date picker
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
                    {value ? value.toLocaleDateString() : placeholderValue}
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

                {/* Invisible web date input — sits on top, triggers the browser picker */}
                {Platform.OS === 'web' && (
                    <input
                        ref={webInputRef}
                        type={mode === 'datetime' ? 'datetime-local' : mode}
                        value={toInputValue(value)}
                        onChange={handleWebChange}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            opacity: 0,
                            width: '100%',
                            height: '100%',
                            cursor: 'pointer',
                            // Hide the default input chrome but keep it clickable
                            border: 'none',
                            background: 'transparent',
                        }}
                    />
                )}
            </Pressable>

            {/* Native DateTimePicker — Android / iOS only */}
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
        color: 'rgb(0 0 0 / 0.25)',
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