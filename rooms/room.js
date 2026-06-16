/**
 * D&D 3.5 Encounter & Initiative Tracking Engine
 */

// Global State Management Isolation Vault
window.dndEngineState = window.dndEngineState || {
    initialized: false,
    liveCreatures: [],
    currentContainerId: '',
    rawBaselineData: null,
    draggedIndex: null,
    xpMultiplierText: "1.0",
    xpMultiplier: 1.0
};

/**
 * Main Execution Entry Point
 */
async function renderRoomTemplate(containerId, data) {
    injectEngineStyles();

    await syncEngineStateWithCsv(containerId, data);

    const container = document.getElementById(containerId);
    if (!container) return console.error(`Target container element ID "${containerId}" was not found.`);

    // 1. Calculate Core Encounter & XP Metrics
    const metrics = calculateEncounterMetrics(data);
    const displaySubtitle = buildSubtitle(data.subtitle, metrics);

    // 2. Assemble Layout Fragment Matrix
    let htmlLines = [
        `<div class="dnd-room-wrapper">`,
        renderHeader(data.title, displaySubtitle),
        renderPartyEclMatrix(window.dndEngineState.partySlots, data.creatures, metrics.totalPartyCount)
    ];
    
    if (data.readAloud) {
        htmlLines.push(`
            <section class="room-section read-aloud-section">
                <h3>Read-Aloud Narrative</h3>
                ${renderReadAloudBox(data.readAloud)}
            </section>
        `);
    }

    if (data.initialReadAloudChecks) {
        htmlLines.push(`<div class="ability-checks-container">${renderInlineChecks(data.initialReadAloudChecks)}</div>`);
    }

    htmlLines.push(renderEnvironment(data.environment));

    if (data.dialogueTree) {
        htmlLines.push(renderDialogueTree(data.dialogueTree));
    }

    htmlLines.push(renderCombatTracker(window.dndEngineState.liveCreatures, data.creatures, data.setupPositions));
    htmlLines.push(renderTactics(data.tactics, data.development));
    htmlLines.push(renderTraps(data.traps));
    htmlLines.push(renderTreasure(data.treasure));

    if (data.specialEvents) {
        data.specialEvents.forEach(evt => htmlLines.push(renderSpecialEvent(evt)));
    }

    if (data.additionalSections) {
        data.additionalSections.forEach(sec => htmlLines.push(renderCustomSection(sec)));
    }

    htmlLines.push(`</div>`);
    
    // 3. Execute DOM Write & Focus Preservation Sequence
    const savedFocusKey = captureActiveFocusKey();
    
    container.innerHTML = htmlLines.join('\n');
    
    restoreFocusKey(container, savedFocusKey);
}

// =========================================================================
// PURE BUSINESS MATH ENGINE HELPERS
// =========================================================================

/**
 * Isolates and processes all monster CR and party ECL math formulas.
 */
function calculateEncounterMetrics(data) {
    let totalPartyCount = 0;
    let totalPartyECL = 0;
    let totalPartyPl = 0;
    let clString = "0.00";
    let xpString = "0";

    if (!data.creatures || !Array.isArray(data.creatures)) {
        return { totalPartyCount, clString, xpString };
    }

    const totalPl = data.creatures.reduce((sum, c) => sum + calculatePowerLevel(c.cr), 0);
    const totalEl = calculateEncounterLevel(totalPl);

    if (window.dndEngineState && window.dndEngineState.partySlots) {
        window.dndEngineState.partySlots.forEach(slot => {
            const count = Number(slot.count) || 0;
            const ecl = Number(slot.ecl) || 0;
            totalPartyCount += count;
            totalPartyECL += (count * ecl);
            totalPartyPl += calculatePartyPowerLevel(count, ecl);
        });
    }

    const totalPartyEl = calculatePartyEncounterLevel(totalPartyPl);
    const totalCr = totalEl - totalPartyEl;
    clString = totalCr.toFixed(2);

    const averagePartyLevel = totalPartyCount > 0 ? (totalPartyECL / totalPartyCount) : 0;
    let dynamicXpAward = 0;

    if (averagePartyLevel > 0) {
        dynamicXpAward = data.creatures.reduce((sum, creature) => {
            return sum + mExperience(averagePartyLevel, Number(creature.cr) || 0);
        }, 0);
    }

    const averageXp = dynamicXpAward > 0 ? (dynamicXpAward / totalPartyCount) : 0;
    const adjustedXp = totalCr > 6 ? averageXp / 10 : averageXp;
    const activeMultiplier = window.dndEngineState.xpMultiplier || 1.0;
    xpString = Math.ceil(adjustedXp * activeMultiplier).toString();

    return { totalPartyCount, clString, xpString };
}

