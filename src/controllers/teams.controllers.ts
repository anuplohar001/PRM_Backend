import asyncHandler from "../utils/async-handler"
import { Response } from "express"
import { prisma } from '../utils/prisma'
import { AuthRequest } from "../middlewares/auth.middleware"
import { Action } from "../generated/prisma/enums"
import { getActionsPerPolicy } from "../constants/Permissions"
import { getProjectContext } from "../utils/getProjectContext"
import { createActivity } from "../utils/createActivity"
import { projectService } from "../services/team.service"



export const getUserTeams = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            })
        }

        const teams = await prisma.team.findMany({
            where: {
                members: {
                    some: {
                        userId
                    }
                }
            },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                projects: {
                    include:{
                        project: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        return res.status(200).json({
            success: true,
            message: "Teams fetched successfully",
            data: {
                teams
            }
        })
    }
)



export const createTeam = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { name, organizationId, createdById } = req.body
        const userId = req.user?.userId
        const creator = Number(createdById)
        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }

        const team = await prisma.$transaction(async (tx) => {

            const newTeam = await tx.team.create({
                data: {
                    name,
                    organizationId: Number(organizationId),
                    createdById: creator,
                    updatedById: creator
                }
            })

            // Add creator as TEAM_ADMIN
            await tx.teamMember.create({
                data: {
                    teamId: newTeam.id,
                    userId,
                    role: "TEAM_ADMIN",
                    addedById: userId
                }
            })


            await tx.workFlow.createMany({
                data: [
                    {
                        name: "To Do",
                        position: 1,
                        description: "Tasks yet to be started",
                        teamId: newTeam.id,
                    },  
                    {
                        name: "In Progress",
                        position: 2,
                        description: "Tasks currently in progress",
                        teamId: newTeam.id,
                    },
                    {
                        name: "Done",
                        position: 3,
                        description: "Completed tasks",
                        teamId: newTeam.id,
                    },
                ],
            });
            // OPTIONAL: policy (if you use same system as project)
            await tx.policy.create({
                data: {
                    resourceId: newTeam.id,
                    resource: "TEAM",
                    targetId: userId,
                    target: "USER",
                    effect: "ALLOW",
                    permissions: ["TEAM_ADMIN_ACTIONS", "TEAM_MEMBER_ACTIONS"]
                }
            })

            return newTeam
        })


        // await createActivity({
        //     actorId: userId,
        //     action: "CREATE_TEAM",
        //     module: "team",
        //     entityId: team.id,
        //     entityType: "TEAM",
        //     metadata: {
        //         title: team.name
        //     }
        // });

        res.status(201).json({
            success: true,
            message: "Team created successfully",
            data: {
                team
            }
        })
    }
)


export const viewTeamDetails = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { teamId } = req.params
        const userId = req.user?.userId
        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }

        const team = await prisma.team.findUnique({
            where: {
                id: Number(teamId)
            },
            include: {
                createdBy: true,
                updatedBy: true,
                projects:{
                    include:{
                        project: true
                    }
                }
            }
        })
        if (req.permissions?.includes(Action.TEAM_ADMIN_ACTIONS) || req.permissions?.includes(Action.PROJECT_ADMIN_ACTIONS)) {
            const teamMembers = await prisma.teamMember.findMany({
                where: {
                    teamId: team?.id
                },
                include: {
                    member: true
                }
            })
            res.status(201).json({
                success: true,
                message: "Team and members fetched successfully",
                data: {
                    team,
                    fullTeamAccess: true,
                    teamMembers
                }
            })
        } else {

            res.status(201).json({
                success: true,
                message: "Team fetched successfully",
                data: {
                    team
                }
            })
        }

    }
)

export const getAddTeamMemberList = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            })
        }

        const { organizationId, teamId } = req.params

        const members = await prisma.organizationMembers.findMany({
            where: {
                organizationId: Number(organizationId),

                userId: {
                    notIn: (
                        await prisma.teamMember.findMany({
                            where: {
                                teamId: Number(teamId)
                            },
                            select: {
                                userId: true
                            }
                        })
                    ).map((member) => member.userId)
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            },
            orderBy: {
                joinedAt: "desc"
            }
        })

        return res.status(200).json({
            success: true,
            message: "Available team members fetched successfully",
            data: {
                members
            }
        })
    }
)

export const addTeamMember = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { teamId, memberId, role } = req.body
        const addedById = req.user?.userId

        if (!addedById) {
            return res.status(401).json({ message: "Unauthorised" })
        }

        const team = await prisma.team.findUnique({
            where: { id: Number(teamId) }
        })

        if (!team) {
            return res.status(404).json({ message: "Team not found" })
        }


        const existingTeam = await prisma.teamMember.findMany({
            where: { teamId: Number(teamId), userId: Number(memberId) },
            include: {
                team: true
            }
        })
        if (existingTeam.length) {
            return res.status(201).json({
                success: true,
                message: "User is already a member of following team",
                data: {
                    member: existingTeam,
                    available: false
                }
            })
        }

        try {
            const member = await prisma.teamMember.create({
                data: {
                    teamId: Number(teamId),
                    userId: Number(memberId),
                    role: role || "TEAM_MEMBER",
                    addedById
                }
            })
            await prisma.policy.create({
                data: {
                    resourceId: Number(teamId),
                    resource: "TEAM",
                    targetId: Number(memberId),
                    target: "USER",
                    effect: "ALLOW",
                    permissions: ["TEAM_MEMBER_ACTIONS"]
                }
            })
            return res.status(201).json({
                success: true,
                message: "Team member added successfully",
                data: {
                    member
                }
            })

        } catch (error: any) {
            // Handle duplicate member
            if (error.code === "P2002") {
                return res.status(400).json({
                    message: "User is already a member of this team"
                })
            }

            throw error
        }
    }
)




export const assignTeamToProject = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { projectId, teamId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorised",
            });
        }

        if (!projectId || !teamId) {
            return res.status(400).json({
                success: false,
                message: "Project ID and Team ID are required",
            });
        }

        const existingAssignment =
            await prisma.projectTeam.findFirst({
                where: {
                    projectId: Number(projectId),
                    teamId: Number(teamId),
                },
            });

        if (existingAssignment) {
            return res.status(409).json({
                success: false,
                message: "Team is already assigned to this project",
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
            data: {
                projectTeam,
            },
        });
    }
);




export const updateTeam = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { teamId } = req.params;
        const { name } = req.body;

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorised",
            });
        }

        if (!teamId || isNaN(Number(teamId))) {
            return res.status(400).json({
                success: false,
                message: "Valid teamId is required",
            });
        }

        if (!name?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Team name is required",
            });
        }

        const existingTeam = await prisma.team.findUnique({
            where: {
                id: Number(teamId),
            },
        });

        if (!existingTeam) {
            return res.status(404).json({
                success: false,
                message: "Team not found",
            });
        }

        const team = await prisma.team.update({
            where: {
                id: Number(teamId),
            },
            data: {
                name: name.trim(),
                updatedById: userId,
            },
        });

        res.status(200).json({
            success: true,
            message: "Team updated successfully",
            data: {
                team,
            },
        });
    }
);