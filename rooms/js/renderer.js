import { syncEngineStateWithCsv } from './engineState.js';
import { calculatePowerLevel, calculateEncounterLevel, calculatePartyPowerLevel, calculatePartyEncounterLevel, mExperience, parseChallengeRating } from './dataParsers.js';

export function injectEngineStyles() {
    if (document.getElementById('dnd-engine-core-styles')) return;
    const linkTag = document.createElement('link');
    linkTag.id = 'dnd-engine-core-styles';
    linkTag.rel = 'stylesheet';
    linkTag.href = 'https://davycwalker-debug.github.io/breakfast-and-battles/rooms/room.css';
    document.head.appendChild(linkTag);
}

export function captureActiveFocusKey() {
    const activeEl = document.activeElement;
    return activeEl && activeEl.hasAttribute('data-focus-key') ? activeEl.getAttribute('data-focus-key') : null;
}

export function restoreFocusKey(container, savedFocusKey) {
    if (!savedFocusKey) return;
    const restoreEl = container.querySelector(`[data-focus-key="${savedFocusKey}"]`);
    if (restoreEl) {
        restoreEl.focus();
        const tempVal = restoreEl.value;
        restoreEl.value = '';
        restoreEl.value = tempVal;
    }
}

export function getTrackerStatusClass(hp, subdual) {
    if (hp <= -1 && hp >= -9) return 'tracker-row-dying';
    if (hp <= -10) return 'tracker-row-dead';
    if (hp >= 0) {
        if (subdual > hp) return 'tracker-row-unconscious';
        if (subdual === hp || hp === 0) return 'tracker-row-staggered';
    }
    return '';
}

export function buildSubtitle(baseSubtitle, metrics) {
    const metricsString = `CL ${metrics.clString}, XP ${metrics.xpString}`;
    return baseSubtitle ? `${baseSubtitle} -- ${metricsString}` : metricsString;
}

