const getApiUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/tasks';
    }
    return 'http://backend:5000/tasks';
};

const API_URL = getApiUrl();

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');

// Fetch and display tasks
async function fetchTasks() {
    try {
        console.log('Fetching tasks...');
        const response = await fetch(API_URL);
        const tasks = await response.json();
        console.log('Tasks fetched:', tasks);
        taskList.innerHTML = ''; // Clear existing tasks
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.dataset.id = task.id;
            if (task.done) {
                li.classList.add('done');
            }
            li.innerHTML = `
                <span>${task.title}</span>
                <div class="task-actions">
                    <button class="done-btn">${task.done ? 'Undone' : 'Done'}</button>
                    <button class="delete-btn">Delete</button>
                </div>
            `;
            taskList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

// Add a new task
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;

    console.log('Adding new task:', title);
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title }),
        });
        const newTask = await response.json();
        console.log('Task added:', newTask);
        taskInput.value = '';
        fetchTasks(); // Refresh tasks
    } catch (error) {
        console.error('Error adding task:', error);
    }
});

// Handle delete and mark as done
taskList.addEventListener('click', async (e) => {
    const li = e.target.closest('li');
    if (!li) return;

    const id = li.dataset.id;

    if (e.target.classList.contains('delete-btn')) {
        console.log('Deleting task:', id);
        try {
            await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
            });
            console.log('Task deleted:', id);
            fetchTasks(); // Refresh tasks
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    } else if (e.target.classList.contains('done-btn')) {
        console.log('Marking task as done:', id);
        try {
            // The backend PATCH endpoint marks a task as done, it doesn't toggle.
            // For a full toggle, the backend would need to support sending the current state.
            // For now, we'll just mark it as done.
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ done: !li.classList.contains('done') }), // This body is not used by the current backend PATCH
            });
            const updatedTask = await response.json();
            console.log('Task updated:', updatedTask);
            fetchTasks(); // Refresh tasks
        } catch (error) {
            console.error('Error marking task as done:', error);
        }
    }
});

// Initial fetch of tasks when the page loads
fetchTasks();
