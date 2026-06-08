import {
    filterNationalities,
    findNationality,
    formatNationalityLabel,
    getNationalityFlag,
    NATIONALITIES,
} from '@/constants/nationalities';
import {
    getConteggioPartiteTorneo,
    getPartiteOggi,
    getStatisticheHomeTorneo,
    homeTorneoStatsType,
    partiteOggiType,
} from '@/data/partite';

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

async function assertHomeContracts() {
    const today: partiteOggiType[] = await getPartiteOggi(
        1,
        new Date('2026-06-08T12:00:00'),
    );
    const stats: homeTorneoStatsType = await getStatisticheHomeTorneo(
        1,
        new Date('2026-06-08T12:00:00'),
    );

    const upcoming: number = stats.upcomingMatches;
    const goals: number = stats.goalsScored;

    return { today, upcoming, goals };
}

void firstName;
void exactFlag;
void exactLabel;
void exactCountry;
void listLength;
void assertMatchCount;
void assertHomeContracts;
