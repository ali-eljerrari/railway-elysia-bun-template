import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import "dotenv/config";

const PORT = process.env.PORT || 3000;

/**
 * User entity definition
 * Represents a user in the system with unique identifier, personal details and creation timestamp
 */
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

/**
 * WebSocket event type definition
 * Used for real-time broadcasting of user-related events to connected clients
 */
type UserEvent = {
  type: 'created' | 'updated' | 'deleted';
  user: User;
};

/**
 * In-memory user database
 * This simulates a database with pre-populated users for demonstration purposes
 * In a production environment, this would be replaced with a real database
 */
const users: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    createdAt: new Date()
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    createdAt: new Date()
  },
  {
    id: "3",
    name: "Alex Johnson",
    email: "alex@example.com",
    createdAt: new Date()
  }
];

/**
 * WebSocket manager class
 * Handles WebSocket connections and broadcasts events to all connected clients
 */
class WebSocketManager {
  private connections = new Set<any>();

  /**
   * Register a new WebSocket connection
   * @param ws The WebSocket connection to add
   */
  addConnection(ws: any) {
    this.connections.add(ws);
  }

  /**
   * Remove a WebSocket connection when client disconnects
   * @param ws The WebSocket connection to remove
   */
  removeConnection(ws: any) {
    this.connections.delete(ws);
  }

  /**
   * Broadcast a user event to all connected clients
   * @param event The event data to broadcast
   */
  broadcast(event: UserEvent) {
    this.connections.forEach(ws => {
      ws.send(JSON.stringify(event));
    });
  }
}

// Initialize the WebSocket manager
const wsManager = new WebSocketManager();

/**
 * Initialize Elysia application
 * Set up API routes, WebSocket endpoint, and Swagger documentation
 */
const app = new Elysia()
  // Configure Swagger documentation
  .use(
    swagger({
      path: "/api/v1/docs",
      documentation: {
        info: {
          title: "Elysia API Documentation",
          version: "1.0.0",
          description: "API documentation for user management",
        },
        tags: [
          {
            name: "Users",
            description: "User management endpoints",
          },
          {
            name: "General",
            description: "General endpoints",
          },
          {
            name: "WebSockets",
            description: "WebSocket endpoints",
          },
        ],
      },
    })
  )
  // WebSocket connection for real-time user events
  .ws("/ws/users", {
    open(ws) {
      console.log('WebSocket connection opened');
      wsManager.addConnection(ws);
    },
    close(ws) {
      console.log('WebSocket connection closed');
      wsManager.removeConnection(ws);
    },
    message(ws, message) {
      console.log('WebSocket message received:', message);
      // Echo the message back
      ws.send(`Received: ${message}`);
    },
    detail: {
      summary: "WebSocket connection for user events",
      tags: ["WebSockets"],
      description: "Connect to receive real-time updates when users are created, updated, or deleted"
    }
  })
  .get("/", () => "Hello Elysia, explore the swagger documentation at /api/v1/docs")
  .get("/health", () => "OK")
  // Group all API routes under /api prefix
  .group("/api", (app) => 
    app
      // Root endpoint - simple welcome message
      .get("/", () => "Hello Elysia", {
        detail: {
          summary: "Welcome endpoint",
          tags: ["General"],
        },
      })
      
      // User CRUD operations
      
      /**
       * GET /api/users
       * Retrieve all users from the database
       * @returns Array of users
       */
      .get("/users", () => users, {
        detail: {
          summary: "Get all users",
          tags: ["Users"],
        },
      })
      
      /**
       * GET /api/users/:id
       * Retrieve a specific user by ID
       * @param id The unique identifier of the user
       * @returns The user object or 404 error if not found
       */
      .get("/users/:id", ({ params: { id } }) => {
        const user = users.find(user => user.id === id);
        if (!user) return new Response(
          JSON.stringify({ error: "User not found" }), 
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
        return user;
      }, {
        detail: {
          summary: "Get user by ID",
          tags: ["Users"],
        },
        params: t.Object({
          id: t.String(),
        }),
      })
      
      /**
       * POST /api/users
       * Create a new user
       * @param body Request body containing user name and email
       * @returns The newly created user with 201 Created status
       */
      .post("/users", ({ body }) => {
        const newUser: User = {
          ...body,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };
        users.push(newUser);
        
        // Broadcast the new user event
        wsManager.broadcast({
          type: 'created',
          user: newUser
        });
        
        return new Response(
          JSON.stringify(newUser), 
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      }, {
        detail: {
          summary: "Create a new user",
          tags: ["Users"],
        },
        body: t.Object({
          name: t.String(),
          email: t.String(),
        }),
      })
      
      /**
       * PUT /api/users/:id
       * Update an existing user
       * @param id The unique identifier of the user to update
       * @param body Request body containing user properties to update
       * @returns The updated user or 404 error if not found
       */
      .put("/users/:id", ({ params: { id }, body }) => {
        const index = users.findIndex(user => user.id === id);
        if (index === -1) return new Response(
          JSON.stringify({ error: "User not found" }), 
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
        
        const updatedUser = {
          ...users[index],
          ...body,
        };
        
        users[index] = updatedUser;
        
        // Broadcast the update event
        wsManager.broadcast({
          type: 'updated',
          user: updatedUser
        });
        
        return new Response(
          JSON.stringify(updatedUser), 
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }, {
        detail: {
          summary: "Update user by ID",
          tags: ["Users"],
        },
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          name: t.Optional(t.String()),
          email: t.Optional(t.String()),
        }),
      })
      
      /**
       * DELETE /api/users/:id
       * Delete a user from the system
       * @param id The unique identifier of the user to delete
       * @returns Success message and the deleted user, or 404 error if not found
       */
      .delete("/users/:id", ({ params: { id } }) => {
        const index = users.findIndex(user => user.id === id);
        if (index === -1) return new Response(
          JSON.stringify({ error: "User not found" }), 
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
        
        const deletedUser = users[index];
        users.splice(index, 1);
        
        // Broadcast the delete event
        wsManager.broadcast({
          type: 'deleted',
          user: deletedUser
        });
        
        return new Response(
          JSON.stringify({ message: "User deleted successfully", user: deletedUser }), 
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }, {
        detail: {
          summary: "Delete user by ID",
          tags: ["Users"],
        },
        params: t.Object({
          id: t.String(),
        }),
      })
  )
  .listen(PORT);

// Log application start information
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
console.log(`📚 Swagger documentation available at http://${app.server?.hostname}:${app.server?.port}/api/v1/docs`);
console.log(`🔌 WebSocket endpoint available at ws://${app.server?.hostname}:${app.server?.port}/ws/users`);
