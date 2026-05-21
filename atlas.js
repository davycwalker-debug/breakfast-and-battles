// Global configuration matrix used to tint custom markers dynamically
const mapConfiguration = {
    city:     { label: "Cities",    color: "#ffd166", icon: "🏰", size: 26, glow: "rgba(255,209,102,0.8)" },
    town:     { label: "Towns",     color: "#f4a261", icon: "🏠", size: 22, glow: "rgba(244,162,97,0.8)" },
    ruin:     { label: "Ruins",     color: "#9e9e9e", icon: "🪦", size: 24, glow: "rgba(180,180,180,0.7)" },
    forest:   { label: "Forests",   color: "#2a9d8f", icon: "🌲", size: 24, glow: "rgba(42,157,143,0.8)" },
    swamp:    { label: "Swamps",    color: "#556b2f", icon: "🦟", size: 24, glow: "rgba(85,107,47,0.8)" },
    desert:   { label: "Deserts",   color: "#e9c46a", icon: "🌵", size: 24, glow: "rgba(233,196,106,0.8)" },
    road:     { label: "Roads",     color: "#c2b280", icon: "🛤️", size: 18, glow: "rgba(194,178,128,0.6)" },
    mountain: { label: "Mountains", color: "#8d99ae", icon: "⛰️", size: 28, glow: "rgba(141,153,174,0.8)" },
    region:   { label: "Regions",   color: "#b5179e", icon: "🗺️", size: 30, glow: "rgba(181,23,158,0.8)" },
    dungeon:  { label: "Dungeons",  color: "#d62828", icon: "⚔️", size: 26, glow: "rgba(214,40,40,0.8)" },
    body:     { label: "Bodies",    color: "#4cc9f0", icon: "🌊", size: 26, glow: "rgba(76,201,240,0.8)" },
    river:    { label: "Rivers",    color: "#4895ef", icon: "💧", size: 20, glow: "rgba(72,149,239,0.8)" },
    feature:  { label: "Features",  color: "#adb5bd", icon: "🪨", size: 24, glow: "rgba(173,181,189,0.8)" }
};

// Global variables for layer management
let map, layers, subCategories, layerControl;
let unencounteredUnlocked = false;

// Handles clicking the main button (Toggles panel or immediately locks down)
function handleDMButtonClick() {
    const toggleBtn = document.getElementById('dm-toggle-btn');
    const wrapper = document.getElementById('dm-input-wrapper');

    if (unencounteredUnlocked) {
        unencounteredUnlocked = false;
        
        if (window.subCategories && window.subCategories.unencountered) {
            Object.values(window.subCategories.unencountered).forEach(layer => {
                if (map.hasLayer(layer)) {
                    map.removeLayer(layer);
                }
            });
        }
        
        toggleBtn.innerText = "🔒 Unlock DM Layers";
        toggleBtn.style.background = "#d62828";
        wrapper.style.display = "none";
        
        if (window.layerControl) {
            window.layerControl._update();
        }
    } else {
        wrapper.style.display = wrapper.style.display === 'none' ? 'flex' : 'none';
    }
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

// Master initialization routine called by individual map files
function initializeAtlas(settings) {
    // 1. Setup Leaflet instance with adaptive zoom properties
    map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -1,         // Allowed deeper zooming out to see full map on small monitors
        maxZoom: 2,
        zoomSnap: 0.1,       // Much finer grain zoom adjustment intervals
        zoomDelta: 0.5,
        doubleClickZoom: false,
        attributionControl: false // Cleans up UI space
    });

    // Map pixel coordinates explicitly to Leaflet LatLng space
    const bounds = [[0, 0], [settings.imgHeight, settings.imgWidth]];
    L.imageOverlay(settings.imgUrl, bounds).addTo(map);
    
    // Maximizes visibility while keeping aspect ratio locked
    map.fitBounds(bounds, { padding: [0, 0] });

    // Forces aspect ratio maintenance during browser window resizing
    window.addEventListener('resize', () => {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [0, 0] });
    });

    // 2. Build master Feature Groups instead of plain objects
    layers = { 
        encountered: L.featureGroup(), 
        unencountered: L.featureGroup() 
    };
    
    subCategories = { encountered: {}, unencountered: {} };
    const groupedOverlays = { "Encountered": {}, "Unencountered": {} };

    Object.keys(mapConfiguration).forEach(key => {
        const item = mapConfiguration[key];
        
        subCategories.encountered[key] = L.layerGroup().addTo(layers.encountered);
        subCategories.unencountered[key] = L.layerGroup().addTo(layers.unencountered);
        
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
    layerControl = L.control.groupedLayers(null, groupedOverlays, {
        collapsed: true,
        groupCheckboxes: true
    }).addTo(map);

    // --- CLEAN HTML-BASED PASSWORD ENFORCER ---
    map.on('overlayadd', function(e) {
        const isUnencountered = Object.values(subCategories.unencountered).includes(e.layer);
        if (isUnencountered && !unencounteredUnlocked) {
            map.removeLayer(e.layer);
            layerControl._update();
        }
    });

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
    marker.on('click', function() { window.open(notionUrl, '_self'); });

    const state = encountered ? "encountered" : "unencountered";
    marker.addTo(subCategories[state][type]);
}
