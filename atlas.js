// Global configuration matrix used to tint custom markers dynamically
const mapConfiguration = {
    city:     { label: "Cities",    color: "#ffd166", icon: "🏰", size: 26, glow: "rgba(255,209,102,0.8)" },
    town:     { label: "Towns",     color: "#f4a261", icon: "🏠", size: 22, glow: "rgba(244,162,97,0.8)" },
    ruin:     { label: "Ruins",     color: "#9e9e9e", icon: "🪦", size: 24, glow: "rgba(180,180,180,0.7)" },
    forest:   { label: "Forests",   color: "#2a9d8f", icon: "🌲", size: 24, glow: "rgba(42,157,143,0.8)" },
    swamp:    { label: "Swamps",    color: "#556b2f", icon: "🦟", size: 24, glow: "rgba(85,107,47,0.8)" },
    road:     { label: "Roads",     color: "#c2b280", icon: "🛤️", size: 18, glow: "rgba(194,178,128,0.6)" },
    mountain: { label: "Mountains", color: "#8d99ae", icon: "⛰️", size: 28, glow: "rgba(141,153,174,0.8)" },
    region:   { label: "Regions",   color: "#b5179e", icon: "🗺️", size: 30, glow: "rgba(181,23,158,0.8)" },
    dungeon:  { label: "Dungeons",  color: "#d62828", icon: "⚔️", size: 26, glow: "rgba(214,40,40,0.8)" },
    body:     { label: "Bodies",    color: "#4cc9f0", icon: "🌊", size: 26, glow: "rgba(76,201,240,0.8)" },
    river:    { label: "Rivers",    color: "#4895ef", icon: "💧", size: 20, glow: "rgba(72,149,239,0.8)" },
    feature:  { label: "Features",  color: "#adb5bd", icon: "🪨", size: 24, glow: "rgba(173,181,189,0.8)" }
};

// Global variables for layer management
let map, layers;

// Master initialization routine called by individual map files
function initializeAtlas(settings) {
    // 1. Setup basic Leaflet instance map layout frame
    map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -1,
        maxZoom: 5,
        zoomSnap: 0.25,
        doubleClickZoom: false
    });

    const bounds = [[0, 0], [settings.imgHeight, settings.imgWidth]];
    L.imageOverlay(settings.imgUrl, bounds).addTo(map);
    map.fitBounds(bounds);

    // 2. Build master Feature Groups instead of plain objects
    layers = { 
        encountered: L.featureGroup(), 
        unencountered: L.featureGroup() 
    };
    
    // We maintain a secondary tracking matrix specifically to feed structural groupings to the UI plugin
    const subCategories = { encountered: {}, unencountered: {} };
    const groupedOverlays = { "Encountered": {}, "Unencountered": {} };

    Object.keys(mapConfiguration).forEach(key => {
        const item = mapConfiguration[key];
        
        // Create sub layer groups for precise type-toggling (e.g. Cities, Ruins)
        subCategories.encountered[key] = L.layerGroup().addTo(layers.encountered);
        subCategories.unencountered[key] = L.layerGroup().addTo(layers.unencountered);
        
        // Map them out for the UI settings
        groupedOverlays["Encountered"][item.label] = subCategories.encountered[key];
        groupedOverlays["Unencountered"][item.label] = subCategories.unencountered[key];
    });

    // 3. Batch inject configured markers array
    if (settings.markers && Array.isArray(settings.markers)) {
        settings.markers.forEach(m => {
            addMarker(subCategories, m.type, m.encountered, m.y, m.x, m.text, m.url);
        });
    }

    // 4. Turn on the entire Encountered Feature Group natively
    layers.encountered.addTo(map);

    // 5. Mount the controller overlay to layout
    const layerControl = L.control.groupedLayers(null, groupedOverlays, {
        collapsed: true,
        groupCheckboxes: true
    }).addTo(map);

    // Global tracking variable
let unencounteredUnlocked = false;

// UI functions called by the HTML buttons
function toggleDMPanel() {
    const wrapper = document.getElementById('dm-input-wrapper');
    wrapper.style.display = wrapper.style.display === 'none' ? 'flex' : 'none';
}

function checkDMPassword() {
    const passwordInput = document.getElementById('dm-pass');
    const toggleBtn = document.getElementById('dm-toggle-btn');
    const wrapper = document.getElementById('dm-input-wrapper');

    if (passwordInput.value === "password") {
        unencounteredUnlocked = true;
        toggleBtn.innerText = "🔓 DM Layers Unlocked";
        toggleBtn.style.background = "#2a9d8f";
        wrapper.style.display = "none";
        passwordInput.value = "";
    } else {
        alert("Access Denied.");
        passwordInput.value = "";
    }
}

// Inside your initializeAtlas function, replace the old interceptor with this clean check:
function initializeAtlas(settings) {
    // ... (Your existing map setup steps 1 through 5 remain exactly the same) ...

    // --- CLEAN HTML-BASED PASSWORD ENFORCER ---
    map.on('overlayadd', function(e) {
        // Is this an unencountered sublayer?
        const isUnencountered = Object.values(subCategories.unencountered).includes(e.layer);
        
        // If it's unencountered and we aren't unlocked, instantly kick it off without a prompt
        if (isUnencountered && !unencounteredUnlocked) {
            map.removeLayer(e.layer);
            layerControl._update(); // Updates the checkbox seamlessly
        }
    });
}

    // 6. Connect basic structural click handlers for Coordinate HUD
    map.on('click', function(e) {
        document.getElementById('coords').innerHTML = `
            <strong>X:</strong> ${Math.round(e.latlng.lng)} &nbsp;&nbsp;
            <strong>Y:</strong> ${Math.round(e.latlng.lat)}
        `;

        const point = map.latLngToContainerPoint(e.latlng);
        const ripple = document.createElement('div');
        ripple.className = 'click-ripple';
        ripple.style.left = point.x + 'px';
        ripple.style.top = point.y + 'px';

        document.body.appendChild(ripple);
        setTimeout(() => { ripple.remove(); }, 800);
    });
}

// Marker Constructor Engine
function addMarker(subCategories, type, encountered, y, x, popupText, notionUrl) {
    const style = mapConfiguration[type];
    if (!style) return;

    const icon = L.divIcon({
        className: '',
        html: `
            <div style="
                width:${style.size}px; height:${style.size}px;
                border-radius:50%; background:${style.color};
                display:flex; align-items:center; justify-content:center;
                font-size:${style.size * 0.65}px; border:2px solid white;
                box-shadow: 0 0 12px ${style.glow}, 0 0 30px ${style.glow};
            ">
                ${style.icon}
            </div>
        `,
        iconSize: [style.size, style.size],
        iconAnchor: [style.size / 2, style.size / 2]
    });

    const marker = L.marker([y, x], { icon });

    marker.bindPopup(`
        <div style="font-family: sans-serif; text-align: center;">
            <h3>${popupText}</h3>
        </div>
    `, {
        closeButton: false,
        autoClose: true
    });

    marker.on('mouseover', function () { this.openPopup(); });
    marker.on('mouseout', function () { this.closePopup(); });
    marker.on('click', function() { window.open(notionUrl, '_blank'); });

    const state = encountered ? "encountered" : "unencountered";
    marker.addTo(subCategories[state][type]);
}
