const getApiUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost'; // Nginx proxy is exposed on port 80 locally
    }
    return 'http://nginx-proxy'; // Docker service name for nginx-proxy
};

const API_BASE_URL = getApiUrl();

// UI Elements
const newNoteBtn = document.getElementById('new-note-btn');
const noteForm = document.getElementById('note-form');
const noteIdInput = document.getElementById('note-id');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const fileUploadInput = document.getElementById('file-upload');
const uploadedFilesContainer = document.getElementById('uploaded-files');
const saveNoteBtn = document.getElementById('save-note-btn');
const saveDraftBtn = document.getElementById('save-draft-btn');
const markCompletedBtn = document.getElementById('mark-completed-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const noteList = document.getElementById('note-list');
const filterAllBtn = document.getElementById('filter-all');
const filterDraftsBtn = document.getElementById('filter-drafts');
const filterCompletedBtn = document.getElementById('filter-completed');

let currentFilter = 'all';
let currentNoteAttachments = []; // To keep track of attachments for the note being edited

// Helper function to fetch notes from the backend
async function fetchNotes() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/notes`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const notes = await response.json();
        renderNotes(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
    }
}

// Render notes to the UI based on current filter
function renderNotes(notes) {
    noteList.innerHTML = ''; // Clear existing notes

    const filteredNotes = notes.filter(note => {
        if (currentFilter === 'all') return true;
        return note.status.toLowerCase() === currentFilter;
    });

    filteredNotes.forEach(note => {
        const li = document.createElement('li');
        li.dataset.id = note.id;
        li.classList.add(note.status.toLowerCase()); // Add draft or completed class
        li.innerHTML = `
            <h3>${note.title}</h3>
            <p>${note.content.substring(0, 100)}...</p> <!-- Display a snippet of content -->
            <small>Last edited: ${new Date(note.updatedAt).toLocaleString()}</small>
            <div class="note-actions">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
        `;
        noteList.appendChild(li);
    });
}

// Clear the note form and attachments display
function clearForm() {
    noteIdInput.value = '';
    noteTitleInput.value = '';
    noteContentInput.value = '';
    fileUploadInput.value = '';
    uploadedFilesContainer.innerHTML = '';
    saveNoteBtn.textContent = 'Save Note';
    markCompletedBtn.style.display = 'none'; // Hide mark as completed for new notes
    currentNoteAttachments = [];
}

// Display attachments for the current note
function renderAttachments(attachments) {
    uploadedFilesContainer.innerHTML = '';
    attachments.forEach(attachment => {
        const attachmentItem = document.createElement('div');
        attachmentItem.classList.add('attachment-item');
        attachmentItem.dataset.id = attachment.id;

        let filePreview = '';
        // Construct the file URL using the nginx-proxy for /uploads
        const fileUrl = `${API_BASE_URL}${attachment.filePath}`;

        if (attachment.fileType.startsWith('image/')) {
            filePreview = `<img src="${fileUrl}" alt="${attachment.fileName}">`;
        } else {
            filePreview = `<span class="file-icon">📄</span>`; // Generic file icon
        }

        attachmentItem.innerHTML = `
            ${filePreview}
            <div class="file-info">
                <span><a href="${fileUrl}" target="_blank">${attachment.fileName}</a></span>
                <span>${(attachment.fileSize / 1024).toFixed(2)} KB</span>
            </div>
            <button class="remove-attachment-btn">x</button>
        `;
        uploadedFilesContainer.appendChild(attachmentItem);
    });
}

// Handle saving/updating a note
async function upsertNote(status) {
    const id = noteIdInput.value;
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    const files = fileUploadInput.files;

    if (!title || !content) {
        alert('Title and Content are required.');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('status', status);

    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }

    try {
        let response;
        if (id) {
            // Update existing note
            response = await fetch(`${API_BASE_URL}/api/notes/${id}`, {
                method: 'PUT',
                headers: {
                    // No Content-Type header when using FormData for file uploads
                },
                body: formData,
            });
        } else {
            // Create new note
            response = await fetch(`${API_BASE_URL}/api/notes`, {
                method: 'POST',
                headers: {
                    // No Content-Type header when using FormData for file uploads
                },
                body: formData,
            });
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const savedNote = await response.json();
        console.log('Note saved/updated:', savedNote);
        fetchNotes();
        clearForm();
    } catch (error) {
        console.error('Error saving/updating note:', error);
    }
}

// Handle deleting a note
async function deleteNote(id) {
    if (!confirm('Are you sure you want to delete this note?')) {
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/notes/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Note deleted:', id);
        fetchNotes();
        clearForm();
    } catch (error) {
        console.error('Error deleting note:', error);
    }
}

// Event Listeners
newNoteBtn.addEventListener('click', () => {
    clearForm();
    markCompletedBtn.style.display = 'none';
    saveNoteBtn.textContent = 'Save Note';
});

noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    upsertNote('completed');
});

saveDraftBtn.addEventListener('click', () => {
    upsertNote('draft');
});

markCompletedBtn.addEventListener('click', () => {
    upsertNote('completed');
});

cancelEditBtn.addEventListener('click', clearForm);

noteList.addEventListener('click', async (e) => {
    const li = e.target.closest('li');
    if (!li) return;

    const id = li.dataset.id;

    if (e.target.classList.contains('edit-btn')) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/notes/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const noteToEdit = await response.json();
            noteIdInput.value = noteToEdit.id;
            noteTitleInput.value = noteToEdit.title;
            noteContentInput.value = noteToEdit.content;
            saveNoteBtn.textContent = 'Update Note';
            markCompletedBtn.style.display = 'inline-block';
            currentNoteAttachments = noteToEdit.attachments || [];
            renderAttachments(currentNoteAttachments);
        } catch (error) {
            console.error('Error fetching note for edit:', error);
        }
    } else if (e.target.classList.contains('delete-btn')) {
        deleteNote(id);
    }
});

uploadedFilesContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('remove-attachment-btn')) {
        const attachmentItem = e.target.closest('.attachment-item');
        const attachmentId = attachmentItem.dataset.id;
        const noteId = noteIdInput.value;

        if (!noteId || !attachmentId) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/notes/${noteId}/attachments/${attachmentId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('Attachment deleted:', attachmentId);
            // Remove from currentNoteAttachments and re-render
            currentNoteAttachments = currentNoteAttachments.filter(att => att.id !== attachmentId);
            renderAttachments(currentNoteAttachments);
            fetchNotes(); // Refresh notes to update attachment count if displayed
        } catch (error) {
            console.error('Error deleting attachment:', error);
        }
    }
});

filterAllBtn.addEventListener('click', () => {
    currentFilter = 'all';
    filterAllBtn.classList.add('active');
    filterDraftsBtn.classList.remove('active');
    filterCompletedBtn.classList.remove('active');
    fetchNotes();
});

filterDraftsBtn.addEventListener('click', () => {
    currentFilter = 'draft';
    filterAllBtn.classList.remove('active');
    filterDraftsBtn.classList.add('active');
    filterCompletedBtn.classList.remove('active');
    fetchNotes();
});

filterCompletedBtn.addEventListener('click', () => {
    currentFilter = 'completed';
    filterAllBtn.classList.remove('active');
    filterDraftsBtn.classList.remove('active');
    filterCompletedBtn.classList.add('active');
    fetchNotes();
});

// Initial load
document.addEventListener('DOMContentLoaded', fetchNotes);
