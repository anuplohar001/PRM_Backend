import { prisma } from '../utils/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createActivity } from '../utils/createActivity';

export class UserService {
  /**
   * Create a new user
   * @param userData - User creation data
   * @returns Created user object (without password)
   */
  async createUser(userData: {
    email: string;
    name: string;
    role: string;
    password: string;
    confirmPassword: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Validation
    if (userData.password !== userData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
   
    // Create user
    const newUser = await prisma.users.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role
      }
    });

    // Log activity
    // await createActivity({
    //   entityId: newUser.id,
    //   action: "CREATE_USER",
    //   // ipAddress: userData.ipAddress || '',
    //   // userAgent: userData.userAgent || ''
    // });

    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  /**
   * Login user
   * @param loginData - Login credentials
   * @returns Object containing token and user data
   */
  async loginUser(loginData: {
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Find user
    const user = await prisma.users.findUnique({
      where: { email: loginData.email },
      include:{
        organizationMemberships:{
          include: {
            organization:{
              select:{
                id:true,
                name:true
              }
            },            
          }
        },
        lastOrganization: {
          select:{
            id:true,
            name:true
          }
        }
      }
    });
    
    if (!user) {
      throw new Error('User not found');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(
      loginData.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role},
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    // Log activity
    // await createActivity({
    //   userId: user.id,
    //   action: 'USER_LOGIN',
    //   description: `User ${user.email} logged in`,
    //   ipAddress: loginData.ipAddress || '',
    //   userAgent: loginData.userAgent || ''
    // });


    // Return user without password
    const { password, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  }

  /**
   * Get user profile
   * @param userId - User ID
   * @returns User profile data
   */
  async getUserProfile(userId: number) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   * @param userId - User ID
   * @param updateData - Data to update
   * @returns Updated user object
   */
  async updateUserProfile(userId: number, updateData: {
    name?: string;
    email?: string;
  }) {
    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // If email is being updated, check if it's already taken
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await prisma.users.findUnique({
        where: { email: updateData.email }
      });

      if (existingUser) {
        throw new Error('Email already exists');
      }
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        name: updateData.name,
        email: updateData.email
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return updatedUser;
  }

  /**
   * Get all users in an organization
   * @param organizationId - Organization ID
   * @returns Array of users with their organization membership details
   */
  async getUsersByOrganizationId(organizationId: number) {
    // Verify organization exists
    const organization = await prisma.organizations.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Get all organization members with user details
    const organizationMembers = await prisma.organizationMembers.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    // Extract user data from organization members
    const users = organizationMembers.map(member => ({
      ...member.user,
      organizationRole: member.role,
      joinedAt: member.joinedAt
    }));

    return users;
  }

  /**
   * Get all users
   * @returns Array of all users
   */
  async getAllUsers(organizationId: number) {
    const users = await prisma.users.findMany({
      where: {
        organizationMemberships: {
          none: {
            organizationId,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return users;
  }

  /**
   * Update user's last organization ID
   * @param userId - User ID
   * @param organizationId - Organization ID to set as last used
   * @returns Updated user object
   */
  async updateLastOrganizationId(userId: number, organizationId: number) {
    // Verify organization exists
    const organization = await prisma.organizations.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Verify user is a member of the organization
    const membership = await prisma.organizationMembers.findFirst({
      where: {
        userId,
        organizationId
      }
    });

    if (!membership) {
      throw new Error('User is not a member of this organization');
    } 

    // Update user's lastOrganizationId
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        lastOrganizationId: organizationId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastOrganizationId: true
      }
    });

    return updatedUser;
  }
}

// Export a singleton instance
export const userService = new UserService();