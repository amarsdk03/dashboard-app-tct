import { StyleSheet, TextInput, View } from 'react-native';
import { InterText } from '@/components/InterText';
import React from 'react';

interface TextInputFieldProps {
    label: string;
    value: string | null;
    onChange: (text: string) => void;
    placeholder?: string;
    multiline?: boolean;
}

export default function TextInputField({ label, value, onChange, placeholder, multiline }: TextInputFieldProps) {
    return (
        <View style={styles.inputContainer}>
            <InterText style={styles.label}>{label}</InterText>
            <TextInput
                style={[styles.input, multiline && styles.textArea, { fontFamily: 'Inter' }]}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
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
        fontSize: 13,
        fontWeight: '500',
        color: '#111111',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 13,
        color: '#0f172a',
        transitionProperty: 'border-color', // Conceptually for web, handled via state on native
    },
    textArea: {
        height: 80,
        paddingTop: 12,
    },
});