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
 * Initializes state storage structures and executes DOM tree rendering.
 */
async function renderRoomTemplate(containerId, data) {
    injectEngineStyles();

    await syncEngineStateWithCsv(containerId, data);

    const container = document.getElementById(containerId);
    if (!container) return console.error(`Target container element ID "${containerId}" was not found.`);

    // 2. Fragment Assembly Matrix
    let displaySubtitle = data.subtitle || '';
    if (data.creatures && Array.isArray(data.creatures)) {
        
        const totalPl = data.creatures.reduce((sum, c) => sum + calculatePowerLevel(c.cr), 0);
        const totalEl = calculateEncounterLevel(totalPl);
    
        let totalPartyCount = 0;
        let totalPartyECL = 0;
        let totalPartyPl = 0;
        
        if (window.dndEngineState && window.dndEngineState.partySlots) {
            totalPartyCount = window.dndEngineState.partySlots.reduce((sum, slot) => sum + (Number(slot.count) || 0), 0);
            
            totalPartyECL = window.dndEngineState.partySlots.reduce((sum, slot) => {
                return sum + ((Number(slot.count) || 0) * (Number(slot.ecl) || 0));
            }, 0);
            
            totalPartyPl = window.dndEngineState.partySlots.reduce((sum, slot) => {
                return sum + calculatePartyPowerLevel(slot.count, slot.ecl);
            }, 0);
        }

        const totalPartyEl = calculatePartyEncounterLevel(totalPartyPl);
    
        const totalCr = totalEl - totalPartyEl;
        const clString = totalCr.toFixed(2); 

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
        const xpString = Math.ceil(adjustedXp * activeMultiplier);
        
        const metrics = `CL ${clString}, XP ${xpString}`;
        if (displaySubtitle) {
            displaySubtitle += ` -- ${metrics}`;
        } else {
            displaySubtitle = metrics;
        }
    }

    let htmlLines = [
        `<div class="dnd-room-wrapper">`,
        `  <header class="room-header">`,
        `      <h1>${data.title || 'Encounter Area'}</h1>`,
        
        `      <div class="header-subtitle-row">`,
        `         ${displaySubtitle ? `<p class="room-subtitle">${displaySubtitle}</p>` : '<div></div>'}`,
        `         <div class="multiplier-wrapper">`,
        `             <label class="multiplier-label">Multiplier:</label>`,
        `          <input type="text" `,
        `                 id="input-xp-multiplier" data-focus-key="xp-multiplier" `, 
        `                 class="tracker-input multiplier-input" `, 
        `                 placeholder="1.0" `, 
        `                 value="${window.dndEngineState.xpMultiplierText}" `,
        `                 oninput="updateXpMultiplier(this.value)">`,
        `         </div>`,
        `      </div>`,
        
        `  </header>`,
        `  <hr class="section-divider">`
    ];
    htmlLines.push(renderPartyEclMatrix(window.dndEngineState.partySlots, data.creatures));
    
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

    // Interactive Combat Matrix Tracker Segment
    htmlLines.push(renderCombatTracker(window.dndEngineState.liveCreatures, data.creatures, data.setupPositions));

    htmlLines.push(renderTactics(data.tactics, data.development));
    htmlLines.push(renderTraps(data.traps));
    htmlLines.push(renderTreasure(data.treasure));

    if (data.specialEvents) {
        data.specialEvents.forEach(evt => htmlLines.push(renderSpecialEvent(evt)));
    }

    if (data.additionalSections) {
        data.additionalSections.forEach(sec => {
            htmlLines.push(`
                <section class="room-section custom-section">
                    <h3>${sec.heading}</h3>
                    <div class="custom-content">${sec.content}</div>
                </section>
            `);
        });
    }

    htmlLines.push(`</div>`);
    
    // --- FOCUS PRESERVATION SYSTEM ---
    // 1. Capture the unique identifiers of what you are currently typing in
    const activeEl = document.activeElement;
    let savedFocusKey = null;

    if (activeEl && activeEl.hasAttribute('data-focus-key')) {
        savedFocusKey = activeEl.getAttribute('data-focus-key');
    }

    // 2. Safely swap out the inner HTML content matrix
    container.innerHTML = htmlLines.join('\n');

    // 3. Re-locate and restore focus cleanly to the end of the line
    if (savedFocusKey) {
        const restoreEl = container.querySelector(`[data-focus-key="${savedFocusKey}"]`);
        if (restoreEl) {
            restoreEl.focus();
            
            // Cache the value, clear it, and put it back.
            const tempVal = restoreEl.value;
            restoreEl.value = '';
            restoreEl.value = tempVal;
        }
    }
}

