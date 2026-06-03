import { StyleSheet, View } from 'react-native';
import { InterText } from '@/components/InterText';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import React from 'react';

interface DateTimePickerFieldProps {
    label: string;
    value: Date | null;
    onChange: (date: Date) => void;
}

export default function DateTimePickerField({ label, value, onChange }: DateTimePickerFieldProps) {
    const dateValue = value instanceof Date && !isNaN(value.getTime())
        ? value
        : new Date();

    return (
        <View style={styles.inputContainer}>
            <InterText style={styles.label}>{label}</InterText>
            <View style={styles.datePickerWrapper}>
                <DateTimePicker
                    value={dateValue}
                    mode="date"
                    display="compact"
                    onValueChange={(_, selectedDate) => selectedDate && onChange(selectedDate)}
                />
            </View>
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
    datePickerWrapper: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        overflow: 'hidden',
        height: 32,
        justifyContent: 'center',
    },
});