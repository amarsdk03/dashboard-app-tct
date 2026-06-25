'use client';

import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { InterText } from '@/components/generic/InterText';
import DynamicReactFlag from '@/components/generic/DynamicReactFlag';

type Country = {
    code: string;
    name: string;
};

const COUNTRY_LIST: Country[] = [
    { code: 'ITA', name: 'Italia' }, // Per maggior visibilità
    { code: 'AFG', name: 'Afghanistan' },
    { code: 'ALB', name: 'Albania' },
    { code: 'DZA', name: 'Algeria' },
    { code: 'AND', name: 'Andorra' },
    { code: 'AGO', name: 'Angola' },
    { code: 'ARG', name: 'Argentina' },
    { code: 'ARM', name: 'Armenia' },
    { code: 'AUS', name: 'Australia' },
    { code: 'AUT', name: 'Austria' },
    { code: 'AZE', name: 'Azerbaigian' },
    { code: 'BHS', name: 'Bahamas' },
    { code: 'BHR', name: 'Bahrein' },
    { code: 'BGD', name: 'Bangladesh' },
    { code: 'BEL', name: 'Belgio' },
    { code: 'BLZ', name: 'Belize' },
    { code: 'BEN', name: 'Benin' },
    { code: 'BTN', name: 'Bhutan' },
    { code: 'BLR', name: 'Bielorussia' },
    { code: 'BOL', name: 'Bolivia' },
    { code: 'BIH', name: 'Bosnia ed Erzegovina' },
    { code: 'BWA', name: 'Botswana' },
    { code: 'BRA', name: 'Brasile' },
    { code: 'BRN', name: 'Brunei' },
    { code: 'BGR', name: 'Bulgaria' },
    { code: 'BFA', name: 'Burkina Faso' },
    { code: 'BDI', name: 'Burundi' },
    { code: 'KHM', name: 'Cambogia' },
    { code: 'CMR', name: 'Camerun' },
    { code: 'CAN', name: 'Canada' },
    { code: 'CPV', name: 'Capo Verde' },
    { code: 'TCD', name: 'Ciad' },
    { code: 'CHL', name: 'Cile' },
    { code: 'CHN', name: 'Cina' },
    { code: 'CYP', name: 'Cipro' },
    { code: 'COL', name: 'Colombia' },
    { code: 'COM', name: 'Comore' },
    { code: 'COG', name: 'Congo' },
    { code: 'COD', name: 'Congo (RD)' },
    { code: 'PRK', name: 'Corea del Nord' },
    { code: 'KOR', name: 'Corea del Sud' },
    { code: 'CRI', name: 'Costa Rica' },
    { code: 'CIV', name: "Costa d'Avorio" },
    { code: 'HRV', name: 'Croazia' },
    { code: 'CUB', name: 'Cuba' },
    { code: 'DNK', name: 'Danimarca' },
    { code: 'ECU', name: 'Ecuador' },
    { code: 'EGY', name: 'Egitto' },
    { code: 'SLV', name: 'El Salvador' },
    { code: 'ARE', name: 'Emirati Arabi Uniti' },
    { code: 'ERI', name: 'Eritrea' },
    { code: 'EST', name: 'Estonia' },
    { code: 'SWZ', name: 'Eswatini' },
    { code: 'ETH', name: 'Etiopia' },
    { code: 'FJI', name: 'Figi' },
    { code: 'PHL', name: 'Filippine' },
    { code: 'FIN', name: 'Finlandia' },
    { code: 'FRA', name: 'Francia' },
    { code: 'GAB', name: 'Gabon' },
    { code: 'GMB', name: 'Gambia' },
    { code: 'GEO', name: 'Georgia' },
    { code: 'DEU', name: 'Germania' },
    { code: 'GHA', name: 'Ghana' },
    { code: 'JAM', name: 'Giamaica' },
    { code: 'JPN', name: 'Giappone' },
    { code: 'DJI', name: 'Gibuti' },
    { code: 'JOR', name: 'Giordania' },
    { code: 'GRC', name: 'Grecia' },
    { code: 'GTM', name: 'Guatemala' },
    { code: 'GIN', name: 'Guinea' },
    { code: 'GNQ', name: 'Guinea Equatoriale' },
    { code: 'GNB', name: 'Guinea-Bissau' },
    { code: 'GUY', name: 'Guyana' },
    { code: 'HTI', name: 'Haiti' },
    { code: 'HND', name: 'Honduras' },
    { code: 'IND', name: 'India' },
    { code: 'IDN', name: 'Indonesia' },
    { code: 'IRN', name: 'Iran' },
    { code: 'IRQ', name: 'Iraq' },
    { code: 'IRL', name: 'Irlanda' },
    { code: 'ISL', name: 'Islanda' },
    { code: 'MHL', name: 'Isole Marshall' },
    { code: 'SLB', name: 'Isole Salomone' },
    { code: 'ISR', name: 'Israele' },
    // { code: 'ITA', name: 'Italia' },
    { code: 'KAZ', name: 'Kazakistan' },
    { code: 'KEN', name: 'Kenya' },
    { code: 'KGZ', name: 'Kirghizistan' },
    { code: 'KIR', name: 'Kiribati' },
    { code: 'KWT', name: 'Kuwait' },
    { code: 'LAO', name: 'Laos' },
    { code: 'LSO', name: 'Lesotho' },
    { code: 'LVA', name: 'Lettonia' },
    { code: 'LBN', name: 'Libano' },
    { code: 'LBR', name: 'Liberia' },
    { code: 'LBY', name: 'Libia' },
    { code: 'LIE', name: 'Liechtenstein' },
    { code: 'LTU', name: 'Lituania' },
    { code: 'LUX', name: 'Lussemburgo' },
    { code: 'MKD', name: 'Macedonia del Nord' },
    { code: 'MDG', name: 'Madagascar' },
    { code: 'MYS', name: 'Malaysia' },
    { code: 'MWI', name: 'Malawi' },
    { code: 'MDV', name: 'Maldive' },
    { code: 'MLI', name: 'Mali' },
    { code: 'MLT', name: 'Malta' },
    { code: 'MAR', name: 'Marocco' },
    { code: 'MRT', name: 'Mauritania' },
    { code: 'MUS', name: 'Mauritius' },
    { code: 'MEX', name: 'Messico' },
    { code: 'FSM', name: 'Micronesia' },
    { code: 'MDA', name: 'Moldavia' },
    { code: 'MCO', name: 'Monaco' },
    { code: 'MNG', name: 'Mongolia' },
    { code: 'MNE', name: 'Montenegro' },
    { code: 'MOZ', name: 'Mozambico' },
    { code: 'MMR', name: 'Myanmar' },
    { code: 'NAM', name: 'Namibia' },
    { code: 'NRU', name: 'Nauru' },
    { code: 'NPL', name: 'Nepal' },
    { code: 'NIC', name: 'Nicaragua' },
    { code: 'NER', name: 'Niger' },
    { code: 'NGA', name: 'Nigeria' },
    { code: 'NOR', name: 'Norvegia' },
    { code: 'NZL', name: 'Nuova Zelanda' },
    { code: 'OMN', name: 'Oman' },
    { code: 'NLD', name: 'Paesi Bassi' },
    { code: 'PAK', name: 'Pakistan' },
    { code: 'PLW', name: 'Palau' },
    { code: 'PAN', name: 'Panama' },
    { code: 'PNG', name: 'Papua Nuova Guinea' },
    { code: 'PRY', name: 'Paraguay' },
    { code: 'PER', name: 'Perù' },
    { code: 'POL', name: 'Polonia' },
    { code: 'PRT', name: 'Portogallo' },
    { code: 'QAT', name: 'Qatar' },
    { code: 'GBR', name: 'Regno Unito' },
    { code: 'CZE', name: 'Repubblica Ceca' },
    { code: 'CAF', name: 'Repubblica Centrafricana' },
    { code: 'DOM', name: 'Repubblica Dominicana' },
    { code: 'ROU', name: 'Romania' },
    { code: 'RWA', name: 'Ruanda' },
    { code: 'RUS', name: 'Russia' },
    { code: 'KNA', name: 'Saint Kitts e Nevis' },
    { code: 'LCA', name: 'Saint Lucia' },
    { code: 'VCT', name: 'Saint Vincent e Grenadine' },
    { code: 'WSM', name: 'Samoa' },
    { code: 'SMR', name: 'San Marino' },
    { code: 'STP', name: 'São Tomé e Príncipe' },
    { code: 'SEN', name: 'Senegal' },
    { code: 'SRB', name: 'Serbia' },
    { code: 'SYC', name: 'Seychelles' },
    { code: 'SLE', name: 'Sierra Leone' },
    { code: 'SGP', name: 'Singapore' },
    { code: 'SYR', name: 'Siria' },
    { code: 'SVK', name: 'Slovacchia' },
    { code: 'SVN', name: 'Slovenia' },
    { code: 'SOM', name: 'Somalia' },
    { code: 'ESP', name: 'Spagna' },
    { code: 'LKA', name: 'Sri Lanka' },
    { code: 'USA', name: 'Stati Uniti' },
    { code: 'ZAF', name: 'Sudafrica' },
    { code: 'SDN', name: 'Sudan' },
    { code: 'SSD', name: 'Sudan del Sud' },
    { code: 'SUR', name: 'Suriname' },
    { code: 'SWE', name: 'Svezia' },
    { code: 'CHE', name: 'Svizzera' },
    { code: 'TJK', name: 'Tagikistan' },
    { code: 'TWN', name: 'Taiwan' },
    { code: 'TZA', name: 'Tanzania' },
    { code: 'THA', name: 'Thailandia' },
    { code: 'TLS', name: 'Timor Est' },
    { code: 'TGO', name: 'Togo' },
    { code: 'TON', name: 'Tonga' },
    { code: 'TTO', name: 'Trinidad e Tobago' },
    { code: 'TUN', name: 'Tunisia' },
    { code: 'TUR', name: 'Turchia' },
    { code: 'TKM', name: 'Turkmenistan' },
    { code: 'TUV', name: 'Tuvalu' },
    { code: 'UKR', name: 'Ucraina' },
    { code: 'UGA', name: 'Uganda' },
    { code: 'HUN', name: 'Ungheria' },
    { code: 'URY', name: 'Uruguay' },
    { code: 'UZB', name: 'Uzbekistan' },
    { code: 'VUT', name: 'Vanuatu' },
    { code: 'VEN', name: 'Venezuela' },
    { code: 'VNM', name: 'Vietnam' },
    { code: 'YEM', name: 'Yemen' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'ZWE', name: 'Zimbabwe' },
];