// =========================================================================
// DATA COMPONENT INTERFACE GENERATORS
// =========================================================================

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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="margin: 0;">Combat & Initiative Tracker</h3>
                <button type="button" class="btn-sort-tracker" onclick="sortTrackerByInitiative()">Sort Initiative</button>
            </div>
            
            <div class="tracker-box">
                <div class="tracker-grid" ondragover="handleTrackerDragOver(event)">
                    <div class="tracker-header-cell" style="text-align: center; color: var(--accent-gold);">End Turn</div>
                    <div class="tracker-header-cell">Initiative</div>
                    <div class="tracker-header-cell">Creature Name</div>
                    <div class="tracker-header-cell" style="text-align: right;">Health Status</div>
                    
                    ${liveTracker.map((c, idx) => {
                        if (c.subdual === undefined) c.subdual = 0;

                        let statusClass = '';
                        if (c.hp <= -1 && c.hp >= -9) {
                            statusClass = 'tracker-row-dying';
                        } else if (c.hp <= -10) {
                            statusClass = 'tracker-row-dead';
                        } else if (c.hp >= 0) {
                            if (c.subdual > c.hp) {
                                statusClass = 'tracker-row-unconscious';
                            } else if (c.subdual === c.hp || c.hp === 0) {
                                statusClass = 'tracker-row-staggered';
                            }
                        }

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
                            
                            <div class="tracker-cell init-col ${statusClass}" data-index="${idx}" style="display: flex; align-items: center; gap: 8px;">
                                <button type="button" class="btn-send-bottom" style="color: var(--accent-red); padding: 2px 6px; font-weight: bold;" title="Remove Combatant" onclick="removeCombatantEntry(${idx})">×</button>
                                <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: normal;">Init</span>
                                <input type="number" data-focus-key="creature-init-${idx}" class="hp-input" style="width: 40px; text-align: left; background: transparent; font-family: monospace; font-size: 1rem; font-weight: bold; color: var(--accent-gold);" value="${c.initRoll}" oninput="updateCreatureInitiativeInline(${idx}, this.value)">
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
                                    <input type="number" data-focus-key="creature-hp-${idx}" class="hp-input" value="${c.hp}" data-max="${c.maxHp}" oninput="updateCreatureHpInline(${idx}, this.value)">
                                    <span style="color: var(--text-muted);">/ ${c.maxHp} HP</span>
                                </span>
                                <span style="color: var(--text-muted); font-weight: normal; margin: 0 4px;">|</span>
                                <span class="subdual-badge" draggable="false" style="font-size: 0.85rem; color: var(--text-muted);">
                                    Sub: <input type="number" data-focus-key="creature-sub-${idx}" class="hp-input" value="${c.subdual}" style="width: 38px; height: 22px; font-size: 0.9rem; text-align: center; color: #e67e22; background: transparent;" oninput="updateCreatureSubdualInline(${idx}, this.value)">
                                </span>
                            </div>
                        `;
                    }).join('')}

                    <div class="tracker-cell" style="border-top: 2px solid var(--border-color); background: rgba(255,255,255,0.01); text-align: center;">
                        <button type="button" class="btn-add-combatant" onclick="addNewCombatantEntry()">Add</button>
                    </div>
                    <div class="tracker-cell" style="border-top: 2px solid var(--border-color); background: rgba(255,255,255,0.01);">
                        <input type="number" id="new-init" data-focus-key="new-init-input" class="tracker-input num-input" placeholder="Roll">
                    </div>
                    <div class="tracker-cell" style="border-top: 2px solid var(--border-color); background: rgba(255,255,255,0.01);">
                        <input type="text" id="new-name" data-focus-key="new-name-input" class="tracker-input" placeholder="Name/Group...">
                    </div>
                    
                    <div class="tracker-cell hp-col" style="border-top: 2px solid var(--border-color); background: rgba(255,255,255,0.01);">
                        <input type="number" id="new-hp" data-focus-key="new-hp-input" class="tracker-input num-input" placeholder="HP" style="width: 60px;">
                        <span style="color: var(--text-muted); margin: 0 2px;">/</span>
                        <input type="number" id="new-max-hp" data-focus-key="new-max-hp-input" class="tracker-input num-input" placeholder="Max" style="width: 60px;">
                        <span style="color: var(--text-muted); margin: 0 4px;">|</span>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">
                            Sub: <input type="number" id="new-subdual" data-focus-key="new-subdual-input" class="tracker-input num-input" placeholder="0" style="width: 38px; color: #e67e22;" value="0">
                        </span>
                    </div>
                </div>
            </div>
            
            ${positions ? `<p class="setup-positions" style="margin-top:20px;"><strong>Setup Positions:</strong> ${positions}</p>` : ''}
        </section>
    `;
}

function renderTactics(tacticsObj, developmentText) {
    if (!tacticsObj && !developmentText) return '';
    
    let html = `<section class="room-section tactics-section"><h3>Tactics & Development</h3>`;
    
    if (tacticsObj) {
        if (tacticsObj.initialRound) {
            html += `<p style="margin-bottom: 16px;"><strong>Initial Round / Trigger:</strong> ${tacticsObj.initialRound}</p>`;
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
                        <li><strong style="color: var(--accent-gold);">Effect:</strong> ${t.effect}</li>
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
            ${treasureObj.carried ? `<p style="margin-bottom: 16px;"><strong>Carried Gear:</strong> ${treasureObj.carried}</p>` : ''}
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
    
    // Determine a clean, professional contextual label if needed, or leave empty for CSS styling
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
                ${eventObj.mechanics ? `<div class="event-mechanics" style="margin-top: 16px;">${renderInlineChecks(eventObj.mechanics)}</div>` : ''}
                ${eventObj.outcome ? renderReadAloudBox(eventObj.outcome) : ''}
            </div>
        </div>
    `;
}

/**
 * Renders the interactive Party ECL configuration matrix panel.
 * Computes isolated, row-by-row XP distributions based on specific ECL slots.
 */
function renderPartyEclMatrix(slots, creatures) {
    // Grab the active multiplier value from the global engine state fallback
    const activeMultiplier = window.dndEngineState.xpMultiplier || 1.0;

    let rowsHtml = slots.map((slot, index) => {
        // Parse row values cleanly
        const rowCount = Number(slot.count) || 0;
        const rowEcl = Number(slot.ecl) || 0;
        
        let rowXpString = "—"; // Default fallback display when no players/levels are filled out

        // Only calculate if we have a valid party count, an assigned level, and monster metrics present
        if (rowCount > 0 && rowEcl > 0 && creatures && Array.isArray(creatures)) {
            // 1. Accumulate dynamic baseline awards using the specific row's ECL instead of the global average
            const dynamicRowXpAward = creatures.reduce((sum, creature) => {
                return sum + mExperience(rowEcl, Number(creature.cr) || 0);
            }, 0);

            // 2. Divide by this row's specific count instead of the whole team size
            const averageRowXp = dynamicRowXpAward > 0 ? (dynamicRowXpAward / totalPartyCount) : 0;

            // 3. Apply the global custom math multiplier weight and round up cleanly
            rowXpString = Math.ceil(averageRowXp * activeMultiplier);
        }

        return `
            <div class="party-matrix-row">
                <div class="matrix-cell-num">#${index + 1}</div>
                
                <div class="matrix-input-group">
                    <label>Count:</label>
                    <input type="number" 
                           data-focus-key="matrix-count-${index}"
                           class="tracker-input matrix-input num-input" 
                           placeholder="0" 
                           value="${slot.count}" 
                           oninput="updatePartyMatrixSlot(${index}, 'count', this.value)">
                </div>
                
                <div class="matrix-input-group">
                    <label>ECL:</label>
                    <input type="number" 
                           data-focus-key="matrix-ecl-${index}"
                           class="tracker-input matrix-input num-input" 
                           placeholder="1" 
                           value="${slot.ecl}" 
                           oninput="updatePartyMatrixSlot(${index}, 'ecl', this.value)">
                </div>

                <div class="matrix-input-group row-xp-display-group">
                    <label class="row-xp-label">XP Per:</label>
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
// RUNTIME MUTATORS & ENGINE LOGIC
// =========================================================================

function handleTrackerDragStart(e, index) {
    window.dndEngineState.draggedIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    
    document.querySelectorAll(`.tracker-drag-handle[data-index="${index}"]`).forEach(cell => {
        cell.classList.add('is-dragging');
    });
}

function handleTrackerDragEnd(e) {
    document.querySelectorAll('.tracker-drag-handle').forEach(cell => {
        cell.classList.remove('is-dragging', 'drag-over');
    });
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

    const creatures = window.dndEngineState.liveCreatures;
    const movedItem = creatures.splice(originIndex, 1)[0];
    creatures.splice(targetIndex, 0, movedItem);
    
    window.dndEngineState.draggedIndex = targetIndex;
    forceEngineRedraw();
}

function sendCreatureToBottom(index) {
    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures || creatures.length <= 1) return;
    
    const targetCreature = creatures.splice(index, 1)[0];
    creatures.push(targetCreature);
    
    forceEngineRedraw();
}

function sortTrackerByInitiative() {
    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures) return;
    
    creatures.sort((a, b) => b.initRoll - a.initRoll);
    forceEngineRedraw();
}

function updateCreatureHpInline(index, value) {
    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures) return;
    
    const parsedHp = parseInt(value, 10);
    if (isNaN(parsedHp)) return;
    
    creatures[index].hp = parsedHp;
    forceEngineRedraw();
}

function updateCreatureSubdualInline(index, value) {
    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures) return;

    const parsedSubdual = parseInt(value, 10);
    if (isNaN(parsedSubdual)) return;

    creatures[index].subdual = parsedSubdual;
    forceEngineRedraw(); // Re-render to evaluate staggered vs unconscious thresholds
}

function addNewCombatantEntry() {
    const initEl = document.getElementById('new-init');
    const nameEl = document.getElementById('new-name');
    const hpEl = document.getElementById('new-hp');
    const maxHpEl = document.getElementById('new-max-hp');
    const subdualEl = document.getElementById('new-subdual');
    
    if (!nameEl?.value.trim() || !initEl?.value || !hpEl?.value || !maxHpEl?.value) {
        alert('Please completely fill out all tracking structural properties.');
        return;
    }
    
    window.dndEngineState.liveCreatures.push({
        name: nameEl.value.trim(),
        initRoll: parseInt(initEl.value, 10),
        hp: parseInt(hpEl.value, 10),
        maxHp: parseInt(maxHpEl.value, 10),
        subdual: subdualEl?.value ? parseInt(subdualEl.value, 10) : 0
    });
    
    forceEngineRedraw();
}

function updateCreatureInitiativeInline(index, value) {
    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures) return;

    const parsedInit = parseInt(value, 10);
    if (isNaN(parsedInit)) return;

    creatures[index].initRoll = parsedInit;
    forceEngineRedraw();
}

