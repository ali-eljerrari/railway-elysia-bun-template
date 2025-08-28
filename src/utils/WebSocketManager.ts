import type { UserEvent } from "../types/user.types";

/**
 * WebSocket Manager class
 * Handles WebSocket connections and broadcasts events to all connected clients
 * Provides centralized management of WebSocket connections for real-time features
 */
export class WebSocketManager {
  private connections = new Set<any>();
  private static instance: WebSocketManager;

  constructor() {}

  /**
   * Get singleton instance of WebSocketManager
   * @returns WebSocketManager instance
   */
  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  /**
   * Register a new WebSocket connection
   * @param ws The WebSocket connection to add
   */
  addConnection(ws: any): void {
    this.connections.add(ws);
    console.log(`WebSocket connection added. Total connections: ${this.connections.size}`);
  }

  /**
   * Remove a WebSocket connection when client disconnects
   * @param ws The WebSocket connection to remove
   */
  removeConnection(ws: any): void {
    this.connections.delete(ws);
    console.log(`WebSocket connection removed. Total connections: ${this.connections.size}`);
  }

  /**
   * Broadcast a user event to all connected clients
   * @param event The event data to broadcast
   */
  broadcast(event: UserEvent): void {
    const message = JSON.stringify(event);
    const connectionCount = this.connections.size;
    
    if (connectionCount === 0) {
      console.log("No WebSocket connections to broadcast to");
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    this.connections.forEach((ws) => {
      try {
        ws.send(message);
        successCount++;
      } catch (error) {
        console.error("Failed to send message to WebSocket connection:", error);
        failureCount++;
        // Remove failed connection
        this.connections.delete(ws);
      }
    });

    console.log(`Broadcasted ${event.type} event to ${successCount} connections (${failureCount} failures)`);
  }

  /**
   * Broadcast a custom message to all connected clients
   * @param message The message to broadcast
   */
  broadcastMessage(message: string): void {
    this.connections.forEach((ws) => {
      try {
        ws.send(message);
      } catch (error) {
        console.error("Failed to send custom message to WebSocket connection:", error);
        this.connections.delete(ws);
      }
    });
  }

  /**
   * Get the number of active connections
   * @returns Number of active WebSocket connections
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Close all WebSocket connections
   */
  closeAllConnections(): void {
    this.connections.forEach((ws) => {
      try {
        ws.close();
      } catch (error) {
        console.error("Error closing WebSocket connection:", error);
      }
    });
    this.connections.clear();
    console.log("All WebSocket connections closed");
  }

  /**
   * Send a message to a specific WebSocket connection
   * @param ws The specific WebSocket connection
   * @param message The message to send
   * @returns True if message was sent successfully, false otherwise
   */
  sendToConnection(ws: any, message: string): boolean {
    try {
      ws.send(message);
      return true;
    } catch (error) {
      console.error("Failed to send message to specific connection:", error);
      this.connections.delete(ws);
      return false;
    }
  }
}
