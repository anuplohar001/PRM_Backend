import { Response } from "express"
import { prisma } from '../utils/prisma'
import { AuthRequest } from "../middlewares/auth.middleware"
import { Role } from "../constants/RoleHierarchy"
import asyncHandler from "../utils/async-handler"
import { Action } from "../generated/prisma/enums"
import { projectService } from "../services/team.service"
import { userHoverCardSelect } from "../utils/userProjections"

export const getOrganizationProjects = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorised",
            });
        }

        const { organizationId } = req.params;
        if (!organizationId) {
            return res.status(401).json({
                success: false,
                message: "Organization id is required",
            });
        }
        const projects = await prisma.projects.findMany({
            where: {
                organizationId: Number(organizationId),

                members: {
                    some: {
                        userId,
                    },
                },
            },

            include: {
                createdBy: {
                    select: userHoverCardSelect,
                },

            },
        });

        return res.status(200).json({
            success: true,
            message: "Projects fetched successfully",
            data: {
                projects,
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
                createdBy: true,
                members: {
                    include: {
                        user: {
                            select: userHoverCardSelect,
                        },

                    },
                },
                teams: {
                    include: {
                        team: true
                    }
                }
            }
        })
        return res.status(201).json({
            success: true,
            message: "Project fetched successfully",
            data: {
                project
            }
        })
    }
)


export const createProject = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { name, description, organizationId, teamIds } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" });
        }

        // Validate teamIds if provided
        if (teamIds && !Array.isArray(teamIds)) {
            return res.status(400).json({
                success: false,
                message: "teamIds must be an array"
            });
        }

        // Validate each teamId is a number
        if (teamIds) {
            for (const teamId of teamIds) {
                if (typeof teamId !== 'number' || isNaN(teamId)) {
                    return res.status(400).json({
                        success: false,
                        message: "Each teamId must be a valid number"
                    });
                }
            }
        }

        const project = await prisma.$transaction(async (tx) => {
            const proj = await tx.projects.create({
                data: {
                    name,
                    organizationId: parseInt(organizationId),
                    description,
                    status: "PLANNING",
                    createdById: userId,
                    updatedById: userId,
                },
            });

            await tx.projectMembers.create({
                data: {
                    projectId: proj.id,
                    organizationId: Number(organizationId),
                    userId,
                    role: "PROJECT_ADMIN",
                },
            });

            await tx.policy.create({
                data: {
                    resourceId: proj.id,
                    resource: "PROJECT",
                    targetId: userId,
                    target: "USER",
                    effect: "ALLOW",
                    permissions: [
                        "PROJECT_ADMIN_ACTIONS",
                        "PROJECT_MEMBER_ACTIONS",
                    ],
                },
            });

            // Create project-team associations if teamIds are provided
            if (teamIds && teamIds.length > 0) {
                const projectTeamPromises = teamIds.map((teamId: number) =>
                    tx.projectTeam.create({
                        data: {
                            projectId: proj.id,
                            teamId: Number(teamId),
                            assignedById: userId,
                        }
                    })
                );
                await Promise.all(projectTeamPromises);
            }

            // ✅ Create default workflows


            return proj;
        });

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            data: {
                project,
            },
        });
    }
);

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
            success: true,
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


export const manageProjectTeam = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { projectId, teamId, action } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!projectId || !teamId) {
            return res.status(400).json({
                success: false,
                message: "Project ID and Team ID are required",
            });
        }

        if (action === "assign") {
            const existingAssignment = await prisma.projectTeam.findUnique({
                where: {
                    projectId_teamId: {
                        projectId: Number(projectId),
                        teamId: Number(teamId),
                    },
                },
            });

            if (existingAssignment) {
                return res.status(400).json({
                    success: false,
                    message: "Team is already assigned to the project",
                });
            }

            const projectTeam = await prisma.projectTeam.create({
                data: {
                    projectId: Number(projectId),
                    teamId: Number(teamId),
                    assignedById: userId,
                },
            });

            return res.status(201).json({
                success: true,
                message: "Team assigned successfully",
                data: projectTeam,
            });
        }

        if (action === "detach") {
            await prisma.projectTeam.delete({
                where: {
                    projectId_teamId: {
                        projectId: Number(projectId),
                        teamId: Number(teamId),
                    },
                },
            });

            return res.status(200).json({
                success: true,
                message: "Team detached successfully",
            });
        }

        return res.status(400).json({
            success: false,
            message: "Invalid action",
        });
    }
);

