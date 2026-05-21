// Global configuration matrix used to tint custom markers dynamically
const mapConfiguration = {
    // --- YOUR SPECIFIED MAP MATES ---
    mountain: { label: "Mountains", color: "#beada5", icon: "⛰️", size: 28, glow: "rgba(190,173,165,0.85)" },
    forest:   { label: "Forests",   color: "#bad39a", icon: "🌲", size: 24, glow: "rgba(186,211,154,0.85)" },
    swamp:    { label: "Swamps",    color: "#778653", icon: "🦟", size: 24, glow: "rgba(119,134,83,0.85)" },
    desert:   { label: "Deserts",   color: "#ffedb7", icon: "🌵", size: 24, glow: "rgba(255,237,183,0.85)" },
    body:     { label: "Bodies",    color: "#e5f2fa", icon: "🌊", size: 26, glow: "rgba(229,242,250,0.85)" },
    river:    { label: "Rivers",    color: "#9bcbf5", icon: "💧", size: 20, glow: "rgba(155,203,245,0.75)" }, 

    // --- NEW ADDITION ---
    room:     { label: "Rooms",     color: "#5e548e", icon: "🚪", size: 22, glow: "rgba(94,84,142,0.8)" },

    // --- DISTINCT PALETTE FOR UNASSIGNED MARKERS ---
    city:     { label: "Cities",    color: "#d81159", icon: "🏰", size: 26, glow: "rgba(216,17,89,0.8)" },    
    town:     { label: "Towns",     color: "#f26419", icon: "🏠", size: 22, glow: "rgba(242,100,25,0.8)" },   
    dungeon:  { label: "Dungeons",  color: "#000000", icon: "⚔️", size: 26, glow: "rgba(214,40,40,0.9)" },    
    ruin:     { label: "Ruins",     color: "#707d88", icon: "🪦", size: 24, glow: "rgba(112,125,136,0.7)" },  
    road:     { label: "Roads",     color: "#6f4e37", icon: "🛤️", size: 18, glow: "rgba(111,78,55,0.6)" },    
    region:   { label: "Regions",   color: "#0077b6", icon: "🗺️", size: 30, glow: "rgba(0,119,182,0.8)" },   
    feature:  { label: "Features",  color: "#4a5759", icon: "🪨", size: 24, glow: "rgba(74,87,89,0.7)" }     
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
        minZoom: -1,         
        maxZoom: 2,
        zoomSnap: 0.1,       
        zoomDelta: 0.5,
        doubleClickZoom: false,
        attributionControl: false 
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

    // 2. Setup master containers
    layers = { 
        encountered: L.featureGroup(), 
        unencountered: L.featureGroup() 
    };
    
    subCategories = { encountered: {}, unencountered: {} };
    const groupedOverlays = { "Encountered": {}, "Unencountered": {} };

    // 3. Scan settings.markers FIRST to see what actually exists
    if (settings.markers && Array.isArray(settings.markers)) {
        settings.markers.forEach(m => {
            const state = m.encountered ? "encountered" : "unencountered";
            const config = mapConfiguration[m.type];
            
            // Skip markers that don't match our configuration layout
            if (!config) return;

            // Dynamically instantiate the layer ONLY if it doesn't exist yet
            if (!subCategories[state][m.type]) {
                const parentGroup = layers[state];
                const cleanLabel = config.label;
                const groupName = m.encountered ? "Encountered" : "Unencountered";

                // Create the missing layer group and mount it to the master layer tree
                subCategories[state][m.type] = L.layerGroup().addTo(parentGroup);
                
                // Assign it a position inside the legend controller layout
                groupedOverlays[groupName][cleanLabel] = subCategories[state][m.type];
            }

            // Safe to pass variables over to marker generation routine now
            addMarker(subCategories, m.type, m.encountered, m.y, m.x, m.text, m.url);
        });
    }

    // 4. Turn on the entire Encountered Feature Group natively
    layers.encountered.addTo(map);

    // 5. Mount the controller overlay to layout (Legend will now be completely clean!)
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
