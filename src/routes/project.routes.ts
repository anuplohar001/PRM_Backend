import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import { getProjectPermissions } from '../controllers/permissions.controllers'
import {
    checkOrgPermissions,
    checkProjectPermissions,
    requireProjRole
} from '../middlewares/permission.middleware'
import {
    addProjectMember,
    createProject,
    deleteProject,
    getAddProjectMemberList,
    getMembers,
    getOrganizationProjects,
    viewProject,
    getUserProjects,
    removeProjectMember,
    updateProject,
    updateProjectMemberRole
} from '../controllers/project.controllers'

import { Action } from '../constants/Permissions'

const router = express.Router()

//Permissions
router.get(
    "/permissions/:projectId",
    authenticateUser,
    getProjectPermissions("PROJECT")
)

router.get(
    "/:organizationId",
    authenticateUser,
    checkOrgPermissions(Action.GET_PROJECTS),
    getOrganizationProjects
)

router.get(
    "/get-my-projects/:organizationId",
    authenticateUser,
    getUserProjects
)
router.get(
    "/get-add-project-member-list/:organizationId/:projectId",
    authenticateUser,
    checkProjectPermissions(Action.ADD_PROJECT_MEMBER),
    getAddProjectMemberList
)

router.get(
    "/view-project/:projectId",
    authenticateUser,
    // checkProjectPermissions(Action.GET_PROJECT),
    checkProjectPermissions(Action.VIEW_PROJECT),
    viewProject
)

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
    "/get-members/:projectId",
    authenticateUser,
    checkProjectPermissions(Action.PROJECT_MEMBERS_LIST),
    getMembers
)

router.post(
    "/add-member",
    authenticateUser,
    checkProjectPermissions(Action.ADD_PROJECT_MEMBER),
    addProjectMember
)

router.patch(
    "/update-member-role",
    authenticateUser,
    checkProjectPermissions(Action.UPDATE_PROJECT_MEMBER_ROLE),
    updateProjectMemberRole
)

router.delete(
    "/remove-member/:projectId/:memberId",
    authenticateUser,
    checkProjectPermissions(Action.REMOVE_PROJECT_MEMBER),
    removeProjectMember
)

export default router