import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import { getProjectPermissions } from '../controllers/permissions.controllers'
import {
    checkOrgPermissions,
    checkProjectPermissions,
} from '../middlewares/permission.middleware'
import {
    createProject,
    deleteProject,
    getOrganizationProjects,
    viewProject,
    updateProject,
    updateProjectMemberRole,
    getAvailableTeams,
    getProjectMembers,
    manageProjectMember,
    manageProjectTeam
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
    // checkOrgPermissions(Action.GET_PROJECTS),
    getOrganizationProjects
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
    // checkProjectPermissions(Action.UPDATE_PROJECT),
    updateProject
)

router.delete(
    "/:projectId",
    authenticateUser,
    checkProjectPermissions(Action.DELETE_PROJECT),
    deleteProject
)




router.patch(
    "/update-member-role",
    authenticateUser,
    checkProjectPermissions(Action.UPDATE_PROJECT_MEMBER_ROLE),
    updateProjectMemberRole
)


router.post(
    "/manage-member",
    authenticateUser,
    manageProjectMember
);


router.get(
    "/available-teams/:projectId",
    authenticateUser,
    getAvailableTeams
);


router.get(
    "/available-members/:projectId",
    authenticateUser,
    getProjectMembers
);






router.post(
    "/manage-team",
    authenticateUser,
    manageProjectTeam
);
export default router