import { Response } from "express"
import { prisma } from '../utils/prisma'
import { AuthRequest } from "../middlewares/auth.middleware"
import { Role } from "../constants/RoleHierarchy"
import asyncHandler from "../utils/async-handler"

export const getOrganizationProjects = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId
        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }
        const { organizationId } = req.params
        const projects = await prisma.projects.findMany({
            where: {
                organizationId: Number(organizationId)
            },
            include: {
                createdBy: true
            }
        })
        return res.status(201).json({
            message: "Project fetched successfully",
            data: {
                projects
            }
        })
    }
)

export const getProject = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId
        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }
        const { projectId } = req.params
        const project = await prisma.projects.findFirst({
            where: {
                id: Number(projectId)
            },
            include: {
                createdBy: true
            }
        })
        return res.status(201).json({
            message: "Project fetched successfully",
            data: {
                project
            }
        })
    }
)

export const createProject = asyncHandler(
    async (req:AuthRequest, res:Response) => {
        const { name, description, organizationId } = req.body
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }
        const project = await prisma.$transaction(async (tx) => {

            const proj = await tx.projects.create({
                data: {
                    name,
                    organizationId: parseInt(organizationId),
                    description,
                    status: "PLANNING",
                    createdById: userId,
                    updatedById: userId
                }
            })
            await tx.projectMembers.create({
                data: {
                    projectId: proj.id,
                    userId,
                    role: "PROJECT_ADMIN"
                }
            })

            await tx.policy.create({
                data: {
                    resourceId: proj.id,
                    resource: "PROJECT",
                    targetId: userId,
                    target: "USER",
                    effect: "ALLOW",
                    permissions: ["PROJECT_ADMIN_ACTIONS"]
                }
            })

            return proj
        })
        res.status(201).json({
            message: "Project created successfully",
            data: {
                project
            }
        })
    }
)

export const updateProject = asyncHandler(
    async (req:AuthRequest, res:Response) => {
        const { id, name, description, organizationId, status } = req.body
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }


        const existingProject = await prisma.projects.findUnique({
            where: { id }
        })

        if (!existingProject) {
            return res.status(404).json({ message: "Project not found" })
        }

        const project = await prisma.projects.update({
            where: { id },
            data: {
                name,
                description,
                organizationId: organizationId ? parseInt(organizationId) : undefined,
                status,
                updatedById: userId
            }
        })

        return res.status(200).json({
            message: "Project updated successfully",
            data:{
                project
            }
        })
    }
)

export const deleteProject = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { projectId } = req.params
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }


        const existingProject = await prisma.projects.findUnique({
            where: { id: Number(projectId) }
        })

        if (!existingProject) {
            return res.status(404).json({ message: "Project not found" })
        }

        await prisma.$transaction(async (tx) => {

            await tx.projectMembers.deleteMany({
                where: { projectId: Number(projectId) }
            })

            await tx.projects.delete({
                where: { id: Number(projectId) }
            })

        })

        return res.status(200).json({
            message: "Project deleted successfully"
        })
    }
)

export const getAssignedProject = asyncHandler(
    async (req: AuthRequest, res: Response) => {

        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }
        const projects = await prisma.projectMembers.findMany({
            where: {
                userId
            },
            include: {
                project: true
            }
        })
        res.status(201).json({
            message: "Project fetched successfully",
            data: {
                projects
            }
        })


    }
)

// Project Members Routes

export const getMembers = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId
        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }
        const { projectId } = req.params
        const members = await prisma.projectMembers.findMany({
            where: {
                projectId: Number(projectId)
            },
            include:{
                user: true
            }
        })
        return res.status(201).json({
            message: "Project members fetched successfully",
            data:{
                members
            }
        })
    }
)


export const addProjectMember = asyncHandler(
    async (req: AuthRequest, res: Response) => {

        console.log(req.body)
        const { projectId, memberId } = req.body
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }
        const existingMember = await prisma.projectMembers.findFirst({
            where: {
                projectId,
                userId: memberId
            }
        })

        if (existingMember) {
            return res.status(400).json({
                message: "User is already a member of this organization"
            })
        }
        const project = await prisma.projectMembers.create({
            data: {
                projectId,
                userId: memberId,
                role: 'PROJECT_MEMBER'
            }
        })

        res.status(201).json({
            message: "Project member added successfully",
            data:{
                projectMember: project
            }
        })


    }
)


export const updateProjectMemberRole = asyncHandler(
    async (
        req: AuthRequest,
        res: Response
    ) => {

        const { projectId, memberId, role } = req.body
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const membership = await prisma.projectMembers.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: memberId
                }
            }
        })

        if (!membership) {
            return res.status(404).json({
                message: "Organization member not found"
            })
        }

        const updatedMember = await prisma.projectMembers.update({
            where: {
                projectId_userId: {
                    projectId,
                    userId: memberId
                }
            },
            data: {
                role
            }
        })

        res.status(200).json({
            message: "Member role updated successfully",
            data:{
                updatedMember
            }
        })

    }
)


export const removeProjectMember = asyncHandler(
    async (req: AuthRequest, res: Response) => {

        const { projectId, memberId } = req.params
        if (!projectId || !memberId) {
            return res.status(400).json({
                success: false,
                message: "projectId and userId are required"
            })
        }

        const membership = await prisma.projectMembers.findUnique({
            where: {
                projectId_userId: {
                    projectId: Number(projectId),
                    userId: Number(memberId)
                }
            }
        })

        if (!membership) {
            return res.status(404).json({
                success: false,
                message: "Member not found in project"
            })
        }

        await prisma.projectMembers.delete({
            where: {
                projectId_userId: {
                    projectId: Number(projectId),
                    userId: Number(memberId)
                }
            }
        })

        return res.status(200).json({
            success: true,
            message: "Project member removed successfully"
        })


    }
)