import { InterText } from '@/components/generic/InterText';
import { StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { LucideIcon } from 'lucide-react-native';

interface FormButtonProps {
    type?: 'primary' | 'secondary' | 'destructive';
    label: string;
    icon?: LucideIcon;
    onPress?: () => void;
    disabled?: boolean;
    activeOpacity?: number;
}

export default function FormButton({
    type = 'primary',
    label,
    icon: Icon,
    onPress,
    disabled = false,
    activeOpacity = 0.8,
}: FormButtonProps) {
    const iconColor = type === 'primary' ? '#ffffff' : type === 'secondary' ? '#6b7280' : '#7c3f3f';

    return (
        <TouchableOpacity
            style={[
                styles.button,
                type === 'secondary' && styles.buttonSecondary,
                type === 'destructive' && styles.buttonDestructive,
                disabled && { opacity: 0.6 },
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={activeOpacity}>
            {Icon && <Icon size={16} color={iconColor} />}
            <InterText
                style={[
                    styles.buttonText,
                    type === 'secondary' && styles.buttonSecondaryText,
                    type === 'destructive' && styles.buttonDestructiveText,
                ]}>
                {label}
            </InterText>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flex: 1,
        width: '100%',
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    buttonDestructive: {
        backgroundColor: '#d9a3a3',
    },
    buttonDestructiveText: {
        color: '#7c3f3f',
    },
    buttonSecondary: {
        backgroundColor: '#e5e7eb',
    },
    buttonSecondaryText: {
        color: '#6b7280',
    },
});
