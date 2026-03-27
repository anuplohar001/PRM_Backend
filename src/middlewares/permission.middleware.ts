import { Request, Response, NextFunction } from "express"
import { GlobalRoleHierarchy, Role } from "../constants/RoleHierarchy"
import { prisma } from "../utils/prisma"
import { permissionMap } from "../constants/Permissions"

interface AuthRequest extends Request {
    user?: {
        userId: number
        role: Role
    }
}

export const checkOrgPermissions = (requiredAction: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId;
            const { organizationId } = req.body || req.params;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const policy = await prisma.policy.findFirst({
                where: {
                    targetId: userId,
                    resourceId: Number(organizationId),
                    resource: "ORGANIZATION",
                },
            });

            if (!policy || !policy.permissions) {
                return res.status(403).json({ message: "No permissions found" });
            }

            const userRoles: string[] = policy.permissions; 

            const allowedActions = userRoles.flatMap(
                (role) => permissionMap[role] || []
            );
            const hasAccess = allowedActions.includes(requiredAction);

            if (!hasAccess) {
                return res.status(403).json({ message: "Forbidden" });
            }  
            next();
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    };
};

export const checkProjectPermissions = (requiredAction: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId;
            const { projectId } = req.body || req.params;

            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const policy = await prisma.policy.findFirst({
                where: {
                    targetId: userId,
                    resourceId: Number(projectId),
                    resource: "PROJECT",
                },
            });

            if (!policy || !policy.permissions) {
                return res.status(403).json({ message: "No permissions found" });
            }

            const userRoles: string[] = policy.permissions; 

            const allowedActions = userRoles.flatMap(
                (role) => permissionMap[role] || []
            );

            const hasAccess = allowedActions.includes(requiredAction);

            if (!hasAccess) {
                return res.status(403).json({ message: "Forbidden" });
            }

            next();
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    };
};

export const requireProjRole = (requiredRole: Role) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        // console.log("mm ", req.params)

        const userId = req.user?.userId
        let body
        if (req.method === 'DELETE') {
            body = req.params
        } else {
            body = req.body
        }
        const projectId = parseInt(body?.projectId)
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
            return res.status(403).json({ message: "Forbidden", access: false })
        }
        next()
    }
}