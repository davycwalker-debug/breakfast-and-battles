import { findCreaturesFromCsv, findMultiplierFromCsv, findPartyDefaultsFromCsv } from './dataParsers.js';

const PATH_CONFIG = {
    multiplier: '../../csv/multiplier.csv',
    party: '../../csv/party.csv',
    creatures: '../../csv/creatures.csv'
};

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
        // Asynchronously extract files using path configurations
        const [multResponse, partyResponse, creaturesResponse] = await Promise.all([
            fetch(PATH_CONFIG.multiplier).then(res => res.ok ? res.text() : ""),
            fetch(PATH_CONFIG.party).then(res => res.ok ? res.text() : ""),
            fetch(PATH_CONFIG.creatures).then(res => res.ok ? res.text() : "")
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
        ...c,
        subdual: c.subdual || 0 
    }));

    window.dndEngineState.xpMultiplierText = String(findMultiplierFromCsv(multiplierCsvText, targetTitle));
    updateXpMultiplierState(window.dndEngineState.xpMultiplierText);

    const csvPartyDefaults = findPartyDefaultsFromCsv(partyCsvText, targetTitle);
    window.dndEngineState.partySlots = Array.from({ length: 6 }, (_, i) => {
        const incoming = csvPartyDefaults[i];
        return {
            count: (incoming && incoming.count !== undefined) ? incoming.count : '',
            ecl: (incoming && incoming.ecl !== undefined) ? incoming.ecl : ''
        };
    });
}

export function updateXpMultiplierState(value) {
    const cleanStr = String(value || "1.0").trim();
    window.dndEngineState.xpMultiplierText = cleanStr;
    
    const fractionMatch = cleanStr.match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);

    if (fractionMatch) {
        const num = parseFloat(fractionMatch[1]);
        const den = parseFloat(fractionMatch[2]);
        window.dndEngineState.xpMultiplier = den !== 0 ? num / den : 1.0;
    } else {
        const parsed = parseFloat(cleanStr);
        window.dndEngineState.xpMultiplier = !isNaN(parsed) ? parsed : 1.0;
    }
}
