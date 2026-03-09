import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import { requireProjRole } from '../middlewares/permission.middleware'
import { addProjectMember, createProject } from '../controllers/project.controllers'

const router = express.Router()

router.post(
    "/create",
    authenticateUser,
    createProject
)

router.post(
    "/add-member",
    authenticateUser,
    requireProjRole("PROJECT_ADMIN"),
    addProjectMember
)

// router.patch(
//     "/update-member-role",
//     authenticateUser,
//     requireOrgRole("ORG_ADMIN"),
//     updateOrganizationMemberRole
// )

export default router