export const LEVEL_THRESHOLDS = [
    { level: 1, min: 0, rank: "Beginner" },
    { level: 2, min: 300, rank: "Beginner" },
    { level: 3, min: 1000, rank: "Standard" },
    { level: 4, min: 3000, rank: "Standard" },
    { level: 5, min: 6000, rank: "Standard" },
    { level: 6, min: 10000, rank: "Expert" },
    { level: 7, min: 15000, rank: "Expert" },
    { level: 8, min: 22000, rank: "Master" },
    { level: 9, min: 32000, rank: "Master" },
    { level: 10, min: 50000, rank: "Master" },
];

export function calculateLevel(xp: number) {
    // Find the highest level where xp >= min
    let current = LEVEL_THRESHOLDS[0];
    for (const threshold of LEVEL_THRESHOLDS) {
        if (xp >= threshold.min) {
            current = threshold;
        } else {
            break;
        }
    }

    // Find next threshold
    const nextIdx = LEVEL_THRESHOLDS.indexOf(current) + 1;
    const nextThreshold = LEVEL_THRESHOLDS[nextIdx];

    return {
        level: current.level,
        rank: current.rank,
        currentLevelMin: current.min,
        nextLevelMin: nextThreshold ? nextThreshold.min : null // null means max level
    };
}

export function getLevelProgress(xp: number) {
    const { currentLevelMin, nextLevelMin } = calculateLevel(xp);
    if (!nextLevelMin) return 100; // Max level

    const range = nextLevelMin - currentLevelMin;
    const progress = xp - currentLevelMin;

    return Math.min(100, Math.max(0, (progress / range) * 100));
}
