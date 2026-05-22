/**
 * D&D 3.5 Dynamic Encounter & Initiative Tracker Engine
 */

// Global State Management Vault
window.dndEngineState = window.dndEngineState || {
    initialized: false,
    liveCreatures: [],
    currentContainerId: '',
    rawBaselineData: null,
    draggedIndex: null
};

/**
 * Main Execution Entry Point
 * Initializes state storage structures and handles DOM tree rendering.
 */
function renderRoomTemplate(containerId, data) {
    injectEngineStyles();

    // 1. Structural State Cache Synchronization
    if (!window.dndEngineState.initialized || window.dndEngineState.currentContainerId !== containerId) {
        window.dndEngineState.liveCreatures = data.creatures ? JSON.parse(JSON.stringify(data.creatures)) : [];
        window.dndEngineState.currentContainerId = containerId;
        window.dndEngineState.rawBaselineData = data;
        window.dndEngineState.initialized = true;
    }

    const container = document.getElementById(containerId);
    if (!container) return console.error(`Target container element ID "${containerId}" was not found.`);

    // 2. Fragment Assembly Matrix
    let htmlLines = [
        `<div class="dnd-room-wrapper">`,
        `  <header class="room-header">`,
        `      <h1>${data.title || 'Encounter Area'}</h1>`,
        `      ${data.subtitle ? `<p class="room-subtitle">${data.subtitle}</p>` : ''}`,
        `  </header>`,
        `  <hr class="section-divider">`
    ];

    if (data.readAloud) {
        htmlLines.push(`
            <section class="room-section read-aloud-section">
                <h3>📜 Read-Aloud Text</h3>
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
    container.innerHTML = htmlLines.join('\n');
}

// =========================================================================
// ISOLATED DATA COMPONENT UI GENERATORS
// =========================================================================

function renderReadAloudBox(text) {
    return text ? `<div class="read-aloud-box"><p>${text}</p></div>` : '';
}

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
            <h3>🗺️ Room Features & Environment</h3>
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

function renderCombatTracker(liveTracker, baselineRoster, positions) {
    if (!liveTracker) return '';
    const rosterData = baselineRoster || [];
    
    return `
        <section class="room-section combat-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="margin: 0;">⚔️ Combat & Initiative Tracker</h3>
                <button type="button" class="btn-sort-tracker" onclick="sortTrackerByInitiative()">⚡ Sort Initiative</button>
            </div>
            
            <div class="tracker-box">
                <div class="tracker-grid" ondragover="handleTrackerDragOver(event)">
                    <div class="tracker-header-cell" style="text-align: center; color: var(--accent-gold);">Turn Done</div>
                    <div class="tracker-header-cell">Initiative</div>
                    <div class="tracker-header-cell">Creature Name</div>
                    <div class="tracker-header-cell" style="text-align: right;">Health</div>
                    
                    ${liveTracker.map((c, idx) => {
                        let statusClass = '';
                        if (c.hp === 0) statusClass = 'tracker-row-staggered';
                        else if (c.hp <= -1 && c.hp >= -9) statusClass = 'tracker-row-dying';
                        else if (c.hp <= -10) statusClass = 'tracker-row-dead';

                        return `
                            <div class="tracker-cell draggable-row-cell ${statusClass}" style="text-align: center;" draggable="true" data-index="${idx}" ondragstart="handleTrackerDragStart(event, ${idx})" ondragend="handleTrackerDragEnd(event)">
                                <button type="button" class="btn-send-bottom" title="End Turn" onclick="sendCreatureToBottom(${idx})">⬇️</button>
                            </div>
                            <div class="tracker-cell init-col draggable-row-cell ${statusClass}" data-index="${idx}" ondragstart="handleTrackerDragStart(event, ${idx})" ondragend="handleTrackerDragEnd(event)">
                                Init ${c.initRoll}
                            </div>
                            <div class="tracker-cell name-col draggable-row-cell ${statusClass}" data-index="${idx}" ondragstart="handleTrackerDragStart(event, ${idx})" ondragend="handleTrackerDragEnd(event)">
                                <span class="status-text flag-staggered">Staggered</span>
                                <span class="status-text flag-dying">Dying</span>
                                <span class="status-text flag-dead">Dead</span>
                                ${c.name}
                            </div>
                            <div class="tracker-cell draggable-row-cell ${statusClass}" style="text-align: right;" data-index="${idx}" ondragstart="handleTrackerDragStart(event, ${idx})" ondragend="handleTrackerDragEnd(event)">
                                <span class="hp-badge" draggable="false">
                                    <input type="number" class="hp-input" value="${c.hp}" data-max="${c.maxHp}" oninput="updateCreatureHpInline(${idx}, this.value)">
                                    / ${c.maxHp} HP
                                </span>
                            </div>
                        `;
                    }).join('')}

                    <!-- QUICK FORM ROW -->
                    <div class="tracker-cell" style="border-top: 2px solid var(--border-color); background: rgba(255,255,255,0.01); text-align: center;">
                        <button type="button" class="btn-add-combatant" onclick="addNewCombatantEntry()">+ Add</button>
                    </div>
                    <div class="tracker-cell" style="border-top: 2px solid var(--border-color); background: rgba(255,255,255,0.01);">
                        <input type="number" id="new-init" class="tracker-input num-input" placeholder="Roll">
                    </div>
                    <div class="tracker-cell" style="border-top: 2px solid var(--border-color); background: rgba(255,255,255,0.01);">
                        <input type="text" id="new-name" class="tracker-input" placeholder="Name/Group...">
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
                                <td><em class="bio-text">${c.bio || ''}</em></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${positions ? `<p class="setup-positions" style="margin-top:20px;"><strong>Setup Positions:</strong> ${positions}</p>` : ''}
        </section>
    `;
}

function renderTactics(tacticsObj, developmentText) {
    if (!tacticsObj && !developmentText) return '';
    
    let html = `<section class="room-section tactics-section"><h3>🧠 Tactics & Development</h3>`;
    
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

function renderTreasure(treasureObj) {
    if (!treasureObj) return '';
    
    return `
        <section class="room-section treasure-section">
            <h3>💰 Treasure & Rewards</h3>
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
// RUNTIME ENGAGEMENT MUTATORS & ENGINE LOGIC
// =========================================================================

function handleTrackerDragStart(e, index) {
    window.dndEngineState.draggedIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    
    document.querySelectorAll(`.draggable-row-cell[data-index="${index}"]`).forEach(cell => {
        cell.classList.add('is-dragging');
    });
}

function handleTrackerDragEnd(e) {
    document.querySelectorAll('.draggable-row-cell').forEach(cell => {
        cell.classList.remove('is-dragging', 'drag-over');
    });
    window.dndEngineState.draggedIndex = null;
}

function handleTrackerDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const targetCell = e.target.closest('.draggable-row-cell');
    if (!targetCell) return;
    
    const targetIndex = parseInt(targetCell.getAttribute('data-index'), 10);
    const originIndex = window.dndEngineState.draggedIndex;
    if (targetIndex === originIndex || originIndex === null) return;

    // Array Index Splicing Logic
    const creatures = window.dndEngineState.liveCreatures;
    const movedItem = creatures.splice(originIndex, 1)[0];
    creatures.splice(targetIndex, 0, movedItem);
    
    window.dndEngineState.draggedIndex = targetIndex;

    // Fast-refresh active view matrix layer
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
    
    // Direct DOM manipulation style updates (saves computing layout allocations)
    const cells = document.querySelectorAll(`.tracker-grid > [data-index="${index}"]`);
    cells.forEach(cell => {
        cell.classList.remove('tracker-row-staggered', 'tracker-row-dying', 'tracker-row-dead');
        
        if (parsedHp === 0) {
            cell.classList.add('tracker-row-staggered');
        } else if (parsedHp <= -1 && parsedHp >= -9) {
            cell.classList.add('tracker-row-dying');
        } else if (parsedHp <= -10) {
            cell.classList.add('tracker-row-dead');
        }
    });
}

function addNewCombatantEntry() {
    const initEl = document.getElementById('new-init');
    const nameEl = document.getElementById('new-name');
    const hpEl = document.getElementById('new-hp');
    const maxHpEl = document.getElementById('new-max-hp');
    
    if (!nameEl?.value.trim() || !initEl?.value || !hpEl?.value || !maxHpEl?.value) {
        alert('Please fill out all tracker properties.');
        return;
    }
    
    window.dndEngineState.liveCreatures.push({
        name: nameEl.value.trim(),
        initRoll: parseInt(initEl.value, 10),
        hp: parseInt(hpEl.value, 10),
        maxHp: parseInt(maxHpEl.value, 10)
    });
    
    forceEngineRedraw();
}

/**
 * Isolated Cache Redraw Trigger
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
    linkTag.href = 'room.css';

    document.head.appendChild(linkTag);
}
