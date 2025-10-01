// Dieses Skript lädt alle HTML‑Dateien im Verzeichnis `posts/` und fügt
// sie in den Bereich „Neuigkeiten & Beiträge“ ein. Es unterstützt das
// lokale Testen (über die Dateisystemansicht) und das Hosting über
// GitHub Pages. Bei Letzterem wird die GitHub‑API verwendet, um die
// Verzeichnisinhalte abzufragen.

async function loadPosts() {
    const postsContainer = document.getElementById('posts');
    if (!postsContainer) return;

    // Hilfsfunktion zum Einfügen eines Post‑HTML in den DOM
    const insertPost = (html) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'post';
        wrapper.innerHTML = html;
        postsContainer.appendChild(wrapper);
    };

    // Prüfen, ob wir auf GitHub Pages laufen. In diesem Fall beginnt
    // der Hostname mit „USERNAME.github.io“.
    const isGitHubPages = window.location.hostname.endsWith('github.io');
    if (isGitHubPages) {
        // Bei GitHub Pages extrahieren wir den Benutzer (Owner) und das Repo
        // aus der URL. Beispiel: https://username.github.io/repo/
        const hostParts = window.location.hostname.split('.');
        const owner = hostParts[0];
        // Der erste Teil des Pfads ist der Name des Repos
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const repo = pathParts[0];
        if (!owner || !repo) return;

        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/posts`;
        try {
            const res = await fetch(apiUrl);
            if (!res.ok) throw new Error('Fehler beim Laden der Beitragsliste');
            const files = await res.json();
            const htmlFiles = files.filter((file) => file.name.endsWith('.html'));
            // Sortiere nach Dateiname, sodass neuere Beiträge weiter unten stehen können
            htmlFiles.sort((a, b) => a.name.localeCompare(b.name));
            for (const file of htmlFiles) {
                try {
                    const postRes = await fetch(file.download_url);
                    if (!postRes.ok) continue;
                    const html = await postRes.text();
                    insertPost(html);
                } catch (e) {
                    console.error('Fehler beim Laden eines Beitrags:', e);
                }
            }
        } catch (e) {
            console.error('Fehler beim Zugriff auf GitHub API:', e);
        }
    } else {
        // Lokaler Fallback: versuche, den Inhalt des Verzeichnisses zu lesen
        try {
            const res = await fetch('posts/');
            const text = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const links = Array.from(doc.querySelectorAll('a'))
                .filter((a) => a.getAttribute('href') && a.getAttribute('href').endsWith('.html'));
            for (const link of links) {
                const url = 'posts/' + link.getAttribute('href');
                try {
                    const postRes = await fetch(url);
                    if (!postRes.ok) continue;
                    const html = await postRes.text();
                    insertPost(html);
                } catch (e) {
                    console.error('Fehler beim Laden eines Beitrags im lokalen Modus:', e);
                }
            }
        } catch (e) {
            console.error('Lokaler Fallback schlug fehl:', e);
        }
    }
}

// Starte das Laden der Beiträge, sobald das DOM bereit ist
document.addEventListener('DOMContentLoaded', loadPosts);