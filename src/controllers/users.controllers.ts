import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import asyncHandler from '../utils/async-handler';







export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.createUser({
    ...req.body,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(201).json({
    success: true,
    data: user,
    message: 'User created successfully'
  });
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.loginUser({
    ...req.body,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });
 
  res.status(200).json({
    success: true,
    data: result,
    message: 'Login successful'
  });
});

// Get user profile
export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  const user = await userService.getUserProfile(userId);

  res.status(200).json({
    success: true,
    data: user,
    message: 'User profile retrieved successfully'
  });
});

// Update user profile
export const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  const updatedUser = await userService.updateUserProfile(userId, req.body);

  res.status(200).json({
    success: true,
    data: updatedUser,
    message: 'User profile updated successfully'
  });
});

// Get all users in an organization
export const getUsersByOrganizationId = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const parsedOrgId = Number(organizationId)
  if (isNaN(parsedOrgId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid organization ID'
    });
  }

  const users = await userService.getUsersByOrganizationId(parsedOrgId);

  res.status(200).json({
    success: true,
    data: { users },
    message: 'Users retrieved successfully'
  });
});

// Get all users
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId }= req.params
  const users = await userService.getAllUsers(Number(organizationId));

  res.status(200).json({
    success: true,
    data: { users },
    message: 'Users retrieved successfully'
  });
});

// Update user's last organization ID
export const updateLastOrganization = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  const { organizationId } = req.body;
  if (!organizationId || isNaN(Number(organizationId))) {
    return res.status(400).json({
      success: false,
      message: 'Valid organizationId is required'
    });
  }

  const updatedUser = await userService.updateLastOrganizationId(userId, Number(organizationId));

  res.status(200).json({
    success: true,
    data: updatedUser,
    message: 'Last organization updated successfully'
  });
});