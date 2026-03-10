import { Request, Response } from "express"
import { prisma } from "../utils/prisma"

export const getRecords = async (req: Request, res: Response) => {
    try {
        const { modelName, filters, select, include, page = 1, limit = 10 } = req.body

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