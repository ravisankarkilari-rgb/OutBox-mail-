/**
 * Auth Service Unit Tests
 * Tests auth logic directly without HTTP layer (no port binding needed).
 */

jest.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    employee: {},
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
  connectDB: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');

// Load service AFTER mock is set up
let authService;
beforeAll(() => {
  authService = require('../services/auth.service');
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('AuthService', () => {
  const hashedPassword = bcrypt.hashSync('Admin@123', 10);

  const mockUser = {
    id: 'user-1',
    email: 'admin@company.com',
    password: hashedPassword,
    role: 'ADMIN',
    isActive: true,
    employee: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('login()', () => {
    it('should return tokens and safe user on valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await authService.login('admin@company.com', 'Admin@123');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('admin@company.com');
      expect(result.user.password).toBeUndefined(); // password stripped
    });

    it('should throw 401 on wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(authService.login('admin@company.com', 'WrongPass@1')).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('should throw 401 when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(authService.login('nobody@test.com', 'Admin@123')).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('should throw 401 when user is inactive', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });
      await expect(authService.login('admin@company.com', 'Admin@123')).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });

  describe('register()', () => {
    it('should create a new user and return safe user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'new-user',
        email: 'newuser@test.com',
        role: 'EMPLOYEE',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const user = await authService.register('newuser@test.com', 'NewUser@123');
      expect(user.email).toBe('newuser@test.com');
      expect(user.password).toBeUndefined();
    });

    it('should throw 409 for duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(authService.register('admin@company.com', 'Admin@123')).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe('getMe()', () => {
    it('should return user by ID without password', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, employee: null });
      const user = await authService.getMe('user-1');
      expect(user.id).toBe('user-1');
      expect(user.password).toBeUndefined();
    });

    it('should throw 404 for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(authService.getMe('bad-id')).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
