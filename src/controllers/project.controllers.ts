import { Response } from "express"
import { prisma } from '../utils/prisma'
import { AuthRequest } from "../middlewares/auth.middleware"
import { Role } from "../constants/RoleHierarchy"



export const createProject = async (req: AuthRequest, res: Response) => {
    try {

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

            // return proj
        })
        console.log(project)
        res.status(201).json({
            message: "Project created successfully",
            project
        })

    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
}

export const updateProject = async (req: AuthRequest, res: Response) => {
    try {
        // const { projectId } = req.params
        console.log(req.params)
        const {id, name, description, organizationId, status } = req.body
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
            project
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

export const deleteProject = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }

        const id = 1

        const existingProject = await prisma.projects.findUnique({
            where: { id }
        })

        if (!existingProject) {
            return res.status(404).json({ message: "Project not found" })
        }

        await prisma.$transaction(async (tx) => {

            await tx.projectMembers.deleteMany({
                where: { projectId: id }
            })

            await tx.projects.delete({
                where: { id }
            })

        })

        return res.status(200).json({
            message: "Project deleted successfully"
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

export const getAssignedProject = async (req: AuthRequest, res: Response) => {
    try {
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
            data: projects
        })

    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
}

// Project Members Routes
export const addProjectMember = async (req: AuthRequest, res: Response) => {
    try {
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
            project
        })

    } catch (error) {
        res.status(500).json({ message: "Internal server erroreeee" })
    }
}


export const updateProjectMemberRole = async (
    req: AuthRequest,
    res: Response
) => {
    try {
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
            updatedMember
        })
    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
}


export const removeProjectMember = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId, memberId } = req.params
        console.log(req.params)
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

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}