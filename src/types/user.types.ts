/**
 * User entity definition
 * Represents a user in the system with unique identifier, personal details and creation timestamp
 */
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data Transfer Object for creating a new user
 * Contains only the required fields from client
 */
export interface CreateUserDto {
  name: string;
  email: string;
}

/**
 * Data Transfer Object for updating a user
 * All fields are optional to allow partial updates
 */
export interface UpdateUserDto {
  name?: string;
  email?: string;
}

/**
 * WebSocket event type definition
 * Used for real-time broadcasting of user-related events to connected clients
 */
export type UserEvent = {
  type: "created" | "updated" | "deleted";
  user: User;
};

/**
 * API Response wrapper for consistent response format
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
