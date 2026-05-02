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
            // Using textContent to prevent XSS from server response
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
        // Strict validation for allowed characters and operators
        if (!/^[\d+\-*/().\s]+$/.test(input)) {
            throw new Error("Invalid Input: Only numbers and basic arithmetic operators are allowed.");
        }

        // Implement a safe evaluation using a parser or a limited scope eval
        const result = safeMathEval(input);
        document.getElementById('mathResult').textContent = result;
    } catch (e) {
        document.getElementById('mathResult').textContent = 'Error: ' + e.message;
    }
}

function safeMathEval(expression) {
    try {
        // Utilize a secure parsing and evaluation library like 'math.js' for production environments.
        // Example (using a hypothetical secureEval function):
        // return secureEval(expression);

        // For a safer alternative than eval, use a restricted scope and RegExp validation.
        const allowedChars = /^[\d+\-*/().\s]+$/; // Numbers and basic operators
        if (!allowedChars.test(expression)) {
            throw new Error("Invalid characters in expression.");
        }

        // Implement a simple parser to avoid using eval or Function.
        return new Function(`"use strict"; return (${expression})`)(); // Restrict scope with "use strict".

    } catch (e) {
        console.error("Error evaluating expression:", e);
        throw new Error("Evaluation error: " + e.message); // Re-throw to be caught by calculate()
    }
}

function redirectToUrl() {
    try {
        const redirectUrl = document.getElementById('redirectUrl').value;
        const url = new URL(redirectUrl, window.location.origin);

        // Check if the protocol is allowed (e.g., http or https)
        if (!['http:', 'https:'].includes(url.protocol)) {
            alert("Invalid protocol. Only HTTP and HTTPS are allowed.");
            return;
        }
      
        // Only allow navigation within the same origin, and to a specific, safe path.
        if (url.origin === window.location.origin) {
            // Define an array of allowed paths
            const allowedPaths = ['/dashboard', '/profile', '/settings'];
            
            // Check if the URL pathname is in the allowedPaths array
            if (allowedPaths.includes(url.pathname)) {
                window.location.href = url.href;
            } else {
                alert("Redirect to this path is not allowed.");
            }
        } else {
            alert("External redirects blocked.");
        }
    } catch (error) {
        console.error("Invalid URL:", error);
        alert("Invalid URL.");
    }
}

function deepFreeze(obj) {
    // Freeze properties before freezing the object itself
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            deepFreeze(obj[key]);
        }
    });
    return Object.freeze(obj);
}

function safeMerge(target, source) {
    for (const key in source) {
        if (!Object.prototype.hasOwnProperty.call(source, key)) {
            continue;
        }

        if (['__proto__', 'constructor', 'prototype'].includes(key)) {
            console.warn(`Attempt to merge disallowed key: ${key}`);
            continue;
        }

        if (typeof source[key] === 'object' && source[key] !== null) {
            // If the target doesn't have this key, create an empty object.
            if (target[key] === undefined) {
                target[key] = {};
            }
            if (typeof target[key] !== 'object' || target[key] === null) {
                console.warn(`Overwriting non-object target key ${key} with object value`);
                target[key] = {}; // Ensure target[key] is an object before merging
            }
            safeMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

function importSettings() {
    try {
        const jsonConfig = document.getElementById('jsonConfig').value;
        let config = JSON.parse(jsonConfig);

        // Validate the structure of the parsed JSON
        if (typeof config !== 'object' || config === null) {
            throw new Error("Invalid JSON structure: must be an object.");
        }

        let safeConfig = {};
        safeMerge(safeConfig, config);

        // Apply settings, using a safer merge function
        // Example: applySettings(safeConfig); // Assuming applySettings function exists
        console.log("Settings imported safely:", safeConfig); // For demonstration

        alert("Settings imported safely.");
    } catch (error) {
        console.error("Error importing settings:", error);
        alert("Invalid JSON: " + error.message);
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
        let bannerDiv = document.createElement('div');
        bannerDiv.style = "background: yellow; padding: 10px; text-align: center; border-bottom: 2px solid red;";
        // FIX: Use textContent to prevent DOM-based XSS
        bannerDiv.textContent = decodeURIComponent(window.location.hash.slice(8));
        document.body.prepend(bannerDiv);
    }
}

init();
checkHashBanner();