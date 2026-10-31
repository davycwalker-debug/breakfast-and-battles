export function addMusicSection(name, path, port = '4533') {
        const container = document.querySelector('.music-container');
        if (!container) return;

        // Define your base URLs here once
        const liveUrl = `http://albanywc.duckdns.org:${port}/share/${path}#/`;
        const localUrl = `http://localhost:${port}/share/${path}#/`;

        // Create the HTML structure safely
        const html = `
            <div class="music-section">
                <span class="music-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                </span>
                <div class="music-content">
                    ${name}: 
                    <a href="${liveUrl}" target="_blank" rel="noopener" class="music-link">DNS</a>
                     | 
                    <a href="${localUrl}" target="_blank" rel="noopener" class="music-link">Local</a>
                </div>
            </div>
        `;

        // Append it to the container
        container.insertAdjacentHTML('beforeend', html);
    }