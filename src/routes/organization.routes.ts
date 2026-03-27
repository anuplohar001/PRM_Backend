import express from 'express'
import { authenticateUser } from '../middlewares/auth.middleware'
import { addOrganizationMember, createOrganization, createUserFromOrg, getOrganizationMembers, getOrganizationsOfUser, updateOrganizationMemberRole } from '../controllers/organization.controller'
import { checkOrgPermissions } from '../middlewares/permission.middleware'
import { Action } from '../constants/Permissions'
import { getPermissions } from '../controllers/permissions.controller'

const router = express.Router()

router.post(
    "/create",
    authenticateUser,
    createOrganization
)

router.get(
    "/get-organizations",
    authenticateUser,
    checkOrgPermissions(Action.GET_ORGANIZATIONS),
    getOrganizationsOfUser
)

//Permissions
router.get( 
    "/permissions/:organizationId",
    authenticateUser,
    getPermissions("ORGANIZATION")
)

router.get(
    "/get-members/:organizationId",
    authenticateUser,
    checkOrgPermissions(Action.GET_MEMBERS_LIST),
    getOrganizationMembers
)


router.post(
    "/create-user",
    authenticateUser,
    checkOrgPermissions(Action.CREATE_USER),
    createUserFromOrg
)
router.post(
    "/add-member",
    authenticateUser,
    checkOrgPermissions(Action.ADD_MEMBER),
    addOrganizationMember
)

router.patch(
    "/update-member-role",
    authenticateUser,
    checkOrgPermissions(Action.CHANGE_MEMBER_ROLE),
    updateOrganizationMemberRole
)

export default router