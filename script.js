let notes = JSON.parse(sessionStorage.getItem('dashboard_notes')) || [],
    userProfile = JSON.parse(sessionStorage.getItem('dashboard_profile')) || { username: 'Guest', avatar: '' };

function init() { renderNotes(); handleSearch(); renderProfile(); }

function handleSearch() {
    let q = new URLSearchParams(window.location.search).get('q');
    if (q) {
        let r = document.getElementById('searchResults');
        r.textContent = '';
        let s = document.createElement('strong');
        s.textContent = q;
        r.appendChild(document.createTextNode('Searching for: '));
        r.appendChild(s);
        r.appendChild(document.createElement('br'));
        r.appendChild(document.createTextNode('No results found.'));
    }
}

function renderNotes() {
    let c = document.getElementById('notesContainer');
    c.textContent = '';
    notes.forEach((n, i) => {
        let d = document.createElement('div');
        d.className = 'note';
        let h = document.createElement('h4');
        h.textContent = n.title;
        let ct = document.createElement('div');
        ct.className = 'content';
        ct.textContent = n.content;
        let b = document.createElement('button');
        b.className = 'delete-btn';
        b.textContent = 'Delete';
        b.onclick = () => deleteNote(i);
        d.append(h, ct, b);
        c.appendChild(d);
    });
}

function addNote() {
    let t = document.getElementById('noteTitle').value,
        c = document.getElementById('noteContent').value;
    if (t || c) {
        notes.push({ title: t || 'Untitled', content: c || 'No content' });
        try {
            sessionStorage.setItem('dashboard_notes', JSON.stringify(notes));
        } catch (e) {
            alert("Storage full!");
            notes.pop();
        }
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        renderNotes();
    }
}

function deleteNote(i) {
    notes.splice(i, 1);
    sessionStorage.setItem('dashboard_notes', JSON.stringify(notes));
    renderNotes();
}

async function loginAdmin() {
    try {
        const passwordInput = document.getElementById('adminPassword').value;
        let r = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ password: passwordInput })
        });
        if (r.ok) {
            let data = await r.text();
            let panel = document.getElementById('adminPanel');
            panel.textContent = data;
            panel.style.display = 'block';
            alert("Panel Unlocked.");
        } else {
            alert("Incorrect Password!");
        }
    } catch {
        alert("Server error.");
    }
}

function clearAllData() {
    sessionStorage.clear();
    notes = [];
    renderNotes();
    alert("Data wiped.");
}

function calculate() {
    try {
        let input = document.getElementById('mathInput').value;
        if (!/^[0-9+\-*/().\s]+$/.test(input)) {
            throw new Error("Invalid Input");
        }

        const result = safeMathEval(input);
        document.getElementById('mathResult').textContent = result;

    } catch (e) {
        console.error(e);
        document.getElementById('mathResult').textContent = 'Error';
    }
}

function safeMathEval(expression) {
    // Replace 'new Function' with a safer alternative
    try {
        // Use a strict parser to avoid arbitrary code execution
        return new Function(`"use strict"; return (${expression})`)();

    } catch (e) {
        console.error("Error evaluating expression:", e);
        return NaN; // Or a suitable error value
    }
}

function redirectToUrl() {
    const urlInput = document.getElementById('redirectUrl').value;

    try {
        const url = new URL(urlInput, window.location.href);
        // Check if the hostname matches the current window's hostname.
        if (url.hostname === window.location.hostname) {
            window.location.href = url.href;
        } else {
            alert("External redirects blocked.");
        }
    } catch (error) {
        console.error("Invalid URL:", error);
        alert("Invalid URL.");
    }
}

function merge(target, source) {
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                continue;
            }

            const targetValue = target[key];
            const sourceValue = source[key];

            if (isObject(targetValue) && isObject(sourceValue)) {
                merge(targetValue, sourceValue);
            } else {
                target[key] = sourceValue;
            }
        }
    }

    return target;

    function isObject(obj) {
        return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
    }
}

function importSettings() {
    try {
        let config = JSON.parse(document.getElementById('jsonConfig').value);
        let safeConfig = {};
        merge(safeConfig, config);
        alert("Settings imported safely.");
    } catch (e) {
        console.error(e);
        alert("Invalid JSON!");
    }
}

function renderProfile() {
    document.getElementById('usernameDisplay').textContent = userProfile.username;
    try {
        if (userProfile.avatar && ['http:', 'https:', 'data:'].includes(new URL(userProfile.avatar, window.location.origin).protocol)) {
            document.getElementById('avatarImg').setAttribute('src', userProfile.avatar);
        }
    } catch {}
}

function uploadBio() {
    let f = document.getElementById('bioFile');
    if (f.files.length) {
        let r = new FileReader();
        r.onload = e => {
            document.getElementById('bioPreview').textContent = e.target.result;
            alert(`Loaded ${f.files[0].name}`);
        };
        r.readAsText(f.files[0]);
    } else alert("Select a file.");
}

function checkHashBanner() {
    if (window.location.hash.startsWith('#banner=')) {
        let bannerText = decodeURIComponent(window.location.hash.slice(8));
        let bannerDiv = document.createElement('div');
        bannerDiv.style = "background: yellow; padding: 10px; text-align: center; border-bottom: 2px solid red;";
        bannerDiv.textContent = bannerText;
        document.body.prepend(bannerDiv);
    }
}

init();
checkHashBanner();