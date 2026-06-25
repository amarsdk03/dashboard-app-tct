import React from 'react';
import { StyleSheet } from 'react-native';
import CountryFlag from 'react-native-country-flag';
import getCountryISO2 from '@/lib/iso3to2conversion';

type DynamicReactFlagProps = {
    countryCode?: string;
    size?: string | number;
};

export default function DynamicReactFlag({ countryCode, size = 16 }: DynamicReactFlagProps) {
    const alpha2Code = (getCountryISO2(countryCode) || 'IT').toLowerCase();

    let numericHeight;

    if (typeof size === 'number') {
        numericHeight = size;
    } else {
        switch (size) {
            case '4':
                numericHeight = 12;
                break;
            case '5':
                numericHeight = 15;
                break;
            case '6':
                numericHeight = 18;
                break;
            case '8':
                numericHeight = 24;
                break;
            default:
                numericHeight = parseInt(size, 10) || 16;
        }
    }

    return <CountryFlag isoCode={alpha2Code} size={numericHeight} style={styles.flagStyle} />;
}

const styles = StyleSheet.create({
    flagStyle: {
        borderRadius: 2,
    },
});
