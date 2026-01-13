const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Import cors

const app = express();
const PORT = process.env.PORT || 5000;

const tasksFilePath = path.join(__dirname, 'tasks.json');

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors()); // Enable CORS for all origins

// GET / → returns API info
app.get('/', (req, res) => {
    res.send('Todo Backend API. Use /tasks for operations.');
});

// Helper function to read tasks from tasks.json
const readTasks = () => {
  try {
    const data = fs.readFileSync(tasksFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If file doesn't exist, return an empty array
      return [];
    }
    console.error('Error reading tasks.json:', error);
    return [];
  }
};

// Helper function to write tasks to tasks.json
const writeTasks = (tasks) => {
  try {
    fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing tasks.json:', error);
  }
};

// GET /tasks → returns tasks from tasks.json
app.get('/tasks', (req, res) => {
  const tasks = readTasks();
  res.json(tasks);
});

// POST /tasks → adds a new task to tasks.json
app.post('/tasks', (req, res) => {
  const tasks = readTasks();
  const newTask = { id: Date.now().toString(), ...req.body, done: false };
  tasks.push(newTask);
  writeTasks(tasks);
  res.status(201).json(newTask);
});

// DELETE /tasks/:id → deletes a task by id
app.delete('/tasks/:id', (req, res) => {
  let tasks = readTasks();
  const { id } = req.params;
  const initialLength = tasks.length;
  tasks = tasks.filter(task => task.id !== id);
  if (tasks.length < initialLength) {
    writeTasks(tasks);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Task not found' });
  }
});

// PATCH /tasks/:id → marks a task as done
app.patch('/tasks/:id', (req, res) => {
  console.log(`PATCH /tasks/${req.params.id} received. Body:`, req.body);
  const tasks = readTasks();
  const { id } = req.params;
  const { done } = req.body; // Expecting 'done' status from frontend
  const taskIndex = tasks.findIndex(task => task.id === id);

  if (taskIndex !== -1) {
    tasks[taskIndex] = { ...tasks[taskIndex], done: typeof done === 'boolean' ? done : !tasks[taskIndex].done };
    writeTasks(tasks);
    console.log('Task updated:', tasks[taskIndex]);
    res.json(tasks[taskIndex]);
  } else {
    console.log('Task not found for PATCH:', id);
    res.status(404).json({ message: 'Task not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
