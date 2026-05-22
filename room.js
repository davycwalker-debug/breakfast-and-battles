/**
 * D&D 3.5 Self-Styling Room & Encounter Renderer Engine
 * Injects its own design system rules dynamically to keep HTML templates incredibly lean.
 */

// Initialize live state from your baseline data payload
let liveCreatureTracker = [];

/**
 * Initializes the live tracker array. Call this once when your engine boots up or loads data.
 */
function initCombatEngine(initialCreatures) {
    liveCreatureTracker = [...initialCreatures];
    // Trigger your main container render here
    renderEngine(); 
}

function injectEngineStyles() {
    // Prevent duplicate link tags if rendering multiple encounters on one page
    if (document.getElementById('dnd-engine-core-styles')) return;

    const linkTag = document.createElement('link');
    linkTag.id = 'dnd-engine-core-styles';
    linkTag.rel = 'stylesheet';
    linkTag.type = 'text/css';
    linkTag.href = 'room.css'; // Adjust this path relative to your app setup

    document.head.appendChild(linkTag);
}

/**
 * 1 & Generic: Renders standard narrative read-aloud blocks
 */
function renderReadAloudBox(text) {
    if (!text) return '';
    return `
        <div class="read-aloud-box">
            <p>${text}</p>
        </div>
    `;
}

/**
 * 2: Renders dynamic ability checks (used natively & within special events)
 */