function removeCombatantEntry(index) {
    const creatures = window.dndEngineState.liveCreatures;
    if (!creatures) return;

    creatures.splice(index, 1);
    forceEngineRedraw();
}

function updatePartyMatrixSlot(index, field, value) {
    if (window.dndEngineState && window.dndEngineState.partySlots[index]) {
        window.dndEngineState.partySlots[index][field] = value;
        renderRoomTemplate(window.dndEngineState.currentContainerId, window.dndEngineState.rawBaselineData);
    }
}

function updateXpMultiplier(value) {
    // 1. Keep whatever string text the user typed alive in the UI state
    window.dndEngineState.xpMultiplierText = value;

    // 2. Clear out whitespaces
    const rawStr = value.trim();

    // 3. Match an exact fraction pattern (e.g., "1/2", " 2 / 3 ", or decimals like "1.5/2")
    const fractionMatch = rawStr.match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);

    if (fractionMatch) {
        const num = parseFloat(fractionMatch[1]);
        const den = parseFloat(fractionMatch[2]);
        
        // Only update calculations if the denominator isn't zero
        if (den !== 0) {
            window.dndEngineState.xpMultiplier = num / den;
        }
    } else {
        const parsed = parseFloat(rawStr);
        // Only update if it resolves to a clean, usable standard float decimal or integer
        if (!isNaN(parsed)) {
            window.dndEngineState.xpMultiplier = parsed;
        }
        // If it fails both (like "1/" or "1.2."), it skips modifying window.dndEngineState.xpMultiplier,
        // which perfectly preserves the last working calculation state!
    }

    // 4. Fire the calculation render update stack immediately
    forceEngineRedraw();
}

