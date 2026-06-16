import { updateXpMultiplierState } from './engineState.js';
import { forceEngineRedraw } from './renderer.js';

// --- Drag and Drop Handlers ---

window.handleTrackerDragStart = function(e, index) {
    window.dndEngineState.draggedIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    document.querySelectorAll(`.tracker-drag-handle[data-index="${index}"]`)
            .forEach(cell => cell.classList.add('is-dragging'));
}

window.handleTrackerDragEnd = function(e) {
    document.querySelectorAll('.tracker-drag-handle')
            .forEach(cell => cell.classList.remove('is-dragging', 'drag-over'));
    window.dndEngineState.draggedIndex = null;
}

window.handleTrackerDragOver = function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const targetCell = e.target.closest('.tracker-drag-handle');
    if (!targetCell) return;
    
    const targetIndex = parseInt(targetCell.getAttribute('data-index'), 10);
    const originIndex = window.dndEngineState.draggedIndex;
    if (targetIndex === originIndex || originIndex === null) return;

    const creatures = window.dndEngineState.liveCreatures;
    const movedItem = creatures.splice(originIndex, 1)[0];
    creatures.splice(targetIndex, 0, movedItem);
    
    window.dndEngineState.draggedIndex = targetIndex;
    forceEngineRedraw();
}

// --- List Mutation Modifiers ---

window.sendCreatureToBottom = function(index) {
    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures || creatures.length <= 1) return;
    
    creatures.push(creatures.splice(index, 1)[0]);
    forceEngineRedraw();
}

window.sortTrackerByInitiative = function() {
    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures) return;
    
    creatures.sort((a, b) => b.initRoll - a.initRoll);
    forceEngineRedraw();
}

window.removeCombatantEntry = function(index) {
    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures) return;

    creatures.splice(index, 1);
    forceEngineRedraw();
}

window.addNewCombatantEntry = function() {
    const inputs = {
        init: document.getElementById('new-init'),
        name: document.getElementById('new-name'),
        hp: document.getElementById('new-hp'),
        maxHp: document.getElementById('new-max-hp'),
        subdual: document.getElementById('new-subdual')
    };
    
    if (!inputs.name?.value.trim() || !inputs.init?.value || !inputs.hp?.value || !inputs.maxHp?.value) {
        alert('Please completely fill out all tracking structural properties.');
        return;
    }
    
    window.dndEngineState.liveCreatures.push({
        name: inputs.name.value.trim(),
        initRoll: parseInt(inputs.init.value, 10),
        hp: parseInt(inputs.hp.value, 10),
        maxHp: parseInt(inputs.maxHp.value, 10),
        subdual: inputs.subdual?.value ? parseInt(inputs.subdual.value, 10) : 0
    });
    
    forceEngineRedraw();
}

// --- Property Property Mutators ---

export function mutateCreatureProperty(index, key, rawValue) {
    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures?.[index]) return;
    
    // Check if the property is a text-bypassed value or note column string
    if (key === 'hp' || key === 'maxHp' || key === 'subdual' || key === 'initRoll') {
        const parsed = parseInt(rawValue, 10);
        if (isNaN(parsed)) return;
        creatures[index][key] = parsed;
    } else {
        creatures[index][key] = rawValue;
    }
    forceEngineRedraw();
}

window.updateCreatureHpInline = function(index, value) {
    mutateCreatureProperty(index, 'hp', value);
}

window.updateCreatureSubdualInline = function(index, value) {
    mutateCreatureProperty(index, 'subdual', value);
}

window.updateCreatureInitiativeInline = function(index, value) {
    mutateCreatureProperty(index, 'initRoll', value);
}

window.updatePartyMatrixSlot = function(index, field, value) {
    if (window.dndEngineState?.partySlots?.[index]) {
        window.dndEngineState.partySlots[index][field] = value;
        forceEngineRedraw();
    }
}

window.updateXpMultiplier = function(value) {
    updateXpMultiplierState(value);
    forceEngineRedraw();
}