function buildSubtitle(baseSubtitle, metrics) {
    const metricsString = `CL ${metrics.clString}, XP ${metrics.xpString}`;
    return baseSubtitle ? `${baseSubtitle} -- ${metricsString}` : metricsString;
}

// =========================================================================
// DATA COMPONENT INTERFACE RENDERS
// =========================================================================

function renderHeader(title, subtitle) {
    return `
        <header class="room-header">
            <h1>${title || 'Encounter Area'}</h1>
            <div class="header-subtitle-row">
                ${subtitle ? `<p class="room-subtitle">${subtitle}</p>` : '<div></div>'}
                <div class="multiplier-wrapper">
                    <label for="input-xp-multiplier" class="multiplier-label">Multiplier:</label>
                    <input type="text" 
                           id="input-xp-multiplier" 
                           data-focus-key="xp-multiplier" 
                           class="tracker-input multiplier-input" 
                           placeholder="1.0" 
                           value="${window.dndEngineState.xpMultiplierText}" 
                           oninput="updateXpMultiplier(this.value)">
                </div>
            </div>
        </header>
        <hr class="section-divider">
    `;
}

function renderReadAloudBox(text) {
    return text ? `<div class="read-aloud-box"><p>${text}</p></div>` : '';
}

function renderInlineChecks(mechanicsArray) {
    if (!mechanicsArray || !mechanicsArray.length) return '';
    
    return mechanicsArray.map(check => `
        <div class="check-card">
            ${check.prompt ? `<div class="dialogue-prompt"><strong>Prompt:</strong> ${check.prompt}</div>` : ''}
            ${check.readAloud ? renderReadAloudBox(check.readAloud) : ''}
            <div class="check-dc-badge">
                <span class="check-type">${check.type || 'Ability Check'}</span>
                <span class="check-dc">DC ${check.dc}</span>
            </div>
            <div class="check-branches">
                <div class="branch success"><strong>Success:</strong> "${check.success}"</div>
                <div class="branch failure"><strong>Failure:</strong> "${check.failure}"</div>
            </div>
        </div>
    `).join('');
}

function renderEnvironment(envObj) {
    if (!envObj) return '';
    
    const featuresHtml = envObj.features?.length 
        ? `<h4>Key Features</h4><ul class="features-list">${envObj.features.map(f => `<li><strong>${f.name}:</strong> ${f.desc}</li>`).join('')}</ul>` 
        : '';
        
    const doorsHtml = envObj.doors?.length 
        ? `<h4>Doors</h4><ul class="doors-list">${envObj.doors.map(d => `<li><strong>${d.location}:</strong> ${d.desc}</li>`).join('')}</ul>` 
        : '';

    return `
        <section class="room-section environment-section">
            <h3>Room Features & Environment</h3>
            <ul class="env-meta-list">
                <li><strong>Dimensions:</strong> ${envObj.dimensions || 'N/A'}</li>
                <li><strong>Illumination:</strong> ${envObj.illumination || 'N/A'}</li>
            </ul>
            <div class="env-details">${featuresHtml}${doorsHtml}</div>
        </section>
    `;
}

