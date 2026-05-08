import asyncHandler from "../utils/async-handler"
import { Response } from "express"
import { prisma } from '../utils/prisma'
import { AuthRequest } from "../middlewares/auth.middleware"
import { Action } from "../generated/prisma/enums"
import { getActionsPerPolicy } from "../constants/Permissions"
import { getProjectContext } from "../utils/getProjectContext"
import { createActivity } from "../utils/createActivity"




export const getOrganizationTeams = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId
        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" })
        }
        const policies = await prisma.policy.findMany({
            where: {
                targetId: userId
            }
        })
        const policiesWithActions = getActionsPerPolicy(policies || [])


        const projectPolicies = policiesWithActions.filter(p => p.resource === "PROJECT")
        const teamPolicies = policiesWithActions.filter(p => p.resource === "TEAM")
        const orgPolicies = policiesWithActions.filter(p => p.resource === "ORGANIZATION")


        const projectMap = new Map()
        projectPolicies.forEach(p => {
            projectMap.set(p.resourceId, p)  //  [projectId, {project policies}]
        })

        const teamMap = new Map()
        teamPolicies.forEach(p => {
            teamMap.set(p.resourceId, p)   //  [teamId, {team policies}]
        })


        const projectIds = [...projectMap.keys()]

        const projects = await prisma.projects.findMany({
            where: {
                id: { in: projectIds }
            },
            select: {
                id: true,
                name: true
            }
        })



        const teams = await prisma.team.findMany({
            where: {
                projectId: { in: projectIds }
            },
            select: {
                id: true,
                name: true,
                projectId: true
            }
        })



        const teamIdsWithFullAccess = teams
            .filter(team => {
                const policy = projectMap.get(team.projectId)
                const teamPolicy = teamMap.get(team.id)
                return policy?.permissions.includes("PROJECT_ADMIN_ACTIONS")
                    || teamPolicy?.permissions.includes("TEAM_ADMIN_ACTIONS")
            })
            .map(t => t.id)

        const teamMembers = await prisma.teamMember.findMany({
            where: {
                teamId: { in: teamIdsWithFullAccess }
            }
        })



        const teamMembersMap = new Map()

        teamMembers.forEach(member => {
            if (!teamMembersMap.has(member.teamId)) {
                teamMembersMap.set(member.teamId, [])
            }
            teamMembersMap.get(member.teamId).push(member)
        })


        const result = projects.map(project => {
            const projectPolicy = projectMap.get(project.id)

            const isProjectAdmin =
                projectPolicy?.permissions.includes("PROJECT_ADMIN_ACTIONS")
            let projectTeams

            if (isProjectAdmin) {
                // full access → all teams + members (if team admin)
                projectTeams = teams
                    .filter(t => t.projectId === project.id)
                    .map(team => {
                        return {
                            ...team,
                            fullTeamAccess: true,
                            members: teamMembersMap.get(team.id) || []
                        }
                    })
            } else {
                // only teams where user has membership
                projectTeams = teams
                    .filter(t => teamMap.has(t.id))
                    .filter(t => t.projectId === project.id)
                    .map(team => {
                        const teamPolicy = teamMap.get(team.id)

                        const isTeamAdmin =
                            teamPolicy?.permissions.includes("TEAM_ADMIN_ACTIONS")

                        return {
                            ...team,
                            fullTeamAccess: isTeamAdmin,
                            members: isTeamAdmin
                                ? teamMembersMap.get(team.id) || []
                                : undefined
                        }
                    })
            }

            return {
                ...project,
                fullProjectAccess: isProjectAdmin,
                teams: projectTeams
            }
        })

        res.status(201).json({
            message: "Teams data fetched successfully",
            data: {
                result
            }
        })
    }
)

export const createTeam = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { name, organizationId, projectId, createdById } = req.body
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
                    projectId: projectId ? Number(projectId) : null,
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
        const { isAdmin, projectTitle, adminIds } = await getProjectContext(Number(team.projectId), Number(userId));

        await createActivity({
            actorId: userId,
            action: "CREATE_TEAM",
            module: "team",
            entityId: team.id,
            entityType: "TEAM",
            isAdmin,
            projectId: Number(team?.projectId),
            projectTitle,
            visibilityUserIds: adminIds, // 👈 only project admins
            metadata: {
                title: team.name
            }
        });

        res.status(201).json({
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
                project: true
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
                message: "Team and members fetched successfully",
                data: {
                    team,
                    fullTeamAccess: true,
                    teamMembers
                }
            })
        } else {

            res.status(201).json({
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
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorised" });
        }

        const { organizationId, projectId, teamId } = req.params;

        const members = await prisma.projectMembers.findMany({
            where: {
                projectId: Number(projectId),
                organizationId: Number(organizationId),

                // ❌ exclude users already in this team
                user: {
                    teamMemberships: {
                        none: {
                            teamId: Number(teamId),
                        }
                    },
                },
            },
            include: {
                user: true, // ✅ get user details
            },
        });

        return res.status(200).json({
            message: "Available team members fetched successfully",
            data: {
                members,
            },
        });
    }
);

export const addTeamMember = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { teamId, userId, role } = req.body
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
            where: { teamId: Number(teamId), userId: Number(userId) },
            include: {
                team: true
            }
        })
        if (existingTeam.length) {
            return res.status(201).json({
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
                    userId: Number(userId),
                    role: role || "TEAM_MEMBER",
                    addedById
                }
            })
            await prisma.policy.create({
                data: {
                    resourceId: Number(teamId),
                    resource: "TEAM",
                    targetId: Number(userId),
                    target: "USER",
                    effect: "ALLOW",
                    permissions: ["TEAM_MEMBER_ACTIONS"]
                }
            })
            return res.status(201).json({
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