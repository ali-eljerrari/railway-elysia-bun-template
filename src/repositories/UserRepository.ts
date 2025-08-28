import type { User, CreateUserDto, UpdateUserDto } from '../types/user.types';
import { UserModel } from '../models/User.model';

/**
 * UserRepository - Data Access Layer
 * Handles all data persistence operations for User entities
 * In a real application, this would interact with a database
 */
export class UserRepository {
  private users: User[] = [];

  constructor() {
    // Initialize with some sample data
    this.users = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'Alex Johnson',
        email: 'alex@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  /**
   * Retrieve all users
   * @returns Promise resolving to array of all users
   */
  async findAll(): Promise<User[]> {
    return [...this.users]; // Return copy to prevent external mutation
  }

  /**
   * Find user by ID
   * @param id User ID to search for
   * @returns Promise resolving to User if found, null otherwise
   */
  async findById(id: string): Promise<User | null> {
    const user = this.users.find((user) => user.id === id);
    return user ? { ...user } : null; // Return copy to prevent external mutation
  }

  /**
   * Find user by email
   * @param email Email to search for
   * @returns Promise resolving to User if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find((user) => user.email === email);
    return user ? { ...user } : null;
  }

  /**
   * Create a new user
   * @param createDto Data for creating the user
   * @returns Promise resolving to the created User
   * @throws Error if user with email already exists
   */
  async create(createDto: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.findByEmail(createDto.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const newUser = UserModel.create(createDto);
    this.users.push(newUser);
    return { ...newUser, updatedAt: new Date() };
  }

  /**
   * Update an existing user
   * @param id User ID to update
   * @param updateDto Data for updating the user
   * @returns Promise resolving to updated User if found, null otherwise
   * @throws Error if email already exists for another user
   */
  async update(id: string, updateDto: UpdateUserDto): Promise<User | null> {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) {
      return null;
    }

    // Check if email is being updated and already exists for another user
    if (updateDto.email) {
      const existingUser = await this.findByEmail(updateDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error('User with this email already exists');
      }
    }

    const updatedUser = UserModel.update(this.users[index], updateDto);
    this.users[index] = updatedUser;
    return { ...updatedUser, updatedAt: new Date() };
  }

  /**
   * Delete a user by ID
   * @param id User ID to delete
   * @returns Promise resolving to deleted User if found, null otherwise
   */
  async delete(id: string): Promise<User | null> {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) {
      return null;
    }

    const deletedUser = this.users[index];
    this.users.splice(index, 1);
    return { ...deletedUser, updatedAt: new Date() };
  }

  /**
   * Check if user exists by ID
   * @param id User ID to check
   * @returns Promise resolving to true if user exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    return this.users.some((user) => user.id === id);
  }

  /**
   * Get total count of users
   * @returns Promise resolving to total number of users
   */
  async count(): Promise<number> {
    return this.users.length;
  }

  /**
   * Get users with pagination
   * @param offset Number of users to skip
   * @param limit Maximum number of users to return
   * @returns Promise resolving to paginated users
   */
  async findPaginated(offset: number = 0, limit: number = 10): Promise<User[]> {
    return this.users
      .slice(offset, offset + limit)
      .map((user) => ({ ...user }));
  }
}
