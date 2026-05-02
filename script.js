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
        // Strict validation for allowed characters (initial client-side filter)
        if (!/^[0-9+\-*\/().\s]+$/.test(input)) throw new Error("Invalid Input: Contains disallowed characters.");
        
        // Use a safe arithmetic parser logic instead of dynamic code evaluation.
        // This parser avoids `new Function()` or `eval()` by explicitly tokenizing
        // and evaluating the mathematical expression based on operator precedence.
        const result = safeMathEval(input);
        document.getElementById('mathResult').textContent = result;
    } catch (e) {
        document.getElementById('mathResult').textContent = 'Error: ' + e.message;
    }
}

function safeMathEval(expression) {
    // Implements a simple recursive descent parser for basic arithmetic expressions
    // to avoid the use of new Function() or eval(), which are severe security risks.

    // Regex to tokenize numbers (integers and floats) and operators/parentheses.
    // Whitespace is implicitly handled by matching only valid tokens.
    const tokens = expression.match(/\d+\.?\d*|\+|\-|\*|\/|\(|\)/g);

    if (!tokens) {
        throw new Error("Invalid or empty expression.");
    }

    let position = 0; // Current position in the tokens array

    // Helper function to get the current token without advancing
    function peek() {
        return tokens[position];
    }

    // Helper function to consume the current token and advance
    function consume(expectedToken) {
        if (position >= tokens.length) {
            if (expectedToken) throw new Error(`Unexpected end of expression, expected '${expectedToken}'`);
            throw new Error("Unexpected end of expression.");
        }
        const currentToken = tokens[position];
        if (expectedToken && currentToken !== expectedToken) {
            throw new Error(`Expected '${expectedToken}' but got '${currentToken}' at position ${position}`);
        }
        position++;
        return currentToken;
    }

    // Parses a number or a parenthesized expression
    function parseFactor() {
        const token = peek();
        if (token === '(') {
            consume('('); // Consume '('
            const result = parseExpression();
            consume(')'); // Consume ')'
            return result;
        } else if (token === '-') { // Handle unary minus
            consume('-');
            return -parseFactor();
        } else if (/\d+\.?\d*/.test(token)) {
            return parseFloat(consume());
        }
        throw new Error(`Unexpected token: '${token}' at position ${position}`);
    }

    // Parses terms (multiplication and division)
    function parseTerm() {
        let result = parseFactor();
        while (peek() === '*' || peek() === '/') {
            const operator = consume();
            const nextFactor = parseFactor();
            if (operator === '*') {
                result *= nextFactor;
            } else if (operator === '/') {
                if (nextFactor === 0) {
                    throw new Error("Division by zero");
                }
                result /= nextFactor;
            }
        }
        return result;
    }

    // Parses expressions (addition and subtraction)
    function parseExpression() {
        let result = parseTerm();
        while (peek() === '+' || peek() === '-') {
            const operator = consume();
            const nextTerm = parseTerm();
            if (operator === '+') {
                result += nextTerm;
            } else if (operator === '-') {
                result -= nextTerm;
            }
        }
        return result;
    }

    const result = parseExpression();

    // After parsing the entire expression, ensure no extra tokens are left
    if (position < tokens.length) {
        throw new Error(`Unexpected tokens at end of expression: '${tokens.slice(position).join(' ')}'`);
    }

    return result;
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
        // Securely prevent prototype pollution
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
        } else {
            document.getElementById('avatarImg').setAttribute('src', 'default_avatar.png'); // Fallback for invalid/empty avatar
        }
    } catch {
        document.getElementById('avatarImg').setAttribute('src', 'default_avatar.png'); // Fallback for URL parsing errors
    }
}

function uploadBio() {
    let f = document.getElementById('bioFile');
    if (f.files.length) {
        let r = new FileReader();
        r.onload = e => {
            document.getElementById('bioPreview').textContent = e.target.result; // Use textContent to prevent XSS
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