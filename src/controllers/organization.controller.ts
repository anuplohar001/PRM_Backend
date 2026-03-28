import { Response } from "express"
import { prisma } from '../utils/prisma'
import { AuthRequest } from "../middlewares/auth.middleware"
import { Role } from "../constants/RoleHierarchy"
import asyncHandler from "../utils/async-handler"
import bcrypt from 'bcrypt'
import { Action } from "../generated/prisma/enums"


export const createOrganization = async (req: AuthRequest, res: Response) => {
    try {

        const { name, description } = req.body
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }
        const organization = await prisma.$transaction(async (tx) => {

            const org = await tx.organizations.create({
                data: {
                    name,
                    description,
                    createdById: userId,
                    updatedById: userId
                }
            })

            const orgMember = await tx.organizationMembers.create({
                data: {
                    organizationId: org.id,
                    userId,
                    addedById: userId,
                    role: "ORG_OWNER"
                },
                include: {
                    organization: true
                }
            })

            const createPolicy = await tx.policy.create({
                data: {
                    resource: "ORGANIZATION",
                    resourceId: org.id,
                    target: "USER",
                    targetId: userId,
                    effect: "ALLOW",
                    permissions: ['ORG_OWNER_ACTIONS', "ORG_ADMIN_ACTIONS"]
                }
            })
            return { organization: orgMember, permissions: createPolicy }
        })

        res.status(201).json({
            message: "Organization created successfully",
            data: organization
        })

    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
}

export const getOrganizationsOfUser = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }
        const existingOrgs = await prisma.organizationMembers.findMany({
            where: {
                userId
            },
            include: {
                organization: true
            }
        })

        res.status(201).json({
            message: "Organizations fetched successfully",
            data: existingOrgs
        })

    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
}

export const getOrganizationMembers = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId
        const { organizationId } = req.params
        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }
        const members = await prisma.organizationMembers.findMany({
            where: {
                organizationId: Number(organizationId)
            },
            include: { user: true, addedBy: true }
        })

        res.status(201).json({
            access: true,
            message: "Organizations members fetched successfully",
            data: {
                members
            }
        })

    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
}


export const createUserFromOrg = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId
        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }
        const { email, name, description, password, confirmPassword, organizationId } = req.body

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match"
            })
        }

        const existingUser = await prisma.users.findUnique({
            where: { email }
        })

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await prisma.users.create({
            data: {
                email,
                name,
                description,
                createdById: Number(userId),
                updatedById: Number(userId),
                password: hashedPassword,
                role: 'USER'
            }
        })
        const orgMember = await prisma.organizationMembers.create({
            data: {
                userId: newUser?.id,
                organizationId,
                addedById: userId,
                role: 'ORG_MEMBER'
            }
        })

        await prisma.policy.create({
            data: {
                targetId: newUser?.id,
                target: "USER",
                resource: "ORGANIZATION",
                resourceId: Number(organizationId),
                effect: 'ALLOW',
                permissions: ['TEAM_MEMBER_ACTIONS']
            }
        })

        return res.status(201).json(newUser)
    }
)





export const addOrganizationMember = async (req: AuthRequest, res: Response) => {
    try {
        const { organizationId, memberId } = req.body
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }
        const existingMember = await prisma.organizationMembers.findFirst({
            where: {
                organizationId,
                userId: memberId
            }
        })

        if (existingMember) {
            return res.status(400).json({
                message: "User is already a member of this organization"
            })
        }
        const organization = await prisma.organizationMembers.create({
            data: {
                organizationId,
                userId: memberId,
                role: "ORG_MEMBER"
            }
        })

        res.status(201).json({
            message: "Organization member added successfully",
            organization
        })

    } catch (error) {
        res.status(500).json({ message: "Internal server erroreeee" })
    }
}


export const updateOrganizationMemberRole = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { organizationId, memberId, role } = req.body
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" })
        }
        if (role === "ORG_OWNER") {
            return res.status(401).json({ message: "You cannot change role of owner of organization" })
        }
        const membership = await prisma.organizationMembers.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId: memberId
                }
            }
        })

        if (!membership) {
            return res.status(404).json({
                message: "Organization member not found"
            })
        }

        const updatedMember = await prisma.organizationMembers.update({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId: memberId
                }
            },
            data: {
                role: role as Role
            }
        })
        let newPermissions: Action[] = [];
        if (role === "ORG_ADMIN") {
            newPermissions = [Action.ORG_ADMIN_ACTIONS]
        } else {
            newPermissions = [Action.TEAM_MEMBER_ACTIONS]
        }
        const updatePolicy = await prisma.policy.update({
            where: {
                resourceId_targetId_resource: {
                    targetId: memberId,
                    resource: "ORGANIZATION",
                    resourceId: organizationId
                }
            },
            data: {
                permissions: newPermissions
            }
        })

        res.status(200).json({
            message: "Member role updated successfully",
            updatedMember
        })
    }
)




