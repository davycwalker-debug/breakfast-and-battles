import { updateXpMultiplierState } from './engineState.js';
import { forceEngineRedraw } from './renderer.js';

window.handleTrackerDragStart = function(e, index) {
    window.dndEngineState.draggedIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    
    document.querySelectorAll(`.tracker-drag-handle[data-index="${index}"]`)
            .forEach(cell => cell.classList.add('is-dragging'));
};

window.handleTrackerDragEnd = function(e) {
    document.querySelectorAll('.tracker-drag-handle')
            .forEach(cell => cell.classList.remove('is-dragging', 'drag-over'));
    window.dndEngineState.draggedIndex = null;
};

window.handleTrackerDragOver = function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const targetCell = e.target.closest('.tracker-drag-handle');
    if (!targetCell) return;
    
    const targetIndex = parseInt(targetCell.getAttribute('data-index'), 10);
    const originIndex = window.dndEngineState.draggedIndex;
    
    if (originIndex === null || targetIndex === originIndex) return;

    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures || !creatures[originIndex]) return;

    // Splice, re-insert, and shift focus state tracking references cleanly
    const movedItem = creatures.splice(originIndex, 1)[0];
    creatures.splice(targetIndex, 0, movedItem);
    
    window.dndEngineState.draggedIndex = targetIndex;
    forceEngineRedraw();
};

window.sendCreatureToBottom = function(index) {
    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures || creatures.length <= 1) return;
    
    creatures.push(creatures.splice(index, 1)[0]);
    forceEngineRedraw();
};

window.sortTrackerByInitiative = function() {
    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures) return;
    
    creatures.sort((a, b) => b.initRoll - a.initRoll);
    forceEngineRedraw();
};

window.removeCombatantEntry = function(index) {
    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures || !creatures[index]) return;

    creatures.splice(index, 1);
    forceEngineRedraw();
};

window.addNewCombatantEntry = function() {
    const inputs = {
        init: document.getElementById('new-init'),
        name: document.getElementById('new-name'),
        hp: document.getElementById('new-hp'),
        maxHp: document.getElementById('new-max-hp'),
        subdual: document.getElementById('new-subdual')
    };
    
    const nameVal = inputs.name?.value.trim() || "";
    const initVal = parseInt(inputs.init?.value, 10);
    const hpVal = parseInt(inputs.hp?.value, 10);
    const maxHpVal = parseInt(inputs.maxHp?.value, 10);
    
    if (!nameVal || isNaN(initVal) || isNaN(hpVal) || isNaN(maxHpVal)) {
        alert('Please completely fill out all tracking structural properties.');
        return;
    }
    
    window.dndEngineState.liveCreatures.push({
        name: nameVal,
        initRoll: initVal,
        hp: hpVal,
        maxHp: maxHpVal,
        subdual: inputs.subdual?.value ? (parseInt(inputs.subdual.value, 10) || 0) : 0,
        notes: ""
    });
    
    forceEngineRedraw();
};

export function mutateCreatureProperty(index, key, rawValue) {
    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures?.[index]) return;
    
    const numericKeys = ['hp', 'maxHp', 'subdual', 'initRoll'];
    
    if (numericKeys.includes(key)) {
        const parsed = parseInt(rawValue, 10);
        creatures[index][key] = !isNaN(parsed) ? parsed : 0;
    } else {
        creatures[index][key] = rawValue;
    }
    forceEngineRedraw();
}

window.updateCreatureHpInline = function(index, value) {
    mutateCreatureProperty(index, 'hp', value);
};

window.updateCreatureSubdualInline = function(index, value) {
    mutateCreatureProperty(index, 'subdual', value);
};

window.updateCreatureInitiativeInline = function(index, value) {
    mutateCreatureProperty(index, 'initRoll', value);
};

window.updateCreatureNotesInline = function(index, value) {
    mutateCreatureProperty(index, 'notes', value);
};

window.updatePartyMatrixSlot = function(index, field, value) {
    if (window.dndEngineState?.partySlots?.[index]) {
        window.dndEngineState.partySlots[index][field] = value;
        forceEngineRedraw();
    }
};

window.updateXpMultiplier = function(value) {
    updateXpMultiplierState(value);
    forceEngineRedraw();
};
