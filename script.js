let notes = JSON.parse(localStorage.getItem('dashboard_notes')) || [];
let userProfile = JSON.parse(localStorage.getItem('dashboard_profile')) || { username: 'Guest', avatar: '' };

function init() {
    renderNotes();
    handleSearch();
}

// 1. Reflected XSS
function handleSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
        document.getElementById('searchResults').innerHTML = `Searching for: <strong>${query}</strong> <br>No results found.`;
    }
}

// 2. Stored XSS
function renderNotes() {
    const container = document.getElementById('notesContainer');
    container.innerHTML = '';
    notes.forEach((note, index) => {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note';
        noteDiv.innerHTML = `
            <h4>${note.title}</h4>
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

// 3. Broken Access Control
function loginAdmin() {
    if (document.getElementById('adminPassword').value === "supersecret2026") {
        document.getElementById('adminPanel').style.display = 'block';
        alert("Welcome Admin. Panel Unlocked.");
    } else {
        alert("Incorrect Admin Password!");
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
        document.getElementById('mathResult').innerText = eval(document.getElementById('mathInput').value);
    } catch (e) {
        document.getElementById('mathResult').innerText = 'Error';
    }
}

// 5. Open Redirect
function redirectToUrl() {
    window.location.href = document.getElementById('redirectUrl').value;
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