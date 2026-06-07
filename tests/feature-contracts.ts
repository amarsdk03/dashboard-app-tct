import {
    filterNationalities,
    findNationality,
    formatNationalityLabel,
    getNationalityFlag,
    NATIONALITIES,
} from '@/constants/nationalities';
import { getConteggioPartiteTorneo } from '@/data/partite';

const filtered = filterNationalities('ita');
const firstName: string | undefined = filtered[0]?.name;
const exactFlag: string | null = getNationalityFlag('Italia');
const exactLabel: string | null = formatNationalityLabel('Italia');
const exactCountry = findNationality('Italia');
const listLength: number = NATIONALITIES.length;

async function assertMatchCount() {
    const count: number = await getConteggioPartiteTorneo(1);
    return count;
}

void firstName;
void exactFlag;
void exactLabel;
void exactCountry;
void listLength;
void assertMatchCount;
