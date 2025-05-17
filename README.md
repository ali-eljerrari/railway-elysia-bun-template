# Elysia User Management API

A full-featured RESTful API built with Elysia and Bun, featuring user management with real-time WebSocket notifications.

## Features

- **Complete User CRUD Operations**
  - Create, read, update, and delete users
  - Proper HTTP status codes (201 for creation, 404 for not found, etc.)
  - In-memory storage with demo users

- **WebSocket Real-time Updates**
  - Connect to receive live updates when users are modified
  - Notifications for user creation, updates, and deletion
  - Event-based architecture for real-time applications

- **Swagger Documentation**
  - Interactive API documentation
  - Try endpoints directly from the browser
  - Clear request/response schemas

## API Endpoints

### General Endpoints
- `GET /` - Welcome message
- `GET /health` - Health check endpoint
- `GET /api/v1/docs` - Swagger documentation

### User Endpoints
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a specific user
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

### WebSocket Connection
- `WebSocket /ws/users` - Connect to receive real-time user updates

## Getting Started

To get started with this application, follow these steps:

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd elysia-user-api

# Install dependencies
bun install

# Start the development server
bun run dev
```

The server will start at http://localhost:3000.
The Swagger documentation is available at http://localhost:3000/api/v1/docs.

## WebSocket Usage Example

### JavaScript Client

```javascript
// Connect to the WebSocket endpoint
const socket = new WebSocket('ws://localhost:3000/ws/users');

// Handle connection open
socket.onopen = () => {
  console.log('Connected to WebSocket');
};

// Handle incoming messages
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('User event received:', data);
  
  // Handle different event types
  switch(data.type) {
    case 'created':
      console.log('New user created:', data.user);
      break;
    case 'updated':
      console.log('User updated:', data.user);
      break;
    case 'deleted':
      console.log('User deleted:', data.user);
      break;
  }
};
```

## Data Structures

### User Object

```typescript
interface User {
  id: string;       // Unique identifier
  name: string;     // User's name
  email: string;    // User's email address  
  createdAt: Date;  // Timestamp of creation
}
```

### WebSocket Event

```typescript
type UserEvent = {
  type: 'created' | 'updated' | 'deleted';  // Event type
  user: User;                               // The affected user
};
```

## Deployment

This template is ready to deploy to platforms like Railway and DigitalOcean with minimal configuration.

### 🐳 Docker Deployment

This project includes a Dockerfile for containerized deployment. Follow these steps to build and run the Docker container:

```bash
# Build the Docker image
docker build -t elysia-user-api .

# Run the container
docker run -p 3000:3000 elysia-user-api
```

The API will be available at http://localhost:3000.

For production deployment, you may want to use Docker Compose or Kubernetes for better container orchestration.

### 🚀 Deploy on Railway

Click the button below to deploy instantly on [Railway](https://railway.app/):

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/-6vLXh?referralCode=6XQcnk)