import { Response } from "express"
import { AuthRequest } from "../middlewares/auth.middleware"
import asyncHandler from "../utils/async-handler"
import { prisma } from "../utils/prisma"

export const getActivities = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const {
            projectId,
            page = "1",
            limit = "20",
        } = req.query

        const pageNumber = parseInt(page as string)
        const pageSize = parseInt(limit as string)

        const whereCondition: any = {
            OR: [
                { actorId: userId }, // own activity

                // PROJECT visibility
                ...(projectId
                    ? [
                        {
                            visibilityType: "PROJECT",
                            projectId: Number(projectId),
                        },
                    ]
                    : []),

                // CUSTOM visibility
                {
                    visibilityType: "CUSTOM",
                    visibilityUsers: {
                        some: {
                            userId,
                        },
                    },
                },
            ],
        }

        // Optional: filter by project
        if (projectId) {
            whereCondition.projectId = Number(projectId)
        }

        const activities = await prisma.activity.findMany({
            where: whereCondition,
            include: {
                actor: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip: (pageNumber - 1) * pageSize,
            take: pageSize,
        })

        const total = await prisma.activity.count({
            where: whereCondition,
        })

        res.status(200).json({
            message: "Activities fetched successfully",
            data: {
                activities,
                pagination: {
                    total,
                    page: pageNumber,
                    limit: pageSize,
                    totalPages: Math.ceil(total / pageSize),
                },
            },
        })
    }
)