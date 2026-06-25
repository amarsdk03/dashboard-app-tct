'use client';

import * as React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { InterText } from '@/components/generic/InterText';

export type Team = {
    id: string;
    name: string;
    logoUrl?: string; // URL to the PNG logo
};

type TeamSelectFieldProps = {
    value: string;
    onChange: (val: string) => void;
    teams: Team[];
    label?: string;
    enableNullValue?: boolean;
    defaultNullValue?: string;
    readonly?: boolean;
    required?: boolean;
    defaultLabelStyle?: boolean;
};

export default function TeamSelectField({
    value,
    onChange,
    teams = [],
    label = 'Squadra:',
    enableNullValue = false,
    defaultNullValue = 'Nessuna',
    readonly = false,
    required = false,
    defaultLabelStyle = true,
}: TeamSelectFieldProps) {
    // Combine the static "Nessuna" option with the incoming dynamic teams list
    const dropdownData = React.useMemo(() => {
        return enableNullValue ? [{ id: 'NONE', name: defaultNullValue }, ...teams] : teams;
    }, [teams]);

    const currentValue = value || 'NONE';

    // Helper to find the current active team object to extract its logo details
    const currentTeam = teams.find((t) => t.id === currentValue);

    // Shared internal component to render the logo or its textual fallback cleanly
    const renderTeamLogo = (logoUrl?: string, teamName: string = '') => {
        if (!logoUrl) {
            const initial = teamName.trim().charAt(0).toUpperCase() || '?';
            return (
                <View style={styles.logoPlaceholder}>
                    <InterText style={styles.fallbackText}>{initial}</InterText>
                </View>
            );
        }

        return <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="contain" />;
    };

    const renderLeftIcon = () => {
        if (currentValue === 'NONE') return null;

        return (
            <View style={styles.logoIconWrapper}>
                {renderTeamLogo(currentTeam?.logoUrl, currentTeam?.name)}
            </View>
        );
    };

    const renderDropdownItem = (item: any) => {
        const isNone = item.id === 'NONE';

        return (
            <View style={styles.itemContainer}>
                {isNone ? (
                    // Completely empty transparent alignment spacing block for "Nessuna"
                    <View style={styles.logoPlaceholderEmpty} />
                ) : (
                    renderTeamLogo(item.logoUrl, item.name)
                )}

                <InterText style={styles.itemText}>{item.name}</InterText>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {label && (
                <InterText style={defaultLabelStyle ? styles.label : styles.filterLabel}>
                    {required && <InterText style={styles.asterisk}>*</InterText>}
                    {label}:
                </InterText>
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
                placeholder="Seleziona squadra"
                value={currentValue}
                onChange={(item) => onChange(item.id === 'NONE' ? '' : item.id)}
                renderLeftIcon={renderLeftIcon}
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
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111111',
    },
    asterisk: {
        color: '#d93636',
        fontWeight: '800',
        letterSpacing: 2,
    },
    filterLabel: {
        color: '#64748b',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
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
    logoIconWrapper: {
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoImage: {
        width: 25,
        height: 25,
        borderRadius: 22,
    },
    logoPlaceholder: {
        width: 25,
        height: 25,
        borderRadius: 6,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    logoPlaceholderEmpty: {
        width: 25,
        height: 25,
    },
    fallbackText: {
        fontSize: 11,
        fontFamily: 'Inter',
        fontWeight: '700',
        color: '#64748b',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 10,
    },
    itemText: {
        fontSize: 13,
        fontFamily: 'Inter',
        color: '#0f172a',
    },
});
