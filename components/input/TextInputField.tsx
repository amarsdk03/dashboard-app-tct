import React from 'react';

import { StyleSheet, TextInput, View } from 'react-native';
import { InputModeOptions } from 'react-native/Libraries/Components/TextInput/TextInput';
import InputLabel from '@/components/input/InputLabel';

interface TextInputFieldProps {
    label: string;
    value: string | null;
    readonly?: boolean;
    onChange: (text: string) => void;
    placeholder?: string;
    multiline?: boolean;
    inputMode?: InputModeOptions;
    required?: boolean;
    tooltip?: string;
}

export default function TextInputField({
    label,
    value,
    readonly = false,
    onChange,
    placeholder,
    multiline,
    inputMode = 'text',
    required = false,
    tooltip,
}: TextInputFieldProps) {
    const placeholderValue = readonly ? 'N/A' : placeholder;

    return (
        <View style={styles.inputContainer}>
            <InputLabel label={label} required={required} tooltip={tooltip} style={styles.label} />
            <TextInput
                inputMode={inputMode}
                editable={!readonly}
                style={[
                    styles.input,
                    readonly && styles.readonlyInput,
                    !readonly && multiline && styles.textArea,
                    { fontFamily: 'Inter' },
                ]}
                placeholder={placeholderValue}
                placeholderTextColor={readonly ? '#808080' : '#c8c8c8'}
                value={value || ''}
                onChangeText={(text) => onChange(text)}
                multiline={multiline}
                numberOfLines={multiline ? 3 : 1}
                textAlignVertical={multiline ? 'top' : 'center'}
                keyboardType={inputMode === 'numeric' ? 'numeric' : 'default'}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        marginBottom: 5,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111111',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#ffffff',
        borderColor: '#e6e6e6',
        color: '#404040',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 13,
        transitionProperty: 'border-color', // Conceptually for web, handled via state on native
    },
    readonlyInput: {
        backgroundColor: '#f2f2f2',
        borderColor: '#f0f0f0',
        color: '#808080',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 13,
        transitionProperty: 'border-color', // Conceptually for web, handled via state on native
    },
    textArea: {
        height: 80,
        paddingTop: 12,
    },
});