function renderDialogueTree(dialogueArray) {
    if (!dialogueArray || !dialogueArray.length) return '';
    
    return `
        <div class="dialogue-tree-container">
            <h3>Dialogue Options</h3>
            <div class="dialogue-branches">
                ${dialogueArray.map(node => `
                    <div class="dialogue-node">
                        <div class="dialogue-prompt"><strong>Prompt:</strong> "${node.prompt}"</div>
                        <div class="dialogue-response">
                            <span class="speaker-tag">${node.speaker || 'NPC'}:</span> "${node.response}"
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderCombatTracker(liveTracker, baselineRoster, positions) {
    if (!liveTracker) return '';
    const rosterData = baselineRoster || [];
    
    return `
        <section class="room-section combat-section">
            <div class="combat-tracker-header">
                <h3>Combat & Initiative Tracker</h3>
                <button type="button" class="btn-sort-tracker" onclick="sortTrackerByInitiative()">Sort Initiative</button>
            </div>
            
            <div class="tracker-box">
                <div class="tracker-grid" ondragover="handleTrackerDragOver(event)">
                    <div class="tracker-header-cell text-center accent-gold-text">End Turn</div>
                    <div class="tracker-header-cell">Initiative</div>
                    <div class="tracker-header-cell">Creature Name</div>
                    <div class="tracker-header-cell text-right">Health Status</div>
                    
                    ${liveTracker.map((c, idx) => renderTrackerRow(c, idx, rosterData)).join('')}

                    <div class="tracker-cell tracker-add-row-cap text-center">
                        <button type="button" class="btn-add-combatant" onclick="addNewCombatantEntry()">Add</button>
                    </div>
                    <div class="tracker-cell tracker-add-row-cap">
                        <input type="number" id="new-init" data-focus-key="new-init-input" class="tracker-input num-input" placeholder="Roll">
                    </div>
                    <div class="tracker-cell tracker-add-row-cap">
                        <input type="text" id="new-name" data-focus-key="new-name-input" class="tracker-input" placeholder="Name/Group...">
                    </div>
                    <div class="tracker-cell hp-col tracker-add-row-cap">
                        <input type="number" id="new-hp" data-focus-key="new-hp-input" class="tracker-input num-input w-60" placeholder="HP">
                        <span class="text-muted mx-2">/</span>
                        <input type="number" id="new-max-hp" data-focus-key="new-max-hp-input" class="tracker-input num-input w-60" placeholder="Max">
                        <span class="text-muted mx-4">|</span>
                        <span class="subdual-inline-wrapper">
                            Sub: <input type="number" id="new-subdual" data-focus-key="new-subdual-input" class="tracker-input num-input sub-input-w accent-orange-text" value="0">
                        </span>
                    </div>
                </div>
            </div>
            
            ${positions ? `<p class="setup-positions"><strong>Setup Positions:</strong> ${positions}</p>` : ''}
        </section>
    `;
}

function renderTrackerRow(c, idx, rosterData) {
    if (c.subdual === undefined) c.subdual = 0;
    const statusClass = getTrackerStatusClass(c.hp, c.subdual);
    const stats = rosterData.find(r => r.name === c.name);
    
    const nameDisplay = stats ? `
        <div class="tooltip-target">
            ${c.name}
            <div class="roster-tooltip">
                <div class="tooltip-stat"><strong>AC:</strong> ${stats.ac}</div>
                <div class="tooltip-stat"><strong>Saves:</strong> ${stats.saves}</div>
                <div class="tooltip-stat"><strong>Type:</strong> ${stats.type}</div>
            </div>
        </div>
    ` : `<span>${c.name}</span>`;

    return `
        <div class="tracker-cell tracker-drag-handle ${statusClass}" 
             draggable="true" 
             data-index="${idx}" 
             ondragstart="handleTrackerDragStart(event, ${idx})" 
             ondragend="handleTrackerDragEnd(event)">
            <button type="button" class="btn-send-bottom" title="End Turn" onclick="sendCreatureToBottom(${idx})">Next</button>
        </div>
        
        <div class="tracker-cell init-col ${statusClass} flex-align-center-gap-8">
            <button type="button" class="btn-send-bottom remove-btn-color font-weight-bold" title="Remove Combatant" onclick="removeCombatantEntry(${idx})">×</button>
            <label for="creature-init-${idx}" class="init-label-text">Init</label>
            <input type="number" 
                   id="creature-init-${idx}"
                   name="creature-init-${idx}"
                   data-focus-key="creature-init-${idx}" 
                   class="hp-input inline-init-input" 
                   value="${c.initRoll}" 
                   oninput="updateCreatureInitiativeInline(${idx}, this.value)">
        </div>
        
        <div class="tracker-cell name-col ${statusClass}" data-index="${idx}">
            <span class="status-text flag-staggered">[Staggered] </span>
            <span class="status-text flag-dying">[Dying] </span>
            <span class="status-text flag-dead">[Dead] </span>
            <span class="status-text flag-unconscious">[Unconscious] </span>
            ${nameDisplay}
        </div>
        
        <div class="tracker-cell hp-col ${statusClass}" data-index="${idx}">
            <span class="hp-badge" draggable="false">
                <input type="number" 
                       id="creature-hp-${idx}"
                       name="creature-hp-${idx}"
                       aria-label="Creature HP"
                       data-focus-key="creature-hp-${idx}" 
                       class="hp-input" 
                       value="${c.hp}" 
                       data-max="${c.maxHp}" 
                       oninput="updateCreatureHpInline(${idx}, this.value)">
                <span class="text-muted">/ ${c.maxHp} HP</span>
            </span>
            
            <span class="text-muted font-weight-normal mx-4">|</span>
            
            <span class="subdual-badge subdual-text-wrapper" draggable="false">
                <label for="creature-sub-${idx}">Sub:</label> 
                <input type="number" 
                       id="creature-sub-${idx}"
                       name="creature-sub-${idx}"
                       data-focus-key="creature-sub-${idx}" 
                       class="hp-input inline-sub-input" 
                       value="${c.subdual}" 
                       oninput="updateCreatureSubdualInline(${idx}, this.value)">
            </span>
        </div>
    `;
}

function getTrackerStatusClass(hp, subdual) {
    if (hp <= -1 && hp >= -9) return 'tracker-row-dying';
    if (hp <= -10) return 'tracker-row-dead';
    if (hp >= 0) {
        if (subdual > hp) return 'tracker-row-unconscious';
        if (subdual === hp || hp === 0) return 'tracker-row-staggered';
    }
    return '';
}

function renderTactics(tacticsObj, developmentText) {
    if (!tacticsObj && !developmentText) return '';
    
    let html = `<section class="room-section tactics-section"><h3>Tactics & Development</h3>`;
    
    if (tacticsObj) {
        if (tacticsObj.initialRound) {
            html += `<p class="mb-16"><strong>Initial Round / Trigger:</strong> ${tacticsObj.initialRound}</p>`;
        }
        if (tacticsObj.individual?.length) {
            html += `
                <h4>Individual Strategy</h4>
                <ul class="tactics-list">
                    ${tacticsObj.individual.map(t => `<li><strong>${t.name}:</strong> ${t.strategy}</li>`).join('')}
                </ul>
            `;
        }
    }
    
    if (developmentText) {
        html += `<div class="development-box"><strong>Development / Morale:</strong> ${developmentText}</div>`;
    }
    
    return html + `</section>`;
}

function renderTraps(trapsArray) {
    if (!trapsArray || !trapsArray.length) return '';
    
    return `
        <section class="room-section traps-section">
            <h3>Hazards & Traps</h3>
            ${trapsArray.map(t => `
                <div class="trap-card">
                    <div class="trap-header">
                        <span class="trap-title"><strong>${t.name}</strong></span>
                        <span class="trap-cr">CR ${t.cr}</span>
                    </div>
                    <ul class="trap-meta">
                        <li><strong>Trigger:</strong> ${t.trigger} &nbsp;|&nbsp; <strong>Reset:</strong> ${t.reset}</li>
                        <li><strong>Search DC:</strong> <code class="dc-block">DC ${t.searchDc}</code> &nbsp;|&nbsp; <strong>Disable Device DC:</strong> <code class="dc-block">DC ${t.disableDc}</code></li>
                        <li><strong class="accent-gold-text">Effect:</strong> ${t.effect}</li>
                    </ul>
                </div>
            `).join('')}
        </section>
    `;
}

function renderTreasure(treasureObj) {
    if (!treasureObj) return '';
    
    return `
        <section class="room-section treasure-section">
            <h3>Treasure & Rewards</h3>
            ${treasureObj.carried ? `<p class="mb-16"><strong>Carried Gear:</strong> ${treasureObj.carried}</p>` : ''}
            ${treasureObj.containers?.length ? `
                <h4>Hidden / Secured Wealth</h4>
                <ul class="treasure-list">
                    ${treasureObj.containers.map(box => `<li><strong>${box.name}:</strong> ${box.contents}</li>`).join('')}
                </ul>
            ` : ''}
        </section>
    `;
}

function renderSpecialEvent(eventObj) {
    if (!eventObj) return '';
    const severityLabel = eventObj.severity === 'danger' ? 'Critical' : 'Notice';
    
    return `
        <div class="special-event-card ${eventObj.severity || 'info'}">
            <div class="event-header">
                <span class="event-status-badge status-${eventObj.severity || 'info'}">${severityLabel}</span>
                <div class="event-title-group">
                    <h4>${eventObj.title}</h4>
                    <span class="event-trigger">Trigger: ${eventObj.trigger}</span>
                </div>
            </div>
            <div class="event-body">
                ${eventObj.readAloud ? renderReadAloudBox(eventObj.readAloud) : ''}
                ${eventObj.mechanics ? `<div class="event-mechanics mt-16">${renderInlineChecks(eventObj.mechanics)}</div>` : ''}
                ${eventObj.outcome ? renderReadAloudBox(eventObj.outcome) : ''}
            </div>
        </div>
    `;
}

function renderCustomSection(sec) {
    return `
        <section class="room-section custom-section">
            <h3>${sec.heading}</h3>
            <div class="custom-content">${sec.content}</div>
        </section>
    `;
}

function renderPartyEclMatrix(slots, creatures, totalPartyCount) {
    const activeMultiplier = window.dndEngineState.xpMultiplier || 1.0;

    let rowsHtml = slots.map((slot, index) => {
        const rowCount = Number(slot.count) || 0;
        const rowEcl = Number(slot.ecl) || 0;
        let rowXpString = "—";

        if (rowCount > 0 && rowEcl > 0 && creatures && Array.isArray(creatures)) {
            const dynamicRowXpAward = creatures.reduce((sum, creature) => {
                return sum + mExperience(rowEcl, Number(creature.cr) || 0);
            }, 0);
            const averageRowXp = dynamicRowXpAward > 0 ? (dynamicRowXpAward / totalPartyCount) : 0;
            rowXpString = Math.ceil(averageRowXp * activeMultiplier);
        }

        return `
            <div class="party-matrix-row">
                <div class="matrix-cell-num">#${index + 1}</div>
                
                <div class="matrix-input-group">
                    <label for="matrix-count-${index}">Count:</label>
                    <input type="number" 
                           id="matrix-count-${index}"
                           data-focus-key="matrix-count-${index}"
                           class="tracker-input matrix-input num-input" 
                           placeholder="0" 
                           value="${slot.count}" 
                           oninput="updatePartyMatrixSlot(${index}, 'count', this.value)">
                </div>
                
                <div class="matrix-input-group">
                    <label for="matrix-ecl-${index}">ECL:</label>
                    <input type="number" 
                           id="matrix-ecl-${index}"
                           data-focus-key="matrix-ecl-${index}"
                           class="tracker-input matrix-input num-input" 
                           placeholder="1" 
                           value="${slot.ecl}" 
                           oninput="updatePartyMatrixSlot(${index}, 'ecl', this.value)">
                </div>
                
                <div class="matrix-input-group row-xp-display-group">
                    <span class="row-xp-label">XP Per:</span>
                    <div class="matrix-xp-output">${rowXpString}</div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <section class="room-section party-matrix-section">
            <div class="matrix-header-title">Active Adventuring Party Configuration</div>
            <div class="party-matrix-grid">
                ${rowsHtml}
            </div>
        </section>
        <section class="section-divider-wrapper"><hr class="section-divider"></section>
    `;
}

// =========================================================================
// FOCUS PRESERVATION ENGINE UTILITIES
// =========================================================================

function captureActiveFocusKey() {
    const activeEl = document.activeElement;
    return activeEl && activeEl.hasAttribute('data-focus-key') ? activeEl.getAttribute('data-focus-key') : null;
}

function restoreFocusKey(container, savedFocusKey) {
    if (!savedFocusKey) return;
    const restoreEl = container.querySelector(`[data-focus-key="${savedFocusKey}"]`);
    if (restoreEl) {
        restoreEl.focus();
        const tempVal = restoreEl.value;
        restoreEl.value = '';
        restoreEl.value = tempVal;
    }
}

// =========================================================================
// RUNTIME MUTATORS & ENGINE LOGIC
// =========================================================================

/**
 * Drag and Drop Sequence Interceptors
 */
function handleTrackerDragStart(e, index) {
    window.dndEngineState.draggedIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    
    document.querySelectorAll(`.tracker-drag-handle[data-index="${index}"]`)
            .forEach(cell => cell.classList.add('is-dragging'));
}

function handleTrackerDragEnd(e) {
    document.querySelectorAll('.tracker-drag-handle')
            .forEach(cell => cell.classList.remove('is-dragging', 'drag-over'));
    window.dndEngineState.draggedIndex = null;
}

function handleTrackerDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const targetCell = e.target.closest('.tracker-drag-handle');
    if (!targetCell) return;
    
    const targetIndex = parseInt(targetCell.getAttribute('data-index'), 10);
    const originIndex = window.dndEngineState.draggedIndex;
    if (targetIndex === originIndex || originIndex === null) return;

    // Mutate state matrix placement array position smoothly
    const creatures = window.dndEngineState.liveCreatures;
    const movedItem = creatures.splice(originIndex, 1)[0];
    creatures.splice(targetIndex, 0, movedItem);
    
    window.dndEngineState.draggedIndex = targetIndex;
    forceEngineRedraw();
}

/**
 * Round Lifecycle Operations
 */
function sendCreatureToBottom(index) {
    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures || creatures.length <= 1) return;
    
    creatures.push(creatures.splice(index, 1)[0]);
    forceEngineRedraw();
}

function sortTrackerByInitiative() {
    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures) return;
    
    creatures.sort((a, b) => b.initRoll - a.initRoll);
    forceEngineRedraw();
}

