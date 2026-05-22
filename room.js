/**
 * D&D 3.5 Self-Styling Room & Encounter Renderer Engine
 * Injects its own design system rules dynamically to keep HTML templates incredibly lean.
 */

function injectEngineStyles() {
    // Prevent duplicate style tags if rendering multiple encounters on one page
    if (document.getElementById('dnd-engine-core-styles')) return;

    const styleTag = document.createElement('style');
    styleTag.id = 'dnd-engine-core-styles';
    styleTag.textContent = `
        :root {
            --bg-color: #0f0f11;
            --card-color: #16161a;
            --card-inner: #1d1d24;
            --border-color: #2a2a32;
            --border-muted: #222229;
            --text-main: #f1f1f4;
            --text-muted: #9494a1;
            --accent-gold: #c5b4a8;
            --accent-red: #ff5a60;
            --accent-purple: #a855f7;
            --read-aloud-bg: #141913;
            --read-aloud-border: #3b4c34;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            margin: 0;
            padding: 40px 20px;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
        }

        .dnd-room-wrapper {
            background: var(--card-color);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
            margin-bottom: 40px;
        }

        h1, h2, h3, h4 {
            color: var(--text-main);
            font-weight: 700;
            letter-spacing: -0.02em;
            margin-top: 0;
        }

        h1 { font-size: 2.25rem; margin-bottom: 8px; }
        h2 { font-size: 1.75rem; margin-bottom: 16px; }
        
        h3 {
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 10px;
            margin-top: 36px;
            margin-bottom: 18px;
            font-size: 1.35rem;
            letter-spacing: 0.02em;
        }

        h4 {
            font-size: 1.05rem;
            color: var(--accent-gold);
            margin-top: 20px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .room-subtitle {
            color: var(--text-muted);
            font-size: 1.1rem;
            margin: 0;
        }

        .section-divider {
            border: 0;
            height: 1px;
            background: linear-gradient(to right, var(--border-color), transparent);
            margin: 24px 0 32px 0;
        }

        .read-aloud-box {
            background-color: var(--read-aloud-bg);
            border-left: 4px solid var(--read-aloud-border);
            padding: 18px 24px;
            border-radius: 0 6px 6px 0;
            font-style: italic;
            color: #d1d5db;
            margin: 16px 0;
        }
        
        .read-aloud-box p {
            margin: 0;
        }

        ul {
            padding-left: 24px;
            margin: 12px 0;
        }

        li {
            margin-bottom: 8px;
        }

        .env-meta-list {
            list-style: none;
            padding-left: 0;
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            background: var(--card-inner);
            border: 1px solid var(--border-muted);
            padding: 14px 20px;
            border-radius: 8px;
            margin-bottom: 24px;
        }
        
        .env-meta-list li {
            margin-bottom: 0;
        }

        .tracker-box {
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 8px;
            margin-bottom: 24px;
        }
        
        .tracker-row {
            display: flex;
            align-items: center;
            padding: 10px 14px;
            border-bottom: 1px solid var(--border-muted);
            gap: 12px; /* Added explicit gap to separate elements neatly */
        }
        
        .init-badge {
            min-width: 65px; /* Changed from static width to min-width to prevent truncation/wrapping */
            white-space: nowrap; /* Forces "Init 15" to stay safely on one line */
            font-weight: bold; 
            color: var(--accent-gold); 
            font-family: monospace; 
            font-size: 1rem; 
        }

        .tracker-row:last-child { border-bottom: none; }
        .tracker-row input[type="checkbox"] { margin-right: 16px; transform: scale(1.15); cursor: pointer; }
        .creature-name { flex-grow: 1; font-weight: 600; }
        .hp-badge { background: var(--card-inner); padding: 4px 10px; border-radius: 4px; border: 1px solid var(--border-muted); font-size: 0.85rem; color: var(--text-muted); }

        .table-responsive { overflow-x: auto; margin-top: 16px; border-radius: 8px; border: 1px solid var(--border-color); }
        .roster-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            background: var(--card-inner);
        }

        .roster-table th, .roster-table td {
            padding: 14px 16px;
            border-bottom: 1px solid var(--border-color);
        }

        .roster-table tr:last-child td { border-bottom: none; }

        .roster-table th {
            background-color: var(--bg-color);
            color: var(--text-muted);
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 2px solid var(--border-color);
        }

        .stat-block {
            background: var(--bg-color);
            padding: 4px 8px;
            border-radius: 4px;
            font-family: monospace;
            border: 1px solid var(--border-muted);
            color: var(--text-main);
            font-size: 0.9rem;
        }

        .trap-card {
            background: #201314;
            border: 1px solid #541e21;
            border-radius: 8px;
            padding: 20px;
            margin-top: 16px;
        }

        .trap-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #6e272a;
            padding-bottom: 8px;
            margin-bottom: 14px;
        }
        
        .trap-title { font-size: 1.1rem; }
        .trap-cr { color: var(--accent-red); font-weight: bold; font-size: 1.1rem; background: rgba(230, 57, 70, 0.1); padding: 2px 8px; border-radius: 4px; }
        .trap-meta { list-style-type: none; padding-left: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }

        .dc-block {
            background: #3d1719;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            color: #ff9999;
            font-weight: bold;
            border: 1px solid #6e272a;
        }

        .development-box {
            background: var(--card-inner);
            border: 1px dashed var(--border-color);
            padding: 16px 20px;
            margin-top: 20px;
            border-radius: 6px;
        }

        /* Dialogue Trees */
        .dialogue-tree-container {
            background: var(--card-inner);
            border-left: 4px solid var(--accent-gold);
            padding: 20px;
            margin: 24px 0;
            border-radius: 0 8px 8px 0;
            border: 1px solid var(--border-muted);
            border-left: 4px solid var(--accent-gold);
        }
        .dialogue-tree-container h3 { margin-top: 0; border: none; padding: 0; }
        .dialogue-branches { display: flex; flex-direction: column; gap: 16px; margin-top: 14px; }
        .dialogue-node {
            padding-bottom: 14px;
            border-bottom: 1px dashed var(--border-color);
        }
        .dialogue-node:last-child { border: none; margin: 0; padding: 0; }
        .dialogue-prompt { color: var(--text-muted); font-size: 0.95em; font-style: italic; margin-bottom: 4px; }
        .dialogue-prompt strong { color: var(--text-main); font-style: normal; }
        .dialogue-response { color: #b3d9ff; padding-left: 8px; }
        .speaker-tag { color: #ffb366; font-weight: bold; }
        
        /* Ability Check Cards */
        .ability-checks-container {
            margin: 20px 0;
        }
        .check-card {
            background: var(--card-inner);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            margin-bottom: 16px;
            overflow: hidden;
        }
        .check-card .dialogue-prompt { padding: 12px 16px 0 16px; }
        .check-card .read-aloud-box { margin: 12px 16px; }
        .check-dc-badge {
            background: #261b1c;
            padding: 10px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: bold;
            border-bottom: 1px solid var(--border-muted);
        }
        .check-type { color: var(--text-main); font-size: 0.95rem; }
        .check-dc { color: var(--accent-red); font-size: 1rem; background: rgba(230, 57, 70, 0.1); padding: 2px 8px; border-radius: 4px; }
        .check-branches { padding: 16px; font-size: 0.95em; display: flex; flex-direction: column; gap: 8px; }
        .branch { padding-left: 14px; }
        .branch.success { border-left: 3px solid #4caf50; }
        .branch.failure { border-left: 3px solid #f44336; }
        
        /* Special Event Cards */
        .special-event-card {
            border-radius: 8px;
            padding: 24px;
            margin: 32px 0;
            background: rgba(168, 85, 247, 0.03);
            border: 1px solid rgba(168, 85, 247, 0.4);
        }
        .special-event-card.danger {
            background: rgba(230, 57, 70, 0.03);
            border: 1px solid rgba(230, 57, 70, 0.4);
        }
        .event-header { display: flex; gap: 16px; align-items: center; margin-bottom: 16px; }
        .event-icon { font-size: 1.75em; line-height: 1; }
        .event-title-group h4 { margin: 0; color: #fff; font-size: 1.15em; text-transform: none; letter-spacing: normal; }
        .event-trigger { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-top: 2px; }
    `;
    document.head.appendChild(styleTag);
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
function renderCombatTracker(creaturesArray, setupPositions) {
    if (!creaturesArray || !creaturesArray.length) return '';
    
    const sortedTracker = [...creaturesArray].sort((a, b) => b.initRoll - a.initRoll);
    
    return `
        <section class="room-section combat-section">
            <h3>⚔️ Combat & Initiative Tracker</h3>
            <div class="tracker-box">
                ${sortedTracker.map(c => `
                    <div class="tracker-row">
                        <input type="checkbox" id="check-${c.name.replace(/\s+/g, '-')}">
                        <span class="init-badge">Init ${c.initRoll}</span>
                        <span class="creature-name">${c.name}</span>
                        <span class="hp-badge">${c.hp} / ${c.maxHp} HP</span>
                    </div>
                `).join('')}
            </div>

            <h3>👾 Creature Rosters & Stats</h3>
            <div class="table-responsive">
                <table class="roster-table">
                    <thead>
                        <tr>
                            <th>Creature</th>
                            <th>AC</th>
                            <th>Saves (F/R/W)</th>
                            <th>Type / Subtype</th>
                            <th>Quick Bio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${creaturesArray.map(c => `
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

function renderRoomTemplate(containerId, data) {
    // Inject dynamic template styles straight into document frame
    injectEngineStyles();

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

    // 5. Active Combat Matrix Tracking System & Monster Indexes
    html += renderCombatTracker(data.creatures, data.setupPositions);

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
