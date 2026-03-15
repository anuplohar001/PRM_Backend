import { Request, Response } from "express"
import { prisma } from "../utils/prisma"
import jwt from "jsonwebtoken"
export const getRecords = async (req: Request, res: Response) => {
    try {
        const { modelName, filters, select, include, page = 1, limit = 10 } = req.body
        // console.log(filters)
        if (!modelName) {
            return res.status(400).json({ message: "modelName is required" })
        }

        const model = (prisma as any)[modelName]

        if (!model) {
            return res.status(400).json({ message: "Invalid model name" })
        }

        const skip = (page - 1) * limit

        const records = await model.findMany({
            where: filters || {},
            select: select || undefined,
            include: include || undefined,
            skip,
            take: limit
        })

        const total = await model.count({
            where: filters || {}
        })

        res.status(200).json({
            data: records,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch records", error })
    }
}

export const getSystemOverview = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" })
        }
        const token = authHeader.split(" ")[1]

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            userId: number
            email: string
            role: string
        }
        const [
            users,
            organizations,
            projects,
            organizationMembers,
            projectMembers
        ] = await Promise.all([
            prisma.users.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true
                }
            }),

            prisma.organizations.findMany({
                select: {
                    id: true,
                    name: true,
                    description: true,
                    members:true,
                    projects:true
                }
            }),

            prisma.projects.findMany({
                include: {
                    organization: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            }),

            prisma.organizationMembers.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    organization: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            }),

            prisma.projectMembers.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    project: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            })
        ])
        if (decoded.role !== "SUPER_ADMIN") {
            return res.status(401).json({ message: "You have no access to Super Admin Dashboard" })
        }
        return res.status(200).json({
            users,
            organizations,
            projects,
            organizationMembers,
            projectMembers
        })
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch system data",
            error
        })
    }
}