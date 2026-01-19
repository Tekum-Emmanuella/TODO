# Todo Application

This is a simple Todo application with a frontend and a backend, designed to run using Docker Compose.

## Project Structure

- `backend/`: Contains the Node.js Express server.
- `frontend/`: Contains the HTML, CSS, and JavaScript for the user interface.
- `docker-compose.yml`: Defines the multi-container Docker application.

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript, Nginx (for serving)
- **Backend**: Node.js, Express.js
- **Containerization**: Docker, Docker Compose

## How Frontend and Backend Communicate

The frontend and backend communicate via HTTP requests.

**Backend (`backend/server.js`)**
- The backend is an Express.js server running on port `5000`.
- It uses `cors` middleware to allow cross-origin requests from the frontend.
- It exposes RESTful API endpoints for managing tasks:
    - `GET /tasks`: Retrieves all tasks.
    - `POST /tasks`: Adds a new task.
    - `DELETE /tasks/:id`: Deletes a task by its ID.
    - `PATCH /tasks/:id`: Updates a task (e.g., marks it as done).

**Frontend (`frontend/script.js`)**
- The frontend JavaScript code makes `fetch` API calls to the backend.
- It dynamically determines the backend API URL:
    - `http://localhost:5000/tasks` when running locally.
    - `http://backend:5000/tasks` when running within the Docker Compose network (where `backend` is the service name of the backend container).
- User interactions (adding, deleting, marking as done) trigger corresponding HTTP requests to the backend.
- After each modification, the frontend refreshes the displayed task list to reflect the latest state from the backend.

**Frontend Deployment (`frontend/Dockerfile`)**
- The frontend application is served by an Nginx web server.
- The `frontend/Dockerfile` uses the `nginx:stable-alpine` image, copies the frontend files into the Nginx serving directory, and exposes port 80.

## Setup and Running the Application

To run this application, you need Docker and Docker Compose installed on your system.

1.  **Build and Run with Docker Compose:**
    ```bash
    docker-compose up --build
    ```
2.  **Access the Application:**
    Once the containers are up and running, you can access the frontend in your web browser at `http://localhost`.

## API Endpoints

| Method | Endpoint      | Description                 |
| :----- | :------------ | :-------------------------- |
| `GET`  | `/tasks`      | Get all tasks               |
| `POST` | `/tasks`      | Add a new task              |
| `DELETE`| `/tasks/:id` | Delete a task by ID         |
| `PATCH`| `/tasks/:id`  | Update a task (e.g., mark as done) |
