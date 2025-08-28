import { Elysia, t } from 'elysia';
import type { CreateUserDto, UpdateUserDto } from '../types/user.types';
import { UserService } from '../services/UserService';
import { VARS } from '../constants';

const API_KEY = VARS.find((v) => v.name === 'API_KEY')?.value;

/**
 * UserController - HTTP Request Handler (View in MVVM)
 * Handles all HTTP requests related to users
 * Delegates business logic to UserService
 */
export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  /**
   * Register all user routes with the Elysia app
   * @param app Elysia application instance
   */
  registerRoutes(app: Elysia): void {
    app
      .get('/api/v1/users', this.getAllUsers.bind(this), {
        apiKey: API_KEY,
        detail: {
          summary: 'Get all users',
          tags: ['Users'],
          description: 'Retrieve all users from the system',
        },
        headers: t.Object({
          authorization: t.String({
            description: 'API key for authentication',
          }),
        }),
      })
      .get('/api/v1/users/stats', this.getUserStats.bind(this), {
        apiKey: API_KEY,
        detail: {
          summary: 'Get user statistics',
          tags: ['Users'],
          description:
            'Get system statistics including user count and active connections',
        },
        headers: t.Object({
          authorization: t.String({
            description: 'API key for authentication',
          }),
        }),
      })
      .get('/api/v1/users/:id', this.getUserById.bind(this), {
        apiKey: API_KEY,
        detail: {
          summary: 'Get user by ID',
          tags: ['Users'],
          description: 'Retrieve a specific user by their unique identifier',
        },
        headers: t.Object({
          authorization: t.String({
            description: 'API key for authentication',
          }),
        }),
        params: t.Object({
          id: t.String({
            description: 'Unique identifier of the user',
          }),
        }),
      })
      .post('/api/v1/users', this.createUser.bind(this), {
        apiKey: API_KEY,
        detail: {
          summary: 'Create a new user',
          tags: ['Users'],
          description: 'Create a new user with the provided information',
        },
        headers: t.Object({
          authorization: t.String({
            description: 'API key for authentication',
          }),
        }),
        body: t.Object({
          name: t.String({
            description: 'Full name of the user',
            minLength: 2,
          }),
          email: t.String({
            description: 'Email address of the user',
            format: 'email',
          }),
        }),
      })
      .put('/api/v1/users/:id', this.updateUser.bind(this), {
        apiKey: API_KEY,
        detail: {
          summary: 'Update user by ID',
          tags: ['Users'],
          description: "Update an existing user's information",
        },
        headers: t.Object({
          authorization: t.String({
            description: 'API key for authentication',
          }),
        }),
        params: t.Object({
          id: t.String({
            description: 'Unique identifier of the user to update',
          }),
        }),
        body: t.Object({
          name: t.Optional(
            t.String({
              description: 'Full name of the user',
              minLength: 2,
            })
          ),
          email: t.Optional(
            t.String({
              description: 'Email address of the user',
              format: 'email',
            })
          ),
        }),
      })
      .delete('/api/v1/users/:id', this.deleteUser.bind(this), {
        apiKey: API_KEY,
        detail: {
          summary: 'Delete user by ID',
          tags: ['Users'],
          description: 'Delete a user from the system',
        },
        headers: t.Object({
          authorization: t.String({
            description: 'API key for authentication',
          }),
        }),
        params: t.Object({
          id: t.String({
            description: 'Unique identifier of the user to delete',
          }),
        }),
      })
      .get(
        '/api/v1/users/paginated/:offset/:limit',
        this.getUsersPaginated.bind(this),
        {
          apiKey: API_KEY,
          detail: {
            summary: 'Get users with pagination',
            tags: ['Users'],
            description: 'Retrieve users with pagination support',
          },
          headers: t.Object({
            authorization: t.String({
              description: 'API key for authentication',
            }),
          }),
          params: t.Object({
            offset: t.String({
              description: 'Number of users to skip',
            }),
            limit: t.String({
              description: 'Maximum number of users to return',
            }),
          }),
        }
      );
  }

  /**
   * GET /users - Get all users
   */
  private async getAllUsers() {
    const result = await this.userService.getAllUsers();

    if (result.error) {
      return this.createErrorResponse(result.error, 500);
    }

    return this.createSuccessResponse(result.data, result.message);
  }

  /**
   * GET /users/stats - Get user statistics
   */
  private async getUserStats() {
    const result = await this.userService.getUserStats();

    if (result.error) {
      return this.createErrorResponse(result.error, 500);
    }

    return this.createSuccessResponse(result.data, result.message);
  }

  /**
   * GET /users/:id - Get user by ID
   */
  private async getUserById({ params: { id } }: { params: { id: string } }) {
    const result = await this.userService.getUserById(id);

    if (result.error) {
      const statusCode = result.error === 'User not found' ? 404 : 400;
      return this.createErrorResponse(result.error, statusCode);
    }

    return this.createSuccessResponse(result.data, result.message);
  }

  /**
   * POST /users - Create a new user
   */
  private async createUser({ body }: { body: CreateUserDto }) {
    const result = await this.userService.createUser(body);

    if (result.error) {
      const statusCode = result.error.includes('already exists') ? 409 : 400;
      return this.createErrorResponse(result.error, statusCode);
    }

    return this.createSuccessResponse(result.data, result.message, 201);
  }

  /**
   * PUT /users/:id - Update user by ID
   */
  private async updateUser({
    params: { id },
    body,
  }: {
    params: { id: string };
    body: UpdateUserDto;
  }) {
    const result = await this.userService.updateUser(id, body);

    if (result.error) {
      let statusCode = 400;
      if (result.error === 'User not found') {
        statusCode = 404;
      } else if (result.error.includes('already exists')) {
        statusCode = 409;
      }
      return this.createErrorResponse(result.error, statusCode);
    }

    return this.createSuccessResponse(result.data, result.message);
  }

  /**
   * DELETE /users/:id - Delete user by ID
   */
  private async deleteUser({ params: { id } }: { params: { id: string } }) {
    const result = await this.userService.deleteUser(id);

    if (result.error) {
      const statusCode = result.error === 'User not found' ? 404 : 400;
      return this.createErrorResponse(result.error, statusCode);
    }

    return this.createSuccessResponse(
      {
        message: result.message,
        user: result.data,
      },
      result.message
    );
  }

  /**
   * GET /users/paginated/:offset/:limit - Get users with pagination
   */
  private async getUsersPaginated({
    params: { offset, limit },
  }: {
    params: { offset: string; limit: string };
  }) {
    const offsetNum = parseInt(offset, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(offsetNum) || isNaN(limitNum)) {
      return this.createErrorResponse('Invalid pagination parameters', 400);
    }

    const result = await this.userService.getUsersPaginated(
      offsetNum,
      limitNum
    );

    if (result.error) {
      return this.createErrorResponse(result.error, 400);
    }

    return this.createSuccessResponse(result.data, result.message);
  }

  /**
   * Create a standardized success response
   * @param data Response data
   * @param message Success message
   * @param statusCode HTTP status code (default: 200)
   * @returns Response object
   */
  private createSuccessResponse(
    data: any,
    message?: string,
    statusCode: number = 200
  ) {
    const response = {
      success: true,
      data,
      ...(message && { message }),
    };

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Create a standardized error response
   * @param error Error message
   * @param statusCode HTTP status code
   * @returns Response object
   */
  private createErrorResponse(error: string, statusCode: number) {
    const response = {
      success: false,
      error,
    };

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
