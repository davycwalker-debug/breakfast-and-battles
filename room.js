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
    `;
    document.head.appendChild(styleTag);
}

function renderRoomTemplate(containerId, data) {
    // Inject custom styling system to document head instantly
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

    // 1. Read-Aloud Box
    if (data.readAloud) {
        html += `
            <section class="room-section read-aloud-section">
                <h3>📜 Read-Aloud Text</h3>
                <div class="read-aloud-box">
                    <p>${data.readAloud}</p>
                </div>
            </section>
        `;
    }

    // 2. Room Features & Environment
    if (data.environment) {
        html += `
            <section class="room-section environment-section">
                <h3>🗺️ Room Features & Environment</h3>
                <ul class="env-meta-list">
                    <li><strong>Dimensions:</strong> ${data.environment.dimensions || 'N/A'}</li>
                    <li><strong>Illumination:</strong> ${data.environment.illumination || 'N/A'}</li>
                </ul>
                <div class="env-details">
                    <h4>Key Features:</h4>
                    <ul class="features-list">
                        ${data.environment.features.map(f => `<li><strong>${f.name}:</strong> ${f.desc}</li>`).join('')}
                    </ul>
                    ${data.environment.doors && data.environment.doors.length ? `
                        <h4>Doors:</h4>
                        <ul class="doors-list">
                            ${data.environment.doors.map(d => `<li><strong>${d.location}:</strong> ${d.desc}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            </section>
        `;
    }

    // 3. Combat Tracker & Roster
    if (data.creatures && data.creatures.length) {
        const sortedTracker = [...data.creatures].sort((a, b) => b.initRoll - a.initRoll);

        html += `
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
                            ${data.creatures.map(c => `
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
                ${data.setupPositions ? `<p class="setup-positions" style="margin-top:15px;"><strong>Setup Positions:</strong> ${data.setupPositions}</p>` : ''}
            </section>
        `;
    }

    // 4. Tactics & Development
    if (data.tactics || data.development) {
        html += `
            <section class="room-section tactics-section">
                <h3>🧠 Tactics & Development</h3>
                ${data.tactics && data.tactics.initialRound ? `<p><strong>Initial Round / Trigger:</strong> ${data.tactics.initialRound}</p>` : ''}
                ${data.tactics && data.tactics.individual ? `
                    <h4>Individual Strategy:</h4>
                    <ul class="tactics-list">
                        ${data.tactics.individual.map(t => `<li><strong>${t.name}:</strong> ${t.strategy}</li>`).join('')}
                    </ul>
                ` : ''}
                ${data.development ? `
                    <div class="development-box">
                        <strong>Development / Morale:</strong> ${data.development}
                    </div>
                ` : ''}
            </section>
        `;
    }

    // 5. Hazards & Traps
    if (data.traps && data.traps.length) {
        html += `
            <section class="room-section traps-section">
                <h3>⚠️ Hazards & Traps</h3>
                ${data.traps.map(t => `
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

    // 6. Treasure & Rewards
    if (data.treasure) {
        html += `
            <section class="room-section treasure-section">
                <h3>💰 Treasure & Rewards</h3>
                ${data.treasure.carried ? `<p><strong>Carried Gear:</strong> ${data.treasure.carried}</p>` : ''}
                ${data.treasure.containers && data.treasure.containers.length ? `
                    <h4>Hidden / Secured Wealth:</h4>
                    <ul class="treasure-list">
                        ${data.treasure.containers.map(box => `<li><strong>${box.name}:</strong> ${box.contents}</li>`).join('')}
                    </ul>
                ` : ''}
            </section>
        `;
    }

    // 7. Dynamic Open Sections
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
