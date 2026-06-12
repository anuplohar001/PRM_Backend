import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import { getTeamPermissions } from '../controllers/permissions.controllers'
import { addTeamMember, assignTeamToProject, createTeam, getAddTeamMemberList, getUserTeams, updateTeam, viewTeamDetails } from '../controllers/teams.controllers'
import { checkOrgPermissions, checkProjectPermissions, checkTeamPermissions } from '../middlewares/permission.middleware'
import { Action } from '../constants/Permissions'
const router = express.Router()

//Permissions
router.get(
    "/",
    authenticateUser,
    getUserTeams
)


router.get(
    "/permissions/:teamId",
    authenticateUser,
    getTeamPermissions("TEAM")
)

// router.get(
//     "/:organizationId",
//     authenticateUser,
//     // checkOrgPermissions(Action.GET_TEAMS),
//     getOrganizationTeams
// )

router.put(
    "/:teamId",
    authenticateUser,
    updateTeam
);
router.post(
    "/create",
    authenticateUser,
    // checkProjectPermissions(Action.CREATE_TEAM),
    createTeam
)

router.get(
    "/view-team/:teamId",
    authenticateUser,
    checkTeamPermissions(Action.VIEW_TEAM),
    viewTeamDetails
)
router.post(
    "/add-member",
    authenticateUser,
    // checkTeamPermissions(Action.ADD_TEAM_MEMBER),
    addTeamMember
)


router.get(
    "/get-add-team-member-list/:organizationId/:teamId",
    authenticateUser,
    checkTeamPermissions(Action.ADD_TEAM_MEMBER),
    getAddTeamMemberList
)


router.post(
    "/assign-team",
    authenticateUser,
    assignTeamToProject
);
export default router