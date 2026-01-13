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

### Microservices Networking with Docker Compose

In a microservices architecture, services need to communicate with each other. Docker Compose simplifies this by creating a default network for all services defined in the `docker-compose.yml` file. This allows services to discover and communicate with each other using their service names as hostnames.

- **Service Discovery:** The `frontend` service can reach the `backend` service simply by using `http://backend:5000` (where `backend` is the service name defined in `docker-compose.yml` and `5000` is the internal port the backend application listens on).
- **Isolation:** Each service runs in its own isolated container, but they can communicate securely over the internal Docker network without exposing internal ports directly to the host machine (unless explicitly mapped).
- **Simplified Configuration:** You don't need complex IP address management. Docker Compose handles the networking details, making it easy to scale and manage your services.


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

This project uses environment variables to configure the ports for the backend and frontend services. These are defined in a `.env` file located in the `todo-app` directory.

- `BACKEND_PORT`: The port on which the backend service will be exposed (default: `5000`)
- `FRONTEND_PORT`: The port on which the frontend service will be exposed (default: `3000`)

To customize the ports, simply modify the values in the `.env` file.

### Dockerfile Build Arguments

Both the `backend` and `frontend` Dockerfiles now accept a `PORT` build argument. This allows you to specify the internal port that the application exposes within its container during the build process. The `docker-compose.yml` file passes the `BACKEND_PORT` and `FRONTEND_PORT` environment variables as build arguments to their respective Dockerfiles.



To run this application, you need Docker and Docker Compose installed on your system.

1.  **Build and Run with Docker Compose:**
    ```bash
    cd todo-app
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