export function calculateEncounterMetrics(data) {
    let totalPartyCount = 0, totalPartyECL = 0, totalPartyPl = 0;
    const creatures = window.dndEngineState.liveCreatures || [];
    const totalPl = creatures.reduce((sum, c) => sum + calculatePowerLevel(c.cr), 0);
    const totalEl = calculateEncounterLevel(totalPl);

    if (window.dndEngineState?.partySlots) {
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
    const clString = totalCr.toFixed(2);
    const averagePartyLevel = totalPartyCount > 0 ? (totalPartyECL / totalPartyCount) : 0;
    
    let dynamicXpAward = 0;
    if (averagePartyLevel > 0) {
        dynamicXpAward = creatures.reduce((sum, creature) => {
            const crValue = parseChallengeRating(creature.cr);
            return sum + mExperience(averagePartyLevel, crValue);
        }, 0);
    }

    const averageXp = totalPartyCount > 0 ? (dynamicXpAward / totalPartyCount) : 0;
    const adjustedXp = totalCr > 6 ? averageXp / 10 : averageXp;
    const activeMultiplier = window.dndEngineState.xpMultiplier || 1.0;
    const xpString = Math.ceil(adjustedXp * activeMultiplier).toString();

    return { totalPartyCount, clString, xpString };
}

// --- Markup Generator Partial Blocks ---

export function renderHeader(title, subtitle) {
    return `
        <header class="room-header">
            <h1>${title || 'Encounter Area'}</h1>
            <div class="header-subtitle-row">
                ${subtitle ? `<p class="room-subtitle">${subtitle}</p>` : '<div></div>'}
                <div class="multiplier-wrapper">
                    <label for="input-xp-multiplier" class="multiplier-label">Multiplier:</label>
                    <input type="text" id="input-xp-multiplier" data-focus-key="xp-multiplier" class="tracker-input multiplier-input" placeholder="1.0" value="${window.dndEngineState.xpMultiplierText}" oninput="updateXpMultiplier(this.value)">
                </div>
            </div>
        </header>
        <hr class="section-divider">
    `;
}

export function renderReadAloudBox(text) {
    return text ? `<div class="read-aloud-box"><p>${text}</p></div>` : '';
}

export function renderInlineChecks(mechanicsArray) {
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

export function renderEnvironment(envObj) {
    if (!envObj) return '';
    const featuresHtml = envObj.features?.length ? `<h4>Key Features</h4><ul class="features-list">${envObj.features.map(f => `<li><strong>${f.name}:</strong> ${f.desc}</li>`).join('')}</ul>` : '';
    const doorsHtml = envObj.doors?.length ? `<h4>Doors</h4><ul class="doors-list">${envObj.doors.map(d => `<li><strong>${d.location}:</strong> ${d.desc}</li>`).join('')}</ul>` : '';
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

export function renderDialogueTree(dialogueArray) {
    if (!dialogueArray || !dialogueArray.length) return '';
    return `
        <div class="dialogue-tree-container">
            <h3>Dialogue Options</h3>
            <div class="dialogue-branches">
                ${dialogueArray.map(node => `
                    <div class="dialogue-node">
                        <div class="dialogue-prompt"><strong>Prompt:</strong> "${node.prompt}"</div>
                        <div class="dialogue-response"><span class="speaker-tag">${node.speaker || 'NPC'}:</span> "${node.response}"</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

export function renderCombatTracker(liveTracker, positions) {
    if (!liveTracker) return '';
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
                    ${liveTracker.map((c, idx) => renderTrackerRow(c, idx)).join('')}
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
                        <span class="subdual-inline-wrapper">Sub: <input type="number" id="new-subdual" data-focus-key="new-subdual-input" class="tracker-input num-input sub-input-w accent-orange-text" value="0"></span>
                    </div>
                </div>
            </div>
            ${positions && typeof positions === 'string' ? `<p class="setup-positions"><strong>Setup Positions:</strong> ${positions}</p>` : ''}
        </section>
    `;
}

export function renderTrackerRow(c, idx) {
    if (c.subdual === undefined) c.subdual = 0;
    const statusClass = getTrackerStatusClass(c.hp, c.subdual);
    const hasStats = c.ac && c.saves && c.type;
    const displayNameText = c.link ? `<a href="${c.link}" target="_blank" rel="noopener noreferrer" class="tracker-creature-link" onclick="event.stopPropagation();">${c.name}</a>` : `<span>${c.name}</span>`;
    
    const nameDisplay = hasStats ? `
        <div class="tooltip-target">
            ${displayNameText}
            <div class="roster-tooltip">
                <div class="tooltip-stat"><strong>AC:</strong> ${c.ac}</div>
                <div class="tooltip-stat"><strong>Saves:</strong> ${c.saves.replace(/\n/g, '<br>')}</div>
                <div class="tooltip-stat"><strong>Type:</strong> ${c.type}</div>
            </div>
        </div>
    ` : displayNameText;

    return `
        <div class="tracker-cell tracker-drag-handle ${statusClass}" draggable="true" data-index="${idx}" ondragstart="handleTrackerDragStart(event, ${idx})" ondragend="handleTrackerDragEnd(event)">
            <button type="button" class="btn-send-bottom" title="End Turn" onclick="sendCreatureToBottom(${idx})">Next</button>
        </div>
        <div class="tracker-cell init-col ${statusClass} flex-align-center-gap-8">
            <button type="button" class="btn-send-bottom remove-btn-color font-weight-bold" title="Remove Combatant" onclick="removeCombatantEntry(${idx})">×</button>
            <label for="creature-init-${idx}" class="init-label-text">Init</label>
            <input type="number" id="creature-init-${idx}" name="creature-init-${idx}" data-focus-key="creature-init-${idx}" class="hp-input inline-init-input" value="${c.initRoll}" oninput="updateCreatureInitiativeInline(${idx}, this.value)">
        </div>
        <div class="tracker-cell name-col ${statusClass}" data-index="${idx}">
            <div class="creature-name-layout" style="display: flex; flex-direction: column; width: 100%; gap: 4px;">
                <div>
                    <span class="status-text flag-staggered">[Staggered] </span>
                    <span class="status-text flag-dying">[Dying] </span>
                    <span class="status-text flag-dead">[Dead] </span>
                    <span class="status-text flag-unconscious">[Unconscious] </span>
                    ${nameDisplay}
                </div>
                <input type="text" id="creature-note-${idx}" name="creature-note-${idx}" aria-label="Notes for ${c.name}" class="tracker-creature-note-input" placeholder="Notes (Conditions, positions...)" value="${c.notes || ''}" oninput="window.dndEngineState.liveCreatures[${idx}].notes = this.value">
            </div>
        </div>
        <div class="tracker-cell hp-col ${statusClass}" data-index="${idx}">
            <span class="hp-badge" draggable="false">
                <input type="number" id="creature-hp-${idx}" name="creature-hp-${idx}" aria-label="Creature HP" data-focus-key="creature-hp-${idx}" class="hp-input" value="${c.hp}" data-max="${c.maxHp}" oninput="updateCreatureHpInline(${idx}, this.value)">
                <span class="text-muted">/ ${c.maxHp} HP</span>
            </span>
            <span class="text-muted font-weight-normal mx-4">|</span>
            <span class="subdual-badge subdual-text-wrapper" draggable="false">
                <label for="creature-sub-${idx}">Sub:</label> 
                <input type="number" id="creature-sub-${idx}" name="creature-sub-${idx}" data-focus-key="creature-sub-${idx}" class="hp-input inline-sub-input" value="${c.subdual}" oninput="updateCreatureSubdualInline(${idx}, this.value)">
            </span>
        </div>
    `;
}

export function renderTactics(tacticsObj, developmentText) {
    if (!tacticsObj && !developmentText) return '';
    let html = `<section class="room-section tactics-section"><h3>Tactics & Development</h3>`;
    if (tacticsObj) {
        if (tacticsObj.initialRound) html += `<p class="mb-16"><strong>Initial Round / Trigger:</strong> ${tacticsObj.initialRound}</p>`;
        if (tacticsObj.individual?.length) {
            html += `<h4>Individual Strategy</h4><ul class="tactics-list">${tacticsObj.individual.map(t => `<li><strong>${t.name}:</strong> ${t.strategy}</li>`).join('')}</ul>`;
        }
    }
    if (developmentText) html += `<div class="development-box"><strong>Development / Morale:</strong> ${developmentText}</div>`;
    return html + `</section>`;
}

export function renderTraps(trapsArray) {
    if (!trapsArray || !trapsArray.length) return '';
    return `
        <section class="room-section traps-section">
            <h3>Hazards & Traps</h3>
            ${trapsArray.map(t => `
                <div class="trap-card">
                    <div class="trap-header"><span class="trap-title"><strong>${t.name}</strong></span><span class="trap-cr">CR ${t.cr}</span></div>
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

export function renderTreasure(treasureObj) {
    if (!treasureObj) return '';
    return `
        <section class="room-section treasure-section">
            <h3>Treasure & Rewards</h3>
            ${treasureObj.carried ? `<p class="mb-16"><strong>Carried Gear:</strong> ${treasureObj.carried}</p>` : ''}
            ${treasureObj.containers?.length ? `<h4>Hidden / Secured Wealth</h4><ul class="treasure-list">${treasureObj.containers.map(box => `<li><strong>${box.name}:</strong> ${box.contents}</li>`).join('')}</ul>` : ''}
        </section>
    `;
}

export function renderSpecialEvent(eventObj) {
    if (!eventObj) return '';
    const severityLabel = eventObj.severity === 'danger' ? 'Critical' : 'Notice';
    return `
        <div class="special-event-card ${eventObj.severity || 'info'}">
            <div class="event-header">
                <span class="event-status-badge status-${eventObj.severity || 'info'}">${severityLabel}</span>
                <div class="event-title-group"><h4>${eventObj.title}</h4><span class="event-trigger">Trigger: ${eventObj.trigger}</span></div>
            </div>
            <div class="event-body">
                ${eventObj.readAloud ? renderReadAloudBox(eventObj.readAloud) : ''}
                ${eventObj.mechanics ? `<div class="event-mechanics mt-16">${renderInlineChecks(eventObj.mechanics)}</div>` : ''}
                ${eventObj.outcome ? renderReadAloudBox(eventObj.outcome) : ''}
            </div>
        </div>
    `;
}

export function renderCustomSection(sec) {
    return `<section class="room-section custom-section"><h3>${sec.heading}</h3><div class="custom-content">${sec.content}</div></section>`;
}

export function renderPartyEclMatrix(slots, creatures, totalPartyCount) {
    const activeMultiplier = window.dndEngineState.xpMultiplier || 1.0;
    
    const activeCreatures = (creatures && creatures.length) 
        ? creatures 
        : (window.dndEngineState?.liveCreatures || []);

    let rowsHtml = slots.map((slot, index) => {
        const rowCount = Number(slot.count) || 0;
        const rowEcl = Number(slot.ecl) || 0;
        let rowXpString = "—";

        if (rowCount > 0 && rowEcl > 0 && activeCreatures.length > 0) {
            const dynamicRowXpAward = activeCreatures.reduce((sum, creature) => {
                const crValue = parseChallengeRating(creature.cr);
                return sum + mExperience(rowEcl, crValue);
            }, 0);
            
            const averageRowXp = dynamicRowXpAward > 0 ? (dynamicRowXpAward / totalPartyCount) : 0;
            rowXpString = Math.ceil(averageRowXp * activeMultiplier);
        }

        return `
            <div class="party-matrix-row">
                <div class="matrix-cell-num">#${index + 1}</div>
                <div class="matrix-input-group">
                    <label for="matrix-count-${index}">Count:</label>
                    <input type="number" id="matrix-count-${index}" data-focus-key="matrix-count-${index}" class="tracker-input matrix-input num-input" placeholder="0" value="${slot.count}" oninput="updatePartyMatrixSlot(${index}, 'count', this.value)">
                </div>
                <div class="matrix-input-group">
                    <label for="matrix-ecl-${index}">ECL:</label>
                    <input type="number" id="matrix-ecl-${index}" data-focus-key="matrix-ecl-${index}" class="tracker-input matrix-input num-input" placeholder="1" value="${slot.ecl}" oninput="updatePartyMatrixSlot(${index}, 'ecl', this.value)">
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
            <div class="party-matrix-grid">${rowsHtml}</div>
        </section>
        <section class="section-divider-wrapper"><hr class="section-divider"></section>
    `;
}

// --- Main Structural Orchestrator ---

export async function renderRoomTemplate(containerId, data) {
    injectEngineStyles();
    await syncEngineStateWithCsv(containerId, data);

    const container = document.getElementById(containerId);
    if (!container) return console.error(`Target container element ID "${containerId}" was not found.`);

    const metrics = calculateEncounterMetrics(data);
    const displaySubtitle = buildSubtitle(data.subtitle, metrics);

    let htmlLines = [
        `<div class="dnd-room-wrapper">`,
        renderHeader(data.title, displaySubtitle),
        renderPartyEclMatrix(window.dndEngineState.partySlots, data.creatures, metrics.totalPartyCount)
    ];
    
    if (data.readAloud) htmlLines.push(`<section class="room-section read-aloud-section"><h3>Read-Aloud Narrative</h3>${renderReadAloudBox(data.readAloud)}</section>`);
    if (data.initialReadAloudChecks) htmlLines.push(`<div class="ability-checks-container">${renderInlineChecks(data.initialReadAloudChecks)}</div>`);
    
    htmlLines.push(renderEnvironment(data.environment));
    if (data.dialogueTree) htmlLines.push(renderDialogueTree(data.dialogueTree));

    htmlLines.push(renderCombatTracker(window.dndEngineState.liveCreatures, data.setupPositions));
    htmlLines.push(renderTactics(data.tactics, data.development));
    htmlLines.push(renderTraps(data.traps));
    htmlLines.push(renderTreasure(data.treasure));

    if (data.specialEvents) data.specialEvents.forEach(evt => htmlLines.push(renderSpecialEvent(evt)));
    if (data.additionalSections) data.additionalSections.forEach(sec => htmlLines.push(renderCustomSection(sec)));

    htmlLines.push(`</div>`);
    
    const savedFocusKey = captureActiveFocusKey();
    container.innerHTML = htmlLines.join('\n');
    restoreFocusKey(container, savedFocusKey);
}
