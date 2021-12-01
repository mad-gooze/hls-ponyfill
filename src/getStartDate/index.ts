import type Hls from 'hls.js';
import { getHlsLevelDetails } from '../getHlsLevelDetails';

export function getStartDate(hls: Hls | undefined): Date {
    const INVALID_DATE = new Date(NaN);

    const details = getHlsLevelDetails(hls);
    if (details === undefined) {
        return INVALID_DATE;
    }

    const { hasProgramDateTime, fragments } = details;
    if (!hasProgramDateTime || fragments.length === 0) {
        return INVALID_DATE;
    }
    const [{ programDateTime, start }] = fragments;

    return programDateTime === null || start === null
        ? INVALID_DATE
        : new Date(programDateTime - start * 1000);
}