/**
 * Inline Core Tracker Mutators
 */
function updateCreatureHpInline(index, value) {
    mutateCreatureProperty(index, 'hp', value);
}

function updateCreatureSubdualInline(index, value) {
    mutateCreatureProperty(index, 'subdual', value); // Re-renders and updates flags cleanly
}

function updateCreatureInitiativeInline(index, value) {
    mutateCreatureProperty(index, 'initRoll', value);
}

function removeCombatantEntry(index) {
    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures) return;

    creatures.splice(index, 1);
    forceEngineRedraw();
}

/**
 * Structured Data Entry Form Submission Handling
 */
function addNewCombatantEntry() {
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

/**
 * Global Configuration Space Adjusters
 */
function updatePartyMatrixSlot(index, field, value) {
    if (window.dndEngineState?.partySlots?.[index]) {
        window.dndEngineState.partySlots[index][field] = value;
        forceEngineRedraw();
    }
}

function updateXpMultiplier(value) {
    window.dndEngineState.xpMultiplierText = value;
    const cleanStr = value.trim();

    // Check fraction configuration context maps ("1/2", " 3 / 4 ")
    const fractionMatch = cleanStr.match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);

    if (fractionMatch) {
        const num = parseFloat(fractionMatch[1]);
        const den = parseFloat(fractionMatch[2]);
        if (den !== 0) window.dndEngineState.xpMultiplier = num / den;
    } else {
        const parsed = parseFloat(cleanStr);
        if (!isNaN(parsed)) window.dndEngineState.xpMultiplier = parsed;
    }

    forceEngineRedraw();
}

