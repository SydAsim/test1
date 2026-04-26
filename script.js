let notes = [];

function renderNotes() {
    const container = document.getElementById('notesContainer');
    container.innerHTML = '';
    
    for (let i = 0; i < notes.length; i++) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note';
        
        // VULNERABILITY: Cross-Site Scripting (XSS)
        // User input is directly rendered into the DOM as HTML without sanitization.
        // A malicious user can input <img src=x onerror=alert('Hacked')>
        noteDiv.innerHTML = `
            <div>${notes[i]}</div>
            <button class="delete-btn" onclick="deleteNote()">Delete</button>
        `;
        
        container.appendChild(noteDiv);
    }
}

function addNote() {
    const input = document.getElementById('noteInput');
    const text = input.value;
    
    if (text.trim() !== '') {
        notes.push(text);
        input.value = '';
        renderNotes();
    }
}

// LOGICAL BUG: This function doesn't know which note to delete!
// It will always just remove the LAST note in the array, no matter which delete button is clicked.
function deleteNote() {
    notes.pop(); // Always removes the last element
    renderNotes();
}

// Initial render
renderNotes();
