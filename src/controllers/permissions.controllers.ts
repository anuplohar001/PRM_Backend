import { Response } from "express"
import { prisma } from "../utils/prisma"
import { AuthRequest } from "../middlewares/auth.middleware"
import { permissionMap, Resources } from "../constants/Permissions"
import asyncHandler from "../utils/async-handler"
import { Action } from "../generated/prisma/enums"


const getActionsFromGroups = (
    groups: Action[]
): string[] => {
    return groups.flatMap(group => permissionMap[group] || [])
}

export const getOrgPermissions = (resource: Resources) => {
    return asyncHandler(
        async (req: AuthRequest, res: Response) => {
            const { organizationId } = req.params
            const userId = req.user?.userId

            if (!userId) {
                return res.status(401).json({ message: "Unauthorised" })
            }

            const permissions = await prisma.policy.findFirst({
                where: {
                    resource,
                    resourceId: Number(organizationId),
                    targetId: userId
                }
            })

            let actions = null
            if (permissions) {

                actions = getActionsFromGroups(
                    permissions?.permissions
                );
            }
            return res.status(201).json({
                message: "Permissions fetched successfully",
                data: {
                    permissions,
                    actions
                }
            })
        }
    )
}

export const getProjectPermissions = (resource: Resources) => {
    return asyncHandler(
        async (req: AuthRequest, res: Response) => {
            const { projectId } = req.params
            const userId = req.user?.userId

            if (!userId) {
                return res.status(401).json({ message: "Unauthorised" })
            }

            const permissions = await prisma.policy.findFirst({
                where: {
                    resource,
                    resourceId: Number(projectId),
                    targetId: userId
                }
            })

            let actions = null
            if (permissions) {

                actions = getActionsFromGroups(
                    permissions?.permissions
                );
            }
            return res.status(201).json({
                message: "Permissions fetched successfully",
                data: {
                    permissions,
                    actions
                }
            })
        }
    )
}


export const getTeamPermissions = (resource: Resources) => {
    return asyncHandler(
        async (req: AuthRequest, res: Response) => {
            const { teamId } = req.params
            const userId = req.user?.userId

            if (!userId) {
                return res.status(401).json({ message: "Unauthorised" })
            }

            const permissions = await prisma.policy.findFirst({
                where: {
                    resource,
                    resourceId: Number(teamId),
                    targetId: userId
                }
            })
            let actions = null
            if (permissions) {
                
                actions = getActionsFromGroups(
                    permissions?.permissions
                );
            }
            return res.status(201).json({
                message: "Permissions fetched successfully",
                data: {
                    permissions,
                    actions
                }
            })
        }
    )
}
