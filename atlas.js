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

    // 2. Build tracking arrays dynamically
    layers = { encountered: {}, unencountered: {} };
    const groupedOverlays = { "Encountered": {}, "Unencountered": {} };

    Object.keys(mapConfiguration).forEach(key => {
        const item = mapConfiguration[key];
        layers.encountered[key] = L.layerGroup();
        layers.unencountered[key] = L.layerGroup();
        groupedOverlays["Encountered"][item.label] = layers.encountered[key];
        groupedOverlays["Unencountered"][item.label] = layers.unencountered[key];
    });

    // 3. Batch inject configured markers array
    if (settings.markers && Array.isArray(settings.markers)) {
        settings.markers.forEach(m => {
            addMarker(m.type, m.encountered, m.y, m.x, m.text, m.url);
        });
    }

    // --- ENCOUNTERED DEFAULT SHOWCASE SETUP ---
    // Make sure all populated encountered folder groups display immediately on page render
    // Object.keys(layers.encountered).forEach(key => {
    //     layers.encountered[key].addTo(map);
    // });

    // 4. Mount the controller overlay to layout
    // Changed collapsed to true so it starts as a clean icon button
    L.control.groupedLayers(null, groupedOverlays, {
        collapsed: true,         // Panel starts closed as a clean hover/click icon
        groupCheckboxes: true
    }).addTo(map);

    Object.values(layers.encountered).forEach(layer => layer.addTo(map));
    layerControl._update();

    // 5. Connect basic structural click handlers for Coordinate HUD
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
function addMarker(type, encountered, y, x, popupText, notionUrl) {
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

    // 1. Bind the popup with a dark-mode friendly setup, ensuring it doesn't fight our hover logic
    marker.bindPopup(`
        <div style="font-family: sans-serif; text-align: center;">
            <h3>${popupText}</h3>
        </div>
    `, {
        closeButton: false, // Removes the 'x' button for a cleaner aesthetic
        autoClose: true     // Automatically shuts if another map element takes focus
    });

    // HOVER FUNCTIONALITY: Bind hover triggers instead of using standard click behaviors
    marker.on('mouseover', function (e) {
        this.openPopup();
    });
    marker.on('mouseout', function (e) {
        this.closePopup();
    });
    marker.on('click', function() {
        window.open(notionUrl, '_blank');
    });

    const state = encountered ? "encountered" : "unencountered";
    marker.addTo(layers[state][type]);
}
