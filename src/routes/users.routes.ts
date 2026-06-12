import express from 'express';
import { validateUserCreation, validateUserLogin } from '../middlewares/validation.middleware';
import { createUserLimiter, authLimiter } from '../middlewares/rateLimit.middleware';
import { authenticateUser } from '../middlewares/auth.middleware';
import { checkOrgPermissions } from '../middlewares/permission.middleware';
import { createUser, loginUser, getUserProfile, updateUserProfile, getUsersByOrganizationId, getAllUsers, updateLastOrganization } from '../controllers/users.controllers';

const router = express.Router();

// Public endpoints with rate limiting and validation
router.post('/create',
  createUserLimiter,
  validateUserCreation,
  createUser
);

router.post('/login',
  authLimiter,
  validateUserLogin,
  loginUser
);

// Protected endpoints
router.get('/profile',
  authenticateUser,
  checkOrgPermissions('VIEW_ORG'), // This would need to be adjusted based on actual permission needs
  getUserProfile
);

router.put('/profile',
  authenticateUser,
  checkOrgPermissions('EDIT_ORG_PROFILE'), // This would need to be adjusted based on actual permission needs
  updateUserProfile
);

// Get all users in an organization
// router.get('/',
//   authenticateUser,
//   checkOrgPermissions('GET_MEMBERS_LIST'), // Permission to view organization members
//   getUsersByOrganizationId
// );

// Get all users
router.get('/:organizationId', authenticateUser, getAllUsers);

// Update user's last organization ID
router.patch('/last-organization', authenticateUser, updateLastOrganization);

export default router;