// Project Members Routes




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




export const manageProjectMember = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const {
            projectId,
            memberId,
            organizationId,
            action,
        } = req.body;

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorised",
            });
        }

        if (
            !projectId ||
            !memberId ||
            !["add", "remove"].includes(action)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "projectId, memberId and valid action are required",
            });
        }

        if (action === "add") {
            const existingMember =
                await prisma.projectMembers.findFirst({
                    where: {
                        projectId: Number(projectId),
                        userId: Number(memberId),
                    },
                });

            if (existingMember) {
                return res.status(400).json({
                    success: false,
                    message:
                        "User is already a member of this project",
                });
            }

            const [projectMember] = await prisma.$transaction([
                prisma.projectMembers.create({
                    data: {
                        projectId: Number(projectId),
                        userId: Number(memberId),
                        organizationId: Number(
                            organizationId
                        ),
                        addedById: userId,
                        role: "PROJECT_MEMBER",
                    },
                }),

                prisma.policy.create({
                    data: {
                        targetId: Number(memberId),
                        target: "USER",
                        resource: "PROJECT",
                        resourceId: Number(projectId),
                        effect: "ALLOW",
                        permissions: [
                            "PROJECT_MEMBER_ACTIONS",
                        ],
                    },
                }),
            ]);

            return res.status(201).json({
                success: true,
                message:
                    "Project member added successfully",
                data: {
                    projectMember,
                },
            });
        }

        const membership =
            await prisma.projectMembers.findUnique({
                where: {
                    projectId_userId: {
                        projectId: Number(projectId),
                        userId: Number(memberId),
                    },
                },
            });

        if (!membership) {
            return res.status(404).json({
                success: false,
                message: "Member not found in project",
            });
        }

        await prisma.$transaction([
            prisma.projectMembers.delete({
                where: {
                    projectId_userId: {
                        projectId: Number(projectId),
                        userId: Number(memberId),
                    },
                },
            }),

            prisma.policy.delete({
                where: {
                    resourceId_targetId_resource: {
                        targetId: Number(memberId),
                        resource: "PROJECT",
                        resourceId: Number(projectId),
                    },
                },
            }),
        ]);

        return res.status(200).json({
            success: true,
            message:
                "Project member removed successfully",
        });
    }
);






export const getAvailableTeams = asyncHandler(
    async (req, res) => {
        const projectId = Number(req.params.projectId);

        const teams = await projectService.getAvailableTeams(
            projectId
        );
        res.status(200).json({
            success: true,
            data: {
                teams,
            },
            message: "Available teams fetched successfully",
        });
    }
);



export const getProjectMembers = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const projectId = Number(req.params.projectId);

        if (!projectId || isNaN(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Valid projectId is required",
            });
        }

        const projectTeams = await prisma.projectTeam.findMany({
            where: {
                projectId,
            },
            select: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        members: {
                            select: {
                                id: true,
                                member: {
                                    select: userHoverCardSelect,
                                },
                            },
                        },
                    },
                },
            },
        });

        const membersMap = new Map();

        projectTeams.forEach((projectTeam) => {
            projectTeam.team.members?.forEach(
                (teamMember) => {
                    const member = teamMember.member;

                    if (!membersMap.has(member.id)) {
                        membersMap.set(member.id, member);
                    }
                }
            );
        });

        const members = Array.from(
            membersMap.values()
        );

        res.status(200).json({
            success: true,
            message: "Project members fetched successfully",
            data: {
                members,
            },
        });
    }
);