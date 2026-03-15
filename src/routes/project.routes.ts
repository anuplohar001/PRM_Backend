import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import { requireOrgRole, requireProjRole } from '../middlewares/permission.middleware'
import { addProjectMember, createProject, deleteProject, updateProject, updateProjectMemberRole } from '../controllers/project.controllers'

const router = express.Router()

router.post(
    "/create",
    authenticateUser,
    requireOrgRole("ORG_ADMIN"),
    createProject
)


router.put(
    "/:projectId",
    authenticateUser,
    requireProjRole("PROJECT_ADMIN"),
    updateProject
)

router.delete(
    "/:projectId",
    authenticateUser,
    requireProjRole("PROJECT_ADMIN"),
    deleteProject
)


//Project Member Routes

router.post(
    "/add-member",
    authenticateUser,
    requireProjRole("PROJECT_ADMIN"),
    addProjectMember
)

router.patch(
    "/update-member-role",
    authenticateUser,
    requireProjRole("PROJECT_ADMIN"),
    updateProjectMemberRole
)

export default router