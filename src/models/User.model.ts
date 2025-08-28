import type { User, CreateUserDto, UpdateUserDto } from '../types/user.types';

/**
 * User Model class
 * Provides factory methods and validation for User entities
 */
export class UserModel {
  /**
   * Creates a new User entity from CreateUserDto
   * @param dto Data transfer object containing user creation data
   * @returns New User entity with generated ID and timestamp
   */
  static create(dto: CreateUserDto): User {
    return {
      id: crypto.randomUUID(),
      name: dto.name,
      email: dto.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Updates an existing User entity with provided data
   * @param existingUser The existing user to update
   * @param updateDto Data transfer object containing update fields
   * @returns Updated User entity
   */
  static update(existingUser: User, updateDto: UpdateUserDto): User {
    return {
      ...existingUser,
      ...updateDto,
      updatedAt: new Date(),
    };
  }

  /**
   * Validates user email format
   * @param email Email to validate
   * @returns True if email is valid, false otherwise
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates user name
   * @param name Name to validate
   * @returns True if name is valid, false otherwise
   */
  static isValidName(name: string): boolean {
    return name.trim().length >= 2;
  }

  /**
   * Validates a CreateUserDto
   * @param dto Data transfer object to validate
   * @returns Array of validation errors, empty if valid
   */
  static validateCreateDto(dto: CreateUserDto): string[] {
    const errors: string[] = [];

    if (!dto.name || !this.isValidName(dto.name)) {
      errors.push('Name must be at least 2 characters long');
    }

    if (!dto.email || !this.isValidEmail(dto.email)) {
      errors.push('Valid email is required');
    }

    return errors;
  }

  /**
   * Validates an UpdateUserDto
   * @param dto Data transfer object to validate
   * @returns Array of validation errors, empty if valid
   */
  static validateUpdateDto(dto: UpdateUserDto): string[] {
    const errors: string[] = [];

    if (dto.name !== undefined && !this.isValidName(dto.name)) {
      errors.push('Name must be at least 2 characters long');
    }

    if (dto.email !== undefined && !this.isValidEmail(dto.email)) {
      errors.push('Valid email is required');
    }

    return errors;
  }
}
