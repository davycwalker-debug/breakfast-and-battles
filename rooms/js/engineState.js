import { findCreaturesFromCsv, findMultiplierFromCsv, findPartyDefaultsFromCsv } from './dataParsers.js';

window.dndEngineState = window.dndEngineState || {
    initialized: false,
    liveCreatures: [],
    currentContainerId: '',
    rawBaselineData: null,
    draggedIndex: null,
    xpMultiplierText: "1.0",
    xpMultiplier: 1.0,
    partySlots: Array.from({ length: 6 }, () => ({ count: '', ecl: '' }))
};

export async function syncEngineStateWithCsv(containerId, data) {
    if (!data) return;

    if (window.dndEngineState.initialized && window.dndEngineState.currentContainerId === containerId) {
        return;
    }
        
    window.dndEngineState.currentContainerId = containerId;
    window.dndEngineState.rawBaselineData = data;
    window.dndEngineState.initialized = true;

    const targetTitle = data.title || '';
    let multiplierCsvText = "", partyCsvText = "", creaturesCsvText = "";

    try {
        const [multResponse, partyResponse, creaturesResponse] = await Promise.all([
            fetch('../csv/multiplier.csv').then(res => res.ok ? res.text() : ""),
            fetch('../csv/party.csv').then(res => res.ok ? res.text() : ""),
            fetch('../csv/creatures.csv').then(res => res.ok ? res.text() : "")
        ]);
        multiplierCsvText = multResponse;
        partyCsvText = partyResponse;
        creaturesCsvText = creaturesResponse;
    } catch (error) {
        console.error("DndEngine State Error: Unable to extract CSV database collections.", error);
    }

    const parsedCsvCreatures = findCreaturesFromCsv(creaturesCsvText, targetTitle);
    const activeCreatures = parsedCsvCreatures.length > 0 ? parsedCsvCreatures : (data.creatures || []);

    window.dndEngineState.liveCreatures = activeCreatures.map(c => ({
        ...JSON.parse(JSON.stringify(c)),
        subdual: c.subdual || 0 
    }));

    window.dndEngineState.xpMultiplierText = String(findMultiplierFromCsv(multiplierCsvText, targetTitle));
    
    updateXpMultiplierState(window.dndEngineState.xpMultiplierText);
    
    window.dndEngineState.partySlots = Array.from({ length: 6 }, () => ({ count: '', ecl: '' }));
    const csvPartyDefaults = findPartyDefaultsFromCsv(partyCsvText, targetTitle);

    csvPartyDefaults.forEach((incoming, i) => {
        if (i < 6 && incoming) {
            window.dndEngineState.partySlots[i].count = incoming.count !== undefined ? incoming.count : '';
            window.dndEngineState.partySlots[i].ecl = incoming.ecl !== undefined ? incoming.ecl : '';
        }
    });
}

export function updateXpMultiplierState(value) {
    window.dndEngineState.xpMultiplierText = value;
    const cleanStr = value.trim();
    const fractionMatch = cleanStr.match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);

    if (fractionMatch) {
        const num = parseFloat(fractionMatch[1]);
        const den = parseFloat(fractionMatch[2]);
        if (den !== 0) window.dndEngineState.xpMultiplier = num / den;
    } else {
        const parsed = parseFloat(cleanStr);
        if (!isNaN(parsed)) window.dndEngineState.xpMultiplier = parsed;
    }
}
