const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Path to the JSON file where notes will be stored
const notesFilePath = path.join(__dirname, 'notes.json');
// Path to the directory where uploaded files will be stored
const uploadsDir = path.join(__dirname, 'uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Use uuid to generate unique filenames to prevent collisions
        cb(null, uuidv4() + path.extname(file.originalname));
    }
});

// Multer upload middleware
const upload = multer({ storage: storage });

// Middleware to parse JSON bodies and enable CORS
app.use(express.json());
app.use(cors());

// Serve static uploaded files
app.use('/uploads', express.static(uploadsDir));

// Helper function to read notes from notes.json
const readNotes = () => {
    try {
        const data = fs.readFileSync(notesFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // If file doesn't exist, return an empty array
            return [];
        }
        console.error('Error reading notes.json:', error);
        return [];
    }
};

// Helper function to write notes to notes.json
const writeNotes = (notes) => {
    try {
        fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing notes.json:', error);
    }
};

// API Endpoints

// GET / → returns API info
app.get('/', (req, res) => {
    res.send('Student Notebook Backend API. Use /notes for operations.');
});

// GET /notes → get all notes
app.get('/notes', (req, res) => {
    const notes = readNotes();
    res.json(notes);
});

// GET /notes/:id → get one note by ID
app.get('/notes/:id', (req, res) => {
    const notes = readNotes();
    const { id } = req.params;
    const note = notes.find(n => n.id === id);
    if (note) {
        res.json(note);
    } else {
        res.status(404).json({ message: 'Note not found' });
    }
});

// POST /notes → create a new note (with optional file upload)
app.post('/notes', upload.array('files'), (req, res) => {
    const notes = readNotes();
    const { title, content, status } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required.' });
    }

    const newNote = {
        id: uuidv4(),
        title,
        content,
        status: status || 'draft', // Default to draft
        createdAt: Date.now(),
        updatedAt: Date.now(),
        attachments: []
    };

    // Handle file attachments if any
    if (req.files && req.files.length > 0) {
        newNote.attachments = req.files.map(file => ({
            id: uuidv4(),
            fileName: file.originalname,
            fileSize: file.size,
            fileType: file.mimetype,
            filePath: `/uploads/${file.filename}` // Store path relative to server
        }));
    }

    notes.push(newNote);
    writeNotes(notes);
    res.status(201).json(newNote);
});

// PUT /notes/:id → edit an existing note
app.put('/notes/:id', (req, res) => {
    let notes = readNotes();
    const { id } = req.params;
    const { title, content, status } = req.body;

    const noteIndex = notes.findIndex(n => n.id === id);

    if (noteIndex !== -1) {
        notes[noteIndex] = {
            ...notes[noteIndex],
            title: title || notes[noteIndex].title,
            content: content || notes[noteIndex].content,
            status: status || notes[noteIndex].status,
            updatedAt: Date.now()
        };
        writeNotes(notes);
        res.json(notes[noteIndex]);
    } else {
        res.status(404).json({ message: 'Note not found' });
    }
});

// DELETE /notes/:id → delete a note and its attachments
app.delete('/notes/:id', (req, res) => {
    let notes = readNotes();
    const { id } = req.params;

    const noteToDelete = notes.find(n => n.id === id);
    if (noteToDelete) {
        // Delete associated files from disk
        noteToDelete.attachments.forEach(attachment => {
            const filePath = path.join(uploadsDir, path.basename(attachment.filePath));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        notes = notes.filter(n => n.id !== id);
        writeNotes(notes);
        res.status(204).send();
    } else {
        res.status(404).json({ message: 'Note not found' });
    }
});

// POST /notes/:id/attachments → add attachments to an existing note
app.post('/notes/:id/attachments', upload.array('files'), (req, res) => {
    let notes = readNotes();
    const { id } = req.params;

    const noteIndex = notes.findIndex(n => n.id === id);

    if (noteIndex !== -1) {
        if (req.files && req.files.length > 0) {
            const newAttachments = req.files.map(file => ({
                id: uuidv4(),
                fileName: file.originalname,
                fileSize: file.size,
                fileType: file.mimetype,
                filePath: `/uploads/${file.filename}`
            }));
            notes[noteIndex].attachments.push(...newAttachments);
            notes[noteIndex].updatedAt = Date.now();
            writeNotes(notes);
            res.status(201).json(newAttachments);
        } else {
            res.status(400).json({ message: 'No files uploaded.' });
        }
    } else {
        res.status(404).json({ message: 'Note not found' });
    }
});

// DELETE /notes/:noteId/attachments/:attachmentId → delete a specific attachment
app.delete('/notes/:noteId/attachments/:attachmentId', (req, res) => {
    let notes = readNotes();
    const { noteId, attachmentId } = req.params;

    const noteIndex = notes.findIndex(n => n.id === noteId);

    if (noteIndex !== -1) {
        const attachmentIndex = notes[noteIndex].attachments.findIndex(att => att.id === attachmentId);

        if (attachmentIndex !== -1) {
            const attachmentToDelete = notes[noteIndex].attachments[attachmentIndex];
            const filePath = path.join(uploadsDir, path.basename(attachmentToDelete.filePath));

            // Delete file from disk
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            notes[noteIndex].attachments.splice(attachmentIndex, 1);
            notes[noteIndex].updatedAt = Date.now();
            writeNotes(notes);
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Attachment not found' });
        }
    } else {
        res.status(404).json({ message: 'Note not found' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
