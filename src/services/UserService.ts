import type { User, CreateUserDto, UpdateUserDto, UserEvent, ApiResponse } from "../types/user.types";
import { UserRepository } from "../repositories/UserRepository";
import { UserModel } from "../models/User.model";
import { WebSocketManager } from "../utils/WebSocketManager";

/**
 * UserService - Business Logic Layer (ViewModel in MVVM)
 * Contains all business logic for user operations
 * Orchestrates between repository and external services
 */
export class UserService {
  private userRepository: UserRepository;
  private wsManager: WebSocketManager;

  constructor(userRepository: UserRepository, wsManager: WebSocketManager) {
    this.userRepository = userRepository;
    this.wsManager = wsManager;
  }

  /**
   * Get all users
   * @returns Promise resolving to API response with users array
   */
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    try {
      const users = await this.userRepository.findAll();
      
      return {
        data: users,
        message: `Retrieved ${users.length} users`
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      return {
        error: "Failed to retrieve users"
      };
    }
  }

  /**
   * Get user by ID
   * @param id User ID to retrieve
   * @returns Promise resolving to API response with user or error
   */
  async getUserById(id: string): Promise<ApiResponse<User>> {
    try {
      if (!id?.trim()) {
        return {
          error: "User ID is required"
        };
      }

      const user = await this.userRepository.findById(id);
      if (!user) {
        return {
          error: "User not found"
        };
      }

      return {
        data: user,
        message: "User retrieved successfully"
      };
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      return {
        error: "Failed to retrieve user"
      };
    }
  }

  /**
   * Create a new user
   * @param createDto User creation data
   * @returns Promise resolving to API response with created user or error
   */
  async createUser(createDto: CreateUserDto): Promise<ApiResponse<User>> {
    try {
      // Validate input
      const validationErrors = UserModel.validateCreateDto(createDto);
      if (validationErrors.length > 0) {
        return {
          error: validationErrors.join(", ")
        };
      }

      // Create user
      const newUser = await this.userRepository.create(createDto);

      // Broadcast user creation event
      this.broadcastUserEvent({
        type: "created",
        user: newUser
      });

      return {
        data: newUser,
        message: "User created successfully"
      };
    } catch (error) {
      console.error("Error creating user:", error);
      
      if (error instanceof Error) {
        return {
          error: error.message
        };
      }
      
      return {
        error: "Failed to create user"
      };
    }
  }

  /**
   * Update an existing user
   * @param id User ID to update
   * @param updateDto User update data
   * @returns Promise resolving to API response with updated user or error
   */
  async updateUser(id: string, updateDto: UpdateUserDto): Promise<ApiResponse<User>> {
    try {
      if (!id?.trim()) {
        return {
          error: "User ID is required"
        };
      }

      // Validate input
      const validationErrors = UserModel.validateUpdateDto(updateDto);
      if (validationErrors.length > 0) {
        return {
          error: validationErrors.join(", ")
        };
      }

      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        return {
          error: "User not found"
        };
      }

      // Update user
      const updatedUser = await this.userRepository.update(id, updateDto);
      if (!updatedUser) {
        return {
          error: "Failed to update user"
        };
      }

      // Broadcast user update event
      this.broadcastUserEvent({
        type: "updated",
        user: updatedUser
      });

      return {
        data: updatedUser,
        message: "User updated successfully"
      };
    } catch (error) {
      console.error("Error updating user:", error);
      
      if (error instanceof Error) {
        return {
          error: error.message
        };
      }
      
      return {
        error: "Failed to update user"
      };
    }
  }

  /**
   * Delete a user
   * @param id User ID to delete
   * @returns Promise resolving to API response with deleted user or error
   */
  async deleteUser(id: string): Promise<ApiResponse<User>> {
    try {
      if (!id?.trim()) {
        return {
          error: "User ID is required"
        };
      }

      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        return {
          error: "User not found"
        };
      }

      // Delete user
      const deletedUser = await this.userRepository.delete(id);
      if (!deletedUser) {
        return {
          error: "Failed to delete user"
        };
      }

      // Broadcast user deletion event
      this.broadcastUserEvent({
        type: "deleted",
        user: deletedUser
      });

      return {
        data: deletedUser,
        message: "User deleted successfully"
      };
    } catch (error) {
      console.error("Error deleting user:", error);
      return {
        error: "Failed to delete user"
      };
    }
  }

  /**
   * Get users with pagination
   * @param offset Number of users to skip
   * @param limit Maximum number of users to return
   * @returns Promise resolving to API response with paginated users
   */
  async getUsersPaginated(offset: number = 0, limit: number = 10): Promise<ApiResponse<{ users: User[], total: number, offset: number, limit: number }>> {
    try {
      if (offset < 0 || limit <= 0 || limit > 100) {
        return {
          error: "Invalid pagination parameters"
        };
      }

      const [users, total] = await Promise.all([
        this.userRepository.findPaginated(offset, limit),
        this.userRepository.count()
      ]);

      return {
        data: {
          users,
          total,
          offset,
          limit
        },
        message: `Retrieved ${users.length} of ${total} users`
      };
    } catch (error) {
      console.error("Error fetching paginated users:", error);
      return {
        error: "Failed to retrieve users"
      };
    }
  }

  /**
   * Check if user exists by email
   * @param email Email to check
   * @returns Promise resolving to true if user exists, false otherwise
   */
  async userExistsByEmail(email: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findByEmail(email);
      return user !== null;
    } catch (error) {
      console.error("Error checking user existence by email:", error);
      return false;
    }
  }

  /**
   * Get user statistics
   * @returns Promise resolving to user statistics
   */
  async getUserStats(): Promise<ApiResponse<{ totalUsers: number, connectionsCount: number }>> {
    try {
      const totalUsers = await this.userRepository.count();
      const connectionsCount = this.wsManager.getConnectionCount();

      return {
        data: {
          totalUsers,
          connectionsCount
        },
        message: "User statistics retrieved successfully"
      };
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return {
        error: "Failed to retrieve user statistics"
      };
    }
  }

  /**
   * Broadcast user event via WebSocket
   * @param event User event to broadcast
   */
  private broadcastUserEvent(event: UserEvent): void {
    try {
      this.wsManager.broadcast(event);
    } catch (error) {
      console.error("Error broadcasting user event:", error);
    }
  }
}
