import { Response } from "express"
import { prisma } from '../utils/prisma'
import { AuthRequest } from "../middlewares/auth.middleware"
import { Role } from "../constants/RoleHierarchy"
import asyncHandler from "../utils/async-handler"
import { Action } from "../generated/prisma/enums"

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

export const getAddProjectMemberList = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" });
        }

        const { organizationId, projectId } = req.params;

        const members = await prisma.organizationMembers.findMany({
            where: {
                organizationId: Number(organizationId),

                // ❌ exclude users already in this project
                user: {
                    projectMemberships: {
                        none: {
                            projectId: Number(projectId),
                        },
                    },
                },
            },
            include: {
                user: true, // ✅ get user details
            },
        });

        return res.status(200).json({
            message: "Available members fetched successfully",
            data: {
                members,
            },
        });
    }
);

export const viewProject = asyncHandler(
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

export const getUserProjects = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" });
        }

        const { organizationId } = req.params;

        const projectMembers = await prisma.projectMembers.findMany({
            where: {
                userId: userId, // ✅ filter logged-in user
                organizationId: Number(organizationId),
            },
            include: {
                project: {
                    include: {
                        createdBy: true,
                    },
                },
            },
        });
        // ✅ extract only projects
        const projects = projectMembers.map((pm) => ({
            ...pm.project,
            role: pm.role,
        }));

        return res.status(200).json({
            message: "Projects fetched successfully",
            data: {
                projects,
            },
        });
    }
);

export const createProject = asyncHandler(
    async (req: AuthRequest, res: Response) => {
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
                    organizationId: Number(organizationId),
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
                    permissions: ["PROJECT_ADMIN_ACTIONS", "PROJECT_MEMBER_ACTIONS"]
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
    async (req: AuthRequest, res: Response) => {
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
            data: {
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
            include: {
                user: true
            }
        })
        return res.status(201).json({
            message: "Project members fetched successfully",
            data: {
                members
            }
        })
    }
)


export const addProjectMember = asyncHandler(
    async (req: AuthRequest, res: Response) => {

        const { projectId, memberId, organizationId } = req.body
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
                message: "User is already a member of this project"
            })
        }
        const project = await prisma.projectMembers.create({
            data: {
                projectId,
                userId: memberId,
                organizationId,
                role: 'PROJECT_MEMBER'
            }
        })

        await prisma.policy.create({
            data: {
                targetId: memberId,
                target: "USER",
                resource: "PROJECT",
                resourceId: projectId,
                effect: 'ALLOW',
                permissions: ['TEAM_MEMBER_ACTIONS', 'PROJECT_MEMBER_ACTIONS']
            }
        })

        res.status(201).json({
            message: "Project member added successfully",
            data: {
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

        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const { projectId, memberId, role } = req.body

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
                message: "Project member not exist"
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
        let newPermissions: Action[] = [];
        if (role === "PROJECT_ADMIN") {
            newPermissions = [Action.PROJECT_ADMIN_ACTIONS]
        } else {
            newPermissions = [Action.TEAM_MEMBER_ACTIONS]
        }
        const updatePolicy = await prisma.policy.update({
            where: {
                resourceId_targetId_resource: {
                    targetId: memberId,
                    resource: "PROJECT",
                    resourceId: projectId
                }
            },
            data: {
                permissions: newPermissions
            }
        })
        res.status(200).json({
            message: "Member role updated successfully",
            data: {
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


        await prisma.policy.delete({
            where: {
                resourceId_targetId_resource: {
                    targetId: Number(memberId),
                    resource: "PROJECT",
                    resourceId: Number(projectId)
                }
            }
        })

        return res.status(200).json({
            success: true,
            message: "Project member removed successfully"
        })


    }
)