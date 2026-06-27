'use client';

import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { InterText } from '@/components/generic/InterText';
import InputLabel from '@/components/input/InputLabel';

export type SelectOption = {
    id: string;
    name: string;
};

type GenericSelectFieldProps = {
    value: string;
    onChange: (val: string) => void;
    options: SelectOption[];
    label?: string;
    placeholder?: string;
    enableNullValue?: boolean;
    defaultNullValue?: string;
    readonly?: boolean;
    required?: boolean;
    defaultLabelStyle?: boolean;
    tooltip?: string;
};

export default function GenericSelectField({
    value,
    onChange,
    options = [],
    label,
    placeholder = 'Seleziona...',
    enableNullValue = false,
    defaultNullValue = 'Nessuna',
    readonly = false,
    required = false,
    defaultLabelStyle = true,
    tooltip,
}: GenericSelectFieldProps) {
    // Inject the fallback/null value safely if enabled
    const dropdownData = React.useMemo(() => {
        return enableNullValue ? [{ id: 'NONE', name: defaultNullValue }, ...options] : options;
    }, [options, enableNullValue, defaultNullValue]);

    // Fall back to 'NONE' selection if the outer value string is empty
    const currentValue = value || 'NONE';

    const renderDropdownItem = (item: SelectOption) => {
        return (
            <View style={styles.itemContainer}>
                <InterText style={styles.itemText}>{item.name}</InterText>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {label && (
                <InputLabel
                    label={label}
                    required={required}
                    tooltip={tooltip}
                    style={defaultLabelStyle ? styles.label : styles.filterLabel}
                />
            )}

            <Dropdown
                style={[styles.dropdown, readonly && styles.dropdownReadonly]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={[
                    styles.selectedTextStyle,
                    readonly && styles.selectedTextStyleReadonly,
                ]}
                containerStyle={styles.dropdownContainerList}
                activeColor="#f1f5f9"
                data={dropdownData}
                labelField="name"
                valueField="id"
                placeholder={placeholder}
                value={currentValue}
                onChange={(item) => onChange(item.id === 'NONE' ? '' : item.id)}
                renderItem={renderDropdownItem}
                disable={readonly}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 6,
        marginBottom: 12,
    },
    dropdown: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
    },
    dropdownReadonly: {
        backgroundColor: '#f2f2f2',
        borderColor: '#f0f0f0',
    },
    dropdownContainerList: {
        borderRadius: 12,
        backgroundColor: '#ffffff',
        marginTop: 4,
        elevation: 3,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111111',
    },
    filterLabel: {
        color: '#64748b',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    placeholderStyle: {
        fontSize: 13,
        fontFamily: 'Inter',
        color: '#94a3b8',
    },
    selectedTextStyle: {
        fontSize: 13,
        fontFamily: 'Inter',
        color: '#0f172a',
    },
    selectedTextStyleReadonly: {
        color: '#808080',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    itemText: {
        fontSize: 13,
        fontFamily: 'Inter',
        color: '#0f172a',
    },
});
