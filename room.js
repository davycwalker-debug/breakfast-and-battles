/**
 * D&D 3.5 Room & Encounter Renderer Engine
 * Dynamically builds structural layouts from clean JSON room definitions.
 */

function renderRoomTemplate(containerId, data) {
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
        // Sort combatants by roll automatically for the tracker display
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
                                <th>Quick Bio (1-Line Summary)</th>
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
                ${data.setupPositions ? `<p class="setup-positions"><strong>Setup Positions:</strong> ${data.setupPositions}</p>` : ''}
            </section>
        `;
    }

    // 4. Tactics & Development
    if (data.tactics || data.development) {
        html += `
            <section class="room-section tactics-section">
                <h3>🧠 Tactics & Development</h3>
                ${data.tactics && data.tactics.initialRound ? `<li><strong>Initial Round / Trigger:</strong> ${data.tactics.initialRound}</li>` : ''}
                ${data.tactics && data.tactics.individual ? `
                    <h4 style="margin-top:12px;">Individual Strategy:</h4>
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

    // 7. Dynamic Open Sections Add-on Engine
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
