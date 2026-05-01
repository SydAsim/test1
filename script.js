const STORAGE_KEY = 'dashboard_secure_pref_';
function encryptData(data) {
    if (!data) return null;
    const str = JSON.stringify(data);
    return btoa(encodeURIComponent(str));
}
function decryptData(data) {
    if (!data) return null;
    try {
        return JSON.parse(decodeURIComponent(atob(data)));
    } catch { return null; }
}

let notes = decryptData(sessionStorage.getItem('dashboard_notes')) || [],
    userProfile = decryptData(sessionStorage.getItem('dashboard_profile')) || { username: 'Guest', avatar: '' };

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
            sessionStorage.setItem('dashboard_notes', encryptData(notes));
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
    sessionStorage.setItem('dashboard_notes', encryptData(notes));
    renderNotes();
}

let isAdminLoginLocked = false;
async function loginAdmin() {
    if (isAdminLoginLocked) {
        alert("Too many attempts. Please wait a moment.");
        return;
    }

    const passwordInput = document.getElementById('adminPassword').value;
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    
    isAdminLoginLocked = true;
    setTimeout(() => { isAdminLoginLocked = false; }, 3000);

    try {
        let r = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-Token': csrfToken
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
        if (!/^[0-9+\-*/().\s]+$/.test(input)) throw new Error("Invalid Input");
        
        const result = safeMathEval(input);
        document.getElementById('mathResult').textContent = isFinite(result) ? result : 'Error';
    } catch {
        document.getElementById('mathResult').textContent = 'Error';
    }
}

function safeMathEval(fn) {
    const tokens = fn.match(/\d+\.?\d*|[\+\-\*\/\(\)]/g);
    if (!tokens) return 0;

    const ops = {
        '+': (a, b) => a + b, '-': (a, b) => a - b,
        '*': (a, b) => a * b, '/': (a, b) => a / b
    };
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
    const stack = [];
    const out = [];

    tokens.forEach(t => {
        if (!isNaN(t)) out.push(parseFloat(t));
        else if (t === '(') stack.push(t);
        else if (t === ')') {
            while (stack.length && stack[stack.length - 1] !== '(') out.push(stack.pop());
            stack.pop();
        } else {
            while (stack.length && precedence[stack[stack.length - 1]] >= precedence[t]) out.push(stack.pop());
            stack.push(t);
        }
    });
    while (stack.length) out.push(stack.pop());

    const result = [];
    out.forEach(t => {
        if (typeof t === 'number') result.push(t);
        else {
            const b = result.pop(), a = result.pop();
            if (a === undefined || b === undefined) return;
            result.push(ops[t](a, b));
        }
    });
    return result[0] || 0;
}

function redirectToUrl() {
    try {
        let u = new URL(document.getElementById('redirectUrl').value, window.location.origin);
        if (u.origin === window.location.origin) window.location.href = u.href;
        else alert("External redirects blocked.");
    } catch {
        alert("Invalid URL.");
    }
}

function merge(t, s) {
    for (let k in s) {
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
        if (typeof s[k] === 'object' && s[k] !== null) {
            if (!t[k]) t[k] = {};
            merge(t[k], s[k]);
        } else t[k] = s[k];
    }
    return t;
}

function importSettings() {
    try {
        let c = {};
        merge(c, JSON.parse(document.getElementById('jsonConfig').value));
        alert("Settings imported safely.");
    } catch {
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
        let bannerDiv = document.createElement('div');
        bannerDiv.style = "background: yellow; padding: 10px; text-align: center; border-bottom: 2px solid red;";
        bannerDiv.textContent = decodeURIComponent(window.location.hash.slice(8));
        document.body.prepend(bannerDiv);
    }
}

init();
checkHashBanner();