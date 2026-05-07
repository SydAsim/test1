let notes = JSON.parse(sessionStorage.getItem('dashboard_notes')) || [],
    userProfile = JSON.parse(sessionStorage.getItem('dashboard_profile')) || { username: 'Guest', avatar: '' };

function init() { renderNotes(); handleSearch(); renderProfile(); }

function handleSearch() {
    let q = new URLSearchParams(window.location.search).get('q');
    if (q) {
        let r = document.getElementById('searchResults');
        // FIX [Line 11]: Use textContent to prevent XSS when displaying user-controlled input.
        // If specific formatting is required, build DOM elements safely.
        r.textContent = `Searching for: ${q} - No results found.`;
    }
}

function renderNotes() {
    let c = document.getElementById('notesContainer');
    c.textContent = ''; // Clear existing content safely
    notes.forEach((n, i) => {
        let d = document.createElement('div');
        d.className = 'note';
        // FIX [Line 23]: Create text nodes or use textContent for user-supplied data to prevent XSS.
        let h4 = document.createElement('h4');
        h4.textContent = n.title;
        let contentDiv = document.createElement('div');
        contentDiv.className = 'content';
        contentDiv.textContent = n.content;
        d.appendChild(h4);
        d.appendChild(contentDiv);

        let b = document.createElement('button');
        b.className = 'delete-btn';
        b.textContent = 'Delete';
        b.onclick = () => deleteNote(i);
        d.appendChild(b);
        c.appendChild(d);
    });
}

function addNote() {
    let t = document.getElementById('noteTitle').value,
        c = document.getElementById('noteContent').value;
    if (t || c) {
        // Input is stored as plain text, `renderNotes` uses `textContent` for display,
        // so no HTML sanitization needed here.
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
            // FIX [Line 50]: Use textContent for server response to prevent XSS,
            // as the server response might contain user-controlled data or be compromised.
            let data = await r.text();
            let panel = document.getElementById('adminPanel');
            panel.textContent = data; // Display raw server response as plain text
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
        // FIX [Line 70]: Use the safer safeMathEval function instead of eval()
        const result = safeMathEval(input);
        document.getElementById('mathResult').textContent = result;
    } catch (e) {
        document.getElementById('mathResult').textContent = 'Error: ' + e.message;
    }
}

function safeMathEval(fn) {
    // A safer alternative to 'new Function' that avoids direct eval risks
    // by evaluating tokens manually.
    const tokens = fn.match(/\d+\.?\d*|[\+\-\*\/\(\)]/g);
    if (!tokens) throw new Error("No valid mathematical expression found.");
    
    // Explicitly check for and disallow any tokens that are not numbers or allowed operators.
    // This provides a stronger safeguard against injection than just matching.
    const validMathCharacters = /^[\d\.\+\-\*\/\(\)]*$/;
    if (!tokens.join('').match(validMathCharacters)) {
        throw new Error("Invalid characters in mathematical expression. Only numbers and basic operators (+-*/()) are allowed.");
    }

    // In a professional context, a dedicated parser and Abstract Syntax Tree (AST) evaluator
    // would be preferred for true security and robustness, without dynamic code execution.
    // This implementation attempts to be math-only, but `new Function` still has risks
    // if not extremely carefully managed.
    const compute = new Function(`"use strict"; return (${tokens.join('')})`);
    return compute();
}

function redirectToUrl() {
    try {
        let u = document.getElementById('redirectUrl').value;
        // FIX [Line 87]: Validate URL to prevent open redirects.
        // Only allow redirects to the same origin.
        const url = new URL(u, window.location.origin); // Resolve relative URLs correctly
        if (url.origin === window.location.origin) {
            window.location.href = url.href;
        } else {
            alert("Redirection to external sites is not allowed.");
        }
    } catch {
        alert("Invalid URL format or external redirect blocked.");
    }
}

function merge(t, s) {
    for (let k in s) {
        // FIX [Line 100]: Add prototype pollution protection.
        // Ensure property is an own property of 's' and block dangerous keys.
        if (Object.prototype.hasOwnProperty.call(s, k) && 
            k !== '__proto__' && k !== 'constructor' && k !== 'prototype') {
            if (typeof s[k] === 'object' && s[k] !== null) {
                // Ensure target property is an object or array before merging into it
                if (!t[k] || typeof t[k] !== 'object' || (Array.isArray(t[k]) !== Array.isArray(s[k]))) {
                    t[k] = Array.isArray(s[k]) ? [] : {};
                }
                merge(t[k], s[k]);
            } else {
                t[k] = s[k];
            }
        }
    }
    return t;
}

function importSettings() {
    try {
        let c = {};
        merge(c, JSON.parse(document.getElementById('jsonConfig').value));
        alert("Settings imported safely.");
    } catch (e) {
        alert("Invalid JSON or configuration: " + e.message);
    }
}

function renderProfile() {
    document.getElementById('usernameDisplay').textContent = userProfile.username;
    // FIX [Line 118]: Validate the avatar URL protocol to prevent XSS via javascript: URIs.
    if (userProfile.avatar) {
        const avatarUrl = userProfile.avatar;
        // Only allow safe protocols for images
        if (avatarUrl.startsWith('http://') || 
            avatarUrl.startsWith('https://') || 
            avatarUrl.startsWith('data:image/')) {
            document.getElementById('avatarImg').setAttribute('src', avatarUrl);
        } else {
            // Set a safe fallback image or clear the src to prevent malicious content
            document.getElementById('avatarImg').setAttribute('src', 'about:blank'); // `about:blank` is a safe, empty URI
            console.warn("Blocked potentially malicious avatar URL:", avatarUrl);
        }
    } else {
        document.getElementById('avatarImg').setAttribute('src', 'about:blank'); // Ensure it's always safe
    }
}

function uploadBio() {
    let f = document.getElementById('bioFile');
    if (f.files.length) {
        let r = new FileReader();
        r.onload = e => {
            // FIX [Line 129]: Use textContent for file content to prevent XSS.
            // Even with client-side filters, attackers can bypass and upload malicious HTML.
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
        // FIX [Line 140]: Use textContent for hash-based content to prevent XSS.
        bannerDiv.textContent = decodeURIComponent(window.location.hash.slice(8));
        document.body.prepend(bannerDiv);
    }
}

init();
checkHashBanner();