function calculatePowerLevel(crValue) {
    const cr = Number(crValue) || 0;
    if (cr < 2) {
        return cr;
    } else {
        return Math.pow(2, cr / 2);
    }
}

function calculatePartyPowerLevel(countValue, eclValue) {
    const count = Number(countValue) || 0;
    const ecl = Number(eclValue) || 0;
    if (!count || !ecl) return 0;
    return calculatePowerLevel(ecl) * count;
}

function calculateEncounterLevel(plValue) {
    const pl = Number(plValue) || 0;
    if (pl < 2) {
        return pl;
    } else {
        return 2 * (Math.log(pl) / Math.log(2));
    }
}

function calculatePartyEncounterLevel(partyPlValue) {
    const rawPartyPl = Number(partyPlValue) || 0;
    const normalizedPl = rawPartyPl / 4; 
    return calculateEncounterLevel(normalizedPl);
}

/**
 * Aligns numbers to the nearest matching even boundary used by the legacy XP grid math.
 */
function mEven(x) {
    var iReturn = 2 * parseInt(x / 2);
    if (x < iReturn) iReturn += -2;
    else if (x > iReturn) iReturn += 2;
    return iReturn;
}

/**
 * Calculates D&D 3.5 Edition individual XP award per character for a single creature matchup.
 * @param {number} x - The Weighted Average Party Level (ECL).
 * @param {number} y - The individual Creature Challenge Rating (CR).
 */
