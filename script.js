// Data state persisting in LocalStorage
let notes = JSON.parse(localStorage.getItem('dashboard_notes')) || [];
let userProfile = JSON.parse(localStorage.getItem('dashboard_profile')) || { username: 'Guest', avatar: '' };

// Initialize App
function init() {
    renderNotes();
    renderProfile();
    handleSearch();
}

// ==========================================
// VULNERABILITY 1: Reflected XSS
// ==========================================
function handleSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
        const resultsDiv = document.getElementById('searchResults');
        const escapeHTML = (str) => str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
        resultsDiv.innerHTML = `Searching for: <strong>${escapeHTML(query)}</strong> <br>No results found.`;
    }
}

// ==========================================
// VULNERABILITY 2: Stored XSS
// ==========================================
// User input is saved in localStorage and injected using innerHTML.
function renderNotes() {
    const container = document.getElementById('notesContainer');
    container.innerHTML = '';
    
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
            <button class="delete-btn" onclick="deleteNote(${index})">Delete</button>
        `;
        container.appendChild(noteDiv);
    });
}

function addNote() {
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    
    if (title || content) {
        notes.push({
            title: title || 'Untitled',
            content: content || 'No content',
            author: userProfile.username
        });
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
    }
}

function clearAllData() {
    localStorage.clear();
    notes = [];
    userProfile = { username: 'Guest', avatar: '' };
    renderNotes();
    renderProfile();
    alert("All system data has been wiped.");
}

// ==========================================
// VULNERABILITY 4: Insecure eval() Usage (DOM XSS)
// ==========================================
// Uses eval() to calculate math, allowing arbitrary JS execution.
// Try input: alert('Math is dangerous!')
function calculate() {
    const input = document.getElementById('mathInput').value;
    try {
        if (!/^[0-9+\-*/().\s]+$/.test(input)) {
            throw new Error('Invalid characters in math expression');
        }
        const result = Function('"use strict";return (' + input + ')')();
        document.getElementById('mathResult').innerText = result;
    } catch (e) {
        document.getElementById('mathResult').innerText = 'Error in Calculation';
    }
}

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
}

// ==========================================
// VULNERABILITY 6: Stored XSS via Profile Updates
// ==========================================
function updateProfile() {
    const username = document.getElementById('usernameInput').value;
    const avatar = document.getElementById('avatarInput').value;
    
    if (username) userProfile.username = username;
    if (avatar) userProfile.avatar = avatar;
    
    localStorage.setItem('dashboard_profile', JSON.stringify(userProfile));
    renderProfile();
}

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
    }
}

// Boot up
init();