const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect('mongodb://mongodb:27017/student_notebook', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Define Note Schema and Model
const noteSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4 },
    title: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, default: 'draft' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    attachments: [{
        id: { type: String, default: uuidv4 },
        fileName: String,
        fileSize: Number,
        fileType: String,
        filePath: String,
    }],
});

const Note = mongoose.model('Note', noteSchema);

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

// API Endpoints

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Backend is healthy' });
});

// GET / → returns API info
app.get('/', (req, res) => {
    res.send('Student Notebook Backend API. Use /notes for operations.');
});

// GET /notes → get all notes
app.get('/notes', async (req, res) => {
    try {
        const notes = await Note.find();
        res.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ message: 'Error fetching notes' });
    }
});

// GET /notes/:id → get one note by ID
app.get('/notes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const note = await Note.findOne({ id });
        if (note) {
            res.json(note);
        } else {
            res.status(404).json({ message: 'Note not found' });
        }
    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).json({ message: 'Error fetching note' });
    }
});

// POST /notes → create a new note (with optional file upload)
app.post('/notes', upload.array('files'), async (req, res) => {
    try {
        const { title, content, status } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required.' });
        }

        const newNote = new Note({
            title,
            content,
            status: status || 'draft',
            attachments: []
        });

        if (req.files && req.files.length > 0) {
            newNote.attachments = req.files.map(file => ({
                id: uuidv4(),
                fileName: file.originalname,
                fileSize: file.size,
                fileType: file.mimetype,
                filePath: `/uploads/${file.filename}`
            }));
        }

        await newNote.save();
        res.status(201).json(newNote);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ message: 'Error creating note' });
    }
});

// PUT /notes/:id → edit an existing note
app.put('/notes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, status } = req.body;

        const updatedNote = await Note.findOneAndUpdate(
            { id },
            { title, content, status, updatedAt: Date.now() },
            { new: true }
        );

        if (updatedNote) {
            res.json(updatedNote);
        } else {
            res.status(404).json({ message: 'Note not found' });
        }
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'Error updating note' });
    }
});

// DELETE /notes/:id → delete a note and its attachments
app.delete('/notes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedNote = await Note.findOneAndDelete({ id });

        if (deletedNote) {
            deletedNote.attachments.forEach(attachment => {
                const filePath = path.join(uploadsDir, path.basename(attachment.filePath));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Note not found' });
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ message: 'Error deleting note' });
    }
});

// POST /notes/:id/attachments → add attachments to an existing note
app.post('/notes/:id/attachments', upload.array('files'), async (req, res) => {
    try {
        const { id } = req.params;
        const note = await Note.findOne({ id });

        if (note) {
            if (req.files && req.files.length > 0) {
                const newAttachments = req.files.map(file => ({
                    id: uuidv4(),
                    fileName: file.originalname,
                    fileSize: file.size,
                    fileType: file.mimetype,
                    filePath: `/uploads/${file.filename}`
                }));
                note.attachments.push(...newAttachments);
                note.updatedAt = Date.now();
                await note.save();
                res.status(201).json(newAttachments);
            } else {
                res.status(400).json({ message: 'No files uploaded.' });
            }
        } else {
            res.status(404).json({ message: 'Note not found' });
        }
    } catch (error) {
        console.error('Error adding attachments:', error);
        res.status(500).json({ message: 'Error adding attachments' });
    }
});

// DELETE /notes/:noteId/attachments/:attachmentId → delete a specific attachment
app.delete('/notes/:noteId/attachments/:attachmentId', async (req, res) => {
    try {
        const { noteId, attachmentId } = req.params;

        const note = await Note.findOne({ id: noteId });

        if (note) {
            const attachmentIndex = note.attachments.findIndex(att => att.id === attachmentId);

            if (attachmentIndex !== -1) {
                const attachmentToDelete = note.attachments[attachmentIndex];
                const filePath = path.join(uploadsDir, path.basename(attachmentToDelete.filePath));

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }

                note.attachments.splice(attachmentIndex, 1);
                note.updatedAt = Date.now();
                await note.save();
                res.status(204).send();
            } else {
                res.status(404).json({ message: 'Attachment not found' });
            }
        } else {
            res.status(404).json({ message: 'Note not found' });
        }
    } catch (error) {
        console.error('Error deleting attachment:', error);
        res.status(500).json({ message: 'Error deleting attachment' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
