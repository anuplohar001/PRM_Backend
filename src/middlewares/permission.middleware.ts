import { Request, Response, NextFunction } from "express"
import { prisma } from "../utils/prisma"
import { permissionMap } from "../constants/Permissions"
import asyncHandler from "../utils/async-handler"
import { AuthRequest } from "./auth.middleware"

export const checkOrgPermissions = (requiredAction: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId;
            const organizationId = req.params.organizationId ?? req.body.organizationId;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized", hasAccess: false });
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
                return res.status(403).json({ message: "Forbidden", hasAccess: false });
            }  
            req.permissions = policy.permissions
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
            const projectId = req.params.projectId ?? req.body.projectId;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized", hasAccess: false });
            }
            if (!projectId) {
                return res.status(401).json({ message: "Project Id not defined" });
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
                return res.status(403).json({ message: "Forbidden", hasAccess: false });
            }
            req.permissions = policy.permissions
            next();
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    };
};


export const checkTeamPermissions = (requiredAction: string) => {
    return asyncHandler(
        async (req: AuthRequest, res: Response, next: NextFunction) => {
            const userId = req.user?.userId;
            const teamId = req.params.teamId ?? req.body?.teamId;

            if (!userId) {
                return res.status(401).json({ message: "Unauthorized", hasAccess: false });
            }

            if (!teamId) {
                return res.status(400).json({ message: "Team Id not defined" });
            }

            const policy = await prisma.policy.findFirst({
                where: {
                    targetId: userId,
                    resourceId: Number(teamId),
                    resource: "TEAM",
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
                return res.status(403).json({ message: "Forbidden", hasAccess:false });
            }
            req.permissions = policy.permissions
            next();
        }
    );
};
