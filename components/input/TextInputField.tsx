import { StyleSheet, TextInput, View } from 'react-native';
import { InterText } from '@/components/InterText';
import React from 'react';

interface TextInputFieldProps {
    label: string;
    value: string | null;
    readonly?: boolean;
    onChange: (text: string) => void;
    placeholder?: string;
    multiline?: boolean;
}

export default function TextInputField({ label, value, readonly = false, onChange, placeholder, multiline }: TextInputFieldProps) {
    const placeholderValue = readonly ? 'N/A' : placeholder;

    return (
        <View style={styles.inputContainer}>
            <InterText style={styles.label}>{label}:</InterText>
            <TextInput
                editable={!readonly}
                style={[
                    styles.input,
                    readonly && styles.readonlyInput,
                    !readonly && multiline && styles.textArea,
                    { fontFamily: 'Inter' },
                ]}
                placeholder={placeholderValue}
                placeholderTextColor={readonly ? '#737373' : 'rgb(0 0 0 / 0.4)'}
                value={value || ''}
                onChangeText={(text) => onChange(text)}
                multiline={multiline}
                numberOfLines={multiline ? 3 : 1}
                textAlignVertical={multiline ? 'top' : 'center'}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111111',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#faf6f2',
        borderWidth: 1,
        borderColor: '#e0d3ca',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 13,
        color: '#402c20',
        transitionProperty: 'border-color', // Conceptually for web, handled via state on native
    },
    readonlyInput: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 0,
        paddingVertical: 0,
        borderRadius: 0,
        borderColor: '#ffffff00',
        color: '#737373',
    },
    textArea: {
        height: 80,
        paddingTop: 12,
    },
});