import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import { addOrganizationMember, createOrganization, updateOrganizationMemberRole } from '../controllers/organization.controller'
import { requireOrgRole } from '../middlewares/permission.middleware'

const router = express.Router()

router.post(
    "/create",
    authenticateUser,
    createOrganization
)

router.post(
    "/add-member",
    authenticateUser,
    requireOrgRole("ORG_ADMIN"),
    addOrganizationMember
)

router.patch(
    "/update-member-role",
    authenticateUser,
    requireOrgRole("ORG_ADMIN"),
    updateOrganizationMemberRole
)

export default router