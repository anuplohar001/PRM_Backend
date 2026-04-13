import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import { getTeamPermissions } from '../controllers/permissions.controllers'
import { addTeamMember, createTeam, getAddTeamMemberList, getOrganizationTeams, viewTeamDetails } from '../controllers/teams.controllers'
import { checkOrgPermissions, checkProjectPermissions, checkTeamPermissions } from '../middlewares/permission.middleware'
import { Action } from '../constants/Permissions'
const router = express.Router()

//Permissions
router.get(
    "/permissions/:teamId",
    authenticateUser,
    getTeamPermissions("TEAM")
)

router.get(
    "/:organizationId",
    authenticateUser,
    checkOrgPermissions(Action.GET_TEAMS),
    getOrganizationTeams
)


router.post(
    "/create",
    authenticateUser,
    checkProjectPermissions(Action.CREATE_TEAM),
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
    checkTeamPermissions(Action.ADD_TEAM_MEMBER),
    addTeamMember
)


router.get(
    "/get-add-team-member-list/:organizationId/:projectId/:teamId",
    authenticateUser,
    checkTeamPermissions(Action.ADD_TEAM_MEMBER),
    getAddTeamMemberList
)
export default router