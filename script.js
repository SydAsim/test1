let notes = JSON.parse(localStorage.getItem('dashboard_notes')) || [];
let userProfile = JSON.parse(localStorage.getItem('dashboard_profile')) || { username: 'Guest', avatar: '' };

function init() {
    renderNotes();
    handleSearch();
}

<<<<<<< HEAD
// 1. Reflected XSS
=======
// ==========================================
// VULNERABILITY 1: Reflected XSS
// ==========================================
>>>>>>> a44394d079eb60d379d13ad66252e8f095a75028
function handleSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
<<<<<<< HEAD
        document.getElementById('searchResults').innerHTML = `Searching for: <strong>${query}</strong> <br>No results found.`;
=======
        const resultsDiv = document.getElementById('searchResults');
        const escapeHTML = (str) => str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
        resultsDiv.innerHTML = `Searching for: <strong>${escapeHTML(query)}</strong> <br>No results found.`;
>>>>>>> a44394d079eb60d379d13ad66252e8f095a75028
    }
}

// 2. Stored XSS
function renderNotes() {
    const container = document.getElementById('notesContainer');
    container.innerHTML = '';
<<<<<<< HEAD
    notes.forEach((note, index) => {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note';
        noteDiv.innerHTML = `
            <h4>${note.title}</h4>
            <div class="content">${note.content}</div>
=======
    
    const escapeHTML = (str) => String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag]));

    notes.forEach((note, index) => {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note';
        
        noteDiv.innerHTML = `
            <h4>${escapeHTML(note.title)}</h4>
            <div class="meta">By: ${escapeHTML(note.author)}</div>
            <div class="content">${escapeHTML(note.content)}</div>
>>>>>>> a44394d079eb60d379d13ad66252e8f095a75028
            <button class="delete-btn" onclick="deleteNote(${index})">Delete</button>
        `;
        container.appendChild(noteDiv);
    });
}

function addNote() {
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    if (title || content) {
        notes.push({ title: title || 'Untitled', content: content || 'No content' });
        localStorage.setItem('dashboard_notes', JSON.stringify(notes));
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        renderNotes();
    }
}

function deleteNote(index) {
    notes.splice(index, 1);
    localStorage.setItem('dashboard_notes', JSON.stringify(notes));
    renderNotes();
}

<<<<<<< HEAD
// 3. Broken Access Control
function loginAdmin() {
    if (document.getElementById('adminPassword').value === "supersecret2026") {
        document.getElementById('adminPanel').style.display = 'block';
        alert("Welcome Admin. Panel Unlocked.");
    } else {
        alert("Incorrect Admin Password!");
=======
// ==========================================
// VULNERABILITY 3: Broken Access Control (Client-Side Auth)
// ==========================================
// Admin check is fully visible in JS. Any user can view the source, 
// find the password, or just run the JS to reveal the panel!
async function loginAdmin() {
    const password = document.getElementById('adminPassword').value;
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        if (response.ok) {
            const adminPanelContent = await response.text();
            const adminPanel = document.getElementById('adminPanel');
            adminPanel.innerHTML = adminPanelContent;
            adminPanel.style.display = 'block';
            alert("Welcome Admin. Panel Unlocked.");
        } else {
            alert("Incorrect Admin Password!");
        }
    } catch (error) {
        alert("Error connecting to server.");
>>>>>>> a44394d079eb60d379d13ad66252e8f095a75028
    }
}

function clearAllData() {
    localStorage.clear();
    notes = [];
    renderNotes();
    alert("All system data wiped.");
}

// 4. eval() XSS
function calculate() {
    try {
<<<<<<< HEAD
        document.getElementById('mathResult').innerText = eval(document.getElementById('mathInput').value);
=======
        if (!/^[0-9+\-*/().\s]+$/.test(input)) {
            throw new Error('Invalid characters in math expression');
        }
        const result = Function('"use strict";return (' + input + ')')();
        document.getElementById('mathResult').innerText = result;
>>>>>>> a44394d079eb60d379d13ad66252e8f095a75028
    } catch (e) {
        document.getElementById('mathResult').innerText = 'Error';
    }
}

<<<<<<< HEAD
// 5. Open Redirect
function redirectToUrl() {
    window.location.href = document.getElementById('redirectUrl').value;
=======
// ==========================================
// VULNERABILITY 5: Open Redirect
// ==========================================
// Fixed: Validates that the parsed URL has the same origin as the current site to prevent external redirection.
function redirectToUrl() {
    const url = document.getElementById('redirectUrl').value;
    try {
        const parsedUrl = new URL(url, window.location.origin);
        if (parsedUrl.origin === window.location.origin) {
            window.location.href = parsedUrl.href;
        } else {
            alert("External redirects are not allowed.");
        }
    } catch (e) {
        alert("Invalid URL provided.");
    }
>>>>>>> a44394d079eb60d379d13ad66252e8f095a75028
}

// ==========================================
// VULNERABILITY 7: Prototype Pollution
// ==========================================
// Vulnerable merge function that copies properties without checking keys.
function merge(target, source) {
    for (let key in source) {
        if (typeof source[key] === 'object' && source[key] !== null) {
            if (!target[key]) target[key] = {};
            merge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

<<<<<<< HEAD
function importSettings() {
    const input = document.getElementById('jsonConfig').value;
    try {
        const parsed = JSON.parse(input);
        let currentSettings = {};
        
        // The danger: merging user JSON directly into an object.
        // If JSON is {"__proto__": {"isAdmin": true}}, it pollutes Object.prototype
        merge(currentSettings, parsed);
        
        // Let's test if the prototype was polluted:
        let emptyObjectTest = {}; 
        if (emptyObjectTest.isAdmin === true) {
            document.getElementById('adminPanel').style.display = 'block';
            alert("CRITICAL BREACH: Prototype Polluted! You bypassed authentication by making EVERY object an admin!");
        } else {
            alert("Settings imported safely. (Try polluting __proto__)");
        }
    } catch (e) {
        alert("Invalid JSON format!");
=======
function renderProfile() {
    const nameDisplay = document.getElementById('usernameDisplay');
    const imgDisplay = document.getElementById('avatarImg');
    
    nameDisplay.textContent = userProfile.username;
    if (userProfile.avatar) {
        try {
            const parsedUrl = new URL(userProfile.avatar, window.location.origin);
            if (['http:', 'https:', 'data:'].includes(parsedUrl.protocol)) {
                imgDisplay.setAttribute('src', userProfile.avatar);
            }
        } catch (e) {
            // Invalid URL
        }
>>>>>>> a44394d079eb60d379d13ad66252e8f095a75028
    }
}

// ==========================================
// VULNERABILITY 8: Arbitrary File Read -> XSS
// ==========================================
// Reads any file uploaded and injects the raw contents into the DOM.
function uploadBio() {
    const fileInput = document.getElementById('bioFile');
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // DANGER: Taking raw file contents and executing it as HTML!
            document.getElementById('bioPreview').innerHTML = e.target.result;
            alert(`File "${file.name}" loaded successfully.`);
        };
        
        reader.readAsText(file);
    } else {
        alert("Please select a file first.");
    }
}

// ==========================================
// VULNERABILITY 9: Client-Side Denial of Service (DoS)
// ==========================================
// Locks up the user's browser tab infinitely.
function crashBrowser() {
    if(confirm("DANGER: Are you sure? This will enter an infinite loop and crash your browser tab! You will have to force quit it.")) {
        alert("Goodbye...");
        // Infinite loop blocking the main UI thread.
        while (true) {
            history.pushState(0, 0, "?crashed=" + Math.random());
            console.log("Memory leak filling up...");
        }
    }
}

// ==========================================
// SIMULATOR: Data Exfiltration & Keylogger
// ==========================================
function runSimulatedMalware() {
    console.error("☠️ MALWARE ACTIVATED ☠️");
    
    // 1. Steal Data
    const stolenData = JSON.stringify(localStorage);
    console.error("STEALING DATA:", stolenData);
    
    // 2. Install Keylogger
    document.addEventListener('keydown', function(e) {
        console.error("KEYLOGGED: " + e.key);
    });
    
    alert("Malware Injected! Open Developer Tools (F12) -> Console, and start typing on your keyboard to see the keylogger in action, and see your stolen LocalStorage data.");
}

init();