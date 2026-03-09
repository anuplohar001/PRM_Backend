import { Response } from "express"
import { prisma } from '../utils/prisma'
import { AuthRequest } from "../middlewares/auth.middleware"
import { Role } from "../constants/RoleHierarchy"



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

            await tx.organizationMembers.create({
                data: {
                    organizationId: org.id,
                    userId,
                    role: "ORG_OWNER"
                }
            })

            return org
        })

        res.status(201).json({
            message: "Organization created successfully",
            organization
        })

    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
}

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

export const updateOrganizationMemberRole = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { organizationId, memberId, role } = req.body
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" })
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

        res.status(200).json({
            message: "Member role updated successfully",
            updatedMember
        })
    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
}


