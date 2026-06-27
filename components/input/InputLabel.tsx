import React, { useState } from 'react';
import { Pressable, StyleProp, StyleSheet, TextStyle, View } from 'react-native';
import { HelpCircleIcon } from 'lucide-react-native';
import { InterText } from '@/components/generic/InterText';

type Props = {
    label: string;
    required?: boolean;
    tooltip?: string;
    style?: StyleProp<TextStyle>;
};

export default function InputLabel({ label, required = false, tooltip, style }: Props) {
    const [visible, setVisible] = useState(false);

    return (
        <View style={styles.wrapper}>
            <View style={styles.row}>
                <InterText style={style}>
                    {required && <InterText style={styles.asterisk}>*</InterText>}
                    {label}:
                </InterText>
                {tooltip && (
                    <Pressable
                        style={styles.helpButton}
                        onPress={() => setVisible((current) => !current)}
                        onHoverIn={() => setVisible(true)}
                        onHoverOut={() => setVisible(false)}
                        accessibilityRole="button"
                        accessibilityLabel={`Info ${label}`}>
                        <HelpCircleIcon size={14} color="#94a3b8" />
                    </Pressable>
                )}
            </View>
            {tooltip && visible && (
                <View style={styles.tooltip}>
                    <InterText style={styles.tooltipText}>{tooltip}</InterText>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        gap: 5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    asterisk: {
        color: '#d93636',
        fontWeight: '800',
        letterSpacing: 2,
    },
    helpButton: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tooltip: {
        alignSelf: 'flex-start',
        maxWidth: '100%',
        borderRadius: 10,
        backgroundColor: '#0f172a',
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    tooltipText: {
        color: '#ffffff',
        fontFamily: 'Inter',
        fontSize: 12,
        lineHeight: 16,
    },
});