// Prepend the "Nessuna" choice safely out of the sorting pool
const DROPDOWN_DATA: Country[] = [{ code: 'NONE', name: 'Nessuna' }, ...COUNTRY_LIST];

type SelectNazioneProps = {
    value: string;
    onChange: (val: string) => void;
    readonly: boolean;
};

export default function NationalitySelectField({ value, onChange, readonly = false }: SelectNazioneProps) {
    // If value is empty or not selected, fall back to 'NONE'
    const currentValue = value || 'NONE';

    const renderLeftIcon = () => {
        // Don't render a flag asset for the 'Nessuna' option
        if (currentValue === 'NONE') return null;

        return (
            <View style={styles.flagIconWrapper}>
                <DynamicReactFlag countryCode={currentValue} size="4" />
            </View>
        );
    };

    const renderDropdownItem = (item: Country) => {
        const isNone = item.code === 'NONE';

        return (
            <View style={styles.itemContainer}>
                {/* Keep a placeholder box layout size for "Nessuna" to keep typography aligned with other items */}
                {isNone ? (
                    <View style={styles.flagPlaceholder} />
                ) : (
                    <DynamicReactFlag countryCode={item.code} size="4" />
                )}

                <InterText style={styles.itemText}>
                    {item.name}
                    {isNone ? '' : ` (${item.code})`}
                </InterText>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <InterText>Nazionalità:</InterText>

            <Dropdown
                style={[styles.dropdown, readonly && styles.dropdownReadonly]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={[
                    styles.selectedTextStyle,
                    readonly && styles.selectedTextStyleReadonly,
                ]}
                containerStyle={styles.dropdownContainerList}
                activeColor="#f1f5f9"
                data={DROPDOWN_DATA}
                labelField="name"
                valueField="code"
                placeholder="Seleziona Nazionalità"
                value={currentValue}
                onChange={(item) => onChange(item.code === 'NONE' ? '' : item.code)}
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
    flagIconWrapper: {
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flagPlaceholder: {
        width: 16,
        height: 12,
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