// =========================================================================
// MATH ENGINE & CALCULATION LAYER
// =========================================================================

function calculatePowerLevel(crValue) {
    const cr = Number(crValue) || 0;
    return cr < 2 ? cr : Math.pow(2, cr / 2);
}

function calculatePartyPowerLevel(countValue, eclValue) {
    const count = Number(countValue) || 0;
    const ecl = Number(eclValue) || 0;
    return (!count || !ecl) ? 0 : calculatePowerLevel(ecl) * count;
}

function calculateEncounterLevel(plValue) {
    const pl = Number(plValue) || 0;
    return pl < 2 ? pl : 2 * (Math.log(pl) / Math.log(2));
}

function calculatePartyEncounterLevel(partyPlValue) {
    return calculateEncounterLevel((Number(partyPlValue) || 0) / 4);
}

function mEven(x) {
    let iReturn = 2 * parseInt(x / 2);
    if (x < iReturn) iReturn += -2;
    else if (x > iReturn) iReturn += 2;
    return iReturn;
}

function mExperience(x, y) {
    if (x < 3) x = 3;
    if (x <= 6 && y <= 1) return 300 * y;
    if (y < 1) return 0;
      
    let iReturn = 6.25 * x * (Math.pow(2, mEven(7 - (x - y)) / 2)) * (11 - (x - y) - mEven(7 - (x - y)));
    
    // Explicit 3.5 System Error Catching Overrides
    const evenCrOverrides = [4, 6, 8, 10, 12, 14, 16, 18, 20];
    if (evenCrOverrides.includes(y)) {
        if (x <= 3) return 1350 * Math.pow(2, (y - 4) / 2);
        const benchmarks = { 5:6, 7:8, 9:10, 11:12, 13:14, 15:16, 17:18, 19:20 };
        if (benchmarks[x] !== undefined && y >= benchmarks[x]) {
            return (1350 + (x - 3) * 450) * Math.pow(2, (y - benchmarks[x]) / 2);
        }
    }

    const oddCrOverrides = [7, 9, 11, 13, 15, 17, 19];
    if (oddCrOverrides.includes(y)) {
        const benchmarks = { 6:7, 8:9, 10:11, 12:13, 14:15, 16:17, 18:19 };
        if (benchmarks[x] !== undefined && y >= benchmarks[x]) {
            return (2700 + (x - 6) * 450) * Math.pow(2, (y - benchmarks[x]) / 2);
        }
    }
      
    if (y > 20) return 2 * mExperience(x, y - 2);
    if (Math.abs(x - y) > 7) return 0;
    
    return iReturn;
}