function mExperience(x, y) {
    // x = PClevel y = monsterlevel
    var iReturn = 0;
    if (x < 3) x = 3;
    if ((x <= 6) && (y <= 1)) iReturn = 300 * y;
    else if (y < 1) iReturn = 0;
      
    // This formula looks nice, but 3.5 doesn't follow a smooth formula like 3.0 did.
    else iReturn = 6.25 * x * ( Math.pow(2,mEven(7- (x-y) ) /2) ) * ( 11-(x-y) - mEven(7-(x-y)) );
    
    // Below catches places where the formula fails for 3.5.
    if ((y == 4) || (y == 6) || (y == 8) || (y == 10) || (y == 12) || 
        (y == 14) ||(y == 16) ||(y == 18) ||(y == 20)) {
        if (x <= 3) iReturn = 1350 * Math.pow(2,(y-4)/2);
        else if (x == 5 && y >= 6) iReturn = 2250 * Math.pow(2,(y-6)/2);
        else if (x == 7 && y >= 8) iReturn = 3150 * Math.pow(2,(y-8)/2);
        else if (x == 9 && y >= 10) iReturn = 4050 * Math.pow(2,(y-10)/2);
        else if (x == 11 && y >= 12) iReturn = 4950 * Math.pow(2,(y-12)/2);
        else if (x == 13 && y >= 14) iReturn = 5850 * Math.pow(2,(y-14)/2);
        else if (x == 15 && y >= 16) iReturn = 6750 * Math.pow(2,(y-16)/2);
        else if (x == 17 && y >= 18) iReturn = 7650 * Math.pow(2,(y-18)/2);
        else if (x == 19 && y >= 20) iReturn = 8550 * Math.pow(2,(y-20)/2);
    }
    if ((y == 7) || (y == 9) || (y == 11) || (y == 13) || (y == 15) || (y == 17) ||(y == 19)) {
        if (x == 6) iReturn = 2700 * Math.pow(2,(y-7)/2);
        if (x == 8 && y >= 9) iReturn = 3600 * Math.pow(2,(y-9)/2);
        if (x == 10 && y >= 11) iReturn = 4500 * Math.pow(2,(y-11)/2);
        if (x == 12 && y >= 13) iReturn = 5400 * Math.pow(2,(y-13)/2);
        if (x == 14 && y >= 15) iReturn = 6300 * Math.pow(2,(y-15)/2);
        if (x == 16 && y >= 17) iReturn = 7200 * Math.pow(2,(y-17)/2);
        if (x == 18 && y >= 19) iReturn = 8100 * Math.pow(2,(y-19)/2);
    }
      
    if (y > 20) iReturn = 2 * mExperience(x, y-2);
    // recursion should end this in short order.
    // This method is clean, and ensures any errors in the above
    // formulas for 3.5 are accounted for.
      
    // Finally we correct for out of bounds entries, doing this last to cut space on the
    // above formulas.
    if (x - y > 7) iReturn = 0;
    else if (y - x > 7) iReturn = 0;
    
    return iReturn;
}

