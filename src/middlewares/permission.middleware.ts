import { Request, Response, NextFunction } from "express"
import { GlobalRoleHierarchy, Role } from "../constants/RoleHierarchy"
import { prisma } from "../utils/prisma"

interface AuthRequest extends Request {
    user?: {
        userId: number
        role: Role
    }
}

export const requireOrgRole = (requiredRole: Role) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {

        const userId = req.user?.userId
        const { organizationId } = req.body

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const membership = await prisma.organizationMembers.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId
                }
            }
        })

        if (!membership) {
            return res.status(403).json({ message: "User not part of organization" })
        }

        const currentRoleLevel = GlobalRoleHierarchy[membership.role as Role]
        const requiredRoleLevel = GlobalRoleHierarchy[requiredRole]

        if (currentRoleLevel < requiredRoleLevel) {
            return res.status(403).json({ message: "Forbidden" })
        }

        next()
    }
}

export const requireProjRole = (requiredRole: Role) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {

        const userId = req.user?.userId
        const { projectId } = req.body

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const membership = await prisma.projectMembers.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId
                }
            }
        })

        if (!membership) {
            return res.status(403).json({ message: "User not part of project" })
        }

        const currentRoleLevel = GlobalRoleHierarchy[membership.role as Role]
        const requiredRoleLevel = GlobalRoleHierarchy[requiredRole]

        if (currentRoleLevel < requiredRoleLevel) {
            return res.status(403).json({ message: "Forbidden" })
        }

        next()
    }
}