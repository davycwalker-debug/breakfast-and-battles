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
            --bg-color: #121214;
            --card-color: #1a1a1e;
            --border-color: #2d2d34;
            --text-main: #e2e2e9;
            --text-muted: #a1a1aa;
            --accent-gold: #beada5;
            --accent-red: #e63946;
            --read-aloud-bg: #151813;
            --read-aloud-border: #4f5d47;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
        }

        .dnd-room-wrapper {
            background: var(--card-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            margin-bottom: 30px;
        }

        h1, h2, h3, h4 {
            color: var(--text-main);
            margin-top: 0;
        }

        h3 {
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 6px;
            margin-top: 24px;
            font-size: 1.3rem;
        }

        .room-subtitle {
            color: var(--text-muted);
            font-size: 1rem;
            margin: 4px 0 0 0;
        }

        .section-divider {
            border: 0;
            height: 1px;
            background: linear-gradient(to right, var(--accent-gold), transparent);
            margin: 20px 0;
        }

        .read-aloud-box {
            background-color: var(--read-aloud-bg);
            border-left: 4px solid var(--read-aloud-border);
            padding: 15px 20px;
            border-radius: 4px;
            font-style: italic;
            color: #d1d5db;
        }

        ul {
            padding-left: 20px;
            margin: 8px 0;
        }

        li {
            margin-bottom: 6px;
        }

        .env-meta-list {
            list-style: none;
            padding-left: 0;
            display: flex;
            gap: 20px;
            background: rgba(255,255,255,0.03);
            padding: 10px;
            border-radius: 4px;
        }

        .tracker-box {
            background: #0f0f11;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 20px;
        }

        .tracker-row {
            display: flex;
            align-items: center;
            padding: 6px 8px;
            border-bottom: 1px solid #222;
        }

        .tracker-row:last-child { border-bottom: none; }
        .tracker-row input[type="checkbox"] { margin-right: 12px; transform: scale(1.1); }
        .init-badge { width: 45px; font-weight: bold; color: var(--text-muted); }
        .creature-name { flex-grow: 1; }
        .hp-badge { color: var(--text-muted); font-size: 0.9rem; }

        .table-responsive { overflow-x: auto; }
        .roster-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            text-align: left;
        }

        .roster-table th, .roster-table td {
            padding: 10px 12px;
            border-bottom: 1px solid var(--border-color);
        }

        .roster-table th {
            background-color: rgba(255,255,255,0.02);
            color: var(--text-muted);
            font-size: 0.85rem;
            text-transform: uppercase;
        }

        .stat-block {
            background: #222;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
        }

        .trap-card {
            background: #221415;
            border: 1px solid #4a1c1e;
            border-radius: 6px;
            padding: 15px;
            margin-top: 12px;
        }

        .trap-header {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #5a282a;
            padding-bottom: 4px;
            margin-bottom: 8px;
        }

        .trap-cr { color: var(--accent-red); font-weight: bold; }
        .trap-meta { list-style-type: none; padding-left: 0; }

        .dc-block {
            background: #3a1517;
            padding: 1px 4px;
            border-radius: 3px;
            color: #ffb4b4;
        }

        .development-box {
            background: rgba(255,255,255,0.02);
            border: 1px dashed var(--border-color);
            padding: 12px 15px;
            margin-top: 15px;
            border-radius: 4px;
        }

        /* Dialogue Trees */
        .dialogue-tree-container {
            background: rgba(255, 255, 255, 0.02);
            border-left: 4px solid #b3925c;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .dialogue-node {
            margin-bottom: 14px;
            padding-bottom: 10px;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
        }
        .dialogue-node:last-child { border: none; margin: 0; padding: 0; }
        .dialogue-prompt { color: #e0e0e0; font-size: 0.95em; font-style: italic; }
        .dialogue-response { margin-top: 4px; color: #b3d9ff; }
        .speaker-tag { color: #ffb366; font-weight: bold; font-style: normal; }
        
        /* Ability Check Cards */
        .ability-checks-container {
            margin: 15px 0;
        }
        .check-card {
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            margin-bottom: 12px;
            overflow: hidden;
        }
        .check-dc-badge {
            background: #3a1a1c;
            padding: 6px 12px;
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .check-dc { color: #ff4d4d; }
        .check-branches { padding: 10px; font-size: 0.9em; }
        .branch { margin-bottom: 6px; padding-left: 12px; }
        .branch.success { border-left: 3px solid #4caf50; }
        .branch.failure { border-left: 3px solid #f44336; margin-bottom: 0; }
        
        /* Special Event Cards */
        .special-event-card {
            border-radius: 8px;
            padding: 16px;
            margin: 25px 0;
            background: rgba(138, 43, 226, 0.05);
            border: 1px solid #8a2be2;
        }
        .special-event-card.danger {
            background: rgba(178, 34, 34, 0.05);
            border: 1px solid #b22222;
        }
        .event-header { display: flex; gap: 12px; align-items: center; margin-bottom: 10px; }
        .event-icon { font-size: 1.5em; }
        .event-title-group h4 { margin: 0; color: #fff; font-size: 1.1em; }
        .event-trigger { font-size: 0.8em; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; }
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
            <div class="check-dc-badge">
                <span class="check-type">${check.type}</span>
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
                    <h4>Key Features:</h4>
                    <ul class="features-list">
                        ${envObj.features.map(f => `<li><strong>${f.name}:</strong> ${f.desc}</li>`).join('')}
                    </ul>
                ` : ''}
                ${envObj.doors && envObj.doors.length ? `
                    <h4>Doors:</h4>
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
            <h3 class="section-title">💬 Dialogue Tree</h3>
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
                        <span class="init-badge">(${c.initRoll})</span>
                        <span class="creature-name">${c.name}</span>
                        <span class="hp-badge">${c.hp} / ${c.maxHp} HP</span>
                    </div>
                `).join('')}
            </div>

            <h3>👾 Creature Rosters & Quick Bios</h3>
            <div class="table-responsive">
                <table class="roster-table">
                    <thead>
                        <tr>
                            <th>Creature</th>
                            <th>AC</th>
                            <th>Saves (F / R / W)</th>
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
            ${setupPositions ? `<p class="setup-positions" style="margin-top:15px;"><strong>Setup Positions:</strong> ${setupPositions}</p>` : ''}
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
            html += `<p><strong>Initial Round / Trigger:</strong> ${tacticsObj.initialRound}</p>`;
        }
        if (tacticsObj.individual && tacticsObj.individual.length) {
            html += `
                <h4>Individual Strategy:</h4>
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
                        <li><strong>Trigger:</strong> ${t.trigger} | <strong>Reset:</strong> ${t.reset}</li>
                        <li><strong>Search DC:</strong> <code class="dc-block">${t.searchDc}</code> | <strong>Disable Device DC:</strong> <code class="dc-block">${t.disableDc}</code></li>
                        <li><strong>Effect:</strong> ${t.effect}</li>
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
            ${treasureObj.carried ? `<p><strong>Carried Gear:</strong> ${treasureObj.carried}</p>` : ''}
            ${treasureObj.containers && treasureObj.containers.length ? `
                <h4>Hidden / Secured Wealth:</h4>
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
                <span class="event-icon">🔓</span>
                <div class="event-title-group">
                    <h4>${eventObj.title}</h4>
                    <span class="event-trigger">Trigger: ${eventObj.trigger}</span>
                </div>
            </div>
            <div class="event-body">
                ${renderReadAloudBox(eventObj.readAloud)}
                ${eventObj.mechanics ? `<div class="event-mechanics">${renderInlineChecks(eventObj.mechanics)}</div>` : ''}
                ${eventObj.outcome ? `<div class="event-outcome"><strong>Outcome:</strong> ${eventObj.outcome}</div>` : ''}
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
        html += renderInlineChecks(data.initialReadAloudChecks);
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
