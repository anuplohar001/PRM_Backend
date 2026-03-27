import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import { checkOrgPermissions, checkProjectPermissions, requireProjRole } from '../middlewares/permission.middleware'
import { addProjectMember, createProject, deleteProject, getAssignedProject, removeProjectMember, updateProject, updateProjectMemberRole } from '../controllers/project.controllers'
import { Action } from '../constants/Permissions'

const router = express.Router()

router.post(
    "/create",
    authenticateUser,
    checkOrgPermissions(Action.CREATE_PROJECT),
    createProject
)


router.put(
    "/:projectId",
    authenticateUser,
    checkProjectPermissions(Action.UPDATE_PROJECT),
    updateProject
)

router.delete(
    "/:projectId",
    authenticateUser,
    checkProjectPermissions(Action.DELETE_PROJECT),
    deleteProject
)


//Project Member Routes

router.get(
    "/get-assigned-projects",
    authenticateUser,
    getAssignedProject
)

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

router.delete(
    "/:projectId/:memberId",
    authenticateUser,
    requireProjRole("PROJECT_ADMIN"),
    removeProjectMember
)

export default router