// =========================================================================
// DATA ARCHITECTURE LAYER READ/WRITE/SYNC UTILITIES
// =========================================================================

function findMultiplierFromCsv(csvText, targetTitle) {
    return parseCsvField(csvText, targetTitle, 1) || "1.0";
}

function findPartyDefaultsFromCsv(csvText, targetTitle) {
    const matches = [];
    if (!csvText) return matches;
    const lines = csvText.split('\n');

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

async function syncEngineStateWithCsv(containerId, data) {
    // 1. HARD CRASH GUARD: If an incomplete redraw cycle passes bad data, drop it.
    if (!data) return;

    // 2. CACHE HIT: Check if we are already synchronized for this container
    if (window.dndEngineState.initialized && window.dndEngineState.currentContainerId === containerId) {
        return;
    }
        
    // 3. LOCK IMMEDIATELY: Set initialized flags BEFORE triggering downstream side-effects
    window.dndEngineState.currentContainerId = containerId;
    window.dndEngineState.rawBaselineData = data;
    window.dndEngineState.initialized = true;

    // 4. SEED DATA STRUCTURES
    window.dndEngineState.liveCreatures = data.creatures ? data.creatures.map(c => ({
        ...JSON.parse(JSON.stringify(c)),
        subdual: c.subdual || 0 
    })) : [];

    const targetTitle = data.title || '';
    let multiplierCsvText = "";
    let partyCsvText = "";

    try {
        const [multResponse, partyResponse] = await Promise.all([
            fetch('../multiplier.csv').then(res => res.ok ? res.text() : ""),
            fetch('../party.csv').then(res => res.ok ? res.text() : "")
        ]);
        multiplierCsvText = multResponse;
        partyCsvText = partyResponse;
    } catch (error) {
        console.error("DndEngine State Error: Unable to extract CSV database defaults.", error);
    }

    // Assign Multiplier Fallbacks
    window.dndEngineState.xpMultiplierText = String(findMultiplierFromCsv(multiplierCsvText, targetTitle));
    
    // NOTE: This call internalizes values and calls forceEngineRedraw()
    // Because we set initialized = true above, the circular call will now safely exit out immediately!
    updateXpMultiplier(window.dndEngineState.xpMultiplierText);
    
    // Seed default structures
    window.dndEngineState.partySlots = Array.from({ length: 6 }, () => ({ count: '', ecl: '' }));
    const csvPartyDefaults = findPartyDefaultsFromCsv(partyCsvText, targetTitle);

    csvPartyDefaults.forEach((incoming, i) => {
        if (i < 6 && incoming) {
            window.dndEngineState.partySlots[i].count = incoming.count !== undefined ? incoming.count : '';
            window.dndEngineState.partySlots[i].ecl = incoming.ecl !== undefined ? incoming.ecl : '';
        }
    });
}

/**
 * Micro-Normalization Refactoring Utilities
 */
function mutateCreatureProperty(index, key, rawValue) {
    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures?.[index]) return;
    
    const parsed = parseInt(rawValue, 10);
    if (isNaN(parsed)) return;
    
    creatures[index][key] = parsed;
    forceEngineRedraw();
}

function parseCsvField(csvText, targetTitle, targetFieldIndex) {
    if (!csvText) return null;
    const lines = csvText.split('\n');
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        if (row.length > targetFieldIndex && row[0].trim() === targetTitle) {
            return row[targetFieldIndex].trim();
        }
    }
    return null;
}

function forceEngineRedraw() {
    renderRoomTemplate(window.dndEngineState.currentContainerId, window.dndEngineState.rawBaselineData);
}

function injectEngineStyles() {
    if (document.getElementById('dnd-engine-core-styles')) return;

    const linkTag = document.createElement('link');
    linkTag.id = 'dnd-engine-core-styles';
    linkTag.rel = 'stylesheet';
    linkTag.href = 'https://davycwalker-debug.github.io/breakfast-and-battles/rooms/room.css';

    document.head.appendChild(linkTag);
}