/**
 * Helper Parser: Finds a single multiplier value matching a room title.
 */
function findMultiplierFromCsv(csvText, targetTitle) {
    if (!csvText) return "1.0";
    const lines = csvText.split('\n');
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        if (row.length >= 2) {
            const currentTitle = row[0].trim();
            if (currentTitle === targetTitle) return row[1].trim();
        }
    }
    return "1.0"; 
}

/**
 * Helper Parser: Gathers up to 6 party configurations matching a room title.
 */
function findPartyDefaultsFromCsv(csvText, targetTitle) {
    const matches = [];
    if (!csvText) return matches;
    const lines = csvText.split('\n');
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        if (row.length >= 3) {
            const currentTitle = row[0].trim();
            if (currentTitle === targetTitle) {
                matches.push({
                    count: row[1].trim() !== "" ? Number(row[1].trim()) : "",
                    ecl: row[2].trim() !== "" ? Number(row[2].trim()) : ""
                });
                if (matches.length === 6) break;
            }
        }
    }
    return matches;
}

/**
 * Core Initialization State Engine Layer
 * Call this function at the absolute top of your rendering workflow.
 */
async function syncEngineStateWithCsv(containerId, data) {
    // Check if we need to synchronize the engine cache context
    if (!window.dndEngineState.initialized || window.dndEngineState.currentContainerId !== containerId) {
        
        // Setup initial static state variables from local JSON parameters
        window.dndEngineState.liveCreatures = data.creatures ? data.creatures.map(c => ({
            ...JSON.parse(JSON.stringify(c)),
            subdual: c.subdual || 0 
        })) : [];

        const targetTitle = data.title || '';
        let multiplierCsvText = "";
        let partyCsvText = "";

        // Fetch read-only configuration layers directly from GitHub Pages static paths
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

        // --- Assign Multiplier Defaults ---
        const lookupMultiplier = findMultiplierFromCsv(multiplierCsvText, targetTitle);
        window.dndEngineState.xpMultiplierText = String(lookupMultiplier);
        
        const multStr = window.dndEngineState.xpMultiplierText.trim();
        const fractionMatch = multStr.match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);

        if (fractionMatch) {
            const n = parseFloat(fractionMatch[1]);
            const d = parseFloat(fractionMatch[2]);
            if (d !== 0) window.dndEngineState.xpMultiplier = n / d;
        } else {
            const parsed = parseFloat(multStr);
            if (!isNaN(parsed)) window.dndEngineState.xpMultiplier = parsed;
        }
        
        // Seed default empty blocks to absorb UI mapping errors
        window.dndEngineState.partySlots = Array.from({ length: 6 }, () => ({ count: '', ecl: '' }));

        // --- Assign Party Matrix Row Defaults ---
        const csvPartyDefaults = findPartyDefaultsFromCsv(partyCsvText, targetTitle);

        if (csvPartyDefaults && csvPartyDefaults.length > 0) {
            const loops = Math.min(csvPartyDefaults.length, 6);
            for (let i = 0; i < loops; i++) {
                const incoming = csvPartyDefaults[i];
                if (incoming) {
                    window.dndEngineState.partySlots[i].count = incoming.count !== undefined ? incoming.count : '';
                    window.dndEngineState.partySlots[i].ecl = incoming.ecl !== undefined ? incoming.ecl : '';
                }
            }
        }
        
        // Finalize initial tracking locks
        window.dndEngineState.currentContainerId = containerId;
        window.dndEngineState.rawBaselineData = data;
        window.dndEngineState.initialized = true;
    }
}

/**
 * Interface Re-render Pipeline Dispatcher
 */
function forceEngineRedraw() {
    renderRoomTemplate(
        window.dndEngineState.currentContainerId, 
        window.dndEngineState.rawBaselineData
    );
}

function injectEngineStyles() {
    if (document.getElementById('dnd-engine-core-styles')) return;

    const linkTag = document.createElement('link');
    linkTag.id = 'dnd-engine-core-styles';
    linkTag.rel = 'stylesheet';
    linkTag.href = 'https://davycwalker-debug.github.io/breakfast-and-battles/rooms/room.css';

    document.head.appendChild(linkTag);
}