function renderInlineChecks(mechanicsArray) {
    if (!mechanicsArray || !mechanicsArray.length) return '';
    
    return mechanicsArray.map(check => `
        <div class="check-card">
            ${check.prompt ? `<div class="dialogue-prompt"><strong>🗣️ Prompt:</strong> ${check.prompt}</div>` : ''}
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

/**
 * 3: Renders spatial and architectural settings
 */
function renderEnvironment(envObj) {
    if (!envObj) return '';
    
    return `
        <section class="room-section environment-section">
            <h3>🗺️ Room Features & Environment</h3>
            <ul class="env-meta-list">
                <li><strong>Dimensions:</strong> ${envObj.dimensions || 'N/A'}</li>
                <li><strong>Illumination:</strong> ${envObj.illumination || 'N/A'}</li>
            </ul>
            <div class="env-details">
                ${envObj.features && envObj.features.length ? `
                    <h4>Key Features</h4>
                    <ul class="features-list">
                        ${envObj.features.map(f => `<li><strong>${f.name}:</strong> ${f.desc}</li>`).join('')}
                    </ul>
                ` : ''}
                ${envObj.doors && envObj.doors.length ? `
                    <h4>Doors</h4>
                    <ul class="doors-list">
                        ${envObj.doors.map(d => `<li><strong>${d.location}:</strong> ${d.desc}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        </section>
    `;
}

/**
 * 4: Renders social and roleplay branches
 */
function renderDialogueTree(dialogueArray) {
    if (!dialogueArray || !dialogueArray.length) return '';
    
    return `
        <div class="dialogue-tree-container">
            <h3>💬 Dialogue Tree</h3>
            <div class="dialogue-branches">
                ${dialogueArray.map(node => `
                    <div class="dialogue-node">
                        <div class="dialogue-prompt"><strong>🗣️ Prompt:</strong> "${node.prompt}"</div>
                        <div class="dialogue-response">
                            <span class="speaker-tag">${node.speaker || 'NPC'}:</span> "${node.response}"
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * 5: Renders combat order matrix & detailed stats
 */
function renderCombatTracker(liveCreaturesArray, originalRosterArray, setupPositions) {
    if (!liveCreaturesArray) return '';
    
    const sortedTracker = liveCreaturesArray;
    const rosterData = originalRosterArray || [];
    
    return `
        <section class="room-section combat-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="margin: 0;">⚔️ Combat & Initiative Tracker</h3>
                <button type="button" class="btn-sort-tracker" onclick="sortTrackerByInitiative()">⚡ Sort Initiative</button>
            </div>
            
            <div class="tracker-box">
                <div class="tracker-grid" ondragover="handleTrackerDragOver(event)">
                    <!-- HEADER ROW -->
                    <div class="tracker-header-cell" style="text-align: center; color: var(--accent-gold);">Turn Done</div>
                    <div class="tracker-header-cell">Initiative</div>
                    <div class="tracker-header-cell">Creature Name</div>
                    <div class="tracker-header-cell" style="text-align: right;">Health</div>
                    
                    <!-- DATA ROWS -->
                    ${sortedTracker.map((c, index) => {
                        // LIVE STATUS EVALUATION ENGINE
                        let statusClass = '';
                        if (c.hp === 0) statusClass = 'tracker-row-staggered';
                        else if (c.hp <= -1 && c.hp >= -9) statusClass = 'tracker-row-dying';
                        else if (c.hp <= -10) statusClass = 'tracker-row-dead';

                        return `
                            <div class="tracker-cell draggable-row-cell ${statusClass}" 
                                 style="text-align: center;"
                                 draggable="true" 
                                 data-index="${index}"
                                 ondragstart="handleTrackerDragStart(event, ${index})"
                                 ondragend="handleTrackerDragEnd(event)">
                                <button type="button" class="btn-send-bottom" title="End Turn (Send to Bottom)" onclick="sendCreatureToBottom(${index})">⬇️</button>
                            </div>
                            <div class="tracker-cell init-col draggable-row-cell ${statusClass}" data-index="${index}" ondragstart="handleTrackerDragStart(event, ${index})" ondragend="handleTrackerDragEnd(event)">
                                Init ${c.initRoll}
                            </div>
                            <div class="tracker-cell name-col draggable-row-cell ${statusClass}" data-index="${index}" ondragstart="handleTrackerDragStart(event, ${index})" ondragend="handleTrackerDragEnd(event)">
                                <span class="status-text flag-staggered">Staggered</span>
                                <span class="status-text flag-dying">Dying</span>
                                <span class="status-text flag-dead">Dead</span>
                                ${c.name}
                            </div>
                            <div class="tracker-cell draggable-row-cell ${statusClass}" style="text-align: right;" data-index="${index}" ondragstart="handleTrackerDragStart(event, ${index})" ondragend="handleTrackerDragEnd(event)">
                                <span class="hp-badge" draggable="false" ondragstart="return false;">
                                    <input type="number" 
                                           class="hp-input" 
                                           value="${c.hp}" 
                                           data-max="${c.maxHp}" 
                                           oninput="updateCreatureHpInline(${index}, this.value)">
                                    / ${c.maxHp} HP
                                </span>
                            </div>
                        `;
                    }).join('')}

                    <!-- QUICK ADD FORM ROW -->
                    <div class="tracker-cell" style="border-top: 2px solid var(--border-color); background: rgba(255,255,255,0.01); text-align: center;">
                        <button type="button" class="btn-add-combatant" onclick="addNewCombatantEntry()">+ Add</button>
                    </div>
                    <div class="tracker-cell" style="border-top: 2px solid var(--border-color); background: rgba(255,255,255,0.01);">
                        <input type="number" id="new-init" class="tracker-input num-input" placeholder="Roll">
                    </div>
                    <div class="tracker-cell" style="border-top: 2px solid var(--border-color); background: rgba(255,255,255,0.01);">
                        <input type="text" id="new-name" class="tracker-input" placeholder="Name or Minion group...">
                    </div>
                    <div class="tracker-cell" style="border-top: 2px solid var(--border-color); background: rgba(255,255,255,0.01); display: flex; gap: 4px; align-items: center; justify-content: flex-end;">
                        <input type="number" id="new-hp" class="tracker-input num-input" placeholder="HP" style="width: 60px;">
                        <span style="color: var(--text-muted);">/</span>
                        <input type="number" id="new-max-hp" class="tracker-input num-input" placeholder="Max" style="width: 60px;">
                    </div>
                </div>
            </div>

            <h3>👾 Creature Rosters & Stats</h3>
            <div class="table-responsive">
                <table class="roster-table">
                    <thead>
                        <tr>
                            <th>Creature</th>
                            <th>AC</th>
                            <th style="white-space: nowrap;">Saves (F/R/W)</th>
                            <th>Type / Subtype</th>
                            <th>Quick Bio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rosterData.map(c => `
                            <tr>
                                <td><strong>${c.name}</strong></td>
                                <td><code class="stat-block">${c.ac}</code></td>
                                <td><code class="stat-block">${c.saves}</code></td>
                                <td>${c.type}</td>
                                <td><em class="bio-text">${c.bio}</em></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${setupPositions ? `<p class="setup-positions" style="margin-top:20px;"><strong>Setup Positions:</strong> ${setupPositions}</p>` : ''}
        </section>
    `;
}

// Local helper to track the active drag element state across cells
let draggedIndex = null;

function handleTrackerDragStart(e, index) {
    draggedIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    
    // Highlight all cells belonging to this specific row group
    document.querySelectorAll(`.draggable-row-cell[data-index="${index}"]`).forEach(cell => {
        cell.classList.add('is-dragging');
    });
}

function handleTrackerDragEnd(e) {
    document.querySelectorAll('.draggable-row-cell').forEach(cell => {
        cell.classList.remove('is-dragging');
        cell.classList.remove('drag-over');
    });
    draggedIndex = null;
}

function handleTrackerDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Find closest cell target underneath cursor element
    const targetCell = e.target.closest('.draggable-row-cell');
    if (!targetCell) return;
    
    const targetIndex = parseInt(targetCell.getAttribute('data-index'), 10);
    if (targetIndex === draggedIndex) return;

    // Execute state array indexing re-allocation manipulation
    const creatures = window.dndEngineState.liveCreatures;
    const movedItem = creatures.splice(draggedIndex, 1)[0];
    creatures.splice(targetIndex, 0, movedItem);
    
    // Update live memory cursor tracking reference before template compilation
    draggedIndex = targetIndex;

    // Instantly redraw interface layers
    renderRoomTemplate(window.dndEngineState.currentContainerId, window.dndEngineState.rawBaselineData);
}

/**
 * Strips target creature out of current array tracking layout, and pushes directly to tail.
 */
function sendCreatureToBottom(index) {
    if (!window.dndEngineState || !window.dndEngineState.liveCreatures) return;
    
    const creatures = window.dndEngineState.liveCreatures;
    if (creatures.length <= 1) return; // No point re-ordering a list of 1 element
    
    // Pull target creature item layout reference block out
    const targetCreature = creatures.splice(index, 1)[0];
    
    // Push instantly onto the tail frame array boundary
    creatures.push(targetCreature);
    
    // Redraw view layer state instantly
    renderRoomTemplate(window.dndEngineState.currentContainerId, window.dndEngineState.rawBaselineData);
}

/**
 * Orders the active live tracker state array descending by initiative roll data.
 */
function sortTrackerByInitiative() {
    if (!window.dndEngineState || !window.dndEngineState.liveCreatures) return;
    
    // Sort high numbers to low numbers
    window.dndEngineState.liveCreatures.sort((a, b) => b.initRoll - a.initRoll);
    
    // Redraw screen view layer
    renderRoomTemplate(
        window.dndEngineState.currentContainerId, 
        window.dndEngineState.rawBaselineData
    );
}

/**
 * Safely captures changes to inline health inputs, preserves them in the data model,
 * and handles UI state shifting instantly across the grid matrix rows.
 */
function updateCreatureHpInline(index, value) {
    if (!window.dndEngineState || !window.dndEngineState.liveCreatures) return;
    
    const parsedHp = parseInt(value, 10);
    if (isNaN(parsedHp)) return;
    
    // Commit change down into state storage
    window.dndEngineState.liveCreatures[index].hp = parsedHp;
    
    // Select all layout cells related to this creature index row group
    const cells = document.querySelectorAll(`.tracker-grid > [data-index="${index}"]`);
    
    cells.forEach(cell => {
        // Drop previous condition status configurations before updating
        cell.classList.remove('tracker-row-staggered', 'tracker-row-dying', 'tracker-row-dead');
        
        // Append fresh rule class configurations dynamically
        if (parsedHp === 0) {
            cell.classList.add('tracker-row-staggered');
        } else if (parsedHp <= -1 && parsedHp >= -9) {
            cell.classList.add('tracker-row-dying');
        } else if (parsedHp <= -10) {
            cell.classList.add('tracker-row-dead');
        }
    });
}

/**
 * Captures the form inputs, updates the dynamic tracking array, and forces a re-render.
 */
function addNewCombatantEntry() {
    const initEl = document.getElementById('new-init');
    const nameEl = document.getElementById('new-name');
    const hpEl = document.getElementById('new-hp');
    const maxHpEl = document.getElementById('new-max-hp');
    
    if (!nameEl || !initEl || !hpEl || !maxHpEl) return;
    
    // Validation: Require minimum properties
    if (!nameEl.value.trim() || initEl.value === '' || hpEl.value === '' || maxHpEl.value === '') {
        alert('Please fill out all tracker properties (Initiative, Name, Current HP, and Max HP).');
        return;
    }
    
    // Construct the added item payload block
    const newCreature = {
        name: nameEl.value.trim(),
        initRoll: parseInt(initEl.value, 10),
        hp: parseInt(hpEl.value, 10),
        maxHp: parseInt(maxHpEl.value, 10)
    };
    
    // Append tracking element to runtime state vault
    window.dndEngineState.liveCreatures.push(newCreature);
    
    // Safely force a local engine frame redraw using active cache paths
    renderRoomTemplate(
        window.dndEngineState.currentContainerId, 
        window.dndEngineState.rawBaselineData
    );
}

/**
 * 6: Renders behavioral and dynamic tactical frameworks
 */
function renderTactics(tacticsObj, developmentText) {
    if (!tacticsObj && !developmentText) return '';
    
    let html = `<section class="room-section tactics-section"><h3>🧠 Tactics & Development</h3>`;
    
    if (tacticsObj) {
        if (tacticsObj.initialRound) {
            // FIXED: Added missing '<' bracket to the paragraph tag
            html += `<p style="margin-bottom: 16px;"><strong>Initial Round / Trigger:</strong> ${tacticsObj.initialRound}</p>`;
        }
        if (tacticsObj.individual && tacticsObj.individual.length) {
            html += `
                <h4>Individual Strategy</h4>
                <ul class="tactics-list">
                    ${tacticsObj.individual.map(t => `<li><strong>${t.name}:</strong> ${t.strategy}</li>`).join('')}
                </ul>
            `;
        }
    }
    
    if (developmentText) {
        html += `
            <div class="development-box">
                <strong>Development / Morale:</strong> ${developmentText}
            </div>
        `;
    }
    
    html += `</section>`;
    return html;
}

/**
 * 7: Renders mechanical traps and map hazards
 */
function renderTraps(trapsArray) {
    if (!trapsArray || !trapsArray.length) return '';
    
    return `
        <section class="room-section traps-section">
            <h3>⚠️ Hazards & Traps</h3>
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

/**
 * 8: Renders loose and containerized loot matrices
 */
function renderTreasure(treasureObj) {
    if (!treasureObj) return '';
    
    return `
        <section class="room-section treasure-section">
            <h3>💰 Treasure & Rewards</h3>
            ${treasureObj.carried ? `<p style="margin-bottom: 16px;"><strong>Carried Gear:</strong> ${treasureObj.carried}</p>` : ''}
            ${treasureObj.containers && treasureObj.containers.length ? `
                <h4>Hidden / Secured Wealth</h4>
                <ul class="treasure-list">
                    ${treasureObj.containers.map(box => `<li><strong>${box.name}:</strong> ${box.contents}</li>`).join('')}
                </ul>
            ` : ''}
        </section>
    `;
}

/**
 * 9: Renders phase changes and narrative developments
 */
function renderSpecialEvent(eventObj) {
    if (!eventObj) return '';
    
    return `
        <div class="special-event-card ${eventObj.severity || 'info'}">
            <div class="event-header">
                <span class="event-icon">${eventObj.severity === 'danger' ? '🚨' : '🔓'}</span>
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


// =========================================================================
// MAIN RUNTIME CORE ENGINE
// =========================================================================

// A simple global state persistence vault
if (typeof window.dndEngineState === 'undefined') {
    window.dndEngineState = {
        initialized: false,
        liveCreatures: [],
        currentContainerId: '',
        rawBaselineData: null
    };
}

function renderRoomTemplate(containerId, data) {
    // Inject dynamic template styles straight into document frame
    injectEngineStyles();

    // 1. STATE INITIALIZATION (Runs exactly once per structural encounter load)
    if (!window.dndEngineState.initialized || window.dndEngineState.currentContainerId !== containerId) {
        window.dndEngineState.liveCreatures = data.creatures ? JSON.parse(JSON.stringify(data.creatures)) : [];
        window.dndEngineState.currentContainerId = containerId;
        window.dndEngineState.rawBaselineData = data;
        window.dndEngineState.initialized = true;
    }

    const container = document.getElementById(containerId);
    if (!container) return console.error(`Container ID "${containerId}" not found.`);

    let html = `
        <div class="dnd-room-wrapper">
            <header class="room-header">
                <h1>${data.title || 'Encounter Area'}</h1>
                ${data.subtitle ? `<p class="room-subtitle">${data.subtitle}</p>` : ''}
            </header>
            
            <hr class="section-divider">
    `;

    // 1. Primary Narrative Read-Aloud Segment
    if (data.readAloud) {
        html += `
            <section class="room-section read-aloud-section">
                <h3>📜 Read-Aloud Text</h3>
                ${renderReadAloudBox(data.readAloud)}
            </section>
        `;
    }

    // 2. Initial Read-Aloud Ability/Perception Checks
    if (data.initialReadAloudChecks) {
        html += `<div class="ability-checks-container">`;
        html += renderInlineChecks(data.initialReadAloudChecks);
        html += `</div>`;
    }

    // 3. Environmental Dimensions, Lighting & Structural Elements
    html += renderEnvironment(data.environment);

    // 4. Social Dialogue Interlays
    if (data.dialogueTree) {
        html += renderDialogueTree(data.dialogueTree);
    }

    // 5. Active Combat Matrix Tracking System & Monster Indexes (Uses State for Tracker, original data for Roster)
    html += renderCombatTracker(window.dndEngineState.liveCreatures, data.creatures, data.setupPositions);

    // 6. Tactical AI Rulesets & Narrative Consequences
    html += renderTactics(data.tactics, data.development);

    // 7. Dungeon Mechanics: Danger Zones, Traps & Level Obstacles
    html += renderTraps(data.traps);

    // 8. Loot Tables & Stash Manifests
    html += renderTreasure(data.treasure);

    // 9. Conditional / Multi-State Event Nodes
    if (data.specialEvents) {
        data.specialEvents.forEach(evt => {
            html += renderSpecialEvent(evt);
        });
    }

    // 10. Unstructured Open Documentation Extensions
    if (data.additionalSections && data.additionalSections.length) {
        data.additionalSections.forEach(sec => {
            html += `
                <section class="room-section custom-section">
                    <h3>${sec.heading}</h3>
                    <div class="custom-content">${sec.content}</div>
                </section>
            `;
        });
    }

    html += `</div>`;
    container.innerHTML = html;
}
