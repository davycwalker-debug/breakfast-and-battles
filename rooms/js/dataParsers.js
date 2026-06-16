export function parseChallengeRating(rawCr) {
    let crValue = 0;
    const cleanCr = String(rawCr || "").trim();
    
    if (cleanCr.includes('/')) {
        const parts = cleanCr.split('/');
        const num = parseFloat(parts[0]);
        const den = parseFloat(parts[1]);
        crValue = den !== 0 ? num / den : 0;
    } else {
        crValue = parseFloat(cleanCr);
        if (isNaN(crValue)) crValue = 0;
    }
    
    return crValue;
}

export function parseCsvField(csvText, targetTitle, targetFieldIndex) {
    if (!csvText) return null;
    const lines = csvText.split(/\r?\n/);
    
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        if (row.length > targetFieldIndex && row[0].trim() === targetTitle) {
            return row[targetFieldIndex].trim();
        }
    }
    return null;
}

export function findMultiplierFromCsv(csvText, targetTitle) {
    return parseCsvField(csvText, targetTitle, 1) || "1.0";
}

export function findPartyDefaultsFromCsv(csvText, targetTitle) {
    const matches = [];
    if (!csvText) return matches;
    const lines = csvText.split(/\r?\n/);

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        if (row.length >= 3 && row[0].trim() === targetTitle) {
            matches.push({
                count: row[1].trim() !== "" ? Number(row[1].trim()) : "",
                ecl: row[2].trim() !== "" ? Number(row[2].trim()) : ""
            });
            if (matches.length === 6) break;
        }
    }
    return matches;
}

export function findCreaturesFromCsv(csvText, targetTitle) {
    if (!csvText) return [];
    const lines = csvText.split(/\r?\n/);
    const matchedCreatures = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = line.split(',');
        if (columns.length < 10) continue; 
        if (columns[0].trim() !== targetTitle) continue;
        
        const name = columns[1].trim();
        const initRoll = parseInt(columns[2].trim(), 10) || 0;
        const hp = parseInt(columns[3].trim(), 10) || 0;
        const maxHp = parseInt(columns[4].trim(), 10) || 0;
        const ac = columns[5].trim();
        const savesString = `Fort ${columns[6].trim()} / Ref ${columns[7].trim()} / Will ${columns[8].trim()}`;
        const type = columns[9].trim();
        const cr = columns.length > 10 ? parseChallengeRating(columns[10]) : 0;
        const link = (columns.length > 11 && columns[11].trim() !== "") ? columns[11].trim() : null;

        matchedCreatures.push({
            name, 
            initRoll, 
            hp, 
            maxHp, 
            ac, 
            saves: savesString, 
            type, 
            cr,
            link
        });
    }
    return matchedCreatures;
}

export function calculatePowerLevel(crValue) {
    const cr = Number(crValue) || 0;
    return cr < 2 ? cr : 2 ** (cr / 2);
}

export function calculatePartyPowerLevel(countValue, eclValue) {
    const count = Number(countValue) || 0;
    const ecl = Number(eclValue) || 0;
    return (!count || !ecl) ? 0 : calculatePowerLevel(ecl) * count;
}

export function calculateEncounterLevel(plValue) {
    const pl = Number(plValue) || 0;
    return pl < 2 ? pl : 2 * Math.log2(pl);
}

export function calculatePartyEncounterLevel(partyPlValue) {
    return calculateEncounterLevel((Number(partyPlValue) || 0) / 4);
}

export function mEven(x) {
    let iReturn = 2 * parseInt(x / 2, 10);
    if (x < iReturn) iReturn += -2;
    else if (x > iReturn) iReturn += 2;
    return iReturn;
}

export function mExperience(x, y) {
    if (x < 3) x = 3;
    if (x <= 6 && y <= 1) return 300 * y;
    if (y < 1) return 0;
      
    let iReturn = 6.25 * x * (2 ** (mEven(7 - (x - y)) / 2)) * (11 - (x - y) - mEven(7 - (x - y)));
    
    const evenCrOverrides = [4, 6, 8, 10, 12, 14, 16, 18, 20];
    if (evenCrOverrides.includes(y)) {
        if (x <= 3) return 1350 * (2 ** ((y - 4) / 2));
        const benchmarks = { 5:6, 7:8, 9:10, 11:12, 13:14, 15:16, 17:18, 19:20 };
        if (benchmarks[x] !== undefined && y >= benchmarks[x]) {
            return (1350 + (x - 3) * 450) * (2 ** ((y - benchmarks[x]) / 2));
        }
    }

    const oddCrOverrides = [7, 9, 11, 13, 15, 17, 19];
    if (oddCrOverrides.includes(y)) {
        const benchmarks = { 6:7, 8:9, 10:11, 12:13, 14:15, 16:17, 18:19 };
        if (benchmarks[x] !== undefined && y >= benchmarks[x]) {
            return (2700 + (x - 6) * 450) * (2 ** ((y - benchmarks[x]) / 2));
        }
    }
      
    if (y > 20) return 2 * mExperience(x, y - 2);
    if (Math.abs(x - y) > 7) return 0;
    
    return iReturn;
}
