import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';

// Import all our MVVM components
import { UserRepository } from './repositories/UserRepository';
import { UserService } from './services/UserService';
import { UserController } from './controllers/UserController';
import { WebSocketManager } from './utils/WebSocketManager';
import { apiKey } from './utils/apikey';
import { VARS } from './constants';

// Environment configuration
const PORT = VARS.find((v) => v.name === 'PORT')?.value;
const API_KEY = VARS.find((v) => v.name === 'API_KEY')?.value;

// Initialize application components
const wsManager = WebSocketManager.getInstance();
const userRepository = new UserRepository();
const userService = new UserService(userRepository, wsManager);
const userController = new UserController(userService);

// Initialize and configure Elysia app
const app = new Elysia();

app.use(apiKey);

// Configure Swagger documentation
app.use(
  swagger({
    path: '/docs',
    documentation: {
      info: {
        title: 'Elysia User Management API',
        version: '1.0.0',
        description:
          'A clean MVVM architecture API for user management with real-time WebSocket support',
      },
      tags: [
        {
          name: 'Users',
          description: 'User management endpoints for CRUD operations',
        },
        {
          name: 'General',
          description: 'General application endpoints',
        },
        {
          name: 'WebSockets',
          description: 'WebSocket endpoints for real-time communication',
        },
      ],
    },
  })
);

// Root endpoint
app.get(
  '/',
  () => ({
    message: 'Welcome to Elysia User Management API',
    documentation: '/docs',
    websocket: '/ws/v1/users',
    version: '1.0.0',
    architecture: 'MVVM',
  }),
  {
    apiKey: API_KEY,
    detail: {
      summary: 'Welcome endpoint',
      tags: ['General'],
      description: 'Root endpoint with API information and links',
    },
  }
);

// Health check endpoint
app.get(
  '/health',
  () => ({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connections: wsManager.getConnectionCount(),
  }),
  {
    apiKey: API_KEY,
    detail: {
      summary: 'Health check endpoint',
      tags: ['General'],
      description: 'Check application health and status',
    },
  }
);

// WebSocket endpoint for real-time user events
app.ws('/ws/v1/users', {
  open: (ws) => {
    console.log('WebSocket connection opened');
    wsManager.addConnection(ws);

    // Send welcome message to new connection
    wsManager.sendToConnection(
      ws,
      JSON.stringify({
        type: 'connection',
        message: 'Connected to user events stream',
        timestamp: new Date().toISOString(),
      })
    );
  },
  close: (ws) => {
    console.log('WebSocket connection closed');
    wsManager.removeConnection(ws);
  },
  message: (ws, message) => {
    console.log('WebSocket message received:', message);

    try {
      // Echo the message back with timestamp
      const response = {
        type: 'echo',
        originalMessage: message,
        timestamp: new Date().toISOString(),
        connectionCount: wsManager.getConnectionCount(),
      };

      wsManager.sendToConnection(ws, JSON.stringify(response));
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      wsManager.sendToConnection(
        ws,
        JSON.stringify({
          type: 'error',
          message: 'Failed to process message',
          timestamp: new Date().toISOString(),
        })
      );
    }
  },
  detail: {
    summary: 'WebSocket connection for user events',
    tags: ['WebSockets'],
    description:
      'Connect to receive real-time updates when users are created, updated, or deleted. Also supports echo functionality for testing.',
  },
});

// API root endpoint
app.get(
  '/api/v1',
  () => ({
    message: 'Elysia User Management API',
    version: '1.0.0',
    endpoints: {
      users: '/api/v1/users',
      documentation: '/docs',
      websocket: '/ws/v1/users',
    },
  }),
  {
    apiKey: API_KEY,
    detail: {
      summary: 'API root endpoint',
      tags: ['General'],
      description: 'API information and available endpoints',
    },
  }
);

// Register user routes through controller
userController.registerRoutes(app);

// Start the server
app.listen(PORT!, () => {
  // Log application start information
  console.log('\n🚀 Elysia User Management API Started');
  console.log('='.repeat(50));
  console.log(`🦊 Server: http://localhost:${PORT}`);
  console.log(`📚 Documentation: http://localhost:${PORT}/docs`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws/v1/users`);
  console.log(`📚 Users Endpoints: http://localhost:${PORT}/api/v1/users`);
  console.log(`🏗️  Architecture: MVVM (Model-View-ViewModel)`);
  console.log(`📊 Initial Users: 3`);
  console.log('='.repeat(50));
  console.log('\n✨ Features:');
  console.log('  • Clean MVVM Architecture');
  console.log('  • Real-time WebSocket Events');
  console.log('  • Input Validation & Error Handling');
  console.log('  • Comprehensive API Documentation');
  console.log('  • User CRUD Operations');
  console.log('  • Pagination Support');
  console.log('  • Health Monitoring\n');
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down application...');
  wsManager.closeAllConnections();
  console.log('✅ Application shutdown complete');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down application...');
  wsManager.closeAllConnections();
  console.log('✅ Application shutdown complete');
  process.exit(0);
});

// Export app for testing purposes
// export default app; //! BUG: Throws ADDRINUSE error
