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
        // All validation for allowed characters and expression structure is now
        // handled internally by safeMathEval, which uses a dedicated parser.
        const result = safeMathEval(input);
        document.getElementById('mathResult').textContent = result;
    } catch (e) {
        document.getElementById('mathResult').textContent = e.message || 'Error';
    }
}

function safeMathEval(expression) {
    // Replacement for Function/eval: Uses a safe arithmetic parser based on the
    // Shunting-Yard algorithm (RPN conversion) and RPN evaluation.
    // This approach avoids dynamic JavaScript execution and is resistant to injection.
    // For production, an industry-standard library like math.js is recommended.

    // Strict validation for allowed characters (numbers, operators, parentheses, whitespace)
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
        throw new Error("Invalid characters in expression.");
    }

    // Tokenize the expression
    const tokens = expression.match(/\d+\.?\d*|[\+\-\*\/\(\)]/g);
    if (!tokens || tokens.join('').replace(/\s/g, '') !== expression.replace(/\s/g, '')) {
        // Additional check to ensure all input characters are consumed by valid tokens
        // and no unrecognized characters remain after stripping whitespace.
        throw new Error("Invalid expression structure or unrecognized characters.");
    }

    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
    const isOperator = token => token in precedence;

    const outputQueue = [];
    const operatorStack = [];

    for (const token of tokens) {
        if (!isNaN(parseFloat(token))) { // It's a number
            outputQueue.push(parseFloat(token));
        } else if (isOperator(token)) {
            while (
                operatorStack.length > 0 &&
                isOperator(operatorStack[operatorStack.length - 1]) &&
                precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
            ) {
                outputQueue.push(operatorStack.pop());
            }
            operatorStack.push(token);
        } else if (token === '(') {
            operatorStack.push(token);
        } else if (token === ')') {
            while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                outputQueue.push(operatorStack.pop());
            }
            if (operatorStack.length === 0) {
                throw new Error("Mismatched parentheses.");
            }
            operatorStack.pop(); // Pop the '('
        } else {
            // Should ideally be caught by the initial regex, but as a fallback.
            throw new Error("Unrecognized token: " + token);
        }
    }

    while (operatorStack.length > 0) {
        if (operatorStack[operatorStack.length - 1] === '(') {
            throw new Error("Mismatched parentheses.");
        }
        outputQueue.push(operatorStack.pop());
    }

    // Evaluate RPN
    const valueStack = [];
    for (const token of outputQueue) {
        if (typeof token === 'number') {
            valueStack.push(token);
        } else { // It's an operator
            if (valueStack.length < 2) {
                throw new Error("Invalid expression structure (insufficient operands for operator: " + token + ").");
            }
            const b = valueStack.pop();
            const a = valueStack.pop();
            switch (token) {
                case '+': valueStack.push(a + b); break;
                case '-': valueStack.push(a - b); break;
                case '*': valueStack.push(a * b); break;
                case '/':
                    if (b === 0) throw new Error("Division by zero.");
                    valueStack.push(a / b);
                    break;
                default:
                    throw new Error("Unknown operator encountered during RPN evaluation: " + token);
            }
        }
    }

    if (valueStack.length !== 1) {
        throw new Error("Invalid expression structure (resulted in too many or too few operands).");
    }

    return valueStack.pop();
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
        const avatarImgElement = document.getElementById('avatarImg');
        if (userProfile.avatar) {
            const url = new URL(userProfile.avatar, window.location.origin);

            // Only allow same-origin, http(s) protocols, or whitelisted data URIs
            if (url.origin === window.location.origin || url.protocol === 'https:' || url.protocol === 'http:') {
                avatarImgElement.setAttribute('src', url.href);
            } else if (url.protocol === 'data:') {
                // Validate data URI to prevent SVG XSS by explicitly disallowing 'image/svg+xml'
                // and ensuring it's a valid image MIME type.
                const mimeMatch = userProfile.avatar.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-\+\.]+)(;base64)?/);
                if (mimeMatch && mimeMatch[1].startsWith('image/') && mimeMatch[1] !== 'image/svg+xml') {
                    avatarImgElement.setAttribute('src', userProfile.avatar);
                } else {
                    console.warn("Blocked potentially malicious or unsupported avatar data URI:", userProfile.avatar);
                    avatarImgElement.removeAttribute('src'); // Clear potentially bad src
                    avatarImgElement.setAttribute('alt', 'Invalid avatar'); // Provide alt text for accessibility
                }
            } else {
                // Block other protocols like javascript:, ftp:, etc.
                console.warn("Blocked unsupported avatar protocol:", userProfile.avatar);
                avatarImgElement.removeAttribute('src');
                avatarImgElement.setAttribute('alt', 'Invalid avatar');
            }
        } else {
            // If avatar is empty, clear the src attribute and provide a default alt.
            avatarImgElement.removeAttribute('src');
            avatarImgElement.setAttribute('alt', 'No avatar');
        }
    } catch (e) {
        console.error("Error setting avatar:", e);
        document.getElementById('avatarImg').removeAttribute('src'); // Clear on error
        document.getElementById('avatarImg').setAttribute('alt', 'Error loading avatar');
    }
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