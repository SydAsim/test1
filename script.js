let notes = JSON.parse(localStorage.getItem('dashboard_notes')) || [];
let userProfile = JSON.parse(localStorage.getItem('dashboard_profile')) || { username: 'Guest', avatar: '' };

function init() {
    renderNotes();
    handleSearch();
    renderProfile();
}

// ==========================================
// VULNERABILITY 1: Reflected XSS
// ==========================================
function handleSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
        const resultsDiv = document.getElementById('searchResults');
        const escapeHTML = (str) => String(str).replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
        resultsDiv.innerHTML = `Searching for: <strong>${escapeHTML(query)}</strong> <br>No results found.`;
    }
}

// 2. Stored XSS
function renderNotes() {
    const container = document.getElementById('notesContainer');
    container.textContent = ''; // Safely clear container

    notes.forEach((note, index) => {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note';
        
        const titleEl = document.createElement('h4');
        titleEl.textContent = note.title || 'Untitled';
        
        const contentEl = document.createElement('div');
        contentEl.className = 'content';
        contentEl.textContent = note.content || 'No content';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteNote(index);
        
        noteDiv.appendChild(titleEl);
        noteDiv.appendChild(contentEl);
        noteDiv.appendChild(deleteBtn);
        
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

// ==========================================
// VULNERABILITY 3: Broken Access Control (Client-Side Auth)
// ==========================================
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
        const input = document.getElementById('mathInput').value;
        if (!/^[0-9+\-*/().\s]+$/.test(input)) {
            throw new Error('Invalid characters in math expression');
        }
        
        // Safely parse and evaluate the math expression without eval() or Function()
        const tokens = input.match(/\d+\.\d+|\d+|[+\-*/()]/g) || [];
        const output = [];
        const ops = [];
        const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };

        for (const token of tokens) {
            if (/\d/.test(token)) {
                output.push(parseFloat(token));
            } else if (token === '(') {
                ops.push(token);
            } else if (token === ')') {
                while (ops.length && ops[ops.length - 1] !== '(') {
                    output.push(ops.pop());
                }
                ops.pop();
            } else {
                while (ops.length && precedence[ops[ops.length - 1]] >= precedence[token]) {
                    output.push(ops.pop());
                }
                ops.push(token);
            }
        }
        while (ops.length) output.push(ops.pop());

        const stack = [];
        for (const token of output) {
            if (typeof token === 'number') {
                stack.push(token);
            } else {
                const b = stack.pop();
                const a = stack.pop() || 0;
                if (token === '+') stack.push(a + b);
                if (token === '-') stack.push(a - b);
                if (token === '*') stack.push(a * b);
                if (token === '/') stack.push(a / b);
            }
        }

        const result = stack.length ? stack[0] : '';
        document.getElementById('mathResult').innerText = result;
    } catch (e) {
        document.getElementById('mathResult').innerText = 'Error';
    }
}

// ==========================================
// VULNERABILITY 5: Open Redirect
// ==========================================
function redirectToUrl() {
    const url = document.getElementById('redirectUrl').value;
    try {
        const parsedUrl = new URL(url, window.location.origin);
        
        // Ensure safe protocols (prevents javascript:, data:, etc.)
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            alert("Invalid protocol.");
            return;
        }

        // Validate origin to prevent external redirects and 'null' origin bypasses
        if (window.location.origin !== 'null' && parsedUrl.origin === window.location.origin) {
            window.location.href = parsedUrl.href;
        } else {
            alert("External redirects are not allowed.");
        }
    } catch (e) {
        alert("Invalid URL provided.");
    }
}

// ==========================================
// VULNERABILITY 7: Prototype Pollution
// ==========================================
function merge(target, source) {
    if (typeof target !== 'object' || target === null) return target;
    if (typeof source !== 'object' || source === null) return target;

    for (let key in source) {
        if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
        
        if (typeof source[key] === 'object' && source[key] !== null) {
            if (typeof target[key] !== 'object' || target[key] === null) {
                target[key] = Array.isArray(source[key]) ? [] : {};
            }
            merge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

function importSettings() {
    const input = document.getElementById('jsonConfig').value;
    try {
        const parsed = JSON.parse(input);
        let currentSettings = {};
        
        merge(currentSettings, parsed);
        
        let emptyObjectTest = {}; 
        if (emptyObjectTest.isAdmin === true) {
            document.getElementById('adminPanel').style.display = 'block';
            alert("CRITICAL BREACH: Prototype Polluted! You bypassed authentication by making EVERY object an admin!");
        } else {
            alert("Settings imported safely. (Try polluting __proto__)");
        }
    } catch (e) {
        alert("Invalid JSON format!");
    }
}

function renderProfile() {
    const nameDisplay = document.getElementById('usernameDisplay');
    const imgDisplay = document.getElementById('avatarImg');
    
    if (nameDisplay) {
        nameDisplay.textContent = userProfile.username;
    }
    
    if (userProfile.avatar && imgDisplay) {
        try {
            const parsedUrl = new URL(userProfile.avatar, window.location.origin);
            if (['http:', 'https:', 'data:'].includes(parsedUrl.protocol)) {
                imgDisplay.setAttribute('src', userProfile.avatar);
            }
        } catch (e) {
            // Invalid URL
        }
    }
}

// ==========================================
// VULNERABILITY 8: Arbitrary File Read -> XSS
// ==========================================
function uploadBio() {
    const fileInput = document.getElementById('bioFile');
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Use textContent to safely display raw text instead of innerHTML
            document.getElementById('bioPreview').textContent = e.target.result;
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
function crashBrowser() {
    console.warn("Client crash prevented: history stack manipulation loop has been removed.");
}

// ==========================================
// SIMULATOR: Data Exfiltration & Keylogger
// ==========================================
function runSimulatedMalware() {
    console.error("Malware simulation disabled.");
    alert("Malware simulation safely disabled.");
}

init();