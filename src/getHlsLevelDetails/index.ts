import type { LevelDetails } from 'hls.js';
import type Hls from 'hls.js';

export function getHlsLevelDetails(
    hls: Hls | undefined,
): LevelDetails | undefined {
    if (hls === undefined) {
        return undefined;
    }

    const { currentLevel, levels } = hls;

    if (!levels) {
        return undefined;
    }

    const level = levels[currentLevel];

    if (level && level.details) {
        return level.details;
    }

    const levelWithDetails = levels.find(({ details }) => Boolean(details));
    return levelWithDetails === undefined
        ? undefined
        : levelWithDetails.details;
}
