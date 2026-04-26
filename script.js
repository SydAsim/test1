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
// Reads data directly from the URL and injects it into HTML.
// Try URL: index.html?q=<img src=x onerror=alert('Reflected_XSS')>
function handleSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
        const resultsDiv = document.getElementById('searchResults');
        // Setting HTML directly from a URL parameter
        resultsDiv.innerHTML = `Searching for: <strong>${query}</strong> <br>No results found.`;
    }
}

// ==========================================
// VULNERABILITY 2: Stored XSS
// ==========================================
// User input is saved in localStorage and injected using innerHTML.
function renderNotes() {
    const container = document.getElementById('notesContainer');
    container.innerHTML = '';
    
    notes.forEach((note, index) => {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note';
        
        // Unsafe rendering: User input is embedded directly as HTML
        noteDiv.innerHTML = `
            <h4>${note.title}</h4>
            <div class="meta">By: ${note.author}</div>
            <div class="content">${note.content}</div>
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
function loginAdmin() {
    const password = document.getElementById('adminPassword').value;
    // Hardcoded secret in client-side code
    if (password === "supersecret2026") {
        document.getElementById('adminPanel').style.display = 'block';
        alert("Welcome Admin. Panel Unlocked.");
    } else {
        alert("Incorrect Admin Password!");
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
        // eval() executes whatever string is passed to it as actual JavaScript code.
        const result = eval(input);
        document.getElementById('mathResult').innerText = result;
    } catch (e) {
        document.getElementById('mathResult').innerText = 'Error in Calculation';
    }
}

// ==========================================
// VULNERABILITY 5: Open Redirect
// ==========================================
// Allows an attacker to craft a link that redirects users to malicious sites.
function redirectToUrl() {
    const url = document.getElementById('redirectUrl').value;
    // No validation on the URL destination
    window.location.href = url;
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
    
    // Unsafe rendering:
    nameDisplay.innerHTML = userProfile.username;
    if (userProfile.avatar) {
        // Unsafe attribute rendering, allows javascript: URIs
        imgDisplay.setAttribute('src', userProfile.avatar);
    }
}

// Boot up
init();